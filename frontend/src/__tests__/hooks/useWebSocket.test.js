import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';

let mockWS;

beforeEach(() => {
  localStorage.clear();
  mockWS = {
    send:       jest.fn(),
    close:      jest.fn(),
    onopen:     null,
    onmessage:  null,
    onclose:    null,
    onerror:    null,
    readyState: 1, // OPEN
  };
  global.WebSocket            = jest.fn(() => mockWS);
  global.WebSocket.CONNECTING = 0;
  global.WebSocket.OPEN       = 1;
  global.WebSocket.CLOSING    = 2;
  global.WebSocket.CLOSED     = 3;
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.WebSocket;
  delete global.fetch;
});

describe('useWebSocket', () => {
  it('does not create a WebSocket when no token', () => {
    renderHook(() => useWebSocket());
    expect(global.WebSocket).not.toHaveBeenCalled();
  });

  it('creates a WebSocket connection with token when token present', () => {
    localStorage.setItem('access_token', 'test-token');
    process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:4000';

    renderHook(() => useWebSocket());

    expect(global.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('test-token')
    );
  });

  it('closes WebSocket on unmount', () => {
    localStorage.setItem('access_token', 'tok');
    const { unmount } = renderHook(() => useWebSocket());
    unmount();
    expect(mockWS.close).toHaveBeenCalled();
  });

  it('subscribeToJob sends job.subscribe event', () => {
    localStorage.setItem('access_token', 'tok');
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.subscribeToJob('job-abc');
    });

    expect(mockWS.send).toHaveBeenCalledWith(
      JSON.stringify({ event: 'job.subscribe', payload: { job_id: 'job-abc' } })
    );
  });

  it('sendLocationPing sends worker.location_ping event', () => {
    localStorage.setItem('access_token', 'tok');
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.sendLocationPing(14.5995, 120.9842, 'job-xyz');
    });

    expect(mockWS.send).toHaveBeenCalledWith(
      JSON.stringify({ event: 'worker.location_ping', payload: { lat: 14.5995, lng: 120.9842, job_id: 'job-xyz' } })
    );
  });

  it('queues subscribeToJob message while CONNECTING and flushes on open', () => {
    localStorage.setItem('access_token', 'tok');
    mockWS.readyState = 0; // CONNECTING

    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.subscribeToJob('job-queued');
    });

    // Not sent yet — still connecting
    expect(mockWS.send).not.toHaveBeenCalled();

    // Simulate WebSocket opening
    act(() => {
      mockWS.readyState = 1;
      mockWS.onopen();
    });

    expect(mockWS.send).toHaveBeenCalledWith(
      JSON.stringify({ event: 'job.subscribe', payload: { job_id: 'job-queued' } })
    );
  });

  it('dispatches incoming messages to the correct handler', () => {
    localStorage.setItem('access_token', 'tok');
    const onStatus = jest.fn();

    renderHook(() => useWebSocket({ 'job.status_updated': onStatus }));

    act(() => {
      mockWS.onmessage({ data: JSON.stringify({ event: 'job.status_updated', payload: { status: 'accepted' } }) });
    });

    expect(onStatus).toHaveBeenCalledWith({ status: 'accepted' });
  });

  it('silently ignores malformed WebSocket frames', () => {
    localStorage.setItem('access_token', 'tok');
    renderHook(() => useWebSocket());

    expect(() => {
      act(() => {
        mockWS.onmessage({ data: 'not-json' });
      });
    }).not.toThrow();
  });

  it('ignores events with no registered handler', () => {
    localStorage.setItem('access_token', 'tok');
    const handler = jest.fn();

    renderHook(() => useWebSocket({ 'some.event': handler }));

    act(() => {
      mockWS.onmessage({ data: JSON.stringify({ event: 'other.event', payload: {} }) });
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('refreshes token and reconnects once on 4001 unauthorized close', async () => {
    localStorage.setItem('access_token', 'expired-tok');
    localStorage.setItem('refresh_token', 'valid-refresh');
    process.env.NEXT_PUBLIC_WS_URL  = 'ws://localhost:4000';
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api/v1';

    const freshToken = 'fresh-access-tok';
    global.fetch.mockResolvedValueOnce({
      ok:   true,
      json: () => Promise.resolve({ access_token: freshToken }),
    });

    renderHook(() => useWebSocket());

    // Simulate server rejecting with 4001 (expired token)
    await act(async () => {
      await mockWS.onclose({ code: 4001 });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/token/refresh'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(localStorage.getItem('access_token')).toBe(freshToken);
    // Second WebSocket created with fresh token
    expect(global.WebSocket).toHaveBeenCalledTimes(2);
    expect(global.WebSocket).toHaveBeenLastCalledWith(
      expect.stringContaining(freshToken)
    );
  });

  it('does not reconnect on 4001 when refresh_token is missing', async () => {
    localStorage.setItem('access_token', 'expired-tok');
    // No refresh_token set
    renderHook(() => useWebSocket());

    await act(async () => {
      await mockWS.onclose({ code: 4001 });
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(global.WebSocket).toHaveBeenCalledTimes(1);
  });

  it('does not retry 4001 more than once', async () => {
    localStorage.setItem('access_token', 'expired-tok');
    localStorage.setItem('refresh_token', 'valid-refresh');
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api/v1';

    const freshToken = 'fresh-access-tok';
    global.fetch.mockResolvedValue({
      ok:   true,
      json: () => Promise.resolve({ access_token: freshToken }),
    });

    renderHook(() => useWebSocket());

    // First 4001 — should retry
    await act(async () => {
      await mockWS.onclose({ code: 4001 });
    });
    // Second 4001 on the new connection — should NOT retry again
    await act(async () => {
      await mockWS.onclose({ code: 4001 });
    });

    // fetch called only once (the first retry)
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.WebSocket).toHaveBeenCalledTimes(2);
  });
});
