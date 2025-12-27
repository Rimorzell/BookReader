import { useLibraryStore, useReaderStore } from '../../stores';
import { formatDate } from '../../utils';
import type { Book } from '../../types';
interface BookmarksPanelProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (location: string) => void;
}
export function BookmarksPanel({ book, isOpen, onClose, onNavigate }: BookmarksPanelProps) {
  const { getBookBookmarks, addBookmark, removeBookmark, getBookHighlights } = useLibraryStore();
  const { currentLocation } = useReaderStore();
  const bookmarks = getBookBookmarks(book.id);
  const highlights = getBookHighlights(book.id);
  const handleAddBookmark = () => {
    if (currentLocation) {
      addBookmark(book.id, currentLocation, 'Bookmark');
    }
  };
  const isCurrentLocationBookmarked = bookmarks.some(
    (b) => b.location === currentLocation
  );
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      )}
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[80vw] bg-[var(--bg-primary)] shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bookmarks</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddBookmark}
              disabled={isCurrentLocationBookmarked || !currentLocation}
              className={`p-2 rounded-lg transition-colors ${
                isCurrentLocationBookmarked
                  ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
              aria-label={isCurrentLocationBookmarked ? 'Page bookmarked' : 'Add bookmark'}
              title={isCurrentLocationBookmarked ? 'Page bookmarked' : 'Bookmark this page'}
            >
              <svg
                className="w-5 h-5"
                fill={isCurrentLocationBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {/* Bookmarks */}
          <section className="p-4">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Bookmarks ({bookmarks.length})
            </h3>
            {bookmarks.length === 0 ? (
              <div className="py-4">
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  No bookmarks yet.
                </p>
                <button
                  onClick={handleAddBookmark}
                  disabled={!currentLocation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Bookmark This Page
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Add bookmark button at top of list */}
                <button
                  onClick={handleAddBookmark}
                  disabled={isCurrentLocationBookmarked || !currentLocation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] disabled:hover:text-[var(--text-secondary)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {isCurrentLocationBookmarked ? 'Page Already Bookmarked' : 'Bookmark This Page'}
                </button>
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                    onClick={() => onNavigate(bookmark.location)}
                  >
                    <svg className="w-4 h-4 mt-0.5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                        {bookmark.displayText || 'Bookmark'}
                      </p>
                      {bookmark.note && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">
                          {bookmark.note}
                        </p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {formatDate(bookmark.dateCreated)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBookmark(bookmark.id);
                      }}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 transition-colors"
                      aria-label="Remove bookmark"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          {/* Highlights */}
          <section className="p-4 border-t border-[var(--border)]">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Highlights ({highlights.length})
            </h3>
            {highlights.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] py-4">
                No highlights yet. Select text in the book to highlight.
              </p>
            ) : (
              <div className="space-y-2">
                {highlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="p-3 rounded-lg bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                    onClick={() => onNavigate(highlight.startLocation)}
                  >
                    <div
                      className="text-sm text-[var(--text-primary)] line-clamp-3 border-l-4 pl-3"
                      style={{
                        borderColor: getHighlightColor(highlight.color),
                      }}
                    >
                      {highlight.text}
                    </div>
                    {highlight.note && (
                      <p className="text-xs text-[var(--text-secondary)] mt-2 italic">
                        {highlight.note}
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {formatDate(highlight.dateCreated)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
function getHighlightColor(color: string): string {
  const colors: Record<string, string> = {
    yellow: '#fef08a',
    green: '#bbf7d0',
    blue: '#bfdbfe',
    pink: '#fbcfe8',
    purple: '#ddd6fe',
  };
  return colors[color] || colors.yellow;
}
