import { Routes, Route } from 'react-router-dom';
import { LibraryView } from './components/library';
import { ReaderView } from './components/reader';
import { SettingsView } from './components/settings';
import { useSettingsStore } from './stores';
import { useEffect } from 'react';

function App() {
  const { settings } = useSettingsStore();

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.reader.theme);
  }, [settings.reader.theme]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      <Routes>
        <Route path="/" element={<LibraryView />} />
        <Route path="/reader/:bookId" element={<ReaderView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Routes>
    </div>
  );
}

export default App;
