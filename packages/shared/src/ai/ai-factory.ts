import type { Difficulty } from '../types';
import type { GameState } from '../game-logic/game-state';
import type { WinDetector } from '../game-logic/win-detector';
import type { AIPlayer } from './ai-player';
import { BoardEvaluator } from './board-evaluator';
import { EasyAI } from './easy-ai';
import { HardAI } from './hard-ai';
import { HeuristicEngine } from './heuristic-engine';
import { MediumAI } from './medium-ai';
import { MinimaxEngine } from './minimax-engine';

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
