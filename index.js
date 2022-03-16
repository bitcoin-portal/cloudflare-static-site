import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

const NAME = "test@bitcoin.com"
const PASS = "nakamoto21"

const CREDENTIALS_REGEXP = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/
const USER_PASS_REGEXP = /^([^:]*):(.*)$/

const Credentials = function(name, pass) {
  this.name = name
  this.pass = pass
}

const parseAuthHeader = function(string) {
  if (typeof string !== 'string') {
    return undefined
  }

  // parse header
  const match = CREDENTIALS_REGEXP.exec(string)

  if (!match) {
    return undefined
  }

  // decode user pass
  const userPass = USER_PASS_REGEXP.exec(atob(match[1]))

  if (!userPass) {
    return undefined
  }

  // return credentials object
  return new Credentials(userPass[1], userPass[2])
}

const unauthorizedResponse = function(body) {
  return new Response(
    body, {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="User Visible Realm"'
      }
    }
  )
}


addEventListener('fetch', event => {
  event.respondWith(handleEvent(event))
})

var redirectMap = null
async function parseRedirects(event) {
  if (redirectMap != null) {
    return
  }
  redirectMap = new Map()
  try {
    const redirects = REDIRECT.split(";")
    for (const redirect of redirects) {
      const [k, v] = redirect.split("=")
      redirectMap.set(k, v)
    }
  } catch {}

  try {
    let redirectsResponse = await getAssetFromKV(event, {
      mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/redirects`, req)
    })
    const redirects = (await redirectsResponse.text()).split("\n")
    for (const redirect of redirects) {
      const [k, v] = redirect.split("=")
      redirectMap.set(k, v)
    }
  } catch {}
}

function checkRedirect(request) {
  const url = new URL(request.url).pathname
  for (const [pattern, redirectUrl] of redirectMap) {
    if (url.match(pattern)) {
      const response = new Response(null, { status: 302 })
      response.headers.set('Location', redirectUrl)
      return response
    }
  }
  return null
}

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
  await parseRedirects(event)
  const redirect = checkRedirect(event.request)
  const url = new URL(event.request.url);

  if (redirect != null) {
    return redirect
  }

  let options = { mapRequestToAsset: serveSinglePageApp }

  if (url.pathname.match(/json$/)) {
    options.cacheControl = {
      browserTTL: 1,
    };
  }

  var response
  try {
    if (url.hostname === 'verse.bitcoin.com') {
      const credentials = parseAuthHeader(request.headers.get("Authorization"))
      if ( !credentials || credentials.name !== NAME ||  credentials.pass !== PASS) {
        response = unauthorizedResponse("Unauthorized")
      } else {
        response = fetch(request)
      }
    } else {
      response = await getAssetFromKV(event, options)
    }
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
