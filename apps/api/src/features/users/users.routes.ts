import { Router, type Router as ExpressRouter } from 'express';
import { getUserProfile } from './users.controller.js';

export const usersRouter: ExpressRouter = Router();

usersRouter.get('/:id', getUserProfile);
