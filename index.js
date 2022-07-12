import {
  getAssetFromKV,
  mapRequestToAsset,
} from "@cloudflare/kv-asset-handler";

addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

var redirectMap = null;
async function parseRedirects(event) {
  if (redirectMap != null) {
    return;
  }
  redirectMap = new Map();
  try {
    const redirects = REDIRECT.split(";");
    for (const redirect of redirects) {
      const [k, v] = redirect.split("=");
      redirectMap.set(k, v);
    }
  } catch {}

  try {
    let redirectsResponse = await getAssetFromKV(event, {
      mapRequestToAsset: (req) =>
        new Request(`${new URL(req.url).origin}/redirects`, req),
    });
    const redirects = (await redirectsResponse.text()).split("\n");
    for (const redirect of redirects) {
      const [k, v] = redirect.split("=");
      redirectMap.set(k, v);
    }
  } catch {}
}

function checkRedirect(request) {
  const url = new URL(request.url).pathname;
  for (const [pattern, redirectUrl] of redirectMap) {
    if (pattern != "" && pattern.length > 0 && url.match(pattern)) {
      const response = new Response(null, { status: 302 });
      response.headers.set("Location", redirectUrl);
      return response;
    }
  }
  return null;
}

function stripQueryString(request) {
  const parsedUrl = new URL(request.url);
  parsedUrl.search = "";
  return new Request(parsedUrl.toString(), request);
}

function serveSinglePageApp(request) {
  request = stripQueryString(request);
  request = mapRequestToAsset(request);

  var reactRouting = false;
  try {
    if (REACT_ROUTING == "true") {
      reactRouting = true;
    }
  } catch {}

  if (request.url.endsWith(".html") && reactRouting) {
    return new Request(`${new URL(request.url).origin}/index.html`, request);
  } else {
    return request;
  }
}

async function addHeaders(req, response) {
  const DEFAULT_SECURITY_HEADERS = {
    /*
      Secure your application with Content-Security-Policy headers.
      Enabling these headers will permit content from a trusted domain and all its subdomains.
      @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
      "Content-Security-Policy": "default-src 'self' example.com *.example.com",
      */
    /*
      You can also set Strict-Transport-Security headers.
      These are not automatically set because your website might get added to Chrome's HSTS preload list.
      Here's the code if you want to apply it:
      "Strict-Transport-Security" : "max-age=63072000; includeSubDomains; preload",
      */
    /*
      Permissions-Policy header provides the ability to allow or deny the use of browser features, such as opting out of FLoC - which you can use below:
      "Permissions-Policy": "interest-cohort=()",
      */
    /*
      X-XSS-Protection header prevents a page from loading if an XSS attack is detected.
      @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection
      */
    "X-XSS-Protection": "0",
    /*
      X-Frame-Options header prevents click-jacking attacks.
      @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
      */
    "X-Frame-Options": "DENY",
    /*
      X-Content-Type-Options header prevents MIME-sniffing.
      @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
      */
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cross-Origin-Embedder-Policy": 'require-corp; report-to="default";',
    "Cross-Origin-Opener-Policy": 'same-site; report-to="default";',
    "Cross-Origin-Resource-Policy": "same-site",
  };
  const BLOCKED_HEADERS = [
    "Public-Key-Pins",
    "X-Powered-By",
    "X-AspNet-Version",
  ];
  // let response = await fetch(req);
  let newHeaders = new Headers(response.headers);

  const tlsVersion = req.cf.tlsVersion;
  // This sets the headers for HTML responses:
  if (
    newHeaders.has("Content-Type") &&
    !newHeaders.get("Content-Type").includes("text/html")
  ) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  Object.keys(DEFAULT_SECURITY_HEADERS).map(function (name) {
    newHeaders.set(name, DEFAULT_SECURITY_HEADERS[name]);
  });

  BLOCKED_HEADERS.forEach(function (name) {
    newHeaders.delete(name);
  });

  if (tlsVersion !== "TLSv1.2" && tlsVersion !== "TLSv1.3") {
    return new Response("You need to use TLS version 1.2 or higher.", {
      status: 400,
    });
  } else {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
}

async function handleEvent(event) {
  await parseRedirects(event);
  const redirect = checkRedirect(event.request);
  const url = new URL(event.request.url);

  function check404() {
    if (url.includes("404" || "temporarily-offline")) {
      return {
        mapRequestToAsset: (req) => {
          new Request(req.url, req, { status: 404 });
        },
      };
    }
    return options;
  }

  if (redirect != null) {
    return redirect;
  }

  let options = { mapRequestToAsset: serveSinglePageApp };

  if (url.pathname.match(/json$/)) {
    options.cacheControl = {
      browserTTL: 1,
    };
  }

  var response;
  try {
    response = await getAssetFromKV(event, check404);
  } catch (e) {
    if (e.status == 404) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: (req) =>
            new Request(`${new URL(req.url).origin}/404.html`, req, {
              status: 404,
            }),
        });

        response = new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404,
        });
      } catch (e) {
        response = new Response("Not Found", { status: 404 });
      }
    } else {
      response = new Response("Internal Error", { status: 500 });
    }
  }
  try {
    response.headers.set("Access-Control-Allow-Origin", CORS);
  } catch {}
  return await addHeaders(event.request, response);
}
