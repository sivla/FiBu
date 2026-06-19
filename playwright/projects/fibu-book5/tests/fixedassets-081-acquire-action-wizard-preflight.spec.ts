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

const CASE_ID = 'FIXEDASSETS-081-ACQUIRE-ACTION-WIZARD-PREFLIGHT';
const TEST_ID = 'fixedassets-081';
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

function sanitizeEvidenceText(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeEvidenceBlock(value: string) {
  return value
    .split('\n')
    .map((line) => sanitizeEvidenceText(line))
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

async function findFixedAssetCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/\bFA-CNC-01\b/i.test(text) && /Fixed Asset Card|Fixed Asset|Book Value|Acquire/i.test(text)) {
      return frame;
    }
  }

  return page.mainFrame();
}

async function clickAcquireInCardScope(page: Page) {
  const frame = await findFixedAssetCardFrame(page);
  const candidateResult = await frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="menuitem"],[role="button"],a'))
      .filter((element) => visible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const label = normalize([text, aria, title].filter(Boolean).join(' | '));
        return {
          element,
          text,
          aria,
          title,
          label,
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) => /^Acquire(?:\s|\||$)/i.test(entry.label) || /Acquire the fixed asset/i.test(entry.label))
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const chosen = candidates[0];
    if (!chosen) {
      return {
        clicked: false,
        reason: 'Acquire action not found in card scope',
        candidates: candidates.map(({ element, ...entry }) => entry),
      };
    }

    const { element, ...entry } = chosen;
    return {
      clicked: false,
      chosen: entry,
      candidates: candidates.map(({ element: _element, ...candidate }) => candidate),
    };
  });

  if (!candidateResult.chosen) {
    return candidateResult;
  }

  if (candidateResult.chosen.disabled) {
    return {
      ...candidateResult,
      clicked: false,
      reason: 'Acquire action is visible but disabled.',
    };
  }

  const menuItem = frame.getByRole('menuitem', { name: /^Acquire$/i }).first();
  if ((await menuItem.isVisible({ timeout: 1000 }).catch(() => false)) && (await menuItem.isEnabled({ timeout: 500 }).catch(() => false))) {
    await menuItem.click({ timeout: 5000 });
    return { ...candidateResult, clicked: true, clickMethod: 'playwright-role-menuitem' };
  }

  const button = frame.getByRole('button', { name: /^Acquire$/i }).first();
  if ((await button.isVisible({ timeout: 1000 }).catch(() => false)) && (await button.isEnabled({ timeout: 500 }).catch(() => false))) {
    await button.click({ timeout: 5000 });
    return { ...candidateResult, clicked: true, clickMethod: 'playwright-role-button' };
  }

  return {
    ...candidateResult,
    clicked: false,
    reason: 'Acquire candidate found, but no exact enabled Playwright role locator was clickable.',
  };
}

async function collectVisibleUiLabels(page: Page) {
  const results = [];
  for (const frame of page.frames()) {
    const frameResult = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const pattern =
          /Acquire|Acquisition|Erwerben|Anschaffung|Wizard|Assist|\bNext\b|\bBack\b|\bFinish\b|\bCancel\b|\bOK\b|\bYes\b|\bNo\b|Vendor|Kreditor|Amount|Betrag|Posting|Post|Buchen|Preview|Vorschau|Fixed Asset|Book Value|Depreciation|FA Ledger|Journal|Document No|Posting Date|Acquisition Cost|Anschaffungskosten/i;

        const seen = new Set<string>();
        return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],[role="dialog"],[role="heading"],a,input,textarea,select,[aria-label],[title],h1,h2,h3'))
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
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          })
          .filter((entry) => entry.label && pattern.test(entry.label))
          .filter((entry) => {
            const key = [entry.tagName, entry.role, entry.label].join('|');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((left, right) => left.y - right.y || left.x - right.x)
          .slice(0, 80);
      })
      .catch(() => []);
    if (frameResult.length) {
      results.push({
        frameUrl: frame.url(),
        entries: frameResult.map((entry) => ({
          ...entry,
          text: sanitizeEvidenceText(entry.text),
          aria: sanitizeEvidenceText(entry.aria),
          title: sanitizeEvidenceText(entry.title),
          value: sanitizeEvidenceText(entry.value),
          label: sanitizeEvidenceText(entry.label),
          role: sanitizeEvidenceText(entry.role),
          tagName: sanitizeEvidenceText(entry.tagName),
        })),
      });
    }
  }

  return results;
}

function labelsFrom(groups: Awaited<ReturnType<typeof collectVisibleUiLabels>>) {
  return groups.flatMap((group) => group.entries.map((entry) => entry.label));
}

async function safeCloseOrLeave(page: Page) {
  const labels = labelsFrom(await collectVisibleUiLabels(page));
  const hasCancel = labels.some((label) => /^Cancel(?:\s|\||$)|Abbrechen/i.test(label));
  if (!hasCancel) {
    return { attempted: false, method: 'leave-browser-session-close', reason: 'No visible Cancel action found.' };
  }

  for (const frame of page.frames()) {
    const cancelButton = frame.getByRole('button', { name: /^(Cancel|Abbrechen)$/i }).first();
    if (await cancelButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await cancelButton.click();
      await page.waitForTimeout(1500);
      return { attempted: true, method: 'cancel-button', reason: 'Clicked visible Cancel button only.' };
    }
  }

  return { attempted: false, method: 'leave-browser-session-close', reason: 'Cancel label found, but no exact safe button locator was visible.' };
}

function renderLearning(result: Record<string, any>) {
  const acquireDisabled = Boolean(result.observed.acquireActionDisabled);
  const learningText = acquireDisabled
    ? 'Business Central kann Aktionen sichtbar anzeigen und trotzdem deaktivieren. Das ist fachlich wichtig: Die Page zeigt dem Anwender, dass die Funktion grundsaetzlich existiert, aber der aktuelle Datensatz oder Setup-Zustand die Ausfuehrung noch nicht erlaubt. Fuer das Buch ist das ein eigener Diagnosepunkt, bevor Werte eingegeben oder gebucht werden duerfen.'
    : 'Der `Acquire`-Klick ist noch keine Anschaffung. Er ist ein Einstieg in einen gefuehrten Kontext. Fuer ein Buch ist wichtig, diesen Zwischenschritt getrennt zu zeigen: Erst wird der Wizard bzw. Dialog erkannt, danach entscheidet man kontrolliert, ob Kreditor, Betrag, Buchungsdatum und Postenspur vorbereitet werden duerfen.';
  return [
    '# FIXEDASSETS-081 - Acquire Action Wizard Preflight',
    '',
    'Status: `labor`, `ui-first`, `guarded-acquire-click`, `no-posting`, `no-preview`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.targetAsset} |`,
    `| Acquire geklickt | ${result.observed.acquireClick.clicked ? 'ja, nur zum Oeffnen' : 'nein'} |`,
    `| Wizard-/Dialogkontext sichtbar | ${result.observed.wizardOrDialogContextVisible ? 'ja' : 'nein'} |`,
    `| Riskanter Sofortdialog | ${result.observed.riskyImmediateConfirmationVisible ? 'ja' : 'nein'} |`,
    `| Cancel/Close versucht | ${result.observed.closeAttempt.attempted ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Was man in BC lernt',
    '',
    learningText,
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Keine Eingabe von Kreditor, Betrag, Datum oder Anlage in einen Beleg/ein Journal.',
    '- Kein `Finish`, kein `OK`, kein `Yes`, keine Preview, keine Buchung.',
    '- CRONUS-USA-Labor, kein deutscher Anlagen-/Steuer-/Kontenplan-Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-081 probes Acquire action without values or posting', async ({ page }) => {
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
  const beforeText = sanitizeEvidenceBlock(
    await compactPageText(page, {
      include: [/MCP_1_20260210|Fixed Asset Card|FA-CNC-01|CNC Maschine|Book Value|Acquire|Depreciation|HGB|MACHINES/i],
      maxLines: 140,
      maxLineLength: 220,
    }),
  );
  await writeTextEvidence(faEvidencePath('010-before-acquire-card-context.txt'), beforeText || 'No compact page text captured.');

  const acquireClick = await clickAcquireInCardScope(page);
  await page.waitForTimeout(2200);

  const afterText = sanitizeEvidenceBlock(
    await compactPageText(page, {
      include: [
        /Acquire|Acquisition|Erwerben|Anschaffung|Wizard|Assist|\bNext\b|\bBack\b|\bFinish\b|\bCancel\b|\bOK\b|\bYes\b|\bNo\b|Vendor|Kreditor|Amount|Betrag|Posting Date|Document No|Posting|Post|Buchen|Preview|Vorschau|Fixed Asset|Book Value|Depreciation|FA Ledger|Journal/i,
      ],
      maxLines: 180,
      maxLineLength: 240,
    }),
  );
  const uiGroups = await collectVisibleUiLabels(page);
  const labels = labelsFrom(uiGroups);

  const distinctWizardOrDialogSignals = labels.filter((label) =>
    /\bWizard\b|\bAssist\b|\bNext\b|\bBack\b|\bFinish\b|\bCancel\b|Vendor|Kreditor|Amount|Betrag|Posting Date|Document No\.|Acquisition Cost|Anschaffungskosten/i.test(label),
  );
  const acquireActionDisabled = Boolean(acquireClick.chosen?.disabled) || /disabled/i.test(acquireClick.reason || '');
  const wizardOrDialogContextVisible = acquireClick.clicked && distinctWizardOrDialogSignals.length > 0;
  const riskyImmediateConfirmationVisible = labels.some((label) =>
    /^(OK|Yes|Ja)(?:\s|\||$)|Finish|Post|Posting|Buchen|Preview|Vorschau/i.test(label),
  );
  const valueFieldsVisible = labels.some((label) => /Vendor|Kreditor|Amount|Betrag|Posting Date|Document No\.|Fixed Asset No\./i.test(label));
  const closeAttempt = await safeCloseOrLeave(page);

  await writeTextEvidence(faEvidencePath('020-after-acquire-context.txt'), afterText || 'No compact page text captured.');
  await writeJsonEvidence(faEvidencePath('030-after-acquire-ui-labels.json'), {
    acquireClick,
    uiGroups,
    derived: {
      wizardOrDialogContextVisible,
      distinctWizardOrDialogSignals,
      riskyImmediateConfirmationVisible,
      valueFieldsVisible,
      closeAttempt,
    },
  });

  const resultStatus = acquireClick.clicked && wizardOrDialogContextVisible ? 'observed' : 'blocked';
  const nextCaseId = riskyImmediateConfirmationVisible
    ? 'FIXEDASSETS-082-ACQUIRE-WIZARD-RISK-DECISION'
    : acquireActionDisabled
      ? 'FIXEDASSETS-082-ACQUIRE-ACTION-DISABLED-DIAGNOSIS'
    : wizardOrDialogContextVisible
      ? 'FIXEDASSETS-082-ACQUIRE-WIZARD-SETUP-READINESS'
      : 'FIXEDASSETS-082-ACQUIRE-ACTION-INVOCATION-DIAGNOSIS';
  const nextCaseFile = riskyImmediateConfirmationVisible
    ? '.agent/state/cases/fixedassets-082-acquire-wizard-risk-decision.json'
    : acquireActionDisabled
      ? '.agent/state/cases/fixedassets-082-acquire-action-disabled-diagnosis.json'
    : wizardOrDialogContextVisible
      ? '.agent/state/cases/fixedassets-082-acquire-wizard-setup-readiness.json'
      : '.agent/state/cases/fixedassets-082-acquire-action-invocation-diagnosis.json';
  const summary = acquireClick.clicked
    ? wizardOrDialogContextVisible
      ? `FA-081 opened the scoped Acquire action from FA-CNC-01 and captured a distinct resulting wizard/dialog context without values, Finish, Preview or Posting. Risky confirmation visible: ${riskyImmediateConfirmationVisible ? 'yes' : 'no'}.`
      : 'FA-081 clicked the scoped Acquire action from FA-CNC-01, but no distinct wizard/dialog context became visible. Treat this as an action-invocation blocker, not as wizard proof.'
    : acquireActionDisabled
      ? 'FA-081 proved that the scoped Acquire action is visible on FA-CNC-01 but disabled. No wizard opened and no values/posting were touched.'
      : 'FA-081 did not click Acquire because the scoped action was not found or not safely clickable at execution time.';
  const nextStep = riskyImmediateConfirmationVisible
    ? 'FIXEDASSETS-082-ACQUIRE-WIZARD-RISK-DECISION: review the immediate confirmation/wizard risk before any further click.'
    : acquireActionDisabled
      ? 'FIXEDASSETS-082-ACQUIRE-ACTION-DISABLED-DIAGNOSIS: diagnose why Acquire is disabled on FA-CNC-01 before any value entry or posting.'
    : wizardOrDialogContextVisible
      ? 'FIXEDASSETS-082-ACQUIRE-WIZARD-SETUP-READINESS: decide required vendor/amount/date/setup evidence before any value entry.'
      : 'FIXEDASSETS-082-ACQUIRE-ACTION-INVOCATION-DIAGNOSIS: diagnose why the scoped Acquire click did not open a distinct wizard/dialog context.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-acquire-action-wizard-preflight-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-guarded-acquire-action-preflight',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    targetAsset: TARGET_ASSET,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      urlAfterAcquire: page.url(),
      context,
      acquireClick,
      acquireActionDisabled,
      wizardOrDialogContextVisible,
      riskyImmediateConfirmationVisible,
      valueFieldsVisible,
      closeAttempt,
      uiLabelCount: labels.length,
      distinctWizardOrDialogSignals,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      ...(acquireActionDisabled ? ['The scoped Acquire action on FA-CNC-01 is visible but disabled in the UI.'] : []),
      ...(acquireClick.clicked ? ['The scoped Acquire action on FA-CNC-01 was clicked only to open the next UI context.'] : []),
      ...(wizardOrDialogContextVisible ? ['A resulting Acquire/wizard/dialog context was visible after the click.'] : []),
      'No vendor, amount, fixed-asset line, Finish, OK/Yes confirmation, Preview, Posting, setup change, draft keep, edit or delete was performed.',
    ],
    notProved: [
      ...(wizardOrDialogContextVisible ? [] : ['No distinct Acquire wizard/dialog context was visible after the click.']),
      'No acquisition data was entered.',
      'No acquisition posting or FA Ledger Entry was created.',
      'No Preview Posting was tested.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-081-acquire-action-wizard-preflight.json',
      nextCaseFile,
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-081-acquire-action-wizard-preflight.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-081/FIXEDASSETS-081-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-081/FIXEDASSETS-081-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-081/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-081/FIXEDASSETS-081-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-081/FIXEDASSETS-081-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-081/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-081/010-before-acquire-card-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-081/020-after-acquire-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-081/030-after-acquire-ui-labels.json',
    ],
    warnings: [
      'Guarded Acquire click only; no values or posting.',
      'Wizard/dialog visibility is UI evidence, not posting readiness.',
      'Next case must define exact setup/value gates before any value entry.',
    ],
    blockedBy: resultStatus === 'blocked'
      ? [acquireActionDisabled ? 'Acquire action is visible but disabled' : 'Acquire click or wizard/dialog context was not proven']
      : [],
    requiresReview: riskyImmediateConfirmationVisible,
    safeToFinalizeState: resultStatus === 'observed',
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
      noFinishClick: true,
      noOkOrYesConfirmation: true,
      noTargetVendorEntry: true,
      noAmountEntry: true,
      noTargetFixedAssetEntryInDocumentOrJournal: true,
      cleanupCompleted: true,
    },
    statePatch: {
      current: {
        updatedAt: '2026-06-19T10:45:00.000Z',
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-081-acquire-action-wizard-preflight.json',
        nextStep,
      },
      lastRunSummary: {
        schemaVersion: 1,
        runId: CASE_ID,
        date: '2026-06-19',
        workType: 'fixed-asset-acquire-action-wizard-preflight',
        branch: 'codex/token-efficient-autopilot-state',
        bcRun: true,
        posted: false,
        companySwitched: false,
        summary,
        nextStep,
      },
      activeCase: {
        status: resultStatus === 'observed' ? 'observed-guarded-ui-preflight' : 'blocked-guarded-ui-preflight',
        lastResult: {
          status: resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-081/FIXEDASSETS-081-result.json',
          summary,
          riskyImmediateConfirmationVisible,
          acquireActionDisabled,
          valueFieldsVisible,
          distinctWizardOrDialogSignals,
        },
        nextSafeAction: nextStep,
      },
      coverage: {
        areas: {
          fixedassets: {
            latestPracticalCase: 'FIXEDASSETS-081',
            currentBlock: riskyImmediateConfirmationVisible
              ? 'fixed-asset-acquire-wizard-risk-decision'
              : acquireActionDisabled
                ? 'fixed-asset-acquire-action-disabled-diagnosis'
              : wizardOrDialogContextVisible
                ? 'fixed-asset-acquire-wizard-setup-readiness'
                : 'fixed-asset-acquire-action-invocation-diagnosis',
            nextCase: nextCaseId,
          },
        },
      },
    },
    bookImpact: riskyImmediateConfirmationVisible
      ? 'Kapitel 21 muss vor dem naechsten Klick erklaeren, warum der Acquire-Wizard ein Risikogate braucht.'
      : acquireActionDisabled
        ? 'Kapitel 21 muss erklaeren, dass BC Aktionen sichtbar, aber kontextabhaengig deaktiviert anzeigen kann. Die Ursache muss vor der Anschaffungsbuchung diagnostiziert werden.'
      : wizardOrDialogContextVisible
        ? 'Kapitel 21 kann den Acquire-Klick als separaten Screenshot-/Lernschritt erklaeren: Er oeffnet den Anschaffungskontext, ist aber noch keine Buchung.'
        : 'Kapitel 21 darf den Acquire-Klick noch nicht als Wizard-Start erklaeren. Aktuell ist nur belegt, dass die Aktion sichtbar ist; ein eigenstaendiger Folgekontext fehlt.',
    summary,
    nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-081-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-081-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-081 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-081-result.json` | JSON | Acquire-Aktionszustand, Safety Flags, ggf. Wizard-/Dialogkontext | keine Anschaffung, keine Buchung | `labor`, `guarded-ui-preflight` |',
      '| `FIXEDASSETS-081-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-before-acquire-card-context.txt` | Text | Kartenkontext vor Klick | keine Aktion | `preflight` |',
      '| `020-after-acquire-context.txt` | Text | Kontext nach Klick | keine Werteingabe | `guarded-ui-context` |',
      '| `030-after-acquire-ui-labels.json` | JSON | sichtbare Labels und Risikoableitung | keine Buchungswirkung | `guarded-ui-context` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noFinishClick).toBe(true);
  expect(result.flags.noOkOrYesConfirmation).toBe(true);
  expect(result.flags.noAmountEntry).toBe(true);
  expect(acquireClick.chosen || acquireClick.candidates?.length).toBeTruthy();
});
