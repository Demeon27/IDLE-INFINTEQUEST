import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'  // i18n doit être importé AVANT App
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
