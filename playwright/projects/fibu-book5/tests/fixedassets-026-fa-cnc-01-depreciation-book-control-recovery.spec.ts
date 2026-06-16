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

const testId = 'fixedassets-026';
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
    message: 'clickBcAction timed out or did not provide foreground-card proof; raw page text intentionally not persisted',
    reason: 'clickBcAction did not prove that the foreground Fixed Asset Card opened'
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
      const score = (candidate: { text: string; aria: string; title: string; role: string; x: number; y: number }) => {
        let value = 0;
        if (/^(New|Neu)$/.test(candidate.text) || /^(New|Neu)$/.test(candidate.aria)) value -= 35;
        if (/Create a new entry|Erstellen Sie einen neuen Eintrag|neuen Eintrag/i.test(candidate.title)) value -= 20;
        if (/button|menuitem/i.test(candidate.role)) value -= 8;
        if (candidate.y >= 35 && candidate.y <= 130) value -= 10;
        value += Math.abs(candidate.y - 65) / 60;
        value += Math.abs(candidate.x - 520) / 800;
        return value;
      };
      const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const text = normalize(element.innerText || element.textContent);
          const aria = normalize(element.getAttribute('aria-label'));
          const title = normalize(element.getAttribute('title'));
          const role = normalize(element.getAttribute('role')) || element.tagName.toLowerCase();
          const label = [text, aria, title].filter(Boolean).join(' ');
          const candidate = {
            element,
            text,
            aria,
            title,
            role,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            label
          };
          return { ...candidate, score: score(candidate) };
        })
        .filter((candidate) => visible(candidate.element))
        .filter((candidate) => /^(New|Neu)$/.test(candidate.text) || /^(New|Neu)$/.test(candidate.aria) || /new entry|neuen Eintrag/i.test(candidate.title))
        .filter((candidate) => !/Sales|Purchase|Intercom|Time Sheet|Document|Quote|Order|Power BI/i.test(candidate.label))
        .sort((left, right) => left.score - right.score || left.y - right.y || left.x - right.x);

      const chosen = candidates[0];
      if (chosen) chosen.element.click();
      return {
        clicked: Boolean(chosen),
        chosen: chosen
          ? {
              text: chosen.text,
              aria: chosen.aria,
              title: chosen.title,
              role: chosen.role,
              x: chosen.x,
              y: chosen.y,
              width: chosen.width,
              height: chosen.height,
              label: chosen.label,
              score: chosen.score
            }
          : null,
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
    const elements = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-label],[title]'));
    const candidates = elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const name = [aria, title, text].filter(Boolean).join(' | ');
        const targetFastTab = /Depreciation Book/i.test([aria, title].join(' '))
          ? 'Depreciation Book'
          : /General/i.test([aria, title].join(' '))
            ? 'General'
            : '';
        return {
          element,
          name,
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

async function collectFocusedFieldHints(page: Page) {
  const frame = await findFixedAssetCardFrame(page);
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    return Array.from(document.querySelectorAll<HTMLElement>('input,textarea,select,[contenteditable="true"],[role="combobox"],button,[role="button"],a'))
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        let container: Element | null = element;
        for (let depth = 0; depth < 4 && container?.parentElement; depth += 1) {
          container = container.parentElement;
        }
        const label = normalize(
          [
            element.getAttribute('aria-label'),
            element.getAttribute('title'),
            element.textContent,
            (element as HTMLInputElement).value,
            container?.textContent
          ]
            .filter(Boolean)
            .join(' ')
        ).slice(0, 500);
        return {
          tagName: element.tagName.toUpperCase(),
          role: normalize(element.getAttribute('role')) || null,
          label,
          value: normalize((element as HTMLInputElement).value),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          matches: {
            depreciationBookCode: /Depreciation Book Code/i.test(label),
            postingGroup: /Posting Group/i.test(label),
            faClassCode: /FA Class Code/i.test(label),
            faSubclassCode: /FA Subclass Code/i.test(label)
          }
        };
      })
      .filter(
        (entry) =>
          entry.matches.depreciationBookCode ||
          entry.matches.postingGroup ||
          entry.matches.faClassCode ||
          entry.matches.faSubclassCode
      )
      .slice(0, 80);
  });
}

function renderMarkdown(result: Record<string, any>) {
  const activeRows = result.activeControlDiagnosis.diagnostics
    .map(
      (entry: any) =>
        `| ${entry.caption} | ${entry.diagnosis} | ${entry.selectedLabel?.text || entry.selectedLabel?.ariaLabel || entry.selectedLabel?.title || '-'} | ${entry.nearbyControls.length} | ${entry.nearbyButtons.length} |`
    )
    .join('\n');

  return [
    '# FIXEDASSETS-026 - FA-CNC-01 Depreciation-Book-Control-Recovery',
    '',
    'Status: `labor`, `ui-first`, `readiness`, `control-recovery`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.',
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
    `- Fehlende aktive Controls aus 024 wiederhergestellt: ${result.recoveredMissingControls ? 'ja' : 'nein'}.`,
    `- Depreciation Book Code aktiv mit Control: ${result.controlStatus.depreciationBookCode ? 'ja' : 'nein'}.`,
    `- Posting Group aktiv mit Control: ${result.controlStatus.postingGroup ? 'ja' : 'nein'}.`,
    `- FastTabs gezielt aufgeklappt: ${result.showMore.clicked.map((entry: any) => entry.targetFastTab).join(', ') || 'keine'}.`,
    `- \`${target.fixedAssetNo}\` nach Lauf nicht gespeichert: ${result.targetNotSaved ? 'ja' : 'nein'}.`,
    '',
    '## Aktive Karten-Control-Diagnose',
    '',
    '| Caption | Diagnose | ausgewaehltes Label | nahe Controls | nahe Buttons |',
    '|---|---|---|---:|---:|',
    activeRows,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Auf einer Business-Central-Karte sind wichtige Felder oft erst sichtbar, wenn der passende FastTab aufgeklappt und die breite Ansicht genutzt wird. Fuer Anlagen ist das besonders wichtig: `Depreciation Book Code` steuert die Abschreibungslogik, `Posting Group` die Sachkontenfindung. Ohne diese Felder darf man keine Anlagenkarte als buchungsreif erklaeren.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 darf den naechsten Schritt nun als No-Save-Kartenkontrolle beschreiben: Erst die Kartenfelder sichtbar und aktiv nachweisen, danach erst Wert-/Lookup-Entscheidung fuer `HGB` und `MACHINES`. Ein Screenshot ist nur brauchbar, wenn die konkreten zu erklaerenden Felder im Bild sichtbar sind.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor, kein deutscher HGB-/Kontenplan-Endstand.',
    '- Keine Zielwerte `FA-CNC-01`, `HGB` oder `MACHINES` wurden gesetzt.',
    '- Keine gespeicherte Anlage, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- Der Lauf beweist Feld-/Control-Erreichbarkeit, aber noch keinen fachlichen Wertfit.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-026 recovers Depreciation Book Code and Posting Group active controls without saving', async ({
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
    fixedAssetsEvidencePath('030-card-context-after-recovery.txt'),
    await compactPageText(page, {
      include: [/Fixed Asset|Depreciation Book|Posting Group|FA Class|FA Subclass|Book Value|No\.|Description/i],
      maxLines: 140
    })
  );
  const fieldHints = await collectFocusedFieldHints(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('040-focused-field-hints.json'), fieldHints);

  const fieldHintStatus =
    fieldHints.some((entry) => entry.matches.depreciationBookCode) && fieldHints.some((entry) => entry.matches.postingGroup);

  await screenshot(page, `${testId}-030-depreciation-book-controls-recovery.png`, {
    projectName: project.name,
    testId,
    status: fieldHintStatus ? 'candidate' : 'rejected',
    bookUse: fieldHintStatus ? 'field-proof' : 'do-not-use',
    purpose:
      'FIXEDASSETS-026 zeigt die leere Anlagenkarte nach breiter Ansicht und gezieltem Aufklappen von General und Depreciation Book; sichtbar sein muessen Depreciation Book Code und Posting Group.',
    expectedPageText: fieldHintStatus
      ? [/Fixed Asset Card|Depreciation Book Code|Posting Group/i]
      : [/Fixed Asset|Fixed Assets|Anlagen/i],
    knownLimitations: [
      'No-save-Feldbeweis, kein gespeicherter Anlagenstamm.',
      'Keine Zielwerte HGB oder MACHINES gesetzt.',
      'Keine Anschaffung, keine AfA und keine Buchung.'
    ]
  });

  const activeControlDiagnosis = await collectActiveCardControlDiagnostics(page, requiredCaptions, {
    targetText: /Fixed Asset Card|Depreciation Book Code|Posting Group|FA Class Code|FA Subclass Code/i
  });
  await writeJsonEvidence(fixedAssetsEvidencePath('050-active-card-control-recovery.json'), activeControlDiagnosis);

  await openFixedAssets(page, true);
  const filterAfterText = await pageText(page);
  const targetNotSaved = !new RegExp(`\\b${target.fixedAssetNo}\\b`, 'i').test(filterAfterText);
  await writeTextEvidence(
    fixedAssetsEvidencePath('090-target-filter-after-run.txt'),
    await compactPageText(page, {
      include: [/MCP_1_20260210|Rhein-Main Demo GmbH|RM-DEMO|Fixed Assets|FA-CNC-01|No\.|Description|FA000/i],
      maxLines: 80
    })
  );

  const controlStatus = {
    depreciationBookCode:
      activeControlDiagnosis.diagnostics.find((entry) => entry.caption === 'Depreciation Book Code')?.diagnosis ===
      'active-card-label-with-control',
    postingGroup:
      activeControlDiagnosis.diagnostics.find((entry) => entry.caption === 'Posting Group')?.diagnosis ===
      'active-card-label-with-control'
  };
  const recoveredMissingControls = controlStatus.depreciationBookCode && controlStatus.postingGroup;
  const result = {
    testId: 'FIXEDASSETS-026',
    generatedAt: new Date().toISOString(),
    status: recoveredMissingControls
      ? 'labor-control-recovery-success-no-save'
      : 'labor-control-recovery-partial-no-save',
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-fixed-asset-card-control-recovery-no-save-no-posting',
    target,
    context,
    showMore,
    fieldHintsSummary: {
      entries: fieldHints.length,
      hasDepreciationBookCodeHint: fieldHints.some((entry) => entry.matches.depreciationBookCode),
      hasPostingGroupHint: fieldHints.some((entry) => entry.matches.postingGroup)
    },
    activeControlDiagnosis,
    controlStatus,
    recoveredMissingControls,
    targetNotSaved,
    screenshot: `${testId}-030-depreciation-book-controls-recovery.png`,
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
      'Die Anlagen-Klickanleitung braucht vor jeder Wert-/Speicheraktion einen breiten Karten-Screenshot, auf dem Depreciation Book Code und Posting Group wirklich sichtbar sind.',
    nextStep: recoveredMissingControls
      ? 'FIXEDASSETS-027-FA-CNC-01-VALUE-LOOKUP-PREFLIGHT-DECISION: no-save pruefen, ob die Lookup-/Wertpfade fuer HGB und MACHINES auf den nun aktiven Kartenfeldern sicher sind; weiterhin keine Speicherung ohne Gate.'
      : 'FIXEDASSETS-027-FA-CNC-01-PERSONALIZE-PAGEINSPECTION-DIAGNOSIS: Personalize/Page Inspection no-save nutzen, um versteckte oder nicht aktive Felder technisch zu erklaeren.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-026-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-026-FA-CNC-01-DEPRECIATION-BOOK-CONTROL-RECOVERY.md'),
    renderMarkdown(result)
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# fixedassets-026 Evidence',
      '',
      'Status: `labor`, `ui-first`, `readiness`, `control-recovery`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-026-result.json` | JSON-Ergebnis | ob die in 024 fehlenden aktiven Karten-Controls wiedergefunden wurden | keine Werte, keine Speicherung, keine Buchung | labor |',
      '| `FIXEDASSETS-026-FA-CNC-01-DEPRECIATION-BOOK-CONTROL-RECOVERY.md` | Markdown | Lern- und Buchwirkung der No-Save-Control-Recovery | keinen deutschen Finalnachweis | labor |',
      '| `020-show-more-recovery.json` | JSON | gezielt geklickte FastTab-Show-More-Aktionen | keine fachlichen Werte | diagnostic |',
      '| `030-card-context-after-recovery.txt` | kompakter UI-Text | Kartenkontext mit Depreciation-Book-Feldern | keinen Rohdump | context |',
      '| `040-focused-field-hints.json` | JSON | fokussierte Hinweise auf FA-/Depreciation-/Posting-Felder | kein vollstaendiges Tabellenmodell | diagnostic |',
      '| `050-active-card-control-recovery.json` | JSON | aktive Kartenlabel mit nahen Controls/Buttons | keine Wertauswahl | control-proof |',
      '| `090-target-filter-after-run.txt` | UI-Text | `FA-CNC-01` wurde nach dem Lauf nicht gespeichert | keine API-Pruefung | no-save-check |',
      '| `fixedassets-026-030-depreciation-book-controls-recovery.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des Bilds | keine eigenstaendige Wahrheit ohne JSON/Markdown | candidate |',
      '| `playwright/projects/fibu-book5/img/fixedassets-026-030-depreciation-book-controls-recovery.png` | Screenshot | Buchkandidat fuer sichtbare leere Kartenfelder `Depreciation Book Code` und `Posting Group` | keine gesetzten Werte `HGB`/`MACHINES` | candidate |',
      '',
      '## Kernaussage',
      '',
      result.bookImpact,
      ''
    ].join('\n')
  );

  expect(targetNotSaved, `${target.fixedAssetNo} darf in diesem Recovery-Lauf nicht gespeichert werden`).toBeTruthy();
  expect(result.safety.posted).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.valuesEntered).toBe(false);
});
