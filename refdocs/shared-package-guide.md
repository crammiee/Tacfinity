# @tacfinity/shared — Module Reference

The shared package is the domain layer of Tacfinity. It contains all game logic, AI engines, types, Zod schemas, and the TGN serializer. It has no knowledge of HTTP, React, or any framework — it is pure TypeScript imported by both `apps/api` and `apps/web`.

Always import from the package root:

```ts
import { GameState, WinDetector, AIFactory } from '@tacfinity/shared';
import type { Cell, Player, GameSettings } from '@tacfinity/shared';
```

Never import from internal paths like `@tacfinity/shared/src/ai/...`.

---

## Types (`types/game.ts`)

Core domain types used across every module.

```ts
type Player = 'X' | 'O';
type Cell = Player | null; // null = empty cell
type GameMode = '2p' | 'ai';
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameSettings {
  cols: number; // board width
  rows: number; // board height
  winLen: number; // consecutive cells needed to win
  mode: GameMode;
  difficulty: Difficulty;
  humanSide: Player; // which side the human controls in AI mode
}

interface Scores {
  X: number;
  O: number;
  draw: number;
}

interface Move {
  player: Player;
  row: number;
  col: number;
}
```

The board is represented as a **flat `Cell[]` array**, not a 2D grid. A 3×3 board has indices 0–8. To convert coordinates: `index = row * cols + col`.

---

## Board Utilities (`game-logic/board.ts`)

Stateless pure functions that operate on a `Cell[]` array. No side effects, no dependency on `GameState`.

| Function           | Signature                     | Description                                    |
| ------------------ | ----------------------------- | ---------------------------------------------- |
| `createEmptyBoard` | `(rows, cols) → Cell[]`       | Returns a new board filled with `null`         |
| `placeMove`        | `(board, idx, player) → void` | Sets `board[idx] = player` in place            |
| `undoMove`         | `(board, idx) → void`         | Sets `board[idx] = null` in place              |
| `getOpponentOf`    | `(player) → Player`           | Returns the other player                       |
| `isBoardFull`      | `(board) → boolean`           | `true` if no `null` cells remain               |
| `indexOf`          | `(row, col, cols) → number`   | Converts row/col coordinates to a flat index   |
| `replayMoves`      | `(config, moves) → Cell[]`    | Builds a board by applying a `Move[]` sequence |

`undoMove` is used internally by the AI for lookahead search. Callers outside the AI layer generally do not need it.

---

## GameState (`game-logic/game-state.ts`)

A mutable class that holds all running game state. It is the authoritative record of what is happening in a game session.

```ts
const gs = new GameState();
gs.configure(settings); // apply GameSettings
gs.resetBoard(); // clear board, reset currentPlayer to 'X'
```

**Properties:**

| Property                   | Type              | Description                 |
| -------------------------- | ----------------- | --------------------------- |
| `board`                    | `Cell[]`          | The flat board array        |
| `currentPlayer`            | `Player`          | Whose turn it is            |
| `gameOver`                 | `boolean`         | Whether the game has ended  |
| `scores`                   | `Scores`          | Running win/draw tally      |
| `cols` / `rows` / `winLen` | `number`          | Board configuration         |
| `mode`                     | `GameMode`        | `'2p'` or `'ai'`            |
| `humanSide` / `aiSide`     | `Player`          | Side assignments in AI mode |
| `totalCells`               | `number` (getter) | `cols * rows`               |

**Methods:**

| Method                   | Description                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| `configure(settings)`    | Applies a `GameSettings` object                                                   |
| `resetBoard()`           | Fills board with `null`, resets `currentPlayer` to `'X'`, sets `gameOver = false` |
| `resetScores()`          | Zeroes out `scores`                                                               |
| `placeMove(idx, player)` | Writes `player` to `board[idx]`                                                   |
| `undoMove(idx)`          | Clears `board[idx]`                                                               |
| `switchPlayer()`         | Flips `currentPlayer`                                                             |
| `isBoardFull()`          | `true` if no empty cells remain                                                   |

---

## WinDetector (`game-logic/win-detector.ts`)

Checks win conditions by scanning all four directions (horizontal, vertical, diagonal, anti-diagonal) from every cell.

```ts
const wd = new WinDetector();
```

| Method                                        | Returns            | Description                                                        |
| --------------------------------------------- | ------------------ | ------------------------------------------------------------------ |
| `checkWin(board, player, winLen, cols, rows)` | `number[] \| null` | Returns the winning cell indices for `player`, or `null` if no win |
| `getBoardWinner(board, winLen, cols, rows)`   | `Player \| null`   | Checks both sides, returns the winner or `null`                    |
| `isDraw(board)`                               | `boolean`          | `true` if the board is full                                        |

`checkWin` returns the actual winning indices (e.g. `[0, 1, 2]`), which can be used to highlight winning cells in the UI.

---

## AI (`ai/`)

### `AIFactory`

The single entry point for creating an AI player. Never instantiate `EasyAI`, `MediumAI`, or `HardAI` directly.

```ts
const ai = AIFactory.create(difficulty, gameState, winDetector);
```

`AIFactory.create` reads `gameState.aiSide` to determine which player the AI controls. Call `gameState.configure(settings)` before creating the AI.

### `AIPlayer` (abstract base)

All AI classes extend `AIPlayer` and expose one method:

```ts
ai.getMove(); // → number (board index of the chosen move)
```

The caller is responsible for placing the returned move on the board.

### Difficulty strategies

| Difficulty | Strategy                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------- |
| **Easy**   | 75% random, 25% minimax at depth 1                                                                 |
| **Medium** | Minimax depth 3 on small boards (≤16 cells); win/block/heuristic on larger boards                  |
| **Hard**   | Adaptive depth (20 on 3×3, down to 4 on large boards); win → block → fork → block fork → heuristic |

### Engines (internal — do not import directly)

| Engine            | Description                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `MinimaxEngine`   | Exact minimax search with alpha-beta pruning; used on small boards where exhaustive search is feasible |
| `HeuristicEngine` | Scores candidate moves using `BoardEvaluator`; used on large boards where minimax is too slow          |
| `BoardEvaluator`  | Scores board positions and detects fork opportunities                                                  |

---

## TGN — Tacfinity Game Notation (`tgn/`)

A compact string format for recording and replaying game move sequences. Format: `"X:0,0 O:1,1 X:2,2"` — space-separated tokens of `Player:row,col`.

TGN strings are stored in the `games.moves` column in the database.

| Function               | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `serializeGame(moves)` | `Move[]` → TGN string                                            |
| `parseGame(tgn)`       | TGN string → `Move[]` (returns `[]` on empty string)             |
| `serializeMove(move)`  | Single `Move` → token string                                     |
| `parseMove(token)`     | Single token → `Move`; throws `TgnParseError` on malformed input |

`TgnParseError` is exported and can be caught to distinguish parse failures from other errors.

---

## Schemas (`schemas/`)

Zod schemas for validating shared data structures. Imported by both the API (request validation) and the web app (form types).

| Export           | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `registerSchema` | `{ username: string(3–20), email, password: string(min 8) }` |
| `loginSchema`    | `{ email, password: string }`                                |
| `RegisterInput`  | `z.infer<typeof registerSchema>`                             |
| `LoginInput`     | `z.infer<typeof loginSchema>`                                |

Do not define duplicate DTOs in `apps/api` or `apps/web` — use `z.infer<typeof schema>` to derive TypeScript types from these schemas.
