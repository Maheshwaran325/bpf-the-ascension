import Phaser from 'phaser';
import { MAX_HEALTH } from '../../game/constants';
import { applyScore, calculateLevelScore } from '../../systems/ScoreSystem';
import { LevelResult, LevelSceneData, MutationEffects, RunState } from '../../types/game';

const MOVE_SPEED = 280;

export abstract class BaseLevelScene extends Phaser.Scene {
  protected runState!: RunState;

  protected levelIndex = 0;

  protected deathsInLevel = 0;

  protected previousResults: LevelResult[] = [];

  protected player!: Phaser.GameObjects.Rectangle;

  protected wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  protected actionKey!: Phaser.Input.Keyboard.Key;

  protected attackKey!: Phaser.Input.Keyboard.Key;

  protected healthText!: Phaser.GameObjects.Text;

  protected scoreText!: Phaser.GameObjects.Text;

  protected instructionBar!: Phaser.GameObjects.Rectangle;

  protected instructionText!: Phaser.GameObjects.Text;

  protected objectiveText!: Phaser.GameObjects.Text;

  protected controlHintText!: Phaser.GameObjects.Text;

  protected statusText!: Phaser.GameObjects.Text;

  protected levelLabelText!: Phaser.GameObjects.Text;

  protected timerText!: Phaser.GameObjects.Text;

  protected damageTaken = 0;

  protected levelStartTime = 0;

  protected levelActive = false;

  protected mutationEffects: MutationEffects = {
    gravityMultiplier: 1,
    reverseControls: false,
    darknessMask: false,
    speedMultiplier: 1,
    activeLabel: 'None',
  };

  private darknessOverlay?: Phaser.GameObjects.Rectangle;

  private countdownText?: Phaser.GameObjects.Text;

  private countdownStartedAt = 0;

  private restartPromptVisible = false;

  private restartPayload?: LevelSceneData;

  private restartOverlay?: Phaser.GameObjects.Rectangle;

  private restartTitle?: Phaser.GameObjects.Text;

  private restartSubtitle?: Phaser.GameObjects.Text;

  private restartButton?: Phaser.GameObjects.Rectangle;

  private restartButtonLabel?: Phaser.GameObjects.Text;

  private restartMenuButton?: Phaser.GameObjects.Rectangle;

  private restartMenuLabel?: Phaser.GameObjects.Text;

  private restartHint?: Phaser.GameObjects.Text;

  protected constructor(sceneKey: string) {
    super(sceneKey);
  }

  protected abstract getLevelId(): RunState['currentLevel'];

  protected abstract getObjectiveLabel(): string;

  protected abstract onLevelStart(): void;

  protected abstract onLevelUpdate(time: number, delta: number): void;

  create(data: LevelSceneData): void {
    this.damageTaken = 0;
    this.levelActive = false;
    this.restartPromptVisible = false;
    this.restartPayload = undefined;
    this.clearRestartPrompt();
    this.mutationEffects = {
      gravityMultiplier: 1,
      reverseControls: false,
      darknessMask: false,
      speedMultiplier: 1,
      activeLabel: 'None',
    };

    this.runState = {
      ...data.runState,
      currentLevel: this.getLevelId(),
      health: MAX_HEALTH,
    };
    this.levelIndex = data.levelIndex;
    this.deathsInLevel = data.deathsInLevel;
    this.previousResults = [...data.results];

    this.cameras.main.setBackgroundColor('#121212');
    this.physics.world.resume();
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    this.player = this.add.rectangle(180, this.scale.height / 2, 26, 26, 0x4ef0ff);
    this.physics.add.existing(this.player);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is unavailable');
    }

    this.wasd = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as typeof this.wasd;
    this.cursors = keyboard.createCursorKeys();
    this.actionKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.attackKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);

    this.healthText = this.add.text(20, 16, '', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' });
    this.scoreText = this.add.text(20, 44, '', { fontFamily: 'monospace', fontSize: '18px', color: '#d2f8ff' });
    this.timerText = this.add.text(20, 70, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffe5b7' });
    this.levelLabelText = this.add.text(this.scale.width / 2, 20, `LEVEL ${this.levelIndex + 1}`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);
    this.instructionText = this.add.text(this.scale.width / 2, 56, this.getObjectiveLabel(), {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#b8ffbc',
      align: 'center',
    }).setOrigin(0.5, 0);
    this.objectiveText = this.add.text(this.scale.width / 2, 84, 'Countdown in progress...', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#d4e8ff',
      align: 'center',
    }).setOrigin(0.5, 0);
    this.instructionBar = this.add
      .rectangle(this.scale.width / 2, this.scale.height - 26, this.scale.width - 120, 44, 0x000000, 0.35)
      .setDepth(90);
    this.controlHintText = this.add.text(this.scale.width / 2, this.scale.height - 28, 'Move: WASD / Arrows   Primary: SPACE   Alt Attack: J', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#9cb9d2',
      align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(91);
    this.statusText = this.add.text(this.scale.width - 20, 16, 'Mutation: None', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd37f',
      align: 'right',
    }).setOrigin(1, 0);

    this.darknessOverlay = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0)
      .setDepth(1000);

    this.countdownText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, '3', {
        fontFamily: 'monospace',
        fontSize: '96px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0.85);
    this.countdownStartedAt = this.time.now;
    this.runCountdownStep(3);

    this.updateHud();

    keyboard.once('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  update(time: number, delta: number): void {
    if (!this.levelActive) {
      if (!this.restartPromptVisible && this.countdownStartedAt > 0 && this.time.now - this.countdownStartedAt > 5_000) {
        this.startLevelNow();
      }
      return;
    }

    this.handleMovement(delta);
    this.onLevelUpdate(time, delta);

    if (this.runState.health <= 0) {
      this.restartCurrentLevel();
      return;
    }

    this.updateHud();
  }

  protected handleMovement(delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let xDirection = 0;
    let yDirection = 0;

    if (this.wasd.left.isDown || this.cursors.left.isDown) {
      xDirection -= 1;
    }
    if (this.wasd.right.isDown || this.cursors.right.isDown) {
      xDirection += 1;
    }
    if (this.wasd.up.isDown || this.cursors.up.isDown) {
      yDirection -= 1;
    }
    if (this.wasd.down.isDown || this.cursors.down.isDown) {
      yDirection += 1;
    }

    if (this.mutationEffects.reverseControls) {
      xDirection *= -1;
      yDirection *= -1;
    }

    yDirection *= this.mutationEffects.gravityMultiplier;

    const speed = MOVE_SPEED * this.mutationEffects.speedMultiplier;
    body.setVelocity(xDirection * speed, yDirection * speed);

    if (this.runState.accessibility.reducedShake) {
      this.player.angle = 0;
      return;
    }

    this.player.angle = Math.sin((this.time.now + delta) / 130) * 5;
  }

  protected damage(amount: number): void {
    this.damageTaken += Math.max(0, amount);
    this.runState.health = Math.max(0, this.runState.health - Math.max(0, amount));

    if (this.runState.accessibility.reducedFlash) {
      this.player.setFillStyle(0xffb0b0);
      this.time.delayedCall(80, () => this.player.setFillStyle(0x4ef0ff));
      return;
    }

    this.cameras.main.flash(100, 255, 40, 40, false);
    if (!this.runState.accessibility.reducedShake) {
      this.cameras.main.shake(120, 0.006);
    }
  }

  protected heal(amount: number): void {
    this.runState.health = Math.min(MAX_HEALTH, this.runState.health + Math.max(0, amount));
  }

  protected completeLevel(godmodeSurvivalMs = 0): void {
    this.levelActive = false;
    const durationMs = Math.max(0, Math.floor(this.time.now - this.levelStartTime));
    this.runState.elapsedMs += durationMs;

    const score = calculateLevelScore({
      level: this.getLevelId(),
      levelNumber: this.levelIndex + 1,
      durationMs,
      damageTaken: this.damageTaken,
      deathsInLevel: this.deathsInLevel,
      godmodeSurvivalMs,
      success: true,
    });

    this.runState.score = applyScore(this.runState.score, score.total);

    const result: LevelResult = {
      level: this.getLevelId(),
      success: true,
      durationMs,
      damageTaken: this.damageTaken,
      deathsInLevel: this.deathsInLevel,
      scoreDelta: score.total,
    };

    this.scene.start('GauntletScene', {
      type: 'levelComplete',
      runState: this.runState,
      levelIndex: this.levelIndex,
      result,
      results: this.previousResults,
    });
  }

  protected restartCurrentLevel(): void {
    if (this.restartPromptVisible) {
      return;
    }

    this.levelActive = false;
    this.restartPromptVisible = true;
    this.physics.world.pause();
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    const durationMs = Math.max(0, Math.floor(this.time.now - this.levelStartTime));
    this.runState.elapsedMs += durationMs;
    this.runState.deaths += 1;
    this.restartPayload = {
      runState: {
        ...this.runState,
        health: MAX_HEALTH,
      },
      levelIndex: this.levelIndex,
      deathsInLevel: this.deathsInLevel + 1,
      results: this.previousResults,
    };

    this.showRestartPrompt();
  }

  protected setMutationEffects(effects: Partial<MutationEffects>): void {
    this.mutationEffects = {
      ...this.mutationEffects,
      ...effects,
    };

    if (!this.darknessOverlay) {
      return;
    }

    this.darknessOverlay.setAlpha(this.mutationEffects.darknessMask ? 0.68 : 0);
  }

  protected getLevelElapsedMs(): number {
    return Math.max(0, Math.floor(this.time.now - this.levelStartTime));
  }

  protected updateHud(customObjective?: string): void {
    this.healthText.setText(`HP ${Math.max(0, Math.floor(this.runState.health)).toString().padStart(3, ' ')}`);
    this.scoreText.setText(`Score ${Math.floor(this.runState.score)}`);
    this.timerText.setText(`Time ${Math.floor(this.getLevelElapsedMs() / 1000)}s`);

    if (customObjective) {
      this.objectiveText.setText(customObjective);
    }

    this.statusText.setText(`Mutation: ${this.mutationEffects.activeLabel}`);
  }

  private runCountdownStep(value: number): void {
    if (!this.countdownText) {
      return;
    }

    if (value > 0) {
      this.countdownText.setText(String(value));
      this.objectiveText.setText(`Starting in ${value}...`);
      this.time.delayedCall(1000, () => this.runCountdownStep(value - 1));
      return;
    }

    this.countdownText.setText('GO');
    this.objectiveText.setText('Fight!');
    this.startLevelNow();
    this.time.delayedCall(500, () => this.countdownText?.destroy());
  }

  private startLevelNow(): void {
    if (this.levelActive) {
      return;
    }

    this.levelStartTime = this.time.now;
    this.levelActive = true;
    this.onLevelStart();
  }

  private showRestartPrompt(): void {
    this.restartOverlay = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.55)
      .setDepth(2000);

    this.restartTitle = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 96, 'SYSTEM FAILURE', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#ffaaaa',
      })
      .setOrigin(0.5)
      .setDepth(2001);

    this.restartSubtitle = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 42, 'Choose Restart to try this level again', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e6f2ff',
      })
      .setOrigin(0.5)
      .setDepth(2001);

    this.restartButton = this.add
      .rectangle(this.scale.width / 2 - 120, this.scale.height / 2 + 36, 180, 54, 0x1d5f31, 0.95)
      .setDepth(2001)
      .setInteractive({ useHandCursor: true });
    this.restartButtonLabel = this.add
      .text(this.restartButton.x, this.restartButton.y, 'Restart', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2002);

    this.restartMenuButton = this.add
      .rectangle(this.scale.width / 2 + 120, this.scale.height / 2 + 36, 180, 54, 0x4f4f4f, 0.95)
      .setDepth(2001)
      .setInteractive({ useHandCursor: true });
    this.restartMenuLabel = this.add
      .text(this.restartMenuButton.x, this.restartMenuButton.y, 'Menu', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2002);

    this.restartHint = this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 96, 'Shortcut: R restart, M menu', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#c6d8ea',
      })
      .setOrigin(0.5)
      .setDepth(2001);

    const restart = () => {
      if (!this.restartPayload) {
        return;
      }
      this.clearRestartPrompt();
      this.scene.restart(this.restartPayload);
    };

    const toMenu = () => {
      this.clearRestartPrompt();
      this.scene.start('MenuScene');
    };

    this.restartButton.on('pointerover', () => this.restartButton?.setFillStyle(0x2f7f42, 1));
    this.restartButton.on('pointerout', () => this.restartButton?.setFillStyle(0x1d5f31, 0.95));
    this.restartButton.on('pointerdown', restart);

    this.restartMenuButton.on('pointerover', () => this.restartMenuButton?.setFillStyle(0x666666, 1));
    this.restartMenuButton.on('pointerout', () => this.restartMenuButton?.setFillStyle(0x4f4f4f, 0.95));
    this.restartMenuButton.on('pointerdown', toMenu);

    this.input.keyboard?.once('keydown-R', restart);
    this.input.keyboard?.once('keydown-M', toMenu);
    this.input.keyboard?.once('keydown-ENTER', restart);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearRestartPrompt());
  }

  private clearRestartPrompt(): void {
    this.restartPromptVisible = false;

    this.restartOverlay?.destroy();
    this.restartOverlay = undefined;

    this.restartTitle?.destroy();
    this.restartTitle = undefined;

    this.restartSubtitle?.destroy();
    this.restartSubtitle = undefined;

    this.restartButton?.destroy();
    this.restartButton = undefined;

    this.restartButtonLabel?.destroy();
    this.restartButtonLabel = undefined;

    this.restartMenuButton?.destroy();
    this.restartMenuButton = undefined;

    this.restartMenuLabel?.destroy();
    this.restartMenuLabel = undefined;

    this.restartHint?.destroy();
    this.restartHint = undefined;
  }
}
