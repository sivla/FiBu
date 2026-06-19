import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-082-ACQUIRE-ACTION-DISABLED-DIAGNOSIS';
const TEST_ID = 'fixedassets-082';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_ASSET = 'FA-CNC-01';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(300_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function fixedAssetCardUrl() {
  const url = new URL(bcPageUrl(5600, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${TARGET_ASSET}'`);
  return url.toString();
}

function clean(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanBlock(value: string) {
  return value
    .split('\n')
    .map((line) => clean(line))
    .filter(Boolean)
    .join('\n');
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const text = await pageText(page);
  const result = {
    url,
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };

  if (!result.environmentInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function findCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/\bFA-CNC-01\b/i.test(text) && /Fixed Asset Card|Fixed Asset|Book Value|Acquire/i.test(text)) {
      return frame;
    }
  }

  return page.mainFrame();
}

async function collectCardDiagnostics(page: Page) {
  const frame = await findCardFrame(page);
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,input,textarea,select,[aria-label],[title]'))
      .filter((element) => visible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const value = normalize((element as HTMLInputElement).value);
        const label = normalize([text, aria, title, value].filter(Boolean).join(' | '));
        return {
          text,
          aria,
          title,
          value,
          label,
          role: normalize(element.getAttribute('role')),
          tagName: element.tagName,
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
          readonly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) =>
        /Acquire|Acquisition|Fixed Asset Card|FA-CNC-01|Description|FA Class|FA Subclass|Book Value|Depreciation Book|Depreciation Method|Depreciation Starting Date|Depreciation Ending Date|No\. of Depreciation Years|Add More Depreciation Books|Edit|Bearbeiten|Pencil|Open in Excel/i.test(entry.label),
      )
      .sort((left, right) => left.y - right.y || left.x - right.x)
      .slice(0, 90);

    const acquireCandidates = candidates.filter((entry) => /^Acquire(?:\s|\||$)/i.test(entry.label) || /Acquire the fixed asset/i.test(entry.label));
    const editSignals = candidates.filter((entry) => /Edit|Bearbeiten|Pencil/i.test(entry.label));
    const valueSignals = candidates.filter((entry) => /Book Value|Depreciation|FA Class|FA Subclass|Add More Depreciation Books/i.test(entry.label));

    return {
      frameUrl: window.location.href,
      acquireCandidates,
      editSignals,
      valueSignals,
      relevantControls: candidates,
    };
  });
}

function deriveDiagnosis(diagnostics: Awaited<ReturnType<typeof collectCardDiagnostics>>, compactText: string) {
  const acquireVisible = diagnostics.acquireCandidates.length > 0;
  const acquireDisabled = diagnostics.acquireCandidates.some((entry) => entry.disabled);
  const bookValueZero = /Book Value.*0,00|0,00.*Book Value/i.test(compactText) || diagnostics.valueSignals.some((entry) => /Book Value.*0,00|0,00.*Book Value/i.test(entry.label));
  const depreciationBookValueVisible = /Depreciation Book/i.test(compactText) || diagnostics.valueSignals.some((entry) => /Depreciation Book/i.test(entry.label));
  const depreciationBookSpecificValueVisible = /\bHGB\b|\bCOMPANY\b|\bTAX\b|\bIFRS\b/i.test(compactText);
  const editSignalVisible = diagnostics.editSignals.length > 0;

  const likelyReasons = [];
  if (acquireDisabled) {
    likelyReasons.push('The UI exposes Acquire, but Business Central marks the action disabled for the current card state.');
  }
  if (bookValueZero) {
    likelyReasons.push('Book Value is visible as 0,00, so no acquisition value has been posted yet; this is evidence of state, not proof of the disablement cause.');
  }
  if (depreciationBookValueVisible && !depreciationBookSpecificValueVisible) {
    likelyReasons.push('The Depreciation Book area is visible, but no specific book code such as HGB is visible in this compact card context.');
  }
  if (editSignalVisible) {
    likelyReasons.push('An Edit/Bearbeiten signal is visible; the disabled action may require a different card mode or further setup, but FA-082 did not enter edit mode.');
  }

  return {
    acquireVisible,
    acquireDisabled,
    bookValueZero,
    depreciationBookValueVisible,
    depreciationBookSpecificValueVisible,
    editSignalVisible,
    likelyReasons,
    conclusion:
      acquireVisible && acquireDisabled
        ? 'Acquire is a visible but disabled card action. The next safe step is an explicit decision case: either allow an edit-mode read-only probe, inspect Page Inspection metadata, or switch to an alternate acquisition route such as Fixed Asset G/L Journal.'
        : 'Acquire disabled state was not confirmed; repeat scoped action inventory before changing route.',
  };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-082 - Acquire Disabled Diagnosis',
    '',
    'Status: `labor`, `ui-first`, `read-only`, `disabled-action-diagnosis`, `no-posting`, `no-preview`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.targetAsset} |`,
    `| Acquire sichtbar | ${result.observed.diagnosis.acquireVisible ? 'ja' : 'nein'} |`,
    `| Acquire deaktiviert | ${result.observed.diagnosis.acquireDisabled ? 'ja' : 'nein'} |`,
    `| Book Value 0,00 sichtbar | ${result.observed.diagnosis.bookValueZero ? 'ja' : 'nein'} |`,
    `| Spezifisches AfA-Buch sichtbar | ${result.observed.diagnosis.depreciationBookSpecificValueVisible ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Was man in BC lernt',
    '',
    'Eine sichtbare Aktion ist in Business Central nicht automatisch ausfuehrbar. Wenn eine Aktion deaktiviert ist, muss die Anleitung erst den Kontext klaeren: Datensatzstatus, Page-Modus, sichtbare Pflichtfelder, Setup-Zustand und alternative Prozessroute. Sonst wuerde das Buch einen Klickpfad versprechen, den ein Anfaenger im selben Zustand nicht ausfuehren kann.',
    '',
    '## Diagnose aus sichtbarer UI',
    '',
    ...result.observed.diagnosis.likelyReasons.map((reason: string) => `- ${reason}`),
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Kein Klick auf `Acquire`.',
    '- Kein Edit-Modus, keine Werteingabe, keine Setup-Aenderung.',
    '- Keine Preview, keine Buchung, keine FA Ledger Entry Spur.',
    '- CRONUS-USA-Labor, kein deutscher Anlagen-/Steuer-/Kontenplan-Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-082 diagnoses disabled Acquire action read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();

  await page.goto(fixedAssetCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset Card|Fixed Asset|FA Class Code|Depreciation Book|Book Value/i, {
    timeout: 90_000,
  });
  await waitForPageText(page, /\bFA-CNC-01\b/i, { timeout: 60_000 });

  const context = await assertSandboxContext(page);
  const compactText = cleanBlock(
    await compactPageText(page, {
      include: [/MCP_1_20260210|RM-DEMO|Fixed Asset Card|FA-CNC-01|CNC Maschine|Acquire|Book Value|Depreciation Book|Depreciation Method|FA Class|FA Subclass|HGB|Edit|Bearbeiten/i],
      maxLines: 180,
      maxLineLength: 240,
    }),
  );
  const diagnostics = await collectCardDiagnostics(page);
  const sanitizedDiagnostics = {
    ...diagnostics,
    acquireCandidates: diagnostics.acquireCandidates.map((entry) => ({ ...entry, label: clean(entry.label), text: clean(entry.text), aria: clean(entry.aria), title: clean(entry.title), value: clean(entry.value) })),
    editSignals: diagnostics.editSignals.map((entry) => ({ ...entry, label: clean(entry.label), text: clean(entry.text), aria: clean(entry.aria), title: clean(entry.title), value: clean(entry.value) })),
    valueSignals: diagnostics.valueSignals.map((entry) => ({ ...entry, label: clean(entry.label), text: clean(entry.text), aria: clean(entry.aria), title: clean(entry.title), value: clean(entry.value) })),
    relevantControls: diagnostics.relevantControls.map((entry) => ({ ...entry, label: clean(entry.label), text: clean(entry.text), aria: clean(entry.aria), title: clean(entry.title), value: clean(entry.value) })),
  };
  const diagnosis = deriveDiagnosis(sanitizedDiagnostics, compactText);

  await writeTextEvidence(faEvidencePath('010-card-state-readonly.txt'), compactText || 'No compact page text captured.');
  await writeJsonEvidence(faEvidencePath('020-acquire-disabled-diagnostics.json'), {
    diagnostics: sanitizedDiagnostics,
    derived: diagnosis,
  });

  const nextCaseId = diagnosis.acquireVisible && diagnosis.acquireDisabled
    ? 'FIXEDASSETS-083-ACQUIRE-ROUTE-DECISION'
    : 'FIXEDASSETS-083-ACQUIRE-ACTION-INVENTORY-RETRY';
  const nextCaseFile = diagnosis.acquireVisible && diagnosis.acquireDisabled
    ? '.agent/state/cases/fixedassets-083-acquire-route-decision.json'
    : '.agent/state/cases/fixedassets-083-acquire-action-inventory-retry.json';
  const summary = diagnosis.acquireVisible && diagnosis.acquireDisabled
    ? 'FA-082 confirmed read-only that Acquire remains visible but disabled on FA-CNC-01. UI evidence shows Book Value 0,00 and no specific depreciation-book value such as HGB in this compact card view. The cause is not proven; the next case must decide between edit-mode/Page Inspection diagnosis or an alternate acquisition route.'
    : 'FA-082 did not confirm the disabled Acquire state; repeat scoped action inventory before changing route.';
  const nextStep = diagnosis.acquireVisible && diagnosis.acquireDisabled
    ? 'FIXEDASSETS-083-ACQUIRE-ROUTE-DECISION: decide whether to unlock a controlled edit-mode/Page Inspection probe or switch to an alternate acquisition route such as Fixed Asset G/L Journal.'
    : 'FIXEDASSETS-083-ACQUIRE-ACTION-INVENTORY-RETRY: repeat action inventory before any route change.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-acquire-disabled-diagnosis-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-disabled-action-diagnosis',
    resultStatus: diagnosis.acquireVisible && diagnosis.acquireDisabled ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    targetAsset: TARGET_ASSET,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      url: page.url(),
      context,
      diagnosis,
      acquireCandidateCount: sanitizedDiagnostics.acquireCandidates.length,
      editSignalCount: sanitizedDiagnostics.editSignals.length,
      valueSignalCount: sanitizedDiagnostics.valueSignals.length,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      ...(diagnosis.acquireVisible ? ['Acquire is visible on the FA-CNC-01 Fixed Asset Card.'] : []),
      ...(diagnosis.acquireDisabled ? ['Acquire is disabled in the scoped card UI evidence.'] : []),
      ...(diagnosis.bookValueZero ? ['Book Value 0,00 is visible in the card context.'] : []),
      'No Acquire click, Edit, value entry, Preview Posting, posting, setup change, draft, delete or API shortcut was performed.',
    ],
    notProved: [
      'The exact Business Central reason for the disabled Acquire action is not proven.',
      'No edit-mode behavior was tested.',
      'No Page Inspection metadata was captured in this case.',
      'No acquisition wizard, journal route, posting preview, FA Ledger Entry or German final proof was proven.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-082-acquire-action-disabled-diagnosis.json',
      nextCaseFile,
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-082-acquire-action-disabled-diagnosis.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-082/FIXEDASSETS-082-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-082/FIXEDASSETS-082-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-082/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-082/FIXEDASSETS-082-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-082/FIXEDASSETS-082-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-082/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-082/010-card-state-readonly.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-082/020-acquire-disabled-diagnostics.json',
    ],
    warnings: [
      'Read-only UI diagnosis only.',
      'Do not claim the exact disablement cause without edit-mode, Page Inspection or setup evidence.',
      'Next route requires an explicit case decision before any default-locked action is unlocked.',
    ],
    blockedBy: [],
    requiresReview: false,
    safeToFinalizeState: true,
    flags: {
      noBookChange: true,
      secretsUntouched: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noEditRecord: true,
      noDeleteRecord: true,
      noAcquireClick: true,
      noAmountEntry: true,
      noTargetVendorEntry: true,
      noTargetFixedAssetEntryInDocumentOrJournal: true,
      cleanupCompleted: true,
    },
    statePatch: {
      current: {
        updatedAt: '2026-06-19T11:15:00.000Z',
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-082-acquire-action-disabled-diagnosis.json',
        nextStep,
      },
      lastRunSummary: {
        schemaVersion: 1,
        runId: CASE_ID,
        date: '2026-06-19',
        workType: 'fixed-asset-acquire-disabled-diagnosis',
        branch: 'codex/token-efficient-autopilot-state',
        bcRun: true,
        posted: false,
        preview: false,
        setupChanged: false,
        companySwitched: false,
        summary,
        nextStep,
      },
      activeCase: {
        status: 'observed-readonly-disabled-action-diagnosis',
        lastResult: {
          status: diagnosis.acquireVisible && diagnosis.acquireDisabled ? 'observed' : 'blocked',
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-082/FIXEDASSETS-082-result.json',
          summary,
          acquireVisible: diagnosis.acquireVisible,
          acquireDisabled: diagnosis.acquireDisabled,
          bookValueZero: diagnosis.bookValueZero,
          depreciationBookSpecificValueVisible: diagnosis.depreciationBookSpecificValueVisible,
        },
        nextSafeAction: nextStep,
      },
      coverage: {
        areas: {
          fixedassets: {
            latestPracticalCase: 'FIXEDASSETS-082',
            currentBlock: diagnosis.acquireVisible && diagnosis.acquireDisabled ? 'fixed-asset-acquire-route-decision' : 'fixed-asset-acquire-action-inventory-retry',
            nextCase: nextCaseId,
          },
        },
      },
    },
    bookImpact: 'Kapitel 21 darf den Acquire-Weg noch nicht als ausfuehrbare Anschaffungsanleitung darstellen. Es braucht eine Erklaerung fuer deaktivierte Aktionen und eine bewusste naechste Route: edit-mode/Page-Inspection-Diagnose oder alternativer FA-G/L-Journal-Pfad.',
    summary,
    nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-082-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-082-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-082 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-082-result.json` | JSON | deaktivierter Acquire-Zustand und Diagnosegrenzen | keine Ursache, keine Anschaffung, keine Buchung | `labor`, `read-only` |',
      '| `FIXEDASSETS-082-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-card-state-readonly.txt` | Text | sichtbarer Kartenstatus | keine technische Tabellenlogik | `read-only` |',
      '| `020-acquire-disabled-diagnostics.json` | JSON | Aktions-/Feldsignale aus sichtbarer UI | keine Buchungswirkung | `read-only-diagnosis` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noAcquireClick).toBe(true);
  expect(result.flags.noEditRecord).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(diagnosis.acquireVisible).toBe(true);
  expect(diagnosis.acquireDisabled).toBe(true);
});
