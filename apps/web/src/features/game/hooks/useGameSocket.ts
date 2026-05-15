import { useEffect, useRef, useState } from 'react';
import { socket } from '@/shared/lib/socket';
import type { Cell } from '@tacfinity/shared';
import type {
  GameEndPayload,
  GameSyncPayload,
  MatchedPayload,
  QueueTimeoutPayload,
} from '@tacfinity/shared';
import { useAuthStore } from '@/features/auth/store';
import type { PlayerInfo } from '../types';

type MatchStatus = 'idle' | 'searching' | 'playing' | 'ended';

function buildPlayers(data: {
  yourSymbol: 'X' | 'O';
  yourRating: number;
  opponentUsername: string;
  opponentRating: number;
}): { X: PlayerInfo; O: PlayerInfo } {
  return {
    [data.yourSymbol]: { username: 'You', rating: data.yourRating },
    [data.yourSymbol === 'X' ? 'O' : 'X']: {
      username: data.opponentUsername,
      rating: data.opponentRating,
    },
  } as { X: PlayerInfo; O: PlayerInfo };
}

export function useGameSocket() {
  const updateRating = useAuthStore((s) => s.updateRating);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('idle');
  const [board, setBoard] = useState<Cell[]>(Array(225).fill(null));
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [activePlayer, setActivePlayer] = useState<'X' | 'O' | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [result, setResult] = useState<GameEndPayload | null>(null);
  const [queueTimedOut, setQueueTimedOut] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);
  const [drawOfferPending, setDrawOfferPending] = useState(false);
  const [drawDeclined, setDrawDeclined] = useState(false);
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

  useEffect(() => {
    socket.on('queue:timeout', (_data: QueueTimeoutPayload) => {
      updateMatchStatus('idle');
      setQueueTimedOut(true);
      socket.disconnect();
    });

    socket.on('queue:matched', (data: MatchedPayload) => {
      gameIdRef.current = data.gameId;
      mySymbolRef.current = data.yourSymbol;
      setMySymbol(data.yourSymbol);
      setPlayers(buildPlayers(data));
      setBoard(Array(225).fill(null));
      setMoves([]);
      setResult(null);
      setActivePlayer('X');
      setDrawOffered(false);
      setDrawOfferPending(false);
      setDrawDeclined(false);
      updateMatchStatus('playing');
    });

    socket.on('game:update', (data) => {
      const [, coords] = data.tgnToken.split(':');
      const [rowStr, colStr] = coords.split(',');
      const idx = parseInt(rowStr) * 15 + parseInt(colStr);
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
      setPlayers(buildPlayers(data));
      setResult(null);
      updateMatchStatus('playing');
    });

    socket.on('game:end', (data) => {
      setResult(data);
      setActivePlayer(null);
      setDrawOffered(false);
      setDrawOfferPending(false);
      setDrawDeclined(false);
      updateMatchStatus('ended');
      if (mySymbolRef.current) {
        updateRating(data.ratingDelta[mySymbolRef.current]);
      }
    });

    socket.on('game:draw-offered', () => {
      setDrawOffered(true);
    });

    socket.on('game:draw-declined', () => {
      setDrawOfferPending(false);
      setDrawDeclined(true);
      setTimeout(() => setDrawDeclined(false), 3000);
    });

    // On reconnect: re-join queue if still searching, or sync game state if mid-game
    socket.on('connect', () => {
      if (matchStatusRef.current === 'searching') {
        socket.emit('queue:join');
      } else if (matchStatusRef.current === 'playing' && gameIdRef.current) {
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
      if (matchStatusRef.current === 'searching') {
        socket.emit('queue:cancel');
      }
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('queue:timeout');
      socket.off('queue:matched');
      socket.off('game:update');
      socket.off('game:sync');
      socket.off('game:end');
      socket.off('game:draw-offered');
      socket.off('game:draw-declined');
    };
  }, [updateRating]);

  function resetToIdle() {
    updateMatchStatus('idle');
  }

  function joinQueue() {
    setQueueTimedOut(false);
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

  function resign() {
    if (matchStatusRef.current !== 'playing' || !gameIdRef.current) return;
    socket.emit('game:resign', { gameId: gameIdRef.current });
  }

  function offerDraw() {
    if (matchStatusRef.current !== 'playing' || !gameIdRef.current) return;
    setDrawOfferPending(true);
    socket.emit('game:draw-offer', { gameId: gameIdRef.current });
  }

  function respondToDraw(accepted: boolean) {
    if (!gameIdRef.current) return;
    setDrawOffered(false);
    socket.emit('game:draw-response', { gameId: gameIdRef.current, accepted });
  }

  return {
    matchStatus,
    board,
    mySymbol,
    activePlayer,
    moves,
    players,
    result,
    queueTimedOut,
    drawOffered,
    drawOfferPending,
    drawDeclined,
    resetToIdle,
    joinQueue,
    cancelQueue,
    makeMove,
    resign,
    offerDraw,
    respondToDraw,
  };
}
