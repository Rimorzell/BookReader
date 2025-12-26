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
    {
      id: 'all',
      label: 'All Books',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      count: books.length,
    },
    {
      id: 'reading',
      label: 'Currently Reading',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      count: books.filter((b) => b.status === 'reading').length,
    },
    {
      id: 'want-to-read',
      label: 'Want to Read',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
      count: books.filter((b) => b.status === 'want-to-read').length,
    },
    {
      id: 'finished',
      label: 'Finished',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      count: books.filter((b) => b.status === 'finished').length,
    },
  ];

  return (
    <aside className="w-[var(--sidebar-width)] h-full bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Library</h1>
      </div>

      {/* Add book button */}
      <div className="p-3">
        <button
          onClick={onAddBook}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Book
        </button>
      </div>

      {/* Filters */}
      <nav className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                selectedFilter === filter.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {filter.icon}
              <span className="flex-1 text-left text-sm font-medium">{filter.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedFilter === filter.id
                    ? 'bg-white/20'
                    : 'bg-[var(--bg-tertiary)]'
                }`}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Collections */}
        {collections.length > 0 && (
          <div className="mt-6">
            <h2 className="px-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Collections
            </h2>
            <div className="space-y-1">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => onFilterChange(`collection:${collection.id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedFilter === `collection:${collection.id}`
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="flex-1 text-left text-sm font-medium truncate">
                    {collection.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedFilter === `collection:${collection.id}`
                        ? 'bg-white/20'
                        : 'bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {collection.bookIds.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-2 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}
