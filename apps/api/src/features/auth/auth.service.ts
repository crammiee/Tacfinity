import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { LoginInput, RegisterInput } from '@tacfinity/shared';
import { env } from '../../config/env.js';
import { ConflictError, UnauthorizedError } from '../../shared/errors/AppError.js';
import { authRepository } from './auth.repository.js';

const BCRYPT_COST = 12;
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  rating: number;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResult = { user: PublicUser } & AuthTokens;

type AccessTokenPayload = { userId: string };

function toPublicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    rating: user.rating,
  };
}

function signTokens(userId: string): AuthTokens {
  const accessToken = jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 'P2002'
  );
}

function extractUserId(decoded: unknown): string {
  if (typeof decoded !== 'object' || decoded === null) {
    throw new UnauthorizedError('Invalid token');
  }
  const userId = (decoded as { userId?: unknown }).userId;
  if (typeof userId !== 'string') {
    throw new UnauthorizedError('Invalid token');
  }
  return userId;
}

export const authService = {
  async register(input: RegisterInput): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    try {
      const user = await authRepository.createUser({
        username: input.username,
        email: input.email,
        passwordHash,
      });
      return toPublicUser(user);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictError('Email or username already taken');
      }
      throw err;
    }
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedError('Invalid email or password');

    return { user: toPublicUser(user), ...signTokens(user.id) };
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    let userId: string;
    try {
      userId = extractUserId(jwt.verify(refreshToken, env.JWT_REFRESH_SECRET));
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError('Invalid refresh token');

    return { user: toPublicUser(user), ...signTokens(user.id) };
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return { userId: extractUserId(jwt.verify(token, env.JWT_ACCESS_SECRET)) };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Invalid access token');
    }
  },
};
