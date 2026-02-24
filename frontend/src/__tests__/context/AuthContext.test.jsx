import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';

// Mock the API modules
jest.mock('@/lib/api', () => ({
  authApi: {
    login:  jest.fn(),
    logout: jest.fn(),
  },
  usersApi: {
    getMe: jest.fn(),
  },
}));

import { authApi, usersApi } from '@/lib/api';

const USER = { id: 'u-1', name: 'Jane', role: 'customer' };

function Consumer() {
  const { user, loading } = useAuthContext();
  if (loading) return <span>loading</span>;
  return <span>{user ? user.name : 'no-user'}</span>;
}

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
});

describe('AuthProvider', () => {
  it('shows no user when no token in localStorage', async () => {
    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByText('no-user')).toBeInTheDocument();
  });

  it('restores session by calling getMe when token present', async () => {
    localStorage.setItem('access_token', 'tok');
    usersApi.getMe.mockResolvedValue({ data: USER });

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('Jane')).toBeInTheDocument());
    expect(usersApi.getMe).toHaveBeenCalledTimes(1);
  });

  it('clears localStorage and shows no user when getMe fails', async () => {
    localStorage.setItem('access_token', 'bad-tok');
    usersApi.getMe.mockRejectedValue(new Error('401'));

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('no-user')).toBeInTheDocument());
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('login stores tokens and sets user', async () => {
    authApi.login.mockResolvedValue({
      data: { access_token: 'at', refresh_token: 'rt', user: USER },
    });

    function LoginConsumer() {
      const { login, user } = useAuthContext();
      return (
        <>
          <button onClick={() => login('jane@test.com', 'pass')}>Login</button>
          <span>{user ? user.name : 'none'}</span>
        </>
      );
    }

    render(<AuthProvider><LoginConsumer /></AuthProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(localStorage.getItem('access_token')).toBe('at');
    expect(localStorage.getItem('refresh_token')).toBe('rt');
    await waitFor(() => expect(screen.getByText('Jane')).toBeInTheDocument());
  });

  it('logout calls API and clears localStorage', async () => {
    localStorage.setItem('access_token', 'tok');
    usersApi.getMe.mockResolvedValue({ data: USER });
    authApi.logout.mockResolvedValue({});

    function LogoutConsumer() {
      const { logout, user } = useAuthContext();
      return (
        <>
          <button onClick={logout}>Logout</button>
          <span>{user ? user.name : 'none'}</span>
        </>
      );
    }

    render(<AuthProvider><LogoutConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('Jane')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(authApi.logout).toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBeNull();
    await waitFor(() => expect(screen.getByText('none')).toBeInTheDocument());
  });

  it('updateUser merges partial update', async () => {
    localStorage.setItem('access_token', 'tok');
    usersApi.getMe.mockResolvedValue({ data: USER });

    function UpdateConsumer() {
      const { updateUser, user } = useAuthContext();
      return (
        <>
          <button onClick={() => updateUser({ name: 'Updated' })}>Update</button>
          <span>{user?.name}</span>
        </>
      );
    }

    render(<AuthProvider><UpdateConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('Jane')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('throws when useAuthContext used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Bad() { useAuthContext(); return null; }
    expect(() => render(<Bad />)).toThrow('useAuthContext must be used inside <AuthProvider>');
    consoleError.mockRestore();
  });
});
