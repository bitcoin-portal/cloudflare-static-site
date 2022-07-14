import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

export async function parseRedirects(
  event: FetchEvent
): Promise<Map<string, string>> {
  const redirectMap = new Map();
  const REDIRECT =
    "^/wallet-support/$=https://support.bitcoin.com/en/collections/2050805-wallet/;^/miami-conference/?$=https://www.bitcoin.com/events/";

  try {
    const redirects = REDIRECT.split(";");
    redirects.forEach((i) => {
      const [k, v] = i.split("=");
      redirectMap.set(k, v);
    });
    return redirectMap;
  } catch (e) {
    console.log("Redirect error:", e);
  }

  try {
    const redirectsResponse = await getAssetFromKV(event, {
      mapRequestToAsset: () =>
        new Request(
          `${new URL(event.request.url).origin}/redirects`,
          event.request
        ),
    });
    const redirects = (await redirectsResponse.text()).split("\n");
    redirects.forEach((i) => {
      const [k, v] = i.split("=");
      redirectMap.set(k, v);
    });
    return redirectMap;
  } catch (e) {
    console.log("Redirect error:", e);
  }
}

export function redirectedResponse(
  request: Request,
  redirects: Map<string, string>
): Response | null {
  const url = new URL(request.url).pathname;
  console.log("this is the checkRedirect url", url);
  try {
    redirects.forEach((redirectUrl, pattern) => {
      console.log("are you working?");
      console.log("this is the pattern:", pattern);
      console.log("this is the redirectUrl:", redirectUrl);
      if (url.match(pattern)) {
        const response = new Response(null, {
          status: 302,
          headers: { Location: redirectUrl },
        });
        console.log("this is the checkRedirect response", response);
        console.log("headers", response.headers.get("Location"));
        return response;
      }
    });
  } catch (e) {
    console.log("error:", e);
  }
  return null;
}
