import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') {
    return
  }
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
  // Brief delay so the service worker is fully in control before first fetch
  await new Promise((r) => setTimeout(r, 50))
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

enableMocking()
  .then(() => {
    renderApp()
  })
  .catch((err) => {
    console.warn('[MSW] Mocking failed, running without mocks:', err)
    renderApp()
  })
