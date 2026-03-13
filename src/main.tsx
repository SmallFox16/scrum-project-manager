import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function enableMocking() {
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
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
