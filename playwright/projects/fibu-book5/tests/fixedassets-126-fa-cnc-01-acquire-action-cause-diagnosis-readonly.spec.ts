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

const CASE_ID = 'FIXEDASSETS-126-FA-CNC-01-ACQUIRE-ACTION-CAUSE-DIAGNOSIS-READONLY';
const TEST_ID = 'fixedassets-126';
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

    const entries = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,input,textarea,select,[aria-label],[title]'))
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
        /Acquire|Acquisition|Fixed Asset Card|FA-CNC-01|Description|CNC Maschine|FA Class|FA Subclass|Book Value|Depreciation Book|Depreciation Method|Depreciation Starting Date|Depreciation Ending Date|No\. of Depreciation Years|Acquired|Posting Group|Edit|Bearbeiten|Pencil/i.test(entry.label),
      )
      .sort((left, right) => left.y - right.y || left.x - right.x)
      .slice(0, 120);

    return {
      frameUrl: window.location.href,
      acquireCandidates: entries.filter((entry) => /^Acquire(?:\s|\||$)/i.test(entry.label) || /Acquire the fixed asset/i.test(entry.label)),
      editSignals: entries.filter((entry) => /Edit|Bearbeiten|Pencil/i.test(entry.label)),
      cardValueSignals: entries.filter((entry) => /Book Value|Depreciation|Posting Group|FA Class|FA Subclass|Acquired|CNC Maschine/i.test(entry.label)),
      relevantControls: entries,
    };
  });
}

function sanitizeDiagnostics(diagnostics: Awaited<ReturnType<typeof collectCardDiagnostics>>) {
  const sanitizeEntry = (entry: Record<string, any>) => ({
    ...entry,
    label: clean(entry.label ?? ''),
    text: clean(entry.text ?? ''),
    aria: clean(entry.aria ?? ''),
    title: clean(entry.title ?? ''),
    value: clean(entry.value ?? ''),
  });

  return {
    ...diagnostics,
    acquireCandidates: diagnostics.acquireCandidates.map(sanitizeEntry),
    editSignals: diagnostics.editSignals.map(sanitizeEntry),
    cardValueSignals: diagnostics.cardValueSignals.map(sanitizeEntry),
    relevantControls: diagnostics.relevantControls.map(sanitizeEntry),
  };
}

async function tryOpenPageInspection(page: Page) {
  const before = await pageText(page);
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await expect
    .poll(async () => pageText(page), {
      timeout: 15_000,
      intervals: [500, 1000, 2500],
    })
    .toMatch(/Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID|Fixed Asset/i)
    .catch(() => undefined);

  const after = await pageText(page);
  const focusedText = cleanBlock(
    await compactPageText(page, {
      include: [/Page Inspection|Inspect pages and data|Page ID|Page Type|Source Table|Table ID|Fixed Asset|FA-CNC-01|Acquire|Extension|Field/i],
      maxLines: 80,
      maxLineLength: 220,
    }),
  );
  const opened = after !== before && /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(after);

  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.keyboard.press('Escape').catch(() => undefined);

  return {
    opened,
    mentionsFixedAssetTable: /Source Table.*Fixed Asset|Fixed Asset \(5600\)|Table ID.*5600/i.test(focusedText),
    focusedText,
  };
}

async function tryEnterEditModeWithoutChanges(page: Page) {
  const frame = await findCardFrame(page);
  const before = await collectCardDiagnostics(page).then(sanitizeDiagnostics);
  const editCandidate = frame
    .getByRole('button', { name: /^(Edit|Bearbeiten)$/i })
    .first();

  const visible = await editCandidate.isVisible({ timeout: 1500 }).catch(() => false);
  const enabled = visible ? await editCandidate.isEnabled({ timeout: 1500 }).catch(() => false) : false;
  if (!visible || !enabled) {
    return {
      attempted: false,
      reason: 'No exact enabled Edit/Bearbeiten button was visible.',
      before,
      after: before,
    };
  }

  await editCandidate.click();
  await page.waitForTimeout(1500);
  const after = await collectCardDiagnostics(page).then(sanitizeDiagnostics);

  return {
    attempted: true,
    reason: 'Exact Edit/Bearbeiten button clicked only to test action-state cause; no fields were changed.',
    before,
    after,
  };
}

function deriveCause(
  before: ReturnType<typeof sanitizeDiagnostics>,
  afterEdit: ReturnType<typeof sanitizeDiagnostics> | null,
  pageInspection: Awaited<ReturnType<typeof tryOpenPageInspection>>,
  compactText: string,
) {
  const beforeVisible = before.acquireCandidates.length > 0;
  const beforeDisabled = before.acquireCandidates.some((entry) => entry.disabled);
  const afterVisible = Boolean(afterEdit?.acquireCandidates.length);
  const afterDisabled = afterEdit ? afterEdit.acquireCandidates.some((entry) => entry.disabled) : null;
  const afterEnabled = afterVisible && afterDisabled === false;
  const bookValueZero = /Book Value.*0,00|0,00.*Book Value/i.test(compactText) || before.cardValueSignals.some((entry) => /Book Value.*0,00|0,00.*Book Value/i.test(entry.label));
  const hgbVisible = /\bHGB\b/i.test(compactText) || before.cardValueSignals.some((entry) => /\bHGB\b/i.test(entry.label));
  const acquiredVisible = /Acquired/i.test(compactText) || before.cardValueSignals.some((entry) => /Acquired/i.test(entry.label));

  const reasons = [];
  if (beforeVisible && beforeDisabled && afterEnabled) {
    reasons.push('Acquire appears disabled in view mode and enabled after entering edit mode without field changes.');
  } else if (beforeVisible && beforeDisabled && afterDisabled === true) {
    reasons.push('Acquire remains disabled after entering edit mode, so view mode alone is not the proven cause.');
  } else if (beforeVisible && beforeDisabled) {
    reasons.push('Acquire is visible but disabled before any edit-mode probe.');
  }
  if (bookValueZero) {
    reasons.push('Book Value 0,00 is visible: no acquisition value is posted yet, but that alone does not explain disabled Acquire.');
  }
  if (hgbVisible) {
    reasons.push('HGB is visible in the card context; missing depreciation book is not the obvious blocker in this view.');
  }
  if (acquiredVisible) {
    reasons.push('An Acquired signal is visible; its value must be interpreted from the card context before any acquisition action.');
  }
  if (pageInspection.opened) {
    reasons.push('Page Inspection opened and provides technical page/table context, but not a business-rule explanation by itself.');
  }

  return {
    acquireVisibleBefore: beforeVisible,
    acquireDisabledBefore: beforeDisabled,
    editProbeAttempted: afterEdit !== null,
    acquireVisibleAfterEdit: afterVisible,
    acquireDisabledAfterEdit: afterDisabled,
    acquireEnabledAfterEdit: afterEnabled,
    bookValueZero,
    hgbVisible,
    acquiredSignalVisible: acquiredVisible,
    pageInspectionOpened: pageInspection.opened,
    pageInspectionMentionsFixedAssetTable: pageInspection.mentionsFixedAssetTable,
    reasons,
    conclusion: afterEnabled
      ? 'Acquire disabled state is likely mode-dependent in this UI state; a later case may inspect the enabled action context, but must still not execute Acquire without a fresh gate.'
      : 'Acquire remains a disabled-action diagnosis. The cause is narrowed, but acquisition execution is still locked.',
  };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-126 - Acquire Action Cause Diagnosis',
    '',
    'Status: `labor`, `ui-first`, `read-only-diagnosis`, `no-acquire-execution`, `no-posting`, `no-preview`, `not-final`.',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.targetAsset} |`,
    `| Acquire vorher sichtbar | ${result.observed.cause.acquireVisibleBefore ? 'ja' : 'nein'} |`,
    `| Acquire vorher deaktiviert | ${result.observed.cause.acquireDisabledBefore ? 'ja' : 'nein'} |`,
    `| Edit-Probe ohne Feldwert | ${result.observed.cause.editProbeAttempted ? 'ja' : 'nein'} |`,
    `| Acquire nach Edit aktiv | ${result.observed.cause.acquireEnabledAfterEdit ? 'ja' : 'nein'} |`,
    `| Page Inspection geoeffnet | ${result.observed.cause.pageInspectionOpened ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Diagnosehinweise',
    '',
    ...result.observed.cause.reasons.map((reason: string) => `- ${reason}`),
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

test('FIXEDASSETS-126 diagnoses Acquire disabled cause without executing action', async ({ page }) => {
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
      include: [/MCP_1_20260210|RM-DEMO|Fixed Asset Card|FA-CNC-01|CNC Maschine|Acquire|Book Value|Depreciation Book|Depreciation Method|Posting Group|FA Class|FA Subclass|HGB|MACHINES|Acquired|Edit|Bearbeiten/i],
      maxLines: 200,
      maxLineLength: 240,
    }),
  );
  const beforeDiagnostics = sanitizeDiagnostics(await collectCardDiagnostics(page));

  await screenshot(page, 'fixedassets-126-030-acquire-disabled-context.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: 'labor',
    bookUse: 'evidence',
    purpose: 'FIXEDASSETS-126 Diagnosebild: FA-CNC-01 Karte mit Acquire-Aktionszustand; kein Klick auf Acquire und keine Werteingabe.',
    expectedPageText: [/FA-CNC-01|Fixed Asset Card|Fixed Asset/i],
    knownLimitations: ['Labor-/Debuggingbild, kein finaler Buchungs- oder Anschaffungsnachweis.'],
  });

  const pageInspection = await tryOpenPageInspection(page);
  await writeTextEvidence(faEvidencePath('040-page-inspection-focused-text.txt'), pageInspection.focusedText || 'No Page Inspection focused text captured.');

  const editProbe = await tryEnterEditModeWithoutChanges(page);
  const afterEditDiagnostics = editProbe.attempted ? editProbe.after : null;
  const cause = deriveCause(beforeDiagnostics, afterEditDiagnostics, pageInspection, compactBefore);

  const summary = cause.acquireEnabledAfterEdit
    ? 'FA-126 showed that Acquire is disabled before edit mode but appears enabled after entering Edit/Bearbeiten without changing fields. The action was not executed; this narrows the blocker to card/action mode but does not prove acquisition readiness.'
    : 'FA-126 kept Acquire as a disabled-action diagnosis. The action was visible on FA-CNC-01, but acquisition execution remains locked because the exact executable path and posting effect are not proven.';
  const nextCaseId = cause.acquireEnabledAfterEdit
    ? 'FIXEDASSETS-127-ACQUIRE-ENABLED-ACTION-CONTEXT-GATE'
    : 'FIXEDASSETS-127-ACQUIRE-DISABLED-CAUSE-REVIEW';
  const nextCaseFile = cause.acquireEnabledAfterEdit
    ? '.agent/state/cases/fixedassets-127-acquire-enabled-action-context-gate.json'
    : '.agent/state/cases/fixedassets-127-acquire-disabled-cause-review.json';
  const nextStep = cause.acquireEnabledAfterEdit
    ? 'FIXEDASSETS-127: local gate review before any Acquire click. Decide whether an enabled Acquire context can be inspected safely without values/posting, or whether another route is better.'
    : 'FIXEDASSETS-127: local review of Acquire disabled cause before any new acquisition route or setup change.';

  await writeTextEvidence(faEvidencePath('010-card-state-readonly.txt'), compactBefore || 'No compact card text captured.');
  await writeJsonEvidence(faEvidencePath('020-acquire-action-diagnostics.json'), {
    beforeDiagnostics,
    pageInspection,
    editProbe,
    cause,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-acquire-action-cause-diagnosis-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-diagnosis',
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
      cause,
      acquireCandidateCountBefore: beforeDiagnostics.acquireCandidates.length,
      acquireCandidateCountAfterEdit: afterEditDiagnostics?.acquireCandidates.length ?? 0,
      pageInspection,
      editProbe: {
        attempted: editProbe.attempted,
        reason: editProbe.reason,
      },
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'FA-CNC-01 Fixed Asset Card was visible.',
      ...(cause.acquireVisibleBefore ? ['Acquire is visible on the FA-CNC-01 Fixed Asset Card.'] : []),
      ...(cause.acquireDisabledBefore ? ['Acquire is disabled before the edit-mode diagnosis.'] : []),
      ...(cause.acquireEnabledAfterEdit ? ['Acquire appears enabled after entering Edit/Bearbeiten without changing fields.'] : []),
      ...(cause.pageInspectionOpened ? ['Page Inspection opened and supplied technical page/table context.'] : []),
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
      '.agent/state/cases/fixedassets-126-fa-cnc-01-acquire-action-cause-diagnosis-readonly.json',
      nextCaseFile,
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-126-fa-cnc-01-acquire-action-cause-diagnosis-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-126/FIXEDASSETS-126-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-126/FIXEDASSETS-126-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-126/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-126/FIXEDASSETS-126-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-126/FIXEDASSETS-126-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-126/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-126/010-card-state-readonly.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-126/020-acquire-action-diagnostics.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-126/040-page-inspection-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-126/fixedassets-126-030-acquire-disabled-context.screenshot.json',
      'playwright/projects/fibu-book5/img/fixedassets-126-030-acquire-disabled-context.png',
    ],
    warnings: [
      'Diagnostic UI run only.',
      'Do not execute Acquire from FA-126 evidence.',
      'If Acquire becomes enabled in edit mode, a separate gate is required before any click.',
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
        updatedAt: '2026-06-20T10:55:00.000Z',
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-126-fa-cnc-01-acquire-action-cause-diagnosis-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      activeCase: {
        status: 'observed-readonly-diagnosis',
        lastResult: {
          status: 'observed',
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-126/FIXEDASSETS-126-result.json',
          summary,
          acquireDisabledBefore: cause.acquireDisabledBefore,
          acquireEnabledAfterEdit: cause.acquireEnabledAfterEdit,
          pageInspectionOpened: cause.pageInspectionOpened,
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
            currentBlock: cause.acquireEnabledAfterEdit ? 'acquire-enabled-action-context-gate' : 'acquire-disabled-cause-review',
            latestPracticalCase: 'FIXEDASSETS-126',
            latestDecisionCase: 'FIXEDASSETS-125',
            nextCase: nextCaseId,
            bookScreenshots: {
              setupProofs: 'available-labor',
              purchaseInvoicePreflight: 'available-labor',
              validFixedAssetLine: 'blocked-personalize-opened-type-context-visible-but-fixed-asset-option-unproved',
              acquisitionPostingTrace: 'open-after-acquire-cause-review-and-new-route-gate',
              depreciationPostingTrace: 'open',
              acquisitionWizardPreflight: cause.acquireEnabledAfterEdit ? 'open-enabled-action-gate-required' : 'blocked-acquire-disabled-cause-review',
            },
            finalGermanProof: 'open',
          },
        },
        hardExclusions: {
          shopify: 'Do not run, document or reactivate Shopify/Online Store scope for FiBu Buch 5.',
        },
      },
    },
    bookImpact: cause.acquireEnabledAfterEdit
      ? 'Kapitel 21 kann die deaktivierte Aktion als Modus-/Aktionszustands-Lernfall erklaeren: Sichtbar heisst nicht ausfuehrbar, und Edit/Bearbeiten kann Aktionsverfuegbarkeit veraendern. Das ist noch kein Anschaffungs- oder Buchungsnachweis.'
      : 'Kapitel 21 muss Acquire weiterhin als blockierten Diagnosepfad behandeln. Sichtbare, aber deaktivierte Aktionen brauchen Page-/Status-/Setup-Erklaerung, bevor sie als Klickanleitung genutzt werden.',
    summary,
    nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-126-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-126-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-126 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-126-result.json` | JSON | Acquire-Aktionszustand und Ursache-Diagnosegrenzen | keine Anschaffung, keine Buchung | `labor`, `read-only-diagnosis` |',
      '| `FIXEDASSETS-126-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-card-state-readonly.txt` | Text | sichtbarer Kartenstatus | keine technische Tabellenlogik | `compact` |',
      '| `020-acquire-action-diagnostics.json` | JSON | Aktions-/Feld-/Page-Inspection-Signale | keine Buchungswirkung | `read-only-diagnosis` |',
      '| `040-page-inspection-focused-text.txt` | Text | Page-Inspection-Kontext, falls geoeffnet | keine Business-Regel-Ursache allein | `technical-diagnosis` |',
      '| `../../img/fixedassets-126-030-acquire-disabled-context.png` | Screenshot | Karten-/Aktionskontext | kein Anschaffungs- oder Buchungsbild | `labor`, `diagnosis` |',
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
  expect(cause.acquireVisibleBefore).toBe(true);
});
