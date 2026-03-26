import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/pipboy.css'
import App from './App'

// Apply saved theme before render to prevent flash
const savedTheme = localStorage.getItem('theme') ?? 'minimal'
document.documentElement.setAttribute('data-theme', savedTheme)

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
