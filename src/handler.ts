// import {
//   getAssetFromKV,
//   mapRequestToAsset,
//   Options,
// } from "@cloudflare/kv-asset-handler";
// // import { addHeaders } from "./addHeaders";
// import { check404, stripQueryString } from "./helpers";
// import { redirectedResponse, parseRedirects } from "./redirects";

// function serveSinglePageApp(request: Request) {
//   request = stripQueryString(request);
//   request = mapRequestToAsset(request);

//   var reactRouting = false;
//   // try {
//   //   if (REACT_ROUTING == "true") {
//   //     reactRouting = true;
//   //   }
//   // } catch {}

//   if (request.url.endsWith(".html") && reactRouting) {
//     return new Request(`${new URL(request.url).origin}/index.html`, request);
//   } else {
//     return request;
//   }
// }

// export async function handleEvent(event: FetchEvent): Promise<Response> {
//   console.log("this is the event", event);
//   await parseRedirects(event);
//   const req = event.request;
//   // const redirect = checkRedirect(req);
//   const url = new URL(event.request.url);
//   // const is404 = check404(url);
//   const options: Partial<Options> = url.pathname.match(/json$/)
//     ? {
//         mapRequestToAsset: serveSinglePageApp,
//         cacheControl: {
//           browserTTL: 1,
//         },
//         ASSET_NAMESPACE: "www-prod-static",
//       }
//     : {
//         mapRequestToAsset: serveSinglePageApp,
//         ASSET_NAMESPACE: "www-prod-static",
//       };

//   // if (redirect != null) return redirect;

//   try {
//     if (is404) {
//       let notFoundResponse = await getAssetFromKV(event, {
//         mapRequestToAsset: () => new Request(url.origin, req),
//       });
//       const response = new Response(notFoundResponse.body, {
//         ...notFoundResponse,
//         status: 404,
//       });
//       console.log("this is the 404 response:", response);
//       return response;
//     } else {
//       const response = await getAssetFromKV(event, options);
//       console.log("this is the try response:", response);
//       return response;
//     }
//   } catch (e) {
//     if (e.status == 404) {
//       try {
//         const notFoundResponse = await getAssetFromKV(event, {
//           mapRequestToAsset: () => new Request(`${url.origin}/404.html`, req),
//         });
//         const response = new Response(notFoundResponse.body, {
//           ...notFoundResponse,
//           status: 404,
//         });
//         return response;
//       } catch (e) {
//         console.log("this is the error1:", e);
//         const response = new Response("Not Found", { status: 404 });
//         return response;
//       }
//     } else {
//       console.log("this is the error2:", e);
//       const response = new Response("Internal Error", { status: 500 });
//       return response;
//     }
//   }
// }
