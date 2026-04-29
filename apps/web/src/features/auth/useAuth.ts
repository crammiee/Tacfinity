import { useAuthStore, AuthState } from '@/features/auth/store';

export function useAuth() {
  const user = useAuthStore((state: AuthState) => state.user);
  const isLoggedIn = useAuthStore((state: AuthState) => state.isLoggedIn);

  return { user, isLoggedIn };
}
