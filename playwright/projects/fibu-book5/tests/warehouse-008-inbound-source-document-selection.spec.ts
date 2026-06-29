import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'warehouse-008';

type ActionCandidate = {
  text: string;
  ariaLabel: string;
  title: string;
  role: string;
  tagName: string;
  visible: boolean;
  box: { x: number; y: number; width: number; height: number };
  score: number;
};

function warehouseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function warehouseReceiptUrl() {
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

function compactWarehouseText(text: string) {
  const interesting = /Warehouse Receipts?|Receipt|Source Document|Get Source|Use Filters|Purchase|Order|Vendor|K10000|RAW-STEEL|FRA-ZL|Location Code|Assigned User ID|Qty|Quantity|Post Receipt|Error|Fehler|OK|Cancel|Abbrechen|Select|Auswaehlen/i;
  const selected = normalizeLines(text).filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-008-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
    '',
    ...selected.slice(0, 220)
  ].join('\n');
}

function isDangerousAction(label: string) {
  return /Post Receipt|^Post$|Buchen|Delete|Loeschen|L.schen|Ship|Invoice|Preview Posting/i.test(label);
}

async function actionCandidates(page: Page, pattern: RegExp) {
  const candidates: ActionCandidate[] = [];
  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .locator('button,a,[role="button"],[role="menuitem"],[aria-label],[title]')
      .evaluateAll((nodes, patternSource) => {
        const pattern = new RegExp(patternSource, 'i');
        return nodes
          .map((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const ariaLabel = element.getAttribute('aria-label') || '';
            const title = element.getAttribute('title') || '';
            const role = element.getAttribute('role') || '';
            const tagName = element.tagName;
            const combined = `${text} ${ariaLabel} ${title}`;
            const visible = rect.width > 0 && rect.height > 0;
            let score = 0;
            if (pattern.test(text)) score -= 20;
            if (pattern.test(ariaLabel)) score -= 16;
            if (pattern.test(title)) score -= 12;
            if (/button|menuitem/i.test(role) || /BUTTON|A/i.test(tagName)) score -= 6;
            if (/Post Receipt|^Post$|Buchen|Delete|Ship|Invoice|Preview/i.test(combined)) score += 100;
            return {
              text,
              ariaLabel,
              title,
              role,
              tagName,
              visible,
              box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              score
            };
          })
          .filter((entry) => entry.visible && pattern.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
          .sort((left, right) => left.score - right.score)
          .slice(0, 20);
      }, pattern.source)
      .catch(() => []);
    candidates.push(...frameCandidates);
  }

  return candidates.sort((left, right) => left.score - right.score);
}

async function clickActionCandidate(page: Page, pattern: RegExp) {
  const candidates = await actionCandidates(page, pattern);
  const safe = candidates.find((candidate) => !isDangerousAction(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`));
  if (!safe) return { clicked: false, candidates, clickedCandidate: null };

  for (const frame of page.frames()) {
    const clicked = await frame
      .locator('button,a,[role="button"],[role="menuitem"],[aria-label],[title]')
      .evaluateAll((nodes, target) => {
        const candidates = nodes
          .map((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const ariaLabel = element.getAttribute('aria-label') || '';
            const title = element.getAttribute('title') || '';
            const role = element.getAttribute('role') || '';
            const tagName = element.tagName;
            return { element, text, ariaLabel, title, role, tagName, rect };
          })
          .filter((entry) =>
            entry.text === target.text &&
            entry.ariaLabel === target.ariaLabel &&
            entry.title === target.title &&
            entry.role === target.role &&
            entry.tagName === target.tagName &&
            Math.abs(entry.rect.x - target.box.x) < 2 &&
            Math.abs(entry.rect.y - target.box.y) < 2
          );
        const found = candidates[0]?.element;
        if (!found) return false;
        found.click();
        return true;
      }, safe)
      .catch(() => false);
    if (clicked) {
      await page.waitForTimeout(1800);
      return { clicked: true, candidates, clickedCandidate: safe };
    }
  }

  return { clicked: false, candidates, clickedCandidate: safe };
}

test('WAREHOUSE-008 Source Document route kontrolliert oeffnen ohne Posting', async ({ page }) => {
  await page.goto(warehouseReceiptUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const beforeText = await pageText(page);
  const beforeButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const beforeSourceCandidates = await actionCandidates(page, /Source Document|Get Source|Use Filters/i);
  const beforePostCandidates = await actionCandidates(page, /Post Receipt|^Post$|Buchen/i);
  const employeeBlockerVisible = /You must first set up user .* as a warehouse employee/i.test(beforeText);
  const pageContextVisible = /Warehouse Receipts?|Location Code|Assigned User ID/i.test(beforeText + ' ' + beforeButtons.join(' '));

  let newClicked = false;
  let sourceDocumentOpened = false;
  let sourceActionResult = { clicked: false, candidates: beforeSourceCandidates, clickedCandidate: null as ActionCandidate | null };
  let postActionClicked = false;
  let stoppedBeforeSelection = false;

  if (!employeeBlockerVisible && beforeSourceCandidates.length === 0 && beforeButtons.some((button) => /^Neu$|^New$/i.test(button))) {
    const newResult = await clickActionCandidate(page, /^Neu$|^New$/i);
    newClicked = newResult.clicked;
    await page.waitForTimeout(2200);
  }

  const afterNewText = await pageText(page);
  const sourceCandidatesAfterNew = await actionCandidates(page, /Source Document|Get Source|Use Filters/i);
  if (!employeeBlockerVisible && sourceCandidatesAfterNew.length > 0) {
    sourceActionResult = await clickActionCandidate(page, /Source Document|Get Source|Use Filters/i);
    sourceDocumentOpened = sourceActionResult.clicked;
  }

  const afterSourceText = await pageText(page);
  const afterSourceButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const selectionOrFilterVisible = /Source Documents?|Get Source|Use Filters|Purchase Order|Vendor|Document Type|Document No\.|Location Code|OK|Cancel|Abbrechen/i.test(afterSourceText + ' ' + afterSourceButtons.join(' '));
  const okOrSelectVisible = afterSourceButtons.some((button) => /^OK$|^Select$|Auswaehlen|Auswählen/i.test(button));
  stoppedBeforeSelection = sourceDocumentOpened && selectionOrFilterVisible;

  const resultStatus = !employeeBlockerVisible && pageContextVisible && (sourceDocumentOpened || newClicked || sourceCandidatesAfterNew.length > 0)
    ? 'observed'
    : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-inbound-source-document-selection',
    caseId: 'WAREHOUSE-008-INBOUND-SOURCE-DOCUMENT-SELECTION',
    source: 'playwright-ui-source-document-route',
    resultStatus,
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    companySwitched: false,
    draftCreated: newClicked,
    apiShortcut: false,
    page: {
      pageId: 7332,
      url: page.url(),
      employeeBlockerVisible,
      pageContextVisible
    },
    beforeButtons,
    beforeSourceCandidates,
    beforePostCandidates,
    newClicked,
    sourceCandidatesAfterNew,
    sourceActionResult,
    sourceDocumentOpened,
    selectionOrFilterVisible,
    okOrSelectVisible,
    stoppedBeforeSelection,
    postActionClicked,
    proves: [
      employeeBlockerVisible
        ? 'Warehouse Receipt is still blocked by Warehouse Employee setup.'
        : 'Warehouse Receipt no longer shows the Warehouse Employee blocker.',
      pageContextVisible
        ? 'Warehouse Receipt page context is visible.'
        : 'Warehouse Receipt page context is not sufficiently visible.',
      sourceDocumentOpened
        ? 'A scoped Source Document action was opened without clicking Post Receipt.'
        : 'No Source Document action was opened in this run.'
    ],
    doesNotProve: [
      'No source document was selected or confirmed.',
      'No Warehouse Receipt was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    blockedBy: resultStatus === 'observed' ? [] : [
      employeeBlockerVisible ? 'warehouse-employee-blocker-still-visible' : 'source-document-action-not-opened'
    ],
    warnings: [
      newClicked
        ? 'A controlled Warehouse Receipt draft/page state may have been opened. No posting or source document confirmation occurred.'
        : 'No Warehouse Receipt draft was created.',
      okOrSelectVisible
        ? 'OK/Select was visible after opening the route and was intentionally not clicked.'
        : 'No OK/Select confirmation was used.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noSourceDocumentConfirmation: true
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction: 'In German final sandbox, repeat Source Document route on Warehouse Receipt with a final German purchase source document before posting.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof must confirm source document selection, Warehouse Receipt posting, Put-away and ledger trace.',
    finalScreenshotNeeded: true,
    nextCase: resultStatus === 'observed'
      ? 'WAREHOUSE-009-INBOUND-SOURCE-DOCUMENT-CANDIDATE-SELECTION'
      : 'WAREHOUSE-009-SOURCE-DOCUMENT-ROUTE-BLOCKER-REVIEW',
    nextStep: resultStatus === 'observed'
      ? 'WAREHOUSE-009: identify a concrete purchase source document and select it without posting, then decide receipt-posting gate.'
      : 'WAREHOUSE-009: refine Source Document action route or draft lifecycle before selecting any source document.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-source-action-text.txt'), compactWarehouseText(beforeText));
  await writeJsonEvidence(warehouseEvidencePath('020-before-source-action-buttons.json'), beforeButtons);
  await writeJsonEvidence(warehouseEvidencePath('030-before-source-action-candidates.json'), beforeSourceCandidates);
  await writeJsonEvidence(warehouseEvidencePath('040-post-action-candidates-not-clicked.json'), beforePostCandidates);
  await writeTextEvidence(warehouseEvidencePath('050-after-source-action-text.txt'), compactWarehouseText(afterSourceText));
  await writeJsonEvidence(warehouseEvidencePath('060-after-source-action-buttons.json'), afterSourceButtons);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-008-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-008-INBOUND-SOURCE-DOCUMENT-SELECTION.md'),
    [
      '# WAREHOUSE-008 Inbound Source Document Selection',
      '',
      'Status: `labor`, `ui-first`, `source-document-route`, `no-posting`, `not-final`.',
      '',
      '## Ziel',
      '',
      'WAREHOUSE-008 prueft, ob die Warehouse-Receipt-Seite nach dem Warehouse-Employee-Fit eine Source-Document-Route anbietet. Es wird kein Source Document bestaetigt und `Post Receipt` wird nicht geklickt.',
      '',
      '## Ergebnis',
      '',
      `Status: \`${result.resultStatus}\``,
      `Warehouse-Employee-Blocker sichtbar: ${employeeBlockerVisible ? 'ja' : 'nein'}`,
      `Warehouse-Receipt-Kontext sichtbar: ${pageContextVisible ? 'ja' : 'nein'}`,
      `New/Neu geklickt: ${newClicked ? 'ja' : 'nein'}`,
      `Source-Document-Aktion geoeffnet: ${sourceDocumentOpened ? 'ja' : 'nein'}`,
      `OK/Select sichtbar und nicht geklickt: ${okOrSelectVisible ? 'ja' : 'nein'}`,
      '',
      '## Grenze',
      '',
      '- Kein Source Document bestaetigt.',
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
      '# WAREHOUSE-008 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `WAREHOUSE-008-result.json` | JSON-Ergebnis | Source-Document-Routenstatus auf Warehouse Receipt | keine Auswahl/Buchung | labor-route |',
      '| `010-before-source-action-text.txt` | kompakter Seitentext | Warehouse-Receipt-Kontext vor Aktion | keinen Rohsnapshot | ui-evidence |',
      '| `030-before-source-action-candidates.json` | Kandidatenliste | moegliche Source-Document-Aktionen | keine Aktion wurde zwingend bestaetigt | ui-evidence |',
      '| `040-post-action-candidates-not-clicked.json` | Kandidatenliste | sichtbare Post-Aktionen als Risiko | Post wurde nicht geklickt | safety-evidence |',
      '| `050-after-source-action-text.txt` | kompakter Seitentext | Kontext nach Source-Document-Routenversuch | keine Bestaetigung | ui-evidence |',
      ''
    ].join('\n')
  );

  expect(postActionClicked).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(employeeBlockerVisible).toBe(false);
});
