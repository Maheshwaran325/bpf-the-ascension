import { LEVEL_TARGET_MS } from '../game/constants';
import { LevelId } from '../types/game';

export interface ScoreInput {
  level: LevelId;
  levelNumber: number;
  durationMs: number;
  damageTaken: number;
  deathsInLevel: number;
  godmodeSurvivalMs?: number;
  success: boolean;
}

export interface ScoreBreakdown {
  clearBonus: number;
  timeBonus: number;
  damagePenalty: number;
  deathPenalty: number;
  godmodeBonus: number;
  total: number;
}

export function calculateLevelScore(input: ScoreInput): ScoreBreakdown {
  const targetMs = LEVEL_TARGET_MS[input.level];
  const clearBonus = input.success ? 1000 * input.levelNumber : 0;
  const timeBonus = Math.floor(Math.max(0, targetMs - input.durationMs) / 10);
  const damagePenalty = -5 * input.damageTaken;
  const deathPenalty = -300 * input.deathsInLevel;
  const godmodeBonus = Math.floor((input.godmodeSurvivalMs ?? 0) / 1000) * 10;

  const total = clearBonus + timeBonus + damagePenalty + deathPenalty + godmodeBonus;
  return {
    clearBonus,
    timeBonus,
    damagePenalty,
    deathPenalty,
    godmodeBonus,
    total,
  };
}

export function applyScore(current: number, delta: number): number {
  return Math.max(0, current + delta);
}
