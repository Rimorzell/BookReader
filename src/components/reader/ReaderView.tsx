import { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EpubRenderer, type EpubRendererHandle } from './EpubRenderer';
import { ReaderTopBar } from './ReaderTopBar';
import { ReaderBottomBar } from './ReaderBottomBar';
import { TableOfContents } from './TableOfContents';
import { ReaderSettings } from './ReaderSettings';
import { BookmarksPanel } from './BookmarksPanel';
import { useReaderStore, useLibraryStore } from '../../stores';
import type { TocItem } from '../../types';

export function ReaderView() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { books, updateReadingTime } = useLibraryStore();
  const {
    isUIVisible,
    showUI,
    hideUI,
    toggleUI,
    isTocOpen,
    setTocOpen,
    isSettingsOpen,
    setSettingsOpen,
    isBookmarksOpen,
    setBookmarksOpen,
    isLoading,
    error,
    endSession,
    reset,
  } = useReaderStore();

  const [toc, setToc] = useState<TocItem[]>([]);
  const rendererRef = useRef<EpubRendererHandle>(null);

  const book = books.find((b) => b.id === bookId);

  // Auto-hide UI after inactivity
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (isUIVisible && !isTocOpen && !isSettingsOpen && !isBookmarksOpen) {
      hideTimeoutRef.current = setTimeout(() => {
        hideUI();
      }, 5000); // 5 seconds before auto-hide
    }
  }, [isUIVisible, isTocOpen, isSettingsOpen, isBookmarksOpen, hideUI]);

  useEffect(() => {
    resetHideTimeout();
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [resetHideTimeout]);

  // Handle mouse movement to show UI
  const handleMouseMove = useCallback(() => {
    if (!isUIVisible) {
      showUI();
    }
    resetHideTimeout();
  }, [isUIVisible, showUI, resetHideTimeout]);

  // Handle click on reading area to toggle UI
  const handleReaderClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Only toggle if clicking on the reader area, not controls
    if (target.closest('[data-reader-content]')) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      // Center third toggles UI
      if (x > width / 3 && x < (2 * width) / 3) {
        toggleUI();
        resetHideTimeout();
      }
    }
  }, [toggleUI, resetHideTimeout]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const duration = endSession();
      if (bookId && duration > 0) {
        updateReadingTime(bookId, duration);
      }
      reset();
    };
  }, [bookId]);

  // Handle if book not found
  useEffect(() => {
    if (!book && !isLoading) {
      navigate('/');
    }
  }, [book, isLoading, navigate]);

  // Handle Escape key to close panels or return to library
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTocOpen) {
          setTocOpen(false);
        } else if (isSettingsOpen) {
          setSettingsOpen(false);
        } else if (isBookmarksOpen) {
          setBookmarksOpen(false);
        } else {
          navigate('/');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTocOpen, isSettingsOpen, isBookmarksOpen, setTocOpen, setSettingsOpen, setBookmarksOpen, navigate]);

  if (!book) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--bg-primary)]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">Failed to load book</h2>
          <p className="text-[var(--text-secondary)] mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg"
          >
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  const handleTocLoaded = (items: TocItem[]) => {
    setToc(items);
  };

  const handleNavigate = (href: string) => {
    // Navigation will be handled by the EpubRenderer
    rendererRef.current?.goToLocation(href);
  };

  const handlePrevPage = () => {
    rendererRef.current?.goPrev();
  };

  const handleNextPage = () => {
    rendererRef.current?.goNext();
  };

  return (
    <div
      className="relative h-full overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={handleReaderClick}
    >
      {/* Top bar */}
      <ReaderTopBar
        book={book}
        visible={isUIVisible}
        onOpenToc={() => setTocOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenBookmarks={() => setBookmarksOpen(true)}
      />

      {/* Reader content */}
      <div className="h-full pt-0" data-reader-content>
        {book.fileType === 'epub' && (
          <EpubRenderer ref={rendererRef} book={book} onTocLoaded={handleTocLoaded} />
        )}
        {book.fileType === 'pdf' && (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
            PDF support coming soon
          </div>
        )}
      </div>

      {/* Always-visible navigation zones - full height for easy clicking */}
      <button
        onClick={handlePrevPage}
        className="absolute left-0 top-0 bottom-0 w-20 z-30 flex items-center justify-start pl-2 opacity-30 hover:opacity-100 transition-opacity bg-gradient-to-r from-black/10 to-transparent hover:from-black/30"
        aria-label="Previous page"
      >
        <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={handleNextPage}
        className="absolute right-0 top-0 bottom-0 w-20 z-30 flex items-center justify-end pr-2 opacity-30 hover:opacity-100 transition-opacity bg-gradient-to-l from-black/10 to-transparent hover:from-black/30"
        aria-label="Next page"
      >
        <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Bottom bar */}
      <ReaderBottomBar
        visible={isUIVisible}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />

      {/* Table of Contents */}
      <TableOfContents
        isOpen={isTocOpen}
        onClose={() => setTocOpen(false)}
        toc={toc}
        onNavigate={handleNavigate}
      />

      {/* Reader Settings */}
      <ReaderSettings
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Bookmarks Panel */}
      <BookmarksPanel
        book={book}
        isOpen={isBookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Persistent menu button - always visible when UI is hidden */}
      {!isUIVisible && (
        <button
          onClick={showUI}
          className="absolute top-4 left-4 z-40 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          aria-label="Show menu"
        >
          <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/80 z-50">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Loading book...</p>
          </div>
        </div>
      )}
    </div>
  );
}
