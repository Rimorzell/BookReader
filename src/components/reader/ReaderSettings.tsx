import { useSettingsStore } from '../../stores';
import { Slider, Dropdown } from '../common';
import { fontFamilies, type Theme } from '../../types';
interface ReaderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}
export function ReaderSettings({ isOpen, onClose }: ReaderSettingsProps) {
  const {
    settings,
    setTheme,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setMargins,
    setTextAlign,
  } = useSettingsStore();
  const { reader } = settings;
  const themes: { id: Theme; label: string; bg: string; text: string }[] = [
    { id: 'light', label: 'Light', bg: '#ffffff', text: '#1d1d1f' },
    { id: 'sepia', label: 'Sepia', bg: '#f8f3e8', text: '#433422' },
    { id: 'dark', label: 'Dark', bg: '#1c1c1e', text: '#f5f5f7' },
    { id: 'black', label: 'Black', bg: '#000000', text: '#ffffff' },
  ];
  if (!isOpen) return null;
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-primary)] rounded-t-2xl shadow-2xl slide-up">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-[var(--bg-tertiary)]" />
        </div>
        {/* Content */}
        <div className="px-6 pb-8 max-h-[70vh] overflow-y-auto">
          {/* Theme selection */}
          <section className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Theme</h3>
            <div className="flex gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    reader.theme === theme.id
                      ? 'border-[var(--accent)]'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: theme.bg }}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.bg }}
                  />
                  <span className="text-xs font-medium" style={{ color: theme.text }}>
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
          {/* Font family */}
          <section className="mb-6">
            <Dropdown
              label="Font"
              options={fontFamilies.map((f) => ({ value: f.value, label: f.name }))}
              value={reader.fontFamily}
              onChange={setFontFamily}
            />
          </section>
          {/* Font size */}
          <section className="mb-6">
            <Slider
              label="Font Size"
              value={reader.fontSize}
              onChange={setFontSize}
              min={12}
              max={32}
              step={1}
              formatValue={(v) => `${v}px`}
            />
          </section>
          {/* Line height */}
          <section className="mb-6">
            <Slider
              label="Line Height"
              value={reader.lineHeight}
              onChange={setLineHeight}
              min={1.2}
              max={2.5}
              step={0.1}
              formatValue={(v) => v.toFixed(1)}
            />
          </section>
          {/* Margins */}
          <section className="mb-6">
            <Slider
              label="Margins"
              value={reader.marginHorizontal}
              onChange={(v) => setMargins(v, reader.marginVertical)}
              min={20}
              max={120}
              step={10}
              formatValue={(v) => `${v}px`}
            />
          </section>
          {/* Text alignment */}
          <section className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Text Alignment</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTextAlign('left')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                  reader.textAlign === 'left'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                </svg>
              </button>
              <button
                onClick={() => setTextAlign('justify')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                  reader.textAlign === 'justify'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </section>
          {/* Quick font size buttons */}
          <section className="mb-2">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setFontSize(Math.max(12, reader.fontSize - 2))}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-lg font-semibold hover:bg-[var(--border)] transition-colors"
              >
                A-
              </button>
              <span className="text-lg font-medium text-[var(--text-primary)]">
                {reader.fontSize}px
              </span>
              <button
                onClick={() => setFontSize(Math.min(32, reader.fontSize + 2))}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xl font-semibold hover:bg-[var(--border)] transition-colors"
              >
                A+
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
