import { apiRequest } from '../../api/client';

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login(username: string, password: string) {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ username, password }),
    });
  },

  getCurrentUser() {
    return apiRequest<{ user: AuthUser }>('/auth/me');
  },
};
