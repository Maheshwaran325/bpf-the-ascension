import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';

const REQUIRED_CAPTURES = 24;
const SNAP_RADIUS = 150;
const SNAP_COOLDOWN_MS = 600;
const MAX_ENEMIES = 24;

export class Level2SnapScene extends BaseLevelScene {
  private blurEnemies!: Phaser.Physics.Arcade.Group;

  private captured = 0;

  private lastSnapMs = -10_000;

  private pulseRing?: Phaser.GameObjects.Arc;

  private pulseFill?: Phaser.GameObjects.Arc;

  constructor() {
    super('Level2SnapScene');
  }

  protected getLevelId() {
    return 'snap' as const;
  }

  protected getObjectiveLabel(): string {
    return 'Use SPACE to snap nearby blur enemies. Capture 24 frames.';
  }

  protected onLevelStart(): void {
    this.captured = 0;
    this.lastSnapMs = -10_000;

    this.cameras.main.setBackgroundColor('#0b1736');

    for (let i = 0; i < 36; i += 1) {
      const stripe = this.add.rectangle(
        i * 40,
        this.scale.height / 2,
        20,
        this.scale.height,
        0x2d3c7f,
        i % 2 === 0 ? 0.26 : 0.18,
      );
      stripe.setOrigin(0, 0.5);
    }

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
      const ellipse = enemy as Phaser.GameObjects.Ellipse;
      const body = ellipse.body as Phaser.Physics.Arcade.Body;
      this.damage(4);
      body.setVelocity(body.velocity.x * -0.8, body.velocity.y * -0.8);
    });

    this.pulseFill = this.add.circle(this.player.x, this.player.y, 10, 0xffffff, 0).setDepth(899);
    this.pulseRing = this.add.circle(this.player.x, this.player.y, 10, 0xffffff, 0).setDepth(900);
  }

  protected onLevelUpdate(_time: number, _delta: number): void {
    const elapsed = this.getLevelElapsedMs();

    this.pulseFill?.setPosition(this.player.x, this.player.y);
    this.pulseRing?.setPosition(this.player.x, this.player.y);

    if (Phaser.Input.Keyboard.JustDown(this.actionKey) || Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      if (elapsed - this.lastSnapMs >= SNAP_COOLDOWN_MS) {
        this.lastSnapMs = elapsed;
        this.performSnap();
      }
    }

    for (const enemy of this.blurEnemies.getChildren() as Phaser.GameObjects.Ellipse[]) {
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      if (enemy.x < -40 || enemy.x > this.scale.width + 40 || enemy.y < -40 || enemy.y > this.scale.height + 40) {
        enemy.setPosition(Phaser.Math.Between(80, this.scale.width - 80), Phaser.Math.Between(90, this.scale.height - 80));
        body.setVelocity(Phaser.Math.Between(-520, 520), Phaser.Math.Between(-520, 520));
      }
    }

    if (this.captured >= REQUIRED_CAPTURES) {
      this.completeLevel();
      return;
    }

    const remaining = REQUIRED_CAPTURES - this.captured;
    const cooldownLeft = Math.max(0, SNAP_COOLDOWN_MS - (elapsed - this.lastSnapMs));
    this.updateHud(
      `Captured ${this.captured}/${REQUIRED_CAPTURES} | SPACE Snap Radius ${SNAP_RADIUS}px | Cooldown ${(cooldownLeft / 1000).toFixed(1)}s | Remaining ${remaining}`,
    );
  }

  private spawnBlurEnemy(): void {
    const enemy = this.add.ellipse(
      Phaser.Math.Between(80, this.scale.width - 80),
      Phaser.Math.Between(110, this.scale.height - 90),
      30,
      18,
      0x88a8ff,
      0.7,
    );

    this.physics.add.existing(enemy);
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(Phaser.Math.Between(-560, 560), Phaser.Math.Between(-560, 560));
    this.blurEnemies.add(enemy);
  }

  private performSnap(): void {
    if (!this.pulseRing || !this.pulseFill) {
      return;
    }

    this.pulseFill.setRadius(18);
    this.pulseFill.setAlpha(0.2);
    this.pulseRing.setRadius(18);
    this.pulseRing.setAlpha(0.9);

    this.tweens.add({
      targets: this.pulseFill,
      radius: SNAP_RADIUS,
      alpha: 0,
      duration: 240,
      ease: 'Sine.Out',
    });

    this.tweens.add({
      targets: this.pulseRing,
      radius: SNAP_RADIUS,
      alpha: 0,
      duration: 240,
      ease: 'Sine.Out',
    });

    const enemies = this.blurEnemies.getChildren() as Phaser.GameObjects.Ellipse[];
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

      this.time.delayedCall(420, () => {
        if (this.blurEnemies.getChildren().length < MAX_ENEMIES) {
          this.spawnBlurEnemy();
        }
      });
    }
  }
}
