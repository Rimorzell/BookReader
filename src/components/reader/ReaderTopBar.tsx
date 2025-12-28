import { useNavigate } from 'react-router-dom';
import type { Book } from '../../types';
import { useReaderStore } from '../../stores';
interface ReaderTopBarProps {
  book: Book;
  visible: boolean;
  recommendedSettings: {
    theme: string;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
  onApplyRecommended: () => void;
}
export function ReaderTopBar({
  book,
  visible,
  recommendedSettings,
  onApplyRecommended,
}: ReaderTopBarProps) {
  const navigate = useNavigate();
  const { currentChapter } = useReaderStore();
  const handleClose = () => {
    navigate('/');
  };
  return (
    <header
      className={`absolute top-0 left-0 right-0 z-40 flex items-center px-4 py-3 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border)]/60 shadow-sm transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      onMouseEnter={onHover}
    >
      {/* Close button and book info */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleClose}
          className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Close reader"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[400px] tracking-tight">
            {book.title}
          </h1>
          {currentChapter && (
            <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-[400px]">
              {currentChapter}
            </p>
          )}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
        <div className="px-3 py-1 rounded-full border border-[var(--border)]/70 bg-[var(--bg-primary)]/70 shadow-sm">
          <span className="font-semibold text-[var(--text-primary)]">Suggested</span>
          <span className="mx-2 text-[var(--text-secondary)]">|</span>
          <span className="font-medium text-[var(--text-primary)]">
            {recommendedSettings.theme} · {recommendedSettings.fontFamily} · {recommendedSettings.fontSize}px
          </span>
        </div>
        <button
          onClick={onApplyRecommended}
          className="px-3 py-1 rounded-full bg-[var(--accent)]/90 text-white text-[11px] font-semibold shadow-md hover:shadow-lg transition transform hover:-translate-y-[1px]"
        >
          Apply
        </button>
      </div>
    </header>
  );
}
