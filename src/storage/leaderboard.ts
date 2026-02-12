import { LeaderboardEntry } from '../types/game';

export const LEADERBOARD_STORAGE_KEY = 'bpf_ascension_leaderboard_v1';

export function sanitizeInitials(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
}

export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.clearTimeMs - b.clearTimeMs;
  });
}

export function loadLeaderboard(storage: Storage = window.localStorage): LeaderboardEntry[] {
  const raw = storage.getItem(LEADERBOARD_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortLeaderboard(
      parsed.filter((entry) => entry && entry.version === 'v1' && typeof entry.score === 'number'),
    ).slice(0, 10);
  } catch {
    return [];
  }
}

export function saveLeaderboard(entries: LeaderboardEntry[], storage: Storage = window.localStorage): LeaderboardEntry[] {
  const sorted = sortLeaderboard(entries).slice(0, 10);
  storage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(sorted));
  return sorted;
}

export function addLeaderboardEntry(
  entry: LeaderboardEntry,
  storage: Storage = window.localStorage,
): LeaderboardEntry[] {
  const current = loadLeaderboard(storage);
  return saveLeaderboard([...current, entry], storage);
}
