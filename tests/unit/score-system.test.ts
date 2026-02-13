import { describe, expect, it } from 'vitest';
import { applyScore, calculateLevelScore } from '../../src/systems/ScoreSystem';

describe('ScoreSystem', () => {
  it('calculates deterministic level score components', () => {
    const result = calculateLevelScore({
      level: 'burningMonk',
      levelNumber: 1,
      durationMs: 15_000,
      damageTaken: 10,
      deathsInLevel: 1,
      success: true,
    });

    expect(result.clearBonus).toBe(1000);
    expect(result.timeBonus).toBe(500);
    expect(result.damagePenalty).toBe(-50);
    expect(result.deathPenalty).toBe(-300);
    expect(result.godmodeBonus).toBe(0);
    expect(result.total).toBe(1150);
  });

  it('adds godmode tick bonus at +10 per second', () => {
    const result = calculateLevelScore({
      level: 'godmode',
      levelNumber: 6,
      durationMs: 180_000,
      damageTaken: 0,
      deathsInLevel: 0,
      godmodeSurvivalMs: 180_000,
      success: true,
    });

    expect(result.godmodeBonus).toBe(1800);
    expect(result.total).toBe(7800);
  });

  it('floors final score to zero', () => {
    expect(applyScore(100, -500)).toBe(0);
    expect(applyScore(100, 90)).toBe(190);
  });
});
