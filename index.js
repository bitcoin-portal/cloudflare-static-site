import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event))
})

function stripQueryString(request) {
  const parsedUrl = new URL(request.url)
  parsedUrl.search = ''
  return new Request(parsedUrl.toString(), request)
}

function serveSinglePageApp(request) {
  request = stripQueryString(request)
  request = mapRequestToAsset(request)

  var reactRouting = false;
  try {
    if (REACT_ROUTING == "true") {
      reactRouting = true;
    }
  } catch {}

  if (request.url.endsWith('.html') && reactRouting) {
    return new Request(`${new URL(request.url).origin}/index.html`, request)
  } else {
    return request
  }
}

async function handleEvent(event) {
  const url = new URL(event.request.url)
  let options = { mapRequestToAsset: serveSinglePageApp }

  var response
  try {
    response = await getAssetFromKV(event, options)
  } catch (e) {
    if (e.status == 404) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        })

        response = new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 })
      } catch (e) {
        response = new Response("Not Found", { status: 404 })
      }
    } else {
      response = new Response("Internal Error", { status: 500 })
    }
  }
  try {
    response.headers.set('Access-Control-Allow-Origin', CORS)
  } catch {}
  return response
}
