import { useAuth } from '@/features/auth/useAuth';

const STUB_ROWS = [
  { rank: 1, username: 'playerA', rating: 2341 },
  { rank: 2, username: 'playerB', rating: 2180 },
  { rank: 3, username: 'playerC', rating: 2054 },
  { rank: 4, username: 'playerD', rating: 1987 },
  { rank: 5, username: 'playerE', rating: 1902 },
];

export function Leaderboard() {
  const { user } = useAuth();

  return (
    <section className="w-full max-w-lg">
      <h2 className="text-xl font-bold mb-4">Top Players</h2>
      <div className="rounded-lg border divide-y">
        {STUB_ROWS.map((row) => {
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
