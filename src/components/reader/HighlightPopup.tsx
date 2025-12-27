import { useEffect, useRef } from 'react';
import type { HighlightColor } from '../../types';

interface HighlightPopupProps {
  position: { x: number; y: number };
  onHighlight: (color: HighlightColor) => void;
  onRemove?: () => void;
  canRemove?: boolean;
  onClose: () => void;
}

const HIGHLIGHT_COLORS: { color: HighlightColor; bg: string; label: string }[] = [
  { color: 'yellow', bg: '#fef08a', label: 'Yellow' },
  { color: 'green', bg: '#bbf7d0', label: 'Green' },
  { color: 'blue', bg: '#bfdbfe', label: 'Blue' },
  { color: 'pink', bg: '#fbcfe8', label: 'Pink' },
  { color: 'purple', bg: '#ddd6fe', label: 'Purple' },
];

export function HighlightPopup({ position, onHighlight, onRemove, canRemove, onClose }: HighlightPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 flex items-center gap-1 px-2 py-1.5 bg-[var(--bg-primary)] rounded-lg shadow-lg border border-[var(--border)]"
      style={{
        left: Math.max(8, Math.min(position.x - 80, window.innerWidth - 180)),
        top: Math.max(8, position.y - 50),
      }}
    >
      {HIGHLIGHT_COLORS.map(({ color, bg, label }) => (
        <button
          key={color}
          onClick={() => onHighlight(color)}
          className="w-6 h-6 rounded-full border-2 border-transparent hover:border-[var(--text-secondary)] transition-all hover:scale-110"
          style={{ backgroundColor: bg }}
          aria-label={`Highlight ${label}`}
          title={label}
        />
      ))}
      {onRemove && (
        <button
          onClick={onRemove}
          disabled={!canRemove}
          className="ml-2 px-2 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}
