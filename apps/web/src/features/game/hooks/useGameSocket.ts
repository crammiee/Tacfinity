import { useEffect, useRef, useState } from 'react';
import { socket } from '@/shared/lib/socket';
import type { Cell } from '@tacfinity/shared';
import type { GameEndPayload, GameSyncPayload, MatchedPayload } from '@tacfinity/shared';
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
  // Mirrors matchStatus so socket event closures always see the current value
  const matchStatusRef = useRef<MatchStatus>('idle');

  function updateMatchStatus(status: MatchStatus) {
    matchStatusRef.current = status;
    setMatchStatus(status);
  }

  function buildPlayers(
    yourSymbol: 'X' | 'O',
    yourRating: number,
    opponentUsername: string,
    opponentRating: number
  ): { X: PlayerInfo; O: PlayerInfo } {
    return {
      [yourSymbol]: { username: 'You', rating: yourRating },
      [yourSymbol === 'X' ? 'O' : 'X']: { username: opponentUsername, rating: opponentRating },
    } as { X: PlayerInfo; O: PlayerInfo };
  }

  useEffect(() => {
    socket.on('queue:matched', (data: MatchedPayload) => {
      gameIdRef.current = data.gameId;
      mySymbolRef.current = data.yourSymbol;
      setMySymbol(data.yourSymbol);
      setPlayers(
        buildPlayers(data.yourSymbol, data.yourRating, data.opponentUsername, data.opponentRating)
      );
      setBoard(Array(121).fill(null));
      setMoves([]);
      setResult(null);
      setActivePlayer('X');
      updateMatchStatus('playing');
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

    socket.on('game:sync', (data: GameSyncPayload) => {
      gameIdRef.current = data.gameId;
      mySymbolRef.current = data.yourSymbol;
      setMySymbol(data.yourSymbol);
      setBoard(data.board);
      setMoves(data.moves);
      setActivePlayer(data.nextPlayer);
      setPlayers(
        buildPlayers(data.yourSymbol, data.yourRating, data.opponentUsername, data.opponentRating)
      );
      setResult(null);
      updateMatchStatus('playing');
    });

    socket.on('game:end', (data) => {
      setResult(data);
      setActivePlayer(null);
      updateMatchStatus('ended');
      if (mySymbolRef.current) {
        updateRating(data.ratingDelta[mySymbolRef.current]);
      }
    });

    // On reconnect: if we were mid-game, request a full state sync from the server
    socket.on('connect', () => {
      if (matchStatusRef.current === 'playing' && gameIdRef.current) {
        socket.emit('game:sync', { gameId: gameIdRef.current });
      }
    });

    socket.on('disconnect', (reason) => {
      // Intentional disconnect (cancelQueue / logout): reset fully
      // Transient drop: keep 'playing' so the connect handler above can request sync
      if (reason === 'io client disconnect') {
        updateMatchStatus('idle');
      }
    });

    socket.on('connect_error', () => {
      // Only reset when not already in a game — server holds the session for 30s
      if (matchStatusRef.current !== 'playing') {
        updateMatchStatus('idle');
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('queue:matched');
      socket.off('game:update');
      socket.off('game:sync');
      socket.off('game:end');
    };
  }, [updateRating]);

  function joinQueue() {
    updateMatchStatus('searching');
    socket.auth = { token: useAuthStore.getState().accessToken };
    if (socket.connected) {
      socket.emit('queue:join');
    } else {
      socket.once('connect', () => socket.emit('queue:join'));
      socket.connect();
    }
  }

  function cancelQueue() {
    socket.disconnect();
    updateMatchStatus('idle');
  }

  function makeMove(row: number, col: number) {
    if (matchStatusRef.current !== 'playing' || !gameIdRef.current) return;
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
