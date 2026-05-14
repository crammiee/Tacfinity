import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/axios';

interface GameHistoryEntry {
  gameId: string;
  opponent: { id: string; username: string };
  result: 'win' | 'loss' | 'draw';
  ratingBefore: number;
  ratingAfter: number | null;
  endedAt: string | null;
}

export interface PublicProfile {
  id: string;
  username: string;
  rating: number;
  gameHistory: GameHistoryEntry[];
}

export function usePublicProfile(userId: string) {
  return useQuery<PublicProfile>({
    queryKey: ['users', userId],
    queryFn: async () => {
      const res = (await apiClient.get(`/api/v1/users/${userId}`)) as { profile: PublicProfile };
      return res.profile;
    },
    enabled: !!userId,
  });
}
