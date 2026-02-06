'use client'

import { useTheme, ThemeName } from '../components/ThemeProvider'

const themes: Array<{ id: ThemeName; name: string; description: string }> = [
  { id: 'ember', name: 'Ember', description: 'Warm gold accents with a classic studio feel.' },
  { id: 'ocean', name: 'Ocean', description: 'Cool teal highlights for a focused vibe.' },
  { id: 'forest', name: 'Forest', description: 'Soft green accents inspired by nature.' }
]

export default function SettingsPage() {
  const { mode, theme, setMode, setTheme } = useTheme()

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="label mb-2">Settings</p>
          <h1 className="text-3xl font-semibold tracking-tight heading-display">Preferences</h1>
          <p className="muted">Control how the app looks for you.</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="section-title">
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path
              d="M12 4a8 8 0 1 0 8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M12 4v8h8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-semibold">Appearance</h2>
        </div>
        <div className="section-divider" />

        <div className="settings-group">
          <p className="label mb-2">Mode</p>
          <div className="settings-row">
            <label className={`settings-option ${mode === 'dark' ? 'settings-option-active' : ''}`}>
              <input
                type="radio"
                name="theme-mode"
                value="dark"
                checked={mode === 'dark'}
                onChange={() => setMode('dark')}
              />
              <span className="settings-option-title">Dark</span>
              <span className="settings-option-sub">Best for low light sessions.</span>
            </label>
            <label className={`settings-option ${mode === 'light' ? 'settings-option-active' : ''}`}>
              <input
                type="radio"
                name="theme-mode"
                value="light"
                checked={mode === 'light'}
                onChange={() => setMode('light')}
              />
              <span className="settings-option-title">Light</span>
              <span className="settings-option-sub">Crisp and bright.</span>
            </label>
          </div>
        </div>

        <div className="settings-group">
          <p className="label mb-2">Theme</p>
          <div className="theme-grid">
            {themes.map(themeOption => (
              <button
                key={themeOption.id}
                type="button"
                className={`theme-card ${theme === themeOption.id ? 'theme-card-active' : ''}`}
                onClick={() => setTheme(themeOption.id)}
              >
                <div className="theme-card-header">
                  <span className={`theme-swatch theme-swatch-${themeOption.id}`} aria-hidden="true" />
                  <span className="theme-card-title">{themeOption.name}</span>
                </div>
                <p className="theme-card-desc">{themeOption.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
