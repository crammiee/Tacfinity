import { useQuery } from '@tanstack/react-query';
import type { LeaderboardEntry } from '@tacfinity/shared';
import { apiClient } from '@/shared/lib/axios';
import { useAuth } from '@/features/auth/useAuth';

export function Leaderboard(): React.ReactElement {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = (await apiClient.get('/api/v1/leaderboard?limit=10')) as {
        items: LeaderboardEntry[];
      };
      return res.items;
    },
    staleTime: 60_000,
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (isError) return <p className="text-destructive text-sm">Failed to load leaderboard.</p>;

  return (
    <section className="w-md">
      <h2 className="text-xl font-bold mb-4">Top Players</h2>
      <div className="rounded-lg border divide-y">
        {data?.map((row) => {
          const isMe = user?.username === row.username;
          return (
            <div
              key={row.rank}
              className={`flex items-center gap-3 px-4 py-3 text-sm ${
                isMe ? 'bg-accent font-semibold' : ''
              }`}
            >
              <span className="text-muted-foreground w-6 shrink-0">#{row.rank}</span>
              <span className="mr-auto">{row.username}</span>
              <span className="text-muted-foreground shrink-0 whitespace-nowrap">
                ♟ {row.rating.toLocaleString()} ELO
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
