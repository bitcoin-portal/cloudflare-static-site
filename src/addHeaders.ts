import {
  DEFAULT_SECURITY_HEADERS,
  BLOCKED_HEADERS,
  CORS_HEADERS,
} from "./constants";

export async function addHeaders(req: Request, response: Response) {
  // let response = await fetch(req);
  let newHeaders = new Headers(response.headers);

  const tlsVersion = req.cf?.tlsVersion;

  // This sets the headers for HTML responses:
  if (
    newHeaders.has("Content-Type") &&
    !newHeaders.get("Content-Type")?.includes("text/html")
  ) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
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

  if (
    tlsVersion !== undefined &&
    tlsVersion !== "TLSv1.2" &&
    tlsVersion !== "TLSv1.3"
  ) {
    return new Response("You need to use TLS version 1.2 or higher.", {
      status: 400,
    });
  } else {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
}
