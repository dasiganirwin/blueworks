'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';

// ─── Styles ────────────────────────────────────────────────────────────────────

const STYLES = {
  success: 'bg-success-50 border-success-200 text-success-800',
  error:   'bg-danger-50 border-danger-200 text-danger-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
};

const CLOSE_STYLES = {
  success: 'text-success-600 hover:text-success-700',
  error:   'text-danger-600 hover:text-danger-700',
  info:    'text-blue-600 hover:text-blue-900',
};

const AUTO_DISMISS_MS = 3500;

// ─── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

// ─── Single Toast item (handles its own auto-dismiss timer) ───────────────────

function ToastItem({ id, message, type, onRemove }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [id, onRemove]);

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start justify-between gap-3 border rounded-lg px-4 py-3 text-sm shadow-lg',
        STYLES[type] ?? STYLES.info,
      )}
    >
      <span>{message}</span>
      <button
        onClick={() => onRemove(id)}
        aria-label="Dismiss notification"
        className={clsx('shrink-0 font-bold leading-none', CLOSE_STYLES[type] ?? CLOSE_STYLES.info)}
      >
        &times;
      </button>
    </div>
  );
}

// ─── ToastContainer — renders the active stack ────────────────────────────────

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
    >
      {toasts.map(({ id, message, type }) => (
        <ToastItem key={id} id={id} message={message} type={type} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ─── ToastProvider ────────────────────────────────────────────────────────────

let _nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = _nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
