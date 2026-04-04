import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { registerUnauthorizedHandler } from '../api/client';
import { bootstrapAuthSession, clearAuthenticatedSession } from '../features/auth/authStore';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearAuthenticatedSession();
    });
    void bootstrapAuthSession();

    return () => registerUnauthorizedHandler(null);
  }, []);

  return children;
}
