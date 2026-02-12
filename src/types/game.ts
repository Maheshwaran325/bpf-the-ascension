export type LevelId = 'burningMonk' | 'snap' | 'pixelBoss' | 'jinSakai' | 'ronin45' | 'godmode';

export interface AccessibilitySettings {
  reducedFlash: boolean;
  reducedShake: boolean;
}

export interface RunState {
  health: number;
  score: number;
  deaths: number;
  currentLevel: LevelId;
  elapsedMs: number;
  accessibility: AccessibilitySettings;
}

export interface LevelResult {
  level: LevelId;
  success: boolean;
  durationMs: number;
  damageTaken: number;
  deathsInLevel: number;
  scoreDelta: number;
}

export interface RuleMutation {
  id: string;
  label: string;
  durationMs: number;
  apply: () => void;
  clear: () => void;
}

export interface LeaderboardEntry {
  initials: string;
  score: number;
  clearTimeMs: number;
  dateISO: string;
  version: 'v1';
}

export interface LevelSceneData {
  runState: RunState;
  levelIndex: number;
  results: LevelResult[];
  deathsInLevel: number;
}

export interface CompletedLevelPayload {
  type: 'levelComplete';
  runState: RunState;
  levelIndex: number;
  result: LevelResult;
  results: LevelResult[];
}

export interface FailedLevelPayload {
  type: 'levelFailed';
  runState: RunState;
  levelIndex: number;
  deathsInLevel: number;
  results: LevelResult[];
}

export interface NewRunPayload {
  type: 'newRun';
  accessibility?: AccessibilitySettings;
}

export type GauntletSceneData =
  | NewRunPayload
  | CompletedLevelPayload
  | FailedLevelPayload;

export interface MutationEffects {
  gravityMultiplier: number;
  reverseControls: boolean;
  darknessMask: boolean;
  speedMultiplier: number;
  activeLabel: string;
}
