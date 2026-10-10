import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const svg = await readFile('public/icon.svg', 'utf8');
for (const [size, maskable] of [
  [192, false],
  [512, false],
  [512, true],
]) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>body{margin:0;background:#2767ac;display:grid;place-items:center;width:100vw;height:100vh}svg{width:${maskable ? '78' : '100'}%;height:auto}</style>${svg}`,
  );
  await page.screenshot({ path: `public/icon-${maskable ? 'maskable-' : ''}${size}.png` });
  await page.close();
}
await browser.close();
