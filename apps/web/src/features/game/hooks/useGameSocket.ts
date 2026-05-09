import { useEffect, useRef, useState } from 'react';
import { socket } from '@/shared/lib/socket';
import type { Cell } from '@tacfinity/shared';
import type { GameEndPayload, MatchedPayload } from '@tacfinity/shared';
import { useAuthStore } from '@/features/auth/store';
import type { PlayerInfo } from '../types';

type MatchStatus = 'idle' | 'searching' | 'playing' | 'ended';

export function useGameSocket() {
  const updateRating = useAuthStore((s) => s.updateRating);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('idle');
  const [board, setBoard] = useState<Cell[]>(Array(121).fill(null));
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [activePlayer, setActivePlayer] = useState<'X' | 'O' | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [result, setResult] = useState<GameEndPayload | null>(null);
  const [players, setPlayers] = useState<{ X: PlayerInfo | null; O: PlayerInfo | null }>({
    X: null,
    O: null,
  });
  const gameIdRef = useRef<string | null>(null);
  const mySymbolRef = useRef<'X' | 'O' | null>(null);

  useEffect(() => {
    socket.on('queue:matched', (data: MatchedPayload) => {
      gameIdRef.current = data.gameId;
      mySymbolRef.current = data.yourSymbol;
      setMySymbol(data.yourSymbol);
      setPlayers({
        [data.yourSymbol]: { username: 'You', rating: data.yourRating },
        [data.yourSymbol === 'X' ? 'O' : 'X']: {
          username: data.opponentUsername,
          rating: data.opponentRating,
        },
      } as { X: PlayerInfo; O: PlayerInfo });
      setBoard(Array(121).fill(null));
      setMoves([]);
      setResult(null);
      setActivePlayer('X');
      setMatchStatus('playing');
    });

    socket.on('game:update', (data) => {
      const [, coords] = data.tgnToken.split(':');
      const [rowStr, colStr] = coords.split(',');
      const idx = parseInt(rowStr) * 11 + parseInt(colStr);
      const player = data.tgnToken[0] as 'X' | 'O';
      setBoard((prev) => {
        const next = [...prev];
        next[idx] = player;
        return next;
      });
      setMoves((prev) => [...prev, data.tgnToken]);
      setActivePlayer(data.nextPlayer);
    });

    socket.on('game:end', (data) => {
      setResult(data);
      setActivePlayer(null);
      setMatchStatus('ended');
      if (mySymbolRef.current) {
        updateRating(data.ratingDelta[mySymbolRef.current]);
      }
    });

    socket.on('connect_error', () => {
      setMatchStatus('idle');
    });

    return () => {
      socket.off('connect_error');
      socket.off('queue:matched');
      socket.off('game:update');
      socket.off('game:end');
    };
  }, []);

  function joinQueue() {
    setMatchStatus('searching');
    if (socket.connected) {
      socket.emit('queue:join');
    } else {
      socket.once('connect', () => socket.emit('queue:join'));
      socket.connect();
    }
  }

  function cancelQueue() {
    socket.disconnect();
    setMatchStatus('idle');
  }

  function makeMove(row: number, col: number) {
    if (matchStatus !== 'playing' || !gameIdRef.current) return;
    socket.emit('game:move', { gameId: gameIdRef.current, row, col });
  }

  return {
    matchStatus,
    board,
    mySymbol,
    activePlayer,
    moves,
    players,
    result,
    joinQueue,
    cancelQueue,
    makeMove,
  };
}
