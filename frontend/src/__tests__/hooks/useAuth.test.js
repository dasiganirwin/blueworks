import { renderHook } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

import { useAuthContext } from '@/context/AuthContext';

const CUSTOMER = { id: 'u-1', role: 'customer' };
const WORKER   = { id: 'u-2', role: 'worker' };

beforeEach(() => {
  jest.resetAllMocks();
});

describe('useAuth', () => {
  it('redirects to /login when not authenticated', () => {
    useAuthContext.mockReturnValue({ user: null, loading: false });
    renderHook(() => useAuth());
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('redirects to / when user has wrong role', () => {
    useAuthContext.mockReturnValue({ user: WORKER, loading: false });
    renderHook(() => useAuth('customer'));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('does not redirect when authenticated with correct role', () => {
    useAuthContext.mockReturnValue({ user: CUSTOMER, loading: false });
    renderHook(() => useAuth('customer'));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not redirect when no required role specified', () => {
    useAuthContext.mockReturnValue({ user: CUSTOMER, loading: false });
    renderHook(() => useAuth());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does nothing while loading', () => {
    useAuthContext.mockReturnValue({ user: null, loading: true });
    renderHook(() => useAuth());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns the auth context', () => {
    const ctx = { user: CUSTOMER, loading: false, login: jest.fn() };
    useAuthContext.mockReturnValue(ctx);
    const { result } = renderHook(() => useAuth());
    expect(result.current).toBe(ctx);
  });
});
