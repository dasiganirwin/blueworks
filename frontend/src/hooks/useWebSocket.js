'use client';
import { useEffect, useRef, useCallback } from 'react';

async function tryRefreshToken() {
  try {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) return null;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/token/refresh`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh_token }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

export function useWebSocket(handlers = {}) {
  const wsRef       = useRef(null);
  const handlersRef = useRef(handlers);
  const queueRef    = useRef([]);           // messages buffered while CONNECTING
  handlersRef.current = handlers;

  // Send a message — queues it if socket is not yet OPEN
  const safeSend = useCallback((msg) => {
    const ws = wsRef.current;
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    } else if (ws.readyState === WebSocket.CONNECTING) {
      queueRef.current.push(msg);
    }
    // CLOSING / CLOSED — drop silently
  }, []);

  const subscribeToJob = useCallback((jobId) => {
    safeSend(JSON.stringify({ event: 'job.subscribe', payload: { job_id: jobId } }));
  }, [safeSend]);

  const sendLocationPing = useCallback((lat, lng, jobId) => {
    safeSend(JSON.stringify({ event: 'worker.location_ping', payload: { lat, lng, job_id: jobId } }));
  }, [safeSend]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    let active  = true;  // cleared on unmount to prevent reconnect after cleanup
    let retried = false; // one-shot retry per effect lifecycle

    const connect = (accessToken) => {
      if (!active) return;
      const url = `${process.env.NEXT_PUBLIC_WS_URL}?token=${accessToken}`;
      const ws  = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[ws] connected');
        retried = false; // reset so future 4001s can retry again
        const queue = queueRef.current.splice(0);
        queue.forEach(msg => ws.send(msg));
      };

      ws.onclose = async (event) => {
        console.log('[ws] disconnected');
        // 4001 = server rejected the token; attempt a silent refresh + reconnect once
        if (event.code === 4001 && !retried && active) {
          retried = true;
          const freshToken = await tryRefreshToken();
          if (freshToken && active) connect(freshToken);
        }
      };

      ws.onerror   = (e) => console.error('[ws] error', e);
      ws.onmessage = ({ data }) => {
        try {
          const { event, payload } = JSON.parse(data);
          handlersRef.current[event]?.(payload);
        } catch { /* ignore malformed frames */ }
      };
    };

    connect(token);

    return () => {
      active = false;
      queueRef.current = [];
      wsRef.current?.close();
    };
  }, []);

  return { subscribeToJob, sendLocationPing };
}
