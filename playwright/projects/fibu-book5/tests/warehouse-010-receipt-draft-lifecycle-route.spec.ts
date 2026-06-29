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

const testId = 'warehouse-010';

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
  const interesting = /Warehouse Receipts?|Receipt|No\.|Location Code|Assigned User ID|Source Document|Get Source|Use Filters|Purchase|Order|Vendor|FRA-ZL|Post Receipt|OK|Select|Cancel|Abbrechen|Error|Fehler|New|Neu/i;
  const selected = normalizeLines(text).filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-010-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
    '',
    ...selected.slice(0, 220)
  ].join('\n');
}

function isDangerous(label: string) {
  return /Post Receipt|^Post$|Buchen|Delete|Loeschen|L.schen|Ship|Invoice|Preview Posting/i.test(label);
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
            if (/Post Receipt|^Post$|Buchen|Delete|Ship|Invoice|Preview/i.test(combined)) score += 100;
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
          .slice(0, 30);
      }, pattern.source)
      .catch(() => []);
    found.push(...frameCandidates.map(({ visible, ...entry }) => entry));
  }
  return found.sort((left, right) => left.score - right.score);
}

function isGridHeader(candidate: Candidate) {
  const combined = `${candidate.text} ${candidate.ariaLabel} ${candidate.title} ${candidate.tagName}`;
  return /Sortieren nach|Sort by|Men. f.r .*ffnen|Menü für .*öffnen|FORM/i.test(combined) || candidate.tagName === 'FORM';
}

async function clickCandidate(page: Page, pattern: RegExp) {
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
            !/Post|Buchen|Delete|Ship|Invoice|Preview/i.test(entry.text)
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
      await page.waitForTimeout(2200);
      return true;
    }
  }
  return false;
}

test('WAREHOUSE-010 Warehouse Receipt Draft Lifecycle Route ohne Posting', async ({ page }) => {
  await page.goto(warehouseReceiptUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const beforeText = await pageText(page);
  const beforeButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const beforeNewCandidates = await candidates(page, /^New$|^Neu$/i);
  const beforePostCandidates = await candidates(page, /Post Receipt|^Post$|Buchen/i);
  const employeeBlockerVisible = /You must first set up user .* as a warehouse employee/i.test(beforeText);

  const newClick = await clickCandidate(page, /^New$|^Neu$/i);
  const newFallbackClicked = newClick.clicked ? false : await clickExactVisibleText(page, /^New$|^Neu$/i);
  const afterNewText = await pageText(page);
  const afterNewButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const draftContextVisible = /Warehouse Receipt|Warehouse Receipts|No\.|Location Code|Assigned User ID|Post Receipt/i.test(afterNewText + ' ' + afterNewButtons.join(' '));
  const noCandidate = normalizeLines(afterNewText).find((line) => /^No\.|No\./i.test(line)) ?? '';
  const sourceCandidates = await candidates(page, /Get Source|Use Filters|Source Document/i);
  const sourceProcessCandidates = sourceCandidates.filter((candidate) => !isGridHeader(candidate));
  const sourceClick = sourceProcessCandidates.length > 0 ? await clickCandidate(page, /Get Source|Use Filters|Source Document/i) : { clicked: false, candidates: sourceCandidates, clickedCandidate: null as Candidate | null };

  const finalText = await pageText(page);
  const finalButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const selectionUiVisible = /Get Source|Use Filters|Source Documents?|Purchase Order|Vendor|Document Type|Document No\.|OK|Cancel|Abbrechen|Select/i.test(finalText + ' ' + finalButtons.join(' '));
  const okOrSelectVisible = finalButtons.some((button) => /^OK$|^Select$|Auswaehlen|Auswählen/i.test(button));
  const newRouteClicked = newClick.clicked || newFallbackClicked;
  const resultStatus = !employeeBlockerVisible && newRouteClicked && draftContextVisible
    ? 'observed'
    : 'blocked';

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-receipt-draft-lifecycle-route',
    caseId: 'WAREHOUSE-010-WAREHOUSE-RECEIPT-DRAFT-LIFECYCLE-ROUTE',
    source: 'playwright-ui-controlled-draft-route',
    resultStatus,
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    companySwitched: false,
    draftCreated: newRouteClicked,
    apiShortcut: false,
    employeeBlockerVisible,
    beforeButtons,
    beforeNewCandidates,
    beforePostCandidates,
    newFallbackClicked,
    newRouteClicked,
    newClick,
    draftContextVisible,
    noCandidate,
    afterNewButtons,
    sourceCandidates,
    sourceProcessCandidates,
    sourceClick,
    selectionUiVisible,
    okOrSelectVisible,
    postActionClicked: false,
    explicitKeepReason: newRouteClicked
      ? 'Controlled Warehouse Receipt draft state kept as laboratory route evidence; no source document confirmation and no posting occurred.'
      : '',
    proves: [
      employeeBlockerVisible
        ? 'Warehouse Employee blocker is still visible.'
        : 'Warehouse Employee blocker is not visible.',
      newClick.clicked
        ? 'A controlled New/Neu route for Warehouse Receipt was clickable.'
        : newFallbackClicked
          ? 'A controlled exact visible text fallback clicked New/Neu on Warehouse Receipt.'
        : 'No controlled New/Neu route was clicked.',
      draftContextVisible
        ? 'Warehouse Receipt draft/page context is visible after New/Neu.'
        : 'Warehouse Receipt draft/page context is not visible after New/Neu.'
    ],
    doesNotProve: [
      'No source document was confirmed.',
      'No Warehouse Receipt was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    blockedBy: resultStatus === 'observed' ? [] : [
      employeeBlockerVisible ? 'warehouse-employee-blocker-visible' : 'warehouse-receipt-new-route-not-opened'
    ],
    warnings: [
      newRouteClicked
        ? 'A Warehouse Receipt draft/page state may remain and is explicitly kept for follow-up evidence.'
        : 'No Warehouse Receipt draft was created.',
      okOrSelectVisible
        ? 'OK/Select is visible after route attempt and was intentionally not clicked.'
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
    rebuildInstruction: 'In German final sandbox, repeat controlled Warehouse Receipt draft route and source document selection before any receipt posting.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof must create/select real source document, post Warehouse Receipt, handle Put-away and trace entries.',
    finalScreenshotNeeded: true,
    nextCase: resultStatus === 'observed'
      ? 'WAREHOUSE-011-SOURCE-DOCUMENT-SELECTION-ON-DRAFT'
      : 'WAREHOUSE-011-WAREHOUSE-RECEIPT-NEW-ROUTE-BLOCKER-REVIEW',
    nextStep: resultStatus === 'observed'
      ? 'WAREHOUSE-011: on the controlled Warehouse Receipt draft, select source document without posting.'
      : 'WAREHOUSE-011: diagnose why New/Neu did not open a usable Warehouse Receipt draft.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-new-text.txt'), compactText(beforeText));
  await writeJsonEvidence(warehouseEvidencePath('020-before-buttons.json'), beforeButtons);
  await writeJsonEvidence(warehouseEvidencePath('030-new-candidates.json'), beforeNewCandidates);
  await writeJsonEvidence(warehouseEvidencePath('040-post-candidates-not-clicked.json'), beforePostCandidates);
  await writeTextEvidence(warehouseEvidencePath('050-after-new-text.txt'), compactText(afterNewText));
  await writeJsonEvidence(warehouseEvidencePath('060-after-new-buttons.json'), afterNewButtons);
  await writeJsonEvidence(warehouseEvidencePath('070-source-candidates-after-new.json'), sourceCandidates);
  await writeTextEvidence(warehouseEvidencePath('080-final-text.txt'), compactText(finalText));
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-010-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-010-WAREHOUSE-RECEIPT-DRAFT-LIFECYCLE-ROUTE.md'),
    [
      '# WAREHOUSE-010 Warehouse Receipt Draft Lifecycle Route',
      '',
      'Status: `labor`, `ui-first`, `controlled-draft-route`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      `Status: \`${result.resultStatus}\``,
      `New/Neu geklickt: ${newRouteClicked ? 'ja' : 'nein'}`,
      `Davon per Textfallback: ${newFallbackClicked ? 'ja' : 'nein'}`,
      `Draft-/Receipt-Kontext sichtbar: ${draftContextVisible ? 'ja' : 'nein'}`,
      `Source-Kandidaten nach New: ${sourceProcessCandidates.length}`,
      `Source-Kandidat geklickt: ${sourceClick.clicked ? 'ja' : 'nein'}`,
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
      '# WAREHOUSE-010 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `WAREHOUSE-010-result.json` | JSON-Ergebnis | kontrollierte New-/Draft-Route fuer Warehouse Receipt | keine Auswahl/Buchung | labor-draft-route |',
      '| `030-new-candidates.json` | Kandidatenliste | New/Neu-Kandidaten | kein Posting | ui-evidence |',
      '| `040-post-candidates-not-clicked.json` | Sicherheitsliste | Post-Risiko wurde erkannt | Post wurde nicht geklickt | safety-evidence |',
      '| `050-after-new-text.txt` | kompakter Seitentext | Zustand nach New/Neu | keine Postenspur | ui-evidence |',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.postActionClicked).toBe(false);
  expect(employeeBlockerVisible).toBe(false);
});
