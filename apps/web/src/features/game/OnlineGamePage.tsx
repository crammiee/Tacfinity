import { useGameSocket } from './hooks/useGameSocket';
import { GameBoard } from './components/GameBoard';
import { MatchmakingTimer } from './components/MatchmakingTimer';
import { RightPanel } from './components/RightPanel';
import { GameResultOverlay } from './components/GameResultOverlay';
import { Button } from '@/shared/ui/button';
import { useAuthStore } from '@/features/auth/store';

export function OnlineGamePage() {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const {
    dbg,
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
  } = useGameSocket();

  function handleCellClick(idx: number) {
    // Only send move when it is your turn
    if (activePlayer !== mySymbol) return;
    const row = Math.floor(idx / 11);
    const col = idx % 11;
    makeMove(row, col);
  }

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full relative">
      {dbg && (
        <p className="fixed top-0 left-0 right-0 z-50 bg-black text-white text-xs p-2 text-center break-all">
          {dbg} | tok:{hasToken ? 'ok' : 'NULL'}
        </p>
      )}

      {/* Center — board area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        {matchStatus === 'idle' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-sm">
              Find an opponent and start a ranked game.
            </p>
            <Button size="lg" onClick={joinQueue}>
              Find Match
            </Button>
          </div>
        )}

        {matchStatus === 'searching' && (
          <div className="flex flex-col items-center gap-4">
            <MatchmakingTimer searching />
            <Button variant="outline" onClick={cancelQueue}>
              Cancel
            </Button>
          </div>
        )}

        {(matchStatus === 'playing' || matchStatus === 'ended') && (
          <>
            <p className="text-sm text-muted-foreground">
              {matchStatus === 'playing'
                ? activePlayer === mySymbol
                  ? 'Your turn'
                  : "Opponent's turn"
                : result?.winner === mySymbol
                  ? 'You won!'
                  : result?.winner === 'draw'
                    ? "It's a draw!"
                    : 'You lost.'}
            </p>
            <GameBoard
              board={board}
              winCells={[]}
              disabled={matchStatus === 'ended' || activePlayer !== mySymbol}
              onCellClick={handleCellClick}
            />
          </>
        )}
      </div>

      {/* Right panel */}
      {(matchStatus === 'playing' || matchStatus === 'ended') && (
        <RightPanel
          moves={moves}
          mySymbol={mySymbol}
          players={players}
          activePlayer={activePlayer}
        />
      )}

      {/* Result overlay — rendered on top of the board */}
      {matchStatus === 'ended' && result && mySymbol && (
        <GameResultOverlay result={result} mySymbol={mySymbol} onPlayAgain={joinQueue} />
      )}
    </div>
  );
}
