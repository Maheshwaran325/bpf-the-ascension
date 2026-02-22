import Phaser from 'phaser';
import { COMMON_SFX } from '../game/assets';
import { DEFAULT_ACCESSIBILITY, DEFAULT_AUDIO, GAME_FONT } from '../game/constants';
import { AudioSystem } from '../systems/AudioSystem';
import {
  loadAccessibilitySettings,
  loadAudioSettings,
  saveAccessibilitySettings,
  saveAudioSettings,
} from '../storage/settings';
import { loadActiveRun } from '../storage/run';
import { AccessibilitySettings, AudioSettings } from '../types/game';

interface MenuOption {
  key: string;
  render: () => string;
  action: () => void;
}

export class MenuScene extends Phaser.Scene {
  private selected = 0;

  private cursorIcon!: Phaser.GameObjects.Text;

  private accessibility: AccessibilitySettings = { ...DEFAULT_ACCESSIBILITY };

  private audioSettings: AudioSettings = { ...DEFAULT_AUDIO };

  private optionTexts: Phaser.GameObjects.Text[] = [];

  private options: MenuOption[] = [];

  private audio?: AudioSystem;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.accessibility = loadAccessibilitySettings();
    this.audioSettings = loadAudioSettings();
    this.audio = new AudioSystem(this, this.audioSettings);
    this.audio.playMusic('music_menu_loop', true);

    this.add
      .image(this.scale.width / 2, this.scale.height / 2, 'bg_menu')
      .setDisplaySize(this.scale.width, this.scale.height)
      .setAlpha(0.96);

    this.add
      .text(this.scale.width / 2, 88, 'BPF: THE ASCENSION', {
        fontFamily: GAME_FONT,
        fontSize: '84px',
        color: '#ffe28a',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(4, 4, '#000000', 0, true, true);

    this.add
      .text(this.scale.width / 2, 160, 'Survive the 6 Eras. Earn DEPLOYMENT SUCCESSFUL.', {
        fontFamily: GAME_FONT,
        fontSize: '26px',
        color: '#c7e2ff',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(2, 2, '#000000', 0, true, true);

    const activeRun = loadActiveRun();

    this.options = [];

    if (activeRun) {
      this.options.push({
        key: 'resume',
        render: () => 'Resume Run',
        action: () => {
          this.playUiConfirm();
          this.scene.start('GauntletScene', {
            type: 'resumeRun',
            runState: activeRun.runState,
            levelIndex: activeRun.levelIndex,
            deathsInLevel: activeRun.deathsInLevel,
            results: activeRun.results,
          });
        },
      });
    }

    this.options.push(
      {
        key: 'start',
        render: () => (activeRun ? 'New Gauntlet' : 'Start Gauntlet'),
        action: () => {
          this.playUiConfirm();
          this.scene.start('InitialsScene', {
            accessibility: this.accessibility,
            audio: this.audioSettings,
          });
        },
      }
    );

    this.options.push(
      {
        key: 'leaderboard',
        render: () => 'Leaderboard',
        action: () => {
          this.playUiSelect();
          this.scene.start('LeaderboardScene');
        },
      },
      {
        key: 'settings',
        render: () => 'Settings',
        action: () => {
          this.playUiConfirm();
          this.scene.start('SettingsScene');
        },
      }
    );

    this.optionTexts = this.options.map((_, idx) =>
      this.add
        .text(this.scale.width / 2, 240 + idx * 48, '', {
          fontFamily: GAME_FONT,
          fontSize: '36px',
          color: '#7caecf',
        })
        .setOrigin(0.5)
        .setDepth(10)
        .setShadow(2, 2, '#000000', 0, true, true),
    );

    this.cursorIcon = this.add
      .text(0, 0, '>', {
        fontFamily: GAME_FONT,
        fontSize: '36px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(2, 2, '#4a9eff', 8, true, true);

    this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 108,
        'Controls: WASD/Arrows move   SPACE action',
        {
          fontFamily: GAME_FONT,
          fontSize: '24px',
          color: '#b4d6fb',
        },
      )
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(1, 1, '#000000', 0, true, true);

    this.add
      .text(this.scale.width / 2, this.scale.height - 78, 'Menu: UP/DOWN choose, ENTER apply', {
        fontFamily: GAME_FONT,
        fontSize: '22px',
        color: '#98b9d9',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(1, 1, '#000000', 0, true, true);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    // Clean up listeners when scene shuts down
    this.events.on('shutdown', () => {
      keyboard.off('keydown-UP');
      keyboard.off('keydown-DOWN');
      keyboard.off('keydown-ENTER');
      keyboard.off('keydown-F');
      keyboard.off('keydown-G');
      keyboard.off('keydown-N');
    });

    keyboard.on('keydown-UP', () => {
      this.selected = (this.selected - 1 + this.options.length) % this.options.length;
      this.playUiSelect();
      this.renderOptions();
    });

    keyboard.on('keydown-DOWN', () => {
      this.selected = (this.selected + 1) % this.options.length;
      this.playUiSelect();
      this.renderOptions();
    });

    keyboard.on('keydown-ENTER', () => {
      this.options[this.selected].action();
    });

    this.renderOptions();
  }

  update(time: number, delta: number): void {
    if (this.cursorIcon && this.optionTexts.length > 0) {
      const text = this.optionTexts[this.selected];
      if (text && text.displayWidth > 0) {
        this.cursorIcon.setPosition(text.x - text.displayWidth / 2 - 30, text.y);
        // Subtle pulse for the cursor
        this.cursorIcon.setAlpha(0.7 + 0.3 * Math.sin(time / 150));
      }
    }
  }

  private renderOptions(): void {
    this.optionTexts.forEach((text, idx) => {
      const isSelected = idx === this.selected;
      text.setText(this.options[idx].render());
      text.setColor(isSelected ? '#ffffff' : '#88b6d8');
      text.setScale(isSelected ? 1.05 : 1);

      if (isSelected) {
        text.setShadow(2, 2, '#4a9eff', 8, true, true);
      } else {
        text.setShadow(2, 2, '#000000', 0, true, true);
      }
    });
  }

  private persistAudioSettings(): void {
    this.audioSettings = saveAudioSettings(this.audioSettings);
    this.audio?.applySettings(this.audioSettings);
    this.playUiSelect();
    this.renderOptions();
  }

  private nextStep(value: number, step: number): number {
    const next = Math.round((value + step) * 10) / 10;
    return next > 1 ? 0 : next;
  }

  private playUiSelect(): void {
    this.audio?.playSfx(COMMON_SFX.uiSelect, 0.65);
  }

  private playUiConfirm(): void {
    this.audio?.playSfx(COMMON_SFX.uiConfirm, 0.8);
  }
}
