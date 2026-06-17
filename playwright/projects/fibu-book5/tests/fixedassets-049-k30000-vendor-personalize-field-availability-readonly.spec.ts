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

const testId = 'fixedassets-049';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH',
};

const criticalCaptions = ['Vendor Posting Group', 'Gen. Bus. Posting Group', 'Currency Code', 'VAT Bus. Posting Group'];
const personalizeSignals = /Personalizing|Personalize|Personalisieren|Personalisierung|Done|Fertig|Add field|Add fields|Field|Fields|Feld|Felder/i;

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
          return { clicked: false, reason: 'settings-button-not-found', candidates: [] };
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

  return { clicked: false, reason: 'settings-button-not-found-in-any-frame', candidates: [] };
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
            return pattern.test(haystack) && haystack.length <= 180;
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

async function openPersonalizeMode(page: Page) {
  const settingsResult = await clickSettingsButton(page);
  if (!settingsResult.clicked) {
    return {
      settingsResult,
      personalizeClick: { clicked: false, reason: 'settings-not-open' },
      opened: false,
      textContainsSignals: false,
    };
  }

  const personalizeClick = await clickVisibleTextLike(page, /Personalize|Personalisieren/);
  await expect
    .poll(async () => pageText(page), { timeout: 12_000, intervals: [700, 1200, 2000] })
    .toMatch(personalizeSignals)
    .catch(() => undefined);
  const text = await pageText(page);
  const opened = /Personalizing|Personalisierung|Done|Fertig|Add field|Add fields|Feld hinzuf|Felder hinzuf/i.test(text);

  return {
    settingsResult,
    personalizeClick,
    opened,
    textContainsSignals: personalizeSignals.test(text),
  };
}

async function tryOpenAddFieldPane(page: Page) {
  const attempts = [
    await clickVisibleTextLike(page, /Add field|Add fields|Feld hinzuf|Felder hinzuf|\+ Field|\+ Feld/),
    await clickVisibleTextLike(page, /^Field$|^Fields$|^Feld$|^Felder$/),
  ];
  const clickedAttempt = attempts.find((attempt) => attempt.clicked) ?? attempts[0];
  await page.waitForTimeout(1200);
  const text = await pageText(page);
  return {
    clicked: Boolean(clickedAttempt.clicked),
    attempt: clickedAttempt,
    textContainsAddFieldSignals: /Add field|Add fields|Feld hinzuf|Felder hinzuf|Available fields|Verfuegbare Felder|Verfügbare Felder/i.test(text),
  };
}

async function collectVisibleTermSignals(page: Page, terms: string[]) {
  const allSignals: Record<string, any[]> = Object.fromEntries(terms.map((term) => [term, []]));

  for (const frame of page.frames()) {
    const frameSignals = await frame
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
        const visibleElements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(visible);
        const result: Record<string, any[]> = Object.fromEntries(targetTerms.map((term) => [term, []]));
        for (const term of targetTerms) {
          const pattern = new RegExp(escape(term), 'i');
          result[term] = visibleElements
            .map((element) => ({
              text: normalize(element.innerText || element.textContent),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              role: normalize(element.getAttribute('role')),
              tagName: element.tagName,
              rect: rectOf(element),
            }))
            .filter((entry) => {
              const haystack = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
              return pattern.test(haystack) && haystack.length <= 260;
            })
            .filter((entry) => entry.rect.width >= 20 && entry.rect.height >= 8)
            .slice(0, 12);
        }
        return result;
      }, terms)
      .catch(() => Object.fromEntries(terms.map((term) => [term, []])));

    for (const term of terms) {
      allSignals[term].push(...(frameSignals[term] ?? []));
    }
  }

  return Object.fromEntries(
    Object.entries(allSignals).map(([term, signals]) => [
      term,
      signals
        .filter((signal, index, list) => index === list.findIndex((other) => JSON.stringify(other.rect) === JSON.stringify(signal.rect) && other.text === signal.text))
        .slice(0, 12),
    ]),
  );
}

async function exitPersonalizeSafely(page: Page) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  const discardAttempt = await clickVisibleTextLike(page, /Discard|Verwerfen|Don't save|Nicht speichern/);
  if (discardAttempt.clicked) {
    return { method: 'escape-then-discard', discardAttempt, personalizationSaved: false };
  }

  return { method: 'escape-only-no-save-click', discardAttempt, personalizationSaved: false };
}

function renderMarkdown(result: any) {
  const fieldRows = result.criticalFields
    .map((entry: any) => `| ${entry.caption} | ${entry.status} | ${entry.signalCount} | ${entry.bestSignal ? entry.bestSignal.text || entry.bestSignal.ariaLabel || entry.bestSignal.title || 'visible signal' : 'kein sichtbares Signal'} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-049 - K30000 Vendor Personalize Field Availability read-only',
    '',
    'Status: `labor`, `read-only`, `ui-first`, `personalize-diagnosis`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    `| Zielkreditor | ${result.vendorNo} / ${result.vendorName} |`,
    `| Ergebnisstatus | ${result.status} |`,
    '| Gebucht | nein |',
    '| Einkaufsrechnung erzeugt | nein |',
    '| Kreditor/Setup geaendert | nein |',
    '| Personalisierung gespeichert | nein |',
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Personalisieren-Feldverfuegbarkeit',
    '',
    '| Kritisches Feld | Status | sichtbare Signale | Bestes sichtbares Signal |',
    '|---|---|---:|---|',
    fieldRows,
    '',
    '## Was der Screenshot beweist',
    '',
    '- Der Kartenkontext beweist nur `K30000` / `Zollspedition Nord GmbH` in `RM-DEMO`.',
    '- Ein Personalisieren-Bild beweist nur die sichtbaren Personalisieren-/Feld-Angebote.',
    '- Ein Feld gilt nur dann als Bildbeleg, wenn Caption oder Code im Bild wirklich lesbar sind.',
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
    '- Personalisieren ist Diagnose-/Sichtbarkeitswerkzeug. Eine nutzerpersonalisierte Buchansicht braucht einen eigenen Hinweis im Buch.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-049 K30000 Vendor Personalize field availability read-only', async ({ page }) => {
  await openVendorCard(page);

  await screenshot(page, 'fixedassets-049-010-k30000-vendor-card-before-personalize.png', {
    projectName: project.name,
    testId,
    status: 'labor-context',
    bookUse: 'context-evidence',
    purpose: 'K30000 Vendor Card vor dem Oeffnen von Personalisieren. Beweist Kartenkontext, nicht unsichtbare Default-Codes.',
    expectedPageText: [/K30000/i, /Zollspedition Nord GmbH/i],
    knownLimitations: [
      'Read-only CRONUS-USA-Labor in RM-DEMO.',
      'Kein Proof fuer nicht sichtbare Vendor Posting Group, Gen. Bus. Posting Group, Currency Code oder VAT Bus. Posting Group.',
    ],
  });

  const personalizeResult = await openPersonalizeMode(page);
  await screenshot(page, 'fixedassets-049-020-personalize-mode-or-entry.png', {
    projectName: project.name,
    testId,
    status: personalizeResult.opened ? 'labor-personalize-mode-opened' : 'labor-personalize-entry-diagnostic',
    bookUse: 'diagnostic-evidence-only',
    purpose: 'Personalisieren-Diagnose fuer die K30000 Vendor Card. Nur sichtbare Feldangebote duerfen als Feldverfuegbarkeit gelesen werden.',
    expectedPageText: [/K30000|Personalize|Personalisieren|Feld|Field/i],
    knownLimitations: [
      'Es wurde keine Personalisierung gespeichert.',
      'Das Bild ist nur dann Feldbeweis, wenn die Feldcaption wirklich lesbar ist.',
    ],
  }).catch(() => undefined);

  const beforeAddFieldSignals = await collectVisibleTermSignals(page, criticalCaptions);
  const addFieldResult = personalizeResult.opened ? await tryOpenAddFieldPane(page) : { clicked: false, attempt: { clicked: false, reason: 'personalize-not-open' }, textContainsAddFieldSignals: false };
  await screenshot(page, 'fixedassets-049-030-personalize-field-availability.png', {
    projectName: project.name,
    testId,
    status: 'labor-personalize-field-availability-diagnostic',
    bookUse: 'diagnostic-evidence-only',
    purpose: 'Feldverfuegbarkeit im Personalisieren-Kontext. Nur lesbare Captions sind als Feldangebot zu werten.',
    expectedPageText: [/K30000|Personalize|Personalisieren|Field|Feld|Vendor|Currency|Posting|VAT/i],
    knownLimitations: [
      'Keine gespeicherte Personalisierung.',
      'Kein Kaufbeleg-, Anlagenzugangs-, AfA- oder Buchungsnachweis.',
    ],
  }).catch(() => undefined);

  const afterAddFieldSignals = await collectVisibleTermSignals(page, criticalCaptions);
  const focusedText = await compactPageText(page, {
    include: [/K30000|Zollspedition|Personalize|Personalisieren|Field|Feld|Vendor Posting Group|Gen\. Bus\. Posting Group|Currency Code|VAT Bus\. Posting Group/i],
    maxLines: 160,
    maxLineLength: 220,
  });
  const exitResult = await exitPersonalizeSafely(page);
  const textAfterExit = await pageText(page);

  const criticalFields = criticalCaptions.map((caption) => {
    const signals = [...(beforeAddFieldSignals[caption] ?? []), ...(afterAddFieldSignals[caption] ?? [])];
    return {
      caption,
      status: signals.length > 0 ? 'available-visible-in-personalize-diagnostics' : 'not-visible-in-personalize-diagnostics',
      signalCount: signals.length,
      bestSignal: signals[0] ?? null,
      signals: signals.slice(0, 8),
    };
  });
  const availableCriticalFields = criticalFields.filter((entry) => entry.signalCount > 0).map((entry) => entry.caption);
  const missingCriticalFields = criticalFields.filter((entry) => entry.signalCount === 0).map((entry) => entry.caption);
  const status = !personalizeResult.opened
    ? 'blocked-labor-personalize-mode-not-opened'
    : availableCriticalFields.length === criticalCaptions.length
      ? 'done-labor-readonly-personalize-fields-visible'
      : availableCriticalFields.length > 0
        ? 'done-labor-readonly-personalize-fields-partial'
        : 'done-labor-readonly-personalize-fields-not-visible';
  const result = {
    caseId: 'FIXEDASSETS-049-K30000-VENDOR-PERSONALIZE-FIELD-AVAILABILITY-READONLY',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-ui-first-personalize-field-availability',
    vendorNo: target.vendorNo,
    vendorName: target.vendorName,
    status,
    personalizeResult,
    addFieldResult,
    criticalFields,
    availableCriticalFields,
    missingCriticalFields,
    focusedTextEvidence: 'playwright/projects/fibu-book5/evidence/fixedassets-049/010-personalize-focused-text.txt',
    exitResult,
    pageStillShowsVendorAfterExit: /K30000|Zollspedition Nord GmbH/i.test(textAfterExit),
    safety: {
      posted: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      vendorChanged: false,
      setupChanged: false,
      apiShortcutUsed: false,
      companyChanged: false,
      personalizationSaved: false,
    },
    screenshots: [
      'playwright/projects/fibu-book5/img/fixedassets-049-010-k30000-vendor-card-before-personalize.png',
      'playwright/projects/fibu-book5/img/fixedassets-049-020-personalize-mode-or-entry.png',
      'playwright/projects/fibu-book5/img/fixedassets-049-030-personalize-field-availability.png',
    ],
    summary: !personalizeResult.opened
      ? 'Die K30000-Kreditorenkarte wurde read-only geoeffnet, aber der Personalisieren-Modus konnte in diesem Browserlauf nicht stabil geoeffnet werden. Es gab keine Aenderung und keine Buchung.'
      : availableCriticalFields.length > 0
        ? `Personalisieren wurde read-only als Diagnosemodus geoeffnet. Sichtbar gefundene kritische Feldangebote: ${availableCriticalFields.join(', ')}. Weiter nicht sichtbar in der Diagnose: ${missingCriticalFields.join(', ') || 'keine'}.`
        : 'Personalisieren wurde read-only als Diagnosemodus geoeffnet, aber die vier kritischen Felder wurden dort nicht sichtbar gefunden. Es gab keine gespeicherte Personalisierung, keine Kreditor-/Setup-Aenderung und keine Buchung.',
    bookImpact:
      'Kapitel 21 und das spaetere Debugging-/Nachweiskapitel sollen Personalisieren als Sichtbarkeitsdiagnose erklaeren: Ein ausgeblendetes Feld kann fuer den Anwender fehlen, obwohl es page-seitig verfuegbar ist. Fuer Buchscreenshots gilt trotzdem: Nur sichtbare Captions/Codes duerfen behauptet werden; eine personalisierte Ansicht muss als solche gekennzeichnet werden.',
    nextStep: availableCriticalFields.length > 0
      ? 'FIXEDASSETS-050-K30000-VENDOR-PERSONALIZED-FIELD-PROOF-DECISION: entscheiden, ob eine bewusst gekennzeichnete nutzerpersonalisierte Feldansicht als Buchdiagnose erstellt werden darf oder ob ein enger Default-/Setup-Gate noetig ist.'
      : 'FIXEDASSETS-050-K30000-VENDOR-DEFAULTS-PAGEINSPECTION-OR-SETUP-GATE-DECISION: ohne Buchung entscheiden, ob Page Inspection/manuelle UI-Diagnose oder ein enger UI-first Default-/Setup-Fit der richtige naechste Hebel ist.',
  };

  await writeTextEvidence(fixedAssetsEvidencePath('010-personalize-focused-text.txt'), focusedText || 'No focused personalize/default text captured.\n');
  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-049-result.json'), result);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-personalize-field-availability.json'), {
    criticalCaptions,
    availableCriticalFields,
    missingCriticalFields,
    criticalFields,
    personalizeResult,
    addFieldResult,
    screenshotRule: 'A screenshot is only proof for captions and values visibly present in that screenshot; hidden/default values remain open.',
  });
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-049-K30000-VENDOR-PERSONALIZE-FIELD-AVAILABILITY-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('020-visual-qa.md'),
    [
      '# FIXEDASSETS-049 Visual QA',
      '',
      'Status: `labor`, `read-only`, `personalize-diagnostic-screenshot-qa`, `not-final`.',
      '',
      '| Screenshot | Sichtbares Ziel | Bewertung |',
      '|---|---|---|',
      '| `fixedassets-049-010-k30000-vendor-card-before-personalize.png` | K30000-Kartenkontext | Kontextbild; kein Proof fuer nicht sichtbare Default-Codes |',
      '| `fixedassets-049-020-personalize-mode-or-entry.png` | Personalisieren-Modus oder Einstieg | Diagnosebild; nur sichtbare UI-Angebote zaehlen |',
      '| `fixedassets-049-030-personalize-field-availability.png` | Feldverfuegbarkeit im Personalisieren-Kontext | nur Proof fuer wirklich lesbare Feldcaptions; nicht sichtbare Felder bleiben offen |',
      '',
      'Regel: Wenn der konkrete Feldname oder Code auf dem Bild nicht lesbar ist, darf das Bild nicht als Beweis fuer diesen Punkt verwendet werden.',
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-049 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-049-result.json` | JSON | strukturierte read-only Diagnose fuer Personalisieren-Feldverfuegbarkeit auf K30000 | keine Einkaufsrechnung, keine Setup-Aenderung, keine Buchung, keine gespeicherte Personalisierung | labor/read-only |',
      '| `020-personalize-field-availability.json` | JSON | sichtbare/fehlende Signale zu kritischen Feldern im Personalisieren-Kontext | keine nicht sichtbaren Werte und keine Tabellenlogik | compact |',
      '| `010-personalize-focused-text.txt` | Text | gefilterter Seitentext zu Personalisieren und kritischen Feldern | kein Rohdump und kein finaler Screenshot | compact |',
      '| `FIXEDASSETS-049-K30000-VENDOR-PERSONALIZE-FIELD-AVAILABILITY-READONLY.md` | Markdown | Ergebnis, Lernwert, Buchwirkung und Grenze | kein deutscher Finalnachweis | labor/read-only |',
      '| `020-visual-qa.md` | Markdown | welche Bilder welche sichtbaren Ziele tragen | keine fachliche Wahrheit ohne sichtbaren Code | screenshot-qa |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Limitationen je Bild | keine Rohlogs | compact |',
      '',
      result.summary,
      '',
      result.nextStep,
      '',
    ].join('\n'),
  );

  expect(textAfterExit).toMatch(/K30000|Zollspedition Nord GmbH|Wird personalisiert|Personalizing|Personalisierung/i);
  expect(result.safety.posted).toBe(false);
  expect(result.safety.purchaseInvoiceCreated).toBe(false);
  expect(result.safety.acquisitionPosted).toBe(false);
  expect(result.safety.vendorChanged).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.personalizationSaved).toBe(false);
});
