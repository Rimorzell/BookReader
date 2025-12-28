import { useReaderStore, useSettingsStore } from '../../stores';

interface ReaderBottomBarProps {
  visible: boolean;
  onHover: () => void;
}
export function ReaderBottomBar({
  visible,
  onHover,
}: ReaderBottomBarProps) {
  const {
    totalLocations,
    currentPage: storedCurrentPage,
    totalPages: storedTotalPages,
  } = useReaderStore();
  const { settings } = useSettingsStore();

  const totalPages = totalLocations || storedTotalPages || 1;
  const currentPage = Math.min(totalPages, Math.max(1, storedCurrentPage || 1));
  const roundedProgress = Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100)));
  return (
    <footer
      className={`absolute bottom-0 left-0 right-0 z-40 px-6 pb-4 pt-3 bg-[var(--bg-primary)]/95 backdrop-blur-md border-t border-[var(--border)]/70 shadow-inner transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      onMouseEnter={onHover}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between text-[var(--text-secondary)] text-sm">
        {settings.reader.showProgress && (
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[var(--border)]/60" />
            <span className="font-semibold text-[var(--text-primary)] tracking-wide">Page {currentPage} / {totalPages}</span>
            <span className="h-px w-10 bg-[var(--border)]/60" />
          </div>
        )}
        <span className="text-[12px] italic text-[var(--text-muted)]">{roundedProgress}% read</span>
      </div>
    </footer>
  );
}
