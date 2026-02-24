'use client';
import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const success = useCallback((msg) => toast({ message: msg, type: 'success' }), [toast]);
  const error   = useCallback((msg) => toast({ message: msg, type: 'error' }),   [toast]);

  return { toasts, success, error };
}
