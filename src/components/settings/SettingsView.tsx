import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../stores';
import { Slider, Dropdown, Button } from '../common';
import { fontFamilies, type Theme } from '../../types';
export function SettingsView() {
  const navigate = useNavigate();
  const {
    settings,
    setTheme,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setMargins,
    setTextAlign,
    setStartupBehavior,
    resetToDefaults,
  } = useSettingsStore();
  const { reader } = settings;
  const themes: { id: Theme; label: string; bg: string; text: string }[] = [
    { id: 'light', label: 'Light', bg: '#ffffff', text: '#1d1d1f' },
    { id: 'sepia', label: 'Sepia', bg: '#f8f3e8', text: '#433422' },
    { id: 'dark', label: 'Dark', bg: '#1c1c1e', text: '#f5f5f7' },
    { id: 'black', label: 'Black (OLED)', bg: '#000000', text: '#ffffff' },
  ];
  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)]">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Back to library"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h1>
      </header>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-8">
          {/* Appearance */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Appearance</h2>
            {/* Theme selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Theme</h3>
              <div className="grid grid-cols-4 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      reader.theme === theme.id
                        ? 'border-[var(--accent)]'
                        : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg shadow-md flex items-center justify-center"
                      style={{ backgroundColor: theme.bg }}
                    >
                      <span className="text-lg" style={{ color: theme.text }}>Aa</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {theme.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
          {/* Typography */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Typography</h2>
            <div className="space-y-6">
              <Dropdown
                label="Font Family"
                options={fontFamilies.map((f) => ({ value: f.value, label: f.name }))}
                value={reader.fontFamily}
                onChange={setFontFamily}
              />
              <Slider
                label="Font Size"
                value={reader.fontSize}
                onChange={setFontSize}
                min={12}
                max={32}
                step={1}
                formatValue={(v) => `${v}px`}
              />
              <Slider
                label="Line Height"
                value={reader.lineHeight}
                onChange={setLineHeight}
                min={1.2}
                max={2.5}
                step={0.1}
                formatValue={(v) => v.toFixed(1)}
              />
              <Slider
                label="Margins"
                value={reader.marginHorizontal}
                onChange={(v) => setMargins(v, reader.marginVertical)}
                min={20}
                max={120}
                step={10}
                formatValue={(v) => `${v}px`}
              />
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Text Alignment</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTextAlign('left')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                      reader.textAlign === 'left'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                    </svg>
                    <span className="text-sm font-medium">Left</span>
                  </button>
                  <button
                    onClick={() => setTextAlign('justify')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                      reader.textAlign === 'justify'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span className="text-sm font-medium">Justified</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
          {/* Behavior */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Behavior</h2>
            <Dropdown
              label="On Startup"
              options={[
                { value: 'library', label: 'Open Library' },
                { value: 'lastBook', label: 'Continue Reading Last Book' },
              ]}
              value={settings.startupBehavior}
              onChange={(v) => setStartupBehavior(v as 'library' | 'lastBook')}
            />
          </section>
          {/* Reset */}
          <section className="pt-4 border-t border-[var(--border)]">
            <Button variant="secondary" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
          </section>
          {/* About */}
          <section className="pt-4 border-t border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">About</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              BookReader v0.1.0
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              An Apple Books-style e-book reader for desktop
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
