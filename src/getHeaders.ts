import {
  DEFAULT_SECURITY_HEADERS,
  BLOCKED_HEADERS,
  CORS_HEADERS,
} from "./constants";

export function getHeaders(req: Request): Headers {
  // let response = await fetch(req);
  let newHeaders = new Headers();

  // This sets the headers for HTML responses:
  if (
    newHeaders.has("Content-Type") &&
    !newHeaders.get("Content-Type")?.includes("text/html")
  ) {
    return newHeaders;
  }

  Object.keys(DEFAULT_SECURITY_HEADERS).map(function (name: string) {
    newHeaders.set(name, DEFAULT_SECURITY_HEADERS[name]);
  });

  Object.keys(CORS_HEADERS).map(function (name) {
    newHeaders.set(name, "*");
    // newHeaders.set(name, CORS);
  });

  BLOCKED_HEADERS.forEach(function (name) {
    newHeaders.delete(name);
  });

  return newHeaders;
}
