import { redirectedResponse, parseRedirects } from "./redirects";
import { getHeaders } from "./getHeaders";
import { check404, checkTlsVersion } from "./helpers";

export async function handleRequest(event: FetchEvent): Promise<Response> {
  const req = event.request;
  const redirects = await parseRedirects(event);
  const headers = getHeaders(req);
  const tlsVersion = checkTlsVersion(req);
  const is404 = check404(event);

  // check for redirects and serve redirect response
  if (redirects !== null) {
    const redirect = redirectedResponse(req, redirects);
    // console.log("what is redirect", redirect);
    if (redirect !== null) {
      const response = new Response(redirect.body);
      return response;
    }
  }

  // check user has TLS version 1.2 or higher and serve error response
  if (tlsVersion !== null) {
    return tlsVersion;
  }

  // check for 404 or temporarily offline
  //   if (is404 !== null) {
  //     return is404;
  //   }

  const response = new Response(req.url, { headers: headers });
  return response;
}
