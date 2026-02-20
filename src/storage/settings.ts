import {
  ACCESSIBILITY_STORAGE_KEY,
  AUDIO_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY,
  DEFAULT_AUDIO,
} from '../game/constants';
import { AccessibilitySettings, AudioSettings } from '../types/game';

export function loadAccessibilitySettings(
  storage: Storage = window.localStorage,
): AccessibilitySettings {
  const raw = storage.getItem(ACCESSIBILITY_STORAGE_KEY);
  if (!raw) {
    return { ...DEFAULT_ACCESSIBILITY };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
    return {
      reducedFlash: Boolean(parsed.reducedFlash),
      reducedShake: Boolean(parsed.reducedShake),
    };
  } catch {
    return { ...DEFAULT_ACCESSIBILITY };
  }
}

export function saveAccessibilitySettings(
  settings: AccessibilitySettings,
  storage: Storage = window.localStorage,
): AccessibilitySettings {
  storage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
  return settings;
}

export function loadAudioSettings(storage: Storage = window.localStorage): AudioSettings {
  const raw = storage.getItem(AUDIO_STORAGE_KEY);
  if (!raw) {
    return { ...DEFAULT_AUDIO };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      master: clamp01(parsed.master, DEFAULT_AUDIO.master),
      music: clamp01(parsed.music, DEFAULT_AUDIO.music),
      sfx: clamp01(parsed.sfx, DEFAULT_AUDIO.sfx),
      muted: Boolean(parsed.muted),
    };
  } catch {
    return { ...DEFAULT_AUDIO };
  }
}

export function saveAudioSettings(
  settings: AudioSettings,
  storage: Storage = window.localStorage,
): AudioSettings {
  const normalized: AudioSettings = {
    master: clamp01(settings.master, DEFAULT_AUDIO.master),
    music: clamp01(settings.music, DEFAULT_AUDIO.music),
    sfx: clamp01(settings.sfx, DEFAULT_AUDIO.sfx),
    muted: Boolean(settings.muted),
  };
  storage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function clamp01(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, value));
}
