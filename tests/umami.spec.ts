import { test, expect, type Page } from '@playwright/test';
import type { UmamiRequest } from '../src/analytics/umami';

const websiteId = '00000000-0000-4000-8000-000000000001';
const database = `number-trouble-umami-${websiteId}`;
const endpoint = 'https://gateway.umami.is/api/send';

test.skip(process.env.UMAMI_TEST !== '1', 'Run with npm run test:umami (isolated Website ID).');

async function entries(page: Page) {
  return page.evaluate(
    async (database) =>
      new Promise<{ id: number; queuedAt: number; request: UmamiRequest }[]>((resolve, reject) => {
        const open = indexedDB.open(database, 1);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('events');
          const request = tx.objectStore('events').getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
          tx.oncomplete = () => db.close();
        };
        open.onerror = () => reject(open.error);
      }),
    database,
  );
}

test('sends tagged pageviews and events without any external script or duplicate automatic pageview', async ({
  page,
  context,
}) => {
  const requests: UmamiRequest[] = [];
  await context.route(endpoint, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: { cache: 'test' } });
  });
  await page.goto('./?private=do-not-send#private-fragment');
  await expect.poll(() => requests.length).toBeGreaterThanOrEqual(4);
  expect(
    requests.every(
      (entry) => entry.payload.website === websiteId && entry.payload.tag === 'number-trouble',
    ),
  ).toBe(true);
  expect(requests.filter((entry) => !entry.payload.name)).toHaveLength(1);
  expect(requests.find((entry) => entry.payload.name === 'app_opened')?.payload.data?.app).toBe(
    'number-trouble',
  );
  expect(JSON.stringify(requests)).not.toContain('private=');
  expect(JSON.stringify(requests)).not.toContain('private-fragment');
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect
    .poll(() => requests.filter((entry) => !entry.payload.name).map((entry) => entry.payload.url))
    .toEqual(['/number-trouble/', '/number-trouble/profiles']);
  expect(await page.locator('script[src*="umami"]').count()).toBe(0);
  await expect.poll(async () => (await entries(page)).length).toBe(0);
});

test('persists offline events across reload and drains them after reconnect with their original time', async ({
  page,
  context,
}) => {
  const received: UmamiRequest[] = [];
  await context.route(endpoint, async (route) => {
    received.push(route.request().postDataJSON());
    await route.fulfill({ json: { cache: 'test' } });
  });
  await page.goto('./');
  await expect(page.getByText('Gotowe do gry offline', { exact: true })).toBeVisible();
  await expect.poll(async () => (await entries(page)).length).toBe(0);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByLabel('Imię nowego dziecka').fill('Never send this child name');
  await page.getByRole('button', { name: 'Dodaj profil', exact: true }).click();
  await expect
    .poll(async () =>
      (await entries(page)).some((entry) => entry.request.payload.name === 'profile_changed'),
    )
    .toBe(true);
  const saved = await entries(page);
  const created = saved.find((entry) => entry.request.payload.name === 'profile_changed')!;
  expect(JSON.stringify(saved)).not.toContain('Never send this child name');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Zaczynamy!', exact: true })).toBeVisible();
  expect((await entries(page)).some((entry) => entry.id === created.id)).toBe(true);
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(async () => (await entries(page)).length).toBe(0);
  const delivered = received.filter((entry) => entry.payload.name === 'profile_changed');
  expect(delivered).toEqual([created.request]);
});

test('retains rejected sends and shares one queue sender between tabs', async ({
  page,
  context,
}) => {
  let fail = true;
  const delivered: UmamiRequest[] = [];
  await context.route(endpoint, async (route) => {
    if (fail) {
      await route.fulfill({ status: 429, json: {} });
      return;
    }
    delivered.push(route.request().postDataJSON());
    await new Promise((resolve) => setTimeout(resolve, 30));
    await route.fulfill({ json: { cache: 'test' } });
  });
  await page.goto('./');
  await expect.poll(async () => (await entries(page)).length).toBeGreaterThanOrEqual(4);
  const second = await context.newPage();
  await second.goto('./');
  await expect
    .poll(
      async () =>
        (await entries(page)).filter((entry) => entry.request.payload.name === 'app_opened').length,
    )
    .toBe(2);
  fail = false;
  await Promise.all(
    [page, second].map((tab) => tab.evaluate(() => window.dispatchEvent(new Event('online')))),
  );
  await expect.poll(async () => (await entries(page)).length).toBe(0);
  expect(delivered.filter((entry) => entry.payload.name === 'app_opened')).toHaveLength(2);
  await second.close();
});

test('falls back to memory when IndexedDB is blocked and keeps the game usable', async ({
  page,
  context,
}) => {
  const received: UmamiRequest[] = [];
  await context.route(endpoint, async (route) => {
    received.push(route.request().postDataJSON());
    await route.fulfill({ json: {} });
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new Error('Storage denied');
      },
    });
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Zaczynamy!', exact: true }).click();
  await page.getByRole('button', { name: 'Jasne, gramy!', exact: true }).click();
  await expect(page.getByTestId('active-block')).toBeVisible();
  await expect
    .poll(() => received.some((entry) => entry.payload.name === 'game_started'))
    .toBe(true);
});

test('bounds the persistent backlog and removes expired entries', async ({ page, context }) => {
  await context.route(endpoint, (route) => route.fulfill({ json: {} }));
  await page.goto('./');
  await expect.poll(async () => (await entries(page)).length).toBe(0);
  await context.setOffline(true);
  await page.evaluate(
    async (database) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open(database, 1);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('events', 'readwrite');
          const store = tx.objectStore('events');
          store.clear();
          for (let i = 0; i < 1005; i++) {
            store.add({
              queuedAt: Date.now(),
              request: { type: 'event', payload: { name: 'test', data: { sequence: i } } },
            });
          }
          store.add({
            queuedAt: Date.now() - 8 * 86400000,
            request: { type: 'event', payload: { name: 'expired' } },
          });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => reject(tx.error);
        };
        open.onerror = () => reject(open.error);
      }),
    database,
  );
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect.poll(async () => (await entries(page)).length).toBe(1000);
  const saved = await entries(page);
  expect(saved.some((entry) => entry.request.payload.name === 'expired')).toBe(false);
  expect(saved.some((entry) => entry.request.payload.data?.sequence === 0)).toBe(false);
  expect(saved.at(-1)?.request.payload.url).toBe('/number-trouble/profiles');
});
