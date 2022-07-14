// import { handleEvent } from "./handler";
import { handleRequest } from "./newHandler";

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(handleRequest(event));
});
