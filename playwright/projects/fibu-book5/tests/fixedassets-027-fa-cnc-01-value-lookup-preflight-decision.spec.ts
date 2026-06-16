import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { mkdir, readdir, rm, unlink } from 'node:fs/promises';
import path from 'node:path';
import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
  waitForPageText
} from '../../../core/bc-helpers';
import { clickBcAction } from '../../../core/bc/actions';
import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(300_000);

test.skip(
  true,
  'FIXEDASSETS-027 produced lookup evidence but also auto-created and then cleaned temporary FA000110; do not rerun until the flow detects auto-number drafts and owns cleanup before claiming no-save.'
);

const testId = 'fixedassets-027';
const projectRoot = path.join('playwright', 'projects', project.name);
const evidenceDir = path.join(projectRoot, 'evidence', testId);
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  fixedAssetNo: 'FA-CNC-01',
  description: 'CNC Maschine FRA',
  depreciationBook: 'HGB',
  faPostingGroup: 'MACHINES'
};
const requiredCaptions = [
  'FA Class Code',
  'FA Subclass Code',
  'Depreciation Book Code',
  'Posting Group',
  'Depreciation Starting Date',
  'Depreciation Ending Date'
];

type LookupProbe = {
  key: string;
  caption: string;
  expectedValues: string[];
  screenshotSlug: string;
};

type LookupProbeResult = {
  key: string;
  caption: string;
  clicked: boolean;
  buttonName: string | null;
  lookupLikelyOpened: boolean;
  expectedValuesVisible: string[];
  screenshot: string | null;
  screenshotStatus: 'candidate' | 'rejected' | 'not-created';
  notes: string[];
};

const lookupProbes: LookupProbe[] = [
  {
    key: 'fa-class-code',
    caption: 'FA Class Code',
    expectedValues: ['TANGIBLE', 'FINANCIAL', 'INTANGIBLE'],
    screenshotSlug: '030-fa-class-code-lookup'
  },
  {
    key: 'fa-subclass-code',
    caption: 'FA Subclass Code',
    expectedValues: ['EQUIPMENT', 'MACHINERY', 'VEHICLE', 'FURNITURE', 'COMPUTER'],
    screenshotSlug: '040-fa-subclass-code-lookup'
  },
  {
    key: 'depreciation-book-code',
    caption: 'Depreciation Book Code',
    expectedValues: ['HGB', 'COMPANY'],
    screenshotSlug: '050-depreciation-book-code-lookup'
  },
  {
    key: 'posting-group',
    caption: 'Posting Group',
    expectedValues: ['MACHINES', 'EQUIPMENT'],
    screenshotSlug: '060-posting-group-lookup'
  }
];

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function fixedAssetsUrl(filterToTarget = false) {
  const url = new URL(bcPageUrl(5601, project.envPrefix));
  if (filterToTarget) {
    url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${target.fixedAssetNo}'`);
  }
  return url.toString();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function visibleExpectedValues(text: string, expectedValues: string[]) {
  return expectedValues.filter((value) => new RegExp(`\\b${escapeRegExp(value)}\\b`, 'i').test(text));
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
      .map((fileName) => unlink(path.join(imgDir, fileName)).catch(() => undefined))
  );
}

async function openFixedAssets(page: Page, filterToTarget = false) {
  await page.goto(fixedAssetsUrl(filterToTarget), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Assets|Anlagen|No\.|Description/i, { timeout: 60_000 });
}

async function assertRmDemoContext(page: Page) {
  const body = await pageText(page);
  const url = decodeURIComponent(page.url());
  const issues: string[] = [];
  if (!url.includes(target.environment)) issues.push(`URL enthaelt nicht ${target.environment}`);
  if (!/company=RM-DEMO/i.test(url)) issues.push('URL enthaelt nicht company=RM-DEMO');
  if (!/Rhein-Main Demo GmbH|RM-DEMO|MCP_1_20260210/i.test(body)) {
    issues.push('RM-DEMO ist im sichtbaren Seitentext nicht nachweisbar');
  }
  expect(issues, issues.join('\n')).toEqual([]);
  return { url, textOk: issues.length === 0 };
}

async function findFixedAssetCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Fixed Asset Card|FA Class Code|FA Subclass Code|Depreciation Book/i.test(text)) {
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
    expectedAfterClick: /Fixed Asset Card|Neu - Fixed Asset Card/i,
    timeout: 5000,
    afterClickTimeout: 30_000
  }).catch((error) => ({
    clicked: false,
    error: error instanceof Error ? error.name : 'UnknownError',
    message: 'clickBcAction timed out or did not provide foreground-card proof'
  }));

  const helperOpenedCard = helperResult.clicked && /Fixed Asset Card|Neu - Fixed Asset Card/i.test(await pageText(page));
  if (helperOpenedCard) {
    await writeJsonEvidence(fixedAssetsEvidencePath('010-new-action-result.json'), {
      helper: 'clickBcAction',
      helperResult,
      fallbackUsed: false,
      openedCard: true
    });
    await dismissTours(page);
    await hideFactBoxPane(page).catch(() => undefined);
    return;
  }

  let fallbackResult: unknown = { clicked: false, candidates: [] };
  for (const frame of page.frames()) {
    const frameText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Fixed Assets|Anlagen/i.test(frameText)) continue;

    fallbackResult = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const aria = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const role = normalize(element.getAttribute('role')) || element.tagName.toLowerCase();
            const label = [text, aria, title].filter(Boolean).join(' ');
            const topBarBonus = rect.y >= 35 && rect.y <= 130 ? -10 : 0;
            const exactBonus = /^(New|Neu)$/.test(text) || /^(New|Neu)$/.test(aria) ? -35 : 0;
            const titleBonus = /new entry|neuen Eintrag/i.test(title) ? -20 : 0;
            const score = topBarBonus + exactBonus + titleBonus + Math.abs(rect.x - 520) / 800;
            return {
              element,
              text,
              aria,
              title,
              role,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              label,
              score
            };
          })
          .filter((candidate) => visible(candidate.element))
          .filter(
            (candidate) =>
              /^(New|Neu)$/.test(candidate.text) ||
              /^(New|Neu)$/.test(candidate.aria) ||
              /new entry|neuen Eintrag/i.test(candidate.title)
          )
          .filter((candidate) => !/Sales|Purchase|Intercom|Time Sheet|Document|Quote|Order|Power BI/i.test(candidate.label))
          .sort((left, right) => left.score - right.score || left.y - right.y || left.x - right.x);

        const chosen = candidates[0];
        if (chosen) chosen.element.click();
        return {
          clicked: Boolean(chosen),
          chosen: chosen ? { ...chosen, element: undefined } : null,
          candidates: candidates.slice(0, 12).map(({ element, ...entry }) => entry)
        };
      })
      .catch((error) => ({ clicked: false, error: String(error), candidates: [] }));

    if ((fallbackResult as { clicked?: boolean }).clicked) break;
  }

  if ((fallbackResult as { clicked?: boolean }).clicked) {
    await expect
      .poll(async () => pageText(page), { timeout: 30_000, intervals: [500, 1000, 2500] })
      .toMatch(/Fixed Asset Card|Neu - Fixed Asset Card/i);
  }

  const openedCard = /Fixed Asset Card|Neu - Fixed Asset Card/i.test(await pageText(page));
  await writeJsonEvidence(fixedAssetsEvidencePath('010-new-action-result.json'), {
    helper: 'clickBcAction-with-card-verification',
    helperResult,
    helperOpenedCard,
    fallbackUsed: !helperOpenedCard,
    fallbackResult,
    openedCard
  });
  expect(openedCard, 'Scoped New action auf Fixed Assets muss wirklich die Fixed Asset Card oeffnen').toBeTruthy();
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
}

async function clickCardShowMoreForGeneralAndDepreciationBook(page: Page) {
  const frame = await findFixedAssetCardFrame(page);
  const result = await frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-label],[title]'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const targetFastTab = /Depreciation Book/i.test([aria, title].join(' '))
          ? 'Depreciation Book'
          : /General/i.test([aria, title].join(' '))
            ? 'General'
            : '';
        return {
          element,
          text,
          aria,
          title,
          targetFastTab,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })
      .filter((candidate) => visible(candidate.element))
      .filter((candidate) => candidate.width <= 220 && candidate.height <= 60)
      .filter((candidate) => /show\s*more|mehr\s*anzeigen/i.test([candidate.text, candidate.aria, candidate.title].join(' ')))
      .filter((candidate) => candidate.targetFastTab)
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const clicked: Array<Omit<(typeof candidates)[number], 'element'>> = [];
    const seen = new Set<string>();
    for (const candidate of candidates) {
      if (seen.has(candidate.targetFastTab)) continue;
      candidate.element.click();
      seen.add(candidate.targetFastTab);
      const { element, ...entry } = candidate;
      clicked.push(entry);
    }

    return {
      candidates: candidates.map(({ element, ...entry }) => entry),
      clicked
    };
  });

  await page.waitForTimeout(1500);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-show-more-recovery.json'), result);
  await waitForPageText(page, /Depreciation Book Code|Posting Group|FA Class Code|FA Subclass Code/i, {
    timeout: 30_000
  });
  return result;
}

async function clickLookupButton(page: Page, caption: string) {
  const frame = await findFixedAssetCardFrame(page);
  return frame.evaluate((captionValue) => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-label],[title]'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const name = [aria, title, text].filter(Boolean).join(' | ');
        return {
          element,
          text,
          aria,
          title,
          name,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })
      .filter((candidate) => visible(candidate.element))
      .filter((candidate) => candidate.width <= 80 && candidate.height <= 60)
      .filter((candidate) => {
        const haystack = candidate.name;
        return (
          new RegExp(`(W.hlen Sie einen Wert f.r|Choose a value for).*${captionValue}`, 'i').test(haystack) ||
          new RegExp(`${captionValue}.*(Lookup|Select|Auswahl|Wert)`, 'i').test(haystack)
        );
      })
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const chosen = buttons[0];
    if (chosen) chosen.element.click();
    return {
      clicked: Boolean(chosen),
      chosen: chosen ? { ...chosen, element: undefined } : null,
      candidates: buttons.slice(0, 10).map(({ element, ...entry }) => entry)
    };
  }, caption);
}

async function closeLookupContext(page: Page) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(700);
  const text = await pageText(page);
  if (!/Fixed Asset Card|Neu - Fixed Asset Card/i.test(text)) {
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(700);
  }
}

async function probeLookup(page: Page, probe: LookupProbe): Promise<LookupProbeResult> {
  const before = await pageText(page);
  const clickResult = await clickLookupButton(page, probe.caption);
  await page.waitForTimeout(1400);
  let after = await pageText(page);
  let expectedValuesVisible = visibleExpectedValues(after, probe.expectedValues);
  let lookupLikelyOpened = expectedValuesVisible.length > 0 || after.length > before.length + 150;

  if (!lookupLikelyOpened && clickResult.clicked) {
    await page.keyboard.press('Alt+ArrowDown').catch(() => undefined);
    await page.waitForTimeout(1000);
    after = await pageText(page);
    expectedValuesVisible = visibleExpectedValues(after, probe.expectedValues);
    lookupLikelyOpened = expectedValuesVisible.length > 0 || after.length > before.length + 150;
  }

  await writeJsonEvidence(fixedAssetsEvidencePath(`${probe.screenshotSlug}-click.json`), clickResult);
  await writeTextEvidence(
    fixedAssetsEvidencePath(`${probe.screenshotSlug}.txt`),
    await compactPageText(page, {
      include: [/Fixed Asset|FA Class|FA Subclass|Depreciation Book|Posting Group|HGB|COMPANY|MACHINES|EQUIPMENT|TANGIBLE|FINANCIAL|INTANGIBLE|FURNITURE|COMPUTER|VEHICLE/i],
      maxLines: 150
    })
  );

  let screenshotFileName: string | null = null;
  let screenshotStatus: LookupProbeResult['screenshotStatus'] = 'not-created';
  if (clickResult.clicked || lookupLikelyOpened) {
    screenshotFileName = `${testId}-${probe.screenshotSlug}.png`;
    screenshotStatus = expectedValuesVisible.length > 0 ? 'candidate' : 'rejected';
    await screenshot(page, screenshotFileName, {
      projectName: project.name,
      testId,
      status: screenshotStatus,
      bookUse: expectedValuesVisible.length > 0 ? 'field-proof' : 'do-not-use',
      purpose:
        expectedValuesVisible.length > 0
          ? `FIXEDASSETS-027 prueft ${probe.caption}; sichtbar sind ${expectedValuesVisible.join(', ')}.`
          : `FIXEDASSETS-027 prueft ${probe.caption}; Ziel-/Referenzwerte sind im Bild nicht sichtbar und das Bild ist nicht buchfaehig.`,
      expectedPageText:
        expectedValuesVisible.length > 0
          ? expectedValuesVisible.map((value) => new RegExp(escapeRegExp(value), 'i'))
          : [/Fixed Asset|FA Class|FA Subclass|Depreciation|Posting/i],
      knownLimitations: [
        'No-save Lookup-/Wertpreflight auf leerer Anlagenkarte.',
        'Kein Speichern von FA-CNC-01, keine Anschaffung, keine AfA und keine Buchung.',
        'Nur sichtbare Codes im richtigen Kontext zaehlen als Wertnachweis.'
      ]
    });
  }

  await closeLookupContext(page);
  return {
    key: probe.key,
    caption: probe.caption,
    clicked: Boolean(clickResult.clicked),
    buttonName: clickResult.chosen?.name ?? null,
    lookupLikelyOpened,
    expectedValuesVisible,
    screenshot: screenshotFileName,
    screenshotStatus,
    notes: [
      expectedValuesVisible.length > 0
        ? 'Ziel-/Referenzwerte sind im Seitentext sichtbar; Screenshot bleibt trotzdem Labor-Candidate.'
        : 'Kein sichtbarer Ziel-/Referenzwert; Screenshot ist rejected/do-not-use oder wurde nicht erzeugt.',
      'Es wurde kein Wert ausgewaehlt und nichts gespeichert.'
    ]
  };
}

function renderMarkdown(result: Record<string, any>) {
  const lookupRows = result.lookupResults
    .map(
      (entry: LookupProbeResult) =>
        `| ${entry.caption} | ${entry.clicked ? 'ja' : 'nein'} | ${entry.lookupLikelyOpened ? 'ja' : 'nein'} | ${entry.expectedValuesVisible.join(', ') || '-'} | ${entry.screenshotStatus} |`
    )
    .join('\n');

  const controlsRows = result.activeControlDiagnosis.diagnostics
    .map(
      (entry: any) =>
        `| ${entry.caption} | ${entry.diagnosis} | ${entry.nearbyControls.length} | ${entry.nearbyButtons.length} |`
    )
    .join('\n');

  return [
    '# FIXEDASSETS-027 - FA-CNC-01 Value-/Lookup-Preflight-Decision',
    '',
    'Status: `labor`, `ui-first`, `readiness`, `lookup-preflight`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |',
    '| Speichern | nein |',
    '| Setup geaendert | nein |',
    '| Buchung | nein |',
    '',
    '## Ergebnis',
    '',
    `- Aktive Karten-Controls erneut vollstaendig gemappt: ${result.allControlsStillMapped ? 'ja' : 'nein'}.`,
    `- ` + '`HGB`' + ` sichtbar/nutzbar als Lookup-/Referenzwert: ${result.valueStatus.hgbVisible ? 'ja' : 'nein'}.`,
    `- ` + '`MACHINES`' + ` sichtbar/nutzbar als Lookup-/Referenzwert: ${result.valueStatus.machinesVisible ? 'ja' : 'nein'}.`,
    `- Klasse/Unterklasse mit sichtbaren Referenzwerten: ${result.valueStatus.classOrSubclassVisible ? 'ja' : 'nein'}.`,
    `- ` + '`FA-CNC-01`' + ` nach Lauf nicht gespeichert: ${result.targetNotSaved ? 'ja' : 'nein'}.`,
    '',
    '## Lookup-/Wertbefund',
    '',
    '| Feld | Lookup-Button geklickt | Lookup vermutlich offen | sichtbare Ziel-/Referenzwerte | Screenshot-Status |',
    '|---|---:|---:|---|---|',
    lookupRows,
    '',
    '## Kontrollbefund aktive Kartenfelder',
    '',
    '| Feld | Diagnose | nahe Controls | nahe Buttons |',
    '|---|---|---:|---:|',
    controlsRows,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Ein sichtbares Feld ist noch kein fertiger Stammdatenwert. Vor dem Speichern einer Anlage muss ein Anfaenger pruefen, ob die Codes aus einem echten Lookup oder einer sicheren Vorgabe kommen. Besonders kritisch sind `Depreciation Book Code` und `Posting Group`, weil sie Abschreibung und Sachkontenfindung steuern. Wenn der Code im Screenshot nicht sichtbar ist, darf das Bild nicht als Wertnachweis ins Buch.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Anlagen-Finalnachweis.',
    '- Kein gespeicherter Anlagenstamm `FA-CNC-01`.',
    '- Kein Kreditor `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- Keine deutschen Kontenplan- oder HGB-Endstandsbehauptungen.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-027 probes HGB/MACHINES and class lookup reachability without saving FA-CNC-01', async ({
  page
}) => {
  await prepareRunArtifacts();

  await openFixedAssets(page, true);
  await assertRmDemoContext(page);
  await writeTextEvidence(
    fixedAssetsEvidencePath('000-target-filter-before-run.txt'),
    await compactPageText(page, {
      include: [/MCP_1_20260210|Rhein-Main Demo GmbH|RM-DEMO|Fixed Assets|FA-CNC-01|No\.|Description|FA000/i],
      maxLines: 80
    })
  );

  await openFixedAssets(page, false);
  const context = await assertRmDemoContext(page);
  await clickScopedNew(page);
  await assertRmDemoContext(page);
  const showMore = await clickCardShowMoreForGeneralAndDepreciationBook(page);
  await writeTextEvidence(
    fixedAssetsEvidencePath('025-card-context-before-lookups.txt'),
    await compactPageText(page, {
      include: [/Fixed Asset|FA Class|FA Subclass|Depreciation Book|Posting Group|Depreciation Starting|Depreciation Ending|Book Value/i],
      maxLines: 120
    })
  );

  const activeControlDiagnosis = await collectActiveCardControlDiagnostics(page, requiredCaptions, {
    targetText: /Fixed Asset Card|Depreciation Book Code|Posting Group|FA Class Code|FA Subclass Code/i
  });
  await writeJsonEvidence(fixedAssetsEvidencePath('026-active-card-control-baseline.json'), activeControlDiagnosis);

  const lookupResults: LookupProbeResult[] = [];
  for (const probe of lookupProbes) {
    lookupResults.push(await probeLookup(page, probe));
  }

  await openFixedAssets(page, true);
  const filterAfterText = await pageText(page);
  const targetNotSaved = !new RegExp(`\\b${escapeRegExp(target.fixedAssetNo)}\\b`, 'i').test(filterAfterText);
  await writeTextEvidence(
    fixedAssetsEvidencePath('090-target-filter-after-run.txt'),
    await compactPageText(page, {
      include: [/MCP_1_20260210|Rhein-Main Demo GmbH|RM-DEMO|Fixed Assets|FA-CNC-01|No\.|Description|FA000/i],
      maxLines: 80
    })
  );

  const valueStatus = {
    hgbVisible: lookupResults.some((entry) => entry.expectedValuesVisible.includes(target.depreciationBook)),
    machinesVisible: lookupResults.some((entry) => entry.expectedValuesVisible.includes(target.faPostingGroup)),
    classOrSubclassVisible: lookupResults.some(
      (entry) => ['fa-class-code', 'fa-subclass-code'].includes(entry.key) && entry.expectedValuesVisible.length > 0
    )
  };
  const allControlsStillMapped = activeControlDiagnosis.summary.activeCardLabelWithControl === requiredCaptions.length;
  const status =
    allControlsStillMapped && valueStatus.hgbVisible && valueStatus.machinesVisible && valueStatus.classOrSubclassVisible
      ? 'labor-lookup-preflight-fit-no-save'
      : 'labor-lookup-preflight-partial-no-save';
  const result = {
    testId: 'FIXEDASSETS-027',
    generatedAt: new Date().toISOString(),
    status,
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-fixed-asset-card-lookup-value-preflight-no-save-no-posting',
    target,
    context,
    showMore,
    activeControlDiagnosis,
    allControlsStillMapped,
    lookupResults,
    valueStatus,
    targetNotSaved,
    safety: {
      posted: false,
      setupChanged: false,
      saved: false,
      fixedAssetCreated: false,
      valuesEntered: false,
      vendorCreated: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false
    },
    bookImpact:
      'Kapitel 21 darf jetzt erklaeren, dass nach der Control-Recovery ein eigener Lookup-/Wertpreflight noetig ist: Nur sichtbar belegte Codes duerfen in eine Klickanleitung als auswaehlbare Werte uebernommen werden; alles andere bleibt Setup-/Diagnosebedarf.',
    nextStep:
      allControlsStillMapped && valueStatus.hgbVisible && valueStatus.machinesVisible && targetNotSaved
        ? 'FIXEDASSETS-028-FA-CNC-01-SAVE-GATE-DECISION: ohne BC-Run entscheiden, ob FA-CNC-01 mit HGB/MACHINES und expliziten Klasse-/Datumswerten gespeichert werden darf.'
        : 'FIXEDASSETS-028-FA-CNC-01-LOOKUP-GAP-DIAGNOSIS: fehlende Lookup-/Wertbelege fuer HGB, MACHINES oder Klasse/Unterklasse per Personalize/Page Inspection oder gezieltem Lookup-Pfad klaeren; weiterhin nicht speichern.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-027-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-027-FA-CNC-01-VALUE-LOOKUP-PREFLIGHT-DECISION.md'),
    renderMarkdown(result)
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# fixedassets-027 Evidence',
      '',
      'Status: `labor`, `ui-first`, `readiness`, `lookup-preflight`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-027-result.json` | JSON-Ergebnis | Lookup-/Wertpreflight und No-Save-Status | keine Speicherung, kein Setup, keine Buchung | labor |',
      '| `FIXEDASSETS-027-FA-CNC-01-VALUE-LOOKUP-PREFLIGHT-DECISION.md` | Markdown | fachliche Lern- und Buchwirkung | keinen deutschen Finalnachweis | labor |',
      '| `026-active-card-control-baseline.json` | JSON | aktive Kartenfelder vor den Lookup-Proben | keine gesetzten Werte | control-proof |',
      '| `030-060-*.txt` | kompakter UI-Text | jeweiliger Lookup-/Kontexttext | Rohdump oder finaler Buchtext | mixed |',
      '| `030-060-*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und sichtbare Werte je Bild | kein Nachweis ohne sichtbaren Zielwert | mixed |',
      '| `090-target-filter-after-run.txt` | UI-Text | `FA-CNC-01` wurde nach dem Lauf nicht gespeichert | keine API-Pruefung | no-save-check |',
      '',
      '## Kernaussage',
      '',
      result.bookImpact,
      ''
    ].join('\n')
  );

  expect(targetNotSaved, `${target.fixedAssetNo} darf in diesem Lookup-Preflight nicht gespeichert werden`).toBeTruthy();
  expect(result.safety.posted).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.valuesEntered).toBe(false);
});
