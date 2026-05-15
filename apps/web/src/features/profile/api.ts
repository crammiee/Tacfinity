import { useQuery } from '@tanstack/react-query';
import type { PublicProfile } from '@tacfinity/shared';
import { apiClient } from '@/shared/lib/axios';

export function usePublicProfile(userId: string) {
  return useQuery<PublicProfile>({
    queryKey: ['users', userId],
    queryFn: async () => {
      const res = (await apiClient.get(`/api/v1/users/${userId}`)) as { user: PublicProfile };
      return res.user;
    },
    enabled: !!userId,
  });
}
