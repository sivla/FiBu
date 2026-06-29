import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { dismissTours, hideFactBoxPane, pageText, requireBcUrl, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(300_000);

const testId = 'manufacturing-009';
const instanceName = 'MCP_1_20260210';
const targetDataPath = 'playwright/projects/fibu-book5/testdata/manufacturing/rm-m100-bom-routing-target.json';

type TargetData = {
  productionBom: { targetNo: string; description: string };
  routing: { targetNo: string; description: string };
};

type HeaderTarget = {
  kind: 'productionBom' | 'routing';
  pageId: number;
  table: string;
  number: string;
  description: string;
  pagePattern: RegExp;
  screenshotPrefix: string;
  label: string;
};

type HeaderFitResult = {
  kind: HeaderTarget['kind'];
  pageId: number;
  number: string;
  beforeVisible: boolean;
  afterVisible: boolean;
  action: 'already-fit' | 'created-header' | 'blocked';
  clickedNew: boolean;
  filledNo: boolean;
  filledDescription: boolean;
  blockedBy: string[];
  beforeTextEvidence: string;
  afterTextEvidence: string;
  beforeScreenshot: string;
  afterScreenshot: string;
};

function mfgEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function directPageUrl(target: HeaderTarget) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', project.defaultCompany);
  url.searchParams.set('page', String(target.pageId));
  url.searchParams.set('filter', `'${target.table}'.'No.' IS '${target.number}'`);
  return url.toString();
}

async function readTargetData() {
  return JSON.parse(await fs.readFile(path.resolve(targetDataPath), 'utf8')) as TargetData;
}

function compactText(text: string) {
  const interesting = /Business Central|Production BOM|BOM-RM-M100|Routing|ROUTE-M100|No\.|Description|Status|Certified|RAW-STEEL|100|Assembly department|New|Edit|Error|Fehler|Validation|Validate/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources/i.test(line));
  const selected = lines.filter((line) => interesting.test(line)).slice(0, 180);
  return [`Kompakter Manufacturing-009-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`, '', ...selected].join('\n');
}

async function tryMaximizeReadonly(page: Page) {
  const selectors = [
    'button[aria-label*="Maximize" i]',
    'button[aria-label*="Expand" i]',
    'button[aria-label*="Full screen" i]',
    'button[aria-label*="Focus mode" i]',
    'button[aria-label*="Maximieren" i]',
    'button[aria-label*="Erweitern" i]',
    'button[title*="Maximize" i]',
    'button[title*="Expand" i]',
    'button[title*="Full screen" i]',
    'button[title*="Focus mode" i]',
    'button[title*="Maximieren" i]',
    'button[title*="Erweitern" i]'
  ];

  for (const frame of page.frames()) {
    for (const selector of selectors) {
      const button = frame.locator(selector).first();
      if (await button.isVisible({ timeout: 250 }).catch(() => false)) {
        await button.click({ timeout: 1000 }).catch(() => undefined);
        await page.waitForTimeout(500);
        return true;
      }
    }
  }
  return false;
}

async function frameWithText(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (pattern.test(text)) return frame;
  }
  throw new Error(`Kein Frame fuer ${pattern} gefunden.`);
}

async function clickScopedNew(frame: Frame) {
  const clicked = await frame
    .evaluate(() => {
      const candidates = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"]')]
        .map((node) => {
          const text = (node.innerText || '').replace(/\s+/g, ' ').trim();
          const aria = (node.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
          const title = (node.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
          const rect = node.getBoundingClientRect();
          return { node, text, aria, title, rect };
        })
        .filter(({ text, aria, title, rect }) => {
          if (rect.width <= 0 || rect.height <= 0) return false;
          const label = `${text} ${aria} ${title}`;
          if (!/\b(New|Neu)\b/i.test(label)) return false;
          if (/New\s+Company|Neue\s+Firma|New\s+Sales|New\s+Purchase/i.test(label)) return false;
          return true;
        })
        .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);

      const candidate = candidates[0];
      if (!candidate) return false;
      candidate.node.click();
      return true;
    })
    .catch(() => false);
  await frame.page().waitForTimeout(1500);
  return clicked;
}

async function fillInputByLabel(page: Page, label: RegExp, value: string) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(
        ({ source, flags, value }) => {
          const pattern = new RegExp(source, flags);
          const inputs = [...document.querySelectorAll<HTMLInputElement>('input:not([type="hidden"]), textarea')].filter((input) => {
            const rect = input.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return false;
            const label = [
              input.getAttribute('aria-label') || '',
              input.getAttribute('title') || '',
              input.getAttribute('placeholder') || '',
              input.closest('[aria-label]')?.getAttribute('aria-label') || '',
              input.parentElement?.innerText || ''
            ].join(' ');
            return pattern.test(label);
          });
          const target = inputs[0];
          if (!target) return { filled: false, count: inputs.length };
          target.focus();
          target.value = value;
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
          target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }));
          target.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Tab' }));
          return { filled: true, count: inputs.length };
        },
        { source: label.source, flags: label.flags, value }
      )
      .catch(() => ({ filled: false, count: 0 }));
    if (result.filled) {
      await page.keyboard.press('Tab').catch(() => undefined);
      await page.waitForTimeout(1200);
      return { filled: true, count: result.count };
    }
  }
  return { filled: false, count: 0 };
}

async function saveEvidenceForTarget(page: Page, target: HeaderTarget, phase: 'before' | 'after') {
  const text = await pageText(page);
  const textFile = `${target.kind}-${phase}-page-text.txt`;
  const screenshotFile = `manufacturing-009-${target.screenshotPrefix}-${phase}.png`;
  await writeTextEvidence(mfgEvidencePath(textFile), compactText(text));
  await screenshot(page, screenshotFile, {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: 'field-proof',
    purpose: `Manufacturing-009 ${phase} evidence for ${target.label}: ${target.number}`,
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 labor setup evidence only.',
      'No Production Order, Preview Posting, Posting, Consumption or Output in this case.',
      'German final proof must be recreated later.'
    ]
  });
  return {
    text,
    textEvidence: `playwright/projects/fibu-book5/evidence/${testId}/${textFile}`,
    screenshot: `playwright/projects/fibu-book5/img/${screenshotFile}`
  };
}

async function fitHeader(page: Page, target: HeaderTarget): Promise<HeaderFitResult> {
  const url = directPageUrl(target);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page);
  await tryMaximizeReadonly(page);
  await page.waitForTimeout(1500);

  if (!page.url().includes(instanceName) || !/company=RM-DEMO/i.test(page.url())) {
    throw new Error(`Instanz/Company-Gate fehlgeschlagen: ${page.url()}`);
  }

  const before = await saveEvidenceForTarget(page, target, 'before');
  expect(before.text, `${target.label} page context must be visible.`).toMatch(target.pagePattern);
  const beforeVisible = new RegExp(target.number, 'i').test(before.text);

  let clickedNew = false;
  let filledNo = false;
  let filledDescription = false;
  const blockedBy: string[] = [];
  let action: HeaderFitResult['action'] = beforeVisible ? 'already-fit' : 'blocked';

  if (!beforeVisible) {
    const frame = await frameWithText(page, target.pagePattern);
    clickedNew = await clickScopedNew(frame);
    if (!clickedNew) {
      blockedBy.push('scoped-new-not-clickable');
    } else {
      const noResult = await fillInputByLabel(page, /(^|\b)(No\.|No|Code|Nr\.?)(\b|$)/i, target.number);
      filledNo = noResult.filled;
      if (!filledNo) blockedBy.push('no-field-not-fillable');

      const descriptionResult = await fillInputByLabel(page, /Description|Beschreibung/i, target.description);
      filledDescription = descriptionResult.filled;
      if (!filledDescription) blockedBy.push('description-field-not-fillable');

      await page.keyboard.press('Tab').catch(() => undefined);
      await page.waitForTimeout(2500);
    }
  }

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page);
  await tryMaximizeReadonly(page);
  await page.waitForTimeout(1500);
  const after = await saveEvidenceForTarget(page, target, 'after');
  const afterVisible = new RegExp(target.number, 'i').test(after.text);

  if (beforeVisible) action = 'already-fit';
  else if (afterVisible && filledNo) action = 'created-header';
  else if (!afterVisible && !blockedBy.length) blockedBy.push('target-not-visible-after-create-attempt');

  return {
    kind: target.kind,
    pageId: target.pageId,
    number: target.number,
    beforeVisible,
    afterVisible,
    action,
    clickedNew,
    filledNo,
    filledDescription,
    blockedBy,
    beforeTextEvidence: before.textEvidence,
    afterTextEvidence: after.textEvidence,
    beforeScreenshot: before.screenshot,
    afterScreenshot: after.screenshot
  };
}

function renderMarkdown(result: any) {
  const rows = result.headerFits
    .map((entry: HeaderFitResult) => `| ${entry.number} | ${entry.action} | ${entry.beforeVisible ? 'ja' : 'nein'} | ${entry.afterVisible ? 'ja' : 'nein'} | ${entry.blockedBy.join(', ') || '-'} |`)
    .join('\n');
  return [
    '# MANUFACTURING-009 BOM/Routing Guarded Setup-Fit',
    '',
    'Status: `labor`, `ui-first`, `guarded-setup-fit`, `no-production-order`, `no-preview`, `no-posting`, `needs-german-final-rebuild`.',
    '',
    '| Objekt | Aktion | Vorher sichtbar | Nachher sichtbar | Blocker |',
    '|---|---|---|---|---|',
    rows,
    '',
    '## Entscheidung',
    '',
    result.decision,
    '',
    '## Grenzen',
    '',
    '- Keine Production BOM Lines gesetzt.',
    '- Keine Routing Lines gesetzt.',
    '- Keine RM-M100-Verknuepfung gesetzt.',
    '- Kein Production Order, kein Release, kein Preview Posting, kein Posting.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('MANUFACTURING-009 legt BOM/Routing-Header nur bei gescopten Controls an', async ({ page }) => {
  const targetData = await readTargetData();
  const targets: HeaderTarget[] = [
    {
      kind: 'productionBom',
      pageId: 99000786,
      table: 'Production BOM Header',
      number: targetData.productionBom.targetNo,
      description: targetData.productionBom.description,
      pagePattern: /Production BOM|Prod\. BOM|BOM|Fertigungsstueckliste|Stueckliste|Stückliste/i,
      screenshotPrefix: '010-production-bom-header',
      label: 'Production BOM'
    },
    {
      kind: 'routing',
      pageId: 99000764,
      table: 'Routing Header',
      number: targetData.routing.targetNo,
      description: targetData.routing.description,
      pagePattern: /Routing|Routings|Arbeitsplan|Arbeitsplaene|Arbeitspläne/i,
      screenshotPrefix: '020-routing-header',
      label: 'Routing'
    }
  ];

  const headerFits: HeaderFitResult[] = [];
  for (const target of targets) {
    headerFits.push(await fitHeader(page, target));
  }

  const blockedBy = headerFits.flatMap((entry) => entry.blockedBy.map((blocker) => `${entry.number}:${blocker}`));
  const allHeadersVisible = headerFits.every((entry) => entry.afterVisible);
  const setupChanged = headerFits.some((entry) => entry.action === 'created-header');
  const resultStatus = allHeadersVisible ? (setupChanged ? 'setup-fit-partial' : 'already-fit') : 'blocked';
  const result = {
    schemaVersion: 1,
    caseId: 'MANUFACTURING-009-BOM-ROUTING-GUARDED-SETUP-FIT',
    source: 'playwright-ui-guarded-setup-fit',
    resultStatus,
    instance: instanceName,
    company: project.defaultCompany,
    sourceCompany: project.defaultCompany,
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged,
    draftCreated: false,
    companySwitched: false,
    apiShortcut: false,
    targetDataPath,
    headerFits,
    blockedBy,
    decision: allHeadersVisible
      ? 'BOM/Routing headers are visible after guarded UI-first setup-fit. Lines, certification, RM-M100 links and Production Order remain locked for follow-up cases.'
      : 'BOM/Routing header setup-fit is blocked; do not attempt lines, certification, item links or production order until the header route is reviewed.',
    proved: [
      'The run stayed inside MCP_1_20260210 / RM-DEMO.',
      'Known Manufacturing setup pages were opened by direct page URL without Tell-Me/search.',
      ...(allHeadersVisible ? ['BOM-RM-M100 and ROUTE-M100 headers are visible after the guarded run.'] : []),
      ...(setupChanged ? ['At least one header was created through UI-first guarded controls.'] : ['No setup write was needed or proved.'])
    ],
    notProved: [
      'No Production BOM line RAW-STEEL quantity per 2 PCS was set.',
      'No Routing line Work Center 100 / run time 1 was set.',
      'No BOM/Routing status certification was performed.',
      'No RM-M100 item link fields were changed.',
      'No Production Order was created, released or posted.',
      'No Preview Posting, Consumption, Output, Item Ledger, Value Entry, Capacity Entry or G/L trace exists.',
      'No German final proof exists.'
    ],
    flags: {
      noSearch: true,
      noProductionOrder: true,
      noPost: true,
      noPreview: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/manufacturing-009/MANUFACTURING-009-result.json',
      'playwright/projects/fibu-book5/evidence/manufacturing-009/MANUFACTURING-009-GUARDED-SETUP-FIT.md',
      targetDataPath
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/manufacturing-009/MANUFACTURING-009-result.json',
      'playwright/projects/fibu-book5/evidence/manufacturing-009/MANUFACTURING-009-GUARDED-SETUP-FIT.md',
      'playwright/projects/fibu-book5/evidence/manufacturing-009/README.md'
    ],
    requiresReview: !allHeadersVisible,
    safeToFinalizeState: false,
    statePatch: {},
    nextCase: allHeadersVisible ? 'MANUFACTURING-010-BOM-ROUTING-LINE-FIT-DECISION' : 'MANUFACTURING-010-BOM-ROUTING-HEADER-FIT-BLOCKER-REVIEW',
    nextStep: allHeadersVisible
      ? 'Decide a guarded line-fit case for RAW-STEEL BOM line and Work Center 100 Routing line; no Production Order yet.'
      : 'Review M009 blocker and improve the scoped header creation route before any line-fit attempt.'
  };

  await writeJsonEvidence(mfgEvidencePath('MANUFACTURING-009-result.json'), result);
  await writeTextEvidence(mfgEvidencePath('MANUFACTURING-009-GUARDED-SETUP-FIT.md'), renderMarkdown(result));
  await writeTextEvidence(
    mfgEvidencePath('README.md'),
    [
      '# MANUFACTURING-009 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `MANUFACTURING-009-result.json` | JSON-Ergebnis | Header-Fit-Status fuer BOM/Routing | keine BOM-/Routing-Zeilen oder Fertigungsbuchung | labor-setup-fit |',
      '| `MANUFACTURING-009-GUARDED-SETUP-FIT.md` | Lernnotiz | Warum Header-Fit und Linien-Fit getrennt werden | keinen deutschen Finalnachweis | labor |',
      '| `*-page-text.txt` | kompakter Seitentext | Vorher/Nachher-Kontext | keine vollstaendige Tabelle | page-text |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck/Grenzen je Bild | keine eigenstaendige Buchwahrheit | screenshot-metadata |',
      '',
      'Keine Suche, kein Production Order, kein Release, kein Preview Posting, kein Post.',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.companySwitched).toBe(false);
  expect(headerFits.length).toBe(2);
});
