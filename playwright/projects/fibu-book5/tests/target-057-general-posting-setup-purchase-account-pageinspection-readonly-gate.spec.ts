import { test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(240_000);

const CASE_ID = 'TARGET-057-GENERAL-POSTING-SETUP-PURCHASE-ACCOUNT-PAGEINSPECTION-READONLY-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-057-general-posting-setup-purchase-account-pageinspection-readonly-gate';
const EVIDENCE_DIR_REL = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-057-result.json');
const PAGE_ID = 314;

type UiEntry = {
  text: string;
  aria: string;
  title: string;
  controlName: string;
  role: string;
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Liefern und fakturieren|Delete\?|Loeschen\?|Loschen\?|Apply\?|Anwenden\?|Mandant wechseln|Company switch|^OK$|^Yes$|^Ja$|^Post$|^Buchen$|^New$|^Neu$|^Edit$|^Bearbeiten$/i.test(
    text
  );
}

function hasPage314Context(text: string) {
  return /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto/i.test(
    text
  );
}

function hasPartialInlandWarenRow(text: string) {
  return /INLAND[\s\S]{0,2200}WAREN|WAREN[\s\S]{0,2200}INLAND/i.test(text);
}

function hasVisible4400State(text: string) {
  return /INLAND[\s\S]{0,3000}WAREN[\s\S]{0,3600}4400|WAREN[\s\S]{0,3000}INLAND[\s\S]{0,3600}4400/i.test(text);
}

function hasVisible5400State(text: string) {
  return /INLAND[\s\S]{0,3000}WAREN[\s\S]{0,4200}5400|WAREN[\s\S]{0,3000}INLAND[\s\S]{0,4200}5400/i.test(text);
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

async function compactSetupText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto|Einkauf|Purchase|Sales|Verkauf|INLAND|WAREN|4400|5400|Page Inspection|Seitenpr|Source Table|Table ID|Page ID|Field|Feld|Neue|New|Liste bearbeiten|Edit List|Bearbeiten|Edit/i
      ],
      maxLines: 280,
      maxLineLength: 260
    })
  );
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = clean(await frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''));
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
    partialInlandWarenVisible: hasPartialInlandWarenRow(text),
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
      .slice(0, 32),
    screenshotQa: {
      safeInstance: snapshot.safeInstance,
      safeCompany: snapshot.safeCompany,
      page314Context: snapshot.page314Context,
      dangerousDialogVisible: snapshot.dangerousDialogVisible,
      partialInlandWarenVisible: snapshot.partialInlandWarenVisible,
      visible4400State: snapshot.visible4400State,
      visible5400State: snapshot.visible5400State
    },
    internallyProves: 'Read-only Page 314 context for General Posting Setup in playthru / UNIVERSAARL-DE.',
    doesNotProve: [
      'No purchase account value was written.',
      'No General Posting Setup row was changed.',
      'No VAT setup was changed.',
      'No master data, document draft, Preview Posting or Posting was created.'
    ],
    finalScreenshotStatus: 'diagnosis-evidence',
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
      const html = element as HTMLElement;
      const rect = html.getBoundingClientRect();
      return {
        text: normalize(html.innerText || html.textContent),
        aria: normalize(html.getAttribute('aria-label')),
        title: normalize(html.getAttribute('title')),
        controlName: normalize(html.getAttribute('controlname')),
        role: normalize(html.getAttribute('role')),
        tag: html.tagName.toLowerCase(),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    };
    const interesting =
      /Buchungsmatrix|General Posting Setup|Gesch[a-z]*ftsbuchungsgruppe|Geschaeftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto|Einkauf|Purchase|INLAND|WAREN|4400|5400|Neu|New|Liste bearbeiten|Edit List|Bearbeiten|Edit|Karte|Card|More options|Weitere Optionen|Page Inspection|Seitenpr/i;
    const entries = [...document.querySelectorAll('th,tr,td,[role="row"],[role="gridcell"],[role="columnheader"],button,[role="button"],a,input,textarea,[aria-label],[title]')]
      .filter(visible)
      .map(snapshot)
      .filter((entry) => interesting.test(`${entry.text} ${entry.aria} ${entry.title} ${entry.controlName}`))
      .slice(0, 240);
    return {
      headers: entries.filter((entry) => entry.role === 'columnheader' || entry.tag === 'th' || /Sortieren nach|Sort by/i.test(`${entry.title} ${entry.aria}`)),
      rows: entries.filter((entry) => entry.role === 'row' || entry.tag === 'tr' || /INLAND|WAREN|4400|5400/i.test(entry.text)),
      actions: entries.filter((entry) => /button|menuitem|link/i.test(`${entry.role} ${entry.tag}`) || /Neu|New|Liste bearbeiten|Edit List|Bearbeiten|Edit|Karte|Card|Weitere Optionen|More options/i.test(`${entry.text} ${entry.aria} ${entry.title}`)),
      inputs: entries.filter((entry) => /input|textarea|textbox|combobox/i.test(`${entry.tag} ${entry.role}`)),
      all: entries
    };
  });
}

async function openPage314(page: Page) {
  await page.goto(buildTargetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1800);
  const text = await safeText(page);
  return {
    safeInstance: instancePathIsTarget(page.url()),
    safeCompany: companyParamIsTarget(page.url()),
    page314Context: hasPage314Context(text),
    dangerousDialogVisible: await dangerousDialogVisible(page),
    text
  };
}

async function openPageInspection(page: Page) {
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(2200);
  const text = await safeText(page);
  const compact = await compactSetupText(page);
  const joined = `${text}\n${compact}`;
  return {
    opened: /Page Inspection|Inspect pages and data|Page ID|Page Name|Page Type|Source Table|Table ID|Seitenpr|Seitenuberprufung|Seitenueberpruefung/i.test(joined),
    hasPage314Signal: /314|Buchungsmatrix|General Posting Setup/i.test(joined),
    hasSourceTableSignal: /Source Table|Table ID|Gen\.? Posting Setup|General Posting Setup|Buchungsmatrix/i.test(joined),
    hasPurchaseAccountSignal: /Wareneinkaufskonto|Purchase Account|Purch\. Account|Einkaufskonto/i.test(joined)
  };
}

test('TARGET-057 Page 314 purchase account Page Inspection read-only gate', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  const startContext = await openPage314(page).catch((error) => {
    blockedBy.push(`Business Central Page 314 could not be opened: ${String(error)}`);
    return undefined;
  });

  if (!startContext) {
    await writeJson(RESULT_PATH, buildResult('blocked', actionsTaken, blockedBy, warnings, [], undefined, undefined, undefined));
    return;
  }

  actionsTaken.push('Opened Page 314 Buchungsmatrix Einrichtung / General Posting Setup directly in playthru / UNIVERSAARL-DE.');
  if (!startContext.safeInstance) blockedBy.push(`URL is not in instance ${EXPECTED_INSTANCE}: ${sanitizeEvidenceUrl(page.url())}`);
  if (!startContext.safeCompany) blockedBy.push(`URL is not in company ${TARGET_COMPANY}: ${sanitizeEvidenceUrl(page.url())}`);
  if (!startContext.page314Context) blockedBy.push('Page 314 context is not visible; shell/search-overlay false positive rejected.');
  if (startContext.dangerousDialogVisible) blockedBy.push('A dangerous dialog is visible at Page 314 start.');

  const startSnapshot = await captureState(page, 'target-057-010-page314-start-readonly', 'Page 314 opened read-only before Page Inspection.');

  const bcFrame = await findBcFrame(page, /Buchungsmatrix|General Posting Setup|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe/i);
  let inventory: Awaited<ReturnType<typeof domInventory>> | undefined;
  if (bcFrame) {
    inventory = cleanEvidenceValue(await domInventory(bcFrame.frame));
    await writeJson(path.join(EVIDENCE_DIR, 'target-057-020-page314-dom-inventory.json'), inventory);
    actionsTaken.push('Captured visible Page 314 row/header/action/input inventory without clicking New, Edit List or Card actions.');
  } else {
    blockedBy.push('No Business Central frame with Page 314 text was found for DOM inventory.');
  }

  const pageInspection = await openPageInspection(page);
  actionsTaken.push('Attempted Ctrl+Alt+F1 Page Inspection from Page 314 context.');
  if (await dangerousDialogVisible(page)) blockedBy.push('A dangerous dialog appeared after Page Inspection shortcut.');

  const inspectionSnapshot = await captureState(page, 'target-057-030-pageinspection-attempt', 'After Ctrl+Alt+F1 Page Inspection attempt.', {
    pageInspection
  });

  await openPage314(page).catch((error) => blockedBy.push(`Final reopen proof failed: ${String(error)}`));
  actionsTaken.push('Reopened Page 314 after Page Inspection attempt as read-only final proof.');
  const reopenSnapshot = await captureState(page, 'target-057-040-page314-reopen-proof', 'Final Page 314 reopen proof after read-only diagnostics.');

  const fieldTruth = {
    page314Visible: Boolean(startSnapshot.page314Context && reopenSnapshot.page314Context),
    partialInlandWarenVisible: Boolean(startSnapshot.partialInlandWarenVisible || reopenSnapshot.partialInlandWarenVisible),
    visible4400State: Boolean(startSnapshot.visible4400State || reopenSnapshot.visible4400State),
    visible5400State: Boolean(startSnapshot.visible5400State || reopenSnapshot.visible5400State),
    pageInspectionOpened: pageInspection.opened,
    pageInspectionHasPage314Signal: pageInspection.hasPage314Signal,
    pageInspectionHasSourceTableSignal: pageInspection.hasSourceTableSignal,
    pageInspectionHasPurchaseAccountSignal: pageInspection.hasPurchaseAccountSignal,
    domInventoryHasPurchaseAccountSignal:
      inventory?.all.some((entry) => /Wareneinkaufskonto|Purchase Account|Purch\. Account|Einkaufskonto/i.test(`${entry.text} ${entry.aria} ${entry.title} ${entry.controlName}`)) ??
      false,
    domInventoryHasInlandWaren4400:
      inventory?.rows.some((entry) => /INLAND/i.test(entry.text)) &&
      inventory?.rows.some((entry) => /WAREN/i.test(entry.text)) &&
      inventory?.rows.some((entry) => /4400/i.test(entry.text))
  };
  await writeJson(path.join(EVIDENCE_DIR, 'target-057-field-truth-summary.json'), fieldTruth);

  if (!fieldTruth.partialInlandWarenVisible) blockedBy.push('The INLAND / WAREN row was not visible enough for field-truth evidence.');
  if (!fieldTruth.visible4400State) warnings.push('The existing 4400 partial state was not visibly proven in the compact screenshot text.');
  if (!fieldTruth.pageInspectionOpened) blockedBy.push('Page Inspection did not open a usable technical pane from Page 314.');
  if (!fieldTruth.pageInspectionHasPurchaseAccountSignal && !fieldTruth.domInventoryHasPurchaseAccountSignal) {
    blockedBy.push('Wareneinkaufskonto / Purchase Account field context was not identified in Page Inspection or DOM inventory.');
  }
  if (!fieldTruth.visible5400State) {
    warnings.push('5400 remains not visibly proven as persisted on the INLAND / WAREN row.');
  }

  const observed = blockedBy.length === 0;
  const resultStatus = observed ? 'observed-readonly-field-truth' : 'blocked';
  const screenshots = [
    `${EVIDENCE_DIR_REL}/target-057-010-page314-start-readonly.png`,
    `${EVIDENCE_DIR_REL}/target-057-030-pageinspection-attempt.png`,
    `${EVIDENCE_DIR_REL}/target-057-040-page314-reopen-proof.png`
  ];

  await writeJson(RESULT_PATH, buildResult(resultStatus, actionsTaken, blockedBy, warnings, screenshots, fieldTruth, startSnapshot, inspectionSnapshot));
  await writeText(
    'README.md',
    [
      '# TARGET-057 General Posting Setup Page Inspection Read-only Gate',
      '',
      `Status: ${resultStatus}`,
      '',
      'This evidence is a technical read-only gate for Page 314 in playthru / UNIVERSAARL-DE.',
      'It did not click New, Edit List, Card, Copy or any posting/setup write action.',
      '',
      'Key learning:',
      `- Page 314 visible: ${fieldTruth.page314Visible}`,
      `- INLAND / WAREN visible: ${fieldTruth.partialInlandWarenVisible}`,
      `- Existing 4400 state visible: ${fieldTruth.visible4400State}`,
      `- 5400 visible: ${fieldTruth.visible5400State}`,
      `- Page Inspection opened: ${fieldTruth.pageInspectionOpened}`,
      `- Purchase Account field context found: ${fieldTruth.pageInspectionHasPurchaseAccountSignal || fieldTruth.domInventoryHasPurchaseAccountSignal}`,
      '',
      'Boundary:',
      '- No setup value was written.',
      '- No master data, document draft, Preview Posting, Posting, Payment or API shortcut occurred.'
    ].join('\n')
  );
});

function buildResult(
  resultStatus: 'observed-readonly-field-truth' | 'blocked',
  actionsTaken: string[],
  blockedBy: string[],
  warnings: string[],
  screenshots: string[],
  fieldTruth?: Record<string, unknown>,
  startSnapshot?: Record<string, unknown>,
  inspectionSnapshot?: Record<string, unknown>
) {
  const nextCase =
    resultStatus === 'observed-readonly-field-truth'
      ? 'TARGET-058-GENERAL-POSTING-SETUP-PURCHASE-ACCOUNT-CONTROLLED-WRITE-GATE'
      : 'TARGET-058-GENERAL-POSTING-SETUP-PURCHASE-ACCOUNT-ROUTE-ESCALATION-OR-PARK-DECISION';
  return {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-general-posting-setup-pageinspection-readonly',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 314 Buchungsmatrix Einrichtung / General Posting Setup',
    url: startSnapshot?.url ?? '',
    actionsTaken,
    actionsNotTaken: [
      'No New action clicked.',
      'No Copy action clicked.',
      'No Edit List action clicked.',
      'No Card action clicked for editing.',
      'No value 5400 typed.',
      'No General Posting Setup value written.',
      'No VAT setup changed.',
      'No posting group setup changed.',
      'No master data created.',
      'No document or draft created.',
      'No Preview Posting executed.',
      'No Posting executed.',
      'No Payment executed.',
      'No API shortcut used.',
      'No company switch.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    fieldTruth,
    screenshots,
    proved:
      resultStatus === 'observed-readonly-field-truth'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Page 314 General Posting Setup was opened read-only.',
            'The INLAND / WAREN row and Purchase Account field context were technically identified without editing.',
            'Page 314 was reopened after diagnostics without a dangerous dialog.',
            'No setup value, master data, document draft, Preview Posting, Posting, Payment or API shortcut occurred.'
          ]
        : [
            'Business Central did not execute any setup write, master data change, document draft, Preview Posting, Posting, Payment or API shortcut.',
            'The read-only gate produced a blocker instead of repeating the rejected list-edit geometry route.'
          ],
    notProved: [
      'No Wareneinkaufskonto 5400 setup value was written.',
      'No General Posting Setup row completeness is proven for posting readiness.',
      'No VAT Posting Setup is proven.',
      'No Inventory Posting Setup is proven.',
      'No posting readiness, Preview Posting, G/L Entries, VAT Entries or Value Entries are proven.',
      'No final SKR04, tax advisor or German compliance claim is proven.'
    ],
    blockedBy,
    warnings,
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noVatSetupChange: true,
      noInventoryPostingSetupChange: true,
      noPayment: true,
      noNewClicked: true,
      noEditListClicked: true,
      no5400Typed: true
    },
    sourceRefs: [
      {
        title: 'Microsoft Learn - Posting group setup',
        url: 'https://learn.microsoft.com/en-us/dynamics365/business-central/finance-posting-groups',
        use: 'General Posting Setup combines business and product posting groups and maps them to G/L accounts.'
      }
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-056 selected a read-only Page Inspection gate because 5400 write routes through old cell/list edit attempts were exhausted and must not be repeated.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Stable page/table/field truth is required before any controlled setup write can be attempted.',
      lookaheadReviewed: [
        {
          caseId: CASE_ID,
          status: resultStatus === 'observed-readonly-field-truth' ? 'ready-after-current' : 'blocked',
          reason:
            resultStatus === 'observed-readonly-field-truth'
              ? 'Read-only field truth was captured.'
              : 'Field truth was not sufficient for a safe write gate.'
        },
        {
          caseId: nextCase,
          status: 'ready-next',
          reason:
            resultStatus === 'observed-readonly-field-truth'
              ? 'A later write gate can be prepared, but still needs explicit Smart Decision before writing.'
              : 'A route escalation or park decision avoids repeating old Page 314 cell-edit failures.'
        },
        {
          caseId: 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION',
          status: 'needs-setup-first',
          reason: 'VAT setup remains parked until General Posting Setup purchase account is solved or consciously parked.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Process preflight requires foundation posting setup readiness first.'
        },
        {
          caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
          status: 'needs-setup-first',
          reason: 'Foundation cannot be marked ready while the Page 314 purchase account route is unresolved.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed-readonly-field-truth'
          ? 'It is the narrow next gate from read-only field truth to a still-controlled write decision.'
          : 'It prevents another blind UI retry and forces a safer route decision.',
      risksBeforeNextCase: [
        'Do not type 5400 without an explicit controlled write gate.',
        'Do not repeat TARGET-032O list-edit geometry.',
        'Do not claim posting readiness from Page Inspection alone.'
      ],
      requiredPreparation: ['Review TARGET-057 fieldTruth and screenshots.', 'Keep Preview Posting and Posting locked.']
    },
    requiresReview: resultStatus !== 'observed-readonly-field-truth',
    safeToFinalizeState: true,
    statePatch: {
      lastRunSummary: {
        lastCaseId: CASE_ID,
        lastResultStatus: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        summary:
          resultStatus === 'observed-readonly-field-truth'
            ? 'TARGET-057 captured read-only Page 314 field truth for General Posting Setup purchase account context.'
            : 'TARGET-057 blocked safely; Page 314 purchase account field truth remains insufficient and old list-edit routes must not be repeated.',
        nextCase
      }
    },
    nextCase
  };
}
