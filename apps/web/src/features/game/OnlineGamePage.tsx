import type { Cell } from '@tacfinity/shared';
import { useGameSocket } from './hooks/useGameSocket';
import { GameBoard } from './components/GameBoard';
import { MatchmakingTimer } from './components/MatchmakingTimer';
import { RightPanel } from './components/RightPanel';
import { GameResultOverlay } from './components/GameResultOverlay';
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
    joinQueue,
    cancelQueue,
    makeMove,
  } = useGameSocket();

  const isPlaying = matchStatus === 'playing' || matchStatus === 'ended';

  function handleCellClick(idx: number) {
    if (activePlayer !== mySymbol) return;
    makeMove(Math.floor(idx / BOARD_COLS), idx % BOARD_COLS);
  }

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full relative">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
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
      </div>

      {isPlaying ? (
        <RightPanel
          moves={moves}
          mySymbol={mySymbol}
          players={players}
          activePlayer={activePlayer}
        />
      ) : (
        <aside className="w-full md:w-64 md:shrink-0 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-6 p-6">
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
