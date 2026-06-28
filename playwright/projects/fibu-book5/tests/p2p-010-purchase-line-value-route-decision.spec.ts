import { test, type Frame, type Page } from '@playwright/test';
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

const caseId = 'P2P-010-PURCHASE-LINE-VALUE-ROUTE-DECISION';
const environment = process.env.BC_ENVIRONMENT ?? 'MCP_1_20260210';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const vendorNo = 'K10000';
const targetItem = 'RAW-STEEL';
const evidenceDir = path.join(process.cwd(), 'playwright/projects/fibu-book5/evidence/p2p-010');

type RouteStep = {
  route: string;
  status: 'success' | 'observed' | 'blocked' | 'skipped';
  details: string[];
};

async function ensureDirs() {
  await fs.mkdir(evidenceDir, { recursive: true });
}

async function writeJson(fileName: string, data: unknown) {
  await fs.writeFile(path.join(evidenceDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, data: string) {
  await fs.writeFile(path.join(evidenceDir, fileName), scrubEvidenceText(data), 'utf8');
}

function scrubEvidenceText(data: string) {
  return data
    .split('\n')
    .filter((line) => !/tokenFactory|clientId|authority|cacheLocation|upn|requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|shouldAttachOauthTokens/i.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
    .concat('\n');
}

function pageUrl(pageId: number) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', company);
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value);
    if (/webshell\.suite\.office\.com/i.test(url.hostname)) {
      return 'https://webshell.suite.office.com/[redacted-frame]';
    }
    for (const key of [...url.searchParams.keys()]) {
      if (/token|tenant|trace|client|auth|session|sid|tid|upn|shsid/i.test(key)) {
        url.searchParams.set(key, '[redacted]');
      }
    }
    url.pathname = url.pathname.replace(/^\/[0-9a-f-]{36}\//i, '/[tenant-id]/');
    return url.toString();
  } catch {
    return value
      .replace(/(businesscentral\.dynamics\.com)\/[0-9a-f-]{36}\//i, '$1/[tenant-id]/')
      .replace(/https:\/\/webshell\.suite\.office\.com\/[^\s"']+/gi, 'https://webshell.suite.office.com/[redacted-frame]')
      .replace(/(token|tenant|trace|client|auth|session|sid|tid|upn|shsid)=([^&\s]+)/gi, '$1=[redacted]');
  }
}

function extractPurchaseOrderNo(text: string) {
  const titleMatch = text.match(/Purchase Order\s*\n\s*(106\d{3}|107\d{3}|108\d{3}|PO\d{3,}|P-ORD\d{3,})/i)?.[1];
  if (titleMatch) return titleMatch;
  const vendorMatches = [...text.matchAll(/\b(106\d{3}|107\d{3}|108\d{3})\s+K10000\s+Stahlwerk/gi)].map((match) => match[1]);
  if (vendorMatches.length > 0) {
    return vendorMatches.sort((left, right) => Number(right) - Number(left))[0];
  }
  return text.match(/\b(106\d{3}|107\d{3}|108\d{3}|PO\d{3,}|P-ORD\d{3,})\b/i)?.[1] ?? '';
}

async function clickFirstVisible(page: Page, labels: RegExp[]) {
  for (const scope of [page, ...page.frames()]) {
    for (const label of labels) {
      for (const role of ['button', 'menuitem', 'link'] as const) {
        const match = scope.getByRole(role, { name: label }).first();
        if (await match.isVisible({ timeout: 900 }).catch(() => false)) {
          await match.click({ timeout: 6000 });
          await page.waitForTimeout(1600);
          return { clicked: true, label: label.source, role };
        }
      }
      const textMatch = scope.getByText(label).first();
      if (await textMatch.isVisible({ timeout: 900 }).catch(() => false)) {
        await textMatch.click({ timeout: 6000 });
        await page.waitForTimeout(1600);
        return { clicked: true, label: label.source, role: 'text' };
      }
    }
  }
  return { clicked: false };
}

async function enableWideLayout(page: Page) {
  return clickFirstVisible(page, [/Breite Layoutansicht anzeigen|Breites Layout|Wide layout/i]);
}

async function enableLinesFocusMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const control = scope.getByRole('menuitemcheckbox', { name: /Fokusmodus.*Seitenteil|Fokusmodus umschalten|Focus mode|Toggle focus mode/i }).first();
    if (await control.isVisible({ timeout: 800 }).catch(() => false)) {
      const checked = await control.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await control.click({ timeout: 3000 });
        await page.waitForTimeout(1000);
      }
      return { clicked: checked !== 'true', alreadyFocused: checked === 'true' };
    }
  }
  return { clicked: false };
}

async function findFrame(page: Page, pattern: RegExp) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
      if (pattern.test(text)) return frame;
    }
    await page.waitForTimeout(1000);
  }
  return undefined;
}

async function visibleInputCandidates(frame: Frame, pattern: RegExp) {
  const entries = await frame.locator('input,textarea,[role="textbox"],[role="combobox"]').evaluateAll((elements, source) => {
    const matcher = new RegExp(source as string, 'i');
    return elements
      .map((element, index) => {
        const html = element as HTMLInputElement;
        const rect = html.getBoundingClientRect();
        const text = [
          html.getAttribute('aria-label'),
          html.getAttribute('title'),
          html.getAttribute('placeholder'),
          html.textContent,
          html.value,
        ].filter(Boolean).join(' ');
        return {
          index,
          text: text.replace(/\s+/g, ' ').trim(),
          value: html.value ?? '',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0,
          disabled: html.disabled || html.getAttribute('aria-disabled') === 'true',
          readonly: html.readOnly || html.getAttribute('aria-readonly') === 'true',
          match: matcher.test(text),
        };
      })
      .filter((entry) => entry.visible && !entry.disabled && !entry.readonly && entry.match);
  }, pattern.source);
  const result = [];
  for (const entry of entries) {
    const handle = await frame.locator('input,textarea,[role="textbox"],[role="combobox"]').nth(entry.index).elementHandle();
    if (handle) result.push({ ...entry, handle });
  }
  return result;
}

async function fillVendor(page: Page) {
  const frame = await findFrame(page, /Purchase Order|Einkaufsbestellung|Buy-from Vendor|Kreditor/i);
  if (!frame) return { filled: false, method: 'no-purchase-order-frame' };
  const labeled = await visibleInputCandidates(frame, /Buy-from Vendor No\.|Buy-from Vendor|Vendor No\.|Kreditor|Eink\. von Kred\./i);
  const candidates = labeled.length ? labeled : (await frame.locator('input,textarea').evaluateAll((elements) =>
    elements
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return { index, x: rect.x, y: rect.y, visible: rect.width > 0 && rect.height > 0 };
      })
      .filter((entry) => entry.visible && entry.y >= 250 && entry.y <= 380 && entry.x >= 350 && entry.x <= 1050)
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .slice(0, 4)
  )).map((entry) => ({ ...entry, text: `fallback-x${Math.round(entry.x)}-y${Math.round(entry.y)}`, handle: undefined as any }));
  for (const candidate of candidates) {
    const handle = candidate.handle ?? await frame.locator('input,textarea').nth(candidate.index).elementHandle();
    if (!handle) continue;
    const filled = await handle.fill(vendorNo, { timeout: 4000 })
      .then(async () => {
        await handle.press('Tab').catch(() => undefined);
        await page.waitForTimeout(4000);
        return true;
      })
      .catch(() => false);
    if (filled) return { filled: true, method: candidate.text };
  }
  return { filled: false, method: 'no-fillable-vendor-control' };
}

async function visibleControlMap(page: Page, include: RegExp) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const frameData = await frame.evaluate(({ frameIndex, frameUrl, includeSource }) => {
      const include = new RegExp(includeSource, 'i');
      const normalize = (value: string | null | undefined, max = 160) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
      const visible = (element: Element) => {
        const html = element as HTMLElement;
        const rect = html.getBoundingClientRect();
        const style = window.getComputedStyle(html);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const entries = [...document.querySelectorAll('input,textarea,select,[role="textbox"],[role="combobox"],[role="gridcell"],td,th,button,[role="button"],[role="menuitem"],[aria-label],[title],[controlname]')]
        .filter(visible)
        .map((element) => {
          const html = element as HTMLElement;
          const input = element as HTMLInputElement;
          const rect = html.getBoundingClientRect();
          const row = html.closest('[role="row"],tr');
          const text = normalize(html.innerText || html.textContent);
          const entry = {
            tag: html.tagName.toLowerCase(),
            role: normalize(html.getAttribute('role')),
            aria: normalize(html.getAttribute('aria-label')),
            title: normalize(html.getAttribute('title')),
            controlName: normalize(html.getAttribute('controlname') ?? html.closest('[controlname]')?.getAttribute('controlname')),
            value: normalize(input.value),
            text,
            rowText: normalize(row?.textContent, 260),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
          return entry;
        })
        .filter((entry) => include.test(`${entry.controlName} ${entry.aria} ${entry.title} ${entry.text} ${entry.rowText} ${entry.value}`))
        .slice(0, 120);
      return { frameIndex, frameUrl: frameUrl.replace(/upn=[^&]+/gi, 'upn=[redacted]').replace(/tid=[^&]+/gi, 'tid=[redacted]').replace(/shsid=[^&]+/gi, 'shsid=[redacted]'), entries };
    }, { frameIndex, frameUrl: sanitizeUrl(frame.url()), includeSource: include.source }).catch(() => ({ frameIndex, frameUrl: sanitizeUrl(frame.url()), entries: [] }));
    frames.push(frameData);
  }
  return frames;
}

async function clickRawSteelFast(page: Page) {
  for (const frame of page.frames()) {
    const locator = frame.getByText(new RegExp(targetItem, 'i')).first();
    if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
      await locator.click({ timeout: 2500 });
      return { clicked: true, method: 'frame-getByText-fast' };
    }
  }
  return { clicked: false };
}

async function compactUiText(page: Page) {
  return compactPageText(page, {
    include: [/106\d{3}|K10000|Stahlwerk|RAW-STEEL|FRA-ZL|ATLANTA|Select items|Items|Quantity|Qty\. to Receive|Direct Unit Cost|OK|Add|Purchase Order|Line Amount|Location/i],
    maxLines: 160,
  });
}

async function searchInDialog(page: Page, value: string) {
  await clickFirstVisible(page, [/Search|Suchen/i]);
  await page.waitForTimeout(500);
  for (const scope of [page, ...page.frames()]) {
    const boxes = scope.getByRole('textbox');
    const count = await boxes.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const box = boxes.nth(index);
      if (!(await box.isVisible({ timeout: 300 }).catch(() => false))) continue;
      const ok = await box.fill(value, { timeout: 2500 }).then(() => true).catch(() => false);
      if (ok) {
        await page.waitForTimeout(1500);
        return { filled: true, index };
      }
    }
  }
  return { filled: false };
}

async function selectRawSteelFromItems(page: Page) {
  const step: RouteStep = { route: 'fresh-draft-select-items-creation-phase', status: 'observed', details: [] };
  const selectItems = await clickFirstVisible(page, [/^Select items\.\.\.$/i, /Select items/i, /Artikel ausw/i]);
  step.details.push(`selectItems=${JSON.stringify(selectItems)}`);
  if (!selectItems.clicked) return { ...step, status: 'blocked' as const };
  await writeText('030-select-items-text.txt', await compactUiText(page));
  await writeJson('031-select-items-controls.json', await visibleControlMap(page, /RAW-STEEL|Quantity|Qty\.|OK|Add|Items|Search|Suchen|No\.|Description|Vendor No/i));
  const selectItemsText = await pageText(page);
  const search = /RAW-STEEL/i.test(selectItemsText)
    ? { skipped: true, reason: 'RAW-STEEL already visible in Select items dialog; search not opened.' }
    : await searchInDialog(page, targetItem);
  step.details.push(`search=${JSON.stringify(search)}`);
  await writeText('040-after-raw-steel-availability-text.txt', await compactUiText(page));
  await writeJson('041-after-raw-steel-availability-controls.json', await visibleControlMap(page, /RAW-STEEL|Quantity|Qty\.|OK|Add|Items|Search|Suchen|No\.|Description|Vendor No/i));
  const rawClick = await clickRawSteelFast(page);
  step.details.push(`rawClick=${JSON.stringify(rawClick)}`);
  await page.waitForTimeout(800).catch(() => undefined);
  if (page.isClosed()) {
    step.status = 'blocked';
    step.details.push('page-closed-after-raw-steel-click');
    return step;
  }
  const afterRawClickText = await pageText(page);
  const okClick = await clickFirstVisible(page, [/^OK$/i, /^Add$/i, /Add to.*Document/i, /Hinzuf/i, /Ausw/i, /^Select$/i]);
  step.details.push(`okOrAddClick=${JSON.stringify(okClick)}`);
  await page.waitForTimeout(2500);
  step.status = rawClick.clicked || okClick.clicked || new RegExp(targetItem, 'i').test(afterRawClickText) ? 'observed' : 'blocked';
  return step;
}

function rowChecks(text: string) {
  const rawLine = text.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).find((line) => /RAW-STEEL/i.test(line)) ?? '';
  return {
    rawLine,
    rawSteelVisible: /RAW-STEEL/i.test(text),
    locationOk: /FRA-ZL/i.test(rawLine),
    quantityOk: /\b4(?:,00)?\b/.test(rawLine),
    unitCostOk: /2\.500,00|2500/i.test(rawLine),
    qtyToReceiveOk: /\b2(?:,00)?\b/.test(rawLine),
  };
}

test.describe('P2P-010 purchase line value route decision', () => {
  test.use({
    storageState: 'playwright/.auth/bc-user.json',
    viewport: { width: 2600, height: 1400 },
  });

  test('uses a fresh controlled draft and Select items creation-phase route before deciding Preview gate', async ({ page }) => {
    test.setTimeout(240_000);
    await ensureDirs();
    const result: Record<string, unknown> = {
      schemaVersion: 1,
      caseId,
      source: 'playwright-ui-labor-value-route-decision',
      resultStatus: 'started',
      instance: environment,
      company,
      sourceCompany: company,
      selectedRoute: 'Route B - fresh controlled Purchase Order draft',
      targetValues: {
        vendorNo,
        itemNo: targetItem,
        locationCode: 'FRA-ZL',
        quantity: 4,
        qtyToReceive: 2,
        directUnitCostExclTax: 2500,
      },
      fachlichePruefung: {
        businessCase: 'P2P partial receipt needs a purchase order line with target quantity and Qty. to Receive before Preview Posting.',
        targetState: 'Fresh PO draft, vendor K10000, RAW-STEEL line, Location FRA-ZL, Quantity 4, Qty. to Receive 2, Direct Unit Cost 2500.',
        modules: ['Purchasing', 'Inventory'],
        masterDataAndSetup: ['Vendor K10000', 'Item RAW-STEEL', 'Location FRA-ZL'],
        expectedDocumentsAndEntries: ['No posted documents in P2P-010 unless all target values become visible and a later gate unlocks Preview/Receive.'],
        risk: 'Creating a fresh draft may leave a laboratory purchase order if target values still cannot be set.',
        correctionPath: 'Keep draft as laboratory trace and use it only as blocker evidence; do not Preview/Post without target values.',
        evidencePlan: ['fresh draft screenshot', 'Select-items creation-phase controls', 'final line/value screenshot', 'result JSON'],
      },
      previewPosting: false,
      posted: false,
      setupChanges: [],
      createdRecords: [],
      changedRecords: [],
      postedRecords: [],
      cleanup: {
        attempted: false,
        result: 'kept-labor-draft-trace-if-created',
      },
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
      rebuildInstruction: 'Recreate the P2P partial receipt value route in the future German target company before final book screenshots.',
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: {},
    };

    await page.goto(pageUrl(9307), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await hideFactBoxPane(page);
    const listText = await pageText(page);
    if (!sanitizeUrl(page.url()).includes(environment) || !/Purchase Orders|Einkaufsbestellungen/i.test(listText)) {
      result.resultStatus = 'blocked';
      result.blockedBy = ['wrong-instance-or-purchase-orders-list-not-visible'];
      result.notProved = ['Fresh draft route was not attempted because context guard failed.'];
      await writeJson('P2P-010-result.json', result);
      return;
    }

    const newClick = await clickFirstVisible(page, [/^New$/i, /^Neu$/i]);
    await page.waitForTimeout(4500);
    const afterNewText = await pageText(page);
    let draftNo = extractPurchaseOrderNo(afterNewText);
    const vendorFill = await fillVendor(page);
    await page.waitForTimeout(4500);
    const afterVendorText = await pageText(page);
    draftNo = extractPurchaseOrderNo(afterVendorText) || draftNo;
    result.createdRecords = draftNo ? [{ type: 'Purchase Order draft', no: draftNo, keepStatus: 'kept-as-p2p-010-labor-trace' }] : [];
    if (vendorFill.filled && draftNo) {
      result.changedRecords = [{ type: 'Purchase Order header', no: draftNo, field: 'Buy-from Vendor No.', value: vendorNo }];
    }
    await enableWideLayout(page);
    await enableLinesFocusMode(page);
    await screenshot(page, 'p2p-010-010-fresh-draft-after-vendor.png', {
      projectName: project.name,
      testId: 'p2p-010',
      status: 'labor',
      bookUse: 'evidence',
      purpose: 'P2P-010 fresh controlled Purchase Order draft after vendor K10000 before Select items.',
      expectedPageText: [/Purchase Order|K10000|Stahlwerk|Lines/i],
      knownLimitations: ['RM-DEMO laboratory only; no Preview Posting or posting in this screenshot.'],
    });
    await writeText('010-after-vendor-text.txt', await compactUiText(page));
    await writeJson('011-after-vendor-controls.json', await visibleControlMap(page, /Select items|Lines|Type|No\.|Quantity|Location|Direct Unit Cost|Qty\. to Receive|K10000|Stahlwerk/i));

    let routeStep: RouteStep;
    try {
      routeStep = await selectRawSteelFromItems(page);
    } catch (error) {
      routeStep = {
        route: 'fresh-draft-select-items-creation-phase',
        status: 'blocked',
        details: [`route-error=${error instanceof Error ? error.message : String(error)}`],
      };
    }
    let finalText = '';
    if (!page.isClosed()) {
      await screenshot(page, 'p2p-010-020-after-select-items-route.png', {
        projectName: project.name,
        testId: 'p2p-010',
        status: 'labor',
        bookUse: 'evidence',
        purpose: 'P2P-010 after fresh-draft Select items route for RAW-STEEL.',
        knownLimitations: ['Only visible target values count; no Preview Posting or posting executed.'],
      });
      await writeText('050-final-text.txt', await compactUiText(page));
      await writeJson('051-final-controls.json', await visibleControlMap(page, /RAW-STEEL|FRA-ZL|ATLANTA|Quantity|Qty\. to Receive|Direct Unit Cost|Line Amount|Location/i));
      finalText = await pageText(page).catch(() => '');
    } else {
      await writeText('050-final-text.txt', 'Page/context closed before final visible line check.');
      await writeJson('051-final-controls.json', []);
    }
    const checks = rowChecks(finalText);
    const targetValuesVisible = checks.rawSteelVisible && checks.locationOk && checks.quantityOk && checks.unitCostOk && checks.qtyToReceiveOk;

    result.details = {
      url: sanitizeUrl(page.url()),
      newClick,
      vendorFill,
      draftNo,
      routeStep,
      checks,
    };
    result.screenshots = [
      'playwright/projects/fibu-book5/img/p2p-010-010-fresh-draft-after-vendor.png',
      'playwright/projects/fibu-book5/img/p2p-010-020-after-select-items-route.png',
    ];
    result.evidenceRefs = [
      'playwright/projects/fibu-book5/evidence/p2p-010/010-after-vendor-text.txt',
      'playwright/projects/fibu-book5/evidence/p2p-010/011-after-vendor-controls.json',
      'playwright/projects/fibu-book5/evidence/p2p-010/030-select-items-text.txt',
      'playwright/projects/fibu-book5/evidence/p2p-010/031-select-items-controls.json',
      'playwright/projects/fibu-book5/evidence/p2p-010/040-after-raw-steel-availability-text.txt',
      'playwright/projects/fibu-book5/evidence/p2p-010/041-after-raw-steel-availability-controls.json',
      'playwright/projects/fibu-book5/evidence/p2p-010/050-final-text.txt',
      'playwright/projects/fibu-book5/evidence/p2p-010/051-final-controls.json',
    ];
    result.resultStatus = targetValuesVisible ? 'observed' : 'blocked';
    result.proved = [
      `Fresh Purchase Order draft ${draftNo || '(no number visible)'} route was attempted in MCP_1_20260210/RM-DEMO.`,
      vendorFill.filled ? 'Vendor K10000 was entered on the fresh draft.' : 'Vendor K10000 entry was attempted.',
      'Select items creation-phase route was tested instead of repeating P2P-009 fixed-line cell edits.',
      'No Preview Posting, posting, setup change, company switch or API shortcut was executed.',
    ];
    result.notProved = targetValuesVisible ? [
      'German final P2P proof remains open.',
      'Receive/Post ledger trace remains open until a separate gated case.',
    ] : [
      'Location FRA-ZL, Quantity 4 and Qty. to Receive 2 are not all visible on the RAW-STEEL line.',
      'Preview Posting and Receive are not proven by P2P-010.',
      'German final P2P proof remains open.',
    ];
    result.blockedBy = targetValuesVisible ? [] : [
      'fresh-draft-select-items-route-did-not-produce-all-target-values',
      'select-items-dialog-exposes-item-selection-but-not-confirmed-order-quantity-location-qty-to-receive-entry',
    ];
    result.nextStep = targetValuesVisible
      ? 'Write P2P-011 gated Preview Posting fachliche Pruefung for the fresh draft before any Receive.'
      : 'Choose the next non-repeated route: true line-edit action discovery, Purchase Journal alternative, or a clean lab company/setup route.';

    await writeJson('P2P-010-result.json', result);
  });
});
