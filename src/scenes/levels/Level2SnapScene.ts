import Phaser from 'phaser';
import { BaseLevelScene } from './BaseLevelScene';

const REQUIRED_CAPTURES = 50;
const SHUTTER_INTERVAL_MS = 1_200;
const SHUTTER_WINDOW_MS = 180;

export class Level2SnapScene extends BaseLevelScene {
  private blurEnemies!: Phaser.Physics.Arcade.Group;

  private captured = 0;

  private flashOverlay?: Phaser.GameObjects.Rectangle;

  private pulseRing?: Phaser.GameObjects.Arc;

  constructor() {
    super('Level2SnapScene');
  }

  protected getLevelId() {
    return 'snap' as const;
  }

  protected getObjectiveLabel(): string {
    return 'Capture 50 clear frames during shutter windows.';
  }

  protected onLevelStart(): void {
    this.cameras.main.setBackgroundColor('#0b1736');

    for (let i = 0; i < 36; i += 1) {
      const stripe = this.add.rectangle(i * 40, this.scale.height / 2, 20, this.scale.height, 0x2d3c7f, i % 2 === 0 ? 0.26 : 0.18);
      stripe.setOrigin(0, 0.5);
    }

    this.blurEnemies = this.physics.add.group({ allowGravity: false });

    for (let i = 0; i < 12; i += 1) {
      this.spawnBlurEnemy();
    }

    this.flashOverlay = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0xffffff, 0)
      .setDepth(900);

    this.pulseRing = this.add.circle(this.scale.width / 2, this.scale.height / 2, 40, 0xeaf6ff, 0).setDepth(901);

    this.time.addEvent({
      delay: 1_000,
      loop: true,
      callback: () => this.spawnBlurEnemy(),
    });

  }

  protected onLevelUpdate(_time: number, _delta: number): void {
    const elapsed = this.getLevelElapsedMs();
    const cycleTime = elapsed % SHUTTER_INTERVAL_MS;
    const inWindow = cycleTime <= SHUTTER_WINDOW_MS;

    if (cycleTime < 50) {
      this.triggerShutterEffect();
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      if (inWindow) {
        this.captureEnemy();
      } else {
        this.damage(5);
      }
    }

    for (const enemy of this.blurEnemies.getChildren() as Phaser.GameObjects.Ellipse[]) {
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      if (enemy.x < -40 || enemy.x > this.scale.width + 40 || enemy.y < -40 || enemy.y > this.scale.height + 40) {
        enemy.setPosition(
          Phaser.Math.Between(80, this.scale.width - 80),
          Phaser.Math.Between(90, this.scale.height - 80),
        );
        body.setVelocity(Phaser.Math.Between(-560, 560), Phaser.Math.Between(-560, 560));
      }
    }

    if (this.captured >= REQUIRED_CAPTURES) {
      this.completeLevel();
      return;
    }

    const remaining = REQUIRED_CAPTURES - this.captured;
    this.updateHud(`Captures ${this.captured}/${REQUIRED_CAPTURES} | Window ${inWindow ? 'OPEN' : 'CLOSED'} | Remaining ${remaining}`);
  }

  private spawnBlurEnemy(): void {
    const enemy = this.add.ellipse(
      Phaser.Math.Between(80, this.scale.width - 80),
      Phaser.Math.Between(110, this.scale.height - 90),
      28,
      18,
      0x88a8ff,
      0.65,
    );
    this.physics.add.existing(enemy);
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(Phaser.Math.Between(-600, 600), Phaser.Math.Between(-600, 600));
    this.blurEnemies.add(enemy);
  }

  private captureEnemy(): void {
    const enemies = this.blurEnemies.getChildren() as Phaser.GameObjects.Ellipse[];
    if (enemies.length === 0) {
      return;
    }

    let target = enemies[0];
    let bestDistance = Number.MAX_SAFE_INTEGER;

    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.BetweenPoints(this.player, enemy);
      if (distance < bestDistance) {
        bestDistance = distance;
        target = enemy;
      }
    }

    target.destroy();
    this.captured += 1;
    this.runState.score += 15;
    this.spawnBlurEnemy();
  }

  private triggerShutterEffect(): void {
    if (!this.flashOverlay || !this.pulseRing) {
      return;
    }

    if (this.runState.accessibility.reducedFlash) {
      this.pulseRing.setRadius(40);
      this.pulseRing.setAlpha(0.68);
      this.tweens.add({
        targets: this.pulseRing,
        radius: 260,
        alpha: 0,
        duration: 160,
        ease: 'Sine.Out',
      });
      return;
    }

    this.flashOverlay.setAlpha(0.55);
    this.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 130,
      ease: 'Sine.Out',
    });
  }
}
