import type { Player } from '../types';
import type { GameState } from '../game/GameState';

export class Board {
  private readonly container: HTMLElement;
  private onCellClick: ((idx: number) => void) | null = null;

  constructor(containerEl: HTMLElement) {
    this.container = containerEl;
  }

  setClickHandler(handler: (idx: number) => void): void {
    this.onCellClick = handler;
  }

  render(state: GameState): void {
    this.container.style.gridTemplateColumns = `repeat(${state.cols}, var(--cell-size))`;
    this.container.innerHTML = '';
    state.board.forEach((val, i) => {
      this.container.appendChild(this._createCell(val, i));
    });
  }

  updateCell(idx: number, player: Player): void {
    const cell = this.container.children[idx] as HTMLElement | undefined;
    if (!cell) return;
    cell.textContent = player;
    cell.className = `cell taken ${player.toLowerCase()} placed`;
    setTimeout(() => cell.classList.remove('placed'), 300);
  }

  highlightWin(cells: number[]): void {
    cells.forEach((i) => {
      (this.container.children[i] as HTMLElement | undefined)?.classList.add('win-cell');
    });
  }

  private _createCell(val: Player | null, idx: number): HTMLDivElement {
    const cell = document.createElement('div');
    cell.className = 'cell' + (val ? ` taken ${val.toLowerCase()}` : '');
    cell.textContent = val ?? '';
    cell.dataset.idx = String(idx);
    cell.addEventListener('click', () => this.onCellClick?.(idx));
    return cell;
  }
}
