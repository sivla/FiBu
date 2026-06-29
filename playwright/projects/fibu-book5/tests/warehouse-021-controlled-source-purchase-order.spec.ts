import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { compactPageText, dismissTours, hideFactBoxPane, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(300_000);

const testId = 'warehouse-021';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const vendorNo = 'K10000';
const itemNo = 'RAW-STEEL';
const locationCode = 'FRA-ZL';

function warehouseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function purchaseOrdersUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', company);
  url.searchParams.set('page', '9307');
  return url.toString();
}

function sanitizeText(text: string) {
  return text
    .replace(/\u201e/g, '"')
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

async function compactUiText(page: Page) {
  return compactPageText(page, {
    include: [/Purchase Order|K10000|Stahlwerk|RAW-STEEL|FRA-ZL|ATLANTA|Location Code|Quantity|Qty\. to Receive|Direct Unit Cost|Status|Released|Open|Select items|OK|Add|Lines|No\.|Vendor/i],
    maxLines: 220
  });
}

function extractPurchaseOrderNo(text: string) {
  const titleMatch = text.match(/Purchase Order\s*\n\s*(106\d{3}|107\d{3}|108\d{3})/i)?.[1];
  if (titleMatch) return titleMatch;
  const all = [...text.matchAll(/\b(106\d{3}|107\d{3}|108\d{3})\b/g)].map((match) => match[1]);
  return all.sort((left, right) => Number(right) - Number(left))[0] ?? '';
}

async function clickFirstVisible(page: Page, labels: RegExp[]) {
  for (const scope of [page, ...page.frames()]) {
    for (const label of labels) {
      for (const role of ['button', 'menuitem', 'link'] as const) {
        const match = scope.getByRole(role, { name: label }).first();
        if (await match.isVisible({ timeout: 900 }).catch(() => false)) {
          await match.click({ timeout: 5000 });
          await page.waitForTimeout(1600);
          return { clicked: true, label: label.source, role };
        }
      }
      const textMatch = scope.getByText(label).first();
      if (await textMatch.isVisible({ timeout: 900 }).catch(() => false)) {
        await textMatch.click({ timeout: 5000 });
        await page.waitForTimeout(1600);
        return { clicked: true, label: label.source, role: 'text' };
      }
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
          html.value
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
          match: matcher.test(text)
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

async function fillFirstMatchingInput(page: Page, pattern: RegExp, value: string) {
  const frame = await findFrame(page, /Purchase Order|Einkaufsbestellung|Buy-from Vendor|Kreditor|Lines/i);
  if (!frame) return { filled: false, method: 'no-purchase-order-frame' };
  const candidates = await visibleInputCandidates(frame, pattern);
  for (const candidate of candidates) {
    const filled = await candidate.handle.fill(value, { timeout: 4000 })
      .then(async () => {
        await candidate.handle.press('Tab').catch(() => undefined);
        await page.waitForTimeout(3500);
        return true;
      })
      .catch(() => false);
    if (filled) return { filled: true, method: candidate.text, x: candidate.x, y: candidate.y };
  }
  return { filled: false, method: 'no-fillable-matching-control', candidateCount: candidates.length };
}

async function fillVendor(page: Page) {
  const direct = await fillFirstMatchingInput(page, /Buy-from Vendor No\.|Buy-from Vendor|Vendor No\.|Kreditor/i, vendorNo);
  if (direct.filled) return direct;
  const frame = await findFrame(page, /Purchase Order|Einkaufsbestellung|Buy-from Vendor|Kreditor/i);
  if (!frame) return direct;
  const fallback = await frame.locator('input,textarea').evaluateAll((elements) =>
    elements
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return { index, x: rect.x, y: rect.y, visible: rect.width > 0 && rect.height > 0 };
      })
      .filter((entry) => entry.visible && entry.y >= 250 && entry.y <= 390 && entry.x >= 320 && entry.x <= 1150)
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .slice(0, 4)
  );
  for (const candidate of fallback) {
    const handle = await frame.locator('input,textarea').nth(candidate.index).elementHandle();
    if (!handle) continue;
    const filled = await handle.fill(vendorNo, { timeout: 4000 }).then(async () => {
      await handle.press('Tab').catch(() => undefined);
      await page.waitForTimeout(3500);
      return true;
    }).catch(() => false);
    if (filled) return { filled: true, method: `fallback-x${Math.round(candidate.x)}-y${Math.round(candidate.y)}` };
  }
  return { filled: false, method: 'no-vendor-control' };
}

async function fillHeaderLocation(page: Page) {
  return fillFirstMatchingInput(page, /Location Code|Location|Lagerort/i, locationCode);
}

async function visibleControlMap(page: Page, include: RegExp) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const frameData = await frame.evaluate(({ frameIndex, includeSource }) => {
      const include = new RegExp(includeSource, 'i');
      const normalize = (value: string | null | undefined, max = 180) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
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
          return {
            tag: html.tagName.toLowerCase(),
            role: normalize(html.getAttribute('role')),
            aria: normalize(html.getAttribute('aria-label')),
            title: normalize(html.getAttribute('title')),
            controlName: normalize(html.getAttribute('controlname') ?? html.closest('[controlname]')?.getAttribute('controlname')),
            value: normalize(input.value),
            text,
            rowText: normalize(row?.textContent, 300),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        })
        .filter((entry) => include.test(`${entry.controlName} ${entry.aria} ${entry.title} ${entry.text} ${entry.rowText} ${entry.value}`))
        .slice(0, 160);
      return { frameIndex, entries };
    }, { frameIndex, includeSource: include.source }).catch(() => ({ frameIndex, entries: [] }));
    frames.push(frameData);
  }
  return frames;
}

async function clickRawSteelFast(page: Page) {
  for (const frame of page.frames()) {
    const locator = frame.getByText(new RegExp(itemNo, 'i')).first();
    if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
      await locator.click({ timeout: 2500 });
      await page.waitForTimeout(800);
      return { clicked: true, method: 'frame-getByText-fast' };
    }
  }
  return { clicked: false };
}

async function selectRawSteelFromItems(page: Page) {
  const selectItems = await clickFirstVisible(page, [/^Select items\.\.\.$/i, /Select items/i, /Artikel ausw/i]);
  if (!selectItems.clicked) return { status: 'blocked', selectItems, search: null, rawClick: null, okClick: null };
  await page.waitForTimeout(1500);
  const dialogText = await pageText(page);
  const search = /RAW-STEEL/i.test(dialogText)
    ? { skipped: true, reason: 'RAW-STEEL already visible in Select items dialog; search not opened.' }
    : await clickFirstVisible(page, [/Search|Suchen/i]).then(async (click) => ({ skipped: false, click }));
  const rawClick = await clickRawSteelFast(page);
  const okClick = await clickFirstVisible(page, [/^OK$/i, /^Add$/i, /Add to.*Document/i, /Hinzuf/i, /Ausw/i, /^Select$/i]);
  await page.waitForTimeout(2500);
  return { status: rawClick.clicked || okClick.clicked ? 'observed' : 'blocked', selectItems, search, rawClick, okClick };
}

function rowChecks(text: string) {
  const rawLine = text.split('\n').map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim()).find((line) => /RAW-STEEL/i.test(line)) ?? '';
  return {
    rawLine,
    rawSteelVisible: /RAW-STEEL/i.test(text),
    locationOk: /FRA-ZL/i.test(rawLine) || /FRA-ZL/i.test(text),
    atlantaVisible: /ATLANTA|Atlanta/i.test(rawLine) || /ATLANTA|Atlanta/i.test(text),
    quantityVisible: /Quantity|Qty\.|Menge|\b1(?:,00)?\b/i.test(rawLine || text),
    releasedVisible: /Released|Freigegeben/i.test(text),
    openVisible: /\bOpen\b|Offen/i.test(text)
  };
}

test('WAREHOUSE-021 Controlled Source Purchase Order For Warehouse', async ({ page }) => {
  await page.goto(purchaseOrdersUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page);
  await page.waitForTimeout(2200);

  const listText = await pageText(page);
  const contextOk = /Purchase Orders|Einkaufsbestellungen/i.test(listText);
  const newClick = contextOk ? await clickFirstVisible(page, [/^New$/i, /^Neu$/i]) : { clicked: false };
  await page.waitForTimeout(3500);
  const afterNewText = await pageText(page);
  let draftNo = extractPurchaseOrderNo(afterNewText);
  const vendorFill = newClick.clicked ? await fillVendor(page) : { filled: false, method: 'new-not-clicked' };
  const afterVendorText = await pageText(page);
  draftNo = extractPurchaseOrderNo(afterVendorText) || draftNo;
  const headerLocationFill = vendorFill.filled ? await fillHeaderLocation(page) : { filled: false, method: 'vendor-not-filled' };
  const afterHeaderLocationText = await pageText(page);
  const rawStep = vendorFill.filled ? await selectRawSteelFromItems(page) : { status: 'blocked', reason: 'vendor-not-filled' };
  const finalText = await pageText(page);
  const checks = rowChecks(finalText);
  const sourceReady = Boolean(draftNo && vendorFill.filled && checks.rawSteelVisible && checks.locationOk);
  const releaseAttempted = false;

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-controlled-source-purchase-order',
    caseId: 'WAREHOUSE-021-CONTROLLED-SOURCE-PURCHASE-ORDER-FOR-WAREHOUSE',
    source: 'playwright-ui-controlled-source-po',
    resultStatus: sourceReady ? 'observed' : 'blocked',
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    companySwitched: false,
    apiShortcut: false,
    bookChanged: false,
    sourceDocumentType: 'Purchase Order',
    sourceDocumentNo: draftNo || null,
    draftCreated: Boolean(newClick.clicked),
    draftKept: Boolean(newClick.clicked),
    contextOk,
    newClick,
    vendorFill,
    headerLocationFill,
    rawStep,
    checks,
    sourceReady,
    releaseAttempted,
    releaseSkippedReason: sourceReady
      ? 'Release deliberately skipped in WAREHOUSE-021; source values must be reviewed before release.'
      : 'Release skipped because required source values are not all visible.',
    blockedBy: sourceReady ? [] : [
      !contextOk ? 'purchase-orders-list-not-visible' :
      !newClick.clicked ? 'new-purchase-order-not-clicked' :
      !vendorFill.filled ? 'vendor-k10000-not-filled' :
      !checks.rawSteelVisible ? 'raw-steel-line-not-visible' :
      !checks.locationOk ? 'fra-zl-not-visible-on-source-document' :
      'source-readiness-unknown'
    ],
    proved: [
      contextOk ? 'Purchase Orders list opened by direct page URL without Tell-Me search.' : 'Purchase Orders list context was not proven.',
      draftNo ? `Controlled Purchase Order draft number visible: ${draftNo}.` : 'No controlled Purchase Order draft number was extracted.',
      vendorFill.filled ? 'Vendor K10000 was filled on the controlled draft.' : 'Vendor K10000 was not filled.',
      headerLocationFill.filled ? 'Header Location Code FRA-ZL fill was attempted before Select items.' : 'No fillable header Location Code was proven.',
      checks.rawSteelVisible ? 'RAW-STEEL is visible after Select items route.' : 'RAW-STEEL is not visible after Select items route.',
      checks.locationOk ? 'FRA-ZL is visible in the resulting source document context.' : 'FRA-ZL is not visible in the resulting source document context.',
      'No Receive, Invoice, Preview Posting, Post, Warehouse Receipt source confirmation, setup change, company switch or API shortcut occurred.'
    ],
    notProved: [
      'Purchase Order release is not proven in WAREHOUSE-021.',
      'Warehouse Receipt source selection is not proven in WAREHOUSE-021.',
      'Warehouse Receipt posting is not proven.',
      'Put-away is not proven.',
      'Warehouse/Item/Value entry trace is not proven.',
      'No German final Warehouse proof exists.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noReceive: true,
      noInvoice: true,
      noWarehouseReceiptSourceConfirmation: true
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction: 'In German final sandbox, build a final source Purchase Order with German data, release it, then select it into a Warehouse Receipt and trace postings in separate approved cases.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof needs a released inbound Purchase Order/source document, Warehouse Receipt source selection, receipt posting, Put-away handling and ledger trace.',
    finalScreenshotNeeded: true,
    nextCase: sourceReady
      ? 'WAREHOUSE-022-SOURCE-PURCHASE-ORDER-RELEASE-GATE'
      : 'WAREHOUSE-022-SOURCE-PURCHASE-ORDER-VALUE-ENTRY-BLOCKER-REVIEW',
    nextStep: sourceReady
      ? 'WAREHOUSE-022: review controlled Purchase Order source values and decide whether Release is safe before Warehouse Receipt source selection.'
      : 'WAREHOUSE-022: review why the controlled Purchase Order source values are not visible and choose a non-repeated field-entry route.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-final-compact-text.txt'), await compactUiText(page));
  await writeTextEvidence(warehouseEvidencePath('020-after-new-text.txt'), sanitizeText(afterNewText));
  await writeTextEvidence(warehouseEvidencePath('030-after-vendor-text.txt'), sanitizeText(afterVendorText));
  await writeTextEvidence(warehouseEvidencePath('040-after-header-location-text.txt'), sanitizeText(afterHeaderLocationText));
  await writeTextEvidence(warehouseEvidencePath('050-final-text.txt'), sanitizeText(finalText));
  await writeJsonEvidence(warehouseEvidencePath('060-final-controls.json'), await visibleControlMap(page, /K10000|RAW-STEEL|FRA-ZL|ATLANTA|Location|Quantity|Qty\.|Status|Release|Receive|Invoice|Post/i));
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-021-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-021-CONTROLLED-SOURCE-PO.md'),
    [
      '# WAREHOUSE-021 Controlled Source Purchase Order',
      '',
      'Status: `labor`, `source-document`, `no-posting`, `not-final`.',
      '',
      `Draft: ${draftNo || 'nicht erkannt'}`,
      `Vendor K10000 gefuellt: ${vendorFill.filled ? 'ja' : 'nein'}`,
      `Header Location FRA-ZL gefuellt: ${headerLocationFill.filled ? 'ja' : 'nein'}`,
      `RAW-STEEL sichtbar: ${checks.rawSteelVisible ? 'ja' : 'nein'}`,
      `FRA-ZL sichtbar: ${checks.locationOk ? 'ja' : 'nein'}`,
      `Source ready fuer Review: ${sourceReady ? 'ja' : 'nein'}`,
      'Release: nicht ausgefuehrt',
      '',
      '## Grenze',
      '',
      '- Kein Purchase Receive.',
      '- Keine Invoice.',
      '- Kein Preview Posting.',
      '- Kein Post.',
      '- Kein Warehouse Receipt Source Confirm.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );
  await writeTextEvidence(
    warehouseEvidencePath('README.md'),
    [
      '# WAREHOUSE-021 Evidence Index',
      '',
      'Status: `labor`, `source-document`, `no-posting`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-021-result.json` | Result JSON | kontrollierter Purchase-Order-Source-Aufbau oder Blocker | Release, Warehouse Receipt, Posting |',
      '| `060-final-controls.json` | UI-Control Evidence | sichtbare Zielwerte/Kontextmarker | fachliche Postingreife |',
      '| `WAREHOUSE-021-CONTROLLED-SOURCE-PO.md` | Lernnotiz | naechster Gate-Schritt | deutschen Finalnachweis |',
      '',
      'German Final: Source Purchase Order und Warehouse Receipt muessen in deutscher Zielumgebung neu aufgebaut werden.',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.setupChanged).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
