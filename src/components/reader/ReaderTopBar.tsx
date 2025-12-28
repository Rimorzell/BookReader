import { useNavigate } from 'react-router-dom';
import type { Book } from '../../types';
import { useReaderStore } from '../../stores';

interface ReaderTopBarProps {
  book: Book;
  visible: boolean;
  onHover?: () => void;
}

export function ReaderTopBar({
  book,
  visible,
  onHover,
}: ReaderTopBarProps) {
  const navigate = useNavigate();
  const { currentChapter } = useReaderStore();

  const handleClose = () => {
    navigate('/');
  };

  return (
    <header
      className={`absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      onMouseEnter={onHover}
    >
      {/* Close button and book info */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 font-serif"
          aria-label="Close reader"
        >
          ← Back
        </button>
        <div className="min-w-0 flex-1 mr-4">
          <h1 className="text-sm font-serif text-[var(--text-primary)]">
            {book.title}
          </h1>
          {currentChapter && (
            <p className="text-xs text-[var(--text-muted)] italic">
              {currentChapter}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
