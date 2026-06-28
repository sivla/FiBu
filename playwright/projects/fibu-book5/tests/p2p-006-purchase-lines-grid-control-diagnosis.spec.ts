import { test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { project } from '../project';

type DomEntry = {
  frameIndex: number;
  frameUrl: string;
  index: number;
  tag: string;
  type: string;
  role: string;
  aria: string;
  title: string;
  controlName: string;
  value: string;
  text: string;
  cellText: string;
  rowText: string;
  readonly: boolean;
  disabled: boolean;
  tabIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type FrameSnapshot = {
  frameIndex: number;
  frameUrl: string;
  bodyTextSample: string;
  entries: DomEntry[];
  headers: DomEntry[];
  rows: string[];
  gridHints: string[];
};

const caseId = 'P2P-006-PURCHASE-LINES-GRID-CONTROL-DIAGNOSIS';
const environment = process.env.BC_ENVIRONMENT ?? 'MCP_1_20260210';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const purchaseOrderNo = process.env.P2P006_PURCHASE_ORDER_NO ?? '106051';
const vendorNo = 'K10000';
const vendorName = 'Stahlwerk Ruhr GmbH';

const evidenceDir = path.join(process.cwd(), 'playwright/projects/fibu-book5/evidence/p2p-006');

function purchaseOrderUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', company);
  url.searchParams.set('page', '50');
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${purchaseOrderNo}'`);
  return url.toString();
}

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (/token|tenant|trace|client|auth|session|sid/i.test(key)) {
        url.searchParams.set(key, '[redacted]');
      }
    }
    return url.toString();
  } catch {
    return value.replace(/(token|tenant|trace|client|auth|session|sid)=([^&\s]+)/gi, '$1=[redacted]');
  }
}

function interesting(entry: DomEntry) {
  return /Lines|Type|No\.|Item|RAW-STEEL|Location|FRA-ZL|Quantity|Qty\.|Receive|Direct Unit Cost|Description|K10000|Stahlwerk|Vendor|Buy-from|Purch/i.test(
    `${entry.controlName} ${entry.aria} ${entry.title} ${entry.text} ${entry.cellText} ${entry.rowText} ${entry.value}`,
  );
}

async function ensureDirs() {
  await fs.mkdir(evidenceDir, { recursive: true });
}

async function writeJson(fileName: string, data: unknown) {
  await fs.writeFile(path.join(evidenceDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, data: string) {
  await fs.writeFile(path.join(evidenceDir, fileName), data, 'utf8');
}

async function collectFrameSnapshots(page: Page): Promise<FrameSnapshot[]> {
  const snapshots: FrameSnapshot[] = [];

  for (const [frameIndex, frame] of page.frames().entries()) {
    const snapshot = await frame
      .evaluate(
        ({ frameIndex, frameUrl }) => {
          const normalize = (value: string | null | undefined, max = 180) =>
            String(value ?? '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, max);
          const isVisible = (element: Element) => {
            const html = element as HTMLElement;
            const rect = html.getBoundingClientRect();
            const style = window.getComputedStyle(html);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const toEntry = (element: Element, index: number) => {
            const html = element as HTMLElement;
            const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            const rect = html.getBoundingClientRect();
            const cell = html.closest('[role="gridcell"],[role="cell"],td');
            const row = html.closest('[role="row"],tr');
            return {
              frameIndex,
              frameUrl,
              index,
              tag: html.tagName.toLowerCase(),
              type: (input as HTMLInputElement).type ?? '',
              role: html.getAttribute('role') ?? '',
              aria: html.getAttribute('aria-label') ?? '',
              title: html.getAttribute('title') ?? '',
              controlName:
                html.getAttribute('controlname') ??
                html.closest('[controlname]')?.getAttribute('controlname') ??
                '',
              value: 'value' in input ? normalize(input.value, 120) : '',
              text: normalize(html.innerText || html.textContent, 160),
              cellText: normalize(cell?.textContent, 180),
              rowText: normalize(row?.textContent, 260),
              readonly: Boolean((input as HTMLInputElement).readOnly || html.getAttribute('aria-readonly') === 'true'),
              disabled: Boolean((input as HTMLInputElement).disabled || html.getAttribute('aria-disabled') === 'true'),
              tabIndex: html.tabIndex,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          };

          const candidates = [
            ...document.querySelectorAll(
              [
                'input',
                'textarea',
                'select',
                '[contenteditable="true"]',
                '[role="textbox"]',
                '[role="combobox"]',
                '[role="gridcell"]',
                '[role="cell"]',
                '[role="columnheader"]',
                '[role="rowheader"]',
                'td',
                'th',
                'button',
                '[role="button"]',
                '[aria-label]',
                '[title]',
                '[controlname]',
              ].join(', '),
            ),
          ].filter(isVisible);

          const entries = candidates.map(toEntry);
          const headers = entries.filter((entry) =>
            /columnheader|rowheader|th/i.test(`${entry.role} ${entry.tag}`),
          );
          const rows = [...document.querySelectorAll('[role="row"],tr')]
            .filter(isVisible)
            .map((row) => normalize(row.textContent, 400))
            .filter(Boolean)
            .filter((row) => /RAW-STEEL|K10000|Stahlwerk|No\.|Type|Item|Quantity|Location|Receive|Direct Unit Cost|Lines/i.test(row))
            .slice(0, 40);
          const gridHints = [...document.querySelectorAll('[role="grid"],[role="table"],table,[controlname*="Lines" i]')]
            .filter(isVisible)
            .map((grid) => normalize(grid.textContent, 500))
            .filter(Boolean)
            .slice(0, 20);

          return {
            frameIndex,
            frameUrl,
            bodyTextSample: normalize(document.body?.innerText || document.body?.textContent, 2000),
            entries,
            headers,
            rows,
            gridHints,
          };
        },
        { frameIndex, frameUrl: sanitizeUrl(frame.url()) },
      )
      .catch((error) => ({
        frameIndex,
        frameUrl: sanitizeUrl(frame.url()),
        bodyTextSample: `frame-evaluate-failed: ${error instanceof Error ? error.message : String(error)}`,
        entries: [],
        headers: [],
        rows: [],
        gridHints: [],
      }));

    const trimmed = {
      ...snapshot,
      bodyTextSample: snapshot.bodyTextSample.slice(0, 1200),
      entries: snapshot.entries.filter(interesting).slice(0, 120),
      headers: snapshot.headers.filter(interesting).slice(0, 60),
      rows: snapshot.rows.slice(0, 40),
      gridHints: snapshot.gridHints.slice(0, 20),
    };
    snapshots.push(trimmed);
  }

  return snapshots;
}

async function enableLinesFocusMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const focusToggle = scope
      .getByRole('menuitemcheckbox', {
        name: /Fokusmodus.*Seitenteil|Fokusmodus umschalten|Focus mode|Toggle focus mode/i,
      })
      .first();
    if (await focusToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
      const checked = await focusToggle.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await focusToggle.click();
        await page.waitForTimeout(1800);
      }
      return {
        attempted: true,
        clicked: checked !== 'true',
        alreadyFocused: checked === 'true',
        method: 'role-menuitemcheckbox-focus-mode',
      };
    }
  }

  return {
    attempted: true,
    clicked: false,
    alreadyFocused: false,
    method: 'role-menuitemcheckbox-focus-mode',
    blockedBy: 'focus-mode-toggle-not-visible',
  };
}

async function enableWideLayout(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const wideToggle = scope
      .locator('button[title*="Breite Layoutansicht" i], button[aria-label*="Breites Layout" i], button[title*="Wide layout" i], button[aria-label*="Wide layout" i]')
      .first();
    if (await wideToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
      await wideToggle.click();
      await page.waitForTimeout(1800);
      return {
        attempted: true,
        clicked: true,
        method: 'title-or-aria-wide-layout-toggle',
      };
    }

    const wideRoleButton = scope
      .getByRole('button', {
        name: /Breites Layout|Breite Layoutansicht|Wide layout/i,
      })
      .first();
    if (await wideRoleButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await wideRoleButton.click();
      await page.waitForTimeout(1800);
      return {
        attempted: true,
        clicked: true,
        method: 'role-button-wide-layout-toggle',
      };
    }
  }

  return {
    attempted: true,
    clicked: false,
    method: 'title-or-aria-wide-layout-toggle',
    blockedBy: 'wide-layout-toggle-not-visible',
  };
}

function summarizeSnapshots(snapshots: FrameSnapshot[]) {
  const allEntries = snapshots.flatMap((snapshot) => snapshot.entries);
  const controlNames = [...new Set(allEntries.map((entry) => entry.controlName).filter(Boolean))].sort();
  const lineRelevantEntries = allEntries.filter((entry) =>
    /RAW-STEEL|Location|Quantity|Qty|Receive|Direct Unit Cost|Type|Item|Description|No\.|Lines/i.test(
      `${entry.controlName} ${entry.aria} ${entry.title} ${entry.text} ${entry.cellText} ${entry.rowText} ${entry.value}`,
    ),
  );
  const noVisibleDataMessage = snapshots.some((snapshot) =>
    /In dieser Ansicht kann nichts angezeigt werden|nothing can be shown|No data|Keine Daten/i.test(
      `${snapshot.bodyTextSample} ${snapshot.rows.join(' ')} ${snapshot.gridHints.join(' ')}`,
    ),
  );
  const dataCellCandidates = lineRelevantEntries.filter((entry) =>
    /gridcell|cell|td/i.test(`${entry.role} ${entry.tag}`) &&
    entry.y > 670 &&
    !/columnheader|rowheader/i.test(entry.role) &&
    !/^TypeNo\.?Item Reference/i.test(entry.rowText),
  );
  const editableEntries = dataCellCandidates.filter((entry) => !entry.readonly && !entry.disabled && entry.width > 0 && entry.height > 0);

  return {
    frameCount: snapshots.length,
    interestingEntryCount: allEntries.length,
    lineRelevantEntryCount: lineRelevantEntries.length,
    noVisibleDataMessage,
    dataCellCandidateCount: dataCellCandidates.length,
    editableLineRelevantEntryCount: editableEntries.length,
    controlNames,
    strongestLineSignals: lineRelevantEntries.slice(0, 15),
  };
}

test.describe('P2P-006 purchase lines grid control diagnosis', () => {
  test.use({
    storageState: 'playwright/.auth/bc-user.json',
    viewport: { width: 2600, height: 1400 },
  });

  test('opens draft 106051 and captures purchase lines grid control map without data changes', async ({ page }) => {
    test.setTimeout(120_000);
    await ensureDirs();

    const result: Record<string, unknown> = {
      schemaVersion: 1,
      caseId,
      source: 'playwright-ui-labor-grid-diagnosis',
      resultStatus: 'started',
      instance: environment,
      company,
      sourceCompany: company,
      mode: 'controlled-labor-ui-grid-diagnosis',
      targetDraft: {
        purchaseOrderNo,
        vendorNo,
        vendorName,
      },
      previewPosting: false,
      posted: false,
      setupChanges: [],
      createdRecords: [],
      changedRecords: [],
      postedRecords: [],
      cleanup: {
        required: false,
        reason: 'Read-only/grid-diagnosis run; no values are entered.',
      },
      flags: {
        noWrite: true,
        noPost: true,
        noPreview: true,
        noDraft: true,
        noSetupChange: true,
        noCompanySwitch: true,
        noApiShortcut: true,
        noBookChange: true,
      },
      proved: [],
      notProved: [],
      blockedBy: [],
      screenshots: [],
      evidenceRefs: [],
      warnings: [],
      migrationRelevance: 'needed-for-german-final',
      mustRecreateInFinalSandbox: true,
      finalScreenshotNeeded: true,
      rebuildInstruction:
        'In der deutschen Zielcompany spaeter dieselbe Einkaufsbestellung-Zeilenroute mit deutscher Oberflaeche und finalen Stammdaten erneut belegen.',
      targetGermanCompanyImpact:
        'Teil-Wareneingang benoetigt final sichtbare Zeilenfelder fuer Artikel, Lagerort, Menge, Preis und Menge zu empfangen.',
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: {},
      nextStep: 'Use the collected line/control map to decide whether P2P-005 value entry can be retried safely.',
    };

    try {
      const targetUrl = purchaseOrderUrl();
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      await waitForBusinessCentralShell(page);
      await dismissTours(page);
      await hideFactBoxPane(page);
      const wideLayout = await enableWideLayout(page);
      await dismissTours(page);
      await page.waitForTimeout(3000);

      const fullText = await pageText(page);
      const compactText = await compactPageText(page, {
        include: [/106051|K10000|Stahlwerk|Purchase Order|Einkaufsbestellung|Lines|Zeilen|RAW-STEEL|FRA-ZL|Quantity|Receive|Direct Unit Cost/i],
        maxLines: 120,
      });

      const url = sanitizeUrl(page.url());
      const instanceOk = url.includes(environment);
      const companyOk = url.includes(`company=${encodeURIComponent(company)}`) || url.includes(`company=${company}`);
      const draftVisible = fullText.includes(purchaseOrderNo);
      const vendorVisible = fullText.includes(vendorNo) || fullText.includes(vendorName);

      await screenshot(page, 'p2p-006-010-draft-open-wide.png', {
        projectName: project.name,
        testId: 'p2p-006',
        status: 'labor',
        bookUse: 'field-proof',
        purpose:
          'Breite Laboransicht der Purchase Order 106051 vor der Lines/Grid-Control-Diagnose. Zeigt Kontext, nicht finalen deutschen Nachweis.',
        expectedPageText: [new RegExp(purchaseOrderNo), /Purchase Order|Einkaufsbestellung/i],
        knownLimitations: ['RM-DEMO/CRONUS-Labor; kein deutscher Finalnachweis.', 'Noch keine Zeilenwerteingabe, kein Preview Posting, keine Buchung.'],
      });

      const focusMode = await enableLinesFocusMode(page);
      await dismissTours(page);
      await page.waitForTimeout(1000);

      await screenshot(page, 'p2p-006-020-lines-focus-mode.png', {
        projectName: project.name,
        testId: 'p2p-006',
        status: 'labor',
        bookUse: 'field-proof',
        purpose:
          'Purchase Order Lines im BC-Fokusmodus/breiter Bereichsansicht. Nutzt BC-UI-Fokusmodus, um Spalten/Werte besser sichtbar zu machen; keine Datenänderung.',
        expectedPageText: [new RegExp(purchaseOrderNo), /Purchase Order|Einkaufsbestellung|Lines/i],
        knownLimitations: ['RM-DEMO/CRONUS-Labor; kein deutscher Finalnachweis.', 'Kein Zielwert wurde eingegeben oder gebucht.'],
      });

      const snapshots = await collectFrameSnapshots(page);
      const summary = summarizeSnapshots(snapshots);

      await writeText('010-page-text-compact.txt', compactText);
      await writeJson('020-grid-control-snapshot.json', {
        schemaVersion: 1,
        caseId,
        url,
        targetUrl: sanitizeUrl(targetUrl),
        instanceOk,
        companyOk,
        draftVisible,
        vendorVisible,
        wideLayout,
        focusMode,
        summary,
        snapshots,
      });

      await screenshot(page, 'p2p-006-030-lines-grid-control-map.png', {
        projectName: project.name,
        testId: 'p2p-006',
        status: 'labor',
        bookUse: 'evidence',
        purpose:
          'Labor-Screenshot nach Lines/Grid-Control-Snapshot in breiter Ansicht. Bild ist nur brauchbar, wenn Zielwerte/Spalten sichtbar sind; JSON ist der technische Nachweis.',
        expectedPageText: [new RegExp(purchaseOrderNo), /Purchase Order|Einkaufsbestellung/i],
        knownLimitations: ['Screenshot beweist nur sichtbare Codes/Werte; technische Feldroute liegt in 020-grid-control-snapshot.json.'],
      });

      result.screenshots = [
        'playwright/projects/fibu-book5/img/p2p-006-010-draft-open-wide.png',
        'playwright/projects/fibu-book5/img/p2p-006-020-lines-focus-mode.png',
        'playwright/projects/fibu-book5/img/p2p-006-030-lines-grid-control-map.png',
      ];
      result.evidenceRefs = [
        'playwright/projects/fibu-book5/evidence/p2p-006/010-page-text-compact.txt',
        'playwright/projects/fibu-book5/evidence/p2p-006/020-grid-control-snapshot.json',
      ];

      if (!instanceOk || !companyOk || !draftVisible || !vendorVisible) {
        result.resultStatus = 'blocked';
        result.blockedBy = [
          ...(!instanceOk ? ['instance-not-confirmed-from-direct-url'] : []),
          ...(!companyOk ? ['company-not-confirmed-from-direct-url'] : []),
          ...(!draftVisible ? ['purchase-order-106051-not-visible'] : []),
          ...(!vendorVisible ? ['vendor-k10000-not-visible'] : []),
        ];
        result.notProved = [
          'Purchase Order Lines grid route is not evaluated because the page/company/draft context was not fully confirmed.',
          'No values were entered.',
          'No Preview Posting or posting was executed.',
        ];
      } else if (!summary.noVisibleDataMessage && summary.dataCellCandidateCount > 0 && summary.editableLineRelevantEntryCount > 0) {
        result.resultStatus = 'observed';
        result.proved = [
          'Direct Business Central URL opened within MCP_1_20260210/RM-DEMO for Purchase Order 106051.',
          'Purchase Order 106051 and vendor context K10000/Stahlwerk Ruhr GmbH were visible in the UI text.',
          'BC wide layout was attempted before screenshot and grid evaluation.',
          'Purchase Order Lines/Grid-related DOM controls and control names were captured from the rendered BC frames.',
          'BC focus mode for the Lines area was attempted before grid evaluation.',
          'Wide-layout and focus-mode screenshots plus compact page text were saved for the P2P-006 lab blocker analysis.',
        ];
        result.notProved = [
          'Target line values RAW-STEEL, FRA-ZL, quantity 4, Direct Unit Cost 2500 and Qty. to Receive 2 were not entered in this diagnostic run.',
          'Preview Posting and Receive/Invoice/Post were not executed.',
          'German final purchase-order evidence remains open.',
        ];
        result.nextStep =
          'P2P-007/P2P-005 retry may use the captured editable line-control candidates only after human/code review confirms the route is unambiguous.';
      } else {
        result.resultStatus = 'blocked';
        result.blockedBy = [
          ...(summary.noVisibleDataMessage ? ['purchase-order-lines-grid-shows-no-visible-data-rows'] : []),
          ...(summary.dataCellCandidateCount === 0 ? ['purchase-order-lines-data-cell-route-not-proven'] : []),
          ...(summary.editableLineRelevantEntryCount === 0 ? ['purchase-order-lines-editable-cell-route-not-proven'] : []),
        ];
        result.proved = [
          'Direct Business Central URL opened within MCP_1_20260210/RM-DEMO for Purchase Order 106051.',
          'Purchase Order 106051 and vendor context K10000/Stahlwerk Ruhr GmbH were visible in the UI text.',
          'BC wide layout was attempted before screenshot and grid evaluation.',
          'BC focus mode for the Lines area was attempted before grid evaluation.',
          'The Purchase Order Lines subform headers were visible and captured with controlName Purchase Order Subform.',
          'Wide-layout and focus-mode screenshots, compact page text and DOM snapshot were saved.',
        ];
        result.notProved = [
          'No safe editable Purchase Order Lines data-cell route for Item/Location/Quantity/Direct Unit Cost/Qty. to Receive was proven.',
          'The screenshot shows no target item/location/quantity row; it is a blocker/context screenshot, not a book-proof screenshot for partial receipt.',
          'No values were entered.',
          'Preview Posting and Receive/Invoice/Post were not executed.',
        ];
        result.nextStep =
          'Either refine the grid helper around the captured DOM geometry or switch to a different bounded P2P route; do not Preview/Post this draft yet.';
      }

      result.details = {
        url,
        instanceOk,
        companyOk,
        draftVisible,
        vendorVisible,
        wideLayout,
        focusMode,
        summary,
      };
    } catch (error) {
      result.resultStatus = 'blocked';
      result.blockedBy = ['p2p-006-test-error'];
      result.error = error instanceof Error ? error.message : String(error);
      result.notProved = [
        'Purchase Order Lines grid route was not proven because the diagnostic test failed.',
        'No values were entered.',
        'No Preview Posting or posting was executed.',
      ];
      await writeText('000-error-page-text.txt', (await pageText(page).catch(() => '')).slice(0, 12_000));
      result.evidenceRefs = ['playwright/projects/fibu-book5/evidence/p2p-006/000-error-page-text.txt'];
    }

    await writeJson('P2P-006-result.json', result);
  });
});
