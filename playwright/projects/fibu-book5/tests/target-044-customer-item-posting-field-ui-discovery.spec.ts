import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';
import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});
test.setTimeout(360_000);

const CASE_ID = 'TARGET-044-CUSTOMER-ITEM-POSTING-FIELD-UI-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-044-customer-item-posting-field-ui-discovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-044-result.json');

type CardProbe = {
  id: 'customer-u-cust-100' | 'item-u-item-hw100';
  pageId: number;
  pageName: string;
  tableName: string;
  fieldName: string;
  recordNo: string;
  expectedRecordText: RegExp;
  include: RegExp[];
  captions: string[];
  screenshotPrefix: string;
  purpose: string;
};

const probes: CardProbe[] = [
  {
    id: 'customer-u-cust-100',
    pageId: 21,
    pageName: 'Customer Card / Debitorenkarte',
    tableName: 'Customer',
    fieldName: 'No.',
    recordNo: 'U-CUST-100',
    expectedRecordText: /U-CUST-100|Universaarl Kunde 100/i,
    include: [
      /Debitor|Customer|U-CUST-100|Universaarl Kunde 100|Fakturierung|Zahlungen|Lieferung|Auslandshandel|Statistik|Posting Group|Buchungsgruppe|Gesch|Business|MwSt|VAT|Zahlungsbeding|Payment Terms|Gesperrt|Blocked|Kreditlimit|Credit Limit/i
    ],
    captions: [
      'Debitorenbuchungsgruppe',
      'Customer Posting Group',
      'Geschaeftsbuchungsgruppe',
      'Geschäftsbuchungsgruppe',
      'Gen. Bus. Posting Group',
      'MwSt.-Geschaeftsbuchungsgruppe',
      'MwSt.-Geschäftsbuchungsgruppe',
      'VAT Bus. Posting Group',
      'Zahlungsbedingungscode',
      'Payment Terms Code',
      'Gesperrt',
      'Blocked'
    ],
    screenshotPrefix: 'target-044-010-customer',
    purpose: 'Read-only UI discovery for customer posting, VAT and payment fields before any O2C or setup write.'
  },
  {
    id: 'item-u-item-hw100',
    pageId: 30,
    pageName: 'Item Card / Artikelkarte',
    tableName: 'Item',
    fieldName: 'No.',
    recordNo: 'U-ITEM-HW100',
    expectedRecordText: /U-ITEM-HW100|Universaarl Hardware 100|STK/i,
    include: [
      /Artikel|Item|U-ITEM-HW100|Universaarl Hardware 100|STK|Basiseinheit|Base Unit|Einstandspreise|Buchung|Beschaffung|Planung|Lager|Indirekte Steuer|Posting Group|Buchungsgruppe|Produktbuchungsgruppe|MwSt|VAT|Lagerbuchungsgruppe|Inventory Posting|Lagerbestand|Inventory|Einstandspreismethode|Costing Method/i
    ],
    captions: [
      'Basiseinheit',
      'Base Unit of Measure',
      'Lagerbuchungsgruppe',
      'Item Posting Group',
      'Produktbuchungsgruppe',
      'Gen. Prod. Posting Group',
      'MwSt.-Produktbuchungsgruppe',
      'VAT Prod. Posting Group',
      'Einstandspreismethode',
      'Costing Method',
      'Lagerbestand',
      'Inventory'
    ],
    screenshotPrefix: 'target-044-020-item',
    purpose: 'Read-only UI discovery for item posting, VAT, costing and inventory fields before O2C/P2P or inventory posting.'
  }
];

function buildCardUrl(probe: CardProbe) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(probe.pageId));
  url.searchParams.set('filter', `'${probe.tableName}'.'${probe.fieldName}' IS '${probe.recordNo}'`);
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'filter', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter(
      (line) =>
        !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer|cacheLocation|allowedEndpoints|parentPageOrigin|aadTenantId|tokenFactorySettings/i.test(
          line
        )
    )
    .join('\n')
    .trim();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function containsForbiddenDialog(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Loschen\?|Apply Template\?|Vorlage anwenden\?|Create\?|Erstellen\?|Save\?|Speichern\?|Finish|Fertig stellen/i.test(
    text
  );
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function writeJson(fileName: string, payload: unknown) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(fileName.replace(/\.png$/i, '.screenshot.json'), {
    caseId: CASE_ID,
    fileName,
    imagePath: `playwright/projects/fibu-book5/img/${fileName}`,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function assertReadonlyContext(page: Page) {
  const currentUrl = page.url();
  expect(instancePathIsTarget(currentUrl), `Wrong instance in URL: ${sanitizeEvidenceUrl(currentUrl)}`).toBe(true);
  expect(companyParamIsTarget(currentUrl), `Wrong company in URL: ${sanitizeEvidenceUrl(currentUrl)}`).toBe(true);

  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogLocator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await dialogLocator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = cleanText(await dialogLocator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (containsForbiddenDialog(text)) dialogs.push(text);
    }
  }
  expect(dialogs, 'A forbidden/write-like dialog is visible.').toEqual([]);
}

async function getReadonlyUiMap(page: Page, captions: string[]) {
  const maps = [];
  for (const frame of page.frames().filter((entry) => /businesscentral\.dynamics\.com/i.test(entry.url()))) {
    const frameMap = await frame
      .evaluate((captionValues) => {
        const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
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
        const elements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(visible);
        const textNodes = elements
          .map((element) => ({
            tag: element.tagName,
            role: normalize(element.getAttribute('role')),
            text: normalize(element.innerText || element.textContent),
            aria: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            expanded: normalize(element.getAttribute('aria-expanded')),
            selected: normalize(element.getAttribute('aria-selected')),
            rect: rectOf(element)
          }))
          .filter((entry) => `${entry.text} ${entry.aria} ${entry.title}`.trim().length > 0)
          .filter((entry) => entry.text.length <= 220);
        const fastTabs = textNodes
          .filter((entry) => /button|tab|heading/i.test(`${entry.role} ${entry.tag}`))
          .filter((entry) =>
            /Allgemein|General|Fakturierung|Invoicing|Zahlungen|Payments|Lieferung|Shipping|Auslandshandel|Foreign Trade|Einstandspreise|Costs|Buchung|Posting|Beschaffung|Replenishment|Planung|Planning|Lager|Warehouse|Artikelverfolgung|Item Tracking|Indirekte Steuer|Indirect Tax/i.test(
              `${entry.text} ${entry.aria} ${entry.title}`
            )
          )
          .slice(0, 80);
        const actionNames = textNodes
          .filter((entry) => /button|menuitem/i.test(`${entry.role} ${entry.tag}`))
          .map((entry) => cleanForReturn(entry.aria || entry.text || entry.title))
          .filter(Boolean)
          .filter((value, index, arr) => arr.indexOf(value) === index)
          .slice(0, 120);
        const fieldPresence = captionValues.map((caption) => {
          const captionLower = caption.toLocaleLowerCase();
          const hits = textNodes
            .filter((entry) => `${entry.text} ${entry.aria} ${entry.title}`.toLocaleLowerCase().includes(captionLower))
            .slice(0, 12);
          return { caption, hitCount: hits.length, hits };
        });
        return {
          fastTabs,
          actionNames,
          fieldPresence
        };

        function cleanForReturn(value: string) {
          return value.replace(/\s+/g, ' ').trim();
        }
      }, captions)
      .catch((error) => ({ error: String(error), fastTabs: [], actionNames: [], fieldPresence: [] }));
    maps.push({ frameUrl: sanitizeLoose(frame.url()), ...frameMap });
  }
  return maps;
}

function sanitizeLoose(rawUrl: string) {
  try {
    return sanitizeEvidenceUrl(rawUrl);
  } catch {
    return rawUrl.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant}');
  }
}

async function attemptPageInspection(page: Page) {
  const before = cleanText(await pageText(page));
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(3500);
  await assertReadonlyContext(page);
  const after = cleanText(await pageText(page));
  const lines = after
    .split('\n')
    .filter((line) => /Page Inspection|Inspect pages and data|Page ID|Page Name|Page Type|Source Table|Table ID|Seitenpr|Tabellenfelder|Customer|Debitor|Item|Artikel/i.test(line))
    .slice(0, 180);
  return {
    opened:
      after !== before &&
      /Page Inspection|Inspect pages and data|Page ID|Page Name|Page Type|Source Table|Table ID|Seitenpr/i.test(after),
    focusedLines: lines
  };
}

async function inspectCard(page: Page, probe: CardProbe) {
  await page.goto(buildCardUrl(probe), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);
  await assertReadonlyContext(page);

  const rawText = await pageText(page);
  const compact = cleanText(
    await compactPageText(page, {
      include: probe.include,
      maxLines: 180,
      maxLineLength: 260
    })
  );
  const recordVisible = probe.expectedRecordText.test(rawText);
  const uiMap = await getReadonlyUiMap(page, probe.captions);
  const diagnostics = await collectActiveCardControlDiagnostics(page, probe.captions, { targetText: probe.expectedRecordText });
  const status = recordVisible ? 'observed' : 'blocked';
  const baselineImage = `${probe.screenshotPrefix}-baseline.png`;

  await writeText(`${probe.id}-baseline.txt`, compact || cleanText(rawText).slice(0, 8000));
  await writeJson(`${probe.id}-ui-map.json`, {
    page: probe.pageName,
    pageId: probe.pageId,
    recordNo: probe.recordNo,
    url: sanitizeEvidenceUrl(page.url()),
    recordVisible,
    uiMap,
    diagnostics
  });
  await screenshotWithMetadata(page, baselineImage, {
    page: probe.pageName,
    pageId: probe.pageId,
    recordNo: probe.recordNo,
    purpose: probe.purpose,
    status,
    bookUse: 'field-discovery',
    importantUi: ['FastTabs', 'visible field labels', 'FactBox/layout context', 'no Edit/New/Post action used'],
    internallyProves: recordVisible ? `${probe.recordNo} card is visible for read-only UI discovery.` : 'Target record is not proven visible.',
    doesNotProve: [
      'No field value correctness for posting readiness.',
      'No setup write.',
      'No document, Preview Posting, Posting or ledger trace.'
    ],
    visibleFastTabs: uiMap.flatMap((entry) => entry.fastTabs ?? []).slice(0, 20),
    fieldPresence: uiMap.flatMap((entry) => entry.fieldPresence ?? []).slice(0, 20),
    diagnosticSummary: diagnostics.summary
  });

  const inspection = await attemptPageInspection(page);
  const inspectionImage = `${probe.screenshotPrefix}-page-inspection.png`;
  await writeText(`${probe.id}-page-inspection.txt`, inspection.focusedLines.join('\n') || 'Page Inspection did not expose stable focused text.');
  await screenshotWithMetadata(page, inspectionImage, {
    page: 'Page Inspection / Seitenpruefung attempt',
    sourcePage: probe.pageName,
    pageId: probe.pageId,
    recordNo: probe.recordNo,
    purpose: 'Read-only technical page/table/field context attempt.',
    status: inspection.opened ? 'page-inspection-visible' : 'page-inspection-not-stably-visible',
    bookUse: 'technical-debugging',
    importantUi: ['Page ID', 'Source Table', 'Field list if visible'],
    internallyProves: inspection.opened ? 'Technical inspection text became visible.' : 'Shortcut attempt did not produce stable inspection text.',
    doesNotProve: ['No field value has been changed.', 'No setup correctness.', 'No book-final screenshot.'],
    focusedLines: inspection.focusedLines
  });

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  return {
    id: probe.id,
    pageId: probe.pageId,
    page: probe.pageName,
    recordNo: probe.recordNo,
    status,
    url: sanitizeEvidenceUrl(page.url()),
    screenshots: [
      `playwright/projects/fibu-book5/img/${baselineImage}`,
      `playwright/projects/fibu-book5/img/${inspectionImage}`
    ],
    textFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${probe.id}-baseline.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${probe.id}-page-inspection.txt`
    ],
    uiMapFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${probe.id}-ui-map.json`,
    recordVisible,
    fieldPresence: uiMap.flatMap((entry) => entry.fieldPresence ?? []),
    fastTabs: uiMap.flatMap((entry) => entry.fastTabs ?? []).slice(0, 40),
    actionsSeen: uiMap.flatMap((entry) => entry.actionNames ?? []).slice(0, 80),
    diagnosticsSummary: diagnostics.summary,
    pageInspection: inspection,
    safeWriteCandidate:
      diagnostics.summary.activeCardLabelWithControl > 0
        ? 'possible-control-candidates-need-separate-write-gate'
        : 'no-write-candidate-from-readonly-discovery'
  };
}

test('TARGET-044 discovers customer and item posting fields read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const results = [];
  for (const probe of probes) {
    results.push(await inspectCard(page, probe));
  }

  const observed = results.every((entry) => entry.status === 'observed');
  const anyControlCandidates = results.some((entry) => entry.diagnosticsSummary.activeCardLabelWithControl > 0);
  const nextCase = anyControlCandidates
    ? 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT'
    : 'TARGET-044B-CUSTOMER-ITEM-POSTING-FIELD-SOURCE-OR-PERSONALIZE-DECISION';
  const resultStatus = observed ? 'observed' : 'blocked';
  const blockedBy = observed ? [] : results.filter((entry) => entry.status !== 'observed').map((entry) => `${entry.id}: target card context not visible`);
  const screenshots = results.flatMap((entry) => entry.screenshots);

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT',
    lastEvidenceSummary: 'TARGET-043 selected read-only UI discovery because TARGET-042 saw card context but not enough posting/VAT/payment field truth for writes.',
    isPlannedNextCaseStillSensible: anyControlCandidates,
    reason: anyControlCandidates
      ? 'The UI discovery found active-card control candidates; a separate controlled write gate can now name exact fields and target values.'
      : 'The UI discovery did not find enough active-card control candidates; source or personalization decision is safer than writing.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT',
        status: anyControlCandidates ? 'ready-next' : 'needs-ui-discovery-first',
        reason: anyControlCandidates
          ? 'Control diagnostics found active-card candidates, but writes still require exact target values and separate gate.'
          : 'No safe write candidate was proven.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C still needs customer/item posting fields, VAT/payment readiness and expected entry trace.'
      },
      {
        caseId: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
        status: 'ready-after-current',
        reason: 'Useful checkpoint if customer/item field route remains parked.'
      },
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
        status: 'blocked',
        reason: 'Vendor numbering remains separate and blocked.'
      }
    ],
    queueChangesMade: [
      'TARGET-044 completed as read-only UI discovery.',
      `Selected ${nextCase} as next case.`
    ],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: anyControlCandidates
      ? 'It converts UI discovery into one narrow controlled fit case instead of jumping to O2C.'
      : 'It prevents another blind write and keeps the field route evidence-driven.',
    risksBeforeNextCase: [
      'Do not claim posting readiness from visible labels.',
      'Do not create documents, Preview Posting or Posting.',
      'Do not apply personalization changes as part of read-only discovery.'
    ],
    requiredPreparation: [
      'Use TARGET-044 diagnostics files and screenshots.',
      'Name exact fields and target values before any write.',
      'Keep O2C/P2P blocked until setup values and VAT/payment boundaries are proven.'
    ]
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-ui-discovery',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: results.at(-1)?.url ?? '',
    page: 'Customer Card and Item Card UI field discovery',
    actionsTaken: [
      'Opened direct filtered Customer Card Page 21 for U-CUST-100 read-only.',
      'Opened direct filtered Item Card Page 30 for U-ITEM-HW100 read-only.',
      'Captured FastTab/action/field-presence UI maps.',
      'Captured active-card control diagnostics for posting/VAT/payment/costing captions.',
      'Attempted Page Inspection read-only with Ctrl+Alt+F1 and captured result.'
    ],
    actionsNotTaken: [
      'No New action clicked.',
      'No Edit action clicked.',
      'No customer field changed.',
      'No item field changed.',
      'No setup value changed.',
      'No personalization change applied.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No company switch.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots,
    proved: [
      observed ? 'U-CUST-100 and U-ITEM-HW100 card contexts were both observed read-only.' : '',
      'FastTab/action/field-presence maps were captured without applying changes.',
      'Active-card field diagnostics were captured for customer and item posting/VAT/payment/costing captions.',
      anyControlCandidates
        ? 'At least one active-card control candidate exists; a future write gate must still prove exact fields and values.'
        : 'No sufficient active-card write candidate was proven by this read-only discovery.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ].filter(Boolean),
    notProved: [
      'No Customer Posting Group, Gen. Bus. Posting Group, VAT Bus. Posting Group, Payment Terms Code, VAT Prod. Posting Group or Costing Method value is proven correct.',
      'No VAT Posting Setup correctness is proven.',
      'No Inventory Posting Setup correctness is proven.',
      'No O2C, P2P, Preview Posting, Posting, Customer Ledger Entry, Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.',
      'Page Inspection text is debug evidence only and not a final book screenshot.'
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-044-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.json`,
      'playwright/projects/fibu-book5/img/target-044-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-044-result.json`,
      ...screenshots
    ],
    pages: results,
    warnings: [
      'Visible labels and control candidates are not posting readiness.',
      'Page Inspection is technical/debug evidence and not final user-facing proof.',
      'Personalization was not applied; if needed, use a separate no-apply discovery case.'
    ],
    blockedBy,
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
      noPersonalizationApplied: true
    },
    nextStepDecision,
    statePatch: {
      current: {
        activeArea: anyControlCandidates ? 'universaarl-customer-item-posting-fields-controlled-fit' : 'universaarl-customer-item-posting-field-route-decision',
        activeCase: nextCase,
        active_case_file: anyControlCandidates
          ? '.agent/state/cases/target-045-customer-item-posting-fields-controlled-fit.json'
          : '.agent/state/cases/target-044b-customer-item-posting-field-source-or-personalize-decision.json',
        nextStep: anyControlCandidates
          ? 'Prepare TARGET-045 controlled customer/item posting field fit with exact fields and target values; no O2C/P2P yet.'
          : 'Prepare TARGET-044B route decision before any customer/item field write.'
      },
      activeCase: {
        status: resultStatus,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-044-result.json`,
        nextCase
      }
    },
    requiresReview: false,
    safeToFinalizeState: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'Read-only UI discovery completed; writes remain gated by a separate case.'
        : `Read-only UI discovery blocked: ${blockedBy.join('; ')}`,
    nextCase
  };

  await writeJson('TARGET-044-result.json', result);
  await writeText(
    'README.md',
    [
      '# TARGET-044 Customer/Item Posting Field UI Discovery',
      '',
      `Status: ${resultStatus}`,
      '',
      'Dieser Lauf untersucht die Debitorenkarte und Artikelkarte read-only. Ziel ist, sichtbare FastTabs, Feldkandidaten, Controls und Page-Inspection-Signale zu erfassen, bevor irgendein Feld geschrieben wird.',
      '',
      'Nicht gemacht:',
      '- kein Neu',
      '- kein Bearbeiten',
      '- keine Feld- oder Einrichtungsaenderung',
      '- keine Personalisierung angewendet',
      '- kein Beleg/Draft',
      '- keine Buchungsvorschau',
      '- keine Buchung',
      '- kein API Shortcut',
      '',
      `Naechster Case: ${nextCase}`
    ].join('\n')
  );

  expect(resultStatus, JSON.stringify(blockedBy, null, 2)).toBe('observed');
});
