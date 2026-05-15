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

  if (isLoading)
    return (
      <section className="w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Top Players</h2>
        <div className="rounded-lg border divide-y">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-6 h-4 rounded bg-muted animate-pulse shrink-0" />
              <div className="h-4 rounded bg-muted animate-pulse mr-auto w-28" />
              <div className="h-4 rounded bg-muted animate-pulse w-20 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    );

  if (isError) return <p className="text-destructive text-sm">Failed to load leaderboard.</p>;

  return (
    <section className="w-full max-w-md">
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
              <span className="flex-1 min-w-0 truncate">{row.username}</span>
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
