import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});
test.setTimeout(300_000);

const CASE_ID = 'TARGET-042-CUSTOMER-ITEM-POSTING-FIELDS-READONLY-PREFLIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-042-customer-item-posting-fields-readonly-preflight';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-042-result.json');

type CardProbe = {
  id: 'customer-u-cust-100' | 'item-u-item-hw100';
  pageId: number;
  pageName: string;
  tableName: string;
  fieldName: string;
  recordNo: string;
  expectedRecordText: RegExp;
  include: RegExp[];
  importantFields: { key: string; label: string; pattern: RegExp }[];
  screenshot: string;
  purpose: string;
};

type FieldSignal = {
  key: string;
  label: string;
  visible: boolean;
  evidenceLine: string | null;
};

type CardProbeResult = {
  id: string;
  pageId: number;
  pageName: string;
  recordNo: string;
  status: 'observed' | 'blocked';
  url: string;
  screenshot: string;
  textFile: string;
  fieldSignals: FieldSignal[];
  compactSignals: string[];
  visibleWarnings: string[];
  reason: string;
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
      /Debitor|Customer|U-CUST-100|Universaarl Kunde 100|Buchungsgruppe|Posting Group|Gesch|Business|MwSt|VAT|Zahlungsbeding|Payment Terms|Gesperrt|Blocked|Fakturierung|Invoicing/i
    ],
    importantFields: [
      {
        key: 'customerPostingGroup',
        label: 'Customer Posting Group / Debitorenbuchungsgruppe',
        pattern: /Customer Posting Group|Debitorenbuchungsgruppe|Debitorenbuchungsgruppe Code|Debitoren-Buchungsgruppe/i
      },
      {
        key: 'genBusPostingGroup',
        label: 'Gen. Bus. Posting Group / Geschaeftsbuchungsgruppe',
        pattern: /Gen\.?\s*Bus\.?\s*Posting Group|Gesch(?:aeft|äft)sbuchungsgruppe|Allg\.?\s*Gesch(?:aeft|äft)sbuchungsgruppe/i
      },
      {
        key: 'vatBusPostingGroup',
        label: 'VAT Bus. Posting Group / MwSt.-Geschaeftsbuchungsgruppe',
        pattern: /VAT Bus\.?\s*Posting Group|MwSt\.?-Gesch(?:aeft|äft)sbuchungsgruppe|USt-Gesch(?:aeft|äft)sbuchungsgruppe/i
      },
      {
        key: 'paymentTermsCode',
        label: 'Payment Terms Code / Zahlungsbedingungscode',
        pattern: /Payment Terms Code|Zahlungsbedingungscode|Zahlungsbedingung/i
      },
      {
        key: 'blocked',
        label: 'Blocked / Gesperrt',
        pattern: /Blocked|Gesperrt/i
      }
    ],
    screenshot: 'target-042-010-customer-card-u-cust-100.png',
    purpose: 'Read-only field preflight for the first Universaarl customer before any O2C document.'
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
      /Artikel|Item|U-ITEM-HW100|Universaarl Hardware 100|STK|Basiseinheit|Base Unit|Buchungsgruppe|Posting Group|Produktbuchungsgruppe|MwSt|VAT|Lagerbuchungsgruppe|Inventory Posting|Lagerbestand|Inventory|Einstandspreis|Costing Method|Fakturierung|Invoicing/i
    ],
    importantFields: [
      {
        key: 'baseUnitOfMeasure',
        label: 'Base Unit of Measure / Basiseinheit',
        pattern: /Base Unit of Measure|Basiseinheit|STK/i
      },
      {
        key: 'itemPostingGroup',
        label: 'Item Posting Group / Lagerbuchungsgruppe',
        pattern: /Item Posting Group|Inventory Posting Group|Artikelbuchungsgruppe|Lagerbuchungsgruppe/i
      },
      {
        key: 'genProdPostingGroup',
        label: 'Gen. Prod. Posting Group / Produktbuchungsgruppe',
        pattern: /Gen\.?\s*Prod\.?\s*Posting Group|Produktbuchungsgruppe|Allg\.?\s*Produktbuchungsgruppe/i
      },
      {
        key: 'vatProdPostingGroup',
        label: 'VAT Prod. Posting Group / MwSt.-Produktbuchungsgruppe',
        pattern: /VAT Prod\.?\s*Posting Group|MwSt\.?-Produktbuchungsgruppe|USt-Produktbuchungsgruppe/i
      },
      {
        key: 'inventory',
        label: 'Inventory / Lagerbestand',
        pattern: /Inventory|Lagerbestand/i
      },
      {
        key: 'costingMethod',
        label: 'Costing Method / Einstandspreismethode',
        pattern: /Costing Method|Einstandspreismethode/i
      }
    ],
    screenshot: 'target-042-020-item-card-u-item-hw100.png',
    purpose: 'Read-only field preflight for the first Universaarl item before O2C/P2P or inventory posting.'
  }
];

function buildCardUrl(probe: CardProbe) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(probe.pageId));
  url.searchParams.set('filter', `'${probe.tableName}'.'${probe.fieldName}' IS '${probe.recordNo}'`);
  return url;
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

function cleanText(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function sanitizeCompactText(text: string) {
  return text
    .split('\n')
    .filter(
      (line) =>
        !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer|cacheLocation|allowedEndpoints|parentPageOrigin/i.test(line)
    )
    .join('\n');
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function containsForbiddenDialog(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Loschen\?|Apply Template\?|Vorlage anwenden\?|Create\?|Erstellen\?|Save\?|Speichern\?/i.test(text);
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.trim()}\n`, 'utf8');
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
    fileName,
    imagePath: `playwright/projects/fibu-book5/img/${fileName}`,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

function fieldSignals(compact: string, probe: CardProbe): FieldSignal[] {
  const lines = compact.split('\n').map((line) => line.trim()).filter(Boolean);
  return probe.importantFields.map((field) => {
    const evidenceLine = lines.find((line) => field.pattern.test(line)) ?? null;
    return {
      key: field.key,
      label: field.label,
      visible: Boolean(evidenceLine),
      evidenceLine
    };
  });
}

async function readCard(page: Page, probe: CardProbe): Promise<CardProbeResult> {
  const targetUrl = buildCardUrl(probe);
  await page.goto(targetUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const rawText = await pageText(page);
  const rawCompact = await compactPageText(page, { include: probe.include, maxLines: 120, maxLineLength: 220 });
  const compact = sanitizeCompactText(cleanText(rawCompact));
  const normalizedRaw = cleanText(rawText);
  const url = page.url();
  const contextOk = instancePathIsTarget(url) && companyParamIsTarget(url);
  const recordVisible = probe.expectedRecordText.test(rawText);
  const forbiddenDialog = containsForbiddenDialog(rawText);
  const status: CardProbeResult['status'] = contextOk && recordVisible && !forbiddenDialog ? 'observed' : 'blocked';
  const textFile = `${probe.id}.txt`;
  const signals = fieldSignals(compact, probe);
  const visibleWarnings = [
    /Neu|New/i.test(rawText) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Bearbeiten|Edit/i.test(rawText) ? 'Edit/Bearbeiten action may be visible but was not clicked.' : '',
    /Vorlage anwenden|Apply Template/i.test(rawText) ? 'Template/Vorlage action may be visible but was not clicked.' : ''
  ].filter(Boolean);

  await writeText(textFile, compact || normalizedRaw.slice(0, 5000));
  await screenshotWithMetadata(page, probe.screenshot, {
    pageId: probe.pageId,
    page: probe.pageName,
    recordNo: probe.recordNo,
    purpose: probe.purpose,
    status,
    bookUse: status === 'observed' ? 'field-preflight' : 'do-not-use-as-proof',
    visibleLearning: compact.split('\n').slice(0, 18),
    importantUi: [
      'Direct filtered card URL',
      'Read-only card context',
      'No New action',
      'No Edit action',
      'No field write',
      'No Preview Posting or Posting'
    ],
    internallyProves: status === 'observed' ? `${probe.recordNo} card context is visible for field inspection.` : 'Target card context was not fully proven.',
    doesNotProve: [
      'No posting setup correctness is proven.',
      'No document readiness is proven.',
      'No ledger or VAT entry exists from this read-only probe.'
    ],
    fieldSignals: signals,
    visibleWarnings
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    pageName: probe.pageName,
    recordNo: probe.recordNo,
    status,
    url: sanitizeEvidenceUrl(url),
    screenshot: `playwright/projects/fibu-book5/img/${probe.screenshot}`,
    textFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${textFile}`,
    fieldSignals: signals,
    compactSignals: compact.split('\n').slice(0, 40),
    visibleWarnings,
    reason: !contextOk
      ? 'Business Central context did not stay in playthru / UNIVERSAARL-DE.'
      : forbiddenDialog
        ? 'A risky dialog appeared; read-only probe stopped.'
        : recordVisible
          ? 'Target card record text is visible read-only.'
          : 'Target card record text was not visible.'
  };
}

test('TARGET-042 Customer and item posting fields read-only preflight', async ({ page }) => {
  const results: CardProbeResult[] = [];
  for (const probe of probes) {
    results.push(await readCard(page, probe));
  }

  const customer = results.find((entry) => entry.id === 'customer-u-cust-100');
  const item = results.find((entry) => entry.id === 'item-u-item-hw100');
  const customerObserved = customer?.status === 'observed';
  const itemObserved = item?.status === 'observed';
  const visibleCustomerFields = customer?.fieldSignals.filter((field) => field.visible).map((field) => field.key) ?? [];
  const visibleItemFields = item?.fieldSignals.filter((field) => field.visible).map((field) => field.key) ?? [];
  const missingCustomerFields = customer?.fieldSignals.filter((field) => !field.visible).map((field) => field.key) ?? [];
  const missingItemFields = item?.fieldSignals.filter((field) => !field.visible).map((field) => field.key) ?? [];
  const resultStatus = customerObserved && itemObserved ? 'observed' : 'blocked';
  const nextCase = 'TARGET-043-CUSTOMER-ITEM-POSTING-FIELDS-FIT-DECISION';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-card-field-preflight',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: results.at(-1)?.url ?? '',
    page: 'Customer Card and Item Card field preflight',
    actionsTaken: [
      'Opened direct filtered Customer Card Page 21 for U-CUST-100 read-only.',
      'Opened direct filtered Item Card Page 30 for U-ITEM-HW100 read-only.',
      'Captured compact field text and screenshot QA metadata.',
      'Classified visible and missing posting/VAT/inventory-related field signals.'
    ],
    actionsNotTaken: [
      'No New action clicked.',
      'No Edit action clicked.',
      'No customer field changed.',
      'No item field changed.',
      'No setup value changed.',
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
    screenshots: results.map((entry) => entry.screenshot),
    proved: [
      customerObserved ? 'U-CUST-100 customer card context is visible read-only.' : '',
      itemObserved ? 'U-ITEM-HW100 item card context is visible read-only.' : '',
      visibleCustomerFields.length ? `Customer card visible field signals: ${visibleCustomerFields.join(', ')}.` : '',
      visibleItemFields.length ? `Item card visible field signals: ${visibleItemFields.join(', ')}.` : '',
      'No customer, item, setup, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ].filter(Boolean),
    notProved: [
      missingCustomerFields.length ? `Customer card field signals not visible in compact read-only text: ${missingCustomerFields.join(', ')}.` : '',
      missingItemFields.length ? `Item card field signals not visible in compact read-only text: ${missingItemFields.join(', ')}.` : '',
      'No Customer Posting Group, Gen. Bus. Posting Group, VAT Bus. Posting Group, Item Posting Group, Gen. Prod. Posting Group or VAT Prod. Posting Group is proven correct by visibility alone.',
      'No VAT Posting Setup correctness is proven.',
      'No Inventory Posting Setup correctness is proven.',
      'No O2C, P2P, Preview Posting, Posting, Customer Ledger Entry, Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.'
    ].filter(Boolean),
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-042-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-042-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-042-result.json`,
      ...results.map((entry) => entry.screenshot)
    ],
    pages: results,
    fieldSummary: {
      customer: {
        visible: visibleCustomerFields,
        missing: missingCustomerFields
      },
      item: {
        visible: visibleItemFields,
        missing: missingItemFields
      }
    },
    warnings: [
      ...new Set(results.flatMap((entry) => entry.visibleWarnings)),
      'Visible field labels are not enough to prove posting readiness.',
      'TARGET-043 must decide whether to fit missing fields, inspect via Page Inspection/personalization, or keep O2C blocked.'
    ],
    blockedBy: resultStatus === 'observed' ? [] : results.filter((entry) => entry.status !== 'observed').map((entry) => `${entry.id}: ${entry.reason}`),
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-038-O2C-PREFLIGHT',
      lastEvidenceSummary: 'TARGET-040 proved U-CUST-100 and U-ITEM-HW100/STK as visible read-only records but not their posting/VAT/inventory field readiness.',
      isPlannedNextCaseStillSensible: false,
      reason: 'O2C/P2P documents still depend on concrete posting/VAT/inventory fields. TARGET-042 reads those fields without changing anything.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: 'ready-next',
          reason: 'The read-only field preflight now gives the exact visible/missing field signals for the next fit decision.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'O2C still needs an explicit fit decision before documents are safe.'
        },
        {
          caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
          status: 'blocked',
          reason: 'Vendor creation remains parked; this customer/item preflight does not solve U-VEND numbering.'
        },
        {
          caseId: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
          status: 'ready-after-current',
          reason: 'Chart of Accounts remains a useful cross-check before setup claims are promoted.'
        }
      ],
      queueChangesMade: [
        'TARGET-042 completed as read-only field preflight.',
        'TARGET-043 selected as the next narrow fit decision before O2C/P2P.'
      ],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: 'It converts field visibility/missing signals into a controlled decision instead of creating documents too early.',
      risksBeforeNextCase: [
        'Do not edit customer or item fields without a TARGET-043 Smart Decision.',
        'Do not claim posting readiness from visible labels.',
        'Keep Preview Posting and Posting locked.'
      ],
      requiredPreparation: [
        'Use TARGET-042 fieldSummary.',
        'If fields are missing because FastTabs or personalization hide them, run UI discovery instead of writing.',
        'If setup fields are visible but blank, name exact fields and intended values before any write.'
      ]
    },
    statePatch: {
      current: {
        activeArea: 'universaarl-customer-item-posting-fields-fit-decision',
        activeCase: nextCase,
        active_case_file: '.agent/state/cases/target-043-customer-item-posting-fields-fit-decision.json',
        nextStep: 'Run TARGET-043 Customer/Item Posting Fields Fit Decision before O2C/P2P; no documents, Preview Posting or Posting.'
      },
      activeCase: {
        status: resultStatus,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-042-result.json`,
        nextCase
      }
    },
    requiresReview: false,
    safeToFinalizeState: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'Customer and item card contexts were read-only observed; next decision remains gated.'
        : 'Read-only field preflight was blocked; do not proceed to setup or documents.',
    nextCase
  };

  await writeJson('TARGET-042-result.json', result);
  await writeText(
    'README.md',
    [
      '# TARGET-042 Customer/Item Posting Fields Read-only Preflight',
      '',
      `Status: \`${resultStatus}\``,
      '',
      'Dieser Probe-Lauf liest nur die konkrete Debitorenkarte und Artikelkarte in `playthru / UNIVERSAARL-DE`.',
      '',
      'Nicht gemacht:',
      '- kein Neu',
      '- kein Bearbeiten',
      '- keine Feldänderung',
      '- keine Einrichtungsaenderung',
      '- kein Beleg/Draft',
      '- keine Buchungsvorschau',
      '- keine Buchung',
      '',
      'Wichtig fuer den naechsten Lauf: sichtbare Feldlabels sind noch keine Buchungsreife. TARGET-043 muss entscheiden, welche Felder wirklich gesetzt, weiter untersucht oder bewusst geparkt werden.'
    ].join('\n')
  );

  expect(resultStatus, JSON.stringify(result.blockedBy, null, 2)).toBe('observed');
});
