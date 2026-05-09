import type { Difficulty } from '../types';
import type { GameState } from '../game-logic/game-state';
import type { WinDetector } from '../game-logic/win-detector';
import type { AIPlayer } from './ai-player';
import { BoardEvaluator } from './board-evaluator.js';
import { EasyAI } from './easy-ai.js';
import { HardAI } from './hard-ai.js';
import { HeuristicEngine } from './heuristic-engine.js';
import { MediumAI } from './medium-ai.js';
import { MinimaxEngine } from './minimax-engine.js';

export class AIFactory {
  static create(difficulty: Difficulty, state: GameState, winDetector: WinDetector): AIPlayer {
    const { aiSide, cols, rows, winLen } = state;

    const evaluator = new BoardEvaluator(aiSide, cols, rows, winLen);
    const minimaxEngine = new MinimaxEngine(aiSide, cols, rows, winLen, winDetector, evaluator);
    const heuristicEngine = new HeuristicEngine(aiSide, cols, rows, winLen, winDetector, evaluator);

    switch (difficulty) {
      case 'easy':
        return new EasyAI(aiSide, state, winDetector, minimaxEngine);
      case 'medium':
        return new MediumAI(aiSide, state, winDetector, minimaxEngine, heuristicEngine);
      case 'hard':
        return new HardAI(aiSide, state, winDetector, evaluator, minimaxEngine, heuristicEngine);
    }
  }
}
