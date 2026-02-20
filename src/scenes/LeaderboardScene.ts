import Phaser from 'phaser';
import { AudioSystem } from '../systems/AudioSystem';
import { loadLeaderboard } from '../storage/leaderboard';
import { loadAudioSettings } from '../storage/settings';

export class LeaderboardScene extends Phaser.Scene {
  private audio?: AudioSystem;

  constructor() {
    super('LeaderboardScene');
  }

  create(): void {
    this.audio = new AudioSystem(this, loadAudioSettings());
    this.audio.playMusic('music_menu_loop', true);

    this.add
      .image(this.scale.width / 2, this.scale.height / 2, 'bg_menu')
      .setDisplaySize(this.scale.width, this.scale.height)
      .setAlpha(0.95);

    this.add
      .text(this.scale.width / 2, 88, 'LOCAL LEADERBOARD', {
        fontFamily: 'monospace',
        fontSize: '52px',
        color: '#ffdf8f',
      })
      .setOrigin(0.5);

    const entries = loadLeaderboard();

    if (entries.length === 0) {
      this.add
        .text(this.scale.width / 2, this.scale.height / 2, 'No runs logged yet.', {
          fontFamily: 'monospace',
          fontSize: '24px',
          color: '#d4e8ff',
        })
        .setOrigin(0.5);
    } else {
      const lines = entries.map((entry, index) => {
        const timeSec = (entry.clearTimeMs / 1000).toFixed(1).padStart(6, ' ');
        const score = String(entry.score).padStart(7, ' ');
        return `${String(index + 1).padStart(2, '0')}  ${entry.initials}  ${score} pts  ${timeSec}s`;
      });

      this.add
        .text(this.scale.width / 2, 220, lines.join('\n'), {
          fontFamily: 'monospace',
          fontSize: '26px',
          color: '#f3f9ff',
          align: 'left',
          lineSpacing: 10,
        })
        .setOrigin(0.5, 0);
    }

    this.add
      .text(this.scale.width / 2, this.scale.height - 72, 'Press M for Menu', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#98c7f0',
      })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown-M', () => {
      this.scene.start('MenuScene');
    });
  }
}
