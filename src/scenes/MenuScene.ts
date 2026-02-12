import Phaser from 'phaser';
import { DEFAULT_ACCESSIBILITY } from '../game/constants';
import { loadAccessibilitySettings, saveAccessibilitySettings } from '../storage/settings';
import { AccessibilitySettings } from '../types/game';

interface MenuOption {
  key: string;
  render: () => string;
  action: () => void;
}

export class MenuScene extends Phaser.Scene {
  private selected = 0;

  private settings: AccessibilitySettings = { ...DEFAULT_ACCESSIBILITY };

  private optionTexts: Phaser.GameObjects.Text[] = [];

  private options: MenuOption[] = [];

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.settings = loadAccessibilitySettings();

    this.cameras.main.setBackgroundColor('#081827');
    this.add
      .text(this.scale.width / 2, 90, 'BPF: THE ASCENSION', {
        fontFamily: 'monospace',
        fontSize: '54px',
        color: '#ffe28a',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 160, 'Survive the 6 Eras. Earn DEPLOYMENT SUCCESSFUL.', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#cfe9ff',
      })
      .setOrigin(0.5);

    this.options = [
      {
        key: 'start',
        render: () => 'Start Gauntlet',
        action: () => {
          this.scene.start('GauntletScene', {
            type: 'newRun',
            accessibility: this.settings,
          });
        },
      },
      {
        key: 'leaderboard',
        render: () => 'Leaderboard',
        action: () => {
          this.scene.start('LeaderboardScene');
        },
      },
      {
        key: 'flash',
        render: () => `Reduced Flash: ${this.settings.reducedFlash ? 'ON' : 'OFF'}`,
        action: () => {
          this.settings.reducedFlash = !this.settings.reducedFlash;
          saveAccessibilitySettings(this.settings);
          this.renderOptions();
        },
      },
      {
        key: 'shake',
        render: () => `Reduced Shake: ${this.settings.reducedShake ? 'ON' : 'OFF'}`,
        action: () => {
          this.settings.reducedShake = !this.settings.reducedShake;
          saveAccessibilitySettings(this.settings);
          this.renderOptions();
        },
      },
    ];

    this.optionTexts = this.options.map((_, idx) =>
      this.add.text(this.scale.width / 2, 260 + idx * 56, '', {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#7caecf',
      }).setOrigin(0.5),
    );

    this.add
      .text(this.scale.width / 2, this.scale.height - 140, 'Controls: WASD Move, J Attack, SPACE Action/Parry', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#b2d8ff',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, this.scale.height - 104, 'Menu: Arrow Up/Down + Enter. ESC returns from levels.', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#8fbad8',
      })
      .setOrigin(0.5);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    keyboard.on('keydown-UP', () => {
      this.selected = (this.selected - 1 + this.options.length) % this.options.length;
      this.renderOptions();
    });

    keyboard.on('keydown-DOWN', () => {
      this.selected = (this.selected + 1) % this.options.length;
      this.renderOptions();
    });

    keyboard.on('keydown-ENTER', () => {
      this.options[this.selected].action();
    });

    keyboard.on('keydown-F', () => {
      this.settings.reducedFlash = !this.settings.reducedFlash;
      saveAccessibilitySettings(this.settings);
      this.renderOptions();
    });

    keyboard.on('keydown-G', () => {
      this.settings.reducedShake = !this.settings.reducedShake;
      saveAccessibilitySettings(this.settings);
      this.renderOptions();
    });

    this.renderOptions();
  }

  private renderOptions(): void {
    this.optionTexts.forEach((text, idx) => {
      const isSelected = idx === this.selected;
      text.setText(`${isSelected ? '>' : ' '} ${this.options[idx].render()}`);
      text.setColor(isSelected ? '#ffffff' : '#7caecf');
      text.setScale(isSelected ? 1.04 : 1);
    });
  }
}
