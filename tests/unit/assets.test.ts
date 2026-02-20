import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST, LEVEL_THEME_ASSETS } from '../../src/game/assets';
import { LEVEL_ORDER } from '../../src/game/constants';

describe('asset manifest', () => {
  it('uses unique keys in manifest', () => {
    const keys = ASSET_MANIFEST.map((asset) => asset.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('covers each level with required theme keys', () => {
    for (const level of LEVEL_ORDER) {
      const theme = LEVEL_THEME_ASSETS[level];
      expect(theme.bg).toBeTruthy();
      expect(theme.music).toBeTruthy();
      expect(theme.playerSkin).toBeTruthy();
      expect(theme.sfx.length).toBeGreaterThan(0);
    }
  });
});
