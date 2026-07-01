import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-036A-FIRST-LOCATION-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-036a-first-location-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036A-result.json');
const LOCATIONS_PAGE_ID = 15;

const targetLocation = {
  code: 'SAAR-HL',
  name: 'Saarbruecken Hauptlager'
};

type Step = Record<string, unknown>;

function buildPlaythruUrl(pageId: number, filterTarget = false) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  if (filterTarget) {
    url.searchParams.set('filter', `'Location'.'Code' IS '${targetLocation.code}'`);
  }
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

function literalPattern(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
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

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsForbiddenDialog(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Delete\?|Loeschen\?|Loschen\?|Apply\?|Anwenden\?|Mandant wechseln|Unternehmen wechseln|Template|Vorlage/i.test(
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

async function assertSafeContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  const text = await safeText(page);
  expect(/Locations|Lagerorte|Location|Lagerort|Code|Name/i.test(text), 'Locations/Lagerorte-Kontext muss sichtbar sein').toBe(true);
  expect(containsForbiddenDialog(text), 'Keine Template-, Stammdaten-, Company-, Loesch-, Preview- oder Buchungsdialoge erlaubt').toBe(false);
}

async function openLocations(page: Page, filterTarget = false) {
  await page.goto(buildPlaythruUrl(LOCATIONS_PAGE_ID, filterTarget).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1500);
  await assertSafeContext(page);
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (expected.test(bodyText)) return { frame, bodyText: clean(bodyText) };
  }
  throw new Error(`Kein BC-Frame mit ${expected} gefunden.`);
}

async function firstVisible(locator: Locator, timeout = 800) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible({ timeout }).catch(() => false)) return item;
  }
  return undefined;
}

async function clickAction(page: Page, frame: Frame, name: RegExp) {
  for (const scope of [frame, page]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = await firstVisible(scope.getByRole(role, { name }), 900);
      if (action) {
        await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(900);
        return true;
      }
    }
  }
  return false;
}

async function editableTextboxes(scope: Frame | Locator) {
  const boxes = scope.locator('input[role="textbox"], input[role="combobox"], textarea[role="textbox"], input:not([type])');
  const result: Locator[] = [];
  const count = await boxes.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const box = boxes.nth(index);
    if (!(await box.isVisible({ timeout: 300 }).catch(() => false))) continue;
    if (await box.isDisabled({ timeout: 300 }).catch(() => false)) continue;
    if ((await box.isEditable({ timeout: 300 }).catch(() => false)) === false) continue;
    result.push(box);
  }
  return result;
}

async function fillBox(page: Page, box: Locator, value: string) {
  await box.click({ force: true });
  await box.fill('').catch(async () => {
    await page.keyboard.press('Control+A');
  });
  await page.keyboard.insertText(value);
}

async function fillByLabelOrFirstSafeInputs(page: Page, frame: Frame, steps: Step[]) {
  const allBoxes = await editableTextboxes(frame);
  const inspected = [];
  for (const box of allBoxes) {
    inspected.push({
      aria: (await box.getAttribute('aria-label').catch(() => '')) || '',
      title: (await box.getAttribute('title').catch(() => '')) || '',
      value: (await box.inputValue({ timeout: 300 }).catch(() => '')) || ''
    });
  }
  steps.push({ step: 'editable-inputs-after-new', inspected });

  const codeByLabel = await firstVisible(frame.getByRole('textbox', { name: /^Code$/i }), 500);
  const nameByLabel = await firstVisible(frame.getByRole('textbox', { name: /^Name$/i }), 500);
  if (codeByLabel && nameByLabel) {
    await fillBox(page, codeByLabel, targetLocation.code);
    await page.keyboard.press('Tab');
    await fillBox(page, nameByLabel, targetLocation.name);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200);
    return { changed: true, reason: 'Filled labelled Code and Name fields.' };
  }

  const rows = frame.getByRole('row');
  const rowCount = await rows.count().catch(() => 0);
  for (let rowIndex = rowCount - 1; rowIndex >= 0; rowIndex -= 1) {
    const row = rows.nth(rowIndex);
    if (!(await row.isVisible({ timeout: 300 }).catch(() => false))) continue;
    const rowBoxes = await editableTextboxes(row);
    if (rowBoxes.length < 2) continue;
    const firstValue = await rowBoxes[0].inputValue({ timeout: 300 }).catch(() => '');
    if (firstValue.trim()) continue;
    await fillBox(page, rowBoxes[0], targetLocation.code);
    await page.keyboard.press('Tab');
    await fillBox(page, rowBoxes[1], targetLocation.name);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200);
    return { changed: true, reason: 'Filled first empty editable row pair as Code and Name.' };
  }

  const emptyBoxes = [];
  for (const box of allBoxes) {
    const value = await box.inputValue({ timeout: 300 }).catch(() => '');
    if (!value.trim()) emptyBoxes.push(box);
  }
  if (emptyBoxes.length >= 2) {
    await fillBox(page, emptyBoxes[0], targetLocation.code);
    await page.keyboard.press('Tab');
    await fillBox(page, emptyBoxes[1], targetLocation.name);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200);
    return { changed: true, reason: 'Filled first two empty editable inputs as Code and Name.' };
  }

  return { changed: false, reason: 'No safe Code/Name input pair was visible after New.' };
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [
      /Locations|Lagerorte|Location|Lagerort|Code|Name|SAAR-HL|Saarbruecken Hauptlager|New|Neu|Edit|Bearbeiten|List|Liste|Require Receive|Wareneingang|Require Shipment|Warenausgang|Bin Mandatory|Lagerplatz/i
    ],
    maxLines: 180,
    maxLineLength: 220
  });
  const text = await safeText(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    visible: {
      pageContext: /Locations|Lagerorte|Location|Lagerort/i.test(text),
      targetCode: literalPattern(targetLocation.code).test(text),
      targetName: literalPattern(targetLocation.name).test(text),
      newAction: /\bNew\b|\bNeu\b/i.test(text),
      warehouseFieldsMentioned: /Require Receive|Wareneingang|Require Shipment|Warenausgang|Bin Mandatory|Lagerplatz/i.test(text)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: LOCATIONS_PAGE_ID,
    page: 'Locations / Lagerorte',
    step,
    visibleLearning: [
      'Ein Lagerort ist ein Stammdatensatz fuer Waren- und Lagerprozesse.',
      'In diesem Gate werden nur Code und Name fuer SAAR-HL bearbeitet.',
      'Warehouse-, Lagerplatz-, Posting-, Stammdaten- und Belegfelder bleiben unberuehrt.'
    ],
    importantUi: ['Locations/Lagerorte Liste oder Karte', 'Code', 'Name', 'New/Neu'],
    internallyProves:
      snapshot.visible.targetCode && snapshot.visible.targetName
        ? 'SAAR-HL / Saarbruecken Hauptlager ist im Locations-Kontext sichtbar.'
        : 'Locations-Kontext vor oder waehrend des kontrollierten Schreibgates.',
    doesNotProve: [
      'Keine Warehouse-Einrichtung.',
      'Keine Lagerplatzpflicht.',
      'Keine Inventory Posting Setup Zeile.',
      'Keine Kunden, Kreditoren, Artikel, Belege, Preview Posting oder Buchung.'
    ],
    finalScreenshotStatus: snapshot.visible.targetCode && snapshot.visible.targetName ? 'universaarl-masterdata-evidence' : 'setup-before',
    ...extra
  });
  return snapshot;
}

async function createOrVerifyLocation(page: Page, steps: Step[]) {
  await openLocations(page);
  const textBefore = await safeText(page);
  if (literalPattern(targetLocation.code).test(textBefore)) {
    if (!literalPattern(targetLocation.name).test(textBefore)) {
      return {
        changed: false,
        status: 'blocked' as const,
        reason: `${targetLocation.code} exists, but the expected name ${targetLocation.name} is not visible.`
      };
    }
    return {
      changed: false,
      status: 'already-exists' as const,
      reason: `${targetLocation.code} / ${targetLocation.name} already visible before write gate.`
    };
  }

  const { frame } = await findBcFrame(page, /Locations|Lagerorte|Location|Lagerort|Code|Name/i);
  const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
  steps.push({ step: 'click-scoped-new-on-locations', newClicked });
  if (!newClicked) {
    return { changed: false, status: 'blocked' as const, reason: 'New/Neu was not visible in the Locations context.' };
  }
  await page.waitForTimeout(1400);
  await assertSafeContext(page);

  const afterNewText = await safeText(page);
  if (!/Locations|Lagerorte|Location|Lagerort|Code|Name/i.test(afterNewText)) {
    return { changed: false, status: 'blocked' as const, reason: 'New did not keep a trusted Location context.' };
  }

  const { frame: afterNewFrame } = await findBcFrame(page, /Locations|Lagerorte|Location|Lagerort|Code|Name/i);
  const fill = await fillByLabelOrFirstSafeInputs(page, afterNewFrame, steps);
  steps.push({ step: 'fill-location-code-name-only', fill });
  if (!fill.changed) {
    return { changed: false, status: 'blocked' as const, reason: fill.reason };
  }

  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(2200);
  return { changed: true, status: 'created' as const, reason: `${targetLocation.code} / ${targetLocation.name} entered with Code and Name only.` };
}

test('TARGET-036A creates or verifies first simple Universaarl location', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const steps: Step[] = [
    {
      step: 'smart-decision',
      whyNow:
        'TARGET-036 selected Location as the first controlled master-data write because it can be constrained to Code and Name and avoids customer/vendor/item template risk.',
      supportedBy: ['TARGET-035 Locations read-only preflight', 'TARGET-036 first-write decision'],
      fieldsChangedOnlyIfSafe: ['Location.Code=SAAR-HL', 'Location.Name=Saarbruecken Hauptlager'],
      fieldsNotTouched: [
        'Require Receive',
        'Require Shipment',
        'Require Put-away',
        'Require Pick',
        'Bin Mandatory',
        'Directed Put-away and Pick',
        'Inventory Posting Setup',
        'Customers',
        'Vendors',
        'Items',
        'Documents',
        'Preview Posting',
        'Posting'
      ],
      fallback: 'Abort and document screenshots if Locations context, New route or Code/Name inputs are not trusted.'
    }
  ];

  await openLocations(page);
  const before = await captureState(page, 'target-036a-010-locations-before', 'Before first Location write gate.', {
    targetLocation
  });

  const writeAttempt = await createOrVerifyLocation(page, steps);
  const afterAttempt = await captureState(page, 'target-036a-020-after-location-attempt', 'After Location write or verify attempt.', {
    targetLocation,
    writeAttempt,
    steps
  });

  await openLocations(page, true);
  const afterReopen = await captureState(page, 'target-036a-030-after-reopen-filtered-proof', 'After reopening Locations filtered to SAAR-HL.', {
    targetLocation,
    writeAttempt,
    steps,
    reopenProofRoute: 'direct Page 15 URL with Location Code filter'
  });

  const persisted = afterReopen.visible.targetCode && afterReopen.visible.targetName;
  const blockedBy = persisted ? [] : [`${targetLocation.code} / ${targetLocation.name} is not visible after filtered reopen.`];
  const resultStatus = persisted ? 'observed' : 'blocked';
  const nextCase = persisted
    ? 'TARGET-036B-CUSTOMER-VENDOR-ITEM-TEMPLATE-DIALOG-DISCOVERY'
    : 'TARGET-036A-LOCATION-WRITE-ROUTE-RECOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-first-location-controlled-write-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Locations / Lagerorte',
    pageId: LOCATIONS_PAGE_ID,
    url: sanitizeEvidenceUrl(page.url()),
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Page 15 Locations / Lagerorte.',
      'Captured before screenshot QA.',
      writeAttempt.changed
        ? 'Created Location SAAR-HL by filling Code and Name only.'
        : writeAttempt.status === 'already-exists'
          ? 'Verified existing SAAR-HL / Saarbruecken Hauptlager without creating a duplicate.'
          : 'Stopped before an unsafe write.',
      'Reopened Page 15 with a Location Code filter for persistence proof.',
      'Captured after/reopen screenshot QA.'
    ],
    actionsNotTaken: [
      'No Customer, Vendor or Item was created.',
      'No template dialog was confirmed.',
      'No warehouse/bin requirement field was changed.',
      'No Inventory Posting Setup was changed.',
      'No document or draft was created.',
      'No Preview Posting was executed.',
      'No Posting was executed.',
      'No payment was executed.',
      'No API shortcut was used.',
      'No company switch was executed.'
    ],
    setupChanged: false,
    masterDataChanged: writeAttempt.changed,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036a-010-locations-before.png',
      'playwright/projects/fibu-book5/img/target-036a-020-after-location-attempt.png',
      'playwright/projects/fibu-book5/img/target-036a-030-after-reopen-filtered-proof.png'
    ],
    proved: persisted
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 15 Locations / Lagerorte was used as the scoped page.',
          `${targetLocation.code} / ${targetLocation.name} is visible after reopen.`,
          'Only the first simple Location master-data route was used; no customer, vendor, item, document, preview or posting route was used.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 15 Locations / Lagerorte was opened and screenshot QA was captured.'
        ],
    notProved: [
      'No warehouse setup readiness is proven.',
      'No bin/put-away/pick/receive/shipment requirement is proven.',
      'No inventory posting setup is proven.',
      'No customer, vendor or item template route is proven.',
      'No document, Preview Posting, Posting or ledger trace is proven.',
      ...blockedBy
    ],
    blockedBy,
    warnings: [
      'A Location with Code and Name is useful master data, but it does not make inventory or warehouse processes ready.',
      'Warehouse fields were intentionally not changed in this case.',
      'Customer, Vendor and Item creation remains locked until template/dialog discovery.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCustomerCreated: true,
      noVendorCreated: true,
      noItemCreated: true,
      noTemplateConfirmed: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      locationMasterDataChanged: writeAttempt.changed
    },
    targetLocation,
    before,
    afterAttempt,
    afterReopen,
    writeAttempt,
    steps,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-036 selected Location SAAR-HL as the first controlled master-data write after read-only master-data preflight.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Location remains the smallest useful master-data write: it has a clear Code/Name route and avoids accounting/template fields.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-036B-CUSTOMER-VENDOR-ITEM-TEMPLATE-DIALOG-DISCOVERY',
          status: persisted ? 'ready-next' : 'blocked',
          reason: persisted
            ? 'After the first simple Location exists, the next risky master-data family should be discovered read-only before creation.'
            : 'Do not move to customer/vendor/item template discovery until the first Location write gate is resolved.'
        },
        {
          caseId: 'TARGET-037-FIRST-PREVIEW-GATE',
          status: 'blocked',
          reason: 'Preview still needs real customer/vendor/item master data and accepted VAT/posting boundaries.'
        },
        {
          caseId: 'TARGET-038-FIRST-POSTING-GATE',
          status: 'blocked',
          reason: 'Posting remains blocked until Preview Posting and expected entry traces exist.'
        },
        {
          caseId: 'TARGET-039-FOUNDATION-BLOCKER-REVISIT',
          status: 'ready-after-current',
          reason: 'Parked VAT, Page 314, inventory posting and default-dimension blockers should be revisited before first document flow.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: persisted
        ? 'The next high-value step is to understand Customer/Vendor/Item template dialogs before any accounting-relevant master-data write.'
        : 'The same narrow Location route must be recovered before expanding scope.',
      risksBeforeNextCase: [
        'Do not create customers, vendors or items before template/dialog discovery.',
        'Do not treat SAAR-HL as warehouse readiness.',
        'Do not run Preview Posting or Posting.'
      ],
      requiredPreparation: persisted
        ? ['Keep the next case read-only or dialog-cancel-safe for Customer, Vendor and Item New routes.']
        : ['Diagnose Locations New route with screenshot QA before retrying any write.']
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036A-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-036a-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036A-result.json`,
      'playwright/projects/fibu-book5/img/target-036a-010-locations-before.png',
      'playwright/projects/fibu-book5/img/target-036a-020-after-location-attempt.png',
      'playwright/projects/fibu-book5/img/target-036a-030-after-reopen-filtered-proof.png'
    ],
    requiresReview: !persisted,
    safeToFinalizeState: persisted,
    statePatch: persisted
      ? {
          current: {
            activeCase: nextCase,
            active_case_file: '.agent/state/cases/target-036b-customer-vendor-item-template-dialog-discovery.json',
            activeArea: 'universaarl-master-data-template-dialog-discovery',
            nextStep:
              'Run TARGET-036B as read-only/dialog-cancel-safe discovery for Customer, Vendor and Item New/template routes. Do not create customer/vendor/item records yet.'
          },
          activeCase: {
            status: 'done',
            resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036A-result.json`,
            nextCase
          },
          coverage: {
            latestFirstLocationMasterDataFit: {
              caseId: CASE_ID,
              status: 'observed',
              pageId: LOCATIONS_PAGE_ID,
              code: targetLocation.code,
              name: targetLocation.name,
              resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036A-result.json`
            }
          }
        }
      : {},
    reason: persisted
      ? `${targetLocation.code} / ${targetLocation.name} is visible after controlled Location write/verify and filtered reopen proof.`
      : `Controlled Location write gate blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-036A First Location Controlled Write Gate',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Geaendert',
      '',
      writeAttempt.changed
        ? `- Location ${targetLocation.code} mit Name ${targetLocation.name} wurde mit Code und Name angelegt.`
        : writeAttempt.status === 'already-exists'
          ? `- Location ${targetLocation.code} war bereits vorhanden; keine Dublette angelegt.`
          : '- Keine Aenderung, der Schreibweg wurde blockiert.',
      '',
      '## Grenzen',
      '',
      '- Keine Warehouse-/Lagerplatzfelder wurden geaendert.',
      '- Keine Inventory Posting Setup Zeile wurde geaendert.',
      '- Keine Kunden, Kreditoren oder Artikel wurden angelegt.',
      '- Kein Beleg, keine Preview und keine Buchung.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(blockedBy, blockedBy.join('\n')).toHaveLength(0);
  expect(persisted, `${targetLocation.code} / ${targetLocation.name} must be visible after reopen.`).toBe(true);
});
