import { createContext } from 'react';
import type { ToastContextType } from '../types/toast.types';

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
