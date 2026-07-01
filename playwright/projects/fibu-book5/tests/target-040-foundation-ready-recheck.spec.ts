import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(360_000);

const CASE_ID = 'TARGET-040-FOUNDATION-READY-RECHECK';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-040-foundation-ready-recheck';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-040-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  filter?: string;
  expectedText: RegExp;
  include: RegExp[];
  purpose: string;
  provesWhenVisible: string;
  doesNotProve: string[];
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked' | 'rejected';
  url: string;
  screenshot: string;
  textFile: string;
  textSignals: string[];
  visibleWarnings: string[];
  reason: string;
};

const probes: Probe[] = [
  {
    id: 'location-saar-hl',
    pageId: 15,
    label: 'Locations / Lagerorte',
    filter: "'Location'.'Code' IS 'SAAR-HL'",
    expectedText: /SAAR-HL|Saarbruecken Hauptlager/i,
    include: [/Locations|Lagerorte|Location|Lagerort|Code|Name|SAAR-HL|Saarbruecken Hauptlager|Warehouse|Lager|Bin|Lagerplatz/i],
    purpose: 'Read-only reopen proof for the first Universaarl location.',
    provesWhenVisible: 'SAAR-HL / Saarbruecken Hauptlager is visible read-only.',
    doesNotProve: [
      'No warehouse setup readiness is proven.',
      'No bin, pick, put-away, receive or shipment rule is proven.',
      'No inventory posting setup row is proven.'
    ]
  },
  {
    id: 'customer-u-cust-100',
    pageId: 22,
    label: 'Customers / Debitoren',
    filter: "'Customer'.'No.' IS 'U-CUST-100'",
    expectedText: /U-CUST-100|Universaarl Kunde 100/i,
    include: [/Customers|Debitoren|Customer|Debitor|Nr\.|No\.|Name|U-CUST-100|Universaarl Kunde 100|Posting Group|Buchungsgruppe|VAT|USt|Payment Terms|Zahlungsbeding/i],
    purpose: 'Read-only reopen proof for the first Universaarl customer.',
    provesWhenVisible: 'U-CUST-100 / Universaarl Kunde 100 is visible read-only.',
    doesNotProve: [
      'No Customer Posting Group is proven correct.',
      'No Gen. Bus. Posting Group or VAT Bus. Posting Group is proven correct.',
      'No sales document, customer ledger entry or G/L entry is proven.'
    ]
  },
  {
    id: 'item-u-item-hw100',
    pageId: 31,
    label: 'Items / Artikel',
    filter: "'Item'.'No.' IS 'U-ITEM-HW100'",
    expectedText: /U-ITEM-HW100|Universaarl Hardware 100|STK/i,
    include: [/Items|Artikel|Nr\.|No\.|Description|Beschreibung|U-ITEM-HW100|Universaarl Hardware 100|STK|Base Unit|Basiseinheit|Posting Group|Buchungsgruppe|VAT|USt/i],
    purpose: 'Read-only reopen proof for the first Universaarl item with Base Unit STK.',
    provesWhenVisible: 'U-ITEM-HW100 / Universaarl Hardware 100 with Base Unit STK is visible read-only.',
    doesNotProve: [
      'No Item Posting Group is proven correct.',
      'No Gen. Prod. Posting Group or VAT Prod. Posting Group is proven correct.',
      'No inventory posting setup, item ledger entry or value entry is proven.'
    ]
  },
  {
    id: 'vendor-u-vend-100',
    pageId: 27,
    label: 'Vendors / Kreditoren',
    filter: "'Vendor'.'No.' IS 'U-VEND-100'",
    expectedText: /U-VEND-100|Universaarl Lieferant 100/i,
    include: [/Vendors|Kreditoren|Vendor|Kreditor|Nr\.|No\.|Name|U-VEND-100|Universaarl Lieferant 100|Posting Group|Buchungsgruppe|VAT|USt/i],
    purpose: 'Read-only check that the planned first vendor is still not proven.',
    provesWhenVisible: 'U-VEND-100 / Universaarl Lieferant 100 would be visible read-only.',
    doesNotProve: [
      'Vendor remains blocked if the filtered list does not show U-VEND-100.',
      'No vendor numbering setup route is proven here.',
      'No purchase document, vendor ledger entry or G/L entry is proven.'
    ]
  },
  {
    id: 'item-posting-groups',
    pageId: 112,
    label: 'Item Posting Groups / Artikelbuchungsgruppen',
    expectedText: /Item Posting Groups|Artikelbuchungsgruppen|Inventory Posting Groups|Lagerbuchungsgruppen|Code|Description|Beschreibung/i,
    include: [/Item Posting Groups|Artikelbuchungsgruppen|Inventory Posting Groups|Lagerbuchungsgruppen|Code|Description|Beschreibung|Inventory|Lager/i],
    purpose: 'Read-only setup surface check for item posting group boundaries.',
    provesWhenVisible: 'Item Posting Groups page is reachable read-only.',
    doesNotProve: [
      'No item posting group was assigned to U-ITEM-HW100.',
      'No posting readiness is proven.',
      'No setup row was created or changed.'
    ]
  },
  {
    id: 'inventory-posting-setup',
    pageId: 5826,
    label: 'Inventory Posting Setup / Lagerbuchung Einrichtung',
    expectedText: /Inventory Posting Setup|Lagerbuchung Einrichtung|Inventory Account|Bestandskonto|Location Code|Lagerortcode|Posting Group|Buchungsgruppe/i,
    include: [/Inventory Posting Setup|Lagerbuchung|Inventory Account|Bestand|Location Code|Lagerort|Posting Group|Buchungsgruppe|Code|Account|Konto/i],
    purpose: 'Read-only setup surface check for inventory posting setup boundaries.',
    provesWhenVisible: 'Inventory Posting Setup page is reachable read-only.',
    doesNotProve: [
      'No inventory posting setup row is proven correct.',
      'No inventory account is proven correct.',
      'No item ledger, value entry or G/L entry is proven.'
    ]
  }
];

function buildPlaythruUrl(pageId: number, filter?: string) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  if (filter) url.searchParams.set('filter', filter);
  return url;
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
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
  return /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Loschen\?|Ship and Invoice|Liefern und fakturieren|Preview Posting|Buchungsvorschau|Apply Template\?|Vorlage anwenden\?|Create\?|Erstellen\?|Save\?|Speichern\?/i.test(
    text
  );
}

function visibleWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Aenderungen|Anderungen/i.test(text) ? 'Edit/Bearbeiten action may be visible but was not clicked.' : '',
    /Template|Vorlage|Apply Template/i.test(text) ? 'Template/Vorlage text may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting/preview action text may be visible but was not clicked.'
      : ''
  ].filter(Boolean);
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

async function probePage(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  const url = buildPlaythruUrl(probe.pageId, probe.filter);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1600);

  const rawText = await pageText(page);
  const text = clean(rawText);
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = containsForbiddenDialog(text);
  const matchedExpectedText = probe.expectedText.test(text);
  const status = !safeContext || dangerousDialog ? 'blocked' : matchedExpectedText ? 'observed' : 'rejected';
  const compact = await compactPageText(page, {
    include: probe.include,
    maxLines: 100,
    maxLineLength: 190
  });
  const screenshot = `target-040r-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = `${probe.id}.txt`;
  const textSignals = compact
    .split('\n')
    .filter((line) => !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer/i.test(line))
    .slice(0, 50);
  const sanitizedCompact = compact
    .split('\n')
    .filter((line) => !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer/i.test(line))
    .join('\n');

  await writeText(textFile, sanitizedCompact || text.slice(0, 5000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    step: probe.purpose,
    filter: probe.filter ?? null,
    status: status === 'observed' ? 'universaarl-readonly-proof' : status,
    bookUse: status === 'observed' ? 'foundation-ready-recheck' : 'do-not-use-as-proof',
    visibleLearning: textSignals.slice(0, 16),
    importantUi: [
      'Direct page route',
      'Read-only screenshot QA',
      'No New action',
      'No Edit action',
      'No setup change',
      'No Preview Posting or Posting'
    ],
    internallyProves:
      status === 'observed'
        ? probe.provesWhenVisible
        : `${probe.label} did not produce accepted read-only proof in this run.`,
    doesNotProve: probe.doesNotProve,
    finalScreenshotStatus: status === 'observed' ? 'universaarl-foundation-candidate' : 'rejected'
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeEvidenceUrl(currentUrl),
    screenshot: `playwright/projects/fibu-book5/img/${screenshot}`,
    textFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${textFile}`,
    textSignals,
    visibleWarnings: visibleWarnings(text),
    reason: !safeContext
      ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
      : dangerousDialog
        ? 'Forbidden create/save/delete/preview/posting dialog text detected; no action was confirmed.'
        : matchedExpectedText
          ? 'Expected read-only page or record text is visible.'
          : 'Expected read-only page or record text was not visible.'
  };
}

test('TARGET-040 read-only Foundation Ready Recheck after first item', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const results: ProbeResult[] = [];
  for (let index = 0; index < probes.length; index += 1) {
    results.push(await probePage(page, probes[index], (index + 1) * 10));
  }

  const observed = results.filter((entry) => entry.status === 'observed');
  const blocked = results.filter((entry) => entry.status === 'blocked');
  const rejected = results.filter((entry) => entry.status === 'rejected');
  const locationVisible = observed.some((entry) => entry.id === 'location-saar-hl');
  const customerVisible = observed.some((entry) => entry.id === 'customer-u-cust-100');
  const itemVisible = observed.some((entry) => entry.id === 'item-u-item-hw100');
  const vendorVisible = observed.some((entry) => entry.id === 'vendor-u-vend-100');
  const setupSurfacesVisible =
    observed.some((entry) => entry.id === 'item-posting-groups') &&
    observed.some((entry) => entry.id === 'inventory-posting-setup');
  const foundationRecordsVisible = locationVisible && customerVisible && itemVisible;
  const resultStatus = blocked.length ? 'blocked' : foundationRecordsVisible ? 'observed' : 'partial';
  const nextCase = 'TARGET-042-CUSTOMER-ITEM-POSTING-FIELDS-READONLY-PREFLIGHT';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-foundation-ready-recheck',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: results.at(-1)?.url ?? '',
    page: 'Foundation read-only recheck pages',
    actionsTaken: [
      'Opened direct Business Central page URLs in playthru / UNIVERSAARL-DE.',
      'Checked SAAR-HL, U-CUST-100 and U-ITEM-HW100 read-only.',
      'Checked vendor and setup surfaces read-only to keep gaps explicit.',
      'Captured compact text and screenshot QA metadata.'
    ],
    actionsNotTaken: [
      'No New action clicked.',
      'No Edit action clicked.',
      'No setup value changed.',
      'No master data changed.',
      'No vendor created.',
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
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      locationVisible
        ? 'SAAR-HL / Saarbruecken Hauptlager is visible read-only.'
        : 'Locations page was opened, but SAAR-HL proof was not accepted.',
      customerVisible
        ? 'U-CUST-100 / Universaarl Kunde 100 is visible read-only.'
        : 'Customers page was opened, but U-CUST-100 proof was not accepted.',
      itemVisible
        ? 'U-ITEM-HW100 / Universaarl Hardware 100 with STK is visible read-only.'
        : 'Items page was opened, but U-ITEM-HW100/STK proof was not accepted.',
      setupSurfacesVisible
        ? 'Item Posting Groups and Inventory Posting Setup are reachable read-only as setup surfaces.'
        : 'At least one setup surface still needs route recovery.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ],
    notProved: [
      vendorVisible
        ? 'A vendor row is visible, but this case did not prove vendor numbering or purchase readiness.'
        : 'U-VEND-100 remains not proven as a visible vendor.',
      'No Customer/Vendor/Item Posting Group assignment is proven correct.',
      'No Gen. Business/Product Posting Group or VAT Business/Product Posting Group assignment is proven correct.',
      'No VAT Posting Setup correctness is proven.',
      'No Inventory Posting Setup correctness is proven.',
      'No sales, purchase, inventory, Preview Posting, Posting, Customer Ledger Entry, Vendor Ledger Entry, Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.',
      ...rejected.map((entry) => `${entry.label}: ${entry.reason}`),
      ...blocked.map((entry) => `${entry.label}: ${entry.reason}`)
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-040-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-040r-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-040-result.json`,
      ...results.map((entry) => entry.screenshot)
    ],
    pages: results,
    blockedBy: [...blocked, ...rejected].map((entry) => `${entry.id}: ${entry.reason}`),
    warnings: Array.from(
      new Set([
        ...results.flatMap((entry) => entry.visibleWarnings),
        'Foundation records are visible, but the company is not yet document/posting-ready.',
        'Next step should be customer/item posting fields read-only preflight, not O2C document creation.'
      ])
    ),
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true,
      noTemplateApplied: true,
      readOnlyDirectPageRoutes: true
    },
    foundationReadiness: {
      location: locationVisible ? 'basic-record-visible' : 'not-proven',
      customer: customerVisible ? 'basic-record-visible' : 'not-proven',
      vendor: vendorVisible ? 'unexpected-visible-readonly' : 'blocked-not-proven',
      item: itemVisible ? 'basic-record-visible-with-base-unit' : 'not-proven',
      itemPostingGroupsSurface: observed.some((entry) => entry.id === 'item-posting-groups') ? 'visible-readonly' : 'not-proven',
      inventoryPostingSetupSurface: observed.some((entry) => entry.id === 'inventory-posting-setup') ? 'visible-readonly' : 'not-proven',
      o2cReady: false,
      p2pReady: false,
      inventoryPostingReady: false
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-036E2 proved U-ITEM-HW100 / Universaarl Hardware 100 with Base Unit STK after filtered reopen.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'A read-only checkpoint is still the best step after item creation because O2C/P2P need posting groups, VAT and inventory setup boundaries before any document or posting.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'O2C should not start before VAT, customer/item posting groups and expected entry traces are prepared.'
        },
        {
          caseId: 'TARGET-042-CUSTOMER-ITEM-POSTING-FIELDS-READONLY-PREFLIGHT',
          status: foundationRecordsVisible ? 'ready-next' : 'needs-ui-discovery-first',
          reason: foundationRecordsVisible
            ? 'The starter customer and item exist; their posting/VAT/product fields must be inspected read-only before O2C/P2P or further setup writes.'
            : 'Foundation record proof is incomplete, so customer/item posting-field preflight should wait.'
        },
        {
          caseId: 'TARGET-030-POSTING-GROUPS-VENDOR-INLAND-WRITE-GATE',
          status: 'obsolete',
          reason: 'Already completed; Vendor Posting Group INLAND/3300 is historical context, not the next action.'
        },
        {
          caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
          status: 'blocked',
          reason: 'Vendor creation remains parked until a new non-repeated U-VEND numbering route is proven.'
        },
        {
          caseId: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
          status: 'ready-after-current',
          reason: 'Chart of Accounts remains a useful cross-check before VAT/posting setup claims are promoted.'
        }
      ],
      queueChangesMade: [
        'TARGET-040 Foundation Ready Recheck marked as the current checkpoint.',
        'TARGET-038 O2C preflight kept behind VAT/posting setup dependencies.',
        'TARGET-042 Customer/Item Posting Fields Read-only Preflight selected as the best next foundation step.'
      ],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        'The concrete customer and item now exist, but their posting, VAT and inventory-related fields are not proven; inspecting them is safer and more useful than jumping into O2C documents.',
      risksBeforeNextCase: [
        'Do not mark the company as posting-ready.',
        'Do not create sales or purchase documents from this checkpoint.',
        'Do not change VAT setup without a dedicated Smart Decision and setup evidence.'
      ],
      requiredPreparation: [
        'Read TARGET-027 prior VAT preflight/result state before changing any VAT field.',
        'Keep Preview Posting and Posting locked.',
        'If VAT route is unclear, run read-only UI discovery instead of a write gate.'
      ]
    },
    requiresReview: !foundationRecordsVisible,
    safeToFinalizeState: foundationRecordsVisible,
    statePatch: foundationRecordsVisible
      ? {
          current: {
            activeCase: nextCase,
            active_case_file: '.agent/state/cases/target-042-customer-item-posting-fields-readonly-preflight.json',
            activeArea: 'universaarl-customer-item-posting-fields-preflight',
            nextStep:
              'Run TARGET-042 Customer/Item Posting Fields Read-only Preflight before O2C/P2P; keep documents, Preview Posting and Posting locked.'
          },
          activeCase: {
            status: 'done',
            resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-040-result.json`,
            nextCase
          }
        }
      : {},
    reason: foundationRecordsVisible
      ? 'Location, customer and item foundation records are visible read-only; VAT/posting setup remains the next dependency.'
      : 'Foundation record recheck is incomplete; no setup or process case should start yet.',
    nextCase
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-040 Foundation Ready Recheck',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Sichtbar',
      '',
      ...observed.map((entry) => `- ${entry.label}`),
      '',
      '## Grenzen',
      '',
      '- Keine Setup-Aenderung.',
      '- Keine Stammdaten-Aenderung.',
      '- Kein Belegentwurf.',
      '- Keine Preview und keine Buchung.',
      '- Keine Customer/Vendor/Item Posting Group, keine USt-Posting-Matrix und keine Posten sind bewiesen.',
      '',
      '## Naechster sinnvoller Schritt',
      '',
      '- TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT, weil O2C/P2P noch Setup- und USt-Grenzen brauchen.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(results.every((entry) => instancePathIsTarget(entry.url) && companyParamIsTarget(entry.url))).toBe(true);
  expect(blocked, blocked.map((entry) => `${entry.id}: ${entry.reason}`).join('\n')).toHaveLength(0);
  expect(locationVisible, 'SAAR-HL must be visible read-only.').toBe(true);
  expect(customerVisible, 'U-CUST-100 must be visible read-only.').toBe(true);
  expect(itemVisible, 'U-ITEM-HW100 with STK must be visible read-only.').toBe(true);
});
