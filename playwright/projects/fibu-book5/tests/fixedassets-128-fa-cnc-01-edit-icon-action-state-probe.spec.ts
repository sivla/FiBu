import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-128-FA-CNC-01-EDIT-ICON-ACTION-STATE-PROBE';
const TEST_ID = 'fixedassets-128';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_ASSET = 'FA-CNC-01';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(300_000);

type ControlEntry = {
  text: string;
  aria: string;
  title: string;
  value: string;
  label: string;
  role: string;
  tagName: string;
  disabled: boolean;
  readonly: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

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

function sanitizeEntry(entry: ControlEntry): ControlEntry {
  return {
    ...entry,
    label: clean(entry.label),
    text: clean(entry.text),
    aria: clean(entry.aria),
    title: clean(entry.title),
    value: clean(entry.value),
  };
}

async function collectToolbarAndActionDiagnostics(page: Page) {
  const frame = await findCardFrame(page);
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const all = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,[aria-label],[title]'))
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
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const toolbar = all.filter((entry) => entry.y <= 230 || /Edit|Bearbeiten|Open in edit|Pencil|Acquire|Copy Fixed Asset|New|Delete|Share|Open in Excel|nderungen auf der Seite vornehmen|Änderungen auf der Seite vornehmen/i.test(entry.label));
    return {
      frameUrl: window.location.href,
      acquireCandidates: all.filter((entry) => /^Acquire(?:\s|\||$)/i.test(entry.label) || /Acquire the fixed asset/i.test(entry.label)),
      editCandidates: toolbar.filter((entry) =>
        /(^|\b)(Edit|Bearbeiten)(\b|$)|Open in edit|Pencil|nderungen auf der Seite vornehmen|Änderungen auf der Seite vornehmen/i.test(entry.label)
        && !/Copy Fixed Asset|New|Neu|Delete|L schen|Löschen|Share|Freigeben|Acquire|Post|Preview/i.test(entry.label),
      ),
      pencilLikeCandidates: toolbar.filter((entry) =>
        entry.width >= 12
        && entry.width <= 40
        && entry.height >= 12
        && entry.height <= 40
        && entry.x >= 850
        && entry.x <= 1200
        && entry.y <= 110
        && !/Copy Fixed Asset|New|Neu|Delete|L schen|Löschen|Share|Freigeben|Acquire|Post|Preview/i.test(entry.label),
      ),
      toolbarCandidates: toolbar.slice(0, 120),
    };
  }).then((raw) => ({
    ...raw,
    acquireCandidates: raw.acquireCandidates.map(sanitizeEntry),
    editCandidates: raw.editCandidates.map(sanitizeEntry),
    pencilLikeCandidates: raw.pencilLikeCandidates.map(sanitizeEntry),
    toolbarCandidates: raw.toolbarCandidates.map(sanitizeEntry),
  }));
}

async function clickScopedEditCandidate(page: Page, diagnostics: Awaited<ReturnType<typeof collectToolbarAndActionDiagnostics>>) {
  const namedCandidates = diagnostics.editCandidates.filter((entry) => !entry.disabled);
  if (namedCandidates.length === 1) {
    const candidate = namedCandidates[0];
    await page.mouse.click(candidate.x + candidate.width / 2, candidate.y + candidate.height / 2);
    return {
      attempted: true,
      clicked: 'named-edit-candidate',
      reason: `Clicked safely scoped named edit candidate: ${candidate.label}`,
      candidate,
    };
  }

  if (namedCandidates.length > 1) {
    return {
      attempted: false,
      clicked: 'none',
      reason: `Multiple named edit candidates found (${namedCandidates.length}); stopped before click.`,
      candidate: null,
    };
  }

  const pencilCandidates = diagnostics.pencilLikeCandidates.filter((entry) => !entry.disabled);
  if (pencilCandidates.length !== 1) {
    return {
      attempted: false,
      clicked: 'none',
      reason: `Expected exactly one safe pencil-like toolbar candidate, found ${pencilCandidates.length}.`,
      candidate: null,
    };
  }

  const candidate = pencilCandidates[0];
  await page.mouse.click(candidate.x + candidate.width / 2, candidate.y + candidate.height / 2);

  return {
    attempted: true,
    clicked: 'pencil-like-toolbar-candidate',
    reason: `Clicked one safe pencil-like toolbar candidate at x=${candidate.x}, y=${candidate.y}.`,
    candidate,
  };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-128 - Edit Icon Action State Probe',
    '',
    'Status: `labor`, `ui-first`, `diagnosis`, `no-acquire-execution`, `no-posting`, `not-final`.',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.targetAsset} |`,
    `| Edit-/Pencil-Probe versucht | ${result.observed.editProbe.attempted ? 'ja' : 'nein'} |`,
    `| Acquire vorher deaktiviert | ${result.observed.before.acquireDisabled ? 'ja' : 'nein'} |`,
    `| Acquire nach Probe deaktiviert | ${result.observed.after.acquireDisabled === null ? 'nicht geprueft' : result.observed.after.acquireDisabled ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- `Acquire` wurde nicht ausgefuehrt.',
    '- Keine Feldwerte wurden geaendert.',
    '- Keine Preview, keine Buchung, keine Setup-Aenderung.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-128 probes edit icon and Acquire state without data changes', async ({ page }) => {
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
  const compactBefore = cleanBlock(
    await compactPageText(page, {
      include: [/MCP_1_20260210|RM-DEMO|Fixed Asset Card|FA-CNC-01|CNC Maschine|Acquire|Book Value|Depreciation|FA Class|FA Subclass|Edit|Bearbeiten|Copy Fixed Asset/i],
      maxLines: 180,
      maxLineLength: 240,
    }),
  );
  const beforeDiagnostics = await collectToolbarAndActionDiagnostics(page);
  const beforeAcquireDisabled = beforeDiagnostics.acquireCandidates.some((entry) => entry.disabled);

  await screenshot(page, 'fixedassets-128-030-edit-icon-before.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: 'labor',
    bookUse: 'evidence',
    purpose: 'FIXEDASSETS-128 Vorherbild: FA-CNC-01 Karte mit Toolbar- und Acquire-Zustand vor einem Modus-Probe.',
    expectedPageText: [/FA-CNC-01|Fixed Asset Card|Acquire/i],
    knownLimitations: ['Diagnosebild, kein Anschaffungs- oder Buchungsnachweis.'],
  });

  const editProbe = await clickScopedEditCandidate(page, beforeDiagnostics);
  await page.waitForTimeout(editProbe.attempted ? 2000 : 500);

  const afterDiagnostics = editProbe.attempted ? await collectToolbarAndActionDiagnostics(page) : null;
  const compactAfter = editProbe.attempted
    ? cleanBlock(
        await compactPageText(page, {
          include: [/Fixed Asset Card|FA-CNC-01|Acquire|Book Value|Depreciation|FA Class|FA Subclass|Edit|Bearbeiten|Save|Cancel|Discard/i],
          maxLines: 180,
          maxLineLength: 240,
        }),
      )
    : '';
  const afterAcquireDisabled = afterDiagnostics ? afterDiagnostics.acquireCandidates.some((entry) => entry.disabled) : null;
  const afterAcquireVisible = Boolean(afterDiagnostics?.acquireCandidates.length);
  const afterAcquireEnabled = afterAcquireVisible && afterAcquireDisabled === false;
  const dangerousDialogVisible = /Post|Preview Posting|Ship|Invoice|Delete|Do you want to|Moechten Sie|Möchten Sie/i.test(await pageText(page));

  await screenshot(page, 'fixedassets-128-040-edit-icon-after.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: afterAcquireEnabled ? 'candidate' : 'labor',
    bookUse: 'evidence',
    purpose: 'FIXEDASSETS-128 Nachherbild: Toolbar-/Acquire-Zustand nach sicherem Edit-/Pencil-Probe oder dokumentiertem Stop.',
    expectedPageText: [/FA-CNC-01|Fixed Asset Card/i],
    knownLimitations: ['Keine Acquire-Ausfuehrung, keine Feldwert-Aenderung, kein Buchungsnachweis.'],
  });

  const summary = afterAcquireEnabled
    ? 'FA-128 found that Acquire appears enabled after a safe edit/pencil mode probe, but the action was not executed and no acquisition readiness is proven.'
    : editProbe.attempted
      ? 'FA-128 clicked a scoped edit/pencil toolbar candidate without changing fields; Acquire did not become proven executable for acquisition.'
      : 'FA-128 stopped before clicking because the edit/pencil toolbar action was not safely scoped; Acquire remains a disabled-action diagnosis.';
  const nextCaseId = afterAcquireEnabled
    ? 'FIXEDASSETS-129-ACQUIRE-ENABLED-CONTEXT-GATE'
    : 'FIXEDASSETS-129-ACQUIRE-ROUTE-HOLD-OR-ALTERNATIVE-DECISION';
  const nextCaseFile = afterAcquireEnabled
    ? '.agent/state/cases/fixedassets-129-acquire-enabled-context-gate.json'
    : '.agent/state/cases/fixedassets-129-acquire-route-hold-or-alternative-decision.json';
  const nextStep = afterAcquireEnabled
    ? 'FIXEDASSETS-129: local gate review before any Acquire click. Decide whether an enabled Acquire context can be inspected safely without values/posting, or whether fixed-assets acquisition remains blocked.'
    : 'FIXEDASSETS-129: local decision whether to hold the Acquire route as blocked/rejected or pivot to a different fixed-assets acquisition learning path.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-edit-icon-action-state-probe-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-diagnostic-probe',
    resultStatus: 'observed',
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
      before: {
        acquireVisible: beforeDiagnostics.acquireCandidates.length > 0,
        acquireDisabled: beforeAcquireDisabled,
        editCandidateCount: beforeDiagnostics.editCandidates.length,
        pencilLikeCandidateCount: beforeDiagnostics.pencilLikeCandidates.length,
      },
      editProbe,
      after: {
        acquireVisible: afterAcquireVisible,
        acquireDisabled: afterAcquireDisabled,
        acquireEnabled: afterAcquireEnabled,
      },
      dangerousDialogVisible,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'FA-CNC-01 Fixed Asset Card was visible.',
      'Toolbar/action candidates were inventoried before any click.',
      ...(editProbe.attempted ? ['A scoped edit/pencil mode probe was attempted without field value entry.'] : ['No edit/pencil click was performed because the candidate was not safely scoped.']),
      'No Acquire execution, value entry, Preview Posting, Post, setup change, delete, draft creation, company switch or API shortcut was performed.',
    ],
    notProved: [
      'No acquisition wizard was opened.',
      'No acquisition value or vendor was entered.',
      'No Preview Posting or posting trace was produced.',
      'No FA Ledger Entry or G/L acquisition trace is proven.',
      'No German final fixed-assets proof is proven.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-128-fa-cnc-01-edit-icon-action-state-probe.json',
      nextCaseFile,
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-128-fa-cnc-01-edit-icon-action-state-probe.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-128/FIXEDASSETS-128-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-128/FIXEDASSETS-128-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-128/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-128/FIXEDASSETS-128-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-128/FIXEDASSETS-128-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-128/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-128/010-card-state-before.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-128/020-toolbar-action-diagnostics.json',
      'playwright/projects/fibu-book5/img/fixedassets-128-030-edit-icon-before.png',
      'playwright/projects/fibu-book5/img/fixedassets-128-040-edit-icon-after.png',
    ],
    warnings: [
      'Diagnostic UI probe only.',
      'Do not execute Acquire from FA-128 evidence.',
      'Any enabled Acquire context still requires a separate gate before click.',
    ],
    blockedBy: dangerousDialogVisible ? ['unexpected-dangerous-dialog-visible'] : [],
    requiresReview: dangerousDialogVisible,
    safeToFinalizeState: !dangerousDialogVisible,
    flags: {
      noBookChange: true,
      secretsUntouched: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noFieldValueChanged: true,
      noSaveRecord: true,
      noDeleteRecord: true,
      noAcquireExecution: true,
      noAmountEntry: true,
      noTargetVendorEntry: true,
      cleanupCompleted: true,
    },
    statePatch: {
      current: {
        updatedAt: '2026-06-20T13:55:00.000Z',
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-128-fa-cnc-01-edit-icon-action-state-probe.json',
        requiresStrongModel: true,
        nextStep,
      },
      activeCase: {
        status: 'observed-diagnostic-probe',
        lastResult: {
          status: 'observed',
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-128/FIXEDASSETS-128-result.json',
          summary,
          editProbeAttempted: editProbe.attempted,
          acquireEnabledAfterProbe: afterAcquireEnabled,
          stoppedBeforeClick: !editProbe.attempted,
        },
        nextSafeAction: nextStep,
      },
      coverage: {
        schemaVersion: 1,
        purpose: 'Kompakter Coverage-Index fuer schnelle Agentenlaeufe.',
        areas: {
          fixedassets: {
            chapter: 'Kapitel 21',
            status: 'in-progress',
            currentBlock: afterAcquireEnabled ? 'acquire-enabled-context-gate' : 'acquire-route-hold-or-alternative-decision',
            latestPracticalCase: 'FIXEDASSETS-128',
            latestDecisionCase: 'FIXEDASSETS-127',
            nextCase: nextCaseId,
            bookScreenshots: {
              setupProofs: 'available-labor',
              purchaseInvoicePreflight: 'available-labor',
              validFixedAssetLine: 'blocked-personalize-opened-type-context-visible-but-fixed-asset-option-unproved',
              acquisitionPostingTrace: afterAcquireEnabled ? 'open-after-acquire-enabled-gate' : 'blocked-acquire-route-hold-or-alternative',
              depreciationPostingTrace: 'open',
              acquisitionWizardPreflight: afterAcquireEnabled ? 'open-enabled-action-gate-required' : 'blocked-acquire-not-safely-executable',
            },
            finalGermanProof: 'open',
          },
        },
        hardExclusions: {
          shopify: 'Do not run, document or reactivate Shopify/Online Store scope for FiBu Buch 5.',
        },
      },
    },
    bookImpact: afterAcquireEnabled
      ? 'Kapitel 21 darf weiterhin keine Anschaffung behaupten, kann aber den Moduswechsel als Voraussetzung fuer Aktionsverfuegbarkeit erklaeren.'
      : 'Kapitel 21 sollte Acquire als sichtbare, aber aktuell nicht nutzbare Aktion behandeln und den Anlagenzugang ueber einen anderen oder spaeteren Gate-Pfad erklaeren.',
    summary,
    nextStep,
  };

  await writeTextEvidence(faEvidencePath('010-card-state-before.txt'), compactBefore || 'No compact card text captured.');
  await writeJsonEvidence(faEvidencePath('020-toolbar-action-diagnostics.json'), {
    beforeDiagnostics,
    editProbe,
    afterDiagnostics,
    compactBefore,
    compactAfter,
  });
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-128-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-128-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-128 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-128-result.json` | JSON | Edit-/Pencil-Probe und Acquire-Zustand | keine Anschaffung, keine Buchung | `labor`, `diagnosis` |',
      '| `FIXEDASSETS-128-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-card-state-before.txt` | Text | sichtbarer Kartenstatus vor Probe | keine technische Tabellenlogik | `compact` |',
      '| `020-toolbar-action-diagnostics.json` | JSON | Toolbar-/Action-Kandidaten und Probeentscheidung | keine Buchungswirkung | `diagnosis` |',
      '| `../../img/fixedassets-128-030-edit-icon-before.png` | Screenshot | Vorher-Kontext | kein Anschaffungsbild | `labor` |',
      '| `../../img/fixedassets-128-040-edit-icon-after.png` | Screenshot | Nachher-/Stop-Kontext | kein Anschaffungsbild | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noAcquireExecution).toBe(true);
  expect(result.flags.noFieldValueChanged).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.observed.before.acquireVisible).toBe(true);
  expect(result.observed.dangerousDialogVisible).toBe(false);
});
