import { Button } from '../../shared/ui/button';
import { GameBoard } from './components/GameBoard';
import { SetupPanel } from './components/SetupPanel';
import { StatusBar } from './components/StatusBar';
import { useOfflineGame } from './useOfflineGame';

export function OfflineGamePage() {
  const {
    board,
    currentPlayer,
    isGameOver,
    winner,
    isDraw,
    winningCells,
    scores,
    settings,
    isAiThinking,
    handleCellClick,
    startGame,
    resetBoard,
    resetAll,
  } = useOfflineGame();

  const isGameActive = settings !== null;
  const isBoardDisabled = isGameOver || isAiThinking;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Tacfinity</h1>

      {!isGameActive ? (
        <SetupPanel onStart={startGame} />
      ) : (
        <>
          <StatusBar
            currentPlayer={currentPlayer}
            isGameOver={isGameOver}
            winner={winner}
            isDraw={isDraw}
            isAiThinking={isAiThinking}
            scores={scores}
          />

          <GameBoard
            board={board}
            cols={settings.cols}
            rows={settings.rows}
            winningCells={winningCells}
            isDisabled={isBoardDisabled}
            onCellClick={handleCellClick}
          />

          <div className="flex gap-3">
            <Button variant="outline" onClick={resetBoard}>
              New Game
            </Button>
            <Button
              variant="outline"
              className="text-slate-400 border-slate-600"
              onClick={resetAll}
            >
              Reset All
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
