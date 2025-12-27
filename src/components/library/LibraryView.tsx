import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { LibraryHeader } from './LibraryHeader';
import { LibraryGrid } from './LibraryGrid';
import { useSettingsStore, useLibraryStore } from '../../stores';
import { openFileDialog } from '../../utils';
import { parseEpubMetadata } from '../../utils/epubParser';

export function LibraryView() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { settings, setLibrarySortBy, setLibrarySortOrder, setLibraryViewMode } = useSettingsStore();
  const { addBook, updateBook } = useLibraryStore();

  const handleAddBook = useCallback(async () => {
    const file = await openFileDialog();
    if (!file) return;

    try {
      if (file.type === 'epub') {
        const metadata = await parseEpubMetadata(file.data.buffer as ArrayBuffer);

        const newBook = addBook({
          title: metadata.title,
          author: metadata.author,
          description: metadata.description,
          coverPath: metadata.coverDataUrl || metadata.coverUrl,
          filePath: file.path,
          fileType: 'epub',
        });

        // Persist inline cover if available so it renders before opening
        if (metadata.coverDataUrl) {
          updateBook(newBook.id, { coverPath: metadata.coverDataUrl });
        }
      } else if (file.type === 'pdf') {
        // For PDF, we'll use the filename as title
        const title = file.name.replace(/\.pdf$/i, '');
        addBook({
          title,
          author: 'Unknown Author',
          filePath: file.path,
          fileType: 'pdf',
        });
      }
    } catch (error) {
      console.error('Failed to import book:', error);
    }
  }, [addBook, updateBook]);

  return (
    <div className="flex h-full">
      <Sidebar
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        onAddBook={handleAddBook}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <LibraryHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={settings.library.viewMode}
          onViewModeChange={setLibraryViewMode}
          sortBy={settings.library.sortBy}
          onSortChange={(sort) => setLibrarySortBy(sort as typeof settings.library.sortBy)}
          sortOrder={settings.library.sortOrder}
          onSortOrderChange={setLibrarySortOrder}
        />

        <div className="flex-1 overflow-y-auto">
          <LibraryGrid
            filter={selectedFilter}
            searchQuery={searchQuery}
          />
        </div>
      </main>
    </div>
  );
}
