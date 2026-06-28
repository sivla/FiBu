import { expect, test, type Frame, type Page } from '@playwright/test';
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

const TEST_ID = 'fixedassets-281';
const CASE_ID = 'FIXEDASSETS-281-FA-DEPRECIATION-JOURNAL-BATCH-TARGET-READONLY';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const TARGET_PAGE_ID = 5628;
const ASSET_NO = 'FA-CNC-01';
const DEPRECIATION_BOOK = 'HGB';
const KNOWN_DOCS = ['FADEP-20260627-2158', 'FADEP-267-OK', 'FADEP-273-OK'];

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2800, height: 1400 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe|aadTenantId|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function journalUrl() {
  const url = new URL(bcPageUrl(TARGET_PAGE_ID, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function isJournalFrame(frame: Frame) {
  const frameUrl = decodeURIComponent(frame.url());
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${TARGET_PAGE_ID}`);
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
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (text) dialogs.push(text);
    }
  }
  const dangerous = dialogs.filter((text) =>
    /\b(Post|Preview Posting|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish|Calculate Depreciation|Abschreibung berechnen|AfA berechnen)\b/i.test(text),
  );
  return { phase, dialogs, dangerous, ok: dangerous.length === 0 };
}

async function readJournalSignals(page: Page) {
  const fullText = await pageText(page);
  const compactText = clean(
    await compactPageText(page, {
      include: [
        /Fixed Asset G\/L Journals|Batch Name|Template|Journal Template|Journal Batch|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book Code|Amount|No\. of Depreciation Days|Depr\. until FA Posting Date|FADEP-|FA-CNC-01|HGB|Depreciation/i,
      ],
      maxLines: 220,
      maxLineLength: 260,
    }),
  );

  const frameSignals = [];
  for (const frame of page.frames().filter(isJournalFrame)) {
    const signal = await frame
      .evaluate(({ assetNo, depreciationBook, knownDocs }) => {
        const norm = (value: string | null | undefined) =>
          (value ?? '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
            .replace(/[ \t]+/g, ' ')
            .trim();
        const visible = (element: HTMLElement) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const keep = /Fixed Asset G\/L Journals|Batch Name|Template|Journal Template|Journal Batch|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book Code|Amount|FADEP-|FA-CNC-01|HGB|Depreciation/i;
        const bodyText = norm(document.body?.innerText || '');
        const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr,[data-control-name]')]
          .filter(visible)
          .map((row, index) => ({ index, text: norm(row.innerText || row.textContent) }))
          .filter((row) => keep.test(row.text))
          .slice(0, 100);
        const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea,[role="combobox"],[aria-haspopup="listbox"]')]
          .filter((control) => visible(control as HTMLElement))
          .map((control, index) => {
            const input = control as HTMLInputElement;
            return {
              index,
              tag: control.tagName.toLowerCase(),
              role: norm(control.getAttribute('role')),
              value: norm(control instanceof HTMLSelectElement ? [...control.options].find((option) => option.selected)?.text || control.value : input.value),
              ariaLabel: norm(control.getAttribute('aria-label')),
              title: norm(control.getAttribute('title')),
              placeholder: norm(input.placeholder),
              readOnly: control.hasAttribute('readonly') || control.getAttribute('aria-readonly') === 'true',
              disabled: control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true',
            };
          })
          .filter((control) => keep.test(`${control.value} ${control.ariaLabel} ${control.title} ${control.placeholder}`))
          .slice(0, 100);
        const rowText = rows.map((row) => row.text).join('\n');
        const controlText = controls.map((control) => `${control.value} ${control.ariaLabel} ${control.title} ${control.placeholder}`).join('\n');
        const combined = `${bodyText}\n${rowText}\n${controlText}`;
        return {
          frameUrl: location.href,
          pageTitleVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(combined),
          batchNameVisible: /Batch Name/i.test(combined),
          templateSignalVisible: /Template|Journal Template/i.test(combined),
          assetVisible: new RegExp(`\\b${assetNo}\\b`, 'i').test(combined),
          depreciationBookVisible: new RegExp(`\\b${depreciationBook}\\b`, 'i').test(combined),
          faDepPrefixVisible: /FADEP-/i.test(combined),
          knownDocumentsVisible: knownDocs.filter((doc: string) => combined.includes(doc)),
          rows,
          controls,
        };
      }, { assetNo: ASSET_NO, depreciationBook: DEPRECIATION_BOOK, knownDocs: KNOWN_DOCS })
      .catch((error) => ({ frameUrl: frame.url(), error: String(error), rows: [], controls: [] }));
    if (typeof signal.frameUrl === 'string') signal.frameUrl = safeUrl(signal.frameUrl);
    frameSignals.push(signal);
  }

  const joinedFrameText = frameSignals
    .flatMap((entry: any) => [...(entry.rows ?? []).map((row: any) => row.text), ...(entry.controls ?? []).map((control: any) => `${control.value} ${control.ariaLabel} ${control.title}`)])
    .join('\n');
  const combined = `${fullText}\n${joinedFrameText}`;

  return {
    pageTitleVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(combined),
    batchNameVisible: /Batch Name/i.test(combined),
    batchNameValueCaptured: false,
    templateSignalVisible: /Template|Journal Template/i.test(combined),
    assetVisible: new RegExp(`\\b${ASSET_NO}\\b`, 'i').test(combined),
    depreciationBookVisible: new RegExp(`\\b${DEPRECIATION_BOOK}\\b`, 'i').test(combined),
    faDepPrefixVisible: /FADEP-/i.test(combined),
    knownDocumentsVisible: KNOWN_DOCS.filter((doc) => combined.includes(doc)),
    frameCount: frameSignals.length,
    compactText,
    frameSignals,
  };
}

function renderLearning(result: any) {
  return [
    '# FIXEDASSETS-281 Journal-/Batch-Target read-only',
    '',
    'Status: `labor`, `read-only`, `journal-target-diagnosis`, `no-ok`, `no-preview`, `no-post`, `not-final`.',
    '',
    '## Ergebnis',
    '',
    `- Instanz: \`${result.instance}\``,
    `- Company: \`${result.company}\``,
    `- Page: \`Fixed Asset G/L Journals\` / Page \`${TARGET_PAGE_ID}\``,
    `- Batch-Name-Label sichtbar: ${result.journal.batchNameVisible ? 'ja' : 'nein'}`,
    `- Konkreter Batch-Name-Wert erfasst: ${result.journal.batchNameValueCaptured ? 'ja' : 'nein'}`,
    `- Template-/Journal-Template-Signal sichtbar: ${result.journal.templateSignalVisible ? 'ja' : 'nein'}`,
    `- \`${ASSET_NO}\` sichtbar: ${result.journal.assetVisible ? 'ja' : 'nein'}`,
    `- \`${DEPRECIATION_BOOK}\` sichtbar: ${result.journal.depreciationBookVisible ? 'ja' : 'nein'}`,
    `- \`FADEP-\` sichtbar: ${result.journal.faDepPrefixVisible ? 'ja' : 'nein'}`,
    `- Bekannte FADEP-Dokumente sichtbar: ${result.journal.knownDocumentsVisible.length ? result.journal.knownDocumentsVisible.join(', ') : 'nein'}`,
    '',
    '## Was ein Einsteiger daraus lernen soll',
    '',
    'Die Aktion `Calculate Depreciation` schreibt nicht magisch direkt in Posten. Vor Preview oder Buchung muss sichtbar sein, in welchem Anlagen-Fibu-Buchblatt, Batch und Zeilenkontext Business Central die Abschreibungszeile erwartet. Wenn dort keine passende `FADEP-`-Zeile sichtbar ist, ist ein weiterer OK-Lauf kein guter naechster Schritt.',
    '',
    '## Grenzen',
    '',
    '- Der Calculate-Depreciation-Request-Dialog wurde in diesem Lauf nicht geoeffnet, weil der Case explizit keinen OK-Risiko-Klick benoetigt.',
    '- Kein Preview Posting.',
    '- Keine Buchung.',
    '- Keine Journalzeile angelegt, bearbeitet oder geloescht.',
    '- Kein Setup Change.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-281 diagnoses FA depreciation journal batch target read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();

  await page.goto(journalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|Batch Name|Document No\.|FA Posting Type/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const context = await sandboxContext(page);
  const dialogState = await detectDangerousDialog(page, 'after-open-fa-gl-journal');
  const journal = await readJournalSignals(page);
  const blockedBy = [
    ...(context.environmentInUrl ? [] : ['wrong-instance']),
    ...(context.companyInUrl ? [] : ['wrong-company-url']),
    ...(context.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
    ...(journal.pageTitleVisible ? [] : ['fixed-asset-gl-journals-not-visible']),
    ...(dialogState.ok ? [] : dialogState.dangerous.map((dialog) => `dangerous-dialog:${dialog}`)),
  ];
  const observed = blockedBy.length === 0;
  const nextCase = 'FIXEDASSETS-282-FA-DEPRECIATION-JOURNAL-BATCH-TARGET-REVIEW';
  const nextCaseFile = '.agent/state/cases/fixedassets-282-fa-depreciation-journal-batch-target-review.json';
  const nextStep = journal.faDepPrefixVisible
    ? 'FIXEDASSETS-282: locally review FA-281 journal target evidence and decide whether the FADEP signal is usable; no Preview Posting or Post yet.'
    : 'FIXEDASSETS-282: locally review why the Fixed Asset G/L Journal shows no clear batch/FADEP target before any further Calculate Depreciation OK, Preview Posting or Post.';

  await writeTextEvidence(faEvidencePath('010-fa-gl-journal-batch-target-text.txt'), journal.compactText || 'No compact Fixed Asset G/L Journal text captured.');
  await writeJsonEvidence(faEvidencePath('020-fa-gl-journal-batch-target-signals.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    context,
    dialogState,
    journal,
    blockedBy,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-journal-batch-target-readonly',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-depreciation-journal-target',
    resultStatus: observed ? 'observed' : 'blocked',
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    target: {
      pageId: TARGET_PAGE_ID,
      pageName: 'Fixed Asset G/L Journals',
      fixedAssetNo: ASSET_NO,
      depreciationBook: DEPRECIATION_BOOK,
      knownDocuments: KNOWN_DOCS,
    },
    context,
    dialogState,
    journal: {
      pageTitleVisible: journal.pageTitleVisible,
      batchNameVisible: journal.batchNameVisible,
      batchNameValueCaptured: journal.batchNameValueCaptured,
      templateSignalVisible: journal.templateSignalVisible,
      assetVisible: journal.assetVisible,
      depreciationBookVisible: journal.depreciationBookVisible,
      faDepPrefixVisible: journal.faDepPrefixVisible,
      knownDocumentsVisible: journal.knownDocumentsVisible,
      frameCount: journal.frameCount,
    },
    safety: {
      calculateDepreciationRequestPageOpened: false,
      noCalculateDepreciationOk: true,
      noPreviewPosting: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noJournalLineInsertEditDelete: true,
      noDraft: true,
    },
    proved: [
      ...(observed ? ['Fixed Asset G/L Journals was opened read-only in MCP_1_20260210 / RM-DEMO.'] : []),
      journal.batchNameVisible
        ? '`Batch Name` is visible as a journal context label, but no concrete batch value was captured.'
        : '`Batch Name` was not visible in the captured journal context.',
      journal.templateSignalVisible ? 'A template/journal-template signal is visible in the captured journal context.' : 'No clear template/journal-template signal was visible in the captured journal context.',
      journal.faDepPrefixVisible ? '`FADEP-` is visible in the captured journal context.' : '`FADEP-` was not visible in the captured journal context.',
      'No Calculate Depreciation OK, Preview Posting, Post, setup change, company switch, API shortcut, draft, edit or delete action was executed.',
    ],
    notProved: [
      'The exact output batch for a future Calculate Depreciation OK is not proven because no concrete Batch Name value was captured.',
      'The Calculate Depreciation request page was not opened in this case.',
      'No Preview Posting result.',
      'No depreciation posting.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-281-fa-depreciation-journal-batch-target-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-281/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-281/FIXEDASSETS-281-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-281/FIXEDASSETS-281-DEPRECIATION-JOURNAL-BATCH-TARGET-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-281/010-fa-gl-journal-batch-target-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-281/020-fa-gl-journal-batch-target-signals.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-281/README.md',
    ],
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-281-fa-depreciation-journal-batch-target-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase,
        depreciationReadiness: 'FA-281 read-only journal/batch target evidence collected; local review required before any further Calculate Depreciation OK, Preview Posting or Post.',
      },
    },
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: observed,
    reason: 'Read-only Fixed Asset G/L Journal target diagnosis captured journal/batch/FADEP signals; local review is required before any action beyond read-only.',
    nextCase,
    nextCaseFile,
    nextStep,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-281-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-281-DEPRECIATION-JOURNAL-BATCH-TARGET-READONLY.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-281 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-281-result.json` | JSON-Ergebnis | Journal-/Batch-/FADEP-Signalbefund und Safety-Flags | keine AfA-Buchung und keinen Request-Dialog-Wert | labor |',
      '| `FIXEDASSETS-281-DEPRECIATION-JOURNAL-BATCH-TARGET-READONLY.md` | Lernzusammenfassung | Warum Journal-/Batch-Kontext vor OK/Preview/Post wichtig ist | keinen deutschen Finalnachweis | labor |',
      '| `010-fa-gl-journal-batch-target-text.txt` | kompakter Seitentext | sichtbaren Journaltext | keinen Rohdump und keine unsichtbaren Werte | read-only |',
      '| `020-fa-gl-journal-batch-target-signals.json` | UI-Signalextrakt | Page-/Frame-/Control-Signale zu Batch, Template, FADEP, FA-CNC-01 und HGB | keine Buchungswirkung | read-only |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noCalculateDepreciationOk).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noSetupChange).toBe(true);
  expect(result.safety.noJournalLineInsertEditDelete).toBe(true);
  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|production-environment-visible|dangerous-dialog/i.test(entry))).toEqual([]);
});
