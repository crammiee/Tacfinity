import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/lib/axios';
import { useAuthStore } from './store';
import type { RegisterInput, LoginInput } from '@tacfinity/shared';

export function useRegisterMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      return apiClient.post('/api/v1/auth/register', input);
    },
    onSuccess: () => {
      navigate('/login?registered=true');
    },
  });
}

/**
 * Login mutation
 * POST /api/v1/auth/login
 * On success: store user in auth store and navigate to play page
 */
export function useLoginMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      return apiClient.post('/api/v1/auth/login', input);
    },
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data.user);
      navigate('/play');
    },
  });
}

/**
 * Logout mutation
 * POST /api/v1/auth/logout
 * On success: clear user from store and navigate to login page
 */
export function useLogoutMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async () => {
      return apiClient.post('/api/v1/auth/logout', {});
    },
    onSuccess: () => {
      useAuthStore.getState().clearUser();
      navigate('/login');
    },
  });
}
