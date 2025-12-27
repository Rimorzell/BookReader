import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { LibraryHeader } from './LibraryHeader';
import { LibraryGrid } from './LibraryGrid';
import { useSettingsStore, useLibraryStore, toast } from '../../stores';
import { openFileDialog } from '../../utils';
import { parseEpubMetadata } from '../../utils/epubParser';

export function LibraryView() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { settings, setLibrarySortBy, setLibrarySortOrder, setLibraryViewMode } = useSettingsStore();
  const { addBook } = useLibraryStore();

  const handleAddBook = useCallback(async () => {
    try {
      const file = await openFileDialog();
      if (!file) return;

      const metadata = await parseEpubMetadata(file.data.buffer as ArrayBuffer);

      let coverPath: string | undefined;
      if (metadata.coverUrl) {
        coverPath = metadata.coverUrl;
      }

      addBook({
        title: metadata.title,
        author: metadata.author,
        description: metadata.description,
        coverPath,
        filePath: file.path,
        fileType: 'epub',
      });
      toast.success(`Added "${metadata.title}" to library`);
    } catch (error) {
      console.error('Failed to import book:', error);
      const message = error instanceof Error ? error.message : 'Failed to import book';
      toast.error(message);
    }
  }, [addBook]);

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
