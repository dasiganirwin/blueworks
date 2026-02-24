'use client';
import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket(handlers = {}) {
  const wsRef       = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers; // keep ref fresh without re-connecting

  const subscribeToJob = useCallback((jobId) => {
    wsRef.current?.send(JSON.stringify({ event: 'job.subscribe', payload: { job_id: jobId } }));
  }, []);

  const sendLocationPing = useCallback((lat, lng, jobId) => {
    wsRef.current?.send(JSON.stringify({ event: 'worker.location_ping', payload: { lat, lng, job_id: jobId } }));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const url = `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen    = () => console.log('[ws] connected');
    ws.onclose   = () => console.log('[ws] disconnected');
    ws.onerror   = (e) => console.error('[ws] error', e);
    ws.onmessage = ({ data }) => {
      try {
        const { event, payload } = JSON.parse(data);
        handlersRef.current[event]?.(payload);
      } catch { /* ignore malformed frames */ }
    };

    return () => ws.close();
  }, []);

  return { subscribeToJob, sendLocationPing };
}
