import Phaser from 'phaser';
import { COMMON_SFX, LEVEL_THEME_ASSETS, UI_ASSETS } from '../../game/assets';
import { MAX_HEALTH } from '../../game/constants';
import { AudioSystem } from '../../systems/AudioSystem';
import { applyScore, calculateLevelScore } from '../../systems/ScoreSystem';
import { LevelResult, LevelSceneData, MutationEffects, RunState } from '../../types/game';
import { clearActiveRun, saveActiveRun } from '../../storage/run';

const MOVE_SPEED = 280;

export abstract class BaseLevelScene extends Phaser.Scene {
  protected runState!: RunState;

  protected levelIndex = 0;

  protected deathsInLevel = 0;

  protected previousResults: LevelResult[] = [];

  protected player!: Phaser.Physics.Arcade.Sprite;

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

  protected instructionText!: Phaser.GameObjects.Text;

  protected objectiveText!: Phaser.GameObjects.Text;

  protected controlHintText!: Phaser.GameObjects.Text;

  protected statusText!: Phaser.GameObjects.Text;

  protected levelLabelText!: Phaser.GameObjects.Text;

  protected timerText!: Phaser.GameObjects.Text;

  protected damageTaken = 0;

  protected levelStartTime = 0;

  protected levelActive = false;

  protected isPaused = false;

  protected mutationEffects: MutationEffects = {
    gravityMultiplier: 1,
    reverseControls: false,
    darknessMask: false,
    speedMultiplier: 1,
    activeLabel: 'None',
  };

  protected basePlayerTint = 0xffffff;

  protected audio?: AudioSystem;

  private darknessOverlay?: Phaser.GameObjects.Rectangle;

  private pauseGroup?: Phaser.GameObjects.Group;

  private countdownText?: Phaser.GameObjects.Text;

  private restartPromptVisible = false;

  private restartPayload?: LevelSceneData;

  private restartOverlay?: Phaser.GameObjects.Rectangle;

  private restartPanel?: Phaser.GameObjects.Image;

  private restartTitle?: Phaser.GameObjects.Text;

  private restartSubtitle?: Phaser.GameObjects.Text;

  private restartButton?: Phaser.GameObjects.Image;

  private restartButtonLabel?: Phaser.GameObjects.Text;

  private restartMenuButton?: Phaser.GameObjects.Image;

  private restartMenuLabel?: Phaser.GameObjects.Text;

  private restartHint?: Phaser.GameObjects.Text;

  private restartHandled = false;

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
    this.isPaused = false;
    this.restartPromptVisible = false;
    this.restartHandled = false;
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

    this.audio = new AudioSystem(this, this.runState.audio);
    this.audio.playMusic(LEVEL_THEME_ASSETS[this.getLevelId()].music, true);

    this.physics.world.resume();
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    const startColor = Phaser.Display.Color.HexStringToColor('#ffffff');
    const endColor = Phaser.Display.Color.HexStringToColor('#401070');
    const interpolated = Phaser.Display.Color.Interpolate.ColorWithColor(
      startColor,
      endColor,
      5,
      Math.min(5, this.levelIndex)
    );
    this.basePlayerTint = Phaser.Display.Color.GetColor(interpolated.r, interpolated.g, interpolated.b);

    this.buildBackground();
    this.buildPlayer();
    this.buildInputs();
    this.buildHud();

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
      .setDepth(950)
      .setAlpha(0.9);

    this.runCountdownStep(3);
    this.updateHud();

    this.input.keyboard?.on('keydown-ESC', () => {
      this.togglePause();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC');
      this.clearRestartPrompt();
    });
  }

  update(time: number, delta: number): void {
    if (this.isPaused) {
      return;
    }

    if (this.runState.health <= 0) {
      this.restartCurrentLevel();
      return;
    }

    if (!this.levelActive) {
      return;
    }

    this.handleMovement(delta);
    this.onLevelUpdate(time, delta);

    this.updateHud();
  }

  protected handleMovement(_delta: number): void {
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
      this.player.setRotation(0);
      return;
    }

    if (xDirection !== 0 || yDirection !== 0) {
      this.player.setRotation(Math.sin(this.time.now / 120) * 0.06);
    } else {
      this.player.setRotation(0);
    }
  }

  protected damage(amount: number): void {
    const safeAmount = Math.max(0, amount);
    this.damageTaken += safeAmount;
    this.runState.health = Math.max(0, this.runState.health - safeAmount);
    this.audio?.playSfx(COMMON_SFX.hit, 0.8);

    if (this.runState.accessibility.reducedFlash) {
      this.player.setTint(0xffa1a1);
      this.time.delayedCall(90, () => this.player.setTint(this.basePlayerTint));
      return;
    }

    this.player.setTint(0xff7777);
    this.time.delayedCall(120, () => this.player.setTint(this.basePlayerTint));
    this.cameras.main.flash(90, 255, 60, 60, false);
    if (!this.runState.accessibility.reducedShake) {
      this.cameras.main.shake(120, 0.005);
    }
  }

  protected heal(amount: number): void {
    this.runState.health = Math.min(MAX_HEALTH, this.runState.health + Math.max(0, amount));
  }

  protected completeLevel(godmodeSurvivalMs = 0): void {
    this.levelActive = false;
    clearActiveRun(); // Clear saved run state on completion
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
    this.audio?.playSfx(COMMON_SFX.levelClear, 0.9);

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
    if (this.restartPromptVisible || this.restartHandled) {
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

    saveActiveRun(this.restartPayload); // Keep saved state updated

    this.audio?.playSfx(COMMON_SFX.restart, 0.8);
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
    if (!this.levelActive) {
      return 0;
    }
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

  protected getThemeAssetKeys(): (typeof LEVEL_THEME_ASSETS)[RunState['currentLevel']] {
    return LEVEL_THEME_ASSETS[this.getLevelId()];
  }

  protected playSfx(key: string, volume = 1): void {
    this.audio?.playSfx(key, volume);
  }

  private buildBackground(): void {
    const theme = this.getThemeAssetKeys();
    this.add
      .image(this.scale.width / 2, this.scale.height / 2, theme.bg)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setAlpha(0.95)
      .setDepth(-30);
  }

  private buildPlayer(): void {
    const theme = this.getThemeAssetKeys();
    this.player = this.physics.add
      .sprite(180, this.scale.height / 2, theme.playerSkin)
      .setDisplaySize(34, 34)
      .setDepth(120);
    this.player.setCollideWorldBounds(true);
    this.player.setTint(this.basePlayerTint);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCircle(12, 4, 4);
    body.setMaxVelocity(420, 420);
  }

  private buildInputs(): void {
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
  }

  private buildHud(): void {
    this.add
      .image(this.scale.width / 2, 62, UI_ASSETS.hudPanel)
      .setDisplaySize(this.scale.width - 38, 114)
      .setAlpha(0.85)
      .setDepth(90);

    this.healthText = this.add
      .text(22, 20, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
      .setDepth(100);
    this.scoreText = this.add
      .text(150, 20, '', { fontFamily: 'monospace', fontSize: '18px', color: '#d2f8ff' })
      .setDepth(100);
    this.timerText = this.add
      .text(304, 20, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffe5b7' })
      .setDepth(100);

    this.levelLabelText = this.add
      .text(this.scale.width / 2, 14, `LEVEL ${this.levelIndex + 1}`, {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0)
      .setDepth(101);

    this.instructionText = this.add
      .text(this.scale.width / 2, 58, this.getObjectiveLabel(), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#b8ffbc',
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(101);

    this.objectiveText = this.add
      .text(this.scale.width / 2, 82, 'Starting in 3...', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#d4e8ff',
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(101);

    this.add
      .image(this.scale.width / 2, this.scale.height - 24, UI_ASSETS.card)
      .setDisplaySize(this.scale.width - 120, 40)
      .setDepth(91)
      .setAlpha(0.9);

    this.controlHintText = this.add
      .text(this.scale.width / 2, this.scale.height - 24, 'Move: WASD / Arrows   Primary: SPACE  ', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#b8cee3',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(95);

    this.statusText = this.add
      .text(this.scale.width - 22, 20, 'Mutation: None', {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#ffd37f',
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(101);
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
    this.time.delayedCall(600, () => this.countdownText?.destroy());
  }

  private startLevelNow(): void {
    if (this.levelActive) {
      return;
    }

    this.restartPayload = {
      runState: {
        ...this.runState,
        health: MAX_HEALTH,
      },
      levelIndex: this.levelIndex,
      deathsInLevel: this.deathsInLevel,
      results: this.previousResults,
    };

    saveActiveRun(this.restartPayload);

    this.levelStartTime = this.time.now;
    this.levelActive = true;
    this.onLevelStart();
  }

  private showRestartPrompt(): void {
    this.restartOverlay = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.65)
      .setDepth(2000);

    this.restartPanel = this.add
      .image(this.scale.width / 2, this.scale.height / 2 + 8, UI_ASSETS.modalPanel)
      .setDisplaySize(680, 370)
      .setDepth(2001)
      .setAlpha(0.97);

    this.restartTitle = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 102, 'SYSTEM FAILURE', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#ffaaaa',
      })
      .setOrigin(0.5)
      .setDepth(2002);

    this.restartSubtitle = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 42, 'Choose Restart to try this level again', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e6f2ff',
      })
      .setOrigin(0.5)
      .setDepth(2002);

    this.restartButton = this.add
      .image(this.scale.width / 2 - 130, this.scale.height / 2 + 40, UI_ASSETS.buttonPrimary)
      .setDisplaySize(210, 64)
      .setDepth(2002)
      .setInteractive({ useHandCursor: true });

    this.restartButtonLabel = this.add
      .text(this.restartButton.x, this.restartButton.y, 'Restart', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2003);

    this.restartMenuButton = this.add
      .image(this.scale.width / 2 + 130, this.scale.height / 2 + 40, UI_ASSETS.buttonSecondary)
      .setDisplaySize(210, 64)
      .setDepth(2002)
      .setInteractive({ useHandCursor: true });

    this.restartMenuLabel = this.add
      .text(this.restartMenuButton.x, this.restartMenuButton.y, 'Submit Score', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2003);

    this.restartHint = this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 104, 'Shortcut: R restart, ENTER submit', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#c6d8ea',
      })
      .setOrigin(0.5)
      .setDepth(2002);

    const restart = () => {
      if (!this.restartPayload || this.restartHandled) {
        return;
      }

      this.restartHandled = true;
      this.clearRestartPrompt();
      this.time.removeAllEvents();
      this.scene.restart(this.restartPayload);
    };

    const toMenu = () => {
      if (this.restartHandled || !this.restartPayload) {
        return;
      }

      this.restartHandled = true;
      this.clearRestartPrompt();
      clearActiveRun(); // Clear saved run since we are submitting

      this.scene.start('ResultScene', {
        success: false,
        runState: this.restartPayload.runState,
        results: this.restartPayload.results,
      });
    };

    this.restartButton.on('pointerover', () => this.restartButton?.setAlpha(1));
    this.restartButton.on('pointerout', () => this.restartButton?.setAlpha(0.94));
    this.restartButton.on('pointerdown', restart);

    this.restartMenuButton.on('pointerover', () => this.restartMenuButton?.setAlpha(1));
    this.restartMenuButton.on('pointerout', () => this.restartMenuButton?.setAlpha(0.94));
    this.restartMenuButton.on('pointerdown', toMenu);

    const keyboard = this.input.keyboard;
    keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R).once('down', restart);
    keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).once('down', toMenu);
  }

  private clearRestartPrompt(): void {
    this.restartPromptVisible = false;

    this.restartOverlay?.destroy();
    this.restartOverlay = undefined;

    this.restartPanel?.destroy();
    this.restartPanel = undefined;

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

  private togglePause(): void {
    if (this.runState.health <= 0 || !this.levelActive) {
      return;
    }

    if (this.isPaused) {
      this.isPaused = false;
      this.physics.world.resume();
      this.pauseGroup?.destroy(true);
      this.pauseGroup = undefined;
      return;
    }

    this.isPaused = true;
    this.physics.world.pause();

    this.pauseGroup = this.add.group();

    const overlay = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.65)
      .setDepth(2000);

    const panel = this.add
      .image(this.scale.width / 2, this.scale.height / 2, UI_ASSETS.modalPanel)
      .setDisplaySize(600, 320)
      .setDepth(2001)
      .setAlpha(0.97);

    const title = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 80, 'PAUSED', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2002);

    const resumeBtn = this.add
      .image(this.scale.width / 2 - 120, this.scale.height / 2 + 20, UI_ASSETS.buttonPrimary)
      .setDisplaySize(190, 60)
      .setDepth(2002)
      .setInteractive({ useHandCursor: true });

    const resumeLbl = this.add
      .text(resumeBtn.x, resumeBtn.y, 'Resume', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2003);

    const menuBtn = this.add
      .image(this.scale.width / 2 + 120, this.scale.height / 2 + 20, UI_ASSETS.buttonSecondary)
      .setDisplaySize(190, 60)
      .setDepth(2002)
      .setInteractive({ useHandCursor: true });

    const menuLbl = this.add
      .text(menuBtn.x, menuBtn.y, 'Menu', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2003);

    resumeBtn.on('pointerdown', () => this.togglePause());
    menuBtn.on('pointerdown', () => {
      if (this.restartPayload) saveActiveRun(this.restartPayload);
      this.scene.start('MenuScene');
    });

    this.pauseGroup.addMultiple([overlay, panel, title, resumeBtn, resumeLbl, menuBtn, menuLbl]);
  }
}
