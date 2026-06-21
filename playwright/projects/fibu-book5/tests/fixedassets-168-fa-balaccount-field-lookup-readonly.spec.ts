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

const CASE_ID = 'FIXEDASSETS-168-FA-BALACCOUNT-FIELD-LOOKUP-READONLY';
const TEST_ID = 'fixedassets-168';
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

function faPostingGroupsUrl(filterToMachines = false) {
  const url = new URL(bcPageUrl(FA_POSTING_GROUPS_PAGE_ID, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  if (filterToMachines) {
    url.searchParams.set('filter', `'FA Posting Group'.'Code' IS '${TARGET_GROUP}'`);
  }
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
  return !/requestExecutorSettings|allowedEndpoints|allowedResources|tokenFactory|O365MSAL|clientId|upn|originAuthorityValidator|playwright\/\.auth|storageState|aadTenantId|startTraceId|resize|Gro e anzupassen/i.test(
    line,
  );
}

function compactLines(text: string, extraLines: string[] = []) {
  const interesting =
    /FA Posting Group|FA Posting Groups|MACHINES|EQUIPMENT|Acquisition Cost|Bal\. Acc|Balancing Account|12210|82000|14160|11400|Account/i;
  const lines = [...text.split('\n'), ...extraLines]
    .map((line) => normalizeText(line))
    .filter(Boolean)
    .filter(isSafeEvidenceLine);
  return [
    `Kompakter, sanitizter Auszug; keine Rohseite, keine Auth-/Shell-Artefakte. Ausgewertete Zeilen: ${lines.length}.`,
    '',
    ...[...new Set(lines.filter((line) => interesting.test(line)).slice(0, 180))],
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

async function openFaPostingGroups(page: Page, filterToMachines = false) {
  await page.goto(faPostingGroupsUrl(filterToMachines), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2200);
}

async function findFaPostingGroupsFrame(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1500 }).catch(() => '');
    if (/FA Posting Group|Anlagenbuchungsgruppe/i.test(body)) {
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

async function readVisibleFaSignals(frame: Frame) {
  return frame.evaluate((targetCaption) => {
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
          .filter((label) => Math.abs(label.y - Math.round(rect.y)) <= 30 || (label.y <= rect.y && rect.y - label.y <= 60))
          .sort(
            (left, right) =>
              Math.abs(left.y - rect.y) +
              Math.abs(left.x - rect.x) / 10 -
              (Math.abs(right.y - rect.y) + Math.abs(right.x - rect.x) / 10),
          )
          .slice(0, 6)
          .map((label) => label.text);
        return {
          label: nearbyLabels.find((text) => /Acquisition Cost Bal\. Acc\./i.test(text)) ?? nearbyLabels[0] ?? '',
          value: clean(input.value || ''),
          aria: clean(input.getAttribute('aria-label')),
          title: clean(input.getAttribute('title')),
          role: clean(input.getAttribute('role')),
          readOnly: input.readOnly || input.getAttribute('aria-readonly') === 'true',
          disabled: input.disabled || input.getAttribute('aria-disabled') === 'true',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          nearbyText: clean(`${nearbyLabels.join(' | ')} | ${container?.textContent ?? ''}`).slice(0, 520),
        };
      });

    const buttons = [...document.querySelectorAll<HTMLElement>('button,[role="button"],a')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: clean(element.innerText || element.textContent),
          aria: clean(element.getAttribute('aria-label')),
          title: clean(element.getAttribute('title')),
          role: clean(element.getAttribute('role') || element.tagName.toLowerCase()),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });

    const targetFields = inputs.filter((field) =>
      new RegExp(targetCaption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(
        `${field.label} ${field.aria} ${field.title} ${field.nearbyText}`,
      ),
    );
    const escapedTargetCaption = targetCaption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const targetFieldTextValue = bodyText.match(new RegExp(`${escapedTargetCaption}\\s+(\\d{5})\\b`, 'i'))?.[1] ?? '';
    const targetField = targetFields.find((field) => /\b\d{5}\b/.test(field.value)) ?? targetFields[0] ?? null;
    const nearbyLookupButtons = targetField
      ? buttons.filter((button) => Math.abs(button.y - targetField.y) <= 35 && button.x >= targetField.x)
      : [];

    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"], tr, [data-control-name], [data-testid]')]
      .map((element) => clean(element.innerText || element.textContent))
      .filter((line) => /\b(MACHINES|EQUIPMENT|PLANT|PROPERTY|VEHICLES)\b|Acquisition Cost|Bal\. Acc|12210|82000/i.test(line))
      .slice(0, 80);

    return {
      pageContextVisible: /FA Posting Group Card|FA Posting Groups|FA Posting Group/i.test(bodyText),
      machinesVisible: /\bMACHINES\b/i.test(bodyText),
      targetFieldCaptionVisible: /Acquisition Cost Bal\. Acc\./i.test(bodyText),
      balancingSectionVisible: /Balancing Account/i.test(bodyText),
      accountSignals: [...new Set(bodyText.match(/\b\d{5}\b/g) ?? [])],
      targetFields,
      targetField,
      targetFieldTextValue,
      nearbyLookupButtons,
      rows,
      focusedLines: bodyText
        .split(/\s{2,}|\n/)
        .map((line) => clean(line))
        .filter((line) => /FA Posting Group|MACHINES|EQUIPMENT|Acquisition Cost|Bal\. Acc|Balancing Account|12210|82000|14160|11400|Account/i.test(line))
        .slice(0, 140),
    };
  }, TARGET_FIELD);
}

type VisiblePattern = {
  code: string;
  visibleAccounts: string[];
  rawText: string;
};

function extractPatternsFromText(text: string) {
  const rows = new Map<string, VisiblePattern>();
  const lines = text
    .split('\n')
    .map((line) => normalizeText(line.replace(/\s+/g, ' ')))
    .filter((line) => /\b(MACHINES|EQUIPMENT|PLANT|PROPERTY|VEHICLES|GOODWILL)\b/i.test(line));
  for (const line of lines) {
    const code = line.match(/\b(MACHINES|EQUIPMENT|PLANT|PROPERTY|VEHICLES|GOODWILL)\b/i)?.[1]?.toUpperCase();
    if (!code) continue;
    const row = {
      code,
      visibleAccounts: [...new Set(line.match(/\b\d{5}\b/g) ?? [])],
      rawText: line.slice(0, 420),
    };
    const existing = rows.get(code);
    if (!existing || row.visibleAccounts.length > existing.visibleAccounts.length) {
      rows.set(code, row);
    }
  }
  return [...rows.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function makeStatePatch(resultStatus: string, setupFitUnlocked: boolean, summary: string) {
  const nextCase = setupFitUnlocked
    ? 'FIXEDASSETS-169-FA-BALACCOUNT-SETUP-FIT-GATE'
    : 'FIXEDASSETS-169-FA-BALACCOUNT-LOOKUP-RESULT-DECISION';
  return {
    current: {
      activeCase: nextCase,
      active_case_file: setupFitUnlocked
        ? '.agent/state/cases/fixedassets-169-fa-balaccount-setup-fit-gate.json'
        : '.agent/state/cases/fixedassets-169-fa-balaccount-lookup-result-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-168-fa-balaccount-field-lookup-readonly.json',
      requiresStrongModel: true,
      nextStep: setupFitUnlocked
        ? 'FIXEDASSETS-169: locally decide whether the read-only field/pattern evidence is enough to unlock exactly one UI-first setup-fit; still no journal values, no Preview Posting and no Post.'
        : 'FIXEDASSETS-169: locally review the read-only field/pattern evidence and decide whether a different proof route is needed; no setup write, no journal values, no Preview Posting and no Post.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-21',
      workType: 'fa-balaccount-field-lookup-readonly',
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
      resultStatus,
      summary,
      nextStep: setupFitUnlocked
        ? 'Run local setup-fit gate decision before any setup write.'
        : 'Run local lookup-result decision before any further write route.',
    },
    activeCase: {
      status: resultStatus,
      lastResult: {
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-168/FIXEDASSETS-168-result.json',
        setupFitUnlocked,
        summary,
      },
      nextSafeAction: setupFitUnlocked
        ? 'Run a local gate decision before any setup change.'
        : 'Run a local result decision; setup change remains locked.',
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: 'fa-balaccount-lookup-result-decision',
          latestPracticalCase: CASE_ID,
          nextCase,
          bookScreenshots: {
            acquisitionPostingTrace: setupFitUnlocked
              ? 'fieldlocal-balaccount-pattern-visible-pending-judge'
              : 'fieldlocal-balaccount-proof-still-insufficient',
          },
        },
      },
      fixedAssets: {
        faCnc01: {
          nextAcquisitionRoute: 'fa-balaccount-lookup-result-decision',
          acquisitionUnlocked: false,
        },
      },
    },
  };
}

test('FIXEDASSETS-168 reads Acquisition Cost Bal. Acc. field context without selecting or saving', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];

  await openFaPostingGroups(page, true);
  const context = await sandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    blockedBy.push(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  const machinesFrame = await findFaPostingGroupsFrame(page);
  let machinesSignals: Awaited<ReturnType<typeof readVisibleFaSignals>> | null = null;
  let machinesScreenshotCaptured = false;

  if (!machinesFrame) {
    blockedBy.push('FA Posting Groups page/card with MACHINES was not found.');
  } else {
    await scrollToBalancingArea(machinesFrame);
    machinesSignals = await readVisibleFaSignals(machinesFrame);
    machinesSignals.focusedLines = machinesSignals.focusedLines.filter(isSafeEvidenceLine);
    if (!machinesSignals.pageContextVisible || !machinesSignals.machinesVisible) {
      blockedBy.push('Foreground context did not prove FA Posting Group Card/List with MACHINES.');
    }
    if (!machinesSignals.targetFieldCaptionVisible) {
      blockedBy.push('Acquisition Cost Bal. Acc. caption was not visible/readable.');
    }
    await screenshot(page, 'fixedassets-168-010-machines-balaccount-field-context.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: 'labor',
      bookUse: 'debugging',
      purpose:
        'Read-only: MACHINES / Acquisition Cost Bal. Acc. Feldkontext erneut sichtbar machen, bevor irgendein Setup-Wert ausgewaehlt wird.',
      expectedPageText: [/FA Posting Group|FA Posting Groups/i, /\bMACHINES\b/i, /Acquisition Cost Bal\. Acc\./i],
      knownLimitations: [
        'Keine Auswahl eines Lookup-Werts.',
        'Keine Setup-Aenderung.',
        'Keine Werteingabe im Journal.',
        'Keine Preview Posting.',
        'Keine Buchung.',
      ],
    });
    machinesScreenshotCaptured = true;
  }

  const machinesText = await pageText(page);
  await writeJsonEvidence(faEvidencePath('010-machines-field-context.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-168-machines-field-context',
    caseId: CASE_ID,
    context,
    target: {
      page: 'FA Posting Groups',
      pageId: FA_POSTING_GROUPS_PAGE_ID,
      postingGroup: TARGET_GROUP,
      field: TARGET_FIELD,
    },
    signals: machinesSignals,
    screenshotCaptured: machinesScreenshotCaptured,
    omitted: 'No lookup value selected, no full DOM dump, no traces, videos, reports, storage state or auth artifact stored.',
  });
  await writeTextEvidence(
    faEvidencePath('020-machines-focused-text.txt'),
    compactLines(machinesText, [
      ...(machinesSignals?.focusedLines ?? []),
      ...(machinesSignals?.targetFields ?? []).map((field) => `${field.label} | ${field.value} | ${field.nearbyText}`),
    ]),
  );

  await openFaPostingGroups(page, false);
  const patternFrame = await findFaPostingGroupsFrame(page);
  const patternCardSignals = patternFrame ? await readVisibleFaSignals(patternFrame) : null;
  const listText = await pageText(page);
  const patternRows = extractPatternsFromText(listText);
  const patternTargetValue = patternCardSignals?.targetField?.value || patternCardSignals?.targetFieldTextValue || '';
  const patternTargetValueVisible = /\b\d{5}\b/.test(patternTargetValue);
  const patternRowsWithBalancingHints = patternRows.filter((row) => row.visibleAccounts.includes('12210') || row.visibleAccounts.includes('82000'));

  await screenshot(page, 'fixedassets-168-020-fa-posting-group-patterns-readonly.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: 'candidate',
    bookUse: 'debugging',
    purpose:
      'Read-only: vorhandene FA Posting Groups als Musterkontext fuer Balancing-/Kontenfelder vergleichen, ohne einen Wert zu waehlen oder zu speichern.',
    expectedPageText: [/FA Posting Group|FA Posting Groups/i, /\bEQUIPMENT\b/i, /Acquisition Cost Bal\. Acc\./i, /\b82000\b/i],
    knownLimitations: [
      'Listenmuster ist kein Setup-Fit.',
      'Keine Auswahl und kein Speichern eines Balancing-Kontos.',
      'Kein deutscher Finalnachweis.',
    ],
  });

  await writeJsonEvidence(faEvidencePath('030-existing-patterns-readonly.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-168-existing-fa-posting-group-patterns-readonly',
    caseId: CASE_ID,
    rows: patternRows,
    visibleCardSignals: patternCardSignals,
    visiblePatternTargetValue: patternTargetValueVisible
      ? {
          currentVisibleGroup: patternCardSignals?.targetFields?.[0]?.nearbyText?.match(/\b(MACHINES|EQUIPMENT|PLANT|PROPERTY|VEHICLES|GOODWILL)\b/i)?.[1] ?? 'unknown',
          field: TARGET_FIELD,
          value: patternTargetValue,
        }
      : null,
    rowsWithKnownAccountSignals: patternRowsWithBalancingHints,
    patternSufficientForSetupFit: false,
    reason:
      'Visible list/card rows can support a later decision, but they still do not prove a saved value in MACHINES / Acquisition Cost Bal. Acc.',
  });
  await writeTextEvidence(
    faEvidencePath('040-patterns-focused-text.txt'),
    compactLines(listText, [
      ...patternRows.map((row) => row.rawText),
      ...(patternCardSignals?.focusedLines ?? []),
      ...(patternCardSignals?.targetFields ?? []).map((field) => `${field.label} | ${field.value} | ${field.nearbyText}`),
    ]),
  );

  const targetValue = machinesSignals?.targetField?.value || machinesSignals?.targetFieldTextValue || '';
  const concreteTargetValue = /\b\d{5}\b/.test(targetValue);
  const lookupButtonVisible = Boolean(machinesSignals?.nearbyLookupButtons?.length);
  const setupFitUnlocked = false;
  const resultStatus =
    blockedBy.length > 0
      ? 'blocked'
      : concreteTargetValue
        ? 'observed-field-value-pending-judge'
        : lookupButtonVisible || patternRowsWithBalancingHints.length
          ? 'observed-readonly-pattern-gap'
          : 'observed-readonly-gap';
  const summary = concreteTargetValue
    ? `MACHINES / ${TARGET_FIELD} shows a concrete visible value ${targetValue}, but no setup write was performed.`
    : lookupButtonVisible
      ? `MACHINES / ${TARGET_FIELD} is visible and a nearby lookup/action affordance exists, but no value was selected and no concrete field value is proven.`
      : `MACHINES / ${TARGET_FIELD} is visible, but no concrete field value or safe selected lookup value is proven.`;
  const patch = makeStatePatch(resultStatus, setupFitUnlocked, summary);

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-balaccount-field-lookup-readonly-result',
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
      ...(context.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context.companyInUrl || context.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(machinesSignals?.pageContextVisible ? ['FA Posting Groups/Card context was reached read-only.'] : []),
      ...(machinesSignals?.machinesVisible ? ['FA Posting Group MACHINES was visible in the setup context.'] : []),
      ...(machinesSignals?.targetFieldCaptionVisible ? ['The Acquisition Cost Bal. Acc. caption was visible/readable.'] : []),
      ...(lookupButtonVisible ? ['A nearby field action/lookup affordance was visible, but not clicked for selection.'] : []),
      ...(patternRows.length ? ['Existing FA Posting Group rows were read as pattern context.'] : []),
      ...(patternTargetValueVisible
        ? [`Another visible FA Posting Group card shows ${TARGET_FIELD} = ${patternTargetValue} as pattern context.`]
        : []),
      'No lookup value was selected.',
      'No setup value was changed.',
      'No journal amount or balancing account was entered.',
      'No Preview Posting was opened.',
      'No posting was executed.',
    ],
    notProved: [
      ...(concreteTargetValue ? [] : ['No concrete Acquisition Cost Bal. Acc. account value was proven on MACHINES.']),
      'No setup-fit for Acquisition Cost Bal. Acc.',
      'No FA G/L Journal value-entry readiness.',
      'No Preview Posting result.',
      'No posting result.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-168-fa-balaccount-field-lookup-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-168/',
      'playwright/projects/fibu-book5/img/fixedassets-168-010-machines-balaccount-field-context.png',
      'playwright/projects/fibu-book5/img/fixedassets-168-020-fa-posting-group-patterns-readonly.png',
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-168-fa-balaccount-field-lookup-readonly.json',
      '.agent/state/cases/fixedassets-169-fa-balaccount-lookup-result-decision.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'playwright/projects/fibu-book5/CURRENT-STATE.md',
      'playwright/projects/fibu-book5/LAB-FIT-STATUS.md',
      'playwright/projects/fibu-book5/BOOK-CLICK-GUIDE-COVERAGE.md',
      'playwright/projects/fibu-book5/SCREENSHOT-QA.md',
      'playwright/projects/fibu-book5/WORKAROUNDS-AND-ERRORS.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-168/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-168/010-machines-field-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-168/020-machines-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-168/030-existing-patterns-readonly.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-168/040-patterns-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-168/FIXEDASSETS-168-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-168/FIXEDASSETS-168-result.json',
      'playwright/projects/fibu-book5/img/fixedassets-168-010-machines-balaccount-field-context.png',
      'playwright/projects/fibu-book5/img/fixedassets-168-020-fa-posting-group-patterns-readonly.png',
    ],
    evaluation: {
      targetValue,
      concreteTargetValue,
      lookupButtonVisible,
      patternRows,
      patternRowsWithBalancingHints,
      patternTargetValue,
      patternTargetValueVisible,
      setupFitUnlocked,
      safeForValueEntry: false,
    },
    warnings: [
      'Field context and pattern rows are read-only evidence only.',
      'No setup-write is unlocked by this run.',
      'Do not enter FA G/L Journal values before a separate judge case explicitly unlocks them.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      noLookupSelection: true,
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

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-168-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-168-learning.md'),
    [
      '# FIXEDASSETS-168 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `field-context`, `pattern-check`, `no-selection`, `no-setup-change`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Ein leerer Wert im Feld `Acquisition Cost Bal. Acc.` darf nicht durch ein beliebiges sichtbares Konto ersetzt werden. Der sichere Nachweis braucht den richtigen Feldkontext, eine klare Lookup-/Auswahl-Evidence oder ein belastbares vorhandenes Setup-Muster.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 kann diesen Lauf als technischen Kontrollpunkt verwenden: Kontenfindung braucht Feldkontext. Ein Screenshot muss zeigen, was man wirklich pruefen will, nicht nur einen Code irgendwo im Kontenplan.',
      '',
      '## Grenzen',
      '',
      '- Keine Auswahl eines Lookup-Werts.',
      '- Keine Setup-Aenderung.',
      '- Keine Journalwerte.',
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
      '# FIXEDASSETS-168 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-machines-field-context.json` | JSON | `MACHINES` und `Acquisition Cost Bal. Acc.` Feldkontext | keine gespeicherte Auswahl | `labor`, `read-only` |',
      '| `020-machines-focused-text.txt` | Text | kompakter Zielkontext | kein Rohdump | `compact` |',
      '| `030-existing-patterns-readonly.json` | JSON | sichtbare FA-Posting-Group-Muster | keinen Setup-Fit | `labor`, `candidate` |',
      '| `040-patterns-focused-text.txt` | Text | kompakte Musterzeilen | kein vollstaendiger Page-Dump | `compact` |',
      '| `FIXEDASSETS-168-learning.md` | Markdown | Lernwert und Buchwirkung | keine Buchung | `labor` |',
      '| `FIXEDASSETS-168-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keine Postenspur | `labor` |',
      '| `../../img/fixedassets-168-010-machines-balaccount-field-context.png` | Screenshot | Feldkontext `MACHINES` / `Acquisition Cost Bal. Acc.` | keine Werteauswahl | `candidate` |',
      '| `../../img/fixedassets-168-020-fa-posting-group-patterns-readonly.png` | Screenshot | Musterkontext FA Posting Groups | kein Setup-Fit | `candidate` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noLookupSelection).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(machinesSignals?.pageContextVisible).toBe(true);
  expect(machinesSignals?.machinesVisible).toBe(true);
  expect(machinesSignals?.targetFieldCaptionVisible).toBe(true);
});
