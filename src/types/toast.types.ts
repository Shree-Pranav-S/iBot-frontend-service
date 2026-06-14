/**
 * toast.types.ts
 *
 * Type definitions for the application-wide toast notification system.
 */

export type ToastVariant = 'error' | 'success' | 'info' | 'warning';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number; // ms before auto-dismiss (default 5000, 0 = no auto-dismiss)
}

export interface ToastContextType {
  toasts: Toast[];
  toast: (options: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  /** Convenience shorthands */
  error: (title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}
