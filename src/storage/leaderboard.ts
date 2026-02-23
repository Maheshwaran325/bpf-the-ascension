import { LeaderboardEntry } from '../types/game';

// Environment variable for Pantry ID
export const PANTRY_ID = import.meta.env.VITE_PANTRY_ID;
export const PANTRY_URL = `https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/bpf_leaderboard`;

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

export async function loadLeaderboard(storage: Storage = window.localStorage): Promise<LeaderboardEntry[]> {
  let entries: LeaderboardEntry[] = [];

  try {
    const res = await fetch(PANTRY_URL, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.leaderboard)) {
        entries = data.leaderboard;
      }
    }
  } catch (err) {
    console.warn('Could not fetch global leaderboard from Pantry. Falling back to local.', err);
  }

  // Fallback to local storage if empty or failed
  if (entries.length === 0) {
    const raw = storage.getItem(LEADERBOARD_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) entries = parsed;
      } catch {
        // Ignore JSON error
      }
    }
  }

  return sortLeaderboard(
    entries.filter((entry) => entry && entry.version === 'v1' && typeof entry.score === 'number')
  ).slice(0, 10);
}

export function saveLeaderboardLocal(entries: LeaderboardEntry[], storage: Storage = window.localStorage): LeaderboardEntry[] {
  const sorted = sortLeaderboard(entries).slice(0, 10);
  storage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(sorted));
  return sorted;
}

export async function addLeaderboardEntry(
  entry: LeaderboardEntry,
  storage: Storage = window.localStorage,
): Promise<LeaderboardEntry[]> {
  // First get the most up-to-date board
  const current = await loadLeaderboard(storage);
  const updated = sortLeaderboard([...current, entry]).slice(0, 10);

  // Save globally to Pantry
  try {
    await fetch(PANTRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaderboard: updated }),
    });
  } catch (err) {
    console.warn('Failed to upload score to Pantry.', err);
  }

  // Backup locally
  return saveLeaderboardLocal(updated, storage);
}
