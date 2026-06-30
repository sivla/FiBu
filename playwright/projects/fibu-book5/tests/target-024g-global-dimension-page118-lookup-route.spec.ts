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

const CASE_ID = 'TARGET-024G-GLOBAL-DIMENSION-PAGE118-LOOKUP-ROUTE';
const TARGET_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_DIR = path.resolve(
  'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route',
);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-024G-result.json');

type Rect = { x: number; y: number; width: number; height: number };
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
  visible: boolean;
  rect: Rect | null;
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
  return url.toLowerCase().includes(TARGET_INSTANCE.toLowerCase());
}

function companyParamIsTarget(url: string): boolean {
  return new URL(url).searchParams.get('company') === TARGET_COMPANY;
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
    proves: ['Visible Business Central UI state for the named TARGET-024G step'],
    doesNotProve: ['Global Dimension assignment unless Page 118 reopen shows the target value'],
  });
  return screenshotPath;
}

async function collectControlMap(page: Page): Promise<ControlEntry[]> {
  return page.locator('iframe').evaluateAll(async (iframes) => {
    const docs = [document];
    for (const iframe of iframes as HTMLIFrameElement[]) {
      try {
        if (iframe.contentDocument) docs.push(iframe.contentDocument);
      } catch {
        // Ignore cross-origin frames.
      }
    }

    const entries: ControlEntry[] = [];
    for (const doc of docs) {
      const nodes = Array.from(
        doc.querySelectorAll('button,a,input,textarea,select,[role],[aria-label],[title],label,span,div'),
      ) as HTMLElement[];
      for (const node of nodes) {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const input = node as HTMLInputElement;
        entries.push({
          frameUrl: doc.location.href,
          tag: node.tagName,
          role: node.getAttribute('role'),
          type: node.getAttribute('type'),
          text: (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240),
          ariaLabel: node.getAttribute('aria-label'),
          title: node.getAttribute('title'),
          value: typeof input.value === 'string' ? input.value : null,
          disabled: Boolean(input.disabled || node.getAttribute('aria-disabled') === 'true'),
          readOnly: Boolean(input.readOnly || node.getAttribute('aria-readonly') === 'true'),
          visible:
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            style.opacity !== '0',
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
        // Try next selector/frame.
      }
    }
  }
  return false;
}

async function expandDimensionsArea(page: Page): Promise<void> {
  await page.mouse.wheel(0, 900).catch(() => undefined);
  await page.waitForTimeout(500);
  for (const frame of page.frames()) {
    const buttons = frame.locator(
      'button:has-text("Mehr anzeigen"), button:has-text("Show more"), button[aria-label*="More" i], button[title*="Mehr Felder anzeigen" i]',
    );
    const count = await buttons.count();
    for (let index = 0; index < Math.min(count, 8); index += 1) {
      try {
        await buttons.nth(index).click({ timeout: 1_000 });
        await page.waitForTimeout(250);
      } catch {
        // Already expanded or offscreen.
      }
    }
  }
}

function signal(entry: ControlEntry): string {
  return clean([entry.tag, entry.role, entry.text, entry.ariaLabel, entry.title, entry.value].join(' '));
}

function findGlobalDimensionValueButton(controls: ControlEntry[], fieldNo: 1 | 2): ControlEntry | null {
  const pattern = new RegExp(`Globaler Dimensionscode ${fieldNo}|Global Dimension Code ${fieldNo}`, 'i');
  const candidates = controls
    .filter((entry) => entry.visible && entry.rect && entry.tag === 'A' && entry.role === 'button')
    .filter((entry) => pattern.test(signal(entry)))
    .filter((entry) => /Details|öffnen|oeffnen|open/i.test(signal(entry)) || clean(entry.ariaLabel) === '(Leer)')
    .sort((a, b) => a.rect!.x - b.rect!.x || a.rect!.y - b.rect!.y);
  return candidates[0] ?? null;
}

async function clickControl(page: Page, control: ControlEntry): Promise<void> {
  const rect = control.rect!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.waitForTimeout(400);
  await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.waitForTimeout(2_000);
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

function page118ShowsTarget(text: string): boolean {
  const normalized = clean(text).toUpperCase();
  return (
    normalized.includes('GLOBALER DIMENSIONSCODE 1') &&
    normalized.includes('PRODUCTLINE') &&
    normalized.includes('GLOBALER DIMENSIONSCODE 2') &&
    normalized.includes('COSTCENTER')
  );
}

test('tests Page 118 global dimension lookup/detail buttons without repeating rejected routes', async ({ page }) => {
  ensureEvidenceDir();
  const startedAt = new Date().toISOString();
  const changedFiles: string[] = [];
  const proved: string[] = [];
  const notProved: string[] = [];
  const warnings: string[] = [];
  const blockedBy: string[] = [];
  let resultStatus: 'observed' | 'blocked' = 'blocked';
  let setupChanged = false;

  await openGeneralLedgerSetup(page);
  await clickEditMode(page);
  await expandDimensionsArea(page);
  const before = await captureState(page, 'target-024g-010-page118-editmode-before-lookup', 'Page 118 editmode before lookup route');
  changedFiles.push(
    'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/target-024g-010-page118-editmode-before-lookup.png',
    'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/target-024g-010-page118-editmode-before-lookup.txt',
    'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/target-024g-010-page118-editmode-before-lookup.controls.json',
  );

  const field1Button = findGlobalDimensionValueButton(before.controls, 1);
  const field2Button = findGlobalDimensionValueButton(before.controls, 2);
  await writeJson(path.join(EVIDENCE_DIR, 'target-024g-button-map.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    field1Button,
    field2Button,
    rule: 'Only A role=button controls for the visible Page 118 Global Dimension Code rows are eligible.',
  });
  changedFiles.push('playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/target-024g-button-map.json');

  if (!field1Button || !field2Button) {
    blockedBy.push('page118-global-dimension-buttons-not-found');
    notProved.push('The Page 118 lookup/detail buttons were not found in the current control map.');
  } else {
    proved.push('Page 118 edit mode is active and both Global Dimension Code value buttons were found.');

    await clickControl(page, field1Button);
    const afterFirstClick = await captureState(
      page,
      'target-024g-020-after-global-dim-1-button-click',
      'After clicking Global Dimension Code 1 lookup/detail button',
      { clicked: { field: 'Global Dimension Code 1', control: field1Button } },
    );
    changedFiles.push(
      'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/target-024g-020-after-global-dim-1-button-click.png',
      'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/target-024g-020-after-global-dim-1-button-click.txt',
      'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/target-024g-020-after-global-dim-1-button-click.controls.json',
    );

    const firstText = clean(afterFirstClick.text);
    const relatedRecordOrNoLookup =
      /Dimensionen|Dimensions/i.test(firstText) && !/PRODUCTLINE/i.test(firstText);
    if (relatedRecordOrNoLookup || !/PRODUCTLINE/i.test(firstText)) {
      blockedBy.push('global-dimension-1-button-did-not-open-productline-lookup');
      notProved.push('Clicking the Global Dimension Code 1 value button did not expose a PRODUCTLINE selectable lookup.');
    } else {
      warnings.push('PRODUCTLINE became visible after the first button click, but this test does not yet select without a dedicated lookup-list guard.');
    }

    await openGeneralLedgerSetup(page);
    await expandDimensionsArea(page);
    const afterReopen = await captureState(page, 'target-024g-090-page118-after-lookup-probe-reopen', 'Page 118 after lookup probe reopen');
    changedFiles.push(
      'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/target-024g-090-page118-after-lookup-probe-reopen.png',
      'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/target-024g-090-page118-after-lookup-probe-reopen.txt',
      'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/target-024g-090-page118-after-lookup-probe-reopen.controls.json',
    );

    if (page118ShowsTarget(afterReopen.text)) {
      resultStatus = 'observed';
      setupChanged = true;
      proved.push('Page 118 shows PRODUCTLINE and COSTCENTER after reopen.');
    } else {
      blockedBy.push('page118-after-lookup-probe-still-does-not-show-productline-costcenter');
      notProved.push('Page 118 reopen does not prove PRODUCTLINE/COSTCENTER as Global Dimension Code 1/2.');
    }
  }

  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-024-CORE-MASTERDATA-PLAN'
      : 'TARGET-024H-GLOBAL-DIMENSION-PARK-OR-PAGEINSPECTION-DECISION';

  changedFiles.push(
    'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/TARGET-024G-result.json',
    'playwright/projects/fibu-book5/evidence/target-024g-global-dimension-page118-lookup-route/README.md',
  );

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-target-setup-route',
    resultStatus,
    startedAt,
    finishedAt: new Date().toISOString(),
    instance: TARGET_INSTANCE,
    company: TARGET_COMPANY,
    sourceCompany: TARGET_COMPANY,
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction:
      'In a final Universaarl run, prove Global Dimension Code 1/2 through Page 118 with either a real lookup selection and reopen proof or a documented park decision.',
    mustRecreateInFinalSandbox: true,
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
      page577NotOpened: true,
      directTextboxRouteNotRepeated: true,
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
          ? 'Page 118 lookup route produced a reopen proof for PRODUCTLINE/COSTCENTER.'
          : 'Page 118 lookup/detail button route did not expose a selectable PRODUCTLINE/COSTCENTER assignment proof.',
      isPlannedNextCaseStillSensible: false,
      reason:
        resultStatus === 'observed'
          ? 'The active route is complete; master data planning can continue.'
          : 'More UI retries should stop until a Page Inspection/source-backed park-or-escalation decision is made.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-024H-GLOBAL-DIMENSION-PARK-OR-PAGEINSPECTION-DECISION',
          status: resultStatus === 'observed' ? 'obsolete' : 'ready-next',
          reason:
            resultStatus === 'observed'
              ? 'No park decision needed if Page 118 values persisted.'
              : 'Repeated UI assignment routes are exhausted enough to require a decision before master data.',
        },
        {
          caseId: 'TARGET-024-CORE-MASTERDATA-PLAN',
          status: resultStatus === 'observed' ? 'ready-next' : 'ready-after-current',
          reason: 'Core master data can continue after assignment proof or explicit park decision.',
        },
        {
          caseId: 'TARGET-025-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Templates depend on posting groups, VAT and dimension/default-dimension decisions.',
        },
        {
          caseId: 'TARGET-026-VAT-SETUP-FIT-DECISION',
          status: 'needs-source-check-first',
          reason: 'German VAT setup needs its own source-backed setup fit.',
        },
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'It uses the now-proven dimension foundation for practical Universaarl master data.'
          : 'It prevents another blind Page 118/Page 577 retry and decides whether to park global dimensions or use Page Inspection.',
      risksBeforeNextCase: blockedBy,
      requiredPreparation:
        resultStatus === 'observed'
          ? ['Define first minimal Universaarl master data records.']
          : ['Review Page 118 control map and decide if global dimensions can be parked before master data.'],
    },
    validationCommands: [
      'npm run fibu:target:global-dimension-page118-lookup-route',
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
      '# TARGET-024G - Page 118 Global Dimension Lookup Route',
      '',
      `Case: ${CASE_ID}`,
      `Instance: ${TARGET_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      'This evidence tests the button-style Page 118 Global Dimension Code fields discovered in TARGET-024F.',
      'It does not open the Change Global Dimensions page, does not repeat direct textbox typing, and does not post, preview, create drafts, switch company or use APIs.',
      '',
      `Result: ${resultStatus}`,
      '',
    ].join('\n'),
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
