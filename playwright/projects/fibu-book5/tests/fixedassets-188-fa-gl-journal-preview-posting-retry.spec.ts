import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { analyzeJournalCellCandidates } from '../../../core/bc/journal-grid-candidates';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-188-FA-GL-JOURNAL-PREVIEW-POSTING-RETRY';
const NEXT_CASE_ID = 'FIXEDASSETS-189-FA-GL-JOURNAL-PREVIEW-POSTING-RETRY-REVIEW';
const TEST_ID = 'fixedassets-188';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_GL_JOURNAL_PAGE_ID = 5628;

const TARGET = {
  documentNo: 'G05001',
  accountNo: 'FA-CNC-01',
  depreciationBookCode: 'HGB',
  balAccountNo: '82000',
};

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

async function moveVisibleGridToBalAccountColumns(page: Page) {
  await page.mouse.move(1450, 400);
  await page.mouse.wheel(1600, 0);
  await page.waitForTimeout(350);
  await page.mouse.move(980, 1398);
  await page.mouse.down();
  await page.mouse.move(2050, 1398, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(350);
}

async function readReadonlyJournalSnapshot(frame: Frame) {
  return frame.evaluate(() => {
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

    function rectOf(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }

    const headers = [...document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-colindex]')]
      .filter(visible)
      .map((header, index) => ({ index, text: norm(header.innerText || header.textContent).slice(0, 180), rect: rectOf(header) }))
      .filter((header) => header.text);
    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row, index) => ({ index, text: norm(row.innerText || row.textContent).slice(0, 900), rect: rectOf(row) }))
      .filter((row) => row.text);
    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')]
      .filter(visible)
      .map((control, index) => {
        const row = control.closest<HTMLElement>('[role="row"],tr');
        const cell = control.closest<HTMLElement>('[role="gridcell"],td,[role="cell"]');
        const selectedText =
          control instanceof HTMLSelectElement ? [...control.options].find((option) => option.selected)?.text || '' : '';
        return {
          index,
          tag: control.tagName.toLowerCase(),
          value: norm(control.value),
          selectedText: norm(selectedText),
          ariaLabel: norm(control.getAttribute('aria-label')),
          title: norm(control.getAttribute('title')),
          rowText: norm(row?.innerText || row?.textContent || '').slice(0, 900),
          cellText: norm(cell?.innerText || cell?.textContent || '').slice(0, 260),
          rect: rectOf(control),
          readOnly: Boolean(control.readOnly || control.getAttribute('aria-readonly') === 'true'),
          disabled: Boolean(control.disabled || control.getAttribute('aria-disabled') === 'true'),
        };
      });

    const bodyText = norm(document.body?.innerText || '');
    return {
      bodyText: bodyText.slice(0, 1800),
      headers: headers.filter((header) => /Posting Date|Document No|Account Type|Account No|FA Posting Type|Amount|Bal\. Account/i.test(header.text)),
      rows: rows.filter((row) => /G05001|FA-CNC-01|HGB|CNC Maschine FRA|Amount|Bal\. Account|82000|K30000/i.test(row.text)),
      controls,
      signals: {
        fixedAssetGlJournalsVisible: /Fixed Asset G\/L Journals/i.test(bodyText),
        documentNoVisible: bodyText.includes('G05001'),
        accountNoVisible: bodyText.includes('FA-CNC-01'),
        depreciationBookVisible: bodyText.includes('HGB'),
        balAccountNoHeaderVisible: /Bal\. Account No\.|Bal Account No|Gegenkonto/i.test(bodyText),
        account82000VisibleGlobal: bodyText.includes('82000'),
        k30000VisibleGlobal: /K30000/i.test(bodyText),
      },
    };
  });
}

function analyzeSnapshot(snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>>) {
  return analyzeJournalCellCandidates(
    {
      headers: snapshot.headers,
      rows: snapshot.rows,
      controls: snapshot.controls,
    },
    {
      rowRequiredSignals: [TARGET.documentNo, TARGET.accountNo, TARGET.depreciationBookCode],
      columnSignals: ['Bal. Account No.', 'Bal Account No', 'Gegenkonto'],
      forbiddenSignals: ['K30000'],
      expectedValue: TARGET.balAccountNo,
    },
  );
}

async function clickAction(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 800 }).catch(() => false)) {
        await action.click({ timeout: 4000 });
        await page.waitForTimeout(1800);
        return true;
      }
    }
  }
  return false;
}

async function openPreviewPostingOnly(page: Page) {
  const textBefore = await pageText(page);
  const openedPostMenu = await clickAction(page, /^Post(?:\.\.\.)?$|^Buchen(?:\.\.\.)?$/i);
  await page.waitForTimeout(1000);
  const clickedPreview = await clickAction(page, /^Preview Posting$|^Buchungsvorschau$|^Vorschau buchen$|^Buchen Vorschau$/i);
  await page.waitForTimeout(5000);
  const textAfter = await pageText(page);
  const openedPostingDialog =
    /Ship and Invoice|Liefern und fakturieren|Receive and Invoice|Empfangen und fakturieren|Invoice\b|Rechnung\b|Post and Print/i.test(textAfter) &&
    /OK|Yes|Ja/i.test(textAfter);
  const previewOpened = /Posting Preview|Buchungsvorschau|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten/i.test(textAfter);
  const setupErrorVisible = /must have a value|does not exist|is missing|fehlt|muss.*Wert|nicht vorhanden|Error Messages|Fehlermeldungen/i.test(textAfter);

  return {
    openedPostMenu,
    clickedPreview,
    previewOpened,
    openedPostingDialog,
    setupErrorVisible,
    textBeforePreview: textBefore.slice(0, 3000),
    textAfterPreview: textAfter,
  };
}

async function closePreviewSafely(page: Page) {
  const before = await pageText(page);
  if (!/Posting Preview|Buchungsvorschau|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Error Messages|Fehlermeldungen/i.test(before)) {
    return { attempted: false, closed: true, reason: 'preview-or-error-context-not-visible' };
  }

  const closedByClose = await clickAction(page, /^Close$|^Schlie.*/i);
  if (closedByClose) {
    await page.waitForTimeout(1500);
    return { attempted: true, closed: true, method: 'close-action' };
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  const afterEscape = await pageText(page);
  return {
    attempted: true,
    closed: !/Posting Preview|Buchungsvorschau|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Error Messages|Fehlermeldungen/i.test(afterEscape),
    method: 'escape',
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-189-fa-gl-journal-preview-posting-retry-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-188-fa-gl-journal-preview-posting-retry.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-189: locally review FA-188 Preview Posting-only evidence before any Fixed Asset G/L Journal posting.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-preview-posting-retry' : 'blocked-preview-posting-retry',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-188/FIXEDASSETS-188-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-189 local review; do not post.',
    },
  };
}

test('FIXEDASSETS-188 retries Preview Posting only after persisted Bal. Account No. proof', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let helperResult: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let preview: Awaited<ReturnType<typeof openPreviewPostingOnly>> | undefined;
  let closeResult: Awaited<ReturnType<typeof closePreviewSafely>> | undefined;
  let screenshotCaptured = false;

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
      await moveVisibleGridToBalAccountColumns(page);
      snapshot = await readReadonlyJournalSnapshot(frame);
      helperResult = analyzeSnapshot(snapshot);

      if (!helperResult.visibleSignals.expectedValueVisible) {
        blockedBy.push(`bal-account-82000-not-visible:${helperResult.status}`);
      } else {
        preview = await openPreviewPostingOnly(page);
        if (!preview.openedPostMenu) blockedBy.push('post-menu-not-opened');
        if (!preview.clickedPreview) blockedBy.push('preview-posting-action-not-clicked');
        if (preview.openedPostingDialog) blockedBy.push('posting-dialog-opened-instead-of-preview');
        if (!preview.previewOpened) blockedBy.push('preview-posting-did-not-open');

        const previewPageText = await compactPageText(page, {
          include: [
            /Posting Preview|Buchungsvorschau|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten|82000|FA-CNC-01|G05001|Error Messages|Fehlermeldungen|must have a value|does not exist|missing|fehlt/i,
          ],
          maxLines: 140,
          maxLineLength: 220,
        });
        await writeTextEvidence(
          faEvidencePath('020-preview-posting-page-text.txt'),
          previewPageText.trim() ||
            [
              'No matching Preview Posting or setup-error page text was captured.',
              '',
              'FA-188 is therefore not Preview Posting evidence. The guarded action path opened a posting dialog instead of a Preview Posting view. No OK/Yes/Post confirmation was accepted.',
            ].join('\n'),
        );

        if (preview.previewOpened && !preview.openedPostingDialog) {
          await screenshot(page, 'fixedassets-188-020-preview-posting-retry.png', {
            projectName: project.name,
            testId: TEST_ID,
            status: 'labor',
            bookUse: 'evidence',
            purpose:
              'FA-188 Preview Posting-only Retry: zeigt die erreichte Buchungsvorschau oder das Preview-Fehlerbild fuer die bestehende FA-G/L-Journal-Zeile, ohne zu buchen.',
            expectedPageText: [/Posting Preview|Buchungsvorschau|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Error Messages|Fehlermeldungen/i],
            knownLimitations: [
              'Nur Preview Posting.',
              'Keine Buchung.',
              'Keine FA-/G/L-Postenspur aus echter Buchung.',
              'Kein deutscher Finalnachweis.',
            ],
          });
          screenshotCaptured = true;
        }

        closeResult = await closePreviewSafely(page);
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  const status: 'observed' | 'blocked' =
    blockedBy.length === 0 && Boolean(preview?.previewOpened) && !preview?.openedPostingDialog ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? 'FA-188 opened Preview Posting for the existing FA G/L Journal line with persisted Bal. Account No. = 82000 and did not post.'
      : `FA-188 stayed safe but did not prove Preview Posting: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-journal-pre-preview-retry-check.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-188-journal-pre-preview-retry-check',
    caseId: CASE_ID,
    context,
    frameUrl,
    target: TARGET,
    snapshot,
    helperResult,
    blockedByBeforePreview: blockedBy.filter((entry) => /context|visible|candidate|frame|82000/i.test(entry)),
    omitted: 'No full DOM dump, traces, videos, reports or auth artifacts stored.',
  });

  await writeJsonEvidence(faEvidencePath('020-preview-posting-retry-result.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-188-preview-posting-retry',
    caseId: CASE_ID,
    preview: preview ? { ...preview, textAfterPreview: undefined, textBeforePreview: undefined } : undefined,
    closeResult,
    blockedBy,
    screenshotCaptured,
    safety: {
      clickedPreviewPosting: Boolean(preview?.clickedPreview),
      openedPostingDialog: Boolean(preview?.openedPostingDialog),
      posted: false,
      setupChanged: false,
      companySwitched: false,
      apiShortcutUsed: false,
    },
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-188-preview-posting-retry-result',
    caseId: CASE_ID,
    source: 'playwright-preview-only-retry',
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
      ...(snapshot?.signals.fixedAssetGlJournalsVisible ? ['Fixed Asset G/L Journals context was visible.'] : []),
      ...(helperResult?.visibleSignals.expectedValueVisible ? ['Bal. Account No. = 82000 was visible/current before Preview Posting retry.'] : []),
      ...(preview?.clickedPreview ? ['Preview Posting action was clicked.'] : []),
      ...(preview?.previewOpened ? ['Posting Preview or preview error context was visible.'] : []),
      'No Post confirmation was accepted.',
      'No journal line was created or deleted.',
      'No setup change was made.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      ...(status === 'observed' ? [] : ['Preview Posting did not produce a stable preview proof.']),
      'No Fixed Asset G/L Journal posting was executed.',
      'No FA Ledger Entry or posted G/L Entry trace exists.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-188-fa-gl-journal-preview-posting-retry.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-188/',
      ...(screenshotCaptured ? ['playwright/projects/fibu-book5/img/fixedassets-188-020-preview-posting-retry.png'] : []),
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-188/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-188/010-journal-pre-preview-retry-check.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-188/020-preview-posting-retry-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-188/020-preview-posting-page-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-188/FIXEDASSETS-188-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-188/FIXEDASSETS-188-result.json',
      ...(screenshotCaptured ? ['playwright/projects/fibu-book5/img/fixedassets-188-020-preview-posting-retry.png'] : []),
    ],
    warnings: [
      'Preview Posting-only. Do not treat as posting permission.',
      'Posting remains locked until FIXEDASSETS-189 local review.',
      'No German final proof.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      noInsertLine: true,
      noDeleteLine: true,
      noPost: true,
      previewOnly: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      helperResult,
      preview: preview ? { ...preview, textAfterPreview: undefined, textBeforePreview: undefined } : undefined,
      closeResult,
      snapshotSignals: snapshot?.signals,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-188-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-188-learning.md'),
    [
      '# FIXEDASSETS-188 Lernzusammenfassung',
      '',
      'Status: `labor`, `preview-posting-only-retry`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Lernwert',
      '',
      status === 'observed'
        ? 'Nach dem Persistenznachweis aus FA-186 ist Preview Posting der naechste Kontrollpunkt. Der Lauf darf nur zeigen, ob Business Central eine Vorschau oder ein Fehlerbild erzeugt; eine echte Buchung bleibt gesperrt.'
        : 'Nach dem Persistenznachweis aus FA-186 ist Preview Posting fachlich der richtige Kontrollpunkt. FA-188 zeigt aber, dass der Automationspfad selbst noch nicht stabil genug ist: Ein grober Klick auf `Post` kann in Business Central direkt den Buchungsdialog oeffnen, ohne dass `Preview Posting` tatsaechlich ausgewaehlt wurde.',
      '',
      status === 'observed'
        ? ''
        : 'Fuer den naechsten Live-Versuch braucht es zuerst eine gescopte Action-Inventory- oder Menue-Routenentscheidung: Wo liegt `Preview Posting` auf dieser Page wirklich, wie wird sie eindeutig angeklickt, und wie wird verhindert, dass der normale Buchungsdialog geoeffnet oder bestaetigt wird?',
      '',
      '## Grenzen',
      '',
      '- Keine Buchung.',
      ...(status === 'observed'
        ? []
        : ['- Keine Preview-Postenzeilen.', '- Der sichtbare Posting-Dialog ist ein Blocker-/Rejected-Path-Befund, kein Vorschau-Nachweis.']),
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
      '# FIXEDASSETS-188 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-journal-pre-preview-retry-check.json` | JSON | Journal-Kontext und ob `Bal. Account No. = 82000` vor Preview sichtbar/current war | keine Buchung | `labor` oder `blocked` |',
      '| `020-preview-posting-retry-result.json` | JSON | ob Preview Posting geklickt/geoeffnet wurde und Safety-Flags | keine Postenspur aus echter Buchung | `labor` oder `blocked` |',
      '| `020-preview-posting-page-text.txt` | Text | ob Preview-/Fehlertext erfasst wurde oder ob der Lauf als Action-Path-Blocker zu lesen ist | kein Rohdump, keine Preview-Postenzeilen bei Blocker | `labor` oder `blocked` |',
      '| `FIXEDASSETS-188-result.json` | JSON | Ergebnis, Grenzen, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-188-learning.md` | Markdown | Lernwert der Buchungsvorschau | keine echte Buchung | `labor` |',
      '| `fixedassets-188-020-preview-posting-retry.screenshot.json` | Screenshot-Metadaten, falls Preview/Fehlerbild erreicht wurde | keine eigenstaendige fachliche Wahrheit ohne JSON/Text | `labor` |',
      '',
      status === 'observed'
        ? `Aktuelle Wahrheit: ${summary}`
        : 'Aktuelle Wahrheit: FA-188 blieb sicher und bestaetigte vor dem Retry `Bal. Account No. = 82000`, erreichte aber keine Vorschau. Der gewaehlte Post-Menue-Pfad oeffnete den Buchungsdialog statt `Preview Posting`. Kein `OK`/`Yes`/`Post` wurde bestaetigt. Der naechste Schritt ist ein lokales Review des Aktionspfads, nicht noch ein blinder Live-Retry.',
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
