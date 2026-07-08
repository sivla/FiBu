import type { Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

export type BcVisualStateClassification =
  | 'target-page-open'
  | 'side-pane-open'
  | 'search-overlay-open'
  | 'dialog-open'
  | 'role-center-background'
  | 'list-page-open'
  | 'card-page-open'
  | 'unknown';

export type BcVisualStateSignals = {
  targetTextVisible: boolean;
  sidePaneVisible: boolean;
  searchOverlayVisible: boolean;
  dialogVisible: boolean;
  roleCenterVisible: boolean;
  listSurfaceVisible: boolean;
  cardSurfaceVisible: boolean;
};

export type BcVisualStateSnapshot = {
  url: string;
  pageTitle: string;
  textExcerpt: string;
  focusedElement: {
    tagName: string;
    role: string;
    ariaLabel: string;
    text: string;
    value: string;
  } | null;
  signals: BcVisualStateSignals;
  classification: BcVisualStateClassification;
  allClassifications: BcVisualStateClassification[];
  notes: string[];
};

type BcVisualStateOptions = {
  screenshotPath?: string;
  expectedPageText?: RegExp[];
  purpose?: string;
};

const SEARCH_OVERLAY_RE =
  /Was m.chten Sie tun|Wie m.chten Sie weiter verfahren|Tell me|Seiten und Aufgaben|Pages and Tasks|Zu .Seiten und Aufgaben. wechseln/i;
const ROLE_CENTER_RE = /Role Center|Rollencenter|Startseite|Home|Meine Einstellungen|My Settings/i;
const CARD_SURFACE_RE = /Allgemein|General|Fakturierung|Invoicing|Zahlungen|Payments|FastTab|Mehr anzeigen|Show more/i;
const LIST_SURFACE_RE = /Filter|Filtern|Ansicht|View|Suchen|Search|Zeilen|Lines|Neu|New/i;
const SIDE_PANE_HINT_RE = /Schliessen|Close|In neuem Fenster|Open in new window|Anheften|Pin|Nicht anheften|Unpin/i;

function compactText(text: string, maxLength = 2500) {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, maxLength);
}

export function classifyBcVisualState(signals: BcVisualStateSignals): {
  classification: BcVisualStateClassification;
  allClassifications: BcVisualStateClassification[];
  notes: string[];
} {
  const allClassifications: BcVisualStateClassification[] = [];
  const notes: string[] = [];

  if (signals.searchOverlayVisible) allClassifications.push('search-overlay-open');
  if (signals.dialogVisible) allClassifications.push('dialog-open');
  if (signals.sidePaneVisible) allClassifications.push('side-pane-open');
  if (signals.cardSurfaceVisible) allClassifications.push('card-page-open');
  if (signals.listSurfaceVisible) allClassifications.push('list-page-open');
  if (signals.targetTextVisible) allClassifications.push('target-page-open');
  if (signals.roleCenterVisible) allClassifications.push('role-center-background');

  if (signals.sidePaneVisible && signals.roleCenterVisible) {
    notes.push('Foreground side pane is visible over a Role Center background; do not reject the target page solely because Role Center text is also present.');
  }
  if (signals.searchOverlayVisible) {
    notes.push('Search/Tell-Me overlay is visible; navigation is not complete unless this overlay is the intended evidence target.');
  }
  if (signals.dialogVisible && !signals.searchOverlayVisible) {
    notes.push('Dialog/modal is visible; classify the foreground dialog before making page claims.');
  }

  const classification =
    (signals.searchOverlayVisible && 'search-overlay-open') ||
    (signals.dialogVisible && !signals.sidePaneVisible && 'dialog-open') ||
    (signals.sidePaneVisible && 'side-pane-open') ||
    (signals.cardSurfaceVisible && 'card-page-open') ||
    (signals.listSurfaceVisible && 'list-page-open') ||
    (signals.targetTextVisible && 'target-page-open') ||
    (signals.roleCenterVisible && 'role-center-background') ||
    'unknown';

  if (!allClassifications.length) allClassifications.push('unknown');

  return {
    classification,
    allClassifications: [...new Set(allClassifications)],
    notes
  };
}

async function visibleText(page: Page) {
  const texts = await Promise.all(
    page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''))
  );
  return texts.join('\n');
}

async function firstVisibleCount(page: Page, selector: string) {
  let count = 0;
  for (const frame of page.frames()) {
    const candidates = frame.locator(selector);
    const frameCount = await candidates.count().catch(() => 0);
    for (let index = 0; index < Math.min(frameCount, 10); index += 1) {
      if (await candidates.nth(index).isVisible({ timeout: 100 }).catch(() => false)) count += 1;
    }
  }
  return count;
}

export async function captureBcVisualState(page: Page, options: BcVisualStateOptions = {}): Promise<BcVisualStateSnapshot> {
  const rawText = await visibleText(page);
  const textExcerpt = compactText(rawText);
  const expectedPageText = options.expectedPageText ?? [];
  const targetTextVisible = expectedPageText.length > 0 && expectedPageText.some((pattern) => pattern.test(rawText));
  const dialogCount = await firstVisibleCount(page, '[role="dialog"], [aria-modal="true"], .ms-Dialog-main, .modal-dialog');
  const sidePaneCount = await firstVisibleCount(
    page,
    '[role="complementary"], aside, [data-is-focusable="true"][aria-label*="pane" i], [aria-label*="FactBox" i], [aria-label*="Infobox" i]'
  );
  const listCount = await firstVisibleCount(page, '[role="grid"], [role="table"], table');
  const focusedElement = await page
    .evaluate(() => {
      const element = document.activeElement as HTMLInputElement | HTMLElement | null;
      if (!element) return null;
      return {
        tagName: element.tagName,
        role: element.getAttribute('role') ?? '',
        ariaLabel: element.getAttribute('aria-label') ?? '',
        text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 180),
        value: 'value' in element ? String((element as HTMLInputElement).value ?? '').slice(0, 180) : ''
      };
    })
    .catch(() => null);

  const signals: BcVisualStateSignals = {
    targetTextVisible,
    sidePaneVisible:
      sidePaneCount > 0 ||
      (targetTextVisible && ROLE_CENTER_RE.test(rawText) && SIDE_PANE_HINT_RE.test(rawText)) ||
      (targetTextVisible && ROLE_CENTER_RE.test(rawText) && dialogCount > 0 && !SEARCH_OVERLAY_RE.test(rawText)),
    searchOverlayVisible: SEARCH_OVERLAY_RE.test(rawText),
    dialogVisible: dialogCount > 0,
    roleCenterVisible: ROLE_CENTER_RE.test(rawText),
    listSurfaceVisible: listCount > 0 || LIST_SURFACE_RE.test(rawText),
    cardSurfaceVisible: CARD_SURFACE_RE.test(rawText)
  };
  const classified = classifyBcVisualState(signals);
  const snapshot: BcVisualStateSnapshot = {
    url: page.url(),
    pageTitle: await page.title().catch(() => ''),
    textExcerpt,
    focusedElement,
    signals,
    classification: classified.classification,
    allClassifications: classified.allClassifications,
    notes: [
      ...(options.purpose ? [`Purpose: ${options.purpose}`] : []),
      ...(options.screenshotPath ? [`Screenshot: ${options.screenshotPath}`] : []),
      ...classified.notes
    ]
  };

  return snapshot;
}

export async function writeBcVisualState(filePath: string, snapshot: BcVisualStateSnapshot) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf8');
}
