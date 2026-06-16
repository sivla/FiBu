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
import { collectActiveCardControlDiagnostics, type BcCardControlDiagnostic } from '../../../core/bc/cards';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(300_000);

const testId = 'fixedassets-024';
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

const requiredCaptions = [
  'FA Class Code',
  'FA Subclass Code',
  'Depreciation Book Code',
  'Posting Group',
  'Depreciation Starting Date',
  'Depreciation Ending Date',
];

function evidencePath(fileName: string): string {
  return path.join(evidenceDir, fileName);
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

async function writeJson(fileName: string, value: unknown) {
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(evidencePath(fileName), `${JSON.stringify(sanitizeEvidenceValue(value), null, 2)}\n`, 'utf8');
}

async function writeMarkdown(fileName: string, value: string) {
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(evidencePath(fileName), normalizeEvidenceString(value).concat('\n'), 'utf8');
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

  await writeJson('010-new-action-result.json', {
    helper: 'clickBcAction',
    result: helperResult,
    fallbackUsed: false,
  });
  expect(helperResult.clicked, 'Scoped New action auf Fixed Assets muss ueber clickBcAction verfuegbar sein').toBeTruthy();

  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
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
        x: Math.round(candidate.x),
        y: Math.round(candidate.y),
        width: Math.round(candidate.width),
        height: Math.round(candidate.height),
      });
    }

    return {
      clicked,
      candidates: candidates.map(({ element, ...rest }) => rest),
    };
  });

  await writeJson('020-show-more-result.json', result);
  await waitForPageText(page, /Depreciation Book Code|Posting Group|FA Class Code|FA Subclass Code/i, { timeout: 30_000 });
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderFieldRows(diagnostics: BcCardControlDiagnostic[]) {
  return diagnostics
    .map((entry) => {
      const label = entry.selectedLabel
        ? `${entry.selectedLabel.tagName}${entry.selectedLabel.role ? `/${entry.selectedLabel.role}` : ''} @ ${entry.selectedLabel.rect.x},${entry.selectedLabel.rect.y}`
        : '-';
      const controls = entry.nearbyControls.length
        ? entry.nearbyControls.map((control) => control.ariaLabel || control.title || control.value || control.tagName).join('; ')
        : '-';
      const rejected = entry.rejectedBackgroundCandidates.length ? String(entry.rejectedBackgroundCandidates.length) : '0';
      return `| ${entry.caption} | ${entry.diagnosis} | ${label} | ${controls} | ${rejected} |`;
    })
    .join('\n');
}

function renderMarkdown(result: {
  status: string;
  activeControlProof: boolean;
  targetNotSaved: boolean;
  diagnosis: Awaited<ReturnType<typeof collectActiveCardControlDiagnostics>>;
}) {
  return `# FIXEDASSETS-024 - Active Card Control Diagnosis

Status: ${result.status}

## Zweck

Dieser Lauf prueft no-save, ob Playwright die sichtbaren Controls der aktiven \`Fixed Asset Card\` von Treffern der Hintergrundliste trennen kann. Das ist der fehlende technische Schritt vor jedem spaeteren Speichern von \`${target.fixedAssetNo}\`.

## Kontext

- Instanz: \`${target.environment}\`
- Company: \`${target.company}\`
- Zielanlage spaeter: \`${target.fixedAssetNo}\`
- Modus: UI-first, active-card-control diagnosis, no-save, no-setup, no-posting

## Diagnose

| Feld | Ergebnis | ausgewaehltes Label | nahe Controls | verworfene Hintergrundtreffer |
|---|---|---|---|---:|
${renderFieldRows(result.diagnosis.diagnostics)}

## Ergebnis

- Aktive Kartencontrols ausreichend gemappt: ${result.activeControlProof ? 'ja' : 'nein'}
- \`${target.fixedAssetNo}\` wurde nicht gespeichert: ${result.targetNotSaved ? 'ja' : 'nein'}
- Screenshot: \`playwright/projects/fibu-book5/img/fixedassets-024-020-active-card-control-diagnosis.png\`

## Lernwert

Business Central laesst die Liste hinter einer Karte technisch im DOM. Deshalb darf ein Locator nicht nur nach Feldcaption suchen. Er muss den Vordergrundkarten-Kontext und die editierbare Control-Zeile bewerten. Fuer das Buch heisst das: Ein Screenshot oder Test ist erst belastbar, wenn der behauptete Wert im richtigen sichtbaren Kartenkontext erscheint.

## Grenze

Dieser Lauf setzt keine Werte. Er beweist noch nicht \`HGB\`, \`MACHINES\`, Anlagenklasse, Anlagenunterklasse oder AfA-Daten als gewaehlte Werte auf \`${target.fixedAssetNo}\`. Er oeffnet nur den naechsten kontrollierten Weg zu einer spaeteren Save-Gate-Entscheidung.
`;
}

test('FIXEDASSETS-024 maps active Fixed Asset Card controls without saving FA-CNC-01', async ({ page }) => {
  await prepareRunArtifacts();

  await openFixedAssets(page);
  await assertRmDemoContext(page);
  await writeMarkdown('000-fixed-assets-list-context.txt', await compactPageText(page, { maxLines: 80 }));

  await clickScopedNew(page);
  await assertRmDemoContext(page);
  await clickAllCardShowMore(page);

  await writeMarkdown('020-active-card-context.txt', await compactPageText(page, { maxLines: 140 }));
  await screenshot(page, `${testId}-020-active-card-control-diagnosis.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'evidence',
    purpose:
      'Technical evidence screenshot for the active unsaved Fixed Asset Card after Show More. It must show the card controls, not final FA-CNC-01 values.',
    expectedPageText: [/Fixed Asset|FA Class Code|Depreciation Book Code|Posting Group/i],
    knownLimitations: [
      'Technischer Labor-/Diagnose-Screenshot, kein finaler Stammdatenbeweis.',
      'Keine Werte FA-CNC-01, HGB oder MACHINES gesetzt.',
      'Kein Setup, keine Anschaffung, keine AfA und keine Buchung.',
    ],
  });

  const diagnosis = await collectActiveCardControlDiagnostics(page, requiredCaptions, {
    targetText: /Fixed Asset Card|FA Class Code|Depreciation Book Code|Posting Group/i,
  });
  await writeJson('030-active-card-control-diagnosis.json', diagnosis);

  const requiredFieldResults = diagnosis.diagnostics.filter((entry) => requiredCaptions.includes(entry.caption));
  const activeControlProof = requiredFieldResults.every(
    (entry) =>
      entry.diagnosis === 'active-card-label-with-control' ||
      entry.diagnosis === 'active-card-label-with-button',
  );

  await openFixedAssets(page, true);
  await assertRmDemoContext(page);
  const filteredText = await pageText(page);
  const targetNotSaved = !new RegExp(`\\b${escapeRegExp(target.fixedAssetNo)}\\b`, 'i').test(filteredText);
  await writeMarkdown('090-target-filter-after-run.txt', await compactPageText(page, { maxLines: 80 }));

  const status = activeControlProof
    ? 'labor-active-card-control-mapped-no-save'
    : 'labor-active-card-control-partial-no-save';
  const result = {
    testId,
    generatedAt: new Date().toISOString(),
    mode: 'ui-first-active-card-control-diagnosis-no-save',
    instance: target.environment,
    company: target.company,
    target,
    status,
    activeControlProof,
    diagnosisFile: 'playwright/projects/fibu-book5/evidence/fixedassets-024/030-active-card-control-diagnosis.json',
    summary: diagnosis.summary,
    screenshot: 'playwright/projects/fibu-book5/img/fixedassets-024-020-active-card-control-diagnosis.png',
    targetNotSaved,
    hardBoundaries: [
      'No Fixed Asset was saved.',
      'No setup value was created or changed.',
      'No K30000 vendor was created.',
      'No purchase invoice was created.',
      'No acquisition was posted.',
      'No depreciation was posted.',
      'No German final fixed-assets proof was claimed.',
    ],
    nextStep: activeControlProof
      ? 'FIXEDASSETS-025: decide a no-save value/lookup or save-gate plan for FA-CNC-01 using the active-card-control helper.'
      : 'FIXEDASSETS-025: use manual Personalize/Page Inspection or refine active-card scoring before any value entry or save.',
  };

  await writeJson('FIXEDASSETS-024-result.json', result);
  await writeMarkdown('FIXEDASSETS-024-FA-CNC-01-ACTIVE-CARD-CONTROL-DIAGNOSIS.md', renderMarkdown({ status, activeControlProof, targetNotSaved, diagnosis }));
  await writeMarkdown(
    'README.md',
    `# fixedassets-024 Evidence

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| \`FIXEDASSETS-024-result.json\` | JSON | Ergebnis der aktiven Kartencontrol-Diagnose | keine gespeicherte Anlage, keine Buchung | ${status} |
| \`030-active-card-control-diagnosis.json\` | JSON | welche Feldcaptions aktive Kartencontrols statt Hintergrundliste treffen | keine Zielwerte \`HGB\` oder \`MACHINES\` | technical-diagnosis |
| \`020-active-card-context.txt\` | UI-Text | sichtbarer Kartenkontext nach Show More | keine Werte-/Lookup-Auswahl | labor-context |
| \`090-target-filter-after-run.txt\` | UI-Text | Nachlauf-Filter auf \`${target.fixedAssetNo}\` | keine API-Pruefung | no-save-check |
| \`fixedassets-024-020-active-card-control-diagnosis.screenshot.json\` | Screenshot-Metadaten | Zweck und Grenzen des Diagnosebilds | kein finales Buchbild | candidate |

Naechster Schritt: ${result.nextStep}
`,
  );

  expect(targetNotSaved, `${target.fixedAssetNo} darf in diesem Lauf nicht gespeichert werden`).toBeTruthy();
});
