import { handleEvent } from "./handler";
import { FetchEvent } from "@cloudflare/workers-types";

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(handleEvent(event));
});
