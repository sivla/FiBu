import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(360_000);

const CASE_ID = 'TARGET-040-ITEM-INVENTORY-FOUNDATION-READONLY-PREFLIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-040-item-inventory-foundation-readonly-preflight';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-040-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  expectedText: RegExp;
  include: RegExp[];
  purpose: string;
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
    id: 'inventory-setup',
    pageId: 461,
    label: 'Lager Einrichtung / Inventory Setup',
    expectedText: /Inventory Setup|Lager Einrichtung|Lager.*Einrichtung|Item Nos\.|Artikelnr|Artikel.*Nr|Automatic Cost|Automatische/i,
    include: [/Inventory Setup|Lager|Item Nos|Artikel|Automatic Cost|Kosten|Nummern|Nr\.|Units|Einheit|Posting|Buchung/i],
    purpose: 'Read-only proof of Inventory Setup before an item write. This page can contain item number series and inventory costing defaults.',
    doesNotProve: [
      'No item number series assignment was changed.',
      'No costing or inventory setup value is proven correct.',
      'No item can be created from this page proof alone.'
    ]
  },
  {
    id: 'inventory-posting-setup',
    pageId: 5826,
    label: 'Lagerbuchung Einrichtung / Inventory Posting Setup',
    expectedText: /Inventory Posting Setup|Lagerbuchung Einrichtung|Lagerbuchungsmatrix|Inventory Account|Bestandskonto|Location Code|Lagerortcode|Invt\. Posting Group/i,
    include: [/Inventory Posting Setup|Lagerbuchung|Inventory Account|Bestand|Location Code|Lagerort|Posting Group|Buchungsgruppe|Code|Account|Konto/i],
    purpose: 'Read-only proof of the page that connects inventory posting groups and locations to inventory G/L accounts.',
    doesNotProve: [
      'No inventory posting setup row was created or changed.',
      'No inventory account correctness is proven.',
      'No item ledger, value entry or G/L entry exists from this proof.'
    ]
  },
  {
    id: 'item-posting-groups',
    pageId: 112,
    label: 'Artikelbuchungsgruppen / Item Posting Groups',
    expectedText: /Item Posting Groups|Artikelbuchungsgruppen|Inventory Posting Groups|Lagerbuchungsgruppen|Code|Description|Beschreibung/i,
    include: [/Item Posting Groups|Artikelbuchungsgruppen|Inventory Posting Groups|Lagerbuchungsgruppen|Code|Description|Beschreibung|Inventory|Lager/i],
    purpose: 'Read-only proof of the item posting group list before a first item is created.',
    doesNotProve: [
      'No item posting group was created or changed.',
      'No item card default is proven.',
      'No posting readiness is proven.'
    ]
  },
  {
    id: 'base-units',
    pageId: 209,
    label: 'Einheiten / Units of Measure',
    expectedText: /Units of Measure|Einheiten|Unit of Measure|Code|Description|Beschreibung|Base Unit/i,
    include: [/Units of Measure|Einheiten|Unit of Measure|Base Unit|Basiseinheit|Code|Description|Beschreibung|PCS|STK|Stueck|Stuck/i],
    purpose: 'Read-only proof of unit-of-measure context before filling the item Base Unit field.',
    doesNotProve: [
      'No unit of measure was created or changed.',
      'No Base Unit value is selected for a future item.',
      'No item card is saved.'
    ]
  },
  {
    id: 'items-list',
    pageId: 31,
    label: 'Artikel / Items',
    expectedText: /Items|Artikel|Item|Nr\.|No\.|Description|Beschreibung|Base Unit|Basiseinheit|Type|Art/i,
    include: [/Items|Artikel|Nr\.|No\.|Description|Beschreibung|Base Unit|Basiseinheit|Type|Art|Inventory|Bestand|New|Neu|Template|Vorlage/i],
    purpose: 'Read-only item list/card context only. New/Edit/Apply Template stay locked.',
    doesNotProve: [
      'No item was created.',
      'No item card required fields are fully proven.',
      'No template was applied.',
      'No inventory, VAT or general posting setup is proven complete.'
    ]
  }
];

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
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

function containsDangerousDialog(text: string) {
  return /Do you want to post|Moechten Sie buchen|Delete\?|Loeschen\?|Ship and Invoice|Liefern und fakturieren|Preview Posting|Buchungsvorschau|Create\?|Erstellen\?|Save\?|Speichern\?/i.test(
    text
  );
}

function visibleWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Aenderungen/i.test(text) ? 'Edit/Bearbeiten action may be visible but was not clicked.' : '',
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
  const url = buildPlaythruUrl(probe.pageId);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);

  const rawText = await pageText(page);
  const text = clean(rawText);
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = containsDangerousDialog(text);
  const matchedExpectedText = probe.expectedText.test(text);
  const status = !safeContext || dangerousDialog ? 'blocked' : matchedExpectedText ? 'observed' : 'rejected';
  const compact = await compactPageText(page, {
    include: probe.include,
    maxLines: 90,
    maxLineLength: 180
  });
  const screenshot = `target-040-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = `${probe.id}.txt`;
  const textSignals = compact
    .split('\n')
    .filter((line) => !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer/i.test(line))
    .slice(0, 45);

  await writeText(textFile, compact || text.slice(0, 5000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    step: probe.purpose,
    status: status === 'observed' ? 'universaarl-readonly-candidate' : status,
    bookUse: status === 'observed' ? 'item-inventory-foundation-preflight' : 'do-not-use-as-proof',
    visibleLearning: textSignals.slice(0, 16),
    importantUi: [
      'Direct page route',
      'No New action',
      'No Edit action',
      'No Apply Template',
      'No setup change',
      'No Preview Posting or Posting'
    ],
    internallyProves:
      status === 'observed'
        ? `${probe.label} opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `The requested ${probe.label} route did not yet produce safe page proof.`,
    doesNotProve: probe.doesNotProve,
    finalScreenshotStatus: status === 'observed' ? 'candidate' : 'rejected'
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot: `playwright/projects/fibu-book5/img/${screenshot}`,
    textFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${textFile}`,
    textSignals,
    visibleWarnings: visibleWarnings(text),
    reason: !safeContext
      ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
      : dangerousDialog
        ? 'Dangerous dialog/action text detected; no action was confirmed.'
        : matchedExpectedText
          ? 'Expected item/inventory page text is visible.'
          : 'Expected item/inventory page text was not visible.'
  };
}

test('TARGET-040 read-only item/inventory Foundation preflight', async ({ page }) => {
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
  const enoughPreflight =
    observed.some((entry) => entry.id === 'inventory-setup') &&
    observed.some((entry) => entry.id === 'inventory-posting-setup') &&
    observed.some((entry) => entry.id === 'items-list');
  const resultStatus = blocked.length ? 'blocked' : enoughPreflight ? 'observed' : 'partial';
  const nextCase = enoughPreflight
    ? 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE'
    : 'TARGET-040B-ITEM-INVENTORY-PREFLIGHT-ROUTE-FOLLOWUP';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-item-inventory-foundation-preflight',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: results.at(-1)?.url ?? '',
    page: 'read-only item and inventory setup pages',
    actionsTaken: [
      'Opened direct Business Central page URLs in playthru / UNIVERSAARL-DE.',
      'Captured read-only page text and screenshots.',
      'Checked context and dangerous-dialog stop conditions before accepting each page.'
    ],
    actionsNotTaken: [
      'No New action clicked.',
      'No Edit action clicked.',
      'No Apply Template action clicked.',
      'No setup value changed.',
      'No item, customer or vendor created.',
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
      `${observed.length}/${probes.length} item/inventory Foundation pages opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
      'No item was created and no setup was changed.',
      'No document, Preview Posting or Posting occurred.',
      ...observed.map((entry) => `${entry.label} visible read-only.`)
    ],
    notProved: [
      'Read-only visibility is not item setup correctness.',
      'No first item is proven created.',
      'No Base Unit was selected on an item card.',
      'No Item Posting Group or Inventory Posting Setup value is proven correct for a future item.',
      'No Item Ledger Entries, Value Entries, G/L Entries or VAT Entries are proven.',
      ...rejected.map((entry) => `${entry.label}: ${entry.reason}`),
      ...blocked.map((entry) => `${entry.label}: ${entry.reason}`)
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-040-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-040-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-040-result.json`,
      ...results.map((entry) => entry.screenshot)
    ],
    pages: results,
    blockedBy: [...blocked, ...rejected].map((entry) => `${entry.id}: ${entry.reason}`),
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
      noSearch: true,
      noBookMasterChange: true,
      noTemplateApplied: true,
      readOnlyDirectPageRoutes: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-039 selected read-only item/inventory Foundation preflight before the first item write.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'Item creation affects Base Unit, Item Type, inventory posting, item posting and later value entries, so page context must be visible before writing.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE',
          status: enoughPreflight ? 'ready-next' : 'needs-ui-discovery-first',
          reason: enoughPreflight
            ? 'Core item/inventory setup pages and Items list were visible read-only; a narrow item-write gate can be planned next.'
            : 'At least one core item/inventory preflight page was missing or rejected.'
        },
        {
          caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
          status: 'ready-after-current',
          reason: 'Useful after the first item route is either completed or blocked.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'O2C still needs item plus posting/VAT boundaries and expected entry trace.'
        },
        {
          caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
          status: 'blocked',
          reason: 'Vendor remains blocked until a new non-repeated U-VEND Manual Nos. route exists.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: enoughPreflight
        ? 'A first item write gate is now the smallest useful next step, with New/Edit/Template still requiring its own Smart Decision.'
        : 'Missing page proof must be fixed before item write.',
      risksBeforeNextCase: [
        'New/Neu on Items creates a card and must be gated.',
        'Apply Template/Vorlage anwenden can change defaults and must not be clicked casually.',
        'Inventory Posting Setup visibility does not prove account correctness.'
      ],
      requiredPreparation: enoughPreflight
        ? [
            'Define one item only for the first write.',
            'Specify fields to set: No., Description, Type, Base Unit and only visible non-posting defaults.',
            'Keep posting groups/VAT groups read-only unless a later setup case unlocks them.'
          ]
        : ['Recover the rejected item/inventory setup page route without using search-overlay screenshots as proof.']
    },
    requiresReview: !enoughPreflight,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        updatedAt: '2026-07-01T13:25:00.000Z',
        activeArea: enoughPreflight ? 'universaarl-first-item-write-gate' : 'universaarl-item-inventory-preflight-followup',
        activeCase: nextCase,
        active_case_file: enoughPreflight
          ? '.agent/state/cases/target-036e-first-item-controlled-write-gate.json'
          : '.agent/state/cases/target-040b-item-inventory-preflight-route-followup.json',
        nextCase,
        nextStep: enoughPreflight
          ? 'Plan TARGET-036E as a narrow first-item controlled write gate; no documents, Preview Posting or Posting.'
          : 'Recover missing item/inventory setup page proof before any item write.'
      }
    },
    reason: enoughPreflight
      ? 'Core item/inventory preflight pages were observed read-only; item write can be planned as a separate gated case.'
      : 'Item/inventory preflight is incomplete; no write is allowed.',
    nextCase
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-040 Item/Inventory Foundation Read-only Preflight',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Sichtbare Seiten',
      '',
      ...observed.map((entry) => `- ${entry.label}`),
      '',
      '## Grenzen',
      '',
      '- Keine Setup-Aenderung.',
      '- Kein Artikel wurde angelegt.',
      '- Keine Vorlage wurde angewendet.',
      '- Kein Belegentwurf.',
      '- Keine Preview und keine Buchung.',
      '- Sichtbarkeit ist noch kein Beweis fuer Buchungsfaehigkeit oder Kontenrichtigkeit.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(results.every((entry) => instancePathIsTarget(entry.url) && companyParamIsTarget(entry.url))).toBe(true);
  expect(blocked, blocked.map((entry) => `${entry.id}: ${entry.reason}`).join('\n')).toHaveLength(0);
  expect(observed.length).toBeGreaterThanOrEqual(3);
});
