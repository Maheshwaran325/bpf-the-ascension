import { LevelId } from '../types/game';
import { AssetDef, LevelThemeKey } from '../types/assets';

export const UI_ASSETS = {
  hudPanel: 'ui_hud_panel',
  modalPanel: 'ui_modal_panel',
  buttonPrimary: 'ui_button_primary',
  buttonSecondary: 'ui_button_secondary',
  card: 'ui_card',
} as const;

export const COMMON_SFX = {
  uiSelect: 'sfx_ui_select',
  uiConfirm: 'sfx_ui_confirm',
  hit: 'sfx_hit',
  levelClear: 'sfx_level_clear',
  restart: 'sfx_restart',
} as const;

export const THEME_KEY_BY_LEVEL: Record<LevelId, LevelThemeKey> = {
  burningMonk: 'l1_fire',
  snap: 'l2_snap',
  pixelBoss: 'l3_pixel',
  jinSakai: 'l4_kurosawa',
  ronin45: 'l5_ronin',
  godmode: 'l6_godmode',
};

export const LEVEL_THEME_ASSETS: Record<
  LevelId,
  { bg: string; music: string; sfx: string[]; playerSkin: string }
> = {
  burningMonk: {
    bg: 'bg_l1_fire',
    music: 'music_l1_fire',
    sfx: ['sfx_hit', 'sfx_ui_confirm'],
    playerSkin: 'player_core',
  },
  snap: {
    bg: 'bg_l2_snap',
    music: 'music_l2_snap',
    sfx: ['sfx_snap', 'sfx_capture'],
    playerSkin: 'player_core',
  },
  pixelBoss: {
    bg: 'bg_l3_pixel',
    music: 'music_l3_pixel',
    sfx: ['sfx_hit', 'sfx_capture'],
    playerSkin: 'player_core',
  },
  jinSakai: {
    bg: 'bg_l4_kurosawa',
    music: 'music_l4_kurosawa',
    sfx: ['sfx_parry', 'sfx_slash'],
    playerSkin: 'player_core',
  },
  ronin45: {
    bg: 'bg_l5_ronin',
    music: 'music_l5_ronin',
    sfx: ['sfx_hit', 'sfx_slash'],
    playerSkin: 'player_core',
  },
  godmode: {
    bg: 'bg_l6_godmode',
    music: 'music_l6_godmode',
    sfx: ['sfx_mutation', 'sfx_parry'],
    playerSkin: 'player_core',
  },
};

export const ASSET_MANIFEST: AssetDef[] = [
  { key: 'bg_menu', category: 'image', path: '/assets/bg/bg_menu.svg' },
  { key: 'bg_l1_fire', category: 'image', path: '/assets/bg/bg_l1_fire.svg' },
  { key: 'bg_l2_snap', category: 'image', path: '/assets/bg/bg_l2_snap.svg' },
  { key: 'bg_l3_pixel', category: 'image', path: '/assets/bg/bg_l3_pixel.svg' },
  { key: 'bg_l4_kurosawa', category: 'image', path: '/assets/bg/bg_l4_kurosawa.svg' },
  { key: 'bg_l5_ronin', category: 'image', path: '/assets/bg/bg_l5_ronin.svg' },
  { key: 'bg_l6_godmode', category: 'image', path: '/assets/bg/bg_l6_godmode.svg' },

  { key: 'player_core', category: 'image', path: '/assets/sprites/player_core.svg' },
  { key: 'l1_firebug', category: 'image', path: '/assets/sprites/l1_firebug.svg' },
  { key: 'l1_coffee', category: 'image', path: '/assets/sprites/l1_coffee.svg' },
  { key: 'l2_blur_enemy', category: 'image', path: '/assets/sprites/l2_blur_enemy.svg' },
  { key: 'l2_snap_marker', category: 'image', path: '/assets/sprites/l2_snap_marker.svg' },
  { key: 'l3_pixel_eye', category: 'image', path: '/assets/sprites/l3_pixel_eye.svg' },
  { key: 'l3_pixel_block', category: 'image', path: '/assets/sprites/l3_pixel_block.svg' },
  { key: 'l4_ninja', category: 'image', path: '/assets/sprites/l4_ninja.svg' },
  { key: 'l4_leaf', category: 'image', path: '/assets/sprites/l4_leaf.svg' },
  { key: 'l5_ronin', category: 'image', path: '/assets/sprites/l5_ronin.svg' },
  { key: 'l5_warning', category: 'image', path: '/assets/sprites/l5_warning.svg' },
  { key: 'l6_ai_avatar', category: 'image', path: '/assets/sprites/l6_ai_avatar.svg' },
  { key: 'l6_fire', category: 'image', path: '/assets/sprites/l6_fire.svg' },
  { key: 'l6_glitch', category: 'image', path: '/assets/sprites/l6_glitch.svg' },

  { key: UI_ASSETS.hudPanel, category: 'image', path: '/assets/ui/ui_hud_panel.svg' },
  { key: UI_ASSETS.modalPanel, category: 'image', path: '/assets/ui/ui_modal_panel.svg' },
  { key: UI_ASSETS.buttonPrimary, category: 'image', path: '/assets/ui/ui_button_primary.svg' },
  { key: UI_ASSETS.buttonSecondary, category: 'image', path: '/assets/ui/ui_button_secondary.svg' },
  { key: UI_ASSETS.card, category: 'image', path: '/assets/ui/ui_card.svg' },

  { key: 'music_menu_loop', category: 'audio', path: '/assets/audio/music/music.mp3' },
  { key: 'music_l1_fire', category: 'audio', path: '/assets/audio/music/music.mp3' },
  { key: 'music_l2_snap', category: 'audio', path: '/assets/audio/music/music.mp3' },
  { key: 'music_l3_pixel', category: 'audio', path: '/assets/audio/music/music.mp3' },
  { key: 'music_l4_kurosawa', category: 'audio', path: '/assets/audio/music/music.mp3' },
  { key: 'music_l5_ronin', category: 'audio', path: '/assets/audio/music/music.mp3' },
  { key: 'music_l6_godmode', category: 'audio', path: '/assets/audio/music/music.mp3' },

  { key: 'sfx_ui_select', category: 'audio', path: '/assets/audio/sfx/ui_select.wav' },
  { key: 'sfx_ui_confirm', category: 'audio', path: '/assets/audio/sfx/ui_confirm.wav' },
  { key: 'sfx_hit', category: 'audio', path: '/assets/audio/sfx/hit.wav' },
  { key: 'sfx_capture', category: 'audio', path: '/assets/audio/sfx/capture.wav' },
  { key: 'sfx_parry', category: 'audio', path: '/assets/audio/sfx/parry.wav' },
  { key: 'sfx_slash', category: 'audio', path: '/assets/audio/sfx/slash.wav' },
  { key: 'sfx_mutation', category: 'audio', path: '/assets/audio/sfx/mutation.wav' },
  { key: 'sfx_snap', category: 'audio', path: '/assets/audio/sfx/snap.wav' },
  { key: 'sfx_level_clear', category: 'audio', path: '/assets/audio/sfx/level_clear.wav' },
  { key: 'sfx_restart', category: 'audio', path: '/assets/audio/sfx/restart.wav' },
];
