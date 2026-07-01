import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-036B-CUSTOMER-VENDOR-ITEM-TEMPLATE-DIALOG-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-036b-customer-vendor-item-template-dialog-discovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036B-result.json');

type Probe = {
  id: 'customers' | 'vendors' | 'items';
  pageId: number;
  listLabel: string;
  expectedListText: RegExp;
  expectedAfterNewText: RegExp;
  includeText: RegExp[];
  plannedRecords: string[];
  nextWriteCandidate: string;
};

type ProbeResult = {
  id: string;
  pageId: number;
  listLabel: string;
  status: 'observed' | 'blocked';
  routeType: 'card-with-apply-template-action' | 'template-dialog' | 'direct-card-or-list-state' | 'unknown';
  urlBefore: string;
  urlAfterNew: string;
  urlAfterClose: string;
  screenshotBefore: string;
  screenshotAfterNew: string;
  screenshotAfterClose: string;
  textSignals: string[];
  actionsTaken: string[];
  blockedBy: string[];
  warnings: string[];
  notProved: string[];
  plannedRecords: string[];
  nextWriteCandidate: string;
};

const probes: Probe[] = [
  {
    id: 'customers',
    pageId: 22,
    listLabel: 'Customers / Debitoren',
    expectedListText: /Customers|Debitoren|Customer|Debitor|No\.|Nr\.|Name/i,
    expectedAfterNewText: /Customer|Debitor|Template|Vorlage|Name|Nr\.|No\./i,
    includeText: [
      /Customers|Debitoren|Customer|Debitor|New|Neu|Template|Vorlage|Apply Template|Vorlage anwenden|Name|Nr\.|No\.|Posting Group|Buchungsgruppe|Payment Terms|Zahlungsbedingung/i
    ],
    plannedRecords: ['U-CUST-100', 'U-CUST-110', 'U-CUST-120', 'U-CUST-190', 'U-CUST-900'],
    nextWriteCandidate: 'U-CUST-100'
  },
  {
    id: 'vendors',
    pageId: 27,
    listLabel: 'Vendors / Kreditoren',
    expectedListText: /Vendors|Kreditoren|Vendor|Kreditor|No\.|Nr\.|Name/i,
    expectedAfterNewText: /Vendor|Kreditor|Template|Vorlage|Name|Nr\.|No\./i,
    includeText: [
      /Vendors|Kreditoren|Vendor|Kreditor|New|Neu|Template|Vorlage|Apply Template|Vorlage anwenden|Name|Nr\.|No\.|Posting Group|Buchungsgruppe|Payment Terms|Zahlungsbedingung/i
    ],
    plannedRecords: ['U-VEND-100', 'U-VEND-110', 'U-VEND-120', 'U-VEND-130', 'U-VEND-900'],
    nextWriteCandidate: 'U-VEND-100'
  },
  {
    id: 'items',
    pageId: 31,
    listLabel: 'Items / Artikel',
    expectedListText: /Items|Artikel|Item|No\.|Nr\.|Description|Beschreibung/i,
    expectedAfterNewText: /Item|Artikel|Template|Vorlage|Description|Beschreibung|Type|Typ|No\.|Nr\./i,
    includeText: [
      /Items|Artikel|Item|New|Neu|Template|Vorlage|Apply Template|Vorlage anwenden|Description|Beschreibung|Type|Typ|No\.|Nr\.|Inventory|Lager|Posting Group|Buchungsgruppe|Base Unit|Basiseinheit/i
    ],
    plannedRecords: ['U-ITEM-HW100', 'U-ITEM-RM100', 'U-ITEM-FG100', 'U-ITEM-SRV100', 'U-ITEM-ERR900'],
    nextWriteCandidate: 'U-ITEM-HW100'
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

function containsHardForbiddenText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Delete\?|Loeschen\?|Loschen\?|Payment Journal|Zahlungsjournal|Buchen/i.test(
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

async function captureState(page: Page, probe: Probe, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: probe.includeText,
    maxLines: 160,
    maxLineLength: 220
  });
  const text = await safeText(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    visible: {
      expectedListText: probe.expectedListText.test(text),
      expectedAfterNewText: probe.expectedAfterNewText.test(text),
      newAction: /\bNew\b|\bNeu\b/i.test(text),
      templateSignal: /Template|Vorlage|Apply Template|Vorlage anwenden/i.test(text),
      postingGroupSignal: /Posting Group|Buchungsgruppe/i.test(text),
      hardForbiddenSignal: containsHardForbiddenText(text)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: probe.pageId,
    page: probe.listLabel,
    step,
    visibleLearning: [
      'Neu/New ist der Einstieg in die Stammdatenanlage.',
      'Debitoren, Kreditoren und Artikel koennen Vorlagen oder Pflichtfelder ausloesen.',
      'Dieser Case oeffnet nur den Weg und schliesst ihn wieder ohne Speichern.'
    ],
    importantUi: ['New/Neu', 'Template/Vorlage falls sichtbar', 'Card/List context', 'Cancel/Close route'],
    internallyProves: snapshot.visible.expectedAfterNewText
      ? `${probe.listLabel} New route produced a visible dialog or card context.`
      : `${probe.listLabel} route was captured but remains incomplete.`,
    doesNotProve: [
      'No customer, vendor or item was saved.',
      'No template was applied.',
      'No posting group or VAT group was proven on a saved record.',
      'No document, Preview Posting, Posting or ledger trace exists.'
    ],
    finalScreenshotStatus: 'universaarl-dialog-discovery',
    ...extra
  });
  return snapshot;
}

async function findFrameText(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (expected.test(bodyText)) return { frame, bodyText: clean(bodyText) };
  }
  throw new Error(`No Business Central frame found for ${expected}.`);
}

async function firstVisible(locator: Locator, timeout = 800) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible({ timeout }).catch(() => false)) return item;
  }
  return undefined;
}

async function clickScopedNew(page: Page, frame: Frame) {
  for (const scope of [frame, page]) {
    const exactButton = await firstVisible(scope.getByRole('button', { name: /^Neu$|^New$/i }), 900);
    if (exactButton) {
      await exactButton.click({ timeout: 5000 }).catch(async () => exactButton.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(1700);
      return true;
    }

    const exactMenu = await firstVisible(scope.getByRole('menuitem', { name: /^Neu$|^New$/i }), 700);
    if (exactMenu) {
      await exactMenu.click({ timeout: 5000 }).catch(async () => exactMenu.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(1700);
      return true;
    }
  }
  return false;
}

async function closeOrCancel(page: Page) {
  const actions: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const cancel = await firstVisible(
      scope.getByRole('button', { name: /Abbrechen|Cancel|Schliessen|Schließen|Close|Discard|Verwerfen/i }),
      700
    );
    if (cancel) {
      await cancel.click({ timeout: 4000 }).catch(async () => cancel.click({ timeout: 4000, force: true }));
      actions.push('clicked cancel/close/discard button');
      await page.waitForTimeout(1000);
      return actions;
    }
  }

  await page.keyboard.press('Escape').catch(() => undefined);
  actions.push('pressed Escape');
  await page.waitForTimeout(900);
  return actions;
}

async function openProbePage(page: Page, probe: Probe) {
  await page.goto(buildPlaythruUrl(probe.pageId).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1500);
  const text = await safeText(page);
  const url = page.url();
  expect(instancePathIsTarget(url), `URL must stay in ${EXPECTED_INSTANCE}: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL must stay in company ${TARGET_COMPANY}: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(probe.expectedListText.test(text), `${probe.listLabel} list context must be visible`).toBe(true);
  expect(containsHardForbiddenText(text), 'No posting/payment/delete dialog may be visible before New discovery').toBe(false);
}

async function probeNewRoute(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const notProved: string[] = [
    'No customer, vendor or item was saved.',
    'No template was applied.',
    'No posting group or VAT group was proven on a saved card.',
    'No document, Preview Posting, Posting or ledger trace is proven.'
  ];

  await openProbePage(page, probe);
  const beforePrefix = `target-036b-${String(index).padStart(3, '0')}-${probe.id}-before`;
  const before = await captureState(page, probe, beforePrefix, `Before scoped New route discovery for ${probe.listLabel}.`, {
    plannedRecords: probe.plannedRecords
  });
  const urlBefore = page.url();
  const { frame } = await findFrameText(page, probe.expectedListText);
  const newClicked = await clickScopedNew(page, frame);
  actionsTaken.push(newClicked ? 'clicked scoped New/Neu action' : 'New/Neu action not clicked because it was not visible');
  if (!newClicked) {
    blockedBy.push(`${probe.listLabel}: scoped New/Neu action was not visible.`);
  }

  const afterPrefix = `target-036b-${String(index + 1).padStart(3, '0')}-${probe.id}-after-new`;
  const afterNew = await captureState(page, probe, afterPrefix, `After scoped New route discovery for ${probe.listLabel}.`, {
    newClicked,
    plannedRecords: probe.plannedRecords
  });
  const textAfterNew = await safeText(page);
  const urlAfterNew = page.url();
  const routeType =
    /Customer Card|Debitorenkarte|Vendor Card|Kreditorenkarte|Item Card|Artikelkarte/i.test(textAfterNew) &&
    /Apply Template|Vorlage anwenden/i.test(textAfterNew)
      ? 'card-with-apply-template-action'
      : /Template|Vorlage|Apply Template|Vorlage anwenden/i.test(textAfterNew)
        ? 'template-dialog'
        : probe.expectedAfterNewText.test(textAfterNew)
          ? 'direct-card-or-list-state'
          : 'unknown';

  if (!instancePathIsTarget(urlAfterNew) || !companyParamIsTarget(urlAfterNew)) {
    blockedBy.push(`${probe.listLabel}: context changed away from ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`);
  }
  if (containsHardForbiddenText(textAfterNew)) {
    blockedBy.push(`${probe.listLabel}: hard forbidden action text appeared after New.`);
  }
  if (routeType === 'unknown') {
    blockedBy.push(`${probe.listLabel}: New route did not reveal a recognizable template/card/list state.`);
  }
  if (routeType === 'card-with-apply-template-action') {
    warnings.push(`${probe.listLabel}: New opens a card with Vorlage anwenden / Apply Template, not a separate template-selection dialog.`);
    notProved.push(`${probe.listLabel}: no template contents or template application flow is proven because Vorlage anwenden was not clicked.`);
  }
  if (routeType === 'direct-card-or-list-state') {
    warnings.push(`${probe.listLabel}: New route did not show a clear template action; a future write case needs card-field and close-route checks.`);
    notProved.push(`${probe.listLabel}: template choice is not proven because the route may open a direct card or unchanged list state.`);
  }

  const closeActions = await closeOrCancel(page);
  actionsTaken.push(...closeActions);
  await page.goto(buildPlaythruUrl(probe.pageId).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1000);
  const afterClosePrefix = `target-036b-${String(index + 2).padStart(3, '0')}-${probe.id}-after-close`;
  const afterClose = await captureState(page, probe, afterClosePrefix, `After closing/cancelling New route for ${probe.listLabel}.`, {
    closeActions,
    plannedRecords: probe.plannedRecords
  });
  const urlAfterClose = page.url();

  if (!probe.expectedListText.test(await safeText(page))) {
    blockedBy.push(`${probe.listLabel}: list context was not recovered after closing/cancelling.`);
  }

  return {
    id: probe.id,
    pageId: probe.pageId,
    listLabel: probe.listLabel,
    status: blockedBy.length ? 'blocked' : 'observed',
    routeType,
    urlBefore: sanitizeEvidenceUrl(urlBefore),
    urlAfterNew: sanitizeEvidenceUrl(urlAfterNew),
    urlAfterClose: sanitizeEvidenceUrl(urlAfterClose),
    screenshotBefore: `playwright/projects/fibu-book5/img/${beforePrefix}.png`,
    screenshotAfterNew: `playwright/projects/fibu-book5/img/${afterPrefix}.png`,
    screenshotAfterClose: `playwright/projects/fibu-book5/img/${afterClosePrefix}.png`,
    textSignals: [before.compact, afterNew.compact, afterClose.compact].join('\n').split('\n').filter(Boolean).slice(0, 60),
    actionsTaken,
    blockedBy,
    warnings,
    notProved,
    plannedRecords: probe.plannedRecords,
    nextWriteCandidate: probe.nextWriteCandidate
  };
}

test('TARGET-036B discovers customer vendor item template dialogs without saving records', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const results: ProbeResult[] = [];
  for (let index = 0; index < probes.length; index += 1) {
    results.push(await probeNewRoute(page, probes[index], index * 10 + 10));
  }

  const blocked = results.filter((entry) => entry.status === 'blocked');
  const observed = results.filter((entry) => entry.status === 'observed');
  const routeSummary = Object.fromEntries(results.map((entry) => [entry.id, entry.routeType]));
  const selectedNextCase = blocked.length
    ? 'TARGET-036B-CUSTOMER-VENDOR-ITEM-TEMPLATE-DIALOG-RECOVERY'
    : 'TARGET-036C-FIRST-CUSTOMER-CONTROLLED-WRITE-GATE';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-masterdata-template-dialog-discovery',
    resultStatus: blocked.length ? 'blocked' : 'observed',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    pages: results,
    routeSummary,
    actionsTaken: [
      'Opened Customers, Vendors and Items pages in playthru / UNIVERSAARL-DE.',
      'Clicked scoped New/Neu once per page only for dialog/card discovery.',
      'Captured before, after-New and after-close screenshots for each page.',
      'Closed/cancelled/escaped the opened route and reopened the list page.'
    ],
    actionsNotTaken: [
      'No customer was saved.',
      'No vendor was saved.',
      'No item was saved.',
      'No template was applied.',
      'No setup field was changed.',
      'No document or draft was created.',
      'No Preview Posting was executed.',
      'No Posting was executed.',
      'No payment was executed.',
      'No API shortcut was used.',
      'No company switch was executed.'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: results.flatMap((entry) => [entry.screenshotBefore, entry.screenshotAfterNew, entry.screenshotAfterClose]),
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      `${observed.length}/3 New routes were opened and then closed/cancelled without saving a record.`,
      ...observed.map((entry) => `${entry.listLabel}: New route classified as ${entry.routeType}.`)
    ],
    notProved: [
      'No customer, vendor or item is ready for creation yet.',
      'No saved customer/vendor/item card, posting group, VAT group, number-series assignment or default dimension is proven.',
      'No document, Preview Posting, Posting or ledger trace is proven.',
      ...results.flatMap((entry) => entry.notProved),
      ...blocked.flatMap((entry) => entry.blockedBy)
    ],
    blockedBy: blocked.flatMap((entry) => entry.blockedBy),
    warnings: Array.from(new Set(results.flatMap((entry) => entry.warnings))),
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCustomerCreated: true,
      noVendorCreated: true,
      noItemCreated: true,
      noTemplateApplied: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-036A created or verified Location SAAR-HL with Code and Name only and reopen proof.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Customer, Vendor and Item records are accounting-relevant and can trigger templates or mandatory fields; New routes must be classified before saving records.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-036C-FIRST-CUSTOMER-CONTROLLED-WRITE-GATE',
          status: blocked.length ? 'blocked' : 'ready-after-current',
          reason: blocked.length ? 'At least one New route still needs recovery.' : 'Customer write can be prepared only with explicit field/template gates.'
        },
        {
          caseId: 'TARGET-036D-FIRST-VENDOR-CONTROLLED-WRITE-GATE',
          status: blocked.length ? 'blocked' : 'ready-after-current',
          reason: blocked.length ? 'Vendor route depends on this discovery being complete.' : 'Vendor write should wait until customer route proves the shared template pattern.'
        },
        {
          caseId: 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Item creation needs inventory/posting/unit/template field gates before a saved item.'
        },
        {
          caseId: 'TARGET-039-FOUNDATION-BLOCKER-REVISIT',
          status: 'ready-after-current',
          reason: 'Parked Page 314, VAT matrix, inventory posting and default-dimension blockers remain relevant before first document flow.'
        },
        {
          caseId: 'TARGET-037-FIRST-PREVIEW-GATE',
          status: 'blocked',
          reason: 'Preview requires real master data, accepted setup boundaries and expected entry traces.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase,
      whySelectedNextCaseIsBest: blocked.length
        ? 'Recover the unsafe New route before any accounting-relevant master-data write.'
        : 'Customer is the next smallest accounting master-data write; Vendor and Item remain behind additional gates.',
      risksBeforeNextCase: [
        'A future write case must not click Vorlage anwenden / Apply Template blindly.',
        'List/card visibility is not posting readiness.',
        'Item creation is riskier than customer/vendor because it touches inventory and product posting groups.'
      ],
      requiredPreparation: [
        'Define exact field list for the first saved customer, including whether Vorlage anwenden is needed.',
        'Keep vendor and item writes locked until their own Smart Decision cards exist.'
      ]
    },
    nextCase: selectedNextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036B-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-036b-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036B-result.json`,
      ...results.flatMap((entry) => [entry.screenshotBefore, entry.screenshotAfterNew, entry.screenshotAfterClose])
    ],
    requiresReview: blocked.length > 0,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeCase: selectedNextCase,
        activeArea: blocked.length ? 'universaarl-master-data-template-dialog-recovery' : 'universaarl-first-customer-controlled-write',
        nextStep: blocked.length
          ? 'Recover blocked Customer/Vendor/Item New route before saving any accounting master data.'
          : 'Prepare TARGET-036C as the first customer controlled write gate; do not create vendor/item records yet.'
      },
      activeCase: {
        status: blocked.length ? 'blocked' : 'done',
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036B-result.json`,
        nextCase: selectedNextCase
      },
      coverage: {
        latestTarget036BTemplateDialogDiscovery: {
          caseId: CASE_ID,
          status: blocked.length ? 'blocked' : 'observed',
          routeSummary,
          resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036B-result.json`
        }
      }
    },
    reason: blocked.length
      ? `Template/dialog discovery blocked: ${blocked.flatMap((entry) => entry.blockedBy).join('; ')}`
      : 'Customer, Vendor and Item New routes opened direct cards with Vorlage anwenden / Apply Template actions and were closed/cancelled without saving records.'
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-036B Customer/Vendor/Item Template Dialog Discovery',
      '',
      `Status: ${result.resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Routen',
      '',
      ...results.map((entry) => `- ${entry.listLabel}: ${entry.routeType}`),
      '',
      '## Grenzen',
      '',
      '- Keine Debitoren, Kreditoren oder Artikel wurden gespeichert.',
      '- Keine Vorlage wurde angewendet; sichtbar war eine Kartenroute mit der Aktion Vorlage anwenden.',
      '- Keine Setup-Felder, Belege, Preview oder Buchung.',
      '- Ein spaeterer Schreibcase braucht eine eigene Feldliste und einen neuen Smart Decision Gate.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(blocked, blocked.flatMap((entry) => entry.blockedBy).join('\n')).toHaveLength(0);
});
