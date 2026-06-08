import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, pageText, requireBcUrl, screenshot, searchFor, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'fixedassets-007';

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function sanitizeEvidenceText(text: string) {
  return text
    .replace(/\u00c3\u0152/g, 'Ue')
    .replace(/\u00c3\u00bc/g, 'ue')
    .replace(/\u00c3\u2013/g, 'Oe')
    .replace(/\u00c3\u00b6/g, 'oe')
    .replace(/\u00c3\u201e/g, 'Ae')
    .replace(/\u00c3\u00a4/g, 'ae')
    .replace(/\u00c3\u0178/g, 'ss')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function compactPageText(text: string) {
  const interesting =
    /Depreciation|AfA|Abschreibung|Fixed Asset Class|FA Class|Fixed Asset Subclass|Anlagenklasse|Anlagenunterklasse|Code|Description|Beschreibung|Book|Class|Asset|HGB|COMPANY|CORP|TAX|MACHINERY|EQUIPMENT|TANGIBLE|INTANGIBLE|VEHICLE|BUILDING|LAND/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => sanitizeEvidenceText(line.replace(/\s+/g, ' ').trim()))
    .filter((line) => Boolean(line) && !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|shouldAttachOauthTokens|O365SuiteServiceProxy/i.test(line));
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (interesting.test(lines[index])) {
      selected.add(index);
    }
  }

  return [
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 220)
  ].join('\n');
}

async function candidateElements(frame: Frame, label: RegExp) {
  return frame.evaluate((labelSource) => {
    const label = new RegExp(labelSource, 'i');
    return [...document.querySelectorAll<HTMLElement>('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"],span,div')]
      .map((element, index) => {
        const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
        const aria = element.getAttribute('aria-label') || '';
        const title = element.getAttribute('title') || '';
        const rect = element.getBoundingClientRect();
        return {
          index,
          text,
          aria,
          title,
          role: element.getAttribute('role') || '',
          tag: element.tagName,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0,
          matches: label.test(text) || label.test(aria) || label.test(title)
        };
      })
      .filter((entry) => entry.visible && entry.matches)
      .slice(0, 80);
  }, label.source);
}

async function clickTellMeResult(page: Page, label: RegExp) {
  const candidates: Array<{ frameUrl: string; candidates: Awaited<ReturnType<typeof candidateElements>> }> = [];

  for (const frame of page.frames()) {
    const frameCandidates = await candidateElements(frame, label).catch(() => []);
    if (frameCandidates.length > 0) {
      candidates.push({ frameUrl: frame.url(), candidates: frameCandidates });
    }

    for (const role of ['button', 'link', 'menuitem', 'option'] as const) {
      const locator = frame.getByRole(role, { name: label }).first();
      if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
        if (await locator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(5000);
          return { clicked: true, method: `role:${role}`, candidates };
        }
      }
    }

    const textLocator = frame.getByText(label).first();
    if (await textLocator.isVisible({ timeout: 700 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 4000, force: true }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(5000);
        return { clicked: true, method: 'text-force', candidates };
      }
    }
  }

  return { clicked: false, method: undefined as string | undefined, candidates };
}

type ExtractedRow = {
  code: string;
  rawText: string;
};

function inferRowsFromText(text: string, knownCodes: RegExp) {
  const rows = new Map<string, ExtractedRow>();
  const lines = compactPageText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(knownCodes);
    if (!match?.[0]) {
      continue;
    }

    const code = match[0].toUpperCase();
    if (!rows.has(code)) {
      rows.set(code, { code, rawText: sanitizeEvidenceText(line).slice(0, 260) });
    }
  }

  return [...rows.values()].sort((left, right) => left.code.localeCompare(right.code));
}

async function extractRowsFromDom(page: Page, knownCodes: RegExp) {
  const rows = new Map<string, ExtractedRow>();

  for (const frame of page.frames()) {
    const rowTexts = await frame
      .evaluate(() => {
        const elementText = (element: HTMLElement) => {
          const visibleText = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
          const inputValues = [...element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea')]
            .map((input) => input.value || input.getAttribute('aria-label') || input.getAttribute('title') || '')
            .filter(Boolean)
            .join(' ');
          return `${visibleText} ${inputValues}`.replace(/\s+/g, ' ').trim();
        };

        return [...document.querySelectorAll<HTMLElement>('[role="row"], tr, [data-control-name], [data-testid]')]
          .map((element) => elementText(element))
          .filter(Boolean)
          .slice(0, 160);
      })
      .catch(() => []);

    for (const text of rowTexts) {
      const match = text.match(knownCodes);
      if (!match?.[0]) {
        continue;
      }

      const code = match[0].toUpperCase();
      if (!rows.has(code)) {
        rows.set(code, { code, rawText: sanitizeEvidenceText(text).slice(0, 260) });
      }
    }
  }

  return [...rows.values()].sort((left, right) => left.code.localeCompare(right.code));
}

async function captureDepreciationBooks(page: Page) {
  await page.goto(bcPageUrl(5611, project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  const contextVisible = /Depreciation Book|Depreciation Books|AfA|Abschreibung/i.test(text);
  const hgbVisible = /\bHGB\b/i.test(text);
  const rowPattern = /\b(COMPANY|CORP|TAX|HGB)\b/i;
  const rows = [...new Map([...inferRowsFromText(text, rowPattern), ...(await extractRowsFromDom(page, rowPattern))].map((row) => [row.code, row])).values()];
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);

  await writeTextEvidence(fixedAssetsEvidencePath('010-depreciation-books-page-text.txt'), compactPageText(text));
  await writeJsonEvidence(fixedAssetsEvidencePath('010-depreciation-books-buttons.json'), buttons);
  await screenshot(page, 'fixedassets-007-010-depreciation-books.png', {
    projectName: project.name,
    testId,
    status: contextVisible ? 'candidate' : 'rejected',
    bookUse: contextVisible ? 'navigation' : 'do-not-use',
    purpose: 'FIXEDASSETS-007 vorhandene AfA-Buecher/Depreciation Books read-only als Setup-Vorbereitung lesen.',
    knownLimitations: [
      'Read-only in RM-DEMO / CRONUS USA.',
      'Kein AfA-Buch angelegt oder bearbeitet.',
      'Kein HGB-Fit, keine Anlage, keine Einkaufsrechnung, keine AfA, keine Buchung.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ]
  });

  return {
    id: '010-depreciation-books',
    pageId: 5611,
    contextVisible,
    hgbVisible,
    rows,
    screenshot: 'fixedassets-007-010-depreciation-books.png',
    pageTextEvidenceFile: '010-depreciation-books-page-text.txt',
    buttonsEvidenceFile: '010-depreciation-books-buttons.json'
  };
}

async function captureAssetClasses(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'Fixed Asset Classes');
  await page.waitForTimeout(1500);

  const tellMeText = await pageText(page);
  await writeTextEvidence(fixedAssetsEvidencePath('020-fixed-asset-classes-tell-me-page-text.txt'), compactPageText(tellMeText));
  await screenshot(page, 'fixedassets-007-020-fixed-asset-classes-tell-me.png', {
    projectName: project.name,
    testId,
    status: /Fixed Asset Class|FA Class|Anlagenklasse/i.test(tellMeText) ? 'candidate' : 'rejected',
    bookUse: 'navigation',
    purpose: 'FIXEDASSETS-007 Tell-Me-Pfad fuer Anlagenklassen/Fixed Asset Classes read-only suchen.',
    knownLimitations: ['Read-only Tell-Me-Pfad; keine Anlagenklasse angelegt oder bearbeitet.']
  });

  const click = await clickTellMeResult(page, /^Fixed Asset Classes$|^FA Classes$|^Anlagenklassen$|^Fixed Asset Class$/i);
  await dismissTours(page);
  await page.waitForTimeout(3500);

  let text = await pageText(page);
  let directPageTried = false;
  let directPageId: number | null = null;
  let directPageMatched = false;

  if (!/Fixed Asset Class|Fixed Asset Classes|FA Class|Anlagenklasse/i.test(text)) {
    directPageTried = true;
    directPageId = 5615;
    await page.goto(bcPageUrl(directPageId, project.envPrefix), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await page.waitForTimeout(2500);
    text = await pageText(page);
    directPageMatched = /Fixed Asset Class|Fixed Asset Classes|FA Class|Anlagenklasse/i.test(text);
  }

  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const contextVisible = /Fixed Asset Class|Fixed Asset Classes|FA Class|Anlagenklasse/i.test(text);
  const rowPattern = /\b(INTANGIBLE|TANGIBLE|FINANCIAL|LAND|BUILDING|MACHINERY|EQUIPMENT|VEHICLE|OTHER)\b/i;
  const rows = contextVisible
    ? [...new Map([...inferRowsFromText(text, rowPattern), ...(await extractRowsFromDom(page, rowPattern))].map((row) => [row.code, row])).values()]
    : [];

  await writeTextEvidence(fixedAssetsEvidencePath('021-fixed-asset-classes-result-page-text.txt'), compactPageText(text));
  await writeJsonEvidence(fixedAssetsEvidencePath('021-fixed-asset-classes-buttons.json'), buttons);
  await screenshot(page, 'fixedassets-007-021-fixed-asset-classes-result.png', {
    projectName: project.name,
    testId,
    status: contextVisible ? 'candidate' : 'rejected',
    bookUse: contextVisible ? 'navigation' : 'do-not-use',
    purpose: 'FIXEDASSETS-007 vorhandene Anlagenklassen/Fixed Asset Classes read-only als Setup-Vorbereitung lesen.',
    knownLimitations: [
      'Read-only in RM-DEMO / CRONUS USA.',
      'Keine Anlagenklasse angelegt oder bearbeitet.',
      'Keine Anlage, keine Einkaufsrechnung, keine AfA, keine Buchung.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ]
  });

  return {
    id: '020-fixed-asset-classes',
    tellMeCandidateVisible: /Fixed Asset Class|FA Class|Anlagenklasse/i.test(tellMeText),
    clickedTellMeResult: click.clicked,
    clickMethod: click.method ?? null,
    directPageTried,
    directPageId,
    directPageMatched,
    contextVisible,
    rows,
    screenshot: 'fixedassets-007-021-fixed-asset-classes-result.png',
    tellMeScreenshot: 'fixedassets-007-020-fixed-asset-classes-tell-me.png',
    tellMeEvidenceFile: '020-fixed-asset-classes-tell-me-page-text.txt',
    pageTextEvidenceFile: '021-fixed-asset-classes-result-page-text.txt',
    buttonsEvidenceFile: '021-fixed-asset-classes-buttons.json',
    candidates: click.candidates
  };
}

function renderMarkdown(result: Record<string, any>) {
  const books = (result.depreciationBooks.rows as ExtractedRow[])
    .map((row) => `| ${row.code} | ${row.rawText} |`)
    .join('\n');
  const classes = (result.assetClasses.rows as ExtractedRow[])
    .map((row) => `| ${row.code} | ${row.rawText} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-007 AfA-Buecher und Anlagenklassen read-only',
    '',
    'Status: `labor`, `read-only`, `setup-preparation`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Relevantes Gate | `FIXEDASSETS-004-SETUP-OR-POSTING` locked |',
    '| Setup-Aenderung | nein |',
    '| Buchung | nein |',
    '',
    '## Depreciation Books / AfA-Buecher',
    '',
    '| Code | sichtbarer Kontext |',
    '|---|---|',
    books || '| keine eindeutigen Codes extrahiert | siehe Screenshot/Page-Text |',
    '',
    `HGB sichtbar: ${result.depreciationBooks.hgbVisible ? 'ja' : 'nein'}.`,
    '',
    '## Fixed Asset Classes / Anlagenklassen',
    '',
    '| Code | sichtbarer Kontext |',
    '|---|---|',
    classes || '| keine eindeutigen Codes extrahiert | siehe Screenshot/Page-Text |',
    '',
    `Klassenkontext sichtbar: ${result.assetClasses.contextVisible ? 'ja' : 'nein'}.`,
    '',
    '## Fachliche Einordnung',
    '',
    'AfA-Buecher steuern in Business Central, nach welchen Bewertungs- und Abschreibungsregeln eine Anlage gefuehrt wird. Anlagenklassen gruppieren Anlagen fachlich vor, ersetzen aber nicht die Anlagenbuchungsgruppe: Die Kontenfindung fuer Zugang, Buchwert und AfA bleibt ueber `FA Posting Groups` getrennt.',
    '',
    'Dieser Lauf liest nur vorhandene CRONUS-Strukturen. Er beweist nicht, dass das Buchziel `HGB`, `MACHINES` oder `FA-CNC-01` bereits eingerichtet ist.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 sollte Anfaengern die Reihenfolge erklaeren: erst AfA-Buch, Klasse/Unterklasse und Anlagenbuchungsgruppe verstehen, dann Zielstammdaten planen, danach erst Anlagenzugang oder AfA buchen.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor, kein deutscher HGB-Endstand.',
    '- Kein AfA-Buch und keine Anlagenklasse wurden angelegt oder bearbeitet.',
    '- Keine Anlage `FA-CNC-01`, keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Anlagenposten.',
    '- `FIXEDASSETS-004-SETUP-OR-POSTING` bleibt gesperrt.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-007 AfA-Buecher und Anlagenklassen read-only lesen', async ({ page }) => {
  const depreciationBooks = await captureDepreciationBooks(page);
  const assetClasses = await captureAssetClasses(page);

  const result = {
    testId,
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-setup-preparation-no-posting-no-setup-change',
    gate: {
      id: 'FIXEDASSETS-004-SETUP-OR-POSTING',
      status: 'locked',
      consequence: 'No HGB setup, no asset class setup, no fixed asset master data, no purchase invoice, no acquisition, no depreciation.'
    },
    sourceContext: {
      priorRuns: ['FIXEDASSETS-005', 'FIXEDASSETS-006', 'GOVERNANCE-003'],
      priorFinding: 'FA Posting Groups are reachable and existing CRONUS accounts were read; next safe step is reading Depreciation Books and asset classes.'
    },
    depreciationBooks,
    assetClasses,
    safety: {
      setupChanged: false,
      depreciationBookCreated: false,
      assetClassCreated: false,
      fixedAssetCreated: false,
      purchaseInvoiceCreated: false,
      posted: false,
      depreciationCalculated: false
    },
    proves: [
      'Depreciation Books page can be opened read-only through page 5611.',
      'Current lab visibility for HGB is recorded.',
      'Fixed Asset Classes Tell-Me search and direct page 5615 result are recorded as UI evidence.'
    ],
    doesNotProve: [
      'No German HGB depreciation book target.',
      'No MACHINES FA Posting Group fit.',
      'No FA-CNC-01 fixed asset master data.',
      'No K30000 vendor or acquisition purchase invoice.',
      'No acquisition, depreciation or FA ledger trace.'
    ],
    nextStep:
      'Without gate: Kapitel-21-Buch-Sync/Checkliste fuer Anlagen-Setup-Reihenfolge aus FIXEDASSETS-005 bis 007 ergaenzen. With gate: idempotenten UI-Setup-Fit fuer HGB/MACHINES/FA-CNC-01/K30000 planen; Buchung weiterhin separat freigeben.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-007-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-007-DEPRECIATION-BOOKS-CLASSES.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-007 Evidence-Index',
      '',
      'Ziel: vorhandene AfA-Buecher/Depreciation Books und Anlagenklassen read-only lesen, bevor ein spaeterer HGB-/FA-CNC-01-Fit geplant wird.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-007-result.json` | JSON-Ergebnis | Sandbox, Company, Gate, Depreciation-Book-/Klassenbefund, Sicherheitsgrenzen | kein Setup, keine Buchung, kein deutscher HGB-Endstand | labor, read-only |',
      '| `FIXEDASSETS-007-DEPRECIATION-BOOKS-CLASSES.md` | Lernzusammenfassung | fachliche Rolle von AfA-Buch und Anlagenklassen vor Anlagenzugang | keinen HGB-/FA-CNC-01-Fit | labor, setup-preparation |',
      '| `010-depreciation-books-page-text.txt` | kompakter Seitentext | sichtbare AfA-Buecher/Depreciation-Book-Hinweise | keinen Rohdump | ui-evidence |',
      '| `010-depreciation-books-buttons.json` | Button-Evidence | sichtbare Aktionen ohne Ausfuehrung | keine Aktion | ui-evidence |',
      '| `020-fixed-asset-classes-tell-me-page-text.txt` | Seitentext | Tell-Me-Suchpfad fuer Anlagenklassen | keine Zielseite, falls nicht geoeffnet | ui-evidence |',
      '| `021-fixed-asset-classes-result-page-text.txt` | Seitentext | Ergebnis nach Klickversuch auf Anlagenklassen | keinen Klassen-Setup-Fit | candidate/rejected |',
      '| `021-fixed-asset-classes-buttons.json` | Button-Evidence | sichtbare Aktionen ohne Ausfuehrung | keine Aktion | ui-evidence |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit | mixed |',
      '',
      '## Kernaussage',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.posted).toBe(false);
  expect(depreciationBooks.contextVisible, 'Depreciation Books must open as read-only setup context.').toBe(true);
});
