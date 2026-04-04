import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from './authApi';
import {
  bootstrapAuthSession,
  clearAuthenticatedSession,
  getAuthState,
  setAuthenticatedSession,
} from './authStore';

vi.mock('./authApi', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthenticatedSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('stores token and user when session is set', () => {
    setAuthenticatedSession(
      {
        id: 1,
        username: 'admin',
        displayName: 'Admin',
      },
      'token-123',
    );

    expect(localStorage.getItem('token')).toBe('token-123');
    expect(getAuthState().user?.username).toBe('admin');
    expect(getAuthState().status).toBe('authenticated');
  });

  it('bootstraps current user from stored token', async () => {
    localStorage.setItem('token', 'persisted-token');
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      user: {
        id: 1,
        username: 'admin',
        displayName: 'Admin',
      },
    });

    await bootstrapAuthSession();

    expect(authApi.getCurrentUser).toHaveBeenCalled();
    expect(getAuthState().user?.username).toBe('admin');
  });
});
