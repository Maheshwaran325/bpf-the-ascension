import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { MenuScene } from '../scenes/MenuScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { GauntletScene } from '../scenes/GauntletScene';
import { ResultScene } from '../scenes/ResultScene';
import { LeaderboardScene } from '../scenes/LeaderboardScene';
import { Level1BurningMonkScene } from '../scenes/levels/Level1BurningMonkScene';
import { Level2SnapScene } from '../scenes/levels/Level2SnapScene';
import { Level3PixelBossScene } from '../scenes/levels/Level3PixelBossScene';
import { Level4JinSakaiScene } from '../scenes/levels/Level4JinSakaiScene';
import { Level5RoninScene } from '../scenes/levels/Level5RoninScene';
import { Level6GodmodeScene } from '../scenes/levels/Level6GodmodeScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#081014',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    SettingsScene,
    GauntletScene,
    ResultScene,
    LeaderboardScene,
    Level1BurningMonkScene,
    Level2SnapScene,
    Level3PixelBossScene,
    Level4JinSakaiScene,
    Level5RoninScene,
    Level6GodmodeScene,
  ],
};
