import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { MIN_DIM, MAX_DIM } from '../hooks/useBoardSettings';

interface Props {
  cols: number;
  rows: number;
  winLen: number;
  isDisabled: boolean;
  onColsChange: (val: string) => void;
  onColsBlur: () => void;
  onRowsChange: (val: string) => void;
  onRowsBlur: () => void;
  onWinLenChange: (val: string) => void;
  onWinLenBlur: () => void;
}

export function BoardSettings({
  cols,
  rows,
  winLen,
  isDisabled,
  onColsChange,
  onColsBlur,
  onRowsChange,
  onRowsBlur,
  onWinLenChange,
  onWinLenBlur,
}: Props): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold mb-1">Board</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cols</Label>
          <Input
            type="number"
            value={cols}
            min={MIN_DIM}
            max={MAX_DIM}
            disabled={isDisabled}
            onChange={(e) => onColsChange(e.target.value)}
            onBlur={onColsBlur}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Rows</Label>
          <Input
            type="number"
            value={rows}
            min={MIN_DIM}
            max={MAX_DIM}
            disabled={isDisabled}
            onChange={(e) => onRowsChange(e.target.value)}
            onBlur={onRowsBlur}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Win</Label>
          <Input
            type="number"
            value={winLen}
            min={MIN_DIM}
            max={Math.min(cols, rows)}
            disabled={isDisabled}
            onChange={(e) => onWinLenChange(e.target.value)}
            onBlur={onWinLenBlur}
          />
        </div>
      </div>
    </div>
  );
}
