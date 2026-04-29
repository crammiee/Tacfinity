import type { PublicUser } from '../features/auth/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
