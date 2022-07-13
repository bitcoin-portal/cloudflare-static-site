import {
  getAssetFromKV,
  mapRequestToAsset,
  Options,
} from "@cloudflare/kv-asset-handler";
import { addHeaders } from "./addHeaders";
import { check404, stripQueryString } from "./helpers";
import { checkRedirect, parseRedirects } from "./redirects";

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
  const is404 = check404(url);
  const options: Partial<Options> = url.pathname.match(/json$/)
    ? {
        mapRequestToAsset: serveSinglePageApp,
        cacheControl: {
          browserTTL: 1,
        },
      }
    : { mapRequestToAsset: serveSinglePageApp };

  if (redirect != null) return redirect;

  var response: Response | null;
  try {
    response = await getAssetFromKV(event, options);
  } catch (e) {
    if (e.status == 404) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: () => new Request(`${url.origin}/404.html`, req),
        });
        response = new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404,
        });
      } catch (e) {
        response = new Response("Not Found", { status: 404 });
      }
    } else if (is404) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: () => new Request(url.origin, req),
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
