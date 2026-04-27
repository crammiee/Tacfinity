import type { Move, Player } from '../types';

export class TgnParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TgnParseError';
  }
}

export function serializeMove(move: Move): string {
  return `${move.player}:${move.row},${move.col}`;
}

export function serializeGame(moves: Move[]): string {
  return moves.map(serializeMove).join(' ');
}

export function parseMove(token: string): Move {
  const colonIdx = token.indexOf(':');
  if (colonIdx === -1) {
    throw new TgnParseError(`malformed token "${token}": missing ':'`);
  }
  const player = token.slice(0, colonIdx);
  if (player !== 'X' && player !== 'O') {
    throw new TgnParseError(`malformed token "${token}": player must be 'X' or 'O'`);
  }
  const coords = token.slice(colonIdx + 1);
  const commaIdx = coords.indexOf(',');
  if (commaIdx === -1) {
    throw new TgnParseError(`malformed token "${token}": missing ',' in coordinates`);
  }
  const row = parseCoord(coords.slice(0, commaIdx), token, 'row');
  const col = parseCoord(coords.slice(commaIdx + 1), token, 'col');
  return { player: player as Player, row, col };
}

export function parseGame(tgn: string): Move[] {
  const trimmed = tgn.trim();
  if (trimmed === '') return [];
  return trimmed.split(/\s+/).map(parseMove);
}

function parseCoord(raw: string, token: string, label: 'row' | 'col'): number {
  if (raw === '' || !/^-?\d+$/.test(raw)) {
    throw new TgnParseError(`malformed token "${token}": ${label} "${raw}" is not an integer`);
  }
  const n = Number(raw);
  if (n < 0) {
    throw new TgnParseError(`malformed token "${token}": ${label} "${raw}" must be non-negative`);
  }
  return n;
}
