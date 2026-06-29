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

const testId = 'warehouse-011';

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

function normalizeLines(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|cacheLocation|shouldAttachOauthTokens|TokenFactory/i.test(line));
}

function compactText(text: string) {
  const interesting = /Warehouse Receipt|Receipt|Prepare|Get Source|Source Document|Use Filters|Autofill|Calculate|Cross-Dock|Post Receipt|No\.|Location Code|Assigned User ID|Purchase|Order|Vendor|FRA-ZL|OK|Select|Cancel|Abbrechen|Error|Fehler|Weitere Optionen|More options/i;
  const selected = normalizeLines(text).filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-011-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
    '',
    ...selected.slice(0, 240)
  ].join('\n');
}

function isDangerous(label: string) {
  return /Post Receipt|^Post$|Buchen|Delete|Loeschen|L.schen|Ship|Invoice|Preview Posting|OK$|^OK$|Select|Auswaehlen|Ausw.hlen/i.test(label);
}

function isGridHeader(candidate: Candidate) {
  const combined = `${candidate.text} ${candidate.ariaLabel} ${candidate.title} ${candidate.tagName}`;
  return /Sortieren nach|Sort by|Men. f.r .*ffnen|Menü für .*öffnen|FORM/i.test(combined) || candidate.tagName === 'FORM';
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
            if (/button|menuitem/i.test(role) || /BUTTON|A/i.test(tagName)) score -= 6;
            if (/Post Receipt|^Post$|Buchen|Delete|Ship|Invoice|Preview|OK$|Select/i.test(combined)) score += 100;
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

async function clickBest(page: Page, pattern: RegExp) {
  const all = await candidates(page, pattern);
  const target = all.find((candidate) => !isDangerous(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`) && !isGridHeader(candidate));
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
      await page.waitForTimeout(1800);
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
        const candidates = nodes
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
          });
        const target = candidates[0]?.element;
        if (!target) return false;
        (target.closest('button,a,[role="button"],[role="menuitem"]') as HTMLElement | null ?? target).click();
        return true;
      }, pattern.source)
      .catch(() => false);
    if (clicked) {
      await page.waitForTimeout(1800);
      return true;
    }
  }
  return false;
}

test('WAREHOUSE-011 Prepare/Get Source Documents auf Warehouse Receipt Draft finden', async ({ page }) => {
  await page.goto(warehouseReceiptUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const beforeText = await pageText(page);
  const employeeBlockerVisible = /You must first set up user .* as a warehouse employee/i.test(beforeText);
  const newClicked = await clickExactVisibleText(page, /^New$|^Neu$/i);
  const afterNewText = await pageText(page);
  const afterNewButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const draftContextVisible = /Warehouse Receipt|No\.|Location Code|Assigned User ID|Post Receipt/i.test(afterNewText + ' ' + afterNewButtons.join(' '));

  const prepareCandidates = await candidates(page, /^Prepare$|Prepare|Vorbereiten/i);
  const prepareClick = await clickBest(page, /^Prepare$|Prepare|Vorbereiten/i);
  const afterPrepareText = await pageText(page);
  const afterPrepareButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);

  const moreCandidates = await candidates(page, /Weitere Optionen|More options|More/i);
  const moreClick = await clickBest(page, /Weitere Optionen|More options|More/i);
  const finalText = await pageText(page);
  const finalButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const sourceCandidates = await candidates(page, /Get Source|Source Documents|Use Filters/i);
  const sourceProcessCandidates = sourceCandidates.filter((candidate) => !isGridHeader(candidate) && !isDangerous(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`));
  const postCandidates = await candidates(page, /Post Receipt|^Post$|Buchen/i);
  const getSourceVisible = sourceProcessCandidates.length > 0 || /Get Source|Use Filters|Source Documents/i.test(finalText + ' ' + finalButtons.join(' '));
  const okOrSelectVisible = finalButtons.some((button) => /^OK$|^Select$|Auswaehlen|Auswählen/i.test(button));
  const resultStatus = !employeeBlockerVisible && draftContextVisible && (prepareClick.clicked || moreClick.clicked || getSourceVisible)
    ? 'observed'
    : 'blocked';

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-document-action-on-draft',
    caseId: 'WAREHOUSE-011-SOURCE-DOCUMENT-ACTION-ON-DRAFT',
    source: 'playwright-ui-draft-action-inventory',
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
    employeeBlockerVisible,
    newClicked,
    draftContextVisible,
    afterNewButtons,
    prepareCandidates,
    prepareClick,
    afterPrepareButtons,
    moreCandidates,
    moreClick,
    finalButtons,
    sourceCandidates,
    sourceProcessCandidates,
    postCandidates,
    getSourceVisible,
    okOrSelectVisible,
    postActionClicked: false,
    proves: [
      employeeBlockerVisible
        ? 'Warehouse Employee blocker is still visible.'
        : 'Warehouse Employee blocker is not visible.',
      draftContextVisible
        ? 'Warehouse Receipt draft context is visible.'
        : 'Warehouse Receipt draft context is not visible.',
      getSourceVisible
        ? 'Get Source / Source Documents signal is visible on or after draft action inventory.'
        : 'Get Source / Source Documents signal is not visible after Prepare/More action inventory.'
    ],
    doesNotProve: [
      'No source document was selected or confirmed.',
      'No Warehouse Receipt was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    blockedBy: resultStatus === 'observed' ? [] : [
      employeeBlockerVisible ? 'warehouse-employee-blocker-visible' : 'get-source-documents-not-visible-after-draft-action-inventory'
    ],
    warnings: [
      newClicked
        ? 'A Warehouse Receipt draft/page state may remain and is explicitly kept for follow-up evidence.'
        : 'No Warehouse Receipt draft was created.',
      okOrSelectVisible
        ? 'OK/Select is visible and was intentionally not clicked.'
        : 'No OK/Select confirmation was used.',
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
    rebuildInstruction: 'In German final sandbox, repeat Warehouse Receipt draft action inventory and source document selection before any posting.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof must select source document, post Warehouse Receipt, handle Put-away and trace Warehouse/Item/Value entries.',
    finalScreenshotNeeded: true,
    nextCase: resultStatus === 'observed' && getSourceVisible
      ? 'WAREHOUSE-012-GET-SOURCE-DOCUMENTS-NO-CONFIRM'
      : 'WAREHOUSE-012-WAREHOUSE-RECEIPT-ACTION-INVENTORY-BLOCKER',
    nextStep: resultStatus === 'observed' && getSourceVisible
      ? 'WAREHOUSE-012: open Get Source Documents route and stop before OK/Select.'
      : 'WAREHOUSE-012: refine action inventory around Prepare/More/Line actions before source document selection.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-new-text.txt'), compactText(beforeText));
  await writeTextEvidence(warehouseEvidencePath('020-after-new-text.txt'), compactText(afterNewText));
  await writeJsonEvidence(warehouseEvidencePath('030-after-new-buttons.json'), afterNewButtons);
  await writeJsonEvidence(warehouseEvidencePath('040-prepare-candidates.json'), prepareCandidates);
  await writeTextEvidence(warehouseEvidencePath('050-after-prepare-text.txt'), compactText(afterPrepareText));
  await writeJsonEvidence(warehouseEvidencePath('060-after-prepare-buttons.json'), afterPrepareButtons);
  await writeJsonEvidence(warehouseEvidencePath('070-more-candidates.json'), moreCandidates);
  await writeTextEvidence(warehouseEvidencePath('080-final-text.txt'), compactText(finalText));
  await writeJsonEvidence(warehouseEvidencePath('090-final-buttons.json'), finalButtons);
  await writeJsonEvidence(warehouseEvidencePath('100-source-candidates.json'), sourceCandidates);
  await writeJsonEvidence(warehouseEvidencePath('110-post-candidates-not-clicked.json'), postCandidates);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-011-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-011-SOURCE-DOCUMENT-ACTION-ON-DRAFT.md'),
    [
      '# WAREHOUSE-011 Source Document Action On Draft',
      '',
      'Status: `labor`, `ui-first`, `draft-action-inventory`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      `Status: \`${result.resultStatus}\``,
      `Draft-Kontext sichtbar: ${draftContextVisible ? 'ja' : 'nein'}`,
      `Prepare geklickt: ${prepareClick.clicked ? 'ja' : 'nein'}`,
      `More/Weitere Optionen geklickt: ${moreClick.clicked ? 'ja' : 'nein'}`,
      `Get Source sichtbar: ${getSourceVisible ? 'ja' : 'nein'}`,
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
      '# WAREHOUSE-011 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `WAREHOUSE-011-result.json` | JSON-Ergebnis | Prepare/More Action Inventory auf Warehouse Receipt Draft | keine Auswahl/Buchung | labor-action-inventory |',
      '| `040-prepare-candidates.json` | Kandidatenliste | Prepare-Kandidaten | keine Source-Document-Auswahl | ui-evidence |',
      '| `100-source-candidates.json` | Kandidatenliste | Get-Source-/Source-Document-Signale | keine Bestaetigung | ui-evidence |',
      '| `110-post-candidates-not-clicked.json` | Sicherheitsliste | Post-Risiko wurde erkannt | Post wurde nicht geklickt | safety-evidence |',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.postActionClicked).toBe(false);
  expect(employeeBlockerVisible).toBe(false);
});
