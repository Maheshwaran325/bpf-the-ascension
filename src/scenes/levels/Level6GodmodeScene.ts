import { isParrySuccess, parryDeltaMs } from '../../systems/mechanics';
import { BaseLevelScene } from './BaseLevelScene';

const SURVIVE_MS = 75_000;

export class Level6GodmodeScene extends BaseLevelScene {
  private glitchHazards!: Phaser.Physics.Arcade.Group;

  private strikeAtMs = -1;

  private avatar?: Phaser.GameObjects.Image;

  constructor() {
    super('Level6GodmodeScene');
  }

  protected getLevelId() {
    return 'godmode' as const;
  }

  protected getObjectiveLabel(): string {
    return 'Final protocol: survive 75s.';
  }

  protected onLevelStart(): void {
    this.strikeAtMs = -1;

    this.avatar = this.add
      .image(this.scale.width / 2, 150, 'l6_ai_avatar')
      .setDisplaySize(220, 220)
      .setDepth(85)
      .setAlpha(0.96);

    this.tweens.add({
      targets: this.avatar,
      y: 140,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.glitchHazards = this.physics.add.group({ allowGravity: false });

    // Timers placed here will start ticking as soon as the level begins (after GO).
    this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => this.spawnGlitch(),
    });

    this.time.addEvent({
      delay: 1_400,
      loop: true,
      callback: () => {
        this.strikeAtMs = this.getLevelElapsedMs() + 600;
        this.showStrikeWarning();
      },
    });

    this.physics.add.overlap(this.player, this.glitchHazards, (_player, hazard) => {
      const h = hazard as Phaser.Physics.Arcade.Image;
      h.destroy();
      this.damage(7);
    });
  }

  protected onLevelUpdate(_time: number, _delta: number): void {
    const elapsed = this.getLevelElapsedMs();

    for (const hazard of [...this.glitchHazards.getChildren()] as Phaser.Physics.Arcade.Image[]) {
      if (hazard.y > this.scale.height + 40 || hazard.y < -40 || hazard.x < -40 || hazard.x > this.scale.width + 40) {
        hazard.destroy();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKey) && this.strikeAtMs > 0) {
      const deltaMs = parryDeltaMs(this.strikeAtMs, elapsed);
      if (isParrySuccess(deltaMs, 280)) {
        this.runState.score += 18;
        this.strikeAtMs = -1;
        this.showParrySuccess();
      } else {
        this.damage(18);
        this.strikeAtMs = -1;
        this.showSlashHit();
      }
    }

    if (this.strikeAtMs > 0 && elapsed > this.strikeAtMs + 200) {
      this.damage(16);
      this.strikeAtMs = -1;
      this.showSlashHit();
    }

    if (elapsed >= SURVIVE_MS) {
      this.completeLevel(SURVIVE_MS);
      return;
    }

    const remaining = Math.ceil((SURVIVE_MS - elapsed) / 1000);
    this.updateHud(`Survive ${remaining}s | Dodge & SPACE to parry sword strikes`);
  }

  private showStrikeWarning(): void {
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

    const parryText = this.add
      .text(this.player.x, this.player.y - 50, 'PARRY!', {
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
  }

  private showParrySuccess(): void {
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
    const cx = this.player.x;
    const cy = this.player.y;

    const line1 = this.add
      .line(0, 0, cx - 30, cy - 30, cx + 30, cy + 30, 0xff4444, 0.9)
      .setOrigin(0, 0)
      .setLineWidth(3)
      .setDepth(510);
    const line2 = this.add
      .line(0, 0, cx + 30, cy - 30, cx - 30, cy + 30, 0xff4444, 0.9)
      .setOrigin(0, 0)
      .setLineWidth(3)
      .setDepth(510);

    this.tweens.add({
      targets: [line1, line2],
      alpha: 0,
      duration: 400,
      onComplete: () => {
        line1.destroy();
        line2.destroy();
      },
    });
  }

  private spawnGlitch(): void {
    const fromLeft = Math.random() > 0.5;
    const hazard = this.physics.add
      .image(fromLeft ? -30 : this.scale.width + 30, Phaser.Math.Between(100, this.scale.height - 90), 'l6_glitch')
      .setDisplaySize(28, 20)
      .setDepth(151)
      .setRotation(Phaser.Math.FloatBetween(-0.5, 0.5));

    this.glitchHazards.add(hazard);

    (hazard.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    hazard.setVelocity(
      fromLeft ? Phaser.Math.Between(260, 360) : -Phaser.Math.Between(260, 360),
      Phaser.Math.Between(-80, 80),
    );
  }
}
