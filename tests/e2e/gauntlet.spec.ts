import { expect, Page, test } from '@playwright/test';

type Snapshot = {
  activeScene: string | null;
  health: number | null;
  reducedFlash: boolean | null;
};

async function waitForActiveScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction(
    (key: string) => {
      const scenes = (window as any).__BPF_DEBUG__?.getActiveScene() ?? [];
      return scenes.includes(key);
    },
    sceneKey,
    { timeout: 15_000 },
  );
}

test('starts from menu and reaches Level 1', async ({ page }) => {
  await page.goto('/');
  await waitForActiveScene(page, 'MenuScene');

  await page.evaluate(() => {
    (window as any).__BPF_DEBUG__?.startNewRun(false, false);
  });

  await waitForActiveScene(page, 'Level1BurningMonkScene');
  const scenes = await page.evaluate(() => (window as any).__BPF_DEBUG__?.getActiveScene() ?? []);
  expect(scenes).toContain('Level1BurningMonkScene');
});

test('restarts current level when health is depleted', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as any).__BPF_DEBUG__?.startNewRun(false, false);
  });
  await waitForActiveScene(page, 'Level1BurningMonkScene');

  await page.evaluate(() => {
    (window as any).__BPF_DEBUG__?.forceCurrentLevelFail();
  });

  await waitForActiveScene(page, 'Level1BurningMonkScene');
  const snapshot = await page.evaluate<Snapshot | null>(() => (window as any).__BPF_DEBUG__?.getSnapshot() ?? null);
  expect(snapshot?.health).toBe(100);
});

test('persists reduced-flash accessibility mode into gameplay', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem(
      'bpf_ascension_accessibility_v1',
      JSON.stringify({ reducedFlash: true, reducedShake: false }),
    );
    (window as any).__BPF_DEBUG__?.startScene('GauntletScene', { type: 'newRun' });
  });

  await waitForActiveScene(page, 'Level1BurningMonkScene');
  const snapshot = await page.evaluate<Snapshot | null>(() => (window as any).__BPF_DEBUG__?.getSnapshot() ?? null);
  expect(snapshot?.reducedFlash).toBe(true);
});

test('completing gauntlet writes leaderboard entry', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    (window as any).__BPF_DEBUG__?.startNewRun(false, false);
  });

  const levelKeys = [
    'Level1BurningMonkScene',
    'Level2SnapScene',
    'Level3PixelBossScene',
    'Level4JinSakaiScene',
    'Level5RoninScene',
    'Level6GodmodeScene',
  ];

  for (const key of levelKeys) {
    await waitForActiveScene(page, key);
    await page.evaluate(() => {
      (window as any).__BPF_DEBUG__?.forceCurrentLevelComplete();
    });
  }

  await waitForActiveScene(page, 'ResultScene');
  await page.keyboard.type('ABC');
  await page.keyboard.press('Enter');

  await page.waitForFunction(() => {
    const raw = window.localStorage.getItem('bpf_ascension_leaderboard_v1');
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw) as Array<{ initials: string }>;
    return parsed.length > 0 && parsed[0].initials.length === 3;
  });

  const leaderboardRaw = await page.evaluate(() => window.localStorage.getItem('bpf_ascension_leaderboard_v1'));
  expect(leaderboardRaw).not.toBeNull();
});
