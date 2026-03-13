# Tacfinity

A customizable Tic Tac Toe game with a smart AI opponent. Play on any grid size up to 20×20, set your own win condition, and challenge an AI that scales from easy to unbeatable.

## Features

- **Custom board sizes** — any grid from 3×3 up to 20×20
- **Custom win condition** — set how many in a row to win
- **2 Player mode** — local hotseat
- **vs AI mode** — three difficulty levels
  - Easy — mostly random with occasional smart moves
  - Medium — depth-3 minimax search
  - Hard — adaptive minimax (perfect play on small boards, heuristic search on large ones) with fork detection
- **Score tracking** across rounds

## Tech Stack

- **TypeScript** — strict mode, fully typed
- **Vite** — dev server and build tool
- **Vanilla DOM** — no framework, component-based architecture
- **ESLint + Prettier** — enforced code style

## Project Structure

```
src/
├── types.ts               # Shared types (Player, Cell, GameSettings, etc.)
├── main.ts                # Entry point, dependency wiring
├── styles/                # CSS split by concern
├── game/
│   ├── GameState.ts       # Single source of truth for all game data
│   ├── WinDetector.ts     # Win and draw detection
│   └── GameController.ts  # Game flow orchestration
├── ai/
│   ├── AIPlayer.ts        # Abstract base class
│   ├── EasyAI.ts
│   ├── MediumAI.ts
│   ├── HardAI.ts
│   ├── AIFactory.ts       # Creates the right AI by difficulty
│   ├── BoardEvaluator.ts  # Position scoring and candidate moves
│   ├── MinimaxEngine.ts   # Pure minimax (small boards)
│   └── HeuristicEngine.ts # Candidate-filtered minimax (large boards)
└── components/
    ├── Board.ts            # Grid rendering
    ├── SetupPanel.ts       # Setup UI and input validation
    └── StatusBar.ts        # Scores, badges, messages
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Type-check and build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
npm run format   # Run Prettier
```

## Live Demo

[https://tictacprox.vercel.app](https://tictacprox.vercel.app)
