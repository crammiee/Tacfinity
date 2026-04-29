import type { Player, Scores } from '@tacfinity/shared';

interface StatusBarProps {
  currentPlayer: Player;
  isGameOver: boolean;
  winner: Player | null;
  isDraw: boolean;
  isAiThinking: boolean;
  scores: Scores;
}

function buildMessage(props: Omit<StatusBarProps, 'scores' | 'currentPlayer'>): string {
  const { isGameOver, winner, isDraw, isAiThinking } = props;

  if (isGameOver && winner !== null) return `${winner} wins!`;
  if (isGameOver && isDraw) return "It's a draw!";
  if (isAiThinking) return 'AI is thinking…';
  return '';
}

interface PlayerBadgeProps {
  player: Player;
  isActive: boolean;
  score: number;
}

function PlayerBadge({ player, isActive, score }: PlayerBadgeProps) {
  const colorClass =
    player === 'X' ? 'text-player-x border-player-x' : 'text-player-o border-player-o';
  const activeClass = isActive ? 'opacity-100 scale-105' : 'opacity-40';

  return (
    <div
      className={`flex flex-col items-center gap-1 transition-all duration-200 ${activeClass}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <span
        className={`text-2xl font-bold border-2 rounded-lg w-12 h-12 flex items-center justify-center ${colorClass}`}
      >
        {player}
      </span>
      <span className="text-xs text-muted-foreground font-medium">{score}</span>
    </div>
  );
}

export function StatusBar({
  currentPlayer,
  isGameOver,
  winner,
  isDraw,
  isAiThinking,
  scores,
}: StatusBarProps) {
  const message = buildMessage({ isGameOver, winner, isDraw, isAiThinking });
  const activePlayer = isGameOver ? null : currentPlayer;

  return (
    <div className="flex items-center justify-between w-full max-w-sm mx-auto px-4 py-3 rounded-xl border border-border bg-card">
      <PlayerBadge player="X" isActive={activePlayer === 'X'} score={scores.X} />

      <div className="flex flex-col items-center gap-1 min-w-0 px-2">
        {message ? (
          <p className="text-sm font-semibold text-foreground text-center">{message}</p>
        ) : (
          <p className="text-sm text-muted-foreground text-center">{currentPlayer}&apos;s turn</p>
        )}
        <span className="text-xs text-muted-foreground">Draw: {scores.draw}</span>
      </div>

      <PlayerBadge player="O" isActive={activePlayer === 'O'} score={scores.O} />
    </div>
  );
}
