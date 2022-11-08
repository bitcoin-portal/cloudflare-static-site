import {
  getAssetFromKV,
  mapRequestToAsset,
} from "@cloudflare/kv-asset-handler";
import { DEFAULT_SECURITY_HEADERS, BLOCKED_HEADERS } from "./constants";

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
  if (
    tlsVersion !== undefined &&
    tlsVersion !== "TLSv1.2" &&
    tlsVersion !== "TLSv1.3"
  ) {
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
export async function handleEvent(event) {
  await parseRedirects(event);
  const req = event.request;
  const redirect = checkRedirect(req);
  const url = new URL(event.request.url);
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
    response = await getAssetFromKV(event, options);
  } catch (e) {
    if (e.status == 404) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: () =>
            new Request(`${new URL(url).origin}/404.html`, req, {
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
  return await addHeaders(req, response);
}
