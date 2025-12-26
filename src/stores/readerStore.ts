import { create } from 'zustand';
import type { Book } from '../types';

interface ReaderState {
  // Current book
  currentBook: Book | null;
  isLoading: boolean;
  error: string | null;

  // Navigation state
  currentLocation: string | null;
  totalLocations: number;
  currentPage: number;
  totalPages: number;
  currentChapter: string | null;
  progress: number;

  // UI state
  isUIVisible: boolean;
  isTocOpen: boolean;
  isSettingsOpen: boolean;
  isBookmarksOpen: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];

  // Session tracking
  sessionStartTime: number | null;

  // Actions
  setCurrentBook: (book: Book | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  updateLocation: (location: string, page: number, totalPages: number, progress: number) => void;
  setTotalLocations: (total: number) => void;
  setCurrentChapter: (chapter: string | null) => void;

  toggleUI: () => void;
  showUI: () => void;
  hideUI: () => void;

  setTocOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setBookmarksOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;

  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  clearSearch: () => void;

  startSession: () => void;
  endSession: () => number; // Returns session duration in seconds

  reset: () => void;
}

interface SearchResult {
  cfi: string;
  excerpt: string;
  chapter?: string;
}

const initialState = {
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
};

export const useReaderStore = create<ReaderState>((set, get) => ({
  ...initialState,

  setCurrentBook: (book) => set({ currentBook: book }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  updateLocation: (location, page, totalPages, progress) => {
    set({
      currentLocation: location,
      currentPage: page,
      totalPages,
      progress,
    });
  },

  setTotalLocations: (totalLocations) => set({ totalLocations }),
  setCurrentChapter: (currentChapter) => set({ currentChapter }),

  toggleUI: () => set((state) => ({ isUIVisible: !state.isUIVisible })),
  showUI: () => set({ isUIVisible: true }),
  hideUI: () => set({ isUIVisible: false }),

  setTocOpen: (isTocOpen) => set({ isTocOpen }),
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setBookmarksOpen: (isBookmarksOpen) => set({ isBookmarksOpen }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  clearSearch: () => set({ searchQuery: '', searchResults: [] }),

  startSession: () => set({ sessionStartTime: Date.now() }),
  endSession: () => {
    const { sessionStartTime } = get();
    if (!sessionStartTime) return 0;
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
    set({ sessionStartTime: null });
    return duration;
  },

  reset: () => set(initialState),
}));
