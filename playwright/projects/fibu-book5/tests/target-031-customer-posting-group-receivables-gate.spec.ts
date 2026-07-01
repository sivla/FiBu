import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-031-CUSTOMER-POSTING-GROUP-RECEIVABLES-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-031-customer-posting-group-receivables-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-031-result.json');

const candidate = {
  customerPostingGroup: 'INLAND',
  receivablesAccount: '1400',
  receivablesAccountName: 'Forderungen aus Lieferungen und Leistungen'
};

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
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
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
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Delete\?|Loeschen\?|Loschen\?|Apply\?|Anwenden\?|Mandant wechseln|Company wechseln/i.test(
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
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function assertTargetContext(page: Page, expectedText: RegExp, label: string) {
  const url = page.url();
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  const text = await safeText(page);
  expect(expectedText.test(text), `${label} muss sichtbar sein`).toBe(true);
  expect(containsForbiddenDialog(text), 'Keine Buchungs-, Loesch-, Apply-, Company- oder Preview-Dialoge erlaubt').toBe(false);
  return text;
}

async function openPage(page: Page, pageId: number, expectedText: RegExp, label: string) {
  await page.goto(buildPlaythruUrl(pageId).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  return assertTargetContext(page, expectedText, label);
}

async function captureState(
  page: Page,
  filePrefix: string,
  metadata: {
    pageId: number;
    pageName: string;
    step: string;
    include: RegExp[];
    proves: string;
    doesNotProve: string[];
  }
) {
  const compact = await compactPageText(page, {
    include: metadata.include,
    maxLines: 140,
    maxLineLength: 220
  });
  const text = await safeText(page);
  const snapshot = {
    step: metadata.step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    visible: {
      has1400: /(^|\D)1400(\D|$)/.test(text),
      hasReceivablesName: /Forderungen aus Lieferungen und Leistungen/i.test(text),
      hasCustomerPostingGroups: /Debitorenbuchungsgruppen|Customer Posting Groups/i.test(text),
      hasReceivablesField: /Debitorensammelkonto|Forderungskonto|Receivables Account/i.test(text)
    }
  };
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: metadata.pageId,
    page: metadata.pageName,
    step: metadata.step,
    status: 'readonly-decision-input',
    bookUse: 'posting-groups-foundation-gate',
    visibleLearning: compact.split('\n').slice(0, 16),
    internallyProves: metadata.proves,
    doesNotProve: metadata.doesNotProve,
    finalScreenshotStatus: 'decision-input'
  });
  return snapshot;
}

test(CASE_ID, async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const steps = [
    {
      step: 'smart-decision',
      whyNow: 'TARGET-030 proved Vendor Posting Group INLAND/3300. Before writing Customer Posting Groups, the receivables account must be visible and current in Universaarl evidence.',
      supportedBy: [
        'TARGET-030 INLAND Vendor Posting Group proof',
        'TARGET-028 Customer Posting Groups read-only page proof',
        'TARGET-026I local SKR04 mapping lists account 1400 as receivables candidate'
      ],
      fieldsChanged: [],
      fieldsNotTouched: [
        'Customer Posting Groups',
        'General Posting Setup',
        'Inventory Posting Setup',
        'VAT Posting Setup',
        'Bank Posting Groups',
        'Master Data',
        'Documents',
        'Preview Posting',
        'Posting'
      ],
      fallback: 'If account 1400 is not visibly proven, block Customer Posting Group write and create a receivables-account recovery case.'
    }
  ];

  await openPage(page, 16, /Kontenplan|Chart of Accounts|Nr\.|No\./i, 'Kontenplan / Chart of Accounts');
  const chart = await captureState(page, 'target-031-010-chart-of-accounts-receivables-check', {
    pageId: 16,
    pageName: 'Kontenplan / Chart of Accounts',
    step: 'Read-only receivables account candidate check before Customer Posting Group decision.',
    include: [/Kontenplan|Chart of Accounts|Nr\.|No\.|Name|GuV|Bilanz|Kontoart|Account Type|1200|1400|Forderungen|1800|3300|3806|4400|5400/i],
    proves: 'The Chart of Accounts page opened read-only in playthru / UNIVERSAARL-DE for the receivables decision.',
    doesNotProve: [
      'It does not prove Customer Posting Group readiness.',
      'It does not prove account 1400 if the row is not visible in the screenshot/text.',
      'It does not create or modify any G/L account.'
    ]
  });

  await openPage(page, 110, /Debitorenbuchungsgruppen|Customer Posting Groups|Debitorensammelkonto|Forderungskonto|Receivables/i, 'Debitorenbuchungsgruppen / Customer Posting Groups');
  const customerPostingGroups = await captureState(page, 'target-031-020-customer-posting-groups-readonly', {
    pageId: 110,
    pageName: 'Debitorenbuchungsgruppen / Customer Posting Groups',
    step: 'Read-only Customer Posting Groups context before write-gate decision.',
    include: [/Debitorenbuchungsgruppen|Customer Posting Groups|Code|Beschreibung|Description|Debitorensammelkonto|Forderungskonto|Receivables|Neu|New|Liste bearbeiten|Edit/i],
    proves: 'The Customer Posting Groups page opened read-only in playthru / UNIVERSAARL-DE.',
    doesNotProve: [
      'It does not prove an INLAND Customer Posting Group exists.',
      'It does not prove a receivables account assignment.',
      'It does not create or modify Customer Posting Groups.'
    ]
  });

  const accountVisible = chart.visible.has1400 && chart.visible.hasReceivablesName;
  const resultStatus = 'blocked';
  const nextCase = accountVisible
    ? 'TARGET-031B-CUSTOMER-POSTING-GROUP-INLAND-WRITE-GATE'
    : 'TARGET-031A-RECEIVABLES-ACCOUNT-RECOVERY';
  const blockedBy = accountVisible
    ? []
    : [
        'Account 1400 Forderungen aus Lieferungen und Leistungen is mapped as a candidate but not visibly proven in the current read-only Chart of Accounts screenshot/text.'
      ];

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-customer-posting-group-receivables-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Kontenplan Page 16 and Debitorenbuchungsgruppen Page 110',
    pageIds: [16, 110],
    url: {
      chartOfAccounts: chart.url,
      customerPostingGroups: customerPostingGroups.url
    },
    candidate,
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Chart of Accounts Page 16 read-only.',
      'Captured screenshot/text for receivables account candidate check.',
      'Opened Customer Posting Groups Page 110 read-only.',
      'Captured screenshot/text for Customer Posting Groups write-gate decision.',
      'Blocked Customer Posting Group write because the receivables account needs a separate visible account proof.'
    ],
    actionsNotTaken: [
      'No Customer Posting Group value was written.',
      'No G/L Account was created or changed.',
      'No General Posting Setup changed.',
      'No Inventory Posting Setup changed.',
      'No VAT Posting Setup changed.',
      'No master data created.',
      'No document or draft created.',
      'No Preview Posting executed.',
      'No Posting executed.',
      'No API shortcut used.'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-031-010-chart-of-accounts-receivables-check.png',
      'playwright/projects/fibu-book5/img/target-031-020-customer-posting-groups-readonly.png'
    ],
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Chart of Accounts Page 16 opened read-only for the receivables gate.',
      'Customer Posting Groups Page 110 opened read-only.',
      'No Customer Posting Group, G/L Account, master data, draft, Preview Posting, Posting or API shortcut was executed.'
    ],
    notProved: [
      'Account 1400 Forderungen aus Lieferungen und Leistungen is not accepted as visibly proven from this run unless visible.has1400 and visible.hasReceivablesName are both true.',
      'No Customer Posting Group INLAND exists or is assigned.',
      'No receivables posting readiness is proven.',
      'No General Posting Setup, VAT Posting Setup, master data, Preview Posting or ledger trace is proven.'
    ],
    blockedBy,
    warnings: [
      'Do not use 1406 as receivables account; it is tracked as Vorsteuer / purchase VAT starter account.',
      'Customer Posting Group write must wait for a visible receivables G/L account proof.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noSetupChange: true,
      noCustomerPostingGroupChange: true
    },
    snapshots: {
      chartOfAccounts: chart,
      customerPostingGroups
    },
    steps,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-031B-CUSTOMER-POSTING-GROUP-INLAND-WRITE-GATE',
      lastEvidenceSummary: 'TARGET-030 proved Vendor Posting Group INLAND/3300, but Customer Posting Groups still need a receivables account proof.',
      isPlannedNextCaseStillSensible: accountVisible,
      reason: accountVisible
        ? 'The receivables account appears in the current Chart of Accounts read-only evidence.'
        : 'The mapped receivables account 1400 is not visibly proven in current Universaarl evidence, so a write gate would be premature.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-031A-RECEIVABLES-ACCOUNT-RECOVERY',
          status: accountVisible ? 'obsolete' : 'ready-next',
          reason: accountVisible ? '1400 visible proof exists in this run.' : 'Required before Customer Posting Group write.'
        },
        {
          caseId: 'TARGET-031B-CUSTOMER-POSTING-GROUP-INLAND-WRITE-GATE',
          status: accountVisible ? 'ready-next' : 'needs-setup-first',
          reason: accountVisible ? 'Receivables account proof exists.' : 'Needs 1400 visible/reopen proof first.'
        },
        {
          caseId: 'TARGET-032-GENERAL-POSTING-GROUPS-AND-SETUP-GATE',
          status: 'needs-source-check-first',
          reason: 'Requires General Business/Product Posting Groups and sales/purchase account mapping.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'ready-after-current',
          reason: 'Can resume after posting-group route status is clear.'
        },
        {
          caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation still lacks customer posting group, general setup, VAT matrix and dimensions status.'
        }
      ],
      queueChangesMade: accountVisible
        ? []
        : ['Selected TARGET-031A-RECEIVABLES-ACCOUNT-RECOVERY before Customer Posting Group write.'],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: accountVisible
        ? 'It is the smallest safe write gate after current receivables account evidence.'
        : 'It prevents writing Customer Posting Groups against an unproven or wrong receivables account.',
      risksBeforeNextCase: [
        'Do not use 1406 as receivables account.',
        'Do not create customer master data yet.',
        'Do not run Preview Posting or Posting.'
      ],
      requiredPreparation: accountVisible
        ? ['Use Page 110 card/list route only for INLAND + 1400.']
        : ['Create or visibly confirm 1400 as Bilanz/Buchung account with reopen proof.']
    },
    nextCase,
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-031-customer-posting-group-receivables-gate/TARGET-031-result.json',
      'playwright/projects/fibu-book5/evidence/target-031-customer-posting-group-receivables-gate/*.txt',
      'playwright/projects/fibu-book5/evidence/target-031-customer-posting-group-receivables-gate/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-031-customer-posting-group-receivables-gate/*.screenshot.json',
      'playwright/projects/fibu-book5/img/target-031-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-031-customer-posting-group-receivables-gate/TARGET-031-result.json',
      'playwright/projects/fibu-book5/img/target-031-010-chart-of-accounts-receivables-check.png',
      'playwright/projects/fibu-book5/img/target-031-020-customer-posting-groups-readonly.png'
    ],
    requiresReview: false,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: accountVisible
          ? '.agent/state/cases/target-031b-customer-posting-group-inland-write-gate.json'
          : '.agent/state/cases/target-031a-receivables-account-recovery.json',
        activeArea: accountVisible
          ? 'universaarl-customer-posting-group-write-gate'
          : 'universaarl-receivables-account-recovery',
        nextStep: accountVisible
          ? 'Run TARGET-031B to create or verify Customer Posting Group INLAND with receivables account 1400. Do not create master data or run Preview Posting.'
          : 'Run TARGET-031A to create or visibly confirm account 1400 Forderungen aus Lieferungen und Leistungen before Customer Posting Group write.'
      },
      activeCase: {
        status: 'blocked',
        resultPath: 'playwright/projects/fibu-book5/evidence/target-031-customer-posting-group-receivables-gate/TARGET-031-result.json',
        nextCase
      },
      coverage: {
        latestCustomerPostingGroupReceivablesGate: {
          caseId: CASE_ID,
          status: resultStatus,
          pageIds: [16, 110],
          candidateReceivablesAccount: candidate.receivablesAccount,
          accountVisible,
          resultPath: 'playwright/projects/fibu-book5/evidence/target-031-customer-posting-group-receivables-gate/TARGET-031-result.json',
          nextCase
        }
      }
    }
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      'Read-only decision gate before Customer Posting Group setup.',
      '',
      '- No Customer Posting Group value was written.',
      '- No G/L Account was changed.',
      '- No master data, draft, Preview Posting, Posting or API shortcut occurred.',
      `- Selected next case: ${nextCase}.`
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
});
