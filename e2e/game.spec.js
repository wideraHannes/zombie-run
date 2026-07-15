import { test, expect } from '@playwright/test';

async function readGame(page) {
  return await page.evaluate(() => {
    const g = window.__game;
    if (!g) return null;
    const s = g.stateRef.current;
    return {
      status: g.status,
      player: { x: s.player.x, y: s.player.y, health: s.player.health },
      zombies: s.zombies.length,
      bullets: s.bullets.length,
      kills: s.kills,
    };
  });
}

async function startGame(page) {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: /start game/i }).click();
  await expect.poll(async () => (await readGame(page))?.status).toBe('playing');
}

test('smoke: app loads, canvas mounts, Start puts status=playing', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startGame(page);
  const g = await readGame(page);
  expect(g.player.health).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('player movement: WASD moves the player entity', async ({ page }) => {
  await startGame(page);
  const before = await readGame(page);

  await page.locator('canvas').focus();
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyS');

  const after = await readGame(page);
  expect(after.player.x).toBeGreaterThan(before.player.x + 10);
  expect(after.player.y).toBeGreaterThan(before.player.y + 10);
});

test('fire + kill: clicking spawns bullets and kills zombies', async ({ page }) => {
  await startGame(page);

  // Wait for at least one zombie to spawn.
  await expect.poll(async () => (await readGame(page))?.zombies, { timeout: 8000 }).toBeGreaterThan(0);

  // Aim + fire toward the first zombie for a couple of seconds.
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();

  const startKills = (await readGame(page)).kills;
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const g = await readGame(page);
    if (g.kills > startKills) break;
    const s = await page.evaluate(() => {
      const st = window.__game.stateRef.current;
      const z = st.zombies[0];
      return z ? { px: st.player.x, py: st.player.y, zx: z.x, zy: z.y } : null;
    });
    if (!s) { await page.waitForTimeout(100); continue; }
    // World coords -> client coords via canvas bounding box.
    const dims = { w: 960, h: 600 };
    const cx = box.x + (s.zx / dims.w) * box.width;
    const cy = box.y + (s.zy / dims.h) * box.height;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.waitForTimeout(150);
    await page.mouse.up();
  }

  const end = await readGame(page);
  expect(end.kills).toBeGreaterThan(startKills);
});
