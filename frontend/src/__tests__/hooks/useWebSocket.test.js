import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';

let mockWS;

beforeEach(() => {
  localStorage.clear();
  mockWS = {
    send:      jest.fn(),
    close:     jest.fn(),
    onopen:    null,
    onmessage: null,
    onclose:   null,
    onerror:   null,
    readyState: 1,
  };
  global.WebSocket = jest.fn(() => mockWS);
});

afterEach(() => {
  delete global.WebSocket;
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
});
