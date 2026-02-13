import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';

const TARGET_RESOLUTION = 70;
const RESOLUTION_PER_HIT = 5;
const PHASE_TWO_AT = 35;

export class Level3PixelBossScene extends BaseLevelScene {
  private pixelBoss!: Phaser.GameObjects.Arc;

  private bossPupil!: Phaser.GameObjects.Arc;

  private blocks!: Phaser.Physics.Arcade.Group;

  private resolution = 0;

  private phaseTwo = false;

  private lastShot = 0;

  private lastCollisionMs = -1000;

  constructor() {
    super('Level3PixelBossScene');
  }

  protected getLevelId() {
    return 'pixelBoss' as const;
  }

  protected getObjectiveLabel(): string {
    return 'Fire SPACE 4K Rays. Dodge pixel blocks to reach 70% resolution.';
  }

  protected onLevelStart(): void {
    this.resolution = 0;
    this.phaseTwo = false;
    this.lastShot = 0;
    this.lastCollisionMs = -1000;

    this.cameras.main.setBackgroundColor('#1b1833');

    for (let x = 0; x < this.scale.width; x += 22) {
      for (let y = 120; y < this.scale.height; y += 22) {
        this.add.rectangle(x + 10, y + 10, 18, 18, (x + y) % 44 === 0 ? 0x443d8a : 0x2d295e, 0.5);
      }
    }

    this.pixelBoss = this.add.circle(this.scale.width - 180, this.scale.height / 2, 72, 0x9b83ff, 1).setDepth(110);
    this.bossPupil = this.add.circle(this.scale.width - 180, this.scale.height / 2, 28, 0x0a0622, 1).setDepth(111);

    this.blocks = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(this.player, this.blocks, (_player, block) => {
      const b = block as Phaser.GameObjects.Rectangle;
      if (!b.active) {
        return;
      }
      b.destroy();
      const now = this.time.now;
      if (now - this.lastCollisionMs > 220) {
        this.lastCollisionMs = now;
        this.damage(14);
      }
    });

    this.time.addEvent({
      delay: 520,
      loop: true,
      callback: () => this.spawnBlockWave(),
    });
  }

  protected onLevelUpdate(_time: number, _delta: number): void {
    const now = this.time.now;

    if (
      (Phaser.Input.Keyboard.JustDown(this.actionKey) || Phaser.Input.Keyboard.JustDown(this.attackKey)) &&
      now - this.lastShot > 190
    ) {
      this.lastShot = now;
      this.fire4KRay();
    }

    if (!this.phaseTwo && this.resolution >= PHASE_TWO_AT) {
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

    // Clean up out-of-bounds blocks
    for (const block of [...this.blocks.getChildren()] as Phaser.GameObjects.Rectangle[]) {
      if (!block.active) {
        continue;
      }

      if (
        block.x < -80 ||
        block.x > this.scale.width + 80 ||
        block.y < -80 ||
        block.y > this.scale.height + 80
      ) {
        block.destroy();
      }
    }

    if (this.resolution >= TARGET_RESOLUTION) {
      this.completeLevel();
      return;
    }

    this.updateHud(
      `Resolution ${this.resolution.toFixed(0)}% / ${TARGET_RESOLUTION}% | SPACE = 4K Ray | Obstacles ${this.blocks.getChildren().length}`,
    );
  }

  private spawnBlockWave(): void {
    const count = this.phaseTwo ? 5 : 3;

    for (let i = 0; i < count; i += 1) {
      const spread = this.phaseTwo ? 60 : 84;
      const offset = (i - (count - 1) / 2) * spread;
      const y = Phaser.Math.Clamp(this.player.y + offset + Phaser.Math.Between(-16, 16), 90, this.scale.height - 90);
      this.spawnProjectile(this.pixelBoss.x - 70, y, this.phaseTwo ? 30 : 26);
    }

    if (this.phaseTwo) {
      this.spawnProjectile(this.pixelBoss.x - 82, 96, 24, Phaser.Math.Between(140, 240));
      this.spawnProjectile(this.pixelBoss.x - 82, this.scale.height - 96, 24, Phaser.Math.Between(-240, -140));
    }
  }

  private spawnProjectile(spawnX: number, spawnY: number, size: number, velocityY?: number): void {
    const block = this.add
      .rectangle(spawnX, spawnY, size, size, this.phaseTwo ? 0xff8acc : 0xb9a2ff, 0.96)
      .setDepth(120);

    this.physics.add.existing(block);
    this.blocks.add(block); // Add to group FIRST, before setting velocity

    const body = block.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(
      -Phaser.Math.Between(this.phaseTwo ? 360 : 320, this.phaseTwo ? 500 : 430),
      velocityY ?? Phaser.Math.Between(-90, 90),
    );

    this.tweens.add({
      targets: block,
      angle: this.phaseTwo ? 180 : 90,
      duration: 600,
      ease: 'Linear',
    });
  }

  private fire4KRay(): void {
    const ray = this.add.rectangle(this.player.x + 60, this.player.y, 110, 7, 0x6fd4ff, 0.95).setOrigin(0, 0.5);
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

    this.resolution = Math.min(TARGET_RESOLUTION, this.resolution + RESOLUTION_PER_HIT);
    const red = Phaser.Math.Clamp(155 + this.resolution, 0, 255);
    const green = Phaser.Math.Clamp(130 + this.resolution, 0, 255);
    this.pixelBoss.setFillStyle(Phaser.Display.Color.GetColor(red, green, 255));
    this.bossPupil.setScale(1 + this.resolution / 500);
    this.runState.score += 20;
  }
}
