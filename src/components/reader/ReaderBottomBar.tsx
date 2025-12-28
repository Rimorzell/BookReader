import { useReaderStore, useSettingsStore } from '../../stores';
import { UI_CONSTANTS } from '../../constants';

interface ReaderBottomBarProps {
  visible: boolean;
  onScrubProgress: (percentage: number) => void;
}
export function ReaderBottomBar({
  visible,
  onScrubProgress,
}: ReaderBottomBarProps) {
  const {
    progress,
    totalLocations,
    currentPage: storedCurrentPage,
    totalPages: storedTotalPages,
  } = useReaderStore();
  const { settings } = useSettingsStore();

  const totalPages = totalLocations || storedTotalPages || 1;
  const currentPage = Math.min(totalPages, Math.max(1, storedCurrentPage || 1));
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress || (currentPage / totalPages) * 100)));

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
      className={`absolute bottom-0 left-0 right-0 z-40 px-6 pb-5 pt-4 bg-gradient-to-r from-[var(--bg-secondary)]/95 via-[var(--bg-primary)]/90 to-[var(--bg-secondary)]/95 backdrop-blur-md border-t border-[var(--border)]/70 shadow-inner transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 text-[var(--text-secondary)]">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em]">
          <span className="flex items-center gap-2">
            <span className="h-px w-8 bg-[var(--border)]/80" />
            Leaf through
          </span>
          <span className="text-[var(--text-primary)] text-xs font-semibold">{roundedProgress}% read</span>
        </div>
        {/* Progress bar */}
        <div>
          <div
            className="group relative h-2.5 w-full cursor-pointer overflow-hidden rounded-full bg-[var(--bg-tertiary)]/80 shadow-inner"
            role="slider"
            tabIndex={0}
            aria-label="Reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={roundedProgress}
            aria-valuetext={`Page ${currentPage} of ${totalPages}`}
            onClick={handleProgressScrub}
            onKeyDown={handleProgressKeyDown}
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-amber-500/80 via-amber-600/80 to-amber-700/80 transition-all duration-300"
              style={{ width: `${roundedProgress}%` }}
            />
            <div
              className="absolute top-1/2 h-5 w-5 -translate-y-1/2 translate-x-[-50%] rounded-full border border-[var(--border)] bg-[var(--bg-primary)] shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ left: `${roundedProgress}%` }}
            />
          </div>
        </div>
        {/* Page info */}
        {settings.reader.showProgress && (
          <div className="flex items-center justify-between text-[13px] text-[var(--text-secondary)] italic">
            <span className="font-semibold text-[var(--text-primary)]">Page {currentPage} / {totalPages}</span>
            <span className="text-[var(--text-secondary)]">Tap or drag to jump</span>
          </div>
        )}
      </div>
    </footer>
  );
}
