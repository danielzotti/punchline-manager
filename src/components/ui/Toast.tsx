'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string) => toast(message, 'success'), [toast]);
  const error = useCallback((message: string) => toast(message, 'error'), [toast]);
  const info = useCallback((message: string) => toast(message, 'info'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] flex flex-col gap-2.5 max-w-full sm:max-w-md sm:w-auto pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 w-full sm:min-w-[340px] animate-slide-up ${
              t.type === 'success'
                ? 'bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                : t.type === 'error'
                ? 'bg-red-500/10 dark:bg-red-500/5 border-red-500/25 text-red-700 dark:text-red-400'
                : 'bg-blue-500/10 dark:bg-blue-500/5 border-blue-500/25 text-blue-700 dark:text-blue-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />}
              {t.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400" />}
              {t.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 text-blue-500 dark:text-blue-400" />}
              <span className="text-sm font-semibold leading-5">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-current opacity-60 hover:opacity-100 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
