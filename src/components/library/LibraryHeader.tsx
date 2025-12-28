import { SearchInput, Dropdown } from '../common';

interface LibraryHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

export function LibraryHeader({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
}: LibraryHeaderProps) {
  const sortOptions = [
    { value: 'lastOpened', label: 'Recent' },
    { value: 'dateAdded', label: 'Added' },
    { value: 'title', label: 'Title' },
    { value: 'author', label: 'Author' },
  ];

  return (
    <header className="flex items-center gap-4 px-6 py-3 border-b border-[var(--border)]/50 bg-[var(--bg-primary)]">
      {/* Search */}
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search..."
        className="w-48"
      />

      <div className="flex-1" />

      {/* Sort */}
      <Dropdown
        options={sortOptions}
        value={sortBy}
        onChange={onSortChange}
        className="w-32"
      />

      {/* Sort order */}
      <button
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
      >
        <span className={`inline-block transition-transform duration-200 ${sortOrder === 'desc' ? 'rotate-180' : ''}`}>
          ↑
        </span>
      </button>

      {/* View mode toggle */}
      <div className="flex items-center border border-[var(--border)]/50">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`px-3 py-1.5 text-sm font-serif transition-colors duration-200 ${
            viewMode === 'grid'
              ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          title="Grid view"
        >
          Grid
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`px-3 py-1.5 text-sm font-serif transition-colors duration-200 border-l border-[var(--border)]/50 ${
            viewMode === 'list'
              ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          title="List view"
        >
          List
        </button>
      </div>
    </header>
  );
}
