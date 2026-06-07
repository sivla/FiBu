import { expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const imgDir = path.resolve('img');

type ScreenshotStatus = 'labor' | 'candidate' | 'final' | 'rejected';

type ScreenshotOptions = {
  projectName?: string;
  testId?: string;
  status?: ScreenshotStatus;
  purpose?: string;
  expectedPageText?: RegExp[];
  knownLimitations?: string[];
  bookUse?: 'navigation' | 'process-proof' | 'field-proof' | 'evidence' | 'do-not-use';
};

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

export async function screenshot(page: Page, fileName: string, options: ScreenshotOptions = {}) {
  const pageTextEvidence = options.expectedPageText?.length ? await pageText(page) : '';
  for (const expected of options.expectedPageText ?? []) {
    expect(pageTextEvidence, `Screenshot-Kontext ${fileName} muss ${expected} im BC-Seitentext enthalten.`).toMatch(expected);
  }

  await fs.mkdir(imgDir, { recursive: true });
  const imagePath = path.join(imgDir, fileName);
  await page.screenshot({
    path: imagePath,
    fullPage: false
  });

  if (options.projectName && options.testId) {
    const evidenceDir = path.resolve('playwright/projects', options.projectName, 'evidence', options.testId);
    await fs.mkdir(evidenceDir, { recursive: true });
    await fs.writeFile(
      path.join(evidenceDir, fileName.replace(/\.png$/i, '.screenshot.json')),
      JSON.stringify(
        {
          fileName,
          imagePath,
          status: options.status ?? 'labor',
          bookUse: options.bookUse ?? 'evidence',
          purpose: options.purpose ?? '',
          expectedPageText: (options.expectedPageText ?? []).map((entry) => entry.source),
          knownLimitations: options.knownLimitations ?? []
        },
        null,
        2
      ),
      'utf8'
    );
  }
}

export async function waitForBusinessCentralShell(page: Page) {
  await expect(page.getByRole('button', { name: /Suchen|Search/i })).toBeVisible({ timeout: 120_000 });
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
  const scopes = [page, ...page.frames()];

  for (const scope of scopes) {
    const bodyText = await scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (label.test(bodyText)) {
      const matches = scope.getByText(label);
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
  const scopes = [page, ...page.frames()];

  for (const scope of scopes) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name }).first();
      if (await action.isVisible({ timeout: 1000 }).catch(() => false)) {
        await action.click();
        if (role === 'menuitem') {
          await page.keyboard.press('Enter');
        }
        await page.waitForTimeout(3000);
        return;
      }
    }
  }

  throw new Error(`Keine Aktion ${name} gefunden.`);
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
