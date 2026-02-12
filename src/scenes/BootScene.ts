import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#04070d');
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'BPF: THE ASCENSION', {
        fontFamily: 'monospace',
        fontSize: '54px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.time.delayedCall(450, () => {
      this.scene.start('MenuScene');
    });
  }
}
