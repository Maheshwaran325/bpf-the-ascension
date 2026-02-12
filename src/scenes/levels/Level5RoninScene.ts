import Phaser from 'phaser';
import { computeRamLoad } from '../../systems/mechanics';
import { BaseLevelScene } from './BaseLevelScene';

const TOTAL_ENEMIES = 45;

export class Level5RoninScene extends BaseLevelScene {
  private enemies!: Phaser.Physics.Arcade.Group;

  private ramLoad = 0;

  constructor() {
    super('Level5RoninScene');
  }

  protected getLevelId() {
    return 'ronin45' as const;
  }

  protected getObjectiveLabel(): string {
    return 'Auto-testing gun active. Clear all 45 before RAM reaches 100%.';
  }

  protected onLevelStart(): void {
    this.cameras.main.setBackgroundColor('#1a1d25');

    this.player.setPosition(this.scale.width / 2, this.scale.height / 2);

    for (let i = 0; i < 80; i += 1) {
      this.add.rectangle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(90, this.scale.height),
        Phaser.Math.Between(4, 14),
        Phaser.Math.Between(16, 50),
        0x28313f,
        0.45,
      );
    }

    this.enemies = this.physics.add.group({ allowGravity: false });

    for (let i = 0; i < TOTAL_ENEMIES; i += 1) {
      this.spawnEnemy();
    }

    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.fireAutoTest(),
    });

    this.physics.add.overlap(this.player, this.enemies, () => {
      this.damage(4);
    });
  }

  protected onLevelUpdate(_time: number, delta: number): void {
    const aliveEnemies = this.enemies.getChildren().length;

    for (const enemy of this.enemies.getChildren() as Phaser.GameObjects.Rectangle[]) {
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      this.physics.moveToObject(body.gameObject, this.player, 70);
    }

    this.ramLoad += (aliveEnemies / TOTAL_ENEMIES) * (delta / 1000) * 1.15;
    this.ramLoad = Math.max(0, this.ramLoad);

    if (this.ramLoad >= 100) {
      this.restartCurrentLevel();
      return;
    }

    if (aliveEnemies <= 0) {
      this.completeLevel();
      return;
    }

    const occupancy = computeRamLoad(aliveEnemies, TOTAL_ENEMIES);
    this.updateHud(
      `Remaining ${aliveEnemies}/${TOTAL_ENEMIES} | RAM ${this.ramLoad.toFixed(1)}% | Occupancy ${occupancy}%`,
    );
  }

  private spawnEnemy(): void {
    const edge = Phaser.Math.Between(0, 3);
    let x = 0;
    let y = 0;

    if (edge === 0) {
      x = Phaser.Math.Between(20, this.scale.width - 20);
      y = 20;
    } else if (edge === 1) {
      x = this.scale.width - 20;
      y = Phaser.Math.Between(20, this.scale.height - 20);
    } else if (edge === 2) {
      x = Phaser.Math.Between(20, this.scale.width - 20);
      y = this.scale.height - 20;
    } else {
      x = 20;
      y = Phaser.Math.Between(20, this.scale.height - 20);
    }

    const enemy = this.add.rectangle(x, y, 24, 24, 0xffad6b);
    this.physics.add.existing(enemy);
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCollideWorldBounds(true);
    body.setBounce(0);
    enemy.setData('hp', 20);
    this.enemies.add(enemy);
  }

  private fireAutoTest(): void {
    const enemies = this.enemies.getChildren() as Phaser.GameObjects.Rectangle[];
    if (enemies.length === 0) {
      return;
    }

    let nearest = enemies[0];
    let best = Number.MAX_VALUE;

    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance < best) {
        best = distance;
        nearest = enemy;
      }
    }

    const tracer = this.add.line(0, 0, this.player.x, this.player.y, nearest.x, nearest.y, 0x7df8ff, 0.9).setOrigin(0, 0);
    this.time.delayedCall(60, () => tracer.destroy());

    const nextHp = (nearest.getData('hp') as number) - 1;
    nearest.setData('hp', nextHp);

    if (nextHp <= 0) {
      nearest.destroy();
      this.runState.score += 25;
      this.ramLoad = Math.max(0, this.ramLoad - 1.6);
    }
  }
}
