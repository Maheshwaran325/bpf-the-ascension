import Phaser from 'phaser';
import { updateTemperature } from '../../systems/mechanics';
import { LevelSceneData } from '../../types/game';
import { BaseLevelScene } from './BaseLevelScene';

const GOAL_MS = 20_000;
const FIRE_SPAWN_MS = 300;
const COOLANT_SPAWN_MS = 6_000;
const HEAT_SURGE_MS = 4_000;

export class Level1BurningMonkScene extends BaseLevelScene {
  private temperature = 25;

  private fireBugs: Phaser.Physics.Arcade.Image[] = [];

  private coolantCups: Phaser.Physics.Arcade.Image[] = [];

  constructor() {
    super('Level1BurningMonkScene');
  }

  create(data: LevelSceneData): void {
    this.temperature = 25;
    this.fireBugs = [];
    this.coolantCups = [];
    super.create(data);
  }

  protected getLevelId() {
    return 'burningMonk' as const;
  }

  protected getObjectiveLabel(): string {
    return 'Survive 20s. Keep temp under 100%. Collect coffee coolant.';
  }

  protected onLevelStart(): void {
    for (let i = 0; i < 7; i += 1) {
      this.spawnFireBug();
    }

    this.time.addEvent({
      delay: FIRE_SPAWN_MS,
      loop: true,
      callback: () => this.spawnFireBug(),
    });

    this.time.addEvent({
      delay: COOLANT_SPAWN_MS,
      loop: true,
      callback: () => this.spawnCoolant(),
    });

    this.time.addEvent({
      delay: HEAT_SURGE_MS,
      loop: true,
      callback: () => {
        this.temperature = updateTemperature(this.temperature, 0, 0, 0) + 10;
        if (!this.runState.accessibility.reducedFlash) {
          this.cameras.main.flash(70, 255, 110, 60, false);
        }
      },
    });
  }

  protected onLevelUpdate(_time: number, delta: number): void {
    this.temperature = updateTemperature(this.temperature, delta / 1000);
    this.temperature = Phaser.Math.Clamp(this.temperature, 0, 120);

    const elapsed = this.getLevelElapsedMs();
    const remainingMs = Math.max(0, GOAL_MS - elapsed);

    this.cleanupProjectiles();

    if (this.player.y >= this.scale.height - 58) {
      this.damage(14 * (delta / 1000));
      this.temperature += 6 * (delta / 1000);
    }

    if (this.temperature >= 100) {
      this.restartCurrentLevel();
      return;
    }

    if (elapsed >= GOAL_MS) {
      this.completeLevel();
      return;
    }

    this.updateHud(
      `Temp ${Math.floor(this.temperature)}% | Survive ${(remainingMs / 1000).toFixed(1)}s | Bugs ${this.fireBugs.length} | Coffee ${this.coolantCups.length}`,
    );
  }

  private cleanupProjectiles(): void {
    this.fireBugs = this.fireBugs.filter((bug) => {
      if (!bug.active) {
        return false;
      }
      if (bug.y > this.scale.height + 80 || bug.x < -80 || bug.x > this.scale.width + 80) {
        bug.destroy();
        return false;
      }
      return true;
    });

    this.coolantCups = this.coolantCups.filter((cup) => {
      if (!cup.active) {
        return false;
      }
      if (cup.y > this.scale.height + 80 || cup.x < -80 || cup.x > this.scale.width + 80) {
        cup.destroy();
        return false;
      }
      return true;
    });
  }

  private spawnFireBug(): void {
    const targetX = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-140, 140), 30, this.scale.width - 30);
    const spawnX = Phaser.Math.Clamp(targetX + Phaser.Math.Between(-120, 120), 24, this.scale.width - 24);

    const bug = this.physics.add
      .image(spawnX, -24, 'l1_firebug')
      .setDisplaySize(28, 28)
      .setDepth(150)
      .setRotation(Phaser.Math.FloatBetween(-0.4, 0.4));

    (bug.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    const horizontalVelocity = Phaser.Math.Clamp((targetX - spawnX) * 1.6, -220, 220);
    bug.setVelocity(horizontalVelocity, Phaser.Math.Between(280, 430));

    this.physics.add.overlap(this.player, bug, () => {
      if (!bug.active) {
        return;
      }
      bug.destroy();
      this.damage(8);
      this.temperature = updateTemperature(this.temperature, 0, 1, 0);
    });

    this.fireBugs.push(bug);
  }

  private spawnCoolant(): void {
    const cup = this.physics.add
      .image(Phaser.Math.Between(40, this.scale.width - 40), -16, 'l1_coffee')
      .setDisplaySize(24, 24)
      .setDepth(151)
      .setRotation(Phaser.Math.FloatBetween(-0.3, 0.3));

    (cup.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    cup.setVelocity(Phaser.Math.Between(-35, 35), Phaser.Math.Between(140, 210));

    this.physics.add.overlap(this.player, cup, () => {
      if (!cup.active) {
        return;
      }
      cup.destroy();
      this.temperature = updateTemperature(this.temperature, 0, 0, 1);
      this.heal(5);
    });

    this.coolantCups.push(cup);
  }
}
