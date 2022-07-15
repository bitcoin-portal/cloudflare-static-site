import { mapRequestToAsset } from "@cloudflare/kv-asset-handler";
import { stripQueryString } from "./helpers";

export function serveSinglePageApp(request: Request) {
  const strippedRequest = stripQueryString(request);
  const mappedRequest = mapRequestToAsset(strippedRequest);

  const REACT_ROUTING = "true";
  var reactRouting = false;
  try {
    if (REACT_ROUTING == "true") {
      reactRouting = true;
    }
  } catch (e) {
    console.log("Error:", e);
  }

  if (mappedRequest.url.endsWith(".html") && reactRouting) {
    const request = new Request(
      `${new URL(mappedRequest.url).origin}/index.html`,
      mappedRequest
    );
    return request;
  } else {
    return request;
  }
}
