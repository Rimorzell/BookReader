import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EpubRenderer, type EpubRendererRef } from './EpubRenderer';
import { ReaderTopBar } from './ReaderTopBar';
import { ReaderBottomBar } from './ReaderBottomBar';
import { TableOfContents } from './TableOfContents';
import { ReaderSettings } from './ReaderSettings';
import { BookmarksPanel } from './BookmarksPanel';
import { useReaderStore, useLibraryStore, useSettingsStore } from '../../stores';
import type { TocItem } from '../../types';

const UI_HIDE_DELAY = 2000; // 2 seconds

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

  const book = books.find((b) => b.id === bookId);

  // Auto-hide UI after inactivity
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const startHideTimeout = useCallback(() => {
    clearHideTimeout();
    if (isUIVisible && !isTocOpen && !isSettingsOpen && !isBookmarksOpen) {
      hideTimeoutRef.current = setTimeout(() => {
        hideUI();
      }, UI_HIDE_DELAY);
    }
  }, [isUIVisible, isTocOpen, isSettingsOpen, isBookmarksOpen, hideUI, clearHideTimeout]);

  useEffect(() => {
    startHideTimeout();
    return clearHideTimeout;
  }, [startHideTimeout, clearHideTimeout]);

  // Handle mouse movement to show UI
  const handleMouseMove = useCallback(() => {
    if (!isUIVisible) {
      showUI();
    }
    startHideTimeout();
  }, [isUIVisible, showUI, startHideTimeout]);

  const handleUIHover = useCallback(() => {
    clearHideTimeout();
    showUI();
  }, [showUI, clearHideTimeout]);

  const handleUILeave = useCallback(() => {
    startHideTimeout();
  }, [startHideTimeout]);


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
          <p className="text-[var(--text-muted)] font-serif italic">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--bg-primary)]">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-serif text-[var(--text-primary)] mb-2">Unable to open book</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] font-serif hover:bg-[var(--bg-tertiary)] transition-colors duration-200"
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
    >
      {/* Top bar */}
      <ReaderTopBar
        book={book}
        visible={isUIVisible}
        onHover={handleUIHover}
      />

      {/* Reader content with navigation arrows */}
      <div className="h-full relative" data-reader-content>
        {/* Left navigation arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevPage();
          }}
          className={`absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center transition-all duration-300 z-10 ${
            isUIVisible
              ? 'opacity-30 hover:opacity-70 text-[var(--text-muted)]'
              : 'opacity-0'
          }`}
          aria-label="Previous page"
        >
          <span className="text-2xl font-light">‹</span>
        </button>

        {/* Book content */}
        <div className="h-full flex justify-center items-center px-16">
          <div className="h-full w-full max-w-3xl py-8">
            {book.fileType === 'epub' && (
              <EpubRenderer ref={rendererRef} book={book} onTocLoaded={handleTocLoaded} />
            )}
          </div>
        </div>

        {/* Right navigation arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNextPage();
          }}
          className={`absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center transition-all duration-300 z-10 ${
            isUIVisible
              ? 'opacity-30 hover:opacity-70 text-[var(--text-muted)]'
              : 'opacity-0'
          }`}
          aria-label="Next page"
        >
          <span className="text-2xl font-light">›</span>
        </button>
      </div>

      {/* Bottom bar */}
      <ReaderBottomBar
        visible={isUIVisible}
        onHover={handleUIHover}
      />

      {/* Quick access buttons - only show on hover */}
      <div
        className={`absolute top-4 right-20 z-50 flex items-center gap-2 transition-all duration-300 ${
          isUIVisible && !isTocOpen && !isSettingsOpen && !isBookmarksOpen
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        onMouseEnter={handleUIHover}
        onMouseLeave={handleUILeave}
      >
        <button
          onClick={() => setTocOpen(true)}
          className="px-3 py-1.5 text-xs font-serif text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
          title="Contents (T)"
        >
          Contents
        </button>
        <button
          onClick={() => setBookmarksOpen(true)}
          className="px-3 py-1.5 text-xs font-serif text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
          title="Bookmarks (B)"
        >
          Bookmarks
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="px-3 py-1.5 text-xs font-serif text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
          title="Settings (S)"
        >
          Settings
        </button>
      </div>

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

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/90 z-50">
          <p className="text-[var(--text-muted)] font-serif italic">Opening book...</p>
        </div>
      )}
    </div>
  );
}
