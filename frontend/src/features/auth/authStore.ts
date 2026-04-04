import { createStore } from '../../app/createStore';
import { authApi } from './authApi';
import type { AuthUser } from './authApi';

type AuthStatus = 'bootstrapping' | 'authenticated' | 'anonymous';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
}

const initialToken = localStorage.getItem('token');

const authStore = createStore<AuthState>({
  user: null,
  token: initialToken,
  status: initialToken ? 'bootstrapping' : 'anonymous',
});

export const useAuthStore = authStore.useStore;
export const getAuthState = authStore.getState;

function persistToken(token: string | null) {
  if (token) {
    localStorage.setItem('token', token);
    return;
  }

  localStorage.removeItem('token');
}

export function setAuthenticatedSession(user: AuthUser, token: string) {
  persistToken(token);
  authStore.setState({
    user,
    token,
    status: 'authenticated',
  });
}

export function clearAuthenticatedSession() {
  persistToken(null);
  authStore.setState({
    user: null,
    token: null,
    status: 'anonymous',
  });
}

export async function bootstrapAuthSession() {
  const token = localStorage.getItem('token');
  if (!token) {
    clearAuthenticatedSession();
    return;
  }

  authStore.setState({ status: 'bootstrapping', token });

  try {
    const response = await authApi.getCurrentUser();
    setAuthenticatedSession(response.user, token);
  } catch {
    clearAuthenticatedSession();
  }
}
