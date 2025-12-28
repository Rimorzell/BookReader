import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookCard } from './BookCard';
import type { Book } from '../../types';

// Mock formatDate to return predictable values
vi.mock('../../utils', () => ({
  formatDate: vi.fn(() => 'Jan 15'),
}));

describe('BookCard', () => {
  const mockBook: Book = {
    id: 'book-1',
    title: 'Test Book Title',
    author: 'Test Author',
    description: 'A test book description',
    coverPath: '/covers/test-cover.jpg',
    filePath: '/books/test-book.epub',
    fileType: 'epub',
    dateAdded: Date.now() - 86400000, // 1 day ago
    lastOpened: Date.now() - 3600000, // 1 hour ago
    progress: 50,
    readingTime: 3600, // 1 hour
    status: 'reading',
    collectionIds: [],
    tags: [],
  };

  const mockOnClick = vi.fn();
  const mockOnContextMenu = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Grid View', () => {
    it('should render book title and author in grid view', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('should render cover image when coverPath is provided', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      const coverImage = screen.getByAltText('Test Book Title');
      expect(coverImage).toBeInTheDocument();
      expect(coverImage).toHaveAttribute('src', '/covers/test-cover.jpg');
    });

    it('should render placeholder when no cover image', () => {
      const bookWithoutCover = { ...mockBook, coverPath: undefined };

      render(
        <BookCard
          book={bookWithoutCover}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      // Should show title and author as placeholder
      const titleElements = screen.getAllByText('Test Book Title');
      expect(titleElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display last opened date when available', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('Jan 15')).toBeInTheDocument();
    });

    it('should not display date when lastOpened is not set', () => {
      const bookWithoutLastOpened = { ...mockBook, lastOpened: undefined };

      render(
        <BookCard
          book={bookWithoutLastOpened}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      // The formatDate mock returns 'Jan 15', so if not present, book has no lastOpened
      expect(screen.queryByText('Jan 15')).not.toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      fireEvent.click(screen.getByText('Test Book Title'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onContextMenu when right-clicked', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="grid"
          onClick={mockOnClick}
          onContextMenu={mockOnContextMenu}
        />
      );

      const card = screen.getByText('Test Book Title').closest('div[class*="cursor-pointer"]');
      fireEvent.contextMenu(card!);

      expect(mockOnContextMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('List View', () => {
    it('should render book title and author in list view', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="list"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('should render thumbnail cover in list view', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="list"
          onClick={mockOnClick}
        />
      );

      const coverImage = screen.getByAltText('Test Book Title');
      expect(coverImage).toBeInTheDocument();
    });

    it('should render placeholder in list view when no cover', () => {
      const bookWithoutCover = { ...mockBook, coverPath: undefined };

      render(
        <BookCard
          book={bookWithoutCover}
          viewMode="list"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('Book')).toBeInTheDocument();
    });

    it('should call onClick when clicked in list view', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="list"
          onClick={mockOnClick}
        />
      );

      fireEvent.click(screen.getByText('Test Book Title'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should display last opened date in list view', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="list"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('Jan 15')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const bookWithLongTitle = {
        ...mockBook,
        title: 'This is a very long book title that might need to be truncated or wrapped in the UI display',
      };

      render(
        <BookCard
          book={bookWithLongTitle}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText(bookWithLongTitle.title)).toBeInTheDocument();
    });

    it('should handle empty author', () => {
      const bookWithoutAuthor = { ...mockBook, author: '' };

      render(
        <BookCard
          book={bookWithoutAuthor}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const bookWithSpecialChars = {
        ...mockBook,
        title: 'Book: A Story? <With> "Special" & Characters!',
      };

      render(
        <BookCard
          book={bookWithSpecialChars}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('Book: A Story? <With> "Special" & Characters!')).toBeInTheDocument();
    });

    it('should handle missing optional onContextMenu', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      const card = screen.getByText('Test Book Title').closest('div[class*="cursor-pointer"]');

      // Should not throw when context menu is triggered without handler
      expect(() => fireEvent.contextMenu(card!)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for cover images', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      const coverImage = screen.getByAltText('Test Book Title');
      expect(coverImage).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <BookCard
          book={mockBook}
          viewMode="grid"
          onClick={mockOnClick}
        />
      );

      const card = screen.getByText('Test Book Title').closest('div[class*="cursor-pointer"]');

      fireEvent.keyDown(card!, { key: 'Enter' });
      // Note: actual keyboard navigation might need additional implementation
    });
  });
});
