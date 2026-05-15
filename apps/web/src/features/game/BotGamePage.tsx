import type { Difficulty, Player } from '@tacfinity/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useAuth } from '@/features/auth/useAuth';
import { GameBoard } from './components/GameBoard';
import { GameResultOverlay } from './components/GameResultOverlay';
import { MatchLayout } from './components/MatchLayout';
import { useBotGame, MIN_DIM, MAX_DIM } from './hooks/useBotGame';
import type { BotGamePhase, BotGameActions, BotGameState } from './hooks/useBotGame';

const BOT_META: Record<Difficulty, { name: string; rating: number }> = {
  easy: { name: 'EasyBot', rating: 500 },
  medium: { name: 'MediumBot', rating: 800 },
  hard: { name: 'HardBot', rating: 1200 },
};

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

interface BoardSettingsProps {
  game: BotGameState & BotGameActions;
  isDisabled: boolean;
}

function BoardSettings({ game, isDisabled }: BoardSettingsProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold mb-1">Board</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cols</Label>
          <Input
            type="number"
            value={game.cols}
            min={MIN_DIM}
            max={MAX_DIM}
            disabled={isDisabled}
            onChange={(e) => game.handleColsChange(e.target.value)}
            onBlur={game.handleColsBlur}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Rows</Label>
          <Input
            type="number"
            value={game.rows}
            min={MIN_DIM}
            max={MAX_DIM}
            disabled={isDisabled}
            onChange={(e) => game.handleRowsChange(e.target.value)}
            onBlur={game.handleRowsBlur}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Win</Label>
          <Input
            type="number"
            value={game.winLen}
            min={MIN_DIM}
            max={Math.min(game.cols, game.rows)}
            disabled={isDisabled}
            onChange={(e) => game.handleWinLenChange(e.target.value)}
            onBlur={game.handleWinLenBlur}
          />
        </div>
      </div>
    </div>
  );
}

interface DifficultyPickerProps {
  difficulty: Difficulty;
  isDisabled: boolean;
  onChange: (difficulty: Difficulty) => void;
}

function DifficultyPicker({
  difficulty,
  isDisabled,
  onChange,
}: DifficultyPickerProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold mb-1">Difficulty</p>
      {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
        <label
          key={d}
          className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border cursor-pointer hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="difficulty"
              value={d}
              checked={difficulty === d}
              disabled={isDisabled}
              onChange={() => onChange(d)}
              className="accent-primary"
            />
            <span className="text-sm font-medium capitalize">{d}</span>
          </div>
          <span className="text-xs text-muted-foreground">~{BOT_META[d].rating}</span>
        </label>
      ))}
    </div>
  );
}

interface SidePickerProps {
  humanSide: Player;
  isDisabled: boolean;
  onChange: (side: Player) => void;
}

function SidePicker({ humanSide, isDisabled, onChange }: SidePickerProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold mb-1">You play as</p>
      {(['X', 'O'] as Player[]).map((side) => (
        <label
          key={side}
          className="flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer hover:bg-accent transition-colors"
        >
          <input
            type="radio"
            name="humanSide"
            value={side}
            checked={humanSide === side}
            disabled={isDisabled}
            onChange={() => onChange(side)}
            className="accent-primary"
          />
          <span className="text-sm font-medium">
            {side} {side === 'X' ? '(goes first)' : '(goes second)'}
          </span>
        </label>
      ))}
    </div>
  );
}

export function BotGamePage(): React.ReactElement {
  const { user } = useAuth();
  const game = useBotGame();
  const bot = BOT_META[game.difficulty];
  const isSetupDisabled = game.phase === 'playing';
  const botSide: Player = game.humanSide === 'X' ? 'O' : 'X';
  const activePlayer: Player | null =
    game.phase === 'playing' ? (game.isAiThinking ? botSide : game.humanSide) : null;

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full relative">
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
          onPlayAgain={game.startGame}
        />
      )}

      <aside className="w-full md:w-64 md:shrink-0 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-6 p-6">
        <BoardSettings game={game} isDisabled={isSetupDisabled} />
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
        <Button size="lg" className="w-full" onClick={game.startGame}>
          {game.phase === 'setup' ? 'Start Game' : 'New Game'}
        </Button>
      </aside>
    </div>
  );
}
