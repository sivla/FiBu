import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-024B-GLOBAL-DIMENSION-ASSIGNMENT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-024b-global-dimension-assignment';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-024B-result.json');

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
type AssignmentTarget = {
  id: 'global-dimension-1' | 'global-dimension-2';
  intent: string;
  code: string;
  captions: string[];
};
type AssignmentAttempt = {
  id: string;
  intent: string;
  code: string;
  status: 'already-assigned' | 'assigned' | 'blocked';
  fillAttempted: boolean;
  beforeCandidates: FieldCandidate[];
  afterCandidates: FieldCandidate[];
  reopenCandidates: FieldCandidate[];
  reason: string;
};

const targets: AssignmentTarget[] = [
  {
    id: 'global-dimension-1',
    intent: 'Global Dimension Code 1',
    code: 'PRODUCTLINE',
    captions: [
      'Globaler Dimensionscode 1',
      'Global Dimension Code 1',
      'Global Dimension 1 Code',
      'Neuer globaler Dimensionscode 1',
      'New Global Dimension Code 1',
      'Neuer globaler Dimensionscode 1 Code'
    ]
  },
  {
    id: 'global-dimension-2',
    intent: 'Global Dimension Code 2',
    code: 'COSTCENTER',
    captions: [
      'Globaler Dimensionscode 2',
      'Global Dimension Code 2',
      'Global Dimension 2 Code',
      'Neuer globaler Dimensionscode 2',
      'New Global Dimension Code 2',
      'Neuer globaler Dimensionscode 2 Code'
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

function literalPattern(value: string) {
  return new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function dangerousText(text: string) {
  return /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Preview Posting|Buchungsvorschau|Delete\?|Loeschen\?|Ship and Invoice|Liefern und fakturieren/i.test(
    text
  );
}

function globalDimensionActionText(text: string) {
  return /Globale Dimensionen andern|Globale Dimensionen ändern|Change Global Dimensions|Global Dimensions/i.test(text);
}

function isEvidenceNoise(line: string) {
  return /trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer|allowedEndpoints|allowedResources|clientId|authority:|parentPageOrigin|upn:|requestExecutorSettings|originAuthorityValidator|O365SuiteServiceProxy|login\.microsoftonline\.com|graph\.microsoft\.com|officeapps\.live\.com|officeshell/i.test(
    line
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

async function safeText(page: Page) {
  return clean(await pageText(page));
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

async function assertSafeGeneralLedgerSetup(page: Page) {
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) {
    throw new Error(`Unsafe context: ${sanitizeUrl(url)}`);
  }
  const text = await safeText(page);
  if (!/Finanzbuchhaltung Einrichtung|General Ledger Setup|Sachbuchhaltung Einrichtung/i.test(text)) {
    throw new Error('General Ledger Setup / Finanzbuchhaltung Einrichtung is not visible.');
  }
  if (dangerousText(text)) {
    throw new Error('Dangerous posting/preview/delete text is visible.');
  }
}

async function openGeneralLedgerSetup(page: Page) {
  await page.goto(buildPlaythruUrl(118).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1300);
  await assertSafeGeneralLedgerSetup(page);
}

async function clickEditMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const candidate of [
      scope.locator(
        [
          'button[title*="Aenderungen"]',
          'button[title*="Anderungen"]',
          'button[title*="changes" i]',
          'button[title*="Edit" i]',
          'button[aria-label*="Aenderungen"]',
          'button[aria-label*="Anderungen"]',
          'button[aria-label*="Edit" i]'
        ].join(',')
      ).first(),
      scope.getByRole('button', { name: /^Bearbeiten$|^Edit$/i }).first()
    ]) {
      if ((await candidate.isVisible({ timeout: 600 }).catch(() => false)) && (await candidate.isEnabled({ timeout: 600 }).catch(() => false))) {
        await candidate.click({ timeout: 3000 }).catch(async () => candidate.click({ force: true, timeout: 3000 }));
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }
  return false;
}

async function expandDimensionsArea(page: Page) {
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(500);
  for (const scope of [page, ...page.frames()]) {
    for (const locator of [
      scope.getByRole('button', { name: /^Mehr anzeigen$|^Show more$/i }).last(),
      scope.getByText(/^Mehr anzeigen$|^Show more$/i).last(),
      scope.getByText(/Dimensionen|Dimensions/i).last()
    ]) {
      if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
        await locator.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
        const text = clean((await locator.innerText({ timeout: 500 }).catch(() => '')) || '');
        if (/Mehr anzeigen|Show more/i.test(text)) {
          await locator.click({ timeout: 2500 }).catch(() => undefined);
        }
        await page.waitForTimeout(700);
        return true;
      }
    }
  }
  return false;
}

async function clickGlobalDimensionsAction(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const locator of [
      scope.getByRole('button', { name: /Globale Dimensionen andern|Globale Dimensionen ändern|Change Global Dimensions/i }).first(),
      scope.getByRole('menuitem', { name: /Globale Dimensionen andern|Globale Dimensionen ändern|Change Global Dimensions/i }).first(),
      scope.getByText(/Globale Dimensionen andern|Globale Dimensionen ändern|Change Global Dimensions/i).first()
    ]) {
      if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
        await locator.click({ timeout: 5000 }).catch(async () => locator.click({ force: true, timeout: 5000 }));
        await page.waitForTimeout(1800);
        return true;
      }
    }
  }
  return false;
}

async function clickGlobalDimensionDialogOk(page: Page) {
  const text = await safeText(page);
  if (!globalDimensionActionText(text)) return false;
  for (const scope of [page, ...page.frames()]) {
    for (const locator of [
      scope.getByRole('button', { name: /^OK$|^Ja$|^Yes$|^Start$/i }).first(),
      scope.getByRole('menuitem', { name: /^OK$|^Ja$|^Yes$|^Start$/i }).first()
    ]) {
      if (await locator.isVisible({ timeout: 800 }).catch(() => false)) {
        await locator.click({ timeout: 5000 }).catch(async () => locator.click({ force: true, timeout: 5000 }));
        await page.waitForTimeout(3000);
        return true;
      }
    }
  }
  return false;
}

async function collectFieldCandidates(page: Page, target: AssignmentTarget): Promise<FieldCandidate[]> {
  const all: FieldCandidate[] = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    all.push(...(await collectFieldCandidatesInScope(frame, frameIndex, target)));
  }
  all.push(...(await collectFieldCandidatesInScope(page, -1, target)));
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

async function collectFieldCandidatesInScope(scope: Frame | Page, frameIndex: number, target: AssignmentTarget): Promise<FieldCandidate[]> {
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
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const matches = (value: string, caption: string) => {
          const escaped = caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
          return new RegExp(`(^|\\b)${escaped}($|\\b)`, 'i').test(value);
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
                score: 100,
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
                const sameRow = Math.abs(controlCenterY - centerY) <= 28 && rect.x >= labelRect.x - 20;
                return { control, distance: Math.abs(controlCenterY - centerY) + Math.max(0, rect.x - labelRect.x), sameRow };
              })
              .filter((entry) => entry.sameRow)
              .sort((left, right) => left.distance - right.distance);
            for (const entry of rowControls.slice(0, 3)) {
              candidates.push({
                frameIndex: frameIndexValue,
                controlIndex: entry.control.index,
                caption,
                labelText,
                labelRect,
                control: entry.control.info,
                score: 85 - Math.round(entry.distance / 20),
                reasons: ['label-row-control']
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

function selectUsableCandidate(candidates: FieldCandidate[]) {
  const usable = candidates
    .filter((candidate) => !candidate.control.disabled && !candidate.control.readOnly)
    .sort((left, right) => right.score - left.score || left.control.rect.x - right.control.rect.x || left.control.rect.y - right.control.rect.y);
  if (usable.length === 0) return null;
  const [first, second] = usable;
  if (!second) return first;
  return first.score - second.score >= 15 ? first : null;
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
  await page.waitForTimeout(350);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 25 });
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(500);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1500);
}

async function fillRightSideFieldOnSameRow(page: Page, candidate: FieldCandidate, value: string) {
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
    x: Math.round(frameOffset.x + Math.min(1680, candidate.control.rect.x + candidate.control.rect.width + 80)),
    y: Math.round(frameOffset.y + candidate.control.rect.y + candidate.control.rect.height / 2)
  };
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(350);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 25 });
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(500);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1500);
}

async function captureState(page: Page, prefix: string, step: string, attempts: AssignmentAttempt[] = []) {
  const compact = await compactPageText(page, {
    include: [
      /Finanzbuchhaltung Einrichtung|General Ledger Setup|Dimensionen|Dimensions|Globaler Dimensionscode|Global Dimension|PRODUCTLINE|COSTCENTER|CHANNEL|Mehr anzeigen|Bearbeiten|Edit/i
    ],
    maxLines: 220,
    maxLineLength: 220
  });
  const cleanLines = compact
    .split('\n')
    .map(clean)
    .filter((line) => line && !isEvidenceNoise(line));
  const diagnostics: Record<string, unknown> = {};
  for (const target of targets) {
    diagnostics[target.id] = await collectActiveCardControlDiagnostics(page, target.captions, {
      targetText: /Finanzbuchhaltung Einrichtung|General Ledger Setup|Sachbuchhaltung Einrichtung/i
    });
  }
  await writeText(`${prefix}.txt`, cleanLines.join('\n'));
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.diagnostics.json`), diagnostics);
  await screenshotWithMetadata(page, `${prefix}.png`, {
    page: 'Finanzbuchhaltung Einrichtung / General Ledger Setup, Page 118',
    step,
    visibleLearning:
      'Die Felder fuer globale Dimensionen liegen in der Finanzbuchhaltung Einrichtung. Sie sollten vor Stammdaten und Buchungen bewusst gesetzt werden.',
    importantUi: ['Globaler Dimensionscode 1', 'Globaler Dimensionscode 2', 'Dimensionen', 'Bearbeiten'],
    internallyProves: [`General Ledger Setup opened in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`, 'Global-dimension field context was captured.'],
    doesNotProve: ['Posted entries with dimensions.', 'Reporting filters.', 'Default Dimensions on master data.', 'VAT or posting setup correctness.'],
    attempts
  });
}

async function assignTarget(page: Page, target: AssignmentTarget): Promise<AssignmentAttempt> {
  await openGeneralLedgerSetup(page);
  await clickEditMode(page);
  await expandDimensionsArea(page);
  await assertSafeGeneralLedgerSetup(page);
  let text = await safeText(page);
  let beforeCandidates = await collectFieldCandidates(page, target);
  if (literalPattern(target.code).test(text)) {
    return {
      id: target.id,
      intent: target.intent,
      code: target.code,
      status: 'already-assigned',
      fillAttempted: false,
      beforeCandidates,
      afterCandidates: beforeCandidates,
      reopenCandidates: beforeCandidates,
      reason: `${target.intent} already shows ${target.code}.`
    };
  }

  const candidate = selectUsableCandidate(beforeCandidates);
  if (!candidate) {
    const actionOpened = await clickGlobalDimensionsAction(page);
    if (!actionOpened) {
      return {
        id: target.id,
        intent: target.intent,
        code: target.code,
        status: 'blocked',
        fillAttempted: false,
        beforeCandidates,
        afterCandidates: [],
        reopenCandidates: [],
        reason: beforeCandidates.length
          ? `Ambiguous or non-editable field candidates: ${beforeCandidates.length}.`
          : 'No editable target field candidate found and Change Global Dimensions action was not visible.'
      };
    }
    await captureState(page, `target-024b-${target.id}-015-change-dialog`, `After opening Change Global Dimensions for ${target.intent}.`);
    beforeCandidates = await collectFieldCandidates(page, target);
    const dialogCandidate = selectUsableCandidate(beforeCandidates);
    if (!dialogCandidate) {
      return {
        id: target.id,
        intent: target.intent,
        code: target.code,
        status: 'blocked',
        fillAttempted: false,
        beforeCandidates,
        afterCandidates: [],
        reopenCandidates: [],
        reason: beforeCandidates.length
          ? `Change Global Dimensions opened, but candidates are ambiguous/non-editable: ${beforeCandidates.length}.`
          : 'Change Global Dimensions opened, but no editable target field candidate was found.'
      };
    }
    await fillCandidate(page, dialogCandidate, target.code);
    await captureState(page, `target-024b-${target.id}-016-change-dialog-after-fill`, `After filling Change Global Dimensions for ${target.intent}.`);
    const okClicked = await clickGlobalDimensionDialogOk(page);
    if (!okClicked) {
      return {
        id: target.id,
        intent: target.intent,
        code: target.code,
        status: 'blocked',
        fillAttempted: true,
        beforeCandidates,
        afterCandidates: await collectFieldCandidates(page, target),
        reopenCandidates: [],
        reason: 'Change Global Dimensions field was filled, but no safe OK/Start confirmation was visible.'
      };
    }
    await openGeneralLedgerSetup(page);
    await expandDimensionsArea(page);
    const reopenText = await safeText(page);
    const reopenCandidates = await collectFieldCandidates(page, target);
    const visibleAfterReopen =
      literalPattern(target.code).test(reopenText) ||
      reopenCandidates.some((entry) => literalPattern(target.code).test(`${entry.control.value} ${entry.control.text}`));
    return {
      id: target.id,
      intent: target.intent,
      code: target.code,
      status: visibleAfterReopen ? 'assigned' : 'blocked',
      fillAttempted: true,
      beforeCandidates,
      afterCandidates: [],
      reopenCandidates,
      reason: visibleAfterReopen
        ? `${target.intent} shows ${target.code} after Change Global Dimensions action and reopen.`
        : `${target.intent} did not show ${target.code} after Change Global Dimensions action and reopen.`
    };
  }

  await fillCandidate(page, candidate, target.code);
  await assertSafeGeneralLedgerSetup(page);
  text = await safeText(page);
  const afterCandidates = await collectFieldCandidates(page, target);
  const visibleAfter = literalPattern(target.code).test(text) || afterCandidates.some((entry) => literalPattern(target.code).test(`${entry.control.value} ${entry.control.text}`));

  await openGeneralLedgerSetup(page);
  await expandDimensionsArea(page);
  const reopenText = await safeText(page);
  const reopenCandidates = await collectFieldCandidates(page, target);
  const visibleAfterReopen =
    literalPattern(target.code).test(reopenText) ||
    reopenCandidates.some((entry) => literalPattern(target.code).test(`${entry.control.value} ${entry.control.text}`));

  return {
    id: target.id,
    intent: target.intent,
    code: target.code,
    status: visibleAfter && visibleAfterReopen ? 'assigned' : 'blocked',
    fillAttempted: true,
    beforeCandidates,
    afterCandidates,
    reopenCandidates,
    reason:
      visibleAfter && visibleAfterReopen
        ? `${target.intent} shows ${target.code} after value entry and reopen.`
        : `${target.intent} did not persist ${target.code} after value entry/reopen.`
  };
}

async function clickSequentialChangeMode(page: Page) {
  const text = await safeText(page);
  if (!globalDimensionActionText(text)) return false;
  let tabClicked = false;
  for (const scope of [page, ...page.frames()]) {
    for (const locator of [
      scope.getByRole('button', { name: /^Fortlaufend$|^Sequential$/i }).first(),
      scope.getByRole('menuitem', { name: /^Fortlaufend$|^Sequential$/i }).first(),
      scope.getByText(/^Fortlaufend$|^Sequential$/i).first()
    ]) {
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        await locator.click({ timeout: 5000 }).catch(async () => locator.click({ force: true, timeout: 5000 }));
        await page.waitForTimeout(1000);
        tabClicked = true;
        break;
      }
    }
    if (tabClicked) break;
  }
  for (const scope of [page, ...page.frames()]) {
    for (const locator of [
      scope.getByRole('button', { name: /^Starten$|^Start$|^Run$/i }).first(),
      scope.getByRole('menuitem', { name: /^Starten$|^Start$|^Run$/i }).first(),
      scope.getByText(/^Starten$|^Start$|^Run$/i).first()
    ]) {
      if (await locator.isVisible({ timeout: 1200 }).catch(() => false)) {
        await locator.click({ timeout: 5000 }).catch(async () => locator.click({ force: true, timeout: 5000 }));
        await page.waitForTimeout(12_000);
        return true;
      }
    }
  }
  return false;
}

async function assignAllTargetsDirectlyOnSetupCard(page: Page): Promise<AssignmentAttempt[]> {
  await openGeneralLedgerSetup(page);
  await clickEditMode(page);
  await expandDimensionsArea(page);
  await assertSafeGeneralLedgerSetup(page);

  const attempts: AssignmentAttempt[] = [];
  for (const target of targets) {
    const beforeCandidates = await collectFieldCandidates(page, target);
    const candidate = selectUsableCandidate(beforeCandidates);
    if (!candidate) {
      attempts.push({
        id: target.id,
        intent: target.intent,
        code: target.code,
        status: 'blocked',
        fillAttempted: false,
        beforeCandidates,
        afterCandidates: [],
        reopenCandidates: [],
        reason: 'General Ledger Setup card edit mode did not expose a usable field candidate.'
      });
      continue;
    }
    await fillCandidate(page, candidate, target.code);
    attempts.push({
      id: target.id,
      intent: target.intent,
      code: target.code,
      status: 'blocked',
      fillAttempted: true,
      beforeCandidates,
      afterCandidates: await collectFieldCandidates(page, target),
      reopenCandidates: [],
      reason: `${target.intent} filled directly on General Ledger Setup card; persistence not yet checked.`
    });
  }

  await captureState(page, 'target-024b-012-direct-card-after-fill', 'After direct card edit attempt on General Ledger Setup.', attempts);

  await openGeneralLedgerSetup(page);
  await expandDimensionsArea(page);
  const reopenText = await safeText(page);
  for (const attempt of attempts) {
    attempt.reopenCandidates = await collectFieldCandidates(page, targets.find((target) => target.id === attempt.id)!);
    const visibleAfterReopen =
      literalPattern(attempt.code).test(reopenText) ||
      attempt.reopenCandidates.some((entry) => literalPattern(attempt.code).test(`${entry.control.value} ${entry.control.text}`));
    attempt.status = visibleAfterReopen ? 'assigned' : 'blocked';
    attempt.reason = visibleAfterReopen
      ? `${attempt.intent} shows ${attempt.code} after direct card edit and reopen.`
      : `${attempt.intent} did not show ${attempt.code} after direct card edit and reopen.`;
  }
  return attempts;
}

async function assignAllTargetsViaChangeAction(page: Page): Promise<AssignmentAttempt[]> {
  await openGeneralLedgerSetup(page);
  await expandDimensionsArea(page);
  const currentText = await safeText(page);
  if (targets.every((target) => literalPattern(target.code).test(currentText))) {
    return targets.map((target) => ({
      id: target.id,
      intent: target.intent,
      code: target.code,
      status: 'already-assigned',
      fillAttempted: false,
      beforeCandidates: [],
      afterCandidates: [],
      reopenCandidates: [],
      reason: `${target.intent} already shows ${target.code}.`
    }));
  }

  const directAttempts = await assignAllTargetsDirectlyOnSetupCard(page);
  if (directAttempts.every((attempt) => attempt.status === 'assigned' || attempt.status === 'already-assigned')) {
    return directAttempts;
  }

  const actionOpened = await clickGlobalDimensionsAction(page);
  if (!actionOpened) {
    return targets.map((target) => ({
      id: target.id,
      intent: target.intent,
      code: target.code,
      status: 'blocked',
      fillAttempted: false,
      beforeCandidates: [],
      afterCandidates: [],
      reopenCandidates: [],
      reason: 'Change Global Dimensions action was not visible.'
    }));
  }

  await captureState(page, 'target-024b-015-change-dialog', 'Change Global Dimensions action page opened.');
  const attempts: AssignmentAttempt[] = [];
  for (const target of targets) {
    const beforeCandidates = await collectFieldCandidates(page, target);
    const candidate = selectUsableCandidate(beforeCandidates);
    if (!candidate) {
      attempts.push({
        id: target.id,
        intent: target.intent,
        code: target.code,
        status: 'blocked',
        fillAttempted: false,
        beforeCandidates,
        afterCandidates: [],
        reopenCandidates: [],
        reason: beforeCandidates.length
          ? `Change Global Dimensions opened, but candidates are ambiguous/non-editable: ${beforeCandidates.length}.`
          : 'Change Global Dimensions opened, but no editable target field candidate was found.'
      });
      continue;
    }
    await fillCandidate(page, candidate, target.code);
    await fillRightSideFieldOnSameRow(page, candidate, target.code);
    attempts.push({
      id: target.id,
      intent: target.intent,
      code: target.code,
      status: 'blocked',
      fillAttempted: true,
      beforeCandidates,
      afterCandidates: await collectFieldCandidates(page, target),
      reopenCandidates: [],
      reason: `${target.intent} filled on Change Global Dimensions page; persistence not yet checked.`
    });
  }

  await captureState(page, 'target-024b-016-change-dialog-after-fill', 'Change Global Dimensions fields after filling both target dimensions.', attempts);
  const allFieldsFilled = attempts.every((attempt) => attempt.fillAttempted);
  const sequentialClicked = allFieldsFilled ? await clickSequentialChangeMode(page) : false;
  await captureState(page, 'target-024b-017-after-sequential-attempt', `After Fortlaufend/Sequential attempt; clicked=${sequentialClicked}.`, attempts);

  await openGeneralLedgerSetup(page);
  await expandDimensionsArea(page);
  const reopenText = await safeText(page);
  for (const attempt of attempts) {
    attempt.reopenCandidates = await collectFieldCandidates(page, targets.find((target) => target.id === attempt.id)!);
    const visibleAfterReopen =
      literalPattern(attempt.code).test(reopenText) ||
      attempt.reopenCandidates.some((entry) => literalPattern(attempt.code).test(`${entry.control.value} ${entry.control.text}`));
    attempt.status = visibleAfterReopen ? 'assigned' : 'blocked';
    attempt.reason = visibleAfterReopen
      ? `${attempt.intent} shows ${attempt.code} after Change Global Dimensions sequential run and reopen.`
      : sequentialClicked
        ? `${attempt.intent} did not show ${attempt.code} after Change Global Dimensions sequential run and reopen.`
        : `${attempt.intent} was not proven because the Fortlaufend/Sequential action was not safely clicked.`;
  }
  return attempts;
}

test('TARGET-024B assigns or proves Universaarl Global Dimension Code 1/2', async ({ page }) => {
  test.setTimeout(360_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  await openGeneralLedgerSetup(page);
  await expandDimensionsArea(page);
  await captureState(page, 'target-024b-010-before', 'Before Global Dimension Code assignment.');

  const attempts = await assignAllTargetsViaChangeAction(page);

  await openGeneralLedgerSetup(page);
  await expandDimensionsArea(page);
  await captureState(page, 'target-024b-020-after-attempt', 'After Global Dimension Code assignment attempt.', attempts);
  await openGeneralLedgerSetup(page);
  await expandDimensionsArea(page);
  await captureState(page, 'target-024b-090-after-reopen', 'After reopen proof for Global Dimension Code assignment.', attempts);

  const proved = attempts.filter((attempt) => attempt.status === 'assigned' || attempt.status === 'already-assigned');
  const blocked = attempts.filter((attempt) => attempt.status === 'blocked').map((attempt) => `${attempt.intent}: ${attempt.reason}`);
  const allProven = blocked.length === 0 && proved.length === targets.length;
  const nextCase = allProven ? 'TARGET-024-CORE-MASTERDATA-PLAN' : 'TARGET-024C-GLOBAL-DIMENSION-FIELD-DISCOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-global-dimension-assignment',
    resultStatus: allProven ? 'observed' : proved.length ? 'partial-observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    attempts,
    proved: [
      'General Ledger Setup / Finanzbuchhaltung Einrichtung page 118 was opened only in playthru / UNIVERSAARL-DE.',
      ...proved.map((attempt) => `${attempt.intent} contains ${attempt.code} after guarded value entry/reopen.`),
      'No master data, document draft, preview posting, posting, company switch or API shortcut was executed.'
    ],
    notProved: [
      ...(allProven ? [] : ['Not every Global Dimension Code field could be assigned or proven with the current UI route.']),
      'Default Dimensions on customers, vendors, items or accounts are not proven.',
      'Dimension Set Entries, posted entries and reporting filters are not proven.',
      'German VAT or posting-group correctness is not proven by this case.'
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-024B-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.diagnostics.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-024b-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-024B-result.json`,
      'playwright/projects/fibu-book5/img/target-024b-010-before.png',
      'playwright/projects/fibu-book5/img/target-024b-020-after-attempt.png',
      'playwright/projects/fibu-book5/img/target-024b-090-after-reopen.png'
    ],
    blockedBy: blocked,
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true,
      setupWriteAttempted: attempts.some((attempt) => attempt.fillAttempted),
      setupChanged: attempts.some((attempt) => attempt.status === 'assigned')
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-024B-GLOBAL-DIMENSION-ASSIGNMENT',
      lastEvidenceSummary: 'TARGET-023B recovered all starter Dimension Values with reopen proof.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Global Dimension assignment is the next dependency before master data/default dimensions and later reporting examples.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-024-CORE-MASTERDATA-PLAN',
          status: allProven ? 'ready-next' : 'needs-setup-first',
          reason: allProven ? 'Master data planning can now refer to global dimensions.' : 'Master data should wait until Global Dimension Code fields are assigned or consciously parked.'
        },
        {
          caseId: 'TARGET-025-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Template defaults need posting groups, VAT and dimension/default-dimension decisions.'
        },
        {
          caseId: 'TARGET-026-VAT-SETUP-FIT-DECISION',
          status: 'needs-source-check-first',
          reason: 'German VAT setup needs a source-backed decision before document preview.'
        },
        {
          caseId: 'TARGET-027-FIRST-MASTERDATA-CANDIDATE',
          status: 'needs-setup-first',
          reason: 'First master data should follow setup plan and default dimension strategy.'
        },
        {
          caseId: 'TARGET-028-DEFAULT-DIMENSIONS-STRATEGY',
          status: allProven ? 'ready-after-current' : 'needs-setup-first',
          reason: 'Default dimensions become useful after global dimensions and first master-data candidates are known.'
        }
      ],
      queueChangesMade: [`Selected ${nextCase} based on TARGET-024B result.`],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: allProven
        ? 'The global dimension prerequisite is proven; the next useful work is master data planning with dimensions in mind.'
        : 'The field route is not reliable enough; a narrower field-discovery case is safer than guessing.',
      risksBeforeNextCase: [
        'Do not claim reporting readiness before posted entries with dimensions exist.',
        'Do not create default dimensions before concrete master-data records exist.',
        'Do not treat VAT or posting groups as complete from this case.'
      ],
      requiredPreparation: allProven
        ? ['Use TARGET-024B screenshots as setup proof before master data planning.']
        : ['Review TARGET-024B diagnostics and avoid repeating the same ambiguous field route.']
    },
    warnings: [
      'TARGET-024B changes only General Ledger Setup global dimension fields if unambiguous.',
      'This is setup foundation, not reporting or posted-entry proof.'
    ],
    requiresReview: !allProven,
    safeToFinalizeState: allProven,
    statePatch: {},
    reason: allProven
      ? 'TARGET-024B proved PRODUCTLINE and COSTCENTER as Global Dimension Code 1/2 with reopen evidence.'
      : `TARGET-024B proved ${proved.length}/${targets.length} Global Dimension Code fields.`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-024B Global Dimension Assignment',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Felder',
      '',
      ...attempts.map((attempt) => `- ${attempt.intent}: ${attempt.status} - ${attempt.reason}`),
      '',
      '## Grenzen',
      '',
      '- Keine Stammdaten.',
      '- Keine Standarddimensionen.',
      '- Keine Preview und keine Buchung.',
      '- Keine Reportingwirkung ohne spaetere gebuchte Posten.',
      ''
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
  expect(proved.length > 0 || blocked.length > 0, 'Case must either prove fields or document a blocker.').toBeTruthy();
});
