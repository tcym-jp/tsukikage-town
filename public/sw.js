const CACHE_NAMESPACE = 'tsukikage-town'
const CACHE_VERSION = '2026-07-15-r2'
const CACHE_GENERATION = `${CACHE_NAMESPACE}-${CACHE_VERSION}`
const STATIC_CACHE = `${CACHE_GENERATION}-static`
const RUNTIME_CACHE = `${CACHE_GENERATION}-runtime`
const MAX_CACHE_GENERATIONS = 2

const PRECACHE_URLS = [
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/og.png',
]

/** Find Vite's content-hashed JS/CSS files without coupling the SW to a build hash. */
function discoverBuildAssets(html) {
  const assetUrls = new Set()
  const attributePattern = /\b(?:src|href)=["']([^"'#]+)["']/giu
  for (const match of html.matchAll(attributePattern)) {
    const value = match[1]
    if (!value) continue
    const url = new URL(value, self.location.origin)
    if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
      assetUrls.add(`${url.pathname}${url.search}`)
    }
  }
  return [...assetUrls]
}

async function cacheBuildAssets(cache, assetUrls, forceReload = false) {
  await Promise.all(
    assetUrls.map(async (assetUrl) => {
      const request = new Request(assetUrl, {
        cache: forceReload ? 'reload' : 'default',
        credentials: 'same-origin',
      })
      if (!forceReload) {
        const existing = await caches.match(request, { ignoreVary: true })
        if (existing) {
          await cache.put(request, existing.clone())
          return
        }
      }
      const response = await fetch(request)
      if (!response.ok) throw new Error(`Build asset could not be cached: ${assetUrl}`)
      await cache.put(request, response)
    }),
  )
}

async function refreshAppShell(response, cache, forceReload = false) {
  if (!response.ok) return false
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) return false

  const html = await response.clone().text()
  const assetUrls = discoverBuildAssets(html)
  // A standalone page such as privacy.html must never replace the SPA shell.
  if (assetUrls.length === 0) return false

  await Promise.all([
    cache.put('/', response.clone()),
    cache.put('/index.html', response.clone()),
    cacheBuildAssets(cache, assetUrls, forceReload),
  ])
  return true
}

async function precacheCurrentBuild() {
  const cache = await caches.open(STATIC_CACHE)
  await cache.addAll(PRECACHE_URLS)
  const indexResponse = await fetch(
    new Request('/index.html', { cache: 'reload', credentials: 'same-origin' }),
  )
  const cached = await refreshAppShell(indexResponse, cache, true)
  if (!cached) throw new Error('The built index did not reference any hashed assets.')
}

function cacheGenerationFor(cacheName) {
  if (!cacheName.startsWith(`${CACHE_NAMESPACE}-`)) return null
  return cacheName.replace(/-(?:static|runtime)$/u, '')
}

async function deleteObsoleteCaches() {
  const keys = await caches.keys()
  const generations = [...new Set(keys.map(cacheGenerationFor).filter(Boolean))]
  const previousGenerations = generations
    .filter((generation) => generation !== CACHE_GENERATION)
    .sort()
    .reverse()
  // Keep one previous generation so an already-open page can still lazy-load
  // its old content-hashed chunks after the new worker takes control.
  const generationsToKeep = new Set([
    CACHE_GENERATION,
    ...previousGenerations.slice(0, MAX_CACHE_GENERATIONS - 1),
  ])
  await Promise.all(
    keys
      .filter((key) => {
        const generation = cacheGenerationFor(key)
        return generation !== null && !generationsToKeep.has(generation)
      })
      .map((key) => caches.delete(key)),
  )
}

async function navigationResponse(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(STATIC_CACHE)
    try {
      await refreshAppShell(response.clone(), cache)
    } catch {
      // The online response is still useful. Individual assets are cached by
      // their own requests if refreshing the complete shell fails.
    }
    return response
  } catch {
    return (
      (await caches.match('/index.html', { ignoreSearch: true })) ??
      (await caches.match('/', { ignoreSearch: true })) ??
      (await caches.match('/offline.html', { ignoreSearch: true })) ??
      Response.error()
    )
  }
}

async function cacheFirstBuildAsset(request) {
  const cached = await caches.match(request, { ignoreVary: true })
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE)
    await cache.put(request, response.clone())
  }
  return response
}

async function networkFirstStatic(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    return (await caches.match(request, { ignoreVary: true })) ?? Response.error()
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheCurrentBuild().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(deleteObsoleteCaches().then(() => self.clients.claim()))
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirstBuildAsset(request))
    return
  }

  if (
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/offline.html' ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(networkFirstStatic(request))
  }
})
