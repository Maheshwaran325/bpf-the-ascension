import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';

const REQUIRED_CAPTURES = 25;
const SNAP_RADIUS = 140;
const SNAP_COOLDOWN_MS = 650;
const MAX_ENEMIES = 26;

export class Level2SnapScene extends BaseLevelScene {
  private blurEnemies!: Phaser.Physics.Arcade.Group;

  private captured = 0;

  private lastSnapMs = -10_000;

  private pulseMarker?: Phaser.GameObjects.Image;

  constructor() {
    super('Level2SnapScene');
  }

  protected getLevelId() {
    return 'snap' as const;
  }

  protected getObjectiveLabel(): string {
    return 'SPACE pulse captures nearby targets. Capture 25 clear frames.';
  }

  protected onLevelStart(): void {
    this.captured = 0;
    this.lastSnapMs = -10_000;

    this.blurEnemies = this.physics.add.group({ allowGravity: false });

    for (let i = 0; i < 16; i += 1) {
      this.spawnBlurEnemy();
    }

    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        if (this.blurEnemies.getChildren().length < MAX_ENEMIES) {
          this.spawnBlurEnemy();
        }
      },
    });

    this.physics.add.overlap(this.player, this.blurEnemies, (_player, enemy) => {
      const sprite = enemy as Phaser.Physics.Arcade.Image;
      this.damage(5);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      sprite.setVelocity(body.velocity.x * -0.8, body.velocity.y * -0.8);
    });

    this.pulseMarker = this.add
      .image(this.player.x, this.player.y, 'l2_snap_marker')
      .setDisplaySize(26, 26)
      .setDepth(905)
      .setAlpha(0);
  }

  protected onLevelUpdate(_time: number, _delta: number): void {
    const elapsed = this.getLevelElapsedMs();

    this.pulseMarker?.setPosition(this.player.x, this.player.y);

    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      if (elapsed - this.lastSnapMs >= SNAP_COOLDOWN_MS) {
        this.lastSnapMs = elapsed;
        this.performSnap();
      }
    }

    for (const enemy of this.blurEnemies.getChildren() as Phaser.Physics.Arcade.Image[]) {
      if (enemy.x < -40 || enemy.x > this.scale.width + 40 || enemy.y < -40 || enemy.y > this.scale.height + 40) {
        enemy.setPosition(Phaser.Math.Between(80, this.scale.width - 80), Phaser.Math.Between(90, this.scale.height - 80));
        enemy.setVelocity(Phaser.Math.Between(-520, 520), Phaser.Math.Between(-520, 520));
      }

      enemy.rotation += 0.04;
    }

    if (this.captured >= REQUIRED_CAPTURES) {
      this.completeLevel();
      return;
    }

    const remaining = REQUIRED_CAPTURES - this.captured;
    const cooldownLeft = Math.max(0, SNAP_COOLDOWN_MS - (elapsed - this.lastSnapMs));
    this.updateHud(
      `Captured ${this.captured}/${REQUIRED_CAPTURES} | SPACE pulse ${SNAP_RADIUS}px | Cooldown ${(cooldownLeft / 1000).toFixed(1)}s | Remaining ${remaining}`,
    );
  }

  private spawnBlurEnemy(): void {
    const enemy = this.physics.add
      .image(Phaser.Math.Between(80, this.scale.width - 80), Phaser.Math.Between(110, this.scale.height - 90), 'l2_blur_enemy')
      .setDisplaySize(36, 22)
      .setAlpha(0.88)
      .setDepth(140);

    (enemy.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    enemy.setVelocity(Phaser.Math.Between(-560, 560), Phaser.Math.Between(-560, 560));
    this.blurEnemies.add(enemy);
  }

  private performSnap(): void {
    if (!this.pulseMarker) {
      return;
    }

    this.pulseMarker.setDisplaySize(24, 24);
    this.pulseMarker.setAlpha(0.95);

    this.tweens.add({
      targets: this.pulseMarker,
      displayWidth: SNAP_RADIUS * 2,
      displayHeight: SNAP_RADIUS * 2,
      alpha: 0,
      duration: 250,
      ease: 'Sine.Out',
    });

    const enemies = this.blurEnemies.getChildren() as Phaser.Physics.Arcade.Image[];
    const hits = enemies.filter((enemy) => {
      if (!enemy.active) {
        return false;
      }
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      return distance <= SNAP_RADIUS;
    });

    if (hits.length === 0) {
      this.damage(3);
      return;
    }

    const captures = hits.slice(0, 4);
    for (const enemy of captures) {
      enemy.destroy();
      this.captured += 1;
      this.runState.score += 18;

      this.time.delayedCall(360, () => {
        if (this.blurEnemies.getChildren().length < MAX_ENEMIES) {
          this.spawnBlurEnemy();
        }
      });
    }
  }
}
