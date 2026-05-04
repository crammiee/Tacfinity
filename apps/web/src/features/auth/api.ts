import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/lib/axios';
import { useAuthStore } from './store';
import type { RegisterInput, LoginInput } from '@tacfinity/shared';

interface LoginResponse {
  user: { id: string; username: string; email: string };
}

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

export function useLoginMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<LoginResponse> => {
      return apiClient.post('/api/v1/auth/login', input) as unknown as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data.user);
      navigate('/');
    },
  });
}

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
