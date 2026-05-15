import type { Difficulty } from '@tacfinity/shared';
import { BOT_META } from '../constants';

interface Props {
  difficulty: Difficulty;
  isDisabled: boolean;
  onChange: (difficulty: Difficulty) => void;
}

export function DifficultyPicker({ difficulty, isDisabled, onChange }: Props): React.ReactElement {
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
