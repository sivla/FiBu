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

const CASE_ID = 'FIXEDASSETS-236-FA-DEPRECIATION-JOURNAL-ROUTE-READONLY';
const TEST_ID = 'fixedassets-236';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function journalUrl() {
  const url = new URL(bcPageUrl(5628, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
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

async function detectDangerousDialog(page: Page, phase: string) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const count = await scope.locator('[role="dialog"], [aria-modal="true"]').count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await scope.locator('[role="dialog"], [aria-modal="true"]').nth(index).innerText({ timeout: 500 }).catch(() => '');
      if (text.trim()) dialogs.push(clean(text));
    }
  }
  const dangerous = dialogs.filter((text) =>
    /\b(Post|Preview|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish|Calculate Depreciation|Abschreibung berechnen|AfA berechnen)\b/i.test(text),
  );
  return { phase, dialogs, dangerous, ok: dangerous.length === 0 };
}

type ActionCandidate = {
  frame: string;
  tagName: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  disabled: boolean;
  rect: { x: number; y: number; width: number; height: number };
};

async function collectActionCandidates(page: Page) {
  const candidates: ActionCandidate[] = [];
  const interesting =
    /Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen|Preview Posting|Buchungsvorschau|Post and Print|Buchen und drucken|\bPost\b|\bBuchen\b|\bNew\b|\bNeu\b|\bEdit\b|\bBearbeiten\b/i;

  for (const frame of [page.mainFrame(), ...page.frames().filter((frame) => frame !== page.mainFrame())]) {
    const frameCandidates = await frame
      .evaluate((patternSource) => {
        const pattern = new RegExp(patternSource, 'i');
        const nodes = Array.from(document.querySelectorAll('button,a,[role="button"],[role="menuitem"],[aria-label],[title]'));
        return nodes
          .map((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const ariaLabel = element.getAttribute('aria-label') || '';
            const title = element.getAttribute('title') || '';
            const role = element.getAttribute('role') || '';
            const label = `${text} ${ariaLabel} ${title}`.trim();
            return {
              tagName: element.tagName.toLowerCase(),
              role,
              text,
              ariaLabel,
              title,
              disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
              visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              label,
            };
          })
          .filter((entry) => entry.visible && pattern.test(entry.label))
          .slice(0, 80);
      }, interesting.source)
      .catch(() => []);

    for (const candidate of frameCandidates) {
      candidates.push({
        frame: frame === page.mainFrame() ? 'main' : 'child',
        tagName: candidate.tagName,
        role: candidate.role,
        text: clean(candidate.text).slice(0, 180),
        ariaLabel: clean(candidate.ariaLabel).slice(0, 180),
        title: clean(candidate.title).slice(0, 180),
        disabled: candidate.disabled,
        rect: candidate.rect,
      });
    }
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.frame}|${candidate.tagName}|${candidate.text}|${candidate.ariaLabel}|${candidate.title}|${candidate.rect.x}|${candidate.rect.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasCandidate(candidates: ActionCandidate[], pattern: RegExp) {
  return candidates.some((candidate) => pattern.test(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`));
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-236 - FA Depreciation Journal Route Read-only',
    '',
    'Status: `read-only`, `route-discovery`, `no-journal-line`, `no-calculate-depreciation`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Instanz | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Page | ${result.page.pageId} / ${result.page.expectedName} |`,
    `| Resultat | ${result.resultStatus} |`,
    `| Route sichtbar | ${result.route.routeVisible ? 'ja' : 'nein'} |`,
    `| Calculate Depreciation sichtbar | ${result.actionSignals.calculateDepreciationVisible ? 'ja' : 'nein'} |`,
    `| Preview Posting sichtbar | ${result.actionSignals.previewPostingVisible ? 'ja' : 'nein'} |`,
    `| Post sichtbar | ${result.actionSignals.postVisible ? 'ja' : 'nein'} |`,
    '',
    '## Was geprueft wurde',
    '',
    '- Die Fixed-Asset-G/L-Journal-Route wurde direkt per BC-Page-Kontext geoeffnet.',
    '- Aktionskandidaten wurden nur gelesen, nicht geklickt.',
    '- Dialoge wurden als Stop-Signal behandelt.',
    '- Es wurde keine Journalzeile angelegt, bearbeitet oder geloescht.',
    '',
    '## Lernwert',
    '',
    'Vor einer Abschreibungsbuchung muss die Klickroute selbst bekannt sein: Wo liegt das Anlagenjournal, welche Aktionen sind sichtbar, und welche davon waeren gefaehrlich? Dieser Lauf beweist nur die Route und die sichtbaren Aktionskandidaten. Er beweist noch keine Abschreibungsrechnung.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.',
    '- `Calculate Depreciation` wurde nicht ausgefuehrt.',
    '- `Preview Posting` wurde nicht ausgefuehrt.',
    '- Es wurde nicht gebucht.',
    '- Aus sichtbaren Aktionsnamen folgt noch keine fachlich richtige AfA-Berechnung.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-236 discovers fixed asset depreciation journal route read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await page.goto(journalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal|Depreciation|Post/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const context = await sandboxContext(page);
  const dialogState = await detectDangerousDialog(page, 'after-open');
  const fullText = await pageText(page);
  const candidates = await collectActionCandidates(page);
  const compactText = clean(
    await compactPageText(page, {
      include: [
        /MCP_1_20260210|RM-DEMO|Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal|Batch Name|DEFAULT|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book Code|Bal\. Account|Amount|Calculate Depreciation|Preview Posting|Post and Print|\bPost\b|G05001|FA-CNC-01|Acquisition Cost/i,
      ],
      maxLines: 240,
      maxLineLength: 280,
    }),
  );

  const journalSignals = {
    fixedAssetGlJournalVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal/i.test(fullText),
    batchNameVisible: /Batch Name|DEFAULT/i.test(fullText),
    postingDateVisible: /Posting Date/i.test(fullText),
    documentNoVisible: /Document No\./i.test(fullText),
    accountTypeVisible: /Account Type/i.test(fullText),
    accountNoVisible: /Account No\./i.test(fullText),
    faPostingTypeVisible: /FA Posting Type/i.test(fullText),
    depreciationBookCodeVisible: /Depreciation Book Code|Depreciation Book/i.test(fullText),
    amountVisible: /\bAmount\b/i.test(fullText),
    existingAcquisitionLineSignal: /G05001|FA-CNC-01|Acquisition Cost/i.test(fullText),
  };

  const actionSignals = {
    calculateDepreciationVisible:
      /Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen/i.test(fullText) ||
      hasCandidate(candidates, /Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen/i),
    previewPostingVisible:
      /Preview Posting|Buchungsvorschau/i.test(fullText) || hasCandidate(candidates, /Preview Posting|Buchungsvorschau/i),
    postVisible: /\bPost\b|\bBuchen\b/i.test(fullText) || hasCandidate(candidates, /\bPost\b|\bBuchen\b/i),
    postAndPrintVisible:
      /Post and Print|Buchen und drucken/i.test(fullText) || hasCandidate(candidates, /Post and Print|Buchen und drucken/i),
    newVisible: /\bNew\b|\bNeu\b/i.test(fullText) || hasCandidate(candidates, /\bNew\b|\bNeu\b/i),
    editVisible: /\bEdit\b|\bBearbeiten\b/i.test(fullText) || hasCandidate(candidates, /\bEdit\b|\bBearbeiten\b/i),
  };

  const routeVisible = context.environmentInUrl && context.companyInUrl && journalSignals.fixedAssetGlJournalVisible;
  const blockedBy = [
    ...(context.environmentInUrl ? [] : ['wrong-instance']),
    ...(context.companyInUrl ? [] : ['wrong-company']),
    ...(context.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
    ...(dialogState.ok ? [] : dialogState.dangerous.map((dialog) => `dangerous-dialog:${dialog}`)),
    ...(routeVisible ? [] : ['fixed-asset-gl-journal-route-not-visible']),
  ];

  const resultStatus = blockedBy.length ? 'blocked' : 'observed';
  const depreciationActionRouteVisible = actionSignals.calculateDepreciationVisible || actionSignals.previewPostingVisible;
  const nextCaseId =
    resultStatus === 'observed' && depreciationActionRouteVisible
      ? 'FIXEDASSETS-237-FA-DEPRECIATION-PREVIEW-ONLY-EXECUTION-PLAN'
      : resultStatus === 'observed'
        ? 'FIXEDASSETS-237-FA-DEPRECIATION-ACTION-MENU-PLAN'
        : 'FIXEDASSETS-237-FA-DEPRECIATION-ROUTE-BLOCKER-REVIEW';
  const nextCaseFile =
    resultStatus === 'observed' && depreciationActionRouteVisible
      ? '.agent/state/cases/fixedassets-237-fa-depreciation-preview-only-execution-plan.json'
      : resultStatus === 'observed'
        ? '.agent/state/cases/fixedassets-237-fa-depreciation-action-menu-plan.json'
        : '.agent/state/cases/fixedassets-237-fa-depreciation-route-blocker-review.json';
  const nextStep =
    resultStatus === 'observed' && depreciationActionRouteVisible
      ? 'FIXEDASSETS-237: locally plan a guarded depreciation Preview Posting-only run; no posting.'
      : resultStatus === 'observed'
        ? 'FIXEDASSETS-237: locally plan safe read-only action-menu discovery because Calculate Depreciation and Preview Posting were not visible on the first route view.'
        : 'FIXEDASSETS-237: review the read-only depreciation route blocker before any live run.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-236-fa-depreciation-journal-route-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-depreciation-route-discovery',
    resultStatus,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    dataBasis: 'CRONUS USA laboratory',
    bcRun: true,
    playwrightRun: true,
    postedInThisRun: false,
    previewPostingInThisRun: false,
    setupChanged: false,
    companySwitched: false,
    apiShortcut: false,
    bookChanged: false,
    journalLineInserted: false,
    journalLineEdited: false,
    journalLineDeleted: false,
    calculateDepreciationClicked: false,
    page: {
      pageId: 5628,
      expectedName: 'Fixed Asset G/L Journals',
      url: safeUrl(page.url()),
    },
    context,
    dialogState,
    route: {
      routeVisible,
      journalSignals,
      actionCandidateCount: candidates.length,
    },
    actionSignals,
    actionCandidates: candidates.slice(0, 80),
    decision: {
      routeDiscoveryComplete: resultStatus === 'observed',
      depreciationActionRouteVisible,
      previewOnlyExecutionPlanningUnlocked: resultStatus === 'observed' && depreciationActionRouteVisible,
      previewExecutionUnlocked: false,
      postingUnlocked: false,
      journalLineUnlocked: false,
      requiresLocalPlanBeforeAnyClick: true,
    },
    proved: [
      ...(routeVisible ? ['Fixed Asset G/L Journal route is visible read-only in MCP_1_20260210 / RM-DEMO.'] : []),
      ...(actionSignals.calculateDepreciationVisible ? ['Calculate Depreciation action text/candidate is visible read-only.'] : []),
      ...(actionSignals.previewPostingVisible ? ['Preview Posting action text/candidate is visible read-only.'] : []),
      ...(actionSignals.postVisible ? ['Post action text/candidate is visible read-only and must stay guarded.'] : []),
      'No journal line was inserted, edited or deleted.',
      'No Calculate Depreciation, Preview Posting, Post, setup change, company switch, API shortcut or book change was executed.',
    ],
    notProved: [
      ...(routeVisible ? [] : ['Fixed Asset G/L Journal route could not be proven.']),
      'No depreciation journal line exists from this run.',
      'No depreciation calculation was executed.',
      'No Preview Posting was executed.',
      'No depreciation posting was executed.',
      'No German final fixed asset proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-236-fa-depreciation-journal-route-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-236/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-236/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-236/FIXEDASSETS-236-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-236/FIXEDASSETS-236-FA-DEPRECIATION-JOURNAL-ROUTE-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-236/010-fa-gl-journal-route-readonly.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-236/010-fa-gl-journal-route-readonly-page-text.txt',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-236-fa-depreciation-journal-route-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      activeCase: {
        status: resultStatus === 'observed' ? 'observed-readonly-route' : 'blocked-readonly-route',
        lastResult: {
          status: resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-236/FIXEDASSETS-236-result.json',
          summary:
            resultStatus === 'observed'
              ? 'FA-236 observed Fixed Asset G/L Journal route and guarded depreciation/posting actions read-only.'
              : `FA-236 blocked: ${blockedBy.join(', ')}`,
        },
        nextSafeAction: nextStep,
      },
    },
    flags: {
      noPosting: true,
      noPreviewPosting: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noDraft: true,
      noEdit: true,
      noDelete: true,
      noJournalLine: true,
      noCalculateDepreciation: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep,
  };

  await writeTextEvidence(faEvidencePath('010-fa-gl-journal-route-readonly-page-text.txt'), compactText || 'No compact route text captured.');
  await writeJsonEvidence(faEvidencePath('010-fa-gl-journal-route-readonly.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    purpose: 'read-only-route-and-action-inventory',
    page: result.page,
    context,
    dialogState,
    route: result.route,
    actionSignals,
    actionCandidates: result.actionCandidates,
    status: resultStatus,
  });
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-236-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-236-FA-DEPRECIATION-JOURNAL-ROUTE-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-236 Evidence Index',
      '',
      'Status: read-only, route-discovery, no-journal-line, no-calculate-depreciation, no-preview, no-posting, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-236-result.json` | JSON-Ergebnis | strukturierte Route-/Action-Entscheidung | keine AfA-Berechnung | observed/blocked |',
      '| `FIXEDASSETS-236-FA-DEPRECIATION-JOURNAL-ROUTE-READONLY.md` | Lernzusammenfassung | warum Route und gefaehrliche Aktionen vor AfA getrennt gelesen werden | keinen deutschen Finalnachweis | labor |',
      '| `010-fa-gl-journal-route-readonly.json` | UI-/Action-Inventar | sichtbare Aktionskandidaten auf der FA-G/L-Journal-Route | keine ausgefuehrte Aktion | read-only |',
      '| `010-fa-gl-journal-route-readonly-page-text.txt` | kompakter Seitentext | sichtbare Journal-/Aktionssignale | keine Rohseite | read-only |',
      '',
      `Aktuelle Wahrheit: ${resultStatus === 'observed' ? 'Route read-only beobachtet; naechster Schritt ist ein lokaler Guard-Plan.' : `Route blockiert: ${blockedBy.join(', ')}`}`,
      '',
    ].join('\n'),
  );

  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|production-environment-visible|dangerous-dialog/i.test(entry))).toEqual([]);
});
