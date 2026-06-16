import { expect, type Page } from '@playwright/test';

export function requireBcUrl() {
  const bcUrl = process.env.BC_URL;
  if (!bcUrl) {
    throw new Error('BC_URL fehlt. Fuer Live-BC-Tests eine .env mit BC_URL anlegen.');
  }
  return bcUrl;
}

export function bcPageUrl(pageId: number) {
  const url = new URL(requireBcUrl());
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

export async function pageText(page: Page) {
  const texts = await Promise.all(
    page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''))
  );
  return texts.join('\n');
}

export async function compactPageText(page: Page, options: { include?: RegExp[]; maxLines?: number } = {}) {
  const include = options.include ?? [];
  const seen = new Set<string>();
  const lines = (await pageText(page))
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => (include.length ? include.some((pattern) => pattern.test(line)) : true))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });
  return lines.slice(0, options.maxLines ?? 80).join('\n');
}

export async function waitForBusinessCentralShell(page: Page) {
  await expect(page.getByRole('button', { name: /Suchen|Search/i })).toBeVisible({ timeout: 120_000 });
  await expect
    .poll(async () => pageText(page), { timeout: 120_000, intervals: [500, 1000, 2500] })
    .toMatch(/Business Central|Tell me|Was m.chten Sie tun|Search|Suchen/i);
}

export async function searchFor(page: Page, term: string) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.getByRole('button', { name: /Suchen|Search/i }).click();
  await page.waitForTimeout(500);
  const scopes = [page, ...page.frames()];

  for (const scope of scopes) {
    const textbox = scope
      .getByRole('textbox', { name: /Was m.chten Sie tun|Tell me|Search|Suchen/i })
      .first();
    if (await textbox.isVisible({ timeout: 500 }).catch(() => false)) {
      await textbox.fill(term);
      await page.waitForTimeout(1500);
      return;
    }
  }

  throw new Error('BC-Suchfeld nicht gefunden.');
}
