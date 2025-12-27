import { useEffect, useState } from 'react';
import { useToastStore, type Toast as ToastType } from '../../stores/toastStore';

const TOAST_ICONS: Record<ToastType['type'], string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const TOAST_COLORS: Record<ToastType['type'], string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useToastStore();
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toast.id), 200);
  };

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 200);

      return () => clearTimeout(exitTimer);
    }
  }, [toast.duration]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg bg-[var(--bg-secondary)] border border-[var(--border)] min-w-[300px] max-w-[400px] transition-all duration-200 ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
      role="alert"
    >
      <div className={`flex-shrink-0 w-6 h-6 rounded-full ${TOAST_COLORS[toast.type]} flex items-center justify-center`}>
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={TOAST_ICONS[toast.type]}
          />
        </svg>
      </div>
      <p className="flex-1 text-sm text-[var(--text-primary)]">{toast.message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
        aria-label="Dismiss"
      >
        <svg
          className="w-4 h-4 text-[var(--text-secondary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
