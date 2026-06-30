import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-026M-SKR04-GUV-ACCOUNT-PAGEINSPECTION-FOLLOWUP';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-026m-skr04-guv-account-pageinspection-followup';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-026M-PAGEINSPECTION-result.json');
const GL_ACCOUNT_CARD_PAGE_ID = 17;

const targetAccounts = [
  {
    no: '4400',
    name: 'Umsatzerloese Inland 19 Prozent',
    expectedType: 'GuV',
    currentProblem: 'visible as Bilanz/Buchung after previous recovery attempts'
  },
  {
    no: '5400',
    name: 'Wareneingang / Materialaufwand',
    expectedType: 'GuV',
    currentProblem: 'visible as Bilanz/Buchung after previous recovery attempts'
  }
];

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(accountNo: string) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(GL_ACCOUNT_CARD_PAGE_ID));
  url.searchParams.set('filter', `'G/L Account'.'No.' IS '${accountNo}'`);
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function containsDangerousDialog(text: string) {
  return /\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|L schen|Ship|Invoice|Payment|Apply|OK|Yes|Ja|Finish|New|Neu|Edit|Bearbeiten)\b/i.test(
    text
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function safePageText(page: Page) {
  return clean(await pageText(page));
}

async function assertReadOnlyContext(page: Page) {
  const currentUrl = page.url();
  expect(instancePathIsTarget(currentUrl), `Wrong instance in URL: ${sanitizeEvidenceUrl(currentUrl)}`).toBe(true);
  expect(companyParamIsTarget(currentUrl), `Wrong company in URL: ${sanitizeEvidenceUrl(currentUrl)}`).toBe(true);
  const dangerousDialogTexts: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (containsDangerousDialog(text)) dangerousDialogTexts.push(text);
    }
  }
  expect(dangerousDialogTexts, 'A dangerous or write-like dialog is visible.').toEqual([]);
}

async function closeExternalPages(page: Page) {
  const closed: string[] = [];
  for (const candidate of page.context().pages()) {
    if (candidate === page) continue;
    const url = candidate.url();
    if (!/businesscentral\.dynamics\.com/i.test(url)) {
      closed.push(sanitizeUrlLoose(url));
      await candidate.close().catch(() => undefined);
    }
  }
  return closed;
}

function sanitizeUrlLoose(rawUrl: string) {
  try {
    return sanitizeEvidenceUrl(rawUrl);
  } catch {
    return rawUrl.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant}');
  }
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = path.join(EVIDENCE_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function compactCardText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Sachkontokarte|G\/L Account Card|G\/L Account|Nr\.|No\.|Name|GuV\/Bilanz|Income\/Balance|Bilanz|Balance Sheet|GuV|Income Statement|Kontoart|Account Type|Buchung|Posting|4400|5400|Umsatzerloese|Wareneingang|Page Inspection|Source Table|Table ID|Page ID/i
      ],
      maxLines: 220,
      maxLineLength: 260
    })
  );
}

async function collectFieldControlMap(page: Page, captions: string[]) {
  const maps = [];
  for (const frame of page.frames().filter((entry) => /businesscentral\.dynamics\.com/i.test(entry.url()))) {
    const frameMap = await frame
      .evaluate((captionValues) => {
        const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const esc = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const labelCandidates = Array.from(document.querySelectorAll<HTMLElement>('label,span,div,[aria-label],[title],[role="button"],button'))
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            return {
              index,
              tag: element.tagName,
              text: normalize(element.innerText || element.textContent),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              role: normalize(element.getAttribute('role')),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          });
        const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea,[role="combobox"],[aria-haspopup]'))
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            const input = element as HTMLInputElement;
            return {
              index,
              tag: element.tagName,
              type: normalize(input.type),
              value: normalize(element instanceof HTMLSelectElement ? [...element.options].find((option) => option.selected)?.text || element.value : input.value),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              role: normalize(element.getAttribute('role')),
              disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
              readOnly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          });

        return captionValues.map((caption) => {
          const captionRegex = new RegExp(`(^|\\b)${esc(caption)}($|\\b)`, 'i');
          const label = labelCandidates
            .filter((candidate) => captionRegex.test(`${candidate.text} ${candidate.aria} ${candidate.title}`))
            .sort((left, right) => left.y - right.y || left.x - right.x)[0];
          const nearbyControls = label
            ? controls
                .filter((control) => Math.abs(control.y - label.y) <= 18 || Math.abs(control.y - (label.y + label.height)) <= 18)
                .filter((control) => control.x >= label.x)
                .sort((left, right) => left.x - right.x)
                .slice(0, 12)
            : [];
          const nearbyTexts = label
            ? labelCandidates
                .filter((candidate) => Math.abs(candidate.y - label.y) <= 18)
                .filter((candidate) => candidate.x >= label.x)
                .sort((left, right) => left.x - right.x)
                .slice(0, 16)
            : [];
          return {
            caption,
            label,
            nearbyControls,
            nearbyTexts
          };
        });
      }, captions)
      .catch((error) => [{ error: String(error), caption: 'frame-evaluation-error' }]);
    maps.push({ frameUrl: sanitizeUrlLoose(frame.url()), fields: frameMap });
  }
  return maps;
}

function classifyGuvValueFromMap(fieldControlMap: unknown) {
  const text = JSON.stringify(fieldControlMap);
  const hasExactGuvValue = /"value"\s*:\s*"(GuV|Income Statement)"/i.test(text);
  const hasExactBalanceValue = /"value"\s*:\s*"(Bilanz|Balance Sheet)"/i.test(text);
  const labelOnlyRisk = /GuV\/Bilanz/i.test(text) && !hasExactGuvValue;
  return {
    hasExactGuvValue,
    hasExactBalanceValue,
    labelOnlyRisk,
    safeToCountAsGuv: hasExactGuvValue
  };
}

async function openPageInspection(page: Page) {
  const before = await safePageText(page);
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(3500);
  const closedExternalPages = await closeExternalPages(page);
  await assertReadOnlyContext(page);
  const compactText = await compactCardText(page);
  const after = await safePageText(page);
  const joined = clean(`${compactText}\n${after}`);
  const technicalSignals =
    /Page Inspection|Inspect pages and data|Page ID|Page Name|Page Type|Source Table|Table ID|Seitenpr|Seitenuberprufung|Seitenueberpruefung/i.test(joined) ||
    (/G\/L Account Card \(17, Card\)/i.test(joined) && /G\/L Account \(15\)/i.test(joined) && /Income\/Balance \(9, Option\)/i.test(joined));
  const opened = technicalSignals && after !== before;
  return {
    opened,
    closedExternalPages,
    focusedLines: joined
      .split('\n')
      .map((line) => clean(line))
      .filter(Boolean)
      .filter((line) => /Page Inspection|Inspect pages and data|Page ID|Page Name|Page Type|Source Table|Table ID|G\/L Account|Sachkontokarte|GuV\/Bilanz|Income\/Balance|4400|5400/i.test(line))
      .slice(0, 220)
  };
}

async function inspectAccount(page: Page, target: (typeof targetAccounts)[number]) {
  await page.goto(buildPlaythruUrl(target.no), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1800);
  await assertReadOnlyContext(page);

  const beforeText = await compactCardText(page);
  const beforeMap = await collectFieldControlMap(page, ['Nr.', 'No.', 'Name', 'GuV/Bilanz', 'Income/Balance', 'Kontoart', 'Account Type']);
  const beforeValue = classifyGuvValueFromMap(beforeMap);
  await writeText(`target-026m-pageinspection-${target.no}-010-card-before.txt`, beforeText || 'No compact card text captured.');
  await writeJson(path.join(EVIDENCE_DIR, `target-026m-pageinspection-${target.no}-010-card-before.snapshot.json`), {
    targetAccount: target,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    beforeText,
    beforeMap,
    beforeValue
  });
  await screenshotWithMetadata(page, `target-026m-pageinspection-${target.no}-010-card-before.png`, {
    page: 'Sachkontokarte / G/L Account Card',
    step: `Filtered card context before Page Inspection for ${target.no}`,
    status: 'readonly-diagnostic',
    importantUi: ['GuV/Bilanz', 'Kontoart', 'Nr.', 'Name'],
    internallyProves: 'The target account card context is visible before technical inspection.',
    doesNotProve: ['No GuV correction', 'No VAT setup', 'No posting setup', 'No preview', 'No posting'],
    screenshotQaRule: 'Do not count the label GuV/Bilanz as value GuV.'
  });

  const pageInspection = await openPageInspection(page);
  const afterInspectionText = await compactCardText(page);
  const afterInspectionMap = await collectFieldControlMap(page, ['Page ID', 'Source Table', 'Table ID', 'GuV/Bilanz', 'Income/Balance', 'Nr.', 'Name']);
  await writeText(`target-026m-pageinspection-${target.no}-020-page-inspection.txt`, pageInspection.focusedLines.join('\n') || afterInspectionText);
  await writeJson(path.join(EVIDENCE_DIR, `target-026m-pageinspection-${target.no}-020-page-inspection.snapshot.json`), {
    targetAccount: target,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    pageInspection,
    afterInspectionText,
    afterInspectionMap
  });
  await screenshotWithMetadata(page, `target-026m-pageinspection-${target.no}-020-page-inspection.png`, {
    page: 'Page Inspection / Seitenpruefung on G/L Account Card',
    step: `Technical field/page inspection for ${target.no}`,
    status: pageInspection.opened ? 'page-inspection-visible' : 'page-inspection-not-stably-visible',
    importantUi: ['Page ID', 'Source Table', 'Table ID', 'G/L Account Card', 'GuV/Bilanz'],
    internallyProves: pageInspection.opened ? 'Technical page/field context became visible.' : 'Shortcut attempt and resulting UI state.',
    doesNotProve: ['No write route', 'No setup completeness', 'No final German accounting proof']
  });

  return {
    targetAccount: target,
    url: sanitizeEvidenceUrl(page.url()),
    beforeValue,
    pageInspection,
    hasCardContext: new RegExp(`${target.no}|${target.name}|Sachkontokarte|G/L Account`, 'i').test(beforeText),
    fieldControlMapCaptured: JSON.stringify(beforeMap).includes('GuV/Bilanz') || JSON.stringify(beforeMap).includes('Income/Balance'),
    fieldControlMap: beforeMap
  };
}

test('TARGET-026M identifies GuV/Bilanz page/control semantics read-only', async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1350 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const accountResults = [];
  for (const target of targetAccounts) {
    accountResults.push(await inspectAccount(page, target));
  }

  const pageInspectionVisible = accountResults.some((entry) => entry.pageInspection.opened);
  const controlMapCaptured = accountResults.every((entry) => entry.fieldControlMapCaptured);
  const allCardsVisible = accountResults.every((entry) => entry.hasCardContext);
  const blockedBy = [
    ...(allCardsVisible ? [] : ['At least one filtered G/L Account Card did not expose a stable target account context.']),
    ...(controlMapCaptured ? [] : ['GuV/Bilanz control map was not captured for all target accounts.']),
    ...(pageInspectionVisible ? [] : ['Page Inspection was not stably visible through Ctrl+Alt+F1 in this browser context.'])
  ];
  const resultStatus = allCardsVisible && (controlMapCaptured || pageInspectionVisible) ? 'observed' : 'blocked';
  const safeWriteRouteReady = pageInspectionVisible && controlMapCaptured;
  const nextCase = safeWriteRouteReady
    ? 'TARGET-026M-SKR04-GUV-ACCOUNT-SAFE-WRITE-FOLLOWUP'
    : 'TARGET-026M-SKR04-GUV-ACCOUNT-FIELD-CONTROL-ROUTE-DECISION';

  const nextStepDecisionCard = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
    lastEvidenceSummary: '4400 and 5400 are visible in the chart but still Bilanz/Buchung after list-cell and card recovery attempts.',
    isPlannedNextCaseStillSensible: false,
    reason: 'The chart checkpoint still depends on a conscious GuV/Bilanz resolution for starter revenue and expense accounts.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-026M-SKR04-GUV-ACCOUNT-SAFE-WRITE-FOLLOWUP',
        status: safeWriteRouteReady ? 'ready-next' : 'needs-ui-discovery-first',
        reason: safeWriteRouteReady
          ? 'Page Inspection/control mapping is enough to attempt one safer, non-repeated write route.'
          : 'Field route is not yet field-secure enough for another write attempt.'
      },
      {
        caseId: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
        status: safeWriteRouteReady ? 'ready-after-current' : 'needs-setup-first',
        reason: 'The checkpoint follows only after 4400/5400 are corrected or consciously parked.'
      },
      {
        caseId: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'VAT setup waits for correct sales/purchase G/L account foundation.'
      },
      {
        caseId: 'TARGET-028-CUSTOMER-VENDOR-ITEM-MASTERDATA',
        status: 'needs-setup-first',
        reason: 'Master data is still locked until number series, dimensions, chart and VAT/posting setup are ready.'
      },
      {
        caseId: 'TARGET-029-FIRST-SALES-PURCHASE-DRAFT-GATE',
        status: 'needs-setup-first',
        reason: 'Document drafts wait for foundation readiness.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: safeWriteRouteReady
      ? 'It is the first controlled write attempt based on technical field/context proof instead of repeating list-cell typing.'
      : 'It prevents another blind write attempt and forces a conscious route decision.',
    risksBeforeNextCase: [
      'Do not count GuV/Bilanz label text as value GuV.',
      'Do not proceed to VAT/posting groups while 4400/5400 remain Bilanz.'
    ],
    requiredPreparation: safeWriteRouteReady
      ? ['Use exact Page/Card/Field context from this result; one write route only, with before/after/reopen proof.']
      : ['Review whether Page Inspection, Personalize, object metadata, or a different standard UI route is needed.']
  };

  const screenshots = accountResults.flatMap((entry) => [
    `target-026m-pageinspection-${entry.targetAccount.no}-010-card-before.png`,
    `target-026m-pageinspection-${entry.targetAccount.no}-020-page-inspection.png`
  ]);
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-pageinspection',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      'Filtered G/L Account Card contexts for 4400 and 5400 were opened read-only.',
      ...(controlMapCaptured ? ['GuV/Bilanz field/control surroundings were captured without changing values.'] : []),
      ...(pageInspectionVisible ? ['Page Inspection / technical page context became visible for at least one target account.'] : [])
    ],
    notProved: [
      '4400 and 5400 are not proven corrected to GuV.',
      'No safe GuV write route was executed in this read-only follow-up.',
      'No VAT setup, posting groups, master data, document draft, preview or posting was executed.',
      'No final German accounting claim.'
    ],
    changedFiles: [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/`],
    screenshots,
    evidenceRefs: [
      'TARGET-026M-PAGEINSPECTION-result.json',
      'README.md',
      ...screenshots,
      ...screenshots.map((entry) => entry.replace(/\.png$/i, '.screenshot.json')),
      ...screenshots.map((entry) => entry.replace(/\.png$/i, '.snapshot.json')),
      ...screenshots.map((entry) => entry.replace(/\.png$/i, '.txt'))
    ],
    warnings: accountResults.flatMap((entry) =>
      entry.beforeValue.labelOnlyRisk ? [`${entry.targetAccount.no}: GuV/Bilanz label is visible; this must not be counted as value GuV.`] : []
    ),
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: false,
    flags: {
      noSetupChange: true,
      noVatSetupChange: true,
      noPostingGroupChange: true,
      noMasterData: true,
      noDocumentOrDraft: true,
      noPreview: true,
      noPost: true,
      noApiShortcut: true,
      noBookChange: true,
      noCompanySwitch: true
    },
    accountResults,
    nextStepDecisionCard,
    nextCase,
    reason:
      resultStatus === 'observed'
        ? 'Read-only G/L Account Card field/page context was captured; next step is a conscious field-route decision before any write.'
        : `Read-only Page Inspection follow-up is blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-026M SKR04 GuV Account Page Inspection Follow-up',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Screenshot-QA-Regel',
      '',
      '- `GuV/Bilanz` als Feldbeschriftung zaehlt nicht als Wert `GuV`.',
      '- Der Wert muss als Feldwert, Control-Wert oder nach Reopen sichtbar sein.',
      '',
      '## Sicherheit',
      '',
      '- Keine Setup-Aenderung.',
      '- Keine VAT-/Posting-Group-Aenderung.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Kein API Shortcut.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
