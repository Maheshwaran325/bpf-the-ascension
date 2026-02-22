import { LevelSceneData } from '../types/game';

const RUN_DATA_KEY = 'bpf_ascension_run_state';

export function saveActiveRun(data: LevelSceneData): void {
    try {
        localStorage.setItem(RUN_DATA_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to save run state', error);
    }
}

export function loadActiveRun(): LevelSceneData | null {
    try {
        const raw = localStorage.getItem(RUN_DATA_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as LevelSceneData;
    } catch (error) {
        console.warn('Failed to load run state', error);
        return null;
    }
}

export function clearActiveRun(): void {
    try {
        localStorage.removeItem(RUN_DATA_KEY);
    } catch (error) {
        console.warn('Failed to clear run state', error);
    }
}
