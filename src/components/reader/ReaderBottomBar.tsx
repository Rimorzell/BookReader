import { useReaderStore, useSettingsStore } from '../../stores';
import { UI_CONSTANTS } from '../../constants';

interface ReaderBottomBarProps {
  visible: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onScrubProgress: (percentage: number) => void;
}
export function ReaderBottomBar({
  visible,
  onPrevPage,
  onNextPage,
  onScrubProgress,
}: ReaderBottomBarProps) {
  const { progress, currentPage, totalPages } = useReaderStore();
  const { settings } = useSettingsStore();

  const handleProgressScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    onScrubProgress(Math.max(0, Math.min(100, percentage)));
  };

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onScrubProgress(Math.max(0, progress - UI_CONSTANTS.PROGRESS_STEP));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onScrubProgress(Math.min(100, progress + UI_CONSTANTS.PROGRESS_STEP));
    }
  };
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
          <div
            className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden cursor-pointer relative group"
            role="slider"
            tabIndex={0}
            aria-label="Reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={`${Math.round(progress)}% complete, page ${currentPage} of ${totalPages}`}
            onClick={handleProgressScrub}
            onKeyDown={handleProgressKeyDown}
          >
            <div
              className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full w-4 h-4 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 8px)` }}
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
