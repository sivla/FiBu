import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import 'dotenv/config';
import { dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'warehouse-007';
const targetUserId = 'KAJETAN.KALICKI';
const targetLocation = 'FRA-ZL';

function warehouseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function warehouseEmployeeUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '7328');
  url.searchParams.set(
    'filter',
    `'Warehouse Employee'.'User ID' IS '${targetUserId}' AND 'Warehouse Employee'.'Location Code' IS '${targetLocation}'`
  );
  return url.toString();
}

function warehouseReceiptCardUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '7332');
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

function normalizeLines(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|cacheLocation/i.test(line));
}

function compactText(text: string) {
  const interesting = /Warehouse Employee|User ID|Location Code|Default|KAJETAN|FRA-ZL|You must first set up|Receipt|Error|Fehler|Source Document|Document|New|Neu/i;
  const lines = normalizeLines(text).filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-007-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${lines.length}.`,
    '',
    ...lines.slice(0, 180)
  ].join('\n');
}

function targetVisible(text: string) {
  return new RegExp(targetUserId.replace('.', '\\.'), 'i').test(text) && new RegExp(targetLocation, 'i').test(text);
}

async function clickSafeButton(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const button = scope.getByRole('button', { name: label }).first();
    if (await button.isVisible({ timeout: 700 }).catch(() => false)) {
      await button.click({ timeout: 3000 });
      await page.waitForTimeout(1200);
      return true;
    }
  }
  return false;
}

async function clickEditMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const candidate = scope.locator('button[title*="Änderungen"], button[title*="changes"], button[title*="Change"]').first();
    if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
      await candidate.click({ timeout: 3000 });
      await page.waitForTimeout(1200);
      return true;
    }
  }
  return false;
}

async function visibleInputs(frame: Frame) {
  const locators: Locator[] = [];
  const inputs = frame.locator('input:not([type="hidden"]), textarea, [contenteditable="true"]');
  const count = await inputs.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const input = inputs.nth(index);
    if (await input.isVisible({ timeout: 200 }).catch(() => false)) {
      locators.push(input);
    }
  }
  return locators;
}

async function fillByAccessibleName(page: Page, labels: RegExp[], value: string) {
  for (const frame of page.frames()) {
    for (const label of labels) {
      const candidates = [
        frame.getByRole('textbox', { name: label }).first(),
        frame.locator(`input[aria-label*="${value === targetUserId ? 'User' : 'Location'}" i]`).first(),
        frame.locator(`input[title*="${value === targetUserId ? 'User' : 'Location'}" i]`).first()
      ];
      for (const candidate of candidates) {
        if (await candidate.isVisible({ timeout: 500 }).catch(() => false)) {
          await candidate.fill(value, { timeout: 3000 }).catch(async () => {
            await candidate.click({ timeout: 2000 });
            await page.keyboard.press('Control+A');
            await page.keyboard.type(value);
          });
          await page.keyboard.press('Tab');
          await page.waitForTimeout(900);
          return true;
        }
      }
    }
  }
  return false;
}

async function fillFirstLikelyGridInputs(page: Page) {
  for (const frame of page.frames()) {
    const inputs = await visibleInputs(frame);
    const filtered: Locator[] = [];
    for (const input of inputs) {
      const box = await input.boundingBox({ timeout: 200 }).catch(() => null);
      const label = await input.getAttribute('aria-label').catch(() => '') ?? '';
      const title = await input.getAttribute('title').catch(() => '') ?? '';
      const value = await input.inputValue().catch(() => '');
      if (!box || box.width < 20 || /search|tell me|filter/i.test(label + title)) continue;
      if (value && !/KAJETAN|FRA-ZL/i.test(value)) continue;
      filtered.push(input);
    }

    if (filtered.length >= 2) {
      await filtered[0].fill(targetUserId, { timeout: 3000 });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(700);
      await filtered[1].fill(targetLocation, { timeout: 3000 });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(1200);
      return true;
    }
  }
  return false;
}

async function ensureWarehouseEmployee(page: Page) {
  await page.goto(warehouseEmployeeUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const beforeText = await pageText(page);
  const existsBefore = targetVisible(beforeText);
  if (existsBefore) {
    return {
      beforeText,
      existsBefore,
      editModeClicked: false,
      newClicked: false,
      fillByName: false,
      fillByGridFallback: false,
      afterText: beforeText,
      existsAfter: true
    };
  }

  const editModeClicked = await clickEditMode(page);
  const newClicked = await clickSafeButton(page, /^New$|^Neu$/i);
  await page.waitForTimeout(1200);

  let fillByName = false;
  let fillByGridFallback = false;
  let afterText = await pageText(page);

  if (!targetVisible(afterText)) {
    fillByName = await fillByAccessibleName(page, [/User ID|Benutzer-ID|Benutzer/i], targetUserId);
    fillByName = (await fillByAccessibleName(page, [/Location Code|Lagerortcode|Lagerort/i], targetLocation)) || fillByName;
    await page.waitForTimeout(1200);
    afterText = await pageText(page);
  }

  if (!targetVisible(afterText)) {
    fillByGridFallback = await fillFirstLikelyGridInputs(page);
    await page.waitForTimeout(1800);
    afterText = await pageText(page);
  }

  return {
    beforeText,
    existsBefore,
    editModeClicked,
    newClicked,
    fillByName,
    fillByGridFallback,
    afterText,
    existsAfter: targetVisible(afterText)
  };
}

test('WAREHOUSE-007 Warehouse Employee fuer FRA-ZL guarded fitten', async ({ page }) => {
  const employee = await ensureWarehouseEmployee(page);
  await writeTextEvidence(warehouseEvidencePath('010-warehouse-employee-before-text.txt'), compactText(employee.beforeText));
  await writeTextEvidence(warehouseEvidencePath('020-warehouse-employee-after-text.txt'), compactText(employee.afterText));

  await page.goto(warehouseReceiptCardUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const receiptText = await pageText(page);
  const buttons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 120);
  const employeeBlockerStillVisible = /You must first set up user .* as a warehouse employee/i.test(receiptText);
  const receiptRouteImproved = !employeeBlockerStillVisible && /Warehouse Receipt|Receipt|Source Document|Document/i.test(receiptText + ' ' + buttons.join(' '));
  const setupChanged = !employee.existsBefore && employee.existsAfter;
  const resultStatus = employee.existsAfter && !employeeBlockerStillVisible ? 'observed' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-employee-setup-fit',
    caseId: 'WAREHOUSE-007-WAREHOUSE-EMPLOYEE-SETUP-FIT',
    source: 'playwright-ui-setup-fit',
    resultStatus,
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged,
    companySwitched: false,
    draftCreated: false,
    apiShortcut: false,
    target: {
      userId: targetUserId,
      locationCode: targetLocation,
      pageId: 7328
    },
    employee,
    receiptProbe: {
      pageId: 7332,
      url: page.url(),
      employeeBlockerStillVisible,
      receiptRouteImproved,
      buttons
    },
    proves: [
      employee.existsAfter
        ? `Warehouse Employee setup for ${targetUserId} + ${targetLocation} is visible after the guarded UI run.`
        : `Warehouse Employee setup for ${targetUserId} + ${targetLocation} is not yet visible.`,
      employeeBlockerStillVisible
        ? 'Warehouse Receipt still reports the Warehouse Employee blocker.'
        : 'The previous Warehouse Employee blocker is no longer visible on the Warehouse Receipt route probe.'
    ],
    doesNotProve: [
      'No Warehouse Receipt source document was selected.',
      'No Warehouse Receipt document was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    blockedBy: resultStatus === 'observed' ? [] : [
      employee.existsAfter ? 'warehouse-receipt-route-still-blocked-after-employee-setup' : 'warehouse-employee-setup-not-visible-after-ui-fit'
    ],
    warnings: [
      'This is RM-DEMO laboratory setup evidence only.',
      'The run may create a Warehouse Employee setup record but performs no posting and no source document selection.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noSetupBeyondWarehouseEmployee: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction: 'In German final sandbox, create or verify the final user/location Warehouse Employee setup before Warehouse Receipt testing.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final Warehouse proof must repeat employee setup, inbound source document selection, Warehouse Receipt posting and ledger trace.',
    finalScreenshotNeeded: true,
    nextCase: resultStatus === 'observed'
      ? 'WAREHOUSE-008-INBOUND-SOURCE-DOCUMENT-SELECTION'
      : 'WAREHOUSE-008-WAREHOUSE-EMPLOYEE-SETUP-BLOCKER-REVIEW',
    nextStep: resultStatus === 'observed'
      ? 'WAREHOUSE-008: use Warehouse Receipt route to attempt controlled source-document selection without posting.'
      : 'WAREHOUSE-008: diagnose why Warehouse Employee setup did not clear the route blocker.'
  };

  await writeTextEvidence(warehouseEvidencePath('030-warehouse-receipt-after-employee-text.txt'), compactText(receiptText));
  await writeJsonEvidence(warehouseEvidencePath('040-warehouse-receipt-after-employee-buttons.json'), buttons);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-007-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-007-WAREHOUSE-EMPLOYEE-SETUP-FIT.md'),
    [
      '# WAREHOUSE-007 Warehouse Employee Setup-Fit',
      '',
      'Status: `labor`, `ui-first`, `setup-fit`, `no-posting`, `not-final`.',
      '',
      '## Ziel',
      '',
      `Der Warehouse-Receipt-Blocker aus WAREHOUSE-006 verlangt, dass Benutzer \`${targetUserId}\` zuerst als Warehouse Employee eingerichtet wird. WAREHOUSE-007 prueft und fitten genau diese Kombination fuer Lagerort \`${targetLocation}\`.`,
      '',
      '## Ergebnis',
      '',
      `Status: \`${result.resultStatus}\``,
      `War vorher vorhanden: ${employee.existsBefore ? 'ja' : 'nein'}`,
      `Ist nachher sichtbar: ${employee.existsAfter ? 'ja' : 'nein'}`,
      `Setup geaendert: ${setupChanged ? 'ja' : 'nein'}`,
      `Warehouse-Employee-Blocker danach sichtbar: ${employeeBlockerStillVisible ? 'ja' : 'nein'}`,
      '',
      '## Grenze',
      '',
      '- Keine Source-Document-Auswahl.',
      '- Kein Warehouse Receipt Posting.',
      '- Kein Put-away.',
      '- Keine Postenspur.',
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
      '# WAREHOUSE-007 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `WAREHOUSE-007-result.json` | JSON-Ergebnis | Warehouse-Employee-Fit fuer Benutzer/Lagerort und Blockerstatus danach | keine Warehouse-Buchung | labor-setup-fit |',
      '| `010-warehouse-employee-before-text.txt` | kompakter Seitentext | Zustand vor Setup-Fit | keinen Rohsnapshot | setup-before |',
      '| `020-warehouse-employee-after-text.txt` | kompakter Seitentext | sichtbarer Zustand nach Setup-Fit | keine Source-Document-Auswahl | setup-after |',
      '| `030-warehouse-receipt-after-employee-text.txt` | kompakter Seitentext | ob der alte Warehouse-Employee-Blocker noch sichtbar ist | keine Buchung | route-probe |',
      '| `040-warehouse-receipt-after-employee-buttons.json` | Buttonliste | sichtbare Aktionssignale nach Setup-Fit | keine Aktion wurde ausgefuehrt | ui-evidence |',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(employee.existsAfter, 'Warehouse Employee setup target must be visible after WAREHOUSE-007.').toBe(true);
});
