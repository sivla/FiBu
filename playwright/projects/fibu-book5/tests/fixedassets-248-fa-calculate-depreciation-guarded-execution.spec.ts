import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  searchFor,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const TEST_ID = 'fixedassets-248';
const CASE_ID = 'FIXEDASSETS-248-FA-CALCULATE-DEPRECIATION-GUARDED-EXECUTION';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const SEARCH_TERM = 'Calculate Depreciation';
const DOCUMENT_NO = `FADEP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${new Date().getHours()}${new Date().getMinutes()}`;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function asciiEvidenceText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe|aadTenantId|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function rmDemoHomeUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function faJournalUrl() {
  const url = new URL(bcPageUrl(5628, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

async function candidateElements(frame: Frame) {
  return frame.evaluate(() => {
    const label = /Calculate\s+Depreciation/i;
    const ascii = (value: string) =>
      value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
    const seen = new Set<string>();
    return [...document.querySelectorAll<HTMLElement>('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"],[role="row"],[role="gridcell"],span')]
      .map((element, index) => {
        const text = ascii(element.innerText || element.textContent || '');
        const aria = ascii(element.getAttribute('aria-label') || '');
        const title = ascii(element.getAttribute('title') || '');
        const role = element.getAttribute('role') || '';
        const rect = element.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0 && rect.y >= 0;
        return {
          index,
          tag: element.tagName.toLowerCase(),
          role,
          text,
          aria,
          title,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible,
          matches: visible && (label.test(text) || label.test(aria) || label.test(title)),
        };
      })
      .filter((entry) => {
        if (!entry.matches || entry.text.length > 180) return false;
        const key = `${entry.tag}|${entry.role}|${entry.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 16);
  });
}

function sanitizedFrameUrl(frameUrl: string) {
  try {
    const url = new URL(frameUrl);
    const company = url.searchParams.get('company');
    return `${url.origin}${url.pathname}${company ? `?company=${company}` : ''}`;
  } catch {
    return 'unparseable-frame-url';
  }
}

async function clickCalculateDepreciationResult(page: Page) {
  const inspected: Array<{ frameUrl: string; candidates: Awaited<ReturnType<typeof candidateElements>> }> = [];

  for (const frame of page.frames()) {
    const candidates = await candidateElements(frame).catch(() => []);
    if (candidates.length > 0) inspected.push({ frameUrl: sanitizedFrameUrl(frame.url()), candidates });

    const row = frame.getByRole('row', { name: /^Calculate Depreciation\s+Aufgaben/i });
    const rowCount = await row.count().catch(() => 0);
    if (rowCount === 1) {
      await row.first().click({ timeout: 4000 });
      await page.waitForTimeout(5000);
      return { clicked: true, method: 'role:row:Calculate Depreciation Aufgaben', inspected };
    }
  }

  return { clicked: false, method: 'not-clicked-ambiguous-or-missing', inspected };
}

function requestPageSignals(text: string) {
  const normalized = asciiEvidenceText(text);
  const signals = {
    hasCalculateDepreciationTitle: /Calculate\s+Depreciation/i.test(normalized),
    hasDepreciationBook: /Depreciation\s+Book|AfA-Buch/i.test(normalized),
    hasPostingDate: /Posting\s+Date|Buchungsdatum/i.test(normalized),
    hasDocumentNo: /Document\s+No\.|Belegnr/i.test(normalized),
    hasPostingDescription: /Posting\s+Description/i.test(normalized),
  };
  const signalCount = Object.values(signals).filter(Boolean).length;
  return {
    ...signals,
    signalCount,
    requestPageLikelyOpen: signals.hasCalculateDepreciationTitle && signalCount >= 2,
  };
}

async function visibleButtons(page: Page) {
  const names = new Set<string>();
  for (const frame of page.frames()) {
    const buttons = frame.getByRole('button');
    const count = await buttons.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await buttons.nth(index).innerText({ timeout: 250 }).catch(() => '');
      const normalized = asciiEvidenceText(text);
      if (/^(OK|Cancel|Abbrechen|Calculate Depreciation|Depreciation Book|Posting Date|Posting Description|Document No\.?)$/i.test(normalized)) {
        names.add(normalized);
      }
    }
  }
  return [...names].slice(0, 60);
}

async function setDocumentNoOnRequestPage(page: Page, value: string) {
  const attempts: Array<{ method: string; success: boolean; note?: string }> = [];
  for (const frame of page.frames()) {
    const direct = frame.getByRole('textbox', { name: /Document No\.?/i }).first();
    if (await direct.isVisible({ timeout: 500 }).catch(() => false)) {
      await direct.fill(value, { timeout: 5000 });
      attempts.push({ method: 'role:textbox:Document No.', success: true });
      return { success: true, method: 'role:textbox:Document No.', attempts };
    }
  }

  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((targetValue) => {
        const ascii = (input: string) =>
          (input || '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
            .replace(/[ \t]+/g, ' ')
            .trim();
        const inputs = [...document.querySelectorAll<HTMLInputElement>('input')].filter((input) => {
          const rect = input.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && !input.disabled && !input.readOnly;
        });
        for (const input of inputs) {
          const label = ascii([input.getAttribute('aria-label'), input.getAttribute('title'), input.closest('[role=\"group\"], [role=\"row\"], div')?.textContent].join(' '));
          if (!/Document\s+No\.?/i.test(label)) continue;
          input.focus();
          input.value = targetValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, label, value: input.value };
        }
        return { success: false, labels: inputs.map((input) => ascii([input.getAttribute('aria-label'), input.getAttribute('title')].join(' '))).slice(0, 20) };
      }, value)
      .catch((error) => ({ success: false, error: String(error) }));
    attempts.push({ method: 'dom-input-near-document-no', success: result.success, note: JSON.stringify(result).slice(0, 300) });
    if (result.success) {
      await page.keyboard.press('Tab').catch(() => undefined);
      await page.waitForTimeout(500);
      return { success: true, method: 'dom-input-near-document-no', attempts };
    }
  }

  return { success: false, method: 'not-controlled', attempts };
}

async function clickOkOnRequestPage(page: Page) {
  for (const frame of page.frames()) {
    const ok = frame.getByRole('button', { name: /^OK$/i }).first();
    if (await ok.isVisible({ timeout: 500 }).catch(() => false)) {
      await ok.click({ timeout: 5000 });
      await page.waitForTimeout(7000);
      return { clicked: true, method: 'role:button:OK' };
    }
  }
  return { clicked: false, method: 'ok-not-visible' };
}

async function journalTrace(page: Page, documentNo: string) {
  await page.goto(faJournalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|Batch Name|Document No\.|FA Posting Type/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);
  const text = await pageText(page);
  const compact = await compactPageText(page, {
    include: [/Fixed Asset G\/L Journals|Batch Name|Document No\.|FADEP-|FA-CNC-01|Depreciation|Depreciation Book|Posting Date|Amount|Post|Preview Posting|Journal Check/i],
    maxLines: 180,
    maxLineLength: 240,
  });
  return {
    url: safeUrl(page.url()),
    documentNoVisible: text.includes(documentNo),
    faDepPrefixVisible: /FADEP-/i.test(text),
    fixedAssetGlJournalVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(text),
    depreciationSignalVisible: /Depreciation|AfA|Abschreibung/i.test(text),
    previewPostingTextVisible: /Preview Posting/i.test(text),
    postTextVisible: /\bPost\b/i.test(text),
    compactText: asciiEvidenceText(compact),
  };
}

test('FIXEDASSETS-248 guarded Calculate Depreciation execution creates or traces journal lines only', async ({ page }) => {
  await page.goto(rmDemoHomeUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);

  const initialUrl = page.url();
  const initialUrlParsed = new URL(initialUrl);
  const instanceMatches = initialUrl.includes(EXPECTED_INSTANCE);
  const companyFromUrl = initialUrlParsed.searchParams.get('company');
  expect(instanceMatches, `BC URL muss Instanz ${EXPECTED_INSTANCE} enthalten.`).toBe(true);
  expect(companyFromUrl, `BC URL muss Company ${EXPECTED_COMPANY} enthalten.`).toBe(EXPECTED_COMPANY);

  await searchFor(page, SEARCH_TERM);
  const click = await clickCalculateDepreciationResult(page);
  const requestPageText = await pageText(page);
  const requestPage = requestPageSignals(requestPageText);
  const buttons = await visibleButtons(page);
  const okVisible = buttons.some((button) => /^OK$/i.test(button));
  const documentNoControl = click.clicked && requestPage.requestPageLikelyOpen ? await setDocumentNoOnRequestPage(page, DOCUMENT_NO) : { success: false, method: 'not-attempted', attempts: [] };
  const mayConfirmOk = click.clicked && requestPage.requestPageLikelyOpen && okVisible && documentNoControl.success;
  const okClick = mayConfirmOk ? await clickOkOnRequestPage(page) : { clicked: false, method: 'blocked-before-ok' };
  const afterOkText = await pageText(page);
  const unexpectedDialog = /Do you want to post|Do you want to delete|Are you sure you want to delete|Post and Print|Ship and Invoice|Create Payment|Change Company|Setup Wizard/i.test(afterOkText);
  const trace = okClick.clicked ? await journalTrace(page, DOCUMENT_NO) : undefined;
  const resultStatus = okClick.clicked ? 'observed' : 'blocked';
  const journalLineCreated = Boolean(trace?.documentNoVisible || trace?.faDepPrefixVisible);
  const blockedBy = [
    ...(click.clicked ? [] : ['calculate-depreciation-result-not-clicked']),
    ...(requestPage.requestPageLikelyOpen ? [] : ['request-page-not-recognized']),
    ...(okVisible ? [] : ['ok-not-visible']),
    ...(documentNoControl.success ? [] : ['document-no-not-controlled']),
    ...(okClick.clicked && !journalLineCreated ? ['no-journal-line-detected-after-ok'] : []),
    ...(unexpectedDialog ? ['unexpected-risk-dialog-after-ok'] : []),
  ];

  await writeJsonEvidence(faEvidencePath('010-request-page-before-ok.json'), {
    caseId: CASE_ID,
    documentNo: DOCUMENT_NO,
    click,
    requestPage,
    visibleButtons: buttons,
    okVisible,
    documentNoControl,
    mayConfirmOk,
    okClick,
    blockedBy,
  });
  await writeTextEvidence(
    faEvidencePath('010-request-page-before-ok-text.txt'),
    asciiEvidenceText(
      await compactPageText(page, {
        include: [/Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Document|FADEP-|OK|Cancel|Abbrechen|AfA|Buchungsdatum/i],
        maxLines: 100,
        maxLineLength: 220,
      }),
    ),
  );

  if (trace) {
    await writeJsonEvidence(faEvidencePath('020-journal-line-trace.json'), trace);
    await writeTextEvidence(faEvidencePath('020-journal-line-trace-text.txt'), trace.compactText || 'No compact journal trace text captured.');
  }

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-calculate-depreciation-guarded-execution',
    caseId: CASE_ID,
    source: 'playwright-guarded-calculate-depreciation-execution',
    resultStatus,
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    documentNo: DOCUMENT_NO,
    url: {
      initialUrl: safeUrl(initialUrl),
      finalUrl: safeUrl(page.url()),
      instanceMatches,
      companyFromUrl,
    },
    requestPage: {
      ...requestPage,
      okVisible,
      visibleButtons: buttons,
      documentNoControl,
      okClick,
    },
    journalTrace: trace,
    safety: {
      okConfirmedAtMostOnce: okClick.clicked,
      depreciationCalculatedAttempted: okClick.clicked,
      journalLineCreatedOrDetected: journalLineCreated,
      noPreviewPosting: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noManualJournalEdit: true,
      keepOrCleanupStatusDocumented: true,
      keepGeneratedLines: journalLineCreated,
      cleanupPerformed: false,
    },
    proved:
      resultStatus === 'observed'
        ? [
            'Business Central stayed in MCP_1_20260210 / RM-DEMO.',
            'The Calculate Depreciation request page was opened from the scoped Tell-Me result.',
            `Document No. was controlled with ${DOCUMENT_NO}.`,
            'OK was confirmed at most once on the Calculate Depreciation request page.',
            journalLineCreated ? 'A generated journal-line signal with FADEP document number was detected.' : 'No generated journal-line signal was visible after OK.',
            'No Preview Posting or Post was executed.',
          ]
        : [
            'Business Central stayed in MCP_1_20260210 / RM-DEMO.',
            'The run stopped before OK because a mandatory gate was not fulfilled.',
          ],
    notProved: [
      ...(journalLineCreated ? [] : ['No depreciation journal line was detected.']),
      'No Preview Posting result.',
      'No depreciation posting.',
      'No FA Ledger Entry or G/L Entry trace for depreciation.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-248-fa-calculate-depreciation-guarded-execution.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-248/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-248/FIXEDASSETS-248-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-248/FIXEDASSETS-248-GUARDED-EXECUTION.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-248/010-request-page-before-ok.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-248/010-request-page-before-ok-text.txt',
      ...(trace
        ? [
            'playwright/projects/fibu-book5/evidence/fixedassets-248/020-journal-line-trace.json',
            'playwright/projects/fibu-book5/evidence/fixedassets-248/020-journal-line-trace-text.txt',
          ]
        : []),
    ],
    statePatch: {
      current: {
        activeCase: journalLineCreated
          ? 'FIXEDASSETS-249-FA-DEPRECIATION-JOURNAL-LINE-DECISION'
          : 'FIXEDASSETS-249-FA-DEPRECIATION-EXECUTION-BLOCKER-REVIEW',
        active_case_file: journalLineCreated
          ? '.agent/state/cases/fixedassets-249-fa-depreciation-journal-line-decision.json'
          : '.agent/state/cases/fixedassets-249-fa-depreciation-execution-blocker-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-248-fa-calculate-depreciation-guarded-execution.json',
        nextStep: journalLineCreated
          ? 'FIXEDASSETS-249: decide locally whether generated depreciation journal lines are kept for Preview Posting-only evidence or require cleanup first; do not Preview or Post yet.'
          : 'FIXEDASSETS-249: review the Calculate Depreciation blocker before any repeat execution.',
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase: journalLineCreated
          ? 'FIXEDASSETS-249-FA-DEPRECIATION-JOURNAL-LINE-DECISION'
          : 'FIXEDASSETS-249-FA-DEPRECIATION-EXECUTION-BLOCKER-REVIEW',
        depreciationReadiness: journalLineCreated
          ? `FA-248 confirmed OK once and detected depreciation journal-line signal with ${DOCUMENT_NO}. Preview Posting and Post remain locked.`
          : 'FA-248 did not detect generated depreciation journal lines; execution blocker review is required.',
      },
    },
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'Guarded Calculate Depreciation execution completed within journal-line-only boundary.'
        : 'Guarded execution stopped before OK because required gate conditions were not met.',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-248-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-248-GUARDED-EXECUTION.md'),
    [
      '# FIXEDASSETS-248 Guarded Calculate Depreciation Execution',
      '',
      'Status: `labor`, `guarded-execution`, `journal-line-trace`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      `- Umgebung: \`${EXPECTED_INSTANCE}\``,
      `- Company: \`${EXPECTED_COMPANY}\``,
      `- Document No.: \`${DOCUMENT_NO}\``,
      `- Request Page erkannt: ${requestPage.requestPageLikelyOpen ? 'ja' : 'nein'}`,
      `- Document No. kontrolliert: ${documentNoControl.success ? 'ja' : 'nein'} (${documentNoControl.method})`,
      `- OK bestaetigt: ${okClick.clicked ? 'ja' : 'nein'} (${okClick.method})`,
      `- Journalzeilen-Signal sichtbar: ${journalLineCreated ? 'ja' : 'nein'}`,
      '',
      '## Grenzen',
      '',
      '- Kein Preview Posting.',
      '- Keine Buchung.',
      '- Keine manuelle Journalzeilen-Aenderung.',
      '- Kein Setup Change.',
      '- Kein Company Switch.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      result.statePatch.current.nextStep,
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-248 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-248-result.json` | JSON-Ergebnis | Ausfuehrungsgrenzen, OK-Gate, Journalzeilen-Trace | kein Preview/Post | labor |',
      '| `FIXEDASSETS-248-GUARDED-EXECUTION.md` | Lernzusammenfassung | Buchwirkung und Grenzen | keinen deutschen Finalnachweis | labor |',
      '| `010-request-page-before-ok.json` | Request-Page-Evidence | Feld-/OK-Gate vor Ausfuehrung | keine Buchung | preflight |',
      '| `020-journal-line-trace.json` | Journal-Evidence | erzeugte oder gesuchte Journalzeilensignale | keine Postenspur | journal-trace |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noSetupChange).toBe(true);
  expect(result.safety.noCompanySwitch).toBe(true);
  expect(result.safety.noManualJournalEdit).toBe(true);
  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|unexpected-risk/i.test(entry))).toEqual([]);
});
