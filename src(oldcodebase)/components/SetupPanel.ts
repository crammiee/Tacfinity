import type { Difficulty, GameMode, GameSettings, Player } from '../types';

interface SetupPanelElements {
  mode2pBtn: HTMLButtonElement;
  modeAIBtn: HTMLButtonElement;
  colsInput: HTMLInputElement;
  rowsInput: HTMLInputElement;
  winInput: HTMLInputElement;
  diffSelect: HTMLSelectElement;
  sideSelect: HTMLSelectElement;
  aiGroup: HTMLElement;
  sideGroup: HTMLElement;
}

export class SetupPanel {
  private readonly _mode2pBtn: HTMLButtonElement;
  private readonly _modeAIBtn: HTMLButtonElement;
  private readonly _colsInput: HTMLInputElement;
  private readonly _rowsInput: HTMLInputElement;
  private readonly _winInput: HTMLInputElement;
  private readonly _diffSelect: HTMLSelectElement;
  private readonly _sideSelect: HTMLSelectElement;
  private readonly _aiGroup: HTMLElement;
  private readonly _sideGroup: HTMLElement;
  private _currentMode: GameMode = '2p';

  constructor(elements: SetupPanelElements) {
    this._mode2pBtn = elements.mode2pBtn;
    this._modeAIBtn = elements.modeAIBtn;
    this._colsInput = elements.colsInput;
    this._rowsInput = elements.rowsInput;
    this._winInput = elements.winInput;
    this._diffSelect = elements.diffSelect;
    this._sideSelect = elements.sideSelect;
    this._aiGroup = elements.aiGroup;
    this._sideGroup = elements.sideGroup;
    this._bindModeButtons();
  }

  getSettings(): GameSettings {
    const cols = this._clamp(parseInt(this._colsInput.value) || 3, 3, 20);
    const rows = this._clamp(parseInt(this._rowsInput.value) || 3, 3, 20);
    const winLen = this._clamp(parseInt(this._winInput.value) || 3, 3, Math.min(cols, rows));

    this._colsInput.value = String(cols);
    this._rowsInput.value = String(rows);
    this._winInput.value = String(winLen);

    return {
      cols,
      rows,
      winLen,
      mode: this._currentMode,
      difficulty: this._diffSelect.value as Difficulty,
      humanSide: this._sideSelect.value as Player,
    };
  }

  setMode(mode: GameMode): void {
    this._currentMode = mode;
    this._mode2pBtn.classList.toggle('active', mode === '2p');
    this._modeAIBtn.classList.toggle('active', mode === 'ai');
    this._aiGroup.style.display = mode === 'ai' ? '' : 'none';
    this._sideGroup.style.display = mode === 'ai' ? '' : 'none';
  }

  private _bindModeButtons(): void {
    this._mode2pBtn.addEventListener('click', () => this.setMode('2p'));
    this._modeAIBtn.addEventListener('click', () => this.setMode('ai'));
  }

  private _clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
