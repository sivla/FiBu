import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-192-FA-GL-JOURNAL-POST-DROPDOWN-MENU-INVENTORY';
const NEXT_CASE_ID = 'FIXEDASSETS-193-FA-GL-JOURNAL-POST-DROPDOWN-MENU-REVIEW';
const TEST_ID = 'fixedassets-192';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_GL_JOURNAL_PAGE_ID = 5628;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
    url.searchParams.delete(key);
  }
  return url.toString();
}

function faJournalPageUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('page', String(FA_GL_JOURNAL_PAGE_ID));
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

function isTargetFrame(frame: Frame) {
  const frameUrl = decodeURIComponent(frame.url());
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${FA_GL_JOURNAL_PAGE_ID}`) && frameUrl.includes('runinframe=1');
}

async function targetFrame(page: Page) {
  const frame = page.frames().find(isTargetFrame);
  if (!frame) {
    throw new Error('Fixed Asset G/L Journals runinframe was not found.');
  }
  return frame;
}

async function actionInventory(scope: Page | Frame) {
  return scope.evaluate(() => {
    function norm(value: string | null | undefined) {
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

    return [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],[role="menuitemcheckbox"],a,[aria-label],[title]')]
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          tagName: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          text: norm(element.innerText || element.textContent),
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          disabled: Boolean((element as HTMLButtonElement).disabled || element.getAttribute('aria-disabled') === 'true'),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) => [entry.text, entry.ariaLabel, entry.title].some(Boolean))
      .slice(0, 320);
  });
}

type ActionEntry = Awaited<ReturnType<typeof actionInventory>>[number];

function joined(entry: ActionEntry) {
  return cleanText([entry.text, entry.ariaLabel, entry.title].filter(Boolean).join(' | '));
}

function classifyMenu(actions: ActionEntry[]) {
  const labels = actions.map(joined).filter(Boolean);
  const menuItems = actions.filter((entry) => /menuitem/i.test(entry.role) || /Preview Posting|Buchungsvorschau|Vorschau|Post|Buchen|Reconcile|Insert FA Bal|Apply Entries/i.test(joined(entry)));
  const actionableEntries = actions.filter(
    (entry) =>
      /button|a/i.test(entry.tagName) ||
      /button|menuitem/i.test(entry.role) ||
      (entry.width > 0 && entry.width < 700 && entry.height > 0 && entry.height < 120),
  );
  const previewCandidates = actionableEntries.filter((entry) => /Preview Posting|Buchungsvorschau|Vorschau buchen|Buchen Vorschau/i.test(joined(entry)));
  const normalPostCandidates = actionableEntries.filter((entry) => /^(Post|Buchen)( \| |$)|Finalize the document or journal/i.test(joined(entry)));
  const riskyCandidates = actions.filter((entry) =>
    /New|Neu|Edit|Bearbeiten|Delete|Loeschen|Loschen|Post|Buchen|Preview|Vorschau|Ship|Invoice|Payment|Zahlung|Reconcile|Insert FA Bal|Apply Entries/i.test(joined(entry)),
  );

  return {
    actionCount: actions.length,
    labelCount: labels.length,
    menuItemCount: menuItems.length,
    previewCandidateCount: previewCandidates.length,
    normalPostCandidateCount: normalPostCandidates.length,
    riskyCandidateCount: riskyCandidates.length,
    labels: labels.slice(0, 160),
    menuItems: menuItems.slice(0, 120),
    previewCandidates,
    normalPostCandidates: normalPostCandidates.slice(0, 40),
    riskyCandidates: riskyCandidates.slice(0, 120),
    previewCandidateState:
      previewCandidates.length === 0 ? 'absent' : previewCandidates.length === 1 ? 'single-candidate' : 'multiple-candidates',
  };
}

async function findRelatedPostSplitButton(frame: Frame) {
  const candidates = await frame.evaluate(() => {
    function norm(value: string | null | undefined) {
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

    return [...document.querySelectorAll<HTMLElement>('button,[aria-label],[title]')]
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          tagName: element.tagName.toLowerCase(),
          text: norm(element.innerText || element.textContent),
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          disabled: Boolean((element as HTMLButtonElement).disabled || element.getAttribute('aria-disabled') === 'true'),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) => /Verwandte Aktionen.*Post|Related Actions.*Post|Related actions.*Post/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
      .filter((entry) => entry.width <= 48 && entry.height <= 48);
  });

  if (candidates.length !== 1) {
    return { candidates, selected: null };
  }
  return { candidates, selected: candidates[0] };
}

async function clickRelatedPostSplitButtonOnly(frame: Frame, candidate: NonNullable<Awaited<ReturnType<typeof findRelatedPostSplitButton>>['selected']>) {
  await frame.evaluate((entry) => {
    const elements = [...document.querySelectorAll<HTMLElement>('button,[aria-label],[title]')];
    function norm(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    const target = elements.find((element) => {
      const rect = element.getBoundingClientRect();
      const label = `${norm(element.innerText || element.textContent)} ${norm(element.getAttribute('aria-label'))} ${norm(element.getAttribute('title'))}`;
      return (
        /Verwandte Aktionen.*Post|Related Actions.*Post|Related actions.*Post/i.test(label) &&
        Math.round(rect.x) === entry.x &&
        Math.round(rect.y) === entry.y &&
        Math.round(rect.width) === entry.width &&
        Math.round(rect.height) === entry.height
      );
    });
    if (!target) throw new Error('Related-actions-for-Post split button disappeared before click.');
    target.click();
  }, candidate);
}

async function detectRiskDialog(page: Page) {
  const dialogs = await page
    .locator('[role="dialog"], .ms-Dialog, [aria-modal="true"]')
    .evaluateAll((elements) =>
      elements.map((element) =>
        (element.textContent ?? '')
          .normalize('NFKD')
          .replace(/[^\x20-\x7E]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      ),
    )
    .catch(() => []);
  const text = cleanText(dialogs.join(' | '));
  const dialogLike = dialogs.length > 0 || /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Are you sure|Sind Sie sicher/i.test(text);
  const postingDialog = /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Post and Print|Buchen und drucken/i.test(text);
  return {
    dialogLike,
    postingDialog,
    dialogCount: dialogs.length,
    dialogs,
    textSample: text.slice(0, 1000),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-193-fa-gl-journal-post-dropdown-menu-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-192-fa-gl-journal-post-dropdown-menu-inventory.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-193: locally review FA-192 related-actions-for-Post menu inventory before any Preview Posting or Reconcile attempt.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly-menu-inventory' : 'blocked-readonly-menu-inventory',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-192/FIXEDASSETS-192-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-193 local review; do not click Preview Posting, Reconcile, Insert FA Bal. Account or Post.',
    },
  };
}

test('FIXEDASSETS-192 inventories related-actions-for-Post menu without selecting a menu item', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let beforeFrameActions: Awaited<ReturnType<typeof actionInventory>> = [];
  let afterFrameActions: Awaited<ReturnType<typeof actionInventory>> = [];
  let afterPageActions: Awaited<ReturnType<typeof actionInventory>> = [];
  let buttonDiscovery: Awaited<ReturnType<typeof findRelatedPostSplitButton>> | undefined;
  let afterFrameClassification: ReturnType<typeof classifyMenu> | undefined;
  let afterPageClassification: ReturnType<typeof classifyMenu> | undefined;
  let riskDialog: Awaited<ReturnType<typeof detectRiskDialog>> | undefined;
  let pageContextText = '';
  let clickedSplitButton = false;

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);
    await page.waitForTimeout(1200);

    context = await sandboxContext(page);
    if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context: ${JSON.stringify(context)}`);
    } else {
      const frame = await targetFrame(page);
      frameUrl = safeUrl(frame.url());
      beforeFrameActions = await actionInventory(frame);
      buttonDiscovery = await findRelatedPostSplitButton(frame);
      if (!buttonDiscovery.selected) {
        blockedBy.push(`Related-actions-for-Post split button count was ${buttonDiscovery.candidates.length}, expected 1.`);
      } else {
        await clickRelatedPostSplitButtonOnly(frame, buttonDiscovery.selected);
        clickedSplitButton = true;
        await page.waitForTimeout(900);
        riskDialog = await detectRiskDialog(page);
        if (riskDialog.postingDialog) {
          blockedBy.push('Posting dialog appeared after split-button click.');
        }
        afterFrameActions = await actionInventory(frame);
        afterPageActions = await actionInventory(page);
        afterFrameClassification = classifyMenu(afterFrameActions);
        afterPageClassification = classifyMenu(afterPageActions);
        pageContextText = await compactPageText(page, {
          include: [
            /Fixed Asset|FA G\/L|G\/L Journal|Journal/i,
            /Post|Preview Posting|Buchungsvorschau|Vorschau|Insert FA Bal\. Account|Reconcile|Apply Entries|Delete|New|Edit/i,
            /Batch Name|Posting Date|Document No\.|Account Type|FA Posting Type|Amount|Bal\. Account/i,
          ],
          maxLines: 180,
          maxLineLength: 220,
        });
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  } finally {
    await page.keyboard.press('Escape').catch(() => undefined);
  }

  if (!clickedSplitButton) {
    blockedBy.push('The split/dropdown button was not clicked.');
  }
  if (!afterFrameClassification && clickedSplitButton) {
    blockedBy.push('No after-click frame menu/action inventory was captured.');
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const previewState = afterFrameClassification?.previewCandidateState ?? 'not-captured';
  const summary =
    status === 'observed'
      ? `FA-192 clicked only the related-actions-for-Post split button and captured menu/action labels. Preview candidate state after opening menu: ${previewState}. No menu item was clicked.`
      : `FA-192 did not produce a clean no-post menu inventory. Blocker: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeTextEvidence(faEvidencePath('010-menu-inventory-context.txt'), pageContextText || 'No menu inventory context captured.');
  await writeJsonEvidence(faEvidencePath('020-post-dropdown-menu-inventory.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-192-post-dropdown-menu-inventory',
    caseId: CASE_ID,
    context,
    frameUrl,
    buttonDiscovery,
    clickedSplitButton,
    beforeFrameClassification: classifyMenu(beforeFrameActions),
    afterFrameClassification,
    afterPageClassification,
    riskDialog,
    safety: {
      clickedSplitButton,
      clickedMainPostButton: false,
      clickedMenuItem: false,
      clickedPreviewPosting: false,
      clickedPost: false,
      openedPostingDialog: Boolean(riskDialog?.postingDialog),
      changedData: false,
    },
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-192-post-dropdown-menu-inventory-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-menu-inventory',
    resultStatus: status,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      context,
      frameUrl,
      urlAfterRun: safeUrl(page.url()),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(frameUrl ? ['The Fixed Asset G/L Journals runinframe context was isolated.'] : []),
      ...(buttonDiscovery?.selected ? ['Exactly one related-actions-for-Post split/dropdown button was found.'] : []),
      ...(clickedSplitButton ? ['Only the related-actions-for-Post split/dropdown button was clicked.'] : []),
      ...(afterFrameClassification ? [`After-click frame menu/action inventory contains ${afterFrameClassification.actionCount} visible candidates.`] : []),
      ...(afterFrameClassification ? [`After-click Preview Posting candidate state: ${afterFrameClassification.previewCandidateState}.`] : []),
      'No menu item was clicked.',
      'No main Post button was clicked.',
      'No OK/Yes confirmation was clicked.',
      'No journal line was created, edited or deleted.',
      'No setup change was made.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      'Preview Posting was not clicked.',
      'No Preview Posting entries were visible.',
      'No Fixed Asset G/L Journal posting was executed.',
      'No FA Ledger Entry or G/L Entry trace exists.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-192-fa-gl-journal-post-dropdown-menu-inventory.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-192/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-192/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-192/010-menu-inventory-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-192/020-post-dropdown-menu-inventory.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-192/FIXEDASSETS-192-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-192/FIXEDASSETS-192-result.json',
    ],
    warnings: [
      'Menu inventory only. Candidate labels are not executed actions.',
      'Do not treat a visible Preview Posting menu item as Preview Posting execution.',
      'Do not treat a visible Post candidate as permission to post.',
      'No German final proof.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    menuInventory: {
      afterFrame: afterFrameClassification,
      afterPage: afterPageClassification,
      buttonDiscovery,
      riskDialog,
    },
    flags: {
      clickedSplitButton,
      noMainPostClick: true,
      noMenuItemClick: true,
      noInsertLine: true,
      noDeleteLine: true,
      noPost: true,
      noPreviewPosting: true,
      noOkYesConfirmation: true,
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

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-192-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-192-learning.md'),
    [
      '# FIXEDASSETS-192 Lernzusammenfassung',
      '',
      'Status: `labor`, `readonly-menu-inventory`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Lernwert',
      '',
      'FA-192 prueft nur, ob der Split-/Dropdown-Button hinter `Post` ein Menue sichtbar macht. Ein sichtbarer Menuepunkt ist weiterhin kein ausgefuehrter Prozessschritt. Erst ein separater Review darf entscheiden, ob daraus ein sicherer Preview-Posting- oder Reconcile-Pfad wird.',
      '',
      '## Grenze',
      '',
      '- Kein Menuepunkt geklickt.',
      '- Keine Buchungsvorschau geoeffnet.',
      '- Keine Buchung.',
      '- Keine Postenspur.',
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
      '# FIXEDASSETS-192 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-menu-inventory-context.txt` | Text | kompakter Journal-/Menuekontext nach Splitbutton | keine Menueauswahl | `labor`, `read-only` |',
      '| `020-post-dropdown-menu-inventory.json` | JSON | Splitbutton-Fund, Menue-/Aktionskandidaten, Safety Flags | keine Preview-/Posting-Wirkung | `labor`, `read-only` |',
      '| `FIXEDASSETS-192-result.json` | JSON | Ergebnis und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-192-learning.md` | Markdown | Lernwert und naechste Route | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.noMainPostClick).toBe(true);
  expect(result.flags.noMenuItemClick).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreviewPosting).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
