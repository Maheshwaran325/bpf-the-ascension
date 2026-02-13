import Phaser from 'phaser';
import { MutationSystem } from '../../systems/MutationSystem';
import { isParrySuccess, parryDeltaMs } from '../../systems/mechanics';
import { RuleMutation } from '../../types/game';
import { BaseLevelScene } from './BaseLevelScene';

const SURVIVE_MS = 90_000;

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
    return 'Final protocol: survive 90s. Rules mutate every 8 seconds.';
  }

  protected onLevelStart(): void {
    this.strikeAtMs = -1;
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
      delay: 560,
      loop: true,
      callback: () => this.spawnFire(),
    });

    this.time.addEvent({
      delay: 420,
      loop: true,
      callback: () => this.spawnGlitch(),
    });

    this.time.addEvent({
      delay: 1_700,
      loop: true,
      callback: () => {
        this.strikeAtMs = this.getLevelElapsedMs() + 700;
        this.showStrikeWarning();
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

    this.mutationSystem = new MutationSystem(this.createMutations(), 8_000, 5_000);
  }

  protected onLevelUpdate(_time: number, _delta: number): void {
    const elapsed = this.getLevelElapsedMs();

    for (const hazard of [...this.fireHazards.getChildren()] as Phaser.GameObjects.Rectangle[]) {
      if (hazard.y > this.scale.height + 40 || hazard.y < -40 || hazard.x < -40 || hazard.x > this.scale.width + 40) {
        hazard.destroy();
      }
    }

    for (const hazard of [...this.glitchHazards.getChildren()] as Phaser.GameObjects.Rectangle[]) {
      if (hazard.y > this.scale.height + 40 || hazard.y < -40 || hazard.x < -40 || hazard.x > this.scale.width + 40) {
        hazard.destroy();
      }
    }

    if (this.mutationSystem) {
      const active = this.mutationSystem.update(elapsed);
      this.mutationBanner?.setText(`Mutation: ${active?.label ?? 'None'}`);
    }

    // Parry check: press SPACE during the strike window
    if (Phaser.Input.Keyboard.JustDown(this.actionKey) && this.strikeAtMs > 0) {
      const deltaMs = parryDeltaMs(this.strikeAtMs, elapsed);
      if (isParrySuccess(deltaMs, 200)) {
        this.runState.score += 18;
        this.strikeAtMs = -1;
        this.showParrySuccess();
      } else {
        this.damage(18);
        this.strikeAtMs = -1;
        this.showSlashHit();
      }
    }

    // Missed the parry window entirely
    if (this.strikeAtMs > 0 && elapsed > this.strikeAtMs + 200) {
      this.damage(16);
      this.strikeAtMs = -1;
      this.showSlashHit();
    }

    if (elapsed >= SURVIVE_MS) {
      this.mutationSystem?.clearAll();
      this.completeLevel(SURVIVE_MS);
      return;
    }

    const remaining = Math.ceil((SURVIVE_MS - elapsed) / 1000);
    this.updateHud(`Survive ${remaining}s | SPACE to parry sword strikes | Hazards active`);
  }

  private showStrikeWarning(): void {
    // Expanding ring around the player as warning
    const ring = this.add.circle(this.player.x, this.player.y, 20, 0xffd700, 0).setDepth(500);
    ring.setStrokeStyle(3, 0xffd700, 0.9);

    this.tweens.add({
      targets: ring,
      radius: 80,
      alpha: 0,
      duration: 650,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        ring.setPosition(this.player.x, this.player.y);
      },
      onComplete: () => ring.destroy(),
    });

    // "PARRY!" warning text
    const parryText = this.add
      .text(this.player.x, this.player.y - 50, '⚔ PARRY!', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffd700',
      })
      .setOrigin(0.5)
      .setDepth(501);

    this.tweens.add({
      targets: parryText,
      y: parryText.y - 30,
      alpha: 0,
      duration: 700,
      ease: 'Sine.easeOut',
      onComplete: () => parryText.destroy(),
    });

    // Slash line that sweeps in
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const startX = this.player.x + Math.cos(angle) * 200;
    const startY = this.player.y + Math.sin(angle) * 200;

    const slash = this.add
      .line(0, 0, startX, startY, this.player.x, this.player.y, 0xffd700, 0.8)
      .setOrigin(0, 0)
      .setLineWidth(2)
      .setDepth(499);

    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 700,
      ease: 'Sine.easeIn',
      onComplete: () => slash.destroy(),
    });
  }

  private showParrySuccess(): void {
    // Green burst = successful parry
    const burst = this.add.circle(this.player.x, this.player.y, 10, 0x4eff8a, 0.8).setDepth(510);
    this.tweens.add({
      targets: burst,
      radius: 60,
      alpha: 0,
      duration: 300,
      onComplete: () => burst.destroy(),
    });

    const text = this.add
      .text(this.player.x, this.player.y - 40, 'PARRIED!', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#4eff8a',
      })
      .setOrigin(0.5)
      .setDepth(511);

    this.tweens.add({
      targets: text,
      y: text.y - 25,
      alpha: 0,
      duration: 500,
      onComplete: () => text.destroy(),
    });
  }

  private showSlashHit(): void {
    // Red X slash = hit, failed to parry
    const cx = this.player.x;
    const cy = this.player.y;

    const line1 = this.add.line(0, 0, cx - 30, cy - 30, cx + 30, cy + 30, 0xff4444, 0.9)
      .setOrigin(0, 0).setLineWidth(3).setDepth(510);
    const line2 = this.add.line(0, 0, cx + 30, cy - 30, cx - 30, cy + 30, 0xff4444, 0.9)
      .setOrigin(0, 0).setLineWidth(3).setDepth(510);

    this.tweens.add({
      targets: [line1, line2],
      alpha: 0,
      duration: 400,
      onComplete: () => { line1.destroy(); line2.destroy(); },
    });
  }

  private spawnFire(): void {
    const hazard = this.add.rectangle(Phaser.Math.Between(24, this.scale.width - 24), -16, 20, 20, 0xff7c3b);
    this.physics.add.existing(hazard);
    this.fireHazards.add(hazard); // Add to group FIRST
    const body = hazard.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(Phaser.Math.Between(-120, 120), Phaser.Math.Between(210, 320));
  }

  private spawnGlitch(): void {
    const fromLeft = Math.random() > 0.5;
    const hazard = this.add.rectangle(fromLeft ? -30 : this.scale.width + 30, Phaser.Math.Between(100, this.scale.height - 90), 26, 18, 0x8c80ff);
    this.physics.add.existing(hazard);
    this.glitchHazards.add(hazard); // Add to group FIRST
    const body = hazard.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(fromLeft ? Phaser.Math.Between(260, 360) : -Phaser.Math.Between(260, 360), Phaser.Math.Between(-80, 80));
  }

  private createMutations(): RuleMutation[] {
    return [
      {
        id: 'gravity_flip',
        label: 'Gravity Flip',
        durationMs: 5_000,
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
        durationMs: 5_000,
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
        durationMs: 5_000,
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
        durationMs: 5_000,
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
