import {
  getAssetFromKV,
  mapRequestToAsset,
} from "@cloudflare/kv-asset-handler";
import { Request } from "@cloudflare/workers-types";
import { addHeaders } from "./addHeaders";
import { stripQueryString } from "./helpers";

let redirectMap: Map<string, string> | null = null;

async function parseRedirects(event: FetchEvent) {
  if (redirectMap !== null) return;
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
      mapRequestToAsset: () =>
        new Request(
          `${new URL(event.request.url).origin}/redirects`,
          event.request
        ),
    });
    const redirects = (await redirectsResponse.text()).split("\n");
    for (const redirect of redirects) {
      const [k, v] = redirect.split("=");
      redirectMap.set(k, v);
    }
  } catch {}
}

function checkRedirect(request: Request) {
  const url = new URL(request.url).pathname;
  if (redirectMap === null) return;
  for (const [pattern, redirectUrl] of redirectMap) {
    if (pattern != "" && pattern.length > 0 && url.match(pattern)) {
      const response = new Response(null, { status: 302 });
      response.headers.set("Location", redirectUrl);
      return response;
    }
  }
  return null;
}

function serveSinglePageApp(request: Request) {
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

export async function handleEvent(event: FetchEvent) {
  await parseRedirects(event);
  const req = event.request;
  const redirect = checkRedirect(req);
  const url = new URL(event.request.url);
  // const options = check404(url, req);

  let options = { mapRequestToAsset: serveSinglePageApp };

  if (redirect != null) {
    return redirect;
  }

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
            new Request(`${new URL(url).origin}/404.html`, req),
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
  return await addHeaders(req, response);
}
