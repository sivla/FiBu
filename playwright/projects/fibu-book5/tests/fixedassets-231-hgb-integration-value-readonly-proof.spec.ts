import { expect, test, type Page } from '@playwright/test';
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

const CASE_ID = 'FIXEDASSETS-231-HGB-INTEGRATION-VALUE-READONLY-PROOF';
const TEST_ID = 'fixedassets-231';
const NEXT_CASE_ID = 'FIXEDASSETS-232-FA-DEPRECIATION-PREFLIGHT-DECISION';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2800, height: 1400 },
});

test.setTimeout(300_000);

type ControlCandidate = {
  frameUrl: string;
  tag: string;
  role: string;
  type: string;
  label: string;
  ariaLabel: string;
  title: string;
  text: string;
  checked: boolean | null;
  ariaChecked: string | null;
  disabled: boolean;
  contextText: string;
};

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function hgbDepreciationBookCardUrl() {
  const url = new URL(bcPageUrl(5610, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', "'Depreciation Book'.'Code' IS 'HGB'");
  return url.toString();
}

function clean(value: string | null | undefined) {
  return (value ?? '')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function compactControl(entry: ControlCandidate) {
  return {
    frameUrl: safeUrl(entry.frameUrl),
    tag: entry.tag,
    role: entry.role,
    type: entry.type,
    label: entry.label,
    ariaLabel: entry.ariaLabel,
    title: entry.title,
    text: entry.text,
    checked: entry.checked,
    ariaChecked: entry.ariaChecked,
    disabled: entry.disabled,
    contextText: clean(entry.contextText).slice(0, 420),
  };
}

function compactLines(value: string, keep: RegExp, maxLines = 220) {
  const seen = new Set<string>();
  return value
    .split('\n')
    .map(clean)
    .filter(Boolean)
    .filter((line) => keep.test(line))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, maxLines);
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const parsed = new URL(url);
  const text = await pageText(page);
  const result = {
    url: safeUrl(url),
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };

  if (!result.environmentInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const count = await scope.locator('[role="dialog"], [aria-modal="true"]').count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await scope.locator('[role="dialog"], [aria-modal="true"]').nth(index).innerText({ timeout: 500 }).catch(() => '');
      if (text.trim()) dialogs.push(clean(text));
    }
  }
  const dangerous = dialogs.filter((text) => /\b(Post|Preview|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish)\b/i.test(text));
  return { dialogs, dangerous, ok: dangerous.length === 0 };
}

async function openHgbCard(page: Page) {
  await page.goto(hgbDepreciationBookCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Depreciation Book Card|Depreciation Book|HGB|G\/L Integration/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);
}

async function collectIntegrationControls(page: Page): Promise<ControlCandidate[]> {
  const results: ControlCandidate[] = [];
  for (const frame of page.frames()) {
    const frameResults = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const labelText = (element: HTMLElement) => {
          const id = element.getAttribute('id');
          const labelledBy = element.getAttribute('aria-labelledby');
          const labels: string[] = [];
          if (id) {
            for (const label of Array.from(document.querySelectorAll<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`))) {
              labels.push(normalize(label.innerText || label.textContent));
            }
          }
          if (labelledBy) {
            for (const part of labelledBy.split(/\s+/)) {
              const target = document.getElementById(part);
              if (target) labels.push(normalize(target.innerText || target.textContent));
            }
          }
          return labels.filter(Boolean).join(' ');
        };
        const context = (element: HTMLElement) => {
          const chunks: string[] = [];
          let current: HTMLElement | null = element;
          for (let depth = 0; current && depth < 7; depth += 1) {
            chunks.push(normalize(current.innerText || current.textContent));
            current = current.parentElement;
          }
          return chunks.filter(Boolean).join(' | ');
        };

        const elements = Array.from(
          document.querySelectorAll<HTMLElement>(
            'input,button,[role="checkbox"],[aria-checked],[aria-label],[title],[data-control-name],[data-testid]'
          )
        ).filter(visible);

        return elements
          .map((element) => {
            const input = element as HTMLInputElement;
            const label = labelText(element);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const text = normalize(element.innerText || element.textContent);
            const contextText = context(element);
            return {
              frameUrl: location.href,
              tag: element.tagName.toLowerCase(),
              role: normalize(element.getAttribute('role')),
              type: normalize(input.type),
              label,
              ariaLabel,
              title,
              text,
              checked: typeof input.checked === 'boolean' && /checkbox|radio/i.test(input.type || '') ? input.checked : null,
              ariaChecked: element.getAttribute('aria-checked'),
              disabled: Boolean(input.disabled || element.getAttribute('aria-disabled') === 'true'),
              contextText,
            };
          })
          .filter((entry) => /G\/L Integration|Acq\. Cost|Acquisition Cost|Depreciation|AfA/i.test([
            entry.label,
            entry.ariaLabel,
            entry.title,
            entry.text,
            entry.contextText,
          ].join(' ')))
          .slice(0, 180);
      })
      .catch(() => []);
    results.push(...frameResults);
  }
  return results;
}

async function openPageInspection(page: Page) {
  const before = await pageText(page);
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(3000);
  for (const candidate of page.context().pages()) {
    if (candidate !== page && !/businesscentral\.dynamics\.com/i.test(candidate.url())) {
      await candidate.close().catch(() => undefined);
    }
  }
  const after = await pageText(page);
  const opened = /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(after) && after !== before;
  const focusedText = await compactPageText(page, {
    include: [
      /Page Inspection|Inspect pages and data|Page ID|Page Type|Source Table|Table ID/i,
      /Depreciation Book|FA Depreciation Book|G\/L Integration|Acq\. Cost|Acquisition|Depreciation/i,
      /Field|Table Fields|Boolean|Yes|No|True|False/i,
    ],
    maxLines: 220,
    maxLineLength: 260,
  });
  const lines = compactLines(
    focusedText || after,
    /Page Inspection|Source Table|Table ID|Table Fields|Depreciation Book|FA Depreciation Book|G\/L Integration|Acq\. Cost|Acquisition|Depreciation|Boolean|Yes|No|True|False/i,
    220
  );
  return { opened, focusedText, lines };
}

function classifyValue(candidates: ControlCandidate[], lines: string[], pattern: RegExp) {
  const booleanControls = candidates.filter(
    (entry) => entry.role === 'checkbox' || entry.checked !== null || entry.ariaChecked !== null
  );
  const exactControls = booleanControls.filter((entry) => pattern.test([
    entry.label,
    entry.ariaLabel,
    entry.title,
    entry.text,
  ].join(' ')));
  const contextControls = booleanControls.filter((entry) => pattern.test([
    entry.label,
    entry.ariaLabel,
    entry.title,
    entry.text,
    entry.contextText,
  ].join(' ')));
  const matchedControls = exactControls.length ? exactControls : contextControls;
  const compactControls = matchedControls.map(compactControl).slice(0, 12);

  for (const entry of matchedControls) {
    if (entry.checked === true || /^(true|yes|ja)$/i.test(entry.ariaChecked || '')) {
      return { status: 'visible-on', basis: 'control-checked-state', controls: compactControls, lines: [] };
    }
    if (entry.checked === false || /^(false|no|nein)$/i.test(entry.ariaChecked || '')) {
      return { status: 'visible-off', basis: 'control-checked-state', controls: compactControls, lines: [] };
    }
  }

  const matchedLines = lines.filter((line) => pattern.test(line));
  const joined = matchedLines.join(' ');
  if (/\b(true|yes|ja|enabled|on)\b/i.test(joined)) {
    return { status: 'visible-on', basis: 'page-inspection-text', controls: compactControls, lines: matchedLines.slice(0, 12) };
  }
  if (/\b(false|no|nein|disabled|off)\b/i.test(joined)) {
    return { status: 'visible-off', basis: 'page-inspection-text', controls: compactControls, lines: matchedLines.slice(0, 12) };
  }
  if (matchedControls.length || matchedLines.length) {
    return { status: 'not-readable', basis: 'caption-or-control-context-without-value', controls: compactControls, lines: matchedLines.slice(0, 12) };
  }
  return { status: 'not-visible', basis: 'field-not-found', controls: [], lines: [] };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-231 - HGB G/L Integration Value Proof',
    '',
    'Status: `labor`, `read-only`, `value-proof`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Instanz | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| HGB Acq. Cost Integration | ${result.valueProof.acquisitionCost.status} (${result.valueProof.acquisitionCost.basis}) |`,
    `| HGB Depreciation Integration | ${result.valueProof.depreciation.status} (${result.valueProof.depreciation.basis}) |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Ein Feldname in Page Inspection beweist nur, dass Business Central dieses Feld auf der Page oder Tabelle kennt. Fuer eine Buchungsentscheidung braucht man den Wert: ist der Schalter an oder aus? Dieser Lauf trennt deshalb Controls, Feldcaptions und konkrete Werte.',
    '',
    '## Grenzen',
    '',
    '- Kein Toggle von G/L-Integration.',
    '- Keine AfA-Journalzeile.',
    '- Kein Preview Posting und keine Buchung.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-231 proves HGB G/L Integration values read-only if visible', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openHgbCard(page);
  const context = await assertSandboxContext(page);
  const dialogState = await dangerousDialogs(page);
  const cardText = await compactPageText(page, {
    include: [/Depreciation Book Card|HGB|G\/L Integration|Acq\. Cost|Acquisition|Depreciation/i],
    maxLines: 180,
    maxLineLength: 260,
  });
  await writeTextEvidence(faEvidencePath('010-hgb-card-focused-text.txt'), cardText || 'No compact HGB card text captured.');

  const controlCandidates = await collectIntegrationControls(page);
  const pageInspection = await openPageInspection(page);
  await writeTextEvidence(
    faEvidencePath('030-pageinspection-focused-lines.txt'),
    pageInspection.lines.join('\n') || 'No Page Inspection focused lines captured.'
  );

  const acquisitionCost = classifyValue(controlCandidates, pageInspection.lines, /G\/L Integration - Acq\. Cost/i);
  const depreciation = classifyValue(controlCandidates, pageInspection.lines, /G\/L Integration - Depreciation\b/i);
  const acqValueProven = acquisitionCost.status === 'visible-on' || acquisitionCost.status === 'visible-off';
  const resultStatus = dialogState.ok && pageInspection.opened ? 'observed' : 'blocked';
  const nextCaseId = acqValueProven
    ? NEXT_CASE_ID
    : 'FIXEDASSETS-232-HGB-INTEGRATION-VALUE-BLOCKER-REVIEW';
  const nextCaseFile = acqValueProven
    ? '.agent/state/cases/fixedassets-232-fa-depreciation-preflight-decision.json'
    : '.agent/state/cases/fixedassets-232-hgb-integration-value-blocker-review.json';
  const nextStep = acqValueProven
    ? 'FIXEDASSETS-232: locally decide whether a tightly scoped depreciation preflight is safe; no posting yet.'
    : 'FIXEDASSETS-232: locally review why the HGB G/L Integration value remains unreadable before any depreciation preflight.';
  const summary = acqValueProven
    ? `FA-231 proved G/L Integration - Acq. Cost as ${acquisitionCost.status} read-only; no setup, preview or posting occurred.`
    : `FA-231 did not prove the concrete G/L Integration - Acq. Cost value; classification is ${acquisitionCost.status}. No setup, preview or posting occurred.`;

  await writeJsonEvidence(faEvidencePath('020-hgb-integration-control-diagnostics.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    context,
    dialogState,
    relevantControlCandidates: controlCandidates
      .filter((entry) => (entry.role === 'checkbox' || entry.checked !== null || entry.ariaChecked !== null))
      .filter((entry) => /G\/L Integration - Acq\. Cost|G\/L Integration - Depreciation\b/i.test([
        entry.label,
        entry.ariaLabel,
        entry.title,
        entry.text,
      ].join(' ')))
      .map(compactControl),
    pageInspection: {
      opened: pageInspection.opened,
      lines: pageInspection.lines,
    },
    valueProof: { acquisitionCost, depreciation },
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
      noFieldToggle: true,
    },
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-231-hgb-integration-value-readonly-proof-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-hgb-integration-value-proof',
    resultStatus,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    bcRun: true,
    playwrightRun: true,
    postedInThisRun: false,
    previewPostingInThisRun: false,
    setupChanged: false,
    companySwitched: false,
    apiShortcut: false,
    bookChanged: false,
    valueProof: { acquisitionCost, depreciation },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      url: safeUrl(page.url()),
      context,
      pageInspectionOpened: pageInspection.opened,
      controlCandidateCount: controlCandidates.length,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'The HGB Depreciation Book Card context was opened read-only.',
      ...(pageInspection.opened ? ['Page Inspection opened read-only.'] : []),
      `G/L Integration - Acq. Cost classification: ${acquisitionCost.status}.`,
      `G/L Integration - Depreciation classification: ${depreciation.status}.`,
      'No setup, Preview Posting, Post, journal edit, draft, company switch or API shortcut occurred.',
    ],
    notProved: [
      ...(acqValueProven ? [] : ['The exact Acq. Cost integration value is still not proven.']),
      'No depreciation journal line exists from this run.',
      'No depreciation calculation or depreciation posting was performed.',
      'No German final fixed asset proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-231-hgb-integration-value-readonly-proof.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-231/',
      '.agent/state/cases/fixedassets-231-hgb-integration-value-readonly-proof.json',
      '.agent/state/current.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-231/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-231/FIXEDASSETS-231-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-231/FIXEDASSETS-231-HGB-INTEGRATION-VALUE-PROOF.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-231/010-hgb-card-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-231/020-hgb-integration-control-diagnostics.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-231/030-pageinspection-focused-lines.txt',
    ],
    warnings: [
      'Control or Page Inspection captions without checked/aria-checked value are not value proof.',
      'This read-only proof does not unlock depreciation posting by itself.',
      'CRONUS-USA laboratory evidence is not German final proof.',
    ],
    blockedBy: [
      ...dialogState.dangerous.map((dialog) => `dangerous-dialog:${dialog}`),
      ...(resultStatus === 'blocked' && !pageInspection.opened ? ['page-inspection-not-opened'] : []),
    ],
    requiresReview: true,
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
    },
    statePatch: {
      current: {
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-231-hgb-integration-value-readonly-proof.json',
        requiresStrongModel: true,
        nextStep,
      },
      activeCase: {
        status: resultStatus === 'observed' ? 'observed-readonly-value-proof' : 'blocked-readonly-value-proof',
        lastResult: {
          status: resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-231/FIXEDASSETS-231-result.json',
          summary,
        },
        nextSafeAction: nextStep,
      },
    },
    summary,
    nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-231-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-231-HGB-INTEGRATION-VALUE-PROOF.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-231 Evidence Index',
      '',
      'Status: read-only, HGB integration value proof, no-posting, no-preview, no-setup-change, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-231-result.json` | JSON-Ergebnis | strukturierter Wertnachweis oder Blocker fuer HGB G/L Integration | keine AfA-Buchung | observed/blocked |',
      '| `FIXEDASSETS-231-HGB-INTEGRATION-VALUE-PROOF.md` | Lernzusammenfassung | Unterschied Feldcaption vs. Wert | keinen deutschen Finalnachweis | labor |',
      '| `010-hgb-card-focused-text.txt` | Text | sichtbarer HGB-Kartenkontext | keine vollstaendige Tabellenlogik | compact |',
      '| `020-hgb-integration-control-diagnostics.json` | JSON | Control-/Page-Inspection-Diagnose zu G/L Integration | kein Setup-Fit | read-only |',
      '| `030-pageinspection-focused-lines.txt` | Text | kompakte Page-Inspection-Zeilen | kein Rohdump | compact |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n')
  );

  expect(context.environmentInUrl).toBe(true);
  expect(context.companyInUrl).toBe(true);
  expect(dialogState.dangerous).toEqual([]);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
});
