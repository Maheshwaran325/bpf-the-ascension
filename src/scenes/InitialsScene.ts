import Phaser from 'phaser';
import { COMMON_SFX, UI_ASSETS } from '../game/assets';
import { sanitizeInitials } from '../storage/leaderboard';
import { loadAudioSettings } from '../storage/settings';
import { AudioSystem } from '../systems/AudioSystem';
import { NewRunPayload } from '../types/game';

export class InitialsScene extends Phaser.Scene {
    private initials = '';
    private initialsText?: Phaser.GameObjects.Text;
    private audio?: AudioSystem;
    private payload?: Omit<NewRunPayload, 'playerName'>;

    constructor() {
        super('InitialsScene');
    }

    create(data: Omit<NewRunPayload, 'playerName'>): void {
        this.payload = data;
        this.initials = '';

        this.audio = new AudioSystem(this, data.audio ?? loadAudioSettings());

        this.add
            .image(this.scale.width / 2, this.scale.height / 2, 'bg_menu')
            .setDisplaySize(this.scale.width, this.scale.height)
            .setAlpha(0.95);

        this.add
            .image(this.scale.width / 2, this.scale.height / 2, UI_ASSETS.modalPanel)
            .setDisplaySize(680, 420)
            .setAlpha(0.97);

        this.add
            .text(this.scale.width / 2, this.scale.height / 2 - 120, 'IDENTIFICATION REQUIRED', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '18px',
                color: '#ffdf8f',
                letterSpacing: 2,
            })
            .setOrigin(0.5);

        this.add
            .text(this.scale.width / 2, this.scale.height / 2 - 60, 'Enter operative codename (max 7 chars)', {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: '#d2e9ff',
            })
            .setOrigin(0.5);

        this.initialsText = this.add
            .text(this.scale.width / 2, this.scale.height / 2 + 20, this.renderInitials(), {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '42px',
                color: '#ffffff',
                letterSpacing: 8,
            })
            .setOrigin(0.5)
            .setShadow(2, 2, '#4a9eff', 4, true, true);

        this.add
            .text(this.scale.width / 2, this.scale.height / 2 + 140, 'Press ENTER to confirm   ESC to cancel', {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#a6c8ea',
            })
            .setOrigin(0.5);

        const keyboard = this.input.keyboard;
        if (!keyboard) return;

        keyboard.on('keydown', (event: KeyboardEvent) => {
            if (/^[a-z0-9 ]$/i.test(event.key) && this.initials.length < 7) {
                this.initials += event.key.toUpperCase();
                this.audio?.playSfx(COMMON_SFX.uiSelect, 0.4);
            } else if (event.key === 'Backspace') {
                this.initials = this.initials.slice(0, -1);
                this.audio?.playSfx(COMMON_SFX.uiSelect, 0.4);
            } else if (event.key === 'Enter' && this.initials.trim().length > 0) {
                this.confirmInitials();
                return;
            }

            this.initialsText?.setText(this.renderInitials());
        });

        keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    private confirmInitials(): void {
        const playerName = this.initials.trim().toUpperCase();
        this.audio?.playSfx(COMMON_SFX.uiConfirm, 0.85);

        const fullPayload: NewRunPayload = {
            ...this.payload,
            type: 'newRun',
            playerName,
        };

        this.scene.start('GauntletScene', fullPayload);
    }

    private renderInitials(): string {
        return this.initials.padEnd(7, '_');
    }
}
