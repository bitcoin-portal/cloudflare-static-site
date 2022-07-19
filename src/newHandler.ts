import { getAssetFromKV, Options } from "@cloudflare/kv-asset-handler";
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
  const is404 = check404(event);

  // console.log("these are the headers", headers);

  // check for redirects and serve redirect response
  if (redirects !== null) {
    const redirect = redirectedResponse(req, redirects);
    if (redirect !== null) {
      const response = new Response(redirect.body);
      return response;
    }
  }

  // check user has TLS version 1.2 or higher and serve error response
  if (tlsVersion !== null) {
    return tlsVersion;
  }

  // check for 404 or temporarily offline and serve response
  if (is404 !== null) {
    return is404;
  }

  const options: Partial<Options> = url.pathname.match(/json$/)
    ? {
        mapRequestToAsset: serveSinglePageApp,
        cacheControl: {
          browserTTL: 1,
        },
        // ASSET_NAMESPACE: MY_FIRST_KV.get(),
      }
    : {
        mapRequestToAsset: serveSinglePageApp,
        // ASSET_NAMESPACE: name,
      };

  try {
    const response = await getAssetFromKV(event, options);
    if (headers !== null) {
      headers.forEach((name, value) => {
        response.headers.set(name, value);
      });
    }
    return response;
  } catch (e) {
    // console.log("Error1:", e);
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
      // console.log("Error2:", e);
      return new Response("Not Found", { status: 404 });
    }
  }

  // const response = new Response(req.url, { headers: headers });
  // return response;
}
