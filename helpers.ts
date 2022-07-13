import { Request } from "@cloudflare/workers-types";

export function stripQueryString(request: Request) {
  const parsedUrl = new URL(request.url);
  parsedUrl.search = "";
  return new Request(parsedUrl.toString(), request);
}
