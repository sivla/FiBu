import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(240_000);

const CASE_ID = 'TARGET-032C-GENERAL-POSTING-SETUP-MATRIX-ROW-ROUTE-DIAGNOSIS';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-032c-general-posting-setup-matrix-route-diagnosis';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-032C-result.json');

type UiCell = {
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

function clean(value: string) {
  return value
    .replace(/\u00c3\u00bc/g, 'ue')
    .replace(/\u00c3\u00b6/g, 'oe')
    .replace(/\u00c3\u00a4/g, 'ae')
    .replace(/\u00c3\u009f/g, 'ss')
    .replace(/\u00c3\u009c/g, 'Ue')
    .replace(/\u00c3\u0096/g, 'Oe')
    .replace(/\u00c3\u0084/g, 'Ae')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
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

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeEvidenceUrl(rawUrl: string) {
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

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsForbiddenDialog(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Liefern und fakturieren|Delete\?|Loeschen\?|Loschen\?|Apply\?|Anwenden\?|Mandant wechseln|Company switch/i.test(
    text
  );
}

function labelOf(cell: Pick<UiCell, 'text' | 'aria' | 'title' | 'controlName'>) {
  return clean([cell.text, cell.aria, cell.title, cell.controlName].filter(Boolean).join(' '));
}

function firstHeader(headers: UiCell[], pattern: RegExp) {
  return headers.find((header) => pattern.test(labelOf(header)));
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

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = clean(await frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''));
    if (expected.test(bodyText)) return { frame, bodyText };
  }
  throw new Error(`Kein BC-Frame mit ${expected} gefunden.`);
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function capturePageState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const include =
    /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Sales Account|Wareneinkaufskonto|Purchase Account|Gutschrift|Credit|Vorauszahlung|Prepayment|INLAND|WAREN|4400|5400|Liste bearbeiten|Edit List|Neu|New/i;
  const compact = clean(
    await compactPageText(page, {
      include: [include],
      maxLines: 220,
      maxLineLength: 240
    })
  );
  const text = await safeText(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    hasDangerousDialog: containsForbiddenDialog(text),
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: 314,
    page: 'Buchungsmatrix Einrichtung / General Posting Setup',
    step,
    importantUi: (compact || text)
      .split('\n')
      .filter((line) => line.length > 0)
      .slice(0, 24),
    screenshotQa: {
      safeInstance: instancePathIsTarget(page.url()),
      safeCompany: companyParamIsTarget(page.url()),
      dangerousDialogVisible: containsForbiddenDialog(text)
    },
    internallyProves: 'Page 314 state and visible column context in playthru / UNIVERSAARL-DE.',
    doesNotProve: [
      'No saved INLAND/WAREN matrix row.',
      'No VAT setup.',
      'No Inventory Posting Setup.',
      'No master data.',
      'No Preview Posting.',
      'No Posting.'
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
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const snapshot = (element: Element) => {
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
    const headers = [...document.querySelectorAll('th,[role="columnheader"],a[title^="Sortieren nach"],a[title^="Sort by"]')]
      .filter(visible)
      .map(snapshot);
    const rows = [...document.querySelectorAll('[role="row"],tr')]
      .filter(visible)
      .map((row) => {
        const rowSnapshot = snapshot(row);
        const cells = [...row.querySelectorAll('[role="gridcell"],td,input,textarea,[role="textbox"],[role="combobox"]')]
          .filter(visible)
          .map(snapshot);
        return { ...rowSnapshot, cells };
      });
    const controls = [...document.querySelectorAll('input,textarea,select,[role="textbox"],[role="combobox"],[role="gridcell"],td,th,button,[role="button"],[role="menuitem"],[aria-label],[title],[controlname]')]
      .filter(visible)
      .map(snapshot);
    const actions = [...document.querySelectorAll('button,[role="button"],a,[role="menuitem"],[aria-label],[title]')]
      .filter(visible)
      .map(snapshot)
      .filter((entry) => /Neu|New|Liste bearbeiten|Edit List|Bearbeiten|Edit|Ansicht|View|Suchen|Search|Filter|Personalisieren|Personalize|Information|Info|Spalte|Column|Mehr|More|Fokus|Focus/i.test(`${entry.text} ${entry.aria} ${entry.title} ${entry.controlName}`))
      .slice(0, 80);
    return { headers, rows: rows.slice(0, 80), controls: controls.slice(0, 160), actions };
  });
}

async function hoverHeaders(page: Page, headers: UiCell[]) {
  const candidates = headers.filter((header) =>
    /Geschaeft|Gesch[a-z]*ft|Business|Produkt|Product|Verkauf|Sales|Einkauf|Purchase|Purch|Gutschrift|Credit|Vorauszahlung|Prepayment/i.test(labelOf(header))
  );
  const results = [];
  for (const header of candidates.slice(0, 10)) {
    await page.mouse.move(header.x + Math.max(4, Math.floor(header.width / 2)), header.y + Math.max(4, Math.floor(header.height / 2)));
    await page.waitForTimeout(650);
    const text = await safeText(page);
    results.push({
      header: labelOf(header),
      tooltipSignals: text
        .split('\n')
        .filter((line) => /Sortieren nach|Sort by|Warenverkaufskonto|Sales Account|Wareneinkaufskonto|Purchase Account|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe/i.test(line))
        .slice(0, 12)
    });
  }
  return results;
}

async function closeTeachingTips(page: Page) {
  for (const frame of page.frames()) {
    const clicked = await frame
      .evaluate(() => {
        const textPattern = /Info uber Buchungsmatrix|Info .ber Buchungsmatrix|Tour starten|Hilfe anzeigen|teaching tip/i;
        const normalize = (value: string | null | undefined) =>
          String(value ?? '')
            .replace(/\s+/g, ' ')
            .trim();
        const candidates = [...document.querySelectorAll<HTMLElement>('*')]
          .filter((element) => textPattern.test(normalize(element.innerText || element.textContent)))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { element, rect, area: rect.width * rect.height };
          })
          .filter(({ rect }) => rect.width > 120 && rect.height > 60)
          .sort((left, right) => left.area - right.area);
        for (const candidate of candidates) {
          let container: HTMLElement | null = candidate.element;
          for (let depth = 0; depth < 8 && container; depth += 1) {
            const rect = container.getBoundingClientRect();
            if (rect.width >= 180 && rect.width <= 700 && rect.height >= 80 && rect.height <= 500) {
              const buttons = [...container.querySelectorAll<HTMLElement>('button,[role="button"]')].filter((button) => {
                const buttonRect = button.getBoundingClientRect();
                return buttonRect.width > 0 && buttonRect.height > 0;
              });
              const closeButton =
                buttons.find((button) => /Close|Schliessen|Dismiss|Verwerfen|Got it|Verstanden|x/i.test(normalize(button.innerText || button.getAttribute('aria-label')))) ??
                (document.elementFromPoint(rect.right - 24, rect.top + 24)?.closest('button,[role="button"]') as HTMLElement | null);
              if (closeButton) {
                closeButton.click();
                return true;
              }
            }
            container = container.parentElement;
          }
        }
        return false;
      })
      .catch(() => false);
    if (clicked) {
      await page.waitForTimeout(650);
      return true;
    }
  }
  const text = await safeText(page);
  if (/Info uber Buchungsmatrix|Tour starten|Hilfe anzeigen/i.test(text)) {
    const viewport = page.viewportSize();
    if (viewport) {
      await page.mouse.click(Math.min(360, viewport.width - 24), Math.min(viewport.height - 235, viewport.height - 24)).catch(() => undefined);
      await page.waitForTimeout(650);
      const after = await safeText(page);
      return !/Info uber Buchungsmatrix|Tour starten|Hilfe anzeigen/i.test(after);
    }
  }
  return false;
}

function classifyMapping(headers: UiCell[]) {
  const genBus = firstHeader(headers, /Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Gen\.?\s*Bus/i);
  const genProd = firstHeader(headers, /Produktbuchungsgruppe|Gen\.?\s*Prod/i);
  const sales = firstHeader(headers, /Warenverkaufskonto|Sales Account/i);
  const purchase = firstHeader(headers, /Wareneinkaufskonto|Purchase Account|Purch\.?\s*Account/i);
  const salesCredit = firstHeader(headers, /Verkaufsgutschrift|Sales Credit/i);
  const salesPrepayment = firstHeader(headers, /Verkaufsvorauszahlung|Sales Prepayment/i);
  const purchaseCredit = firstHeader(headers, /Einkaufsgutschrift|Purchase Credit|Purch\.?\s*Credit/i);
  const purchasePrepayment = firstHeader(headers, /Einkaufsvorauszahlung|Purchase Prepayment|Purch\.?\s*Prepayment/i);
  const required = { genBus, genProd, sales, purchase };
  const requiredVisible = Object.values(required).every(Boolean);
  const ordered =
    Boolean(genBus && genProd && sales && purchase) &&
    genBus!.x < genProd!.x &&
    genProd!.x < sales!.x &&
    sales!.x < purchase!.x;
  return {
    requiredVisible,
    ordered,
    required,
    intermediateHeaders: {
      salesCredit,
      salesPrepayment,
      purchaseCredit,
      purchasePrepayment
    },
    trustedForFutureWrite: requiredVisible && ordered,
    reason: requiredVisible && ordered
      ? 'Required Page 314 headers are visible and geometrically ordered; a future write case can map fields by header geometry, not by blind input index.'
      : 'Required Page 314 headers are not all visibly mapped; keep write blocked.'
  };
}

test('TARGET-032C Page 314 General Posting Setup matrix route diagnosis', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  await page.goto(buildPlaythruUrl(314).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  const teachingTipClosed = await closeTeachingTips(page);
  await page.waitForTimeout(1800);

  const url = page.url();
  const pageBody = await safeText(page);
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(/Buchungsmatrix|General Posting Setup/i.test(pageBody)).toBe(true);
  expect(containsForbiddenDialog(pageBody)).toBe(false);

  await capturePageState(page, 'target-032c-010-page314-initial', 'Initial Page 314 read-only context.');

  const { frame } = await findBcFrame(page, /Buchungsmatrix|General Posting Setup/i);
  const inventory = cleanEvidenceValue(await domInventory(frame));
  const mapping = classifyMapping(inventory.headers);
  const hoverResults = cleanEvidenceValue(await hoverHeaders(page, inventory.headers));
  await capturePageState(page, 'target-032c-020-page314-after-header-hover', 'Page 314 after header hover diagnosis.', {
    mapping,
    hoverResults
  });

  const hasTargetRow = /INLAND[\s\S]{0,900}WAREN/i.test(pageBody);
  const writeRouteStatus = mapping.trustedForFutureWrite ? 'trusted-future-write-route' : 'blocked-needs-followup';
  const resultStatus = mapping.trustedForFutureWrite ? 'observed' : 'blocked';
  const nextCase = mapping.trustedForFutureWrite
    ? 'TARGET-032D-GENERAL-POSTING-SETUP-MATRIX-CONTROLLED-WRITE-GATE'
    : 'TARGET-032C-GENERAL-POSTING-SETUP-MATRIX-ROW-ROUTE-DIAGNOSIS-FOLLOWUP';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-general-posting-setup-matrix-route-diagnosis',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 314 Buchungsmatrix Einrichtung / General Posting Setup',
    url: sanitizeEvidenceUrl(page.url()),
    actionsTaken: [
      'Opened Page 314 directly in playthru / UNIVERSAARL-DE.',
      'Dismissed safe teaching tips if present.',
      'Captured current Page 314 screenshot and compact text.',
      'Inventoried visible headers, rows, controls and non-destructive actions.',
      'Hovered relevant headers to capture tooltip/sort/header signals.',
      'Stopped without New, Edit List, field fill, Preview Posting or Posting.'
    ],
    actionsNotTaken: [
      'No General Posting Setup value written.',
      'No New action clicked.',
      'No Edit List action clicked.',
      'No VAT setup changed.',
      'No Inventory Posting Setup changed.',
      'No master data created.',
      'No document or draft created.',
      'No Preview Posting executed.',
      'No Posting executed.',
      'No Payment executed.',
      'No API shortcut used.',
      'No company switch.'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    hasTargetRow,
    teachingTipClosed,
    writeRouteStatus,
    mapping,
    inventorySummary: {
      headerCount: inventory.headers.length,
      rowCount: inventory.rows.length,
      controlCount: inventory.controls.length,
      actionCount: inventory.actions.length,
      relevantHeaders: inventory.headers
        .filter((header) => /Gesch|Business|Produkt|Product|Verkauf|Sales|Einkauf|Purchase|Purch|Gutschrift|Credit|Vorauszahlung|Prepayment/i.test(labelOf(header)))
        .map((header) => ({ ...header, label: labelOf(header) }))
    },
    hoverResults,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-032c-010-page314-initial.png',
      'playwright/projects/fibu-book5/img/target-032c-020-page314-after-header-hover.png'
    ],
    proved: [
      'Page 314 opened in playthru / UNIVERSAARL-DE.',
      mapping.trustedForFutureWrite
        ? 'Required headers for General Business Posting Group, General Product Posting Group, Sales Account and Purchase Account are visible and geometrically ordered.'
        : 'Required Page 314 field mapping is not trusted enough for a future write.',
      'No setup, master data, document draft, Preview Posting, Posting, Payment or API shortcut occurred.'
    ],
    notProved: [
      'No INLAND/WAREN/4400/5400 matrix row is saved by this case.',
      'No VAT Posting Setup is proven.',
      'No Inventory Posting Setup is proven.',
      'No posting readiness, Preview Posting, G/L Entries, VAT Entries or Value Entries are proven.',
      'No final SKR04, tax advisor or German compliance claim is proven.'
    ],
    blockedBy: mapping.trustedForFutureWrite ? [] : [mapping.reason],
    warnings: [
      'This case is read-only diagnosis. A later write case must still use before/after/reopen proof.',
      'Intermediate credit and prepayment columns are visible or expected around the sales/purchase account fields; do not use blind input index order.',
      'General Posting Setup alone does not make the company posting-ready.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noVatSetupChange: true,
      noInventoryPostingSetupChange: true,
      noPayment: true,
      noNewClicked: true,
      noEditListClicked: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-032B created/reverified INLAND and WAREN but blocked Page 314 because account column mapping was unsafe.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Page 314 is the narrow remaining setup route blocker before a controlled General Posting Setup write.',
      lookaheadReviewed: [
        {
          caseId: CASE_ID,
          status: 'ready-next',
          reason: 'It directly addresses the remaining Page 314 field-mapping blocker without writing setup.'
        },
        {
          caseId: 'TARGET-032D-GENERAL-POSTING-SETUP-MATRIX-CONTROLLED-WRITE-GATE',
          status: mapping.trustedForFutureWrite ? 'ready-next' : 'needs-ui-discovery-first',
          reason: mapping.trustedForFutureWrite
            ? 'Header geometry is good enough to prepare a controlled write case.'
            : 'Write remains unsafe until field mapping is trusted.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'ready-after-current',
          reason: 'Dimensions should wait until Page 314 is written or consciously parked.'
        },
        {
          caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation still needs matrix/VAT/dimensions status before readiness.'
        },
        {
          caseId: 'TARGET-035-MASTER-DATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data remains locked until posting groups, VAT and dimensions are sufficient.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: mapping.trustedForFutureWrite
        ? 'A controlled Page 314 write gate is now better than more diagnosis because exact target headers are visible.'
        : 'Another diagnosis/fallback is safer than typing account values into uncertain columns.',
      risksBeforeNextCase: [
        'Do not create master data yet.',
        'Do not run Preview Posting or Posting.',
        'Do not claim posting readiness from posting groups alone.',
        'Do not type Page 314 account values without before/after/reopen proof.'
      ],
      requiredPreparation: mapping.trustedForFutureWrite
        ? ['Use header geometry, not input index, to target Page 314 fields in TARGET-032D.']
        : ['Use Page Inspection or personalization to discover exact Page 314 field IDs before any write.']
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032C-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.json`,
      'playwright/projects/fibu-book5/img/target-032c-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032C-result.json`,
      'playwright/projects/fibu-book5/img/target-032c-010-page314-initial.png',
      'playwright/projects/fibu-book5/img/target-032c-020-page314-after-header-hover.png'
    ],
    requiresReview: false,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeCase: nextCase,
        activeArea: mapping.trustedForFutureWrite
          ? 'universaarl-general-posting-setup-matrix-controlled-write'
          : 'universaarl-general-posting-setup-matrix-route-diagnosis',
        nextStep: mapping.trustedForFutureWrite
          ? 'Run TARGET-032D as controlled Page 314 write gate using trusted header geometry.'
          : 'Keep Page 314 blocked and run a narrower Page Inspection/personalization follow-up.'
      },
      activeCase: {
        status: resultStatus,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032C-result.json`,
        nextCase
      },
      coverage: {
        latestGeneralPostingSetupMatrixRouteDiagnosis: {
          caseId: CASE_ID,
          status: resultStatus,
          writeRouteStatus,
          trustedForFutureWrite: mapping.trustedForFutureWrite,
          resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032C-result.json`
        }
      }
    },
    reason: mapping.reason
  };

  await writeJson(path.join(EVIDENCE_DIR, '020-dom-inventory.json'), inventory);
  await writeJson(path.join(EVIDENCE_DIR, '030-header-mapping.json'), mapping);
  await writeJson(path.join(EVIDENCE_DIR, '040-hover-results.json'), hoverResults);
  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-032C General Posting Setup Matrix Route Diagnosis',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      `- Write Route Status: ${writeRouteStatus}`,
      `- Trusted for future write: ${mapping.trustedForFutureWrite ? 'yes' : 'no'}`,
      `- Reason: ${mapping.reason}`,
      '',
      '## Grenzen',
      '',
      '- Keine Buchungsmatrixwerte geschrieben.',
      '- Kein Neu.',
      '- Keine Liste-bearbeiten-Aktion.',
      '- Keine Stammdaten.',
      '- Keine Belege.',
      '- Keine Preview und keine Buchung.',
      '- Keine USt- oder Lagerbuchungseinrichtung.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
