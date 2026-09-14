'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Kind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: Kind;
  message: string;
}

const ToastContext = createContext<{ push: (kind: Kind, message: string) => void } | null>(null);

const STYLES: Record<Kind, string> = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  error: 'border-flag-300 bg-flag-50 text-flag-900',
  info: 'border-navy-200 bg-navy-50 text-navy-900',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: Kind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[80] w-full max-w-sm space-y-2 px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm font-medium shadow-pop animate-fade-up ${STYLES[t.kind]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
