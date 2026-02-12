import { DEFAULT_ACCESSIBILITY, ACCESSIBILITY_STORAGE_KEY } from '../game/constants';
import { AccessibilitySettings } from '../types/game';

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
