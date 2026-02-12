import Phaser from 'phaser';
import { addLeaderboardEntry, sanitizeInitials } from '../storage/leaderboard';
import { LevelResult, RunState } from '../types/game';

interface ResultSceneData {
  success: boolean;
  runState: RunState;
  results: LevelResult[];
}

export class ResultScene extends Phaser.Scene {
  private initials = '';

  private initialsText?: Phaser.GameObjects.Text;

  private submitted = false;

  constructor() {
    super('ResultScene');
  }

  create(data: ResultSceneData): void {
    const success = data.success;
    this.cameras.main.setBackgroundColor(success ? '#0d1f14' : '#2b1010');

    this.add
      .text(this.scale.width / 2, 84, success ? 'DEPLOYMENT SUCCESSFUL' : 'RUN FAILED', {
        fontFamily: 'monospace',
        fontSize: '54px',
        color: success ? '#91ffb9' : '#ff9c9c',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 154, `Final Score: ${Math.floor(data.runState.score)}`, {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 194, `Clear Time: ${(data.runState.elapsedMs / 1000).toFixed(1)}s`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#d2e9ff',
      })
      .setOrigin(0.5);

    const summary = data.results
      .map((result, idx) => `${idx + 1}. ${result.level}  +${result.scoreDelta}  deaths:${result.deathsInLevel}`)
      .join('\n');

    this.add
      .text(this.scale.width / 2, 316, summary, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#c6defc',
        align: 'left',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 520, 'Enter Initials (A-Z, 0-9) and press ENTER to submit', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffe7a9',
      })
      .setOrigin(0.5);

    this.initialsText = this.add
      .text(this.scale.width / 2, 568, this.renderInitials(), {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#ffffff',
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
    if (!keyboard) {
      return;
    }

    keyboard.on('keydown', (event: KeyboardEvent) => {
      if (this.submitted) {
        return;
      }

      if (/^[a-z0-9]$/i.test(event.key) && this.initials.length < 3) {
        this.initials += event.key.toUpperCase();
      } else if (event.key === 'Backspace') {
        this.initials = this.initials.slice(0, -1);
      } else if (event.key === 'Enter') {
        this.submit(data.runState.score, data.runState.elapsedMs);
        return;
      }

      this.initials = sanitizeInitials(this.initials).slice(0, 3);
      this.initialsText?.setText(this.renderInitials());
    });

    keyboard.on('keydown-L', () => this.scene.start('LeaderboardScene'));
    keyboard.on('keydown-M', () => this.scene.start('MenuScene'));
  }

  private submit(score: number, clearTimeMs: number): void {
    const initials = sanitizeInitials(this.initials).padEnd(3, 'X');
    addLeaderboardEntry({
      initials,
      score: Math.floor(score),
      clearTimeMs: Math.floor(clearTimeMs),
      dateISO: new Date().toISOString(),
      version: 'v1',
    });

    this.submitted = true;
    this.add
      .text(this.scale.width / 2, 614, 'Submission saved. Press L for leaderboard or M for menu.', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#9effaf',
      })
      .setOrigin(0.5);
  }

  private renderInitials(): string {
    return this.initials.padEnd(3, '_');
  }
}
