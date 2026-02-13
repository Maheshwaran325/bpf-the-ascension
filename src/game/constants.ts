import { AccessibilitySettings, LevelId } from '../types/game';

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reducedFlash: false,
  reducedShake: false,
};

export const MAX_HEALTH = 100;

export const LEVEL_ORDER: LevelId[] = [
  'burningMonk',
  'snap',
  'pixelBoss',
  'jinSakai',
  'ronin45',
  'godmode',
];

export const LEVEL_SCENE_KEY: Record<LevelId, string> = {
  burningMonk: 'Level1BurningMonkScene',
  snap: 'Level2SnapScene',
  pixelBoss: 'Level3PixelBossScene',
  jinSakai: 'Level4JinSakaiScene',
  ronin45: 'Level5RoninScene',
  godmode: 'Level6GodmodeScene',
};

export const LEVEL_LABELS: Record<LevelId, string> = {
  burningMonk: 'Level 1: The Burning Monk',
  snap: 'Level 2: The Snap',
  pixelBoss: 'Level 3: Pixel Boss',
  jinSakai: 'Level 4: Jin Sakai',
  ronin45: 'Level 5: The 45 Ronin',
  godmode: 'Level 6: GODMODE',
};

export const LEVEL_TARGET_MS: Record<LevelId, number> = {
  burningMonk: 20_000,
  snap: 45_000,
  pixelBoss: 50_000,
  jinSakai: 40_000,
  ronin45: 55_000,
  godmode: 90_000,
};

export const ACCESSIBILITY_STORAGE_KEY = 'bpf_ascension_accessibility_v1';
