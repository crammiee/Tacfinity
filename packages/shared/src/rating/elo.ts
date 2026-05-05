export function calculateElo(
  winnerRating: number,
  loserRating: number,
  kFactor = 32
): { newWinner: number; newLoser: number } {
  const expected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const delta = Math.round(kFactor * (1 - expected));
  return { newWinner: winnerRating + delta, newLoser: loserRating - delta };
}

export function calculateDrawElo(
  aRating: number,
  bRating: number,
  kFactor = 32
): { newA: number; newB: number } {
  const expected = 1 / (1 + Math.pow(10, (bRating - aRating) / 400));
  const delta = Math.round(kFactor * (0.5 - expected));
  return { newA: aRating + delta, newB: bRating - delta };
}
