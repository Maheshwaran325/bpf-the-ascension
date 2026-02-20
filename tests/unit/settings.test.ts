import { describe, expect, it } from 'vitest';
import { DEFAULT_AUDIO } from '../../src/game/constants';
import {
  loadAccessibilitySettings,
  loadAudioSettings,
  saveAccessibilitySettings,
  saveAudioSettings,
} from '../../src/storage/settings';

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

describe('settings storage', () => {
  it('loads accessibility defaults and persists toggles', () => {
    const storage = new MockStorage();

    expect(loadAccessibilitySettings(storage)).toEqual({ reducedFlash: false, reducedShake: false });

    saveAccessibilitySettings({ reducedFlash: true, reducedShake: true }, storage);

    expect(loadAccessibilitySettings(storage)).toEqual({ reducedFlash: true, reducedShake: true });
  });

  it('loads audio defaults and clamps invalid values', () => {
    const storage = new MockStorage();

    expect(loadAudioSettings(storage)).toEqual(DEFAULT_AUDIO);

    saveAudioSettings({ master: 2, music: -1, sfx: 0.4, muted: true }, storage);

    expect(loadAudioSettings(storage)).toEqual({
      master: 1,
      music: 0,
      sfx: 0.4,
      muted: true,
    });
  });
});
