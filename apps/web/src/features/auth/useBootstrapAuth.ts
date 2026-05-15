import { useEffect } from 'react';
import { apiClient } from '@/shared/lib/axios';
import { useAuthStore } from './store';

export function useBootstrapAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

  useEffect(() => {
    const cachedToken = localStorage.getItem('access_token');
    const cachedUser = localStorage.getItem('cached_user');

    if (!cachedToken && !cachedUser) {
      setBootstrapping(false);
      return;
    }

    const config = cachedToken ? { headers: { Authorization: `Bearer ${cachedToken}` } } : {};

    (
      apiClient.post('/api/v1/auth/refresh', {}, config) as unknown as Promise<{
        user: { id: string; username: string; email: string; rating: number };
        accessToken: string;
      }>
    )
      .then((data) => {
        setUser(data.user, data.accessToken);
        localStorage.setItem('cached_user', JSON.stringify(data.user));
      })
      .catch((err) => {
        const isNetworkError = !err.response;
        if (isNetworkError && cachedToken) {
          const raw = localStorage.getItem('cached_user');
          if (raw) setUser(JSON.parse(raw), cachedToken);
          return;
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('cached_user');
      })
      .finally(() => setBootstrapping(false));
  }, [setUser, setBootstrapping]);
}
