import { describe, expect, it } from 'vitest';
import { computeRamLoad, isParrySuccess, parryDeltaMs, updateTemperature } from '../../src/systems/mechanics';

describe('mechanics helpers', () => {
  it('updates temperature with passive heat, bug hits, and coolant', () => {
    expect(updateTemperature(25, 1)).toBe(26);
    expect(updateTemperature(25, 1, 2, 1)).toBe(17);
  });

  it('computes ram load from alive enemies', () => {
    expect(computeRamLoad(45, 45)).toBe(100);
    expect(computeRamLoad(0, 45)).toBe(0);
    expect(computeRamLoad(23, 45)).toBe(51);
  });

  it('validates parry timing window', () => {
    expect(parryDeltaMs(2000, 2080)).toBe(80);
    expect(isParrySuccess(80, 120)).toBe(true);
    expect(isParrySuccess(121, 120)).toBe(false);
  });
});
