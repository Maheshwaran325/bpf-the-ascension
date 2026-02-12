import { describe, expect, it, vi } from 'vitest';
import { MutationSystem, buildMutationTimeline } from '../../src/systems/MutationSystem';
import { RuleMutation } from '../../src/types/game';

describe('MutationSystem', () => {
  it('builds a mutation timeline every 10 seconds for 6 seconds', () => {
    const timeline = buildMutationTimeline(
      ['gravity_flip', 'reverse_controls', 'darkness_mask', 'speed_shift'],
      30_000,
      10_000,
      6_000,
    );

    expect(timeline).toEqual([
      { mutationId: 'gravity_flip', startMs: 10_000, endMs: 16_000 },
      { mutationId: 'reverse_controls', startMs: 20_000, endMs: 26_000 },
      { mutationId: 'darkness_mask', startMs: 30_000, endMs: 30_000 },
    ]);
  });

  it('applies and clears active mutation as time advances', () => {
    const applyA = vi.fn();
    const clearA = vi.fn();
    const applyB = vi.fn();
    const clearB = vi.fn();

    const system = new MutationSystem(
      [
        { id: 'a', label: 'A', durationMs: 6_000, apply: applyA, clear: clearA },
        { id: 'b', label: 'B', durationMs: 6_000, apply: applyB, clear: clearB },
      ] satisfies RuleMutation[],
      10_000,
      6_000,
    );

    expect(system.getActiveMutation()).toBeNull();

    system.update(10_000);
    expect(applyA).toHaveBeenCalledTimes(1);
    expect(system.getActiveMutation()?.id).toBe('a');

    system.update(16_001);
    expect(clearA).toHaveBeenCalledTimes(1);
    expect(system.getActiveMutation()).toBeNull();

    system.update(20_000);
    expect(applyB).toHaveBeenCalledTimes(1);
    expect(system.getActiveMutation()?.id).toBe('b');
  });
});
