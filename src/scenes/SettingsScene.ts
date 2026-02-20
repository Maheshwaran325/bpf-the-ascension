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
import { AccessibilitySettings, AudioSettings } from '../types/game';

interface MenuOption {
    key: string;
    render: () => string;
    action: () => void;
}

export class SettingsScene extends Phaser.Scene {
    private selected = 0;

    private accessibility: AccessibilitySettings = { ...DEFAULT_ACCESSIBILITY };

    private audioSettings: AudioSettings = { ...DEFAULT_AUDIO };

    private optionTexts: Phaser.GameObjects.Text[] = [];

    private options: MenuOption[] = [];

    private audio?: AudioSystem;

    constructor() {
        super('SettingsScene');
    }

    create(): void {
        this.accessibility = loadAccessibilitySettings();
        this.audioSettings = loadAudioSettings();
        this.audio = new AudioSystem(this, this.audioSettings);
        // Determine if music is already playing from MenuScene. 
        // Usually AudioSystem handles this check or we just don't stop it.
        // Use the same music as menu
        if (!this.sound.get('music_menu_loop')) {
            this.audio.playMusic('music_menu_loop', true);
        }

        this.add
            .image(this.scale.width / 2, this.scale.height / 2, 'bg_menu')
            .setDisplaySize(this.scale.width, this.scale.height)
            .setAlpha(0.96);

        this.add
            .text(this.scale.width / 2, 88, 'SETTINGS', {
                fontFamily: GAME_FONT,
                fontSize: '84px',
                color: '#ffe28a',
            })
            .setOrigin(0.5)
            .setDepth(10)
            .setShadow(4, 4, '#000000', 0, true, true);

        this.options = [
            {
                key: 'flash',
                render: () => `Reduced Flash: ${this.accessibility.reducedFlash ? 'ON' : 'OFF'}`,
                action: () => {
                    this.accessibility.reducedFlash = !this.accessibility.reducedFlash;
                    saveAccessibilitySettings(this.accessibility);
                    this.playUiSelect();
                    this.renderOptions();
                },
            },
            {
                key: 'shake',
                render: () => `Reduced Shake: ${this.accessibility.reducedShake ? 'ON' : 'OFF'}`,
                action: () => {
                    this.accessibility.reducedShake = !this.accessibility.reducedShake;
                    saveAccessibilitySettings(this.accessibility);
                    this.playUiSelect();
                    this.renderOptions();
                },
            },
            {
                key: 'mute',
                render: () => `Mute: ${this.audioSettings.muted ? 'ON' : 'OFF'}`,
                action: () => {
                    this.audioSettings.muted = !this.audioSettings.muted;
                    this.persistAudioSettings();
                },
            },
            {
                key: 'music',
                render: () => `Music Vol: ${Math.round(this.audioSettings.music * 100)}%`,
                action: () => {
                    this.audioSettings.music = this.nextStep(this.audioSettings.music, 0.1);
                    this.persistAudioSettings();
                },
            },
            {
                key: 'sfx',
                render: () => `SFX Vol: ${Math.round(this.audioSettings.sfx * 100)}%`,
                action: () => {
                    this.audioSettings.sfx = this.nextStep(this.audioSettings.sfx, 0.1);
                    this.persistAudioSettings();
                },
            },
            {
                key: 'master',
                render: () => `Master Vol: ${Math.round(this.audioSettings.master * 100)}%`,
                action: () => {
                    this.audioSettings.master = this.nextStep(this.audioSettings.master, 0.1);
                    this.persistAudioSettings();
                },
            },
            {
                key: 'back',
                render: () => 'Back to Menu',
                action: () => {
                    this.playUiConfirm();
                    this.scene.start('MenuScene');
                },
            },
        ];

        this.optionTexts = this.options.map((_, idx) =>
            this.add
                .text(this.scale.width / 2, 200 + idx * 48, '', {
                    fontFamily: GAME_FONT,
                    fontSize: '36px',
                    color: '#7caecf',
                })
                .setOrigin(0.5)
                .setDepth(10)
                .setShadow(2, 2, '#000000', 0, true, true),
        );

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

        // Clean up listeners when scene shuts down to avoid duplication if scene is restarted
        this.events.on('shutdown', () => {
            keyboard.off('keydown-UP');
            keyboard.off('keydown-DOWN');
            keyboard.off('keydown-ENTER');
            keyboard.off('keydown-F');
            keyboard.off('keydown-G');
            keyboard.off('keydown-N');
            keyboard.off('keydown-ESC');
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

        keyboard.on('keydown-ESC', () => {
            this.playUiConfirm();
            this.scene.start('MenuScene');
        });

        // Keeping hotkeys for accessibility/audio even in settings menu
        keyboard.on('keydown-F', () => {
            this.accessibility.reducedFlash = !this.accessibility.reducedFlash;
            saveAccessibilitySettings(this.accessibility);
            this.playUiSelect();
            this.renderOptions();
        });

        keyboard.on('keydown-G', () => {
            this.accessibility.reducedShake = !this.accessibility.reducedShake;
            saveAccessibilitySettings(this.accessibility);
            this.playUiSelect();
            this.renderOptions();
        });

        keyboard.on('keydown-N', () => {
            this.audioSettings.muted = !this.audioSettings.muted;
            this.persistAudioSettings();
        });

        this.renderOptions();
    }

    private renderOptions(): void {
        this.optionTexts.forEach((text, idx) => {
            const isSelected = idx === this.selected;
            text.setText(`${isSelected ? '> ' : '  '} ${this.options[idx].render()}`);
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
