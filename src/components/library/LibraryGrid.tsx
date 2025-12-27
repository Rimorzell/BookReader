import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCard } from './BookCard';
import { EmptyState } from '../common';
import { useLibraryStore, useSettingsStore } from '../../stores';
import { UI_CONSTANTS } from '../../constants';
import type { Book } from '../../types';

interface LibraryGridProps {
  filter: string;
  searchQuery: string;
}

export function LibraryGrid({ filter, searchQuery }: LibraryGridProps) {
  const navigate = useNavigate();
  const { books, collections } = useLibraryStore();
  const { settings } = useSettingsStore();
  const { sortBy, sortOrder, viewMode } = settings.library;
  const [contextMenu, setContextMenu] = useState<{ book: Book; x: number; y: number } | null>(null);

  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Apply filter
    if (filter === 'reading') {
      result = result.filter((b) => b.status === 'reading');
    } else if (filter === 'want-to-read') {
      result = result.filter((b) => b.status === 'want-to-read');
    } else if (filter === 'finished') {
      result = result.filter((b) => b.status === 'finished');
    } else if (filter.startsWith('collection:')) {
      const collectionId = filter.replace('collection:', '');
      const collection = collections.find((c) => c.id === collectionId);
      if (collection) {
        result = result.filter((b) => collection.bookIds.includes(b.id));
      }
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.author.toLowerCase().includes(query) ||
          b.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author);
          break;
        case 'dateAdded':
          comparison = a.dateAdded - b.dateAdded;
          break;
        case 'lastOpened':
          comparison = (a.lastOpened || 0) - (b.lastOpened || 0);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [books, collections, filter, searchQuery, sortBy, sortOrder]);

  const handleBookClick = (book: Book) => {
    navigate(`/reader/${book.id}`);
  };

  const handleContextMenu = (e: React.MouseEvent, book: Book) => {
    e.preventDefault();
    setContextMenu({ book, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  if (filteredBooks.length === 0) {
    if (searchQuery) {
      return (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="No books found"
          description={`No books match "${searchQuery}"`}
        />
      );
    }

    return (
      <EmptyState
        icon={
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        }
        title="Your library is empty"
        description="Add some books to get started"
      />
    );
  }

  return (
    <>
      <div
        className={`p-6 ${
          viewMode === 'grid'
            ? 'grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6'
            : 'flex flex-col gap-2'
        }`}
        onClick={closeContextMenu}
      >
        {filteredBooks.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            viewMode={viewMode}
            onClick={() => handleBookClick(book)}
            onContextMenu={(e) => handleContextMenu(e, book)}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          book={contextMenu.book}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
}

interface ContextMenuProps {
  book: Book;
  x: number;
  y: number;
  onClose: () => void;
}

function ContextMenu({ book, x, y, onClose }: ContextMenuProps) {
  const { removeBook, setBookStatus } = useLibraryStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const menuItems = useRef<HTMLButtonElement[]>([]);

  // Calculate bounded position
  const boundedX = Math.min(x, window.innerWidth - UI_CONSTANTS.CONTEXT_MENU_WIDTH - UI_CONSTANTS.CONTEXT_MENU_MARGIN);
  const boundedY = Math.min(y, window.innerHeight - UI_CONSTANTS.CONTEXT_MENU_HEIGHT - UI_CONSTANTS.CONTEXT_MENU_MARGIN);

  const handleAction = useCallback((action: () => void) => {
    action();
    onClose();
  }, [onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex((prev) => (prev + 1) % menuItems.current.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((prev) => (prev - 1 + menuItems.current.length) % menuItems.current.length);
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            setFocusIndex((prev) => (prev - 1 + menuItems.current.length) % menuItems.current.length);
          } else {
            setFocusIndex((prev) => (prev + 1) % menuItems.current.length);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus current item
  useEffect(() => {
    menuItems.current[focusIndex]?.focus();
  }, [focusIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const setItemRef = (index: number) => (el: HTMLButtonElement | null) => {
    if (el) menuItems.current[index] = el;
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{ left: boundedX, top: boundedY }}
      role="menu"
      aria-label={`Actions for ${book.title}`}
    >
      <button
        ref={setItemRef(0)}
        onClick={() => handleAction(() => setBookStatus(book.id, 'reading'))}
        className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none"
        role="menuitem"
      >
        Mark as Reading
      </button>
      <button
        ref={setItemRef(1)}
        onClick={() => handleAction(() => setBookStatus(book.id, 'finished'))}
        className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none"
        role="menuitem"
      >
        Mark as Finished
      </button>
      <button
        ref={setItemRef(2)}
        onClick={() => handleAction(() => setBookStatus(book.id, 'want-to-read'))}
        className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none"
        role="menuitem"
      >
        Mark as Want to Read
      </button>
      <div className="border-t border-[var(--border)] my-1" role="separator" />
      <button
        ref={setItemRef(3)}
        onClick={() => handleAction(() => removeBook(book.id))}
        className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none"
        role="menuitem"
      >
        Remove from Library
      </button>
    </div>
  );
}
