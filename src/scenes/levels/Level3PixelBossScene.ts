import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';

const TARGET_RESOLUTION = 70;
const RESOLUTION_PER_HIT = 5;
const PHASE_TWO_AT = 35;

export class Level3PixelBossScene extends BaseLevelScene {
  private pixelBoss!: Phaser.GameObjects.Image;

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
    return 'SPACE fires 4K ray. Dodge incoming pixel blocks to 70% resolution.';
  }

  protected onLevelStart(): void {
    this.resolution = 0;
    this.phaseTwo = false;
    this.lastShot = 0;
    this.lastCollisionMs = -1000;

    this.pixelBoss = this.add
      .image(this.scale.width - 170, this.scale.height / 2, 'l3_pixel_eye')
      .setDisplaySize(180, 180)
      .setDepth(130);

    this.blocks = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(this.player, this.blocks, (_player, block) => {
      const projectile = block as Phaser.Physics.Arcade.Image;
      if (!projectile.active) {
        return;
      }
      projectile.destroy();
      const now = this.time.now;
      if (now - this.lastCollisionMs > 200) {
        this.lastCollisionMs = now;
        this.damage(14);
      }
    });

    this.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => this.spawnBlockWave(),
    });
  }

  protected onLevelUpdate(_time: number, _delta: number): void {
    const now = this.time.now;

    if (Phaser.Input.Keyboard.JustDown(this.actionKey) && now - this.lastShot > 180) {
      this.lastShot = now;
      this.fire4KRay();
    }

    if (!this.phaseTwo && this.resolution >= PHASE_TWO_AT) {
      this.phaseTwo = true;
      const shiftText = this.add
        .text(this.scale.width / 2, 120, 'Phase Shift: Diagonal Burst', {
          fontFamily: 'monospace',
          fontSize: '28px',
          color: '#ffc4f2',
        })
        .setOrigin(0.5)
        .setDepth(300)
        .setScrollFactor(0);

      this.tweens.add({
        targets: shiftText,
        alpha: 0,
        duration: 1600,
        delay: 1200,
        onComplete: () => shiftText.destroy(),
      });
    }

    for (const block of [...this.blocks.getChildren()] as Phaser.Physics.Arcade.Image[]) {
      if (!block.active) {
        continue;
      }

      block.rotation += 0.05;

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
      `Resolution ${this.resolution.toFixed(0)}% / ${TARGET_RESOLUTION}% | SPACE = 4K Ray | Blocks ${this.blocks.getChildren().length}`,
    );
  }

  private spawnBlockWave(): void {
    const count = this.phaseTwo ? 6 : 4;

    for (let i = 0; i < count; i += 1) {
      const spread = this.phaseTwo ? 58 : 82;
      const offset = (i - (count - 1) / 2) * spread;
      const y = Phaser.Math.Clamp(this.player.y + offset + Phaser.Math.Between(-18, 18), 90, this.scale.height - 90);
      this.spawnProjectile(this.pixelBoss.x - 84, y, this.phaseTwo ? 34 : 30);
    }

    if (this.phaseTwo) {
      this.spawnProjectile(this.pixelBoss.x - 92, 96, 26, Phaser.Math.Between(150, 260));
      this.spawnProjectile(this.pixelBoss.x - 92, this.scale.height - 96, 26, Phaser.Math.Between(-260, -150));
    }
  }

  private spawnProjectile(spawnX: number, spawnY: number, size: number, velocityY?: number): void {
    const block = this.physics.add
      .image(spawnX, spawnY, 'l3_pixel_block')
      .setDisplaySize(size, size)
      .setDepth(150)
      .setAlpha(0.96);

    // IMPORTANT: Add to group BEFORE setting velocity.
    // Phaser's group.add() resets body velocity to the group default (0,0).
    this.blocks.add(block);

    (block.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    block.setVelocity(
      -Phaser.Math.Between(this.phaseTwo ? 390 : 350, this.phaseTwo ? 540 : 470),
      velocityY ?? Phaser.Math.Between(-120, 120),
    );
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

    const canHit = Math.abs(this.player.y - this.pixelBoss.y) <= 124;
    if (!canHit) {
      return;
    }

    this.resolution = Math.min(TARGET_RESOLUTION, this.resolution + RESOLUTION_PER_HIT);
    this.pixelBoss.setTint(Phaser.Display.Color.GetColor(180 + this.resolution, 170 + this.resolution, 255));
    this.time.delayedCall(90, () => this.pixelBoss.clearTint());
    this.runState.score += 20;
  }
}
