import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(240_000);

const testId = 'warehouse-017';

type UiCandidate = {
  text: string;
  ariaLabel: string;
  title: string;
  role: string;
  tagName: string;
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

function compactText(text: string) {
  const interesting = /Warehouse Receipt|Source Documents - Inbound|Source Document|Purchase|Order|Vendor|Document Type|Document No\.|Source No\.|External Document|Destination|Expected Receipt|Put-away|Pick No\.|RE\d+|10\d{4}|K\d{5}|RAW|FRA-ZL|OK|Select|Cancel|Abbrechen|Post Receipt|Error|Fehler/i;
  const selected = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|cacheLocation|shouldAttachOauthTokens|TokenFactory/i.test(line))
    .filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-017-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
    '',
    ...selected.slice(0, 320)
  ].join('\n');
}

function isDangerous(label: string) {
  return /Post Receipt|^Post$|Buchen|Delete|Loeschen|L.schen|Ship|Invoice|Preview Posting/i.test(label);
}

async function buttonCandidates(page: Page, pattern: RegExp) {
  const found: UiCandidate[] = [];
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
            let score = 0;
            if (pattern.test(text)) score -= 20;
            if (pattern.test(ariaLabel)) score -= 16;
            if (pattern.test(title)) score -= 12;
            if (/button|menuitem/i.test(role) || /BUTTON|A/i.test(tagName)) score -= 8;
            if (/FORM|BODY|HTML|MAIN/i.test(tagName)) score += 80;
            if (/Post Receipt|^Post$|Buchen|Delete|Ship|Invoice|Preview/i.test(combined)) score += 120;
            return {
              text,
              ariaLabel,
              title,
              role,
              tagName,
              box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              visible: rect.width > 0 && rect.height > 0,
              score
            };
          })
          .filter((entry) => entry.visible && pattern.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
          .sort((left, right) => left.score - right.score)
          .slice(0, 60);
      }, pattern.source)
      .catch(() => []);
    found.push(...frameCandidates.map(({ visible, ...entry }) => entry));
  }
  return found.sort((left, right) => left.score - right.score);
}

async function clickButton(page: Page, pattern: RegExp, allowRiskyConfirmation = false) {
  const all = await buttonCandidates(page, pattern);
  const target = all.find((candidate) => {
    const label = `${candidate.text} ${candidate.ariaLabel} ${candidate.title}`;
    if (!allowRiskyConfirmation && /^OK$|^Select$|Auswaehlen|Ausw.hlen/i.test(label)) return false;
    return !isDangerous(label) && !/FORM|BODY|HTML|MAIN/i.test(candidate.tagName);
  });
  if (!target) return { clicked: false, candidates: all, clickedCandidate: null as UiCandidate | null };

  for (const frame of page.frames()) {
    const clicked = await frame
      .locator('button,a,[role="button"],[role="menuitem"],[aria-label],[title]')
      .evaluateAll((nodes, targetCandidate) => {
        const match = nodes
          .map((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            return {
              element,
              text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              role: element.getAttribute('role') || '',
              tagName: element.tagName,
              x: rect.x,
              y: rect.y
            };
          })
          .find((entry) =>
            entry.text === targetCandidate.text &&
            entry.ariaLabel === targetCandidate.ariaLabel &&
            entry.title === targetCandidate.title &&
            entry.role === targetCandidate.role &&
            entry.tagName === targetCandidate.tagName &&
            Math.abs(entry.x - targetCandidate.box.x) < 2 &&
            Math.abs(entry.y - targetCandidate.box.y) < 2
          );
        if (!match) return false;
        match.element.click();
        return true;
      }, target)
      .catch(() => false);
    if (clicked) {
      await page.waitForTimeout(2200);
      return { clicked: true, candidates: all, clickedCandidate: target };
    }
  }
  return { clicked: false, candidates: all, clickedCandidate: target };
}

async function clickExactVisibleText(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    const clicked = await frame
      .locator('body *')
      .evaluateAll((nodes, patternSource) => {
        const pattern = new RegExp(patternSource, 'i');
        const target = nodes
          .map((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const role = element.getAttribute('role') || '';
            const tagName = element.tagName;
            return { element, rect, text, role, tagName };
          })
          .filter((entry) =>
            entry.rect.width > 0 &&
            entry.rect.height > 0 &&
            pattern.test(entry.text) &&
            !/BODY|FORM|HTML|MAIN/i.test(entry.tagName) &&
            !/Post|Buchen|Delete|Ship|Invoice|Preview|OK|Select/i.test(entry.text)
          )
          .sort((left, right) => {
            const leftScore = (/button|menuitem/i.test(left.role) || /BUTTON|A/i.test(left.tagName) ? 0 : 5) + left.text.length;
            const rightScore = (/button|menuitem/i.test(right.role) || /BUTTON|A/i.test(right.tagName) ? 0 : 5) + right.text.length;
            return leftScore - rightScore;
          })[0]?.element;
        if (!target) return false;
        (target.closest('button,a,[role="button"],[role="menuitem"]') as HTMLElement | null ?? target).click();
        return true;
      }, pattern.source)
      .catch(() => false);
    if (clicked) {
      await page.waitForTimeout(2200);
      return true;
    }
  }
  return false;
}

async function sourceRows(page: Page) {
  const rows = [];
  for (const frame of page.frames()) {
    const frameRows = await frame
      .locator('[role="row"], tr, [aria-rowindex]')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const ariaLabel = element.getAttribute('aria-label') || '';
            const role = element.getAttribute('role') || '';
            const rowIndex = element.getAttribute('aria-rowindex') || '';
            return {
              text,
              ariaLabel,
              role,
              rowIndex,
              box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              visible: rect.width > 0 && rect.height > 0
            };
          })
          .filter((entry) => entry.visible && /Purchase|Order|Vendor|Document|10\d{4}|K\d{5}|RAW|FRA-ZL/i.test(`${entry.text} ${entry.ariaLabel}`))
          .slice(0, 80)
      )
      .catch(() => []);
    rows.push(...frameRows.map(({ visible, ...entry }) => entry));
  }
  return rows;
}

async function selectFirstClearSourceRow(page: Page) {
  for (const frame of page.frames()) {
    const selected = await frame
      .locator('[role="row"], tr, [aria-rowindex]')
      .evaluateAll((nodes) => {
        const entries = nodes
          .map((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const ariaLabel = element.getAttribute('aria-label') || '';
            return { element, rect, text, ariaLabel };
          })
          .filter((entry) =>
            entry.rect.width > 0 &&
            entry.rect.height > 0 &&
            /Purchase|Order|Vendor|10\d{4}|K\d{5}|RAW|FRA-ZL/i.test(`${entry.text} ${entry.ariaLabel}`) &&
            !/Expected Receipt Date|Source Document|Document No\.|External Document|Destination|OK|Cancel|Abbrechen/i.test(`${entry.text} ${entry.ariaLabel}`)
          );
        const target = entries[0]?.element;
        if (!target) return false;
        target.click();
        return true;
      })
      .catch(() => false);
    if (selected) {
      await page.waitForTimeout(1200);
      return true;
    }
  }
  return false;
}

function extractReceipts(text: string) {
  return Array.from(new Set([...text.matchAll(/\bRE\d{6}\b/g)].map((match) => match[0])));
}

test('WAREHOUSE-017 Source Document Candidate Select No Post', async ({ page }) => {
  await page.goto(warehouseReceiptUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const beforeText = await pageText(page);
  const newClicked = await clickExactVisibleText(page, /^New$|^Neu$/i);
  const afterNewText = await pageText(page);
  const afterNewButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const visibleReceiptNosAfterNew = extractReceipts(afterNewText + ' ' + afterNewButtons.join(' '));
  const draftContextVisible = /Warehouse Receipt|No\.|Location Code|Assigned User ID|Post Receipt/i.test(afterNewText + ' ' + afterNewButtons.join(' '));

  const prepareClick = await clickButton(page, /^Prepare$|Prepare|Vorbereiten/i);
  const moreClick = await clickButton(page, /Weitere Optionen|More options|More/i);
  const getSourceClick = await clickButton(page, /^Get Source Documents|Get Source Documents\.\.\./i);
  const dialogText = await pageText(page);
  const dialogButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const sourceDialogVisible = /Source Documents - Inbound|Source Documents?|Expected Receipt Date|Source Document|External Document|Destination No\./i.test(dialogText + ' ' + dialogButtons.join(' '));
  const rowsBeforeSelection = await sourceRows(page);
  const clearCandidateRows = rowsBeforeSelection.filter((row) => /Purchase|Order|10\d{4}|K\d{5}|RAW|FRA-ZL/i.test(`${row.text} ${row.ariaLabel}`));
  const selectedRow = clearCandidateRows.length > 0 ? await selectFirstClearSourceRow(page) : false;
  const rowsAfterSelection = await sourceRows(page);
  const okButtons = await buttonCandidates(page, /^OK$|^Select$|Auswaehlen|Ausw.hlen/i);
  const okVisible = okButtons.length > 0 || dialogButtons.some((button) => /^OK$|^Select$|Auswaehlen|Ausw.hlen/i.test(button));
  const okClicked = false;
  const afterSelectionText = await pageText(page);
  const afterSelectionButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const postCandidates = await buttonCandidates(page, /Post Receipt|^Post$|Buchen/i);
  const resultStatus = newClicked && draftContextVisible && getSourceClick.clicked && sourceDialogVisible
    ? 'observed'
    : 'blocked';
  const blockedBy = resultStatus === 'observed' ? [] : [
    !newClicked ? 'fresh-warehouse-receipt-draft-not-created' :
    !draftContextVisible ? 'fresh-warehouse-receipt-draft-context-not-visible' :
    !getSourceClick.clicked ? 'get-source-documents-not-clicked' :
    'source-documents-inbound-dialog-not-visible'
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-document-candidate-select-no-post',
    caseId: 'WAREHOUSE-017-SOURCE-DOCUMENT-CANDIDATE-SELECT-NO-POST',
    source: 'playwright-ui-source-document-candidate-select-no-post',
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
    draftKept: newClicked,
    apiShortcut: false,
    newClicked,
    visibleReceiptNosAfterNew,
    receiptAnchorStatus: visibleReceiptNosAfterNew.length === 1 ? 'single-receipt-visible' : 'ambiguous-multiple-receipts-visible',
    draftContextVisible,
    prepareClick,
    moreClick,
    getSourceClick,
    sourceDialogVisible,
    dialogButtons,
    rowsBeforeSelection,
    clearCandidateRows,
    selectedRow,
    rowsAfterSelection,
    okVisible,
    okClicked,
    postCandidates,
    postActionClicked: false,
    blockedBy,
    proves: [
      newClicked ? 'A fresh Warehouse Receipt draft route was triggered.' : 'No fresh Warehouse Receipt draft route was triggered.',
      draftContextVisible ? 'Warehouse Receipt draft context is visible.' : 'Warehouse Receipt draft context is not visible.',
      getSourceClick.clicked ? 'Get Source Documents was clicked.' : 'Get Source Documents was not clicked.',
      sourceDialogVisible ? 'Source Documents - Inbound context is visible.' : 'Source Documents - Inbound context is not visible.',
      clearCandidateRows.length > 0 ? 'At least one concrete-looking source document row is visible.' : 'No concrete-looking source document row is visible.',
      selectedRow ? 'A visible source row was selected without clicking OK.' : 'No source row was selected.',
      okVisible ? 'OK/Select is visible and was intentionally not clicked.' : 'OK/Select is not visible.'
    ],
    doesNotProve: [
      'No source document was confirmed with OK/Select.',
      'No Warehouse Receipt was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    warnings: [
      'OK/Select was intentionally not clicked in this run.',
      visibleReceiptNosAfterNew.length === 1
        ? 'A single receipt number was visible after New.'
        : 'Receipt anchoring remains ambiguous because multiple receipt numbers were visible.',
      'Post Receipt candidates were recorded and intentionally not clicked.'
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
    rebuildInstruction: 'In German final sandbox, select and confirm a final German source document, then post Warehouse Receipt only in a separate approved case with full trace.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof must select source document, post Warehouse Receipt, handle Put-away and trace Warehouse/Item/Value entries.',
    finalScreenshotNeeded: true,
    nextCase: resultStatus === 'observed' && clearCandidateRows.length > 0
      ? 'WAREHOUSE-018-SOURCE-DOCUMENT-CONFIRMATION-GATE'
      : 'WAREHOUSE-018-WAREHOUSE-SOURCE-DOCUMENT-FILTER-OR-PARK',
    nextStep: resultStatus === 'observed' && clearCandidateRows.length > 0
      ? 'WAREHOUSE-018: decide whether OK confirmation is safe; no posting until receipt lines are proven.'
      : 'WAREHOUSE-018: use filter route or park source selection if no concrete source rows exist.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-new-text.txt'), compactText(beforeText));
  await writeTextEvidence(warehouseEvidencePath('020-after-new-text.txt'), compactText(afterNewText));
  await writeJsonEvidence(warehouseEvidencePath('030-after-new-buttons.json'), afterNewButtons);
  await writeTextEvidence(warehouseEvidencePath('040-dialog-text.txt'), compactText(dialogText));
  await writeJsonEvidence(warehouseEvidencePath('050-dialog-buttons.json'), dialogButtons);
  await writeJsonEvidence(warehouseEvidencePath('060-source-rows-before-selection.json'), rowsBeforeSelection);
  await writeJsonEvidence(warehouseEvidencePath('070-clear-candidate-rows.json'), clearCandidateRows);
  await writeJsonEvidence(warehouseEvidencePath('080-ok-select-candidates-not-clicked.json'), okButtons);
  await writeTextEvidence(warehouseEvidencePath('090-after-selection-text.txt'), compactText(afterSelectionText));
  await writeJsonEvidence(warehouseEvidencePath('100-after-selection-buttons.json'), afterSelectionButtons);
  await writeJsonEvidence(warehouseEvidencePath('110-source-rows-after-selection.json'), rowsAfterSelection);
  await writeJsonEvidence(warehouseEvidencePath('120-post-candidates-not-clicked.json'), postCandidates);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-017-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-017-SOURCE-DOCUMENT-CANDIDATE.md'),
    [
      '# WAREHOUSE-017 Source Document Candidate',
      '',
      'Status: `labor`, `ui-first`, `source-dialog`, `no-posting`, `not-final`.',
      '',
      `Fresh Draft New geklickt: ${newClicked ? 'ja' : 'nein'}`,
      `Receipt-Anker: ${result.receiptAnchorStatus}`,
      `Source Documents - Inbound sichtbar: ${sourceDialogVisible ? 'ja' : 'nein'}`,
      `Kandidatenzeilen sichtbar: ${clearCandidateRows.length}`,
      `Zeile selektiert: ${selectedRow ? 'ja' : 'nein'}`,
      `OK/Select sichtbar und nicht geklickt: ${okVisible ? 'ja' : 'nein'}`,
      '',
      '## Grenze',
      '',
      '- Kein Source Document mit OK/Select bestaetigt.',
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
      '# WAREHOUSE-017 Evidence Index',
      '',
      'Status: `labor`, `ui-first`, `source-dialog`, `no-posting`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-017-result.json` | Result JSON | Source-dialog context, candidate rows, no-post flags | OK confirmation, posting, ledger trace |',
      '| `060-source-rows-before-selection.json` | Row inventory | sichtbare Source-Dialog-Zeilen | fachliche Postingreife |',
      '| `080-ok-select-candidates-not-clicked.json` | Safety Evidence | OK/Select wurde erkannt und nicht geklickt | Source confirmation |',
      '| `120-post-candidates-not-clicked.json` | Safety Evidence | Post Receipt erkannt und nicht geklickt | Posting |',
      '',
      'German Final: source selection and Warehouse posting must be rebuilt with German final documents and trace.',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.postActionClicked).toBe(false);
  expect(result.okClicked).toBe(false);
});
