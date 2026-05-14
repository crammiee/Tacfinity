import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  rating: number;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch('/api/v1/leaderboard?n=10');
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export function Leaderboard() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 60_000,
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (isError) return <p className="text-destructive text-sm">Failed to load leaderboard.</p>;

  return (
    <section className="w-full max-w-lg">
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
              <span className="flex-1">{row.username}</span>
              <span className="text-muted-foreground">♟ {row.rating.toLocaleString()} ELO</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
