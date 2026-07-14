export const UPDATE_READY_EVENT = 'tsukikage:update-ready' as const

export interface PwaRegistrationResult {
  supported: boolean
  registered: boolean
  updateAvailable: boolean
  registration?: ServiceWorkerRegistration
}

const notifyUpdateReady = (): void => {
  // React may still be committing its first render when an existing waiting
  // worker is discovered. A task gives the UI listener time to subscribe.
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(UPDATE_READY_EVENT))
  }, 0)
}

export function applyServiceWorkerUpdate(registration: ServiceWorkerRegistration): boolean {
  const waiting = registration.waiting
  if (waiting === null) return false
  waiting.postMessage({ type: 'SKIP_WAITING' })
  return true
}

export async function registerServiceWorker(): Promise<PwaRegistrationResult> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return { supported: 'serviceWorker' in navigator, registered: false, updateAvailable: false }
  }

  try {
    const hadController = navigator.serviceWorker.controller !== null
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    let updateDetected = registration.waiting !== null && hadController
    let notified = false

    const notifyOnce = (): void => {
      if (notified || !hadController) return
      notified = true
      notifyUpdateReady()
    }

    if (registration.waiting !== null) {
      notifyOnce()
      // This also activates workers left waiting by an older release. The SW
      // retains one cache generation, so already-open pages remain safe.
      applyServiceWorkerUpdate(registration)
    }

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      if (worker === null) return
      updateDetected = hadController
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && hadController) {
          notifyOnce()
          applyServiceWorkerUpdate(registration)
        }
      })
    })

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (updateDetected) notifyOnce()
    })

    const checkForUpdates = (): void => {
      if (document.visibilityState === 'visible') {
        void registration.update().catch(() => undefined)
      }
    }
    window.addEventListener('online', checkForUpdates)
    document.addEventListener('visibilitychange', checkForUpdates)

    return {
      supported: true,
      registered: true,
      updateAvailable: updateDetected,
      registration,
    }
  } catch {
    return { supported: true, registered: false, updateAvailable: false }
  }
}
