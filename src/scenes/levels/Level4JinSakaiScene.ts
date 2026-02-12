import Phaser from 'phaser';
import { isParrySuccess, parryDeltaMs } from '../../systems/mechanics';
import { BaseLevelScene } from './BaseLevelScene';

const TARGET_PARRIES = 25;
const TELEGRAPH_MS = 450;
const PARRY_WINDOW_MS = 120;

export class Level4JinSakaiScene extends BaseLevelScene {
  private parries = 0;

  private currentNinja?: Phaser.GameObjects.Triangle;

  private strikeAtMs = -1;

  private telegraphText?: Phaser.GameObjects.Text;

  constructor() {
    super('Level4JinSakaiScene');
  }

  protected getLevelId() {
    return 'jinSakai' as const;
  }

  protected getObjectiveLabel(): string {
    return 'No shooting. Spacebar parry 25 strikes within 120ms.';
  }

  protected onLevelStart(): void {
    this.cameras.main.setBackgroundColor('#111111');

    for (let i = 0; i < 34; i += 1) {
      this.add.ellipse(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        Phaser.Math.Between(8, 20),
        Phaser.Math.Between(16, 32),
        0xffffff,
        0.08,
      );
    }

    this.telegraphText = this.add
      .text(this.scale.width / 2, 110, 'Wait for strike...', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ebebeb',
      })
      .setOrigin(0.5);

    this.time.addEvent({
      delay: 900,
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

    const status = this.currentNinja ? `Incoming strike at ${(this.strikeAtMs / 1000).toFixed(2)}s` : 'Waiting for ninja';
    this.updateHud(`Parries ${this.parries}/${TARGET_PARRIES} | ${status}`);
  }

  private spawnNinja(): void {
    const fromLeft = Math.random() > 0.5;
    const x = fromLeft ? -40 : this.scale.width + 40;
    const y = Phaser.Math.Between(120, this.scale.height - 100);

    this.currentNinja = this.add.triangle(x, y, 0, 16, 28, 0, 28, 32, 0x1f1f1f).setDepth(120);

    this.tweens.add({
      targets: this.currentNinja,
      x: this.scale.width / 2 + Phaser.Math.Between(-180, 180),
      duration: TELEGRAPH_MS,
      ease: 'Sine.In',
    });

    this.strikeAtMs = this.getLevelElapsedMs() + TELEGRAPH_MS;
    this.telegraphText?.setText('Strike incoming... SPACE to parry');
    this.telegraphText?.setColor('#ffffff');
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
