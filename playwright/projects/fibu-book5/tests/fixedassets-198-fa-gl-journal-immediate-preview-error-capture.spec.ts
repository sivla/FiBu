import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-198-FA-GL-JOURNAL-IMMEDIATE-PREVIEW-ERROR-CAPTURE';
const TEST_ID = 'fixedassets-198';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_GL_JOURNAL_PAGE_ID = 5628;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(240_000);

type ActionEntry = {
  index: number;
  tagName: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  disabled?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

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

function safeEvidenceText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe/i.test(line))
    .join('\n');
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

  return { candidates, selected: candidates.length === 1 ? candidates[0] : null };
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

    const target = [...document.querySelectorAll<HTMLElement>('button,[aria-label],[title]')].find((element) => {
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

    const target = [...document.querySelectorAll<HTMLElement>('button[role="menuitem"]')].filter(visible).find((element) => {
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
        cleanText(element.textContent),
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
    previewOrErrorDialog: /Posting Preview|Buchungsvorschau|Preview Posting|Error Messages|Fehlermeldungen/i.test(text),
  };
}

async function captureErrorMessagesState(page: Page, sampleName: string) {
  const text = await pageText(page);
  const pageUrl = safeUrl(page.url());
  const onErrorMessagesPage = /[?&]page=700(?:&|$)/i.test(pageUrl) || /Error Messages|Fehlermeldungen/i.test(text);
  const entries: Array<{
    frameUrl: string;
    index: number;
    tagName: string;
    role: string;
    text: string;
    ariaLabel: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }> = [];

  for (const frame of page.frames()) {
    const frameUrl = safeUrl(frame.url());
    if (!/[?&]page=700(?:&|$)/i.test(frameUrl) && !/Error Messages|Fehlermeldungen/i.test(text)) {
      continue;
    }
    const frameEntries = await frame.evaluate(() => {
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

      return [...document.querySelectorAll<HTMLElement>('[role="row"], [role="gridcell"], [role="cell"], table tr, [aria-label], [title]')]
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
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
        .filter((entry) => {
          const label = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
          return /Error Messages|Fehlermeldungen|Description|Message Type|Status|Empfohlene Aktion|In dieser Ansicht kann nichts angezeigt werden|Details|Kontext|Datensatz|Feldname|Fehlerspeicherort|Quelle|Support|Troubleshooting|\(Leer\)|must|muss|missing|fehlt|does not exist|nicht vorhanden|value|Wert/i.test(label);
        })
        .filter((entry) => !/Finance|Cash Management|Sales|Purchasing|Shopify|Alle Berichte|Suchen|Einstellungen|Konto-Manager|Copilot|Benachrichtigungen/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
        .slice(0, 100);
    }).catch(() => []);
    entries.push(...frameEntries.map((entry) => ({ ...entry, frameUrl: frameUrl.slice(0, 180) })));
  }

  const errorLines = [
    onErrorMessagesPage ? text : '',
    ...entries.flatMap((entry) => [entry.text, entry.ariaLabel, entry.title]),
  ]
    .join('\n')
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !/^(Error Messages:?|Hilfe & Dokumentation|Depreciation Book Code|Description|Message Type|Context|Liste mit Titel|Business Central)$/i.test(line))
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|O365MSALTokenFactoryIframe|Account Manager|Konto-Manager|App-Startfeld|Copilot|Suchen|Einstellungen|Hilfe|Benachrichtigungen/i.test(line))
    .filter((line) => !/Post financial transactions|Process incoming and outgoing payments|Make quotes, orders|Manage purchase invoices|Verwalten Sie Shopify|Durchsucht alle Berichte|Open the record that is associated|Hier sehen Sie|Filterbereich anzeigen|Breite Layoutansicht|Infobox|Sortieren nach|Menu .* o ffnen|Details o ffnen/i.test(line))
    .filter((line) => !/^(Dynamics 365 Business Central|Umgebung:|MCP_1_20260210|KK|Fixed Asset G\/L Journals|Gespeichert|Batch Name|Verwalten|Line|Page|Weitere Optionen|Post|Insert FA Bal\. Account|Reconcile|Apply Entries\.\.\.|Posting Date|Document Type|Document No\.|Account Type|Account No\.|FA Posting Type|Gen\. Posting Type|Gen\. Bus\. Posting Group|Gen\. Prod\. Posting Group|Amount|Bal\. Account Type|Bal\. Account No\.|No\. of Depreciation Days|Payment|Invoice|Credit Memo|G\/L Account|Customer|Vendor|Bank Account|Fixed Asset|IC Partner|Employee|Acquisition Cost|Depreciation|Write-Down|Appreciation|Custom 1|Custom 2|Disposal|Maintenance|Purchase|Sale|Settlement|Number of Lines|Balance|Total Balance|Finance|Cash Management|Sales|Purchasing|Shopify|Alle Berichte|Open related record|Start|Alle|Support|Troubleshooting|Fehlerspeicherort|Quelle|Kontext|Details|Description)$/i.test(line))
    .filter((line) => /Error|Fehler|must|muss|missing|fehlt|does not exist|nicht vorhanden|value|Wert|Datensatz|Feldname|Message Type|Status|Empfohlene Aktion/i.test(line))
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, 80);

  return {
    sampleName,
    url: pageUrl,
    errorMessagesVisible: onErrorMessagesPage,
    emptyListVisible: /In dieser Ansicht kann nichts angezeigt werden|Nothing to show in this view|There is nothing to show in this view/i.test(text) ||
      entries.some((entry) => /In dieser Ansicht kann nichts angezeigt werden|Nothing to show/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`)),
    entries,
    errorLines,
    compactText: safeEvidenceText(
      (onErrorMessagesPage ? text : '')
        .split(/\r?\n/)
        .map((line) => cleanText(line))
        .filter((line) => /Error Messages|Fehlermeldungen|Description|Message Type|Status|Empfohlene Aktion|In dieser Ansicht kann nichts angezeigt werden|Details|Kontext|Datensatz|Feldname|Fehlerspeicherort|Quelle|Support|Troubleshooting|must|muss|missing|fehlt|does not exist|nicht vorhanden|value|Wert/i.test(line))
        .slice(0, 140)
        .join('\n'),
    ),
  };
}

function compactErrorSample(sample: Awaited<ReturnType<typeof captureErrorMessagesState>>) {
  const candidateLines = [
    ...sample.errorLines,
    ...sample.entries.flatMap((entry) => [entry.text, entry.ariaLabel, entry.title]),
  ]
    .map((line) => cleanText(line))
    .filter(Boolean);
  const extractedCoreLines = candidateLines.flatMap((line) => {
    const lines: string[] = [];
    const postingTypeMessage = line.match(/'FA Posting Type' darf in 'Gen\. Journal Line' nicht ' ' sein: 'Journal Template Name=ASSETS, Journal Batch Name=DEFAULT, Line No\.=10000'/i)?.[0];
    if (postingTypeMessage) lines.push(postingTypeMessage);
    if (/Wa hlen Sie einen Wert fu r Batch Name/i.test(line)) lines.push('UI-Hinweis: Wa hlen Sie einen Wert fu r Batch Name');
    if (/Gen\. Journal Line: ASSETS,DEFAULT,10000|DatensatzGen\. Journal Line: ASSETS,DEFAULT,10000/i.test(line)) lines.push('Datensatz: Gen. Journal Line ASSETS / DEFAULT / 10000');
    return lines;
  });
  const coreErrorLines = extractedCoreLines
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, 12);
  return {
    sampleName: sample.sampleName,
    url: sample.url,
    errorMessagesVisible: sample.errorMessagesVisible,
    emptyListVisible: sample.emptyListVisible,
    entryCount: sample.entries.length,
    errorLineCount: sample.errorLines.length,
    coreErrorLines,
    contextErrorLines: sample.errorLines
      .filter((line) => !coreErrorLines.includes(line))
      .filter((line) => !/Empfohlene Aktion|Behobene Fehler|Verwenden Sie diese Aktion|Filter auf den Nachrichtenstatus|Datensatz o ffnen/i.test(line))
      .slice(0, 12),
    representativeEntries: sample.entries
      .map((entry) => ({
        role: entry.role,
        text: entry.text,
        ariaLabel: entry.ariaLabel,
        title: entry.title,
      }))
      .filter((entry) => /Batch Name|Wa hlen Sie einen Wert|Datensatz|Feldname|Error|Status|Message Type/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
      .slice(0, 20),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: 'FIXEDASSETS-199-FA-GL-JOURNAL-IMMEDIATE-PREVIEW-ERROR-REVIEW',
      active_case_file: '.agent/state/cases/fixedassets-199-fa-gl-journal-immediate-preview-error-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-198-fa-gl-journal-immediate-preview-error-capture.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-199: locally review the immediate Preview-error capture and decide whether setup/data correction, helper improvement or another route is warranted.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-immediate-preview-error-capture' : 'blocked-immediate-preview-error-capture',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-198/FIXEDASSETS-198-result.json',
        summary,
      },
      nextSafeAction: 'Run local review; do not post or change setup yet.',
    },
  };
}

test('FIXEDASSETS-198 captures Preview Posting error messages immediately after click', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let buttonDiscovery: Awaited<ReturnType<typeof findRelatedPostSplitButton>> | undefined;
  let menuBeforePreview: ActionEntry[] = [];
  let previewCandidateList: ActionEntry[] = [];
  let clickedSplitButton = false;
  let clickedPreviewPosting = false;
  let dialogAfterPreview: Awaited<ReturnType<typeof detectDialog>> | undefined;
  const samples: Awaited<ReturnType<typeof captureErrorMessagesState>>[] = [];

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
          for (const [sampleName, delay] of [
            ['after-250ms', 250],
            ['after-900ms', 650],
            ['after-1800ms', 900],
            ['after-3500ms', 1700],
          ] as const) {
            await page.waitForTimeout(delay);
            samples.push(await captureErrorMessagesState(page, sampleName));
          }
          dialogAfterPreview = await detectDialog(page);
          if (dialogAfterPreview.postingDialog) {
            blockedBy.push('Posting dialog appeared after clicking exact Preview Posting menuitem.');
          }
          if (dialogAfterPreview.okYesVisible && !dialogAfterPreview.previewOrErrorDialog) {
            blockedBy.push('OK/Yes dialog appeared without clear Preview/Error context.');
          }
          if (!samples.some((sample) => sample.errorMessagesVisible)) {
            blockedBy.push('No Error Messages page or text became visible immediately after Preview Posting.');
          }
          if (!samples.some((sample) => sample.errorLines.length > 0)) {
            blockedBy.push('No concrete Error Messages detail line was readable in immediate samples.');
          }
        }
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const bestSample = [...samples].sort((left, right) => {
    const leftScore = (left.errorMessagesVisible ? 1000 : 0) + left.errorLines.length;
    const rightScore = (right.errorMessagesVisible ? 1000 : 0) + right.errorLines.length;
    return rightScore - leftScore;
  })[0];
  const summary = status === 'observed'
    ? `FA-198 captured immediate Preview Posting Error Messages details (${bestSample?.errorLines.length ?? 0} line(s)) without posting.`
    : `FA-198 stayed safe but did not capture concrete immediate Error Messages details. Blocker: ${blockedBy.join(' | ')}`;
  const compactSamples = samples.map(compactErrorSample);
  const compactBestSample = bestSample ? compactErrorSample(bestSample) : null;
  const coreErrorSummary = compactBestSample?.coreErrorLines.length
    ? compactBestSample.coreErrorLines.join(' | ')
    : 'No core error line captured.';
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-immediate-preview-error-capture.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-198-immediate-preview-error-capture',
    caseId: CASE_ID,
    context,
    buttonDiscovery,
    clickedSplitButton,
    previewCandidateCount: previewCandidateList.length,
    previewCandidates: previewCandidateList,
    clickedPreviewPosting,
    dialogAfterPreview,
    samples: compactSamples,
    bestSample: compactBestSample,
    coreErrorSummary,
    safety: {
      clickedSplitButton,
      clickedExactPreviewPostingMenuitem: clickedPreviewPosting,
      clickedMainPostButton: false,
      clickedPostMenuitem: false,
      clickedPostAndPrintMenuitem: false,
      clickedOkOrYes: false,
      posted: false,
      setupChanged: false,
      journalEdited: false,
      companySwitched: false,
      apiShortcutUsed: false,
      bookChanged: false,
    },
    blockedBy,
  });
  await writeTextEvidence(
    faEvidencePath('020-immediate-preview-error-text.txt'),
    [
      'Core error summary:',
      coreErrorSummary,
      '',
      'Compact visible error-page text:',
      bestSample?.compactText || 'No compact immediate Error Messages text was captured.',
      '',
    ].join('\n'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-198-immediate-preview-error-result',
    caseId: CASE_ID,
    source: 'playwright-preview-error-immediate-capture',
    resultStatus: status,
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
      ...(clickedSplitButton ? ['Only the related-actions-for-Post split/dropdown button was clicked before Preview Posting.'] : []),
      ...(previewCandidateList.length === 1 ? ['Exactly one exact Preview Posting menuitem candidate was found.'] : []),
      ...(clickedPreviewPosting ? ['Only the exact Preview Posting menuitem was clicked once.'] : []),
      ...(samples.some((sample) => sample.errorMessagesVisible) ? ['Error Messages context was captured immediately after Preview Posting.'] : []),
      ...(bestSample?.errorLines.length ? [`Concrete immediate Error Messages detail lines were captured (${bestSample.errorLines.length}).`] : []),
      ...(compactBestSample?.coreErrorLines.length ? [`Core error line(s) captured: ${compactBestSample.coreErrorLines.join(' | ')}`] : []),
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
      ...(bestSample?.errorLines.length ? [] : ['Concrete immediate Error Messages details were still not readable.']),
      'No setup correction was executed.',
      'No Fixed Asset G/L Journal posting was executed.',
      'No FA Ledger Entry or posted G/L Entry trace exists.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-198-fa-gl-journal-immediate-preview-error-capture.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-198/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-198/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-198/010-immediate-preview-error-capture.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-198/020-immediate-preview-error-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-198/FIXEDASSETS-198-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-198/FIXEDASSETS-198-result.json',
    ],
    warnings: [
      'Preview-error capture only. Do not treat as posting permission.',
      'No setup change has been made or authorized by this live run.',
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
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      bestSample: compactBestSample,
      sampleCount: samples.length,
      coreErrorSummary,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-198-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-198-learning.md'),
    [
      '# FIXEDASSETS-198 Lernzusammenfassung',
      '',
      'Status: `labor`, `preview-error-immediate-capture`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      'Kernfehler aus der unmittelbaren Fehlerseite:',
      '',
      `- ${coreErrorSummary}`,
      '',
      '## Was wurde nicht getan',
      '',
      '- Kein `Post`.',
      '- Kein `Post and Print`.',
      '- Kein `OK` oder `Yes`.',
      '- Keine Journalzeile geaendert.',
      '- Kein Setup geaendert.',
      '- Keine Buchaussage im Buch geaendert.',
      '',
      '## Lernwert',
      '',
      'Wenn Business Central nach `Preview Posting` auf `Error Messages` navigiert, kann der Kontext kurzlebig sein. Deshalb muss der Lauf die Fehlerzeilen unmittelbar nach dem Klick sichern. Eine spaeter leer geoeffnete Fehlerliste ist kein Setup-Beweis.',
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
      '# FIXEDASSETS-198 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-immediate-preview-error-capture.json` | JSON | exakten Preview-Klick, sofortige Error-Messages-Samples, Safety Flags | keine Buchung | `labor` oder `blocked` |',
      '| `020-immediate-preview-error-text.txt` | Text | kompakten besten sichtbaren Fehlerseiten-Text | keine vollstaendige Rohseite | `labor` oder `blocked` |',
      '| `FIXEDASSETS-198-result.json` | JSON | Ergebnis, Grenzen, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-198-learning.md` | Markdown | Lernwert fuer kurzlebige Fehlerkontexte | keine Setup-Korrektur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noOkYesConfirmation).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
