import { expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const imgDir = path.resolve('img');

export function requireBcUrl() {
  const bcUrl = process.env.BC_URL;
  if (!bcUrl) {
    throw new Error('BC_URL fehlt. Lege eine .env mit BC_URL=https://businesscentral.dynamics.com/... an.');
  }

  return bcUrl;
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

export async function openSearchResult(page: Page, label: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (label.test(bodyText)) {
      await frame.getByText(label).first().click();
      await page.waitForTimeout(5000);
      return;
    }
  }

  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
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
