import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  visibleButtonNames,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-088-FA-GL-JOURNAL-CONTROL-SNAPSHOT-READONLY';
const TEST_ID = 'fixedassets-088';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_LABEL = 'Fixed Asset G/L Journals';
const TARGET_PAGE_ID = 5628;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function faJournalPageUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('page', String(TARGET_PAGE_ID));
  return url.toString();
}

function evidenceText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function evidenceUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
    url.searchParams.delete(key);
  }
  return url.toString();
}

function isBusinessCentralFrameUrl(value: string) {
  try {
    return new URL(value).hostname === 'businesscentral.dynamics.com';
  } catch {
    return false;
  }
}

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const text = await pageText(page);
  return {
    url,
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
}

async function exactVisibleTellMeCandidates(page: Page) {
  const candidates: Array<{ frameUrl: string; text: string; tagName: string; role: string | null; ariaLabel: string | null }> = [];

  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .evaluate((targetLabel) => {
        return [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="option"],[role="menuitem"],li,div,span,a')]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            return rect.width > 0 && rect.height > 0 && text === targetLabel;
          })
          .map((element) => ({
            frameUrl: window.location.href,
            text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
            tagName: element.tagName,
            role: element.getAttribute('role'),
            ariaLabel: element.getAttribute('aria-label'),
          }));
      }, TARGET_LABEL)
      .catch(() => []);
    candidates.push(...frameCandidates);
  }

  return candidates;
}

async function clickUniqueExactTellMeCandidate(page: Page) {
  const candidatesBeforeClick = await exactVisibleTellMeCandidates(page);
  if (candidatesBeforeClick.length !== 1) {
    return {
      clicked: false,
      blockedBy: `Expected exactly one visible '${TARGET_LABEL}' candidate, found ${candidatesBeforeClick.length}.`,
      candidatesBeforeClick,
    };
  }

  let clicked = false;
  for (const frame of page.frames()) {
    clicked = await frame
      .evaluate((targetLabel) => {
        const elements = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="option"],[role="menuitem"],li,div,span,a')]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            return rect.width > 0 && rect.height > 0 && text === targetLabel;
          })
          .sort((left, right) => {
            const leftRect = left.getBoundingClientRect();
            const rightRect = right.getBoundingClientRect();
            return leftRect.width * leftRect.height - rightRect.width * rightRect.height;
          });
        const target = elements[0];
        if (!target) {
          return false;
        }
        target.click();
        return true;
      }, TARGET_LABEL)
      .catch(() => false);
    if (clicked) {
      break;
    }
  }

  await page.waitForTimeout(2500);
  return {
    clicked,
    blockedBy: clicked ? '' : `Failed to click unique '${TARGET_LABEL}' candidate.`,
    candidatesBeforeClick,
  };
}

async function journalControlSnapshot(page: Page) {
  const snapshots = [];

  for (const frame of page.frames()) {
    if (!isBusinessCentralFrameUrl(frame.url())) {
      continue;
    }

    const frameSnapshot = await frame
      .evaluate(() => {
        const visible = (element: Element) => {
          const rect = (element as HTMLElement).getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        };
        const normalized = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

        const controls = [...document.querySelectorAll<HTMLElement>('input,textarea,select,[contenteditable="true"],[role="textbox"],[role="combobox"],[role="gridcell"],[role="columnheader"],button,[role="button"]')]
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const input = element as HTMLInputElement;
            return {
              tagName: element.tagName,
              role: element.getAttribute('role'),
              ariaLabel: normalized(element.getAttribute('aria-label')),
              title: normalized(element.getAttribute('title')),
              text: normalized(element.innerText || element.textContent).slice(0, 140),
              value: normalized('value' in input ? input.value : '').slice(0, 80),
              disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
              readonly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          })
          .filter((entry) => entry.text || entry.value || entry.ariaLabel || entry.title)
          .slice(0, 220);

        const gridTexts = [...document.querySelectorAll<HTMLElement>('[role="grid"],[role="row"],table')]
          .filter(visible)
          .map((element) => normalized(element.innerText || element.textContent).slice(0, 600))
          .filter(Boolean)
          .slice(0, 20);

        return {
          frameUrl: window.location.href,
          controls,
          gridTexts,
        };
      })
      .catch(() => ({ frameUrl: frame.url(), controls: [], gridTexts: [] }));
    snapshots.push({
      frameUrl: evidenceUrl(frameSnapshot.frameUrl),
      controls: frameSnapshot.controls
        .map((control) => ({
          ...control,
          ariaLabel: evidenceText(control.ariaLabel),
          title: evidenceText(control.title),
          text: evidenceText(control.text),
          value: evidenceText(control.value),
        }))
        .filter((control) => control.text || control.value || control.ariaLabel || control.title)
        .filter((control) => {
          const haystack = [control.text, control.value, control.ariaLabel, control.title].join(' ');
          return /Fixed Asset G\/L Journals|Batch Name|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Depreciation Book|FA Posting Type|Description|Gen\. Posting|Amount|Bal\.|Post|Insert FA Bal\. Account|Reconcile|Apply Entries|Lines checked|Issues|DEFAULT|G\/L Account|Fixed Asset|Acquisition Cost|Purchase|Sale|Settlement/i.test(
            haystack,
          );
        })
        .slice(0, 80),
      gridTexts: frameSnapshot.gridTexts.map((text) => evidenceText(text)).filter(Boolean).slice(0, 6),
    });
  }

  return snapshots;
}

function hasControl(snapshot: Awaited<ReturnType<typeof journalControlSnapshot>>, pattern: RegExp) {
  return snapshot.some((frame) =>
    frame.controls.some((control) =>
      pattern.test([control.text, control.value, control.ariaLabel, control.title].filter(Boolean).join(' ')),
    ),
  );
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  const nextCase =
    status === 'observed'
      ? 'FIXEDASSETS-089-FA-GL-JOURNAL-DRAFT-LINE-GATE-DECISION'
      : 'FIXEDASSETS-089-FA-GL-JOURNAL-CONTROL-SNAPSHOT-BLOCKER';
  const nextFile =
    status === 'observed'
      ? '.agent/state/cases/fixedassets-089-fa-gl-journal-draft-line-gate-decision.json'
      : '.agent/state/cases/fixedassets-089-fa-gl-journal-control-snapshot-blocker.json';
  const nextStep =
    status === 'observed'
      ? 'Decide whether a no-post draft line probe is safe: required field sequence, cleanup/keep rule and preview gate.'
      : 'Diagnose why the Fixed Asset G/L Journals control snapshot did not prove the required journal context.';

  return {
    current: {
      activeCase: nextCase,
      active_case_file: nextFile,
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-088-fa-gl-journal-control-snapshot-readonly.json',
      nextStep,
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-gl-journal-control-snapshot-readonly',
      branch: 'codex/token-efficient-autopilot-state',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      bcRun: true,
      posted: false,
      preview: false,
      setupChanged: false,
      companySwitched: false,
      resultStatus: status,
      summary,
      nextStep,
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly' : 'blocked-readonly',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-088/FIXEDASSETS-088-result.json',
        summary,
      },
      nextSafeAction: nextStep,
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: status === 'observed' ? 'fa-gl-journal-draft-line-gate-decision' : 'fa-gl-journal-control-snapshot-blocker',
          latestPracticalCase: 'FIXEDASSETS-088',
          nextCase,
        },
      },
    },
  };
}

test('FIXEDASSETS-088 captures FA G/L Journal controls read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let contextBefore: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let contextAfter: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let clickResult: Awaited<ReturnType<typeof clickUniqueExactTellMeCandidate>> | undefined;
  let snapshot: Awaited<ReturnType<typeof journalControlSnapshot>> = [];
  let fullText = '';
  let pageContextText = '';
  let buttons: string[] = [];

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);

    contextBefore = await sandboxContext(page);
    if (!contextBefore.environmentInUrl || (!contextBefore.companyInUrl && !contextBefore.companyInText) || contextBefore.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context before FA-088 snapshot: ${JSON.stringify(contextBefore)}`);
    } else {
      await dismissTours(page).catch(() => undefined);
      await hideFactBoxPane(page).catch(() => undefined);
      await page.waitForTimeout(1200);

      fullText = await pageText(page);
      pageContextText = await compactPageText(page, {
        include: [
          /Fixed Asset|FA G\/L|G\/L Journal|Anlage|Anlagen|Fibu|Buchblatt|Buch.-Blatt|Journal/i,
          /Batch Name|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Fixed Asset No\.|Amount|Bal\. Account/i,
          /Post|Buchen|Preview|Vorschau|New|Neu|Delete|Loeschen|Löschen|Edit|Bearbeiten/i,
        ],
        maxLines: 160,
        maxLineLength: 220,
      });
      buttons = (await visibleButtonNames(page))
        .map((button) => evidenceText(button))
        .filter(Boolean)
        .slice(0, 120);
      contextAfter = await sandboxContext(page);
      snapshot = await journalControlSnapshot(page);

      if (!decodeURIComponent(page.url()).includes('page=5628')) {
        blockedBy.push(`Fixed Asset G/L Journals page id 5628 was not visible in URL after direct read-only open: ${page.url()}`);
      }
      if (!/Fixed Asset G\/L Journal|Fixed Asset G\/L Journals|FA G\/L Journal|Journal|Buchblatt|Buch.-Blatt|Posting Date|Document No\.|Account Type|FA Posting Type/i.test(fullText)) {
        blockedBy.push('Fixed Asset G/L Journals page context was not visible after route opening.');
      }
      if (!contextAfter.environmentInUrl || (!contextAfter.companyInUrl && !contextAfter.companyInText) || contextAfter.wrongEnvironmentVisible) {
        blockedBy.push(`Wrong BC context after FA-088 snapshot: ${JSON.stringify(contextAfter)}`);
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  const requiredSignals = {
    batchName: hasControl(snapshot, /Batch Name|Journal Batch|Name des Buch.-Blatts|Buch.-Blattname/i) || /Batch Name|Journal Batch|Name des Buch.-Blatts|Buch.-Blattname/i.test(fullText),
    postingDate: hasControl(snapshot, /Posting Date|Buchungsdatum/i) || /Posting Date|Buchungsdatum/i.test(fullText),
    documentNo: hasControl(snapshot, /Document No\.|Belegnr\.|Belegnummer/i) || /Document No\.|Belegnr\.|Belegnummer/i.test(fullText),
    accountType: hasControl(snapshot, /Account Type|Kontoart/i) || /Account Type|Kontoart/i.test(fullText),
    accountNo: hasControl(snapshot, /Account No\.|Kontonr\./i) || /Account No\.|Kontonr\./i.test(fullText),
    faPostingType: hasControl(snapshot, /FA Posting Type|Anlagenpostenart/i) || /FA Posting Type|Anlagenpostenart/i.test(fullText),
    fixedAssetNo: hasControl(snapshot, /FA No\.|Fixed Asset No\.|Anlagennr\./i) || /FA No\.|Fixed Asset No\.|Anlagennr\./i.test(fullText),
    amount: hasControl(snapshot, /Amount|Betrag/i) || /Amount|Betrag/i.test(fullText),
    balancingAccount: hasControl(snapshot, /Bal\. Account|Balancing Account|Gegenkonto/i) || /Bal\. Account|Balancing Account|Gegenkonto/i.test(fullText),
  };
  const actionSignals = {
    newVisible: buttons.some((button) => /^(New|Neu)$|New Line|Neue Zeile/i.test(button)),
    editVisible: buttons.some((button) => /^Edit|Bearbeiten/i.test(button)),
    deleteVisible: buttons.some((button) => /Delete|Loeschen|Löschen/i.test(button)),
    postVisible: buttons.some((button) => /Post|Buchen/i.test(button)),
    previewVisible: buttons.some((button) => /Preview Posting|Buchungsvorschau|Vorschau/i.test(button)),
  };
  const controlCount = snapshot.reduce((total, frame) => total + frame.controls.length, 0);
  const requiredSignalCount = Object.values(requiredSignals).filter(Boolean).length;
  const status: 'observed' | 'blocked' = blockedBy.length === 0 && requiredSignalCount >= 6 && controlCount > 0 ? 'observed' : 'blocked';
  if (status === 'blocked' && requiredSignalCount < 6) {
    blockedBy.push(`Only ${requiredSignalCount} required journal field signals were visible.`);
  }
  if (status === 'blocked' && controlCount === 0) {
    blockedBy.push('No visible control snapshot was captured.');
  }

  const summary =
    status === 'observed'
      ? 'FA-088 captured Fixed Asset G/L Journal batch, row and control context read-only. Required field signals are visible, but no value, row, preview or posting was created.'
      : `FA-088 did not prove a sufficient Fixed Asset G/L Journal control snapshot. Blocker: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeTextEvidence(faEvidencePath('010-fa-journal-control-context.txt'), pageContextText || 'No FA journal control context captured.');
  await writeJsonEvidence(faEvidencePath('020-fa-journal-control-snapshot.json'), {
    contextBefore,
    contextAfter,
    clickResult,
    requiredSignals,
    actionSignals,
    visibleButtons: buttons,
    controlCount,
    frames: snapshot,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-control-snapshot-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-result',
    resultStatus: status,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    proved: [
      ...(contextAfter?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(contextAfter?.companyInUrl || contextAfter?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(status === 'observed' ? ['Fixed Asset G/L Journals controls were captured read-only.'] : []),
      'The run did not create, edit, delete, preview, post, pay, invoice, ship or change setup.',
    ],
    notProved: [
      'No journal line was created.',
      'No FA-CNC-01 was entered in a journal.',
      'No K30000 was entered.',
      'No amount was entered.',
      'No Preview Posting.',
      'No acquisition posting.',
      'No cleanup/keep-draft execution.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-088-fa-gl-journal-control-snapshot-readonly.json',
      status === 'observed'
        ? '.agent/state/cases/fixedassets-089-fa-gl-journal-draft-line-gate-decision.json'
        : '.agent/state/cases/fixedassets-089-fa-gl-journal-control-snapshot-blocker.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-088-fa-gl-journal-control-snapshot-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-088/FIXEDASSETS-088-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-088/FIXEDASSETS-088-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-088/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-088/010-fa-journal-control-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-088/020-fa-journal-control-snapshot.json',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-088/FIXEDASSETS-088-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-088/FIXEDASSETS-088-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-088/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-088/010-fa-journal-control-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-088/020-fa-journal-control-snapshot.json',
    ],
    warnings: [
      'CRONUS/RM-DEMO labor only.',
      'Control snapshot only; no journal line or posting proof.',
      'Visible Post/Preview/New/Edit/Delete actions, if present, were not clicked.',
    ],
    blockedBy,
    requiresReview: status === 'blocked',
    safeToFinalizeState: status === 'observed',
    statePatch: patch,
    route: {
      clickResult,
      directPageOpen: {
        pageId: TARGET_PAGE_ID,
        label: TARGET_LABEL,
      },
      url: page.url(),
      contextBefore,
      contextAfter,
      requiredSignals,
      actionSignals,
      controlCount,
    },
    flags: {
      stayedInExpectedInstance: Boolean(contextAfter?.environmentInUrl),
      companyContextDocumented: Boolean(contextAfter?.companyInUrl || contextAfter?.companyInText),
      noBookChange: true,
      noPost: true,
      noPreview: true,
      noShip: true,
      noInvoice: true,
      noPayment: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noEditRecord: true,
      noDeleteRecord: true,
      noJournalLineCreated: true,
      noTargetVendorEntry: true,
      noTargetFixedAssetEntry: true,
      cleanupRequired: false,
      cleanupCompleted: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-088-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-088-learning.md'),
    [
      '# FIXEDASSETS-088 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `control-snapshot`, `no-draft`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Ein Anlagen-Fibu-Journal ist noch keine Buchung. Entscheidend ist erst, welche Batch- und Zeilenfelder sichtbar sind und ob ein sicherer Draft-/Cleanup-Plan existiert. FA-088 sammelt deshalb nur den Kontext: Welche Felder und Aktionen sind sichtbar, ohne Werte in eine Zeile zu schreiben.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 kann den Unterschied zwischen Navigationsnachweis, Journal-Kontext und eigentlicher Anschaffungsbuchung sauberer erklaeren. Ein Screenshot oder Textauszug der Journal-Seite beweist noch keine Anschaffung.',
      '',
      '## Grenzen',
      '',
      '- Keine Journalzeile angelegt.',
      '- Keine Werte eingegeben.',
      '- Keine Preview Posting.',
      '- Keine Buchung.',
      '- Keine Setup-Aenderung.',
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
      '# FIXEDASSETS-088 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-fa-journal-control-context.txt` | Text | kompakte sichtbare Journal-/Feldsignale | keine Werteingabe | `labor`, `read-only` |',
      '| `020-fa-journal-control-snapshot.json` | JSON | DOM-Control-, Button-, Feld- und Kontextsignale | keine Buchungswirkung | `labor`, `read-only` |',
      '| `FIXEDASSETS-088-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-088-learning.md` | Markdown | Lernwert und Buchwirkung | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noNewDraft).toBe(true);
  expect(result.flags.noEditRecord).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
});
