import { handleEvent } from "./handler";

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(handleEvent(event));
});
