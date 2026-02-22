import Phaser from 'phaser';
import { COMMON_SFX } from '../game/assets';
import { AudioSystem } from '../systems/AudioSystem';
import { addLeaderboardEntry, sanitizeInitials } from '../storage/leaderboard';
import { loadAudioSettings } from '../storage/settings';
import { LevelResult, RunState } from '../types/game';

interface ResultSceneData {
  success: boolean;
  runState: RunState;
  results: LevelResult[];
}

export class ResultScene extends Phaser.Scene {
  private submitted = false;

  private audio?: AudioSystem;
  private currentInitials = '';
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super('ResultScene');
  }

  create(data: ResultSceneData): void {
    const success = data.success;
    this.audio = new AudioSystem(this, data.runState.audio ?? loadAudioSettings());
    this.audio.playMusic('music_menu_loop', true);

    this.add
      .image(this.scale.width / 2, this.scale.height / 2, 'bg_menu')
      .setDisplaySize(this.scale.width, this.scale.height)
      .setAlpha(0.95);

    this.add
      .text(this.scale.width / 2, 84, success ? 'DEPLOYMENT SUCCESSFUL' : 'RUN FAILED', {
        fontFamily: 'monospace',
        fontSize: '52px',
        color: success ? '#91ffb9' : '#ff9c9c',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 150, `Final Score: ${Math.floor(data.runState.score)}`, {
        fontFamily: 'monospace',
        fontSize: '31px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 188, `Clear Time: ${(data.runState.elapsedMs / 1000).toFixed(1)}s`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#d2e9ff',
      })
      .setOrigin(0.5);

    const summary = data.results
      .map((result, idx) => `${idx + 1}. ${result.level}  +${result.scoreDelta}  deaths:${result.deathsInLevel}`)
      .join('\n');

    this.add
      .text(this.scale.width / 2, 288, summary, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#c6defc',
        align: 'left',
      })
      .setOrigin(0.5, 0);

    this.currentInitials = data.runState.playerName;

    this.add
      .text(this.scale.width / 2, 520, `Operative: ${this.currentInitials}`, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffdf8f',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(this.scale.width / 2, 580, 'Saving to global network...', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffdd77',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 660, 'L: Leaderboard   M: Menu', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#a6c8ea',
      })
      .setOrigin(0.5);

    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.on('keydown-L', () => this.scene.start('LeaderboardScene'));
      keyboard.on('keydown-M', () => this.scene.start('MenuScene'));
    }

    // Auto submit
    this.submit(data.runState.score, data.runState.elapsedMs).catch(() => {
      if (this.statusText) {
        this.statusText.setText('Failed to contact global network. Saved locally.');
        this.statusText.setColor('#ff9a9a');
      }
    });
  }

  private async submit(score: number, clearTimeMs: number): Promise<void> {
    this.submitted = true;

    await addLeaderboardEntry({
      initials: this.currentInitials,
      score: Math.floor(score),
      clearTimeMs: Math.floor(clearTimeMs),
      dateISO: new Date().toISOString(),
      version: 'v1',
    });

    this.audio?.playSfx(COMMON_SFX.uiConfirm, 0.85);

    if (this.statusText) {
      this.statusText.setText('Submission saved. Press L for leaderboard or M for menu.');
      this.statusText.setColor('#9effaf');
    }
  }
}
