import Phaser from 'phaser';
import {
  DEFAULT_ACCESSIBILITY,
  DEFAULT_AUDIO,
  GAME_FONT,
  LEVEL_LABELS,
  LEVEL_ORDER,
  LEVEL_SCENE_KEY,
  MAX_HEALTH,
} from '../game/constants';
import { loadAccessibilitySettings, loadAudioSettings } from '../storage/settings';
import {
  AccessibilitySettings,
  AudioSettings,
  CompletedLevelPayload,
  FailedLevelPayload,
  GauntletSceneData,
  LevelResult,
  RunState,
} from '../types/game';

export class GauntletScene extends Phaser.Scene {
  private static readonly INTRO_CARD_MS = 1_200;

  private static readonly CLEAR_CARD_MS = 1_150;

  private static readonly ENTER_CARD_AFTER_CLEAR_MS = 2_300;

  private cardTitle?: Phaser.GameObjects.Text;

  private cardSubtitle?: Phaser.GameObjects.Text;

  constructor() {
    super('GauntletScene');
  }

  create(data: GauntletSceneData = { type: 'newRun' }): void {
    this.cameras.main.setBackgroundColor('#090d15');
    const startLevelIndex = 0;

    if (data.type === 'newRun') {
      const accessibility = this.resolveAccessibility(data.accessibility);
      const runState: RunState = {
        health: MAX_HEALTH,
        score: 0,
        deaths: 0,
        currentLevel: LEVEL_ORDER[startLevelIndex],
        elapsedMs: 0,
        accessibility,
        audio: this.resolveAudio(data.audio),
      };

      this.showCard(`Entering ${LEVEL_LABELS[LEVEL_ORDER[startLevelIndex]]}`, 'Deploy pipeline warming...');
      this.time.delayedCall(GauntletScene.INTRO_CARD_MS, () => {
        this.startLevel(startLevelIndex, runState, [], 0);
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

    const currentLevelLabel = LEVEL_LABELS[LEVEL_ORDER[data.levelIndex]];
    const nextLevelLabel = LEVEL_LABELS[LEVEL_ORDER[nextLevelIndex]];

    this.showCard(`Cleared ${currentLevelLabel}`, `+${data.result.scoreDelta}  |  Total ${Math.floor(data.runState.score)}`);
    this.time.delayedCall(GauntletScene.CLEAR_CARD_MS, () => {
      this.showCard(`Entering ${nextLevelLabel}`, 'Prepare for next protocol');
    });
    this.time.delayedCall(GauntletScene.ENTER_CARD_AFTER_CLEAR_MS, () => {
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
    this.cardTitle?.destroy();
    this.cardSubtitle?.destroy();

    this.cardTitle = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 24, title, {
        fontFamily: GAME_FONT,
        fontSize: '64px',
        color: '#ffe08d',
      })
      .setOrigin(0.5)
      .setShadow(4, 4, '#000000', 0, true, true);

    this.cardSubtitle = this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 34, subtitle, {
        fontFamily: GAME_FONT,
        fontSize: '32px',
        color: '#c8deff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 0, true, true);
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

  private resolveAudio(settings?: AudioSettings): AudioSettings {
    if (settings) {
      return settings;
    }

    try {
      return loadAudioSettings();
    } catch {
      return { ...DEFAULT_AUDIO };
    }
  }
}

function isFailedPayload(data: GauntletSceneData): data is FailedLevelPayload {
  return data.type === 'levelFailed';
}

function isCompletedPayload(data: GauntletSceneData): data is CompletedLevelPayload {
  return data.type === 'levelComplete';
}
