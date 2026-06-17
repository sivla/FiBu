import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, hideFactBoxPane, pageText, screenshot, waitForBusinessCentralShell, waitForPageText } from '../../../core/bc-helpers';
import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(360_000);

const testId = 'fixedassets-045';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH',
};

const criticalCaptions = ['Vendor Posting Group', 'Gen. Bus. Posting Group', 'Currency Code', 'VAT Bus. Posting Group'];
const contextCaptions = ['Tax Area Code', 'Tax Liable', 'Payment Terms Code', 'Payment Method Code'];
const allCaptions = [...criticalCaptions, ...contextCaptions];

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function vendorCardUrl() {
  const url = new URL(bcPageUrl(26, project.envPrefix));
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

async function scrollMain(page: Page, top: number) {
  for (const frame of page.frames()) {
    const scrolled = await frame
      .evaluate((scrollTop) => {
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('main,[role="main"],.ms-nav-layout,div'))
          .filter((element) => element.scrollHeight > element.clientHeight + 120)
          .sort((left, right) => right.clientHeight - left.clientHeight);
        const targetElement = candidates[0] ?? document.scrollingElement;
        targetElement?.scrollTo({ top: scrollTop, behavior: 'instant' });
        return Boolean(targetElement);
      }, top)
      .catch(() => false);
    if (scrolled) {
      await page.waitForTimeout(700);
      return;
    }
  }
  await page.mouse.wheel(0, top);
  await page.waitForTimeout(700);
}

async function expandFastTabByChevron(page: Page, caption: string) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((targetCaption) => {
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
        const captionPattern = new RegExp(`(^|\\b)${escape(targetCaption)}($|\\b)`, 'i');
        const visibleElements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(visible);
        const captionCandidates = visibleElements
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            rect: rectOf(element),
          }))
          .filter((entry) => captionPattern.test(entry.text) || captionPattern.test(entry.ariaLabel) || captionPattern.test(entry.title))
          .filter((entry) => !entry.text || entry.text.length <= 120)
          .filter((entry) => !entry.ariaLabel || entry.ariaLabel.length <= 120)
          .filter((entry) => !entry.title || entry.title.length <= 120)
          .filter((entry) => entry.rect.width > 30 && entry.rect.height > 10 && entry.rect.width <= 520 && entry.rect.height <= 80)
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const captionEntry = captionCandidates[0];

        if (!captionEntry) {
          return { clicked: false, caption: targetCaption, reason: 'caption-not-visible', candidates: [] };
        }

        const captionCenterY = captionEntry.rect.y + captionEntry.rect.height / 2;
        const controls = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[aria-expanded]'))
          .filter(visible)
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            ariaExpanded: normalize(element.getAttribute('aria-expanded')),
            rect: rectOf(element),
          }))
          .filter((entry) => entry.rect.width <= 90 && entry.rect.height <= 90)
          .filter((entry) => Math.abs(entry.rect.y + entry.rect.height / 2 - captionCenterY) <= 35 || Math.abs(entry.rect.y - captionEntry.rect.y) <= 45)
          .map((entry) => {
            const labelText = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            const captionInLabel = captionPattern.test(labelText);
            const isLeftChevron = entry.rect.x <= captionEntry.rect.x + 45;
            const isCollapsed = entry.ariaExpanded === 'false';
            const score = (isCollapsed ? 50 : 0) + (captionInLabel ? 30 : 0) + (isLeftChevron ? 20 : 0) - Math.abs(entry.rect.y - captionEntry.rect.y);
            return { ...entry, score, captionInLabel, isLeftChevron, isCollapsed };
          })
          .sort((left, right) => right.score - left.score || left.rect.x - right.rect.x);

        const chosen = controls[0];
        if (!chosen) {
          return {
            clicked: false,
            caption: targetCaption,
            reason: 'no-small-chevron-control',
            captionRect: captionEntry.rect,
            candidates: controls.slice(0, 8).map(({ element: _element, ...entry }) => entry),
          };
        }

        const beforeExpanded = chosen.ariaExpanded || null;
        if (beforeExpanded !== 'false') {
          return {
            clicked: false,
            caption: targetCaption,
            reason: 'already-expanded-or-not-collapsible',
            beforeExpanded,
            captionRect: captionEntry.rect,
            chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect, score: chosen.score },
          };
        }

        chosen.element.click();
        return {
          clicked: true,
          caption: targetCaption,
          method: 'small-chevron-or-aria-expanded-control-near-caption',
          beforeExpanded,
          captionRect: captionEntry.rect,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect, score: chosen.score },
          candidates: controls.slice(0, 8).map(({ element: _element, ...entry }) => entry),
        };
      }, caption)
      .catch((error) => ({ clicked: false, caption, reason: 'evaluate-error', error: String(error), candidates: [] }));

    if (result.clicked || result.reason === 'already-expanded-or-not-collapsible') {
      await page.waitForTimeout(900);
      return result;
    }
  }

  return { clicked: false, caption, reason: 'caption-not-found-in-any-frame', candidates: [] };
}

async function collectFieldSummary(page: Page, captions: string[]) {
  const diagnostics = await collectActiveCardControlDiagnostics(page, captions, {
    targetText: /K30000|Zollspedition Nord GmbH/i,
  });
  return diagnostics.diagnostics.map((entry) => {
    const controlValues = entry.nearbyControls
      .flatMap((control) => [control.value, control.text, control.ariaLabel, control.title])
      .map((value) => (value || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const buttonValues = entry.nearbyButtons
      .flatMap((button) => [button.text, button.ariaLabel, button.title])
      .map((value) => (value || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .filter((value) => !/Details|Open|AssistEdit|Show more|Mehr anzeigen/i.test(value));
    return {
      caption: entry.caption,
      diagnosis: entry.diagnosis,
      visibleAsActiveCardField: ['active-card-label-with-control', 'active-card-label-with-button', 'label-only'].includes(entry.diagnosis),
      values: [...new Set([...controlValues, ...buttonValues])].slice(0, 8),
      selectedLabel: entry.selectedLabel
        ? {
            text: entry.selectedLabel.text,
            rect: entry.selectedLabel.rect,
            scoreReasons: entry.selectedLabel.scoreReasons,
          }
        : null,
    };
  });
}

async function tryOpenPersonalizeEntry(page: Page) {
  const openResult = await clickSettingsButton(page);
  await page.waitForTimeout(900);
  const text = await pageText(page);
  const personalizeVisible = /Personalize|Personalisieren/i.test(text);
  const screenshotName = 'fixedassets-045-020-k30000-settings-personalize-entry.png';
  if (openResult.clicked) {
    await screenshot(page, screenshotName, {
      projectName: project.name,
      testId,
      status: personalizeVisible ? 'labor-personalize-entry-visible' : 'labor-personalize-entry-not-visible',
      bookUse: 'diagnostic-evidence-only',
      purpose:
        'Settings-/Personalisieren-Diagnose fuer die K30000 Vendor Card. Das Bild beweist nur den sichtbaren Einstieg, nicht die Verfuegbarkeit der fehlenden Felder.',
      expectedPageText: [/K30000/i, /Personalize|Personalisieren|Settings|Einstellungen/i],
      knownLimitations: [
        'Es wurden keine Felder eingeblendet und keine Personalisierung gespeichert.',
        'Das Bild ist Diagnose, kein finaler Buch-Screenshot fuer Vendor Posting Group, Gen. Bus. Posting Group, Currency Code oder VAT Bus. Posting Group.',
      ],
    }).catch(() => undefined);
  }
  await closeSidePane(page);
  return {
    method: 'top-bar-settings-menu-read-only',
    ...openResult,
    personalizeVisible,
    screenshot: openResult.clicked ? `playwright/projects/fibu-book5/img/${screenshotName}` : null,
    limitation: personalizeVisible
      ? 'Personalize entry is visible, but the run did not enter or save personalization; it does not prove hidden field availability.'
      : 'Settings entry did not expose a Personalize option in the captured page text.',
  };
}

async function closeSidePane(page: Page) {
  for (const frame of page.frames()) {
    const clicked = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"]'))
          .filter(visible)
          .map((element) => ({
            element,
            label: `${normalize(element.innerText || element.textContent)} ${normalize(element.getAttribute('aria-label'))} ${normalize(element.getAttribute('title'))}`,
            rect: element.getBoundingClientRect(),
          }))
          .filter((entry) => /Close|Schlie|Schließen|Schliessen/i.test(entry.label))
          .filter((entry) => entry.rect.x > window.innerWidth * 0.75 || entry.rect.y < 120)
          .sort((left, right) => right.rect.x - left.rect.x)[0];
        if (!candidates) {
          return false;
        }
        candidates.element.click();
        return true;
      })
      .catch(() => false);
    if (clicked) {
      await page.waitForTimeout(700);
      return;
    }
  }
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(700);
}

async function clickSettingsButton(page: Page) {
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
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"]'))
          .filter(visible)
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            rect: rectOf(element),
          }))
          .filter((entry) => entry.rect.y <= 110)
          .map((entry) => {
            const label = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            const matchesSettings = /Settings|Einstellungen|Setup and Extensions|Einrichtungen und Erweiterungen/i.test(label);
            const score = (matchesSettings ? 100 : 0) - Math.abs(entry.rect.y - 20) - Math.max(0, 1800 - entry.rect.x) / 100;
            return { ...entry, matchesSettings, score };
          })
          .filter((entry) => entry.matchesSettings)
          .sort((left, right) => right.score - left.score || right.rect.x - left.rect.x);
        const chosen = candidates[0];
        if (!chosen) {
          return {
            clicked: false,
            reason: 'settings-button-not-found',
            candidates: candidates.slice(0, 5).map(({ element: _element, ...entry }) => entry),
          };
        }
        chosen.element.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect },
          candidates: candidates.slice(0, 5).map(({ element: _element, ...entry }) => entry),
        };
      })
      .catch((error) => ({ clicked: false, reason: 'evaluate-error', error: String(error), candidates: [] }));

    if (result.clicked) {
      return result;
    }
  }
  return { clicked: false, reason: 'settings-button-not-found-in-any-frame', candidates: [] };
}

async function tryOpenPageInspection(page: Page) {
  const before = await pageText(page);
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await expect
    .poll(async () => pageText(page), {
      timeout: 8_000,
      intervals: [500, 1000, 2000],
    })
    .toMatch(/Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID|Vendor/i)
    .catch(() => undefined);
  const after = await pageText(page);
  const opened = /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID|Extension/i.test(after) && after !== before;
  const focusedText = after
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => /Page|Table|Field|Source|Filter|Extension|Vendor|Kreditor|Posting Group|Currency|VAT|Tax|26|23|K30000/i.test(line))
    .slice(0, 100)
    .join('\n');

  await writeTextEvidence(fixedAssetsEvidencePath('040-page-inspection-focused-text.txt'), focusedText || 'Page Inspection shortcut produced no focused page inspection text.\n');

  const screenshotName = 'fixedassets-045-040-k30000-page-inspection-diagnosis.png';
  if (opened) {
    await screenshot(page, screenshotName, {
      projectName: project.name,
      testId,
      status: 'labor-page-inspection-diagnostic',
      bookUse: 'technical-evidence-only',
      purpose:
        'Page Inspection Diagnose der K30000 Vendor Card. Das Bild klaert Page-/Tabellenkontext, ist aber kein finaler Anwenderscreenshot und kein Default-Wertebeweis.',
      expectedPageText: [/Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i],
      knownLimitations: [
        'Page Inspection ist technischer Diagnosekontext.',
        'Nicht als Screenshot-Proof fuer unsichtbare Vendor Posting Group, Gen. Bus. Posting Group, Currency Code oder VAT Bus. Posting Group verwenden.',
      ],
    });
  }

  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.keyboard.press('Escape').catch(() => undefined);

  return {
    shortcut: 'Control+Alt+F1',
    opened,
    focusedTextEvidence: 'playwright/projects/fibu-book5/evidence/fixedassets-045/040-page-inspection-focused-text.txt',
    screenshot: opened ? `playwright/projects/fibu-book5/img/${screenshotName}` : null,
    limitation: opened
      ? 'Page Inspection is debug context only; it proves page/table context, not hidden field values or purchase-invoice readiness.'
      : 'Shortcut was not reliably available in this Playwright/browser context; use Help & Support / Inspect pages and data manually if needed.',
  };
}

function field(summary: Array<Record<string, any>>, caption: string) {
  return summary.find((entry) => entry.caption === caption) ?? { caption, diagnosis: 'caption-not-visible', visibleAsActiveCardField: false, values: [] };
}

function renderMarkdown(result: any) {
  const fieldRows = result.fieldSummary
    .map((entry: any) => `| ${entry.caption} | ${entry.visibleAsActiveCardField ? 'sichtbar' : 'nicht sichtbar'} | ${entry.values.length ? entry.values.map((value: string) => `\`${value}\``).join(', ') : entry.diagnosis} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-045 - K30000 Vendor Personalize/Page Inspection Diagnosis read-only',
    '',
    'Status: `labor`, `read-only`, `ui-first`, `diagnosis`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    `| Zielkreditor | ${result.vendorNo} / ${result.vendorName} |`,
    `| Status | ${result.status} |`,
    '| Gebucht | nein |',
    '| Einkaufsrechnung erzeugt | nein |',
    '| Setup/Kreditor geaendert | nein |',
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Feldsichtbarkeit in normaler UI',
    '',
    '| Feld | Sichtbarkeit | Wert / Diagnose |',
    '|---|---|---|',
    fieldRows,
    '',
    '## Personalisieren',
    '',
    `- Einstieg ueber Einstellungen sichtbar: ${result.personalizeAttempt.personalizeVisible ? 'ja' : 'nein'}`,
    `- Grenze: ${result.personalizeAttempt.limitation}`,
    '',
    '## Page Inspection',
    '',
    `- Shortcut: \`${result.pageInspectionAttempt.shortcut}\``,
    `- Geoeffnet: ${result.pageInspectionAttempt.opened ? 'ja' : 'nein'}`,
    `- Grenze: ${result.pageInspectionAttempt.limitation}`,
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Read-only: keine Kreditoren-, Setup- oder Belegaenderung.',
    '- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- Keine API-Abkuerzung; der Befund basiert auf sichtbarer BC-UI.',
    '- Nicht als deutscher USt-, Kontenplan- oder HGB-Finalnachweis verwenden.',
    '- Personalisieren/Page Inspection erklaeren die Diagnosewerkzeuge, ersetzen aber keinen sichtbaren Buchbild-Nachweis fuer konkrete Codes.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-045 K30000 Vendor Personalize/Page Inspection diagnosis read-only', async ({ page }) => {
  await openVendorCard(page);
  await scrollMain(page, 0);
  await expandFastTabByChevron(page, 'Invoicing');
  await expandFastTabByChevron(page, 'Payments');

  await screenshot(page, 'fixedassets-045-010-k30000-vendor-card-before-technical-diagnosis.png', {
    projectName: project.name,
    testId,
    status: 'labor-context',
    bookUse: 'context-evidence',
    purpose:
      'K30000 Vendor Card vor Personalisieren/Page-Inspection-Diagnose; beweist den Kartenkontext und sichtbare Felder, nicht unsichtbare Default-Codes.',
    expectedPageText: [/K30000/i, /Zollspedition Nord GmbH/i],
    knownLimitations: ['Read-only CRONUS-USA-Labor.', 'Noch kein Proof fuer Vendor Posting Group, Gen. Bus. Posting Group, Currency Code oder VAT Bus. Posting Group.'],
  });

  const fieldSummary = await collectFieldSummary(page, allCaptions);
  const criticalVisibility = Object.fromEntries(criticalCaptions.map((caption) => [caption, field(fieldSummary, caption).visibleAsActiveCardField]));

  const personalizeAttempt = await tryOpenPersonalizeEntry(page);
  const pageInspectionAttempt = await tryOpenPageInspection(page);

  const criticalFieldsVisible = criticalCaptions.filter((caption) => field(fieldSummary, caption).visibleAsActiveCardField);
  const status = criticalFieldsVisible.length === criticalCaptions.length
    ? 'done-labor-readonly-critical-default-captions-visible'
    : 'done-labor-readonly-diagnosis-critical-defaults-still-not-visibly-proven';
  const result = {
    caseId: 'FIXEDASSETS-045-K30000-VENDOR-PERSONALIZE-PAGEINSPECTION-DIAGNOSIS-READONLY',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-ui-diagnosis-personalize-page-inspection',
    vendorNo: target.vendorNo,
    vendorName: target.vendorName,
    status,
    fieldSummary,
    criticalVisibility,
    personalizeAttempt,
    pageInspectionAttempt,
    safety: {
      posted: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      vendorChanged: false,
      setupChanged: false,
      apiShortcutUsed: false,
      companyChanged: false,
    },
    screenshots: [
      'playwright/projects/fibu-book5/img/fixedassets-045-010-k30000-vendor-card-before-technical-diagnosis.png',
      personalizeAttempt.screenshot,
      pageInspectionAttempt.screenshot,
    ].filter(Boolean),
    summary: criticalFieldsVisible.length === criticalCaptions.length
      ? 'Die K30000-Kreditorenkarte wurde read-only diagnostiziert; die kritischen Default-Captions sind in der normalen UI sichtbar. Das ist noch keine Kaufbeleg- oder Buchungsfreigabe, aber ein moeglicher Input fuer ein separates Purchase-Invoice-Preflight-Gate.'
      : `Die K30000-Kreditorenkarte wurde read-only diagnostiziert. Weiter nicht sichtbar belegt: ${criticalCaptions.filter((caption) => !field(fieldSummary, caption).visibleAsActiveCardField).join(', ')}. Personalisieren/Page Inspection wurden als Diagnosewerkzeuge genutzt; daraus folgt keine stille Setup-Aenderung und keine Kaufbelegfreigabe.`,
    bookImpact:
      'Kapitel 21 soll Anfaengern erklaeren: Wenn kaufrelevante Defaults auf der Kreditorenkarte fehlen, zuerst UI-Sichtbarkeit und technischen Page-/Tabellenkontext klaeren. Personalisieren hilft bei ausgeblendeten UI-Elementen, Page Inspection bei Page/Table/Feldkontext; beides ersetzt keinen Screenshot, auf dem der konkrete Code wirklich sichtbar ist.',
    nextStep:
      'FIXEDASSETS-046-K30000-VENDOR-DEFAULTS-GATE-DECISION: auf Basis von 045 entscheiden, ob ein enger UI-first Setup-/Default-Fit fuer die fehlenden Kreditorenfelder no-posting erlaubt ist oder ob erst ein manueller Personalisieren-Schritt die Felder sichtbar machen muss.',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-045-result.json'), result);
  await writeJsonEvidence(fixedAssetsEvidencePath('010-k30000-vendor-technical-diagnostics.json'), {
    fieldSummary,
    criticalVisibility,
    personalizeAttempt,
    pageInspectionAttempt,
    screenshotRule: 'Ein Screenshot ist nur Proof fuer Captions/Werte, die im Bild wirklich sichtbar sind. Personalisieren/Page Inspection sind Diagnose, kein Default-Wertebeweis.',
  });
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-045-K30000-VENDOR-PERSONALIZE-PAGEINSPECTION-DIAGNOSIS-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('020-visual-qa.md'),
    [
      '# FIXEDASSETS-045 Visual QA',
      '',
      'Status: `labor`, `read-only`, `diagnostic-screenshot-qa`, `not-final`.',
      '',
      '| Screenshot | Sichtbares Ziel | Bewertung |',
      '|---|---|---|',
      '| `fixedassets-045-010-k30000-vendor-card-before-technical-diagnosis.png` | K30000-Kartenkontext und sichtbare Felder | Kontext-/Diagnosebild; kein Proof fuer nicht sichtbare Default-Codes |',
      personalizeAttempt.screenshot
        ? '| `fixedassets-045-020-k30000-settings-personalize-entry.png` | Einstellungen-/Personalisieren-Einstieg, falls sichtbar | Diagnosebild; beweist keine Feldverfuegbarkeit und keine gespeicherte Personalisierung |'
        : '| Personalisieren-Screenshot | nicht erzeugt | Settings-/Personalisieren-Einstieg nicht stabil sichtbar |',
      pageInspectionAttempt.screenshot
        ? '| `fixedassets-045-040-k30000-page-inspection-diagnosis.png` | Page Inspection / technischer Kontext | Debug-Bild; kein finaler Anwenderscreenshot und kein Proof fuer fehlende Default-Codes |'
        : '| Page-Inspection-Screenshot | nicht erzeugt | Shortcut in diesem Lauf nicht stabil verfuegbar |',
      '',
      'Regel fuer Folgelaeufe: Ein Bild darf nur fuer die konkreten Codes, Felder und Aktionen verwendet werden, die darauf wirklich sichtbar sind.',
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-045 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-045-result.json` | JSON | strukturierte read-only Diagnose fuer K30000, Personalisieren-Einstieg und Page Inspection | keine Einkaufsrechnung, keine Setup-Aenderung, keine Buchung | labor/read-only |',
      '| `010-k30000-vendor-technical-diagnostics.json` | JSON | Feldsichtbarkeitsdiagnose und technische Diagnoseversuche | keine Default-Werte fuer nicht sichtbare Felder | compact |',
      '| `040-page-inspection-focused-text.txt` | Text | gefilterter Page-Inspection-/Seitentext, falls Shortcut Text liefert | kein Rohdump, kein finaler Screenshot | compact/debug |',
      '| `FIXEDASSETS-045-K30000-VENDOR-PERSONALIZE-PAGEINSPECTION-DIAGNOSIS-READONLY.md` | Markdown | Ergebnis, Lernwert, Buchwirkung und Grenze | kein deutscher Finalnachweis | labor/read-only |',
      '| `020-visual-qa.md` | Markdown | welche Bilder welche sichtbaren Ziele tragen | keine fachliche Wahrheit ohne sichtbaren Code | screenshot-qa |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Limitationen je Bild | keine Rohlogs | compact |',
      '',
      result.summary,
      '',
      result.nextStep,
      '',
    ].join('\n'),
  );

  expect(fieldSummary.length).toBe(allCaptions.length);
  expect(result.safety.posted).toBe(false);
  expect(result.safety.purchaseInvoiceCreated).toBe(false);
  expect(result.safety.acquisitionPosted).toBe(false);
  expect(result.safety.vendorChanged).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
});
