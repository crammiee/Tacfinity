import type { Difficulty } from '../types';
import type { GameState } from '../game/GameState';
import type { WinDetector } from '../game/WinDetector';
import type { AIPlayer } from './AIPlayer';
import { BoardEvaluator } from './BoardEvaluator';
import { EasyAI } from './EasyAI';
import { HardAI } from './HardAI';
import { HeuristicEngine } from './HeuristicEngine';
import { MediumAI } from './MediumAI';
import { MinimaxEngine } from './MinimaxEngine';

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
