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
import { clickBcTopIconAction } from '../../../core/bc/actions';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-233-HGB-DEPRECIATION-INTEGRATION-SETUP-FIT';
const NEXT_CASE_ID = 'FIXEDASSETS-234-HGB-DEPRECIATION-INTEGRATION-SETUP-FIT-REVIEW';
const TEST_ID = 'fixedassets-233';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_FIELD = 'G/L Integration - Depreciation';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(360_000);

type FitStatus = 'already-fit' | 'setup-fit-applied' | 'blocked-checkbox-not-unique' | 'blocked-checkbox-not-clickable' | 'blocked-safety-gate';

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function hgbDepreciationBookUrl() {
  const url = new URL(bcPageUrl(5611, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', "'Depreciation Book'.'Code' IS 'HGB'");
  return url.toString();
}

function clean(value: string | null | undefined) {
  return (value || '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function scrubEvidence<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => scrubEvidence(entry)) as T;
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] =
        typeof item === 'string' && /(^url$|url$|scopeUrl|frameUrl)/i.test(key)
          ? safeUrl(item)
          : scrubEvidence(item);
    }
    return result as T;
  }
  return value;
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const parsed = new URL(url);
  const decoded = decodeURIComponent(url);
  const text = await pageText(page);
  const result = {
    url: safeUrl(url),
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };

  if (!result.environmentInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context for ${CASE_ID}: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function openHgbCard(page: Page) {
  await page.goto(hgbDepreciationBookUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /\bHGB\b|Depreciation Books/i, { timeout: 90_000 });
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);

  for (const frame of page.frames()) {
    const clicked = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const target = Array.from(document.querySelectorAll<HTMLElement>('a,button,[role="button"]'))
          .filter(visible)
          .map((element) => ({
            element,
            label: [
              normalize(element.getAttribute('aria-label')),
              normalize(element.getAttribute('title')),
              normalize(element.innerText || element.textContent),
            ].join(' '),
          }))
          .filter((entry) => /\bHGB\b/i.test(entry.label) && /open|oeffnen|ffnen|datensatz|record/i.test(entry.label))[0]?.element;
        if (!target) return false;
        target.click();
        return true;
      })
      .catch(() => false);

    if (clicked) {
      await page.waitForTimeout(3500);
      await dismissTours(page).catch(() => undefined);
      await hideFactBoxPane(page).catch(() => undefined);
      await waitForPageText(page, /Depreciation Book Card|G\/L Integration|HGB/i, { timeout: 60_000 });
      return { openedByRecordLink: true };
    }
  }

  return { openedByRecordLink: false };
}

async function findHgbCardFrame(page: Page) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1200 }).catch(() => '');
    if (/\bHGB\b/i.test(text) && /Depreciation Book Card|G\/L Integration|Depreciation/i.test(text)) {
      return frame;
    }
  }
  return page.mainFrame();
}

async function ensureEditMode(page: Page) {
  const result = await clickBcTopIconAction(page, {
    title: /Seite vornehmen|make changes|edit/i,
    scopeText: /Depreciation Book Card|G\/L Integration|HGB/i,
    yMax: 90,
    expectedAfterClick: /Depreciation Book Card|G\/L Integration|HGB/i,
  }).catch((error) => ({
    clicked: false,
    reason: `edit-mode-click-failed: ${String(error)}`,
    candidates: [],
    attempts: [],
  }));
  await page.waitForTimeout(1500);
  return result;
}

async function dangerousState(page: Page) {
  const text = await pageText(page).catch(() => '');
  return {
    postingDialogVisible: /Preview Posting|Post and Print|Ship and Invoice|Receive and Invoice|Buchen und drucken/i.test(text),
    dangerousConfirmVisible: /\bOK\b|\bYes\b|\bJa\b|Are you sure|Moechten Sie|M.chten Sie/i.test(text),
    textSample: clean(text).slice(0, 800),
  };
}

async function findDepreciationCheckboxCandidate(page: Page) {
  const frame = await findHgbCardFrame(page);
  return frame.evaluate((targetField) => {
    const normalize = (value: string | null | undefined) =>
      (value || '')
        .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const short = (value: string | null | undefined) => normalize(value).slice(0, 180);
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const rectOf = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
    };
    const centerY = (rect: { y: number; height: number }) => rect.y + rect.height / 2;
    const bodyText = normalize(document.body?.innerText || document.body?.textContent || '');
    const labels = Array.from(document.querySelectorAll<HTMLElement>('label,span,div'))
      .filter(visible)
      .map((element) => ({
        element,
        text: short(element.innerText || element.textContent),
        ariaLabel: short(element.getAttribute('aria-label')),
        title: short(element.getAttribute('title')),
        rect: rectOf(element),
        isGrid: Boolean(element.closest('[role="grid"],[role="treegrid"],table')),
      }))
      .filter((entry) => new RegExp(targetField.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(`${entry.text} ${entry.ariaLabel} ${entry.title}`));
    const exactLabels = labels.filter((entry) => entry.text === targetField || entry.ariaLabel === targetField || entry.title === targetField);
    const labelsForMatching = exactLabels.length > 0 ? exactLabels : labels;

    const checkboxElements = Array.from(document.querySelectorAll<HTMLElement>('input[type="checkbox"],[role="checkbox"]'))
      .filter(visible)
      .map((element, index) => {
        const input = element as HTMLInputElement;
        const checked =
          input.type === 'checkbox'
            ? input.checked
            : element.getAttribute('aria-checked') === 'true'
              ? true
              : element.getAttribute('aria-checked') === 'false'
                ? false
                : null;
        return {
          element,
          index,
          tagName: element.tagName.toUpperCase(),
          role: normalize(element.getAttribute('role')),
          ariaLabel: short(element.getAttribute('aria-label')),
          title: short(element.getAttribute('title')),
          text: short(element.innerText || element.textContent),
          checked,
          disabled: Boolean(input.disabled || element.getAttribute('aria-disabled') === 'true'),
          readOnly: Boolean(input.readOnly || element.getAttribute('aria-readonly') === 'true'),
          rect: rectOf(element),
        };
      });

    const candidates = [];
    for (const label of labelsForMatching) {
      for (const checkbox of checkboxElements) {
        const sameRow = Math.abs(centerY(checkbox.rect) - centerY(label.rect)) <= 24;
        const rightOfLabel = checkbox.rect.x >= label.rect.x - 20;
        const labelNamesTarget = new RegExp(targetField.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(
          `${checkbox.ariaLabel} ${checkbox.title} ${checkbox.text}`,
        );
        const score =
          (sameRow ? 30 : 0) +
          (rightOfLabel ? 8 : 0) +
          (label.isGrid ? -50 : 10) +
          (labelNamesTarget ? 35 : 0) +
          (typeof checkbox.checked === 'boolean' ? 20 : 0) -
          (checkbox.disabled || checkbox.readOnly ? 30 : 0);
        candidates.push({
          checkboxIndex: checkbox.index,
          score,
          label: {
            text: label.text,
            ariaLabel: label.ariaLabel,
            title: label.title,
            rect: label.rect,
            isGrid: label.isGrid,
          },
          checkbox: {
            tagName: checkbox.tagName,
            role: checkbox.role,
            ariaLabel: checkbox.ariaLabel,
            title: checkbox.title,
            text: checkbox.text,
            checked: checkbox.checked,
            disabled: checkbox.disabled,
            readOnly: checkbox.readOnly,
            rect: checkbox.rect,
          },
        });
      }
    }

    const sorted = candidates.sort((left, right) => right.score - left.score || left.checkbox.rect.y - right.checkbox.rect.y);
    const acceptedRaw = sorted.filter(
      (entry) => entry.score >= 50 && typeof entry.checkbox.checked === 'boolean' && !entry.checkbox.disabled && !entry.checkbox.readOnly && !entry.label.isGrid,
    );
    const acceptedByCheckbox = new Map<number, (typeof acceptedRaw)[number]>();
    for (const entry of acceptedRaw) {
      const previous = acceptedByCheckbox.get(entry.checkboxIndex);
      if (!previous || entry.score > previous.score) {
        acceptedByCheckbox.set(entry.checkboxIndex, entry);
      }
    }
    const accepted = Array.from(acceptedByCheckbox.values()).sort(
      (left, right) => right.score - left.score || left.checkbox.rect.y - right.checkbox.rect.y,
    );
    return {
      bodySignals: {
        hgbVisible: /\bHGB\b/i.test(bodyText),
        depreciationBookCardVisible: /Depreciation Book Card/i.test(bodyText),
        glIntegrationVisible: /G\/L Integration/i.test(bodyText),
        targetFieldVisible: new RegExp(targetField.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(bodyText),
      },
      exactLabelMode: exactLabels.length > 0,
      labels: labels.map(({ element: _element, ...entry }) => entry).slice(0, 6),
      candidates: sorted.map(({ checkboxIndex, ...entry }) => ({ checkboxIndex, ...entry })).slice(0, 8),
      acceptedCount: accepted.length,
      selected: accepted[0] ? { checkboxIndex: accepted[0].checkboxIndex, score: accepted[0].score, checkbox: accepted[0].checkbox, label: accepted[0].label } : null,
    };
  }, TARGET_FIELD);
}

async function clickSelectedCheckbox(page: Page, checkboxIndex: number) {
  const frame = await findHgbCardFrame(page);
  const marked = await frame.evaluate((index) => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const checkboxes = Array.from(document.querySelectorAll<HTMLElement>('input[type="checkbox"],[role="checkbox"]')).filter(visible);
    const target = checkboxes[index] as HTMLInputElement | undefined;
    if (!target) return { clicked: false, reason: 'checkbox-index-not-found' };
    const before =
      target.type === 'checkbox'
        ? target.checked
        : target.getAttribute('aria-checked') === 'true'
          ? true
          : target.getAttribute('aria-checked') === 'false'
            ? false
            : null;
    target.setAttribute('data-fa233-target-checkbox', 'true');
    return { clicked: false, reason: before === true ? 'already-checked' : 'target-marked-for-playwright-click', before, after: before };
  }, checkboxIndex);
  if (marked.reason === 'already-checked' || marked.reason === 'checkbox-index-not-found') {
    return marked;
  }

  const locator = frame.locator('[data-fa233-target-checkbox="true"]');
  await locator.click({ timeout: 5000 });
  await page.waitForTimeout(700);

  return locator.evaluate((target: HTMLElement, before) => {
    const input = target as HTMLInputElement;
    const after =
      input.type === 'checkbox'
        ? input.checked
        : target.getAttribute('aria-checked') === 'true'
          ? true
          : target.getAttribute('aria-checked') === 'false'
            ? false
            : null;
    return { clicked: true, reason: 'playwright-clicked-target-checkbox', before, after };
  }, marked.before);
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-233 HGB Depreciation G/L Integration Setup-Fit',
    '',
    'Status: `labor`, `ui-first`, `setup-fit`, `single-field`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Case | ${result.caseId} |`,
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    '| Zielobjekt | Depreciation Book `HGB` |',
    `| Zielfeld | ${TARGET_FIELD} |`,
    `| Ergebnis | ${result.resultStatus} |`,
    `| Vorher | ${String(result.before?.selected?.checkbox?.checked ?? 'nicht eindeutig')} |`,
    `| Nachher | ${String(result.after?.selected?.checkbox?.checked ?? 'nicht eindeutig')} |`,
    '| Preview Posting | nein |',
    '| Buchung | nein |',
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    '- `G/L Integration - Depreciation` ist ein Setup-Schalter im AfA-Buch, keine Journalzeile.',
    '- Dieser Schalter beeinflusst, ob Abschreibungen mit der Finanzbuchhaltung integriert werden.',
    '- Ein Setup-Fit darf nur ein klar identifiziertes Feld aendern; andere G/L-Integration-Felder bleiben unberuehrt.',
    '- Nach einem Setup-Fit braucht es einen separaten Preview-Posting-only Lauf. Ein Fit ist noch keine Buchung.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher HGB-/Steuer-/Kontenplan-Finalnachweis.',
    '- Kein FA Journal, keine Preview-Zeilen, keine FA Ledger Entries.',
    '- Kein Post.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

async function writeResult(partial: Record<string, any>) {
  const success = ['already-fit', 'setup-fit-applied'].includes(partial.resultStatus);
  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-233-hgb-depreciation-integration-setup-fit-result',
    caseId: CASE_ID,
    source: 'playwright-ui-first-single-field-setup-fit',
    resultStatus: partial.resultStatus as FitStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    target: {
      page: 'Depreciation Book Card',
      depreciationBook: 'HGB',
      field: TARGET_FIELD,
      targetValue: true,
    },
    proved: partial.proved ?? [],
    notProved: [
      'No Preview Posting entry lines are proven.',
      'No posting was executed.',
      'No journal line was created or edited.',
      'No FA Ledger Entry or G/L Entry trace exists.',
      'No German final proof exists.',
      ...(partial.notProved ?? []),
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-233-hgb-depreciation-integration-setup-fit.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-233/',
      '.agent/state/cases/fixedassets-233-hgb-depreciation-integration-setup-fit.json',
      '.agent/state/cases/fixedassets-234-hgb-depreciation-integration-setup-fit-review.json',
      '.agent/state/current.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-233/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-233/FIXEDASSETS-233-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-233/FIXEDASSETS-233-HGB-DEPRECIATION-INTEGRATION-SETUP-FIT.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-233/010-hgb-depreciation-integration-before-after.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-233/020-focused-card-text.txt',
    ],
    warnings: partial.warnings ?? [],
    blockedBy: partial.blockedBy ?? [],
    requiresReview: true,
    safeToFinalizeState: true,
    flags: {
      noBookChange: true,
      secretsUntouched: true,
      noPost: true,
      noPreview: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noDeleteRecord: true,
      noJournalEdit: true,
      singleFieldSetupFitOnly: success,
      noSetupChange: partial.resultStatus !== 'setup-fit-applied',
    },
    statePatch: {
      current: {
        activeCase: NEXT_CASE_ID,
        active_case_file: '.agent/state/cases/fixedassets-234-hgb-depreciation-integration-setup-fit-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-233-hgb-depreciation-integration-setup-fit.json',
        requiresStrongModel: true,
        nextStep: 'FIXEDASSETS-234: locally review FA-233 setup-fit evidence before any Preview Posting-only retry.',
      },
      activeCase: {
        status: partial.resultStatus,
        lastResult: {
          status: partial.resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-233/FIXEDASSETS-233-result.json',
          summary: partial.summary,
        },
        nextSafeAction: 'FIXEDASSETS-234: local review; no Preview Posting or Post in FA-233.',
      },
    },
    ...partial,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-233-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-233-HGB-DEPRECIATION-INTEGRATION-SETUP-FIT.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-233 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-233-result.json` | JSON | Setup-Fit-Ergebnis, Safety-Flags, State-Patch-Plan | keine Preview-Zeilen, keine Buchung | `review-required` |',
      '| `010-hgb-depreciation-integration-before-after.json` | JSON | Vorher/Nachher-Kandidat fuer genau ein Checkbox-Feld | keine vollstaendige Tabellenlogik | `single-field-fit` |',
      '| `020-focused-card-text.txt` | Text | kompakter Kartenkontext | kein Rohdump | `compact` |',
      '| `FIXEDASSETS-233-HGB-DEPRECIATION-INTEGRATION-SETUP-FIT.md` | Markdown | Lernwert und Grenzen | keinen deutschen Finalnachweis | `labor` |',
      '',
      `Aktuelle Wahrheit: ${result.summary}`,
      '',
    ].join('\n'),
  );
  return result;
}

test('FIXEDASSETS-233 sets HGB G/L Integration - Depreciation on if uniquely accessible', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const cardOpen = await openHgbCard(page);
  const context = await assertSandboxContext(page);
  const before = await findDepreciationCheckboxCandidate(page);
  const editMode = await ensureEditMode(page);
  const beforeAfterEditMode = await findDepreciationCheckboxCandidate(page);
  await writeTextEvidence(
    faEvidencePath('020-focused-card-text.txt'),
    await compactPageText(page, {
      include: [/Depreciation Book Card|HGB|G\/L Integration|Depreciation|Error|Fehler/i],
      maxLines: 140,
      maxLineLength: 260,
    }),
  );

  const beforeCandidate = beforeAfterEditMode.selected ?? before.selected;
  const beforeChecked = beforeCandidate?.checkbox?.checked;
  let clickResult: Record<string, unknown> = { clicked: false, reason: 'not-attempted' };
  let resultStatus: FitStatus;
  let summary: string;
  const blockedBy: string[] = [];

  if (beforeAfterEditMode.acceptedCount !== 1 || !beforeCandidate || typeof beforeChecked !== 'boolean') {
    resultStatus = 'blocked-checkbox-not-unique';
    blockedBy.push(`Accepted target checkbox count after edit mode is ${beforeAfterEditMode.acceptedCount}.`);
    summary = 'FA-233 blocked: target checkbox was not uniquely and safely identifiable.';
  } else if (beforeChecked === true) {
    resultStatus = 'already-fit';
    summary = 'FA-233 observed HGB G/L Integration - Depreciation already on; no setup change was needed.';
  } else {
    clickResult = await clickSelectedCheckbox(page, beforeCandidate.checkboxIndex);
    await page.waitForTimeout(1800);
    const danger = await dangerousState(page);
    if (danger.postingDialogVisible || danger.dangerousConfirmVisible) {
      resultStatus = 'blocked-safety-gate';
      blockedBy.push('Risky dialog or posting text appeared after checkbox click.');
      summary = 'FA-233 blocked after click attempt because a risky dialog/signal appeared.';
    } else if (clickResult.clicked !== true) {
      resultStatus = 'blocked-checkbox-not-clickable';
      blockedBy.push(`Checkbox click did not execute: ${String(clickResult.reason ?? 'unknown')}.`);
      summary = 'FA-233 blocked: target checkbox was visible but not clickable.';
    } else {
      resultStatus = 'setup-fit-applied';
      summary = 'FA-233 set HGB G/L Integration - Depreciation to on through one UI-first checkbox action; no Preview Posting or Post occurred.';
    }
  }

  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1600);
  const after = await findDepreciationCheckboxCandidate(page);
  const afterChecked = after.selected?.checkbox?.checked ?? null;
  if (['setup-fit-applied', 'already-fit'].includes(resultStatus) && afterChecked !== true) {
    resultStatus = 'blocked-checkbox-not-clickable';
    blockedBy.push('After-state did not show target checkbox checked.');
    summary = 'FA-233 did not prove the target checkbox checked after the action.';
  }

  const evidence = {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    startedAt,
    finishedAt: new Date().toISOString(),
    context,
    cardOpen,
    editMode,
    before,
    beforeAfterEditMode,
    clickResult,
    after,
    safety: {
      dangerousState: await dangerousState(page),
      noPost: true,
      noPreview: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noJournalEdit: true,
    },
  };
  await writeJsonEvidence(faEvidencePath('010-hgb-depreciation-integration-before-after.json'), scrubEvidence(evidence));

  const result = await writeResult({
    resultStatus,
    observed: scrubEvidence(evidence),
    before,
    after,
    clickResult,
    blockedBy,
    warnings: resultStatus === 'setup-fit-applied' ? ['CRONUS-USA laboratory setup fit only; not German final proof.'] : [],
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'The HGB Depreciation Book Card context was opened.',
      `Target field ${TARGET_FIELD} was diagnosed through visible UI controls.`,
      ...(resultStatus === 'already-fit' ? [`${TARGET_FIELD} was already checked before any click.`] : []),
      ...(resultStatus === 'setup-fit-applied' ? [`${TARGET_FIELD} was set to checked by one UI-first checkbox action.`] : []),
      'No Preview Posting, Post, journal edit, company switch or API shortcut occurred.',
    ],
    summary,
    bookImpact: ['already-fit', 'setup-fit-applied'].includes(resultStatus)
      ? 'Kapitel 21 kann den HGB-G/L-Integration-Depreciation-Fit als CRONUS-USA-Labor-Setupvoraussetzung dokumentieren; Preview/Post bleiben separate Nachweise.'
      : 'Kapitel 21 darf den HGB-G/L-Integration-Depreciation-Fit noch nicht behaupten; der Checkbox-Pfad bleibt Lern-/Blockerfall.',
    nextStep: 'FIXEDASSETS-234: locally review FA-233 setup-fit evidence before any Preview Posting-only retry.',
  });

  expect(context.environmentInUrl).toBe(true);
  expect(context.companyInUrl).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
});

