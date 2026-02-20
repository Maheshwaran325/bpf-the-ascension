export type AssetCategory = 'image' | 'spritesheet' | 'audio' | 'bitmapFont';

export interface AssetDef {
  key: string;
  category: AssetCategory;
  path: string;
  frameConfig?: {
    frameWidth: number;
    frameHeight: number;
  };
}

export type LevelThemeKey =
  | 'l1_fire'
  | 'l2_snap'
  | 'l3_pixel'
  | 'l4_kurosawa'
  | 'l5_ronin'
  | 'l6_godmode';
