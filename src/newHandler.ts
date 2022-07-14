import { redirectedResponse, parseRedirects } from "./redirects";

export async function handleRequest(event: FetchEvent): Promise<Response> {
  const req = event.request;
  const redirects = await parseRedirects(event);
  console.log(redirects);

  if (redirects !== null) {
    const redirect = redirectedResponse(req, redirects);
    console.log("what is redirect", redirect);
    if (redirect !== null) {
      return redirect;
    }
  }

  const response = new Response("Response", req);
  return response;
}
