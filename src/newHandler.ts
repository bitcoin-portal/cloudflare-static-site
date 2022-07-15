import {
  getAssetFromKV,
  mapRequestToAsset,
  Options,
  // serveSinglePageApp,
} from "@cloudflare/kv-asset-handler";
import { redirectedResponse, parseRedirects } from "./redirects";
import { getHeaders } from "./getHeaders";
import { serveSinglePageApp } from "./serveSinglePageApp";
import { check404, checkTlsVersion } from "./helpers";

export async function handleRequest(event: FetchEvent): Promise<Response> {
  const req = event.request;
  const redirects = await parseRedirects(event);
  const headers = getHeaders(req);
  const tlsVersion = checkTlsVersion(req);
  const url = new URL(event.request.url);
  // const is404 = check404(event);

  // check for redirects and serve redirect response
  if (redirects !== null) {
    const redirect = redirectedResponse(req, redirects);
    // console.log("what is redirect", redirect);
    if (redirect !== null) {
      const response = new Response(redirect.body);
      return response;
    }
  }

  // check user has TLS version 1.2 or higher and serve error response
  if (tlsVersion !== null) {
    return tlsVersion;
  }

  const options: Partial<Options> = url.pathname.match(/json$/)
    ? {
        mapRequestToAsset: serveSinglePageApp,
        cacheControl: {
          browserTTL: 1,
        },
        ASSET_NAMESPACE: "www-prod-static",
      }
    : {
        mapRequestToAsset: serveSinglePageApp,
        ASSET_NAMESPACE: "www-prod-static",
      };

  // check for 404 or temporarily offline
  //   if (is404 !== null) {
  //     return is404;
  //   }
  try {
    const response = await getAssetFromKV(event, options);
    return response;
  } catch {
    try {
      let notFoundResponse = await getAssetFromKV(event, {
        mapRequestToAsset: () =>
          new Request(`${new URL(req.url).origin}/404.html`, req),
      });

      return new Response(notFoundResponse.body, {
        ...notFoundResponse,
        status: 404,
      });
    } catch (e) {
      console.log("Error:", e);
    }
  }

  // const response = new Response(req.url, { headers: headers });
  // return response;
}
