import { useEffect, useRef } from 'react';
import { PlayerLabel } from '@/shared/components/PlayerLabel';
import type { PlayerInfo } from '../types';

interface Props {
  moves: string[];
  mySymbol: 'X' | 'O' | null;
  players: { X: PlayerInfo | null; O: PlayerInfo | null };
  activePlayer: 'X' | 'O' | null;
  children?: React.ReactNode;
}

export function RightPanel({ moves, mySymbol, players, activePlayer, children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  const opponentSymbol = mySymbol === 'X' ? 'O' : 'X';

  return (
    <aside className="w-full lg:w-64 lg:shrink-0 border-t lg:border-t-0 lg:border-l flex flex-col max-h-48 lg:max-h-none lg:h-full">
      <div className="flex flex-col gap-3 p-4 border-b">
        {players[opponentSymbol] && (
          <PlayerLabel
            username={players[opponentSymbol]!.username}
            rating={players[opponentSymbol]!.rating}
            symbol={opponentSymbol}
            isActive={activePlayer === opponentSymbol}
          />
        )}
        {players[mySymbol ?? 'X'] && (
          <PlayerLabel
            username={players[mySymbol ?? 'X']!.username}
            rating={players[mySymbol ?? 'X']!.rating}
            symbol={mySymbol ?? undefined}
            isMe
            isActive={activePlayer === mySymbol}
          />
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        {moves.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center mt-4">No moves yet</p>
        ) : (
          moves.map((token, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-5 shrink-0">{i + 1}.</span>
              <span className="font-mono">{token}</span>
            </div>
          ))
        )}
      </div>
      {children && <div className="p-3 border-t flex flex-col gap-2">{children}</div>}
    </aside>
  );
}
