import { test, expect, type FrameLocator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { requireBcUrl } from '../../../core/bc-helpers';
import { project } from '../project';

type ControlInfo = {
  index: number;
  tag: string;
  type: string;
  role: string;
  aria: string;
  title: string;
  controlName: string;
  value: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type HeaderInfo = {
  index: number;
  text: string;
  aria: string;
  title: string;
  role: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type BcScope = Page | FrameLocator;

const caseId = 'P2P-005-PARTIAL-RECEIPT-LINE-QTY-GATE';
const envName = process.env.BC_ENVIRONMENT ?? 'MCP_1_20260210';
const companyName = process.env.BC_COMPANY ?? 'RM-DEMO';
const purchaseOrderNo = process.env.P2P005_PURCHASE_ORDER_NO ?? '106002';

const target = {
  vendor: 'K10000',
  item: 'RAW-STEEL',
  location: 'FRA-ZL',
  quantity: '4',
  directUnitCost: '2500',
  qtyToReceive: '2',
};

const evidenceDir = path.join(process.cwd(), 'playwright/projects/fibu-book5/evidence/p2p-005');
const imgDir = path.join(process.cwd(), 'playwright/projects/fibu-book5/img');

function bcPageUrl(pageId: string, filter?: string): string {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', pageId);
  if (filter) url.searchParams.set('filter', filter);
  return url.toString();
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.mkdir(imgDir, { recursive: true });
}

async function writeJson(fileName: string, data: unknown): Promise<void> {
  await fs.writeFile(path.join(evidenceDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, data: string): Promise<void> {
  await fs.writeFile(path.join(evidenceDir, fileName), data, 'utf8');
}

async function dismissSafeOverlays(page: Page): Promise<void> {
  const safeButtons = [
    /Got it/i,
    /OK/i,
    /Close/i,
    /Not now/i,
    /Maybe later/i,
    /Skip/i,
    /Weiter/i,
    /Schließen/i,
    /Nicht jetzt/i,
    /Überspringen/i,
  ];
  for (const pattern of safeButtons) {
    const button = page.getByRole('button', { name: pattern }).first();
    if (await button.isVisible({ timeout: 1200 }).catch(() => false)) {
      await button.click();
      await page.waitForTimeout(350);
    }
  }
}

async function findBusinessFrame(page: Page, pattern: RegExp): Promise<BcScope> {
  await page.waitForLoadState('domcontentloaded');
  const deadline = Date.now() + 45_000;
  let lastBodyText = '';

  while (Date.now() < deadline) {
    await page.waitForTimeout(1000);
    await dismissSafeOverlays(page);

    const frames = page.frames();
    for (let index = 1; index < frames.length; index += 1) {
      const text = await frames[index].locator('body').innerText({ timeout: 1500 }).catch(() => '');
      if (pattern.test(text)) {
        return page.frameLocator(`iframe >> nth=${index - 1}`);
      }
    }

    lastBodyText = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
    if (pattern.test(lastBodyText)) {
      return page;
    }
  }
  throw new Error(`Business Central frame not found for ${pattern}. Last body text: ${lastBodyText.slice(0, 500)}`);
}

async function visibleControls(frame: BcScope): Promise<ControlInfo[]> {
  return frame.locator('input, textarea, select, [contenteditable="true"]').evaluateAll((nodes) =>
    nodes
      .map((node, index) => {
        const el = node as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const value = 'value' in el ? String(el.value ?? '') : String(el.textContent ?? '');
        return {
          index,
          tag: el.tagName.toLowerCase(),
          type: (el as HTMLInputElement).type ?? '',
          role: el.getAttribute('role') ?? '',
          aria: el.getAttribute('aria-label') ?? '',
          title: el.getAttribute('title') ?? '',
          controlName: el.closest('[controlname]')?.getAttribute('controlname') ?? '',
          value,
          text: String(el.textContent ?? '').trim().slice(0, 120),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible:
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none',
        };
      })
      .filter((item) => item.visible)
      .map(({ visible, ...item }) => item),
  );
}

async function visibleHeaders(frame: BcScope): Promise<HeaderInfo[]> {
  const labels = [
    /Item No\.?/i,
    /No\./i,
    /Location Code/i,
    /Quantity(?! Received| Invoiced)/i,
    /Direct Unit Cost/i,
    /Qty\. to Receive/i,
  ];

  return frame.locator('button, [role="button"], th, div, span').evaluateAll((nodes, sources) => {
    const patterns = (sources as string[]).map((source) => new RegExp(source, 'i'));
    return nodes
      .map((node, index) => {
        const el = node as HTMLElement;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const text = String(el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 140);
        const aria = el.getAttribute('aria-label') ?? '';
        const title = el.getAttribute('title') ?? '';
        const name = `${text} ${aria} ${title}`.trim();
        return {
          index,
          text,
          aria,
          title,
          role: el.getAttribute('role') ?? '',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible:
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            patterns.some((pattern) => pattern.test(name)),
        };
      })
      .filter((item) => item.visible)
      .map(({ visible, ...item }) => item);
  }, labels.map((regex) => regex.source));
}

function pickLineControlByHeader(
  controls: ControlInfo[],
  headers: HeaderInfo[],
  headerPattern: RegExp,
  fallbackBand: { minX: number; maxX: number },
): ControlInfo | undefined {
  const rowControls = controls
    .filter((control) => control.y >= 560 && control.y <= 760 && control.height >= 16)
    .sort((a, b) => a.x - b.x || a.y - b.y);

  const byControlName = rowControls.find((control) => headerPattern.test(control.controlName));
  if (byControlName) return byControlName;

  const matchingHeaders = headers
    .filter((header) => headerPattern.test(`${header.text} ${header.aria} ${header.title}`))
    .filter((header) => header.y < 600)
    .sort((a, b) => b.y - a.y);

  for (const header of matchingHeaders) {
    const headerCenter = header.x + header.width / 2;
    const candidate = rowControls.find((control) => {
      const center = control.x + control.width / 2;
      return Math.abs(center - headerCenter) <= 95 && control.y > header.y;
    });
    if (candidate) return candidate;
  }

  return rowControls.find((control) => control.x >= fallbackBand.minX && control.x <= fallbackBand.maxX);
}

async function fillControl(page: Page, frame: BcScope, control: ControlInfo, value: string): Promise<void> {
  const locator = frame.locator('input, textarea, select, [contenteditable="true"]').nth(control.index);
  await locator.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => undefined);
  await locator.fill(value);
  await locator.press('Tab').catch(() => undefined);
  await page.waitForTimeout(900);
}

async function clickAction(page: Page, label: RegExp): Promise<boolean> {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 1200 }).catch(() => false)) {
        if (await action.click({ timeout: 6000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(2500);
          return true;
        }
      }
    }
  }
  return false;
}

function extractPurchaseOrderNo(text: string): string {
  return (
    text.match(/\b(PO\d{3,}|P-ORD\d{3,}|106\d{3}|107\d{3}|108\d{3})\b/i)?.[1] ??
    text.match(/No\.\s+(\d{5,})/i)?.[1] ??
    ''
  );
}

function pickVendorControl(controls: ControlInfo[]): ControlInfo | undefined {
  const labeled = controls.find((control) =>
    /Buy-from Vendor No\.?|Buy-from Vendor|Vendor No\.?|Vendor Name|Kreditor|Eink\. von Kred\./i.test(
      `${control.aria} ${control.title} ${control.text}`,
    ),
  );
  if (labeled) return labeled;

  return controls
    .filter((control) => control.y >= 260 && control.y <= 430 && control.x >= 420 && control.x <= 980)
    .sort((a, b) => a.y - b.y || a.x - b.x)[0];
}

async function pageText(frame: BcScope): Promise<string> {
  return frame.locator('body').innerText({ timeout: 5000 });
}

async function openPurchaseOrderDraft(page: Page): Promise<BcScope> {
  const filter = `'Purchase Header'.'No.' IS '${purchaseOrderNo}'`;
  await page.goto(bcPageUrl('50', filter), { waitUntil: 'domcontentloaded' });
  return findBusinessFrame(page, new RegExp(`${purchaseOrderNo}|K10000|Purchase Order|Einkaufsbestellung`, 'i'));
}

async function createFreshDraft(page: Page): Promise<{ frame: BcScope; orderNo: string; text: string; vendorFill: string }> {
  await page.goto(bcPageUrl('9307'), { waitUntil: 'domcontentloaded' });
  await findBusinessFrame(page, /Purchase Orders|Einkaufsbestellungen|No\.|Vendor|Kreditor/i);
  const clickedNew = await clickAction(page, /^New$|^Neu$/i);
  if (!clickedNew) throw new Error('Fresh fallback draft could not click New on Purchase Orders list.');

  const frame = await findBusinessFrame(page, /Purchase Order|Einkaufsbestellung|Buy-from|Vendor|Kreditor/i);
  const controls = await visibleControls(frame);
  const vendorControl = pickVendorControl(controls);
  if (!vendorControl) throw new Error('Fresh fallback draft could not identify vendor control.');

  await fillControl(page, frame, vendorControl, target.vendor);
  await page.waitForTimeout(4000);
  await page.keyboard.press('Control+S').catch(() => undefined);
  await page.waitForTimeout(1000);
  const text = await pageText(frame);
  const orderNo = extractPurchaseOrderNo(text);
  return { frame, orderNo, text, vendorFill: `${vendorControl.x}/${vendorControl.y}` };
}

test.describe('P2P-005 partial receipt line quantity gate', () => {
  test.use({ storageState: 'playwright/.auth/bc-user.json' });

  test('fills controlled purchase order line values read/write-lab without posting', async ({ page }) => {
    test.setTimeout(120_000);
    await ensureDirs();

    const result: Record<string, unknown> = {
      schemaVersion: 1,
      caseId,
      source: 'playwright-ui-labor',
      resultStatus: 'started',
      environment: envName,
      company: companyName,
      sourceCompany: companyName,
      targetPurchaseOrderNo: purchaseOrderNo,
      targetValues: target,
      migrationRelevance: 'needed-for-german-final',
      mustRecreateInFinalSandbox: true,
      finalScreenshotNeeded: true,
      flags: {
        noPost: true,
        noPreview: true,
        noDraftCreated: true,
        noSetupChange: true,
        noCompanySwitch: true,
        noApiShortcut: true,
        noBookChange: true,
      },
      proved: [],
      notProved: [],
      blockedBy: [],
      changedRecords: [],
      evidenceRefs: [],
      requiresReview: true,
      safeToFinalizeState: false,
    };

    let frame: BcScope;
    try {
      frame = await openPurchaseOrderDraft(page);
    } catch (error) {
      const blockerShot = path.join(imgDir, 'p2p-005-000-frame-blocker.png');
      await page.screenshot({ path: blockerShot, fullPage: true });
      const blockerText = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
      await writeText('000-frame-blocker-page-text.txt', blockerText.slice(0, 12_000));
      result.resultStatus = 'blocked';
      result.blockedBy = ['business-central-frame-or-draft-not-visible-after-timeout'];
      result.notProved = [
        'Draft 106002 could not be opened to the expected Purchase Order UI context in this run.',
        'No line values were changed.',
        'No Preview Posting or posting was executed.',
      ];
      result.error = error instanceof Error ? error.message : String(error);
      result.evidenceRefs = ['000-frame-blocker-page-text.txt', blockerShot];
      await writeJson('P2P-005-result.json', result);
      return;
    }

    const currentUrl = page.url();
    if (!currentUrl.includes(envName) || !currentUrl.includes(companyName)) {
      result.resultStatus = 'blocked';
      result.blockedBy = ['wrong-or-unclear-instance-company-url'];
      result.notProved = ['Instance or company URL context was not safe enough for P2P-005.'];
      result.currentUrl = currentUrl;
      await writeJson('P2P-005-result.json', result);
      return;
    }

    let workingOrderNo = purchaseOrderNo;
    let beforeText = await pageText(frame);
    await writeText('010-draft-open-page-text.txt', beforeText.slice(0, 12_000));
    await writeJson('010-draft-open-controls.json', await visibleControls(frame));
    await writeJson('011-draft-open-headers.json', await visibleHeaders(frame));
    const openShot = path.join(imgDir, 'p2p-005-010-draft-open.png');
    await page.screenshot({ path: openShot, fullPage: true });

    const existingDraftReusable =
      beforeText.includes(purchaseOrderNo) &&
      !/1964-S|TOKYO Guest Chair|TOKYO Gästestuhl/i.test(beforeText) &&
      (/K10000|First Up Consultants/i.test(beforeText) || beforeText.includes(target.vendor));

    if (!existingDraftReusable) {
      result.reuseDecision = {
        reused: false,
        reason:
          'Existing draft 106002 was visible but not a safe blank P2P-005 line base; fallback created a controlled fresh UI draft in the same instance/company.',
      };
      const fresh = await createFreshDraft(page);
      frame = fresh.frame;
      workingOrderNo = fresh.orderNo;
      beforeText = fresh.text;
      (result.flags as Record<string, unknown>).noDraftCreated = false;
      await writeText('015-fresh-draft-after-vendor-page-text.txt', beforeText.slice(0, 12_000));
      await writeJson('015-fresh-draft-after-vendor-controls.json', await visibleControls(frame));
      const freshShot = path.join(imgDir, 'p2p-005-015-fresh-draft-after-vendor.png');
      await page.screenshot({ path: freshShot, fullPage: true });
      result.evidenceRefs = ['010-draft-open-page-text.txt', '010-draft-open-controls.json', openShot, '015-fresh-draft-after-vendor-page-text.txt', '015-fresh-draft-after-vendor-controls.json', freshShot];
      if (!workingOrderNo || !/K10000|First Up Consultants/i.test(beforeText)) {
        result.resultStatus = 'blocked';
        result.blockedBy = ['fresh-draft-created-but-vendor-or-document-no-not-confirmed'];
        result.notProved = ['Fallback draft could not be confirmed as safe P2P-005 line-entry base.'];
        await writeJson('P2P-005-result.json', result);
        return;
      }
    } else {
      result.reuseDecision = {
        reused: true,
        reason: 'Existing draft 106002 looked safe for P2P-005 line entry.',
      };
    }

    let controls = await visibleControls(frame);
    let headers = await visibleHeaders(frame);
    const fieldPlan = {
      itemNo: pickLineControlByHeader(controls, headers, /Item No\.?|No\./i, { minX: 520, maxX: 640 }),
      location: pickLineControlByHeader(controls, headers, /Location Code/i, { minX: 820, maxX: 930 }),
      quantity: pickLineControlByHeader(controls, headers, /^Quantity(?! Received| Invoiced)/i, {
        minX: 1020,
        maxX: 1140,
      }),
      directUnitCost: pickLineControlByHeader(controls, headers, /Direct Unit Cost/i, { minX: 1150, maxX: 1270 }),
      qtyToReceive: pickLineControlByHeader(controls, headers, /Qty\. to Receive/i, { minX: 1680, maxX: 1780 }),
    };
    await writeJson('020-line-field-plan.json', fieldPlan);

    const missing = Object.entries(fieldPlan)
      .filter(([, control]) => !control)
      .map(([name]) => name);
    if (missing.length > 0) {
      result.resultStatus = 'blocked';
      result.blockedBy = [`line-field-controls-not-confident:${missing.join(',')}`];
      result.notProved = ['BC line controls could not be mapped safely enough for controlled draft update.'];
      result.evidenceRefs = [
        '010-draft-open-controls.json',
        '011-draft-open-headers.json',
        '020-line-field-plan.json',
        openShot,
      ];
      await writeJson('P2P-005-result.json', result);
      return;
    }

    try {
      await fillControl(page, frame, fieldPlan.itemNo!, target.item);
      controls = await visibleControls(frame);
      headers = await visibleHeaders(frame);
      await fillControl(page, frame, pickLineControlByHeader(controls, headers, /Location Code/i, { minX: 820, maxX: 930 })!, target.location);
      controls = await visibleControls(frame);
      headers = await visibleHeaders(frame);
      await fillControl(page, frame, pickLineControlByHeader(controls, headers, /^Quantity(?! Received| Invoiced)/i, { minX: 1020, maxX: 1140 })!, target.quantity);
      controls = await visibleControls(frame);
      headers = await visibleHeaders(frame);
      await fillControl(page, frame, pickLineControlByHeader(controls, headers, /Direct Unit Cost/i, { minX: 1150, maxX: 1270 })!, target.directUnitCost);
      controls = await visibleControls(frame);
      headers = await visibleHeaders(frame);
      await fillControl(page, frame, pickLineControlByHeader(controls, headers, /Qty\. to Receive/i, { minX: 1680, maxX: 1780 })!, target.qtyToReceive);
      await page.keyboard.press('Control+S').catch(() => undefined);
      await page.waitForTimeout(1500);
    } catch (error) {
      const blockerText = await pageText(frame).catch(() => '');
      const blockerControls = await visibleControls(frame).catch(() => []);
      const blockerShot = path.join(imgDir, 'p2p-005-025-line-entry-blocker.png');
      await page.screenshot({ path: blockerShot, fullPage: true });
      await writeText('025-line-entry-blocker-page-text.txt', blockerText.slice(0, 12_000));
      await writeJson('025-line-entry-blocker-controls.json', blockerControls);
      result.resultStatus = 'blocked';
      result.actualPurchaseOrderNo = workingOrderNo;
      result.blockedBy = ['line-entry-control-fill-blocked-or-ambiguous'];
      result.notProved = [
        'P2P-005 did not safely complete RAW-STEEL quantity/partial-receipt line entry.',
        'No Preview Posting was executed.',
        'No posting was executed.',
      ];
      result.error = error instanceof Error ? error.message : String(error);
      result.evidenceRefs = [
        ...(Array.isArray(result.evidenceRefs) ? result.evidenceRefs : []),
        '020-line-field-plan.json',
        '025-line-entry-blocker-page-text.txt',
        '025-line-entry-blocker-controls.json',
        blockerShot,
      ];
      await writeJson('P2P-005-result.json', result);
      return;
    }

    const afterText = await pageText(frame);
    const afterControls = await visibleControls(frame);
    const afterShot = path.join(imgDir, 'p2p-005-020-line-values.png');
    await page.screenshot({ path: afterShot, fullPage: true });
    await writeText('030-line-values-page-text.txt', afterText.slice(0, 16_000));
    await writeJson('030-line-values-controls.json', afterControls);

    const visibleTargetEvidence = {
      orderNo: Boolean(workingOrderNo && afterText.includes(workingOrderNo)),
      vendor: afterText.includes(target.vendor),
      item: afterText.includes(target.item) || afterControls.some((control) => control.value.includes(target.item)),
      location:
        afterText.includes(target.location) || afterControls.some((control) => control.value.includes(target.location)),
      quantity: afterControls.some((control) => control.value === target.quantity),
      directUnitCost: afterControls.some((control) => /2[.,]?500|2500/.test(control.value)),
      qtyToReceive: afterControls.some((control) => control.value === target.qtyToReceive),
    };

    const allTargetsVisible = Object.values(visibleTargetEvidence).every(Boolean);
    result.actualPurchaseOrderNo = workingOrderNo;
    result.resultStatus = allTargetsVisible ? 'observed' : 'blocked';
    result.proved = allTargetsVisible
      ? [
          workingOrderNo === purchaseOrderNo
            ? 'Existing RM-DEMO purchase order draft 106002 was reused.'
            : `Fresh RM-DEMO purchase order draft ${workingOrderNo} was created because 106002 was not a safe blank line base.`,
          'P2P line-entry target values were entered through the Business Central UI.',
          'Partial receipt quantity gate Qty. to Receive = 2 for total quantity 4 is visible/control-evidenced.',
        ]
      : ['Existing RM-DEMO purchase order draft 106002 was opened and line update was attempted via UI.'];
    result.notProved = [
      'No Preview Posting was executed in P2P-005.',
      'No purchase receipt or invoice was posted in P2P-005.',
      'No German final evidence is claimed from RM-DEMO laboratory evidence.',
    ];
    result.blockedBy = allTargetsVisible ? [] : ['not-all-target-values-visible-after-ui-entry'];
    result.changedRecords = [
      {
        type: 'purchase-order-draft-line',
        company: companyName,
        documentNo: workingOrderNo,
        originalPreferredDocumentNo: purchaseOrderNo,
        values: target,
        action: 'ui-draft-line-update',
      },
    ];
    result.evidenceRefs = [
      '010-draft-open-page-text.txt',
      '010-draft-open-controls.json',
      '011-draft-open-headers.json',
      '020-line-field-plan.json',
      '030-line-values-page-text.txt',
      '030-line-values-controls.json',
      openShot,
      afterShot,
    ];
    result.uiEvidence = visibleTargetEvidence;
    result.nextSafeAction = allTargetsVisible
      ? 'P2P-006: run Preview Posting for draft 106002 and capture receipt/invoice preview evidence before any posting.'
      : 'Stabilize P2P line-control mapping before Preview or Posting.';
    result.safeToFinalizeState = allTargetsVisible;
    result.requiresReview = !allTargetsVisible;
    result.statePatch = allTargetsVisible
      ? {
          current: {
            activeCase: 'P2P-006-PURCHASE-PREVIEW-POSTING',
            active_case_file: '.agent/state/cases/p2p-006.json',
          },
          lastRunSummary: {
            caseId,
            status: 'labor-proven',
            bcRun: true,
            posted: false,
            summary:
              `P2P-005 entered RAW-STEEL/FRA-ZL/Qty 4/Direct Unit Cost 2500/Qty. to Receive 2 via UI on purchase order ${workingOrderNo}. No preview or posting.`,
          },
        }
      : {};

    await writeJson('P2P-005-result.json', result);
  });
});
