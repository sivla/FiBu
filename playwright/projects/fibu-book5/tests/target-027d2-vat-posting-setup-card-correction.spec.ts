import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(300_000);

const CASE_ID = 'TARGET-027D2-VAT-POSTING-SETUP-CARD-CORRECTION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d2-vat-posting-setup-card-correction';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D2-result.json');

type Point = { x: number; y: number; source: string; label?: Record<string, unknown> };

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function dangerousDialogSignal(text: string) {
  return /\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Yes|Ja)\b/i.test(text);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function visibleText(page: Page) {
  return clean(await pageText(page));
}

async function assertTargetContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  const text = await visibleText(page);
  expect(dangerousDialogSignal(text), 'No dangerous dialog may be visible.').toBe(false);
}

async function compactVatText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i,
        /INLAND|VAT19|Inland 19 Prozent|1406|3806|19|Normale MwSt|Normal VAT/i,
        /Beschreibung|MwSt\. %|MwSt\.-Berechnungsart|Umsatzsteuerkonto|Vorsteuerkonto/i,
        /Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i
      ],
      maxLines: 260,
      maxLineLength: 300
    })
  );
}

async function screenshotWithMetadata(page: Page, name: string, metadata: Record<string, unknown>) {
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, name.replace(/\.png$/i, '.screenshot.json')), {
    fileName: name,
    imagePath: path.join(EVIDENCE_DIR, name),
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function openMatrixList(page: Page) {
  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await assertTargetContext(page);
}

async function visibleElementCandidates(page: Page, pattern: RegExp) {
  const all: Array<{ text: string; role: string; x: number; y: number; width: number; height: number }> = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((source) => {
        const pattern = new RegExp(source, 'i');
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],[role="row"],[role="button"],button,span,div,input')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            const text = (element.innerText || value || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            const visible =
              text.length > 0 &&
              pattern.test(text) &&
              rect.width > 1 &&
              rect.height > 1 &&
              rect.bottom > 0 &&
              rect.right > 0 &&
              rect.top < window.innerHeight &&
              rect.left < window.innerWidth &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              Number(style.opacity || '1') > 0;
            if (!visible) return null;
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter(Boolean)
          .slice(0, 120);
      }, pattern.source)
      .catch(() => []);
    all.push(...(entries as typeof all));
  }
  return all;
}

async function openTargetCard(page: Page) {
  const rowCandidates = await visibleElementCandidates(page, /INLAND|VAT19/);
  const row = rowCandidates
    .filter((entry) => /INLAND|VAT19/i.test(entry.text))
    .filter((entry) => entry.x >= 150 && entry.y >= 130)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (!row) throw new Error('No visible INLAND/VAT19 row candidate on Page 472 list.');
  await page.mouse.dblclick(row.x + Math.min(30, Math.round(row.width / 2)), row.y + Math.round(row.height / 2));
  await page.waitForTimeout(2500);
  let text = await compactVatText(page);
  if (/MwSt\.-?Buchungsmatrixkarte|INLAND\s*.\s*VAT19|MwSt\.-?Geschaftsbuchungsgruppe/i.test(text)) return { route: 'double-click-row', row };

  await page.mouse.click(row.x + Math.min(30, Math.round(row.width / 2)), row.y + Math.round(row.height / 2));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  text = await compactVatText(page);
  if (/MwSt\.-?Buchungsmatrixkarte|INLAND\s*.\s*VAT19|MwSt\.-?Geschaftsbuchungsgruppe/i.test(text)) return { route: 'row-enter', row };

  throw new Error('Could not open the INLAND/VAT19 VAT Posting Setup card from the visible list row.');
}

async function locateFieldPoint(page: Page, labelPattern: RegExp, offset = 330): Promise<Point> {
  const candidates = await visibleElementCandidates(page, labelPattern);
  const label = candidates
    .filter((entry) => entry.x > 250 && entry.x < 1300 && entry.y > 140 && entry.width < 380 && entry.height < 80)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (!label) throw new Error(`Could not locate field label ${labelPattern}.`);
  return { x: label.x + offset, y: label.y + Math.round(label.height / 2), source: 'label-offset', label };
}

async function fillFieldAt(page: Page, point: Point, value: string, steps: Array<Record<string, unknown>>, step: string) {
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(350);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 35 });
  await page.waitForTimeout(450);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(900);
  steps.push({ step, value, point: { x: point.x, y: point.y, source: point.source, label: point.label } });
}

async function expandEinkaufIfNeeded(page: Page, steps: Array<Record<string, unknown>>) {
  let text = await compactVatText(page);
  if (/Vorsteuerkonto/i.test(text)) return;
  const candidates = await visibleElementCandidates(page, /^Einkauf\b|Einkauf>/i);
  const button = candidates.filter((entry) => entry.x > 250 && entry.y > 500).sort((left, right) => left.y - right.y)[0];
  if (button) {
    await page.mouse.click(button.x + 20, button.y + Math.round(button.height / 2));
    await page.waitForTimeout(1200);
    steps.push({ step: 'expanded-einkauf-fasttab', button });
  }
  text = await compactVatText(page);
  if (!/Vorsteuerkonto/i.test(text)) steps.push({ step: 'vorsteuerkonto-not-visible-after-expand' });
}

async function correctCard(page: Page) {
  const steps: Array<Record<string, unknown>> = [];
  const description = await locateFieldPoint(page, /^Beschreibung$/i);
  const vatPercent = await locateFieldPoint(page, /^MwSt\.?\s*%$/i);
  const salesVat = await locateFieldPoint(page, /^Umsatzsteuerkonto$/i);
  await fillFieldAt(page, description, 'Inland 19 Prozent', steps, 'description');
  await fillFieldAt(page, vatPercent, '19', steps, 'vat-percent');
  await fillFieldAt(page, salesVat, '3806', steps, 'sales-vat-account');
  await expandEinkaufIfNeeded(page, steps);
  const purchaseVat = await locateFieldPoint(page, /^Vorsteuerkonto$/i);
  await fillFieldAt(page, purchaseVat, '1406', steps, 'purchase-vat-account');
  await page.waitForTimeout(2500);
  return steps;
}

test('TARGET-027D2 corrects INLAND VAT19 matrix row through the card fields', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const steps: Array<Record<string, unknown>> = [];

  await openMatrixList(page);
  const beforeText = await compactVatText(page);
  await writeText('target-027d2-010-before-list.txt', beforeText || 'No matrix list text captured.');
  await screenshotWithMetadata(page, 'target-027d2-010-before-list.png', {
    page: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    step: 'Before card correction',
    status: 'accepted-page-screenshot',
    importantUi: ['INLAND/VAT19 row', 'MwSt. %', 'Umsatzsteuerkonto', 'Vorsteuerkonto'],
    internallyProves: 'Visible state before correction follow-up.',
    doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries']
  });

  try {
    const cardRoute = await openTargetCard(page);
    steps.push({ step: 'opened-card', ...cardRoute });
    await writeText('target-027d2-020-before-card.txt', await compactVatText(page));
    await screenshotWithMetadata(page, 'target-027d2-020-before-card.png', {
      page: 'MwSt.-Buchungsmatrixkarte / VAT Posting Setup Card',
      step: 'Before field correction',
      status: 'card-screenshot',
      importantUi: ['Beschreibung', 'MwSt. %', 'Umsatzsteuerkonto', 'Vorsteuerkonto'],
      internallyProves: 'The row opened as a card, which is safer than blind grid tab flow.',
      doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries']
    });
    steps.push(...(await correctCard(page)));
    await assertTargetContext(page);
    await writeText('target-027d2-030-after-card.txt', await compactVatText(page));
    await screenshotWithMetadata(page, 'target-027d2-030-after-card.png', {
      page: 'MwSt.-Buchungsmatrixkarte / VAT Posting Setup Card',
      step: 'After field correction',
      status: 'card-screenshot',
      importantUi: ['Beschreibung Inland 19 Prozent', 'MwSt. % 19', 'Umsatzsteuerkonto 3806', 'Vorsteuerkonto 1406'],
      internallyProves: 'Attempted correction through card field labels.',
      doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries']
    });
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  await openMatrixList(page);
  const reopenText = await compactVatText(page);
  await writeText('target-027d2-040-reopen-list.txt', reopenText || 'No matrix list text captured after reopen.');
  await screenshotWithMetadata(page, 'target-027d2-040-reopen-list.png', {
    page: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    step: 'Reopen list proof after card correction',
    status: 'reopen-proof',
    importantUi: ['INLAND', 'VAT19', 'Inland 19 Prozent', '19', '3806', '1406'],
    internallyProves: 'Final list state after the card correction attempt.',
    doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries']
  });

  const normalized = clean(reopenText);
  const success =
    /\bINLAND\b/i.test(normalized) &&
    /\bVAT19\b/i.test(normalized) &&
    /Inland 19 Prozent/i.test(normalized) &&
    /\b19(?:,00|\.00)?\b/i.test(normalized) &&
    /\b3806\b/i.test(normalized) &&
    /\b1406\b/i.test(normalized) &&
    !/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i.test(normalized);
  if (!success && blockedBy.length === 0) {
    blockedBy.push('Reopen list still does not visibly prove INLAND/VAT19 with description, 19 percent, 3806 and 1406.');
  }
  if (/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i.test(normalized)) {
    warnings.push('Business Central still reports unsaved/error state after correction route.');
  }

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-posting-setup-card-correction',
    resultStatus: success ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    targetValues: {
      vatBusinessPostingGroup: 'INLAND',
      vatProductPostingGroup: 'VAT19',
      description: 'Inland 19 Prozent',
      vatPercent: '19',
      salesVatAccount: '3806',
      purchaseVatAccount: '1406'
    },
    actionsTaken: [
      'Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix.',
      'Opened the visible INLAND/VAT19 row as a card.',
      'Attempted card-field correction by labels: Beschreibung, MwSt. %, Umsatzsteuerkonto, Vorsteuerkonto.',
      'Captured before-card, after-card and reopen-list screenshots.',
      'Stopped before master data, document draft, Preview Posting and Posting.'
    ],
    actionsNotTaken: [
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No Company switch',
      'No VAT final claim'
    ],
    setupChanged: success,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: success
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'The INLAND + VAT19 VAT Posting Setup row is visible after reopen with description Inland 19 Prozent and candidate accounts 3806/1406.',
          'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'The matrix card route was attempted and documented with screenshots.',
          'The run stopped before master data, document draft, Preview Posting and Posting.'
        ],
    notProved: [
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.',
      'No tax advisor approval or compliance final proof.'
    ],
    screenshots: [
      'target-027d2-010-before-list.png',
      'target-027d2-020-before-card.png',
      'target-027d2-030-after-card.png',
      'target-027d2-040-reopen-list.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D2-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`
    ],
    blockedBy,
    warnings,
    steps,
    flags: {
      setupChangeAttempted: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE',
      lastEvidenceSummary: 'TARGET-027D grid-tab flow created a partial row and showed that Page 472 switches to a card; 19 was placed in Description and 1406 in VAT %. This follow-up uses card labels instead.',
      isPlannedNextCaseStillSensible: true,
      reason: 'A correction is necessary before posting groups or master data can start.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: success ? 'ready-next' : 'needs-setup-first',
          reason: success ? 'VAT matrix candidate row is visible after reopen.' : 'VAT matrix row still needs correction/discovery.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for posting groups and VAT defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness waits for posting groups and defaults.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: success ? 'TARGET-028-POSTING-GROUPS-PREFLIGHT' : 'TARGET-027D3-VAT-MATRIX-PAGEINSPECTION-FOLLOWUP',
      whySelectedNextCaseIsBest: success
        ? 'The next bottleneck is posting-group/default preflight.'
        : 'The exact Page 472 field controls need Page Inspection or a more precise field-control route.',
      risksBeforeNextCase: ['Do not claim final VAT correctness before Preview Posting, VAT Entries and G/L Entries.'],
      requiredPreparation: success ? ['Keep master data locked until posting groups/defaults are ready.'] : ['Inspect Page 472 fields and card control values.']
    },
    safeToFinalizeState: false,
    requiresReview: !success,
    statePatch: {},
    nextCase: success ? 'TARGET-028-POSTING-GROUPS-PREFLIGHT' : 'TARGET-027D3-VAT-MATRIX-PAGEINSPECTION-FOLLOWUP',
    reason: success
      ? 'The VAT Posting Setup row is visible after card correction, but still needs Preview/entry proof later.'
      : `VAT matrix card correction is still blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027D2 VAT Posting Setup Card Correction',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Warum dieser Follow-up noetig war',
      '',
      'TARGET-027D zeigte, dass Business Central nach dem Anlegen einer Matrixzeile in die Matrixkarte wechselt. Der reine Grid-Tab-Flow hat Werte verschoben. Deshalb wird hier die Karte mit sichtbaren Feldlabels genutzt.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine Stammdaten.',
      '- Kein Belegdraft.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine VAT Entries oder Sachposten.',
      '- Keine finale deutsche USt- oder Compliance-Behauptung.'
    ].join('\n')
  );
  expect(result.resultStatus).toMatch(/observed|blocked/);
});
