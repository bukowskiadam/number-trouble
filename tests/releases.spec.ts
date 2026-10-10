import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const history = JSON.parse(
  readFileSync(new URL('../src/release-notes.json', import.meta.url), 'utf8'),
);
const latest = history[0];
const previousVersion = history[1]?.version ?? `${version}-rc.1`;
const key = 'number-trouble-profiles-v1';
async function setPrevious(page: Page, previous: unknown) {
  await page.evaluate(
    ({ key, previous }) => {
      const store = JSON.parse(localStorage.getItem(key)!);
      store.lastLaunchedVersion = previous;
      localStorage.setItem(key, JSON.stringify(store));
    },
    { key, previous },
  );
  await page.reload();
}

test('history in all menu views, both languages, keyboard, phone and offline', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await expect(page.getByText('Gotowe do gry offline', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  for (const view of ['Zagraj', 'Profile', 'Rekordy']) {
    await page.getByRole('button', { name: view, exact: true }).click();
    const button = page.getByRole('button', {
      name: `Wersja v${version} Historia zmian`,
      exact: true,
    });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Historia zmian', exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Pierwsza przygoda z liczbami');
    await expect(page.getByRole('dialog')).toContainText(latest.pl.title);
    await expect(page.getByRole('dialog')).not.toContainText('Unreleased');
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
  }
  await page.getByLabel('Język', { exact: true }).selectOption('en');
  await page.setViewportSize({ width: 320, height: 568 });
  await page
    .getByRole('button', { name: `Version v${version} Release history`, exact: true })
    .click();
  await expect(page.getByRole('dialog', { name: 'Release history', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(latest.en.title);
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/release-history-phone.png', fullPage: true });
  await page.getByRole('button', { name: 'Back to counting', exact: true }).click();
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole('button', { name: `Version v${version} Release history`, exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText(latest.en.title);
  await page.keyboard.press('Escape');
  await page.getByLabel('Language', { exact: true }).selectOption('pl');
  await page
    .getByRole('button', { name: `Wersja v${version} Historia zmian`, exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Pierwsza przygoda z liczbami');
  await expect(page.getByRole('dialog')).toContainText(latest.pl.title);
});

test('upgrade notice appears once offline and preserves profiles, settings and records', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await expect(page.getByText('Gotowe do gry offline', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByLabel('Imię nowego dziecka').fill('Maja');
  await page.getByRole('button', { name: 'Dodaj profil' }).click();
  await page.locator('.level-card').nth(3).click();
  await page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!);
    store.profiles.find((p: { id: string }) => p.id === store.activeId).records['4-turtle'] = {
      score: 43,
      date: '2026-10-10T12:00:00Z',
    };
    localStorage.setItem(key, JSON.stringify(store));
  }, key);
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  await context.setOffline(true);
  await setPrevious(page, previousVersion);
  await expect(
    page.getByRole('dialog', { name: 'Co nowego w Number Trouble?', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(`v${version}`);
  await expect(page.getByRole('dialog')).toContainText(latest.pl.title);
  await page.getByRole('button', { name: 'Wracam do liczenia', exact: true }).click();
  await expect(page.locator('.best-preview')).toContainText('43');
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(after.profiles).toEqual(before.profiles);
  expect(after.activeId).toBe(before.activeId);
  expect(after.lastLaunchedVersion).toBe(version);
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Język', { exact: true }).selectOption('en');
  await setPrevious(page, previousVersion);
  await expect(
    page.getByRole('dialog', { name: 'What’s new in Number Trouble?', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(latest.en.title);
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Profiles', exact: true }).click();
  await page
    .getByRole('button', { name: /Odkrywca|Odkrywco|Explorer/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('legacy, invalid and newer launch versions do not show an upgrade notice', async ({
  page,
}) => {
  await page.goto('./');
  for (const previous of [null, 'broken', '999.0.0', version]) {
    await setPrevious(page, previous);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).lastLaunchedVersion, key),
    ).toBe(version);
  }
});
