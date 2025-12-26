import { useNavigate } from 'react-router-dom';
import type { Book } from '../../types';
import { useReaderStore } from '../../stores';
interface ReaderTopBarProps {
  book: Book;
  visible: boolean;
  onOpenToc: () => void;
  onOpenSettings: () => void;
  onOpenBookmarks: () => void;
}
export function ReaderTopBar({
  book,
  visible,
  onOpenToc,
  onOpenSettings,
  onOpenBookmarks,
}: ReaderTopBarProps) {
  const navigate = useNavigate();
  const { currentChapter } = useReaderStore();
  const handleClose = () => {
    navigate('/');
  };
  return (
    <header
      className={`absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border)] transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      {/* Left: Close button and book info */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleClose}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Close reader"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[300px]">
            {book.title}
          </h1>
          {currentChapter && (
            <p className="text-xs text-[var(--text-secondary)] truncate max-w-[300px]">
              {currentChapter}
            </p>
          )}
        </div>
      </div>
      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenToc}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Table of contents"
          title="Table of Contents"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={onOpenBookmarks}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Bookmarks"
          title="Bookmarks"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Reader settings"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>
    </header>
  );
}
