import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'warehouse-005';

const targetFields = [
  'Require Receive',
  'Require Shipment',
  'Require Put-away'
] as const;

const protectedFields = [
  'Require Pick',
  'Bin Mandatory',
  'Directed Put-away and Pick'
] as const;

type FieldName = (typeof targetFields)[number] | (typeof protectedFields)[number];

type FieldProbe = {
  label: FieldName;
  visible: boolean;
  checked: boolean | null;
  labelBox?: { x: number; y: number; width: number; height: number };
  checkboxBox?: { x: number; y: number; width: number; height: number };
};

function warehouseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function locationCardUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '5703');
  url.searchParams.set('filter', "'Location'.'Code' IS 'FRA-ZL'");
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

function compactWarehouseText(text: string) {
  const interesting = /FRA-ZL|Location Card|Warehouse|Bin|Mandatory|Require|Receive|Shipment|Put-away|Pick|Directed|No Warehouse Handling/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|cacheLocation/i.test(line))
    .filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-Setup-Fit-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${lines.length}.`,
    '',
    ...lines.slice(0, 160)
  ].join('\n');
}

async function clickSafeExpander(page: Page, label: RegExp) {
  const scopes = [page, ...page.frames()];
  for (const scope of scopes) {
    const candidate = scope.getByRole('button', { name: label }).first();
    if (await candidate.isVisible({ timeout: 500 }).catch(() => false)) {
      await candidate.click({ timeout: 2000 }).catch(() => undefined);
      await page.waitForTimeout(800);
      return true;
    }
  }

  return false;
}

async function openExpandedLocationCard(page: Page) {
  await page.goto(locationCardUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);
  const expandActions = {
    showMoreClicked: await clickSafeExpander(page, /Mehr anzeigen|Show more/i),
    warehouseFastTabClicked: await clickSafeExpander(page, /^Warehouse$/i),
    binPoliciesFastTabClicked: await clickSafeExpander(page, /^Bin Policies$/i)
  };
  await page.waitForTimeout(500);
  return expandActions;
}

async function clickEditMode(page: Page) {
  const scopes = [page, ...page.frames()];
  for (const scope of scopes) {
    const candidate = scope.locator('button[title*="Änderungen"], button[title*="changes"], button[title*="Change"]').first();
    if (await candidate.isVisible({ timeout: 500 }).catch(() => false)) {
      await candidate.click({ timeout: 3000 });
      await page.waitForTimeout(1500);
      return true;
    }
  }

  return false;
}

async function probeFields(page: Page, labels: readonly FieldName[]) {
  const probes: FieldProbe[] = [];
  for (const label of labels) {
    let probe: FieldProbe = { label, visible: false, checked: null };
    for (const frame of page.frames()) {
      const labelLocator = frame.getByText(label, { exact: true }).first();
      const labelBox = await labelLocator.boundingBox({ timeout: 500 }).catch(() => null);
      if (!labelBox) continue;

      const controls = await frame
        .locator('[role="checkbox"][aria-checked]')
        .evaluateAll((nodes, box) =>
          nodes
            .map((node) => {
              const rect = node.getBoundingClientRect();
              return {
                checked: node.getAttribute('aria-checked') === 'true',
                box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                score: Math.abs(rect.y - box.y) + Math.abs(rect.x - (box.x + 320))
              };
            })
            .filter((entry) => Math.abs(entry.box.y - box.y) < 24 && entry.box.x > box.x)
            .sort((left, right) => left.score - right.score),
          labelBox
        )
        .catch(() => []);

      const control = controls[0];
      probe = {
        label,
        visible: true,
        checked: control?.checked ?? null,
        labelBox,
        checkboxBox: control?.box
      };
      break;
    }
    probes.push(probe);
  }
  return probes;
}

async function setFieldTrue(page: Page, probe: FieldProbe) {
  if (probe.checked !== false) return false;

  for (const frame of page.frames()) {
    const labelBox = await frame.getByText(probe.label, { exact: true }).first().boundingBox({ timeout: 500 }).catch(() => null);
    if (!labelBox) continue;

    const checkboxIndex = await frame
      .locator('[role="checkbox"][aria-checked]')
      .evaluateAll((nodes, box) => {
        const candidates = nodes
          .map((node, index) => {
            const rect = node.getBoundingClientRect();
            return {
              index,
              checked: node.getAttribute('aria-checked'),
              x: rect.x,
              y: rect.y,
              score: Math.abs(rect.y - box.y) + Math.abs(rect.x - (box.x + 320))
            };
          })
          .filter((entry) => entry.checked === 'false' && entry.x > box.x && Math.abs(entry.y - box.y) < 70)
          .sort((left, right) => left.score - right.score);
        return candidates[0]?.index ?? -1;
      }, labelBox)
      .catch(() => -1);

    if (checkboxIndex >= 0) {
      const checkbox = frame.locator('[role="checkbox"][aria-checked]').nth(checkboxIndex);
      if (!(await checkbox.isEnabled({ timeout: 500 }).catch(() => false))) {
        return false;
      }
      await checkbox.click({ timeout: 3000 });
      await page.waitForTimeout(1200);
      return true;
    }
  }

  return false;
}

function renderMarkdown(result: Record<string, any>) {
  const beforeRows = result.beforeValues.map((entry: FieldProbe) => `| ${entry.label} | ${entry.visible ? 'ja' : 'nein'} | ${entry.checked === null ? 'unklar' : entry.checked ? 'ja' : 'nein'} |`).join('\n');
  const afterRows = result.afterValues.map((entry: FieldProbe) => `| ${entry.label} | ${entry.visible ? 'ja' : 'nein'} | ${entry.checked === null ? 'unklar' : entry.checked ? 'ja' : 'nein'} |`).join('\n');
  return [
    '# WAREHOUSE-005 FRA-ZL Guarded Setup-Fit',
    '',
    'Status: `labor`, `ui-first`, `setup-fit`, `no-posting`, `not-final`.',
    '',
    '## Ziel',
    '',
    'WAREHOUSE-005 setzt nur die sichtbaren Basisfelder `Require Receive`, `Require Shipment` und `Require Put-away`. `Require Pick`, `Bin Mandatory` und `Directed Put-away and Pick` bleiben bewusst unangetastet, weil sie eine eigene Outbound-/Bin-/WMS-Route brauchen.',
    '',
    '## Vorher',
    '',
    '| Feld | Sichtbar | Aktiv |',
    '|---|---|---|',
    beforeRows,
    '',
    '## Nachher',
    '',
    '| Feld | Sichtbar | Aktiv |',
    '|---|---|---|',
    afterRows,
    '',
    '## Entscheidung',
    '',
    result.decision,
    '',
    '## Grenze',
    '',
    '- Keine Warehouse-Buchung.',
    '- Keine Warehouse-Belege.',
    '- Keine Bins angelegt.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('WAREHOUSE-005 FRA-ZL Basis-Warehouse-Felder guarded fitten', async ({ page }) => {
  const expandActions = await openExpandedLocationCard(page);
  const textBefore = await pageText(page);
  expect(textBefore, 'Location Card FRA-ZL muss sichtbar sein.').toMatch(/FRA-ZL|Location Card/i);

  const beforeValues = await probeFields(page, [...targetFields, ...protectedFields]);
  const editModeClicked = await clickEditMode(page);
  const protectedBefore = beforeValues.filter((entry) => protectedFields.includes(entry.label as any));

  const changedFields: string[] = [];
  const blockedTargetFields: string[] = [];
  for (const field of targetFields) {
    let currentValues = await probeFields(page, [field]);
    let probe = currentValues.find((entry) => entry.label === field);

    if (!probe?.visible || probe.checked === null) {
      currentValues = await probeFields(page, [...targetFields, ...protectedFields]);
      probe = currentValues.find((entry) => entry.label === field);
    }

    if (!probe?.visible || probe.checked === null) {
      blockedTargetFields.push(field);
      continue;
    }

    if (probe.checked === false) {
      if (probe && (await setFieldTrue(page, probe))) {
        changedFields.push(field);
        await page.waitForTimeout(1200);
      }
    }
  }

  await page.waitForTimeout(1500);
  const afterValues = await probeFields(page, [...targetFields, ...protectedFields]);
  const targetAfterOk = targetFields.every((field) => afterValues.find((entry) => entry.label === field)?.checked === true);
  const protectedAfter = afterValues.filter((entry) => protectedFields.includes(entry.label as any));
  const protectedUnchanged = protectedFields.every((field) => {
    const before = protectedBefore.find((entry) => entry.label === field)?.checked;
    const after = protectedAfter.find((entry) => entry.label === field)?.checked;
    return before === after;
  });

  const textAfter = await pageText(page);
  const inboundSetupOk = targetAfterOk && protectedUnchanged;
  const resultStatus = inboundSetupOk ? 'observed' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-fra-zl-guarded-setup-fit',
    caseId: 'WAREHOUSE-005-FRA-ZL-GUARDED-SETUP-FIT',
    source: 'playwright-ui-setup-fit',
    resultStatus,
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged: changedFields.length > 0,
    companySwitched: false,
    draftCreated: false,
    apiShortcut: false,
    location: {
      code: 'FRA-ZL',
      pageId: 5703,
      pageUrl: page.url()
    },
    expandActions,
    editModeClicked,
    targetFields,
    protectedFields,
    beforeValues,
    changedFields,
    blockedTargetFields,
    afterValues,
    targetAfterOk,
    inboundSetupOk,
    protectedUnchanged,
    decision: inboundSetupOk
      ? 'FRA-ZL is fitted for basic Warehouse receive/shipment/put-away fields without enabling Require Pick, Bin Mandatory or Directed Put-away and Pick.'
      : 'FRA-ZL Warehouse setup-fit did not reach all inbound target field values; do not start Warehouse documents.',
    proves: [
      'FRA-ZL Location Card opened directly in RM-DEMO.',
      'Visible target fields were read before and after the setup-fit attempt.',
      inboundSetupOk
        ? 'Require Receive, Require Shipment and Require Put-away are active after the run.'
        : 'The run stopped short of proving the inbound Warehouse fields active.',
      protectedUnchanged
        ? 'Require Pick, Bin Mandatory and Directed Put-away and Pick were not changed.'
        : 'Protected Outbound/Bin/WMS fields changed unexpectedly and require review.'
    ],
    doesNotProve: [
      'No Warehouse document was created.',
      'No Warehouse receipt/shipment/pick/put-away was posted.',
      'No Bin setup is proven.',
      'No German final Warehouse proof.'
    ],
    blockedBy: inboundSetupOk ? [] : ['warehouse-inbound-field-fit-not-fully-proven'],
    warnings: [
      'This is RM-DEMO labor setup evidence only.',
      'Do not start Warehouse posting without a separate document preflight and trace plan.'
    ],
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction: 'Repeat the same before/after Warehouse field proof in the German final sandbox before creating Warehouse documents.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    finalScreenshotNeeded: true,
    nextCase: inboundSetupOk ? 'WAREHOUSE-006-INBOUND-WAREHOUSE-RECEIPT-PREFLIGHT' : 'WAREHOUSE-006-WAREHOUSE-SETUP-FIT-BLOCKER-REVIEW',
    nextStep: inboundSetupOk
      ? 'WAREHOUSE-006: create a no-post inbound Warehouse Receipt/Put-away preflight; no posting until document and trace gates are explicit.'
      : 'WAREHOUSE-006: review why the visible inbound field setup-fit did not persist before any Warehouse document.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-compact-page-text.txt'), compactWarehouseText(textBefore));
  await writeJsonEvidence(warehouseEvidencePath('020-before-field-values.json'), beforeValues);
  await writeJsonEvidence(warehouseEvidencePath('030-changed-fields.json'), changedFields);
  await writeTextEvidence(warehouseEvidencePath('040-after-compact-page-text.txt'), compactWarehouseText(textAfter));
  await writeJsonEvidence(warehouseEvidencePath('050-after-field-values.json'), afterValues);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-005-result.json'), result);
  await writeTextEvidence(warehouseEvidencePath('WAREHOUSE-005-FRA-ZL-GUARDED-SETUP-FIT.md'), renderMarkdown(result));
  await writeTextEvidence(
    warehouseEvidencePath('README.md'),
    [
      '# WAREHOUSE-005 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `WAREHOUSE-005-result.json` | JSON-Ergebnis | strukturierter Vorher/Nachher-Fit fuer sichtbare FRA-ZL Warehouse-Felder | keinen Warehouse-Prozess | labor-setup-fit |',
      '| `020-before-field-values.json` | Feldwerte vorher | aktuelle Checkbox-Werte vor dem Fit | keine fachliche Buchungswirkung | setup-before |',
      '| `050-after-field-values.json` | Feldwerte nachher | Checkbox-Werte nach dem Fit | keine Warehouse-Belege | setup-after |',
      '| `WAREHOUSE-005-FRA-ZL-GUARDED-SETUP-FIT.md` | Lernnotiz | warum Basis-Warehouse-Felder und Bin/WMS-Felder getrennt werden | keinen deutschen Finalnachweis | labor |',
      ''
    ].join('\n')
  );

  expect(protectedUnchanged, 'Protected Bin/WMS fields must not change in WAREHOUSE-005.').toBe(true);
  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(inboundSetupOk, 'Require Receive, Require Shipment and Require Put-away must be active after WAREHOUSE-005.').toBe(true);
});
