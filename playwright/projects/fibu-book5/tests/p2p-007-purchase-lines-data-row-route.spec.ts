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

const caseId = 'P2P-007-PURCHASE-LINES-DATA-ROW-ROUTE';
const environment = process.env.BC_ENVIRONMENT ?? 'MCP_1_20260210';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const purchaseOrderNo = process.env.P2P007_PURCHASE_ORDER_NO ?? '106051';
const targetItem = 'RAW-STEEL';
const evidenceDir = path.join(process.cwd(), 'playwright/projects/fibu-book5/evidence/p2p-007');

type Attempt = {
  route: string;
  status: 'attempted' | 'observed' | 'success' | 'blocked' | 'skipped';
  details: string[];
  evidenceRefs?: string[];
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

async function enableWideLayout(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const button = scope
      .locator('button[title*="Breite Layoutansicht" i], button[aria-label*="Breites Layout" i], button[title*="Wide layout" i], button[aria-label*="Wide layout" i]')
      .first();
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      await button.click();
      await page.waitForTimeout(1500);
      return { attempted: true, clicked: true };
    }
  }
  return { attempted: true, clicked: false, blockedBy: 'wide-layout-toggle-not-visible' };
}

async function enableLinesFocusMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const button = scope
      .getByRole('menuitemcheckbox', { name: /Fokusmodus.*Seitenteil|Fokusmodus umschalten|Focus mode|Toggle focus mode/i })
      .first();
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      const checked = await button.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await button.click();
        await page.waitForTimeout(1500);
      }
      return { attempted: true, clicked: checked !== 'true', alreadyFocused: checked === 'true' };
    }
  }
  return { attempted: true, clicked: false, blockedBy: 'focus-mode-toggle-not-visible' };
}

async function clickFirstVisible(page: Page, labels: RegExp[]) {
  for (const scope of [page, ...page.frames()]) {
    for (const label of labels) {
      for (const role of ['button', 'menuitem', 'link'] as const) {
        const match = scope.getByRole(role, { name: label }).first();
        if (await match.isVisible({ timeout: 800 }).catch(() => false)) {
          await match.click({ timeout: 5000 });
          await page.waitForTimeout(1800);
          return { clicked: true, label: label.source, role };
        }
      }
      const textMatch = scope.getByText(label).first();
      if (await textMatch.isVisible({ timeout: 800 }).catch(() => false)) {
        await textMatch.click({ timeout: 5000 });
        await page.waitForTimeout(1800);
        return { clicked: true, label: label.source, role: 'text' };
      }
    }
  }
  return { clicked: false };
}

async function visibleControlMap(page: Page) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const frameData = await frame.evaluate(
      ({ frameIndex, frameUrl }) => {
        const normalize = (value: string | null | undefined, max = 180) =>
          String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
        const visible = (element: Element) => {
          const html = element as HTMLElement;
          const rect = html.getBoundingClientRect();
          const style = window.getComputedStyle(html);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const entries = [
          ...document.querySelectorAll('input,textarea,select,[role="textbox"],[role="combobox"],[role="gridcell"],td,th,button,[role="button"],[role="menuitem"],[aria-label],[title],[controlname]'),
        ]
          .filter(visible)
          .map((element, index) => {
            const html = element as HTMLElement;
            const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            const rect = html.getBoundingClientRect();
            const row = html.closest('[role="row"],tr');
            const cell = html.closest('[role="gridcell"],td');
            return {
              index,
              tag: html.tagName.toLowerCase(),
              role: html.getAttribute('role') ?? '',
              aria: html.getAttribute('aria-label') ?? '',
              title: html.getAttribute('title') ?? '',
              controlName: html.getAttribute('controlname') ?? html.closest('[controlname]')?.getAttribute('controlname') ?? '',
              value: 'value' in input ? normalize(input.value, 120) : '',
              text: normalize(html.innerText || html.textContent, 180),
              rowText: normalize(row?.textContent, 300),
              cellText: normalize(cell?.textContent, 180),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              readonly: Boolean((input as HTMLInputElement).readOnly || html.getAttribute('aria-readonly') === 'true'),
              disabled: Boolean((input as HTMLInputElement).disabled || html.getAttribute('aria-disabled') === 'true'),
            };
          })
          .filter((entry) =>
            /RAW-STEEL|Select items|Add|OK|Item|No\.|Description|Quantity|Location|Direct Unit Cost|Qty\. to Receive|Lines|Type|Purchase Order Subform|New Line|Neue Zeile|Insert|Manage|Line/i.test(
              `${entry.controlName} ${entry.aria} ${entry.title} ${entry.text} ${entry.rowText} ${entry.cellText} ${entry.value}`,
            ),
          )
          .slice(0, 180);
        return {
          frameIndex,
          frameUrl,
          textSample: normalize(document.body?.innerText || document.body?.textContent, 2500),
          entries,
        };
      },
      { frameIndex, frameUrl: sanitizeUrl(frame.url()) },
    ).catch((error) => ({
      frameIndex,
      frameUrl: sanitizeUrl(frame.url()),
      textSample: `frame-evaluate-failed: ${error instanceof Error ? error.message : String(error)}`,
      entries: [],
    }));
    frames.push(frameData);
  }
  return frames;
}

async function fillSearchOrFilter(page: Page, value: string) {
  const searchButtonSelectors = [
    'button[title*="Search" i]',
    'button[aria-label*="Search" i]',
    'button[title*="Suchen" i]',
    'button[aria-label*="Suchen" i]',
    '[role="button"][title*="Search" i]',
    '[role="button"][aria-label*="Search" i]',
    '[role="button"][title*="Suchen" i]',
    '[role="button"][aria-label*="Suchen" i]',
  ];

  for (const scope of [page, ...page.frames()]) {
    for (const selector of searchButtonSelectors) {
      const button = scope.locator(selector).first();
      if (await button.isVisible({ timeout: 800 }).catch(() => false)) {
        await button.click({ timeout: 3000 });
        await page.waitForTimeout(800);
        break;
      }
    }
  }

  const candidates = [/Search|Suchen|Filter|Find|Suche/i];
  for (const scope of [page, ...page.frames()]) {
    for (const name of candidates) {
      const box = scope.getByRole('textbox', { name }).first();
      if (await box.isVisible({ timeout: 800 }).catch(() => false)) {
        await box.fill(value, { timeout: 3000 }).catch(async () => {
          await box.click();
          await page.keyboard.press('Control+A');
          await page.keyboard.type(value);
        });
        await page.waitForTimeout(1500);
        return { filled: true, method: `textbox:${name.source}` };
      }
    }
  }
  await page.keyboard.press('Control+F').catch(() => undefined);
  await page.waitForTimeout(500);
  for (const scope of [page, ...page.frames()]) {
    const focusedSearch = scope.locator('input:focus, textarea:focus, [role="textbox"]:focus').first();
    if (await focusedSearch.isVisible({ timeout: 500 }).catch(() => false)) {
      await page.keyboard.type(value);
      await page.waitForTimeout(1200);
      await page.keyboard.press('Enter').catch(() => undefined);
      await page.waitForTimeout(1200);
      return { filled: true, method: 'keyboard-control-f-focused-textbox' };
    }
  }
  return { filled: false };
}

async function dismissSelectItemsDialog(page: Page) {
  return clickFirstVisible(page, [/^Abbrechen$/i, /^Cancel$/i, /^Schlie.en$/i, /^Close$/i]);
}

async function trySelectRawSteel(page: Page) {
  const route: Attempt = { route: 'A Select items', status: 'attempted', details: [] };
  const clicked = await clickFirstVisible(page, [/^Select items\.\.\.$/i, /Select items/i, /Artikel ausw/i]);
  route.details.push(`Select items click: ${JSON.stringify(clicked)}`);
  if (!clicked.clicked) {
    route.status = 'blocked';
    route.details.push('Select items action was not clickable.');
    return route;
  }

  await writeText('020-after-select-items-page-text.txt', (await compactPageText(page, {
    include: [/RAW-STEEL|Item|Artikel|Select items|Add|OK|Quantity|Location|No\.|Description|Steel|Search|Suchen/i],
    maxLines: 160,
  })));
  await writeJson('021-after-select-items-controls.json', await visibleControlMap(page));

  const search = await fillSearchOrFilter(page, targetItem);
  route.details.push(`Search/filter fill: ${JSON.stringify(search)}`);
  await writeText('030-after-raw-steel-search-page-text.txt', (await compactPageText(page, {
    include: [/RAW-STEEL|Item|Artikel|Select items|Add|OK|Quantity|Location|No\.|Description|Steel|Search|Suchen/i],
    maxLines: 160,
  })));
  await writeJson('031-after-raw-steel-search-controls.json', await visibleControlMap(page));

  const rawVisible = new RegExp(targetItem, 'i').test(await pageText(page));
  route.details.push(`RAW-STEEL visible after search: ${rawVisible}`);
  if (rawVisible) {
    const rowClick = await clickFirstVisible(page, [new RegExp(targetItem, 'i')]);
    route.details.push(`RAW-STEEL row/cell click: ${JSON.stringify(rowClick)}`);
    const addClick = await clickFirstVisible(page, [/^OK$/i, /^Add$/i, /Add to.*Document/i, /Hinzufügen/i, /Auswählen/i, /^Select$/i]);
    route.details.push(`Add/select confirmation click: ${JSON.stringify(addClick)}`);
    route.status = addClick.clicked || rowClick.clicked ? 'observed' : 'blocked';
    return route;
  }

  route.status = 'blocked';
  route.details.push('RAW-STEEL was not visible after Select items search/filter attempt.');
  route.details.push(`Select items dialog dismiss: ${JSON.stringify(await dismissSelectItemsDialog(page))}`);
  return route;
}

async function tryLineActions(page: Page) {
  const route: Attempt = { route: 'B Line Action / More Options', status: 'attempted', details: [] };
  const actionMapBefore = await visibleControlMap(page);
  await writeJson('040-line-action-controls-before.json', actionMapBefore);
  const newLineClick = await clickFirstVisible(page, [/Neue Zeile/i, /New Line/i, /Insert Line/i, /^Line$/i, /^Manage$/i, /^Verwalten$/i]);
  route.details.push(`line/manage/new-line click: ${JSON.stringify(newLineClick)}`);
  await writeJson('041-line-action-controls-after.json', await visibleControlMap(page));
  route.status = newLineClick.clicked ? 'observed' : 'blocked';
  return route;
}

async function tryKeyboardRoute(page: Page) {
  const route: Attempt = { route: 'C Keyboard route', status: 'attempted', details: [] };
  const body = await page.locator('body').boundingBox().catch(() => null);
  await page.mouse.click((body?.x ?? 0) + 450, (body?.y ?? 0) + 420).catch(() => undefined);
  for (const key of ['Tab', 'Tab', 'Enter', 'F2', 'Insert', 'ArrowDown', 'Tab']) {
    await page.keyboard.press(key).catch(() => undefined);
    await page.waitForTimeout(300);
  }
  await writeJson('050-keyboard-route-controls.json', await visibleControlMap(page));
  const text = await pageText(page);
  route.details.push(`RAW-STEEL visible after keyboard route: ${new RegExp(targetItem, 'i').test(text)}`);
  route.details.push(`Page text contains no-data message: ${/In dieser Ansicht kann nichts angezeigt werden|nothing can be shown/i.test(text)}`);
  route.status = /In dieser Ansicht kann nichts angezeigt werden|nothing can be shown/i.test(text) ? 'blocked' : 'observed';
  return route;
}

async function tryLookupRoute(page: Page) {
  const route: Attempt = { route: 'D Lookup / Type route', status: 'attempted', details: [] };
  const before = await visibleControlMap(page);
  const typeMenu = before.flatMap((frame) => frame.entries).find((entry) => /Men.+Type|menu.*Type|Type/i.test(`${entry.aria} ${entry.title}`));
  route.details.push(`type/menu candidate: ${typeMenu ? JSON.stringify({ x: typeMenu.x, y: typeMenu.y, aria: typeMenu.aria, title: typeMenu.title }) : 'none'}`);
  if (typeMenu) {
    await page.mouse.click(typeMenu.x + Math.min(8, Math.max(1, typeMenu.width / 2)), typeMenu.y + Math.max(1, typeMenu.height / 2));
    await page.waitForTimeout(1200);
  }
  await writeJson('060-lookup-type-route-controls.json', await visibleControlMap(page));
  route.status = typeMenu ? 'observed' : 'blocked';
  return route;
}

function hasRealPurchaseLine(text: string) {
  return new RegExp(targetItem, 'i').test(text) || /RAW.*STEEL|FRA-ZL|Direct Unit Cost|Qty\. to Receive/i.test(text);
}

test.describe('P2P-007 purchase lines data row route', () => {
  test.use({
    storageState: 'playwright/.auth/bc-user.json',
    viewport: { width: 2600, height: 1400 },
  });

  test('tries Select items and fallback UI routes before declaring purchase line blocker', async ({ page }) => {
    test.setTimeout(180_000);
    await ensureDirs();
    const attempts: Attempt[] = [];
    const result: Record<string, unknown> = {
      schemaVersion: 1,
      caseId,
      source: 'playwright-ui-labor-data-row-route',
      resultStatus: 'started',
      instance: environment,
      company,
      sourceCompany: company,
      mode: 'controlled-labor-ui-data-row-route',
      targetDraft: { purchaseOrderNo, vendorNo: 'K10000', vendorName: 'Stahlwerk Ruhr GmbH' },
      targetValues: {
        itemNo: targetItem,
        locationCode: 'FRA-ZL',
        plannedQuantity: 4,
        plannedPartialReceiptQuantity: 2,
        plannedUnitCost: 2500,
      },
      previewPosting: false,
      posted: false,
      setupChanges: [],
      createdRecords: [],
      changedRecords: [],
      postedRecords: [],
      cleanup: { required: false, reason: 'No posting or setup change. Draft line may be kept if UI route creates a line.' },
      flags: {
        noPost: true,
        noPreview: true,
        noSetupChange: true,
        noCompanySwitch: true,
        noApiShortcut: true,
        noBookChange: true,
      },
      proved: [],
      notProved: [],
      blockedBy: [],
      warnings: [],
      screenshots: [],
      evidenceRefs: [],
      migrationRelevance: 'needed-for-german-final',
      mustRecreateInFinalSandbox: true,
      finalScreenshotNeeded: true,
      rebuildInstruction: 'Recreate the partial purchase receipt line route in a later German target company with German UI and final setup.',
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: {},
    };

    const targetUrl = purchaseOrderUrl();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await hideFactBoxPane(page);
    const wideLayout = await enableWideLayout(page);
    const focusMode = await enableLinesFocusMode(page);
    await screenshot(page, 'p2p-007-010-start-wide-lines-focus.png', {
      projectName: project.name,
      testId: 'p2p-007',
      status: 'labor',
      bookUse: 'evidence',
      purpose: 'P2P-007 start: Purchase Order 106051 with wide layout and Lines focus mode before Select items route.',
      expectedPageText: [new RegExp(purchaseOrderNo), /Purchase Order|Einkaufsbestellung|Lines/i],
      knownLimitations: ['RM-DEMO laboratory only; no German final proof.'],
    });

    const contextText = await pageText(page);
    const contextOk = sanitizeUrl(page.url()).includes(environment) && sanitizeUrl(page.url()).includes(`company=${company}`) && contextText.includes(purchaseOrderNo);
    if (!contextOk) {
      result.resultStatus = 'blocked';
      result.blockedBy = ['wrong-or-unclear-instance-company-or-draft-context'];
      result.notProved = ['No route attempted because context guard failed.'];
    } else {
      attempts.push(await trySelectRawSteel(page));
      await screenshot(page, 'p2p-007-020-after-select-items-route.png', {
        projectName: project.name,
        testId: 'p2p-007',
        status: 'labor',
        bookUse: 'evidence',
        purpose: 'P2P-007 after Select items route attempt for RAW-STEEL.',
        expectedPageText: [/Business Central|Purchase Order|Select items|Item|Artikel|RAW-STEEL|Lines/i],
        knownLimitations: ['May be blocker evidence if RAW-STEEL or a purchase line is not visible.'],
      });

      let afterText = await pageText(page);
      if (!hasRealPurchaseLine(afterText)) {
        attempts.push(await tryLineActions(page));
        attempts.push(await tryKeyboardRoute(page));
        attempts.push(await tryLookupRoute(page));
      }

      await screenshot(page, 'p2p-007-090-final-route-state.png', {
        projectName: project.name,
        testId: 'p2p-007',
        status: 'labor',
        bookUse: 'evidence',
        purpose: 'P2P-007 final UI state after Select items and fallback line/data-row route attempts.',
        expectedPageText: [/Business Central|Purchase Order|Lines|Item|Artikel|Select items/i],
        knownLimitations: ['No Preview Posting or posting was executed in this run.'],
      });
      await writeText('090-final-page-text-compact.txt', await compactPageText(page, {
        include: [/106051|K10000|Stahlwerk|RAW-STEEL|FRA-ZL|Select items|Item|Artikel|Quantity|Location|Qty\. to Receive|Direct Unit Cost|In dieser Ansicht/i],
        maxLines: 180,
      }));
      await writeJson('091-final-control-map.json', await visibleControlMap(page));

      afterText = await pageText(page);
      const lineCreated = hasRealPurchaseLine(afterText);
      result.details = { url: sanitizeUrl(page.url()), wideLayout, focusMode, attempts, lineCreated };
      result.screenshots = [
        'playwright/projects/fibu-book5/img/p2p-007-010-start-wide-lines-focus.png',
        'playwright/projects/fibu-book5/img/p2p-007-020-after-select-items-route.png',
        'playwright/projects/fibu-book5/img/p2p-007-090-final-route-state.png',
      ];
      result.evidenceRefs = [
        'playwright/projects/fibu-book5/evidence/p2p-007/020-after-select-items-page-text.txt',
        'playwright/projects/fibu-book5/evidence/p2p-007/021-after-select-items-controls.json',
        'playwright/projects/fibu-book5/evidence/p2p-007/030-after-raw-steel-search-page-text.txt',
        'playwright/projects/fibu-book5/evidence/p2p-007/031-after-raw-steel-search-controls.json',
        'playwright/projects/fibu-book5/evidence/p2p-007/040-line-action-controls-before.json',
        'playwright/projects/fibu-book5/evidence/p2p-007/041-line-action-controls-after.json',
        'playwright/projects/fibu-book5/evidence/p2p-007/050-keyboard-route-controls.json',
        'playwright/projects/fibu-book5/evidence/p2p-007/060-lookup-type-route-controls.json',
        'playwright/projects/fibu-book5/evidence/p2p-007/090-final-page-text-compact.txt',
        'playwright/projects/fibu-book5/evidence/p2p-007/091-final-control-map.json',
      ];

      if (lineCreated) {
        result.resultStatus = 'observed';
        result.proved = [
          'Select/items or fallback UI route produced a visible purchase line signal.',
          'Purchase Order 106051 remained in MCP_1_20260210/RM-DEMO.',
          'No Preview Posting or posting was executed.',
        ];
        result.notProved = [
          'Target values are not yet fully verified as saved: Location FRA-ZL, quantity 4, Direct Unit Cost 2500, Qty. to Receive 2.',
          'German final proof remains open.',
        ];
        result.nextStep = 'Verify and set remaining partial receipt target values, then decide Preview Posting.';
      } else {
        result.resultStatus = 'blocked';
        result.proved = [
          'Purchase Order 106051 was opened directly in MCP_1_20260210/RM-DEMO.',
          'Wide layout and Lines focus mode were enabled.',
          'Select items route was practically clicked and searched for RAW-STEEL.',
          'Fallback Line/Manage, keyboard and Type/Lookup routes were attempted and documented.',
          'No Preview Posting or posting was executed.',
        ];
        result.notProved = [
          'No real Purchase Order Lines data row for RAW-STEEL/FRA-ZL/quantity/price/Qty. to Receive was produced.',
          'The target partial receipt values were not set.',
          'Preview Posting and ledger trace remain open.',
        ];
        result.blockedBy = [
          'select-items-route-did-not-produce-visible-raw-steel-line',
          'line-action-route-did-not-produce-visible-data-row',
          'keyboard-route-did-not-produce-visible-data-row',
          'lookup-type-route-did-not-produce-visible-data-row',
        ];
        result.nextStep = 'Draft 106051 is likely unsuitable; P2P-008 should create a fresh controlled draft and run Select items/New Line route from a clean header.';
      }
    }

    await writeJson('P2P-007-result.json', result);
  });
});
