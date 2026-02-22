import { describe, expect, it } from 'vitest';
import {
  addLeaderboardEntry,
  loadLeaderboard,
  sanitizeInitials,
  saveLeaderboardLocal,
  sortLeaderboard,
} from '../../src/storage/leaderboard';
import { LeaderboardEntry } from '../../src/types/game';

class MockStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key) ?? null : null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

function makeEntry(index: number, score: number, clearTimeMs: number): LeaderboardEntry {
  return {
    initials: `A${index}`.slice(0, 3),
    score,
    clearTimeMs,
    dateISO: `2026-02-12T00:00:${String(index).padStart(2, '0')}Z`,
    version: 'v1',
  };
}

describe('leaderboard storage', () => {
  it('sorts by score desc and time asc', () => {
    const entries = [
      makeEntry(1, 9000, 200_000),
      makeEntry(2, 9300, 220_000),
      makeEntry(3, 9300, 210_000),
    ];

    const sorted = sortLeaderboard(entries);
    expect(sorted[0].initials).toBe('A3');
    expect(sorted[1].initials).toBe('A2');
    expect(sorted[2].initials).toBe('A1');
  });

  it('trims leaderboard to top 10 and supports serialization', async () => {
    const storage = new MockStorage();
    const entries = Array.from({ length: 12 }, (_, i) => makeEntry(i + 1, 20000 - i * 10, 200_000 + i * 1000));

    saveLeaderboardLocal(entries, storage);
    const loaded = await loadLeaderboard(storage);

    expect(loaded).toHaveLength(10);
    expect(loaded[0].score).toBe(20_000);
    expect(loaded[9].score).toBe(19_910);
  });

  it('adds entries incrementally', async () => {
    const storage = new MockStorage();

    await addLeaderboardEntry(makeEntry(1, 1000, 500_000), storage);
    await addLeaderboardEntry(makeEntry(2, 1200, 450_000), storage);

    const loaded = await loadLeaderboard(storage);
    expect(loaded).toHaveLength(2);
    expect(loaded[0].score).toBe(1200);
  });

  it('sanitizes initials to uppercase alphanumeric and max 3 chars', () => {
    expect(sanitizeInitials('ab$1c')).toBe('AB1');
    expect(sanitizeInitials('xyz')).toBe('XYZ');
  });
});
