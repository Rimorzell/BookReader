import React from 'react';
import type { Book } from '../../types';
import { ProgressBar } from '../common';
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
        className="flex items-center gap-4 p-3 bg-[var(--bg-secondary)] rounded-xl cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors group"
      >
        {/* Cover thumbnail */}
        <div className="w-12 h-16 flex-shrink-0 rounded-md overflow-hidden bg-[var(--bg-tertiary)] shadow">
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
          <h3 className="font-medium text-[var(--text-primary)] truncate">{book.title}</h3>
          <p className="text-sm text-[var(--text-secondary)] truncate">{book.author}</p>
          <div className="flex items-center gap-4 mt-1">
            <ProgressBar value={book.progress} size="sm" className="flex-1 max-w-[120px]" />
            <span className="text-xs text-[var(--text-muted)]">{Math.round(book.progress)}%</span>
          </div>
        </div>

        {/* Meta */}
        <div className="text-right text-xs text-[var(--text-muted)]">
          {book.lastOpened && <div>{formatDate(book.lastOpened)}</div>}
          {book.readingTime > 0 && <div>{formatReadingTime(book.readingTime)}</div>}
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
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--bg-tertiary)] shadow-lg book-card">
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

        {/* Progress overlay */}
        {book.progress > 0 && book.progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
            <ProgressBar value={book.progress} size="sm" />
          </div>
        )}

        {/* Finished badge */}
        {book.status === 'finished' && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
            Finished
          </div>
        )}
      </div>

      {/* Book info */}
      <div className="mt-3 px-1">
        <h3 className="font-medium text-[var(--text-primary)] line-clamp-1">{book.title}</h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-1">{book.author}</p>
      </div>
    </div>
  );
}
