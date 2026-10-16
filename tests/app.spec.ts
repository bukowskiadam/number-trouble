import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile } from 'node:fs/promises';
const key = 'number-trouble-profiles-v1';
async function installClock(page: Page) {
  await page.clock.install({ time: new Date('2026-10-10T12:00:00Z') });
}
async function start(page: Page, english = false) {
  await page
    .getByRole('button', { name: english ? 'Let’s play!' : 'Zaczynamy!', exact: true })
    .click();
  await page
    .getByRole('button', { name: english ? 'Got it, let’s play!' : 'Jasne, gramy!', exact: true })
    .click();
  await expect(page.getByTestId('active-block')).toBeVisible();
}
async function currentEquation(page: Page) {
  await expect(page.locator('.board')).toHaveAttribute('data-phase', 'falling');
  const value = await page.locator('.falling-equation').innerText();
  const parts = value.match(/(\d+)\s*([+−])\s*(\d+)\s*=\s*(\d+)/)!;
  const result =
    parts[2] === '+' ? Number(parts[1]) + Number(parts[3]) : Number(parts[1]) - Number(parts[3]);
  const shown = Number(parts[4]);
  return { result, shown, isTrue: result === shown };
}
async function answer(page: Page, correct: boolean, english = false) {
  const { isTrue } = await currentEquation(page);
  const yes = correct ? isTrue : !isTrue;
  await page
    .getByRole('button', {
      name: english
        ? yes
          ? 'The equation is true'
          : 'The equation is false'
        : yes
          ? 'Równanie jest prawdziwe'
          : 'Równanie jest fałszywe',
      exact: true,
    })
    .click({ force: true });
}
async function finish(page: Page, english = false) {
  for (let i = 0; i < 8; i++) {
    await answer(page, false, english);
    await page.clock.runFor(2416);
  }
  await expect(
    page.getByRole('heading', {
      name: english ? 'That was a lot of maths!' : 'Ale było liczenia!',
    }),
  ).toBeVisible();
}
async function ready(page: Page) {
  await expect(page.getByText('Gotowe do gry offline', { exact: true })).toBeVisible();
}

test('desktop selection, instructions, score, correction, pause, complete game and record', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await ready(page);
  await installClock(page);
  await expect(page.locator('.level-card')).toHaveCount(4);
  await expect(page.locator('.tempo-card')).toHaveCount(3);
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await start(page);
  const top = await page.getByTestId('active-block').evaluate((e) => e.getBoundingClientRect().top);
  await page.clock.runFor(1000);
  expect(
    await page.getByTestId('active-block').evaluate((e) => e.getBoundingClientRect().top),
  ).toBeGreaterThan(top);
  for (let i = 0; i < 3; i++) {
    await answer(page, true);
    await page.clock.runFor(288);
  }
  await expect(page.getByTestId('score')).toHaveText('33');
  await expect(page.getByTestId('streak')).toHaveText('3');
  await page.getByRole('button', { name: 'Pauza', exact: true }).click();
  const frozen = await page.getByTestId('active-block').getAttribute('style');
  await page.clock.fastForward(60000);
  expect(await page.getByTestId('active-block').getAttribute('style')).toBe(frozen);
  await page.getByRole('button', { name: 'Wracam do gry', exact: true }).last().click();
  await answer(page, false);
  await expect(page.locator('.board')).toHaveAttribute('data-phase', 'correction');
  await page.clock.runFor(1900);
  await expect(page.locator('.board')).toHaveAttribute('data-phase', 'correction');
  await page.clock.runFor(516);
  await expect(page.getByTestId('blocks')).toContainText('1 / 8');
  await expect(page.getByTestId('score')).toHaveText('33');
  for (let i = 1; i < 8; i++) {
    await answer(page, false);
    await page.clock.runFor(2416);
  }
  await expect(page.getByRole('heading', { name: 'Ale było liczenia!' })).toBeVisible();
  await expect(page.locator('.final-score strong')).toHaveText('33');
  await expect(page.locator('.summary-stats')).toContainText('8Błędne oceny');
  await page.getByRole('button', { name: 'Wróć do wyboru', exact: true }).click();
  await expect(page.locator('.best-preview')).toContainText('33');
  await page.reload();
  await expect(page.locator('.best-preview')).toContainText('33');
  expect(errors).toEqual([]);
});

test('phone touch targets, seven-block geometry, rotation, keyboard and missed correction', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto('./');
  await installClock(page);
  await page.screenshot({ path: 'test-results/home-phone.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await start(page);
  await page.clock.runFor(600);
  const button = page.getByRole('button', { name: 'Równanie jest prawdziwe', exact: true });
  const box = await button.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(48);
  expect(box!.width).toBeGreaterThanOrEqual(48);
  await button.tap({ force: true });
  await expect(page.locator('.board')).not.toHaveAttribute('data-phase', 'falling');
  await page.clock.runFor(2416);
  // Reach seven blocks using real UI answers, regardless of the first random equation.
  let count = await page.locator('.stack-block').count();
  while (count < 7) {
    await answer(page, false);
    await page.clock.runFor(2416);
    count++;
  }
  await expect(page.locator('.board')).toHaveAttribute('data-phase', 'falling');
  await page.screenshot({ path: 'test-results/seven-blocks-phone.png', fullPage: true });
  const rects = await page.locator('.answer').evaluateAll((elements) =>
    elements.map((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    }),
  );
  for (const r of rects) {
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(390);
    expect(r.bottom).toBeLessThan(844);
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.stack-block')).toHaveCount(7);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(1900);
  await expect(page.locator('.board')).toHaveAttribute('data-phase', 'missed');
  await expect(page.locator('.stack-block')).toHaveCount(8);
  await expect(page.getByRole('heading', { name: 'Ale było liczenia!' })).toHaveCount(0);
  await page.clock.runFor(2100);
  await expect(page.getByRole('heading', { name: 'Ale było liczenia!' })).toBeVisible();
  await page.getByRole('button', { name: 'Jeszcze raz', exact: true }).click();
  await expect(page.getByTestId('score')).toHaveText('0');
  await expect(page.locator('.stack-block')).toHaveCount(0);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.board')).not.toHaveAttribute('data-phase', 'falling');
  await context.close();
});

test('profiles, independent settings, rename, confirmations, deletion and storage failure', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByRole('button', { name: /Usuń profil:/ })).toBeDisabled();
  await page.getByLabel('Imię lub pseudonim', { exact: true }).fill('Ala');
  await page.getByRole('button', { name: 'Zapisz imię' }).click();
  await expect(page.locator('.current-profile')).toContainText('Ala');
  await page.reload();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByLabel('Imię lub pseudonim', { exact: true })).toHaveValue('Ala');
  await page.getByLabel('Imię nowego dziecka').fill('Maja');
  await page.getByRole('button', { name: 'Dodaj profil' }).click();
  await expect(page.locator('.current-profile')).toContainText('Maja');
  await page.locator('.level-card').nth(3).click();
  await page.locator('.tempo-card').nth(2).click();
  await page.getByLabel('Język', { exact: true }).selectOption('en');
  await page.getByRole('button', { name: 'Mute sounds', exact: true }).click();
  await page.getByRole('button', { name: 'Profiles', exact: true }).click();
  await page.getByRole('button', { name: /Ala Select profile/ }).click();
  await expect(page.getByLabel('Język', { exact: true })).toHaveValue('pl');
  await expect(page.locator('.level-card').first()).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Usuń profil: Maja', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Maja');
  await page.getByRole('button', { name: 'Anuluj', exact: true }).last().click();
  await expect(page.locator('.profile-row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Usuń profil: Maja', exact: true }).click();
  await page.getByRole('button', { name: 'Usuń profil', exact: true }).click();
  await expect(page.locator('.profile-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Wyzeruj rekordy', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Ala');
  await page.getByRole('button', { name: 'Wyzeruj rekordy', exact: true }).last().click();
  await page.reload();
  await expect(page.locator('.current-profile')).toContainText('Ala');
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Blocked', 'QuotaExceededError');
    };
  });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Nie można zapisać danych');
  await start(page);
  await expect(page.locator('.board')).toBeVisible();
});

test('production offline relaunch, all 24 configurations, profile creation, sound and saved record', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await ready(page);
  const assets = await page.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(names.find((n) => n.startsWith('number-trouble-'))!);
    return (await cache.keys()).map((r) => r.url);
  });
  expect(assets.some((url) => url.endsWith('icon-512.png'))).toBe(true);
  expect(assets.some((url) => url.includes('latin-ext'))).toBe(true);
  await context.setOffline(true);
  await page.close();
  const offline = await context.newPage();
  await offline.goto('./');
  await ready(offline);
  await installClock(offline);
  await offline.getByRole('button', { name: 'Profile', exact: true }).click();
  await offline.getByLabel('Imię nowego dziecka').fill('Offline child');
  await offline.getByRole('button', { name: 'Dodaj profil' }).click();
  for (const language of ['pl', 'en']) {
    await offline.locator('.language select').selectOption(language);
    for (let level = 0; level < 4; level++)
      for (let tempo = 0; tempo < 3; tempo++) {
        await offline.locator('.level-card').nth(level).click();
        await offline.locator('.tempo-card').nth(tempo).click();
        await start(offline, language === 'en');
        await answer(offline, true, language === 'en');
        await offline.clock.runFor(288);
        await expect(offline.getByTestId('score')).toHaveText('10');
        await offline
          .getByRole('button', { name: language === 'en' ? 'Pause' : 'Pauza', exact: true })
          .click();
        await offline
          .getByRole('button', {
            name: language === 'en' ? 'Back to selection' : 'Wróć do wyboru',
            exact: true,
          })
          .click();
        await expect(
          offline.getByText(
            language === 'en'
              ? 'Your score will be saved if it is a new record.'
              : 'Twój wynik zostanie zapisany, jeśli jest nowym rekordem.',
            { exact: true },
          ),
        ).toBeVisible();
        await offline
          .getByRole('button', {
            name: language === 'en' ? 'End game' : 'Zakończ partię',
            exact: true,
          })
          .click();
        await expect(offline.locator('.best-preview')).toContainText('10');
      }
  }
  await offline.reload();
  const earlyRecords = await offline.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(earlyRecords.profiles[0].records).toEqual({});
  expect(Object.keys(earlyRecords.profiles[1].records)).toHaveLength(12);
  for (const record of Object.values(earlyRecords.profiles[1].records))
    expect(record).toMatchObject({ score: 10 });
  await start(offline, true);
  await answer(offline, true, true);
  await offline.clock.runFor(288);
  await finish(offline, true);
  await offline.getByRole('button', { name: 'Back to selection', exact: true }).click();
  await offline.reload();
  await expect(offline.locator('.current-profile')).toContainText('Offline child');
  await expect(offline.locator('.best-preview')).toContainText('10');
  await offline.getByRole('button', { name: 'Records', exact: true }).click();
  await expect(offline.locator('tbody td')).toHaveCount(12);
  await expect(offline.getByRole('columnheader').first()).toHaveText('Level');
  expect((await new AxeBuilder({ page: offline }).analyze()).violations).toEqual([]);
});

test('automatic visibility pause and persisted settings in English', async ({ page }) => {
  await page.goto('./');
  await page.locator('.language select').selectOption('en');
  await installClock(page);
  await start(page, true);
  await page.clock.runFor(500);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('heading', { name: 'Take a breather' })).toBeVisible();
  await page.clock.fastForward(30000);
  await expect(page.getByTestId('blocks')).toHaveText('0 / 8');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('heading', { name: 'Take a breather' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to the game', exact: true }).last().click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Back to selection', exact: true }).click();
  await page.getByRole('button', { name: 'End game', exact: true }).click();
  await page.reload();
  await expect(page.locator('.language select')).toHaveValue('en');
});

test('manifest, install assets and update wait until the player leaves the game', async ({
  page,
}) => {
  await page.goto('./');
  await ready(page);
  const manifest = await (await page.request.get('manifest.webmanifest')).json();
  expect(manifest.scope).toBe('./');
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) {
    const response = await page.request.get(icon.src);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toBe('image/png');
  }
  await installClock(page);
  await start(page);
  await answer(page, true);
  await page.clock.runFor(288);
  const original = await readFile('dist/sw.js', 'utf8');
  try {
    await writeFile(
      'dist/sw.js',
      original.replace(/const CACHE = PREFIX \+ '[^']+';/, "const CACHE = PREFIX + 'e2e-update';"),
    );
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())!.update();
    });
    await expect
      .poll(() =>
        page.evaluate(async () =>
          Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
        ),
      )
      .toBe(true);
    await expect(page.getByTestId('score')).toHaveText('10');
    await expect(page.getByRole('button', { name: /Odśwież aplikację/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Pauza', exact: true }).click();
    await page.getByRole('button', { name: 'Wróć do wyboru', exact: true }).click();
    await page.getByRole('button', { name: 'Zakończ partię', exact: true }).click();
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: /Odśwież aplikację/ }).click(),
    ]);
    await ready(page);
    expect(
      await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).profiles.length, key),
    ).toBe(1);
  } finally {
    await writeFile('dist/sw.js', original);
  }
});

test('tablet corrections preserve true results; smallest phone keeps controls visible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('./');
  await installClock(page);
  await start(page);
  const findEquation = async (truth: boolean) => {
    // The answer run limit guarantees the desired kind within five blocks.
    for (let i = 0; i < 5; i++) {
      const equation = await currentEquation(page);
      if (equation.isTrue === truth) return equation;
      await answer(page, true);
      await page.clock.runFor(288);
    }
    throw new Error(`No equation with truth=${truth} within five blocks`);
  };
  const trueEquation = await findEquation(true);
  await answer(page, false);
  await expect(page.locator('.board')).toHaveAttribute('data-phase', 'correction');
  await expect(page.locator('.falling-equation del')).toHaveCount(0);
  await expect(page.locator('.falling-equation strong')).toHaveText(String(trueEquation.result));
  await expect(
    page.getByRole('status').filter({ hasText: 'To równanie było prawdziwe' }),
  ).toBeVisible();
  await page.clock.runFor(2416);
  const falseEquation = await findEquation(false);
  await answer(page, false);
  await expect(page.locator('.board')).toHaveAttribute('data-phase', 'correction');
  await expect(page.locator('.falling-equation del')).toHaveText(String(falseEquation.shown));
  await expect(page.locator('.falling-equation strong')).toHaveText(String(falseEquation.result));
  await page.screenshot({ path: 'test-results/correction-tablet.png', fullPage: true });
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.clock.runFor(2416);
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(page.locator('.stack-block')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/game-small-phone.png', fullPage: true });
  const board = await page.locator('.board').boundingBox();
  expect(board!.y + board!.height).toBeLessThanOrEqual(568);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const before = await page.getByTestId('active-block').boundingBox();
  await page.clock.runFor(500);
  const after = await page.getByTestId('active-block').boundingBox();
  expect(after!.y).toBeGreaterThan(before!.y);
});

test('leaving can be cancelled; confirmed exit saves the record and restart has fresh listeners', async ({
  page,
}) => {
  await page.goto('./');
  await installClock(page);
  await start(page);
  await answer(page, true);
  await page.clock.runFor(288);
  await page.getByRole('link', { name: 'Number Trouble', exact: true }).click();
  await expect(page.getByTestId('score')).toHaveText('10');
  await expect(page.getByRole('button', { name: 'Profile', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Pauza', exact: true }).click();
  await page.getByRole('button', { name: 'Wróć do wyboru', exact: true }).click();
  await page.getByRole('button', { name: 'Anuluj', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Chwila oddechu' })).toBeVisible();
  await page.clock.runFor(1000);
  await expect(page.getByTestId('score')).toHaveText('10');
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).profiles[0].records, key),
  ).toEqual({});
  await page.getByRole('button', { name: 'Wracam do gry', exact: true }).last().click();
  await answer(page, true);
  await page.clock.runFor(288);
  await expect(page.getByTestId('score')).toHaveText('21');
  await page.getByRole('button', { name: 'Pauza', exact: true }).click();
  await page.getByRole('button', { name: 'Wróć do wyboru', exact: true }).click();
  await page.getByRole('button', { name: 'Zakończ partię', exact: true }).click();
  await expect(page.locator('.best-preview')).toContainText('21');
  await page.keyboard.press('ArrowLeft');
  await page.clock.fastForward(60000);
  await expect(page.locator('.board')).toHaveCount(0);
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).profiles[0].records, key),
  ).toEqual({ '1-turtle': { score: 21, date: expect.any(String) } });
  await page.reload();
  await expect(page.locator('.best-preview')).toContainText('21');

  await start(page);
  await expect(page.getByTestId('score')).toHaveText('0');
  const before = await page.getByTestId('active-block').getAttribute('style');
  await page.clock.runFor(500);
  expect(await page.getByTestId('active-block').getAttribute('style')).not.toBe(before);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('heading', { name: 'Chwila oddechu' })).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.keyboard.press('Escape');
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.board')).not.toHaveAttribute('data-phase', 'falling');
});

for (const destination of ['Zagraj', 'Profile', 'Rekordy', 'brand']) {
  test(`summary navigation to ${destination} clears the completed game`, async ({ page }) => {
    await page.goto('./');
    await installClock(page);
    await start(page);
    await finish(page);
    if (destination === 'brand') {
      await page.getByRole('link', { name: 'Number Trouble', exact: true }).click();
    } else {
      await page.getByRole('button', { name: destination, exact: true }).click();
    }
    await expect(page.locator('.summary')).toHaveCount(0);
    if (destination === 'Profile') {
      await expect(page.getByRole('heading', { name: 'Kto dziś liczy?' })).toBeVisible();
    } else if (destination === 'Rekordy') {
      await expect(page.getByRole('columnheader').first()).toHaveText('Poziom');
      await expect(page.locator('tbody td').first()).toHaveText('0');
    } else {
      await expect(page.locator('.best-preview')).toContainText('0');
    }
  });
}

test('completed records stay with the starting profile and configuration across replay and reset', async ({
  page,
}) => {
  await page.goto('./');
  await installClock(page);
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByLabel('Imię nowego dziecka').fill('Maja');
  await page.getByRole('button', { name: 'Dodaj profil' }).click();
  await page.locator('.level-card').nth(3).click();
  await page.locator('.tempo-card').nth(2).click();
  await start(page);
  await answer(page, true);
  await page.clock.runFor(288);
  await page.getByLabel('Język', { exact: true }).selectOption('en');
  await page.getByRole('button', { name: 'Mute sounds', exact: true }).click();
  await finish(page, true);
  await expect(page.locator('.summary .eyebrow')).toHaveText('New record!');
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(saved.profiles[0].records).toEqual({});
  expect(Object.keys(saved.profiles[1].records)).toEqual(['4-cheetah']);
  expect(saved.profiles[1].records['4-cheetah'].score).toBe(10);
  await page.getByRole('button', { name: 'Play again', exact: true }).click();
  await answer(page, true, true);
  await page.clock.runFor(288);
  await finish(page, true);
  await expect(page.locator('.summary .eyebrow')).toHaveText('8 of 8 spaces');
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).profiles[1].records, key),
  ).toEqual(saved.profiles[1].records);
  await page.getByRole('button', { name: 'Profiles', exact: true }).click();
  await page.getByLabel('Name or nickname', { exact: true }).fill('  Maria  ');
  await page.getByRole('button', { name: 'Save name', exact: true }).click();
  await expect(page.locator('.current-profile')).toContainText('Maria');
  await page.getByRole('button', { name: 'Reset records', exact: true }).click();
  await page.getByRole('button', { name: 'Reset records', exact: true }).last().click();
  await page.reload();
  const reset = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(reset.profiles[0]).toEqual(saved.profiles[0]);
  expect(reset.profiles[1]).toEqual({ ...saved.profiles[1], name: 'Maria', records: {} });
});

test('early exit preserves better records and ties for the selected profile, level and tempo', async ({
  page,
}) => {
  await page.goto('./');
  await installClock(page);
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByLabel('Imię nowego dziecka').fill('Maja');
  await page.getByRole('button', { name: 'Dodaj profil' }).click();
  await page.locator('.level-card').nth(3).click();
  await page.locator('.tempo-card').nth(2).click();
  await page.getByLabel('Język', { exact: true }).selectOption('en');
  let best: { score: number; date: string } | undefined;
  for (const [answers, score] of [
    [0, 0],
    [2, 21],
    [1, 10],
    [2, 21],
    [3, 33],
  ]) {
    await start(page, true);
    for (let i = 0; i < answers; i++) {
      await answer(page, true, true);
      await page.clock.runFor(288);
    }
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Back to selection', exact: true }).click();
    await page.getByRole('button', { name: 'End game', exact: true }).click();
    await expect(page.locator('.best-preview')).toContainText(
      String(Math.max(best?.score ?? 0, score)),
    );
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
    expect(saved.profiles[0].records).toEqual({});
    expect(Object.keys(saved.profiles[1].records)).toEqual(['4-cheetah']);
    const record = saved.profiles[1].records['4-cheetah'];
    if (best && score <= best.score) expect(record).toEqual(best);
    else expect(record.score).toBe(score);
    best = record;
  }
  await page.reload();
  await expect(page.locator('.best-preview')).toContainText('33');
  await page.locator('.tempo-card').nth(0).click();
  await expect(page.locator('.best-preview')).toContainText('Yours to discover');
});
