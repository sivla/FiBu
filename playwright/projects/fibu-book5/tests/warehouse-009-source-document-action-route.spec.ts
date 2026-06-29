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

const testId = 'warehouse-009';

type ActionCandidate = {
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

function warehouseSourceDocumentUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '7331');
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

function compactWarehouseText(text: string) {
  const interesting = /Warehouse|Receipt|Source Document|Get Source|Use Filters|Purchase|Order|Vendor|K10000|RAW-STEEL|FRA-ZL|Location|Assigned User|Post Receipt|OK|Select|Cancel|Abbrechen|Error|Fehler/i;
  const selected = normalizeLines(text).filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-009-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
    '',
    ...selected.slice(0, 220)
  ].join('\n');
}

function isDangerousAction(label: string) {
  return /Post Receipt|^Post$|Buchen|Delete|Loeschen|L.schen|Ship|Invoice|Preview Posting/i.test(label);
}

function isColumnHeaderOrGridShell(candidate: ActionCandidate) {
  const combined = `${candidate.text} ${candidate.ariaLabel} ${candidate.title} ${candidate.role} ${candidate.tagName}`;
  return /Sortieren nach|Sort by|Men. f.r .*ffnen|Menü für .*öffnen|FORM/i.test(combined)
    || candidate.tagName === 'FORM'
    || (candidate.role === 'button' && /Sortieren|Sort/i.test(candidate.title));
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
              box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              score,
              visible: rect.width > 0 && rect.height > 0
            };
          })
          .filter((entry) => entry.visible && pattern.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
          .sort((left, right) => left.score - right.score)
          .slice(0, 20);
      }, pattern.source)
      .catch(() => []);
    candidates.push(...frameCandidates.map(({ visible, ...entry }) => entry));
  }
  return candidates.sort((left, right) => left.score - right.score);
}

async function clickBestAction(page: Page, pattern: RegExp) {
  const candidates = await actionCandidates(page, pattern);
  const target = candidates.find((candidate) =>
    !isDangerousAction(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`)
    && !isColumnHeaderOrGridShell(candidate)
  );
  if (!target) return { clicked: false, candidates, clickedCandidate: null as ActionCandidate | null };

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
      await page.waitForTimeout(1800);
      return { clicked: true, candidates, clickedCandidate: target };
    }
  }
  return { clicked: false, candidates, clickedCandidate: target };
}

test('WAREHOUSE-009 Source Document action route auf page 7331 pruefen', async ({ page }) => {
  await page.goto(warehouseSourceDocumentUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const beforeText = await pageText(page);
  const beforeButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const sourceDocumentCandidates = await actionCandidates(page, /^Source Document$|Source Document/i);
  const processActionCandidates = sourceDocumentCandidates.filter((candidate) => !isColumnHeaderOrGridShell(candidate));
  const postCandidates = await actionCandidates(page, /Post Receipt|^Post$|Buchen/i);
  const employeeBlockerVisible = /You must first set up user .* as a warehouse employee/i.test(beforeText);

  const sourceDocumentClick = processActionCandidates.length > 0
    ? await clickBestAction(page, /^Source Document$|Source Document/i)
    : { clicked: false, candidates: sourceDocumentCandidates, clickedCandidate: null as ActionCandidate | null };

  const afterSourceMenuText = await pageText(page);
  const afterSourceMenuButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const getSourceCandidates = await actionCandidates(page, /Get Source|Use Filters|Source Documents/i);
  const openedMenuOrPage = sourceDocumentClick.clicked && /Get Source|Use Filters|Purchase|Order|Vendor|Document Type|Document No\./i.test(afterSourceMenuText + ' ' + afterSourceMenuButtons.join(' '));

  let getSourceClick = { clicked: false, candidates: getSourceCandidates, clickedCandidate: null as ActionCandidate | null };
  if (openedMenuOrPage && getSourceCandidates.length > 0) {
    getSourceClick = await clickBestAction(page, /Get Source|Use Filters|Source Documents/i);
  }

  const finalText = await pageText(page);
  const finalButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const lineGridOnlyVisible = /Source Document|Source No\.|Due Date|Item No\.|Description|Quantity|Unit of Measure Code/i.test(finalText + ' ' + finalButtons.join(' '));
  const selectionUiVisible = /Get Source|Use Filters|Purchase Order|Vendor|Document Type|Document No\.|OK|Cancel|Abbrechen|Select/i.test(finalText + ' ' + finalButtons.join(' '));
  const okOrSelectVisible = finalButtons.some((button) => /^OK$|^Select$|Auswaehlen|Auswählen/i.test(button));
  const trueProcessRouteOpened = sourceDocumentClick.clicked || openedMenuOrPage || getSourceClick.clicked;
  const resultStatus = !employeeBlockerVisible && trueProcessRouteOpened && selectionUiVisible
    ? 'observed'
    : 'blocked';

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-document-action-route',
    caseId: 'WAREHOUSE-009-SOURCE-DOCUMENT-ACTION-ROUTE',
    source: 'playwright-ui-source-document-action-route',
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
    apiShortcut: false,
    page: {
      pageId: 7331,
      url: page.url(),
      employeeBlockerVisible
    },
    beforeButtons,
    sourceDocumentCandidates,
    processActionCandidates,
    lineGridOnlyVisible,
    sourceDocumentClick,
    afterSourceMenuButtons,
    getSourceCandidates,
    getSourceClick,
    trueProcessRouteOpened,
    selectionUiVisible,
    okOrSelectVisible,
    postCandidates,
    postActionClicked: false,
    proves: [
      employeeBlockerVisible
        ? 'Warehouse Employee blocker is still visible.'
        : 'Warehouse Employee blocker is not visible on page 7331.',
      sourceDocumentClick.clicked
        ? 'The Source Document action surface on page 7331 can be opened without clicking Post Receipt.'
        : 'No true Source Document process action was opened; visible Source Document candidates were column/grid controls.',
      selectionUiVisible
        ? 'A Source Document / selection / filter UI signal is visible after the route attempt.'
        : 'No Source Document selection UI signal is visible after the route attempt.',
      lineGridOnlyVisible
        ? 'The page shows Source Document line-grid columns, but this is not the same as selecting a source document.'
        : 'No Source Document line-grid proof was found.'
    ],
    doesNotProve: [
      'No source document was selected or confirmed.',
      'No Warehouse Receipt was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    blockedBy: resultStatus === 'observed' ? [] : [
      employeeBlockerVisible ? 'warehouse-employee-blocker-visible' : 'only-source-document-line-grid-visible-no-process-action'
    ],
    warnings: [
      okOrSelectVisible
        ? 'OK/Select is visible after route opening and was intentionally not clicked.'
        : 'No OK/Select confirmation was used.',
      'Post Receipt candidates were recorded as risk evidence and intentionally not clicked.'
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
    rebuildInstruction: 'In German final sandbox, repeat this page 7331 Source Document route with a final purchase source document and then continue to Warehouse Receipt posting only after a separate gate.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof must select a source document, post Warehouse Receipt, create/handle Put-away and trace Warehouse/Item/Value entries.',
    finalScreenshotNeeded: true,
    nextCase: resultStatus === 'observed'
      ? 'WAREHOUSE-010-SOURCE-DOCUMENT-CANDIDATE-SELECTION'
      : 'WAREHOUSE-010-WAREHOUSE-RECEIPT-DRAFT-LIFECYCLE-ROUTE',
    nextStep: resultStatus === 'observed'
      ? 'WAREHOUSE-010: identify and select a concrete purchase source document without posting.'
      : 'WAREHOUSE-010: create a controlled Warehouse Receipt draft first, then retry Get Source Documents route without posting.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-source-document-action-text.txt'), compactWarehouseText(beforeText));
  await writeJsonEvidence(warehouseEvidencePath('020-before-buttons.json'), beforeButtons);
  await writeJsonEvidence(warehouseEvidencePath('030-source-document-candidates.json'), sourceDocumentCandidates);
  await writeJsonEvidence(warehouseEvidencePath('040-post-candidates-not-clicked.json'), postCandidates);
  await writeTextEvidence(warehouseEvidencePath('050-after-source-document-action-text.txt'), compactWarehouseText(afterSourceMenuText));
  await writeJsonEvidence(warehouseEvidencePath('060-after-source-document-action-buttons.json'), afterSourceMenuButtons);
  await writeJsonEvidence(warehouseEvidencePath('070-get-source-candidates.json'), getSourceCandidates);
  await writeTextEvidence(warehouseEvidencePath('080-final-route-text.txt'), compactWarehouseText(finalText));
  await writeJsonEvidence(warehouseEvidencePath('090-final-buttons.json'), finalButtons);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-009-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-009-SOURCE-DOCUMENT-ACTION-ROUTE.md'),
    [
      '# WAREHOUSE-009 Source Document Action Route',
      '',
      'Status: `labor`, `ui-first`, `source-document-route`, `no-posting`, `not-final`.',
      '',
      '## Ziel',
      '',
      'WAREHOUSE-009 nutzt den aus WAREHOUSE-006 bekannten Page-7331-Kandidaten, weil page 7332 nur den Receipt-Kontext, aber keine Source-Document-Aktion sichtbar machte.',
      '',
      '## Ergebnis',
      '',
      `Status: \`${result.resultStatus}\``,
      `Warehouse-Employee-Blocker sichtbar: ${employeeBlockerVisible ? 'ja' : 'nein'}`,
      `Nur Source-Document-Zeilenraster sichtbar: ${lineGridOnlyVisible ? 'ja' : 'nein'}`,
      `Source Document geklickt: ${sourceDocumentClick.clicked ? 'ja' : 'nein'}`,
      `Get Source/Use Filters geklickt: ${getSourceClick.clicked ? 'ja' : 'nein'}`,
      `Auswahl-/Filter-UI sichtbar: ${selectionUiVisible ? 'ja' : 'nein'}`,
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
      '# WAREHOUSE-009 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `WAREHOUSE-009-result.json` | JSON-Ergebnis | page-7331 Source-Document-Routenstatus | keine Auswahl/Buchung | labor-route |',
      '| `030-source-document-candidates.json` | Kandidatenliste | konkrete Source-Document-Aktionskandidaten | keine Bestaetigung | ui-evidence |',
      '| `040-post-candidates-not-clicked.json` | Sicherheitsliste | Post-Risiko wurde erkannt | Post wurde nicht geklickt | safety-evidence |',
      '| `080-final-route-text.txt` | kompakter Seitentext | finaler UI-Zustand nach Routenversuch | keine Postenspur | ui-evidence |',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.postActionClicked).toBe(false);
  expect(employeeBlockerVisible).toBe(false);
});
