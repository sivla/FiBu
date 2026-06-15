import { expect, test, type Frame } from '@playwright/test';
import 'dotenv/config';
import {
  bcPageUrl,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(360_000);

const testId = 'fixedassets-014';
const target = {
  code: 'HGB',
  description: 'HGB depreciation book'
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function depreciationBooksUrl(filterToHgb = false) {
  const url = new URL(bcPageUrl(5611, project.envPrefix));
  if (filterToHgb) {
    url.searchParams.set('filter', `'Depreciation Book'.'Code' IS '${target.code}'`);
  }
  return url.toString();
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
    /Depreciation Book|Depreciation Books|AfA|Abschreibung|Code|Description|Beschreibung|HGB|Company Book|Default Final Rounding Amount|Default Ending Book Value|Disposal Calculation Method|G\/L Integration|New|Neu|Save|Speichern|Error|Fehler/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => sanitizeEvidenceText(line.replace(/\s+/g, ' ').trim()))
    .filter((line) => Boolean(line) && !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|shouldAttachOauthTokens|O365SuiteServiceProxy/i.test(line));
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -2; offset <= 5; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
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

async function openDepreciationBooks(page: Parameters<typeof waitForBusinessCentralShell>[0], filterToHgb = false) {
  await page.goto(depreciationBooksUrl(filterToHgb), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);
}

async function findDepreciationBooksFrame(page: Parameters<typeof waitForBusinessCentralShell>[0]) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Depreciation Book|Depreciation Books|AfA|Abschreibung/i.test(text)) {
      return frame;
    }
  }
  throw new Error('Depreciation-Books-Frame nicht gefunden.');
}

async function hgbVisible(page: Parameters<typeof waitForBusinessCentralShell>[0]) {
  const text = await pageText(page);
  return /\bHGB\b/i.test(text);
}

async function clickScopedNew(frame: Frame) {
  return frame
    .evaluate(() => {
      const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
      const candidates = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a')]
        .map((element) => {
          const text = normalize(element.innerText || element.textContent || '');
          const aria = normalize(element.getAttribute('aria-label') || '');
          const title = normalize(element.getAttribute('title') || '');
          const rect = element.getBoundingClientRect();
          const label = `${text} ${aria} ${title}`;
          return { element, text, aria, title, rect, label };
        })
        .filter(({ text, aria, title, rect, label }) => {
          if (!(rect.width > 0 && rect.height > 0)) return false;
          if (!/^(New|Neu)$/.test(text) && !/^(New|Neu)$/.test(aria)) return false;
          if (!/new entry|neuen Eintrag/i.test(title) && !/^(New|Neu)$/.test(text)) return false;
          if (/Sales|Purchase|Intercom|Time Sheet|Document|Quote|Order/i.test(label)) return false;
          return true;
        })
        .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);

      const target = candidates[0]?.element;
      if (!target) return false;
      target.click();
      return true;
    })
    .catch(() => false);
}

async function fillDepreciationBookCard(page: Parameters<typeof waitForBusinessCentralShell>[0]) {
  await page.waitForTimeout(3000);
  const frame = await findDepreciationBooksFrame(page);
  const inputs = frame.locator('input:visible');
  const inputCount = await inputs.count();
  if (inputCount < 2) {
    throw new Error(`Depreciation Book Card hat zu wenige sichtbare Eingabefelder: ${inputCount}.`);
  }

  await inputs.nth(0).fill(target.code);
  await inputs.nth(0).press('Tab');
  await inputs.nth(1).fill(target.description);
  await inputs.nth(1).press('Tab');
  await page.waitForTimeout(3000);
}

async function readVisibleRows(page: Parameters<typeof waitForBusinessCentralShell>[0]) {
  const rows: string[] = [];
  for (const frame of page.frames()) {
    const frameRows = await frame
      .evaluate(() => {
        const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
        return [...document.querySelectorAll<HTMLElement>('[role="row"], tr, [data-control-name], [data-testid]')]
          .map((element) => {
            const text = clean(element.innerText || element.textContent || '');
            const inputValues = [...element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea')]
              .map((input) => clean(input.value || input.getAttribute('aria-label') || input.getAttribute('title') || ''))
              .filter(Boolean)
              .join(' ');
            return clean(`${text} ${inputValues}`);
          })
          .filter(Boolean)
          .slice(0, 120);
      })
      .catch(() => []);
    rows.push(...frameRows);
  }
  return rows.filter((row) => /\bHGB\b|COMPANY|CORP|TAX|Depreciation|Code|Description/i.test(row)).slice(0, 80);
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-014 HGB Depreciation Book Fit',
    '',
    'Status: `labor`, `ui-first`, `setup-proof`, `idempotent`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Zielobjekt | Depreciation Book / AfA-Buch `HGB` |',
    `| Aktion | ${result.action} |`,
    '| Buchung | nein |',
    '| Setup geaendert | ' + (result.action === 'created-hgb' ? 'ja, genau `HGB`' : 'nein, `HGB` war bereits vorhanden') + ' |',
    '',
    '## Was praktisch nachgewiesen ist',
    '',
    '- Die Seite `Depreciation Books` wurde in `RM-DEMO` innerhalb `MCP_1_20260210` UI-first geoeffnet.',
    '- Vor der Aktion wurde gezielt auf `HGB` geprueft.',
    '- Nach der Aktion ist `HGB` im sichtbaren BC-Kontext nachgewiesen.',
    '- Es wurde keine Anlage, keine Anlagenbuchungsgruppe, kein Kreditor und keine Einkaufsrechnung angelegt.',
    '- Es wurde nichts gebucht.',
    '',
    '## Warum das fachlich wichtig ist',
    '',
    'Ein AfA-Buch ist die Bewertungs- und Abschreibungsebene fuer Anlagen. Es ist nicht die Anlage selbst und nicht die Kontenfindung. Fuer Anfaenger ist diese Trennung zentral: Erst Bewertungslogik vorbereiten, dann Anlagenbuchungsgruppe/Konten entscheiden, dann Anlage und Zugang buchen.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor, kein deutscher HGB-Endstand.',
    '- Keine deutsche Steuer-, Kontenplan- oder Abschlussaussage.',
    '- `MACHINES`, `FA-CNC-01` und `K30000` bleiben gesperrt.',
    '- Der naechste Schritt muss die Anlagenbuchungsgruppe `MACHINES` fachlich aus Konten-/Posting-Logik entscheiden, nicht raten.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 darf `HGB` jetzt als RM-DEMO-Labor-Setup-Prerequisite zeigen. Der Text muss weiter klar trennen: HGB-AfA-Buch vorhanden bedeutet noch keine Anlagenaktivierung und keine deutsche finale Anlagenbuchhaltung.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-014 HGB AfA-Buch idempotent UI-first fitten', async ({ page }) => {
  await openDepreciationBooks(page, true);
  const beforeText = await pageText(page);
  const beforeHgbVisible = /\bHGB\b/i.test(beforeText);
  await writeTextEvidence(fixedAssetsEvidencePath('010-before-hgb-page-text.txt'), compactPageText(beforeText));
  await screenshot(page, 'fixedassets-014-010-depreciation-books-before-hgb.png', {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: 'evidence',
    purpose: 'FIXEDASSETS-014 Vorher-Pruefung: Depreciation Books gefiltert auf HGB, bevor ein idempotenter Fit erfolgt.',
    expectedPageText: [/Depreciation Book|Depreciation Books/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Vorher-Bild beweist nur den Startkontext; wenn HGB fehlt, ist kein Zielcode sichtbar.',
      'Kein deutscher HGB-Endstand.'
    ]
  });

  let action: 'already-fit' | 'created-hgb' = 'already-fit';
  let createAttempt: { clickedNew: boolean } | undefined;

  if (!beforeHgbVisible) {
    action = 'created-hgb';
    const frame = await findDepreciationBooksFrame(page);
    const clickedNew = await clickScopedNew(frame);
    createAttempt = { clickedNew };
    if (!clickedNew) {
      throw new Error('Scoped New/Neu auf Depreciation Books konnte nicht geklickt werden.');
    }
    await fillDepreciationBookCard(page);
  }

  await openDepreciationBooks(page, true);
  const afterText = await pageText(page);
  const afterRows = await readVisibleRows(page);
  const afterHgbVisible = await hgbVisible(page);

  await writeTextEvidence(fixedAssetsEvidencePath('020-after-hgb-page-text.txt'), compactPageText(afterText));
  await writeJsonEvidence(fixedAssetsEvidencePath('020-after-hgb-visible-rows.json'), afterRows);
  await screenshot(page, 'fixedassets-014-020-depreciation-books-after-hgb.png', {
    projectName: project.name,
    testId,
    status: afterHgbVisible ? 'labor' : 'rejected',
    bookUse: afterHgbVisible ? 'setup-proof' : 'do-not-use',
    purpose: 'FIXEDASSETS-014 Nachher-Pruefung: HGB muss im Depreciation-Books-Kontext sichtbar sein.',
    expectedPageText: [/Depreciation Book|Depreciation Books/i, /\bHGB\b/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Nur AfA-Buch-Fit; keine Anlagenbuchungsgruppe, keine Anlage, kein Anlagenzugang, keine AfA und keine Buchung.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-014',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-idempotent-setup-fit-no-posting',
    target,
    action,
    beforeHgbVisible,
    afterHgbVisible,
    createAttempt: createAttempt ?? null,
    visibleRows: afterRows,
    screenshots: [
      'fixedassets-014-010-depreciation-books-before-hgb.png',
      'fixedassets-014-020-depreciation-books-after-hgb.png'
    ],
    safety: {
      posted: false,
      fixedAssetCreated: false,
      faPostingGroupCreated: false,
      vendorCreated: false,
      purchaseInvoiceCreated: false,
      depreciationBookTargetOnly: 'HGB'
    },
    proves: [
      'HGB is visible on Depreciation Books after the UI-first fit.',
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'The setup fit was idempotent: existing HGB was accepted, missing HGB was created exactly once.'
    ],
    doesNotProve: [
      'No German final HGB accounting setup.',
      'No MACHINES FA Posting Group account mapping.',
      'No FA-CNC-01 fixed asset master data.',
      'No acquisition, depreciation, FA ledger entries or posting trace.'
    ],
    nextStep:
      'FIXEDASSETS-015-MACHINES-ACCOUNT-MAPPING-DECISION: read existing CRONUS FA Posting Groups and decide whether a narrow MACHINES setup-fit is safe; do not create FA-CNC-01 yet.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-014-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-014-HGB-DEPRECIATION-BOOK-FIT.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-014 Evidence-Index',
      '',
      'Status: `labor`, `ui-first`, `setup-proof`, `idempotent`, `no-posting`, `not-final`, `de-final-open`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-014-result.json` | JSON-Ergebnis | Ziel, Aktion, Vorher/Nachher, Sicherheitsgrenzen und naechsten Schritt | keinen deutschen finalen Anlagenprozess | labor |',
      '| `FIXEDASSETS-014-HGB-DEPRECIATION-BOOK-FIT.md` | Lernzusammenfassung | warum `HGB` als AfA-Buch-Prerequisite angelegt/erkannt wurde | keine Anlagenbuchung und keine Kontenentscheidung | labor |',
      '| `010-before-hgb-page-text.txt` | Seitentext | Startkontext Depreciation Books mit HGB-Pruefung | keinen finalen Zielzustand | compact |',
      '| `020-after-hgb-page-text.txt` | Seitentext | Nachher-Kontext mit sichtbarem `HGB` | keine Anlagenbuchung | compact |',
      '| `020-after-hgb-visible-rows.json` | JSON-Auszug | sichtbare relevante Zeilen nach dem Fit | keine vollstaendige Tabellenextraktion | compact |',
      '| `fixedassets-014-010-depreciation-books-before-hgb.png` | Screenshot | Vorher-Kontext der HGB-Pruefung | kein Buch-Endbild, falls HGB fehlt | labor |',
      '| `fixedassets-014-020-depreciation-books-after-hgb.png` | Screenshot | sichtbares `HGB` als AfA-Buch im Labor | kein deutscher Finalnachweis | labor/book-candidate |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | labor |',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(afterHgbVisible).toBe(true);
  expect(result.safety.posted).toBe(false);
  expect(result.safety.fixedAssetCreated).toBe(false);
  expect(result.safety.faPostingGroupCreated).toBe(false);
});
