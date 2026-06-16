import { test, expect, type Page, type Frame } from '@playwright/test';
import 'dotenv/config';
import { mkdir, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  openBcPageById,
  pageText,
  screenshot,
  waitForPageText,
} from '../../../core/bc-helpers';
import { clickBcAction } from '../../../core/bc/actions';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(300_000);

const testId = 'fixedassets-023';
const projectRoot = path.join('playwright', 'projects', 'fibu-book5');
const evidenceDir = path.join(projectRoot, 'evidence', testId);

const target = {
  environment: 'MCP_1_20260210',
  company: 'RM-DEMO',
  fixedAssetNo: 'FA-CNC-01',
  description: 'CNC Maschine FRA',
  depreciationBook: 'HGB',
  faPostingGroup: 'MACHINES',
};

const fieldCaptions = [
  'No.',
  'Description',
  'FA Class Code',
  'FA Subclass Code',
  'Depreciation Book Code',
  'Posting Group',
  'Depreciation Method',
  'Depreciation Starting Date',
  'Depreciation Ending Date',
  'Book Value',
];

type FieldDiagnostic = {
  caption: string;
  captionVisibleInText: boolean;
  labelCandidates: Array<{
    text: string;
    tagName: string;
    role: string;
    ariaLabel: string;
    title: string;
    rect: { x: number; y: number; width: number; height: number };
  }>;
  nearbyControls: Array<{
    tagName: string;
    role: string;
    ariaLabel: string;
    title: string;
    placeholder: string;
    value: string;
    text: string;
    rect: { x: number; y: number; width: number; height: number };
  }>;
  nearbyButtons: Array<{
    tagName: string;
    role: string;
    ariaLabel: string;
    title: string;
    text: string;
    rect: { x: number; y: number; width: number; height: number };
  }>;
  diagnosis: 'caption-and-control-nearby' | 'caption-only' | 'caption-not-visible';
};

function evidencePath(fileName: string): string {
  return path.join(evidenceDir, fileName);
}

async function writeJson(fileName: string, value: unknown) {
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(evidencePath(fileName), `${JSON.stringify(sanitizeEvidenceValue(value), null, 2)}\n`, 'utf8');
}

async function writeMarkdown(fileName: string, value: string) {
  await mkdir(evidenceDir, { recursive: true });
  const cleanValue = fileName.endsWith('.txt') ? sanitizePageEvidenceText(value) : normalizeEvidenceString(value);
  await writeFile(evidencePath(fileName), cleanValue, 'utf8');
}

function sanitizePageEvidenceText(value: string): string {
  const blockedLinePatterns = [
    /allowedEndpoints/i,
    /allowedResources/i,
    /shouldAttachOauthTokens/i,
    /tokenFactorySettings/i,
    /TokenFactoryInsideIframe/i,
    /oauth/i,
    /graph\.microsoft\.com/i,
  ];

  return value
    .split(/\r?\n/)
    .filter((line) => !blockedLinePatterns.some((pattern) => pattern.test(line)))
    .map((line) => normalizeEvidenceString(line))
    .join('\n')
    .trimEnd()
    .concat('\n');
}

function normalizeEvidenceString(value: string): string {
  return value
    .replace(new RegExp('\\u00C3\\u00A4', 'g'), 'ae')
    .replace(new RegExp('\\u00C3\\u00B6', 'g'), 'oe')
    .replace(new RegExp('\\u00C3\\u00BC', 'g'), 'ue')
    .replace(new RegExp('\\u00C3\\u0084', 'g'), 'Ae')
    .replace(new RegExp('\\u00C3\\u0096', 'g'), 'Oe')
    .replace(new RegExp('\\u00C3\\u009C', 'g'), 'Ue')
    .replace(new RegExp('\\u00C3\\u009F', 'g'), 'ss')
    .replace(new RegExp('\\u00E2\\u20AC[\\u201C\\u201D]', 'g'), '-')
    .replace(new RegExp('\\u00E2\\u20AC[\\u017E\\u0153\\u009D]', 'g'), '"')
    .replace(new RegExp('\\u00C2', 'g'), '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .trimEnd();
}

function sanitizeEvidenceValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return normalizeEvidenceString(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeEvidenceValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, sanitizeEvidenceValue(entry)]),
    );
  }

  return value;
}

async function prepareRunArtifacts() {
  await rm(evidenceDir, { recursive: true, force: true });
  await mkdir(evidenceDir, { recursive: true });

  const imgDir = path.join(projectRoot, 'img');
  await mkdir(imgDir, { recursive: true });
  const existingImages = await readdir(imgDir).catch(() => []);
  await Promise.all(
    existingImages
      .filter((fileName) => fileName.startsWith(`${testId}-`))
      .map((fileName) => unlink(path.join(imgDir, fileName)).catch(() => undefined)),
  );
}

function fixedAssetsUrl(filterToTarget = false): string {
  const url = new URL(process.env[`${project.envPrefix}_BC_URL`] ?? process.env.BC_URL ?? '');

  if (filterToTarget) {
    url.searchParams.set('page', '5601');
    url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${target.fixedAssetNo}'`);
  }

  return url.toString();
}

async function openFixedAssets(page: Page, filterToTarget = false) {
  if (filterToTarget) {
    await page.goto(fixedAssetsUrl(true), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForPageText(page, /Fixed Assets|Anlagen|No\.|Description/i, { timeout: 120_000 });
  } else {
    await openBcPageById(page, 5601, {
      envPrefix: project.envPrefix,
      expectedText: /Fixed Assets|Anlagen|No\.|Description/i,
    });
  }
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Assets|Anlagen/i, { timeout: 30_000 });
}

async function assertRmDemoContext(page: Page) {
  const body = await pageText(page);
  const url = decodeURIComponent(page.url());
  const issues: string[] = [];

  if (!url.includes(target.environment)) {
    issues.push(`URL enthaelt nicht ${target.environment}`);
  }

  if (!/company=RM-DEMO/i.test(url)) {
    issues.push('URL enthaelt nicht company=RM-DEMO');
  }

  if (!/Rhein-Main Demo GmbH|RM-DEMO|MCP_1_20260210/i.test(body)) {
    issues.push('RM-DEMO ist im sichtbaren Seitentext nicht nachweisbar');
  }

  expect(issues, issues.join('\n')).toEqual([]);
}

async function findFixedAssetFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 2_000 }).catch(() => '');
    if (/Fixed Asset|Anlage|FA Class Code|Depreciation Book|Posting Group|Description/i.test(text)) {
      return frame;
    }
  }

  return page.mainFrame();
}

async function clickScopedNew(page: Page) {
  const helperResult = await clickBcAction(page, {
    name: /New|Neu|Erstellen Sie einen neuen Eintrag/i,
    roles: ['button', 'menuitem'],
    scopeText: /Fixed Assets|Anlagen/i,
    expectedAfterClick: /Fixed Asset Card|FA Class Code|FA Subclass Code|Depreciation Book/i,
    timeout: 5000,
    afterClickTimeout: 30_000,
  });

  if (helperResult.clicked) {
    await writeJson('010-new-action-candidates.json', {
      helper: 'clickBcAction',
      result: helperResult,
      fallbackUsed: false,
    });
    await dismissTours(page);
    await hideFactBoxPane(page);
    return;
  }

  const frame = await findFixedAssetFrame(page);
  const actionResult = await frame.evaluate(() => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const buttons = Array.from(document.querySelectorAll('button,[role="button"],a'));
    const candidates = buttons
      .map((element) => {
        const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
        const aria = element.getAttribute('aria-label') || '';
        const title = element.getAttribute('title') || '';
        const name = [aria, title, text].filter(Boolean).join(' | ');
        const rect = element.getBoundingClientRect();
        return { element, name, text, aria, title, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
      .filter((candidate) => visible(candidate.element))
      .filter((candidate) => /\b(New|Neu)\b|Erstellen Sie einen neuen Eintrag/i.test(candidate.name))
      .sort((a, b) => Math.abs(a.y - 120) - Math.abs(b.y - 120) || a.x - b.x);

    const chosen = candidates[0];
    if (!chosen) {
      return { clicked: false, candidates: candidates.map(({ element, ...rest }) => rest) };
    }

    (chosen.element as HTMLElement).click();
    return {
      clicked: true,
      chosen: {
        name: chosen.name,
        x: chosen.x,
        y: chosen.y,
        width: chosen.width,
        height: chosen.height,
      },
      candidates: candidates.map(({ element, ...rest }) => rest),
    };
  });

  await writeJson('010-new-action-candidates.json', {
    helper: 'local-title-icon-fallback',
    helperResult,
    fallbackUsed: true,
    fallbackReason:
      'BC may expose the Fixed Asset Card New icon through title/aria text that is not always matched by role locator. Fallback is still scoped by Fixed Assets frame and followed by visible card-state proof.',
    actionResult,
  });
  expect(actionResult.clicked, 'Scoped New action auf Fixed Assets muss verfuegbar sein').toBeTruthy();
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await waitForPageText(page, /Fixed Asset Card|FA Class Code|FA Subclass Code|Depreciation Book/i, { timeout: 30_000 });
  await dismissTours(page);
  await hideFactBoxPane(page);
}

async function clickAllCardShowMore(page: Page) {
  const frame = await findFixedAssetFrame(page);
  const result = await frame.evaluate(() => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const elements = Array.from(document.querySelectorAll('button,[role="button"],a'));
    const candidates = elements
      .map((element) => {
        const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
        const aria = element.getAttribute('aria-label') || '';
        const title = element.getAttribute('title') || '';
        const name = [aria, title, text].filter(Boolean).join(' | ');
        const rect = element.getBoundingClientRect();
        return { element, name, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
      .filter((candidate) => visible(candidate.element))
      .filter((candidate) => /show\s*more|mehr\s*anzeigen|weitere\s*anzeigen/i.test(candidate.name))
      .sort((a, b) => a.y - b.y || a.x - b.x);

    const clicked: Array<{ name: string; x: number; y: number; width: number; height: number }> = [];
    for (const candidate of candidates.slice(0, 4)) {
      (candidate.element as HTMLElement).click();
      clicked.push({
        name: candidate.name,
        x: candidate.x,
        y: candidate.y,
        width: candidate.width,
        height: candidate.height,
      });
    }

    return {
      clicked,
      candidates: candidates.map(({ element, ...rest }) => rest),
    };
  });

  await writeJson('020-show-more-diagnosis.json', result);
  await waitForPageText(page, /Depreciation Book Code|Posting Group|FA Class Code|FA Subclass Code/i, { timeout: 30_000 });
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function collectFieldDiagnostics(page: Page): Promise<FieldDiagnostic[]> {
  const visibleText = await pageText(page);
  const frame = await findFixedAssetFrame(page);

  return frame.evaluate(
    ({ captions, visibleTextValue }) => {
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rectOf = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      };

      const allElements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(visible);
      const controls = Array.from(
        document.querySelectorAll<HTMLElement>('input,textarea,select,[contenteditable="true"],[role="combobox"]'),
      ).filter(visible);
      const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a')).filter(visible);

      return captions.map((caption) => {
        const captionPattern = new RegExp(`(^|\\b)${escape(caption).replace(/\\s+/g, '\\s+')}($|\\b)`, 'i');
        const labelCandidates = allElements
          .map((element) => {
            const text = normalize(element.innerText || element.textContent);
            return {
              element,
              text,
              tagName: element.tagName,
              role: normalize(element.getAttribute('role')),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              rect: rectOf(element),
            };
          })
          .filter((candidate) => candidate.text.length > 0 && candidate.text.length <= 120)
          .filter(
            (candidate) =>
              captionPattern.test(candidate.text) ||
              captionPattern.test(candidate.ariaLabel) ||
              captionPattern.test(candidate.title),
          )
          .sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x)
          .slice(0, 3);

        const primary = labelCandidates[0];
        const nearbyControls = primary
          ? controls
              .map((element) => ({
                tagName: element.tagName,
                role: normalize(element.getAttribute('role')),
                ariaLabel: normalize(element.getAttribute('aria-label')),
                title: normalize(element.getAttribute('title')),
                placeholder: normalize((element as HTMLInputElement).placeholder),
                value: normalize((element as HTMLInputElement).value),
                text: normalize(element.textContent),
                rect: rectOf(element),
              }))
              .filter((control) => Math.abs(control.rect.y - primary.rect.y) <= 60 && control.rect.x >= primary.rect.x - 20)
              .sort((a, b) => Math.abs(a.rect.y - primary.rect.y) - Math.abs(b.rect.y - primary.rect.y) || a.rect.x - b.rect.x)
              .slice(0, 3)
          : [];

        const nearbyButtons = primary
          ? buttons
              .map((element) => ({
                tagName: element.tagName,
                role: normalize(element.getAttribute('role')),
                ariaLabel: normalize(element.getAttribute('aria-label')),
                title: normalize(element.getAttribute('title')),
                text: normalize(element.textContent),
                rect: rectOf(element),
              }))
              .filter((button) => Math.abs(button.rect.y - primary.rect.y) <= 60 && button.rect.x >= primary.rect.x - 20)
              .sort((a, b) => Math.abs(a.rect.y - primary.rect.y) - Math.abs(b.rect.y - primary.rect.y) || a.rect.x - b.rect.x)
              .slice(0, 3)
          : [];

        return {
          caption,
          captionVisibleInText: new RegExp(`\\b${escape(caption)}\\b`, 'i').test(visibleTextValue),
          labelCandidates: labelCandidates.map(({ element, ...rest }) => rest),
          nearbyControls,
          nearbyButtons,
          diagnosis: !primary ? 'caption-not-visible' : nearbyControls.length > 0 ? 'caption-and-control-nearby' : 'caption-only',
        };
      });
    },
    { captions: fieldCaptions, visibleTextValue: visibleText },
  );
}

async function tryOpenPageInspection(page: Page) {
  const before = await pageText(page);
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await expect
    .poll(async () => pageText(page), {
      timeout: 8_000,
      intervals: [500, 1000, 2000],
    })
    .toMatch(/Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID|Fixed Asset/i)
    .catch(() => undefined);
  const after = await pageText(page);
  const opened = /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID|Extension/i.test(after) && after !== before;
  const pageInspectionText = sanitizePageEvidenceText(
    after
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => /Page|Table|Field|Source|Filter|Extension|Fixed Asset|Anlage|5600|5601/i.test(line))
      .slice(0, 80)
      .join('\n'),
  );

  await writeMarkdown('040-page-inspection-attempt.txt', pageInspectionText || 'Page Inspection shortcut produced no focused page inspection text.\n');

  if (opened) {
    await screenshot(page, `${testId}-040-page-inspection-diagnosis.png`, {
      projectName: project.name,
      testId,
      status: 'candidate',
      bookUse: 'evidence',
      purpose:
        'Technical diagnosis screenshot: Page Inspection opened from the unsaved Fixed Asset Card. This is debug evidence, not a final book screenshot.',
      expectedPageText: [/Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i],
      knownLimitations: [
        'Debug-/Evidence-Bild, kein finaler Anwenderscreenshot.',
        'Keine Anlage, keine Anschaffung, keine AfA und keine Buchung.',
      ],
    });
  }

  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.keyboard.press('Escape').catch(() => undefined);

  return {
    shortcut: 'Control+Alt+F1',
    opened,
    focusedTextWritten: 'playwright/projects/fibu-book5/evidence/fixedassets-023/040-page-inspection-attempt.txt',
    screenshot: opened ? 'playwright/projects/fibu-book5/img/fixedassets-023-040-page-inspection-diagnosis.png' : null,
    limitation: opened
      ? 'Page Inspection is debug context only and does not prove card values.'
      : 'Shortcut was not reliably available in this Playwright/browser context; use Help & Support / Inspect pages and data manually if needed.',
  };
}

function renderMarkdown(result: {
  generatedAt: string;
  status: string;
  technicalFinding: string;
  fieldDiagnostics: FieldDiagnostic[];
  pageInspectionAttempt: Awaited<ReturnType<typeof tryOpenPageInspection>>;
  targetNotSaved: boolean;
  safeSaveGatePossible: boolean;
  nextStep: string;
}) {
  const rows = result.fieldDiagnostics
    .map((item) => {
      const controlSummary = item.nearbyControls.length
        ? item.nearbyControls.map((control) => control.ariaLabel || control.title || control.value || control.tagName).join('; ')
        : '-';
      const buttonSummary = item.nearbyButtons.length
        ? item.nearbyButtons.map((button) => button.ariaLabel || button.title || button.text || button.tagName).join('; ')
        : '-';
      return `| ${item.caption} | ${item.captionVisibleInText ? 'ja' : 'nein'} | ${item.diagnosis} | ${controlSummary} | ${buttonSummary} |`;
    })
    .join('\n');

  return `# FIXEDASSETS-023 - FA-CNC-01 Card Technical Diagnosis

Status: ${result.status}

## Zweck

Dieser Lauf klaert no-save, warum die Feldpfade der leeren Anlagenkarte zwar sichtbar sind, aber noch nicht sicher als Werte-/Lookup-Klickpfad fuer \`${target.fixedAssetNo}\` genutzt werden duerfen.

## Kontext

- Instanz: \`${target.environment}\`
- Company: \`${target.company}\`
- Zielanlage: \`${target.fixedAssetNo}\`
- Zielwerte spaeter: \`${target.description}\`, \`${target.depreciationBook}\`, \`${target.faPostingGroup}\`
- Modus: technische Diagnose, keine Speicherung, kein Setup, keine Buchung

## Feld-/Control-Diagnose

| Feldcaption | im Seitentext sichtbar | Diagnose | nahe Controls | nahe Buttons |
|---|---:|---|---|---|
${rows}

## Page Inspection

- Shortcut: \`${result.pageInspectionAttempt.shortcut}\`
- Geoeffnet: ${result.pageInspectionAttempt.opened ? 'ja' : 'nein'}
- Grenze: ${result.pageInspectionAttempt.limitation}

## Technischer Befund

${result.technicalFinding}

## Entscheidung

- \`${target.fixedAssetNo}\` wurde nicht gespeichert: ${result.targetNotSaved ? 'ja' : 'nein'}
- Save-Gate moeglich: ${result.safeSaveGatePossible ? 'ja' : 'nein'}

Die Diagnose liefert technischen Kontext, aber noch keine fachliche Speicherfreigabe. Fuer ein Buchbild reicht weiterhin nicht, dass ein Feldname irgendwo sichtbar ist; der relevante Code muss im richtigen Karten- oder Lookup-Kontext sichtbar sein.

## Naechster Schritt

${result.nextStep}
`;
}

test('FIXEDASSETS-023 diagnoses the unsaved FA-CNC-01 card fields technically', async ({ page }) => {
  await prepareRunArtifacts();

  await openFixedAssets(page);
  await assertRmDemoContext(page);
  await writeMarkdown('000-fixed-assets-list-context.txt', await compactPageText(page, { maxLines: 80 }));

  await clickScopedNew(page);
  await assertRmDemoContext(page);
  await clickAllCardShowMore(page);

  await writeMarkdown('020-card-context-after-show-more.txt', await compactPageText(page, { maxLines: 140 }));
  await screenshot(page, `${testId}-020-card-context-after-show-more.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'evidence',
    purpose:
      'Context screenshot for the unsaved Fixed Asset Card after Show More. It supports technical diagnosis only; it does not prove HGB/MACHINES as values.',
    expectedPageText: [/Fixed Asset|Anlage/i],
    knownLimitations: [
      'Leere Anlagenkarte nur als Diagnosekontext.',
      'Kein Wertnachweis fuer HGB, MACHINES, FA Class oder FA Subclass.',
      'Keine Anlage, keine Anschaffung, keine AfA und keine Buchung.',
    ],
  });

  const fieldDiagnostics = await collectFieldDiagnostics(page);
  await writeJson('030-field-control-diagnosis.json', fieldDiagnostics);

  const pageInspectionAttempt = await tryOpenPageInspection(page);

  await openFixedAssets(page, true);
  await assertRmDemoContext(page);
  const filteredText = await pageText(page);
  const targetNotSaved = !new RegExp(`\\b${escapeRegExp(target.fixedAssetNo)}\\b`, 'i').test(filteredText);
  await writeMarkdown('090-target-filter-after-run.txt', await compactPageText(page, { maxLines: 80 }));

  const requiredValueFields = ['FA Class Code', 'FA Subclass Code', 'Depreciation Book Code', 'Posting Group'];
  const safelyActionableFields = fieldDiagnostics
    .filter((item) => requiredValueFields.includes(item.caption))
    .filter((item) => item.diagnosis === 'caption-and-control-nearby');
  const safeSaveGatePossible = safelyActionableFields.length === requiredValueFields.length && targetNotSaved;
  const status = safeSaveGatePossible
    ? 'labor-technical-diagnosis-save-gate-candidate-no-save'
    : 'labor-technical-diagnosis-save-gate-blocked-no-save';
  const nextStep = safeSaveGatePossible
    ? 'FIXEDASSETS-024: explicit save-gate decision for FA-CNC-01 before any acquisition.'
    : 'FIXEDASSETS-024: use manual Page Inspection/Personalize or a more specific card-control helper before saving FA-CNC-01.';
  const fieldDiagnosticsSummary = fieldDiagnostics.map((item) => ({
    caption: item.caption,
    diagnosis: item.diagnosis,
    labelCandidateCount: item.labelCandidates.length,
    nearbyControlCount: item.nearbyControls.length,
    nearbyButtonCount: item.nearbyButtons.length,
    firstLabelTag: item.labelCandidates[0]?.tagName || null,
    firstLabelRole: item.labelCandidates[0]?.role || null,
  }));

  const result = {
    testId,
    generatedAt: new Date().toISOString(),
    mode: 'ui-first-no-save-technical-diagnosis',
    instance: target.environment,
    company: target.company,
    target,
    status,
    technicalFinding:
      'Page Inspection confirms the foreground page as Fixed Asset Card (5600, Document) with source table Fixed Asset (5600). The visual card shows FA Class Code, FA Subclass Code, Depreciation Book Code and Posting Group controls, but the DOM diagnosis can still pick background Fixed Assets list headers if locators are not scoped to the foreground card/pane. The next helper must scope to the active card surface and prefer the visible card label/control row over background list headers.',
    fieldDiagnosticsFile: 'playwright/projects/fibu-book5/evidence/fixedassets-023/030-field-control-diagnosis.json',
    fieldDiagnosticsSummary,
    pageInspectionAttempt,
    targetNotSaved,
    safeSaveGatePossible,
    hardBoundaries: [
      'No Fixed Asset was saved.',
      'No Fixed Asset setup value was created or changed.',
      'No acquisition was posted.',
      'No depreciation was posted.',
      'No German final fixed-assets proof was claimed.',
    ],
    nextStep,
  };

  await writeJson('FIXEDASSETS-023-result.json', result);
  await writeMarkdown('FIXEDASSETS-023-FA-CNC-01-CARD-TECHNICAL-DIAGNOSIS.md', renderMarkdown({ ...result, fieldDiagnostics }));
  await writeMarkdown(
    'README.md',
    `# fixedassets-023 Evidence

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| \`FIXEDASSETS-023-result.json\` | JSON | technische no-save Diagnose der Anlagenkarte | keine Speicherfreigabe, keine Buchung | ${status} |
| \`FIXEDASSETS-023-FA-CNC-01-CARD-TECHNICAL-DIAGNOSIS.md\` | Markdown | Lern- und Buchwirkung der Diagnose | keinen deutschen Finalnachweis | labor |
| \`030-field-control-diagnosis.json\` | JSON | Caption-/Control-Naehe fuer relevante Kartenfelder | keinen Wertnachweis fuer \`HGB\` oder \`MACHINES\` | technical-diagnosis |
| \`040-page-inspection-attempt.txt\` | UI-Text | Page-Inspection-Shortcut-Versuch | kein finaler Anwenderscreenshot | ${pageInspectionAttempt.opened ? 'debug-candidate' : 'shortcut-not-available'} |
| \`090-target-filter-after-run.txt\` | UI-Text | Nachlauf-Filter auf \`${target.fixedAssetNo}\` | keine API-Pruefung | no-save-check |
`,
  );

  expect(targetNotSaved, `${target.fixedAssetNo} darf in diesem Diagnoselauf nicht gespeichert werden`).toBeTruthy();
});
