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
    return 'Dodge ronin charges from both sides. Auto-gun active. Clear 25 ronin.';
  }

  protected onLevelStart(): void {
    this.ramLoad = 0;
    this.spawned = 0;
    this.killed = 0;
    this.cameras.main.setBackgroundColor('#1a1d25');

    this.player.setPosition(this.scale.width / 2, this.scale.height / 2);

    // Background rain particles
    for (let i = 0; i < 80; i += 1) {
      const rx = Phaser.Math.Between(0, this.scale.width);
      const ry = Phaser.Math.Between(90, this.scale.height);
      const rain = this.add.rectangle(
        rx, ry,
        Phaser.Math.Between(3, 6),
        Phaser.Math.Between(20, 50),
        0x28313f, 0.45,
      );
      this.tweens.add({
        targets: rain,
        y: this.scale.height + 60,
        duration: Phaser.Math.Between(1200, 3000),
        repeat: -1,
        onRepeat: () => {
          rain.x = Phaser.Math.Between(0, this.scale.width);
          rain.y = -40;
        },
      });
    }

    this.enemies = this.physics.add.group({ allowGravity: false });

    // Spawn first wave immediately
    this.spawnWave();

    // Spawn waves on a timer
    this.time.addEvent({
      delay: WAVE_INTERVAL_MS,
      loop: true,
      callback: () => this.spawnWave(),
    });

    // Auto-gun fires every 100ms
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.fireAutoTest(),
    });

    this.physics.add.overlap(this.player, this.enemies, (_p, enemy) => {
      const e = enemy as Phaser.GameObjects.Rectangle;
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

    // Clean up off-screen enemies (they missed their charge)
    // Recycle their spawn slot so new waves keep coming
    for (const enemy of [...this.enemies.getChildren()] as Phaser.GameObjects.Rectangle[]) {
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

    // RAM pressure builds slowly — only spikes when many are on screen
    this.ramLoad += (aliveEnemies * 0.3 + 0.15) * (delta / 1000) * 0.9;
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
    this.updateHud(
      `Remaining ${remaining}/${TOTAL_ENEMIES} | RAM ${this.ramLoad.toFixed(1)}% | Occupancy ${occupancy}%`,
    );
  }

  private spawnWave(): void {
    if (this.spawned >= TOTAL_ENEMIES) {
      return;
    }

    const count = Math.min(WAVE_SIZE, TOTAL_ENEMIES - this.spawned);

    // Attack from all 4 edges simultaneously
    const activeEdges = [0, 1, 2, 3];

    // Flash warnings on all active edges
    for (const edge of activeEdges) {
      this.showEdgeWarning(edge);
    }

    // Slight delay after warning before enemies appear from multiple sides
    this.time.delayedCall(350, () => {
      for (let i = 0; i < count; i += 1) {
        const edge = activeEdges[i % activeEdges.length];
        this.spawnCharger(edge, Math.floor(i / activeEdges.length), Math.ceil(count / activeEdges.length));
      }
    });
  }

  private showEdgeWarning(edge: number): void {
    let warning: Phaser.GameObjects.Rectangle;

    if (edge === 0) {
      warning = this.add.rectangle(this.scale.width / 2, 95, this.scale.width, 6, 0xff6644, 0.7);
    } else if (edge === 1) {
      warning = this.add.rectangle(this.scale.width - 3, this.scale.height / 2, 6, this.scale.height, 0xff6644, 0.7);
    } else if (edge === 2) {
      warning = this.add.rectangle(this.scale.width / 2, this.scale.height - 50, this.scale.width, 6, 0xff6644, 0.7);
    } else {
      warning = this.add.rectangle(3, this.scale.height / 2, 6, this.scale.height, 0xff6644, 0.7);
    }

    warning.setDepth(200);
    this.tweens.add({
      targets: warning,
      alpha: 0,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => warning.destroy(),
    });
  }

  private spawnCharger(edge: number, index: number, total: number): void {
    if (this.spawned >= TOTAL_ENEMIES) {
      return;
    }

    let x = 0;
    let y = 0;

    // Spread enemies along the edge
    const spread = index / Math.max(1, total - 1);

    if (edge === 0) {
      // Top edge
      x = Phaser.Math.Linear(80, this.scale.width - 80, spread);
      y = -20;
    } else if (edge === 1) {
      // Right edge
      x = this.scale.width + 20;
      y = Phaser.Math.Linear(120, this.scale.height - 80, spread);
    } else if (edge === 2) {
      // Bottom edge
      x = Phaser.Math.Linear(80, this.scale.width - 80, spread);
      y = this.scale.height + 20;
    } else {
      // Left edge
      x = -20;
      y = Phaser.Math.Linear(120, this.scale.height - 80, spread);
    }

    const enemy = this.add.rectangle(x, y, 22, 22, 0xffad6b).setDepth(120);
    this.physics.add.existing(enemy);
    this.enemies.add(enemy);

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setSize(22, 22);
    body.setAllowGravity(false);

    // Charge toward the player's CURRENT position (locked-in, no tracking)
    const targetX = this.player.x + Phaser.Math.Between(-30, 30);
    const targetY = this.player.y + Phaser.Math.Between(-30, 30);
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const speed = Phaser.Math.Between(CHARGE_SPEED_MIN, CHARGE_SPEED_MAX);

    body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
    );

    // Visual: rotate to face charge direction
    enemy.setRotation(angle);

    // Trail effect
    this.tweens.add({
      targets: enemy,
      scaleX: { from: 1.3, to: 1 },
      scaleY: { from: 0.7, to: 1 },
      duration: 300,
      ease: 'Sine.easeOut',
    });

    enemy.setData('hp', 7);
    this.spawned += 1;
  }

  private fireAutoTest(): void {
    const enemies = this.enemies.getChildren() as Phaser.GameObjects.Rectangle[];
    if (enemies.length === 0) {
      return;
    }

    let nearest = enemies[0];
    let best = Number.MAX_VALUE;

    for (const enemy of enemies) {
      if (!enemy.active) {
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
      .setDepth(150);
    this.time.delayedCall(60, () => tracer.destroy());

    const nextHp = (nearest.getData('hp') as number) - 1;
    nearest.setData('hp', nextHp);

    // Visual hit feedback — flash enemy red
    if (nextHp > 0) {
      nearest.setFillStyle(0xff5555);
      this.time.delayedCall(50, () => {
        if (nearest?.active) {
          nearest.setFillStyle(0xffad6b);
        }
      });
    }

    if (nextHp <= 0) {
      nearest.destroy();
      this.killed += 1;
      this.runState.score += 25;
      this.ramLoad = Math.max(0, this.ramLoad - 1.4);
    }
  }
}
