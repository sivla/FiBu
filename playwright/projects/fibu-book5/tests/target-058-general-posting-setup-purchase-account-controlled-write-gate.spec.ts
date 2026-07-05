import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(300_000);

const CASE_ID = 'TARGET-058-GENERAL-POSTING-SETUP-PURCHASE-ACCOUNT-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-058-general-posting-setup-purchase-account-controlled-write-gate';
const EVIDENCE_DIR_REL = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-058-result.json');
const PAGE_ID = 314;
const TARGETS = {
  businessPostingGroup: 'INLAND',
  productPostingGroup: 'WAREN',
  salesAccount: '4400',
  purchaseAccount: '5400'
};

type UiEntry = {
  text: string;
  aria: string;
  title: string;
  controlName: string;
  role: string;
  tag: string;
  value: string;
  disabled: boolean;
  readonly: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

type WriteRoute = {
  status: 'direct-control' | 'cell-control' | 'not-found' | 'ambiguous' | 'readonly';
  reason: string;
  candidates: UiEntry[];
  candidate?: UiEntry;
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|originAuthorityValidator|upn:/i.test(line))
    .join('\n')
    .trim();
}

function cleanEvidenceValue<T>(value: T): T {
  if (typeof value === 'string') return clean(value) as T;
  if (Array.isArray(value)) return value.map((entry) => cleanEvidenceValue(entry)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cleanEvidenceValue(entry)])) as T;
  }
  return value;
}

function buildTargetUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(PAGE_ID));
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function containsDangerousDialogText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Liefern und fakturieren|Delete\?|Loeschen\?|Loschen\?|Apply\?|Anwenden\?|Mandant wechseln|Company switch|^Yes$|^Ja$|^Post$|^Buchen$|^New$|^Neu$|^Edit$|^Bearbeiten$|^Kopieren/i.test(text);
}

function hasPage314Context(text: string) {
  return /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto/i.test(
    text
  );
}

function hasInlandWarenRow(text: string) {
  return /INLAND[\s\S]{0,2400}WAREN|WAREN[\s\S]{0,2400}INLAND/i.test(text);
}

function hasVisible4400State(text: string) {
  return /INLAND[\s\S]{0,3200}WAREN[\s\S]{0,3600}4400|WAREN[\s\S]{0,3200}INLAND[\s\S]{0,3600}4400/i.test(text);
}

function hasVisible5400State(text: string) {
  return /INLAND[\s\S]{0,3200}WAREN[\s\S]{0,4600}5400|WAREN[\s\S]{0,3200}INLAND[\s\S]{0,4600}5400/i.test(text);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(cleanEvidenceValue(data), null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function compactSetupText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto|Einkauf|Purchase|Sales|Verkauf|INLAND|WAREN|4400|5400|Liste bearbeiten|Edit List|Bearbeiten|Edit|Page Inspection|Seitenpr/i
      ],
      maxLines: 320,
      maxLineLength: 260
    })
  );
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = clean(await frame.locator('body').innerText({ timeout: 1200 }).catch(() => ''));
    if (expected.test(bodyText)) return { frame, bodyText };
  }
  return undefined;
}

async function visibleDialogTexts(page: Page) {
  const texts: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"], .modal-dialog, .ms-Dialog-main');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (text) texts.push(text);
    }
  }
  return texts;
}

async function dangerousDialogVisible(page: Page) {
  return (await visibleDialogTexts(page)).some(containsDangerousDialogText);
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = path.join(EVIDENCE_DIR, fileName);
  const repoRelativeImagePath = `${EVIDENCE_DIR_REL}/${fileName}`;
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath: repoRelativeImagePath,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactSetupText(page);
  const text = await safeText(page);
  const snapshot = {
    step,
    pageId: new URL(page.url()).searchParams.get('page'),
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    safeInstance: instancePathIsTarget(page.url()),
    safeCompany: companyParamIsTarget(page.url()),
    page314Context: hasPage314Context(text),
    inlandWarenVisible: hasInlandWarenRow(text),
    visible4400State: hasVisible4400State(text),
    visible5400State: hasVisible5400State(text),
    dangerousDialogVisible: await dangerousDialogVisible(page),
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 6000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Buchungsmatrix Einrichtung / General Posting Setup',
    step,
    importantUi: (compact || text)
      .split('\n')
      .filter((line) => line.length > 0)
      .slice(0, 40),
    screenshotQa: {
      safeInstance: snapshot.safeInstance,
      safeCompany: snapshot.safeCompany,
      page314Context: snapshot.page314Context,
      dangerousDialogVisible: snapshot.dangerousDialogVisible,
      inlandWarenVisible: snapshot.inlandWarenVisible,
      visible4400State: snapshot.visible4400State,
      visible5400State: snapshot.visible5400State
    },
    internallyProves: 'Current Page 314 state in playthru / UNIVERSAARL-DE before or after the controlled single-field gate.',
    doesNotProve: [
      'No VAT setup is validated.',
      'No master data, document draft, Preview Posting or Posting is validated.',
      'No broad SKR04 completeness is claimed.'
    ],
    finalScreenshotStatus: 'target-evidence',
    ...extra
  });
  return snapshot;
}

async function domInventory(frame: Frame) {
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const html = element as HTMLElement;
      const rect = html.getBoundingClientRect();
      const style = window.getComputedStyle(html);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0;
    };
    const snapshot = (element: Element): UiEntry => {
      const html = element as HTMLInputElement;
      const rect = html.getBoundingClientRect();
      return {
        text: normalize((html as HTMLElement).innerText || html.textContent),
        aria: normalize(html.getAttribute('aria-label')),
        title: normalize(html.getAttribute('title')),
        controlName: normalize(html.getAttribute('controlname')),
        role: normalize(html.getAttribute('role')),
        tag: html.tagName.toLowerCase(),
        value: normalize(html.value),
        disabled: Boolean(html.disabled || html.getAttribute('aria-disabled') === 'true'),
        readonly: Boolean(html.readOnly || html.getAttribute('aria-readonly') === 'true'),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    };
    const interesting =
      /Buchungsmatrix|General Posting Setup|Gesch[a-z]*ftsbuchungsgruppe|Geschaeftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto|Purch\. Account|Purchase Account|Sales Account|INLAND|WAREN|4400|5400|Liste bearbeiten|Edit List|Bearbeiten|Edit/i;
    return [...document.querySelectorAll('th,tr,td,[role="row"],[role="gridcell"],[role="columnheader"],button,[role="button"],a,input,textarea,select,[role="textbox"],[role="combobox"],[aria-label],[title]')]
      .filter(visible)
      .map(snapshot)
      .filter((entry) => interesting.test([entry.text, entry.aria, entry.title, entry.controlName, entry.value].join(' ')) || entry.tag === 'input' || entry.role === 'textbox' || entry.role === 'combobox')
      .slice(0, 1000);
  });
}

function fieldText(entry: UiEntry) {
  return [entry.controlName, entry.aria, entry.title, entry.text, entry.value].join(' ');
}

function isPurchaseAccount(entry: UiEntry) {
  return /^(Purch\.?\s*Account|Purchase Account|Wareneinkaufskonto)$/i.test(entry.controlName) ||
    /Purch\.?\s*Account|Purchase Account|Wareneinkaufskonto/i.test(fieldText(entry));
}

function isEditableControl(entry: UiEntry) {
  return ['input', 'textarea', 'select'].includes(entry.tag) || /textbox|combobox/i.test(entry.role);
}

function sameRow(a: UiEntry, b: UiEntry) {
  const centerA = a.y + a.height / 2;
  const centerB = b.y + b.height / 2;
  return Math.abs(centerA - centerB) <= 36;
}

function routeFromInventory(entries: UiEntry[]): WriteRoute {
  const direct = entries.filter((entry) => isPurchaseAccount(entry) && isEditableControl(entry) && entry.width > 4 && entry.height > 4);
  const editable = direct.filter((entry) => !entry.disabled && !entry.readonly);
  if (direct.length > 1) {
    return { status: 'ambiguous', reason: 'More than one editable-looking Purchase Account control was found.', candidates: direct };
  }
  if (editable.length === 1) {
    return { status: 'direct-control', reason: 'A unique Purchase Account input/control is visible.', candidates: editable, candidate: editable[0] };
  }
  if (direct.length === 1 && editable.length === 0) {
    return { status: 'readonly', reason: 'A Purchase Account control is visible, but it is readonly or disabled.', candidates: direct, candidate: direct[0] };
  }

  const rowAnchors = entries.filter((entry) => /^(INLAND|WAREN|4400)$/.test(entry.text) || /^(INLAND|WAREN|4400)$/.test(entry.value));
  const inland = rowAnchors.find((entry) => entry.text === TARGETS.businessPostingGroup || entry.value === TARGETS.businessPostingGroup);
  const waren = rowAnchors.find((entry) => entry.text === TARGETS.productPostingGroup || entry.value === TARGETS.productPostingGroup);
  const sales = rowAnchors.find((entry) => entry.text === TARGETS.salesAccount || entry.value === TARGETS.salesAccount);
  const purchaseCells = entries.filter((entry) => isPurchaseAccount(entry) && !isEditableControl(entry) && (entry.tag === 'td' || /gridcell/i.test(entry.role)));
  const rowCells = purchaseCells.filter((entry) => (!inland || sameRow(entry, inland)) && (!waren || sameRow(entry, waren)) && (!sales || sameRow(entry, sales)));
  const writableRowCells = rowCells.filter((entry) => !entry.readonly && !entry.disabled);

  if (writableRowCells.length === 1 && inland && waren && sales && sameRow(inland, waren) && sameRow(waren, sales)) {
    return {
      status: 'cell-control',
      reason: 'A unique writable row-bound Purchase Account cell is visible next to INLAND/WAREN/4400.',
      candidates: writableRowCells,
      candidate: writableRowCells[0]
    };
  }
  if (rowCells.length === 1 && inland && waren && sales && sameRow(inland, waren) && sameRow(waren, sales)) {
    return {
      status: 'cell-control',
      reason: 'A unique row-bound Purchase Account cell is visible next to INLAND/WAREN/4400; clicking it may reveal the editor.',
      candidates: rowCells,
      candidate: rowCells[0]
    };
  }
  if (writableRowCells.length > 1) {
    return { status: 'ambiguous', reason: 'Multiple writable row-bound Purchase Account cells were found.', candidates: writableRowCells };
  }
  if (rowCells.length > 1) {
    return { status: 'ambiguous', reason: 'Multiple row-bound Purchase Account cells were found.', candidates: rowCells };
  }
  return {
    status: 'not-found',
    reason: 'No unique Purchase Account editable control or row-bound field cell was visible.',
    candidates: [...direct, ...purchaseCells].slice(0, 20)
  };
}

async function matchingLocatorByBox(frame: Frame, box: UiEntry) {
  const candidates = frame.locator('input,textarea,select,[role="textbox"],[role="combobox"]');
  const count = await candidates.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    const candidateBox = await candidate.boundingBox().catch(() => null);
    if (!candidateBox) continue;
    if (Math.abs(candidateBox.x - box.x) <= 3 && Math.abs(candidateBox.y - box.y) <= 3 && Math.abs(candidateBox.width - box.width) <= 6) {
      return candidate;
    }
  }
  return undefined;
}

async function clickEditListIfVisible(page: Page, frame: Frame) {
  for (const scope of [frame, page]) {
    const button = scope.getByRole('button', { name: /^Liste bearbeiten$|^Edit List$/i }).first();
    if ((await button.count().catch(() => 0)) > 0 && (await button.isVisible().catch(() => false))) {
      await button.click();
      await page.waitForTimeout(1200);
      return true;
    }
    const menuItem = scope.getByRole('menuitem', { name: /^Liste bearbeiten$|^Edit List$/i }).first();
    if ((await menuItem.count().catch(() => 0)) > 0 && (await menuItem.isVisible().catch(() => false))) {
      await menuItem.click();
      await page.waitForTimeout(1200);
      return true;
    }
    const semanticButton = scope
      .locator('button[aria-label="Liste bearbeiten"], button[aria-label="Edit List"], button[title*="nderungen auf der Seite vornehmen"], button:has-text("Liste bearbeiten"), button:has-text("Edit List")')
      .first();
    if ((await semanticButton.count().catch(() => 0)) > 0 && (await semanticButton.isVisible().catch(() => false))) {
      await semanticButton.click();
      await page.waitForTimeout(1200);
      return true;
    }
  }
  return false;
}

async function openPage314(page: Page) {
  await page.goto(buildTargetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1500);
  expect(instancePathIsTarget(page.url()), `Wrong BC instance URL: ${page.url()}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong BC company URL: ${page.url()}`).toBe(true);
  const bcFrame = await findBcFrame(page, /Buchungsmatrix|General Posting Setup|Wareneinkaufskonto|Purch\. Account/i);
  expect(bcFrame?.bodyText ?? '').toMatch(/Buchungsmatrix|General Posting Setup|Wareneinkaufskonto|Purch\. Account/i);
  return bcFrame!.frame;
}

async function writeResult(data: Record<string, unknown>) {
  await writeJson(RESULT_PATH, {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    source: 'playwright-target-execution',
    runPlanId: CASE_ID,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-high',
    ...data
  });
}

test('TARGET-058 writes only Purch. Account 5400 when the field route is unambiguous', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const screenshots: string[] = [];
  const actionsTaken: string[] = ['opened Page 314 General Posting Setup directly in playthru / UNIVERSAARL-DE'];
  const actionsNotTaken = [
    'no New action',
    'no Copy action',
    'no VAT setup write',
    'no inventory setup write',
    'no master data write',
    'no document or journal draft',
    'no Preview Posting',
    'no Posting',
    'no Payment',
    'no API shortcut',
    'no company switch'
  ];

  const frame = await openPage314(page);
  const before = await captureState(page, 'target-058-010-before-page314', 'Before controlled write gate.');
  screenshots.push(`${EVIDENCE_DIR_REL}/target-058-010-before-page314.png`);

  const beforeInventory = await domInventory(frame);
  await writeJson(path.join(EVIDENCE_DIR, 'target-058-020-before-dom-inventory.json'), beforeInventory);
  let route = routeFromInventory(beforeInventory);
  await writeJson(path.join(EVIDENCE_DIR, 'target-058-025-before-route-decision.json'), route);

  if (route.status === 'not-found' || route.status === 'readonly' || (route.status === 'cell-control' && route.candidate?.readonly)) {
    const editClicked = await clickEditListIfVisible(page, frame);
    actionsTaken.push(editClicked ? 'clicked Liste bearbeiten / Edit List to expose editable controls' : 'checked for Liste bearbeiten / Edit List, but it was not visible');
    const afterEdit = await captureState(page, 'target-058-030-after-edit-list', 'After edit-list exposure attempt.', { editClicked });
    screenshots.push(`${EVIDENCE_DIR_REL}/target-058-030-after-edit-list.png`);
    const afterInventory = await domInventory(frame);
    await writeJson(path.join(EVIDENCE_DIR, 'target-058-035-after-edit-dom-inventory.json'), afterInventory);
    route = routeFromInventory(afterInventory);
    await writeJson(path.join(EVIDENCE_DIR, 'target-058-040-route-decision.json'), { route, afterEdit });
  }

  let setupChanged = false;
  let setupChangeAttempted = false;
  let resultStatus = 'blocked';
  let blockedBy: string[] = [];
  let warnings: string[] = [];
  let proved: string[] = [
    'playthru / UNIVERSAARL-DE was targeted directly.',
    'Page 314 General Posting Setup was opened for the existing INLAND / WAREN row.',
    'TARGET-058 did not use New, Copy, VAT setup, inventory setup, master data, documents, preview posting, posting, payment or API shortcuts.'
  ];
  let notProved: string[] = [];

  if (route.status === 'direct-control' && route.candidate) {
    const locator = await matchingLocatorByBox(frame, route.candidate);
    if (!locator) {
      blockedBy = ['unique-purchase-account-control-not-locatable-by-bounding-box'];
      notProved = ['Wareneinkaufskonto / Purch. Account could not be edited because the unique control could not be safely reselected.'];
    } else {
      await locator.click();
      await locator.fill(TARGETS.purchaseAccount);
      await locator.press('Tab');
      await page.waitForTimeout(1800);
      actionsTaken.push('entered 5400 into the unique Purch. Account / Wareneinkaufskonto control and tabbed out');
      setupChangeAttempted = true;
    }
  } else if (route.status === 'cell-control' && route.candidate) {
    await page.mouse.click(route.candidate.x + route.candidate.width / 2, route.candidate.y + route.candidate.height / 2);
    await page.waitForTimeout(900);
    if (!route.candidate.readonly && !route.candidate.disabled) {
      await page.keyboard.type(TARGETS.purchaseAccount, { delay: 20 });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(1800);
      actionsTaken.push('typed 5400 directly into the unique writable row-bound Purch. Account / Wareneinkaufskonto cell and tabbed out');
      setupChangeAttempted = true;
    } else {
      const focused = await domInventory(frame);
      await writeJson(path.join(EVIDENCE_DIR, 'target-058-045-after-cell-click-inventory.json'), focused);
      const focusedRoute = routeFromInventory(focused);
      await writeJson(path.join(EVIDENCE_DIR, 'target-058-046-after-cell-click-route.json'), focusedRoute);
      if (focusedRoute.status !== 'direct-control' || !focusedRoute.candidate) {
        blockedBy = ['row-bound-purchase-cell-did-not-open-unique-editor'];
        notProved = ['Wareneinkaufskonto / Purch. Account could not be edited because the row-bound field cell did not expose one unique editor.'];
      } else {
        const locator = await matchingLocatorByBox(frame, focusedRoute.candidate);
        if (!locator) {
          blockedBy = ['row-bound-purchase-editor-not-locatable-by-bounding-box'];
          notProved = ['Wareneinkaufskonto / Purch. Account editor was detected, but it could not be safely reselected.'];
        } else {
          await locator.fill(TARGETS.purchaseAccount);
          await locator.press('Tab');
          await page.waitForTimeout(1800);
          actionsTaken.push('clicked the row-bound Purch. Account / Wareneinkaufskonto cell, entered 5400 and tabbed out');
          setupChangeAttempted = true;
        }
      }
    }
  } else {
    blockedBy = [`purchase-account-route-${route.status}`];
    notProved = [`Wareneinkaufskonto / Purch. Account was not written because route status was ${route.status}: ${route.reason}`];
  }

  if (setupChangeAttempted) {
    const afterWrite = await captureState(page, 'target-058-050-after-write-attempt', 'After single-field 5400 write attempt.', { route });
    screenshots.push(`${EVIDENCE_DIR_REL}/target-058-050-after-write-attempt.png`);
    await openPage314(page);
    const reopen = await captureState(page, 'target-058-060-reopen-proof', 'Reopen proof after the controlled write attempt.', { route });
    screenshots.push(`${EVIDENCE_DIR_REL}/target-058-060-reopen-proof.png`);
    if (afterWrite.visible5400State || reopen.visible5400State) {
      setupChanged = true;
      resultStatus = 'observed';
      proved.push('Wareneinkaufskonto / Purch. Account 5400 is visible after the controlled write attempt and reopen proof.');
      notProved = [
        'No VAT Posting Setup was created or changed.',
        'No General Posting Setup beyond the single Purch. Account target field is claimed.',
        'No document, preview, posting, ledger entry or business process booking is proven.'
      ];
    } else {
      blockedBy = ['purchase-account-5400-not-visible-after-reopen'];
      warnings.push('5400 was entered into the selected field route, but it was not visible in the Page 314 reopen proof.');
      notProved = ['Wareneinkaufskonto / Purch. Account 5400 did not visibly persist in the reopen proof.'];
    }
  } else {
    const blocked = await captureState(page, 'target-058-050-blocked-no-write', 'Blocked before writing because no unambiguous field route existed.', { route });
    screenshots.push(`${EVIDENCE_DIR_REL}/target-058-050-blocked-no-write.png`);
    warnings.push(blocked.visible5400State ? '5400 was already visible, but TARGET-058 did not independently write it.' : 'No 5400 visibility was proven in this blocked run.');
  }

  const nextCase = setupChanged
    ? 'TARGET-027D31E-VAT-BUSINESS-GROUPS-SOURCE-OR-PAGEINSPECTION-DECISION'
    : 'TARGET-059-GENERAL-POSTING-SETUP-PURCHASE-ACCOUNT-ROUTE-ESCALATION-OR-PARK';

  await writeResult({
    sourceResult: RESULT_PATH.replace(/\\/g, '/'),
    resultStatus,
    url: sanitizeEvidenceUrl(page.url()),
    page: 'General Posting Setup / Buchungsmatrix Einrichtung',
    actionsTaken,
    actionsNotTaken,
    setupChanged,
    setupChangeAttempted,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    companySwitch: false,
    screenshots,
    routeDecision: route,
    proved,
    notProved,
    blockedBy,
    warnings,
    changedFiles: [RESULT_PATH.replace(/\\/g, '/'), ...screenshots],
    flags: {
      noNew: true,
      noCopy: true,
      noVatSetupWrite: true,
      noInventorySetupWrite: true,
      noMasterData: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noPayment: true,
      noApiShortcut: true,
      noCompanySwitch: true
    },
    smartDecision: {
      whyNow: 'TARGET-057 proved the target field exists in Page Inspection; TARGET-058 is the narrow follow-up for the one missing General Posting Setup purchase account.',
      evidenceBasis: ['TARGET-057 Page Inspection field truth for General Posting Setup table 252, field Purch. Account (14).'],
      fieldsAllowedToChange: ['Wareneinkaufskonto / Purch. Account = 5400 on INLAND / WAREN only'],
      fieldsKeptUntouched: ['VAT Posting Setup', 'Inventory Posting Setup', 'Posting Groups other than existing Page 314 target row', 'master data', 'documents', 'journals'],
      risk: 'Wrong cell write on Page 314 would corrupt posting setup; therefore the script only writes after direct field/control identification.',
      fallback: 'If no unique field/control is found, stop blocked and route to a source-backed or assisted setup decision instead of retrying geometry.',
      beginnerBookExplanation: 'Auf der Buchungsmatrix Einrichtung verbindet Business Central Produkt- und Geschaeftsbuchungsgruppen mit Sachkonten fuer Verkauf und Einkauf. Das Einkaufskonto 5400 gehoert zur Zeile INLAND / WAREN, damit spaetere Einkaufsprozesse ein Materialaufwandskonto kennen.'
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-058-GENERAL-POSTING-SETUP-PURCHASE-ACCOUNT-CONTROLLED-WRITE-GATE',
      lastEvidenceSummary: 'TARGET-057 proved Page 314 and Purch. Account field metadata, but did not set 5400.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The W1 Foundation is blocked until the General Posting Setup purchase account is either written or deliberately parked.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-058-GENERAL-POSTING-SETUP-PURCHASE-ACCOUNT-CONTROLLED-WRITE-GATE',
          status: 'ready-next',
          reason: 'Active single-field write gate.'
        },
        {
          caseId: 'TARGET-027D31E-VAT-BUSINESS-GROUPS-SOURCE-OR-PAGEINSPECTION-DECISION',
          status: setupChanged ? 'ready-after-current' : 'needs-setup-first',
          reason: setupChanged ? 'Can return to VAT foundation after Page 314 purchase account is solved.' : 'Should wait until Page 314 purchase account is solved or parked.'
        },
        {
          caseId: 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION',
          status: setupChanged ? 'ready-after-current' : 'needs-setup-first',
          reason: 'VAT setup write gate depends on starter account and posting setup context clarity.'
        },
        {
          caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
          status: 'needs-setup-first',
          reason: 'Foundation is not ready until posting and VAT setup checkpoints are clean.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: setupChanged
        ? 'Purchase account setup is now narrow-proven, so the next useful foundation topic is VAT setup route decision.'
        : 'The target field was not safely writable, so the next step must decide a safer source-backed or park route before VAT setup.',
      risksBeforeNextCase: setupChanged ? ['VAT write gates still require their own Smart Decision.'] : ['Repeating list-edit geometry would waste time and risk wrong-cell edits.'],
      requiredPreparation: setupChanged ? ['Run result-normalize and state-finalize plan-only.'] : ['Document a source-backed alternative or decide whether this Page 314 field can be parked temporarily.']
    },
    safeToFinalizeState: resultStatus === 'observed' || blockedBy.length > 0,
    requiresReview: false,
    reason: resultStatus === 'observed' ? 'Single-field write gate completed with reopen proof.' : 'Single-field write gate blocked safely before or after narrow attempt.'
  });

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
  expect(await dangerousDialogVisible(page)).toBe(false);
});
