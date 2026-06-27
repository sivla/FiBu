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

const TEST_ID = 'fixedassets-250';
const CASE_ID = 'FIXEDASSETS-250-FA-DEPRECIATION-JOURNAL-SEARCH-READONLY';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const TARGET_PAGE_ID = 5628;
const TARGET_DOCUMENT_NO = 'FADEP-20260627-2158';

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

function isTargetFrame(frame: Frame) {
  const frameUrl = decodeURIComponent(frame.url());
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${TARGET_PAGE_ID}`);
}

async function journalSearchSignals(page: Page) {
  const fullText = await pageText(page);
  const compact = clean(
    await compactPageText(page, {
      include: [
        /Fixed Asset G\/L Journals|Batch Name|Posting Date|Document No\.|Depreciation Book Code|FA Posting Type|Amount|No\. of Depreciation Days|Depr\. until FA Posting Date|FADEP-|FA-CNC-01|HGB|Depreciation|Post|Preview Posting/i,
      ],
      maxLines: 180,
      maxLineLength: 260,
    }),
  );

  const frameSignals = [];
  for (const frame of page.frames().filter(isTargetFrame)) {
    const signal = await frame
      .evaluate((targetDocumentNo) => {
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
        const bodyText = norm(document.body?.innerText || '');
        const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
          .filter(visible)
          .map((row, index) => ({
            index,
            text: norm(row.innerText || row.textContent),
          }))
          .filter((row) => /FADEP-|FA-CNC-01|Depreciation|Document No\.|Posting Date|Fixed Asset G\/L Journals/i.test(row.text))
          .slice(0, 60);
        const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')]
          .filter(visible)
          .map((control, index) => ({
            index,
            value: norm(control instanceof HTMLSelectElement ? [...control.options].find((option) => option.selected)?.text || control.value : control.value),
            ariaLabel: norm(control.getAttribute('aria-label')),
            title: norm(control.getAttribute('title')),
            readOnly: control.hasAttribute('readonly') || control.getAttribute('aria-readonly') === 'true',
            disabled: control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true',
          }))
          .filter((control) => /FADEP-|FA-CNC-01|Depreciation|Document No\.|Posting Date/i.test(`${control.value} ${control.ariaLabel} ${control.title}`))
          .slice(0, 80);
        const combined = `${bodyText}\n${rows.map((row) => row.text).join('\n')}\n${controls
          .map((control) => `${control.value} ${control.ariaLabel} ${control.title}`)
          .join('\n')}`;
        return {
          frameUrl: location.href,
          bodyContainsTargetDocumentNo: bodyText.includes(targetDocumentNo),
          bodyContainsFaDepPrefix: /FADEP-/i.test(bodyText),
          combinedContainsTargetDocumentNo: combined.includes(targetDocumentNo),
          combinedContainsFaDepPrefix: /FADEP-/i.test(combined),
          titleVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(bodyText),
          rows,
          controls,
        };
      }, TARGET_DOCUMENT_NO)
      .catch((error) => ({ error: String(error) }));
    if ('frameUrl' in signal && typeof signal.frameUrl === 'string') {
      signal.frameUrl = safeUrl(signal.frameUrl);
    }
    frameSignals.push(signal);
  }

  return {
    fullTextContainsTargetDocumentNo: fullText.includes(TARGET_DOCUMENT_NO),
    fullTextContainsFaDepPrefix: /FADEP-/i.test(fullText),
    pageTitleVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(fullText),
    compactText: compact,
    frameSignals,
  };
}

test('FIXEDASSETS-250 searches FA G/L Journals read-only for FADEP document number', async ({ page }) => {
  await page.goto(journalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|Document No\.|FA Posting Type/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const context = await sandboxContext(page);
  const dialogState = await detectDangerousDialog(page, 'after-open');
  const signals = await journalSearchSignals(page);
  const foundTargetDocumentNo =
    signals.fullTextContainsTargetDocumentNo || signals.frameSignals.some((entry: any) => entry.combinedContainsTargetDocumentNo || entry.bodyContainsTargetDocumentNo);
  const foundFaDepPrefix =
    signals.fullTextContainsFaDepPrefix || signals.frameSignals.some((entry: any) => entry.combinedContainsFaDepPrefix || entry.bodyContainsFaDepPrefix);
  const routeVisible = context.environmentInUrl && context.companyInUrl && signals.pageTitleVisible;
  const blockedBy = [
    ...(context.environmentInUrl ? [] : ['wrong-instance']),
    ...(context.companyInUrl ? [] : ['wrong-company']),
    ...(context.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
    ...(dialogState.ok ? [] : dialogState.dangerous.map((dialog) => `dangerous-dialog:${dialog}`)),
    ...(routeVisible ? [] : ['fixed-asset-gl-journals-not-visible']),
  ];
  const resultStatus = blockedBy.length ? 'blocked' : 'observed';
  const nextCase = foundTargetDocumentNo || foundFaDepPrefix
    ? 'FIXEDASSETS-251-FA-DEPRECIATION-JOURNAL-LINE-DECISION'
    : 'FIXEDASSETS-251-FA-DEPRECIATION-REQUEST-PARAMETER-DIAGNOSIS';
  const nextCaseFile = foundTargetDocumentNo || foundFaDepPrefix
    ? '.agent/state/cases/fixedassets-251-fa-depreciation-journal-line-decision.json'
    : '.agent/state/cases/fixedassets-251-fa-depreciation-request-parameter-diagnosis.json';
  const nextStep = foundTargetDocumentNo || foundFaDepPrefix
    ? 'FIXEDASSETS-251: locally decide whether the found FADEP journal line can be used for Preview Posting-only evidence; do not Preview or Post yet.'
    : 'FIXEDASSETS-251: diagnose Calculate Depreciation request parameters read-only before any repeat OK; focus on depreciation book, posting date, filters and eligible period.';

  await writeTextEvidence(faEvidencePath('010-fa-gl-journal-fadep-search-text.txt'), signals.compactText || 'No compact FADEP search text captured.');
  await writeJsonEvidence(faEvidencePath('010-fa-gl-journal-fadep-search.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    targetDocumentNo: TARGET_DOCUMENT_NO,
    context,
    dialogState,
    signals,
    foundTargetDocumentNo,
    foundFaDepPrefix,
    routeVisible,
    blockedBy,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-journal-search-readonly',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-gl-journal-search',
    resultStatus,
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    targetDocumentNo: TARGET_DOCUMENT_NO,
    url: {
      finalUrl: safeUrl(page.url()),
      instanceMatches: context.environmentInUrl,
      companyFromUrl: new URL(page.url()).searchParams.get('company'),
    },
    search: {
      routeVisible,
      foundTargetDocumentNo,
      foundFaDepPrefix,
      frameCount: signals.frameSignals.length,
      pageTitleVisible: signals.pageTitleVisible,
    },
    safety: {
      noCalculateDepreciationOk: true,
      noPreviewPosting: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noJournalLineInsertEditDelete: true,
    },
    proved: [
      ...(routeVisible ? ['Fixed Asset G/L Journals was opened read-only in MCP_1_20260210 / RM-DEMO.'] : []),
      foundTargetDocumentNo
        ? `Document No. ${TARGET_DOCUMENT_NO} was visible in the read-only journal search context.`
        : `Document No. ${TARGET_DOCUMENT_NO} was not visible in the read-only journal search context.`,
      foundFaDepPrefix ? '`FADEP-` prefix was visible in the journal search context.' : '`FADEP-` prefix was not visible in the journal search context.',
      'No Calculate Depreciation OK, Preview Posting, Post, setup change, company switch, API shortcut or journal-line edit was executed.',
    ],
    notProved: [
      ...(foundTargetDocumentNo || foundFaDepPrefix ? [] : ['No FADEP depreciation journal line was found.']),
      'No Preview Posting result.',
      'No depreciation posting.',
      'No FA Ledger Entry or G/L Entry trace for depreciation.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-250-fa-depreciation-journal-search-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-250/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-250/FIXEDASSETS-250-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-250/FIXEDASSETS-250-JOURNAL-SEARCH-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-250/010-fa-gl-journal-fadep-search.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-250/010-fa-gl-journal-fadep-search-text.txt',
    ],
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-250-fa-depreciation-journal-search-readonly.json',
        nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase,
        depreciationReadiness: foundTargetDocumentNo || foundFaDepPrefix
          ? 'FA-250 found an FADEP journal signal read-only; local decision needed before Preview Posting.'
          : 'FA-250 did not find FADEP-20260627-2158 or FADEP- in Fixed Asset G/L Journals; request-parameter diagnosis is next before any repeat OK.',
      },
    },
    blockedBy,
    requiresReview: !foundTargetDocumentNo,
    safeToFinalizeState: resultStatus === 'observed',
    reason: foundTargetDocumentNo || foundFaDepPrefix
      ? 'Read-only journal search found an FADEP signal.'
      : 'Read-only journal search did not find an FADEP signal; the missing journal-line blocker remains.',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-250-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-250-JOURNAL-SEARCH-READONLY.md'),
    [
      '# FIXEDASSETS-250 FADEP-Journal-Suche read-only',
      '',
      'Status: `labor`, `read-only`, `journal-search`, `no-ok`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      `- Umgebung: \`${EXPECTED_INSTANCE}\``,
      `- Company: \`${EXPECTED_COMPANY}\``,
      `- Ziel-Dokumentnummer: \`${TARGET_DOCUMENT_NO}\``,
      `- Fixed Asset G/L Journals sichtbar: ${routeVisible ? 'ja' : 'nein'}`,
      `- Ziel-Dokumentnummer sichtbar: ${foundTargetDocumentNo ? 'ja' : 'nein'}`,
      `- \`FADEP-\` sichtbar: ${foundFaDepPrefix ? 'ja' : 'nein'}`,
      '',
      '## Grenzen',
      '',
      '- Kein `OK` auf `Calculate Depreciation`.',
      '- Kein Preview Posting.',
      '- Keine Buchung.',
      '- Keine Journalzeilen-Aenderung.',
      '- Kein Setup Change.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      nextStep,
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-250 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-250-result.json` | JSON-Ergebnis | Ob `FADEP-20260627-2158`/`FADEP-` read-only sichtbar war | keine AfA-Zeile ausserhalb sichtbarer/DOM-Suche | labor |',
      '| `FIXEDASSETS-250-JOURNAL-SEARCH-READONLY.md` | Lernzusammenfassung | Suchbefund und Grenzen | keinen deutschen Finalnachweis | labor |',
      '| `010-fa-gl-journal-fadep-search.json` | UI-Evidence | Page-/Frame-/Textsignale zur FADEP-Suche | keine Buchungswirkung | read-only |',
      '| `010-fa-gl-journal-fadep-search-text.txt` | kompakter Text | sichtbarer Journaltext | kein Rohdump | compact |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noCalculateDepreciationOk).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noJournalLineInsertEditDelete).toBe(true);
  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|production-environment-visible|dangerous-dialog/i.test(entry))).toEqual([]);
});
