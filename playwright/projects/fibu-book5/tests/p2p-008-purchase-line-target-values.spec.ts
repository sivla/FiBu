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

const caseId = 'P2P-008-PURCHASE-LINE-TARGET-VALUES';
const environment = process.env.BC_ENVIRONMENT ?? 'MCP_1_20260210';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const purchaseOrderNo = process.env.P2P008_PURCHASE_ORDER_NO ?? '106051';
const targetItem = 'RAW-STEEL';
const evidenceDir = path.join(process.cwd(), 'playwright/projects/fibu-book5/evidence/p2p-008');

type EditAttempt = {
  field: string;
  value: string;
  status: 'success' | 'observed' | 'blocked';
  details: string[];
};

async function ensureDirs() {
  await fs.mkdir(evidenceDir, { recursive: true });
}

async function writeJson(fileName: string, data: unknown) {
  await fs.writeFile(path.join(evidenceDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, data: string) {
  await fs.writeFile(path.join(evidenceDir, fileName), data, 'utf8');
}

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

async function clickIfVisible(page: Page, selector: string) {
  for (const scope of [page, ...page.frames()]) {
    const button = scope.locator(selector).first();
    if (await button.isVisible({ timeout: 800 }).catch(() => false)) {
      await button.click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      return true;
    }
  }
  return false;
}

async function enableWideLayout(page: Page) {
  return clickIfVisible(
    page,
    'button[title*="Breite Layoutansicht" i], button[aria-label*="Breites Layout" i], button[title*="Wide layout" i], button[aria-label*="Wide layout" i]',
  );
}

async function enableLinesFocusMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const button = scope.getByRole('menuitemcheckbox', { name: /Fokusmodus.*Seitenteil|Fokusmodus umschalten|Focus mode|Toggle focus mode/i }).first();
    if (await button.isVisible({ timeout: 800 }).catch(() => false)) {
      const checked = await button.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await button.click({ timeout: 3000 });
        await page.waitForTimeout(1000);
      }
      return true;
    }
  }
  return false;
}

async function enableEditMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const button = scope.locator('button[title*="Bearbeiten" i], button[aria-label*="Bearbeiten" i], button[title*="Edit" i], button[aria-label*="Edit" i]').first();
    if (await button.isVisible({ timeout: 800 }).catch(() => false)) {
      await button.click({ timeout: 3000 });
      await page.waitForTimeout(1200);
      return true;
    }
  }
  return false;
}

async function gridGeometry(page: Page) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const frameBox = await frame.frameElement().then((handle) => handle.boundingBox()).catch(() => ({ x: 0, y: 0 }));
    const frameData = await frame.evaluate(
      ({ itemNo, frameIndex }) => {
        const normalize = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const html = element as HTMLElement;
          const rect = html.getBoundingClientRect();
          const style = window.getComputedStyle(html);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const headers = [...document.querySelectorAll('th,[role="columnheader"],a[title^="Sortieren nach"],a[title^="Sort by"]')]
          .filter(visible)
          .map((element) => {
            const html = element as HTMLElement;
            const rect = html.getBoundingClientRect();
            return {
              text: normalize(html.innerText || html.textContent || html.getAttribute('title')),
              aria: normalize(html.getAttribute('aria-label')),
              title: normalize(html.getAttribute('title')),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          });
        const rows = [...document.querySelectorAll('[role="row"],tr')]
          .filter(visible)
          .map((element) => {
            const html = element as HTMLElement;
            const rect = html.getBoundingClientRect();
            return {
              text: normalize(html.innerText || html.textContent),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          });
        const rawRow = rows.find((row) => row.text.includes(itemNo));
        return { frameIndex, headers, rows: rows.slice(0, 40), rawRow };
      },
      { itemNo: targetItem, frameIndex },
    ).catch((error) => ({
      frameIndex,
      headers: [],
      rows: [{ text: `frame-evaluate-failed: ${error instanceof Error ? error.message : String(error)}`, x: 0, y: 0, width: 0, height: 0 }],
      rawRow: undefined,
    }));
    const offset = { x: Math.round(frameBox?.x ?? 0), y: Math.round(frameBox?.y ?? 0) };
    const withOffset = {
      ...frameData,
      frameOffset: offset,
      headers: frameData.headers.map((entry) => ({ ...entry, x: entry.x + offset.x, y: entry.y + offset.y })),
      rows: frameData.rows.map((entry) => ({ ...entry, x: entry.x + offset.x, y: entry.y + offset.y })),
      rawRow: frameData.rawRow ? { ...frameData.rawRow, x: frameData.rawRow.x + offset.x, y: frameData.rawRow.y + offset.y } : undefined,
    };
    frames.push(withOffset);
  }
  const match = frames.find((frame) => frame.rawRow && frame.headers.length > 0) ?? frames.find((frame) => frame.rawRow) ?? frames[0] ?? { headers: [], rows: [] };
  return { ...match, frames };
}

function findHeader(geometry: Awaited<ReturnType<typeof gridGeometry>>, label: RegExp) {
  return geometry.headers.find((header) => label.test(`${header.text} ${header.aria} ${header.title}`));
}

async function editGridCell(page: Page, field: string, headerPattern: RegExp, value: string): Promise<EditAttempt> {
  const attempt: EditAttempt = { field, value, status: 'blocked', details: [] };
  const geometry = await gridGeometry(page);
  const header = findHeader(geometry, headerPattern);
  if (!geometry.rawRow || !header) {
    attempt.details.push(`missing geometry rawRow=${Boolean(geometry.rawRow)} header=${Boolean(header)}`);
    return attempt;
  }
  const x = header.x + Math.max(8, Math.floor(header.width / 2));
  const y = geometry.rawRow.y + Math.max(8, Math.floor(geometry.rawRow.height / 2));
  attempt.details.push(`click x=${x} y=${y} header=${header.text || header.title} row=${geometry.rawRow.text.slice(0, 180)}`);

  await page.mouse.dblclick(x, y);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(300);
  await page.keyboard.press('F2').catch(() => undefined);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.press('Backspace').catch(() => undefined);
  await page.keyboard.type(value);
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(900);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1500);

  const afterGeometry = await gridGeometry(page);
  const afterRowText = afterGeometry.rawRow?.text ?? await pageText(page);
  const visibleAfter = (() => {
    if (field === 'Location Code') return /FRA-ZL/i.test(afterRowText);
    if (field === 'Quantity') return /\b4,00\b|\b4\b(?!\.)/.test(afterRowText);
    if (field === 'Direct Unit Cost Excl. Tax') return /2\.500,00|2500/i.test(afterRowText);
    if (field === 'Qty. to Receive') return /\b2,00\b/.test(afterRowText);
    return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(afterRowText);
  })();
  attempt.status = visibleAfter ? 'success' : 'observed';
  attempt.details.push(`value-visible-after-edit=${attempt.status === 'success'}`);
  attempt.details.push(`row-after=${afterRowText.slice(0, 220)}`);
  return attempt;
}

test.describe('P2P-008 purchase line target values', () => {
  test.use({
    storageState: 'playwright/.auth/bc-user.json',
    viewport: { width: 2600, height: 1400 },
  });

  test('sets or verifies visible target values on the RAW-STEEL purchase line without preview or posting', async ({ page }) => {
    test.setTimeout(180_000);
    await ensureDirs();
    const result: Record<string, unknown> = {
      schemaVersion: 1,
      caseId,
      source: 'playwright-ui-labor-line-value-entry',
      resultStatus: 'started',
      instance: environment,
      company,
      sourceCompany: company,
      purchaseOrderNo,
      targetLine: {
        itemNo: targetItem,
        locationCode: 'FRA-ZL',
        quantity: '4',
        directUnitCostExclTax: '2500',
        qtyToReceive: '2',
      },
      previewPosting: false,
      posted: false,
      setupChanges: [],
      createdRecords: [],
      changedRecords: [],
      postedRecords: [],
      flags: {
        noPost: true,
        noPreview: true,
        noSetupChange: true,
        noCompanySwitch: true,
        noApiShortcut: true,
        noBookChange: true,
      },
      migrationRelevance: 'needed-for-german-final',
      mustRecreateInFinalSandbox: true,
      finalScreenshotNeeded: true,
      rebuildInstruction: 'Recreate the RAW-STEEL purchase line value entry in a later German target company with German UI and final setup.',
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: {},
    };

    await page.goto(purchaseOrderUrl(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await hideFactBoxPane(page);
    const wideLayout = await enableWideLayout(page);
    const focusMode = await enableLinesFocusMode(page);
    const editMode = await enableEditMode(page);
    await screenshot(page, 'p2p-008-010-before-value-entry.png', {
      projectName: project.name,
      testId: 'p2p-008',
      status: 'labor',
      bookUse: 'evidence',
      purpose: 'P2P-008 before value entry: RAW-STEEL purchase line should be visible from P2P-007.',
      expectedPageText: [new RegExp(purchaseOrderNo), /RAW-STEEL|Purchase Order|Lines/i],
      knownLimitations: ['RM-DEMO laboratory only; no German final proof.'],
    });

    const beforeText = await pageText(page);
    const contextOk = sanitizeUrl(page.url()).includes(environment) && sanitizeUrl(page.url()).includes(`company=${company}`) && beforeText.includes(purchaseOrderNo);
    const rawLineVisible = beforeText.includes(targetItem);
    await writeJson('010-before-grid-geometry.json', await gridGeometry(page));
    await writeText('011-before-page-text-compact.txt', await compactPageText(page, {
      include: [/106051|K10000|Stahlwerk|RAW-STEEL|FRA-ZL|ATLANTA|Quantity|Location|Qty\. to Receive|Direct Unit Cost|Line Amount/i],
      maxLines: 180,
    }));

    if (!contextOk || !rawLineVisible) {
      result.resultStatus = 'blocked';
      result.blockedBy = [contextOk ? 'raw-steel-line-not-visible' : 'wrong-or-unclear-instance-company-or-draft-context'];
      result.proved = [];
      result.notProved = ['Target value entry was not attempted because the context or RAW-STEEL line was not visible.'];
    } else {
      const attempts: EditAttempt[] = [];
      attempts.push(await editGridCell(page, 'Location Code', /Location Code/i, 'FRA-ZL'));
      attempts.push(await editGridCell(page, 'Quantity', /^Quantity(?! Received| Invoiced)|Sortieren nach 'Quantity'/i, '4'));
      attempts.push(await editGridCell(page, 'Direct Unit Cost Excl. Tax', /Direct Unit Cost Excl\. Tax/i, '2500'));
      attempts.push(await editGridCell(page, 'Qty. to Receive', /Qty\. to Receive/i, '2'));

      await screenshot(page, 'p2p-008-020-after-value-entry.png', {
        projectName: project.name,
        testId: 'p2p-008',
        status: 'labor',
        bookUse: 'evidence',
        purpose: 'P2P-008 after value entry attempts for Location FRA-ZL, Quantity 4, Direct Unit Cost 2500 and Qty. to Receive 2.',
        expectedPageText: [/RAW-STEEL|FRA-ZL|2\.500|2500|Qty\. to Receive|Quantity/i],
        knownLimitations: ['No Preview Posting or posting was executed.'],
      });
      await writeJson('020-after-grid-geometry.json', await gridGeometry(page));
      await writeText('021-after-page-text-compact.txt', await compactPageText(page, {
        include: [/106051|K10000|Stahlwerk|RAW-STEEL|FRA-ZL|ATLANTA|Quantity|Location|Qty\. to Receive|Direct Unit Cost|Line Amount|2\.500|2500/i],
        maxLines: 180,
      }));

      const afterGeometry = await gridGeometry(page);
      const afterText = await pageText(page);
      const afterRowText = afterGeometry.rawRow?.text ?? '';
      const locationOk = /FRA-ZL/i.test(afterRowText);
      const unitCostOk = /2\.500,00|2500/i.test(afterRowText);
      const quantityOk = /\b4(?:,00)?\b/.test(afterRowText);
      const qtyToReceiveOk = /\b2,00\b/.test(afterRowText);
      const lineStillVisible = afterText.includes(targetItem);
      result.details = { url: sanitizeUrl(page.url()), wideLayout, focusMode, editMode, attempts, afterRowText, locationOk, quantityOk, unitCostOk, qtyToReceiveOk, lineStillVisible };
      result.screenshots = [
        'playwright/projects/fibu-book5/img/p2p-008-010-before-value-entry.png',
        'playwright/projects/fibu-book5/img/p2p-008-020-after-value-entry.png',
      ];
      result.evidenceRefs = [
        'playwright/projects/fibu-book5/evidence/p2p-008/010-before-grid-geometry.json',
        'playwright/projects/fibu-book5/evidence/p2p-008/011-before-page-text-compact.txt',
        'playwright/projects/fibu-book5/evidence/p2p-008/020-after-grid-geometry.json',
        'playwright/projects/fibu-book5/evidence/p2p-008/021-after-page-text-compact.txt',
      ];
      const successfulEdits = attempts.filter((attempt) => attempt.status === 'success').map((attempt) => attempt.field);
      result.resultStatus = lineStillVisible && quantityOk && qtyToReceiveOk ? 'observed' : 'blocked';
      result.proved = [
        'Purchase Order 106051 remained in MCP_1_20260210/RM-DEMO.',
        'RAW-STEEL purchase line was visible for value-entry attempts.',
        'No Preview Posting or posting was executed.',
      ];
      result.notProved = [
        'Full final German P2P proof remains open.',
        'Only values visible in the page text/screenshot are treated as laboratory evidence.',
      ];
      result.blockedBy = result.resultStatus === 'blocked' ? ['target-values-not-visibly-confirmed-after-ui-entry'] : [];
      result.successfulEdits = successfulEdits;
      result.nextStep = result.resultStatus === 'observed'
        ? 'Run a gated Preview Posting probe for PO 106051 only if case unlocks Preview Posting.'
        : 'Improve BC grid cell editing helper before Preview Posting.';
    }

    await writeJson('P2P-008-result.json', result);
  });
});
