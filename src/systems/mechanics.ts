export function updateTemperature(
  current: number,
  deltaSeconds: number,
  bugHits = 0,
  coolantCollections = 0,
): number {
  return current + deltaSeconds + bugHits * 8 - coolantCollections * 25;
}

export function computeRamLoad(aliveEnemies: number, totalEnemies = 45): number {
  if (totalEnemies <= 0) {
    return 100;
  }

  const ratio = aliveEnemies / totalEnemies;
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}

export function parryDeltaMs(strikeAtMs: number, inputAtMs: number): number {
  return Math.abs(inputAtMs - strikeAtMs);
}

export function isParrySuccess(deltaMs: number, windowMs = 120): boolean {
  return deltaMs <= windowMs;
}
