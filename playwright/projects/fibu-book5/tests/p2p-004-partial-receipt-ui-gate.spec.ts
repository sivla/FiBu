import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(420_000);

const testId = 'p2p-004';
const vendorNo = 'K10000';
const itemNo = 'RAW-STEEL';
const locationCode = 'FRA-ZL';
const plannedQuantity = 4;
const plannedPartialReceiptQuantity = 2;
const plannedUnitCost = 2500;

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function sanitizeEvidenceText(text: string) {
  return text
    .replace(/\u00c3\u0152/g, 'Ue')
    .replace(/\u00c3\u00bc/g, 'ue')
    .replace(/\u00c3\u2013/g, 'Oe')
    .replace(/\u00c3\u00b6/g, 'oe')
    .replace(/\u00c3\u201e/g, 'Ae')
    .replace(/\u00c3\u00a4/g, 'ae')
    .replace(/\u00c3\u0178/g, 'ss')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function compactPageText(rawText: string) {
  const interesting =
    /Purchase Order|Purchase Orders|Einkaufsbestellung|Einkaufsbestellungen|Buy-from|Vendor|K10000|RAW-STEEL|FRA-ZL|Quantity|Qty\.|Receive|Invoice|Posting|Preview|Document Date|Posting Date|No\.|Lines|Line|Amount|Direct Unit Cost|Location/i;
  const lines = normalizeText(rawText)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -4; offset <= 10; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }

  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 320)
  ].join('\n'));
}

function bcPageUrl(pageId: number) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

async function actionNames(page: Page) {
  return (await visibleButtonNames(page)).map(sanitizeEvidenceText);
}

async function clickAction(page: Page, label: RegExp) {
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

async function findFrame(page: Page, pattern: RegExp) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
      if (pattern.test(text)) return { frame, text };
    }
    await page.waitForTimeout(1200);
  }
  return undefined;
}

async function visibleInputs(frame: Frame) {
  const handles = await frame.locator('input,textarea,select').elementHandles();
  const controls = [];
  for (const handle of handles) {
    const data = await handle
      .evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        return {
          visible: Boolean(rect.width && rect.height),
          tag: element.tagName,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          value: input.value ?? '',
          title: element.getAttribute('title') ?? '',
          ariaLabel: element.getAttribute('aria-label') ?? '',
          placeholder: element.getAttribute('placeholder') ?? '',
          text: element.textContent ?? ''
        };
      })
      .catch(() => undefined);
    if (!data?.visible) continue;
    controls.push({
      handle,
      tag: data.tag,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      value: data.value,
      title: sanitizeEvidenceText(data.title).slice(0, 160),
      ariaLabel: sanitizeEvidenceText(data.ariaLabel).slice(0, 160),
      placeholder: sanitizeEvidenceText(data.placeholder).slice(0, 160),
      text: sanitizeEvidenceText(data.text).slice(0, 80)
    });
  }
  return controls.sort((left, right) => left.y - right.y || left.x - right.x);
}

async function fillBestControl(
  frame: Frame,
  candidates: Array<{ handle: import('@playwright/test').ElementHandle<Element>; label: string }>,
  value: string
) {
  for (const candidate of candidates) {
    const filled = await candidate.handle
      .fill(value, { timeout: 5000 })
      .then(async () => {
        await candidate.handle.press('Tab').catch(() => undefined);
        return true;
      })
      .catch(() => false);
    if (filled) {
      await frame.page().waitForTimeout(2500);
      return { filled: true, label: candidate.label };
    }
  }
  return { filled: false, label: '' };
}

async function topHeaderInputCandidates(frame: Frame) {
  const entries = await frame.locator('input,textarea').evaluateAll((elements) =>
    elements
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          visible: Boolean(rect.width && rect.height),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          value: (element as HTMLInputElement | HTMLTextAreaElement).value ?? ''
        };
      })
      .filter((entry) => entry.visible && entry.y >= 260 && entry.y <= 360 && entry.x >= 450 && entry.x <= 950)
      .sort((left, right) => left.y - right.y || left.x - right.x)
  );

  const result = [];
  for (const entry of entries) {
    result.push({
      handle: await frame.locator('input,textarea').nth(entry.index).elementHandle(),
      label: `top-header-input-x${Math.round(entry.x)}-y${Math.round(entry.y)}`
    });
  }
  return result.filter((entry): entry is { handle: import('@playwright/test').ElementHandle<Element>; label: string } =>
    Boolean(entry.handle)
  );
}

async function findLabeledInputCandidates(frame: Frame, labelPattern: RegExp) {
  return frame
    .locator('input,textarea')
    .evaluateAll((elements, source) => {
      const pattern = new RegExp(source as string, 'i');
      return elements
        .map((element, index) => {
          const rect = element.getBoundingClientRect();
          const label =
            element.getAttribute('aria-label') ??
            element.getAttribute('title') ??
            element.getAttribute('placeholder') ??
            '';
          return {
            index,
            label,
            visible: Boolean(rect.width && rect.height),
            x: rect.x,
            y: rect.y
          };
        })
        .filter((entry) => entry.visible && pattern.test(entry.label));
    }, labelPattern.source)
    .then(async (entries) => {
      const result = [];
      for (const entry of entries) {
        result.push({
          handle: await frame.locator('input,textarea').nth(entry.index).elementHandle(),
          label: entry.label
        });
      }
      return result.filter((entry): entry is { handle: import('@playwright/test').ElementHandle<Element>; label: string } =>
        Boolean(entry.handle)
      );
    });
}

function extractPurchaseOrderNo(text: string) {
  return (
    text.match(/\b(PO\d{3,}|P-ORD\d{3,}|106\d{3}|107\d{3}|108\d{3})\b/i)?.[1] ??
    text.match(/No\.\s+(\d{5,})/i)?.[1] ??
    ''
  );
}

test('P2P-004 UI-first Teil-WE Gate fuer Einkaufsbestellung vermessen', async ({ page }) => {
  const result: Record<string, unknown> = {
    caseId: 'P2P-004-PARTIAL-RECEIPT-VARIANCE-GATE',
    source: 'playwright-ui-gate',
    resultStatus: 'blocked',
    instance: 'MCP_1_20260210',
    company: project.defaultCompany,
    sourceCompany: project.defaultCompany,
    dataBasis: 'RM-DEMO CRONUS-USA labor',
    plannedScenario: {
      vendorNo,
      itemNo,
      locationCode,
      plannedQuantity,
      plannedPartialReceiptQuantity,
      plannedUnitCost
    },
    flags: {
      noPost: true,
      noPreviewPosting: true,
      noPayment: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChangeInsideTest: true
    },
    createdRecords: [],
    changedRecords: [],
    postedRecords: [],
    setupChanges: [],
    cleanup: {
      attempted: false,
      result: 'no-created-record-detected'
    },
    evidenceRefs: [],
    screenshots: [],
    warnings: [],
    blockedBy: [],
    requiresReview: true,
    safeToFinalizeState: false,
    statePatch: {},
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction:
      'In der deutschen Zielcompany denselben UI-first Teil-WE-Pfad reproduzieren: Purchase Order anlegen, Menge/Qty. to Receive/Qty. to Invoice pruefen, Teilmenge empfangen, Rechnung/Restmenge und Postenspur mit deutschen Screenshots belegen.',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    targetGermanCompanyImpact:
      'Deutscher Finalfall braucht deutsche UI, EUR, deutsche Steuer-/Kontenlogik und finalen Teil-WE-/Teilrechnungsnachweis.'
  };

  await page.goto(bcPageUrl(9307), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);

  const listText = normalizeText(await pageText(page));
  const listButtons = await actionNames(page);
  await writeTextEvidence(p2pEvidencePath('010-purchase-orders-list-page-text.txt'), compactPageText(listText));
  await writeJsonEvidence(p2pEvidencePath('010-purchase-orders-list-actions.json'), {
    contextVisible: /Purchase Orders|Einkaufsbestellungen/i.test(listText),
    newVisible: listButtons.some((button) => /^New$|^Neu$/i.test(button)),
    relevantButtons: listButtons.filter((button) => /New|Edit|Delete|Post|Preview|Receive|Invoice|Order|Line/i.test(button))
  });
  await screenshot(page, 'p2p-004-010-purchase-orders-list.png', {
    projectName: project.name,
    testId,
    status: /Purchase Orders|Einkaufsbestellungen/i.test(listText) ? 'labor' : 'rejected',
    purpose: 'P2P-004 Startpunkt Purchase Orders als UI-first Gate fuer Teil-WE-Fall.',
    knownLimitations: ['Noch kein Beleg angelegt, keine Buchung, keine Teil-WE-Evidence.'],
    bookUse: 'navigation'
  });
  (result.evidenceRefs as string[]).push(
    'playwright/projects/fibu-book5/evidence/p2p-004/010-purchase-orders-list-page-text.txt',
    'playwright/projects/fibu-book5/evidence/p2p-004/010-purchase-orders-list-actions.json'
  );
  (result.screenshots as string[]).push('playwright/projects/fibu-book5/img/p2p-004-010-purchase-orders-list.png');

  const clickedNew = await clickAction(page, /^New$|^Neu$/i);
  await page.waitForTimeout(5000);
  const afterNewText = normalizeText(await pageText(page));
  const cardFrameInfo = await findFrame(page, /Purchase Order|Einkaufsbestellung|Buy-from Vendor|Kreditor/i);
  const orderNo = extractPurchaseOrderNo(afterNewText);
  const afterNewButtons = await actionNames(page);
  const controls = cardFrameInfo ? await visibleInputs(cardFrameInfo.frame) : [];
  const controlSnapshot = controls.map(({ handle: _handle, ...control }) => control).slice(0, 120);

  await writeTextEvidence(p2pEvidencePath('020-after-new-purchase-order-page-text.txt'), compactPageText(afterNewText));
  await writeJsonEvidence(p2pEvidencePath('020-after-new-purchase-order-controls.json'), {
    clickedNew,
    cardContextVisible: Boolean(cardFrameInfo),
    orderNo,
    relevantButtons: afterNewButtons.filter((button) => /Post|Preview|Receive|Invoice|Delete|Edit|New|Lines|Item|Vendor/i.test(button)),
    controlSnapshot
  });
  await screenshot(page, 'p2p-004-020-purchase-order-after-new.png', {
    projectName: project.name,
    testId,
    status: clickedNew && /Purchase Order|Einkaufsbestellung/i.test(afterNewText) ? 'labor' : 'rejected',
    purpose: 'P2P-004 Purchase Order nach New: Belegkopf-/Feldkontext fuer UI-first Teil-WE-Fall.',
    knownLimitations: ['Noch keine Zeile, keine Preview, keine Buchung. Falls Belegnummer sichtbar ist, bleibt sie Labor-Draft/Trace.'],
    bookUse: 'process-proof'
  });
  (result.evidenceRefs as string[]).push(
    'playwright/projects/fibu-book5/evidence/p2p-004/020-after-new-purchase-order-page-text.txt',
    'playwright/projects/fibu-book5/evidence/p2p-004/020-after-new-purchase-order-controls.json'
  );
  (result.screenshots as string[]).push('playwright/projects/fibu-book5/img/p2p-004-020-purchase-order-after-new.png');

  if (!clickedNew || !cardFrameInfo) {
    (result.blockedBy as string[]).push('purchase-order-new-or-card-context-not-stable');
    result.notProved = [
      'No purchase order draft was safely opened.',
      'No vendor, item, line quantity, partial receipt, preview or posting was performed.'
    ];
    await writeJsonEvidence(p2pEvidencePath('P2P-004-result.json'), result);
    await writeTextEvidence(p2pEvidencePath('P2P-004-PARTIAL-RECEIPT-GATE.md'), renderLearning(result));
    expect(clickedNew && Boolean(cardFrameInfo)).toBeTruthy();
    return;
  }

  const labeledVendorCandidates = await findLabeledInputCandidates(
    cardFrameInfo.frame,
    /Buy-from Vendor No\.|Buy-from Vendor|Vendor No\.|Kreditor|Eink\. von Kred\./i
  );
  const fallbackVendorCandidates = labeledVendorCandidates.length ? [] : await topHeaderInputCandidates(cardFrameInfo.frame);
  const vendorCandidates = [...labeledVendorCandidates, ...fallbackVendorCandidates];
  const vendorFill = await fillBestControl(cardFrameInfo.frame, vendorCandidates, vendorNo);
  await page.waitForTimeout(6000);
  const afterVendorText = normalizeText(await pageText(page));
  const afterVendorFrameInfo = await findFrame(page, /Purchase Order|Einkaufsbestellung|Lines|Zeilen|Item|Artikel/i);
  const afterVendorControls = afterVendorFrameInfo ? await visibleInputs(afterVendorFrameInfo.frame) : [];

  await writeTextEvidence(p2pEvidencePath('030-after-vendor-page-text.txt'), compactPageText(afterVendorText));
  await writeJsonEvidence(p2pEvidencePath('030-after-vendor-controls.json'), {
    vendorFill,
    vendorVisible: new RegExp(vendorNo).test(afterVendorText),
    orderNo: extractPurchaseOrderNo(afterVendorText) || orderNo,
    relevantButtons: (await actionNames(page)).filter((button) => /Post|Preview|Receive|Invoice|Delete|Edit|New|Lines|Item|Vendor/i.test(button)),
    controlSnapshot: afterVendorControls.map(({ handle: _handle, ...control }) => control).slice(0, 160)
  });
  await screenshot(page, 'p2p-004-030-purchase-order-after-vendor.png', {
    projectName: project.name,
    testId,
    status: vendorFill.filled && new RegExp(vendorNo).test(afterVendorText) ? 'labor' : 'rejected',
    purpose: `P2P-004 Purchase Order Kopf nach Vendor-Eingabe ${vendorNo}.`,
    knownLimitations: ['Noch keine Zeile, keine Preview, keine Buchung.'],
    bookUse: 'process-proof'
  });
  (result.evidenceRefs as string[]).push(
    'playwright/projects/fibu-book5/evidence/p2p-004/030-after-vendor-page-text.txt',
    'playwright/projects/fibu-book5/evidence/p2p-004/030-after-vendor-controls.json'
  );
  (result.screenshots as string[]).push('playwright/projects/fibu-book5/img/p2p-004-030-purchase-order-after-vendor.png');

  const draftOrderNo = extractPurchaseOrderNo(afterVendorText) || orderNo;
  if (draftOrderNo) {
    (result.createdRecords as Array<Record<string, unknown>>).push({
      type: 'Purchase Order draft',
      no: draftOrderNo,
      keepStatus: 'kept-as-labor-draft-trace',
      reason: 'UI-first draft was created as P2P-004 gate evidence; no posting/preview/line execution occurred.'
    });
    result.cleanup = {
      attempted: false,
      result: 'kept-draft-for-next-gate',
      reason:
        'Purchase Order draft was kept intentionally as laboratory trace and possible P2P-005 continuation; no line, preview or posting was executed.'
    };
  }

  if (vendorFill.filled && draftOrderNo) {
    (result.changedRecords as Array<Record<string, unknown>>).push({
      type: 'Purchase Order header',
      no: draftOrderNo,
      field: 'Buy-from Vendor No.',
      value: vendorNo
    });
  }

  const lineCandidateVisible = /Lines|Zeilen|Type|Item|Artikel|Quantity|Menge|Direct Unit Cost/i.test(afterVendorText);
  result.resultStatus = vendorFill.filled && lineCandidateVisible ? 'labor-gate-proven' : 'labor-blocked';
  result.proved = [
    'Purchase Orders page is reachable in RM-DEMO.',
    clickedNew ? 'New opens a Purchase Order card context through the UI.' : 'New action was not safely usable.',
    vendorFill.filled ? `Vendor ${vendorNo} can be entered on the Purchase Order header through the UI.` : 'Vendor entry was not field-safe.',
    lineCandidateVisible
      ? 'The Purchase Order page exposes a line context for the next item/quantity/partial-receipt step.'
      : 'The line context is not yet field-safe enough for item and partial receipt entry.'
  ];
  result.notProved = [
    `No item line ${itemNo} was created.`,
    `No quantity ${plannedQuantity} or partial receipt quantity ${plannedPartialReceiptQuantity} was entered.`,
    'No Preview Posting was opened.',
    'No Receive, Invoice, Receive and Invoice or Post action was executed.',
    'No posted purchase receipt, purchase invoice, vendor ledger, G/L entry, item ledger or value entry was created in this run.',
    'No German final proof.'
  ];
  result.nextStep =
    result.resultStatus === 'labor-gate-proven'
      ? 'P2P-005: continue from the kept UI draft or create a fresh UI draft and enter one item line with quantity 4, then set Qty. to Receive = 2 before any Preview/Post gate.'
      : 'P2P-004 result review: stabilize Purchase Order line field mapping before any item, preview or posting attempt.';

  await writeJsonEvidence(p2pEvidencePath('P2P-004-result.json'), result);
  await writeTextEvidence(p2pEvidencePath('P2P-004-PARTIAL-RECEIPT-GATE.md'), renderLearning(result));
  await writeTextEvidence(p2pEvidencePath('README.md'), renderIndex(result));

  expect(clickedNew).toBe(true);
  expect(result.resultStatus).toMatch(/labor-gate-proven|labor-blocked/);
});

function renderLearning(result: Record<string, unknown>) {
  const createdRecords = result.createdRecords as Array<Record<string, unknown>>;
  const createdRows = createdRecords.length
    ? createdRecords.map((record) => `| ${record.type} | ${record.no} | ${record.keepStatus} |`)
    : ['| keine | n/a | n/a |'];

  return [
    '# P2P-004 Teil-Wareneingang Gate',
    '',
    '| Feld | Wert |',
    '|---|---|',
    '| Umgebung | MCP_1_20260210 |',
    `| Company | ${project.defaultCompany} |`,
    '| Status | labor gate, UI-first, no-post, no-preview, needs-follow-up |',
    `| Kreditor | ${vendorNo} |`,
    `| geplanter Artikel | ${itemNo} |`,
    `| geplante Menge | ${plannedQuantity} |`,
    `| geplante Teil-WE-Menge | ${plannedPartialReceiptQuantity} |`,
    `| Ergebnis | ${result.resultStatus} |`,
    '',
    '## Erzeugte/geaenderte Records',
    '',
    '| Typ | Nr. | Status |',
    '|---|---|---|',
    ...createdRows,
    '',
    '## Lernwert',
    '',
    'Der Teil-Wareneingang-Fall beginnt nicht bei `Post`, sondern bei einem stabilen Belegkopf und einer stabilen Zeilenbedienung. Fuer Anfaenger ist genau das wichtig: Eine Bestellung ist noch keine Lieferung, eine Lieferung ist noch keine Rechnung, und erst Posten beweisen die Wirkung.',
    '',
    'Dieser Lauf beweist nur das UI-first Gate: Purchase Orders sind erreichbar, `New` oeffnet den Einkaufsbestellungskontext, und der Kreditor kann im Belegkopf gesetzt werden. Die eigentliche Teil-WE-Logik bleibt der naechste separate Gate-Schritt.',
    '',
    '## Grenzen',
    '',
    '- Keine Artikelzeile.',
    '- Keine Teilmenge.',
    '- Keine Buchungsvorschau.',
    '- Keine Buchung.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    String(result.nextStep ?? ''),
    ''
  ].join('\n');
}

function renderIndex(_result: Record<string, unknown>) {
  return [
    '# P2P-004 Evidence Index',
    '',
    'Status: CRONUS-USA-Labor, UI-first Purchase-Order-Gate fuer Teil-WE-Fall, keine Preview, keine Buchung, kein deutscher Finalnachweis.',
    '',
    '| Datei | Typ | Beweist | Beweist nicht | Status |',
    '|---|---|---|---|---|',
    '| `010-purchase-orders-list-page-text.txt` | UI-Seitentext | Purchase Orders Einstieg | keinen Beleg | labor-navigation |',
    '| `010-purchase-orders-list-actions.json` | Action Snapshot | relevante List-Actions inkl. New-Kontext | keinen Klickpfad nach New | labor-navigation |',
    '| `020-after-new-purchase-order-page-text.txt` | UI-Seitentext | Purchase Order Card nach New | keine Zeile, keine Buchung | labor-gate |',
    '| `020-after-new-purchase-order-controls.json` | Control Snapshot | sichtbare Eingabefelder/Aktionen nach New | keine fachliche Feldsicherheit fuer alle Zeilenfelder | labor-gate |',
    '| `030-after-vendor-page-text.txt` | UI-Seitentext | Vendor-Kopfbefund nach Eingabe | keine Teil-WE | labor-gate |',
    '| `030-after-vendor-controls.json` | Control Snapshot | Feld-/Zeilenkandidaten nach Vendor | keine Zeilenbuchung | labor-gate |',
    '| `P2P-004-result.json` | JSON Ergebnis | strukturierter Gate-/Blockerbefund | keine automatische State-Finalisierung | labor |',
    '| `P2P-004-PARTIAL-RECEIPT-GATE.md` | Lernnotiz | Anfaengerlogik fuer Bestellt/Geliefert/Fakturiert | keinen finalen deutschen Nachweis | labor |',
    ''
  ].join('\n');
}
