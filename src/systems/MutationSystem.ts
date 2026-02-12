import { RuleMutation } from '../types/game';

export interface MutationTimelineEntry {
  mutationId: string;
  startMs: number;
  endMs: number;
}

export class MutationSystem {
  private readonly mutations: RuleMutation[];

  private readonly intervalMs: number;

  private readonly durationMs: number;

  private nextTriggerMs: number;

  private mutationCursor: number;

  private activeMutation: RuleMutation | null;

  private activeUntilMs: number;

  constructor(mutations: RuleMutation[], intervalMs = 10_000, durationMs = 6_000) {
    this.mutations = mutations;
    this.intervalMs = intervalMs;
    this.durationMs = durationMs;
    this.nextTriggerMs = intervalMs;
    this.mutationCursor = 0;
    this.activeMutation = null;
    this.activeUntilMs = 0;
  }

  update(elapsedMs: number): RuleMutation | null {
    if (this.activeMutation && elapsedMs >= this.activeUntilMs) {
      this.activeMutation.clear();
      this.activeMutation = null;
    }

    if (elapsedMs >= this.nextTriggerMs && this.mutations.length > 0) {
      if (this.activeMutation) {
        this.activeMutation.clear();
      }

      this.activeMutation = this.mutations[this.mutationCursor % this.mutations.length];
      this.mutationCursor += 1;
      this.activeMutation.apply();
      this.activeUntilMs = elapsedMs + this.durationMs;
      this.nextTriggerMs += this.intervalMs;
    }

    return this.activeMutation;
  }

  getActiveMutation(): RuleMutation | null {
    return this.activeMutation;
  }

  clearAll(): void {
    if (this.activeMutation) {
      this.activeMutation.clear();
      this.activeMutation = null;
    }
  }
}

export function buildMutationTimeline(
  mutationIds: string[],
  totalDurationMs: number,
  intervalMs = 10_000,
  durationMs = 6_000,
): MutationTimelineEntry[] {
  if (mutationIds.length === 0 || totalDurationMs <= 0) {
    return [];
  }

  const timeline: MutationTimelineEntry[] = [];
  let cursor = 0;
  for (let start = intervalMs; start <= totalDurationMs; start += intervalMs) {
    const mutationId = mutationIds[cursor % mutationIds.length];
    cursor += 1;
    timeline.push({
      mutationId,
      startMs: start,
      endMs: Math.min(totalDurationMs, start + durationMs),
    });
  }
  return timeline;
}
