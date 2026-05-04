import { useEffect } from 'react';
import { apiClient } from '@/shared/lib/axios';
import { useAuthStore } from './store';

export function useBootstrapAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

  useEffect(() => {
    (
      apiClient.post('/api/v1/auth/refresh', {}) as unknown as Promise<{
        user: { id: string; username: string; email: string };
      }>
    )
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setBootstrapping(false));
  }, []);
}
