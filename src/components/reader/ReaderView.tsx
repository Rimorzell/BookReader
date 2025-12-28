import { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EpubRenderer, type EpubRendererRef } from './EpubRenderer';
import { ReaderTopBar } from './ReaderTopBar';
import { ReaderBottomBar } from './ReaderBottomBar';
import { TableOfContents } from './TableOfContents';
import { ReaderSettings } from './ReaderSettings';
import { BookmarksPanel } from './BookmarksPanel';
import { useReaderStore, useLibraryStore, useSettingsStore } from '../../stores';
import { UI_CONSTANTS } from '../../constants';
import type { TocItem } from '../../types';

export function ReaderView() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { books, updateReadingTime } = useLibraryStore();
  const {
    isUIVisible,
    showUI,
    hideUI,
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
  const { updateReaderSettings } = useSettingsStore();

  const [toc, setToc] = useState<TocItem[]>([]);
  const rendererRef = useRef<EpubRendererRef | null>(null);
  const recommendedSettings = {
    theme: 'sepia' as const,
    fontFamily: 'Georgia',
    fontSize: 18,
    lineHeight: 1.8,
    letterSpacing: 0,
    textAlign: 'justify' as const,
    marginHorizontal: 72,
    marginVertical: 48,
    maxWidth: 780,
    paragraphSpacing: 1.25,
    pageAnimation: 'slide' as const,
    viewMode: 'paginated' as const,
    showProgress: true,
    twoPageSpread: false,
  };

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

      // Left/right edges for navigation, center for UI toggle
      if (x > width * UI_CONSTANTS.CLICK_ZONE_PREV && x < width * UI_CONSTANTS.CLICK_ZONE_NEXT) {
        // If UI is visible, hide it; if hidden, show it
        if (isUIVisible) {
          hideUI();
        } else {
          showUI();
          resetHideTimeout();
        }
      }
    }
  }, [isUIVisible, hideUI, showUI, resetHideTimeout]);

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
    resetHideTimeout();
  };

  const handleNextPage = () => {
    rendererRef.current?.goNext();
    resetHideTimeout();
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
        recommendedSettings={recommendedSettings}
        onApplyRecommended={() => updateReaderSettings(recommendedSettings)}
      />

      {/* Reader content with navigation arrows */}
      <div className="h-full relative" data-reader-content>
        {/* Left navigation arrow - absolutely positioned */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevPage();
          }}
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
          </div>
        </div>

        {/* Right navigation arrow - absolutely positioned */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNextPage();
          }}
          className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/50 transition-all group z-10"
          aria-label="Next page"
        >
          <svg className="w-8 h-8 opacity-30 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom bar */}
      <ReaderBottomBar visible={isUIVisible} onScrubProgress={handleScrubProgress} />

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

      {/* Floating quick access buttons - positioned in top right, visible with UI */}
      {isUIVisible && !isTocOpen && !isSettingsOpen && !isBookmarksOpen && (
        <div
          className="absolute top-3 right-4 z-50 flex items-center gap-1 transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setTocOpen(true)}
            className="p-2 rounded-lg bg-[var(--bg-secondary)]/80 backdrop-blur-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
            aria-label="Contents (T)"
            title="Table of Contents (T)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setBookmarksOpen(true)}
            className="p-2 rounded-lg bg-[var(--bg-secondary)]/80 backdrop-blur-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
            aria-label="Bookmarks (B)"
            title="Bookmarks (B)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg bg-[var(--bg-secondary)]/80 backdrop-blur-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
            aria-label="Settings (S)"
            title="Settings (S)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
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
