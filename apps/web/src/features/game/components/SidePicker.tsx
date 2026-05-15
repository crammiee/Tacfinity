import type { Player } from '@tacfinity/shared';

interface Props {
  humanSide: Player;
  isDisabled: boolean;
  onChange: (side: Player) => void;
}

export function SidePicker({ humanSide, isDisabled, onChange }: Props): React.ReactElement {
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
