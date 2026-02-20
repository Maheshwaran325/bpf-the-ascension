import Phaser from 'phaser';
import { computeRamLoad } from '../../systems/mechanics';
import { BaseLevelScene } from './BaseLevelScene';

const TOTAL_ENEMIES = 25;
const WAVE_SIZE = 8;
const WAVE_INTERVAL_MS = 1400;
const CHARGE_SPEED_MIN = 340;
const CHARGE_SPEED_MAX = 560;

export class Level5RoninScene extends BaseLevelScene {
  private enemies!: Phaser.Physics.Arcade.Group;

  private ramLoad = 0;

  private spawned = 0;

  private killed = 0;

  constructor() {
    super('Level5RoninScene');
  }

  protected getLevelId() {
    return 'ronin45' as const;
  }

  protected getObjectiveLabel(): string {
    return 'Dodge ronin charges from all edges. Auto-gun active. Clear 25 ronin.';
  }

  protected onLevelStart(): void {
    this.ramLoad = 0;
    this.spawned = 0;
    this.killed = 0;

    this.player.setPosition(this.scale.width / 2, this.scale.height / 2);

    this.enemies = this.physics.add.group({ allowGravity: false });

    this.spawnWave();

    this.time.addEvent({
      delay: WAVE_INTERVAL_MS,
      loop: true,
      callback: () => this.spawnWave(),
    });

    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.fireAutoTest(),
    });

    this.physics.add.overlap(this.player, this.enemies, (_p, enemy) => {
      const e = enemy as Phaser.Physics.Arcade.Image;
      if (!e.active) {
        return;
      }
      e.destroy();
      this.killed += 1;
      this.damage(18);
    });
  }

  protected onLevelUpdate(_time: number, delta: number): void {
    const aliveEnemies = this.enemies.getChildren().length;
    const remaining = TOTAL_ENEMIES - this.killed;

    for (const enemy of [...this.enemies.getChildren()] as Phaser.Physics.Arcade.Image[]) {
      if (!enemy.active) {
        continue;
      }
      if (
        enemy.x < -100 ||
        enemy.x > this.scale.width + 100 ||
        enemy.y < -100 ||
        enemy.y > this.scale.height + 100
      ) {
        enemy.destroy();
        this.spawned = Math.max(0, this.spawned - 1);
      }
    }

    this.ramLoad += (aliveEnemies * 0.2 + 0.1) * (delta / 1000) * 0.7;
    this.ramLoad = Math.max(0, this.ramLoad);

    if (this.ramLoad >= 100) {
      this.restartCurrentLevel();
      return;
    }

    if (remaining <= 0) {
      this.completeLevel();
      return;
    }

    const occupancy = computeRamLoad(aliveEnemies, TOTAL_ENEMIES);
    this.updateHud(`Remaining ${remaining}/${TOTAL_ENEMIES} | RAM ${this.ramLoad.toFixed(1)}% | Occupancy ${occupancy}%`);
  }

  private spawnWave(): void {
    if (this.spawned >= TOTAL_ENEMIES) {
      return;
    }

    const count = Math.min(WAVE_SIZE, TOTAL_ENEMIES - this.spawned);
    const activeEdges = [0, 1, 2, 3];

    for (const edge of activeEdges) {
      this.showEdgeWarning(edge);
    }

    this.time.delayedCall(350, () => {
      for (let i = 0; i < count; i += 1) {
        const edge = activeEdges[i % activeEdges.length];
        this.spawnCharger(edge, Math.floor(i / activeEdges.length), Math.ceil(count / activeEdges.length));
      }
    });
  }

  private showEdgeWarning(edge: number): void {
    const icon = this.add.image(0, 0, 'l5_warning').setDisplaySize(30, 30).setDepth(210).setAlpha(0.9);

    if (edge === 0) {
      icon.setPosition(this.scale.width / 2, 98).setRotation(Math.PI / 2);
    } else if (edge === 1) {
      icon.setPosition(this.scale.width - 20, this.scale.height / 2).setRotation(Math.PI);
    } else if (edge === 2) {
      icon.setPosition(this.scale.width / 2, this.scale.height - 48).setRotation(-Math.PI / 2);
    } else {
      icon.setPosition(20, this.scale.height / 2).setRotation(0);
    }

    this.tweens.add({
      targets: icon,
      alpha: 0,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => icon.destroy(),
    });
  }

  private spawnCharger(edge: number, index: number, total: number): void {
    if (this.spawned >= TOTAL_ENEMIES) {
      return;
    }

    let x = 0;
    let y = 0;

    const spread = index / Math.max(1, total - 1);

    if (edge === 0) {
      x = Phaser.Math.Linear(80, this.scale.width - 80, spread);
      y = -20;
    } else if (edge === 1) {
      x = this.scale.width + 20;
      y = Phaser.Math.Linear(120, this.scale.height - 80, spread);
    } else if (edge === 2) {
      x = Phaser.Math.Linear(80, this.scale.width - 80, spread);
      y = this.scale.height + 20;
    } else {
      x = -20;
      y = Phaser.Math.Linear(120, this.scale.height - 80, spread);
    }

    const enemy = this.physics.add
      .image(x, y, 'l5_ronin')
      .setDisplaySize(26, 26)
      .setDepth(140)
      .setAlpha(0.95);

    this.enemies.add(enemy);

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(56, 56);

    const targetX = this.player.x + Phaser.Math.Between(-30, 30);
    const targetY = this.player.y + Phaser.Math.Between(-30, 30);
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const speed = Phaser.Math.Between(CHARGE_SPEED_MIN, CHARGE_SPEED_MAX);

    enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    enemy.setRotation(angle);

    const baseScaleX = enemy.scaleX;
    const baseScaleY = enemy.scaleY;
    enemy.setScale(baseScaleX * 1.12, baseScaleY * 0.88);
    this.tweens.add({
      targets: enemy,
      scaleX: baseScaleX,
      scaleY: baseScaleY,
      duration: 220,
      ease: 'Sine.easeOut',
    });

    enemy.setData('hp', 6);
    this.spawned += 1;
  }

  private fireAutoTest(): void {
    const enemies = this.enemies.getChildren() as Phaser.Physics.Arcade.Image[];
    if (enemies.length === 0) {
      return;
    }

    let nearest = enemies[0];
    let best = Number.MAX_VALUE;

    for (const enemy of enemies) {
      if (!enemy.active) {
        continue;
      }
      // Skip off-screen enemies so the gun focuses on visible threats
      if (enemy.x < 0 || enemy.x > this.scale.width || enemy.y < 0 || enemy.y > this.scale.height) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance < best) {
        best = distance;
        nearest = enemy;
      }
    }

    if (!nearest?.active) {
      return;
    }

    const tracer = this.add
      .line(0, 0, this.player.x, this.player.y, nearest.x, nearest.y, 0x7df8ff, 0.9)
      .setOrigin(0, 0)
      .setDepth(170);
    this.time.delayedCall(60, () => tracer.destroy());

    const nextHp = (nearest.getData('hp') as number) - 1;
    nearest.setData('hp', nextHp);

    if (nextHp > 0) {
      nearest.setTint(0xff6666);
      this.time.delayedCall(50, () => {
        if (nearest.active) {
          nearest.clearTint();
        }
      });
    }

    if (nextHp <= 0) {
      nearest.destroy();
      this.killed += 1;
      this.runState.score += 25;
      this.ramLoad = Math.max(0, this.ramLoad - 0.8);
    }
  }
}
