import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReaderStore } from './readerStore';

// Helper to reset store between tests
const resetStore = () => {
  useReaderStore.setState({
    currentBook: null,
    isLoading: false,
    error: null,
    currentLocation: null,
    totalLocations: 0,
    currentPage: 0,
    totalPages: 0,
    currentChapter: null,
    progress: 0,
    isUIVisible: true,
    isTocOpen: false,
    isSettingsOpen: false,
    isBookmarksOpen: false,
    isSearchOpen: false,
    searchQuery: '',
    searchResults: [],
    sessionStartTime: null,
  });
};

describe('readerStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should set loading state', () => {
      const { setLoading } = useReaderStore.getState();

      setLoading(true);
      expect(useReaderStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useReaderStore.getState().isLoading).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should set error message', () => {
      const { setError } = useReaderStore.getState();

      setError('Failed to load book');
      expect(useReaderStore.getState().error).toBe('Failed to load book');

      setError(null);
      expect(useReaderStore.getState().error).toBeNull();
    });
  });

  describe('Current Book', () => {
    it('should set current book', () => {
      const { setCurrentBook } = useReaderStore.getState();

      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Author',
        filePath: '/book.epub',
        fileType: 'epub' as const,
        dateAdded: Date.now(),
        progress: 0,
        readingTime: 0,
        status: 'reading' as const,
        collectionIds: [],
        tags: [],
      };

      setCurrentBook(mockBook);
      expect(useReaderStore.getState().currentBook).toEqual(mockBook);

      setCurrentBook(null);
      expect(useReaderStore.getState().currentBook).toBeNull();
    });
  });

  describe('Location Updates', () => {
    it('should update location with all parameters', () => {
      const { updateLocation } = useReaderStore.getState();

      updateLocation('cfi-location-123', 5, 100, 50);

      const state = useReaderStore.getState();
      expect(state.currentLocation).toBe('cfi-location-123');
      expect(state.currentPage).toBe(5);
      expect(state.totalPages).toBe(100);
      expect(state.progress).toBe(50);
    });

    it('should handle location updates with edge values', () => {
      const { updateLocation } = useReaderStore.getState();

      updateLocation('start', 1, 1, 0);
      expect(useReaderStore.getState().progress).toBe(0);

      updateLocation('end', 100, 100, 100);
      expect(useReaderStore.getState().progress).toBe(100);
    });
  });

  describe('Total Locations', () => {
    it('should set total locations', () => {
      const { setTotalLocations } = useReaderStore.getState();

      setTotalLocations(500);
      expect(useReaderStore.getState().totalLocations).toBe(500);
    });
  });

  describe('Current Chapter', () => {
    it('should set current chapter', () => {
      const { setCurrentChapter } = useReaderStore.getState();

      setCurrentChapter('Chapter 5: The Journey');
      expect(useReaderStore.getState().currentChapter).toBe('Chapter 5: The Journey');

      setCurrentChapter(null);
      expect(useReaderStore.getState().currentChapter).toBeNull();
    });
  });

  describe('UI Visibility', () => {
    it('should toggle UI visibility', () => {
      const { toggleUI } = useReaderStore.getState();

      expect(useReaderStore.getState().isUIVisible).toBe(true);

      toggleUI();
      expect(useReaderStore.getState().isUIVisible).toBe(false);

      toggleUI();
      expect(useReaderStore.getState().isUIVisible).toBe(true);
    });

    it('should show UI', () => {
      const { hideUI, showUI } = useReaderStore.getState();

      hideUI();
      expect(useReaderStore.getState().isUIVisible).toBe(false);

      showUI();
      expect(useReaderStore.getState().isUIVisible).toBe(true);
    });

    it('should hide UI', () => {
      const { hideUI } = useReaderStore.getState();

      hideUI();
      expect(useReaderStore.getState().isUIVisible).toBe(false);
    });
  });

  describe('Panel States', () => {
    it('should toggle Table of Contents panel', () => {
      const { setTocOpen } = useReaderStore.getState();

      setTocOpen(true);
      expect(useReaderStore.getState().isTocOpen).toBe(true);

      setTocOpen(false);
      expect(useReaderStore.getState().isTocOpen).toBe(false);
    });

    it('should toggle Settings panel', () => {
      const { setSettingsOpen } = useReaderStore.getState();

      setSettingsOpen(true);
      expect(useReaderStore.getState().isSettingsOpen).toBe(true);

      setSettingsOpen(false);
      expect(useReaderStore.getState().isSettingsOpen).toBe(false);
    });

    it('should toggle Bookmarks panel', () => {
      const { setBookmarksOpen } = useReaderStore.getState();

      setBookmarksOpen(true);
      expect(useReaderStore.getState().isBookmarksOpen).toBe(true);

      setBookmarksOpen(false);
      expect(useReaderStore.getState().isBookmarksOpen).toBe(false);
    });

    it('should toggle Search panel', () => {
      const { setSearchOpen } = useReaderStore.getState();

      setSearchOpen(true);
      expect(useReaderStore.getState().isSearchOpen).toBe(true);

      setSearchOpen(false);
      expect(useReaderStore.getState().isSearchOpen).toBe(false);
    });
  });

  describe('Search Functionality', () => {
    it('should set search query', () => {
      const { setSearchQuery } = useReaderStore.getState();

      setSearchQuery('test query');
      expect(useReaderStore.getState().searchQuery).toBe('test query');
    });

    it('should set search results', () => {
      const { setSearchResults } = useReaderStore.getState();

      const results = [
        { cfi: 'cfi-1', excerpt: 'Result 1', chapter: 'Chapter 1' },
        { cfi: 'cfi-2', excerpt: 'Result 2', chapter: 'Chapter 2' },
      ];

      setSearchResults(results);
      expect(useReaderStore.getState().searchResults).toEqual(results);
    });

    it('should clear search', () => {
      const { setSearchQuery, setSearchResults, clearSearch } = useReaderStore.getState();

      setSearchQuery('test');
      setSearchResults([{ cfi: 'cfi-1', excerpt: 'Result' }]);

      clearSearch();

      const state = useReaderStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.searchResults).toEqual([]);
    });
  });

  describe('Session Tracking', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start a session', () => {
      const { startSession } = useReaderStore.getState();
      const now = Date.now();
      vi.setSystemTime(now);

      startSession();

      expect(useReaderStore.getState().sessionStartTime).toBe(now);
    });

    it('should end a session and return duration in seconds', () => {
      const { startSession, endSession } = useReaderStore.getState();

      const startTime = Date.now();
      vi.setSystemTime(startTime);
      startSession();

      // Advance time by 5 minutes (300 seconds)
      vi.setSystemTime(startTime + 300 * 1000);

      const duration = endSession();

      expect(duration).toBe(300);
      expect(useReaderStore.getState().sessionStartTime).toBeNull();
    });

    it('should return 0 if no session was started', () => {
      const { endSession } = useReaderStore.getState();

      const duration = endSession();

      expect(duration).toBe(0);
    });

    it('should handle session start clearing previous session', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Start first session
      useReaderStore.getState().startSession();
      expect(useReaderStore.getState().sessionStartTime).toBe(now);

      // Start new session (should overwrite previous)
      const later = now + 10000;
      vi.setSystemTime(later);
      useReaderStore.getState().startSession();
      expect(useReaderStore.getState().sessionStartTime).toBe(later);
    });
  });

  describe('Reset', () => {
    it('should reset all state to initial values', () => {
      const {
        setCurrentBook,
        setLoading,
        setError,
        updateLocation,
        setTotalLocations,
        setCurrentChapter,
        showUI,
        setTocOpen,
        setSearchQuery,
        startSession,
        reset,
      } = useReaderStore.getState();

      // Set various states
      setCurrentBook({
        id: 'book-1',
        title: 'Test',
        author: 'Author',
        filePath: '/book.epub',
        fileType: 'epub',
        dateAdded: Date.now(),
        progress: 50,
        readingTime: 1000,
        status: 'reading',
        collectionIds: [],
        tags: [],
      });
      setLoading(true);
      setError('Some error');
      updateLocation('cfi-123', 50, 100, 50);
      setTotalLocations(200);
      setCurrentChapter('Chapter 5');
      setTocOpen(true);
      setSearchQuery('test');
      startSession();

      // Reset
      reset();

      // Verify all values are reset
      const state = useReaderStore.getState();
      expect(state.currentBook).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.currentLocation).toBeNull();
      expect(state.totalLocations).toBe(0);
      expect(state.currentPage).toBe(0);
      expect(state.totalPages).toBe(0);
      expect(state.currentChapter).toBeNull();
      expect(state.progress).toBe(0);
      expect(state.isUIVisible).toBe(true);
      expect(state.isTocOpen).toBe(false);
      expect(state.isSettingsOpen).toBe(false);
      expect(state.isBookmarksOpen).toBe(false);
      expect(state.isSearchOpen).toBe(false);
      expect(state.searchQuery).toBe('');
      expect(state.searchResults).toEqual([]);
      expect(state.sessionStartTime).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid state changes', () => {
      const { showUI, hideUI, toggleUI } = useReaderStore.getState();

      for (let i = 0; i < 100; i++) {
        toggleUI();
      }

      // After even number of toggles, should be back to initial state
      expect(useReaderStore.getState().isUIVisible).toBe(true);
    });

    it('should handle negative progress values gracefully', () => {
      const { updateLocation } = useReaderStore.getState();

      // The store doesn't validate - it stores what's passed
      updateLocation('cfi', 1, 100, -10);
      expect(useReaderStore.getState().progress).toBe(-10);
    });

    it('should handle progress values over 100', () => {
      const { updateLocation } = useReaderStore.getState();

      updateLocation('cfi', 150, 100, 150);
      expect(useReaderStore.getState().progress).toBe(150);
    });

    it('should handle empty search results', () => {
      const { setSearchResults } = useReaderStore.getState();

      setSearchResults([]);
      expect(useReaderStore.getState().searchResults).toEqual([]);
    });

    it('should handle very long chapter names', () => {
      const { setCurrentChapter } = useReaderStore.getState();

      const longChapterName = 'A'.repeat(10000);
      setCurrentChapter(longChapterName);
      expect(useReaderStore.getState().currentChapter).toBe(longChapterName);
    });
  });
});
