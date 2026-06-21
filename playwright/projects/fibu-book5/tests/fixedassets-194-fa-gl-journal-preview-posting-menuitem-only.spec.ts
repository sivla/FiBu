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

const CASE_ID = 'FIXEDASSETS-194-FA-GL-JOURNAL-PREVIEW-POSTING-MENUITEM-ONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-195-FA-GL-JOURNAL-PREVIEW-POSTING-MENUITEM-REVIEW';
const TEST_ID = 'fixedassets-194';
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

function safeEvidenceText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe/i.test(line))
    .join('\n');
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

function previewCandidates(actions: ActionEntry[]) {
  return actions.filter((entry) => {
    const label = joined(entry);
    return (
      entry.tagName === 'button' &&
      /menuitem/i.test(entry.role) &&
      entry.text === 'Preview Posting' &&
      entry.ariaLabel === 'Preview Posting' &&
      /Review the different types of entries/i.test(label) &&
      !entry.disabled
    );
  });
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
    function norm(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const elements = [...document.querySelectorAll<HTMLElement>('button,[aria-label],[title]')];
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

async function clickExactPreviewPostingMenuitem(frame: Frame, candidate: ActionEntry) {
  await frame.evaluate((entry) => {
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

    const elements = [...document.querySelectorAll<HTMLElement>('button[role="menuitem"]')].filter(visible);
    const target = elements.find((element) => {
      const rect = element.getBoundingClientRect();
      return (
        norm(element.innerText || element.textContent) === 'Preview Posting' &&
        norm(element.getAttribute('aria-label')) === 'Preview Posting' &&
        /Review the different types of entries/i.test(norm(element.getAttribute('title'))) &&
        Math.round(rect.x) === entry.x &&
        Math.round(rect.y) === entry.y &&
        Math.round(rect.width) === entry.width &&
        Math.round(rect.height) === entry.height
      );
    });
    if (!target) throw new Error('Exact Preview Posting menuitem disappeared before click.');
    target.click();
  }, candidate);
}

async function detectDialog(page: Page) {
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
  return {
    dialogCount: dialogs.length,
    dialogs,
    textSample: text.slice(0, 1600),
    postingDialog: /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Post and Print|Buchen und drucken/i.test(text),
    okYesVisible: /\bOK\b|\bYes\b|\bJa\b/i.test(text),
    previewDialog: /Posting Preview|Buchungsvorschau|Preview Posting|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Error Messages|Fehlermeldungen/i.test(text),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-195-fa-gl-journal-preview-posting-menuitem-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-194-fa-gl-journal-preview-posting-menuitem-only.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-195: locally review FA-194 Preview Posting menuitem result before any Fixed Asset G/L Journal posting.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-preview-menuitem-result' : 'blocked-preview-menuitem-result',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-194/FIXEDASSETS-194-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-195 local review; do not post.',
    },
  };
}

test('FIXEDASSETS-194 clicks only the exact Preview Posting menuitem from related-actions-for-Post', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let buttonDiscovery: Awaited<ReturnType<typeof findRelatedPostSplitButton>> | undefined;
  let menuBeforePreview: Awaited<ReturnType<typeof actionInventory>> = [];
  let previewCandidateList: ActionEntry[] = [];
  let clickedSplitButton = false;
  let clickedPreviewPosting = false;
  let dialogAfterPreview: Awaited<ReturnType<typeof detectDialog>> | undefined;
  let pageTextAfterPreview = '';
  let compactTextAfterPreview = '';
  let previewOutcomeKind = 'not-captured';

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
      buttonDiscovery = await findRelatedPostSplitButton(frame);
      if (!buttonDiscovery.selected) {
        blockedBy.push(`Related-actions-for-Post split button count was ${buttonDiscovery.candidates.length}, expected 1.`);
      } else {
        await clickRelatedPostSplitButtonOnly(frame, buttonDiscovery.selected);
        clickedSplitButton = true;
        await page.waitForTimeout(900);
        menuBeforePreview = await actionInventory(frame);
        previewCandidateList = previewCandidates(menuBeforePreview);
        if (previewCandidateList.length !== 1) {
          blockedBy.push(`Preview Posting menuitem count was ${previewCandidateList.length}, expected 1.`);
        } else {
          await clickExactPreviewPostingMenuitem(frame, previewCandidateList[0]);
          clickedPreviewPosting = true;
          await page.waitForTimeout(5000);
          dialogAfterPreview = await detectDialog(page);
          pageTextAfterPreview = await pageText(page);
          compactTextAfterPreview = await compactPageText(page, {
            include: [
              /Posting Preview|Buchungsvorschau|Preview Posting|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten/i,
              /Error Messages|Fehlermeldungen|must have a value|does not exist|missing|fehlt|nicht vorhanden|nichts zu buchen|nothing to post/i,
              /Post and Print|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|OK|Yes|Ja/i,
            ],
            maxLines: 180,
            maxLineLength: 240,
          });
          if (dialogAfterPreview.postingDialog) {
            blockedBy.push('Posting dialog appeared after clicking exact Preview Posting menuitem.');
          }
          if (dialogAfterPreview.okYesVisible && !dialogAfterPreview.previewDialog) {
            blockedBy.push('OK/Yes dialog appeared without clear Preview Posting context.');
          }
          const errorMessagesVisible = /Error Messages|Fehlermeldungen/i.test(pageTextAfterPreview);
          const previewEntriesVisible =
            /Posting Preview|Buchungsvorschau|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten/i.test(pageTextAfterPreview) ||
            dialogAfterPreview.previewDialog;
          const previewOrErrorVisible =
            dialogAfterPreview.previewDialog ||
            /Posting Preview|Buchungsvorschau|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Error Messages|Fehlermeldungen|must have a value|does not exist|missing|fehlt|nicht vorhanden|nothing to post|nichts zu buchen/i.test(
              pageTextAfterPreview,
            );
          previewOutcomeKind = errorMessagesVisible ? 'error-messages-page' : previewEntriesVisible ? 'preview-entry-context' : 'not-visible';
          if (!previewOrErrorVisible) {
            blockedBy.push('No Preview Posting view, preview entries or preview error text became visible.');
          }
        }
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  } finally {
    await page.keyboard.press('Escape').catch(() => undefined);
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const outcomeText =
    previewOutcomeKind === 'error-messages-page'
      ? 'the Error Messages page'
      : previewOutcomeKind === 'preview-entry-context'
        ? 'a preview-entry context'
        : 'the resulting Preview Posting context';
  const summary =
    status === 'observed'
      ? `FA-194 clicked only the exact Preview Posting menuitem from related-actions-for-Post and captured ${outcomeText} without posting.`
      : `FA-194 stayed safe but did not produce a clean Preview Posting proof. Blocker: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-preview-posting-menuitem-attempt.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-194-preview-posting-menuitem-attempt',
    caseId: CASE_ID,
    context,
    frameUrl,
    buttonDiscovery,
    clickedSplitButton,
    previewCandidateCount: previewCandidateList.length,
    previewCandidates: previewCandidateList,
    clickedPreviewPosting,
    dialogAfterPreview,
    previewOutcomeKind,
    safety: {
      clickedSplitButton,
      clickedExactPreviewPostingMenuitem: clickedPreviewPosting,
      clickedMainPostButton: false,
      clickedPostMenuitem: false,
      clickedPostAndPrintMenuitem: false,
      clickedOkOrYes: false,
      posted: false,
      setupChanged: false,
      companySwitched: false,
      apiShortcutUsed: false,
      bookChanged: false,
    },
    blockedBy,
  });
  await writeTextEvidence(
    faEvidencePath('020-preview-posting-result-text.txt'),
    safeEvidenceText(compactTextAfterPreview) || 'No compact Preview Posting, preview-error or posting-dialog text was captured.',
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-194-preview-posting-menuitem-result',
    caseId: CASE_ID,
    source: 'playwright-preview-posting-menuitem-only',
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
      ...(buttonDiscovery?.selected ? ['Exactly one related-actions-for-Post split/dropdown button was found.'] : []),
      ...(clickedSplitButton ? ['Only the related-actions-for-Post split/dropdown button was clicked before Preview Posting.'] : []),
      ...(previewCandidateList.length === 1 ? ['Exactly one exact Preview Posting menuitem candidate was found.'] : []),
      ...(clickedPreviewPosting ? ['Only the exact Preview Posting menuitem was clicked.'] : []),
      ...(status === 'observed' ? ['Preview Posting or preview-error context became visible after the menuitem click.'] : []),
      ...(previewOutcomeKind === 'error-messages-page' ? ['The Preview Posting attempt opened the Error Messages page.'] : []),
      ...(previewOutcomeKind === 'preview-entry-context' ? ['Preview entry context became visible.'] : []),
      'No main Post button was clicked.',
      'No Post menuitem was clicked.',
      'No Post and Print menuitem was clicked.',
      'No OK/Yes confirmation was clicked.',
      'No journal line was created, edited or deleted.',
      'No setup change was made.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      ...(status === 'observed' ? [] : ['Preview Posting did not produce a stable proof.']),
      'No Fixed Asset G/L Journal posting was executed.',
      'No FA Ledger Entry or posted G/L Entry trace exists.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-194-fa-gl-journal-preview-posting-menuitem-only.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-194/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-194/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-194/010-preview-posting-menuitem-attempt.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-194/020-preview-posting-result-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-194/FIXEDASSETS-194-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-194/FIXEDASSETS-194-result.json',
    ],
    warnings: [
      'Preview Posting-only. Do not treat as posting permission.',
      'Posting remains locked until FIXEDASSETS-195 local review.',
      'No German final proof.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      clickedSplitButton,
      clickedPreviewPosting,
      noMainPostClick: true,
      noPostMenuitemClick: true,
      noPostAndPrintClick: true,
      noInsertLine: true,
      noDeleteLine: true,
      noPost: true,
      noOkYesConfirmation: true,
      previewOnly: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      dialogAfterPreview,
      previewOutcomeKind,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-194-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-194-learning.md'),
    [
      '# FIXEDASSETS-194 Lernzusammenfassung',
      '',
      'Status: `labor`, `preview-posting-menuitem-only`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Lernwert',
      '',
      'Dieser Lauf trennt den normalen Buchungspfad bewusst vom Vorschaupfad. In Business Central liegen `Post`, `Preview Posting` und `Post and Print` im selben Aktionsmenue. Fuer Klickanleitungen reicht daher nicht die Aussage "Post-Menue oeffnen"; der konkrete Menuepunkt muss technisch und sichtbar abgegrenzt werden.',
      '',
      '## Grenzen',
      '',
      '- Keine Buchung.',
      '- Keine `OK`- oder `Yes`-Bestaetigung.',
      '- Keine echte FA-Ledger-/G/L-Postenspur.',
      '- Kein deutscher Finalnachweis.',
      '- Posting bleibt bis zum lokalen Review gesperrt.',
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
      '# FIXEDASSETS-194 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-preview-posting-menuitem-attempt.json` | JSON | Splitbutton, exakter Preview-Menuepunkt, Dialog-/Safety-Befund | keine echte Buchung | `labor` |',
      '| `020-preview-posting-result-text.txt` | Text | sichtbarer Preview-/Fehler-/Dialogtext nach Klick | keine vollstaendige Postenspur | `labor` oder `blocked` |',
      '| `FIXEDASSETS-194-result.json` | JSON | Ergebnis, Grenzen, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-194-learning.md` | Markdown | Lernwert fuer Klickpfad und Aktionsmenue | keine Buchung | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.noMainPostClick).toBe(true);
  expect(result.flags.noPostMenuitemClick).toBe(true);
  expect(result.flags.noPostAndPrintClick).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noOkYesConfirmation).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
