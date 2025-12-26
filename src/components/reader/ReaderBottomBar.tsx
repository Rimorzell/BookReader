import { useReaderStore, useSettingsStore } from '../../stores';
interface ReaderBottomBarProps {
  visible: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}
export function ReaderBottomBar({ visible, onPrevPage, onNextPage }: ReaderBottomBarProps) {
  const { progress, currentPage, totalPages } = useReaderStore();
  const { settings } = useSettingsStore();
  return (
    <footer
      className={`absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-t border-[var(--border)] transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      {/* Navigation buttons */}
      <button
        onClick={onPrevPage}
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        aria-label="Previous page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      {/* Progress */}
      <div className="flex-1 flex flex-col items-center gap-2 px-4">
        {/* Progress bar */}
        <div className="w-full max-w-xl">
          <div className="h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {/* Page info */}
        {settings.reader.showProgress && (
          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span>Page {currentPage} of {totalPages}</span>
            <span className="text-[var(--text-muted)]">|</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        )}
      </div>
      {/* Next button */}
      <button
        onClick={onNextPage}
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        aria-label="Next page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </footer>
  );
}
