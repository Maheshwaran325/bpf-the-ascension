import Phaser from 'phaser';
import { gameConfig } from './game/config';
import './styles/ui.css';

declare global {
  interface Window {
    __BPF_DEBUG__?: {
      getActiveScene: () => string[];
      startScene: (key: string, data?: Record<string, unknown>) => void;
      startNewRun: (reducedFlash?: boolean, reducedShake?: boolean) => void;
      getSnapshot: () => {
        activeScene: string | null;
        health: number | null;
        reducedFlash: boolean | null;
      };
      forceCurrentLevelFail: () => void;
      forceCurrentLevelComplete: () => void;
      getStorage: (key: string) => string | null;
      setStorage: (key: string, value: string) => void;
    };
  }
}

const game = new Phaser.Game(gameConfig);

type DebugScene = Phaser.Scene & {
  runState?: {
    health?: number;
    accessibility?: {
      reducedFlash?: boolean;
    };
  };
  completeLevel?: (godmodeSurvivalMs?: number) => void;
};

function getSceneKey(scene: Phaser.Scene): string {
  return scene.scene.key;
}

function getPrimaryActiveScene(gameInstance: Phaser.Game): DebugScene | null {
  const scenes = gameInstance.scene.getScenes(true);
  if (scenes.length === 0) {
    return null;
  }

  const levelScene = scenes.find((scene) =>
    getSceneKey(scene).startsWith('Level') || getSceneKey(scene) === 'ResultScene',
  );

  return (levelScene ?? scenes[0]) as DebugScene;
}

window.__BPF_DEBUG__ = {
  getActiveScene: () => game.scene.getScenes(true).map((scene) => scene.scene.key),
  startScene: (key: string, data?: Record<string, unknown>) => {
    game.scene.start(key, data);
  },
  startNewRun: (reducedFlash = false, reducedShake = false) => {
    game.scene.start('GauntletScene', {
      type: 'newRun',
      playerName: 'DBG',
      accessibility: {
        reducedFlash,
        reducedShake,
      },
    });
  },
  getSnapshot: () => {
    const scene = getPrimaryActiveScene(game);
    if (!scene) {
      return { activeScene: null, health: null, reducedFlash: null };
    }

    const activeScene =
      typeof scene.scene.key === 'string'
        ? scene.scene.key
        : null;

    const runState = scene.runState;
    return {
      activeScene,
      health: typeof runState?.health === 'number' ? runState.health : null,
      reducedFlash:
        typeof runState?.accessibility?.reducedFlash === 'boolean'
          ? runState.accessibility.reducedFlash
          : null,
    };
  },
  forceCurrentLevelFail: () => {
    const scene = getPrimaryActiveScene(game);
    if (!scene) {
      return;
    }
    if (typeof scene.runState === 'object' && scene.runState && 'health' in scene.runState) {
      (scene.runState as { health: number }).health = 0;
    }
  },
  forceCurrentLevelComplete: () => {
    const scene = getPrimaryActiveScene(game);
    if (!scene) {
      return;
    }
    const completeLevel = scene.completeLevel as ((godmodeSurvivalMs?: number) => void) | undefined;
    if (typeof completeLevel === 'function') {
      if (scene.scene.key === 'Level6GodmodeScene') {
        completeLevel.call(scene, 180_000);
      } else {
        completeLevel.call(scene, 0);
      }
    }
  },
  getStorage: (key: string) => window.localStorage.getItem(key),
  setStorage: (key: string, value: string) => window.localStorage.setItem(key, value),
};
