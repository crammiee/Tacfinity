import { useParams } from 'react-router-dom';
import type { GameHistoryEntry } from '@tacfinity/shared';
import { ApiError } from '@/shared/lib/axios';
import { usePublicProfile } from './api';

export function ProfilePage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isPending, error } = usePublicProfile(id ?? '');

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Player not found.
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Something went wrong. Please try again.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col max-w-2xl mx-auto px-6 py-10 gap-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold uppercase">
          {profile.username[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <p className="text-muted-foreground text-sm">♟ {profile.rating.toLocaleString()} ELO</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Game History</h2>
        {profile.gameHistory.length === 0 ? (
          <p className="text-muted-foreground text-sm">No games played yet.</p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left font-medium">
                    Opponent
                  </th>
                  <th scope="col" className="px-4 py-2 text-left font-medium">
                    Result
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Rating
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {profile.gameHistory.map((entry) => (
                  <tr key={entry.gameId} className="border-t">
                    <td className="px-4 py-2">{entry.opponent.username}</td>
                    <td className="px-4 py-2">
                      <ResultBadge result={entry.result} />
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {entry.ratingAfter !== null && (
                        <RatingDelta before={entry.ratingBefore} after={entry.ratingAfter} />
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {entry.endedAt ? formatDate(entry.endedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ResultBadge({ result }: { result: GameHistoryEntry['result'] }): React.ReactElement {
  const styles: Record<GameHistoryEntry['result'], string> = {
    win: 'text-green-600 font-semibold',
    loss: 'text-destructive font-semibold',
    draw: 'text-muted-foreground',
  };
  return <span className={styles[result]}>{result.charAt(0).toUpperCase() + result.slice(1)}</span>;
}

function RatingDelta({ before, after }: { before: number; after: number }): React.ReactElement {
  const delta = after - before;
  const sign = delta >= 0 ? '+' : '';
  const color =
    delta > 0 ? 'text-green-600' : delta < 0 ? 'text-destructive' : 'text-muted-foreground';
  return (
    <span>
      {after.toLocaleString()}{' '}
      <span className={color}>
        ({sign}
        {delta})
      </span>
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
