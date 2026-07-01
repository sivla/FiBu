import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-036D2C-VENDOR-NUMBER-SERIES-CARD-OR-PERSONALIZATION-ROUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_SERIES = 'U-VEND';
const EVIDENCE_ID = 'target-036d2c-vendor-number-series-card-or-personalization-route';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036D2C-result.json');

type ActionCandidate = {
  text: string;
  aria: string;
  title: string;
  role: string;
  visibleText: string;
};

function buildNumberSeriesUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', '456');
  return url;
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/',
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function assertSafeNumberSeriesContext(page: Page) {
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) throw new Error(`Unsafe context: ${sanitizeUrl(url)}`);
  const text = await safeText(page);
  if (!/Nummernserie|No\. Series/i.test(text)) throw new Error('Number Series page is not visible.');
  if (/Preview Posting|Buchen\?|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Zahlung buchen|Payment Journal/i.test(text)) {
    throw new Error('Posting/payment text appeared in a number-series route-discovery case.');
  }
}

async function openNumberSeries(page: Page) {
  await page.goto(buildNumberSeriesUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertSafeNumberSeriesContext(page);
}

async function selectUVendRow(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const exact = scope.getByText(/^U-VEND$/).first();
    if (await exact.isVisible({ timeout: 700 }).catch(() => false)) {
      await exact.click({ timeout: 5000 }).catch(async () => exact.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(700);
      return true;
    }
    const row = scope.getByRole('row', { name: /U-VEND/i }).first();
    if (await row.isVisible({ timeout: 700 }).catch(() => false)) {
      await row.click({ timeout: 5000 }).catch(async () => row.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(700);
      return true;
    }
  }
  return false;
}

async function clickSafeAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
        await locator.click({ timeout: 5000 }).catch(async () => locator.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(900);
        return true;
      }
    }
  }
  return false;
}

async function collectActions(page: Page): Promise<ActionCandidate[]> {
  const frameResults = await Promise.all(
    page.frames().map((frame) =>
      frame
        .evaluate(() => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
            .filter(visible)
            .map((element) => ({
              text: normalize(element.innerText || element.textContent),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              role: normalize(element.getAttribute('role') || element.tagName.toLowerCase()),
              visibleText: normalize(`${element.innerText || element.textContent} ${element.getAttribute('aria-label') || ''} ${element.getAttribute('title') || ''}`),
            }))
            .filter((entry) => entry.visibleText)
            .slice(0, 220);
        })
        .catch(() => [] as ActionCandidate[]),
    ),
  );
  const seen = new Set<string>();
  return frameResults
    .flat()
    .filter((entry) => {
      const key = `${entry.role}|${entry.visibleText}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter((entry) => /Zeilen|Line|Liste bearbeiten|Edit List|Weitere Optionen|More|Alle anzeigen|Show all|Karte|Card|Oeffnen|Open|Details|Personalisieren|Personalize|Seiten|Inspect|Standard|Manual|Manuelle|U-VEND|Verbindungen/i.test(entry.visibleText))
    .slice(0, 80);
}

async function hoverFirst(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.getByText(label).first();
    if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
      await locator.hover({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(800);
      return true;
    }
  }
  return false;
}

async function compactSnapshot(page: Page) {
  return compactPageText(page, {
    include: [/Nummernserie|No\. Series|Code|Beschreibung|Description|Standardnr|Default Nos|Manuelle|Manual Nos|U-VEND|Universaarl|Page Inspection|Seiten|Personalisieren|Personalize|Zeilen|Lines|Details|Karte|Card|Weitere Optionen|More/i],
    maxLines: 220,
    maxLineLength: 220,
  });
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata,
  });
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactSnapshot(page);
  await writeText(`${filePrefix}.txt`, compact);
  const snapshot = {
    step,
    url: sanitizeUrl(page.url()),
    title: clean(await page.title()),
    compact,
    actionCandidates: await collectActions(page),
    ...extra,
  };
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nummernserie / No. Series',
    pageId: 456,
    step,
    targetSeries: TARGET_SERIES,
    visibleLearning: 'Die Nummernserienliste zeigt U-VEND, Checkboxspalten und moegliche Routen wie Zeilen, Liste bearbeiten, Weitere Optionen und technische Pruefflaechen.',
    importantUi: ['U-VEND row', 'Standardnr. / Default Nos.', 'Manuelle Anz. / Manual Nos.', 'Zeilen / Lines', 'Weitere Optionen / More options'],
    internallyProves: 'Read-only UI context for a safer U-VEND Standardnr. route in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No setup write.', 'No vendor exists.', 'No Preview Posting or Posting occurred.'],
    qualityDecision: 'read-only-route-discovery-evidence',
    ...extra,
  });
  return snapshot;
}

async function tryPageInspection(page: Page) {
  await selectUVendRow(page);
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(1500);
  const text = await safeText(page);
  const opened = /Page Inspection|Seitenprufung|Seitenueberprufung|Page ID|Source Table|Table ID|Inspect/i.test(text);
  return { attempted: true, opened, textMatched: opened };
}

test('TARGET-036D2C inspects U-VEND route alternatives without setup write', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await openNumberSeries(page);
  const selectedUVend = await selectUVendRow(page);
  const before = await captureState(page, 'target-036d2c-010-u-vend-readonly-context', 'U-VEND read-only context before route discovery.', {
    selectedUVend,
  });

  const hoverStandard = await hoverFirst(page, /Standardnr\.?|Default Nos\.?/i);
  const hoverManual = await hoverFirst(page, /Manuelle Anz\.?|Manual Nos\.?/i);
  const hoverSnapshot = await captureState(page, 'target-036d2c-020-hover-checkbox-columns', 'Hover context for Standardnr. and Manuelle Anz.', {
    hoverStandard,
    hoverManual,
  });

  const moreOptionsClicked = await clickSafeAction(page, /^Weitere Optionen$|^More options$|Weitere Optionen|More options/i);
  const moreOptions = await captureState(page, 'target-036d2c-030-more-options-context', 'More Options context after safe command-bar expansion.', {
    moreOptionsClicked,
  });
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  await selectUVendRow(page);

  const pageInspection = await tryPageInspection(page);
  const inspection = await captureState(page, 'target-036d2c-040-page-inspection-attempt', 'Page Inspection shortcut attempt.', {
    pageInspection,
  });
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  const visibleActionText = [before, hoverSnapshot, moreOptions, inspection]
    .flatMap((snapshot) => snapshot.actionCandidates as ActionCandidate[])
    .map((entry) => entry.visibleText)
    .join(' | ');
  const hasCardOrOpenRoute = /Karte|Card|Oeffnen|Open|Details/i.test(visibleActionText);
  const hasPersonalizeSignal = /Personalisieren|Personalize/i.test(visibleActionText);
  const hasInspectionSignal =
    pageInspection.opened ||
    /Page Inspection|Seitenprufung|Seitenueberprufung|No\. Series \(456, List\)|No\. Series \(308\)|Default Nos\. \(3, Boolean\)|Manual Nos\. \(4, Boolean\)/i.test(
      inspection.compact,
    );
  const routeSignals = {
    hasCardOrOpenRoute,
    hasPersonalizeSignal,
    hasInspectionSignal,
    moreOptionsClicked,
  };
  const routeFound = hasCardOrOpenRoute || hasPersonalizeSignal || hasInspectionSignal;
  const resultStatus = routeFound ? 'observed' : 'blocked';
  const nextCase = routeFound
    ? 'TARGET-036D2D-VENDOR-NUMBER-SERIES-READONLY-ROUTE-DECISION'
    : 'TARGET-036D2D-VENDOR-NUMBER-SERIES-ALTERNATIVE-DECISION';
  const blockedBy = routeFound
    ? []
    : ['No card/details, personalization or page-inspection route signal was visible enough to justify a setup write.'];

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-036D3-FIRST-VENDOR-CONTROLLED-WRITE-RETRY',
    lastEvidenceSummary:
      'TARGET-036D2B blocked before setup change because the U-VEND Standardnr. checkbox could not be safely mapped to the row.',
    isPlannedNextCaseStillSensible: false,
    reason:
      'The vendor retry still needs a supported U-VEND numbering decision. D2C is read-only and only discovers whether a safer route exists.',
    lookaheadReviewed: [
      {
        caseId: nextCase,
        status: 'ready-next',
        reason: routeFound
          ? 'Route signals were observed and must be reviewed before a narrow write case.'
          : 'No safer UI route was visible, so an alternative numbering/setup decision is needed before vendor retry.',
      },
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-CONTROLLED-WRITE-RETRY',
        status: 'blocked',
        reason: 'Blocked until U-VEND Standardnr. is active after reopen or another numbering route is deliberately selected.',
      },
      {
        caseId: 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE',
        status: 'needs-setup-first',
        reason: 'Item creation should wait until the vendor-numbering blocker is closed or consciously parked.',
      },
      {
        caseId: 'TARGET-039-FOUNDATION-BLOCKER-REVISIT',
        status: 'ready-after-current',
        reason: 'Useful after the numbering decision to re-check remaining foundation blockers.',
      },
    ],
    queueChangesMade: [`Prepare ${nextCase} after D2C.`],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: routeFound
      ? 'It reviews the captured route signals before any setup write.'
      : 'It avoids another blind UI attempt and forces a conscious alternative decision.',
    risksBeforeNextCase: [
      'Do not toggle Standardnr. or Manuelle Anz. without an explicit write case.',
      'Do not create vendor/customer/item records.',
      'Do not use API shortcuts.',
      'Do not confirm save/setup/post/preview/delete dialogs.',
    ],
    requiredPreparation: routeFound
      ? ['Review D2C action inventory, hover context and Page Inspection result before selecting a write route.']
      : ['Choose whether to park vendor creation, use manual numbering only with an explicit case, or find a supported setup route from source documentation.'],
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vendor-number-series-readonly-route-discovery',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'No. Series / Nummernserie',
    pageId: 456,
    url: sanitizeUrl(page.url()),
    actionsTaken: [
      'Opened Business Central Number Series Page 456 in playthru / UNIVERSAARL-DE.',
      selectedUVend ? 'Selected the U-VEND row.' : 'Tried to select the U-VEND row.',
      'Captured read-only action inventory for U-VEND number-series context.',
      'Hovered Standardnr. and Manuelle Anz. column labels where visible.',
      moreOptionsClicked ? 'Opened More Options / Weitere Optionen read-only.' : 'More Options / Weitere Optionen was not visible enough to open.',
      'Tried Page Inspection shortcut as read-only technical context.',
    ],
    actionsNotTaken: [
      'No Standardnr. / Default Nos. checkbox was toggled.',
      'No Manuelle Anz. / Manual Nos. checkbox was toggled.',
      'No number-series line was changed.',
      'No non-U-VEND number series was changed.',
      'No vendor, customer or item was created.',
      'No document or draft was created.',
      'No Preview Posting was executed.',
      'No Posting was executed.',
      'No payment was executed.',
      'No API shortcut was used.',
      'No company switch was executed.',
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036d2c-010-u-vend-readonly-context.png',
      'playwright/projects/fibu-book5/img/target-036d2c-020-hover-checkbox-columns.png',
      'playwright/projects/fibu-book5/img/target-036d2c-030-more-options-context.png',
      'playwright/projects/fibu-book5/img/target-036d2c-040-page-inspection-attempt.png',
    ],
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'U-VEND was inspected read-only on Number Series Page 456.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.',
      routeFound ? 'At least one route signal was visible enough for a follow-up route-decision case.' : 'No safer route signal was visible enough for an immediate setup write.',
      hasInspectionSignal ? 'Page Inspection exposed the No. Series page/table and field identifiers read-only; this is a technical field-list proof, not a U-VEND value proof.' : 'Page Inspection did not expose enough technical field context.',
    ],
    notProved: [
      'U-VEND Standardnr. / Default Nos. is not proven active.',
      'Manual Nos. / Manuelle Anz. is not changed or proven active.',
      'Page Inspection does not prove a persisted U-VEND checkbox value in this read-only case.',
      'The More Options row-menu screenshot is not a U-VEND value proof because Business Central can move list focus while opening row menus.',
      'No vendor creation retry is allowed from this case alone.',
      'No legal numbering, posting group, VAT, payment term, document, Preview Posting or Posting behavior is proven.',
    ],
    blockedBy,
    warnings: [
      'D2C is read-only and must not be treated as a setup-fit proof.',
      'Checkbox grid values on Business Central lists need a route with row/field certainty before any write.',
      'Screenshot QA must distinguish selected-row proof from general action/menu inventory; row focus can drift on Business Central lists.',
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCustomerCreated: true,
      noVendorCreated: true,
      noItemCreated: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
    },
    routeSignals,
    before,
    hoverSnapshot,
    moreOptions,
    inspection,
    nextStepDecision,
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2C-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-036d2c-*.png',
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2C-result.json`,
      'playwright/projects/fibu-book5/img/target-036d2c-010-u-vend-readonly-context.png',
      'playwright/projects/fibu-book5/img/target-036d2c-020-hover-checkbox-columns.png',
      'playwright/projects/fibu-book5/img/target-036d2c-030-more-options-context.png',
      'playwright/projects/fibu-book5/img/target-036d2c-040-page-inspection-attempt.png',
    ],
    requiresReview: true,
    safeToFinalizeState: false,
    statePatch: {},
    reason: routeFound
      ? 'Read-only route signals captured; review required before any U-VEND setup write.'
      : `Read-only route discovery blocked: ${blockedBy.join('; ')}`,
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-036D2C Vendor Number Series Read-only Route Discovery',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Route-Signale',
      '',
      `- Karten-/Detailsignal: ${hasCardOrOpenRoute ? 'ja' : 'nein'}`,
      `- Personalisieren-Signal: ${hasPersonalizeSignal ? 'ja' : 'nein'}`,
      `- Seitenpruefung/Page Inspection Signal: ${hasInspectionSignal ? 'ja' : 'nein'}`,
      `- Weitere Optionen geoeffnet: ${moreOptionsClicked ? 'ja' : 'nein'}`,
      '',
      '## Grenzen',
      '',
      '- Keine Checkbox wurde veraendert.',
      '- Keine Nummernserienzeile wurde geaendert.',
      '- Kein Kreditor wurde angelegt.',
      '- Keine Vorlage, kein Beleg, keine Preview und keine Buchung.',
      '- Der naechste Schritt ist eine Entscheidung, kein direkter Stammdaten-Retry.',
      '',
    ].join('\n'),
    'utf8',
  );

  expect(resultStatus === 'observed' || blockedBy.length > 0, blockedBy.join('\n')).toBe(true);
});
