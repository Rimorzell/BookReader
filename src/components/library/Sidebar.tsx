import { useNavigate } from 'react-router-dom';
import { useLibraryStore } from '../../stores';

interface SidebarProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  onAddBook: () => void;
}

export function Sidebar({ selectedFilter, onFilterChange, onAddBook }: SidebarProps) {
  const navigate = useNavigate();
  const { books, collections } = useLibraryStore();

  const filters = [
    { id: 'all', label: 'All Books', count: books.length },
    { id: 'reading', label: 'Reading', count: books.filter((b) => b.status === 'reading').length },
    { id: 'want-to-read', label: 'Want to Read', count: books.filter((b) => b.status === 'want-to-read').length },
    { id: 'finished', label: 'Finished', count: books.filter((b) => b.status === 'finished').length },
  ];

  return (
    <aside className="w-[var(--sidebar-width)] h-full bg-[var(--bg-secondary)] border-r border-[var(--border)]/50 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)]/50">
        <h1 className="text-xl font-serif text-[var(--text-primary)]">Library</h1>
      </div>

      {/* Add book button */}
      <div className="p-4">
        <button
          onClick={onAddBook}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] font-serif hover:bg-[var(--bg-tertiary)] transition-colors duration-200"
        >
          <span className="text-lg">+</span>
          <span>Add Book</span>
        </button>
      </div>

      {/* Filters */}
      <nav className="flex-1 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`w-full flex items-center justify-between px-3 py-2 font-serif transition-colors duration-200 ${
                selectedFilter === filter.id
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'
              }`}
            >
              <span className="text-sm">{filter.label}</span>
              <span className="text-xs text-[var(--text-muted)]">{filter.count}</span>
            </button>
          ))}
        </div>

        {/* Collections */}
        {collections.length > 0 && (
          <div className="mt-6">
            <h2 className="px-3 text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 font-serif">
              Collections
            </h2>
            <div className="space-y-0.5">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => onFilterChange(`collection:${collection.id}`)}
                  className={`w-full flex items-center justify-between px-3 py-2 font-serif transition-colors duration-200 ${
                    selectedFilter === `collection:${collection.id}`
                      ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'
                  }`}
                >
                  <span className="text-sm truncate">{collection.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">{collection.bookIds.length}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)]/50">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-2 px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 font-serif text-sm"
        >
          Settings
        </button>
      </div>
    </aside>
  );
}
