import { mapRequestToAsset } from "@cloudflare/kv-asset-handler";

export function stripQueryString(request: Request) {
  const parsedUrl = new URL(request.url);
  parsedUrl.search = "";
  return new Request(parsedUrl.toString(), request);
}

export function check404(url: URL): boolean {
  console.log("404 running?");
  if (url.pathname.includes("404")) {
    console.log("404 working?", true);
    return true;
  } else if (url.pathname.includes("temporarily-offline")) {
    console.log("404 working?", true);
    return true;
  }
  console.log("404 working?", false);
  return false;
}
