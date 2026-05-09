import { useGameSocket } from './hooks/useGameSocket';
import { GameBoard } from './components/GameBoard';
import { MatchmakingTimer } from './components/MatchmakingTimer';
import { RightPanel } from './components/RightPanel';
import { GameResultOverlay } from './components/GameResultOverlay';
import { Button } from '@/shared/ui/button';

export function OnlineGamePage() {
  const {
    matchStatus,
    board,
    mySymbol,
    activePlayer,
    moves,
    players,
    result,
    debug,
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
      {/* Center — board area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        {debug.socketError && (
          <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded max-w-xs text-center break-all">
            {debug.socketError} | token: {String(debug.hasToken)}
          </p>
        )}

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
