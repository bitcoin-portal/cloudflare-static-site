import { mapRequestToAsset } from "@cloudflare/kv-asset-handler";

export function stripQueryString(request: Request) {
  const parsedUrl = new URL(request.url);
  parsedUrl.search = "";
  return new Request(parsedUrl.toString(), request);
}

export function check404(url: URL): boolean {
  if (url.pathname.includes("404" || "temporarily-offline")) {
    return true;
  }
  return false;
}
