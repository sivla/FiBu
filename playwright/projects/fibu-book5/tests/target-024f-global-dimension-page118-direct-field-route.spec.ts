import { expect, test, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  compactPageText,
  dismissTours,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-024F-GLOBAL-DIMENSION-PAGE118-DIRECT-FIELD-ROUTE';
const TARGET_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_DIR = path.resolve(
  'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route',
);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-024F-result.json');
const TARGETS = {
  globalDimension1: 'PRODUCTLINE',
  globalDimension2: 'COSTCENTER',
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ControlEntry = {
  frameUrl: string;
  tag: string;
  role: string | null;
  type: string | null;
  text: string;
  ariaLabel: string | null;
  title: string | null;
  value: string | null;
  disabled: boolean;
  readOnly: boolean;
  rect: Rect | null;
  visible: boolean;
  placeholder: string | null;
  name: string | null;
};

type FieldMatch = {
  label: ControlEntry;
  selected: ControlEntry;
  candidates: ControlEntry[];
  caption: string;
  targetValue: string;
};

function ensureEvidenceDir(): void {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

function buildPlaythruUrl(pageId: string): string {
  const base = requireBcUrl('FIBU_BOOK5').replace('/MCP_1_20260210', `/${TARGET_INSTANCE}`);
  const url = new URL(base);
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', pageId);
  return url.toString();
}

function sanitizeEvidenceUrl(url: string): string {
  const parsed = new URL(url);
  return `${parsed.origin}${parsed.pathname}?company=${parsed.searchParams.get('company') ?? ''}&page=${
    parsed.searchParams.get('page') ?? ''
  }`;
}

function clean(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function instancePathIsTarget(url: string): boolean {
  const parsed = new URL(url);
  return parsed.pathname.toLowerCase().includes(`/${TARGET_INSTANCE.toLowerCase()}/`) || url.toLowerCase().includes(TARGET_INSTANCE.toLowerCase());
}

function companyParamIsTarget(url: string): boolean {
  return new URL(url).searchParams.get('company') === TARGET_COMPANY;
}

function dangerousText(text: string): string[] {
  const patterns = [
    /\bPost\b/i,
    /\bPreview Posting\b/i,
    /\bBuchen\b/i,
    /\bBuchungsvorschau\b/i,
    /\bDelete\b/i,
    /\bLöschen\b/i,
    /\bShip\b/i,
    /\bInvoice\b/i,
  ];
  return patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}

function centerY(entry: ControlEntry): number {
  return entry.rect ? entry.rect.y + entry.rect.height / 2 : 0;
}

function signal(entry: ControlEntry): string {
  return clean(
    [
      entry.tag,
      entry.role,
      entry.type,
      entry.text,
      entry.ariaLabel,
      entry.title,
      entry.value,
      entry.placeholder,
      entry.name,
    ].join(' '),
  );
}

function isEditableField(entry: ControlEntry): boolean {
  const haystack = signal(entry);
  return (
    entry.visible &&
    !!entry.rect &&
    !entry.disabled &&
    !entry.readOnly &&
    /(INPUT|TEXTAREA|SELECT|textbox|combobox)/i.test(haystack) &&
    entry.rect.width >= 40 &&
    entry.rect.height >= 12
  );
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  ensureEvidenceDir();
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeText(filePath: string, value: string): Promise<void> {
  ensureEvidenceDir();
  fs.writeFileSync(filePath, value, 'utf8');
}

async function screenshotWithMetadata(page: Page, name: string, purpose: string): Promise<string> {
  ensureEvidenceDir();
  const screenshotPath = path.join(EVIDENCE_DIR, name);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await writeJson(`${screenshotPath}.json`, {
    schemaVersion: 1,
    caseId: CASE_ID,
    purpose,
    instance: TARGET_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    timestamp: new Date().toISOString(),
    status: 'target-evidence',
    finalScreenshotNeeded: false,
    proves: ['Page-118 UI state in UNIVERSAARL-DE at the named step'],
    doesNotProve: ['German final book proof outside the playthru target environment'],
  });
  return screenshotPath;
}

async function collectControlMap(page: Page): Promise<ControlEntry[]> {
  return page.locator('iframe').evaluateAll(async (iframes) => {
    const rootDocuments = [document];
    for (const iframe of iframes as HTMLIFrameElement[]) {
      try {
        if (iframe.contentDocument) rootDocuments.push(iframe.contentDocument);
      } catch {
        // Cross-origin frames are ignored; Business Central content is same-origin here.
      }
    }

    const entries: ControlEntry[] = [];
    for (const doc of rootDocuments) {
      const frameUrl = doc.location.href;
      const nodes = Array.from(
        doc.querySelectorAll(
          [
            'button',
            'a',
            'input',
            'textarea',
            'select',
            '[role]',
            '[aria-label]',
            '[title]',
            'label',
            'span',
            'div',
          ].join(','),
        ),
      ) as HTMLElement[];

      for (const node of nodes) {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const visible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          style.opacity !== '0';
        const input = node as HTMLInputElement;
        entries.push({
          frameUrl,
          tag: node.tagName,
          role: node.getAttribute('role'),
          type: node.getAttribute('type'),
          text: (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240),
          ariaLabel: node.getAttribute('aria-label'),
          title: node.getAttribute('title'),
          value: typeof input.value === 'string' ? input.value : null,
          disabled: Boolean(input.disabled || node.getAttribute('aria-disabled') === 'true'),
          readOnly: Boolean(input.readOnly || node.getAttribute('aria-readonly') === 'true'),
          placeholder: node.getAttribute('placeholder'),
          name: node.getAttribute('name'),
          visible,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        });
      }
    }
    return entries;
  });
}

function findPage118DimensionField(
  controls: ControlEntry[],
  captionPattern: RegExp,
  caption: string,
  targetValue: string,
): FieldMatch | null {
  const labels = controls
    .filter((entry) => entry.visible && entry.rect && captionPattern.test(signal(entry)))
    .sort((a, b) => {
      const aRect = a.rect!;
      const bRect = b.rect!;
      return aRect.y - bRect.y || aRect.x - bRect.x;
    });

  for (const label of labels) {
    const rowY = centerY(label);
    const candidates = controls
      .filter(isEditableField)
      .filter((entry) => Math.abs(centerY(entry) - rowY) <= 34)
      .filter((entry) => entry.rect!.x > label.rect!.x)
      .filter((entry) => entry.rect!.x - label.rect!.x <= 900)
      .sort((a, b) => a.rect!.x - b.rect!.x || b.rect!.width - a.rect!.width);
    if (candidates.length > 0) {
      return {
        label,
        selected: candidates[0],
        candidates: candidates.slice(0, 5),
        caption,
        targetValue,
      };
    }
  }

  return null;
}

async function openGeneralLedgerSetup(page: Page): Promise<void> {
  await page.goto(buildPlaythruUrl('118'), { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await expect(page).toHaveURL(/playthru/i);
  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
}

async function clickEditMode(page: Page): Promise<boolean> {
  const selectors = [
    'button[aria-label*="Änderungen auf der Seite vornehmen" i]',
    'button[title*="Änderungen auf der Seite vornehmen" i]',
    'button[aria-label*="Aenderungen auf der Seite vornehmen" i]',
    'button[aria-label*="Edit" i]',
    'button[title*="Edit" i]',
    'button:has-text("Änderungen")',
    'button:has-text("Bearbeiten")',
    'button:has-text("Edit")',
  ];
  for (const frame of page.frames()) {
    for (const selector of selectors) {
      const button = frame.locator(selector).first();
      if ((await button.count()) === 0) continue;
      try {
        await button.hover({ timeout: 2_000 }).catch(() => undefined);
        await button.click({ timeout: 4_000 });
        await page.waitForTimeout(1_000);
        return true;
      } catch {
        // Try the next explicit edit locator or frame.
      }
    }
  }
  return false;
}

async function expandDimensionsArea(page: Page): Promise<void> {
  await page.mouse.wheel(0, 900).catch(() => undefined);
  await page.waitForTimeout(500);
  const buttons = page.locator(
    'button:has-text("Mehr anzeigen"), button:has-text("Show more"), button[aria-label*="More" i], button[title*="More" i]',
  );
  const count = await buttons.count();
  for (let index = 0; index < Math.min(count, 8); index += 1) {
    try {
      await buttons.nth(index).click({ timeout: 1_000 });
      await page.waitForTimeout(250);
    } catch {
      // Some show-more buttons belong to already expanded FastTabs.
    }
  }
}

async function fillMatchedField(page: Page, field: FieldMatch): Promise<void> {
  const rect = field.selected.rect!;
  await page.mouse.click(rect.x + Math.min(16, rect.width / 2), rect.y + rect.height / 2);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+A');
  await page.keyboard.type(field.targetValue, { delay: 20 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1_200);
}

function fieldValueFound(text: string, caption: RegExp, target: string): boolean {
  const normalized = clean(text);
  const targetIndex = normalized.toUpperCase().indexOf(target.toUpperCase());
  if (targetIndex < 0) return false;
  const windowStart = Math.max(0, targetIndex - 500);
  return caption.test(normalized.slice(windowStart, targetIndex + 500));
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  ensureEvidenceDir();
  const text = await compactPageText(page, 18_000).catch(async () => pageText(page));
  const controls = await collectControlMap(page);
  await writeText(path.join(EVIDENCE_DIR, `${filePrefix}.txt`), `${text}\n`);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.controls.json`), {
    schemaVersion: 1,
    caseId: CASE_ID,
    step,
    instance: TARGET_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    controlCount: controls.length,
    controls,
    extra,
  });
  const screenshot = await screenshotWithMetadata(page, `${filePrefix}.png`, step);
  return { text, controls, screenshot };
}

test('assigns global dimensions through Page 118 direct fields when unambiguous', async ({ page }) => {
  ensureEvidenceDir();
  const startedAt = new Date().toISOString();
  const changedFiles: string[] = [];
  const warnings: string[] = [];
  const blockedBy: string[] = [];
  const proved: string[] = [];
  const notProved: string[] = [];
  let resultStatus: 'observed' | 'blocked' = 'blocked';
  let setupChanged = false;

  await openGeneralLedgerSetup(page);
  const before = await captureState(page, 'target-024f-010-page118-before', 'Page 118 before direct field route');
  changedFiles.push(
    'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-010-page118-before.png',
    'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-010-page118-before.txt',
    'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-010-page118-before.controls.json',
  );

  const visibleRiskActions = dangerousText(before.text);
  if (visibleRiskActions.length > 0) {
    warnings.push(
      `visible-risk-action-text-not-clicked:${visibleRiskActions.join(',')}`,
    );
  }

  if (blockedBy.length === 0) {
    const editClicked = await clickEditMode(page);
    await expandDimensionsArea(page);
    const map = await captureState(page, 'target-024f-020-page118-editmode-field-map', 'Page 118 edit mode field map');
    changedFiles.push(
      'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-020-page118-editmode-field-map.png',
      'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-020-page118-editmode-field-map.txt',
      'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-020-page118-editmode-field-map.controls.json',
    );
    proved.push(`Page 118 opened in ${TARGET_INSTANCE}/${TARGET_COMPANY} and edit route was ${editClicked ? 'available' : 'not explicitly found'}.`);

    const field1 = findPage118DimensionField(
      map.controls,
      /Global(er)? Dimensionscode 1|Global Dimension Code 1/i,
      'Global Dimension Code 1',
      TARGETS.globalDimension1,
    );
    const field2 = findPage118DimensionField(
      map.controls,
      /Global(er)? Dimensionscode 2|Global Dimension Code 2/i,
      'Global Dimension Code 2',
      TARGETS.globalDimension2,
    );

    await writeJson(path.join(EVIDENCE_DIR, 'target-024f-field-match-map.json'), {
      schemaVersion: 1,
      caseId: CASE_ID,
      instance: TARGET_INSTANCE,
      company: TARGET_COMPANY,
      field1,
      field2,
      explanation:
        'Only editable controls on the same visual row and to the right of the Page 118 label were eligible for direct entry.',
    });
    changedFiles.push(
      'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-field-match-map.json',
    );

    if (!field1 || !field2) {
      blockedBy.push('page118-global-dimension-direct-fields-not-unambiguously-matched');
      notProved.push('The direct Page 118 fields could not be targeted safely enough for a setup write.');
    } else {
      await fillMatchedField(page, field1);
      await fillMatchedField(page, field2);
      setupChanged = true;

      const afterEntry = await captureState(
        page,
        'target-024f-030-page118-after-direct-entry',
        'Page 118 after direct field entry',
        {
          field1: {
            label: signal(field1.label),
            selected: signal(field1.selected),
            targetValue: field1.targetValue,
          },
          field2: {
            label: signal(field2.label),
            selected: signal(field2.selected),
            targetValue: field2.targetValue,
          },
        },
      );
      changedFiles.push(
        'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-030-page118-after-direct-entry.png',
        'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-030-page118-after-direct-entry.txt',
        'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-030-page118-after-direct-entry.controls.json',
      );

      await page.waitForTimeout(2_500);
      await openGeneralLedgerSetup(page);
      await expandDimensionsArea(page);
      const afterReopen = await captureState(
        page,
        'target-024f-090-page118-after-reopen',
        'Page 118 after reopen persistence proof',
      );
      changedFiles.push(
        'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-090-page118-after-reopen.png',
        'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-090-page118-after-reopen.txt',
        'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/target-024f-090-page118-after-reopen.controls.json',
      );

      const hasProductline = fieldValueFound(
        afterReopen.text,
        /Global(er)? Dimensionscode 1|Global Dimension Code 1/i,
        TARGETS.globalDimension1,
      );
      const hasCostcenter = fieldValueFound(
        afterReopen.text,
        /Global(er)? Dimensionscode 2|Global Dimension Code 2/i,
        TARGETS.globalDimension2,
      );

      if (hasProductline && hasCostcenter) {
        resultStatus = 'observed';
        proved.push('Global Dimension Code 1 persisted as PRODUCTLINE on Page 118 after reopening.');
        proved.push('Global Dimension Code 2 persisted as COSTCENTER on Page 118 after reopening.');
      } else {
        blockedBy.push(
          `page118-direct-entry-not-persisted:PRODUCTLINE=${hasProductline};COSTCENTER=${hasCostcenter}`,
        );
        notProved.push('The Page 118 direct field route did not produce a durable reopen proof for both global dimensions.');
      }
    }
  }

  const finishedAt = new Date().toISOString();
  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-024-CORE-MASTERDATA-PLAN'
      : 'TARGET-024G-GLOBAL-DIMENSION-ROUTE-ESCALATION-DECISION';
  changedFiles.push(
    'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/TARGET-024F-result.json',
    'playwright/projects/fibu-book5/evidence/target-024f-global-dimension-page118-direct-field-route/README.md',
  );

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-target-setup-route',
    resultStatus,
    startedAt,
    finishedAt,
    instance: TARGET_INSTANCE,
    company: TARGET_COMPANY,
    sourceCompany: TARGET_COMPANY,
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction:
      'In a final German production sandbox, open General Ledger Setup (Page 118), inspect the Dimensions FastTab, set Global Dimension Code 1/2 only through unambiguous direct fields, and re-open Page 118 for persistence proof.',
    mustRecreateInFinalSandbox: true,
    targetGermanCompanyImpact:
      'Universaarl final evidence needs direct Page 118 global dimension screenshots and a reopen proof before customer/vendor/item defaults are treated as ready.',
    finalScreenshotNeeded: true,
    setupChanged,
    flags: {
      noPosting: true,
      noPreviewPosting: true,
      noDraft: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      setupChangeAllowedByCase: true,
    },
    proved,
    notProved,
    changedFiles,
    evidenceRefs: changedFiles.filter((file) => file.includes('/evidence/')),
    warnings,
    blockedBy,
    requiresReview: blockedBy.length > 0,
    safeToFinalizeState: false,
    statePatch: {},
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        resultStatus === 'observed'
          ? 'Page 118 direct global dimension fields persisted PRODUCTLINE and COSTCENTER after reopen.'
          : 'Page 118 direct global dimension route was tested but did not reach a durable proof.',
      isPlannedNextCaseStillSensible: false,
      reason:
        resultStatus === 'observed'
          ? 'The active case is complete; the next practical step is to use the dimension foundation for core master data planning.'
          : 'The active case needs a route decision instead of repeating the same direct field attempt.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-024-CORE-MASTERDATA-PLAN',
          status: resultStatus === 'observed' ? 'ready-next' : 'needs-setup-first',
          reason:
            resultStatus === 'observed'
              ? 'Global dimensions are ready enough to plan customer, vendor, item and location defaults.'
              : 'Core master data should wait until the global dimension route is resolved or explicitly parked.',
        },
        {
          caseId: 'TARGET-025-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT',
          status: resultStatus === 'observed' ? 'ready-after-current' : 'needs-setup-first',
          reason: 'Templates depend on the chosen global dimension foundation and posting setup readiness.',
        },
        {
          caseId: 'TARGET-026-VAT-SOURCE-CHECK',
          status: 'needs-source-check-first',
          reason: 'VAT/USt claims need source-backed German setup choices before execution.',
        },
        {
          caseId: 'TARGET-027-DEFAULT-DIMENSIONS',
          status: resultStatus === 'observed' ? 'ready-after-current' : 'needs-setup-first',
          reason: 'Default dimensions become useful after global dimension fields are stable.',
        },
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'It converts the now-stable dimension foundation into concrete Universaarl master-data setup steps.'
          : 'It prevents another blind field-edit retry and forces a source/UI based decision.',
      risksBeforeNextCase: blockedBy,
      requiredPreparation:
        resultStatus === 'observed'
          ? ['Define the first minimal Universaarl master-data records and their dimension/default requirements.']
          : ['Review Page 118 control map and choose Page Inspection, Personalize, or source-backed alternative route.'],
    },
    validationCommands: [
      'npm run agent:preflight',
      'npm run agent:context',
      'npm run agent:dry-run',
      'npm run agent:run-plan',
      'npm run fibu:target:global-dimension-page118-direct-field-route',
      `npm run agent:result-normalize -- --input ${RESULT_PATH.replace(/\\/g, '/')}`,
      `npm run agent:state-finalize -- --input ${RESULT_PATH.replace(/\\/g, '/')}`,
      'npm run check:encoding',
      'git diff --check',
    ],
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-024F - Page 118 Global Dimension Direct Field Route',
      '',
      `Case: ${CASE_ID}`,
      `Instance: ${TARGET_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      'This evidence tests the direct General Ledger Setup card route for assigning the two global dimensions.',
      'It does not use the Change Global Dimensions page as the primary route and does not post, preview, create drafts, use APIs, or switch company.',
      '',
      `Result: ${resultStatus}`,
      '',
      'Screenshots:',
      '- target-024f-010-page118-before.png',
      '- target-024f-020-page118-editmode-field-map.png',
      '- target-024f-030-page118-after-direct-entry.png',
      '- target-024f-090-page118-after-reopen.png',
      '',
      'Limits:',
      '- This remains playthru/UNIVERSAARL-DE evidence, not a separate German production proof.',
      '- If blocked, do not repeat the same direct field route without a new Page Inspection or source-backed reason.',
      '',
    ].join('\n'),
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
