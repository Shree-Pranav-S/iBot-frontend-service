/**
 * ToastContext.tsx
 *
 * Provides application-wide toast notifications.
 * Wrap the app root with <ToastProvider> and call useToast() anywhere.
 *
 * The Toaster component renders a portal-free fixed overlay at the top-right
 * of the viewport, stacking toasts with smooth enter/exit animations.
 */

import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import type { Toast, ToastVariant } from '../types/toast.types';
import { ToastContext } from './toastContextDefinition';

// ── Context ───────────────────────────────────────────────────────────────────

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 5000;

const VARIANT_STYLES: Record<ToastVariant, {
  container: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  progress: string;
}> = {
  error: {
    container: 'border-red-200 bg-white',
    icon: <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />,
    title: 'text-red-800',
    message: 'text-red-600',
    progress: 'bg-red-400',
  },
  success: {
    container: 'border-emerald-200 bg-white',
    icon: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />,
    title: 'text-emerald-800',
    message: 'text-emerald-600',
    progress: 'bg-emerald-400',
  },
  info: {
    container: 'border-indigo-200 bg-white',
    icon: <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />,
    title: 'text-indigo-800',
    message: 'text-indigo-600',
    progress: 'bg-indigo-400',
  },
  warning: {
    container: 'border-amber-200 bg-white',
    icon: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />,
    title: 'text-amber-800',
    message: 'text-amber-600',
    progress: 'bg-amber-400',
  },
};

// ── Individual Toast Item ─────────────────────────────────────────────────────

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const duration = toast.duration ?? DEFAULT_DURATION;

  // Trigger enter animation on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  // Auto-dismiss
  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, dismiss]);

  const styles = VARIANT_STYLES[toast.variant];

  return (
    <div
      className={`
        relative flex w-full max-w-sm gap-3 rounded-xl border p-4 shadow-lg
        transition-all duration-300 ease-out overflow-hidden
        ${styles.container}
        ${visible && !leaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="assertive"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${styles.progress}`} />

      {/* Icon */}
      <div className="ml-1">{styles.icon}</div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${styles.title}`}>{toast.title}</p>
        {toast.message && (
          <p className={`mt-0.5 text-xs leading-relaxed ${styles.message}`}>{toast.message}</p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className="shrink-0 rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Progress bar (auto-dismiss indicator) */}
      {duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-0.5 ${styles.progress} opacity-40`}
          style={{
            width: '100%',
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
};

// ── Toaster overlay ───────────────────────────────────────────────────────────

interface ToasterProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const Toaster: React.FC<ToasterProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${counterRef.current++}`;
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const error = useCallback(
    (title: string, message?: string) => toast({ variant: 'error', title, message }),
    [toast],
  );

  const success = useCallback(
    (title: string, message?: string) => toast({ variant: 'success', title, message }),
    [toast],
  );

  const info = useCallback(
    (title: string, message?: string) => toast({ variant: 'info', title, message }),
    [toast],
  );

  const warning = useCallback(
    (title: string, message?: string) => toast({ variant: 'warning', title, message }),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, error, success, info, warning }}>
      {/* Inject the progress bar keyframe once */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};
