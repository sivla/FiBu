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

const testId = 'warehouse-014';
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
  const interesting = /RE000001|Warehouse Receipt|Get Source|Source Documents?|Use Filters|Purchase|Order|Vendor|Document Type|Document No\.|Location Code|Post Receipt|OK|Select|Cancel|Abbrechen|Error|Fehler|Prepare|Start|Weitere Optionen|More|Maximi|Breite|Wide|Focus|Vollbild/i;
  const selected = normalizeLines(text).filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-014-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
    '',
    ...selected.slice(0, 280)
  ].join('\n');
}

function isForbiddenClick(label: string) {
  return /Post Receipt|^Post$|Buchen|Delete|Loeschen|L.schen|Ship|Invoice|Preview Posting|^OK$|^Select$|Auswaehlen|Ausw.hlen/i.test(label);
}

async function candidates(page: Page, pattern: RegExp) {
  const found: Candidate[] = [];
  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .locator('button,a,[role="button"],[role="menuitem"],[role="menuitemcheckbox"],[aria-label],[title],span,div')
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
          .slice(0, 60);
      }, pattern.source)
      .catch(() => []);
    found.push(...frameCandidates.map(({ visible, ...entry }) => entry));
  }
  return found.sort((left, right) => left.score - right.score);
}

async function clickBest(page: Page, pattern: RegExp, options: { doubleClick?: boolean; allowText?: RegExp } = {}) {
  for (const frame of page.frames()) {
    const clicked = await frame
      .locator('body *')
      .evaluateAll((nodes, args) => {
        const pattern = new RegExp(args.patternSource, 'i');
        const allow = args.allowTextSource ? new RegExp(args.allowTextSource, 'i') : null;
        const matches = nodes
          .map((node) => {
            const element = node as HTMLElement;
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const role = element.getAttribute('role') || '';
            const tagName = element.tagName;
            const ariaLabel = element.getAttribute('aria-label') || '';
            const title = element.getAttribute('title') || '';
            const combined = `${text} ${ariaLabel} ${title}`;
            let score = 0;
            if (pattern.test(text)) score -= 20;
            if (pattern.test(ariaLabel)) score -= 16;
            if (pattern.test(title)) score -= 12;
            if (/button|menuitem|menuitemcheckbox/i.test(role) || /BUTTON|A/i.test(tagName)) score -= 8;
            if (/FORM|BODY|HTML|MAIN/i.test(tagName)) score += 80;
            return { element, rect, text, role, tagName, ariaLabel, title, combined, score };
          })
          .filter((entry) =>
            entry.rect.width > 0 &&
            entry.rect.height > 0 &&
            pattern.test(entry.combined) &&
            (allow ? allow.test(entry.combined) : true) &&
            !/FORM|BODY|HTML|MAIN/i.test(entry.tagName) &&
            !/Post Receipt|^Post$|Buchen|Delete|Ship|Invoice|Preview|^OK$|^Select$/i.test(entry.combined)
          )
          .sort((left, right) => left.score - right.score || left.text.length - right.text.length);
        const target = matches[0]?.element;
        if (!target) return false;
        const clickable = target.closest('button,a,[role="button"],[role="menuitem"],[role="menuitemcheckbox"]') as HTMLElement | null ?? target;
        if (args.doubleClick) clickable.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
        else clickable.click();
        return true;
      }, {
        patternSource: pattern.source,
        allowTextSource: options.allowText?.source ?? '',
        doubleClick: !!options.doubleClick
      })
      .catch(() => false);
    if (clicked) {
      await page.waitForTimeout(2200);
      return true;
    }
  }
  return false;
}

async function pressEnterOnReceipt(page: Page) {
  const before = await pageText(page);
  if (!new RegExp(receiptNo).test(before)) return false;
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1800);
  return true;
}

async function tryLayoutExpansion(page: Page) {
  const attempts: Array<{ label: string; clicked: boolean }> = [];
  for (const [label, pattern] of [
    ['wide-layout', /Breite Layoutansicht anzeigen|Breites Layout|Wide layout/i],
    ['maximize-expand', /Maximieren|Maximize|Expand|Vollbild|Full screen|Fokusmodus|Focus mode/i],
    ['show-more-page-actions', /^Weitere Optionen$|^More options$|Weitere Optionen|More options/i]
  ] as const) {
    const clicked = await clickBest(page, pattern);
    attempts.push({ label, clicked });
  }
  return attempts;
}

test('WAREHOUSE-014 Existing Receipt Source Document Blocker Diagnosis', async ({ page }) => {
  await page.goto(warehouseReceiptListUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const listText = await pageText(page);
  const listButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const receiptCandidates = await candidates(page, new RegExp(receiptNo));
  const receiptVisible = new RegExp(receiptNo).test(listText + ' ' + listButtons.join(' '));

  const singleClickReceipt = receiptVisible ? await clickBest(page, new RegExp(`^${receiptNo}$|${receiptNo}`), { allowText: new RegExp(receiptNo) }) : false;
  const textAfterSingle = await pageText(page);
  const doubleClickReceipt = receiptVisible ? await clickBest(page, new RegExp(`^${receiptNo}$|${receiptNo}`), { doubleClick: true, allowText: new RegExp(receiptNo) }) : false;
  const enterAttempted = await pressEnterOnReceipt(page);
  const textAfterOpenAttempts = await pageText(page);
  const buttonsAfterOpenAttempts = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);

  const layoutAttempts = await tryLayoutExpansion(page);
  const textAfterLayout = await pageText(page);
  const buttonsAfterLayout = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);

  const prepareCandidates = await candidates(page, /^Prepare$|Prepare|Vorbereiten/i);
  const startCandidates = await candidates(page, /^Start$|Start/i);
  const moreCandidates = await candidates(page, /^Weitere Optionen$|^More options$|Weitere Optionen|More options/i);
  const getSourceCandidatesBeforeClick = await candidates(page, /^Get Source Documents|Get Source Documents\.\.\.|Use Filters to Get Src/i);

  const getSourceClicked = getSourceCandidatesBeforeClick.length > 0
    ? await clickBest(page, /^Get Source Documents|Get Source Documents\.\.\./i)
    : false;
  const finalText = await pageText(page);
  const finalButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const getSourceCandidatesAfterClick = await candidates(page, /^Get Source Documents|Get Source Documents\.\.\.|Use Filters to Get Src/i);
  const postCandidates = await candidates(page, /Post Receipt|^Post$|Buchen/i);

  const combinedFinal = finalText + ' ' + finalButtons.join(' ');
  const sourceSelectionVisible = getSourceClicked && /Purchase Order|Vendor|Document Type|Document No\.|Released|^OK$|Cancel|Abbrechen|^Select$/i.test(combinedFinal);
  const okOrSelectVisible = finalButtons.some((button) => /^OK$|^Select$|Auswaehlen|Ausw.hlen/i.test(button));
  const purchaseSourceVisible = /Purchase Order|K10000|RAW-STEEL|FRA-ZL|Vendor|Purchase/i.test(combinedFinal);
  const cardLikeContextVisible = /Warehouse Receipt|Post Receipt|Location Code|Assigned User ID|Sorting Method|No\./i.test(textAfterOpenAttempts + ' ' + buttonsAfterOpenAttempts.join(' '));
  const resultStatus = receiptVisible && cardLikeContextVisible && getSourceClicked && sourceSelectionVisible ? 'observed' : 'blocked';
  const blockedBy = resultStatus === 'observed' ? [] : [
    !receiptVisible ? 'warehouse-receipt-re000001-not-visible' :
    !cardLikeContextVisible ? 'warehouse-receipt-card-context-not-visible' :
    getSourceCandidatesBeforeClick.length === 0 ? 'get-source-documents-action-not-visible-after-layout-expansion' :
    !getSourceClicked ? 'get-source-documents-action-not-clicked' :
    'source-document-selection-context-not-visible'
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-document-action-blocker-diagnosis',
    caseId: 'WAREHOUSE-014-EXISTING-RECEIPT-SOURCE-DOCUMENT-BLOCKER',
    source: 'playwright-ui-source-document-action-blocker-diagnosis',
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
    singleClickReceipt,
    doubleClickReceipt,
    enterAttempted,
    cardLikeContextVisible,
    layoutAttempts,
    prepareCandidates,
    startCandidates,
    moreCandidates,
    getSourceCandidatesBeforeClick,
    getSourceClicked,
    getSourceCandidatesAfterClick,
    sourceSelectionVisible,
    okOrSelectVisible,
    purchaseSourceVisible,
    postCandidates,
    postActionClicked: false,
    blockedBy,
    proves: [
      receiptVisible ? `${receiptNo} is visible on Warehouse Receipts.` : `${receiptNo} is not visible on Warehouse Receipts.`,
      cardLikeContextVisible ? 'A Warehouse Receipt page/list/card context is visible after open attempts.' : 'No stable Warehouse Receipt card context is visible after open attempts.',
      layoutAttempts.some((entry) => entry.clicked) ? 'At least one layout/action expansion affordance was clicked.' : 'No layout/action expansion affordance was clicked.',
      getSourceCandidatesBeforeClick.length > 0 ? 'Get Source Documents candidates are visible after the new blocker diagnosis route.' : 'Get Source Documents candidates are not visible after the new blocker diagnosis route.',
      sourceSelectionVisible ? 'A true source document selection context is visible after Get Source attempt.' : 'No true source document selection context is visible after Get Source attempt.'
    ],
    doesNotProve: [
      'No source document was selected or confirmed.',
      'No Warehouse Receipt was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    warnings: [
      okOrSelectVisible ? 'OK/Select is visible and was intentionally not clicked.' : 'No OK/Select confirmation was used.',
      'Post Receipt candidates were recorded and intentionally not clicked.',
      'This case diagnoses action visibility and does not approve source selection or posting.'
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
    rebuildInstruction: 'In German final sandbox, repeat the Warehouse Receipt route with German source documents and capture source selection before Warehouse Receipt posting.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof must select source document, post Warehouse Receipt, handle Put-away and trace Warehouse/Item/Value entries.',
    finalScreenshotNeeded: true,
    nextCase: resultStatus === 'observed'
      ? 'WAREHOUSE-015-SOURCE-DOCUMENT-CANDIDATE-SELECT-NO-POST'
      : 'WAREHOUSE-015-WAREHOUSE-SOURCE-DOCUMENT-ROUTE-DECISION',
    nextStep: resultStatus === 'observed'
      ? 'WAREHOUSE-015: choose a source document candidate but stop before posting.'
      : 'WAREHOUSE-015: decide whether to use Use Filters to Get Src. Docs, create a fresh released source document, or park Warehouse Receipt source selection.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-list-text.txt'), compactText(listText));
  await writeJsonEvidence(warehouseEvidencePath('020-list-buttons.json'), listButtons);
  await writeJsonEvidence(warehouseEvidencePath('030-receipt-candidates.json'), receiptCandidates);
  await writeTextEvidence(warehouseEvidencePath('040-after-single-click-text.txt'), compactText(textAfterSingle));
  await writeTextEvidence(warehouseEvidencePath('050-after-open-attempts-text.txt'), compactText(textAfterOpenAttempts));
  await writeJsonEvidence(warehouseEvidencePath('060-after-open-attempts-buttons.json'), buttonsAfterOpenAttempts);
  await writeJsonEvidence(warehouseEvidencePath('070-layout-attempts.json'), layoutAttempts);
  await writeTextEvidence(warehouseEvidencePath('080-after-layout-text.txt'), compactText(textAfterLayout));
  await writeJsonEvidence(warehouseEvidencePath('090-after-layout-buttons.json'), buttonsAfterLayout);
  await writeJsonEvidence(warehouseEvidencePath('100-prepare-candidates.json'), prepareCandidates);
  await writeJsonEvidence(warehouseEvidencePath('110-start-candidates.json'), startCandidates);
  await writeJsonEvidence(warehouseEvidencePath('120-more-candidates.json'), moreCandidates);
  await writeJsonEvidence(warehouseEvidencePath('130-get-source-candidates-before-click.json'), getSourceCandidatesBeforeClick);
  await writeJsonEvidence(warehouseEvidencePath('140-get-source-candidates-after-click.json'), getSourceCandidatesAfterClick);
  await writeTextEvidence(warehouseEvidencePath('150-final-text.txt'), compactText(finalText));
  await writeJsonEvidence(warehouseEvidencePath('160-final-buttons.json'), finalButtons);
  await writeJsonEvidence(warehouseEvidencePath('170-post-candidates-not-clicked.json'), postCandidates);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-014-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-014-SOURCE-DOCUMENT-BLOCKER.md'),
    [
      '# WAREHOUSE-014 Source Document Action Blocker',
      '',
      'Status: `labor`, `ui-first`, `blocked`, `no-posting`, `not-final`.',
      '',
      `Receipt sichtbar: ${receiptVisible ? 'ja' : 'nein'}`,
      `Karten-/Receipt-Kontext sichtbar: ${cardLikeContextVisible ? 'ja' : 'nein'}`,
      `Layout-/Action-Erweiterung geklickt: ${layoutAttempts.some((entry) => entry.clicked) ? 'ja' : 'nein'}`,
      `Get Source Documents Kandidaten sichtbar: ${getSourceCandidatesBeforeClick.length}`,
      `Get Source Documents geklickt: ${getSourceClicked ? 'ja' : 'nein'}`,
      `Source-Auswahlkontext sichtbar: ${sourceSelectionVisible ? 'ja' : 'nein'}`,
      `OK/Select sichtbar und nicht geklickt: ${okOrSelectVisible ? 'ja' : 'nein'}`,
      '',
      '## Blocker',
      '',
      ...blockedBy.map((entry) => `- ${entry}`),
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
      '# WAREHOUSE-014 Evidence Index',
      '',
      'Status: `labor`, `ui-first`, `blocked`, `no-posting`, `not-final`.',
      '',
      'WAREHOUSE-014 prueft eine neue Hypothese gegen den WAREHOUSE-013-Blocker: zuerst vorhandenen Receipt-Kontext `RE000001`, dann Layout-/Action-Erweiterung, danach Get-Source-Action-Inventar. Es wird nicht gebucht und kein Source Document bestaetigt.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-014-result.json` | Result JSON | Receipt-/Action-Kontext und Blockerklassifikation | Source-Auswahl, Posting, Postenspur |',
      '| `130-get-source-candidates-before-click.json` | Action-Inventar | Ob Get Source Documents nach Layout-Erweiterung sichtbar ist | Dass Auswahl fachlich bereit ist |',
      '| `170-post-candidates-not-clicked.json` | Safety Evidence | Post Receipt wurde erkannt und nicht geklickt | Posting |',
      '| `WAREHOUSE-014-SOURCE-DOCUMENT-BLOCKER.md` | Lernnotiz | kompakte Blocker-/Next-Step-Einordnung | deutschen Finalnachweis |',
      '',
      'Naechster Schritt: WAREHOUSE-015 entscheidet zwischen Use-Filters-Route, frischem freigegebenem Source Document oder Parken des Warehouse-Receipt-Zweigs.',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.postActionClicked).toBe(false);
});
