import { renderHook, act } from '@testing-library/react';
import { useToast } from '@/hooks/useToast';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useToast', () => {
  it('starts with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('success() adds a toast with type "success"', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('Saved!');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Saved!');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('error() adds a toast with type "error"', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.error('Something went wrong');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Something went wrong');
    expect(result.current.toasts[0].type).toBe('error');
  });

  it('auto-removes toast after the default 4000ms', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('Temp');
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => jest.advanceTimersByTime(4000));
    expect(result.current.toasts).toHaveLength(0);
  });

  it('toast is still present before expiry', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('Still here');
    });
    act(() => jest.advanceTimersByTime(3999));
    expect(result.current.toasts).toHaveLength(1);
  });

  it('can hold multiple toasts at once', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('First');
      result.current.error('Second');
    });
    expect(result.current.toasts).toHaveLength(2);
  });

  it('each toast has a unique id', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.success('A'); });
    // Advance fake clock so Date.now() returns a different value
    act(() => jest.advanceTimersByTime(1));
    act(() => { result.current.success('B'); });
    const [a, b] = result.current.toasts;
    expect(a.id).not.toBe(b.id);
  });

  it('all toasts expire after 4000ms', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('One');
      result.current.error('Two');
    });
    expect(result.current.toasts).toHaveLength(2);
    act(() => jest.advanceTimersByTime(4000));
    expect(result.current.toasts).toHaveLength(0);
  });
});
