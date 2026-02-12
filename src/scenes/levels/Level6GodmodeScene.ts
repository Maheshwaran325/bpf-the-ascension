import Phaser from 'phaser';
import { MutationSystem } from '../../systems/MutationSystem';
import { isParrySuccess, parryDeltaMs } from '../../systems/mechanics';
import { RuleMutation } from '../../types/game';
import { BaseLevelScene } from './BaseLevelScene';

const SURVIVE_MS = 180_000;

export class Level6GodmodeScene extends BaseLevelScene {
  private fireHazards!: Phaser.Physics.Arcade.Group;

  private glitchHazards!: Phaser.Physics.Arcade.Group;

  private strikeAtMs = -1;

  private mutationSystem?: MutationSystem;

  private mutationBanner?: Phaser.GameObjects.Text;

  constructor() {
    super('Level6GodmodeScene');
  }

  protected getLevelId() {
    return 'godmode' as const;
  }

  protected getObjectiveLabel(): string {
    return 'Final protocol: survive 180s. Rules mutate every 10 seconds.';
  }

  protected onLevelStart(): void {
    this.cameras.main.setBackgroundColor('#050514');

    for (let i = 0; i < 120; i += 1) {
      this.add.circle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.1, 0.7),
      );
    }

    this.add.circle(this.scale.width / 2, 120, 110, 0xffdd81, 0.28);
    this.add.circle(this.scale.width / 2, 120, 62, 0xfff0b8, 0.42);

    this.mutationBanner = this.add
      .text(this.scale.width / 2, 188, 'Mutation: None', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffd48c',
      })
      .setOrigin(0.5);

    this.fireHazards = this.physics.add.group({ allowGravity: false });
    this.glitchHazards = this.physics.add.group({ allowGravity: false });

    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => this.spawnFire(),
    });

    this.time.addEvent({
      delay: 540,
      loop: true,
      callback: () => this.spawnGlitch(),
    });

    this.time.addEvent({
      delay: 2_200,
      loop: true,
      callback: () => {
        this.strikeAtMs = this.getLevelElapsedMs() + 450;
      },
    });

    this.physics.add.overlap(this.player, this.fireHazards, (_player, hazard) => {
      hazard.destroy();
      this.damage(9);
    });

    this.physics.add.overlap(this.player, this.glitchHazards, (_player, hazard) => {
      hazard.destroy();
      this.damage(7);
    });

    this.mutationSystem = new MutationSystem(this.createMutations());
  }

  protected onLevelUpdate(_time: number, _delta: number): void {
    const elapsed = this.getLevelElapsedMs();

    for (const hazard of this.fireHazards.getChildren() as Phaser.GameObjects.Rectangle[]) {
      if (hazard.y > this.scale.height + 40 || hazard.y < -40 || hazard.x < -40 || hazard.x > this.scale.width + 40) {
        hazard.destroy();
      }
    }

    for (const hazard of this.glitchHazards.getChildren() as Phaser.GameObjects.Rectangle[]) {
      if (hazard.y > this.scale.height + 40 || hazard.y < -40 || hazard.x < -40 || hazard.x > this.scale.width + 40) {
        hazard.destroy();
      }
    }

    if (this.mutationSystem) {
      const active = this.mutationSystem.update(elapsed);
      this.mutationBanner?.setText(`Mutation: ${active?.label ?? 'None'}`);
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKey) && this.strikeAtMs > 0) {
      const deltaMs = parryDeltaMs(this.strikeAtMs, elapsed);
      if (isParrySuccess(deltaMs, 120)) {
        this.runState.score += 18;
        this.strikeAtMs = -1;
      } else {
        this.damage(18);
        this.strikeAtMs = -1;
      }
    }

    if (this.strikeAtMs > 0 && elapsed > this.strikeAtMs + 120) {
      this.damage(16);
      this.strikeAtMs = -1;
    }

    if (elapsed >= SURVIVE_MS) {
      this.mutationSystem?.clearAll();
      this.completeLevel(SURVIVE_MS);
      return;
    }

    const remaining = Math.ceil((SURVIVE_MS - elapsed) / 1000);
    this.updateHud(`Survive ${remaining}s | SPACE to parry sword strikes | Hazards active`);
  }

  private spawnFire(): void {
    const hazard = this.add.rectangle(Phaser.Math.Between(24, this.scale.width - 24), -16, 20, 20, 0xff7c3b);
    this.physics.add.existing(hazard);
    const body = hazard.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(Phaser.Math.Between(-120, 120), Phaser.Math.Between(210, 320));
    this.fireHazards.add(hazard);
  }

  private spawnGlitch(): void {
    const fromLeft = Math.random() > 0.5;
    const hazard = this.add.rectangle(fromLeft ? -30 : this.scale.width + 30, Phaser.Math.Between(100, this.scale.height - 90), 26, 18, 0x8c80ff);
    this.physics.add.existing(hazard);
    const body = hazard.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(fromLeft ? Phaser.Math.Between(260, 360) : -Phaser.Math.Between(260, 360), Phaser.Math.Between(-80, 80));
    this.glitchHazards.add(hazard);
  }

  private createMutations(): RuleMutation[] {
    return [
      {
        id: 'gravity_flip',
        label: 'Gravity Flip',
        durationMs: 6_000,
        apply: () => {
          this.setMutationEffects({
            gravityMultiplier: -1,
            activeLabel: 'Gravity Flip',
          });
        },
        clear: () => {
          this.setMutationEffects({
            gravityMultiplier: 1,
            activeLabel: 'None',
          });
        },
      },
      {
        id: 'reverse_controls',
        label: 'Reverse Controls',
        durationMs: 6_000,
        apply: () => {
          this.setMutationEffects({
            reverseControls: true,
            activeLabel: 'Reverse Controls',
          });
        },
        clear: () => {
          this.setMutationEffects({
            reverseControls: false,
            activeLabel: 'None',
          });
        },
      },
      {
        id: 'darkness_mask',
        label: 'Darkness Mask',
        durationMs: 6_000,
        apply: () => {
          this.setMutationEffects({
            darknessMask: true,
            activeLabel: 'Darkness Mask',
          });
        },
        clear: () => {
          this.setMutationEffects({
            darknessMask: false,
            activeLabel: 'None',
          });
        },
      },
      {
        id: 'speed_shift',
        label: 'Speed Shift',
        durationMs: 6_000,
        apply: () => {
          this.setMutationEffects({
            speedMultiplier: 1.8,
            activeLabel: 'Speed Shift',
          });
        },
        clear: () => {
          this.setMutationEffects({
            speedMultiplier: 1,
            activeLabel: 'None',
          });
        },
      },
    ];
  }
}
