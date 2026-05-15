import type { PublicProfile } from '@tacfinity/shared';
import { usersRepository } from './users.repository.js';

export const usersService = {
  async getPublicProfile(userId: string): Promise<PublicProfile | null> {
    return usersRepository.findPublicProfile(userId);
  },
};
