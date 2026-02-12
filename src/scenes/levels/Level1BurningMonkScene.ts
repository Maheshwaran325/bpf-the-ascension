import Phaser from 'phaser';
import { updateTemperature } from '../../systems/mechanics';
import { LevelSceneData } from '../../types/game';
import { BaseLevelScene } from './BaseLevelScene';

const GOAL_MS = 30_000;
const FIRE_SPAWN_MS = 360;
const COOLANT_SPAWN_MS = 5_000;
const HEAT_SURGE_MS = 5_000;

export class Level1BurningMonkScene extends BaseLevelScene {
  private temperature = 25;

  private fireBugs: Phaser.GameObjects.Rectangle[] = [];

  private coolantCups: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('Level1BurningMonkScene');
  }

  create(data: LevelSceneData): void {
    // Reset level-specific state before base create runs the countdown.
    // scene.restart() doesn't re-run the constructor, so these fields
    // would otherwise keep their stale values from the previous attempt.
    this.temperature = 25;
    this.fireBugs = [];
    this.coolantCups = [];
    super.create(data);
  }

  protected getLevelId() {
    return 'burningMonk' as const;
  }

  protected getObjectiveLabel(): string {
    return 'Survive 30s. Lava below. Collect coffee coolant.';
  }

  protected onLevelStart(): void {
    this.cameras.main.setBackgroundColor('#2b0e08');

    this.add.rectangle(this.scale.width / 2, this.scale.height - 18, this.scale.width, 36, 0xff5e1f, 0.95);
    this.add.rectangle(this.scale.width / 2, this.scale.height - 42, this.scale.width, 24, 0xcc2a10, 0.75);

    for (let i = 0; i < 6; i += 1) {
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
        this.temperature = updateTemperature(this.temperature, 0, 0, 0) + 8;
        if (!this.runState.accessibility.reducedFlash) {
          this.cameras.main.flash(90, 255, 130, 70, false);
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
      this.damage(15 * (delta / 1000));
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
      `Temp ${Math.round(this.temperature)}% | Survive ${(remainingMs / 1000).toFixed(1)}s | Bugs ${this.fireBugs.length} | Coffee ${this.coolantCups.length}`,
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
    const bug = this.add.rectangle(spawnX, -24, 24, 24, 0xff8f40);

    this.physics.add.existing(bug);
    const body = bug.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    const horizontalVelocity = Phaser.Math.Clamp((targetX - spawnX) * 1.6, -220, 220);
    body.setVelocity(horizontalVelocity, Phaser.Math.Between(280, 430));

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
    const cup = this.add.rectangle(Phaser.Math.Between(40, this.scale.width - 40), -16, 18, 24, 0x7ac9ff);

    this.physics.add.existing(cup);
    const body = cup.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(Phaser.Math.Between(-35, 35), Phaser.Math.Between(140, 210));

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
