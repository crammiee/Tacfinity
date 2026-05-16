import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Cell } from '@tacfinity/shared';
import { useGameSocket } from './hooks/useGameSocket';
import { useAuth } from '@/features/auth/useAuth';
import { Toaster } from './components/Toaster';
import { GameBoard } from './components/GameBoard';
import { MatchmakingTimer } from './components/MatchmakingTimer';
import { RightPanel } from './components/RightPanel';
import { GameResultOverlay } from './components/GameResultOverlay';
import { MatchLayout } from './components/MatchLayout';
import { OnlineGameControls } from './components/OnlineGameControls';
import { Button } from '@/shared/ui/button';

const BOARD_COLS = 15;
const EMPTY_BOARD: Cell[] = Array<Cell>(BOARD_COLS * BOARD_COLS).fill(null);

function buildStatusText(
  winner: 'X' | 'O' | 'draw' | undefined,
  mySymbol: 'X' | 'O' | null,
  activePlayer: 'X' | 'O' | null,
  isEnded: boolean
): string {
  if (isEnded) {
    if (winner === 'draw') return "It's a draw!";
    return winner === mySymbol ? 'You won!' : 'You lost.';
  }
  return activePlayer === mySymbol ? 'Your turn' : "Opponent's turn";
}

export function OnlineGamePage(): React.ReactElement {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const resumeAttempted = useRef(false);

  const {
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
  } = useGameSocket();

  const { user } = useAuth();

  // On mount with a code in URL, attempt to rejoin the match
  useEffect(() => {
    if (!code || resumeAttempted.current || matchStatus !== 'idle') return;
    resumeAttempted.current = true;
    resumeFromCode(code);
  }, [code, matchStatus, resumeFromCode]);

  // When roomCode is learned (fresh match or successful resume), sync the URL
  useEffect(() => {
    if (!roomCode) return;
    const target = `/play/online/${roomCode}`;
    if (location.pathname !== target) navigate(target, { replace: true });
  }, [roomCode, navigate]);

  // If resume failed (status back to idle, no roomCode set), strip the code from URL
  useEffect(() => {
    if (code && matchStatus === 'idle' && !roomCode && resumeAttempted.current) {
      navigate('/play/online', { replace: true });
    }
  }, [code, matchStatus, roomCode, navigate]);

  function handleResetToIdle(): void {
    resetToIdle();
    if (code ?? roomCode) navigate('/play/online', { replace: true });
  }
  const isPlaying = matchStatus === 'playing' || matchStatus === 'ended';
  const opponentSymbol: 'X' | 'O' | null = mySymbol ? (mySymbol === 'X' ? 'O' : 'X') : null;
  const opponent = opponentSymbol ? players[opponentSymbol] : null;

  function handleCellClick(idx: number): void {
    if (activePlayer !== mySymbol) return;
    makeMove(Math.floor(idx / BOARD_COLS), idx % BOARD_COLS);
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1 h-full relative pb-16 md:pb-0">
      <Toaster />
      <MatchLayout
        opponent={{
          username: opponent?.username ?? (matchStatus === 'searching' ? 'Searching…' : 'Opponent'),
          rating: opponent?.rating,
          symbol: opponentSymbol ?? undefined,
          isActive: matchStatus === 'playing' && activePlayer === opponentSymbol,
        }}
        me={{
          username: user?.username ?? 'You',
          rating: user?.rating,
          symbol: mySymbol ?? undefined,
          isActive: matchStatus === 'playing' && activePlayer === mySymbol,
        }}
      >
        {isPlaying && (
          <p className="text-sm text-muted-foreground">
            {buildStatusText(result?.winner, mySymbol, activePlayer, matchStatus === 'ended')}
          </p>
        )}
        <GameBoard
          board={isPlaying ? board : EMPTY_BOARD}
          cols={BOARD_COLS}
          winCells={[]}
          disabled={!isPlaying || matchStatus === 'ended' || activePlayer !== mySymbol}
          onCellClick={handleCellClick}
        />
      </MatchLayout>

      {isPlaying ? (
        <RightPanel moves={moves} mySymbol={mySymbol} players={players} activePlayer={activePlayer}>
          {matchStatus === 'playing' && (
            <OnlineGameControls
              drawOffered={drawOffered}
              drawOfferPending={drawOfferPending}
              drawDeclined={drawDeclined}
              respondToDraw={respondToDraw}
              offerDraw={offerDraw}
              resign={resign}
            />
          )}
        </RightPanel>
      ) : (
        <aside className="w-full lg:w-64 lg:shrink-0 border-t lg:border-t-0 lg:border-l flex flex-col justify-center gap-6 p-6">
          {matchStatus === 'searching' ? (
            <>
              <MatchmakingTimer searching />
              <Button size="lg" variant="outline" className="w-full" onClick={cancelQueue}>
                Cancel
              </Button>
            </>
          ) : matchStatus === 'resuming' ? (
            <p className="text-sm text-muted-foreground">Reconnecting…</p>
          ) : (
            <>
              {queueTimedOut && (
                <p className="text-sm text-muted-foreground">
                  No one seems to be in queue right now — try again later.
                </p>
              )}
              <Button size="lg" className="w-full" onClick={joinQueue}>
                {queueTimedOut ? 'Try Again' : 'Find Match'}
              </Button>
            </>
          )}
        </aside>
      )}

      {matchStatus === 'ended' && result && mySymbol && (
        <GameResultOverlay
          winner={result.winner}
          mySymbol={mySymbol}
          ratingDelta={result.ratingDelta[mySymbol]}
          onPlayAgain={handleResetToIdle}
        />
      )}
    </div>
  );
}
