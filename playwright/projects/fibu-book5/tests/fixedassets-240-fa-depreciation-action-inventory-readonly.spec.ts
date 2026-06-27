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

const CASE_ID = 'FIXEDASSETS-240-FA-DEPRECIATION-ACTION-INVENTORY-READONLY';
const TEST_ID = 'fixedassets-240';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(240_000);

type Candidate = {
  phase: string;
  frame: string;
  tagName: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  disabled: boolean;
  rect: { x: number; y: number; width: number; height: number };
};

type DropdownAttempt = {
  index: number;
  frame: string;
  label: string;
  rect: { x: number; y: number; width: number; height: number };
  clicked: boolean;
  blockedReason?: string;
};

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

async function collectCandidates(page: Page, phase: string) {
  const candidates: Candidate[] = [];
  const interesting =
    /Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen|Depreciation|Abschreibung|Preview Posting|Buchungsvorschau|Test Report|Post and Print|\bPost\b|\bBuchen\b|Related actions|Verwandte Aktionen|More options|Weitere Optionen|Process|Line|Page|Home|Start/i;

  for (const frame of page.frames()) {
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
          .slice(0, 160);
      }, interesting.source)
      .catch(() => []);

    for (const candidate of frameCandidates) {
      candidates.push({
        phase,
        frame: frame === page.mainFrame() ? 'main' : 'child',
        tagName: candidate.tagName,
        role: candidate.role,
        text: clean(candidate.text).slice(0, 220),
        ariaLabel: clean(candidate.ariaLabel).slice(0, 220),
        title: clean(candidate.title).slice(0, 260),
        disabled: candidate.disabled,
        rect: candidate.rect,
      });
    }
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.phase}|${candidate.frame}|${candidate.tagName}|${candidate.role}|${candidate.text}|${candidate.ariaLabel}|${candidate.title}|${candidate.rect.x}|${candidate.rect.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function findSafeDropdownButtons(page: Page) {
  const handles: { frameIndex: number; buttonIndex: number; label: string; rect: DropdownAttempt['rect'] }[] = [];
  const frames = page.frames();

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    const frame = frames[frameIndex];
    const buttons = frame.locator('button');
    const count = await buttons.count().catch(() => 0);
    for (let buttonIndex = 0; buttonIndex < count; buttonIndex += 1) {
      const button = buttons.nth(buttonIndex);
      const box = await button.boundingBox().catch(() => null);
      if (!box || box.width <= 0 || box.height <= 0) continue;
      const text = clean(await button.innerText({ timeout: 500 }).catch(() => ''));
      const ariaLabel = clean(await button.getAttribute('aria-label').catch(() => ''));
      const title = clean(await button.getAttribute('title').catch(() => ''));
      const label = `${text} ${ariaLabel} ${title}`.trim();
      if (!/Related actions|Verwandte Aktionen|More options|Weitere Optionen|Open menu|Show more/i.test(label)) continue;
      if (/\b(New|Neu|Edit|Bearbeiten|Delete|Loeschen|Post|Buchen|Preview|Vorschau|Calculate|Berechnen|Payment|Invoice|Ship)\b/i.test(text)) continue;
      if (/^Menu fu r /i.test(ariaLabel) || /^Sortieren nach /i.test(title)) continue;
      handles.push({
        frameIndex,
        buttonIndex,
        label: clean(label).slice(0, 220),
        rect: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
      });
    }
  }

  const seen = new Set<string>();
  return handles.filter((handle) => {
    const key = `${handle.frameIndex}|${handle.label}|${handle.rect.x}|${handle.rect.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasCandidate(candidates: Candidate[], pattern: RegExp) {
  return candidates.some((candidate) => pattern.test(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`));
}

function relevantActionCandidates(candidates: Candidate[]) {
  const relevant =
    /Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen|Preview Posting|Buchungsvorschau|Post and Print|Test Report|Insert FA Bal\. Account|Apply Entries|\bPost\b|\bBuchen\b|Weitere Optionen|More options|FA Posting Type|Depreciation Book Code/i;
  return candidates
    .filter((candidate) => relevant.test(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`))
    .filter((candidate) => !/^Sortieren nach /i.test(candidate.title))
    .filter((candidate) => !/^Menu fu r /i.test(candidate.ariaLabel))
    .filter((candidate) => candidate.tagName !== 'span')
    .slice(0, 40);
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-240 - FA Depreciation Action Inventory Read-only',
    '',
    'Status: `read-only`, `action-inventory`, `no-executing-action-click`, `no-calculate-depreciation`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Instanz | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Resultat | ${result.resultStatus} |`,
    `| Dropdown-Versuche | ${result.dropdownAttempts.length} |`,
    `| Calculate Depreciation gefunden | ${result.actionSignals.calculateDepreciationVisible ? 'ja' : 'nein'} |`,
    `| Preview Posting gefunden | ${result.actionSignals.previewPostingVisible ? 'ja' : 'nein'} |`,
    '',
    '## Was geprueft wurde',
    '',
    '- Fixed Asset G/L Journals wurde in `MCP_1_20260210` / `RM-DEMO` read-only geoeffnet.',
    '- Nur nicht-ausfuehrende Related-Actions-/More-Options-Buttons wurden geoeffnet.',
    '- Sichtbare Aktionskandidaten wurden gelesen und klassifiziert.',
    '- Kein Menueeintrag und keine ausfuehrende Aktion wurde geklickt.',
    '',
    '## Lernwert',
    '',
    'Fuer die AfA-Klickanleitung reicht ein sichtbares `Preview Posting` im Post-Menue nicht. Erst muss klar sein, wo Business Central die AfA-Zeilen erzeugt oder berechnet. Dieser Lauf sucht deshalb nur nach dem Aktionspfad und trennt Navigation strikt von Ausfuehrung.',
    '',
    '## Grenzen',
    '',
    '- Keine AfA-Zeile angelegt.',
    '- `Calculate Depreciation` nicht geklickt.',
    '- `Preview Posting` nicht geklickt.',
    '- Keine Buchung.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-240 inventories depreciation actions read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await page.goto(journalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal|Post/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const context = await sandboxContext(page);
  const beforeDialog = await detectDangerousDialog(page, 'before-action-inventory');
  const beforeText = await pageText(page);
  const routeVisible = context.environmentInUrl && context.companyInUrl && /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal/i.test(beforeText);

  const allCandidates: Candidate[] = [...(await collectCandidates(page, 'initial'))];
  const dropdownAttempts: DropdownAttempt[] = [];
  const safeDropdowns = routeVisible && beforeDialog.ok ? (await findSafeDropdownButtons(page)).slice(0, 8) : [];

  for (let index = 0; index < safeDropdowns.length; index += 1) {
    const target = safeDropdowns[index];
    const frame = page.frames()[target.frameIndex];
    const button = frame?.locator('button').nth(target.buttonIndex);
    if (!frame || !button) continue;
    const attempt: DropdownAttempt = {
      index,
      frame: frame === page.mainFrame() ? 'main' : 'child',
      label: target.label,
      rect: target.rect,
      clicked: false,
    };

    if (/\b(Post|Preview|Calculate|Delete|Edit|New|Invoice|Ship|Payment)\b/i.test(target.label)) {
      attempt.blockedReason = 'label-looks-executing';
      dropdownAttempts.push(attempt);
      continue;
    }

    await button.click({ timeout: 5000 });
    attempt.clicked = true;
    await page.waitForTimeout(600);
    allCandidates.push(...(await collectCandidates(page, `dropdown-${index}`)));
    const dialog = await detectDangerousDialog(page, `after-dropdown-${index}`);
    if (!dialog.ok) {
      attempt.blockedReason = `dangerous-dialog:${dialog.dangerous.join(' | ')}`;
      dropdownAttempts.push(attempt);
      break;
    }
    dropdownAttempts.push(attempt);
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(250);
  }

  const afterDialog = await detectDangerousDialog(page, 'after-action-inventory');
  const afterText = await pageText(page);
  const compactText = clean(
    await compactPageText(page, {
      include: [
        /MCP_1_20260210|RM-DEMO|Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal|Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen|Preview Posting|Post and Print|Test Report|Process|Line|Page|Start|Home|Post|Buchen/i,
      ],
      maxLines: 260,
      maxLineLength: 280,
    }),
  );

  const actionSignals = {
    calculateDepreciationVisible:
      /Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen/i.test(afterText) ||
      hasCandidate(allCandidates, /Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen/i),
    previewPostingVisible:
      /Preview Posting|Buchungsvorschau/i.test(afterText) || hasCandidate(allCandidates, /Preview Posting|Buchungsvorschau/i),
    postVisible: /\bPost\b|\bBuchen\b/i.test(afterText) || hasCandidate(allCandidates, /\bPost\b|\bBuchen\b/i),
    testReportVisible: /Test Report/i.test(afterText) || hasCandidate(allCandidates, /Test Report/i),
  };

  const dangerousDropdownBlockers = dropdownAttempts.filter((attempt) => attempt.blockedReason?.startsWith('dangerous-dialog'));
  const blockedBy = [
    ...(context.environmentInUrl ? [] : ['wrong-instance']),
    ...(context.companyInUrl ? [] : ['wrong-company']),
    ...(context.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
    ...(routeVisible ? [] : ['fixed-asset-gl-journal-route-not-visible']),
    ...(beforeDialog.ok ? [] : beforeDialog.dangerous.map((dialog) => `dangerous-dialog-before:${dialog}`)),
    ...(afterDialog.ok ? [] : afterDialog.dangerous.map((dialog) => `dangerous-dialog-after:${dialog}`)),
    ...dangerousDropdownBlockers.map((attempt) => attempt.blockedReason ?? 'dangerous-dialog-after-dropdown'),
  ];
  const resultStatus = blockedBy.length ? 'blocked' : 'observed';
  const nextCaseId =
    resultStatus === 'observed' && actionSignals.calculateDepreciationVisible
      ? 'FIXEDASSETS-241-FA-CALCULATE-DEPRECIATION-DECISION'
      : 'FIXEDASSETS-241-FA-DEPRECIATION-ROUTE-REVIEW';
  const nextCaseFile =
    resultStatus === 'observed' && actionSignals.calculateDepreciationVisible
      ? '.agent/state/cases/fixedassets-241-fa-calculate-depreciation-decision.json'
      : '.agent/state/cases/fixedassets-241-fa-depreciation-route-review.json';
  const nextStep =
    resultStatus === 'observed' && actionSignals.calculateDepreciationVisible
      ? 'FIXEDASSETS-241: locally decide whether a later guarded Calculate Depreciation run may be unlocked; no Preview or Post yet.'
      : 'FIXEDASSETS-241: review FA-240 action inventory because Calculate Depreciation was not found through safe non-executing dropdowns.';

  const uniqueCandidates = allCandidates.filter((candidate, index, list) => {
    const key = `${candidate.phase}|${candidate.frame}|${candidate.text}|${candidate.ariaLabel}|${candidate.title}|${candidate.rect.x}|${candidate.rect.y}`;
    return list.findIndex((entry) => `${entry.phase}|${entry.frame}|${entry.text}|${entry.ariaLabel}|${entry.title}|${entry.rect.x}|${entry.rect.y}` === key) === index;
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-240-fa-depreciation-action-inventory-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-depreciation-action-inventory',
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
    executingActionClicked: false,
    menuItemClicked: false,
    page: {
      pageId: 5628,
      expectedName: 'Fixed Asset G/L Journals',
      url: safeUrl(page.url()),
    },
    context,
    route: {
      routeVisible,
      fixedAssetGlJournalVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal/i.test(beforeText),
    },
    dialogState: {
      before: beforeDialog,
      after: afterDialog,
    },
    dropdownAttempts,
    actionSignals,
    actionCandidates: relevantActionCandidates(uniqueCandidates),
    decision: {
      actionInventoryComplete: resultStatus === 'observed',
      calculateDepreciationPathFound: resultStatus === 'observed' && actionSignals.calculateDepreciationVisible,
      calculateDepreciationUnlocked: false,
      previewExecutionUnlocked: false,
      postingUnlocked: false,
      journalLineUnlocked: false,
      requiresLocalDecisionBeforeAnyExecutingAction: true,
    },
    proved: [
      ...(routeVisible ? ['Fixed Asset G/L Journals route is visible read-only in MCP_1_20260210 / RM-DEMO.'] : []),
      ...((dropdownAttempts.some((attempt) => attempt.clicked)
        ? ['At least one non-executing related-actions or more-options dropdown was opened read-only.']
        : [])),
      ...(actionSignals.calculateDepreciationVisible ? ['Calculate Depreciation action text/candidate is visible read-only.'] : []),
      ...(actionSignals.previewPostingVisible ? ['Preview Posting action text/candidate is visible read-only.'] : []),
      'No executing action or menu item was clicked.',
      'No journal line, Calculate Depreciation, Preview Posting, Post, setup change, company switch, API shortcut or book change was executed.',
    ],
    notProved: [
      ...(actionSignals.calculateDepreciationVisible ? [] : ['No Calculate Depreciation path was found through safe non-executing dropdowns.']),
      'No depreciation journal line exists from this run.',
      'No depreciation calculation was executed.',
      'No depreciation Preview Posting was executed.',
      'No depreciation posting was executed.',
      'No German final fixed asset proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-240-fa-depreciation-action-inventory-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-240/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-240/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-240/FIXEDASSETS-240-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-240/FIXEDASSETS-240-FA-DEPRECIATION-ACTION-INVENTORY-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-240/010-action-inventory.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-240/010-action-inventory-page-text.txt',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-240-fa-depreciation-action-inventory-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      activeCase: {
        status: resultStatus === 'observed' ? 'observed-readonly-action-inventory' : 'blocked-readonly-action-inventory',
        lastResult: {
          status: resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-240/FIXEDASSETS-240-result.json',
          summary:
            resultStatus === 'observed'
              ? 'FA-240 inventoried depreciation-related action candidates read-only without executing actions.'
              : `FA-240 blocked: ${blockedBy.join(', ')}`,
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
      noMenuItemClick: true,
      noExecutingActionClick: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep,
  };

  await writeTextEvidence(faEvidencePath('010-action-inventory-page-text.txt'), compactText || 'No compact action inventory text captured.');
  await writeJsonEvidence(faEvidencePath('010-action-inventory.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    purpose: 'read-only-depreciation-action-inventory',
    page: result.page,
    context,
    route: result.route,
    dialogState: result.dialogState,
    dropdownAttempts,
    actionSignals,
    actionCandidates: result.actionCandidates,
    status: resultStatus,
  });
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-240-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-240-FA-DEPRECIATION-ACTION-INVENTORY-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-240 Evidence Index',
      '',
      'Status: read-only, action-inventory, no-executing-action-click, no-calculate-depreciation, no-preview, no-posting, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-240-result.json` | JSON-Ergebnis | strukturierte Action-Inventory-Entscheidung | keine AfA-Ausfuehrung | observed/blocked |',
      '| `FIXEDASSETS-240-FA-DEPRECIATION-ACTION-INVENTORY-READONLY.md` | Lernzusammenfassung | warum Aktionspfad vor Ausfuehrung getrennt wird | keinen deutschen Finalnachweis | labor |',
      '| `010-action-inventory.json` | UI-/Action-Inventar | sichtbare Aktionskandidaten nach sicheren Dropdowns | keine ausgefuehrte Aktion | read-only |',
      '| `010-action-inventory-page-text.txt` | kompakter Seitentext | sichtbare Aktionssignale | keine Rohseite | read-only |',
      '',
      `Aktuelle Wahrheit: ${resultStatus === 'observed' ? 'Action Inventory read-only abgeschlossen; Ausfuehrung bleibt lokal zu entscheiden.' : `Action Inventory blockiert: ${blockedBy.join(', ')}`}`,
      '',
    ].join('\n'),
  );

  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|production-environment-visible|dangerous-dialog/i.test(entry))).toEqual([]);
});
