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

const CASE_ID = 'FIXEDASSETS-238-FA-DEPRECIATION-POST-DROPDOWN-READONLY';
const TEST_ID = 'fixedassets-238';
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

type MenuCandidate = {
  frame: string;
  tagName: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  disabled: boolean;
  rect: { x: number; y: number; width: number; height: number };
};

async function clickPostRelatedActionsDropdown(page: Page) {
  for (const frame of page.frames()) {
    const button = frame
      .locator('button')
      .filter({ hasText: /^$/ })
      .filter({ hasNotText: /^Post$/ })
      .and(frame.locator('button[aria-label*="Post"], button[title*="Post"], button[aria-label*="Verwandte Aktionen"], button[title*="Verwandte Aktionen"]'))
      .first();
    if ((await button.count().catch(() => 0)) === 0) continue;
    const box = await button.boundingBox().catch(() => null);
    if (!box || box.width <= 0 || box.height <= 0) continue;
    await button.click({ timeout: 5000 });
    return {
      frame: frame === page.mainFrame() ? 'main' : 'child',
      clicked: true,
      rect: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
    };
  }

  for (const frame of page.frames()) {
    const fallback = frame.locator('button[aria-label*="Verwandte Aktionen"], button[title*="Verwandte Aktionen"]').first();
    if ((await fallback.count().catch(() => 0)) === 0) continue;
    const box = await fallback.boundingBox().catch(() => null);
    if (!box || box.width <= 0 || box.height <= 0) continue;
    const text = clean(await fallback.innerText({ timeout: 500 }).catch(() => ''));
    if (/^Post$/i.test(text)) continue;
    await fallback.click({ timeout: 5000 });
    return {
      frame: frame === page.mainFrame() ? 'main' : 'child',
      clicked: true,
      rect: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
    };
  }

  return { frame: '', clicked: false, rect: null };
}

async function collectVisibleMenuCandidates(page: Page) {
  const candidates: MenuCandidate[] = [];
  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], button, a'));
        return nodes
          .map((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const ariaLabel = element.getAttribute('aria-label') || '';
            const title = element.getAttribute('title') || '';
            const role = element.getAttribute('role') || '';
            return {
              tagName: element.tagName.toLowerCase(),
              role,
              text,
              ariaLabel,
              title,
              disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
              visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => entry.visible && (entry.role === 'menuitem' || /Preview|Post|Print|Buchen|Vorschau|Calculate|Depreciation|Abschreibung|AfA/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`)))
          .slice(0, 120);
      })
      .catch(() => []);

    for (const candidate of frameCandidates) {
      candidates.push({
        frame: frame === page.mainFrame() ? 'main' : 'child',
        tagName: candidate.tagName,
        role: candidate.role,
        text: clean(candidate.text).slice(0, 220),
        ariaLabel: clean(candidate.ariaLabel).slice(0, 220),
        title: clean(candidate.title).slice(0, 220),
        disabled: candidate.disabled,
        rect: candidate.rect,
      });
    }
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.frame}|${candidate.tagName}|${candidate.role}|${candidate.text}|${candidate.ariaLabel}|${candidate.title}|${candidate.rect.x}|${candidate.rect.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasCandidate(candidates: MenuCandidate[], pattern: RegExp) {
  return candidates.some((candidate) => pattern.test(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`));
}

function relevantMenuCandidates(candidates: MenuCandidate[]) {
  const relevant = /Preview Posting|Post and Print|Test Report|Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen|\bPost\b|\bBuchen\b/i;
  return candidates
    .filter((candidate) => relevant.test(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`))
    .filter((candidate) => !/^Menu fu r /i.test(candidate.ariaLabel) && !/^Sortieren nach /i.test(candidate.title))
    .slice(0, 30);
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-238 - FA Post-Dropdown Read-only',
    '',
    'Status: `read-only`, `menu-inventory`, `no-menuitem-click`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Instanz | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Dropdown geoeffnet | ${result.dropdown.clicked ? 'ja' : 'nein'} |`,
    `| Preview Posting gefunden | ${result.menuSignals.previewPostingMenuVisible ? 'ja' : 'nein'} |`,
    `| Calculate Depreciation gefunden | ${result.menuSignals.calculateDepreciationMenuVisible ? 'ja' : 'nein'} |`,
    `| Post gefunden | ${result.menuSignals.postMenuVisible ? 'ja' : 'nein'} |`,
    `| Resultat | ${result.resultStatus} |`,
    '',
    '## Was geprueft wurde',
    '',
    '- Fixed Asset G/L Journals wurde read-only geoeffnet.',
    '- Nur der kleine Related-Actions-/Dropdown-Button neben `Post` wurde geoeffnet.',
    '- Menueeintraege wurden gelesen und klassifiziert.',
    '- Kein Menueeintrag wurde geklickt.',
    '',
    '## Lernwert',
    '',
    'Split-Buttons sind in Business Central ein zentrales Sicherheitsmuster. Der Hauptbutton `Post` fuehrt aus; der kleine Dropdown-/Related-Actions-Teil kann Optionen anzeigen. Fuer Klickanleitungen muss genau dieser Unterschied sichtbar werden, bevor eine Buchungsvorschau oder Buchung ueberhaupt geplant wird.',
    '',
    '## Grenzen',
    '',
    '- Keine AfA-Zeile.',
    '- Kein `Calculate Depreciation`.',
    '- Kein Preview Posting.',
    '- Keine Buchung.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-238 inventories Post dropdown menu read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await page.goto(journalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal|Post/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const beforeContext = await sandboxContext(page);
  const beforeDialog = await detectDangerousDialog(page, 'before-dropdown');
  const beforeText = await pageText(page);
  const routeVisible = beforeContext.environmentInUrl && beforeContext.companyInUrl && /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal/i.test(beforeText);

  const dropdown = routeVisible && beforeDialog.ok ? await clickPostRelatedActionsDropdown(page) : { frame: '', clicked: false, rect: null };
  await page.waitForTimeout(800);
  const afterDialog = await detectDangerousDialog(page, 'after-dropdown');
  const candidates = await collectVisibleMenuCandidates(page);
  const afterText = await pageText(page);
  const compactText = clean(
    await compactPageText(page, {
      include: [
        /MCP_1_20260210|RM-DEMO|Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal|Post|Preview Posting|Post and Print|Calculate Depreciation|Abschreibung|AfA|Buchungsvorschau|Buchen/i,
      ],
      maxLines: 240,
      maxLineLength: 280,
    }),
  );

  const menuSignals = {
    previewPostingMenuVisible:
      /Preview Posting|Buchungsvorschau/i.test(afterText) || hasCandidate(candidates, /Preview Posting|Buchungsvorschau/i),
    calculateDepreciationMenuVisible:
      /Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen/i.test(afterText) ||
      hasCandidate(candidates, /Calculate Depreciation|Calculate Deprec\.|Abschreibung berechnen|AfA berechnen/i),
    postMenuVisible: /\bPost\b|\bBuchen\b/i.test(afterText) || hasCandidate(candidates, /\bPost\b|\bBuchen\b/i),
    postAndPrintMenuVisible:
      /Post and Print|Buchen und drucken/i.test(afterText) || hasCandidate(candidates, /Post and Print|Buchen und drucken/i),
  };
  const relevantCandidates = relevantMenuCandidates(candidates);

  const blockedBy = [
    ...(beforeContext.environmentInUrl ? [] : ['wrong-instance']),
    ...(beforeContext.companyInUrl ? [] : ['wrong-company']),
    ...(beforeContext.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
    ...(routeVisible ? [] : ['fixed-asset-gl-journal-route-not-visible']),
    ...(beforeDialog.ok ? [] : beforeDialog.dangerous.map((dialog) => `dangerous-dialog-before:${dialog}`)),
    ...(afterDialog.ok ? [] : afterDialog.dangerous.map((dialog) => `dangerous-dialog-after:${dialog}`)),
    ...(dropdown.clicked ? [] : ['post-related-actions-dropdown-not-clicked']),
  ];
  const resultStatus = blockedBy.length ? 'blocked' : 'observed';
  const nextCaseId =
    resultStatus === 'observed' && menuSignals.previewPostingMenuVisible
      ? 'FIXEDASSETS-239-FA-DEPRECIATION-PREVIEW-MENU-DECISION'
      : 'FIXEDASSETS-239-FA-DEPRECIATION-MENU-RESULT-REVIEW';
  const nextCaseFile =
    resultStatus === 'observed' && menuSignals.previewPostingMenuVisible
      ? '.agent/state/cases/fixedassets-239-fa-depreciation-preview-menu-decision.json'
      : '.agent/state/cases/fixedassets-239-fa-depreciation-menu-result-review.json';
  const nextStep =
    resultStatus === 'observed' && menuSignals.previewPostingMenuVisible
      ? 'FIXEDASSETS-239: locally decide if the discovered Preview Posting menu item can be clicked in a later guarded Preview-only run.'
      : 'FIXEDASSETS-239: locally review the dropdown inventory; depreciation Preview Posting remains locked unless a safe menu path was found.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-238-fa-depreciation-post-dropdown-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-post-dropdown-menu-inventory',
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
    menuItemClicked: false,
    page: {
      pageId: 5628,
      expectedName: 'Fixed Asset G/L Journals',
      url: safeUrl(page.url()),
    },
    context: beforeContext,
    route: {
      routeVisible,
      fixedAssetGlJournalVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|FA G\/L Journal/i.test(beforeText),
    },
    dropdown,
    dialogState: {
      before: beforeDialog,
      after: afterDialog,
    },
    menuSignals,
    menuCandidates: relevantCandidates,
    decision: {
      dropdownInventoryComplete: resultStatus === 'observed',
      previewMenuPathFound: resultStatus === 'observed' && menuSignals.previewPostingMenuVisible,
      previewExecutionUnlocked: false,
      calculateDepreciationUnlocked: false,
      postingUnlocked: false,
      journalLineUnlocked: false,
      requiresLocalDecisionBeforeAnyMenuItemClick: true,
    },
    proved: [
      ...(routeVisible ? ['Fixed Asset G/L Journals route is visible read-only in MCP_1_20260210 / RM-DEMO.'] : []),
      ...(dropdown.clicked ? ['The non-executing Post related-actions/dropdown button was opened read-only.'] : []),
      ...(menuSignals.previewPostingMenuVisible ? ['Preview Posting menu text/candidate is visible read-only.'] : []),
      ...(menuSignals.calculateDepreciationMenuVisible ? ['Calculate Depreciation menu text/candidate is visible read-only.'] : []),
      'No menu item was clicked.',
      'No journal line, Calculate Depreciation, Preview Posting, Post, setup change, company switch, API shortcut or book change was executed.',
    ],
    notProved: [
      ...(menuSignals.previewPostingMenuVisible ? [] : ['No Preview Posting menu path was found.']),
      ...(menuSignals.calculateDepreciationMenuVisible ? [] : ['No Calculate Depreciation menu path was found.']),
      'No depreciation journal line exists from this run.',
      'No depreciation calculation was executed.',
      'No depreciation Preview Posting was executed.',
      'No depreciation posting was executed.',
      'No German final fixed asset proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-238-fa-depreciation-post-dropdown-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-238/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-238/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-238/FIXEDASSETS-238-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-238/FIXEDASSETS-238-FA-DEPRECIATION-POST-DROPDOWN-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-238/010-post-dropdown-menu-inventory.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-238/010-post-dropdown-menu-inventory-page-text.txt',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-238-fa-depreciation-post-dropdown-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      activeCase: {
        status: resultStatus === 'observed' ? 'observed-readonly-dropdown' : 'blocked-readonly-dropdown',
        lastResult: {
          status: resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-238/FIXEDASSETS-238-result.json',
          summary:
            resultStatus === 'observed'
              ? 'FA-238 inventoried the Post dropdown read-only without clicking menu items.'
              : `FA-238 blocked: ${blockedBy.join(', ')}`,
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
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep,
  };

  await writeTextEvidence(faEvidencePath('010-post-dropdown-menu-inventory-page-text.txt'), compactText || 'No compact dropdown menu text captured.');
  await writeJsonEvidence(faEvidencePath('010-post-dropdown-menu-inventory.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    purpose: 'read-only-post-dropdown-menu-inventory',
    page: result.page,
    context: beforeContext,
    route: result.route,
    dropdown,
    dialogState: result.dialogState,
    menuSignals,
    menuCandidates: result.menuCandidates,
    status: resultStatus,
  });
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-238-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-238-FA-DEPRECIATION-POST-DROPDOWN-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-238 Evidence Index',
      '',
      'Status: read-only, menu-inventory, no-menuitem-click, no-preview, no-posting, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-238-result.json` | JSON-Ergebnis | strukturierter Dropdown-/Menuebefund | keine AfA-Ausfuehrung | observed/blocked |',
      '| `FIXEDASSETS-238-FA-DEPRECIATION-POST-DROPDOWN-READONLY.md` | Lernzusammenfassung | Split-Button-Grenze und naechsten Gate-Bedarf | keinen deutschen Finalnachweis | labor |',
      '| `010-post-dropdown-menu-inventory.json` | UI-/Menue-Inventar | sichtbare Menuekandidaten nach Dropdown | keine ausgefuehrte Menueaktion | read-only |',
      '| `010-post-dropdown-menu-inventory-page-text.txt` | kompakter Seitentext | sichtbare Menue-/Aktionssignale | keine Rohseite | read-only |',
      '',
      `Aktuelle Wahrheit: ${resultStatus === 'observed' ? 'Post-Dropdown read-only inventarisiert; Menueentscheidung bleibt lokal.' : `Dropdown blockiert: ${blockedBy.join(', ')}`}`,
      '',
    ].join('\n'),
  );

  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|production-environment-visible|dangerous-dialog/i.test(entry))).toEqual([]);
});
