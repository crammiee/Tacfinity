import { useEffect } from 'react';
import { apiClient } from '@/shared/lib/axios';
import { useAuthStore } from './store';

export function useBootstrapAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

  useEffect(() => {
    const cachedToken = localStorage.getItem('access_token');
    const config = cachedToken ? { headers: { Authorization: `Bearer ${cachedToken}` } } : {};

    (
      apiClient.post('/api/v1/auth/refresh', {}, config) as unknown as Promise<{
        user: { id: string; username: string; email: string; rating: number };
        accessToken: string;
      }>
    )
      .then((data) => setUser(data.user, data.accessToken))
      .catch(() => {
        localStorage.removeItem('access_token');
      })
      .finally(() => setBootstrapping(false));
  }, []);
}
