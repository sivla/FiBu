import { test } from '@playwright/test';

import { compactPageText, pageText, requireBcUrl, waitForBcReady, writeEvidenceText } from '../../../core/bc-helpers';
import { writeJsonEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'P2P-026-PURCHASE-INVOICE-CONTEXT-RESET-PROBE';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FORBIDDEN_DRAFT_NO = '107229';
const EVIDENCE_DIR = 'playwright/projects/fibu-book5/evidence/p2p-026';
const RESULT_PATH = `${EVIDENCE_DIR}/P2P-026-result.json`;

test.use({ storageState: 'playwright/.auth/bc-user.json' });

function cleanBcUrl(pageId?: number) {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(EXPECTED_INSTANCE)) {
    throw new Error(`Configured BC URL does not target ${EXPECTED_INSTANCE}.`);
  }

  url.search = '';
  url.searchParams.set('company', EXPECTED_COMPANY);
  if (pageId) {
    url.searchParams.set('page', String(pageId));
  }
  return url;
}

function isBusinessCentralHost(rawUrl: string) {
  try {
    const host = new URL(rawUrl).hostname;
    return /(^|\.)businesscentral\.dynamics\.com$|(^|\.)bc\.dynamics\.com$/i.test(host);
  } catch {
    return false;
  }
}

function sanitizeEvidenceText(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\b(L[ÃA]¶schen|Anh[ÃA]¤nge|Gr[ÃA]¶[ÃA]Ÿe|r[ÃA]¼ckg[ÃA]¤ngig)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function frameContext(pageUrl: string, frameUrls: string[]) {
  return {
    pageUrl,
    pageUrlHasExpectedInstance: pageUrl.includes(EXPECTED_INSTANCE),
    pageUrlHasExpectedCompany: pageUrl.includes(`company=${EXPECTED_COMPANY}`),
    pageUrlHasFilterOrBookmark: /[?&](filter|bookmark)=/i.test(pageUrl),
    businessCentralFrames: frameUrls
      .filter((url) => isBusinessCentralHost(url))
      .map((url) => ({
        urlSample: url.slice(0, 260),
        hasExpectedInstance: url.includes(EXPECTED_INSTANCE),
        hasExpectedCompany: url.includes(`company=${EXPECTED_COMPANY}`),
        hasFilterOrBookmark: /[?&](filter|bookmark)=/i.test(url),
      })),
  };
}

async function collectSignals(page: Parameters<typeof pageText>[0], label: string) {
  const text = await pageText(page);
  const compactText = sanitizeEvidenceText(await compactPageText(page, {
    include: /Purchase Invoice|Einkaufsrechnung|107229|K10000|Vendor|Kreditor|No\.|Nr\.|Amount|Betrag|Post|Preview/i,
    maxLines: 60,
    maxLineLength: 220,
  }));
  const urls = page.frames().map((frame) => frame.url());
  const currentUrl = page.url();
  const signals = {
    label,
    urlContext: frameContext(currentUrl, urls),
    purchaseInvoicesVisible: /Purchase Invoices|Einkaufsrechnungen/i.test(text),
    purchaseInvoiceSingularVisible: /Purchase Invoice|Einkaufsrechnung/i.test(text),
    forbiddenDraftVisible: new RegExp(FORBIDDEN_DRAFT_NO).test(text),
    vendorTargetVisible: /K10000/i.test(text),
    postVisible: /\bPost\b|\bBuchen\b/i.test(text),
    previewVisible: /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(text),
    possibleDocumentNos: [...new Set([...text.matchAll(/\b(10\d{4,})\b/g)].map((match) => match[1]))].slice(0, 20),
    compactText,
  };

  await writeJsonEvidence(`${EVIDENCE_DIR}/${label}-signals.json`, signals);
  await writeEvidenceText(`${EVIDENCE_DIR}/${label}-text.txt`, compactText || '(no compact text matched)');
  return signals;
}

function resultBase(startedAt: string) {
  return {
    schemaVersion: 1,
    purpose: 'p2p-purchase-invoice-context-reset-probe-result',
    caseId: CASE_ID,
    source: 'playwright-ui-readonly-purchase-invoice-context-reset-probe',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    sourceCompany: EXPECTED_COMPANY,
    startedAt,
    previewPosting: false,
    posted: false,
    setupChanges: [],
    changedRecords: [],
    postedRecords: [],
    flags: {
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noNewClicked: true,
      noVendorOrLineValuesEntered: true,
      noDraftCreated: true,
      noScreenshot: true,
    },
    migrationRelevance: 'helper-only',
    mustRecreateInFinalSandbox: false,
    finalScreenshotNeeded: false,
    statePatch: {},
    evidenceRefs: [
      RESULT_PATH,
      `${EVIDENCE_DIR}/010-direct-page-signals.json`,
      `${EVIDENCE_DIR}/010-direct-page-text.txt`,
    ],
    screenshots: [],
  };
}

function renderReadme(summary: string, status: string) {
  return [
    '# P2P-026 Purchase Invoice Context Reset Probe',
    '',
    `Status: \`${status}\`, \`labor\`, \`read-only\`, \`no-new\`, \`no-preview\`, \`no-post\`.`,
    '',
    '| Datei | Typ | Beweist | Beweist nicht | Status |',
    '|---|---|---|---|---|',
    '| `P2P-026-result.json` | JSON | Kontextklassifikation Purchase Invoices | keine Werteingabe | labor |',
    '| `010-direct-page-signals.json` | JSON | direkte Page-9308-Signale | keine New-Aktion | readonly |',
    '| `010-direct-page-text.txt` | Text | kompakter sichtbarer Kontext | keine Beleganlage | compact |',
    '',
    '## Ergebnis',
    '',
    summary,
    '',
    '## Grenze',
    '',
    '- Kein `New/Neu`.',
    '- Keine Vendor- oder Zeilenwerte.',
    '- Kein Preview Posting.',
    '- Keine Buchung.',
    '- Kein Setup Change.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    status === 'observed'
      ? 'Separaten Werteingabe-Case planen, der vor Eingabe erneut beweist, dass kein verbotener Altbeleg sichtbar ist.'
      : 'Purchase-Invoice-Route nicht fortsetzen; entweder echten Bookmark-/Filter-Reset-Hebel finden oder auf stabilere P2P-Route wechseln.',
    '',
  ].join('\n');
}

test('P2P-026 probes Purchase Invoice context reset without New or value entry', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const directUrl = cleanBcUrl(9308);
  await page.goto(directUrl.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBcReady(page, { expectedText: /Purchase Invoices|Einkaufsrechnungen|Business Central/i });
  const directSignals = await collectSignals(page, '010-direct-page');

  const wrongContext =
    !directSignals.urlContext.pageUrlHasExpectedInstance ||
    !directSignals.urlContext.pageUrlHasExpectedCompany ||
    directSignals.urlContext.businessCentralFrames.some((frame) => !frame.hasExpectedInstance);

  const blockedBy = [
    ...(wrongContext ? ['wrong-instance-or-company-context'] : []),
    ...(directSignals.forbiddenDraftVisible ? [`forbidden-draft-${FORBIDDEN_DRAFT_NO}-visible`] : []),
    ...(directSignals.urlContext.pageUrlHasFilterOrBookmark ? ['page-url-has-filter-or-bookmark'] : []),
    ...(directSignals.urlContext.businessCentralFrames.some((frame) => frame.hasFilterOrBookmark)
      ? ['frame-url-has-filter-or-bookmark']
      : []),
    ...(directSignals.purchaseInvoicesVisible ? [] : ['purchase-invoices-context-not-visible']),
  ];

  const observed = blockedBy.length === 0 && directSignals.purchaseInvoicesVisible;
  const summary = observed
    ? `P2P-026 observed a neutral Purchase Invoices context in ${EXPECTED_INSTANCE} / ${EXPECTED_COMPANY}; ${FORBIDDEN_DRAFT_NO} was not visible and no New/value action was clicked.`
    : `P2P-026 blocked the Purchase Invoices context-reset route: ${blockedBy.join(', ')}. No New/value action was clicked.`;

  const result = {
    ...resultBase(startedAt),
    finishedAt: new Date().toISOString(),
    resultStatus: observed ? 'observed' : 'blocked',
    purchaseInvoiceDraftNo: null,
    forbiddenDraftNo: FORBIDDEN_DRAFT_NO,
    contextStatus: observed ? 'neutral-context-observed' : 'blocked-context-not-neutral',
    observed: {
      directPage: {
        purchaseInvoicesVisible: directSignals.purchaseInvoicesVisible,
        forbiddenDraftVisible: directSignals.forbiddenDraftVisible,
        possibleDocumentNos: directSignals.possibleDocumentNos,
        pageUrlHasFilterOrBookmark: directSignals.urlContext.pageUrlHasFilterOrBookmark,
        frameHasFilterOrBookmark: directSignals.urlContext.businessCentralFrames.some((frame) => frame.hasFilterOrBookmark),
      },
    },
    proved: [
      `Purchase Invoices page 9308 was opened read-only in ${EXPECTED_INSTANCE} / ${EXPECTED_COMPANY}.`,
      'No New/Neu was clicked.',
      'No Vendor or line value was entered.',
      'No Preview Posting or posting was executed.',
      ...(directSignals.forbiddenDraftVisible
        ? [`The forbidden kept draft ${FORBIDDEN_DRAFT_NO} is still visible in the working context.`]
        : [`The forbidden kept draft ${FORBIDDEN_DRAFT_NO} was not visible in the captured working context.`]),
    ],
    notProved: [
      'No fresh Purchase Invoice draft was created.',
      'No K10000/RAW-STEEL value entry was attempted.',
      'No Preview Posting, posting, receipt, vendor ledger, item ledger, value entry or G/L trace exists.',
      'No German final proof.',
    ],
    blockedBy,
    safeToFinalizeState: false,
    requiresReview: !observed,
    nextCase: observed
      ? 'P2P-027-PURCHASE-INVOICE-FRESH-DRAFT-VALUE-GATE'
      : 'P2P-027-PURCHASE-INVOICE-ROUTE-REJECTION-OR-RESET-HELPER',
    nextStep: observed
      ? 'Plan a separate fresh Purchase Invoice value-entry gate with the same stale-context guard before Vendor/line entry.'
      : 'Do not continue Purchase Invoice values. Review whether to build a real bookmark/filter reset helper or switch to a more stable P2P route.',
    summary,
  };

  await writeJsonEvidence(RESULT_PATH, result);
  await writeEvidenceText(`${EVIDENCE_DIR}/README.md`, renderReadme(summary, result.resultStatus));
});
