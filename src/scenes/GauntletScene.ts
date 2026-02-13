import Phaser from 'phaser';
import {
  DEFAULT_ACCESSIBILITY,
  LEVEL_LABELS,
  LEVEL_ORDER,
  LEVEL_SCENE_KEY,
  MAX_HEALTH,
} from '../game/constants';
import { loadAccessibilitySettings } from '../storage/settings';
import {
  AccessibilitySettings,
  CompletedLevelPayload,
  FailedLevelPayload,
  GauntletSceneData,
  LevelResult,
  RunState,
} from '../types/game';

export class GauntletScene extends Phaser.Scene {
  constructor() {
    super('GauntletScene');
  }

  create(data: GauntletSceneData = { type: 'newRun' }): void {
    this.cameras.main.setBackgroundColor('#090d15');

    if (data.type === 'newRun') {
      const accessibility = this.resolveAccessibility(data.accessibility);
      const runState: RunState = {
        health: MAX_HEALTH,
        score: 0,
        deaths: 0,
        // Changed from LEVEL_ORDER[0] to LEVEL_ORDER[1]
        currentLevel: LEVEL_ORDER[5],
        elapsedMs: 0,
        accessibility,
      };

      this.showCard('Initializing Gauntlet', 'Deploy pipeline warming...');
      this.time.delayedCall(900, () => {
        // Changed from startLevel(0, ...) to startLevel(1, ...)
        this.startLevel(5, runState, [], 0);
      });
      return;
    }

    if (isFailedPayload(data)) {
      this.showCard('SYSTEM FAILURE', `Retrying ${LEVEL_LABELS[LEVEL_ORDER[data.levelIndex]]}`);
      this.time.delayedCall(700, () => {
        this.startLevel(data.levelIndex, data.runState, data.results, data.deathsInLevel);
      });
      return;
    }

    const mergedResults = [...data.results, data.result];
    const nextLevelIndex = data.levelIndex + 1;

    if (nextLevelIndex >= LEVEL_ORDER.length) {
      this.scene.start('ResultScene', {
        success: true,
        runState: data.runState,
        results: mergedResults,
      });
      return;
    }

    this.showCard(
      `Cleared ${LEVEL_LABELS[LEVEL_ORDER[data.levelIndex]]}`,
      `+${data.result.scoreDelta} score  |  Total ${Math.floor(data.runState.score)}`,
    );
    this.time.delayedCall(1400, () => {
      this.startLevel(nextLevelIndex, data.runState, mergedResults, 0);
    });
  }

  private startLevel(levelIndex: number, runState: RunState, results: LevelResult[], deathsInLevel: number): void {
    const levelId = LEVEL_ORDER[levelIndex];
    const sceneKey = LEVEL_SCENE_KEY[levelId];

    this.scene.start(sceneKey, {
      runState: {
        ...runState,
        currentLevel: levelId,
        health: MAX_HEALTH,
      },
      levelIndex,
      results,
      deathsInLevel,
    });
  }

  private showCard(title: string, subtitle: string): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 24, title, {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffe08d',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 34, subtitle, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#c8deff',
      })
      .setOrigin(0.5);
  }

  private resolveAccessibility(settings?: AccessibilitySettings): AccessibilitySettings {
    if (settings) {
      return settings;
    }

    try {
      return loadAccessibilitySettings();
    } catch {
      return { ...DEFAULT_ACCESSIBILITY };
    }
  }
}

function isFailedPayload(data: GauntletSceneData): data is FailedLevelPayload {
  return data.type === 'levelFailed';
}

function isCompletedPayload(data: GauntletSceneData): data is CompletedLevelPayload {
  return data.type === 'levelComplete';
}
