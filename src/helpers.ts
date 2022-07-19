import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

export function stripQueryString(request: Request) {
  const parsedUrl = new URL(request.url);
  parsedUrl.search = "";
  return new Request(parsedUrl.toString(), request);
}

export async function check404(event: FetchEvent): Promise<Response | null> {
  const url = new URL(event.request.url);
  // console.log("404 running?");
  if (
    url.pathname.includes("404") ||
    url.pathname.includes("temporarily-offline")
  ) {
    try {
      const notFoundResponse = await getAssetFromKV(event, {
        mapRequestToAsset: () => new Request(url.origin, event.request),
      });
      const response = new Response(notFoundResponse.body, {
        ...notFoundResponse,
        status: 404,
      });
      // console.log("this is the 404 response:", response);
      return response;
    } catch (e) {
      console.log("Error:", e);
    }
    return null;
  }
}

export function checkTlsVersion(request: Request): Response | null {
  const tlsVersion = request.cf?.tlsVersion;
  if (
    tlsVersion !== undefined &&
    tlsVersion !== "TLSv1.2" &&
    tlsVersion !== "TLSv1.3"
  ) {
    return new Response("You need to use TLS version 1.2 or higher.", {
      status: 400,
    });
  }
  return null;
}
