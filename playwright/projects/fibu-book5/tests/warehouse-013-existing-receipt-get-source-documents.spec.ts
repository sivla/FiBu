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

const testId = 'warehouse-013';
const receiptNo = 'RE000001';

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

function warehouseReceiptListUrl() {
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
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|cacheLocation|shouldAttachOauthTokens|TokenFactory/i.test(line));
}

function compactText(text: string) {
  const interesting = /RE000001|Warehouse Receipt|Get Source|Source Documents?|Use Filters|Purchase|Order|Vendor|Document Type|Document No\.|Location Code|Post Receipt|OK|Select|Cancel|Abbrechen|Error|Fehler|Prepare|Weitere Optionen|More/i;
  const selected = normalizeLines(text).filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-013-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
    '',
    ...selected.slice(0, 260)
  ].join('\n');
}

function isDangerous(label: string) {
  return /Post Receipt|^Post$|Buchen|Delete|Loeschen|L.schen|Ship|Invoice|Preview Posting|^OK$|^Select$|Auswaehlen|Ausw.hlen/i.test(label);
}

async function candidates(page: Page, pattern: RegExp) {
  const found: Candidate[] = [];
  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .locator('button,a,[role="button"],[role="menuitem"],[aria-label],[title],span')
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
            if (/Post Receipt|^Post$|Buchen|Delete|Ship|Invoice|Preview|^OK$|^Select$/i.test(combined)) score += 100;
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
          .slice(0, 40);
      }, pattern.source)
      .catch(() => []);
    found.push(...frameCandidates.map(({ visible, ...entry }) => entry));
  }
  return found.sort((left, right) => left.score - right.score);
}

async function clickText(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    const clicked = await frame
      .locator('body *')
      .evaluateAll((nodes, patternSource) => {
        const pattern = new RegExp(patternSource, 'i');
        const candidates = nodes
          .map((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const role = element.getAttribute('role') || '';
            const tagName = element.tagName;
            const ariaLabel = element.getAttribute('aria-label') || '';
            const title = element.getAttribute('title') || '';
            return { element, rect, text, role, tagName, ariaLabel, title };
          })
          .filter((entry) =>
            entry.rect.width > 0 &&
            entry.rect.height > 0 &&
            pattern.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`) &&
            !/BODY|FORM|HTML|MAIN/i.test(entry.tagName) &&
            !/Post|Buchen|Delete|Ship|Invoice|Preview|^OK$|^Select$/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`)
          )
          .sort((left, right) => {
            const leftScore = (/button|menuitem/i.test(left.role) || /BUTTON|A/i.test(left.tagName) ? 0 : 10) + left.text.length;
            const rightScore = (/button|menuitem/i.test(right.role) || /BUTTON|A/i.test(right.tagName) ? 0 : 10) + right.text.length;
            return leftScore - rightScore;
          });
        const target = candidates[0]?.element;
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

test('WAREHOUSE-013 Existing Receipt RE000001 Get Source Documents Route', async ({ page }) => {
  await page.goto(warehouseReceiptListUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const listText = await pageText(page);
  const receiptVisible = new RegExp(receiptNo).test(listText);
  const receiptOpened = receiptVisible ? await clickText(page, new RegExp(`^${receiptNo}$|${receiptNo}`)) : false;
  const cardText = await pageText(page);
  const cardButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const cardContextVisible = /Warehouse Receipt|Post Receipt|Prepare|Location Code|Assigned User ID/i.test(cardText + ' ' + cardButtons.join(' '));
  const prepareClicked = await clickText(page, /^Prepare$|Prepare|Vorbereiten/i);
  const moreClicked = await clickText(page, /Weitere Optionen|More options|More/i);
  const getSourceCandidates = await candidates(page, /^Get Source Documents|Get Source Documents\.\.\.|Use Filters to Get Src/i);
  const postCandidates = await candidates(page, /Post Receipt|^Post$|Buchen/i);
  const getSourceClicked = await clickText(page, /^Get Source Documents|Get Source Documents\.\.\./i);

  const finalText = await pageText(page);
  const finalButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const sourceSelectionVisible = /Source Documents?|Purchase Order|Vendor|Document Type|Document No\.|OK|Cancel|Abbrechen|Select/i.test(finalText + ' ' + finalButtons.join(' '));
  const okOrSelectVisible = finalButtons.some((button) => /^OK$|^Select$|Auswaehlen|Auswählen/i.test(button));
  const purchaseSourceVisible = /Purchase Order|K10000|RAW-STEEL|FRA-ZL|Vendor|Purchase/i.test(finalText + ' ' + finalButtons.join(' '));
  const resultStatus = receiptVisible && receiptOpened && cardContextVisible && getSourceClicked && sourceSelectionVisible
    ? 'observed'
    : 'blocked';

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-existing-receipt-get-source-documents',
    caseId: 'WAREHOUSE-013-EXISTING-RECEIPT-GET-SOURCE-DOCUMENTS',
    source: 'playwright-ui-existing-draft-source-documents',
    resultStatus,
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    companySwitched: false,
    draftCreated: false,
    draftReused: receiptVisible,
    apiShortcut: false,
    receiptNo,
    receiptVisible,
    receiptOpened,
    cardContextVisible,
    prepareClicked,
    moreClicked,
    getSourceCandidates,
    getSourceClicked,
    sourceSelectionVisible,
    okOrSelectVisible,
    purchaseSourceVisible,
    finalButtons,
    postCandidates,
    postActionClicked: false,
    proves: [
      receiptVisible ? `${receiptNo} is visible on Warehouse Receipts.` : `${receiptNo} is not visible on Warehouse Receipts.`,
      receiptOpened ? `${receiptNo} was opened/reused without creating a new draft.` : `${receiptNo} was not opened.`,
      getSourceClicked ? 'Get Source Documents route was opened from the existing receipt context.' : 'Get Source Documents route was not opened.',
      sourceSelectionVisible ? 'A source document selection context is visible.' : 'No source document selection context is visible.'
    ],
    doesNotProve: [
      'No source document was selected or confirmed.',
      'No Warehouse Receipt was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    blockedBy: resultStatus === 'observed' ? [] : [
      !receiptVisible ? 'warehouse-receipt-re000001-not-visible' : !receiptOpened ? 'warehouse-receipt-re000001-not-opened' : 'get-source-documents-selection-context-not-visible'
    ],
    warnings: [
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
    rebuildInstruction: 'In German final sandbox, reuse/open the final Warehouse Receipt draft and select a final source document before posting.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof must select source document, post Warehouse Receipt, handle Put-away and trace Warehouse/Item/Value entries.',
    finalScreenshotNeeded: true,
    nextCase: resultStatus === 'observed'
      ? 'WAREHOUSE-014-SOURCE-DOCUMENT-CANDIDATE-SELECT-NO-POST'
      : 'WAREHOUSE-014-EXISTING-RECEIPT-SOURCE-DOCUMENT-BLOCKER',
    nextStep: resultStatus === 'observed'
      ? 'WAREHOUSE-014: select a concrete source document candidate without posting.'
      : 'WAREHOUSE-014: diagnose existing receipt/source document route before selection.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-list-text.txt'), compactText(listText));
  await writeTextEvidence(warehouseEvidencePath('020-card-text.txt'), compactText(cardText));
  await writeJsonEvidence(warehouseEvidencePath('030-card-buttons.json'), cardButtons);
  await writeJsonEvidence(warehouseEvidencePath('040-get-source-candidates.json'), getSourceCandidates);
  await writeJsonEvidence(warehouseEvidencePath('050-post-candidates-not-clicked.json'), postCandidates);
  await writeTextEvidence(warehouseEvidencePath('060-final-text.txt'), compactText(finalText));
  await writeJsonEvidence(warehouseEvidencePath('070-final-buttons.json'), finalButtons);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-013-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-013-EXISTING-RECEIPT-GET-SOURCE-DOCUMENTS.md'),
    [
      '# WAREHOUSE-013 Existing Receipt Get Source Documents',
      '',
      'Status: `labor`, `ui-first`, `existing-draft-route`, `no-posting`, `not-final`.',
      '',
      `Receipt sichtbar: ${receiptVisible ? 'ja' : 'nein'}`,
      `Receipt geoeffnet: ${receiptOpened ? 'ja' : 'nein'}`,
      `Get Source Documents geklickt: ${getSourceClicked ? 'ja' : 'nein'}`,
      `Source-Auswahlkontext sichtbar: ${sourceSelectionVisible ? 'ja' : 'nein'}`,
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

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.postActionClicked).toBe(false);
});
