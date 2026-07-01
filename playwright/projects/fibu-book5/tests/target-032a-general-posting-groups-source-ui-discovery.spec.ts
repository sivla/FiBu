import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-032A-GENERAL-POSTING-GROUPS-SOURCE-AND-UI-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-032a-general-posting-groups-source-and-ui-discovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-032A-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  expectedTitle: RegExp;
  requiredSignals: RegExp[];
  include: RegExp;
  visiblePurpose: string;
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked' | 'rejected';
  url: string;
  screenshot: string;
  textFile: string;
  metadataFile: string;
  signals: string[];
  blockedBy: string[];
};

const probes: Probe[] = [
  {
    id: 'general-business-posting-groups',
    pageId: 312,
    label: 'Geschaeftsbuchungsgruppen / Gen. Business Posting Groups',
    expectedTitle: /Gen\. Business Posting Groups|Geschaeftsbuchungsgruppen|Gesch[a-z]*ftsbuchungsgruppen/i,
    requiredSignals: [/Code/i, /Beschreibung|Description/i],
    include: /Gen\. Business Posting Groups|Geschaeftsbuchungsgruppen|Gesch[a-z]*ftsbuchungsgruppen|Code|Beschreibung|Description|INLAND|Neu|New|Liste bearbeiten|Edit List/i,
    visiblePurpose:
      'Hier werden allgemeine Geschaeftsbuchungsgruppen gepflegt. Sie beschreiben den Geschaeftspartner-Kontext fuer die Buchungsmatrix.'
  },
  {
    id: 'general-product-posting-groups',
    pageId: 313,
    label: 'Produktbuchungsgruppen / Gen. Product Posting Groups',
    expectedTitle: /Gen\. Product Posting Groups|Produktbuchungsgruppen/i,
    requiredSignals: [/Code/i, /Beschreibung|Description/i],
    include: /Gen\. Product Posting Groups|Produktbuchungsgruppen|Code|Beschreibung|Description|WAREN|Neu|New|Liste bearbeiten|Edit List/i,
    visiblePurpose:
      'Hier werden allgemeine Produktbuchungsgruppen gepflegt. Sie beschreiben, was verkauft oder eingekauft wird.'
  },
  {
    id: 'general-posting-setup',
    pageId: 314,
    label: 'Buchungsmatrix Einrichtung / General Posting Setup',
    expectedTitle: /General Posting Setup|Buchungsmatrix/i,
    requiredSignals: [
      /Gen\. Bus\. Posting Group|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe/i,
      /Gen\. Prod\. Posting Group|Produktbuchungsgruppe/i,
      /Sales Account|Verkaufskonto|Warenverkaufskonto/i,
      /Purch\. Account|Purchase Account|Einkaufskonto|Wareneinkaufskonto/i
    ],
    include: /General Posting Setup|Buchungsmatrix|Gen\.|Posting Group|Buchungsgruppe|Sales Account|Purchase Account|Verkauf|Einkauf|Code|Account|Konto|4400|5400|INLAND|WAREN|Neu|New|Liste bearbeiten|Edit List/i,
    visiblePurpose:
      'Die Buchungsmatrix verbindet Geschaefts- und Produktbuchungsgruppen mit Sachkonten wie Verkaufs- und Einkaufskonto.'
  }
];

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

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

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function hasDangerousDialog(text: string) {
  return /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Loschen\?|Ship and Invoice|Liefern und fakturieren|Preview Posting|Buchungsvorschau|Apply\?|Anwenden\?|Fertig stellen|Finish/i.test(
    text
  );
}

function visibleWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action is visible but was not clicked.' : '',
    /Edit|Bearbeiten|Liste bearbeiten|Edit List/i.test(text) ? 'Edit/List action is visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting/preview action text is visible but was not clicked.'
      : ''
  ].filter(Boolean);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  const metadataPath = path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json'));
  await writeJson(metadataPath, {
    fileName,
    imagePath,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
  return metadataPath;
}

async function probePage(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  const targetUrl = buildPlaythruUrl(probe.pageId);
  await page.goto(targetUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1800);

  const rawText = clean(await pageText(page));
  const compact = clean(
    await compactPageText(page, {
      include: [probe.include],
      maxLines: 110,
      maxLineLength: 220
    })
  );
  const text = `${compact}\n${rawText}`;
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = hasDangerousDialog(text);
  const missingSignals = [
    !probe.expectedTitle.test(text) ? `Expected page title not visible for ${probe.label}.` : '',
    ...probe.requiredSignals.map((signal) => (!signal.test(text) ? `Missing signal ${signal.toString()} on ${probe.label}.` : '')),
    !safeContext ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.` : '',
    dangerousDialog ? 'Dangerous dialog/action signal visible; no confirmation performed.' : ''
  ].filter(Boolean);
  const status = !safeContext || dangerousDialog ? 'blocked' : missingSignals.length === 0 ? 'observed' : 'rejected';
  const screenshot = `target-032a-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = path.join(EVIDENCE_DIR, `${probe.id}.txt`);
  const signals = (compact || rawText)
    .split('\n')
    .filter((line) => line.length > 0)
    .slice(0, 50);

  await writeText(textFile, compact || rawText.slice(0, 5000));
  const metadataPath = await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    status: status === 'observed' ? 'universaarl-readonly-page-proof' : status,
    step: probe.visiblePurpose,
    screenshotQa: {
      titleVisible: probe.expectedTitle.test(text),
      requiredSignalsVisible: probe.requiredSignals.map((signal) => ({ signal: signal.toString(), visible: signal.test(text) })),
      safeInstance: instancePathIsTarget(currentUrl),
      safeCompany: companyParamIsTarget(currentUrl),
      dangerousDialogVisible: dangerousDialog,
      accepted: status === 'observed'
    },
    whatAUserSees: probe.visiblePurpose,
    importantUi: signals.slice(0, 16),
    internallyProves:
      status === 'observed'
        ? `${probe.label} is visible read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `This screenshot is not sufficient proof for ${probe.label}.`,
    doesNotProve: [
      'No row was created.',
      'No list was edited.',
      'No setup value was changed.',
      'No master data, Preview Posting, Posting or ledger trace exists.'
    ],
    finalScreenshotStatus: status === 'observed' ? 'book-context-candidate' : 'rejected'
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot: `playwright/projects/fibu-book5/img/${screenshot}`,
    textFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${path.basename(textFile)}`,
    metadataFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${path.basename(metadataPath)}`,
    signals,
    blockedBy: missingSignals
  };
}

test('TARGET-032A read-only General Posting Groups and setup UI discovery', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const results: ProbeResult[] = [];
  for (let index = 0; index < probes.length; index += 1) {
    results.push(await probePage(page, probes[index], index + 1));
  }

  const observed = results.filter((entry) => entry.status === 'observed');
  const notObserved = results.filter((entry) => entry.status !== 'observed');
  const allWarnings = Array.from(new Set(results.flatMap((entry) => visibleWarnings(entry.signals.join('\n')))));
  const nextCase =
    notObserved.length === 0
      ? 'TARGET-032B-GENERAL-POSTING-GROUPS-CONTROLLED-WRITE-GATE'
      : 'TARGET-032A-GENERAL-POSTING-GROUPS-SOURCE-AND-UI-DISCOVERY-FOLLOWUP';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-general-posting-groups-readonly-ui-discovery',
    resultStatus: notObserved.length === 0 ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Page 312 General Business Posting Groups read-only.',
      'Opened Page 313 General Product Posting Groups read-only.',
      'Opened Page 314 General Posting Setup read-only.',
      'Captured screenshot QA and compact visible text for each page.'
    ],
    actionsNotTaken: [
      'No New/Neu action clicked.',
      'No Edit/List edit action clicked.',
      'No setup value changed.',
      'No General Business Posting Group written.',
      'No General Product Posting Group written.',
      'No General Posting Setup row written.',
      'No VAT setup changed.',
      'No master data created.',
      'No document or draft created.',
      'No Preview Posting executed.',
      'No Posting executed.',
      'No API shortcut used.',
      'No company switch.'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    pages: results,
    screenshots: results.map((entry) => entry.screenshot),
    proved: [
      `${observed.length}/3 target pages were accepted as read-only UI proof in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
      ...observed.map((entry) => `${entry.label} is visible with required page signals.`),
      'No setup value, master data, draft, Preview Posting, Posting or API shortcut was executed.'
    ],
    notProved: [
      'No General Business Posting Group INLAND was created or verified as saved.',
      'No General Product Posting Group WAREN was created or verified as saved.',
      'No General Posting Setup row INLAND/WAREN with 4400/5400 was created.',
      'No posting readiness, Preview Posting, G/L Entries, VAT Entries or Value Entries are proven.',
      'No final SKR04, tax advisor or German compliance claim is proven.',
      ...notObserved.map((entry) => `${entry.label}: ${entry.blockedBy.join('; ')}`)
    ],
    blockedBy: notObserved.flatMap((entry) => entry.blockedBy),
    warnings: [
      ...allWarnings,
      'Visibility of Page 312/313/314 is only a prerequisite for a later controlled setup write.',
      'Candidate codes INLAND and WAREN plus accounts 4400/5400 remain not written in this case.'
    ],
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
      noSearch: true,
      readOnlyDirectPageRoutes: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-032 selected read-only/source-backed UI discovery before any General Posting Setup write. TARGET-030 and TARGET-031B already proved specific INLAND vendor/customer posting groups.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'The direct Page 312/313/314 UI context is the missing dependency before deciding whether a small write gate can create INLAND, WAREN and the first INLAND/WAREN Buchungsmatrix row.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-032B-GENERAL-POSTING-GROUPS-CONTROLLED-WRITE-GATE',
          status: notObserved.length === 0 ? 'ready-next' : 'needs-ui-discovery-first',
          reason:
            notObserved.length === 0
              ? 'All three required setup surfaces are visible read-only and can feed a narrow Smart Decision write gate.'
              : 'At least one required setup surface is not accepted yet; writing would be unsafe.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'ready-after-current',
          reason: 'Dimensions can resume after posting group setup direction is clear.'
        },
        {
          caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation still lacks General Posting Setup, VAT matrix and dimensions status.'
        },
        {
          caseId: 'TARGET-035-MASTER-DATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data remains locked until posting groups, VAT and dimensions are sufficient.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        notObserved.length === 0
          ? 'It is now safe to design a narrow setup write gate because the required pages were observed without changing data.'
          : 'The follow-up keeps the work on missing UI proof instead of guessing a setup route.',
      risksBeforeNextCase: [
        'Do not create master data yet.',
        'Do not run Preview Posting or Posting.',
        'Do not claim posting readiness from setup page visibility.',
        'Do not write Page 314 before the write gate defines exact fields and fallback.'
      ],
      requiredPreparation:
        notObserved.length === 0
          ? [
              'Write gate must define exact fields: Code/Description on Page 312, Code/Description on Page 313, and INLAND/WAREN with 4400/5400 on Page 314.',
              'Write gate must include reopen proof and stop if list-edit controls are ambiguous.'
            ]
          : ['Review rejected page screenshots and recover only the missing surface.']
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032A-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-032a-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032A-result.json`,
      ...results.map((entry) => entry.screenshot),
      ...results.map((entry) => entry.metadataFile)
    ],
    requiresReview: notObserved.length > 0,
    safeToFinalizeState: notObserved.length === 0,
    statePatch:
      notObserved.length === 0
        ? {
            current: {
              activeCase: nextCase,
              activeArea: 'universaarl-general-posting-groups-controlled-write-gate',
              nextStep:
                'Run TARGET-032B as a narrow Smart Decision write gate for General Business/Product Posting Groups and the first General Posting Setup row. No master data, Preview Posting or Posting.'
            },
            activeCase: {
              status: 'done',
              resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032A-result.json`,
              nextCase
            },
            coverage: {
              latestGeneralPostingGroupsUiDiscovery: {
                caseId: CASE_ID,
                status: 'observed',
                pages: results.map((entry) => ({ pageId: entry.pageId, label: entry.label, status: entry.status })),
                resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032A-result.json`
              }
            }
          }
        : {},
    reason:
      notObserved.length === 0
        ? 'Page 312, Page 313 and Page 314 are visible read-only. TARGET-032B can be prepared as a narrow setup write gate.'
        : 'At least one required setup page was not accepted; setup write remains locked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-032A General Posting Groups Source/UI Discovery',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Beobachtete Seiten',
      '',
      ...observed.map((entry) => `- ${entry.label}`),
      '',
      '## Grenzen',
      '',
      '- Keine neue Zeile.',
      '- Keine Listenbearbeitung.',
      '- Keine Buchungsmatrixzeile.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.',
      '- Sichtbare Einrichtung ist noch keine Buchungsfaehigkeit.',
      ''
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(notObserved, notObserved.map((entry) => `${entry.id}: ${entry.blockedBy.join('; ')}`).join('\n')).toHaveLength(0);
});
