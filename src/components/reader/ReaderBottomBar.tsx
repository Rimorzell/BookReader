import { useReaderStore } from '../../stores';

interface ReaderBottomBarProps {
  visible: boolean;
  onHover: () => void;
}

export function ReaderBottomBar({
  visible,
  onHover,
}: ReaderBottomBarProps) {
  const {
    totalLocations,
    currentPage: storedCurrentPage,
    totalPages: storedTotalPages,
  } = useReaderStore();

  const totalPages = totalLocations || storedTotalPages || 1;
  const currentPage = Math.min(totalPages, Math.max(1, storedCurrentPage || 1));

  return (
    <footer
      className={`absolute bottom-0 left-0 right-0 z-40 flex justify-center py-4 transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      onMouseEnter={onHover}
    >
      <span className="text-sm text-[var(--text-muted)] font-serif italic tracking-wide">
        {currentPage} / {totalPages}
      </span>
    </footer>
  );
}
