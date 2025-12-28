import { useNavigate } from 'react-router-dom';
import type { Book } from '../../types';
import { useReaderStore } from '../../stores';
interface ReaderTopBarProps {
  book: Book;
  visible: boolean;
}
export function ReaderTopBar({
  book,
  visible,
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
    </header>
  );
}
