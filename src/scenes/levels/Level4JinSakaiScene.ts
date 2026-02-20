import Phaser from 'phaser';
import { isParrySuccess, parryDeltaMs } from '../../systems/mechanics';
import { BaseLevelScene } from './BaseLevelScene';

const TARGET_PARRIES = 14;
const TELEGRAPH_MS = 420;
const PARRY_WINDOW_MS = 110;

export class Level4JinSakaiScene extends BaseLevelScene {
  private parries = 0;

  private currentNinja?: Phaser.GameObjects.Image;

  private strikeAtMs = -1;

  private telegraphText?: Phaser.GameObjects.Text;

  constructor() {
    super('Level4JinSakaiScene');
  }

  protected getLevelId() {
    return 'jinSakai' as const;
  }

  protected getObjectiveLabel(): string {
    return 'No shooting. SPACE parry 14 strikes within 110ms.';
  }

  protected onLevelStart(): void {
    this.parries = 0;
    this.currentNinja = undefined;
    this.strikeAtMs = -1;

    for (let i = 0; i < 24; i += 1) {
      const leaf = this.add
        .image(
          Phaser.Math.Between(0, this.scale.width),
          Phaser.Math.Between(110, this.scale.height),
          'l4_leaf',
        )
        .setDisplaySize(18, 18)
        .setAlpha(0.26)
        .setDepth(60)
        .setRotation(Phaser.Math.FloatBetween(-0.8, 0.8));

      this.tweens.add({
        targets: leaf,
        x: Phaser.Math.Between(0, this.scale.width),
        y: this.scale.height + 40,
        rotation: Phaser.Math.FloatBetween(-2, 2),
        alpha: { from: 0.32, to: 0.05 },
        duration: Phaser.Math.Between(3800, 6200),
        repeat: -1,
        onRepeat: () => {
          leaf.x = Phaser.Math.Between(0, this.scale.width);
          leaf.y = 100;
        },
      });
    }

    this.telegraphText = this.add
      .text(this.scale.width / 2, 132, 'Wait for strike...', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#f1f1f1',
      })
      .setOrigin(0.5)
      .setDepth(180);

    this.time.addEvent({
      delay: 740,
      loop: true,
      callback: () => {
        if (!this.currentNinja) {
          this.spawnNinja();
        }
      },
    });
  }

  protected onLevelUpdate(_time: number, _delta: number): void {
    const now = this.getLevelElapsedMs();

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.damage(4);
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      if (this.strikeAtMs < 0 || !this.currentNinja) {
        this.damage(10);
      } else {
        const delta = parryDeltaMs(this.strikeAtMs, now);
        if (isParrySuccess(delta, PARRY_WINDOW_MS)) {
          this.resolveParrySuccess();
        } else {
          this.damage(20);
          this.resolveStrikeMiss();
        }
      }
    }

    if (this.strikeAtMs > 0 && now > this.strikeAtMs + PARRY_WINDOW_MS) {
      this.damage(20);
      this.resolveStrikeMiss();
    }

    if (this.parries >= TARGET_PARRIES) {
      this.completeLevel();
      return;
    }

    const status = this.currentNinja ? `Strike at ${(this.strikeAtMs / 1000).toFixed(2)}s` : 'Waiting for ninja';
    this.updateHud(`Parries ${this.parries}/${TARGET_PARRIES} | ${status}`);
  }

  private spawnNinja(): void {
    const fromLeft = Math.random() > 0.5;
    const x = fromLeft ? -40 : this.scale.width + 40;
    const y = Phaser.Math.Between(130, this.scale.height - 100);

    this.currentNinja = this.add
      .image(x, y, 'l4_ninja')
      .setDisplaySize(48, 48)
      .setDepth(170)
      .setFlipX(!fromLeft);

    this.tweens.add({
      targets: this.currentNinja,
      x: this.scale.width / 2 + Phaser.Math.Between(-170, 170),
      duration: TELEGRAPH_MS,
      ease: 'Sine.In',
    });

    this.strikeAtMs = this.getLevelElapsedMs() + TELEGRAPH_MS;
    this.telegraphText?.setText('Strike incoming - SPACE parry');
    this.telegraphText?.setColor('#ffffff');

    const ring = this.add.circle(this.player.x, this.player.y, 16, 0xffffff, 0).setDepth(165);
    ring.setStrokeStyle(2, 0xffffff, 0.75);
    this.tweens.add({
      targets: ring,
      radius: 72,
      alpha: 0,
      duration: TELEGRAPH_MS,
      onUpdate: () => ring.setPosition(this.player.x, this.player.y),
      onComplete: () => ring.destroy(),
    });
  }

  private resolveParrySuccess(): void {
    this.parries += 1;
    this.runState.score += 35;

    if (this.currentNinja) {
      this.currentNinja.destroy();
      this.currentNinja = undefined;
    }

    this.strikeAtMs = -1;
    this.telegraphText?.setText('Perfect parry');
    this.telegraphText?.setColor('#b4ffba');

    const burst = this.add.circle(this.player.x, this.player.y, 14, 0x7cff9d, 0.7).setDepth(171);
    this.tweens.add({
      targets: burst,
      radius: 52,
      alpha: 0,
      duration: 280,
      onComplete: () => burst.destroy(),
    });
  }

  private resolveStrikeMiss(): void {
    if (this.currentNinja) {
      this.currentNinja.destroy();
      this.currentNinja = undefined;
    }

    this.strikeAtMs = -1;
    this.telegraphText?.setText('Missed timing');
    this.telegraphText?.setColor('#ff9f9f');
  }
}
