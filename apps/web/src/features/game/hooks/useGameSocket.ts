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
import { toast } from '@/shared/lib/toast';
import type { PlayerInfo, MatchStatus } from '../types';

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

  const [roomCode, setRoomCode] = useState<string | null>(null);

  const gameIdRef = useRef<string | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const mySymbolRef = useRef<'X' | 'O' | null>(null);
  const matchStatusRef = useRef<MatchStatus>('idle');
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateMatchStatus(status: MatchStatus): void {
    matchStatusRef.current = status;
    setMatchStatus(status);
  }

  function resetDrawState(): void {
    setDrawOffered(false);
    setDrawOfferPending(false);
    setDrawDeclined(false);
  }

  useEffect(() => {
    socket.on('queue:timeout', (_data: QueueTimeoutPayload) => {
      updateMatchStatus('idle');
      setQueueTimedOut(true);
      socket.disconnect();
    });

    socket.on('queue:matched', (data: MatchedPayload) => {
      gameIdRef.current = data.gameId;
      roomCodeRef.current = data.roomCode;
      setRoomCode(data.roomCode);
      mySymbolRef.current = data.yourSymbol;
      setMySymbol(data.yourSymbol);
      setPlayers(buildPlayers(data));
      setBoard(Array(225).fill(null));
      setMoves([]);
      setResult(null);
      setActivePlayer('X');
      resetDrawState();
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
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
      gameIdRef.current = data.gameId;
      roomCodeRef.current = data.roomCode;
      setRoomCode(data.roomCode);
      mySymbolRef.current = data.yourSymbol;
      setMySymbol(data.yourSymbol);
      setBoard(data.board);
      setMoves(data.moves);
      setActivePlayer(data.nextPlayer);
      setPlayers(buildPlayers(data));
      setResult(null);
      updateMatchStatus('playing');
    });

    socket.on('game:error', (data) => {
      if (matchStatusRef.current !== 'resuming') return;
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
      if (data.error.code === 'GAME_ENDED') {
        toast.info('That match has already ended.');
      } else if (data.error.code === 'FORBIDDEN') {
        toast.error("You're not a player in that match.");
      } else {
        toast.error('Could not rejoin match.');
      }
      socket.disconnect();
      updateMatchStatus('idle');
    });

    socket.on('game:end', (data) => {
      setResult(data);
      setActivePlayer(null);
      resetDrawState();
      updateMatchStatus('ended');
      if (mySymbolRef.current) {
        updateRating(data.ratingDelta[mySymbolRef.current]);
      }
    });

    socket.on('game:draw-offered', () => setDrawOffered(true));

    socket.on('game:draw-declined', () => {
      setDrawOfferPending(false);
      setDrawDeclined(true);
      setTimeout(() => setDrawDeclined(false), 3000);
    });

    socket.on('connect', () => {
      if (matchStatusRef.current === 'searching') {
        socket.emit('queue:join');
      } else if (matchStatusRef.current === 'playing' && gameIdRef.current) {
        socket.emit('game:sync', { gameId: gameIdRef.current });
      }
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') {
        updateMatchStatus('idle');
      }
    });

    socket.on('connect_error', () => {
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
      socket.off('game:error');
      socket.off('game:draw-offered');
      socket.off('game:draw-declined');
    };
  }, [updateRating]);

  function resetToIdle(): void {
    updateMatchStatus('idle');
    roomCodeRef.current = null;
    setRoomCode(null);
  }

  function resumeFromCode(code: string): void {
    updateMatchStatus('resuming');
    socket.auth = { token: useAuthStore.getState().accessToken };

    resumeTimeoutRef.current = setTimeout(() => {
      if (matchStatusRef.current === 'resuming') {
        toast.error('Could not rejoin match.');
        socket.disconnect();
        updateMatchStatus('idle');
      }
    }, 10_000);

    const emit = () => socket.emit('game:sync', { roomCode: code });
    if (socket.connected) {
      emit();
    } else {
      socket.once('connect', emit);
      socket.connect();
    }
  }

  function joinQueue(): void {
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

  function cancelQueue(): void {
    socket.disconnect();
    updateMatchStatus('idle');
  }

  function makeMove(row: number, col: number): void {
    if (matchStatusRef.current !== 'playing' || !gameIdRef.current) return;
    socket.emit('game:move', { gameId: gameIdRef.current, row, col });
  }

  function resign(): void {
    if (matchStatusRef.current !== 'playing' || !gameIdRef.current) return;
    socket.emit('game:resign', { gameId: gameIdRef.current });
  }

  function offerDraw(): void {
    if (matchStatusRef.current !== 'playing' || !gameIdRef.current) return;
    setDrawOfferPending(true);
    socket.emit('game:draw-offer', { gameId: gameIdRef.current });
  }

  function respondToDraw(accepted: boolean): void {
    if (!gameIdRef.current) return;
    setDrawOffered(false);
    socket.emit('game:draw-response', { gameId: gameIdRef.current, accepted });
  }

  return {
    matchStatus,
    roomCode,
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
    resumeFromCode,
    joinQueue,
    cancelQueue,
    makeMove,
    resign,
    offerDraw,
    respondToDraw,
  };
}
