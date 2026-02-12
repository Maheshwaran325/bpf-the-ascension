import Phaser from 'phaser';
import { loadLeaderboard } from '../storage/leaderboard';

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('LeaderboardScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0c1320');

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
