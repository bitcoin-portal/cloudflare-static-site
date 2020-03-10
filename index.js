import { getAssetFromKV, serveSinglePageApp } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event))
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  let options = { mapRequestToAsset: serveSinglePageApp }

  try {
    return await getAssetFromKV(event, options)
  } catch (e) {
    if (e.status == 404) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        })

        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 })
      } catch (e) {
        return new Response("Not Found", { status: 404 })
      }
    }
    return new Response("Internal Error", { status: 500 })
  }
}
