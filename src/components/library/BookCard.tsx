import React from 'react';
import type { Book } from '../../types';
import { formatDate } from '../../utils';

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
        className="flex items-center gap-4 p-3 cursor-pointer hover:bg-[var(--bg-secondary)]/50 transition-colors duration-200 border-b border-[var(--border)]/30"
      >
        {/* Cover thumbnail */}
        <div className="w-10 h-14 flex-shrink-0 overflow-hidden bg-[var(--bg-tertiary)]">
          {book.coverPath ? (
            <img
              src={book.coverPath}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--bg-tertiary)]">
              <span className="text-[var(--text-muted)] text-xs font-serif">Book</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-[var(--text-primary)]">{book.title}</h3>
          <p className="text-sm text-[var(--text-secondary)] italic">{book.author}</p>
        </div>

        {/* Last read */}
        <div className="text-sm text-[var(--text-muted)] font-serif">
          {book.lastOpened && formatDate(book.lastOpened)}
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
      <div className="relative aspect-[2/3] overflow-hidden bg-[var(--bg-tertiary)] shadow-md transition-all duration-300 ease-out group-hover:shadow-lg group-hover:-translate-y-1">
        {book.coverPath ? (
          <img
            src={book.coverPath}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[var(--bg-tertiary)]">
            <div className="text-center">
              <p className="font-serif text-[var(--text-primary)] text-sm line-clamp-3">{book.title}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-2 italic">{book.author}</p>
            </div>
          </div>
        )}
      </div>

      {/* Book info */}
      <div className="mt-2 px-1">
        <h3 className="font-serif text-[var(--text-primary)] line-clamp-2">{book.title}</h3>
        <p className="text-sm text-[var(--text-secondary)] italic">{book.author}</p>
        {book.lastOpened && (
          <p className="text-xs text-[var(--text-muted)] mt-1 font-serif">
            {formatDate(book.lastOpened)}
          </p>
        )}
      </div>
    </div>
  );
}
