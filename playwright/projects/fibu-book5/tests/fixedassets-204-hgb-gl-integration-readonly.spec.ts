import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, hideFactBoxPane, pageText, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2800, height: 1400 }
});

test.setTimeout(240_000);

const testId = 'fixedassets-204';
const caseId = 'FIXEDASSETS-204-HGB-GL-INTEGRATION-READONLY';

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function filteredPageUrl(pageId: number) {
  const url = new URL(bcPageUrl(pageId, project.envPrefix));
  url.searchParams.set('filter', "'Depreciation Book'.'Code' IS 'HGB'");
  return url.toString();
}

function normalizeLine(line: string) {
  return line.replace(/\s+/g, ' ').trim();
}

function compactLines(text: string) {
  const interesting = /Depreciation Book|AfA|HGB|G\/L Integration|Integration|Acquisition Cost|Disposal|Appreciation|Depreciation|Book Value|Error|Fehler/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean)
    .filter((line) => interesting.test(line));
  return [...new Set(lines)].slice(0, 180);
}

async function openReadOnlyDepreciationBookContext(page: Page, pageId: number) {
  await page.goto(filteredPageUrl(pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);
}

async function openHgbRecordFromList(page: Page) {
  for (const frame of page.frames()) {
    const clicked = await frame
      .evaluate(() => {
        const clean = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const candidates = [...document.querySelectorAll<HTMLElement>('a,button,[role="button"]')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const label = [
              clean(element.getAttribute('aria-label')),
              clean(element.getAttribute('title')),
              clean(element.innerText || element.textContent)
            ].join(' ');
            return { element, label, visible: rect.width > 0 && rect.height > 0 };
          })
          .filter(({ label, visible }) => visible && /\bHGB\b/i.test(label) && /open|oeffnen|ffnen|datensatz|record/i.test(label));
        const target = candidates[0]?.element;
        if (!target) return false;
        target.click();
        return true;
      })
      .catch(() => false);

    if (clicked) {
      await page.waitForTimeout(3500);
      await dismissTours(page);
      await hideFactBoxPane(page).catch(() => undefined);
      return true;
    }
  }

  return false;
}

async function extractRelevantControls(page: Page) {
  const controls: Array<Record<string, unknown>> = [];

  for (const frame of page.frames()) {
    const frameControls = await frame
      .evaluate(() => {
        const relevant = /HGB|G\/L Integration|Integration|Acquisition Cost|Disposal|Appreciation|Depreciation/i;
        const clean = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        return [...document.querySelectorAll<HTMLElement>('input,[role="checkbox"],[aria-label],[title],[data-control-name],label')]
          .map((element) => {
            const input = element as HTMLInputElement;
            const rect = element.getBoundingClientRect();
            const label =
              clean(element.getAttribute('aria-label')) ||
              clean(element.getAttribute('title')) ||
              clean(element.getAttribute('data-control-name')) ||
              clean(element.innerText || element.textContent) ||
              clean(input.name);
            const value = clean(input.value);
            const checked =
              input.type === 'checkbox'
                ? input.checked
                : element.getAttribute('aria-checked') === 'true'
                  ? true
                  : element.getAttribute('aria-checked') === 'false'
                    ? false
                    : null;
            const context = clean(element.closest<HTMLElement>('[role="row"],tr,[data-control-name],div')?.innerText);
            return {
              tag: element.tagName,
              type: clean(input.type),
              role: clean(element.getAttribute('role')),
              label,
              value,
              checked,
              disabled: Boolean(input.disabled || element.getAttribute('aria-disabled') === 'true'),
              readonly: Boolean(input.readOnly || element.getAttribute('aria-readonly') === 'true'),
              visible: rect.width > 0 && rect.height > 0,
              context
            };
          })
          .filter((entry) => entry.visible && relevant.test(`${entry.label} ${entry.value} ${entry.context}`))
          .slice(0, 140);
      })
      .catch(() => []);
    controls.push(...frameControls);
  }

  return controls;
}

function classifyAcquisitionCostStatus(controls: Array<Record<string, unknown>>, lines: string[]) {
  const acquisitionControls = controls.filter((control) =>
    /Acquisition Cost/i.test(`${control.label ?? ''} ${control.context ?? ''}`)
  );
  const checkedControl = acquisitionControls.find((control) => typeof control.checked === 'boolean');
  if (checkedControl?.checked === true) {
    return { status: 'visible-on', basis: 'checkbox-control', control: checkedControl };
  }
  if (checkedControl?.checked === false) {
    return { status: 'visible-off', basis: 'checkbox-control', control: checkedControl };
  }

  const acquisitionLine = lines.find((line) => /Acquisition Cost/i.test(line));
  if (acquisitionLine && /\b(Yes|Ja|true|on|enabled)\b/i.test(acquisitionLine)) {
    return { status: 'visible-on', basis: 'text-line', line: acquisitionLine };
  }
  if (acquisitionLine && /\b(No|Nein|false|off|disabled)\b/i.test(acquisitionLine)) {
    return { status: 'visible-off', basis: 'text-line', line: acquisitionLine };
  }
  if (acquisitionLine || acquisitionControls.length > 0) {
    return { status: 'not-visible', basis: 'caption-visible-value-not-readable', line: acquisitionLine ?? null };
  }

  return { status: 'not-visible', basis: 'no-acquisition-cost-integration-control-visible' };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-204 HGB G/L Integration Read-only Diagnosis',
    '',
    'Status: `labor`, `read-only`, `setup-diagnosis`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Case | ${result.caseId} |`,
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Zielobjekt | Depreciation Book `HGB` |',
    `| Page-Kontext | ${result.pageContext.join(', ')} |`,
    `| Acquisition-Cost-G/L-Integration | ${result.acquisitionCostIntegration.status} |`,
    '',
    '## Was geprueft wurde',
    '',
    '- Business Central wurde nur lesend in `MCP_1_20260210` / `RM-DEMO` geoeffnet.',
    '- Die Depreciation-Book-Kontexte wurden auf `HGB` gefiltert.',
    '- Sichtbare Texte und Controls rund um `G/L Integration` und `Acquisition Cost` wurden kompakt gesichert.',
    '- Es wurde kein Feld umgeschaltet, keine Vorschau gestartet und nichts gebucht.',
    '',
    '## Warum das fachlich wichtig ist',
    '',
    'Der vorherige FA-202-Blocker sagt, dass `Acquisition Cost` im FA Journal gebucht werden muss. In Business Central entscheidet die Einrichtung des AfA-Buchs mit, ob Anlagenbuchungen in die Sachposten integriert werden. Deshalb ist der naechste sichere Schritt nicht erneutes Preview Posting, sondern die lesende Pruefung des `HGB`-AfA-Buchs.',
    '',
    '## Ergebnis',
    '',
    `- HGB sichtbar: ${result.hgbVisible ? 'ja' : 'nein'}.`,
    `- G/L-Integration-Hinweise sichtbar: ${result.glIntegrationVisible ? 'ja' : 'nein'}.`,
    `- Acquisition-Cost-Status: \`${result.acquisitionCostIntegration.status}\` (${result.acquisitionCostIntegration.basis}).`,
    '',
    '## Grenze',
    '',
    '- Wenn der Checkbox-Wert nicht eindeutig sichtbar ist, ist das kein Setup-Fit. Dann braucht der naechste Lauf eine lokale Review-Entscheidung oder einen gezielten, weiter abgesicherten UI-Pfad.',
    '- Kein deutscher HGB-Endstand, keine deutsche Steuer-/Kontenplan-Finalisierung.',
    '- Kein Preview Posting und keine Anlagenbuchung.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-204 HGB G/L Integration read-only pruefen', async ({ page }) => {
  await openReadOnlyDepreciationBookContext(page, 5611);
  const listUrl = page.url();
  const listText = await pageText(page);
  const listControls = await extractRelevantControls(page);

  const openedByRecordLink = await openHgbRecordFromList(page);
  let cardUrl = page.url();
  let cardText = await pageText(page);
  let cardControls = await extractRelevantControls(page);
  let cardOpenMethod = openedByRecordLink ? 'list-record-link' : 'not-opened';

  if (!openedByRecordLink || !/Depreciation Book Card|Card|Karte|G\/L Integration|Acquisition Cost/i.test(cardText)) {
    await openReadOnlyDepreciationBookContext(page, 5612);
    cardUrl = page.url();
    cardText = await pageText(page);
    cardControls = await extractRelevantControls(page);
    cardOpenMethod = openedByRecordLink ? 'list-record-link-then-direct-page-fallback' : 'direct-page-fallback';
  }

  const allText = `${listText}\n${cardText}`;
  const lines = compactLines(allText);
  const controls = [...listControls, ...cardControls];
  const hgbVisible = /\bHGB\b/i.test(allText);
  const glIntegrationVisible = /G\/L Integration|Integration/i.test(allText) || controls.some((control) => /G\/L Integration|Integration/i.test(`${control.label ?? ''} ${control.context ?? ''}`));
  const acquisitionCostIntegration = classifyAcquisitionCostStatus(controls, lines);
  const blocked = !hgbVisible;

  const changedFiles = [
    'playwright/projects/fibu-book5/evidence/fixedassets-204/010-hgb-gl-integration-readonly.json',
    'playwright/projects/fibu-book5/evidence/fixedassets-204/FIXEDASSETS-204-result.json',
    'playwright/projects/fibu-book5/evidence/fixedassets-204/FIXEDASSETS-204-learning.md',
    'playwright/projects/fibu-book5/evidence/fixedassets-204/README.md'
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'playwright-result',
    caseId,
    source: 'playwright-result',
    resultStatus: blocked ? 'blocked' : 'observed',
    runPlanId: 'FIXEDASSETS-204-live-readonly',
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    pageContext: ['Depreciation Books page 5611', `Depreciation Book Card via ${cardOpenMethod}`],
    urls: {
      listUrl,
      cardUrl
    },
    cardOpenMethod,
    hgbVisible,
    glIntegrationVisible,
    acquisitionCostIntegration,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noJournalEdit: true,
      noFieldToggle: true
    },
    proved: [
      hgbVisible ? 'Depreciation Book HGB is visible in read-only depreciation book context.' : '',
      glIntegrationVisible ? 'G/L Integration wording is visible in the HGB depreciation book context.' : '',
      `Acquisition Cost G/L Integration status classified as ${acquisitionCostIntegration.status}.`,
      'The run stayed read-only: no preview posting, no post, no setup change, no journal edit.'
    ].filter(Boolean),
    notProved: [
      acquisitionCostIntegration.status === 'not-visible'
        ? 'The exact Acquisition Cost G/L Integration checkbox value is not proven from visible read-only UI.'
        : '',
      'No setup change was made.',
      'No FA journal route was tested.',
      'No Preview Posting was rerun.',
      'No German final HGB/accounting proof.'
    ].filter(Boolean),
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-204/010-hgb-gl-integration-readonly.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-204/FIXEDASSETS-204-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-204/README.md'
    ],
    changedFiles,
    warnings: acquisitionCostIntegration.status === 'not-visible'
      ? ['Acquisition Cost integration caption/context was not enough to prove checked/unchecked state.']
      : [],
    blockedBy: blocked ? ['HGB depreciation book was not visible in read-only context.'] : [],
    requiresReview: true,
    safeToFinalizeState: false,
    statePatch: {
      current: {
        updatedAt: '2026-06-26T00:00:00.000Z',
        lastReferenceCase: caseId,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-204-hgb-gl-integration-readonly.json',
        activeCase: 'FIXEDASSETS-205-HGB-GL-INTEGRATION-REVIEW',
        active_case_file: '.agent/state/cases/fixedassets-205-hgb-gl-integration-review.json',
        nextStep: 'FIXEDASSETS-205: locally review FA-204 HGB G/L Integration evidence and decide whether setup-fit or FA Journal route is the next safe case.'
      }
    },
    reason: 'Read-only HGB G/L Integration diagnosis captured from Business Central UI.',
    validationCommands: [
      'npm run agent:preflight',
      'npm run agent:dry-run',
      'npm run agent:run-plan',
      'npm run fibu:fixedassets:hgb-gl-integration-readonly',
      'npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/fixedassets-204/FIXEDASSETS-204-result.json',
      'npm run agent:state-finalize -- --input playwright/projects/fibu-book5/evidence/fixedassets-204/FIXEDASSETS-204-result.json',
      'npm run check:encoding',
      'git diff --check'
    ],
    nextStep: 'FIXEDASSETS-205: locally review FA-204 HGB G/L Integration evidence and decide whether setup-fit or FA Journal route is the next safe case.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('010-hgb-gl-integration-readonly.json'), {
    caseId,
    environment: result.environment,
    company: result.company,
    listUrl,
    cardUrl,
    cardOpenMethod,
    compactLines: lines,
    controls,
    acquisitionCostIntegration,
    flags: result.flags
  });
  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-204-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-204-learning.md'), renderLearning(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-204 Evidence-Index',
      '',
      'Status: `labor`, `read-only`, `setup-diagnosis`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-204-result.json` | JSON-Ergebnis | Laufstatus, Safety-Flags, G/L-Integration-Klassifikation und State-Patch-Plan | keine automatische State-Wahrheit und keinen Setup-Fit | review-required |',
      '| `010-hgb-gl-integration-readonly.json` | UI-Evidence | sichtbare Texte/Controls rund um `HGB`, `G/L Integration`, `Acquisition Cost` | keine vollstaendige Tabellenlogik und keinen geaenderten Setupwert | labor/read-only |',
      '| `FIXEDASSETS-204-learning.md` | Lernnotiz | warum G/L Integration vor erneutem Preview Posting fachlich geprueft wird | keinen deutschen Finalnachweis | labor |',
      '',
      '## Kernergebnis',
      '',
      `- HGB sichtbar: ${hgbVisible ? 'ja' : 'nein'}.`,
      `- G/L Integration sichtbar: ${glIntegrationVisible ? 'ja' : 'nein'}.`,
      `- Acquisition Cost Integration: \`${acquisitionCostIntegration.status}\` (${acquisitionCostIntegration.basis}).`,
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(page.url()).toContain('MCP_1_20260210');
  expect(page.url()).toContain('company=RM-DEMO');
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(hgbVisible, 'HGB must be visible before any route decision.').toBe(true);
});
