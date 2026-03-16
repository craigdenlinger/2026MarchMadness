export function pointsForTeam(seed: number, wins: number, isChampion: boolean) {
  if (wins <= 0) return 0;
  if (!isChampion) return seed * wins;
  return seed * (wins - 1) + seed * 5;
}

export function remainingPossiblePoints(seed: number, wins: number, isAlive: boolean, isChampion: boolean) {
  if (!isAlive || isChampion) return 0;

  // Standard main bracket path is 6 wins to title.
  // First Four wins do not count.
  const maxTotalWins = 6;
  const winsRemaining = Math.max(0, maxTotalWins - wins);
  if (winsRemaining === 0) return 0;

  // If the team could still become champion, the last remaining win would be worth seed * 5,
  // not seed * 1. So we calculate normal wins for all non-title remaining games, then title bonus.
  if (winsRemaining === 1) return seed * 5;
  return seed * (winsRemaining - 1) + seed * 5;
}
