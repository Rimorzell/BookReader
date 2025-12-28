import React from 'react';
import type { Book } from '../../types';
import { formatReadingTime, formatDate } from '../../utils';

interface BookCardProps {
  book: Book;
  viewMode: 'grid' | 'list';
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function BookCard({ book, viewMode, onClick, onContextMenu }: BookCardProps) {
  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        onContextMenu={onContextMenu}
        className="flex items-center gap-4 p-3 bg-[var(--bg-primary)]/90 border border-[var(--border)]/70 rounded-xl cursor-pointer hover:-translate-y-[2px] hover:shadow-lg hover:shadow-[var(--shadow)]/40 transition-all duration-200 group"
      >
        {/* Cover thumbnail */}
        <div className="w-12 h-16 flex-shrink-0 rounded-md overflow-hidden bg-[var(--bg-tertiary)] shadow-inner ring-1 ring-[var(--border)]/60">
          {book.coverPath ? (
            <img
              src={book.coverPath}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--text-muted)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 4H3a1 1 0 00-1 1v14a1 1 0 001 1h18a1 1 0 001-1V5a1 1 0 00-1-1zM4 18V6h16v12H4z" />
                <path d="M6.5 8.5h5v2h-5zM6.5 12h11v1h-11zM6.5 14.5h11v1h-11z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">{book.title}</h3>
          <p className="text-sm text-[var(--text-secondary)] truncate italic">{book.author}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            <span className="px-2 py-0.5 rounded-full border border-[var(--border)]/70 bg-[var(--bg-secondary)]/70 shadow-sm">{Math.round(book.progress)}% read</span>
            {book.readingTime > 0 && <span>{formatReadingTime(book.readingTime)}</span>}
          </div>
        </div>

        {/* Meta */}
        <div className="text-right text-xs text-[var(--text-muted)]">
          {book.lastOpened && <div>{formatDate(book.lastOpened)}</div>}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="group cursor-pointer"
    >
      {/* Book cover */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[var(--bg-primary)]/90 border border-[var(--border)]/70 shadow-md book-card transition-transform duration-200 group-hover:-translate-y-[3px] group-hover:shadow-lg">
        {book.coverPath ? (
          <img
            src={book.coverPath}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[var(--bg-tertiary)] to-[var(--bg-secondary)]">
            <svg className="w-12 h-12 text-[var(--text-muted)] mb-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 4H3a1 1 0 00-1 1v14a1 1 0 001 1h18a1 1 0 001-1V5a1 1 0 00-1-1zM4 18V6h16v12H4z" />
            </svg>
            <div className="text-center">
              <p className="font-medium text-[var(--text-primary)] text-sm line-clamp-2">{book.title}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{book.author}</p>
            </div>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Book info */}
      <div className="mt-3 px-1 space-y-1">
        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1">{book.title}</h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-1 italic">{book.author}</p>
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span className="px-2 py-0.5 rounded-full border border-[var(--border)]/70 bg-[var(--bg-secondary)]/70 shadow-sm">{Math.round(book.progress)}% read</span>
          {book.lastOpened && <span>Opened {formatDate(book.lastOpened)}</span>}
        </div>
      </div>
    </div>
  );
}
