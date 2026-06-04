import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
 
const root = createRoot(document.getElementById('root'))
root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
 
// Hide splash screen after first render
requestAnimationFrame(() => {
  setTimeout(() => {
    if (typeof window.hideSplash === 'function') window.hideSplash()
  }, 600)
})
 