/**
 * Manual smoke demo for @tacfinity/shared.
 *
 * Exercises every subsystem ported in Phase 0 — WinDetector, the AI engine,
 * and the TGN parser/serializer — without needing a UI. Used to verify the
 * package works end-to-end before any consumer (apps/web, apps/api) is built.
 *
 * Run: pnpm --filter @tacfinity/shared demo
 */

import {
  AIFactory,
  GameState,
  WinDetector,
  parseGame,
  parseMove,
  serializeGame,
  TgnParseError,
  type Cell,
  type Move,
  type Player,
} from '../src/index.js';

function renderBoard(board: Cell[], cols: number): string {
  const rows = board.length / cols;
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    const row = board.slice(r * cols, (r + 1) * cols).map((c) => c ?? '·');
    lines.push('  ' + row.join(' '));
  }
  return lines.join('\n');
}

function header(label: string): void {
  console.log(`\n=== ${label} ===\n`);
}

const wd = new WinDetector();

// ---------------------------------------------------------------------------
header('1. WinDetector');

const handCraftedBoard: Cell[] = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
console.log('Hand-crafted board:');
console.log(renderBoard(handCraftedBoard, 3));
console.log('');
console.log(
  `  checkWin('X', winLen=3)  → ${JSON.stringify(wd.checkWin(handCraftedBoard, 'X', 3, 3, 3))}`
);
console.log(
  `  checkWin('O', winLen=3)  → ${JSON.stringify(wd.checkWin(handCraftedBoard, 'O', 3, 3, 3))}`
);
console.log(`  getBoardWinner           → ${wd.getBoardWinner(handCraftedBoard, 3, 3, 3)}`);
console.log(`  isDraw                   → ${wd.isDraw(handCraftedBoard)}`);

// ---------------------------------------------------------------------------
header('2. HardAI vs HardAI on 3×3 (perfect play should draw)');

function makeHardAi(forSide: Player, sharedBoard: Cell[]) {
  const s = new GameState();
  s.configure({
    cols: 3,
    rows: 3,
    winLen: 3,
    mode: 'ai',
    difficulty: 'hard',
    humanSide: forSide === 'X' ? 'O' : 'X',
  });
  s.board = sharedBoard;
  return AIFactory.create('hard', s, wd);
}

const board: Cell[] = Array(9).fill(null);
const aiByPlayer: Record<Player, ReturnType<typeof makeHardAi>> = {
  X: makeHardAi('X', board),
  O: makeHardAi('O', board),
};

const moves: Move[] = [];
let current: Player = 'X';
let outcome: 'X' | 'O' | 'draw' = 'draw';

for (let turn = 0; turn < 9; turn++) {
  const idx = aiByPlayer[current].getMove();
  const row = Math.floor(idx / 3);
  const col = idx % 3;
  board[idx] = current;
  moves.push({ player: current, row, col });
  console.log(`  Turn ${turn + 1}: ${current} plays (${row}, ${col})  [idx ${idx}]`);

  const winner = wd.getBoardWinner(board, 3, 3, 3);
  if (winner) {
    outcome = winner;
    break;
  }
  if (wd.isDraw(board)) break;
  current = current === 'X' ? 'O' : 'X';
}

console.log('\nFinal board:');
console.log(renderBoard(board, 3));
console.log(
  `\nOutcome: ${outcome === 'draw' ? 'DRAW (both AIs played optimally)' : `${outcome} won`}`
);

// ---------------------------------------------------------------------------
header('3. TGN serialize / parse');

const tgn = serializeGame(moves);
console.log(`Serialized game:\n  "${tgn}"`);

const parsed = parseGame(tgn);
console.log(`\nParsed back: ${parsed.length} moves`);
const roundTripOk = JSON.stringify(parsed) === JSON.stringify(moves);
console.log(`Round-trip identical: ${roundTripOk}`);

console.log('\nReplaying parsed moves into a fresh board:');
const replay: Cell[] = Array(9).fill(null);
for (const m of parsed) replay[m.row * 3 + m.col] = m.player;
console.log(renderBoard(replay, 3));
const replayMatches = JSON.stringify(replay) === JSON.stringify(board);
console.log(`Replay matches the live game board: ${replayMatches}`);

console.log('\nMalformed-token error handling:');
try {
  parseMove('Z:0,0');
} catch (e) {
  console.log(
    `  parseMove("Z:0,0") threw → ${e instanceof TgnParseError ? `TgnParseError: ${e.message}` : e}`
  );
}

// ---------------------------------------------------------------------------
const allOk = roundTripOk && replayMatches;
console.log(`\n=== Demo complete — ${allOk ? 'all checks passed' : 'CHECK FAILED'} ===`);
