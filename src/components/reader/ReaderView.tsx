import { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EpubRenderer, type EpubRendererRef } from './EpubRenderer';
import { ReaderTopBar } from './ReaderTopBar';
import { ReaderBottomBar } from './ReaderBottomBar';
import { TableOfContents } from './TableOfContents';
import { ReaderSettings } from './ReaderSettings';
import { BookmarksPanel } from './BookmarksPanel';
import { useReaderStore, useLibraryStore, toast } from '../../stores';
import { UI_CONSTANTS } from '../../constants';
import type { TocItem } from '../../types';

export function ReaderView() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { books, updateReadingTime, addBookmark, removeBookmark, getBookBookmarks } = useLibraryStore();
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
    currentLocation,
  } = useReaderStore();

  const [toc, setToc] = useState<TocItem[]>([]);
  const rendererRef = useRef<EpubRendererRef | null>(null);

  const book = books.find((b) => b.id === bookId);

  // Bookmarking functionality
  const bookmarks = bookId ? getBookBookmarks(bookId) : [];
  const currentBookmark = bookmarks.find((b) => b.location === currentLocation);
  const isCurrentLocationBookmarked = !!currentBookmark;

  const handleToggleBookmark = useCallback(() => {
    if (!bookId || !currentLocation) return;

    if (isCurrentLocationBookmarked && currentBookmark) {
      removeBookmark(currentBookmark.id);
      toast.success('Bookmark removed');
    } else {
      addBookmark(bookId, currentLocation, 'Bookmark');
      toast.success('Page bookmarked');
    }
  }, [bookId, currentLocation, isCurrentLocationBookmarked, currentBookmark, addBookmark, removeBookmark]);

  // Auto-hide UI after inactivity
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (isUIVisible && !isTocOpen && !isSettingsOpen && !isBookmarksOpen) {
      hideTimeoutRef.current = setTimeout(() => {
        hideUI();
      }, UI_CONSTANTS.UI_HIDE_TIMEOUT_MS);
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
      if (x > width * UI_CONSTANTS.CLICK_ZONE_PREV && x < width * UI_CONSTANTS.CLICK_ZONE_NEXT) {
        toggleUI();
        resetHideTimeout();
      }
    }
  }, [toggleUI, resetHideTimeout]);

  // Keyboard shortcuts for quick access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          setSettingsOpen(!isSettingsOpen);
          break;
        case 't':
          e.preventDefault();
          setTocOpen(!isTocOpen);
          break;
        case 'b':
          e.preventDefault();
          setBookmarksOpen(!isBookmarksOpen);
          break;
        case 'escape':
          e.preventDefault();
          if (isSettingsOpen) setSettingsOpen(false);
          else if (isTocOpen) setTocOpen(false);
          else if (isBookmarksOpen) setBookmarksOpen(false);
          else navigate('/'); // Exit to library
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isTocOpen, isBookmarksOpen, setSettingsOpen, setTocOpen, setBookmarksOpen, navigate]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const duration = endSession();
      if (bookId && duration > 0) {
        updateReadingTime(bookId, duration);
      }
      reset();
    };
  }, [bookId, endSession, reset, updateReadingTime]);

  // Handle if book not found
  useEffect(() => {
    if (!book && !isLoading) {
      navigate('/');
    }
  }, [book, isLoading, navigate]);

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

  const handleScrubProgress = (percentage: number) => {
    rendererRef.current?.goToPercentage(percentage);
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
      />

      {/* Reader content with navigation arrows */}
      <div className="h-full relative" data-reader-content>
        {/* Left navigation arrow - absolutely positioned */}
        <button
          onClick={handlePrevPage}
          className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/50 transition-all group z-10"
          aria-label="Previous page"
        >
          <svg className="w-8 h-8 opacity-30 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Book content - centered horizontally, starts from top */}
        <div className="h-full flex justify-center px-16 py-4">
          <div className="h-full w-full max-w-3xl">
            {book.fileType === 'epub' && (
              <EpubRenderer ref={rendererRef} book={book} onTocLoaded={handleTocLoaded} />
            )}
            {book.fileType === 'pdf' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">PDF Not Supported</h2>
                  <p className="text-[var(--text-secondary)] mb-4">PDF files cannot be opened yet. Only EPUB files are supported.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    Return to Library
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right navigation arrow - absolutely positioned */}
        <button
          onClick={handleNextPage}
          className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/50 transition-all group z-10"
          aria-label="Next page"
        >
          <svg className="w-8 h-8 opacity-30 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom bar */}
      <ReaderBottomBar
        visible={isUIVisible}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onScrubProgress={handleScrubProgress}
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

      {/* Floating bookmark button - always visible for quick access */}
      {!isTocOpen && !isSettingsOpen && !isBookmarksOpen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleBookmark();
          }}
          className={`absolute top-16 right-20 z-30 p-2.5 rounded-lg transition-all border ${
            isCurrentLocationBookmarked
              ? 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/50'
              : 'bg-[var(--bg-secondary)]/60 text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] border-[var(--border)]/50'
          }`}
          aria-label={isCurrentLocationBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          title={isCurrentLocationBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
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
      )}

      {/* Floating quick access buttons - positioned on right side, clear of navigation */}
      {!isTocOpen && !isSettingsOpen && !isBookmarksOpen && (
        <div
          className="absolute right-20 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg bg-[var(--bg-secondary)]/60 backdrop-blur-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]/50"
            aria-label="Settings (S)"
            title="Settings (S)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          <button
            onClick={() => setTocOpen(true)}
            className="p-2 rounded-lg bg-[var(--bg-secondary)]/60 backdrop-blur-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]/50"
            aria-label="Contents (T)"
            title="Table of Contents (T)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setBookmarksOpen(true)}
            className="p-2 rounded-lg bg-[var(--bg-secondary)]/60 backdrop-blur-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]/50"
            aria-label="Bookmarks (B)"
            title="Bookmarks (B)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
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
