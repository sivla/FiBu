import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-164-FA-POSTING-GROUP-BALACCOUNT-FIELD-PROOF';
const NEXT_CASE_ID_IF_PROVED = 'FIXEDASSETS-165-FA-GL-JOURNAL-VALUE-PREFLIGHT';
const NEXT_CASE_ID_IF_GAP = 'FIXEDASSETS-165-FA-BALACCOUNT-SETUP-DECISION';
const TEST_ID = 'fixedassets-164';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_POSTING_GROUPS_PAGE_ID = 5612;
const TARGET_GROUP = 'MACHINES';
const TARGET_FIELD = 'Acquisition Cost Bal. Acc.';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(240_000);

type FieldPair = {
  label: string;
  value: string;
  aria: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nearbyText: string;
};

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
    url.searchParams.delete(key);
  }
  return url.toString();
}

function faPostingGroupsUrl() {
  const url = new URL(bcPageUrl(FA_POSTING_GROUPS_PAGE_ID, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', `'FA Posting Group'.'Code' IS '${TARGET_GROUP}'`);
  return url.toString();
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function isSafeEvidenceLine(line: string) {
  return !/requestExecutorSettings|allowedEndpoints|allowedResources|tokenFactory|O365MSAL|clientId|upn|originAuthorityValidator|playwright\/\.auth|storageState|aadTenantId|startTraceId|Verwenden Sie die NACH-LINKS|resize|Gro e anzupassen/i.test(line);
}

function compactFocusedLines(text: string, extraLines: string[] = []) {
  const interesting = /FA Posting Group|MACHINES|Acquisition Cost|Bal\. Acc|Balancing Account|12210|82000|Account/i;
  const allLines = [...text.split('\n'), ...extraLines]
    .map((line) => normalizeText(line))
    .filter(Boolean)
    .filter(isSafeEvidenceLine);
  return [
    `Kompakter, sanitizter Auszug; keine Rohseite, keine Auth-/Shell-Artefakte. Ausgewertete Zeilen: ${allLines.length}.`,
    '',
    ...[...new Set(allLines.filter((line) => interesting.test(line)).slice(0, 160))],
  ].join('\n');
}

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const text = await pageText(page);
  return {
    url: safeUrl(url),
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
}

async function findFaPostingGroupsFrame(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1500 }).catch(() => '');
    if (/FA Posting Group|Anlagenbuchungsgruppe/i.test(body) && /MACHINES/i.test(body)) {
      return frame;
    }
  }
  return undefined;
}

async function scrollToBalancingArea(frame: Frame) {
  const caption = frame.getByText(/Acquisition Cost Bal\. Acc\./i).first();
  if (await caption.isVisible({ timeout: 1000 }).catch(() => false)) {
    await caption.scrollIntoViewIfNeeded().catch(() => undefined);
    await frame.page().waitForTimeout(500);
    return true;
  }
  await frame.page().mouse.wheel(0, 650);
  await frame.page().waitForTimeout(500);
  return false;
}

async function readFaPostingGroupSignals(frame: Frame) {
  return frame.evaluate((targetField) => {
    function clean(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    const bodyText = clean(document.body?.innerText || document.body?.textContent || '');
    const labels = [...document.querySelectorAll<HTMLElement>('label,span,div')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: clean(element.innerText || element.textContent),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((label) => label.text);

    const inputs = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea')]
      .filter(visible)
      .map((input) => {
        const rect = input.getBoundingClientRect();
        let container: Element | null = input;
        for (let depth = 0; depth < 5 && container?.parentElement; depth += 1) {
          container = container.parentElement;
        }
        const nearbyLabels = labels
          .filter((label) => Math.abs(label.y - Math.round(rect.y)) <= 28 || (label.y <= rect.y && rect.y - label.y <= 55))
          .sort((left, right) => Math.abs(left.y - rect.y) + Math.abs(left.x - rect.x) / 10 - (Math.abs(right.y - rect.y) + Math.abs(right.x - rect.x) / 10))
          .slice(0, 5)
          .map((label) => label.text);
        return {
          label: nearbyLabels.find((text) => /Acquisition Cost Bal\. Acc\./i.test(text)) ?? nearbyLabels[0] ?? '',
          value: clean(input.value || ''),
          aria: clean(input.getAttribute('aria-label')),
          title: clean(input.getAttribute('title')),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          nearbyText: clean(`${nearbyLabels.join(' | ')} | ${container?.textContent ?? ''}`).slice(0, 420),
        };
      });

    const relevantFields = inputs.filter((field) =>
      /Acquisition Cost Bal\. Acc|Acquisition Cost Account|Depreciation Expense Acc|Write-Down Expense Acc|Balancing Account|MACHINES|12210|82000/i.test(
        `${field.label} ${field.aria} ${field.title} ${field.value} ${field.nearbyText}`,
      ),
    );

    const targetPairs = relevantFields.filter((field) =>
      new RegExp(targetField.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(
        `${field.label} ${field.aria} ${field.title} ${field.nearbyText}`,
      ),
    );
    const targetPair = targetPairs.find((field) => /\b\d{5}\b/.test(field.value)) ?? targetPairs[0] ?? null;
    const accountSignals = [...new Set(bodyText.match(/\b\d{5}\b/g) ?? [])];

    return {
      pageContextVisible: /FA Posting Group Card|FA Posting Groups|FA Posting Group/i.test(bodyText),
      machinesVisible: /\bMACHINES\b/i.test(bodyText),
      targetFieldCaptionVisible: /Acquisition Cost Bal\. Acc\./i.test(bodyText),
      balancingSectionVisible: /Balancing Account/i.test(bodyText),
      accountSignals,
      targetPairs,
      targetPair,
      relevantFields: relevantFields.slice(0, 60),
      focusedLines: bodyText
        .split(/\s{2,}|\n/)
        .map((line) => clean(line))
        .filter((line) => /FA Posting Group|MACHINES|Acquisition Cost|Bal\. Acc|Balancing Account|12210|82000|Account/i.test(line))
        .slice(0, 120),
    };
  }, TARGET_FIELD);
}

function makeStatePatch(status: string, exactBalAccountFieldProved: boolean, summary: string) {
  const nextCase = exactBalAccountFieldProved ? NEXT_CASE_ID_IF_PROVED : NEXT_CASE_ID_IF_GAP;
  const nextCaseFile = exactBalAccountFieldProved
    ? '.agent/state/cases/fixedassets-165-fa-gl-journal-value-preflight.json'
    : '.agent/state/cases/fixedassets-165-fa-balaccount-setup-decision.json';
  return {
    current: {
      activeCase: nextCase,
      active_case_file: nextCaseFile,
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-164-fa-posting-group-balaccount-field-proof.json',
      requiresStrongModel: !exactBalAccountFieldProved,
      nextStep: exactBalAccountFieldProved
        ? 'FIXEDASSETS-165: guarded FA G/L Journal value preflight with the proven G/L balancing account; still no Preview Posting or Post without its own gate.'
        : 'FIXEDASSETS-165: decide the FA balancing-account setup route because Acquisition Cost Bal. Acc. is visible but no concrete value is proven.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fa-posting-group-balaccount-field-proof-readonly',
      taskClass: 'wizard_work',
      modelClass: 'gpt-4-medium',
      branch: 'codex/token-efficient-autopilot-state',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      bcRun: true,
      playwrightRun: true,
      posted: false,
      previewPosting: false,
      setupChanged: false,
      companySwitched: false,
      apiShortcut: false,
      bookChanged: false,
      dataChanged: false,
      resultStatus: status,
      summary,
      nextStep: exactBalAccountFieldProved
        ? 'Prepare a guarded FA G/L Journal value preflight with the proven G/L account.'
        : 'Run a setup-route decision before entering any FA G/L Journal value.',
    },
    activeCase: {
      status,
      lastResult: {
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-164/FIXEDASSETS-164-result.json',
        exactBalAccountFieldProved,
        summary,
      },
      nextSafeAction: exactBalAccountFieldProved
        ? 'A guarded value-preflight may be planned, but no Preview Posting or Post is unlocked by this case alone.'
        : 'Do not enter values. Decide whether the blank balancing account is intentional or needs a documented setup fit.',
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: exactBalAccountFieldProved ? 'fa-gl-journal-value-preflight' : 'fa-balaccount-setup-decision',
          latestPracticalCase: CASE_ID,
          nextCase,
          bookScreenshots: {
            acquisitionPostingTrace: exactBalAccountFieldProved
              ? 'fa-gl-journal-value-preflight-ready-no-preview-yet'
              : 'blocked-fa-posting-group-balancing-account-value-missing',
          },
        },
      },
      fixedAssets: {
        faCnc01: {
          nextAcquisitionRoute: exactBalAccountFieldProved ? 'fa-gl-journal-value-preflight' : 'fa-balaccount-setup-decision',
          acquisitionUnlocked: false,
        },
      },
    },
  };
}

test('FIXEDASSETS-164 proves FA Posting Group acquisition-cost balancing field read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let signals: Awaited<ReturnType<typeof readFaPostingGroupSignals>> | undefined;
  let screenshotCaptured = false;

  try {
    await page.goto(faPostingGroupsUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);
    await page.waitForTimeout(1800);

    context = await sandboxContext(page);
    if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context: ${JSON.stringify(context)}`);
    }

    const frame = await findFaPostingGroupsFrame(page);
    if (!frame) {
      blockedBy.push('FA Posting Groups page/card with MACHINES was not found.');
    } else {
      await scrollToBalancingArea(frame);
      signals = await readFaPostingGroupSignals(frame);
      signals.focusedLines = signals.focusedLines.filter(isSafeEvidenceLine);
      if (!signals.pageContextVisible || !signals.machinesVisible) {
        blockedBy.push('Foreground context did not prove FA Posting Group Card/List with MACHINES.');
      }
      if (!signals.targetFieldCaptionVisible) {
        blockedBy.push('Acquisition Cost Bal. Acc. caption was not visible/readable.');
      }
      await screenshot(page, 'fixedassets-164-010-fa-posting-group-balaccount-field-proof.png', {
        projectName: project.name,
        testId: TEST_ID,
        status: signals.targetPair?.value ? 'labor' : 'candidate',
        bookUse: signals.targetPair?.value ? 'setup-field-proof' : 'debugging',
        purpose:
          'Read-only Kontrollbild: FA Posting Group MACHINES im Balancing-Account-Bereich, um Acquisition Cost Bal. Acc. sichtbar zu pruefen.',
        expectedPageText: [/FA Posting Group|FA Posting Groups/i, /\bMACHINES\b/i, /Acquisition Cost Bal\. Acc\./i],
        knownLimitations: [
          'Keine Werteingabe.',
          'Keine Setup-Aenderung.',
          'Keine Preview Posting.',
          'Keine Buchung.',
          'Kein deutscher Finalnachweis.',
        ],
      });
      screenshotCaptured = true;
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message.split('\n').slice(0, 2).join(' ') : String(error));
  }

  const targetValue = signals?.targetPair?.value ?? '';
  const exactBalAccountFieldProved = Boolean(signals?.targetFieldCaptionVisible && /\b\d{5}\b/.test(targetValue));
  const resultStatus = blockedBy.length > 0 ? 'blocked' : exactBalAccountFieldProved ? 'observed' : 'observed-readonly-gap';
  const summary = exactBalAccountFieldProved
    ? `FA Posting Group ${TARGET_GROUP} shows ${TARGET_FIELD} = ${targetValue} in the visible read-only setup context.`
    : signals?.targetFieldCaptionVisible
      ? `FA Posting Group ${TARGET_GROUP} shows the field ${TARGET_FIELD}, but no concrete account value is visible/proven next to it.`
      : `FA Posting Group ${TARGET_GROUP} did not produce a usable ${TARGET_FIELD} field proof.`;
  const patch = makeStatePatch(resultStatus, exactBalAccountFieldProved, summary);

  await writeJsonEvidence(faEvidencePath('010-fa-posting-group-balaccount-field-proof.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-164-fa-posting-group-balaccount-field-proof',
    caseId: CASE_ID,
    context,
    target: {
      page: 'FA Posting Groups',
      pageId: FA_POSTING_GROUPS_PAGE_ID,
      postingGroup: TARGET_GROUP,
      field: TARGET_FIELD,
    },
    signals,
    evaluation: {
      targetValue,
      targetValueIsConcreteGlAccount: /\b\d{5}\b/.test(targetValue),
      exactBalAccountFieldProved,
      safeForValueEntry: false,
    },
    screenshotCaptured,
    blockedBy,
    omitted: 'No full DOM dump, traces, videos, reports, storage state, auth artifact or raw shell text stored.',
  });

  await writeTextEvidence(
    faEvidencePath('020-focused-balaccount-text.txt'),
    compactFocusedLines(await pageText(page), [
      ...(signals?.focusedLines ?? []),
      ...(signals?.targetPairs ?? []).map((field: FieldPair) => `${field.label} | ${field.value} | ${field.nearbyText}`),
    ]),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-posting-group-balaccount-field-proof-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-diagnosis',
    resultStatus,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      context,
      urlAfterRun: safeUrl(page.url()),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(signals?.pageContextVisible ? ['FA Posting Groups/Card context was reached read-only.'] : []),
      ...(signals?.machinesVisible ? ['FA Posting Group MACHINES was visible in the setup context.'] : []),
      ...(signals?.targetFieldCaptionVisible ? ['The Acquisition Cost Bal. Acc. caption was visible/readable.'] : []),
      ...(exactBalAccountFieldProved ? [`The target field has a concrete visible account value: ${targetValue}.`] : []),
      'No amount was entered.',
      'No balancing account was entered.',
      'No setup value was changed.',
      'No Preview Posting was opened.',
      'No posting was executed.',
    ],
    notProved: [
      ...(exactBalAccountFieldProved ? [] : ['No concrete Acquisition Cost Bal. Acc. account value was proven.']),
      'No FA G/L Journal value-entry readiness.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-164-fa-posting-group-balaccount-field-proof.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-164/',
      'playwright/projects/fibu-book5/img/fixedassets-164-010-fa-posting-group-balaccount-field-proof.png',
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-164-fa-posting-group-balaccount-field-proof.json',
      '.agent/state/cases/fixedassets-165-fa-balaccount-setup-decision.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'playwright/projects/fibu-book5/CURRENT-STATE.md',
      'playwright/projects/fibu-book5/LAB-FIT-STATUS.md',
      'playwright/projects/fibu-book5/BOOK-CLICK-GUIDE-COVERAGE.md',
      'playwright/projects/fibu-book5/SCREENSHOT-QA.md',
      'playwright/projects/fibu-book5/WORKAROUNDS-AND-ERRORS.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-164/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-164/010-fa-posting-group-balaccount-field-proof.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-164/020-focused-balaccount-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-164/FIXEDASSETS-164-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-164/FIXEDASSETS-164-result.json',
      'playwright/projects/fibu-book5/img/fixedassets-164-010-fa-posting-group-balaccount-field-proof.png',
    ],
    evaluation: {
      targetValue,
      exactBalAccountFieldProved,
      safeForValueEntry: false,
      accountSignals: signals?.accountSignals ?? [],
    },
    warnings: [
      'This is read-only setup evidence.',
      'A visible caption without a value does not unlock FA G/L Journal value entry.',
      'Do not enter Amount or Bal. Account No. until a separate case explicitly unlocks it.',
    ],
    blockedBy,
    requiresReview: !exactBalAccountFieldProved,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      noValueEntry: true,
      noInsertLine: true,
      noDeleteLine: true,
      noCleanup: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-164-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-164-learning.md'),
    [
      '# FIXEDASSETS-164 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `setup-field-proof`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Die FA Posting Group ist nicht nur ein Code auf der Anlagenkarte. Sie enthaelt die Kontenfindung fuer Zugang, Abschreibung, Abgang und Gegenkonten. Ein sichtbares Konto in derselben Page reicht nicht automatisch: Fuer eine sichere Journalwerteingabe muss das konkrete Feld mit seinem konkreten Wert gemeinsam nachgewiesen sein.',
      '',
      '## Buchwirkung',
      '',
      exactBalAccountFieldProved
        ? 'Kapitel 21 kann den Screenshot als Labor-Setupbild fuer das konkrete Acquisition-Cost-Balancing-Konto nutzen. Eine Journalwerteingabe braucht trotzdem ein eigenes Gate.'
        : 'Kapitel 21 sollte diesen Zustand als Anfaenger-/Debuggingfall erklaeren: Das Feld ist sichtbar, aber leer oder nicht wertbelegt. Dadurch ist ein blindes Gegenkonto im FA G/L Journal fachlich nicht freigegeben.',
      '',
      '## Grenzen',
      '',
      '- Keine Werteingabe.',
      '- Keine Setup-Aenderung.',
      '- Keine Preview Posting.',
      '- Keine Buchung.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-164 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-fa-posting-group-balaccount-field-proof.json` | JSON | FA Posting Group `MACHINES`, Feldcaption und ggf. Wertsignale | keine Werteingabe, keine Buchung | `labor`, `read-only` |',
      '| `020-focused-balaccount-text.txt` | Text | kompakter sanitizter Feld-/Kontenauszug | kein Rohdump, keine Auth-/Shell-Artefakte | `compact` |',
      '| `fixedassets-164-010-fa-posting-group-balaccount-field-proof.screenshot.json` | Screenshot-Metadaten | Zweck/Grenzen des Kontrollbildes | keine eigenstaendige fachliche Wahrheit ohne JSON | `candidate/labor` |',
      '| `FIXEDASSETS-164-learning.md` | Markdown | Lernwert fuer Kontenfindung/Gegenkonto-Gate | keinen deutschen Finalstand | `labor` |',
      '| `FIXEDASSETS-164-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noValueEntry).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(signals?.pageContextVisible).toBe(true);
  expect(signals?.machinesVisible).toBe(true);
});
