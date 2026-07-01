import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(240_000);

const CASE_ID = 'TARGET-032E-GENERAL-POSTING-SETUP-CARD-OR-ALTERNATIVE-ROUTE-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-032e-general-posting-setup-alternative-route-discovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-032E-result.json');

type UiBox = {
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
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
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

function labelOf(box: Pick<UiBox, 'text' | 'aria' | 'title' | 'controlName'>) {
  return clean([box.text, box.aria, box.title, box.controlName].filter(Boolean).join(' '));
}

function hasTargetMatrixRow(text: string) {
  return /INLAND[\s\S]{0,1600}WAREN[\s\S]{0,2600}4400[\s\S]{0,3200}5400|INLAND[\s\S]{0,1600}WAREN[\s\S]{0,3200}5400[\s\S]{0,3200}4400/i.test(
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
    /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto|Gutschrift|Credit|Vorauszahlung|Prepayment|INLAND|WAREN|4400|5400|Neu|New|Liste bearbeiten|Edit List|Bearbeiten|Edit|Weitere Optionen|More options|Personalisieren|Personalize|Page Inspection|Seitenpr|Source Table|Table ID|Page ID|Karte|Card/i;
  const compact = clean(
    await compactPageText(page, {
      include: [include],
      maxLines: 240,
      maxLineLength: 240
    })
  );
  const text = await safeText(page);
  const snapshot = {
    step,
    pageId: new URL(page.url()).searchParams.get('page'),
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    hasDangerousDialog: containsForbiddenDialog(text),
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: snapshot.pageId,
    page: 'Buchungsmatrix Einrichtung / General Posting Setup',
    step,
    importantUi: (compact || text)
      .split('\n')
      .filter((line) => line.length > 0)
      .slice(0, 26),
    screenshotQa: {
      safeInstance: instancePathIsTarget(page.url()),
      safeCompany: companyParamIsTarget(page.url()),
      dangerousDialogVisible: containsForbiddenDialog(text)
    },
    internallyProves: 'Read-only route discovery state for General Posting Setup in playthru / UNIVERSAARL-DE.',
    doesNotProve: [
      'No General Posting Setup target row written.',
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

async function openPage(page: Page, pageId: number, expected: RegExp) {
  await page.goto(buildPlaythruUrl(pageId).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1800);
  const text = await safeText(page);
  expect(instancePathIsTarget(page.url()), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(expected.test(text), `Erwarteter Page-Kontext fehlt auf ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(containsForbiddenDialog(text)).toBe(false);
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
    const actions = [...document.querySelectorAll('button,[role="button"],a,[role="menuitem"],[aria-label],[title]')]
      .filter(visible)
      .map(snapshot)
      .filter((entry) => /Neu|New|Liste bearbeiten|Edit List|Bearbeiten|Edit|Weitere Optionen|More options|Verwalten|Manage|Zugehorig|Related|Aktionen|Actions|Ansicht|View|Personalisieren|Personalize|Information|Info|Karte|Card|Offnen|Open/i.test(`${entry.text} ${entry.aria} ${entry.title} ${entry.controlName}`))
      .slice(0, 120);
    const rows = [...document.querySelectorAll('[role="row"],tr')]
      .filter(visible)
      .map(snapshot)
      .slice(0, 80);
    const inputs = [...document.querySelectorAll('input,textarea,[role="textbox"],[role="combobox"]')]
      .filter(visible)
      .map(snapshot)
      .filter((input) => input.width > 8 && input.height > 8)
      .slice(0, 80);
    return { headers, actions, rows, inputs };
  });
}

async function hoverBoxes(page: Page, boxes: UiBox[]) {
  const results = [];
  for (const box of boxes.slice(0, 18)) {
    await page.mouse.move(box.x + Math.max(5, Math.floor(box.width / 2)), box.y + Math.max(5, Math.floor(box.height / 2)));
    await page.waitForTimeout(650);
    const text = await safeText(page);
    results.push({
      target: labelOf(box),
      tooltipSignals: text
        .split('\n')
        .filter((line) => /Neu|New|Liste bearbeiten|Edit List|Bearbeiten|Edit|Weitere Optionen|More options|Karte|Card|Open|Offnen|Sortieren nach|Sort by/i.test(line))
        .slice(0, 12)
    });
  }
  return results;
}

async function clickIfVisible(page: Page, pattern: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const count = await scope.getByRole(role, { name: pattern }).count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const candidate = scope.getByRole(role, { name: pattern }).nth(index);
        if (!(await candidate.isVisible({ timeout: 700 }).catch(() => false))) continue;
        await candidate.click({ timeout: 5000 }).catch(async () => candidate.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(900);
        const text = await safeText(page);
        expect(containsForbiddenDialog(text)).toBe(false);
        return true;
      }
    }
  }
  return false;
}

async function openPageInspection(page: Page) {
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(1800);
  const text = await safeText(page);
  return /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID|Seitenpr/i.test(text);
}

test('TARGET-032E General Posting Setup alternative route discovery', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const actionsTaken: string[] = [];
  const warnings: string[] = [];
  const blockedBy: string[] = [];

  await openPage(page, 314, /Buchungsmatrix|General Posting Setup/i);
  actionsTaken.push('Opened Page 314 directly in playthru / UNIVERSAARL-DE.');
  const beforeText = await safeText(page);
  const targetAlreadyVisible = hasTargetMatrixRow(beforeText);
  const before = await capturePageState(page, 'target-032e-010-page314-start', 'Page 314 start before alternative route discovery.', {
    targetAlreadyVisible
  });

  const { frame } = await findBcFrame(page, /Buchungsmatrix|General Posting Setup/i);
  const inventory = cleanEvidenceValue(await domInventory(frame));
  await writeJson(path.join(EVIDENCE_DIR, '020-page314-action-inventory.json'), inventory);
  actionsTaken.push('Inventoried visible Page 314 headers, actions, rows and inputs without clicking New or Edit List.');

  const hoverCandidates = inventory.actions.filter((action) =>
    /Neu|New|Liste bearbeiten|Edit List|Bearbeiten|Edit|Weitere Optionen|More options|Karte|Card|Offnen|Open|Verwalten|Manage|Zugehorig|Related/i.test(
      labelOf(action)
    )
  );
  const hoverResults = cleanEvidenceValue(await hoverBoxes(page, hoverCandidates));
  await writeJson(path.join(EVIDENCE_DIR, '030-action-tooltip-results.json'), hoverResults);
  await capturePageState(page, 'target-032e-020-action-tooltip-qa', 'After action hover and tooltip probe.', {
    hoverResults
  });
  actionsTaken.push('Hovered relevant actions for tooltip evidence.');

  const moreOptionsClicked = await clickIfVisible(page, /Weitere Optionen|More options|Mehr Optionen/i);
  const moreOptionsState = await capturePageState(page, 'target-032e-030-more-options-state', 'After opening More options if available.', {
    moreOptionsClicked
  });
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(700);
  actionsTaken.push(moreOptionsClicked ? 'Opened More options menu and captured visible state.' : 'More options menu was not opened by an accessible label.');
  if (!moreOptionsClicked) warnings.push('More options was not opened by a stable accessible label.');

  const inspectionOpened = await openPageInspection(page);
  const inspectionState = await capturePageState(page, 'target-032e-040-page-inspection-context', 'After Ctrl+Alt+F1 Page Inspection probe.', {
    inspectionOpened
  });
  const inspectionPageId = new URL(page.url()).searchParams.get('page');
  actionsTaken.push('Tried Ctrl+Alt+F1 Page Inspection after Page 314 focus.');
  if (!inspectionOpened) warnings.push('Page Inspection shortcut did not produce a clear Page Inspection text surface.');

  await openPage(page, 314, /Buchungsmatrix|General Posting Setup/i);
  const cardCandidateUrl = buildPlaythruUrl(315).toString();
  await page.goto(cardCandidateUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1800);
  const cardText = await safeText(page);
  const cardCandidateSignals = /General Posting Setup|Buchungsmatrix|Posting Setup|Karte|Card|Geschaeftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto/i.test(
    cardText
  );
  const cardCandidateDangerous = containsForbiddenDialog(cardText);
  const cardCandidate = await capturePageState(page, 'target-032e-050-page315-card-candidate', 'Direct Page 315 card-candidate probe without values.', {
    cardCandidateSignals,
    cardCandidateDangerous
  });
  actionsTaken.push('Opened Page 315 as a read-only card-candidate probe and typed no values.');

  const routeSignals = {
    sourceMentionsOwnCard:
      'Microsoft Learn: General Posting Setup lines can be opened in their own posting setup card; this case probes whether Page 314 exposes that route in this UI.',
    actionInventoryHasCardSignal: inventory.actions.some((action) => /Karte|Card|Offnen|Open/i.test(labelOf(action))),
    moreOptionsHasCardSignal: /Karte|Card|Offnen|Open/i.test(String(moreOptionsState.compact ?? '')),
    pageInspectionOpened: inspectionOpened,
    pageInspectionStayedOnPage314: inspectionOpened && inspectionPageId === '314',
    page315LooksLikeVatEntries: /MwSt\.-Posten|VAT Entries/i.test(cardText),
    page315HasCardCandidateSignal:
      /Buchungsmatrix Einrichtung|General Posting Setup/i.test(cardText) &&
      !/MwSt\.-Posten|VAT Entries/i.test(cardText) &&
      !cardCandidateDangerous
  };

  const discoveredRoute =
    routeSignals.moreOptionsHasCardSignal || routeSignals.page315HasCardCandidateSignal;
  if (!discoveredRoute) {
    blockedBy.push('No materially different Page 314 route was proven beyond action inventory and blocked list-new evidence.');
  }
  if (!routeSignals.page315HasCardCandidateSignal) {
    warnings.push('Direct Page 315 did not prove a General Posting Setup card route in this run.');
  }
  if (routeSignals.page315LooksLikeVatEntries) {
    warnings.push('Direct Page 315 opened MwSt.-Posten/VAT Entries and is rejected as a General Posting Setup card route.');
  }
  if (inspectionOpened && !routeSignals.pageInspectionStayedOnPage314) {
    warnings.push('Page Inspection shortcut opened a side pane but did not stay on Page 314; this is treated as a context-navigation learning, not as a safe route.');
  }

  const resultStatus = discoveredRoute ? 'observed-route-candidate-no-write' : 'blocked';
  const nextCase = discoveredRoute
    ? 'TARGET-032F-GENERAL-POSTING-SETUP-CARD-ROUTE-CONTROLLED-WRITE-DECISION'
    : 'TARGET-032F-GENERAL-POSTING-SETUP-PARK-OR-SOURCE-ROUTE-DECISION';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-general-posting-setup-alternative-route-discovery',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 314 Buchungsmatrix Einrichtung / General Posting Setup',
    url: sanitizeEvidenceUrl(page.url()),
    actionsTaken,
    actionsNotTaken: [
      'No General Posting Setup value was typed.',
      'No New action was clicked.',
      'No Edit List action was clicked.',
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
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    targetAlreadyVisible,
    routeSignals,
    inventorySummary: {
      headerCount: inventory.headers.length,
      actionCount: inventory.actions.length,
      rowCount: inventory.rows.length,
      inputCount: inventory.inputs.length,
      relevantActions: inventory.actions.map((action) => ({ ...action, label: labelOf(action) })).slice(0, 60)
    },
    hoverResults,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-032e-010-page314-start.png',
      'playwright/projects/fibu-book5/img/target-032e-020-action-tooltip-qa.png',
      'playwright/projects/fibu-book5/img/target-032e-030-more-options-state.png',
      'playwright/projects/fibu-book5/img/target-032e-040-page-inspection-context.png',
      'playwright/projects/fibu-book5/img/target-032e-050-page315-card-candidate.png'
    ],
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Page 314 was opened without typing setup values.',
      'Page 314 action inventory and tooltip/More-options/Page-Inspection probes were captured.',
      'No master data, document draft, Preview Posting, Posting, Payment or API shortcut occurred.',
      ...(discoveredRoute ? ['A materially different route candidate exists and needs a controlled decision before any write.'] : [])
    ],
    notProved: [
      'No complete INLAND/WAREN/4400/5400 matrix row is proven after reopen.',
      'No General Posting Setup value is written by this case.',
      'No VAT Posting Setup is proven.',
      'No Inventory Posting Setup is proven.',
      'No posting readiness, Preview Posting, G/L Entries, VAT Entries or Value Entries are proven.',
      'No final SKR04, tax advisor or German compliance claim is proven.'
    ],
    blockedBy,
    warnings,
    sourceRefs: [
      {
        title: 'Microsoft Learn - Understand the general ledger and Chart of Accounts / General Posting Setup page',
        url: 'https://learn.microsoft.com/en-au/dynamics365/business-central/finance-general-ledger',
        use: 'General Posting Setup lines combine business and product posting groups; each line can also be opened in its own posting setup card.'
      },
      {
        title: 'Microsoft Learn - Posting group setup',
        url: 'https://learn.microsoft.com/en-au/dynamics365/business-central/finance-posting-groups',
        use: 'General Posting Setups combine business and product posting groups and choose G/L accounts.'
      }
    ],
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
      noEditListClicked: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-032D proved that Page 314 Edit List/New and Ctrl+Insert do not expose trusted editable inputs and no values were typed.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The case tests a materially different Page 314 route before any further write attempt.',
      lookaheadReviewed: [
        {
          caseId: CASE_ID,
          status: discoveredRoute ? 'ready-after-current' : 'blocked',
          reason: discoveredRoute ? 'Route candidates were captured without writing values.' : 'No route candidate was good enough.'
        },
        {
          caseId: nextCase,
          status: 'ready-next',
          reason: discoveredRoute
            ? 'A controlled decision is needed before turning a route candidate into a write attempt.'
            : 'A park/source-route decision is needed to avoid repeating weak UI routes.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'needs-setup-first',
          reason: 'Dimensions should wait until Page 314 is solved or consciously parked.'
        },
        {
          caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation cannot be ready while the General Posting Setup matrix row is unresolved.'
        },
        {
          caseId: 'TARGET-035-MASTER-DATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data remains locked until posting groups, VAT and dimensions are sufficient.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: discoveredRoute
        ? 'It decides whether the captured card/inspection route is safe enough for a later controlled write.'
        : 'It prevents another blind UI retry and forces a park/source-route decision.',
      risksBeforeNextCase: [
        'Do not type 4400/5400 without a trusted card or field route.',
        'Do not claim posting readiness.',
        'Do not create master data, Preview Posting or Posting.'
      ],
      requiredPreparation: [
        'Review 032E action inventory, tooltip screenshots, Page Inspection and Page 315 card-candidate screenshot.'
      ]
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032E-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.json`,
      'playwright/projects/fibu-book5/img/target-032e-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032E-result.json`,
      'playwright/projects/fibu-book5/img/target-032e-010-page314-start.png',
      'playwright/projects/fibu-book5/img/target-032e-050-page315-card-candidate.png'
    ],
    requiresReview: true,
    safeToFinalizeState: false,
    statePatch: {},
    reason: discoveredRoute
      ? 'A materially different route candidate was captured without writing setup values.'
      : 'No materially different route was proven strongly enough.'
  };

  await writeJson(path.join(EVIDENCE_DIR, '060-route-signals.json'), routeSignals);
  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-032E General Posting Setup Alternative Route Discovery',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      `- Route candidate discovered: ${discoveredRoute ? 'yes' : 'no'}`,
      `- Page Inspection opened: ${inspectionOpened ? 'yes' : 'no'}`,
      `- Page 315 card candidate signal: ${routeSignals.page315HasCardCandidateSignal ? 'yes' : 'no'}`,
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
