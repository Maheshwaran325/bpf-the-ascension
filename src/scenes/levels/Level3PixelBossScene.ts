import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';

export class Level3PixelBossScene extends BaseLevelScene {
  private pixelBoss!: Phaser.GameObjects.Arc;

  private blocks!: Phaser.Physics.Arcade.Group;

  private resolution = 0;

  private phaseTwo = false;

  private lastShot = 0;

  constructor() {
    super('Level3PixelBossScene');
  }

  protected getLevelId() {
    return 'pixelBoss' as const;
  }

  protected getObjectiveLabel(): string {
    return 'Hit Pixel Eye with 4K Rays until resolution reaches 100%.';
  }

  protected onLevelStart(): void {
    this.cameras.main.setBackgroundColor('#1b1833');

    for (let x = 0; x < this.scale.width; x += 22) {
      for (let y = 120; y < this.scale.height; y += 22) {
        this.add.rectangle(x + 10, y + 10, 18, 18, (x + y) % 44 === 0 ? 0x443d8a : 0x2d295e, 0.5);
      }
    }

    this.pixelBoss = this.add.circle(this.scale.width - 180, this.scale.height / 2, 72, 0x9b83ff, 1);
    this.add.circle(this.scale.width - 180, this.scale.height / 2, 28, 0x0a0622, 1);

    this.blocks = this.physics.add.group({ allowGravity: false });

    this.time.addEvent({
      delay: 760,
      loop: true,
      callback: () => this.spawnBlockPattern(),
    });

    this.physics.add.overlap(this.player, this.blocks, (_player, block) => {
      block.destroy();
      this.damage(12);
    });
  }

  protected onLevelUpdate(_time: number, _delta: number): void {
    const now = this.time.now;

    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && now - this.lastShot > 190) {
      this.lastShot = now;
      this.fire4KRay();
    }

    if (!this.phaseTwo && this.resolution >= 50) {
      this.phaseTwo = true;
      this.add
        .text(this.scale.width / 2, 120, 'Phase Shift: Diagonal Burst', {
          fontFamily: 'monospace',
          fontSize: '28px',
          color: '#ffc4f2',
        })
        .setOrigin(0.5)
        .setDepth(300)
        .setScrollFactor(0);
    }

    for (const block of this.blocks.getChildren() as Phaser.GameObjects.Rectangle[]) {
      if (
        block.x < -60 ||
        block.x > this.scale.width + 60 ||
        block.y < -60 ||
        block.y > this.scale.height + 60
      ) {
        block.destroy();
      }
    }

    if (this.resolution >= 100) {
      this.completeLevel();
      return;
    }

    this.updateHud(`Resolution ${(this.resolution).toFixed(0)}% / 100% | J = 4K Ray`);
  }

  private spawnBlockPattern(): void {
    const patterns = this.phaseTwo ? 3 : 2;

    for (let i = 0; i < patterns; i += 1) {
      const y = this.phaseTwo
        ? Phaser.Math.Between(90, this.scale.height - 90)
        : this.pixelBoss.y + Phaser.Math.Between(-80, 80);

      const block = this.add.rectangle(this.pixelBoss.x - 60, y, 24, 24, 0x8f87ca, 0.95);
      this.physics.add.existing(block);
      const body = block.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);

      if (this.phaseTwo) {
        const vertical = Phaser.Math.Between(-220, 220);
        body.setVelocity(-Phaser.Math.Between(280, 360), vertical);
      } else {
        body.setVelocity(-Phaser.Math.Between(260, 340), Phaser.Math.Between(-60, 60));
      }

      this.blocks.add(block);
    }
  }

  private fire4KRay(): void {
    const ray = this.add.rectangle(this.player.x + 60, this.player.y, 110, 6, 0x6fd4ff, 0.95).setOrigin(0, 0.5);
    this.tweens.add({
      targets: ray,
      x: this.scale.width,
      alpha: 0,
      duration: 120,
      onComplete: () => ray.destroy(),
    });

    const canHit = Math.abs(this.player.y - this.pixelBoss.y) <= 120;
    if (!canHit) {
      return;
    }

    this.resolution = Math.min(100, this.resolution + 5);
    const red = Phaser.Math.Clamp(155 + this.resolution, 0, 255);
    const green = Phaser.Math.Clamp(130 + this.resolution, 0, 255);
    this.pixelBoss.setFillStyle(Phaser.Display.Color.GetColor(red, green, 255));
    this.runState.score += 20;
  }
}
