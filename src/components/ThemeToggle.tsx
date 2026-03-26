import { useState } from 'react'

const THEMES = ['pipboy', 'light', 'dark', 'minimal', 'metal'] as const
type Theme = typeof THEMES[number]

const LABELS: Record<Theme, string> = {
  pipboy:  '◉ PIP-BOY',
  light:   '☀ LIGHT',
  dark:    '☾ DARK',
  minimal: '◻ MINIMAL',
  metal:   '⚙ STEAM',
}

function getTheme(): Theme {
  return (localStorage.getItem('theme') as Theme) ?? 'minimal'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getTheme)

  function next() {
    const idx = THEMES.indexOf(theme)
    const nextTheme = THEMES[(idx + 1) % THEMES.length]
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  return (
    <button className="btn btn-sm" onClick={next} title="Switch theme">
      {LABELS[theme]}
    </button>
  )
}
