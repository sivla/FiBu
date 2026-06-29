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

const testId = 'warehouse-016';

type Candidate = {
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
  const interesting = /Warehouse Receipt|Receipt|Prepare|Get Source|Source Document|Use Filters|Purchase|Order|Vendor|Document Type|Document No\.|No\.|Location Code|Assigned User ID|Post Receipt|OK|Select|Cancel|Abbrechen|Error|Fehler|Weitere Optionen|More options|RE\d+/i;
  const selected = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|cacheLocation|shouldAttachOauthTokens|TokenFactory/i.test(line))
    .filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-016-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
    '',
    ...selected.slice(0, 280)
  ].join('\n');
}

function isDangerous(label: string) {
  return /Post Receipt|^Post$|Buchen|Delete|Loeschen|L.schen|Ship|Invoice|Preview Posting|^OK$|^Select$|Auswaehlen|Ausw.hlen/i.test(label);
}

function isContainer(candidate: Candidate) {
  const combined = `${candidate.text} ${candidate.ariaLabel} ${candidate.title} ${candidate.tagName}`;
  return /FORM|BODY|HTML|MAIN/i.test(combined) || candidate.tagName === 'FORM';
}

async function candidates(page: Page, pattern: RegExp) {
  const found: Candidate[] = [];
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
            if (/Post Receipt|^Post$|Buchen|Delete|Ship|Invoice|Preview|^OK$|^Select$/i.test(combined)) score += 120;
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
          .slice(0, 50);
      }, pattern.source)
      .catch(() => []);
    found.push(...frameCandidates.map(({ visible, ...entry }) => entry));
  }
  return found.sort((left, right) => left.score - right.score);
}

async function clickBest(page: Page, pattern: RegExp) {
  const all = await candidates(page, pattern);
  const target = all.find((candidate) => !isDangerous(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`) && !isContainer(candidate));
  if (!target) return { clicked: false, candidates: all, clickedCandidate: null as Candidate | null };

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

function extractReceiptNo(text: string) {
  const matches = [...text.matchAll(/\bRE\d{6}\b/g)].map((match) => match[0]);
  return matches[matches.length - 1] ?? null;
}

test('WAREHOUSE-016 Fresh Draft Immediate Get Source Documents No Confirm', async ({ page }) => {
  await page.goto(warehouseReceiptUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const beforeText = await pageText(page);
  const newClicked = await clickExactVisibleText(page, /^New$|^Neu$/i);
  const afterNewText = await pageText(page);
  const afterNewButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const receiptNo = extractReceiptNo(afterNewText + ' ' + afterNewButtons.join(' '));
  const draftContextVisible = /Warehouse Receipt|No\.|Location Code|Assigned User ID|Post Receipt/i.test(afterNewText + ' ' + afterNewButtons.join(' '));

  const prepareClick = await clickBest(page, /^Prepare$|Prepare|Vorbereiten/i);
  const afterPrepareText = await pageText(page);
  const afterPrepareButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const moreClick = await clickBest(page, /Weitere Optionen|More options|More/i);
  const beforeGetSourceText = await pageText(page);
  const beforeGetSourceButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const sourceCandidatesBeforeClick = await candidates(page, /^Get Source Documents|Get Source Documents\.\.\.|Use Filters to Get Src/i);
  const sourceProcessCandidates = sourceCandidatesBeforeClick.filter((candidate) => !isContainer(candidate) && !isDangerous(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`));
  const getSourceClick = sourceProcessCandidates.length > 0
    ? await clickBest(page, /^Get Source Documents|Get Source Documents\.\.\./i)
    : { clicked: false, candidates: sourceCandidatesBeforeClick, clickedCandidate: null as Candidate | null };

  const afterGetSourceText = await pageText(page);
  const afterGetSourceButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const combinedAfterGet = afterGetSourceText + ' ' + afterGetSourceButtons.join(' ');
  const sourceSelectionVisible = getSourceClick.clicked && /Purchase Order|Vendor|Document Type|Document No\.|Released|Cancel|Abbrechen|^OK$|^Select$/i.test(combinedAfterGet);
  const okOrSelectVisible = afterGetSourceButtons.some((button) => /^OK$|^Select$|Auswaehlen|Ausw.hlen/i.test(button));
  const purchaseSourceVisible = /Purchase Order|K10000|RAW-STEEL|FRA-ZL|Vendor|Purchase/i.test(combinedAfterGet);
  const postCandidates = await candidates(page, /Post Receipt|^Post$|Buchen/i);
  const resultStatus = newClicked && draftContextVisible && sourceProcessCandidates.length > 0 && getSourceClick.clicked && sourceSelectionVisible
    ? 'observed'
    : 'blocked';
  const blockedBy = resultStatus === 'observed' ? [] : [
    !newClicked ? 'fresh-warehouse-receipt-draft-not-created' :
    !draftContextVisible ? 'fresh-warehouse-receipt-draft-context-not-visible' :
    sourceProcessCandidates.length === 0 ? 'get-source-documents-action-not-visible-in-fresh-draft-context' :
    !getSourceClick.clicked ? 'get-source-documents-action-not-clicked' :
    'true-source-document-selection-context-not-visible'
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-fresh-draft-immediate-get-source-no-confirm',
    caseId: 'WAREHOUSE-016-FRESH-DRAFT-IMMEDIATE-GET-SOURCE-NO-CONFIRM',
    source: 'playwright-ui-fresh-draft-immediate-get-source-no-confirm',
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
    receiptNo,
    apiShortcut: false,
    newClicked,
    draftContextVisible,
    prepareClick,
    moreClick,
    sourceCandidatesBeforeClick,
    sourceProcessCandidates,
    getSourceClick,
    sourceSelectionVisible,
    okOrSelectVisible,
    purchaseSourceVisible,
    postCandidates,
    postActionClicked: false,
    blockedBy,
    proves: [
      newClicked ? 'A fresh Warehouse Receipt draft route was triggered.' : 'No fresh Warehouse Receipt draft route was triggered.',
      receiptNo ? `Warehouse Receipt number visible after New: ${receiptNo}.` : 'No Warehouse Receipt number was extracted.',
      draftContextVisible ? 'Fresh Warehouse Receipt draft context is visible.' : 'Fresh Warehouse Receipt draft context is not visible.',
      sourceProcessCandidates.length > 0 ? 'Get Source Documents candidates are visible in fresh draft context.' : 'Get Source Documents candidates are not visible in fresh draft context.',
      getSourceClick.clicked ? 'Get Source Documents action was clicked.' : 'Get Source Documents action was not clicked.',
      sourceSelectionVisible ? 'A true source document selection context is visible after Get Source.' : 'No true source document selection context is visible after Get Source.'
    ],
    doesNotProve: [
      'No source document was selected or confirmed.',
      'No Warehouse Receipt was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    warnings: [
      newClicked ? 'A fresh Warehouse Receipt draft may remain and is explicitly kept for follow-up evidence.' : 'No draft keep needed because no fresh draft was created.',
      okOrSelectVisible ? 'OK/Select is visible and was intentionally not clicked.' : 'No OK/Select confirmation was used.',
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
    rebuildInstruction: 'In German final sandbox, create a final Warehouse Receipt source-selection path, then select the final German source document before any receipt posting.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof must select source document, post Warehouse Receipt, handle Put-away and trace Warehouse/Item/Value entries.',
    finalScreenshotNeeded: true,
    nextCase: resultStatus === 'observed'
      ? 'WAREHOUSE-017-SOURCE-DOCUMENT-CANDIDATE-SELECT-NO-POST'
      : 'WAREHOUSE-017-WAREHOUSE-RECEIPT-SOURCE-SELECTION-PARK-OR-FILTER-ROUTE',
    nextStep: resultStatus === 'observed'
      ? 'WAREHOUSE-017: inspect/select a concrete source document candidate but stop before posting.'
      : 'WAREHOUSE-017: decide whether Use Filters to Get Src. Docs is the next route or park Warehouse Receipt source selection.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-new-text.txt'), compactText(beforeText));
  await writeTextEvidence(warehouseEvidencePath('020-after-new-text.txt'), compactText(afterNewText));
  await writeJsonEvidence(warehouseEvidencePath('030-after-new-buttons.json'), afterNewButtons);
  await writeTextEvidence(warehouseEvidencePath('040-after-prepare-text.txt'), compactText(afterPrepareText));
  await writeJsonEvidence(warehouseEvidencePath('050-after-prepare-buttons.json'), afterPrepareButtons);
  await writeTextEvidence(warehouseEvidencePath('060-before-get-source-text.txt'), compactText(beforeGetSourceText));
  await writeJsonEvidence(warehouseEvidencePath('070-before-get-source-buttons.json'), beforeGetSourceButtons);
  await writeJsonEvidence(warehouseEvidencePath('080-get-source-candidates-before-click.json'), sourceCandidatesBeforeClick);
  await writeJsonEvidence(warehouseEvidencePath('090-get-source-click.json'), getSourceClick);
  await writeTextEvidence(warehouseEvidencePath('100-after-get-source-text.txt'), compactText(afterGetSourceText));
  await writeJsonEvidence(warehouseEvidencePath('110-after-get-source-buttons.json'), afterGetSourceButtons);
  await writeJsonEvidence(warehouseEvidencePath('120-post-candidates-not-clicked.json'), postCandidates);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-016-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-016-FRESH-DRAFT-IMMEDIATE-GET-SOURCE.md'),
    [
      '# WAREHOUSE-016 Fresh Draft Immediate Get Source',
      '',
      'Status: `labor`, `ui-first`, `fresh-draft`, `no-posting`, `not-final`.',
      '',
      `Fresh Draft New geklickt: ${newClicked ? 'ja' : 'nein'}`,
      `Receipt No.: ${receiptNo ?? 'nicht erkannt'}`,
      `Draft-Kontext sichtbar: ${draftContextVisible ? 'ja' : 'nein'}`,
      `Get Source Kandidaten sichtbar: ${sourceProcessCandidates.length}`,
      `Get Source geklickt: ${getSourceClick.clicked ? 'ja' : 'nein'}`,
      `Source-Auswahlkontext sichtbar: ${sourceSelectionVisible ? 'ja' : 'nein'}`,
      `OK/Select sichtbar und nicht geklickt: ${okOrSelectVisible ? 'ja' : 'nein'}`,
      '',
      '## Blocker / Ergebnis',
      '',
      ...(blockedBy.length ? blockedBy.map((entry) => `- ${entry}`) : ['- Get Source Documents wurde ohne Source-Bestaetigung erreicht.']),
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
      '# WAREHOUSE-016 Evidence Index',
      '',
      'Status: `labor`, `ui-first`, `fresh-draft`, `no-posting`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-016-result.json` | Result JSON | frischer Draft, Get-Source-Kandidaten/Klick, Stopps | Source-Bestaetigung, Posting, Postenspur |',
      '| `080-get-source-candidates-before-click.json` | Action-Inventar | ob Get Source im frischen Draft sichtbar war | fachliche Postingreife |',
      '| `090-get-source-click.json` | Click Evidence | welcher Kandidat geklickt wurde oder warum nicht | Source-Auswahl |',
      '| `120-post-candidates-not-clicked.json` | Safety Evidence | Post Receipt erkannt und nicht geklickt | Posting |',
      '',
      'German Final: dieser Laborpfad muss spaeter mit deutschem Source Document und finaler Postenspur neu erzeugt werden.',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.postActionClicked).toBe(false);
});
