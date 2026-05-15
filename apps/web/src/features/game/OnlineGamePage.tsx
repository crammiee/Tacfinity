import { useState } from 'react';
import type { Cell } from '@tacfinity/shared';
import { useGameSocket } from './hooks/useGameSocket';
import { useAuth } from '@/features/auth/useAuth';
import { GameBoard } from './components/GameBoard';
import { MatchmakingTimer } from './components/MatchmakingTimer';
import { RightPanel } from './components/RightPanel';
import { GameResultOverlay } from './components/GameResultOverlay';
import { MatchLayout } from './components/MatchLayout';
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

export function OnlineGamePage() {
  const {
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
    joinQueue,
    cancelQueue,
    makeMove,
    resign,
    offerDraw,
    respondToDraw,
  } = useGameSocket();

  const { user } = useAuth();
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmDraw, setConfirmDraw] = useState(false);
  const isPlaying = matchStatus === 'playing' || matchStatus === 'ended';
  const opponentSymbol: 'X' | 'O' | null = mySymbol ? (mySymbol === 'X' ? 'O' : 'X') : null;
  const opponent = opponentSymbol ? players[opponentSymbol] : null;

  function handleCellClick(idx: number) {
    if (activePlayer !== mySymbol) return;
    makeMove(Math.floor(idx / BOARD_COLS), idx % BOARD_COLS);
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1 h-full relative pb-16 md:pb-0">
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
            <>
              {drawOffered ? (
                <>
                  <p className="text-xs text-muted-foreground text-center">
                    Opponent offers a draw
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => respondToDraw(true)}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => respondToDraw(false)}
                    >
                      Decline
                    </Button>
                  </div>
                </>
              ) : confirmDraw ? (
                <>
                  <p className="text-xs text-muted-foreground text-center">Offer a draw?</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setConfirmDraw(false);
                        offerDraw();
                      }}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setConfirmDraw(false)}
                    >
                      No
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setConfirmDraw(true)}
                    disabled={drawOfferPending}
                  >
                    {drawOfferPending ? 'Draw offered…' : 'Offer Draw'}
                  </Button>
                  {drawDeclined && (
                    <p className="text-xs text-muted-foreground text-center">
                      Opponent declined your draw offer
                    </p>
                  )}
                </>
              )}
              {confirmResign ? (
                <>
                  <p className="text-xs text-muted-foreground text-center">
                    Are you sure you want to resign?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setConfirmResign(false);
                        resign();
                      }}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setConfirmResign(false)}
                    >
                      No
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => setConfirmResign(true)}
                >
                  Resign
                </Button>
              )}
            </>
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
          onPlayAgain={joinQueue}
        />
      )}
    </div>
  );
}
