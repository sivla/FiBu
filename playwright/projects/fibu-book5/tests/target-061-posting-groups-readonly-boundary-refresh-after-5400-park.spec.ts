import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(240_000);

const CASE_ID = 'TARGET-061-POSTING-GROUPS-READONLY-BOUNDARY-REFRESH-AFTER-5400-PARK';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-061-posting-groups-readonly-boundary-refresh-after-5400-park';
const EVIDENCE_DIR_REL = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-061-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  title: RegExp;
  expectedText: RegExp;
  include: RegExp;
  purpose: string;
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked' | 'rejected';
  url: string;
  screenshot: string;
  screenshotMetadata: string;
  textFile: string;
  textSignals: string[];
  visibleWarnings: string[];
  reason: string;
};

const probes: Probe[] = [
  {
    id: 'general-posting-setup',
    pageId: 314,
    label: 'Buchungsmatrix Einrichtung / General Posting Setup',
    title: /General Posting Setup|Buchungsmatrix/i,
    expectedText: /Gen\. Bus\. Posting Group|Geschaeftsbuchungsgruppe|Geschaftsbuchungsgruppe|Sales Account|Purchase Account|Warenverkaufskonto|Wareneinkaufskonto|INLAND|WAREN/i,
    include: /General Posting Setup|Buchungsmatrix|Geschaeftsbuchungsgruppe|Geschaftsbuchungsgruppe|Produktbuchungsgruppe|Sales Account|Purchase Account|Warenverkaufskonto|Wareneinkaufskonto|INLAND|WAREN|4400|5400|Neu|New|Bearbeiten|Edit/i,
    purpose: 'Aktueller Boundary-Snapshot fuer Page 314 nach dem geparkten Wareneinkaufskonto-5400-Schreibweg.'
  },
  {
    id: 'vat-business-posting-groups',
    pageId: 470,
    label: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    title: /MwSt\.-?Geschaeftsbuchungsgruppen|MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|USt\.-?Geschaeftsbuchungsgruppen|VAT Business Posting Groups/i,
    expectedText: /\bCode\b|Beschreibung|Description|MwSt|VAT/i,
    include: /MwSt|USt|VAT|Geschaeftsbuchungsgruppen|Geschaftsbuchungsgruppen|Business Posting Groups|Code|Beschreibung|Description|Neu|New|Bearbeiten|Edit/i,
    purpose: 'Read-only Sichtbarkeit der MwSt.-Geschaeftsbuchungsgruppen als Vorbedingung fuer spaetere VAT-Gates.'
  },
  {
    id: 'vat-posting-setup',
    pageId: 472,
    label: 'MwSt.-Buchungsmatrix Einr. / VAT Posting Setup',
    title: /VAT Posting Setup|MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix/i,
    expectedText: /VAT Bus\. Posting Group|VAT Prod\. Posting Group|MwSt|USt|VAT %|Sales VAT|Purchase VAT|Code|Beschreibung|Description/i,
    include: /VAT Posting Setup|MwSt|USt|VAT|Posting Group|Buchungsgruppe|VAT %|Sales VAT|Purchase VAT|Konto|Account|Code|Beschreibung|Description|Neu|New|Bearbeiten|Edit/i,
    purpose: 'Read-only Snapshot der VAT Posting Setup Matrix ohne neue Zeile und ohne Wertschreibung.'
  },
  {
    id: 'customer-posting-groups',
    pageId: 110,
    label: 'Debitorenbuchungsgruppen / Customer Posting Groups',
    title: /Customer Posting Groups|Debitorenbuchungsgruppen/i,
    expectedText: /Receivables Account|Forderungskonto|Debitorensammelkonto|Code|Beschreibung|Description/i,
    include: /Customer Posting Groups|Debitorenbuchungsgruppen|Receivables|Forderung|Code|Beschreibung|Description|Account|Konto|Neu|New|Bearbeiten|Edit/i,
    purpose: 'Read-only Boundary fuer Debitorenbuchungsgruppen; keine Einrichtungsaenderung.'
  },
  {
    id: 'vendor-posting-groups',
    pageId: 111,
    label: 'Kreditorenbuchungsgruppen / Vendor Posting Groups',
    title: /Vendor Posting Groups|Kreditorenbuchungsgruppen/i,
    expectedText: /Payables Account|Verbindlichkeitskonto|Verbindlichkeiten-Konto|Kreditorensammelkonto|Code|Beschreibung|Description/i,
    include: /Vendor Posting Groups|Kreditorenbuchungsgruppen|Payables|Verbindlichkeit|Code|Beschreibung|Description|Account|Konto|Neu|New|Bearbeiten|Edit/i,
    purpose: 'Read-only Boundary fuer Kreditorenbuchungsgruppen; keine Einrichtungsaenderung.'
  }
];

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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|originAuthorityValidator|upn:/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
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

function containsDangerousDialog(text: string) {
  return /\b(Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Liefern und fakturieren|Delete|Loeschen|Loschen|Apply|Anwenden|Finish|Fertig stellen|OK|Yes|Ja|Post|Buchen|New|Neu|Edit|Bearbeiten)\b/i.test(
    text
  );
}

function visibleWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Liste bearbeiten/i.test(text) ? 'Edit/Bearbeiten action may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting/preview action text may be visible but was not clicked.'
      : ''
  ].filter(Boolean);
}

function hasVisibleGeneralPosting4400(text: string) {
  return /INLAND[\s\S]{0,3000}WAREN[\s\S]{0,3600}4400|WAREN[\s\S]{0,3000}INLAND[\s\S]{0,3600}4400/i.test(text);
}

function hasVisibleGeneralPosting5400(text: string) {
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

async function pageTextWithFrames(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`);
}

async function visibleDialogText(page: Page) {
  const chunks: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"], .modal-dialog, .ms-Dialog-main');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      chunks.push(clean(await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => '')));
    }
  }
  return chunks.filter(Boolean).join('\n');
}

async function screenshotWithMetadata(
  page: Page,
  fileName: string,
  metadata: Record<string, unknown>
) {
  const imagePath = path.join(EVIDENCE_DIR, fileName);
  const repoRelativeImagePath = `${EVIDENCE_DIR_REL}/${fileName}`;
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: imagePath, fullPage: false });
  const metadataPath = path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json'));
  await writeJson(metadataPath, {
    fileName,
    imagePath: repoRelativeImagePath,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
  return {
    imagePath: repoRelativeImagePath,
    metadataPath: `${EVIDENCE_DIR_REL}/${path.basename(metadataPath)}`
  };
}

async function probePage(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  await page.goto(buildPlaythruUrl(probe.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape').catch(() => undefined);

  const rawText = await pageTextWithFrames(page);
  const dialogText = await visibleDialogText(page);
  const compact = clean(
    await compactPageText(page, {
      include: [probe.include],
      maxLines: 140,
      maxLineLength: 220
    }).catch(() => '')
  );
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = containsDangerousDialog(dialogText);
  const matchedExpectedText = probe.title.test(rawText) && probe.expectedText.test(rawText);
  const status = !safeContext || dangerousDialog ? 'blocked' : matchedExpectedText ? 'observed' : 'rejected';
  const textSignals = (compact || rawText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 50);
  const filePrefix = `target-061-${String(index).padStart(3, '0')}-${probe.id}`;
  const screenshot = `${filePrefix}.png`;
  const textFile = `${filePrefix}.txt`;

  await writeText(textFile, compact || rawText.slice(0, 7000));
  const shot = await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    step: probe.purpose,
    status,
    screenshotQa: {
      safeInstance: instancePathIsTarget(currentUrl),
      safeCompany: companyParamIsTarget(currentUrl),
      expectedPageTextVisible: matchedExpectedText,
      dangerousDialogVisible: dangerousDialog,
      visibleGeneralPosting4400: probe.pageId === 314 ? hasVisibleGeneralPosting4400(rawText) : undefined,
      visibleGeneralPosting5400: probe.pageId === 314 ? hasVisibleGeneralPosting5400(rawText) : undefined,
      acceptedForBookDraft: status === 'observed',
      finalProof: false
    },
    visibleLearning: textSignals.slice(0, 18),
    importantUi: [
      'Direct page URL inside playthru.',
      'Company parameter UNIVERSAARL-DE.',
      'No New/Edit/Delete/Post/Preview action clicked.'
    ],
    internallyProves:
      status === 'observed'
        ? `${probe.label} is reachable read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `The route did not produce accepted visible ${probe.label} proof.`,
    doesNotProve: [
      'No setup value was written.',
      'No posting group or VAT correctness is proven.',
      'No document preview, posting or ledger trace exists.',
      'No final German compliance claim is proven.'
    ],
    finalScreenshotStatus: status === 'observed' ? 'draft-candidate' : 'rejected'
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot: shot.imagePath,
    screenshotMetadata: shot.metadataPath,
    textFile: `${EVIDENCE_DIR_REL}/${textFile}`,
    textSignals,
    visibleWarnings: visibleWarnings(rawText),
    reason: !safeContext
      ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
      : dangerousDialog
        ? 'Dangerous dialog text was visible; no dialog was confirmed.'
        : matchedExpectedText
          ? 'Expected read-only page text is visible.'
          : 'Expected page title/text was not visible enough for accepted proof.'
  };
}

test('TARGET-061 refreshes posting-group setup boundary read-only after 5400 park', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const startedAt = new Date().toISOString();
  const smartDecision = {
    action: 'read-only-posting-group-boundary-refresh',
    effectiveAction: false,
    whyNow:
      'TARGET-059 parked the Page 314 Purch. Account 5400 route and TARGET-060 classified Foundation as partial. A fresh read-only boundary snapshot is safer than a VAT/setup write gate.',
    sourceEvidence: [
      'TARGET-057 Page 314 field truth.',
      'TARGET-058 no-persist blocker for 5400 through the tested list-edit/header route.',
      'TARGET-059 park decision.',
      'TARGET-060 Foundation limitation classification.'
    ],
    fieldsChanged: [],
    fieldsLeftUntouched: [
      'All General Posting Setup fields.',
      'All VAT setup fields.',
      'All Customer/Vendor Posting Group fields.',
      'All master data and documents.'
    ],
    risk: 'Read-only visibility can be mistaken for setup correctness or posting readiness.',
    fallback: 'If a page route is rejected, keep it blocked and select a narrow route-discovery/decision case instead of writing setup.',
    beginnerBookUse:
      'The book can explain that posting groups and posting setup pages are setup maps; seeing them does not mean the company is ready to post.'
  };

  const results: ProbeResult[] = [];
  for (let index = 0; index < probes.length; index += 1) {
    results.push(await probePage(page, probes[index], index + 1));
  }

  const observed = results.filter((entry) => entry.status === 'observed');
  const blocked = results.filter((entry) => entry.status !== 'observed');
  const page314 = results.find((entry) => entry.id === 'general-posting-setup');
  const nextCase =
    blocked.length > 0
      ? 'TARGET-062-POSTING-GROUPS-BOUNDARY-ROUTE-DECISION-AFTER-READONLY-REFRESH'
      : 'TARGET-062-POSTING-GROUPS-BOUNDARY-DECISION-AFTER-READONLY-REFRESH';
  const resultStatus = blocked.length > 0 ? 'partially-completed' : 'observed';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-w1-posting-groups-readonly-boundary-refresh',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Posting group and posting setup read-only boundary pages',
    url: page314?.url ?? '',
    actionsTaken: [
      'Opened Business Central with stored auth.',
      'Opened target pages by direct page URL in playthru / UNIVERSAARL-DE.',
      'Captured compact page text, screenshot and screenshot-QA metadata for each target page route.',
      'Wrote read-only result JSON.'
    ],
    actionsNotTaken: [
      'No New action clicked.',
      'No Edit/List Edit action clicked.',
      'No Delete/Copy action clicked.',
      'No setup value typed or changed.',
      'No VAT setup changed.',
      'No General Posting Setup changed.',
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
    screenshots: results.map((entry) => entry.screenshot),
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      `${observed.length}/${probes.length} target setup pages were accepted as read-only visible boundary evidence.`,
      'No setup value, master data, document draft, Preview Posting, Posting, Payment or API shortcut occurred.',
      ...observed.map((entry) => `${entry.label} was visible read-only.`)
    ],
    notProved: [
      'W1 Foundation is not posting-ready.',
      'No complete INLAND/WAREN/4400/5400 General Posting Setup row is proven.',
      'No Purch. Account 5400 persistence is proven unless visible in Page 314 screenshot QA.',
      'No VAT Posting Setup correctness is proven.',
      'No Customer/Vendor Posting Group account correctness is proven.',
      'No German tax, SKR04 completeness, Preview Posting, Posting, G/L Entry, VAT Entry or ledger trace is proven.',
      ...blocked.map((entry) => `${entry.label}: ${entry.reason}`)
    ],
    changedFiles: [
      `${EVIDENCE_DIR_REL}/TARGET-061-result.json`,
      `${EVIDENCE_DIR_REL}/README.md`,
      `${EVIDENCE_DIR_REL}/target-061-*.txt`,
      `${EVIDENCE_DIR_REL}/target-061-*.png`,
      `${EVIDENCE_DIR_REL}/target-061-*.screenshot.json`
    ],
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/TARGET-061-result.json`,
      `${EVIDENCE_DIR_REL}/README.md`,
      ...results.flatMap((entry) => [entry.screenshot, entry.screenshotMetadata, entry.textFile])
    ],
    pages: results,
    smartDecision,
    blockedBy: blocked.map((entry) => `${entry.id}: ${entry.reason}`),
    warnings: Array.from(new Set(results.flatMap((entry) => entry.visibleWarnings))),
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noVatSetupChange: true,
      noGeneralPostingSetupChange: true,
      noCustomerPostingGroupChange: true,
      noVendorPostingGroupChange: true,
      readOnlyDirectPageRoutes: true
    },
    completedScope: observed.map((entry) => entry.label),
    remainingScope: blocked.map((entry) => entry.label),
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-060 selected a fresh read-only boundary refresh because TARGET-059 parked the 5400 Purch. Account route and older TARGET-028 screenshots are not current enough.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'The run produced current setup-boundary evidence without writing setup. Any next write/process case still needs a separate decision.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: 'ready-next',
          reason:
            blocked.length > 0
              ? 'At least one boundary route needs classification before any write gate.'
              : 'All target boundary pages were visible enough to decide the next Foundation move locally.'
        },
        {
          caseId: 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION',
          status: 'blocked',
          reason: 'VAT writes remain locked until a separate Smart Decision defines values and source support.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'blocked',
          reason: 'O2C remains blocked while Foundation is not posting-ready.'
        },
        {
          caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
          status: 'needs-setup-first',
          reason: 'Foundation readiness cannot be claimed from read-only screenshots.'
        },
        {
          caseId: 'TARGET-LOOKFEEL-001-LIST-SEARCH-SORT-FILTER',
          status: 'ready-after-current',
          reason: 'Useful for the book after current Foundation boundary decisions, but not a setup dependency.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        blocked.length > 0
          ? 'It turns the refreshed screenshot set into a concrete route/boundary decision without writing setup.'
          : 'It turns the refreshed screenshot set into the next local Foundation decision without pretending posting readiness.',
      risksBeforeNextCase: [
        'Do not treat read-only page visibility as setup correctness.',
        'Do not unlock VAT/General Posting Setup writes without a case-specific Smart Decision.',
        'Do not start master data, documents, Preview Posting or Posting before Foundation readiness is proven.'
      ],
      requiredPreparation: [
        'Review TARGET-061 screenshot QA metadata.',
        'Keep 5400/VAT limitations in notProved until a controlled write/reopen proof exists.'
      ]
    },
    nextCase,
    requiresReview: false,
    safeToFinalizeState: true,
    statePatch: {
      lastRunSummary: {
        lastCaseId: CASE_ID,
        lastResultStatus: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        summary:
          blocked.length > 0
            ? 'TARGET-061 refreshed the Universaarl posting-group setup boundary read-only with partial route coverage; setup remains locked.'
            : 'TARGET-061 refreshed the Universaarl posting-group setup boundary read-only; setup remains locked and Foundation is not posting-ready.',
        nextCase
      }
    },
    reason:
      blocked.length > 0
        ? 'Read-only boundary refresh completed partially; blocked pages require route decision.'
        : 'Read-only boundary refresh observed without setup changes.'
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-061 Posting Groups Read-only Boundary Refresh',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Akzeptierte Seiten',
      '',
      ...observed.map((entry) => `- ${entry.label}`),
      '',
      '## Grenzen',
      '',
      '- Keine Setup-Aenderung.',
      '- Keine Stammdaten.',
      '- Kein Belegentwurf.',
      '- Keine Preview und keine Buchung.',
      '- Keine API-Abkuerzung.',
      '- Sichtbarkeit ist noch keine fachliche Konten-, USt- oder Posting-Bereitschaft.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(results.every((entry) => instancePathIsTarget(entry.url) && companyParamIsTarget(entry.url))).toBe(true);
});
