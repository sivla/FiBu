import { expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const imgDir = path.resolve('img');

export function requireBcUrl(envPrefix?: string) {
  const prefixedKey = envPrefix ? `${envPrefix}_BC_URL` : undefined;
  const bcUrl = (prefixedKey ? process.env[prefixedKey] : undefined) ?? process.env.BC_URL;
  if (!bcUrl) {
    const expected = prefixedKey ? `${prefixedKey} oder BC_URL` : 'BC_URL';
    throw new Error(`${expected} fehlt. Lege eine .env mit Business-Central-URL an.`);
  }

  return bcUrl;
}

export function bcPageUrl(pageId: number, envPrefix?: string) {
  const url = new URL(requireBcUrl(envPrefix));
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

export async function screenshot(page: Page, fileName: string) {
  await fs.mkdir(imgDir, { recursive: true });
  await page.screenshot({
    path: path.join(imgDir, fileName),
    fullPage: false
  });
}

export async function waitForBusinessCentralShell(page: Page) {
  await expect(page.getByRole('button', { name: /Suchen|Search/i })).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(10_000);
}

export async function searchFor(page: Page, term: string) {
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Suchen|Search/i }).click();
  await page.waitForTimeout(500);
  await page.keyboard.type(term);
  await page.waitForTimeout(2500);
}

type OpenSearchResultOptions = {
  occurrence?: number;
  requireUnique?: boolean;
};

export async function openSearchResult(page: Page, label: RegExp, options: OpenSearchResultOptions = {}) {
  const occurrence = options.occurrence ?? 0;

  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (label.test(bodyText)) {
      const matches = frame.getByText(label);
      const count = await matches.count().catch(() => 0);

      if (options.requireUnique && count !== 1) {
        throw new Error(`Tell-Me Treffer ${label} ist nicht eindeutig. Treffer: ${count}. Trefferindex explizit setzen.`);
      }

      if (count <= occurrence) {
        throw new Error(`Tell-Me Treffer ${label} hat nur ${count} Treffer. Gewünscht war Trefferindex ${occurrence}.`);
      }

      await matches.nth(occurrence).click();
      await page.waitForTimeout(5000);
      return;
    }
  }

  throw new Error(`Tell-Me Treffer ${label} wurde nicht gefunden. Kein Enter-Fallback, weil BC-Suche mehrdeutig ist.`);
}

export async function openSecondSearchBlockResult(page: Page) {
  await page.mouse.click(520, 320);
  await page.waitForTimeout(5000);
}

export async function pageText(page: Page) {
  const texts = await Promise.all(
    page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''))
  );

  return texts.join('\n');
}

export async function visibleButtonNames(page: Page) {
  const names = new Set<string>();
  const scopes = [page, ...page.frames()];

  for (const scope of scopes) {
    const buttons = scope.getByRole('button');
    const count = await buttons.count().catch(() => 0);

    for (let index = 0; index < count; index += 1) {
      const name = await buttons.nth(index).innerText({ timeout: 500 }).catch(() => '');
      const normalized = name.replace(/\s+/g, ' ').trim();
      if (normalized) {
        names.add(normalized);
      }
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}

export async function writeEvidenceText(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

export async function clickInFrameContaining(page: Page, frameText: RegExp, targetText: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!frameText.test(bodyText)) {
      continue;
    }

    await frame.getByText(targetText).first().click();
    await page.waitForTimeout(5000);
    return;
  }

  throw new Error(`Kein BC-Frame mit Text ${frameText} gefunden.`);
}

export async function clickButtonInAnyFrame(page: Page, name: RegExp) {
  const pageButton = page.getByRole('button', { name }).first();
  if (await pageButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await pageButton.click();
    await page.waitForTimeout(3000);
    return;
  }

  for (const frame of page.frames()) {
    const button = frame.getByRole('button', { name }).first();
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      await button.click();
      await page.waitForTimeout(3000);
      return;
    }
  }

  throw new Error(`Kein Button ${name} gefunden.`);
}

export async function findFrameText(page: Page, frameText: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (frameText.test(bodyText)) {
      return { frame, bodyText };
    }
  }

  throw new Error(`Kein BC-Frame mit Text ${frameText} gefunden.`);
}

export async function dismissTours(page: Page) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 500 }).catch(() => '');
    if (!/Tour starten|Start tour|About/i.test(text)) {
      continue;
    }

    await frame.getByRole('button', { name: /Schließen|Close|×/i }).click({ timeout: 1000 }).catch(() => undefined);
  }
}
