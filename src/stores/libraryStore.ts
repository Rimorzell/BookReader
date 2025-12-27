import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Book, Collection, Bookmark, Highlight, ReadingStatus } from '../types';

interface LibraryState {
  books: Book[];
  collections: Collection[];
  bookmarks: Bookmark[];
  highlights: Highlight[];

  // Book actions
  addBook: (book: Omit<Book, 'id' | 'dateAdded' | 'progress' | 'readingTime' | 'status' | 'collectionIds' | 'tags'>) => Book;
  updateBook: (id: string, updates: Partial<Book>) => void;
  removeBook: (id: string) => void;
  getBook: (id: string) => Book | undefined;
  updateReadingProgress: (id: string, location: string, progress: number) => void;
  updateReadingTime: (id: string, seconds: number) => void;
  setBookStatus: (id: string, status: ReadingStatus) => void;

  // Collection actions
  createCollection: (name: string) => Collection;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addBookToCollection: (bookId: string, collectionId: string) => void;
  removeBookFromCollection: (bookId: string, collectionId: string) => void;

  // Bookmark actions
  addBookmark: (bookId: string, location: string, displayText?: string, note?: string) => Bookmark;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  removeBookmark: (id: string) => void;
  getBookBookmarks: (bookId: string) => Bookmark[];

  // Highlight actions
  addHighlight: (highlight: Omit<Highlight, 'id' | 'dateCreated'>) => Highlight;
  updateHighlight: (id: string, updates: Partial<Highlight>) => void;
  removeHighlight: (id: string) => void;
  getBookHighlights: (bookId: string) => Highlight[];
  clearAllHighlights: (bookId: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      books: [],
      collections: [],
      bookmarks: [],
      highlights: [],

      // Book actions
      addBook: (bookData) => {
        const book: Book = {
          id: uuidv4(),
          ...bookData,
          dateAdded: Date.now(),
          progress: 0,
          readingTime: 0,
          status: 'want-to-read',
          collectionIds: [],
          tags: [],
        };
        set((state) => ({ books: [...state.books, book] }));
        return book;
      },

      updateBook: (id, updates) => {
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id ? { ...book, ...updates } : book
          ),
        }));
      },

      removeBook: (id) => {
        set((state) => ({
          books: state.books.filter((book) => book.id !== id),
          bookmarks: state.bookmarks.filter((b) => b.bookId !== id),
          highlights: state.highlights.filter((h) => h.bookId !== id),
          collections: state.collections.map((collection) => ({
            ...collection,
            bookIds: collection.bookIds.filter((bookId) => bookId !== id),
          })),
        }));
      },

      getBook: (id) => {
        return get().books.find((book) => book.id === id);
      },

      updateReadingProgress: (id, location, progress) => {
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id
              ? {
                  ...book,
                  currentLocation: location,
                  progress,
                  lastOpened: Date.now(),
                  status: book.status === 'want-to-read' ? 'reading' : book.status,
                }
              : book
          ),
        }));
      },

      updateReadingTime: (id, seconds) => {
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id
              ? { ...book, readingTime: book.readingTime + seconds }
              : book
          ),
        }));
      },

      setBookStatus: (id, status) => {
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id ? { ...book, status } : book
          ),
        }));
      },

      // Collection actions
      createCollection: (name) => {
        const collection: Collection = {
          id: uuidv4(),
          name,
          bookIds: [],
          dateCreated: Date.now(),
          sortOrder: get().collections.length,
        };
        set((state) => ({ collections: [...state.collections, collection] }));
        return collection;
      },

      updateCollection: (id, updates) => {
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === id ? { ...col, ...updates } : col
          ),
        }));
      },

      deleteCollection: (id) => {
        set((state) => ({
          collections: state.collections.filter((col) => col.id !== id),
          books: state.books.map((book) => ({
            ...book,
            collectionIds: book.collectionIds.filter((cid) => cid !== id),
          })),
        }));
      },

      addBookToCollection: (bookId, collectionId) => {
        set((state) => ({
          books: state.books.map((book) =>
            book.id === bookId && !book.collectionIds.includes(collectionId)
              ? { ...book, collectionIds: [...book.collectionIds, collectionId] }
              : book
          ),
          collections: state.collections.map((col) =>
            col.id === collectionId && !col.bookIds.includes(bookId)
              ? { ...col, bookIds: [...col.bookIds, bookId] }
              : col
          ),
        }));
      },

      removeBookFromCollection: (bookId, collectionId) => {
        set((state) => ({
          books: state.books.map((book) =>
            book.id === bookId
              ? { ...book, collectionIds: book.collectionIds.filter((cid) => cid !== collectionId) }
              : book
          ),
          collections: state.collections.map((col) =>
            col.id === collectionId
              ? { ...col, bookIds: col.bookIds.filter((bid) => bid !== bookId) }
              : col
          ),
        }));
      },

      // Bookmark actions
      addBookmark: (bookId, location, displayText, note) => {
        const bookmark: Bookmark = {
          id: uuidv4(),
          bookId,
          location,
          dateCreated: Date.now(),
          displayText,
          note,
        };
        set((state) => ({ bookmarks: [...state.bookmarks, bookmark] }));
        return bookmark;
      },

      updateBookmark: (id, updates) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));
      },

      getBookBookmarks: (bookId) => {
        return get().bookmarks.filter((b) => b.bookId === bookId);
      },

      // Highlight actions
      addHighlight: (highlightData) => {
        // Remove any existing highlight at the same location to prevent stacking
        const existingHighlights = get().highlights.filter(
          (h) => h.bookId === highlightData.bookId && h.startLocation === highlightData.startLocation
        );

        const highlight: Highlight = {
          id: uuidv4(),
          ...highlightData,
          dateCreated: Date.now(),
        };

        set((state) => ({
          highlights: [
            ...state.highlights.filter(
              (h) => !existingHighlights.some((e) => e.id === h.id)
            ),
            highlight,
          ],
        }));
        return highlight;
      },

      updateHighlight: (id, updates) => {
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }));
      },

      removeHighlight: (id) => {
        set((state) => ({
          highlights: state.highlights.filter((h) => h.id !== id),
        }));
      },

      getBookHighlights: (bookId) => {
        return get().highlights.filter((h) => h.bookId === bookId);
      },

      clearAllHighlights: (bookId) => {
        set((state) => ({
          highlights: state.highlights.filter((h) => h.bookId !== bookId),
        }));
      },
    }),
    {
      name: 'bookreader-library',
    }
  )
);
