import { test, expect, type Page } from '@playwright/test';
import type { TrackingEvent } from '../src/tracking';

declare global {
  interface Window {
    trackingEvents: TrackingEvent[];
  }
}

async function events<K extends TrackingEvent['name']>(page: Page, name: K) {
  return (await page.evaluate(() => window.trackingEvents)).filter(
    (event): event is Extract<TrackingEvent, { name: K }> => event.name === name,
  );
}

async function start(page: Page) {
  await page.getByRole('button', { name: 'Zaczynamy!', exact: true }).click();
  await page.getByRole('button', { name: 'Jasne, gramy!', exact: true }).click();
  await expect(page.getByTestId('active-block')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.trackingEvents = [];
    const original = console.log;
    console.log = (...args) => {
      if (args[0] === '[tracking]') window.trackingEvents.push(args[1]);
      original(...args);
    };
  });
});

test('tracks outcomes, pause reasons, confirmed exit and replay without duplicates', async ({
  page,
}) => {
  await page.goto('./');
  await page.clock.install();
  await start(page);
  const equation = (await page.locator('.falling-equation').innerText()).match(
    /(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/,
  )!;
  const isTrue = Number(equation[1]) + Number(equation[2]) === Number(equation[3]);
  await page
    .getByRole('button', {
      name: isTrue ? 'Równanie jest prawdziwe' : 'Równanie jest fałszywe',
      exact: true,
    })
    .dblclick({ force: true });
  await page.clock.runFor(288);
  await page.getByRole('button', { name: 'Pauza', exact: true }).click();
  await page.getByRole('button', { name: 'Wróć do wyboru', exact: true }).click();
  await page.getByRole('button', { name: 'Anuluj', exact: true }).last().click();
  expect(await events(page, 'game_ended')).toHaveLength(0);
  await page.clock.fastForward(60000);
  await page.getByRole('button', { name: 'Wracam do gry', exact: true }).last().click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByRole('button', { name: 'Wróć do wyboru', exact: true }).click();
  await page.getByRole('button', { name: 'Zakończ partię', exact: true }).click();
  const ended = await events(page, 'game_ended');
  expect(ended).toHaveLength(1);
  expect(ended[0].properties).toMatchObject({
    reason: 'exit',
    score: 10,
    correct: 1,
    mistakes: 0,
    missed: 0,
  });
  expect(ended[0].properties.activeFallingMs).toBeLessThan(10000);
  expect(await events(page, 'equation_resolved')).toHaveLength(1);
  expect((await events(page, 'game_paused')).map((e) => e.properties.reason)).toEqual([
    'manual',
    'hidden',
  ]);
  expect(await events(page, 'game_resumed')).toHaveLength(1);
  expect(await events(page, 'record_improved')).toHaveLength(1);
  await start(page);
  await page.clock.fastForward(180000);
  await expect(page.getByRole('heading', { name: 'Ale było liczenia!' })).toBeVisible();
  const misses = (await events(page, 'equation_resolved')).filter(
    (e) => e.properties.outcome === 'missed',
  );
  expect(misses.map((e) => e.properties.blockId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  expect((await events(page, 'game_ended'))[1].properties).toMatchObject({
    reason: 'board_full',
    missed: 8,
  });
  expect(await events(page, 'record_improved')).toHaveLength(1);
  await page.getByRole('button', { name: 'Jeszcze raz', exact: true }).click();
  const starts = await events(page, 'game_started');
  expect(starts.map((e) => e.properties.source)).toEqual(['start', 'start', 'replay']);
  expect(new Set(starts.map((e) => e.properties.gameId)).size).toBe(3);
  expect(await events(page, 'app_opened')).toHaveLength(1);
});

test('tracks UI changes without profile data and works after an offline reload', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await expect(page.getByText('Gotowe do gry offline', { exact: true })).toBeVisible();
  await page.locator('.level-card').nth(3).click();
  await page.locator('.level-card').nth(3).click();
  await page.locator('.tempo-card').nth(2).click();
  await page.getByLabel('Język', { exact: true }).selectOption('en');
  await page.getByRole('button', { name: 'Mute sounds', exact: true }).click();
  expect((await events(page, 'setting_changed')).map((e) => e.properties.setting)).toEqual([
    'level',
    'tempo',
    'language',
    'muted',
  ]);
  await page.getByRole('button', { name: 'Profiles', exact: true }).click();
  await page.getByLabel('New child’s name').fill('Private Child Name');
  await page.getByRole('button', { name: 'Add profile', exact: true }).click();
  expect((await events(page, 'profile_changed')).map((e) => e.properties.action)).toEqual([
    'created',
  ]);
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('number-trouble-profiles-v1')!),
  );
  const captured = JSON.stringify(await page.evaluate(() => window.trackingEvents));
  expect(captured).not.toContain('Private Child Name');
  for (const profile of stored.profiles) expect(captured).not.toContain(profile.id);
  expect((await events(page, 'screen_viewed')).map((e) => e.properties.screen)).toEqual([
    'play',
    'profiles',
    'play',
  ]);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Let’s play!', exact: true })).toBeVisible();
  expect((await events(page, 'app_opened'))[0].properties).toMatchObject({
    online: false,
    language: 'en',
  });
  await page.getByRole('button', { name: 'Let’s play!', exact: true }).click();
  await page.getByRole('button', { name: 'Got it, let’s play!', exact: true }).click();
  expect(await events(page, 'game_started')).toHaveLength(1);
});

test('console adapter failures do not interrupt gameplay', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    console.log = () => {
      throw new Error('Unavailable tracking adapter');
    };
  });
  await page.goto('./');
  await page.clock.install();
  await start(page);
  await page.clock.fastForward(180000);
  await expect(page.getByRole('heading', { name: 'Ale było liczenia!' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('distinguishes install prompt outcomes from confirmed installation', async ({ page }) => {
  await page.addInitScript(() => {
    window.addEventListener(
      'beforeinstallprompt',
      (event) => {
        if (event.isTrusted) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Zainstaluj grę', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Zamknij', exact: true })
    .last()
    .click();
  expect((await events(page, 'install_requested'))[0].properties.method).toBe('instructions');
  for (const outcome of ['accepted', 'dismissed', 'failed'] as const) {
    await page.evaluate((outcome) => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      Object.assign(event, {
        prompt: async () => {
          if (outcome === 'failed') throw new Error('Prompt unavailable');
        },
        userChoice: Promise.resolve({ outcome }),
      });
      window.dispatchEvent(event);
    }, outcome);
    await page.getByRole('button', { name: 'Zainstaluj grę', exact: true }).click();
    await expect
      .poll(async () => (await events(page, 'install_prompt_result')).at(-1)?.properties.outcome)
      .toBe(outcome);
  }
  expect(await events(page, 'app_installed')).toHaveLength(0);
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  expect(await events(page, 'app_installed')).toHaveLength(1);
});
