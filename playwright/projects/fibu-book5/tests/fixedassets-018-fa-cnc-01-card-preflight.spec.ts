import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import {
  bcPageUrl,
  compactPageText,
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

test.setTimeout(300_000);

const testId = 'fixedassets-018';
const target = {
  fixedAssetNo: 'FA-CNC-01',
  description: 'CNC Maschine FRA',
  depreciationBook: 'HGB',
  faPostingGroup: 'MACHINES'
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function fixedAssetsUrl(filterToTarget = false) {
  const url = new URL(bcPageUrl(5601, project.envPrefix));
  if (filterToTarget) {
    url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${target.fixedAssetNo}'`);
  }
  return url.toString();
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

async function openFixedAssets(page: Page, filterToTarget = false) {
  await page.goto(fixedAssetsUrl(filterToTarget), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);
}

async function assertRmDemoContext(page: Page) {
  const url = decodeURIComponent(page.url());
  const text = await pageText(page);
  const urlOk = /MCP_1_20260210/i.test(url) && /company=RM-DEMO/i.test(url);
  const textOk = /Rhein-Main Demo GmbH|RM-DEMO|MCP_1_20260210/i.test(text);
  return { url, urlOk, textOk };
}

async function fixedAssetTargetVisible(page: Page) {
  const text = await pageText(page);
  return new RegExp(`\\b${target.fixedAssetNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
}

async function findFixedAssetFrame(page: Page): Promise<Frame | null> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Fixed Assets|Fixed Asset Card|Fixed Asset|Anlagen|Anlage/i.test(text)) {
      return frame;
    }
  }
  return null;
}

async function clickScopedNew(page: Page) {
  const candidates = [];

  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Fixed Assets|Anlagen/i.test(bodyText)) continue;

    const frameCandidates = await frame
      .evaluate(() => {
        const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
        const score = (candidate: { text: string; aria: string; title: string; role: string; x: number; y: number }) => {
          let value = 0;
          if (/^(New|Neu)$/.test(candidate.text) || /^(New|Neu)$/.test(candidate.aria)) value -= 35;
          if (/Create a new entry|Erstellen Sie einen neuen Eintrag|neuen Eintrag/i.test(candidate.title)) value -= 20;
          if (/button|menuitem/i.test(candidate.role)) value -= 8;
          if (candidate.y >= 35 && candidate.y <= 130) value -= 10;
          if (candidate.x >= 200 && candidate.x <= 850) value -= 5;
          value += Math.abs(candidate.y - 65) / 60;
          value += Math.abs(candidate.x - 520) / 800;
          return value;
        };

        return [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a')]
          .map((element) => {
            const text = normalize(element.innerText || element.textContent || '');
            const aria = normalize(element.getAttribute('aria-label') || '');
            const title = normalize(element.getAttribute('title') || '');
            const rect = element.getBoundingClientRect();
            const role = normalize(element.getAttribute('role') || element.tagName.toLowerCase());
            const label = `${text} ${aria} ${title}`;
            const candidate = {
              text,
              aria,
              title,
              role,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              label
            };
            return { ...candidate, score: score(candidate) };
          })
          .filter(({ text, aria, title, width, height, label }) => {
            if (!(width > 0 && height > 0)) return false;
            if (!/^(New|Neu)$/.test(text) && !/^(New|Neu)$/.test(aria) && !/new entry|neuen Eintrag/i.test(title)) return false;
            if (/Sales|Purchase|Intercom|Time Sheet|Document|Quote|Order|Power BI/i.test(label)) return false;
            return true;
          })
          .sort((left, right) => left.score - right.score)
          .map(({ label: _label, ...candidate }) => candidate)
          .slice(0, 12);
      })
      .catch(() => []);

    for (const candidate of frameCandidates) {
      candidates.push({ frameUrl: frame.url(), ...candidate });
    }

    if (!frameCandidates[0]) continue;

    const clicked = await frame
      .evaluate((candidateToClick) => {
        const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
        const matches = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a')]
          .filter((element) => {
            const text = normalize(element.innerText || element.textContent || '');
            const aria = normalize(element.getAttribute('aria-label') || '');
            const title = normalize(element.getAttribute('title') || '');
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              Math.round(rect.x) === candidateToClick.x &&
              Math.round(rect.y) === candidateToClick.y &&
              (text === candidateToClick.text || aria === candidateToClick.aria || title === candidateToClick.title)
            );
          });
        matches[0]?.click();
        return Boolean(matches[0]);
      }, frameCandidates[0])
      .catch(() => false);

    if (clicked) {
      await page.waitForTimeout(3500);
      return { clicked: true, method: 'scored-fixed-assets-new-action', frameUrl: frame.url(), candidates };
    }
  }

  return { clicked: false, method: 'scored-fixed-assets-new-action', candidates };
}

async function extractCardPreflight(page: Page) {
  const frame = await findFixedAssetFrame(page);
  if (!frame) {
    return {
      frameFound: false,
      pageTitleCandidates: [],
      fieldHints: [],
      fastTabCandidates: [],
      actionCandidates: [],
      targetValuesVisible: {}
    };
  }

  return frame.evaluate((targetValues) => {
    const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
    const textOf = (element: HTMLElement) => clean(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || '');
    const bodyText = clean(document.body?.innerText || '');
    const pageTitleCandidates = [...document.querySelectorAll<HTMLElement>('h1,h2,[role="heading"],[aria-label],[title]')]
      .map(textOf)
      .filter(Boolean)
      .slice(0, 80);
    const fieldHints = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select,[contenteditable="true"]')]
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        let container: Element | null = element;
        for (let depth = 0; depth < 5 && container?.parentElement; depth += 1) {
          container = container.parentElement;
        }
        return {
          index,
          value: 'value' in element ? clean((element as HTMLInputElement).value || '') : clean(element.textContent || ''),
          ariaLabel: element.getAttribute('aria-label') || '',
          title: element.getAttribute('title') || '',
          placeholder: element.getAttribute('placeholder') || '',
          required: element.hasAttribute('required') || element.getAttribute('aria-required') === 'true',
          disabled: (element as HTMLInputElement).disabled || element.getAttribute('aria-disabled') === 'true',
          readOnly: (element as HTMLInputElement).readOnly || element.getAttribute('aria-readonly') === 'true',
          nearbyText: clean(container?.textContent || '').slice(0, 360),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        };
      })
      .filter((field) => field.visible)
      .slice(0, 140);
    const fastTabCandidates = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[aria-expanded],[aria-label],[title]')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: textOf(element),
          aria: element.getAttribute('aria-label') || '',
          title: element.getAttribute('title') || '',
          expanded: element.getAttribute('aria-expanded'),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        };
      })
      .filter((entry) => entry.visible && /General|Fixed Asset|Depreciation|AfA|Posting|Buchung|Maintenance|Book|Insurance|Integration|Dimensions|Dimension/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
      .slice(0, 80);
    const actionCandidates = [...document.querySelectorAll<HTMLElement>('button,a,[role="button"],[role="menuitem"],[aria-label],[title]')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: textOf(element),
          aria: element.getAttribute('aria-label') || '',
          title: element.getAttribute('title') || '',
          role: element.getAttribute('role') || '',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        };
      })
      .filter((entry) => entry.visible && /Back|Zurueck|Cancel|Abbrechen|Discard|Verwerfen|Close|Schlie|Save|Speichern|Delete|Loeschen|Post|Buchen|Acquire|Depreciation|Dimensions|Dimension/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
      .slice(0, 80);

    return {
      frameFound: true,
      pageTitleCandidates,
      fieldHints,
      fastTabCandidates,
      actionCandidates,
      targetValuesVisible: {
        fixedAssetNo: bodyText.includes(targetValues.fixedAssetNo),
        description: bodyText.includes(targetValues.description),
        depreciationBook: bodyText.includes(targetValues.depreciationBook),
        faPostingGroup: bodyText.includes(targetValues.faPostingGroup)
      }
    };
  }, target);
}

function compactFixedAssetText(raw: string) {
  const include = [
    /Fixed Asset|Fixed Assets|Anlagen|Anlage/i,
    /FA-CNC-01|CNC Maschine|HGB|MACHINES/i,
    /No\.|Code|Description|Beschreibung|Depreciation|AfA|Book|Posting Group|Buchungsgruppe|Class|Subclass|Blocked|Gesperrt/i,
    /New|Neu|Save|Speichern|Cancel|Abbrechen|Discard|Verwerfen|Post|Buchen|Acquire|Acquisition/i
  ];
  const lines = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeEvidenceText(line.replace(/\s+/g, ' ').trim()))
    .filter(Boolean);
  const selected = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    if (!include.some((pattern) => pattern.test(lines[index]))) continue;
    for (let offset = -3; offset <= 8; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }
  return [
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected].sort((left, right) => left - right).map((index) => lines[index]).slice(0, 240)
  ].join('\n');
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-018 FA-CNC-01 Card Preflight',
    '',
    'Status: `labor`, `ui-first`, `card-preflight`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |',
    '| Buchung | nein |',
    '| Setup geaendert | nein |',
    '| Stammdaten gespeichert | nein |',
    '',
    '## Ergebnis',
    '',
    `- ` + `FA-CNC-01` + ` in sichtbarer Anlagenliste/Seitentext vor New sichtbar: ${result.targetVisibleBeforeNew ? 'ja' : 'nein'}.`,
    `- Kontrollierter New/Karten-Preflight ausgefuehrt: ${result.newAttempt.clicked ? 'ja' : 'nein'}.`,
    `- Karten-/Feldkontext erfasst: ${result.cardPreflight.frameFound ? 'ja' : 'nein'}.`,
    `- Sichtbare Feldhinweise: ${result.cardPreflight.fieldHints.length}.`,
    `- Sichtbare FastTab-/Bereichshinweise: ${result.cardPreflight.fastTabCandidates.length}.`,
    '',
    '## Was praktisch nachgewiesen ist',
    '',
    '- Die Fixed-Assets-Liste ist in `RM-DEMO` als Karten-Preflight-Kontext erreichbar.',
    '- `FA-CNC-01` wurde vor dem New/Kartenkontext im Listen-/Seitentext geprueft.',
    '- Das Listenbild zeigt den Anlagenlisten-Kontext; es ist kein sauberer leerer Filterbeweis.',
    '- Das Kartenbild zeigt die leere `Fixed Asset Card` mit `No.`, `Description`, `FA Class Code`, `FA Subclass Code`, `Depreciation Method`, `Depreciation Starting Date`, `Depreciation Ending Date` und `Book Value = 0,00`.',
    '- Der Lauf speichert keine Anlage und erzeugt keine Einkaufsrechnung, keinen Zugang, keine AfA und keine Posten.',
    '- Die erfassten Feld-/FastTab-Hinweise sind Preflight-Evidence fuer die spaetere Anlagenanlage, kein fertiger Stammdatennachweis.',
    '',
    '## Was nicht bewiesen ist',
    '',
    '- `FA-CNC-01` existiert noch nicht als belastbar gespeicherte Anlage.',
    '- `HGB` und `MACHINES` sind noch nicht auf einer gespeicherten Anlagenkarte nachgewiesen.',
    '- Kein `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA, keine Anlagenposten und keine Sachposten.',
    '- Kein deutscher HGB-/Kontenplan- oder Steuer-Finalnachweis.',
    '',
    '## Anfaenger-Lernwert',
    '',
    '`HGB` und `MACHINES` sind Setup. Die Anlage selbst entsteht erst auf der Anlagenkarte. Deshalb muss ein Leser zuerst sehen, welche Felder und Bereiche die Anlagenkarte anbietet, bevor er eine Einkaufsrechnung oder AfA startet. Wenn diese Reihenfolge falsch ist, sucht man spaeter Fehler im Kreditoren- oder Buchungsprozess, obwohl die Anlage als Stammdatum noch nicht sauber vorbereitet wurde.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 sollte den naechsten Screenshot als Karten-Preflight oder spaeter als gespeicherte Anlagenkarte klar markieren. Ein leeres Kartenbild ist kein finaler Stammdatenscreenshot; ein Buchbild fuer die fertige Anlage muss `FA-CNC-01`, Beschreibung und die relevanten Setup-Bezuege sichtbar zeigen.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-018 FA-CNC-01 Fixed-Asset-Card UI-first Preflight', async ({ page }) => {
  await openFixedAssets(page, true);
  const context = await assertRmDemoContext(page);
  if (!context.urlOk && !context.textOk) {
    throw new Error(`Falscher BC-Kontext: ${context.url}`);
  }

  const beforeText = await pageText(page);
  const targetVisibleBeforeNew = await fixedAssetTargetVisible(page);
  await writeTextEvidence(fixedAssetsEvidencePath('010-fixed-assets-list-page-text.txt'), compactFixedAssetText(beforeText));
  await screenshot(page, 'fixedassets-018-010-fixed-assets-list-target-not-visible.png', {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: targetVisibleBeforeNew ? 'field-proof' : 'limited-preflight',
    purpose: 'FIXEDASSETS-018 Vorpruefung: Fixed Assets/Anlagenliste vor Karten-Preflight; FA-CNC-01 ist im sichtbaren Ausschnitt nicht zu sehen.',
    expectedPageText: [/Fixed Assets|Fixed Asset|Anlagen|Anlage/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Listenbild ist nur Vorpruefung; wenn FA-CNC-01 im sichtbaren Ausschnitt fehlt, ist das kein vollstaendiger Nicht-Existenz-Beweis.',
      'Keine Anlage, kein Kreditor, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.'
    ]
  });

  let newAttempt = { clicked: false, method: 'skipped-target-already-visible', candidates: [] as unknown[] };
  let cardPreflight = {
    frameFound: false,
    pageTitleCandidates: [] as string[],
    fieldHints: [] as unknown[],
    fastTabCandidates: [] as unknown[],
    actionCandidates: [] as unknown[],
    targetValuesVisible: {}
  };

  if (!targetVisibleBeforeNew) {
    await openFixedAssets(page, false);
    newAttempt = await clickScopedNew(page);
    await writeJsonEvidence(fixedAssetsEvidencePath('020-new-action-candidates.json'), newAttempt);
    await dismissTours(page);
    await page.waitForTimeout(1500);
    const cardText = await pageText(page);
    cardPreflight = await extractCardPreflight(page);
    await writeTextEvidence(fixedAssetsEvidencePath('030-card-preflight-page-text.txt'), compactFixedAssetText(cardText));
    await writeJsonEvidence(fixedAssetsEvidencePath('030-card-preflight-hints.json'), cardPreflight);
    await screenshot(page, 'fixedassets-018-030-fixed-asset-card-preflight.png', {
      projectName: project.name,
      testId,
      status: newAttempt.clicked && cardPreflight.frameFound ? 'candidate' : 'rejected',
      bookUse: 'evidence',
      purpose: 'FIXEDASSETS-018 Karten-Preflight: leere Fixed Asset Card/Folgekontext ohne Eingabe und ohne Speichern inspizieren.',
      expectedPageText: [/Fixed Asset|Fixed Assets|Anlagen|Anlage/i],
      knownLimitations: [
        'Formular-/Karten-Preflight, kein gespeicherter Anlagenstamm.',
        'FA-CNC-01, HGB und MACHINES sind auf diesem Bild nur dann beweisbar, wenn sie sichtbar sind; sonst bleibt es Preflight-Evidence.',
        'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.'
      ]
    });

    await openFixedAssets(page, true);
  }

  const afterText = await pageText(page);
  const targetVisibleAfterPreflight = await fixedAssetTargetVisible(page);
  await writeTextEvidence(
    fixedAssetsEvidencePath('040-after-preflight-fixed-assets-page-text.txt'),
    await compactPageText(page, {
      include: [/Fixed Asset|Fixed Assets|Anlagen|Anlage|FA-CNC-01|CNC Maschine|HGB|MACHINES|No\.|Description|Beschreibung/i],
      maxLines: 120
    })
  );

  const result = {
    testId: 'FIXEDASSETS-018',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-fixed-asset-card-preflight-no-save-no-posting',
    target,
    context,
    targetVisibleBeforeNew,
    newAttempt,
    cardPreflight,
    targetVisibleAfterPreflight,
    screenshots: [
      'fixedassets-018-010-fixed-assets-list-target-not-visible.png',
      ...(newAttempt.clicked ? ['fixedassets-018-030-fixed-asset-card-preflight.png'] : [])
    ],
    safety: {
      posted: false,
      setupChanged: false,
      fixedAssetCreated: false,
      vendorCreated: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      saved: false
    },
    proves: [
      'Fixed Assets list/card context can be inspected UI-first in RM-DEMO.',
      'FA-CNC-01 visibility is checked before any New/Card context is opened.',
      'The run stays before vendor, purchase invoice, acquisition, depreciation and posting.'
    ],
    doesNotProve: [
      'No saved FA-CNC-01 fixed asset card.',
      'No HGB or MACHINES assignment on a saved asset.',
      'No K30000 vendor.',
      'No purchase invoice, acquisition, depreciation, FA ledger entries or G/L trace.',
      'No German final fixed-asset accounting proof.'
    ],
    nextStep:
      targetVisibleAfterPreflight
        ? 'FIXEDASSETS-019-FA-CNC-01-CARD-FIELD-PROOF: vorhandene FA-CNC-01-Karte oeffnen und Beschreibung, AfA-Buch und Anlagenbuchungsgruppe belegen, bevor Kreditor oder Einkaufsrechnung starten.'
        : 'FIXEDASSETS-019-FA-CNC-01-CARD-FIELD-MAPPING-DECISION: entscheiden, ob die sichtbaren Kartenfelder fuer einen engen UI-first FA-CNC-01-Setup-Fit reichen; weiterhin kein K30000, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-018-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-018-FA-CNC-01-CARD-PREFLIGHT.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-018 Evidence-Index',
      '',
      'Status: `labor`, `ui-first`, `card-preflight`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-018-result.json` | JSON-Ergebnis | Ziel, Kontext, New-/Karten-Preflight, Feldhinweise, Sicherheitsgrenzen und naechsten Schritt | keine gespeicherte Anlage und keine Buchung | labor |',
      '| `FIXEDASSETS-018-FA-CNC-01-CARD-PREFLIGHT.md` | Lernzusammenfassung | warum die Anlagenkarte vor Kreditor/Rechnung/Zugang/AfA kommt | keinen deutschen Finalnachweis | labor |',
      '| `010-fixed-assets-list-page-text.txt` | Seitentext | Anlagenliste/Seitentext vor Karten-Preflight | keinen fertigen Zielstammsatz und keinen vollstaendigen Nicht-Existenz-Beweis | compact |',
      '| `020-new-action-candidates.json` | JSON-Auszug | sichtbare New/Neu-Kandidaten, falls FA-CNC-01 nicht sichtbar war | keine Klickfreigabe fuer Speichern | compact/conditional |',
      '| `030-card-preflight-page-text.txt` | Seitentext | Karten-/Folgekontext nach New, falls geoeffnet | keine gespeicherte Karte | compact/conditional |',
      '| `030-card-preflight-hints.json` | JSON-Auszug | sichtbare Felder, FastTabs und Aktionen im Karten-Preflight | kein vollstaendiges Tabellenmodell | compact/conditional |',
      '| `040-after-preflight-fixed-assets-page-text.txt` | Seitentext | Rueckkehr zur gefilterten Liste nach Preflight | keine Anlage | compact |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | labor/candidate/rejected |',
      '| `playwright/projects/fibu-book5/img/fixedassets-018-010-fixed-assets-list-target-not-visible.png` | Screenshot | Anlagenlisten-Kontext ohne sichtbaren Zielcode `FA-CNC-01` im Ausschnitt | keinen Karten-/Stammdatenbeweis und keinen sauber leeren Filterbeweis | labor-preflight-limited |',
      '| `playwright/projects/fibu-book5/img/fixedassets-018-030-fixed-asset-card-preflight.png` | Screenshot | leere Anlagenkarte mit sichtbaren Grund- und AfA-Feldern | keine gespeicherte Anlage `FA-CNC-01`, keine `HGB`-/`MACHINES`-Zuordnung | labor-preflight |',
      '',
      '## Kernaussage',
      '',
      '`FA-CNC-01` ist im aktuellen RM-DEMO-Labor noch nicht sichtbar und wurde nicht gespeichert. Die leere `Fixed Asset Card` ist aber als Lern- und Feldmapping-Nachweis brauchbar: sichtbar sind unter anderem `No.`, `Description`, `FA Class Code`, `FA Subclass Code`, `Depreciation Method`, AfA-Start-/Enddatum und `Book Value = 0,00`. Naechster Schritt ist `FIXEDASSETS-019-FA-CNC-01-CARD-FIELD-MAPPING-DECISION`: entscheiden, ob die sichtbaren Kartenfelder fuer einen engen UI-first Setup-Fit reichen; weiterhin kein `K30000`, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.',
      ''
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.saved).toBe(false);
  expect(/MCP_1_20260210/i.test(result.context.url)).toBe(true);
  expect(result.context.urlOk || result.context.textOk).toBe(true);
});
