import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/global.css'
import './styles/ui.css'
import { registerServiceWorker } from './pwa/register'
import { ErrorBoundary } from './ui/ErrorBoundary'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Application root was not found')
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

void registerServiceWorker()
