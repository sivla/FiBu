import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, compactPageText, dismissTours, hideFactBoxPane, pageText, screenshot, waitForBusinessCentralShell, waitForPageText } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(360_000);

const testId = 'fixedassets-051';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH',
  pageId: 26,
  sourceTable: 'Vendor',
  sourceTableId: 23,
};

const criticalTerms = [
  'Page Inspection',
  'Inspect pages and data',
  'Page',
  'Page ID',
  'Vendor Card',
  'Source Table',
  'Table',
  'Table ID',
  'Vendor',
  'K30000',
  'Vendor Posting Group',
  'Gen. Bus. Posting Group',
  'Currency Code',
  'VAT Bus. Posting Group',
  'Tax Area Code',
  'Tax Liable',
  'Payment Terms Code',
  'Payment Method Code',
];

const criticalFieldTerms = [
  'Vendor Posting Group',
  'Gen. Bus. Posting Group',
  'Currency Code',
  'VAT Bus. Posting Group',
  'Tax Area Code',
  'Tax Liable',
  'Payment Terms Code',
  'Payment Method Code',
];

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function vendorCardUrl() {
  const url = new URL(bcPageUrl(target.pageId, project.envPrefix));
  url.searchParams.set('filter', `'Vendor'.'No.' IS '${target.vendorNo}'`);
  return url.toString();
}

async function openVendorCard(page: Page) {
  await page.goto(vendorCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Vendor|Kreditor|K30000|Zollspedition/i, { timeout: 60_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(900);
}

async function clickTopHelpButton(page: Page) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a'))
          .filter(visible)
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            rect: rectOf(element),
          }))
          .filter((entry) => entry.rect.y <= 115)
          .map((entry) => {
            const label = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            const helpMatch = /Help|Hilfe|Support/i.test(label) || entry.text === '?' || entry.ariaLabel === '?' || entry.title === '?';
            const score = (helpMatch ? 100 : 0) + entry.rect.x / 100 - Math.abs(entry.rect.y - 28);
            return { ...entry, helpMatch, score };
          })
          .filter((entry) => entry.helpMatch)
          .sort((left, right) => right.score - left.score || right.rect.x - left.rect.x);
        const chosen = candidates[0];
        if (!chosen) {
          return { clicked: false, reason: 'help-button-not-found', candidates: [] };
        }
        chosen.element.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect },
        };
      })
      .catch((error) => ({ clicked: false, reason: 'evaluate-error', error: String(error), candidates: [] }));

    if (result.clicked) {
      await page.waitForTimeout(900);
      return result;
    }
  }

  return { clicked: false, reason: 'help-button-not-found-in-any-frame', candidates: [] };
}

async function clickVisibleTextLike(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((patternSource) => {
        const pattern = new RegExp(patternSource, 'i');
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,span,div'))
          .filter(visible)
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            rect: rectOf(element),
          }))
          .filter((entry) => {
            const haystack = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            return pattern.test(haystack) && haystack.length <= 220;
          })
          .filter((entry) => entry.rect.width >= 20 && entry.rect.height >= 10)
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) {
          return { clicked: false, reason: 'target-not-found', candidates: [] };
        }
        chosen.element.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect },
          candidates: candidates.slice(0, 5).map(({ element: _element, ...entry }) => entry),
        };
      }, pattern.source)
      .catch((error) => ({ clicked: false, reason: 'evaluate-error', error: String(error), candidates: [] }));

    if (result.clicked) {
      await page.waitForTimeout(1200);
      return result;
    }
  }

  return { clicked: false, reason: 'target-not-found-in-any-frame', candidates: [] };
}

async function closeExternalPages(page: Page) {
  const closed: string[] = [];
  for (const candidate of page.context().pages()) {
    if (candidate === page) {
      continue;
    }
    const url = candidate.url();
    if (!/businesscentral\.dynamics\.com/i.test(url)) {
      closed.push(url);
      await candidate.close().catch(() => undefined);
    }
  }
  return closed;
}

async function tryOpenPageInspection(page: Page) {
  const attempts: any[] = [];

  await page.keyboard.press('Control+Alt+F1');
  await page.waitForTimeout(2500);
  let closedExternalPages = await closeExternalPages(page);
  let text = await pageText(page);
  attempts.push({
    method: 'keyboard-control-alt-f1',
    opened: /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(text),
    closedExternalPages,
  });

  if (!attempts[0].opened) {
    const helpButton = await clickTopHelpButton(page);
    closedExternalPages = await closeExternalPages(page);
    attempts.push({ method: 'top-help-button', ...helpButton, closedExternalPages });

    const helpSupport = await clickVisibleTextLike(page, /Help & Support|Help and Support|Hilfe.*Support|Hilfe und Support/);
    closedExternalPages = await closeExternalPages(page);
    attempts.push({ method: 'help-and-support-menu', ...helpSupport, closedExternalPages });

    const inspect = await clickVisibleTextLike(page, /Inspect pages and data|Page Inspection|Inspect page|Seitenpruefung|Seitenpr.fung|Page untersuchen/);
    closedExternalPages = await closeExternalPages(page);
    attempts.push({ method: 'inspect-pages-and-data-action', ...inspect, closedExternalPages });
    await page.waitForTimeout(2500);
    text = await pageText(page);
  }

  const opened = /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(text);
  const focusedText = await compactPageText(page, {
    include: criticalTerms.map((term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')),
    maxLines: 120,
    maxLineLength: 220,
  });

  return { opened, attempts, focusedText };
}

async function collectPageInspectionFieldBlocks(page: Page, terms: string[]) {
  const blocks: Record<string, any[]> = Object.fromEntries(terms.map((term) => [term, []]));

  for (const top of [0, 350, 700, 1050, 1400, 1800, 2300, 2900]) {
    for (const frame of page.frames()) {
      await frame
        .evaluate((scrollTop) => {
          const rightPaneScrollables = Array.from(document.querySelectorAll<HTMLElement>('aside,section,div'))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.x > window.innerWidth * 0.55 && element.scrollHeight > element.clientHeight + 80 && rect.height > 250;
            })
            .sort((left, right) => right.clientHeight - left.clientHeight);
          for (const element of rightPaneScrollables.slice(0, 3)) {
            element.scrollTo({ top: scrollTop, behavior: 'instant' });
          }
        }, top)
        .catch(() => undefined);
    }
    await page.waitForTimeout(250);

    for (const frame of page.frames()) {
      const found = await frame
        .evaluate((targetTerms) => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const rectOf = (element: Element) => {
            const rect = element.getBoundingClientRect();
            return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
          };
          const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const result: Record<string, any[]> = Object.fromEntries(targetTerms.map((term) => [term, []]));
          const visibleElements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(visible);

          for (const term of targetTerms) {
            const pattern = new RegExp(escape(term), 'i');
            const matches = visibleElements
              .map((element) => ({
                text: normalize(element.innerText || element.textContent),
                ariaLabel: normalize(element.getAttribute('aria-label')),
                title: normalize(element.getAttribute('title')),
                tagName: element.tagName,
                role: normalize(element.getAttribute('role')),
                rect: rectOf(element),
              }))
              .filter((entry) => pattern.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
              .filter((entry) => entry.text.length >= term.length && entry.text.length <= 700)
              .filter((entry) => entry.rect.x > window.innerWidth * 0.5)
              .sort((left, right) => left.text.length - right.text.length || left.rect.y - right.rect.y);
            result[term] = matches.slice(0, 8);
          }

          return result;
        }, terms)
        .catch(() => Object.fromEntries(terms.map((term) => [term, []])));

      for (const term of terms) {
        blocks[term].push(...(found[term] ?? []));
      }
    }
  }

  return Object.fromEntries(
    Object.entries(blocks).map(([term, entries]) => [
      term,
      entries
        .filter((entry, index, list) => index === list.findIndex((other) => other.text === entry.text && JSON.stringify(other.rect) === JSON.stringify(entry.rect)))
        .slice(0, 10),
    ]),
  );
}

function extractExplicitValueCandidates(fieldBlockText: string, caption: string) {
  const captionPattern = new RegExp(caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const inlineValue = fieldBlockText
    .replace(captionPattern, '')
    .replace(/\(\d+,\s*(?:Code|Text|Boolean|Decimal|Date)[^\)]*\)/gi, '')
    .replace(/Base Application/gi, '')
    .replace(/Text suchen|Search text/gi, '')
    .trim();
  const inlineCandidates = inlineValue && !/^\(Leer\)|^\(Blank\)/i.test(inlineValue) ? [inlineValue] : [];

  const lineCandidates = fieldBlockText
    .split(/\n| {2,}/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !captionPattern.test(line))
    .filter((line) => !/Base Application|Code\[|Text\[|Decimal|Boolean|Date|TableRelation|Text suchen|Search text|Leer|\(Blank\)|^\(.+\)$/i.test(line))
    .filter((line) => line.length <= 60)
    .slice(0, 5);

  return [...new Set([...inlineCandidates, ...lineCandidates])].slice(0, 5);
}

test('FIXEDASSETS-051 - K30000 Vendor Card Page Inspection read-only proof', async ({ page }) => {
  await openVendorCard(page);

  const cardText = await compactPageText(page, {
    include: [/Vendor|Kreditor/i, /K30000/i, /Zollspedition/i, /Posting Group|Buchungsgruppe/i, /Currency Code|Währungscode|Waehrungscode/i, /Tax|VAT|USt|MwSt/i],
    maxLines: 80,
    maxLineLength: 220,
  });
  await writeTextEvidence(fixedAssetsEvidencePath('010-k30000-vendor-card-focused-text.txt'), cardText);

  await screenshot(page, 'fixedassets-051-010-k30000-vendor-card-before-pageinspection.png', {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: 'evidence',
    purpose:
      'Read-only Kontextbild der K30000 Vendor Card vor der Seitenpruefung. Das Bild beweist Vendor- und Seitenkontext, aber keine nicht sichtbaren Default-Codes.',
    expectedPageText: [/K30000/i, /Zollspedition/i],
    knownLimitations: [
      'Kein Proof fuer nicht sichtbare Default-Felder.',
      'Kein Setup-Fit, keine Personalisierung und keine Buchung.',
    ],
  });

  const inspection = await tryOpenPageInspection(page);
  const fieldBlocks = inspection.opened ? await collectPageInspectionFieldBlocks(page, criticalFieldTerms) : Object.fromEntries(criticalFieldTerms.map((term) => [term, []]));
  const explicitValueCandidates = Object.fromEntries(
    Object.entries(fieldBlocks).map(([caption, entries]) => [
      caption,
      [...new Set(entries.flatMap((entry: any) => extractExplicitValueCandidates(entry.text ?? '', caption)))],
    ]),
  );
  await writeJsonEvidence(fixedAssetsEvidencePath('030-pageinspection-critical-field-blocks.json'), {
    purpose:
      'Visible Page Inspection field blocks collected by scrolling the Page Inspection pane. Only explicit value candidates count as value proof; captions alone are not enough.',
    fieldBlocks,
    explicitValueCandidates,
  });

  await writeTextEvidence(
    fixedAssetsEvidencePath('020-pageinspection-focused-text.txt'),
    inspection.focusedText || 'Page Inspection focused text not visible in this run.',
  );

  const inspectionScreenshotName = inspection.opened
    ? 'fixedassets-051-020-pageinspection-context.png'
    : 'fixedassets-051-020-pageinspection-not-opened.png';
  await screenshot(page, inspectionScreenshotName, {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: inspection.opened ? 'evidence' : 'do-not-use',
    purpose: inspection.opened
      ? 'Seitenpruefung/Page Inspection als technischer Page-/Tabellenkontext fuer die K30000 Vendor Card.'
      : 'Diagnosebild: Page Inspection wurde in diesem UI-Lauf nicht belastbar sichtbar geoeffnet.',
    expectedPageText: inspection.opened ? [/Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i] : [/K30000|Zollspedition|Vendor/i],
    knownLimitations: inspection.opened
      ? [
          'Nur sichtbar lesbare Page-Inspection-Zeilen gelten als technischer Nachweis.',
          'Default-Codes gelten nur als bewiesen, wenn sie im fokussierten Text oder Screenshot lesbar sind.',
        ]
      : [
          'Nicht als Buch-Screenshot verwenden.',
          'Der Lauf bleibt read-only; Page Inspection muss in einem Folgepfad stabiler geoeffnet werden.',
        ],
  });

  const normalizedInspectionText = inspection.focusedText.replace(/\s+/g, ' ');
  const normalizedCardText = cardText.replace(/\s+/g, ' ');
  const result = {
    id: 'FIXEDASSETS-051-K30000-VENDOR-PAGEINSPECTION-READONLY',
    status: inspection.opened ? 'labor-readonly-pageinspection-opened' : 'labor-readonly-pageinspection-not-opened',
    runType: 'read-only-ui-evidence',
    environment: target.environment,
    company: target.company,
    target: {
      vendorNo: target.vendorNo,
      vendorName: target.vendorName,
      expectedPageId: target.pageId,
      expectedSourceTable: target.sourceTable,
      expectedSourceTableId: target.sourceTableId,
    },
    safety: {
      setupChanged: false,
      personalizationSaved: false,
      purchaseInvoiceCreated: false,
      postingAttempted: false,
      companySwitched: false,
      apiUsed: false,
    },
    vendorCardContext: {
      k30000Visible: /K30000/i.test(normalizedCardText),
      vendorNameVisible: /Zollspedition Nord GmbH/i.test(normalizedCardText),
      provesHiddenDefaultCodes: false,
    },
    pageInspection: {
      opened: inspection.opened,
      attempts: inspection.attempts,
      pageId26Visible: /Page ID\D{0,30}26|Vendor Card \(\s*26\s*,\s*Card\s*\)|26\D{0,30}Vendor Card/i.test(normalizedInspectionText),
      vendorCardVisible: /Vendor Card/i.test(normalizedInspectionText),
      sourceTableVendorVisible: /Source Table\D{0,40}Vendor|Table ID\D{0,30}23|Vendor\D{0,30}23/i.test(normalizedInspectionText),
      criticalFieldCaptionsVisible: {
        vendorPostingGroup: /Vendor Posting Group/i.test(normalizedInspectionText),
        genBusPostingGroup: /Gen\.? Bus\.? Posting Group/i.test(normalizedInspectionText),
        currencyCode: /Currency Code/i.test(normalizedInspectionText),
        vatBusPostingGroup: /VAT Bus\.? Posting Group/i.test(normalizedInspectionText),
        taxAreaCode: /Tax Area Code/i.test(normalizedInspectionText),
        taxLiable: /Tax Liable/i.test(normalizedInspectionText),
        paymentTermsCode: /Payment Terms Code/i.test(normalizedInspectionText),
        paymentMethodCode: /Payment Method Code/i.test(normalizedInspectionText),
      },
      fieldBlocksEvidence: `playwright/projects/fibu-book5/evidence/${testId}/030-pageinspection-critical-field-blocks.json`,
      explicitValueCandidates,
      provesCriticalDefaultValues: Object.values(explicitValueCandidates).some((values) => Array.isArray(values) && values.length > 0),
      focusedTextEvidence: `playwright/projects/fibu-book5/evidence/${testId}/020-pageinspection-focused-text.txt`,
    },
    screenshots: [
      `playwright/projects/fibu-book5/img/fixedassets-051-010-k30000-vendor-card-before-pageinspection.png`,
      `playwright/projects/fibu-book5/img/${inspectionScreenshotName}`,
    ],
    nextStep: inspection.opened
      ? 'Use the visible Page Inspection proof to decide whether K30000 defaults can be trusted for the FA purchase preflight, or perform a UI-first setup/default fit if critical values remain hidden.'
      : 'Stabilize the Page Inspection opening path or fall back to a documented UI-first setup/default fit gate before any fixed-asset purchase invoice.',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-051-result.json'), result);

  await expect(pageText(page)).resolves.toMatch(/K30000|Zollspedition|Vendor|Page Inspection|Inspect pages and data/i);
});
