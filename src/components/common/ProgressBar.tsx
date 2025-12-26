interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'accent' | 'success' | 'warning';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  color = 'accent',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colors = {
    accent: 'bg-[var(--accent)]',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`h-full ${colors[color]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[var(--text-secondary)] min-w-[3ch]">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
