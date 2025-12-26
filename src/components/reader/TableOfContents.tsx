import type { TocItem } from '../../types';
interface TableOfContentsProps {
  isOpen: boolean;
  onClose: () => void;
  toc: TocItem[];
  onNavigate: (href: string) => void;
  currentHref?: string;
}
export function TableOfContents({
  isOpen,
  onClose,
  toc,
  onNavigate,
  currentHref,
}: TableOfContentsProps) {
  const handleNavigate = (href: string) => {
    onNavigate(href);
    onClose();
  };
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30"
          onClick={onClose}
        />
      )}
      {/* Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[80vw] bg-[var(--bg-primary)] shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Contents</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* TOC list */}
        <nav className="overflow-y-auto h-[calc(100%-64px)]">
          <TocList items={toc} onNavigate={handleNavigate} currentHref={currentHref} level={0} />
        </nav>
      </div>
    </>
  );
}
interface TocListProps {
  items: TocItem[];
  onNavigate: (href: string) => void;
  currentHref?: string;
  level: number;
}
function TocList({ items, onNavigate, currentHref, level }: TocListProps) {
  return (
    <ul className="py-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            onClick={() => onNavigate(item.href)}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-tertiary)] ${
              currentHref === item.href
                ? 'text-[var(--accent)] bg-[var(--bg-secondary)]'
                : 'text-[var(--text-primary)]'
            }`}
            style={{ paddingLeft: `${16 + level * 16}px` }}
          >
            {item.label}
          </button>
          {item.subitems && item.subitems.length > 0 && (
            <TocList
              items={item.subitems}
              onNavigate={onNavigate}
              currentHref={currentHref}
              level={level + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
