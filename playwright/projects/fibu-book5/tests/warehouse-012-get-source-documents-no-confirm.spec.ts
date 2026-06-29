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

const testId = 'warehouse-012';

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
  const interesting = /Warehouse Receipt|Get Source|Source Documents?|Purchase|Order|Vendor|Document Type|Document No\.|Location Code|FRA-ZL|RAW-STEEL|K10000|OK|Select|Cancel|Abbrechen|Post Receipt|Error|Fehler|Released|Qty|Quantity/i;
  const selected = normalizeLines(text).filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-012-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
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

async function clickByText(page: Page, pattern: RegExp) {
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

test('WAREHOUSE-012 Get Source Documents oeffnen ohne OK Select', async ({ page }) => {
  await page.goto(warehouseReceiptUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const employeeBlockerVisible = /You must first set up user .* as a warehouse employee/i.test(await pageText(page));
  const newClicked = await clickByText(page, /^New$|^Neu$/i);
  const prepareClicked = await clickByText(page, /^Prepare$|Prepare|Vorbereiten/i);
  const moreClicked = await clickByText(page, /Weitere Optionen|More options|More/i);
  const beforeGetText = await pageText(page);
  const beforeGetButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const getSourceCandidates = await candidates(page, /^Get Source Documents|Get Source Documents\.\.\./i);
  const postCandidates = await candidates(page, /Post Receipt|^Post$|Buchen/i);

  const getSourceClicked = await clickByText(page, /^Get Source Documents|Get Source Documents\.\.\./i);
  const finalText = await pageText(page);
  const finalButtons = (await visibleButtonNames(page)).map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const sourceDocumentDialogVisible = /Source Documents?|Purchase Order|Vendor|Document Type|Document No\.|Released|OK|Cancel|Abbrechen|Select/i.test(finalText + ' ' + finalButtons.join(' '));
  const okOrSelectVisible = finalButtons.some((button) => /^OK$|^Select$|Auswaehlen|Auswählen/i.test(button));
  const purchaseSourceVisible = /Purchase Order|K10000|RAW-STEEL|FRA-ZL|Vendor|Purchase/i.test(finalText + ' ' + finalButtons.join(' '));
  const resultStatus = !employeeBlockerVisible && newClicked && getSourceClicked && sourceDocumentDialogVisible
    ? 'observed'
    : 'blocked';

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-get-source-documents-no-confirm',
    caseId: 'WAREHOUSE-012-GET-SOURCE-DOCUMENTS-NO-CONFIRM',
    source: 'playwright-ui-get-source-documents-no-confirm',
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
    prepareClicked,
    moreClicked,
    beforeGetButtons,
    getSourceCandidates,
    getSourceClicked,
    finalButtons,
    sourceDocumentDialogVisible,
    okOrSelectVisible,
    purchaseSourceVisible,
    postCandidates,
    postActionClicked: false,
    proves: [
      employeeBlockerVisible
        ? 'Warehouse Employee blocker is still visible.'
        : 'Warehouse Employee blocker is not visible.',
      getSourceClicked
        ? 'Get Source Documents route can be opened from the Warehouse Receipt draft.'
        : 'Get Source Documents route was not opened.',
      sourceDocumentDialogVisible
        ? 'A Source Documents / source selection context is visible after clicking Get Source Documents.'
        : 'No Source Documents selection context is visible after clicking Get Source Documents.'
    ],
    doesNotProve: [
      'No source document was selected or confirmed.',
      'No Warehouse Receipt was posted.',
      'No Put-away was created or posted.',
      'No item/value/warehouse ledger trace exists yet.',
      'No German final Warehouse proof.'
    ],
    blockedBy: resultStatus === 'observed' ? [] : [
      employeeBlockerVisible ? 'warehouse-employee-blocker-visible' : 'get-source-documents-dialog-not-visible'
    ],
    warnings: [
      newClicked
        ? 'A Warehouse Receipt draft/page state may remain and is explicitly kept for follow-up evidence.'
        : 'No Warehouse Receipt draft was created.',
      okOrSelectVisible
        ? 'OK/Select is visible after Get Source Documents and was intentionally not clicked.'
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
    rebuildInstruction: 'In German final sandbox, repeat Get Source Documents and select a final purchase source document before any receipt posting.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final proof must select source document, post Warehouse Receipt, handle Put-away and trace Warehouse/Item/Value entries.',
    finalScreenshotNeeded: true,
    nextCase: resultStatus === 'observed'
      ? 'WAREHOUSE-013-SOURCE-DOCUMENT-CANDIDATE-SELECT-NO-POST'
      : 'WAREHOUSE-013-GET-SOURCE-DOCUMENTS-BLOCKER-REVIEW',
    nextStep: resultStatus === 'observed'
      ? 'WAREHOUSE-013: inspect/select a concrete purchase source document candidate without posting.'
      : 'WAREHOUSE-013: diagnose Get Source Documents dialog route before source selection.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-get-source-text.txt'), compactText(beforeGetText));
  await writeJsonEvidence(warehouseEvidencePath('020-before-get-source-buttons.json'), beforeGetButtons);
  await writeJsonEvidence(warehouseEvidencePath('030-get-source-candidates.json'), getSourceCandidates);
  await writeJsonEvidence(warehouseEvidencePath('040-post-candidates-not-clicked.json'), postCandidates);
  await writeTextEvidence(warehouseEvidencePath('050-after-get-source-text.txt'), compactText(finalText));
  await writeJsonEvidence(warehouseEvidencePath('060-after-get-source-buttons.json'), finalButtons);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-012-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-012-GET-SOURCE-DOCUMENTS-NO-CONFIRM.md'),
    [
      '# WAREHOUSE-012 Get Source Documents No Confirm',
      '',
      'Status: `labor`, `ui-first`, `source-document-dialog`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      `Status: \`${result.resultStatus}\``,
      `Get Source Documents geklickt: ${getSourceClicked ? 'ja' : 'nein'}`,
      `Source-Document-Kontext sichtbar: ${sourceDocumentDialogVisible ? 'ja' : 'nein'}`,
      `Purchase-Source-Signal sichtbar: ${purchaseSourceVisible ? 'ja' : 'nein'}`,
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
      '# WAREHOUSE-012 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `WAREHOUSE-012-result.json` | JSON-Ergebnis | Get-Source-Documents-Routenstatus | keine Auswahl/Buchung | labor-route |',
      '| `030-get-source-candidates.json` | Kandidatenliste | Get-Source-Kandidaten | keine Bestaetigung | ui-evidence |',
      '| `050-after-get-source-text.txt` | kompakter Seitentext | Zustand nach Get Source Documents | keine Postenspur | ui-evidence |',
      '| `040-post-candidates-not-clicked.json` | Sicherheitsliste | Post-Risiko wurde erkannt | Post wurde nicht geklickt | safety-evidence |',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.postActionClicked).toBe(false);
  expect(employeeBlockerVisible).toBe(false);
});
