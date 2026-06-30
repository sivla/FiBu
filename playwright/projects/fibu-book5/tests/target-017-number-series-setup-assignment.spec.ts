import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-017-number-series-setup-assignment';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-017-result.json');

type SetupArea = {
  id: string;
  pageId: number;
  titlePattern: RegExp;
  title: string;
  expanders: RegExp[];
  assignments: AssignmentTarget[];
};

type AssignmentTarget = {
  id: string;
  intent: string;
  code: string;
  captions: string[];
  rejectLabel?: RegExp;
};

type FieldCandidate = {
  frameIndex: number;
  controlIndex: number;
  caption: string;
  labelText: string;
  labelRect: Rect;
  control: ControlInfo;
  score: number;
  reasons: string[];
};

type Rect = { x: number; y: number; width: number; height: number };
type ControlInfo = {
  tag: string;
  role: string;
  ariaLabel: string;
  title: string;
  value: string;
  text: string;
  readOnly: boolean;
  disabled: boolean;
  rect: Rect;
};

type AssignmentAttempt = {
  setupArea: string;
  pageId: number;
  fieldIntent: string;
  numberSeries: string;
  status: 'assigned' | 'already-assigned' | 'blocked';
  beforeCandidates: FieldCandidate[];
  afterCandidates: FieldCandidate[];
  reopenCandidates: FieldCandidate[];
  fillAttempted: boolean;
  reason: string;
};

const setupAreas: SetupArea[] = [
  {
    id: 'sales-receivables-setup',
    pageId: 459,
    title: 'Einrichtung Debitoren und Verkauf / Sales & Receivables Setup',
    titlePattern: /Einrichtung Debitoren und Verkauf|Sales & Receivables Setup|Debitoren.*Verkauf/i,
    expanders: [/Mehr anzeigen|Show more/i, /Nummernserie|Nummerierung|Numbering|Number Series/i],
    assignments: [
      { id: 'sales-customer-nos', intent: 'Customer Nos.', code: 'U-CUST', captions: ['Debitorennummern', 'Customer Nos.'] },
      { id: 'sales-order-nos', intent: 'Order Nos.', code: 'U-SO', captions: ['Auftragsnummern', 'Order Nos.'] },
      {
        id: 'sales-invoice-nos',
        intent: 'Invoice Nos.',
        code: 'U-SINV',
        captions: ['Rechnungsnummern', 'Invoice Nos.'],
        rejectLabel: /Gebuchte|Gutschrifts|Zins|Vorauszahlungs|Stornierte|Lieferungs|Ruecksendungs|Rucksendungs/i
      }
    ]
  },
  {
    id: 'purchases-payables-setup',
    pageId: 460,
    title: 'Einrichtung Kreditoren und Einkauf / Purchases & Payables Setup',
    titlePattern: /Einrichtung Kreditoren und Einkauf|Purchases & Payables Setup|Kreditoren.*Einkauf/i,
    expanders: [/Mehr anzeigen|Show more/i, /Nummernserie|Nummerierung|Numbering|Number Series/i],
    assignments: [
      { id: 'purchase-vendor-nos', intent: 'Vendor Nos.', code: 'U-VEND', captions: ['Kreditorennummern', 'Vendor Nos.'] },
      { id: 'purchase-order-nos', intent: 'Order Nos.', code: 'U-PO', captions: ['Bestellungsnummern', 'Bestellnummern', 'Order Nos.'] },
      {
        id: 'purchase-invoice-nos',
        intent: 'Invoice Nos.',
        code: 'U-PINV',
        captions: ['Rechnungsnummern', 'Invoice Nos.'],
        rejectLabel: /Gebuchte|Gutschrifts|Withholding|Lieferanmahnungs|Reg\.|Vorauszahlungs|Stornierte/i
      }
    ]
  },
  {
    id: 'inventory-setup',
    pageId: 461,
    title: 'Lager Einrichtung / Inventory Setup',
    titlePattern: /Lager Einrichtung|Inventory Setup/i,
    expanders: [/Mehr anzeigen|Show more/i, /Nummernserie|Nummerierung|Numbering|Number Series/i],
    assignments: [
      { id: 'inventory-item-nos', intent: 'Item Nos.', code: 'U-ITEM', captions: ['Artikelnummern', 'Artikelnr.', 'Item Nos.'] }
    ]
  }
];

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function codeVisibleInText(text: string, code: string) {
  return new RegExp(`(^|\\s)${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i').test(text);
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function dangerousText(text: string) {
  return /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Preview Posting|Buchungsvorschau|Delete\?|Loeschen\?|Ship and Invoice|Liefern und fakturieren/i.test(
    text
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    finalScreenshotStatus: 'universaarl-foundation-setup-candidate',
    ...metadata
  });
}

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function assertSafeSetupContext(page: Page, setup: SetupArea) {
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) throw new Error(`Unsafe context: ${sanitizeUrl(url)}`);
  const text = await safeText(page);
  if (!setup.titlePattern.test(text)) throw new Error(`${setup.title} is not visible.`);
  if (dangerousText(text)) throw new Error('Posting/preview/delete dialog text is visible.');
}

async function openSetupPage(page: Page, setup: SetupArea) {
  await page.goto(buildPlaythruUrl(setup.pageId).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1300);
  await assertSafeSetupContext(page, setup);
  for (const expander of setup.expanders) {
    await clickSafeButton(page, expander);
  }
  await page.waitForTimeout(500);
  await assertSafeSetupContext(page, setup);
}

async function scrollNumberSeriesIntoView(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const section = scope.getByText(/^Nummernserie$|^Nummerierung$|^Number Series$|^Numbering$/i).last();
    if (await section.isVisible({ timeout: 700 }).catch(() => false)) {
      await section.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => undefined);
      await page.waitForTimeout(500);
      return true;
    }
  }
  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(500);
  return false;
}

async function expandNumberSeriesIfPossible(page: Page) {
  await scrollNumberSeriesIntoView(page);
  for (const scope of [page, ...page.frames()]) {
    for (const locator of [
      scope.getByRole('button', { name: /^Mehr anzeigen$|^Show more$/i }).last(),
      scope.getByText(/^Mehr anzeigen$|^Show more$/i).last()
    ]) {
      if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
        const box = await locator.boundingBox().catch(() => null);
        if (!box || box.y < 250) continue;
        await locator.click({ timeout: 2500 }).catch(() => undefined);
        await page.waitForTimeout(700);
        await scrollNumberSeriesIntoView(page);
        return true;
      }
    }
  }
  return false;
}

async function clickSafeButton(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.getByRole('button', { name }).first();
    if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
      const label = clean((await locator.innerText({ timeout: 500 }).catch(() => '')) || (await locator.getAttribute('title').catch(() => '')) || '');
      if (/Post|Buchen|Preview|Vorschau|Delete|Loeschen|New|Neu/i.test(label) && !/Mehr anzeigen|Show more/i.test(label)) return false;
      await locator.click({ timeout: 2500 }).catch(() => undefined);
      await page.waitForTimeout(600);
      return true;
    }
  }
  return false;
}

async function clickEditMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const candidate of [
      scope
        .locator(
          [
            'button[title*="Änderungen"]',
            'button[title*="Aenderungen"]',
            'button[title*="changes"]',
            'button[title*="Change"]',
            'button[aria-label*="Änderungen"]',
            'button[aria-label*="Aenderungen"]',
            'button[aria-label*="Edit"]',
            'button[title*="Edit"]'
          ].join(',')
        )
        .first(),
      scope.getByRole('button', { name: /^Bearbeiten$|^Edit$/i }).first()
    ]) {
      if ((await candidate.isVisible({ timeout: 600 }).catch(() => false)) && (await candidate.isEnabled({ timeout: 600 }).catch(() => false))) {
        await candidate.click({ timeout: 3000 });
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }
  return false;
}

async function collectFieldCandidates(page: Page, target: AssignmentTarget): Promise<FieldCandidate[]> {
  const all: FieldCandidate[] = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    all.push(...(await collectFieldCandidatesInFrame(frame, frameIndex, target)));
  }
  all.push(...(await collectFieldCandidatesInFrame(page, -1, target)));
  const seen = new Set<string>();
  return all
    .filter((candidate) => {
      const key = `${candidate.frameIndex}:${candidate.controlIndex}:${candidate.caption}:${candidate.control.value}:${candidate.control.ariaLabel}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => right.score - left.score || left.labelRect.y - right.labelRect.y || left.labelRect.x - right.labelRect.x);
}

async function collectFieldCandidatesInFrame(scope: Frame | Page, frameIndex: number, target: AssignmentTarget): Promise<FieldCandidate[]> {
  return scope
    .evaluate(
      ({ captions, frameIndexValue }) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        };
        const matches = (value: string, caption: string) => {
          const escaped = caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\s+/g, '\\s+');
          return new RegExp(`(^|\\b)${escaped}($|\\b)`, 'i').test(value);
        };
        const isGridLabel = (element: HTMLElement) => {
          const role = normalize(element.getAttribute('role')).toLowerCase();
          return Boolean(element.closest('[role="grid"],[role="treegrid"],table,[aria-rowindex]')) || role === 'columnheader';
        };
        const controlSelector = 'input,textarea,select,[role="textbox"],[role="combobox"],[contenteditable="true"]';
        const controls = Array.from(document.querySelectorAll<HTMLElement>(controlSelector))
          .filter(visible)
          .map((element, index) => {
            const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            return {
              element,
              index,
              info: {
                tag: element.tagName,
                role: normalize(element.getAttribute('role')),
                ariaLabel: normalize(element.getAttribute('aria-label')),
                title: normalize(element.getAttribute('title')),
                value: normalize('value' in input ? input.value : ''),
                text: normalize(element.innerText || element.textContent).slice(0, 200),
                readOnly: Boolean('readOnly' in input && input.readOnly) || element.getAttribute('aria-readonly') === 'true',
                disabled: Boolean('disabled' in input && input.disabled) || element.getAttribute('aria-disabled') === 'true',
                rect: rectOf(element)
              }
            };
          });
        const elements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(visible);
        const candidates: any[] = [];
        for (const caption of captions) {
          for (const control of controls) {
            const controlSignal = `${control.info.ariaLabel} ${control.info.title}`;
            if (matches(controlSignal, caption)) {
              candidates.push({
                frameIndex: frameIndexValue,
                controlIndex: control.index,
                caption,
                labelText: controlSignal,
                labelRect: control.info.rect,
                control: control.info,
                score: 95,
                reasons: ['control-aria-or-title-matches-caption']
              });
            }
          }

          for (const element of elements) {
            const labelText = normalize(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title'));
            if (!labelText || labelText.length > 180 || !matches(labelText, caption)) continue;
            const labelRect = rectOf(element);
            const centerY = labelRect.y + labelRect.height / 2;
            const rowControls = controls
              .map((control) => {
                const rect = control.info.rect;
                const controlCenterY = rect.y + rect.height / 2;
                const distance = Math.abs(controlCenterY - centerY) + Math.max(0, rect.x - labelRect.x);
                return { control, distance, sameRow: Math.abs(controlCenterY - centerY) <= 26 && rect.x >= labelRect.x - 10 };
              })
              .filter((entry) => entry.sameRow)
              .sort((left, right) => left.distance - right.distance);
            for (const entry of rowControls.slice(0, 3)) {
              const reasons = ['label-row-control'];
              let score = 70 - Math.round(entry.distance / 20);
              if (!isGridLabel(element)) {
                score += 20;
                reasons.push('not-grid-label');
              } else {
                score -= 40;
                reasons.push('grid-label-penalty');
              }
              if (!entry.control.info.readOnly && !entry.control.info.disabled) {
                score += 10;
                reasons.push('editable-control');
              }
              candidates.push({
                frameIndex: frameIndexValue,
                controlIndex: entry.control.index,
                caption,
                labelText,
                labelRect,
                control: entry.control.info,
                score,
                reasons
              });
            }
          }
        }
        return candidates;
      },
      { captions: target.captions, frameIndexValue: frameIndex }
    )
    .catch(() => [] as FieldCandidate[]);
}

function selectUsableCandidate(target: AssignmentTarget, candidates: FieldCandidate[]) {
  const usable = candidates
    .filter((candidate) => !candidate.control.disabled && !candidate.control.readOnly)
    .filter((candidate) => !target.rejectLabel?.test(candidate.labelText))
    .filter((candidate) => !/SELECT/i.test(candidate.control.tag))
    .sort((left, right) => right.score - left.score || left.control.rect.x - right.control.rect.x || left.control.rect.y - right.control.rect.y);

  if (usable.length === 0) return null;

  const exact = usable.filter((candidate) =>
    target.captions.some((caption) => clean(candidate.labelText).toLowerCase() === clean(caption).toLowerCase())
  );
  const pool = exact.length > 0 ? exact : usable;
  const [first, second] = pool;
  if (!second) return first;
  if (first.score - second.score >= 20) return first;
  if (Math.abs(first.control.rect.y - second.control.rect.y) > 18 && first.control.rect.y < second.control.rect.y) return first;
  return null;
}

async function fillCandidate(page: Page, candidate: FieldCandidate, value: string) {
  const frameOffset =
    candidate.frameIndex === -1
      ? { x: 0, y: 0 }
      : await page
          .frames()
          [candidate.frameIndex].frameElement()
          .then((handle) => handle.boundingBox())
          .then((box) => ({ x: box?.x ?? 0, y: box?.y ?? 0 }))
          .catch(() => ({ x: 0, y: 0 }));
  const point = {
    x: Math.round(frameOffset.x + candidate.control.rect.x + candidate.control.rect.width / 2),
    y: Math.round(frameOffset.y + candidate.control.rect.y + candidate.control.rect.height / 2)
  };
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(250);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 25 });
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(600);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1800);
}

async function captureSetupState(page: Page, setup: SetupArea, prefix: string, step: string, attempts: AssignmentAttempt[] = []) {
  const compact = await compactPageText(page, {
    include: [
      setup.titlePattern,
      /Nummernserie|Nummerierung|Numbering|Number Series|Debitor|Kreditor|Artikel|Customer|Vendor|Item|Order|Invoice|Auftrag|Rechnung|U-/i
    ],
    maxLines: 220,
    maxLineLength: 220
  });
  const diagnostics: Record<string, unknown> = {};
  for (const target of setup.assignments) {
    diagnostics[target.id] = await collectActiveCardControlDiagnostics(page, target.captions, {
      targetText: setup.titlePattern
    });
  }
  await writeText(`${prefix}.txt`, compact);
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.diagnostics.json`), diagnostics);
  await screenshotWithMetadata(page, `${prefix}.png`, {
    page: setup.title,
    pageId: setup.pageId,
    step,
    visibleLearning:
      'Diese Setup-Seite ordnet Nummernserien zu Stammdaten und Belegen zu. Erst eindeutig gemappte Felder duerfen beschrieben werden.',
    importantUi: setup.assignments.map((assignment) => `${assignment.intent} -> ${assignment.code}`),
    internallyProves: [`${setup.title} opened in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`, 'Compact text and control diagnostics were captured.'],
    doesNotProve: ['Legal invoice numbering compliance.', 'Master data creation.', 'Preview posting.', 'Posting.'],
    attempts
  });
}

async function assignOnSetupPage(page: Page, setup: SetupArea): Promise<AssignmentAttempt[]> {
  const attempts: AssignmentAttempt[] = [];
  await openSetupPage(page, setup);
  await captureSetupState(page, setup, `target-017-${setup.id}-010-before`, 'Before number-series assignment.');

  const editModeClicked = await clickEditMode(page);
  await page.waitForTimeout(800);
  await expandNumberSeriesIfPossible(page);
  await captureSetupState(page, setup, `target-017-${setup.id}-020-edit-mode`, `After Edit/Bearbeiten attempt; editModeClicked=${editModeClicked}.`);

  for (const target of setup.assignments) {
    await openSetupPage(page, setup);
    await clickEditMode(page);
    await expandNumberSeriesIfPossible(page);
    const textBeforeTarget = await safeText(page);
    if (codeVisibleInText(textBeforeTarget, target.code)) {
      const beforeCandidates = await collectFieldCandidates(page, target);
      attempts.push({
        setupArea: setup.id,
        pageId: setup.pageId,
        fieldIntent: target.intent,
        numberSeries: target.code,
        status: 'already-assigned',
        beforeCandidates,
        afterCandidates: beforeCandidates,
        reopenCandidates: beforeCandidates,
        fillAttempted: false,
        reason: `${target.intent} already shows ${target.code} on the setup page.`
      });
      continue;
    }
    const beforeCandidates = await collectFieldCandidates(page, target);
    const usable = selectUsableCandidate(target, beforeCandidates);
    if (!usable) {
      attempts.push({
        setupArea: setup.id,
        pageId: setup.pageId,
        fieldIntent: target.intent,
        numberSeries: target.code,
        status: 'blocked',
        beforeCandidates,
        afterCandidates: [],
        reopenCandidates: [],
        fillAttempted: false,
        reason: beforeCandidates.length === 0 ? 'No target field candidate found.' : `Ambiguous/non-editable candidates: ${beforeCandidates.length}.`
      });
      continue;
    }

    if (usable.control.value.toUpperCase() === target.code || usable.control.text.toUpperCase() === target.code) {
      attempts.push({
        setupArea: setup.id,
        pageId: setup.pageId,
        fieldIntent: target.intent,
        numberSeries: target.code,
        status: 'already-assigned',
        beforeCandidates,
        afterCandidates: beforeCandidates,
        reopenCandidates: beforeCandidates,
        fillAttempted: false,
        reason: `${target.intent} already contains ${target.code}.`
      });
      continue;
    }

    await fillCandidate(page, usable, target.code);
    await assertSafeSetupContext(page, setup);
    const afterCandidates = await collectFieldCandidates(page, target);
    const afterText = await safeText(page);
    const afterHasTarget = afterCandidates.some(
      (candidate) => candidate.control.value.toUpperCase() === target.code || candidate.control.text.toUpperCase() === target.code
    ) || codeVisibleInText(afterText, target.code);
    attempts.push({
      setupArea: setup.id,
      pageId: setup.pageId,
      fieldIntent: target.intent,
      numberSeries: target.code,
      status: afterHasTarget ? 'assigned' : 'blocked',
      beforeCandidates,
      afterCandidates,
      reopenCandidates: [],
      fillAttempted: true,
      reason: afterHasTarget ? `${target.intent} shows ${target.code} after value entry.` : `${target.intent} did not show ${target.code} after value entry.`
    });

    await openSetupPage(page, setup);
    await clickEditMode(page);
    await expandNumberSeriesIfPossible(page);
    const lastAttempt = attempts[attempts.length - 1];
    lastAttempt.reopenCandidates = await collectFieldCandidates(page, target);
    const reopenText = await safeText(page);
    const reopenHasTarget = lastAttempt.reopenCandidates.some(
      (candidate) => candidate.control.value.toUpperCase() === target.code || candidate.control.text.toUpperCase() === target.code
    ) || codeVisibleInText(reopenText, target.code);
    if ((lastAttempt.status === 'assigned' || lastAttempt.status === 'already-assigned') && !reopenHasTarget) {
      lastAttempt.status = 'blocked';
      lastAttempt.reason = `${target.intent} did not show ${target.code} after reopen.`;
    }
  }

  await captureSetupState(page, setup, `target-017-${setup.id}-030-after-attempt`, 'After assignment attempts.', attempts);
  await openSetupPage(page, setup);
  await expandNumberSeriesIfPossible(page);
  const finalText = await safeText(page);
  for (const attempt of attempts) {
    if (attempt.status === 'blocked' && codeVisibleInText(finalText, attempt.numberSeries)) {
      attempt.status = 'already-assigned';
      attempt.reason = `${attempt.fieldIntent} is visible with ${attempt.numberSeries} in the final reopen text/screenshot.`;
    }
  }
  await captureSetupState(page, setup, `target-017-${setup.id}-040-after-reopen`, 'After reopening for persistence proof.', attempts);
  return attempts;
}

test('TARGET-017 assigns proven U-* number series to unambiguous setup fields', async ({ page }) => {
  test.setTimeout(360_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const allAttempts: AssignmentAttempt[] = [];
  const blockedBy: string[] = [];
  for (const setup of setupAreas) {
    try {
      allAttempts.push(...(await assignOnSetupPage(page, setup)));
    } catch (error) {
      blockedBy.push(`${setup.id}: ${String(error)}`);
    }
  }

  const assigned = allAttempts.filter((attempt) => attempt.status === 'assigned' || attempt.status === 'already-assigned');
  const blocked = [...allAttempts.filter((attempt) => attempt.status === 'blocked').map((attempt) => `${attempt.setupArea}/${attempt.fieldIntent}: ${attempt.reason}`), ...blockedBy];
  const resultStatus = blocked.length === 0 ? 'observed' : assigned.length > 0 ? 'partial-observed' : 'blocked';
  const selectedNextCase =
    blocked.length === 0 ? 'TARGET-019-POSTING-GROUPS-PREFLIGHT' : 'TARGET-017B-NUMBER-SERIES-SETUP-FIELD-DISCOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-number-series-setup-assignment',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    proved: [
      'Sales/Purchase/Inventory setup assignment pages were opened only in playthru / UNIVERSAARL-DE.',
      ...assigned.map((attempt) => `${attempt.setupArea}: ${attempt.fieldIntent} contains ${attempt.numberSeries} after guarded value entry/reopen.`),
      'No master data, document draft, preview posting or posting was executed.',
      'No number-series line checkbox was changed.'
    ],
    notProved: [
      ...(blocked.length ? ['Not every target setup field could be assigned with the current UI route.'] : []),
      'Legal German invoice numbering compliance is not proven by this technical assignment.',
      'Posting groups, VAT, dimensions, master data and posting readiness are still open.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-017-number-series-setup-assignment/TARGET-017-result.json',
      'playwright/projects/fibu-book5/evidence/target-017-number-series-setup-assignment/*.txt',
      'playwright/projects/fibu-book5/evidence/target-017-number-series-setup-assignment/*.diagnostics.json',
      'playwright/projects/fibu-book5/evidence/target-017-number-series-setup-assignment/*.screenshot.json',
      'playwright/projects/fibu-book5/img/target-017-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-017-number-series-setup-assignment/TARGET-017-result.json',
      ...setupAreas.flatMap((setup) => [
        `playwright/projects/fibu-book5/img/target-017-${setup.id}-010-before.png`,
        `playwright/projects/fibu-book5/img/target-017-${setup.id}-040-after-reopen.png`
      ])
    ],
    attempts: allAttempts,
    blockedBy: blocked,
    warnings: [
      'TARGET-017 assigns only fields with one unambiguous editable candidate.',
      'If a field is hidden behind personalization or an unexpanded FastTab, it remains blocked instead of guessed.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true,
      noNumberSeriesLineCheckboxChange: true,
      setupChanged: assigned.some((attempt) => attempt.status === 'assigned')
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT',
      lastEvidenceSummary: 'TARGET-016M proved all U-* Number Series Lines with Startnr./Endnr. after reopen.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Setup assignment is the direct prerequisite before master data or document setup can use Universaarl numbering.',
      lookaheadReviewed: [
        {
          caseId: selectedNextCase,
          status: blocked.length === 0 ? 'ready-next' : 'needs-ui-discovery-first',
          reason: blocked.length === 0 ? 'Numbering assignment is complete enough to inspect posting groups.' : 'Blocked assignment fields need UI diagnostics before setup can be considered complete.'
        },
        {
          caseId: 'TARGET-018-CUSTOMER-MASTERDATA-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Master data waits for posting groups, VAT and dimensions after numbering.'
        },
        {
          caseId: 'TARGET-020-VAT-SETUP-READINESS',
          status: 'ready-after-current',
          reason: 'VAT setup follows posting group preflight before any document preview.'
        },
        {
          caseId: 'TARGET-021-DIMENSIONS-FOUNDATION',
          status: 'ready-after-current',
          reason: 'Dimensions should be available before rich process evidence.'
        },
        {
          caseId: 'TARGET-022-CORE-MASTERDATA-PLAN',
          status: 'needs-setup-first',
          reason: 'Customers, vendors and items should use final setup mappings.'
        }
      ],
      queueChangesMade: [`Selected ${selectedNextCase} based on TARGET-017 assignment result.`],
      selectedNextCase,
      whySelectedNextCaseIsBest:
        blocked.length === 0
          ? 'Number-series assignment is complete, so the next setup dependency is posting groups.'
          : 'The safest next step is field discovery for hidden or ambiguous setup fields, not master data.',
      risksBeforeNextCase: [
        'Do not create customers/vendors/items until numbering and posting setup are known.',
        'Do not claim legal numbering compliance from this technical setup alone.'
      ],
      requiredPreparation:
        blocked.length === 0
          ? ['Read TARGET-017 screenshots before posting group work.']
          : ['Use Page Inspection, Personalize or field diagnostics for only the blocked setup fields.']
    },
    requiresReview: blocked.length > 0,
    safeToFinalizeState: assigned.length > 0,
    statePatch: {},
    reason:
      blocked.length === 0
        ? 'TARGET-017 assigned all planned Universaarl number-series setup fields with reopen proof.'
        : `TARGET-017 assigned ${assigned.length}/${allAttempts.length} planned setup fields; remaining fields are blocked for diagnostics.`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-017 Number Series Setup Assignment',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine Stammdaten.',
      '- Kein Belegentwurf.',
      '- Keine Preview und keine Buchung.',
      '- Keine Checkbox-Aenderung an Nummernserienzeilen.',
      '- Keine rechtliche Aussage zur deutschen Rechnungsnummern-Compliance.',
      ''
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
  expect(assigned.length, 'TARGET-017 should assign at least one setup field or prove it is already assigned.').toBeGreaterThan(0);
});
