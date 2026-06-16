import { test, expect, type Page, type Frame } from '@playwright/test';
import 'dotenv/config';
import { mkdir, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(300_000);

const testId = 'fixedassets-022';
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

type LookupProbe = {
  key: string;
  label: string;
  fieldPattern: string;
  expectedValues: string[];
  screenshotSlug: string;
};

type LookupResult = {
  key: string;
  label: string;
  fieldFound: boolean;
  fieldHint: null | {
    tagName: string;
    ariaLabel: string;
    title: string;
    placeholder: string;
    text: string;
    nearbyText: string;
  };
  openMethod: 'nearby-button' | 'alt-arrow-down' | 'not-opened';
  lookupOpened: boolean;
  expectedValuesVisible: string[];
  evidenceTextPath: string;
  screenshotPath: string | null;
  screenshotStatus: 'candidate' | 'rejected' | 'not-created';
  notes: string[];
};

const lookupProbes: LookupProbe[] = [
  {
    key: 'fa-class-code',
    label: 'FA Class Code',
    fieldPattern: 'FA\\s*Class|Anlagenklasse|Fixed\\s*Asset\\s*Class|Class\\s*Code',
    expectedValues: ['TANGIBLE', 'FINANCIAL', 'INTANGIBLE'],
    screenshotSlug: '030-fa-class-code-lookup',
  },
  {
    key: 'fa-subclass-code',
    label: 'FA Subclass Code',
    fieldPattern: 'FA\\s*Subclass|Anlagenunterklasse|Fixed\\s*Asset\\s*Subclass|Subclass\\s*Code',
    expectedValues: ['EQUIPMENT', 'MACHINERY', 'VEHICLE', 'FURNITURE', 'COMPUTER'],
    screenshotSlug: '040-fa-subclass-code-lookup',
  },
  {
    key: 'depreciation-book-code',
    label: 'Depreciation Book Code',
    fieldPattern: 'Depreciation\\s*Book|AfA-Buch|Abschreibungsbuch',
    expectedValues: ['HGB', 'COMPANY'],
    screenshotSlug: '050-depreciation-book-code-lookup',
  },
  {
    key: 'fa-posting-group',
    label: 'FA Posting Group',
    fieldPattern: 'FA\\s*Posting\\s*Group|Anlagenbuchungsgruppe|Posting\\s*Group',
    expectedValues: ['MACHINES', 'EQUIPMENT', 'VEHICLES', 'FURNITURE'],
    screenshotSlug: '060-fa-posting-group-lookup',
  },
];

function fixedAssetsEvidencePath(fileName: string): string {
  return path.join(evidenceDir, fileName);
}

async function writeJson(fileName: string, value: unknown) {
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(fixedAssetsEvidencePath(fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeMarkdown(fileName: string, value: string) {
  await mkdir(evidenceDir, { recursive: true });
  const cleanValue = fileName.endsWith('.txt') ? sanitizePageEvidenceText(value) : value;
  await writeFile(fixedAssetsEvidencePath(fileName), cleanValue, 'utf8');
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
    .join('\n')
    .trimEnd()
    .concat('\n');
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
  const url = new URL(bcPageUrl(5601, project.envPrefix));

  if (!filterToTarget) {
    return url.toString();
  }

  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${target.fixedAssetNo}'`);
  return url.toString();
}

async function openFixedAssets(page: Page, filterToTarget = false) {
  await page.goto(fixedAssetsUrl(filterToTarget), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2_000);
}

async function assertRmDemoContext(page: Page) {
  const body = await pageText(page);
  const issues: string[] = [];

  const url = decodeURIComponent(page.url());

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
  const frames = page.frames();
  for (const frame of frames) {
    const text = await frame
      .locator('body')
      .innerText({ timeout: 2_000 })
      .catch(() => '');
    if (/Fixed Asset|Anlage|No\.|Description/i.test(text)) {
      return frame;
    }
  }

  return page.mainFrame();
}

async function clickScopedNew(page: Page) {
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
      .filter((candidate) => /\b(New|Neu)\b/i.test(candidate.name))
      .sort((a, b) => {
        const ay = Math.abs(a.y - 120);
        const by = Math.abs(b.y - 120);
        return ay - by || a.x - b.x;
      });

    const chosen = candidates[0];
    if (!chosen) {
      return {
        clicked: false,
        candidates: candidates.map(({ element, ...rest }) => rest),
      };
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

  await writeJson('010-new-action-candidates.json', actionResult);
  expect(actionResult.clicked, 'Scoped New action auf Fixed Assets muss verfuegbar sein').toBeTruthy();
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForTimeout(2_000);
  await dismissTours(page);
  await hideFactBoxPane(page);
}

async function clickShowMoreCandidates(page: Page) {
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
      .filter((candidate) => /show\s*more|mehr\s*anzeigen|weitere\s*anzeigen|show\s*fewer|weniger\s*anzeigen/i.test(candidate.name))
      .sort((a, b) => a.y - b.y || a.x - b.x);

    const chosen = candidates.find((candidate) => /show\s*more|mehr\s*anzeigen|weitere\s*anzeigen/i.test(candidate.name));
    if (!chosen) {
      return {
        clicked: false,
        candidates: candidates.map(({ element, ...rest }) => rest),
      };
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

  await writeJson('020-show-more-candidates.json', result);
  if (result.clicked) {
    await page.waitForTimeout(1_000);
  }

  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function visibleExpectedValues(text: string, expectedValues: string[]): string[] {
  return expectedValues.filter((value) => new RegExp(`\\b${escapeRegExp(value)}\\b`, 'i').test(text));
}

async function focusOrClickLookup(page: Page, probe: LookupProbe) {
  const frame = await findFixedAssetFrame(page);
  return frame.evaluate((args) => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const pattern = new RegExp(args.fieldPattern, 'i');
    const labelPattern = new RegExp(
      args.label
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('\\s*'),
      'i',
    );
    const controls = Array.from(document.querySelectorAll('input,textarea,select,[contenteditable="true"],[role="combobox"]'));

    const labelCandidates = Array.from(document.querySelectorAll<HTMLElement>('label,span,div,p'))
      .filter((element) => visible(element))
      .map((element) => {
        const text = normalize(element.innerText || element.textContent);
        const rect = element.getBoundingClientRect();
        return { element, text, rect };
      })
      .filter((candidate) => candidate.text.length > 0 && candidate.text.length <= 80)
      .filter((candidate) => labelPattern.test(candidate.text) || pattern.test(candidate.text))
      .sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x);

    const label = labelCandidates[0];
    if (!label) {
      return {
        fieldFound: false,
        fieldHint: null,
        clickedNearbyButton: false,
      };
    }

    const controlCandidates = controls
      .filter((element) => visible(element))
      .map((element) => {
        const ariaLabel = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const placeholder = normalize((element as HTMLInputElement).placeholder);
        const text = normalize(element.textContent);
        const rect = element.getBoundingClientRect();
        return {
          element,
          tagName: element.tagName,
          ariaLabel,
          title,
          placeholder,
          text,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      })
      .filter((candidate) => {
        const labelCenterY = label.rect.y + label.rect.height / 2;
        const candidateCenterY = candidate.rect.y + candidate.rect.height / 2;
        const sameRow = Math.abs(candidateCenterY - labelCenterY) <= 20;
        const toRight = candidate.rect.x > label.rect.x + label.rect.width - 10;
        const notTooFar = candidate.rect.x < label.rect.x + 700;
        return sameRow && toRight && notTooFar;
      })
      .sort((a, b) => a.rect.x - b.rect.x);

    const chosen = controlCandidates[0];
    if (!chosen) {
      return {
        fieldFound: false,
        fieldHint: null,
        clickedNearbyButton: false,
      };
    }

    const buttons = Array.from(document.querySelectorAll('button,[role="button"],a'))
      .filter((element) => visible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const name = [
          normalize(element.getAttribute('aria-label')),
          normalize(element.getAttribute('title')),
          normalize(element.textContent),
        ]
          .filter(Boolean)
          .join(' | ');
        return { element, rect, name };
      });

    const sameRowButtons = buttons
      .filter((button) => {
        const yOverlap =
          button.rect.y < chosen.rect.y + chosen.rect.height + 10 && button.rect.y + button.rect.height > chosen.rect.y - 10;
        const closeToRight = button.rect.x >= chosen.rect.x + chosen.rect.width - 15 && button.rect.x <= chosen.rect.x + chosen.rect.width + 90;
        return yOverlap && closeToRight;
      })
      .sort((a, b) => a.rect.x - b.rect.x);

    const lookupButton =
      sameRowButtons.find((button) => /lookup|select|open|dropdown|drill|assist|auswaehlen|oeffnen|nachschlagen/i.test(button.name)) ||
      sameRowButtons[0];

    (chosen.element as HTMLElement).focus();
    (chosen.element as HTMLElement).click();

    if (lookupButton) {
      (lookupButton.element as HTMLElement).click();
    }

    return {
      fieldFound: true,
      fieldHint: {
        tagName: chosen.tagName,
        ariaLabel: chosen.ariaLabel,
        title: chosen.title,
        placeholder: chosen.placeholder,
        text: chosen.text,
        nearbyText: `${label.text} -> row control at ${Math.round(chosen.rect.x)},${Math.round(chosen.rect.y)}`,
      },
      clickedNearbyButton: Boolean(lookupButton),
      nearbyButtonName: lookupButton?.name || null,
    };
  }, { fieldPattern: probe.fieldPattern, label: probe.label });
}

async function probeLookup(page: Page, probe: LookupProbe): Promise<LookupResult> {
  const notes: string[] = [];
  const baseline = await pageText(page);
  const focusResult = await focusOrClickLookup(page, probe);
  let openMethod: LookupResult['openMethod'] = focusResult.clickedNearbyButton ? 'nearby-button' : 'not-opened';

  if (!focusResult.fieldFound) {
    const evidenceTextPath = fixedAssetsEvidencePath(`${probe.screenshotSlug}-not-found.txt`);
    await writeFile(evidenceTextPath, await compactPageText(page, { maxLines: 80 }), 'utf8');
    return {
      key: probe.key,
      label: probe.label,
      fieldFound: false,
      fieldHint: null,
      openMethod,
      lookupOpened: false,
      expectedValuesVisible: [],
      evidenceTextPath,
      screenshotPath: null,
      screenshotStatus: 'not-created',
      notes: ['Feld/Control wurde auf der leeren Anlagenkarte nicht sicher gefunden.'],
    };
  }

  await page.waitForTimeout(1_200);
  let afterOpen = await pageText(page);
  let visibleValues = visibleExpectedValues(afterOpen, probe.expectedValues);
  let lookupOpened = visibleValues.length > 0 || afterOpen.length > baseline.length + 200;

  if (!lookupOpened) {
    await page.keyboard.press('Alt+ArrowDown').catch(() => undefined);
    openMethod = 'alt-arrow-down';
    await page.waitForTimeout(1_200);
    afterOpen = await pageText(page);
    visibleValues = visibleExpectedValues(afterOpen, probe.expectedValues);
    lookupOpened = visibleValues.length > 0 || afterOpen.length > baseline.length + 200;
  }

  if (!lookupOpened) {
    notes.push('Lookup liess sich UI-seitig nicht eindeutig oeffnen; Screenshot wird als rejected/nicht beweisend behandelt.');
  }

  if (visibleValues.length === 0) {
    notes.push(`Keine erwarteten Werte sichtbar: ${probe.expectedValues.join(', ')}`);
  }

  const textFileName = `${probe.screenshotSlug}.txt`;
  const evidenceTextPath = fixedAssetsEvidencePath(textFileName);
  await writeFile(evidenceTextPath, await compactPageText(page, { maxLines: 140 }), 'utf8');

  let screenshotPath: string | null = null;
  let screenshotStatus: LookupResult['screenshotStatus'] = 'not-created';

  if (lookupOpened || focusResult.fieldFound) {
    screenshotStatus = visibleValues.length > 0 ? 'candidate' : 'rejected';
    const fileName = `${testId}-${probe.screenshotSlug}.png`;
    screenshotPath = path.resolve(projectRoot, 'img', fileName);
    await screenshot(page, fileName, {
      projectName: project.name,
      testId,
      status: screenshotStatus,
      bookUse: visibleValues.length > 0 ? 'field-proof' : 'do-not-use',
      purpose:
        visibleValues.length > 0
          ? `Shows selectable lookup values for ${probe.label}: ${visibleValues.join(', ')}.`
          : `Lookup/context for ${probe.label}; target values are not visibly proven in this image.`,
      expectedPageText:
        visibleValues.length > 0
          ? visibleValues.map((value) => new RegExp(escapeRegExp(value), 'i'))
          : [/Fixed Asset|Anlage|Depreciation|Posting|Book|Class|Subclass/i],
      knownLimitations: [
        'CRONUS-USA-Labor in RM-DEMO; kein deutscher Anlagen-Finalnachweis.',
        'Screenshot gilt nur als Wertnachweis, wenn der relevante Code im Bild sichtbar ist.',
        'Keine Anlage, keine Anschaffung, keine AfA und keine Buchung.',
      ],
    });
  }

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  return {
    key: probe.key,
    label: probe.label,
    fieldFound: focusResult.fieldFound,
    fieldHint: focusResult.fieldHint,
    openMethod,
    lookupOpened,
    expectedValuesVisible: visibleValues,
    evidenceTextPath,
    screenshotPath,
    screenshotStatus,
    notes,
  };
}

function renderMarkdown(result: {
  generatedAt: string;
  lookupResults: LookupResult[];
  targetNotSaved: boolean;
  status: string;
  nextStep: string;
}) {
  const rows = result.lookupResults
    .map((item) => {
      const values = item.expectedValuesVisible.length > 0 ? item.expectedValuesVisible.join(', ') : '-';
      const status = item.expectedValuesVisible.length > 0 ? 'Labor-Candidate' : item.fieldFound ? 'nicht beweisend' : 'nicht gefunden';
      return `| ${item.label} | ${item.fieldFound ? 'ja' : 'nein'} | ${item.lookupOpened ? 'ja' : 'nein'} | ${values} | ${status} |`;
    })
    .join('\n');

  return `# FIXEDASSETS-022 - FA-CNC-01 Lookup Value Preflight

Status: ${result.status}

## Zweck

Dieser Lauf prueft UI-first, ob die fuer den spaeteren Anlagenstamm \`${target.fixedAssetNo}\` relevanten Lookup-Werte auf einer neuen, leeren Anlagenkarte sichtbar oder auswaehlbar sind. Es wurde nichts gespeichert und nichts gebucht.

## Kontext

- Instanz: \`${target.environment}\`
- Company: \`${target.company}\`
- Zielanlage: \`${target.fixedAssetNo}\`
- Zielbeschreibung: \`${target.description}\`
- Erwarteter Depreciation Book Code: \`${target.depreciationBook}\`
- Erwartete FA Posting Group: \`${target.faPostingGroup}\`
- Status: CRONUS-USA-Labor, kein deutscher Anlagen-Finalnachweis

## Ergebnis

| Feld | Feld gefunden | Lookup geoeffnet | sichtbare Ziel-/Referenzwerte | Status |
|---|---:|---:|---|---|
${rows}

## Nicht gespeichert

- Neue Anlagenkarte wurde nur fuer Lookup-Pruefung geoeffnet.
- \`${target.fixedAssetNo}\` wurde nach dem Lauf nicht als gespeicherter Anlagenstamm nachgewiesen.
- Es gab keine Anschaffung, keine Abschreibung, keine Anlagenposten und keine Sachposten.

## Buchwirkung

Fuer die Klickanleitung ist dieser Lauf ein Preflight: Bevor ein Anfaenger eine Anlage speichert, muss klar sein, welche Pflicht-/Setupwerte aus Lookups kommen und ob sie im Mandanten wirklich verfuegbar sind. Screenshots duerfen nur als Wertnachweis verwendet werden, wenn der relevante Code im Bild sichtbar ist.

## Offene Grenze

- Laborbefund in \`${target.company}\`; kein DE-Finalnachweis.
- Falls FA Class/Subclass nicht sichtbar belegt sind, darf daraus noch keine finale Stammdatenvorgabe entstehen.

## Naechster Schritt

${result.nextStep}
`;
}

test('FIXEDASSETS-022 probes FA-CNC-01 lookup values on an unsaved card', async ({ page }) => {
  await prepareRunArtifacts();

  await openFixedAssets(page);
  await assertRmDemoContext(page);

  const listText = await compactPageText(page, { maxLines: 100 });
  await writeMarkdown('000-fixed-assets-list-context.txt', listText);

  await clickScopedNew(page);
  await assertRmDemoContext(page);
  await clickShowMoreCandidates(page);

  await writeMarkdown('020-empty-card-context.txt', await compactPageText(page, { maxLines: 140 }));
  await screenshot(page, `${testId}-020-empty-card-context.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'evidence',
    purpose: 'Context screenshot only: empty fixed asset card in RM-DEMO before lookup probes; no values saved.',
    expectedPageText: [/Fixed Asset|Anlage/i],
    knownLimitations: [
      'Leere Anlagenkarte nur als Preflight-Kontext.',
      'Kein Wertnachweis fuer HGB oder MACHINES, solange die Codes nicht sichtbar sind.',
      'Keine Anlage, keine Anschaffung, keine AfA und keine Buchung.',
    ],
  });

  const lookupResults: LookupResult[] = [];
  for (const probe of lookupProbes) {
    lookupResults.push(await probeLookup(page, probe));
  }

  await openFixedAssets(page, true);
  await assertRmDemoContext(page);
  const filteredText = await pageText(page);
  const targetNotSaved = !new RegExp(`\\b${escapeRegExp(target.fixedAssetNo)}\\b`, 'i').test(filteredText);
  await writeMarkdown('090-target-filter-after-run.txt', await compactPageText(page, { maxLines: 100 }));

  const hgbVisible = lookupResults.some((item) => item.expectedValuesVisible.includes(target.depreciationBook));
  const machinesVisible = lookupResults.some((item) => item.expectedValuesVisible.includes(target.faPostingGroup));
  const classOrSubclassVisible = lookupResults.some(
    (item) => ['fa-class-code', 'fa-subclass-code'].includes(item.key) && item.expectedValuesVisible.length > 0,
  );

  const status =
    hgbVisible && machinesVisible && classOrSubclassVisible && targetNotSaved
      ? 'labor-preflight-fit-no-save'
      : targetNotSaved
        ? 'labor-preflight-partial-no-save'
        : 'blocked-target-was-saved-unexpectedly';

  const nextStep =
    hgbVisible && machinesVisible && targetNotSaved
      ? 'FIXEDASSETS-023: save-gate decision for FA-CNC-01 with explicit FA Class/Subclass handling before any acquisition.'
      : 'FIXEDASSETS-023: resolve missing lookup visibility before saving FA-CNC-01.';

  const result = {
    testId,
    generatedAt: new Date().toISOString(),
    mode: 'ui-first-read-only-lookup-preflight',
    instance: target.environment,
    company: target.company,
    target,
    status,
    noSaveNoPosting: true,
    targetNotSaved,
    lookupResults,
    summary: {
      hgbVisible,
      machinesVisible,
      classOrSubclassVisible,
      screenshotsAreValueProofOnlyWhenCodesVisible: true,
    },
    hardBoundaries: [
      'No Fixed Asset was saved.',
      'No acquisition was posted.',
      'No depreciation was posted.',
      'No German final asset accounting proof was claimed.',
    ],
    nextStep,
  };

  await writeJson('FIXEDASSETS-022-result.json', result);
  await writeMarkdown('FIXEDASSETS-022-FA-CNC-01-LOOKUP-VALUE-PREFLIGHT.md', renderMarkdown(result));
  await writeMarkdown(
    'README.md',
    `# fixedassets-022 Evidence

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| \`FIXEDASSETS-022-result.json\` | JSON | UI-first Lookup-Preflight und No-Save-Status | keinen deutschen Finalnachweis | ${status} |
| \`FIXEDASSETS-022-FA-CNC-01-LOOKUP-VALUE-PREFLIGHT.md\` | Markdown | fachliche Zusammenfassung fuer Buch/State | keine Buchung | labor |
| \`020-empty-card-context.txt\` | UI-Text | leere Anlagenkarte vor Lookup-Probe | keine Lookup-Werte | context |
| \`030-060-*.txt\` | UI-Text | jeweiliger Lookup-/Kontexttext | nur sichtbare Codes gelten als Wertnachweis | mixed |
| \`090-target-filter-after-run.txt\` | UI-Text | Nachlauf-Filter auf \`${target.fixedAssetNo}\` | keine API-Pruefung | no-save-check |
`,
  );

  expect(targetNotSaved, `${target.fixedAssetNo} darf in diesem Preflight nicht gespeichert werden`).toBeTruthy();
});
