import headersSource from '../../public/_headers?raw'
import redirectsSource from '../../public/_redirects?raw'
import manifestSource from '../../public/manifest.webmanifest?raw'
import serviceWorkerSource from '../../public/sw.js?raw'
import { applyServiceWorkerUpdate, UPDATE_READY_EVENT } from '../pwa/register'

interface ManifestIcon {
  readonly src: string
  readonly sizes: string
  readonly purpose?: string
}

interface ManifestScreenshot {
  readonly src: string
  readonly sizes: string
  readonly form_factor: string
}

interface WebManifest {
  readonly id?: string
  readonly name?: string
  readonly lang?: string
  readonly start_url?: string
  readonly scope?: string
  readonly display?: string
  readonly icons?: readonly ManifestIcon[]
  readonly screenshots?: readonly ManifestScreenshot[]
}

const manifest = JSON.parse(manifestSource) as WebManifest

describe('PWA metadata', () => {
  it('declares an in-scope standalone Japanese application', () => {
    expect(manifest.id).toBe('/')
    expect(manifest.name).toContain('月影町')
    expect(manifest.lang).toBe('ja-JP')
    expect(manifest.start_url).toBe('/?source=pwa')
    expect(manifest.scope).toBe('/')
    expect(manifest.display).toBe('standalone')
  })

  it('provides install icons including a maskable 512px icon', () => {
    expect(manifest.icons?.some((icon) => icon.sizes === '192x192')).toBe(true)
    expect(
      manifest.icons?.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'),
    ).toBe(true)
  })

  it('declares wide and narrow store screenshots at stable public paths', () => {
    expect(manifest.screenshots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: '/screenshots/title-desktop.png',
          sizes: '1366x768',
          form_factor: 'wide',
        }),
        expect.objectContaining({
          src: '/screenshots/title-mobile.png',
          sizes: '390x844',
          form_factor: 'narrow',
        }),
      ]),
    )
  })
})

describe('service worker resilience', () => {
  it('discovers and pre-caches Vite hashed assets from the built index', () => {
    expect(serviceWorkerSource).toContain('discoverBuildAssets')
    expect(serviceWorkerSource).toContain("url.pathname.startsWith('/assets/')")
    expect(serviceWorkerSource).toContain('cacheBuildAssets(cache, assetUrls')
    expect(serviceWorkerSource).toContain("new Request('/index.html'")
    expect(serviceWorkerSource).toContain("cache.put('/index.html'")
  })

  it('uses navigation network-first with the app shell and offline page as fallbacks', () => {
    expect(serviceWorkerSource).toContain("request.mode === 'navigate'")
    expect(serviceWorkerSource).toContain('navigationResponse(request)')
    expect(serviceWorkerSource).toContain("caches.match('/index.html'")
    expect(serviceWorkerSource).toContain("caches.match('/offline.html'")
  })

  it('retains one prior cache generation while deleting older versions', () => {
    expect(serviceWorkerSource).toContain('CACHE_VERSION')
    expect(serviceWorkerSource).toContain('MAX_CACHE_GENERATIONS = 2')
    expect(serviceWorkerSource).toContain('previousGenerations.slice')
    expect(serviceWorkerSource).toContain('caches.delete')
    expect(serviceWorkerSource).toContain('self.skipWaiting()')
  })

  it('activates a waiting worker only when one exists', () => {
    const postMessage = vi.fn()
    const waitingRegistration = {
      waiting: { postMessage },
    } as unknown as ServiceWorkerRegistration
    const currentRegistration = { waiting: null } as unknown as ServiceWorkerRegistration

    expect(applyServiceWorkerUpdate(waitingRegistration)).toBe(true)
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    expect(applyServiceWorkerUpdate(currentRegistration)).toBe(false)
    expect(UPDATE_READY_EVENT).toBe('tsukikage:update-ready')
  })
})

describe('Cloudflare Pages delivery rules', () => {
  it('does not cache the worker or HTML and serves immutable hashed assets', () => {
    expect(headersSource).toMatch(/\/assets\/\*[\s\S]*max-age=31536000, immutable/u)
    expect(headersSource).toMatch(/\/sw\.js[\s\S]*no-cache, no-store, must-revalidate/u)
    expect(headersSource).toContain('Service-Worker-Allowed: /')
    expect(headersSource).toMatch(/\/index\.html[\s\S]*Cache-Control: no-cache/u)
  })

  it('keeps a dedicated offline route before the SPA fallback', () => {
    const rules = redirectsSource.trim().split(/\r?\n/u)
    expect(rules[0]).toBe('/offline /offline.html 200')
    expect(rules.at(-1)).toBe('/* /index.html 200')
  })
})
