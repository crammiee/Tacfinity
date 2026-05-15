import { Router, type Router as ExpressRouter } from 'express';
import { getLeaderboard } from './leaderboard.controller.js';

export const leaderboardRouter: ExpressRouter = Router();

leaderboardRouter.get('/', getLeaderboard);
