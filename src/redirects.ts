import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

let redirectMap: Map<string, string> | null = null;

export async function parseRedirects(event: FetchEvent) {
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

export function checkRedirect(request: Request) {
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
