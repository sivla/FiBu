import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(300_000);

const CASE_ID = 'TARGET-049-ITEM-POSTING-GROUP-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-049-item-posting-group-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-049-result.json');
const ITEM_POSTING_GROUPS_PAGE_ID = 112;

const targetGroup = {
  code: 'WARE',
  description: 'Warenbestand',
  purpose: 'Minimale Lagerbuchungsgruppe fuer spaetere Inventory Posting Setup Zeilen mit 1140 Waren (Bestand).'
};

type CaseStatus = 'observed' | 'blocked';
type Step = Record<string, unknown>;

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function literalPattern(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function buildPlaythruUrl(filterTarget = false) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(ITEM_POSTING_GROUPS_PAGE_ID));
  if (filterTarget) {
    url.searchParams.set('filter', `'Inventory Posting Group'.'Code' IS '${targetGroup.code}'`);
  }
  return url.toString();
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
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function containsDangerousText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Ship|Invoice|Payment|Apply|Delete\?|Loeschen\?|Buchen|Artikelkarte|Debitorenkarte|Kreditorenkarte|Inventory Posting Setup|Lagerbuchung Einrichtung/i.test(
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

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (containsDangerousText(text) || /\b(OK|Yes|Ja|Finish|Delete|Post|Buchen)\b/i.test(text)) dialogs.push(text);
    }
  }
  return dialogs;
}

async function assertTargetContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `Wrong instance URL: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `Wrong company URL: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(await dangerousDialogs(page), 'No dangerous dialog may be visible.').toEqual([]);
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

function classifyGroupText(text: string) {
  const rowSnippet = targetRowSnippet(text);
  const searchable = rowSnippet || text;
  return {
    pageContextVisible: /Lagerbuchungsgruppen|Artikelbuchungsgruppen|Inventory Posting Groups|Item Posting Groups|Code|Beschreibung|Description/i.test(text),
    targetCodeVisible: literalPattern(targetGroup.code).test(searchable),
    targetDescriptionVisible: literalPattern(targetGroup.description).test(searchable),
    rowSnippet,
    dangerousTextVisible: containsDangerousText(text)
  };
}

function targetRowSnippet(text: string) {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const index = lines.findIndex((line) => line === targetGroup.code || line.includes(`${targetGroup.code} ${targetGroup.description}`));
  if (index < 0) return '';
  if (lines[index].includes(targetGroup.description)) return lines[index];
  return lines.slice(index, index + 3).join(' ');
}

async function captureState(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = clean(
    await compactPageText(page, {
      include: [/Lagerbuchungsgruppen|Artikelbuchungsgruppen|Inventory Posting Groups|Item Posting Groups|Code|Beschreibung|Description|WARE|Warenbestand|Neu|New/i],
      maxLines: 180,
      maxLineLength: 240
    })
  );
  const text = compact || (await safeText(page));
  const snapshot = {
    step,
    targetGroup,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    text,
    visible: classifyGroupText(text),
    ...extra
  };
  await writeText(`${prefix}.txt`, text || 'No compact text captured.');
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${prefix}.png`, {
    pageId: ITEM_POSTING_GROUPS_PAGE_ID,
    page: 'Lagerbuchungsgruppen / Item Posting Groups',
    step,
    targetGroup,
    importantUi: ['Code', 'Beschreibung/Description', 'Neu/New'],
    beginnerLearning: [
      'Eine Lagerbuchungsgruppe klassifiziert Artikel fuer die spaetere Lagerbuchung.',
      'Die Gruppe allein bucht noch nichts; erst Inventory Posting Setup verbindet Lagerort, Gruppe und Lagerkonto.',
      'In diesem Gate wird nur die Gruppe selbst angelegt oder nachgewiesen.'
    ],
    internallyProves:
      snapshot.visible.targetCodeVisible && snapshot.visible.targetDescriptionVisible
        ? 'WARE / Warenbestand is visible on Page 112 after reopen.'
        : 'Page 112 context and current row state before or during the controlled gate.',
    doesNotProve: [
      'No Inventory Posting Setup row.',
      'No item field assignment.',
      'No document draft.',
      'No Preview Posting.',
      'No Posting.',
      'No Item Ledger, Value, G/L or VAT entries.'
    ],
    screenshotQaRule: 'Only a visible WARE row in Page 112 counts. Similar WAREN product posting group text does not count.',
    finalScreenshotStatus: snapshot.visible.targetCodeVisible ? 'universaarl-foundation-evidence' : 'setup-or-blocker-evidence',
    ...extra
  });
  return snapshot;
}

async function openItemPostingGroups(page: Page, filterTarget = false) {
  await page.goto(buildPlaythruUrl(filterTarget), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1500);
  await assertTargetContext(page);
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = clean(await frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''));
    if (expected.test(bodyText)) return { frame, bodyText };
  }
  throw new Error(`No BC frame matched ${expected}.`);
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
        await action.hover({ timeout: 1200 }).catch(() => undefined);
        await page.waitForTimeout(250);
        await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(1200);
        return true;
      }
    }
  }
  return false;
}

async function editableInputs(scope: Frame | Locator) {
  const boxes = scope.locator('input[role="textbox"], input[role="combobox"], textarea[role="textbox"], input:not([type])');
  const inspected = [];
  const result: Locator[] = [];
  const count = await boxes.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const box = boxes.nth(index);
    const row = {
      index,
      visible: await box.isVisible({ timeout: 300 }).catch(() => false),
      disabled: await box.isDisabled({ timeout: 300 }).catch(() => true),
      editable: await box.isEditable({ timeout: 300 }).catch(() => false),
      aria: (await box.getAttribute('aria-label').catch(() => '')) || '',
      title: (await box.getAttribute('title').catch(() => '')) || '',
      value: (await box.inputValue({ timeout: 300 }).catch(() => '')) || ''
    };
    inspected.push(row);
    if (row.visible && !row.disabled && row.editable) result.push(box);
  }
  return { result, inspected };
}

async function createOrVerifyGroup(page: Page, steps: Step[]) {
  await openItemPostingGroups(page);
  const beforeText = await safeText(page);
  const beforeClassified = classifyGroupText(beforeText);
  if (beforeClassified.targetCodeVisible) {
    return {
      changed: false,
      status: 'already-exists' as const,
      reason: `${targetGroup.code} already visible before write gate.`,
      beforeClassified
    };
  }

  const { frame } = await findBcFrame(page, /Lagerbuchungsgruppen|Inventory Posting Groups|Code|Beschreibung|Description/i);
  const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
  steps.push({ step: 'click-scoped-new-on-item-posting-groups', newClicked });
  if (!newClicked) {
    return { changed: false, status: 'blocked' as const, reason: 'Neu/New was not visible in Page 112 context.' };
  }

  await page.waitForTimeout(1200);
  const afterNewText = await safeText(page);
  if (containsDangerousText(afterNewText)) {
    return { changed: false, status: 'blocked' as const, reason: 'Forbidden dialog or wrong setup context appeared after New.' };
  }

  const { frame: afterNewFrame } = await findBcFrame(page, /Lagerbuchungsgruppen|Inventory Posting Groups|Code|Beschreibung|Description|WARE/i);
  const { inspected } = await editableInputs(afterNewFrame);
  steps.push({ step: 'editable-inputs-after-new-item-posting-group', inspected });

  await page.keyboard.insertText(targetGroup.code);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(400);
  await page.keyboard.insertText(targetGroup.description);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1800);

  return {
    changed: true,
    status: 'attempted-create' as const,
    reason: `Attempted to create ${targetGroup.code} / ${targetGroup.description} through Page 112 list editor.`
  };
}

test('TARGET-049 creates or verifies one minimal Item Posting Group only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const actionsTaken: string[] = [];
  const steps: Step[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  await openItemPostingGroups(page);
  actionsTaken.push('Opened Page 112 Lagerbuchungsgruppen / Item Posting Groups in playthru / UNIVERSAARL-DE.');
  const before = await captureState(page, 'target-049-010-before-item-posting-groups', 'before-create-or-verify');

  let writeOutcome: Awaited<ReturnType<typeof createOrVerifyGroup>> | undefined;
  if (!before.visible.targetCodeVisible) {
    writeOutcome = await createOrVerifyGroup(page, steps);
    actionsTaken.push(`Create-or-verify route outcome: ${writeOutcome.status}.`);
  } else {
    writeOutcome = { changed: false, status: 'already-exists', reason: `${targetGroup.code} already visible before write gate.`, beforeClassified: before.visible };
    actionsTaken.push(`${targetGroup.code} was already visible; no create action needed.`);
  }

  const after = await captureState(page, 'target-049-020-after-item-posting-group-route', 'after-create-or-verify', { writeOutcome });

  await openItemPostingGroups(page, true);
  actionsTaken.push('Reopened Page 112 with target filter for WARE.');
  const reopen = await captureState(page, 'target-049-030-reopen-proof', 'filtered-reopen-proof', { filterUsed: buildPlaythruUrl(true) });

  const status: CaseStatus =
    reopen.visible.targetCodeVisible && (reopen.visible.targetDescriptionVisible || after.visible.targetDescriptionVisible) ? 'observed' : 'blocked';
  if (status === 'blocked') {
    blockedBy.push('WARE / Warenbestand is not visibly proven after Page 112 reopen.');
  }
  if (reopen.visible.dangerousTextVisible || after.visible.dangerousTextVisible) {
    blockedBy.push('Forbidden or wrong-context text was visible in screenshot QA.');
  }

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-050-INVENTORY-POSTING-SETUP-CONTROLLED-WRITE-GATE',
    lastEvidenceSummary:
      status === 'observed'
        ? 'WARE / Warenbestand is visible on Page 112 after reopen; 1140 Waren (Bestand) was already proven as Bilanz/Buchung in TARGET-048C.'
        : 'TARGET-049 did not prove WARE / Warenbestand after reopen.',
    isPlannedNextCaseStillSensible: status === 'observed',
    reason:
      status === 'observed'
        ? 'The next smallest dependency is Inventory Posting Setup for SAAR-HL + WARE + 1140.'
        : 'Inventory Posting Setup remains locked until the Item Posting Group row is proven.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-050-INVENTORY-POSTING-SETUP-CONTROLLED-WRITE-GATE',
        status: status === 'observed' ? 'ready-next' : 'needs-setup-first',
        reason: status === 'observed' ? 'Needs WARE plus 1140 and location SAAR-HL.' : 'WARE is not proven.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C still waits for Inventory Posting Setup, VAT and General Posting Setup.'
      },
      {
        caseId: 'TARGET-027D4-VAT-MATRIX-FIELD-CONTROL-MAPPING',
        status: 'ready-after-current',
        reason: 'VAT remains a separate foundation lane and must not be mixed with inventory setup.'
      },
      {
        caseId: 'TARGET-036D2G-U-VEND-MANUAL-NOS-SOURCE-OR-ASSISTED-ROUTE-DECISION',
        status: 'blocked',
        reason: 'Vendor numbering remains a separate parked blocker.'
      }
    ],
    queueChangesMade: status === 'observed' ? ['Mark TARGET-049 done and activate TARGET-050.'] : ['Keep TARGET-049 blocked or create a narrow recovery case.'],
    selectedNextCase:
      status === 'observed'
        ? 'TARGET-050-INVENTORY-POSTING-SETUP-CONTROLLED-WRITE-GATE'
        : 'TARGET-049B-ITEM-POSTING-GROUP-ROUTE-RECOVERY',
    whySelectedNextCaseIsBest:
      status === 'observed'
        ? 'It combines already proven SAAR-HL, WARE and 1140 in the next narrow Inventory Posting Setup gate.'
        : 'Do not write Inventory Posting Setup until Page 112 row proof exists.',
    risksBeforeNextCase: [
      'Do not claim inventory posting readiness before Inventory Posting Setup reopen proof.',
      'Do not assign WARE to an item before the item-field case unlocks it.',
      'Keep Preview Posting and Posting false.'
    ],
    requiredPreparation:
      status === 'observed'
        ? ['Keep Inventory Posting Setup as its own case; use 1140 only as proven Bilanz/Buchung account candidate.']
        : ['Diagnose Page 112 list editor or alternative card route before another write attempt.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-setup-write',
    resultStatus: status,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: {
      pageId: ITEM_POSTING_GROUPS_PAGE_ID,
      name: 'Lagerbuchungsgruppen / Item Posting Groups',
      url: sanitizeEvidenceUrl(page.url())
    },
    targetGroup,
    actionsTaken,
    actionsNotTaken: [
      'No Inventory Posting Setup row was created or changed.',
      'No G/L account was changed.',
      'No item card was changed.',
      'No item was created.',
      'No document or draft was created.',
      'No Preview Posting was run.',
      'No Posting was run.',
      'No API shortcut was used.'
    ],
    setupChanged: writeOutcome?.changed === true && status === 'observed',
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-049-010-before-item-posting-groups.png',
      'playwright/projects/fibu-book5/img/target-049-020-after-item-posting-group-route.png',
      'playwright/projects/fibu-book5/img/target-049-030-reopen-proof.png'
    ],
    proved:
      status === 'observed'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Page 112 Lagerbuchungsgruppen / Item Posting Groups was opened.',
            'WARE / Warenbestand is visible after Page 112 reopen.',
            writeOutcome?.changed ? 'A controlled UI write was attempted only for WARE / Warenbestand.' : 'WARE was already visible; no write was needed.',
            'No Inventory Posting Setup, item, document, Preview Posting, Posting or API shortcut occurred.'
          ]
        : [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Page 112 Lagerbuchungsgruppen / Item Posting Groups was opened.',
            'The case stopped without Inventory Posting Setup, item, document, Preview Posting or Posting.'
          ],
    notProved: [
      'No Inventory Posting Setup row is proven.',
      'No item card assignment is proven.',
      'No inventory posting readiness is proven.',
      'No Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.',
      'No complete SKR04 chart, tax-advisor approval or legal compliance is proven.'
    ],
    blockedBy,
    warnings,
    steps,
    snapshots: {
      before,
      after,
      reopen
    },
    nextStepDecision,
    nextCase: nextStepDecision.selectedNextCase,
    statePatch:
      status === 'observed'
        ? {
            current: {
              activeArea: 'universaarl-inventory-posting-setup-controlled-write-gate',
              activeCase: 'TARGET-050-INVENTORY-POSTING-SETUP-CONTROLLED-WRITE-GATE',
              active_case_file: '.agent/state/cases/target-050-inventory-posting-setup-controlled-write-gate.json',
              nextCase: 'TARGET-050-INVENTORY-POSTING-SETUP-CONTROLLED-WRITE-GATE'
            },
            lastRunSummary: {
              caseId: CASE_ID,
              status,
              instance: EXPECTED_INSTANCE,
              company: TARGET_COMPANY,
              summary: 'TARGET-049 proved WARE / Warenbestand as minimal Item Posting Group after Page 112 reopen. Inventory Posting Setup remains locked for TARGET-050.',
              nextCase: 'TARGET-050-INVENTORY-POSTING-SETUP-CONTROLLED-WRITE-GATE'
            },
            activeCase: {
              status: 'done',
              resultPath: 'playwright/projects/fibu-book5/evidence/target-049-item-posting-group-controlled-write-gate/TARGET-049-result.json',
              completedAt: new Date().toISOString(),
              nextCase: 'TARGET-050-INVENTORY-POSTING-SETUP-CONTROLLED-WRITE-GATE'
            }
          }
        : {},
    requiresReview: status !== 'observed',
    safeToFinalizeState: status === 'observed',
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:item-posting-group-write-gate',
      'npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/target-049-item-posting-group-controlled-write-gate/TARGET-049-result.json',
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-049 Item Posting Group Controlled Write Gate',
      '',
      `Status: ${status}`,
      '',
      'Ziel: Page 112 `Lagerbuchungsgruppen` in `playthru / UNIVERSAARL-DE` oeffnen und genau eine minimale Lagerbuchungsgruppe `WARE / Warenbestand` anlegen oder nachweisen.',
      '',
      'Nicht gemacht:',
      '- Keine Inventory Posting Setup Zeile.',
      '- Keine Sachkontoaenderung.',
      '- Keine Artikelkarte.',
      '- Kein Artikel.',
      '- Kein Beleg/Draft.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Kein API Shortcut.',
      '',
      `Naechster Case: ${nextStepDecision.selectedNextCase}`
    ].join('\n')
  );

  expect(status, blockedBy.join('\n')).toBe('observed');
});
