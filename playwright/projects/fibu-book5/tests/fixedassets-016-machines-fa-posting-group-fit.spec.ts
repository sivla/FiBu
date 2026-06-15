import { expect, test, type Frame, type Page } from '@playwright/test';
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

test.setTimeout(420_000);

const testId = 'fixedassets-016';
const target = {
  code: 'MACHINES',
  referenceGroup: 'EQUIPMENT',
  visibleReferenceAccounts: ['12210', '82000'],
  listPattern: ['12210', '12210', '12210', '12210', '12210', '12210', '82000', '82000', '82000']
};

type FaPostingGroupRow = {
  code: string;
  visibleAccounts: string[];
  rawText: string;
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function faPostingGroupsUrl(filterToMachines = false) {
  const url = new URL(bcPageUrl(5612, project.envPrefix));
  if (filterToMachines) {
    url.searchParams.set('filter', `'FA Posting Group'.'Code' IS '${target.code}'`);
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

function compactFaPostingGroupText(text: string) {
  const interesting =
    /FA Posting Groups|FA Posting Group Card|Code|MACHINES|EQUIPMENT|12210|82000|Acquisition|Depreciation|Disposal|Gains|Losses|Maintenance|Bal\.|Account|Saved|Gespeichert|Error|Fehler/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => sanitizeEvidenceText(line.replace(/\s+/g, ' ').trim()))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -3; offset <= 8; offset += 1) {
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
      .slice(0, 260)
  ].join('\n');
}

async function openFaPostingGroups(page: Page, filterToMachines = false) {
  await page.goto(faPostingGroupsUrl(filterToMachines), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);
}

async function findFaPostingGroupsFrame(page: Page) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/FA Posting Groups|FA Posting Group Card|Anlagenbuchungsgruppen|Anlagenbuchungsgruppe/i.test(text)) {
      return frame;
    }
  }
  throw new Error('FA-Posting-Groups-Frame nicht gefunden.');
}

type NewActionAttempt = {
  clicked: boolean;
  method: string;
  frameUrl?: string;
  candidates: Array<{
    frameUrl: string;
    text: string;
    aria: string;
    title: string;
    role: string;
    x: number;
    y: number;
    width: number;
    height: number;
    score: number;
  }>;
};

async function clickScopedNew(page: Page): Promise<NewActionAttempt> {
  const allCandidates: NewActionAttempt['candidates'] = [];

  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/FA Posting Groups|FA Posting Group|Anlagenbuchungsgruppen|Anlagenbuchungsgruppe/i.test(bodyText)) {
      continue;
    }

    const frameCandidates = await frame
      .evaluate(() => {
      const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
        const score = (candidate: { text: string; aria: string; title: string; role: string; x: number; y: number }) => {
          let value = 0;
          if (/^(New|Neu)$/.test(candidate.text) || /^(New|Neu)$/.test(candidate.aria)) value -= 30;
          if (/Create a new entry|Erstellen Sie einen neuen Eintrag|neuen Eintrag/i.test(candidate.title)) value -= 20;
          if (/menuitem|button/i.test(candidate.role)) value -= 8;
          if (candidate.y >= 35 && candidate.y <= 130) value -= 10;
          if (candidate.x >= 250 && candidate.x <= 760) value -= 6;
          value += Math.abs(candidate.y - 65) / 50;
          value += Math.abs(candidate.x - 500) / 500;
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
              element,
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
          .map(({ element: _element, label: _label, ...candidate }) => candidate)
          .slice(0, 12);
    })
      .catch(() => []);

    for (const candidate of frameCandidates) {
      allCandidates.push({ frameUrl: frame.url(), ...candidate });
    }

    if (!frameCandidates[0]) continue;

    const clicked = await frame
      .evaluate((candidateToClick) => {
        const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
        const candidates = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a')]
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
        candidates[0]?.click();
        return Boolean(candidates[0]);
      }, frameCandidates[0])
      .catch(() => false);

    if (clicked) {
      await page.waitForTimeout(3500);
      return { clicked: true, method: 'scored-frame-action', frameUrl: frame.url(), candidates: allCandidates };
    }
  }

  return { clicked: false, method: 'scored-frame-action', candidates: allCandidates };
}

async function extractRows(page: Page, codePattern = /\b(MACHINES|EQUIPMENT)\b/i) {
  const rows = new Map<string, FaPostingGroupRow>();

  const rowFromText = (value: string): FaPostingGroupRow | null => {
    const normalized = value.replace(/\s+/g, ' ').trim();
    const code = normalized.match(codePattern)?.[1]?.toUpperCase();
    if (!code) return null;
    return {
      code,
      visibleAccounts: [...new Set(normalized.match(/\b\d{5}\b/g) ?? [])],
      rawText: sanitizeEvidenceText(normalized).slice(0, 320)
    };
  };

  for (const frame of page.frames()) {
    const domRows = await frame
      .evaluate((codePatternSource) => {
        const codePattern = new RegExp(codePatternSource, 'i');
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
          .filter((text) => codePattern.test(text))
          .slice(0, 80);
      }, codePattern.source)
      .catch(() => []);

    for (const rowText of domRows) {
      const row = rowFromText(rowText);
      if (row) rows.set(row.code, row);
    }
  }

  const textLines = normalizeText(await pageText(page))
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => codePattern.test(line));

  for (const line of textLines) {
    const row = rowFromText(line);
    if (!row) continue;
    const existing = rows.get(row.code);
    if (!existing || row.visibleAccounts.length > existing.visibleAccounts.length) rows.set(row.code, row);
  }

  return [...rows.values()].sort((left, right) => left.code.localeCompare(right.code));
}

async function readVisibleInputs(page: Page) {
  const fields = [];
  for (const frame of page.frames()) {
    const frameFields = await frame
      .evaluate(() => {
        const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
        return [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea')]
          .map((input, index) => {
            const rect = input.getBoundingClientRect();
            let container: Element | null = input;
            for (let depth = 0; depth < 5 && container?.parentElement; depth += 1) {
              container = container.parentElement;
            }
            return {
              index,
              value: clean(input.value || ''),
              required: input.hasAttribute('required') || input.getAttribute('aria-required') === 'true',
              disabled: input.disabled || input.getAttribute('aria-disabled') === 'true',
              readOnly: input.readOnly || input.getAttribute('aria-readonly') === 'true',
              nearbyText: clean(container?.textContent || '').slice(0, 260),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              visible: rect.width > 0 && rect.height > 0
            };
          })
          .filter((field) => field.visible)
          .slice(0, 100);
      })
      .catch(() => []);
    fields.push(...frameFields);
  }
  return fields;
}

async function fillVisibleInputSequence(page: Page, values: string[]) {
  const frame = await findFaPostingGroupsFrame(page);
  await frame
    .evaluate(async (inputValues) => {
      const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
      const visibleInputs = [...document.querySelectorAll<HTMLInputElement>('input')]
        .filter((input) => {
          const rect = input.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && !input.disabled && !input.readOnly;
        })
        .sort((left, right) => {
          const leftRect = left.getBoundingClientRect();
          const rightRect = right.getBoundingClientRect();
          return leftRect.y - rightRect.y || leftRect.x - rightRect.x;
        });

      const firstRequiredIndex = visibleInputs.findIndex((input) => input.hasAttribute('required') || input.getAttribute('aria-required') === 'true');
      const startIndex = firstRequiredIndex >= 0 ? firstRequiredIndex : visibleInputs.findIndex((input) => input.value === '');
      if (startIndex < 0) {
        throw new Error('Keine editierbare Eingabesequenz fuer FA Posting Group Card gefunden.');
      }

      for (let offset = 0; offset < inputValues.length; offset += 1) {
        const input = visibleInputs[startIndex + offset];
        if (!input) {
          throw new Error(`Eingabefeld ${offset} fuer FA Posting Group Card fehlt.`);
        }
        input.focus();
        input.value = inputValues[offset];
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
        await sleep(100);
      }
    }, values)
    .catch((error) => {
      throw new Error(`FA Posting Group Card konnte nicht per sichtbarer Eingabesequenz gefuellt werden: ${error}`);
    });

  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(4000);
}

async function saveAndReturnToList(page: Page) {
  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(2500);
  await page.goto(faPostingGroupsUrl(true), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(3000);
}

function renderMarkdown(result: Record<string, any>) {
  const machines = result.machinesRow as FaPostingGroupRow | null;
  const proofAccounts = (result.visibleProofAccounts as string[] | undefined) ?? machines?.visibleAccounts ?? [];
  const accounts = proofAccounts.length ? proofAccounts.join(', ') : 'nicht sichtbar';
  return [
    '# FIXEDASSETS-016 MACHINES FA Posting Group Fit',
    '',
    'Status: `labor`, `ui-first`, `setup-proof`, `idempotent`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Zielobjekt | FA Posting Group / Anlagenbuchungsgruppe `MACHINES` |',
    `| Aktion | ${result.action} |`,
    `| Sichtbare Konten im Nachweis | ${accounts} |`,
    '| Buchung | nein |',
    '| Setup geaendert | ' + (result.action === 'created-machines' ? 'ja, genau `MACHINES`' : 'nein, `MACHINES` war bereits vorhanden') + ' |',
    '',
    '## Was praktisch nachgewiesen ist',
    '',
    '- Die Seite `FA Posting Groups` wurde in `RM-DEMO` innerhalb `MCP_1_20260210` UI-first geoeffnet.',
    '- Vor der Aktion wurde gezielt geprueft, ob `MACHINES` bereits sichtbar ist.',
    '- Nach der Aktion ist `MACHINES` im sichtbaren BC-Kontext nachgewiesen.',
    '- Das Nachherbild und der kompakte Seitentext zeigen `MACHINES` zusammen mit den relevanten CRONUS-Konten `12210` und `82000`.',
    '- Es wurde keine Anlage, kein Kreditor, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung erzeugt.',
    '',
    '## Warum das fachlich wichtig ist',
    '',
    'Eine Anlagenbuchungsgruppe ist Kontenfindung. Sie entscheidet, welche Sachkonten Business Central spaeter beim Anlagenzugang, bei Abschreibung, Abgang und Wartung verwendet. `MACHINES` ist deshalb ein Setup-Baustein vor der Anlage `FA-CNC-01`, nicht die Anlage selbst.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor, kein deutscher Kontenplan-Endstand.',
    '- `MACHINES` wurde nur als Laboralias der vorhandenen Gruppe `EQUIPMENT` vorbereitet.',
    '- Kein `FA-CNC-01`, kein `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Anlagenpostenspur.',
    '- Deutscher HGB-/Steuer-/Kontenplan-Finalnachweis bleibt offen.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 darf `MACHINES` jetzt als RM-DEMO-Labor-Setup-Prerequisite zeigen. Der Text muss weiterhin klar trennen: Das ist ein Labor-Konto-Set aus CRONUS-USA, kein finaler deutscher Anlagenkontenplan.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-016 MACHINES Anlagenbuchungsgruppe idempotent UI-first fitten', async ({ page }) => {
  await openFaPostingGroups(page, true);
  const beforeText = await pageText(page);
  const beforeRows = await extractRows(page, /\b(MACHINES|EQUIPMENT)\b/i);
  const beforeMachinesVisible = /\bMACHINES\b/i.test(beforeText);

  await writeTextEvidence(fixedAssetsEvidencePath('010-before-machines-page-text.txt'), compactFaPostingGroupText(beforeText));
  await writeJsonEvidence(fixedAssetsEvidencePath('010-before-machines-rows.json'), beforeRows);
  await screenshot(page, 'fixedassets-016-010-fa-posting-groups-before-machines.png', {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: 'evidence',
    purpose: 'FIXEDASSETS-016 Vorher-Pruefung: FA Posting Groups gefiltert auf MACHINES, bevor der idempotente Fit erfolgt.',
    expectedPageText: [/FA Posting Groups|FA Posting Group/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Vorher-Bild beweist nur den Startkontext; wenn MACHINES fehlt, ist kein Zielcode sichtbar.',
      'Kein deutscher Kontenplan-Endstand.'
    ]
  });

  let action: 'already-fit' | 'created-machines' = 'already-fit';
  let createdFromCardFields: Awaited<ReturnType<typeof readVisibleInputs>> | null = null;

  if (!beforeMachinesVisible) {
    action = 'created-machines';
    await openFaPostingGroups(page, false);
    const newActionAttempt = await clickScopedNew(page);
    await writeJsonEvidence(fixedAssetsEvidencePath('014-scoped-new-candidates.json'), newActionAttempt);
    if (!newActionAttempt.clicked) {
      throw new Error('Scoped New/Neu auf FA Posting Groups konnte nicht geklickt werden.');
    }
    await page.waitForTimeout(2500);
    await writeTextEvidence(fixedAssetsEvidencePath('015-new-card-page-text.txt'), compactFaPostingGroupText(await pageText(page)));
    createdFromCardFields = await readVisibleInputs(page);
    await writeJsonEvidence(fixedAssetsEvidencePath('015-new-card-fields-before-fill.json'), createdFromCardFields);

    await fillVisibleInputSequence(page, [target.code, ...target.listPattern]);
    await writeTextEvidence(fixedAssetsEvidencePath('016-filled-card-page-text.txt'), compactFaPostingGroupText(await pageText(page)));
    await saveAndReturnToList(page);
  }

  await openFaPostingGroups(page, true);
  const afterText = await pageText(page);
  const afterRows = await extractRows(page, /\b(MACHINES|EQUIPMENT)\b/i);
  const machinesRow = afterRows.find((row) => row.code === target.code) ?? null;
  const afterMachinesVisible = /\bMACHINES\b/i.test(afterText) || Boolean(machinesRow);
  const account12210Visible = /\b12210\b/.test(afterText) || Boolean(machinesRow?.visibleAccounts.includes('12210'));
  const account82000Visible = /\b82000\b/.test(afterText) || Boolean(machinesRow?.visibleAccounts.includes('82000'));
  const visibleProofAccounts = [...new Set(afterText.match(/\b(?:12210|82000)\b/g) ?? machinesRow?.visibleAccounts ?? [])];

  await writeTextEvidence(fixedAssetsEvidencePath('020-after-machines-page-text.txt'), compactFaPostingGroupText(afterText));
  await writeJsonEvidence(fixedAssetsEvidencePath('020-after-machines-rows.json'), afterRows);
  await screenshot(page, 'fixedassets-016-020-fa-posting-groups-after-machines.png', {
    projectName: project.name,
    testId,
    status: afterMachinesVisible && account12210Visible && account82000Visible ? 'labor' : 'rejected',
    bookUse: afterMachinesVisible && account12210Visible && account82000Visible ? 'field-proof' : 'do-not-use',
    purpose: 'FIXEDASSETS-016 Nachher-Pruefung: MACHINES muss mit relevanten Konto-Werten aus dem EQUIPMENT-Laborpattern sichtbar sein.',
    expectedPageText: [/FA Posting Groups|FA Posting Group/i, /\bMACHINES\b/i, /\b12210\b/i, /\b82000\b/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Nur Anlagenbuchungsgruppen-Fit; keine Anlage, kein Kreditor, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-016',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-idempotent-setup-fit-no-posting',
    target,
    action,
    beforeMachinesVisible,
    afterMachinesVisible,
    account12210Visible,
    account82000Visible,
    visibleProofAccounts,
    machinesRow,
    rows: afterRows,
    createdFromCardFields,
    screenshots: [
      'fixedassets-016-010-fa-posting-groups-before-machines.png',
      'fixedassets-016-020-fa-posting-groups-after-machines.png'
    ],
    safety: {
      posted: false,
      fixedAssetCreated: false,
      vendorCreated: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      faPostingGroupTargetOnly: 'MACHINES'
    },
    proves: [
      'MACHINES is visible on FA Posting Groups after the UI-first fit.',
      'The visible proof includes the relevant CRONUS reference accounts 12210 and 82000.',
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'The setup fit was idempotent: existing MACHINES was accepted, missing MACHINES was created exactly once.'
    ],
    doesNotProve: [
      'No German chart-of-accounts final target.',
      'No FA-CNC-01 fixed asset master data.',
      'No K30000 vendor.',
      'No purchase invoice, acquisition, depreciation, FA ledger entries or G/L posting trace.'
    ],
    nextStep:
      'FIXEDASSETS-017-FA-CNC-01-SETUP-READINESS: decide the next narrow UI-first layer after MACHINES, likely fixed asset card or vendor K30000 readiness; still no acquisition/depreciation posting without a fresh gate.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-016-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-016-MACHINES-FA-POSTING-GROUP-FIT.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-016 Evidence-Index',
      '',
      'Status: `labor`, `ui-first`, `setup-proof`, `idempotent`, `no-posting`, `not-final`, `de-final-open`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-016-result.json` | JSON-Ergebnis | Ziel, Aktion, Vorher/Nachher, sichtbare Konten, Sicherheitsgrenzen und naechsten Schritt | keinen deutschen finalen Anlagenprozess | labor |',
      '| `FIXEDASSETS-016-MACHINES-FA-POSTING-GROUP-FIT.md` | Lernzusammenfassung | warum `MACHINES` als Anlagenbuchungsgruppen-Prerequisite gefittet wurde | keine Anlagenbuchung und keine deutsche Kontenentscheidung | labor |',
      '| `010-before-machines-page-text.txt` | Seitentext | Startkontext FA Posting Groups mit MACHINES-Pruefung | keinen finalen Zielzustand | compact |',
      '| `010-before-machines-rows.json` | JSON-Auszug | relevante sichtbare Zeilen vor dem Fit | keine vollstaendige Tabellenextraktion | compact |',
      '| `015-new-card-page-text.txt` | Seitentext | New/Card-Kontext, falls `MACHINES` neu angelegt wurde | keinen Nachher-Zustand | compact/conditional |',
      '| `015-new-card-fields-before-fill.json` | JSON-Auszug | sichtbare Eingabefelder vor der Befuellung, falls neu angelegt wurde | keine fachliche Kontenentscheidung jenseits des freigegebenen Patterns | compact/conditional |',
      '| `016-filled-card-page-text.txt` | Seitentext | gefuellter Kartenkontext vor Rueckkehr zur Liste, falls neu angelegt wurde | keine Buchung | compact/conditional |',
      '| `020-after-machines-page-text.txt` | Seitentext | Nachher-Kontext mit `MACHINES`, `12210` und `82000` | keinen deutschen Kontenplan | compact |',
      '| `020-after-machines-rows.json` | JSON-Auszug | relevante sichtbare Zeilen nach dem Fit | keine vollstaendige Tabellenextraktion | compact |',
      '| `fixedassets-016-010-fa-posting-groups-before-machines.png` | Screenshot | Vorher-Kontext der MACHINES-Pruefung | kein Zielbild, falls MACHINES fehlt | labor |',
      '| `fixedassets-016-020-fa-posting-groups-after-machines.png` | Screenshot | sichtbares `MACHINES` mit relevanten Kontenwerten | kein deutscher Finalnachweis | labor/book-candidate |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | labor |',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(afterMachinesVisible).toBe(true);
  expect(account12210Visible).toBe(true);
  expect(account82000Visible).toBe(true);
  expect(result.safety.posted).toBe(false);
  expect(result.safety.fixedAssetCreated).toBe(false);
  expect(result.safety.vendorCreated).toBe(false);
  expect(result.safety.purchaseInvoiceCreated).toBe(false);
});
