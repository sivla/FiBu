import { expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const rootImgDir = path.resolve('img');

function inferProjectNameFromCallStack() {
  const stack = new Error().stack ?? '';
  const match = stack.match(/playwright[\\/]+projects[\\/]+([^\\/]+)[\\/]+tests[\\/]+/i);
  return match?.[1];
}

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
  const projectName = options.projectName ?? inferProjectNameFromCallStack();
  const imgDir = projectName ? path.resolve('playwright/projects', projectName, 'img') : rootImgDir;
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

  if (projectName && options.testId) {
    const evidenceDir = path.resolve('playwright/projects', projectName, 'evidence', options.testId);
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
  const normalized = content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/(?:\n[ \t]*)+$/g, '')
    .concat('\n');
  await fs.writeFile(filePath, normalized, 'utf8');
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
    if (!/Tour starten|Start tour|About|teaching tip|Hilfe anzeigen/i.test(text)) {
      continue;
    }

    const closeByRole = frame
      .getByRole('button', { name: /Schließen|Schliessen|Close|Dismiss|Discard|Verwerfen|Verstanden|Got it|×/i })
      .last();
    if (await closeByRole.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeByRole.click();
      await page.waitForTimeout(500);
      continue;
    }

    const closeByAttributes = frame
      .locator(
        [
          'button[aria-label*="Close" i]',
          'button[aria-label*="Schließ" i]',
          'button[aria-label*="Schliess" i]',
          'button[title*="Close" i]',
          'button[title*="Schließ" i]',
          'button[title*="Schliess" i]'
        ].join(', ')
      )
      .last();
    if (await closeByAttributes.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeByAttributes.click();
      await page.waitForTimeout(500);
      continue;
    }

    const clicked = await frame
      .evaluate(() => {
        const textPattern = /Tour starten|Start tour|About|Hilfe anzeigen/i;
        const allElements = [...document.querySelectorAll<HTMLElement>('*')];
        const teachingText = allElements
          .filter((element) => textPattern.test(element.innerText || ''))
          .sort((left, right) => {
            const leftRect = left.getBoundingClientRect();
            const rightRect = right.getBoundingClientRect();
            return leftRect.width * leftRect.height - rightRect.width * rightRect.height;
          })[0];
        if (!teachingText) return false;

        let container: HTMLElement | null = teachingText;
        for (let depth = 0; depth < 8 && container; depth += 1) {
          const rect = container.getBoundingClientRect();
          if (rect.width >= 200 && rect.width <= 700 && rect.height >= 80 && rect.height <= 500) {
            const closeTarget = document.elementFromPoint(rect.right - 32, rect.top + 32) as HTMLElement | null;
            const closeButton = closeTarget?.closest<HTMLElement>('button,[role="button"]') ?? closeTarget;
            if (closeButton) {
              closeButton.click();
              return true;
            }
          }

          const buttons = [...container.querySelectorAll<HTMLElement>('button,[role="button"]')].filter((button) => {
            const rect = button.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
          const closeButton =
            buttons.find((button) => /Schließen|Schliessen|Close|Dismiss|Discard|Verwerfen|Verstanden|Got it|×/i.test(button.innerText || button.getAttribute('aria-label') || '')) ??
            buttons.at(-1);

          if (closeButton) {
            closeButton.click();
            return true;
          }

          container = container.parentElement;
        }

        return false;
      })
      .catch(() => false);
    if (clicked) {
      await page.waitForTimeout(500);
    }
  }
}

export async function hideFactBoxPane(page: Page) {
  const scopes = [page, ...page.frames()];

  for (const scope of scopes) {
    const toggle = scope
      .getByRole('menuitemcheckbox', { name: /Infobox umschalten|Toggle FactBox|FactBox/i })
      .first();
    if (!(await toggle.isVisible({ timeout: 500 }).catch(() => false))) {
      continue;
    }

    const checked = await toggle.getAttribute('aria-checked').catch(() => null);
    if (checked !== 'false') {
      await toggle.click();
      await page.waitForTimeout(1000);
    }

    return true;
  }

  return false;
}
