import Phaser from 'phaser';
import { ASSET_MANIFEST } from '../game/assets';

export class BootScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Rectangle;

  private progressText?: Phaser.GameObjects.Text;

  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor('#04070d');
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 92, 'BPF: THE ASCENSION', {
        fontFamily: 'monospace',
        fontSize: '52px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.progressText = this.add
      .text(width / 2, height / 2 - 20, 'Loading 0%', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#b5d7ff',
      })
      .setOrigin(0.5);

    this.add.rectangle(width / 2, height / 2 + 26, 520, 22, 0x1c2d40, 0.85).setStrokeStyle(2, 0x395b83, 0.9);
    this.progressBar = this.add.rectangle(width / 2 - 258, height / 2 + 26, 4, 14, 0x8de4ff, 1).setOrigin(0, 0.5);

    for (const asset of ASSET_MANIFEST) {
      if (asset.category === 'image') {
        this.load.image(asset.key, asset.path);
      } else if (asset.category === 'audio') {
        this.load.audio(asset.key, asset.path);
      } else if (asset.category === 'spritesheet' && asset.frameConfig) {
        this.load.spritesheet(asset.key, asset.path, asset.frameConfig);
      } else if (asset.category === 'bitmapFont') {
        this.load.bitmapFont(asset.key, asset.path, asset.path.replace(/\.\w+$/, '.xml'));
      }
    }

    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      this.progressText?.setText(`Loading ${Math.round(progress * 100)}%`);
      this.progressBar?.setSize(516 * Phaser.Math.Clamp(progress, 0, 1), 14);
    });
  }

  create(): void {
    this.progressText?.setText('Loading 100%');
    this.time.delayedCall(150, () => this.scene.start('MenuScene'));
  }
}
