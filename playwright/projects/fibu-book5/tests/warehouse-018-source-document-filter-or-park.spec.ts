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

const testId = 'warehouse-018';

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
  const interesting = /Warehouse Receipt|Source Documents|Get Src|Use Filters|Filter|Purchase|Order|Vendor|Document Type|Document No\.|Source No\.|External Document|Destination|Expected Receipt|Location Code|Assigned User ID|RE\d+|10\d{4}|K\d{5}|RAW|FRA-ZL|OK|Select|Cancel|Abbrechen|Post Receipt|Error|Fehler/i;
  const selected = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|cacheLocation|shouldAttachOauthTokens|TokenFactory/i.test(line))
    .filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-018-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
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
          .slice(0, 80);
      }, pattern.source)
      .catch(() => []);
    found.push(...frameCandidates.map(({ visible, ...entry }) => entry));
  }
  return found.sort((left, right) => left.score - right.score);
}

async function clickButton(page: Page, pattern: RegExp) {
  const all = await buttonCandidates(page, pattern);
  const target = all.find((candidate) => {
    const label = `${candidate.text} ${candidate.ariaLabel} ${candidate.title}`;
    if (/^OK$|^Select$|Auswaehlen|Ausw.hlen/i.test(label)) return false;
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
          .filter((entry) => entry.visible && /Purchase|Order|Vendor|Document|10\d{4}|K\d{5}|RAW|FRA-ZL|Warehouse Receipt|Source/i.test(`${entry.text} ${entry.ariaLabel}`))
          .slice(0, 100)
      )
      .catch(() => []);
    rows.push(...frameRows.map(({ visible, ...entry }) => entry));
  }
  return rows;
}

function extractReceipts(text: string) {
  return Array.from(new Set([...text.matchAll(/\bRE\d{6}\b/g)].map((match) => match[0])));
}

test('WAREHOUSE-018 Source Document Filter Or Park', async ({ page }) => {
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
  const filterCandidatesBeforeClick = await buttonCandidates(page, /^Use Filters to Get Src\. Docs|Use Filters to Get Src|Use Filters/i);
  const filterClick = await clickButton(page, /^Use Filters to Get Src\. Docs|Use Filters to Get Src|Use Filters/i);
  const afterFilterText = await pageText(page);
  const afterFilterButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const filterContextVisible = /Filters|Filter|Source Documents|Get Source Documents|Source Document Filter|Purchase Header|Warehouse Receipt|Show Results|OK|Cancel|Abbrechen/i.test(afterFilterText + ' ' + afterFilterButtons.join(' '));
  const rowsAfterFilter = await sourceRows(page);
  const clearCandidateRows = rowsAfterFilter.filter((row) => /Purchase|Order|10\d{4}|K\d{5}|RAW|FRA-ZL/i.test(`${row.text} ${row.ariaLabel}`));
  const okButtons = await buttonCandidates(page, /^OK$|^Select$|Auswaehlen|Ausw.hlen|Show Results|Ergebnisse anzeigen/i);
  const postCandidates = await buttonCandidates(page, /Post Receipt|^Post$|Buchen/i);
  const resultStatus = newClicked && draftContextVisible && filterClick.clicked && filterContextVisible
    ? 'observed'
    : 'blocked';
  const routeDecision = resultStatus === 'observed' && clearCandidateRows.length > 0
    ? 'filter-route-produced-candidate-rows-but-confirmation-remains-locked'
    : resultStatus === 'observed'
      ? 'filter-route-opened-but-no-clear-source-row-visible-park-warehouse-inbound'
      : 'filter-route-not-opened-park-warehouse-inbound';
  const blockedBy = resultStatus === 'observed' ? [] : [
    !newClicked ? 'fresh-warehouse-receipt-draft-not-created' :
    !draftContextVisible ? 'fresh-warehouse-receipt-draft-context-not-visible' :
    !filterClick.clicked ? 'use-filters-to-get-src-docs-not-clicked-or-not-visible' :
    'filter-context-not-visible-after-click'
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-document-filter-or-park',
    caseId: 'WAREHOUSE-018-WAREHOUSE-SOURCE-DOCUMENT-FILTER-OR-PARK',
    source: 'playwright-ui-source-document-filter-or-park',
    resultStatus,
    routeDecision,
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
    filterCandidatesBeforeClick,
    filterClick,
    filterContextVisible,
    afterFilterButtons,
    rowsAfterFilter,
    clearCandidateRows,
    okOrShowResultsVisible: okButtons.length > 0,
    okOrShowResultsClicked: false,
    postCandidates,
    postActionClicked: false,
    blockedBy,
    proves: [
      newClicked ? 'A fresh Warehouse Receipt draft route was triggered.' : 'No fresh Warehouse Receipt draft route was triggered.',
      draftContextVisible ? 'Warehouse Receipt draft context is visible.' : 'Warehouse Receipt draft context is not visible.',
      filterCandidatesBeforeClick.length > 0 ? 'Use Filters to Get Src. Docs candidates are visible.' : 'Use Filters to Get Src. Docs candidates are not visible.',
      filterClick.clicked ? 'Use Filters to Get Src. Docs was clicked.' : 'Use Filters to Get Src. Docs was not clicked.',
      filterContextVisible ? 'A filter/source-document context is visible after the filter action.' : 'No filter/source-document context is visible after the filter action.',
      clearCandidateRows.length > 0 ? 'At least one concrete-looking source row is visible after filter route.' : 'No concrete-looking source row is visible after filter route.'
    ],
    doesNotProve: [
      'No filter OK/Show Results/Select confirmation was clicked.',
      'No source document was confirmed.',
      'No Warehouse Receipt was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    warnings: [
      'OK/Show Results/Select candidates were recorded and intentionally not clicked.',
      'Post Receipt candidates were recorded and intentionally not clicked.',
      'If no source row is visible, Warehouse inbound source selection should be parked until a source document creation hypothesis exists.'
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
    rebuildInstruction: 'In German final sandbox, produce/select a concrete inbound source document and confirm it only in a separate approved case before Warehouse Receipt posting.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof must include source document creation/selection, Warehouse Receipt posting, Put-away handling and Warehouse/Item/Value trace.',
    finalScreenshotNeeded: true,
    nextCase: clearCandidateRows.length > 0
      ? 'WAREHOUSE-019-SOURCE-DOCUMENT-FILTER-CONFIRMATION-GATE'
      : 'WAREHOUSE-019-WAREHOUSE-INBOUND-SOURCE-DOCUMENT-CREATION-OR-PARK-DECISION',
    nextStep: clearCandidateRows.length > 0
      ? 'WAREHOUSE-019: decide whether filter confirmation is safe; still no posting until receipt lines are proven.'
      : 'WAREHOUSE-019: park Warehouse inbound source selection or create a concrete inbound source document hypothesis before another receipt attempt.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-new-text.txt'), compactText(beforeText));
  await writeTextEvidence(warehouseEvidencePath('020-after-new-text.txt'), compactText(afterNewText));
  await writeJsonEvidence(warehouseEvidencePath('030-after-new-buttons.json'), afterNewButtons);
  await writeJsonEvidence(warehouseEvidencePath('040-filter-candidates-before-click.json'), filterCandidatesBeforeClick);
  await writeJsonEvidence(warehouseEvidencePath('050-filter-click.json'), filterClick);
  await writeTextEvidence(warehouseEvidencePath('060-after-filter-text.txt'), compactText(afterFilterText));
  await writeJsonEvidence(warehouseEvidencePath('070-after-filter-buttons.json'), afterFilterButtons);
  await writeJsonEvidence(warehouseEvidencePath('080-rows-after-filter.json'), rowsAfterFilter);
  await writeJsonEvidence(warehouseEvidencePath('090-clear-candidate-rows-after-filter.json'), clearCandidateRows);
  await writeJsonEvidence(warehouseEvidencePath('100-ok-show-results-not-clicked.json'), okButtons);
  await writeJsonEvidence(warehouseEvidencePath('110-post-candidates-not-clicked.json'), postCandidates);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-018-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-018-SOURCE-DOCUMENT-FILTER-OR-PARK.md'),
    [
      '# WAREHOUSE-018 Source Document Filter Or Park',
      '',
      'Status: `labor`, `ui-first`, `filter-route`, `no-posting`, `not-final`.',
      '',
      `Fresh Draft New geklickt: ${newClicked ? 'ja' : 'nein'}`,
      `Receipt-Anker: ${result.receiptAnchorStatus}`,
      `Use Filters Kandidaten sichtbar: ${filterCandidatesBeforeClick.length}`,
      `Use Filters geklickt: ${filterClick.clicked ? 'ja' : 'nein'}`,
      `Filter-/Source-Kontext sichtbar: ${filterContextVisible ? 'ja' : 'nein'}`,
      `Kandidatenzeilen nach Filterroute: ${clearCandidateRows.length}`,
      `OK/Show Results/Select sichtbar und nicht geklickt: ${okButtons.length > 0 ? 'ja' : 'nein'}`,
      `Route Decision: ${routeDecision}`,
      '',
      '## Grenze',
      '',
      '- Kein Filter-OK, Show Results oder Select bestaetigt.',
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
      '# WAREHOUSE-018 Evidence Index',
      '',
      'Status: `labor`, `ui-first`, `filter-route`, `no-posting`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-018-result.json` | Result JSON | Filterroute, Button-/Row-Befund, no-post flags | Source-Bestaetigung, Posting, Ledger Trace |',
      '| `040-filter-candidates-before-click.json` | Action Evidence | ob Use Filters sichtbar war | fachliche Postingreife |',
      '| `080-rows-after-filter.json` | Row Inventory | sichtbare Zeilen nach Filterroute | bestaetigte Quelle |',
      '| `100-ok-show-results-not-clicked.json` | Safety Evidence | OK/Show Results/Select erkannt und nicht geklickt | Source confirmation |',
      '| `110-post-candidates-not-clicked.json` | Safety Evidence | Post Receipt erkannt und nicht geklickt | Posting |',
      '',
      'German Final: Quelle, Warehouse Receipt, Put-away und Postenspur muessen in deutscher Zielumgebung neu aufgebaut werden.',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.postActionClicked).toBe(false);
  expect(result.okOrShowResultsClicked).toBe(false);
});
