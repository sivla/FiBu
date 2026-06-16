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

const testId = 'fixedassets-020';
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

async function openFixedAssets(page: Page, filterToTarget = false) {
  await page.goto(fixedAssetsUrl(filterToTarget), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2000);
}

async function assertRmDemoContext(page: Page) {
  const url = decodeURIComponent(page.url());
  const text = await pageText(page);
  return {
    url,
    urlOk: /MCP_1_20260210/i.test(url) && /company=RM-DEMO/i.test(url),
    textOk: /Rhein-Main Demo GmbH|RM-DEMO|MCP_1_20260210/i.test(text)
  };
}

async function findFixedAssetFrame(page: Page): Promise<Frame | null> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Fixed Asset Card|Fixed Assets|Fixed Asset|Anlagen|Anlage/i.test(text)) {
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
          .slice(0, 12);
      })
      .catch(() => []);

    for (const candidate of frameCandidates) {
      candidates.push({ frameUrl: frame.url(), ...candidate });
    }

    const best = frameCandidates[0];
    if (!best) continue;

    const clicked = await frame
      .evaluate((candidateToClick) => {
        const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
        const matches = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a')].filter(
          (element) => {
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
          }
        );
        matches[0]?.click();
        return Boolean(matches[0]);
      }, best)
      .catch(() => false);

    if (clicked) {
      await page.waitForTimeout(3500);
      return { clicked: true, method: 'scored-fixed-assets-new-action', frameUrl: frame.url(), candidates };
    }
  }

  return { clicked: false, method: 'scored-fixed-assets-new-action', candidates };
}

async function clickShowMoreCandidates(page: Page) {
  const clicked: unknown[] = [];
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Fixed Asset Card|Fixed Asset|Anlagen/i.test(bodyText)) continue;

    const frameClicks = await frame
      .evaluate(() => {
        const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
        const candidates = [...document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-expanded]')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent || '');
            const aria = normalize(element.getAttribute('aria-label') || '');
            const title = normalize(element.getAttribute('title') || '');
            const label = `${text} ${aria} ${title}`;
            return {
              element,
              text,
              aria,
              title,
              expanded: element.getAttribute('aria-expanded'),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              label
            };
          })
          .filter(({ width, height, label, y }) => {
            if (!(width > 0 && height > 0)) return false;
            if (y < 180) return false;
            return /Mehr anzeigen|Show more|Show more fields/i.test(label);
          })
          .sort((left, right) => left.y - right.y)
          .slice(0, 6);

        const clickedEntries = [];
        for (const candidate of candidates) {
          candidate.element.click();
          clickedEntries.push({
            text: candidate.text,
            aria: candidate.aria,
            title: candidate.title,
            expandedBefore: candidate.expanded,
            x: candidate.x,
            y: candidate.y
          });
        }
        return clickedEntries;
      })
      .catch(() => []);
    clicked.push(...frameClicks.map((entry) => ({ frameUrl: frame.url(), ...entry })));
  }

  if (clicked.length) await page.waitForTimeout(1500);
  return clicked;
}

async function extractFieldMapping(page: Page) {
  const frame = await findFixedAssetFrame(page);
  const fullText = await pageText(page);
  if (!frame) {
    return {
      frameFound: false,
      fullTextTargetVisibility: targetVisibility(fullText),
      fieldHints: [],
      fastTabCandidates: [],
      technicalConclusion: 'no-fixed-asset-frame'
    };
  }

  const extracted = await frame.evaluate((targetValues) => {
    const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
    const bodyText = clean(document.body?.innerText || '');
    const fieldHints = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select,[contenteditable="true"]')]
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        let container: Element | null = element;
        for (let depth = 0; depth < 5 && container?.parentElement; depth += 1) {
          container = container.parentElement;
        }
        const nearbyText = clean(container?.textContent || '').slice(0, 420);
        const label = clean(`${element.getAttribute('aria-label') || ''} ${element.getAttribute('title') || ''} ${element.getAttribute('placeholder') || ''} ${nearbyText}`);
        return {
          index,
          value: 'value' in element ? clean((element as HTMLInputElement).value || '') : clean(element.textContent || ''),
          ariaLabel: element.getAttribute('aria-label') || '',
          title: element.getAttribute('title') || '',
          placeholder: element.getAttribute('placeholder') || '',
          required: element.hasAttribute('required') || element.getAttribute('aria-required') === 'true',
          disabled: (element as HTMLInputElement).disabled || element.getAttribute('aria-disabled') === 'true',
          readOnly: (element as HTMLInputElement).readOnly || element.getAttribute('aria-readonly') === 'true',
          nearbyText,
          matches: {
            no: /No\.|Nummer|Nr\./i.test(label),
            description: /Description|Beschreibung/i.test(label),
            depreciationBook: /Depreciation Book|AfA-Buch|Abschreibungsbuch/i.test(label),
            faPostingGroup: /FA Posting Group|Anlagenbuchungsgruppe|Posting Group|Buchungsgruppe/i.test(label),
            faClass: /FA Class|Anlagenklasse|Class Code/i.test(label),
            faSubclass: /FA Subclass|Anlagenunterklasse|Subclass Code/i.test(label)
          },
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        };
      })
      .filter((field) => field.visible)
      .slice(0, 180);
    const fastTabCandidates = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[aria-expanded],[aria-label],[title]')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: clean(element.innerText || element.textContent || ''),
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
      .filter((entry) => entry.visible && /General|Fixed Asset|Depreciation|AfA|Posting|Buchung|Maintenance|Book|Integration|Dimensions|Dimension|Mehr anzeigen|Show more/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
      .slice(0, 120);

    return {
      frameTextTargetVisibility: {
        fixedAssetNo: bodyText.includes(targetValues.fixedAssetNo),
        description: bodyText.includes(targetValues.description),
        depreciationBook: bodyText.includes(targetValues.depreciationBook),
        faPostingGroup: bodyText.includes(targetValues.faPostingGroup)
      },
      fieldHints,
      fastTabCandidates
    };
  }, target);

  const hasField = (key: 'no' | 'description' | 'depreciationBook' | 'faPostingGroup' | 'faClass' | 'faSubclass') =>
    extracted.fieldHints.some((field) => field.matches[key]);

  return {
    frameFound: true,
    fullTextTargetVisibility: targetVisibility(fullText),
    ...extracted,
    targetFieldReachability: {
      noFieldVisible: hasField('no'),
      descriptionFieldVisible: hasField('description'),
      depreciationBookFieldVisible: hasField('depreciationBook'),
      faPostingGroupFieldVisible: hasField('faPostingGroup'),
      faClassFieldVisible: hasField('faClass'),
      faSubclassFieldVisible: hasField('faSubclass')
    },
    technicalConclusion:
      hasField('depreciationBook') && hasField('faPostingGroup')
        ? 'hgb-and-machines-field-paths-appear-reachable'
        : 'hgb-or-machines-field-path-still-not-visible'
  };
}

function targetVisibility(text: string) {
  return {
    fixedAssetNo: text.includes(target.fixedAssetNo),
    description: text.includes(target.description),
    depreciationBook: /\bHGB\b/i.test(text),
    faPostingGroup: /\bMACHINES\b/i.test(text)
  };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-020 - FA-CNC-01 Card More-Fields Mapping',
    '',
    'Status: `labor`, `ui-first`, `readiness`, `field-mapping`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |',
    '| Speichern | nein |',
    '| Setup geaendert | nein |',
    '| Buchung | nein |',
    '',
    '## Ergebnis',
    '',
    `- Kartenkontext geoeffnet: ${result.newAttempt.clicked ? 'ja' : 'nein'}.`,
    `- Mehr-/Bereichsdiagnose ausgefuehrt: ${result.showMoreClicks.length ? 'ja' : 'nein'} (${result.showMoreClicks.length} Klicks).`,
    `- Feld ` + '`No.`' + ` sichtbar: ${result.mapping.targetFieldReachability?.noFieldVisible ? 'ja' : 'nein'}.`,
    `- Feld ` + '`Description`' + ` sichtbar: ${result.mapping.targetFieldReachability?.descriptionFieldVisible ? 'ja' : 'nein'}.`,
    `- Feld fuer AfA-Buch/Depreciation Book sichtbar: ${result.mapping.targetFieldReachability?.depreciationBookFieldVisible ? 'ja' : 'nein'}.`,
    `- Feld fuer Anlagenbuchungsgruppe/FA Posting Group sichtbar: ${result.mapping.targetFieldReachability?.faPostingGroupFieldVisible ? 'ja' : 'nein'}.`,
    `- Zielwert ` + '`HGB`' + ` im Seitentext sichtbar: ${result.mapping.fullTextTargetVisibility?.depreciationBook ? 'ja' : 'nein'}.`,
    `- Zielwert ` + '`MACHINES`' + ` im Seitentext sichtbar: ${result.mapping.fullTextTargetVisibility?.faPostingGroup ? 'ja' : 'nein'}.`,
    '',
    '## Entscheidung fuer den naechsten Lauf',
    '',
    result.decision,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Eine Anlagenkarte darf fuer das Buch erst als Zielstammsatz gelten, wenn nicht nur Nummer und Beschreibung sichtbar sind. Vor Zugang und AfA muss auch klar sein, wo Business Central das AfA-Buch und die Anlagenbuchungsgruppe hernimmt. Diese beiden Felder entscheiden spaeter ueber Abschreibung und Sachkontenfindung.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 muss den Feldmapping-Schritt vor der eigentlichen Stammdatenanlage zeigen oder erklaeren. Wenn `HGB` und `MACHINES` auf der Karte nicht sichtbar erreichbar sind, braucht das Buch zuerst eine Diagnose-/Personalisieren-/Page-Inspection-Erklaerung statt eines vermeintlichen Ziel-Screenshots.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor, kein deutscher HGB-/Kontenplan-Endstand.',
    '- Keine gespeicherte Anlage `FA-CNC-01`.',
    '- Kein Kreditor `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Anlagenposten.',
    '- Page Inspection oder Personalisierung waeren Diagnosekontext, aber kein finaler Anwenderscreenshot.',
    ''
  ].join('\n');
}

test('FIXEDASSETS-020 FA-CNC-01 card more-fields mapping without save', async ({ page }) => {
  await openFixedAssets(page, true);
  const context = await assertRmDemoContext(page);
  if (!context.urlOk && !context.textOk) {
    throw new Error(`Falscher BC-Kontext: ${context.url}`);
  }

  await openFixedAssets(page, false);
  const newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('010-new-action-candidates.json'), newAttempt);
  await dismissTours(page);
  await page.waitForTimeout(1500);

  const showMoreClicks = await clickShowMoreCandidates(page);
  const cardText = await pageText(page);
  const mapping = await extractFieldMapping(page);
  await writeTextEvidence(
    fixedAssetsEvidencePath('020-card-more-fields-page-text.txt'),
    await compactPageText(page, {
      include: [
        /Fixed Asset|Fixed Assets|Anlagen|Anlage/i,
        /FA-CNC-01|CNC Maschine|HGB|MACHINES/i,
        /No\.|Description|Beschreibung|Depreciation|AfA|Book|Posting Group|Buchungsgruppe|Class|Subclass|Blocked/i
      ],
      maxLines: 160
    })
  );
  await writeJsonEvidence(fixedAssetsEvidencePath('020-card-more-fields-hints.json'), mapping);
  await screenshot(page, 'fixedassets-020-020-card-more-fields-mapping.png', {
    projectName: project.name,
    testId,
    status: mapping.targetFieldReachability?.depreciationBookFieldVisible || mapping.targetFieldReachability?.faPostingGroupFieldVisible ? 'candidate' : 'rejected',
    bookUse: 'evidence',
    purpose: 'FIXEDASSETS-020 Karten-Feldmapping nach Mehr-/Bereichsdiagnose; prueft, ob AfA-Buch und Anlagenbuchungsgruppe auf der Fixed Asset Card sichtbar erreichbar sind.',
    expectedPageText: [/Fixed Asset|Fixed Assets|Anlagen|Anlage/i],
    knownLimitations: [
      'Kein gespeicherter Anlagenstamm und kein Zielstammdatenbild.',
      'Der Screenshot ist nur Buchkandidat, wenn die konkreten Zielwerte oder Ziel-Felder sichtbar sind.',
      'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.'
    ]
  });

  await openFixedAssets(page, true);
  const targetVisibleAfterRun = /\bFA-CNC-01\b/i.test(await pageText(page));
  const decision =
    mapping.targetFieldReachability?.depreciationBookFieldVisible && mapping.targetFieldReachability?.faPostingGroupFieldVisible
      ? 'Feldpfade fuer AfA-Buch und Anlagenbuchungsgruppe wirken erreichbar. Naechster Lauf darf nur einen engen No-Save/Save-Decision-Schritt fuer FA-CNC-01 vorbereiten; Speichern weiterhin nur nach expliziter Setup-Fit-Entscheidung.'
      : 'Feldpfade fuer AfA-Buch und/oder Anlagenbuchungsgruppe sind weiterhin nicht sichtbar genug. Naechster Lauf soll Personalize/Page Inspection gezielt als Diagnose nutzen, bevor FA-CNC-01 gespeichert werden darf.';

  const result = {
    testId: 'FIXEDASSETS-020',
    status: 'done-ui-first-readiness-no-save',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-fixed-asset-card-more-fields-mapping-no-save-no-posting',
    target,
    context,
    newAttempt,
    showMoreClicks,
    mapping,
    targetVisibleAfterRun,
    decision,
    screenshot: 'fixedassets-020-020-card-more-fields-mapping.png',
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
    rawTextNotCommitted: cardText.length > 0,
    nextStep:
      mapping.targetFieldReachability?.depreciationBookFieldVisible && mapping.targetFieldReachability?.faPostingGroupFieldVisible
        ? 'FIXEDASSETS-021-FA-CNC-01-SETUP-FIT-DECISION'
        : 'FIXEDASSETS-021-FA-CNC-01-PERSONALIZE-PAGEINSPECTION-DIAGNOSIS'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-020-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-020-FA-CNC-01-CARD-MORE-FIELDS-MAPPING.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-020 Evidence-Index',
      '',
      'Status: `labor`, `ui-first`, `readiness`, `field-mapping`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-020-result.json` | JSON-Ergebnis | Kartenfeldmapping, sichtbare Feldpfade, Sicherheitsgrenzen und naechsten Schritt | keine gespeicherte Anlage und keine Buchung | labor |',
      '| `FIXEDASSETS-020-FA-CNC-01-CARD-MORE-FIELDS-MAPPING.md` | Lernzusammenfassung | warum AfA-Buch und Anlagenbuchungsgruppe vor dem Speichern geklaert werden muessen | keinen deutschen Finalnachweis | labor |',
      '| `010-new-action-candidates.json` | JSON-Auszug | kontrollierter New/Kartenkontext | keine Speichergenehmigung | compact |',
      '| `020-card-more-fields-page-text.txt` | Seitentext | kompakter Kartenkontext nach Mehr-/Bereichsdiagnose | keinen Rohdump und keine gespeicherte Karte | compact |',
      '| `020-card-more-fields-hints.json` | JSON-Auszug | sichtbare Felder, FastTabs und Zielwertsichtbarkeit | kein vollstaendiges Tabellenmodell | compact |',
      '| `fixedassets-020-020-card-more-fields-mapping.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des Bilds | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | labor/candidate/rejected |',
      '| `playwright/projects/fibu-book5/img/fixedassets-020-020-card-more-fields-mapping.png` | Screenshot | Karten-/Feldmapping-Kontext | keine gespeicherte Anlage und nur dann Buchkandidat, wenn Zielwerte/Zielfelder sichtbar sind | labor |',
      '## Kernaussage',
      '',
      decision,
      ''
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.saved).toBe(false);
  expect(result.context.urlOk || result.context.textOk).toBe(true);
});
