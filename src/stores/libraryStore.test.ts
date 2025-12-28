import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLibraryStore } from './libraryStore';

// Helper to reset store between tests
const resetStore = () => {
  useLibraryStore.setState({
    books: [],
    collections: [],
    bookmarks: [],
  });
};

describe('libraryStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('Book Actions', () => {
    describe('addBook', () => {
      it('should add a new book with default values', () => {
        const { addBook } = useLibraryStore.getState();

        const book = addBook({
          title: 'Test Book',
          author: 'Test Author',
          filePath: '/path/to/book.epub',
          fileType: 'epub',
        });

        expect(book.id).toBeDefined();
        expect(book.title).toBe('Test Book');
        expect(book.author).toBe('Test Author');
        expect(book.progress).toBe(0);
        expect(book.readingTime).toBe(0);
        expect(book.status).toBe('want-to-read');
        expect(book.collectionIds).toEqual([]);
        expect(book.tags).toEqual([]);
        expect(book.dateAdded).toBeDefined();

        const { books } = useLibraryStore.getState();
        expect(books).toHaveLength(1);
        expect(books[0]).toEqual(book);
      });

      it('should add multiple books', () => {
        const { addBook } = useLibraryStore.getState();

        addBook({ title: 'Book 1', author: 'Author 1', filePath: '/path/1.epub', fileType: 'epub' });
        addBook({ title: 'Book 2', author: 'Author 2', filePath: '/path/2.epub', fileType: 'epub' });

        const { books } = useLibraryStore.getState();
        expect(books).toHaveLength(2);
      });
    });

    describe('updateBook', () => {
      it('should update an existing book', () => {
        const { addBook, updateBook } = useLibraryStore.getState();

        const book = addBook({
          title: 'Original Title',
          author: 'Author',
          filePath: '/path/book.epub',
          fileType: 'epub',
        });

        updateBook(book.id, { title: 'Updated Title', author: 'New Author' });

        const { books } = useLibraryStore.getState();
        expect(books[0].title).toBe('Updated Title');
        expect(books[0].author).toBe('New Author');
      });

      it('should not modify other books', () => {
        const { addBook, updateBook } = useLibraryStore.getState();

        const book1 = addBook({ title: 'Book 1', author: 'Author', filePath: '/1.epub', fileType: 'epub' });
        const book2 = addBook({ title: 'Book 2', author: 'Author', filePath: '/2.epub', fileType: 'epub' });

        updateBook(book1.id, { title: 'Updated Book 1' });

        const { books } = useLibraryStore.getState();
        expect(books.find(b => b.id === book1.id)?.title).toBe('Updated Book 1');
        expect(books.find(b => b.id === book2.id)?.title).toBe('Book 2');
      });

      it('should do nothing if book does not exist', () => {
        const { addBook, updateBook } = useLibraryStore.getState();

        addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });

        updateBook('non-existent-id', { title: 'New Title' });

        const { books } = useLibraryStore.getState();
        expect(books[0].title).toBe('Book');
      });
    });

    describe('removeBook', () => {
      it('should remove a book', () => {
        const { addBook, removeBook } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });

        removeBook(book.id);

        const { books } = useLibraryStore.getState();
        expect(books).toHaveLength(0);
      });

      it('should remove associated bookmarks when removing a book', () => {
        const { addBook, addBookmark, removeBook } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        addBookmark(book.id, 'location1', 'text1');
        addBookmark(book.id, 'location2', 'text2');

        expect(useLibraryStore.getState().bookmarks).toHaveLength(2);

        removeBook(book.id);

        expect(useLibraryStore.getState().bookmarks).toHaveLength(0);
      });

      it('should remove book from all collections when removed', () => {
        const { addBook, createCollection, addBookToCollection, removeBook } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        const collection = createCollection('My Collection');

        addBookToCollection(book.id, collection.id);
        expect(useLibraryStore.getState().collections[0].bookIds).toContain(book.id);

        removeBook(book.id);

        expect(useLibraryStore.getState().collections[0].bookIds).not.toContain(book.id);
      });
    });

    describe('getBook', () => {
      it('should return a book by ID', () => {
        const { addBook, getBook } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });

        const result = getBook(book.id);
        expect(result).toEqual(book);
      });

      it('should return undefined for non-existent ID', () => {
        const { getBook } = useLibraryStore.getState();

        const result = getBook('non-existent-id');
        expect(result).toBeUndefined();
      });
    });

    describe('updateReadingProgress', () => {
      it('should update progress and location', () => {
        const { addBook, updateReadingProgress } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });

        updateReadingProgress(book.id, 'cfi-location', 50);

        const { books } = useLibraryStore.getState();
        expect(books[0].currentLocation).toBe('cfi-location');
        expect(books[0].progress).toBe(50);
        expect(books[0].lastOpened).toBeDefined();
      });

      it('should change status from want-to-read to reading', () => {
        const { addBook, updateReadingProgress } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        expect(book.status).toBe('want-to-read');

        updateReadingProgress(book.id, 'cfi-location', 10);

        const { books } = useLibraryStore.getState();
        expect(books[0].status).toBe('reading');
      });

      it('should not change status if already reading or finished', () => {
        const { addBook, updateReadingProgress, setBookStatus } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        setBookStatus(book.id, 'finished');

        updateReadingProgress(book.id, 'cfi-location', 10);

        const { books } = useLibraryStore.getState();
        expect(books[0].status).toBe('finished');
      });
    });

    describe('updateReadingTime', () => {
      it('should accumulate reading time', () => {
        const { addBook, updateReadingTime } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        expect(book.readingTime).toBe(0);

        updateReadingTime(book.id, 100);
        expect(useLibraryStore.getState().books[0].readingTime).toBe(100);

        updateReadingTime(book.id, 50);
        expect(useLibraryStore.getState().books[0].readingTime).toBe(150);
      });
    });

    describe('setBookStatus', () => {
      it('should update book status', () => {
        const { addBook, setBookStatus } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });

        setBookStatus(book.id, 'reading');
        expect(useLibraryStore.getState().books[0].status).toBe('reading');

        setBookStatus(book.id, 'finished');
        expect(useLibraryStore.getState().books[0].status).toBe('finished');
      });
    });
  });

  describe('Collection Actions', () => {
    describe('createCollection', () => {
      it('should create a new collection', () => {
        const { createCollection } = useLibraryStore.getState();

        const collection = createCollection('My Collection');

        expect(collection.id).toBeDefined();
        expect(collection.name).toBe('My Collection');
        expect(collection.bookIds).toEqual([]);
        expect(collection.dateCreated).toBeDefined();
        expect(collection.sortOrder).toBe(0);

        const { collections } = useLibraryStore.getState();
        expect(collections).toHaveLength(1);
      });

      it('should increment sortOrder for new collections', () => {
        const { createCollection } = useLibraryStore.getState();

        createCollection('Collection 1');
        createCollection('Collection 2');
        createCollection('Collection 3');

        const { collections } = useLibraryStore.getState();
        expect(collections[0].sortOrder).toBe(0);
        expect(collections[1].sortOrder).toBe(1);
        expect(collections[2].sortOrder).toBe(2);
      });
    });

    describe('updateCollection', () => {
      it('should update collection properties', () => {
        const { createCollection, updateCollection } = useLibraryStore.getState();

        const collection = createCollection('Original Name');

        updateCollection(collection.id, { name: 'Updated Name' });

        const { collections } = useLibraryStore.getState();
        expect(collections[0].name).toBe('Updated Name');
      });
    });

    describe('deleteCollection', () => {
      it('should delete a collection', () => {
        const { createCollection, deleteCollection } = useLibraryStore.getState();

        const collection = createCollection('My Collection');

        deleteCollection(collection.id);

        const { collections } = useLibraryStore.getState();
        expect(collections).toHaveLength(0);
      });

      it('should remove collection ID from books', () => {
        const { addBook, createCollection, addBookToCollection, deleteCollection } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        const collection = createCollection('My Collection');

        addBookToCollection(book.id, collection.id);
        expect(useLibraryStore.getState().books[0].collectionIds).toContain(collection.id);

        deleteCollection(collection.id);

        expect(useLibraryStore.getState().books[0].collectionIds).not.toContain(collection.id);
      });
    });

    describe('addBookToCollection', () => {
      it('should add a book to a collection', () => {
        const { addBook, createCollection, addBookToCollection } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        const collection = createCollection('My Collection');

        addBookToCollection(book.id, collection.id);

        const { books, collections } = useLibraryStore.getState();
        expect(books[0].collectionIds).toContain(collection.id);
        expect(collections[0].bookIds).toContain(book.id);
      });

      it('should not add duplicate entries', () => {
        const { addBook, createCollection, addBookToCollection } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        const collection = createCollection('My Collection');

        addBookToCollection(book.id, collection.id);
        addBookToCollection(book.id, collection.id); // Try to add again

        const { books, collections } = useLibraryStore.getState();
        expect(books[0].collectionIds.filter(id => id === collection.id)).toHaveLength(1);
        expect(collections[0].bookIds.filter(id => id === book.id)).toHaveLength(1);
      });
    });

    describe('removeBookFromCollection', () => {
      it('should remove a book from a collection', () => {
        const { addBook, createCollection, addBookToCollection, removeBookFromCollection } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        const collection = createCollection('My Collection');

        addBookToCollection(book.id, collection.id);
        removeBookFromCollection(book.id, collection.id);

        const { books, collections } = useLibraryStore.getState();
        expect(books[0].collectionIds).not.toContain(collection.id);
        expect(collections[0].bookIds).not.toContain(book.id);
      });
    });
  });

  describe('Bookmark Actions', () => {
    describe('addBookmark', () => {
      it('should add a new bookmark', () => {
        const { addBook, addBookmark } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        const bookmark = addBookmark(book.id, 'cfi-location', 'Display text', 'My note');

        expect(bookmark.id).toBeDefined();
        expect(bookmark.bookId).toBe(book.id);
        expect(bookmark.location).toBe('cfi-location');
        expect(bookmark.displayText).toBe('Display text');
        expect(bookmark.note).toBe('My note');
        expect(bookmark.dateCreated).toBeDefined();

        const { bookmarks } = useLibraryStore.getState();
        expect(bookmarks).toHaveLength(1);
      });

      it('should add bookmark without optional fields', () => {
        const { addBook, addBookmark } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        const bookmark = addBookmark(book.id, 'cfi-location');

        expect(bookmark.displayText).toBeUndefined();
        expect(bookmark.note).toBeUndefined();
      });
    });

    describe('updateBookmark', () => {
      it('should update bookmark properties', () => {
        const { addBook, addBookmark, updateBookmark } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        const bookmark = addBookmark(book.id, 'cfi-location', 'Original text');

        updateBookmark(bookmark.id, { note: 'Updated note', displayText: 'Updated text' });

        const { bookmarks } = useLibraryStore.getState();
        expect(bookmarks[0].note).toBe('Updated note');
        expect(bookmarks[0].displayText).toBe('Updated text');
      });
    });

    describe('removeBookmark', () => {
      it('should remove a bookmark', () => {
        const { addBook, addBookmark, removeBookmark } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });
        const bookmark = addBookmark(book.id, 'cfi-location');

        removeBookmark(bookmark.id);

        const { bookmarks } = useLibraryStore.getState();
        expect(bookmarks).toHaveLength(0);
      });
    });

    describe('getBookBookmarks', () => {
      it('should return all bookmarks for a specific book', () => {
        const { addBook, addBookmark, getBookBookmarks } = useLibraryStore.getState();

        const book1 = addBook({ title: 'Book 1', author: 'Author', filePath: '/1.epub', fileType: 'epub' });
        const book2 = addBook({ title: 'Book 2', author: 'Author', filePath: '/2.epub', fileType: 'epub' });

        addBookmark(book1.id, 'loc1');
        addBookmark(book1.id, 'loc2');
        addBookmark(book2.id, 'loc3');

        const book1Bookmarks = getBookBookmarks(book1.id);
        expect(book1Bookmarks).toHaveLength(2);
        expect(book1Bookmarks.every(b => b.bookId === book1.id)).toBe(true);
      });

      it('should return empty array for book with no bookmarks', () => {
        const { addBook, getBookBookmarks } = useLibraryStore.getState();

        const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });

        const bookmarks = getBookBookmarks(book.id);
        expect(bookmarks).toEqual([]);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations on non-existent entities gracefully', () => {
      const { updateBook, removeBook, updateCollection, deleteCollection, updateBookmark, removeBookmark } = useLibraryStore.getState();

      // These should not throw
      expect(() => updateBook('fake-id', { title: 'Test' })).not.toThrow();
      expect(() => removeBook('fake-id')).not.toThrow();
      expect(() => updateCollection('fake-id', { name: 'Test' })).not.toThrow();
      expect(() => deleteCollection('fake-id')).not.toThrow();
      expect(() => updateBookmark('fake-id', { note: 'Test' })).not.toThrow();
      expect(() => removeBookmark('fake-id')).not.toThrow();
    });

    it('should handle concurrent operations', () => {
      const { addBook, updateBook, updateReadingProgress } = useLibraryStore.getState();

      const book = addBook({ title: 'Book', author: 'Author', filePath: '/book.epub', fileType: 'epub' });

      // Simulate concurrent updates
      updateBook(book.id, { title: 'Title 1' });
      updateReadingProgress(book.id, 'loc1', 25);
      updateBook(book.id, { title: 'Title 2' });
      updateReadingProgress(book.id, 'loc2', 50);

      const { books } = useLibraryStore.getState();
      expect(books[0].title).toBe('Title 2');
      expect(books[0].progress).toBe(50);
      expect(books[0].currentLocation).toBe('loc2');
    });
  });
});
