import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

let redirectMap: Map<string, string> | null = null;

export async function parseRedirects(event: FetchEvent) {
  if (redirectMap !== null) return;
  redirectMap = new Map();

  const REDIRECT =
    "^/wallet-support/$=https://support.bitcoin.com/en/collections/2050805-wallet/;^/miami-conference/?$=https://www.bitcoin.com/events/";

  try {
    const redirects = REDIRECT.split(";");
    for (const redirect of redirects) {
      const [k, v] = redirect.split("=");
      redirectMap.set(k, v);
      console.log("redirects from REDIRECT:", redirect);
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
      console.log("redirects:", redirect);
    }
  } catch {}
}

export function checkRedirect(request: Request) {
  const url = new URL(request.url).pathname;
  console.log("this is the checkRedirect url", url);
  if (redirectMap === null) return;
  for (const [pattern, redirectUrl] of redirectMap) {
    if (pattern != "" && pattern.length > 0 && url.match(pattern)) {
      const response = new Response(null, { status: 302 });
      response.headers.set("Location", redirectUrl);
      console.log("this is the checkRedirect response", response);
      return response;
    }
  }
  return null;
}
