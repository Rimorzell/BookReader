import { useReaderStore } from '../../stores';

interface ReaderBottomBarProps {
  visible: boolean;
  onHover: () => void;
}

export function ReaderBottomBar({
  visible,
  onHover,
}: ReaderBottomBarProps) {
  const { progress } = useReaderStore();

  const displayProgress = Math.min(100, Math.max(0, Math.round(progress || 0)));

  return (
    <footer
      className={`absolute bottom-0 left-0 right-0 z-40 flex justify-center py-4 transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      onMouseEnter={onHover}
    >
      <span className="text-sm text-[var(--text-muted)] font-serif italic tracking-wide">
        {displayProgress}%
      </span>
    </footer>
  );
}
