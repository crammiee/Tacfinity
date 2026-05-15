import { useState } from 'react';
import type { Player } from '@tacfinity/shared';
import { Button } from '@/shared/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { GameBoard } from './components/GameBoard';
import { GameResultOverlay } from './components/GameResultOverlay';
import { MatchLayout } from './components/MatchLayout';
import { BoardSettings } from './components/BoardSettings';
import { DifficultyPicker } from './components/DifficultyPicker';
import { SidePicker } from './components/SidePicker';
import { useBotGame } from './hooks/useBotGame';
import { MIN_DIM } from './hooks/useBoardSettings';
import type { BotGamePhase } from './types';
import { BOT_META } from './constants';

function buildStatusText(
  phase: BotGamePhase,
  winner: Player | 'draw' | null,
  humanSide: Player,
  isAiThinking: boolean,
  botName: string
): string {
  if (phase === 'gameover') {
    if (winner === 'draw') return "It's a draw!";
    if (winner === humanSide) return 'You win!';
    return `${botName} wins!`;
  }
  if (isAiThinking) return `${botName} is thinking…`;
  return 'Your turn';
}

export function BotGamePage(): React.ReactElement {
  const { user } = useAuth();
  const [confirmResign, setConfirmResign] = useState(false);
  const game = useBotGame();
  const bot = BOT_META[game.difficulty];
  const isSetupDisabled = game.phase === 'playing';
  const botSide: Player = game.humanSide === 'X' ? 'O' : 'X';
  const activePlayer: Player | null =
    game.phase === 'playing' ? (game.isAiThinking ? botSide : game.humanSide) : null;

  return (
    <div className="flex flex-col lg:flex-row flex-1 h-full relative">
      <MatchLayout
        opponent={{
          username: bot.name,
          rating: bot.rating,
          isActive: game.phase === 'playing' && activePlayer === botSide,
        }}
        me={{
          username: user?.username ?? 'You',
          rating: user?.rating,
          isActive: game.phase === 'playing' && activePlayer === game.humanSide,
        }}
      >
        {game.phase !== 'setup' && (
          <p className="text-sm text-muted-foreground">
            {buildStatusText(game.phase, game.winner, game.humanSide, game.isAiThinking, bot.name)}
          </p>
        )}
        <GameBoard
          board={game.phase === 'setup' ? Array(MIN_DIM * MIN_DIM).fill(null) : game.board}
          cols={game.phase === 'setup' ? MIN_DIM : game.cols}
          winCells={game.winCells}
          disabled={game.phase !== 'playing' || game.isAiThinking}
          onCellClick={game.handleCellClick}
        />
      </MatchLayout>

      {game.phase === 'gameover' && game.winner && (
        <GameResultOverlay
          winner={game.winner}
          mySymbol={game.humanSide}
          onPlayAgain={game.resetToSetup}
        />
      )}

      <aside className="w-full lg:w-64 lg:shrink-0 border-t lg:border-t-0 lg:border-l flex flex-col justify-center gap-6 p-6">
        <BoardSettings
          cols={game.cols}
          rows={game.rows}
          winLen={game.winLen}
          isDisabled={isSetupDisabled}
          onColsChange={game.handleColsChange}
          onColsBlur={game.handleColsBlur}
          onRowsChange={game.handleRowsChange}
          onRowsBlur={game.handleRowsBlur}
          onWinLenChange={game.handleWinLenChange}
          onWinLenBlur={game.handleWinLenBlur}
        />
        <DifficultyPicker
          difficulty={game.difficulty}
          isDisabled={isSetupDisabled}
          onChange={game.setDifficulty}
        />
        <SidePicker
          humanSide={game.humanSide}
          isDisabled={isSetupDisabled}
          onChange={game.setHumanSide}
        />
        {game.phase === 'playing' && (
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="outline" className="w-full" onClick={game.offerDraw}>
              Offer Draw
            </Button>
            {game.drawDeclined && (
              <p className="text-xs text-muted-foreground text-center">
                {bot.name} declined your draw offer
              </p>
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
                      game.resign();
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
          </div>
        )}
        <Button size="lg" className="w-full" onClick={game.startGame}>
          {game.phase === 'setup' ? 'Start Game' : 'New Game'}
        </Button>
      </aside>
    </div>
  );
}
