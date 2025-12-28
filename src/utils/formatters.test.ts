import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatReadingTime,
  formatProgress,
  formatDate,
  formatTimeRemaining,
  truncateText,
  sanitizeFilename,
  generateExportFilename,
  formatBookmarksAsMarkdown,
} from './formatters';

describe('formatReadingTime', () => {
  it('should return "Less than a minute" for less than 60 seconds', () => {
    expect(formatReadingTime(0)).toBe('Less than a minute');
    expect(formatReadingTime(30)).toBe('Less than a minute');
    expect(formatReadingTime(59)).toBe('Less than a minute');
  });

  it('should format minutes only when less than 1 hour', () => {
    expect(formatReadingTime(60)).toBe('1 min');
    expect(formatReadingTime(120)).toBe('2 min');
    expect(formatReadingTime(3599)).toBe('59 min');
  });

  it('should format hours only when minutes are 0', () => {
    expect(formatReadingTime(3600)).toBe('1 hr');
    expect(formatReadingTime(7200)).toBe('2 hr');
  });

  it('should format hours and minutes combined', () => {
    expect(formatReadingTime(3660)).toBe('1 hr 1 min');
    expect(formatReadingTime(5400)).toBe('1 hr 30 min');
    expect(formatReadingTime(9000)).toBe('2 hr 30 min');
  });

  it('should handle edge cases', () => {
    expect(formatReadingTime(-10)).toBe('Less than a minute');
    expect(formatReadingTime(86400)).toBe('24 hr'); // 24 hours exactly
  });
});

describe('formatProgress', () => {
  it('should format progress as percentage', () => {
    expect(formatProgress(0)).toBe('0%');
    expect(formatProgress(50)).toBe('50%');
    expect(formatProgress(100)).toBe('100%');
  });

  it('should round decimal values', () => {
    expect(formatProgress(33.33)).toBe('33%');
    expect(formatProgress(66.67)).toBe('67%');
    expect(formatProgress(99.9)).toBe('100%');
  });

  it('should handle edge cases', () => {
    expect(formatProgress(-5)).toBe('-5%');
    expect(formatProgress(150)).toBe('150%');
  });
});

describe('formatDate', () => {
  let mockNow: number;

  beforeEach(() => {
    mockNow = new Date('2024-06-15T12:00:00').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Just now" for very recent timestamps', () => {
    const justNow = mockNow - 30 * 1000; // 30 seconds ago
    expect(formatDate(justNow)).toBe('Just now');
  });

  it('should format minutes ago correctly', () => {
    const oneMinAgo = mockNow - 60 * 1000;
    expect(formatDate(oneMinAgo)).toBe('1 minute ago');

    const fiveMinAgo = mockNow - 5 * 60 * 1000;
    expect(formatDate(fiveMinAgo)).toBe('5 minutes ago');
  });

  it('should format hours ago correctly', () => {
    const oneHourAgo = mockNow - 60 * 60 * 1000;
    expect(formatDate(oneHourAgo)).toBe('1 hour ago');

    const fiveHoursAgo = mockNow - 5 * 60 * 60 * 1000;
    expect(formatDate(fiveHoursAgo)).toBe('5 hours ago');
  });

  it('should return "Yesterday" for yesterday', () => {
    const yesterday = mockNow - 24 * 60 * 60 * 1000;
    expect(formatDate(yesterday)).toBe('Yesterday');
  });

  it('should format days ago for 2-7 days', () => {
    const twoDaysAgo = mockNow - 2 * 24 * 60 * 60 * 1000;
    expect(formatDate(twoDaysAgo)).toBe('2 days ago');

    const sevenDaysAgo = mockNow - 7 * 24 * 60 * 60 * 1000;
    expect(formatDate(sevenDaysAgo)).toBe('7 days ago');
  });

  it('should format as date string for more than 7 days ago', () => {
    const twoWeeksAgo = mockNow - 14 * 24 * 60 * 60 * 1000;
    const result = formatDate(twoWeeksAgo);
    expect(result).toMatch(/Jun 1/); // Should be around Jun 1, 2024
  });
});

describe('formatTimeRemaining', () => {
  it('should return "Complete" when progress is 100%', () => {
    expect(formatTimeRemaining(100, 200, 60)).toBe('Complete');
  });

  it('should return "Complete" when progress exceeds 100%', () => {
    expect(formatTimeRemaining(110, 200, 60)).toBe('Complete');
  });

  it('should return "Complete" when average page time is 0', () => {
    expect(formatTimeRemaining(50, 200, 0)).toBe('Complete');
  });

  it('should calculate remaining time correctly', () => {
    // 50% progress, 200 pages, 60 seconds per page
    // Remaining: 100 pages * 60 seconds = 6000 seconds = 1 hr 40 min
    const result = formatTimeRemaining(50, 200, 60);
    expect(result).toBe('1 hr 40 min');
  });

  it('should handle small remaining times', () => {
    const result = formatTimeRemaining(99, 100, 60);
    expect(result).toBe('1 min');
  });
});

describe('truncateText', () => {
  it('should not truncate text shorter than maxLength', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
    expect(truncateText('Hello', 5)).toBe('Hello');
  });

  it('should truncate text longer than maxLength and add ellipsis', () => {
    expect(truncateText('Hello World', 8)).toBe('Hello...');
    expect(truncateText('This is a very long text', 10)).toBe('This is...');
  });

  it('should handle edge cases', () => {
    expect(truncateText('', 10)).toBe('');
    expect(truncateText('Hi', 3)).toBe('Hi');
    expect(truncateText('Hello', 3)).toBe('...');
  });
});

describe('sanitizeFilename', () => {
  it('should replace invalid characters with hyphens', () => {
    expect(sanitizeFilename('file<name>.txt')).toBe('file-name-.txt');
    expect(sanitizeFilename('path/to\\file')).toBe('path-to-file');
    expect(sanitizeFilename('file:name|test')).toBe('file-name-test');
    expect(sanitizeFilename('file?name*')).toBe('file-name-');
    expect(sanitizeFilename('"quoted"')).toBe('-quoted-');
  });

  it('should keep valid characters', () => {
    expect(sanitizeFilename('valid-filename.txt')).toBe('valid-filename.txt');
    expect(sanitizeFilename('Book Title - Author')).toBe('Book Title - Author');
  });

  it('should handle empty strings', () => {
    expect(sanitizeFilename('')).toBe('');
  });
});

describe('generateExportFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate correct filename for bookmarks', () => {
    const result = generateExportFilename('My Book', 'bookmarks');
    expect(result).toBe('My Book-bookmarks-2024-06-15.md');
  });

  it('should generate correct filename for notes', () => {
    const result = generateExportFilename('Another Book', 'notes');
    expect(result).toBe('Another Book-notes-2024-06-15.md');
  });

  it('should sanitize book titles with special characters', () => {
    const result = generateExportFilename('Book: A Story?', 'bookmarks');
    expect(result).toBe('Book- A Story--bookmarks-2024-06-15.md');
  });
});

describe('formatBookmarksAsMarkdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format bookmarks with display text and notes', () => {
    const bookmarks = [
      {
        displayText: 'Some highlighted text',
        note: 'My note about this',
        dateCreated: Date.now() - 1000,
      },
    ];

    const result = formatBookmarksAsMarkdown('My Book', 'Author Name', bookmarks);

    expect(result).toContain('# My Book');
    expect(result).toContain('*by Author Name*');
    expect(result).toContain('## Bookmarks (1)');
    expect(result).toContain('> Some highlighted text');
    expect(result).toContain('**Note:** My note about this');
  });

  it('should handle bookmarks without display text', () => {
    const bookmarks = [
      {
        note: 'Just a note',
        dateCreated: Date.now(),
      },
    ];

    const result = formatBookmarksAsMarkdown('Book', 'Author', bookmarks);

    expect(result).toContain('**Note:** Just a note');
    expect(result).not.toContain('> '); // No quote block for display text
  });

  it('should handle empty bookmarks array', () => {
    const result = formatBookmarksAsMarkdown('Book', 'Author', []);

    expect(result).toContain('# Book');
    expect(result).toContain('*by Author*');
    expect(result).not.toContain('## Bookmarks');
  });

  it('should include export date', () => {
    const result = formatBookmarksAsMarkdown('Book', 'Author', []);

    expect(result).toContain('Exported on');
    expect(result).toContain('2024');
  });
});
