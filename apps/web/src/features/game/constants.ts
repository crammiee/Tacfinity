import type { Difficulty } from '@tacfinity/shared';

export const BOT_META: Record<Difficulty, { name: string; rating: number }> = {
  easy: { name: 'EasyBot', rating: 500 },
  medium: { name: 'MediumBot', rating: 800 },
  hard: { name: 'HardBot', rating: 1200 },
};
