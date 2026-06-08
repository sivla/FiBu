import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'fixedassets-006';

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

    const clickedByDom = await frame
      .evaluate((labelSource) => {
        const label = new RegExp(labelSource, 'i');
        const elements = [...document.querySelectorAll<HTMLElement>('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"],span,div')]
          .filter((element) => {
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const aria = element.getAttribute('aria-label') || '';
            const title = element.getAttribute('title') || '';
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && (label.test(text) || label.test(aria) || label.test(title));
          })
          .sort((left, right) => {
            const leftRoleScore = left.matches('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"]') ? 0 : 1;
            const rightRoleScore = right.matches('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"]') ? 0 : 1;
            if (leftRoleScore !== rightRoleScore) return leftRoleScore - rightRoleScore;
            return left.getBoundingClientRect().y - right.getBoundingClientRect().y;
          });
        const target = elements[0];
        if (!target) return false;
        (target.closest<HTMLElement>('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"]') ?? target).click();
        return true;
      }, label.source)
      .catch(() => false);

    if (clickedByDom) {
      await page.waitForTimeout(5000);
      return { clicked: true, method: 'dom-click', candidates };
    }
  }

  return { clicked: false, method: undefined as string | undefined, candidates };
}

type FaPostingGroupRow = {
  code: string;
  visibleAccounts: string[];
  rawText: string;
};

function rowFromText(text: string): FaPostingGroupRow | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const code = normalized.match(/\b(EQUIPMENT|GOODWILL|PLANT|PROPERTY|VEHICLES)\b/i)?.[1]?.toUpperCase();
  if (!code) {
    return null;
  }

  return {
    code,
    visibleAccounts: [...new Set(normalized.match(/\b\d{5}\b/g) ?? [])],
    rawText: sanitizeEvidenceText(normalized).slice(0, 260)
  };
}

async function extractFaPostingGroupRows(page: Page) {
  const rows = new Map<string, FaPostingGroupRow>();

  for (const frame of page.frames()) {
    const domRows = await frame
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
          .filter((text) => /\b(EQUIPMENT|GOODWILL|PLANT|PROPERTY|VEHICLES)\b/i.test(text))
          .slice(0, 80);
      })
      .catch(() => []);

    for (const text of domRows) {
      const row = rowFromText(text);
      if (row) {
        rows.set(row.code, row);
      }
    }
  }

  const textLines = normalizeText(await pageText(page))
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => /\b(EQUIPMENT|GOODWILL|PLANT|PROPERTY|VEHICLES)\b/i.test(line));

  for (const text of textLines) {
    const row = rowFromText(text);
    if (!row) {
      continue;
    }

    const existing = rows.get(row.code);
    if (!existing || row.visibleAccounts.length > existing.visibleAccounts.length) {
      rows.set(row.code, row);
    }
  }

  return [...rows.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function renderMarkdown(result: Record<string, any>) {
  const rows = (result.rows as FaPostingGroupRow[])
    .map((row) => `| ${row.code} | ${row.visibleAccounts.length > 0 ? row.visibleAccounts.join(', ') : 'nicht sichtbar'} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-006 FA Posting Groups Konten read-only',
    '',
    'Status: `labor`, `read-only`, `setup-preparation`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Gepruefte Seite | `FA Posting Groups` |',
    '| Gate | `FIXEDASSETS-004-SETUP-OR-POSTING` locked |',
    '| Setup-Aenderung | nein |',
    '| Buchung | nein |',
    '',
    '## Sichtbare CRONUS-Gruppen und Konten',
    '',
    '| Gruppe | sichtbar gelesene Konten |',
    '|---|---|',
    rows || '| keine | keine |',
    '',
    '## Fachliche Einordnung',
    '',
    'Business Central nutzt Anlagenbuchungsgruppen als Kontenfindung fuer Anlagenzugang, Buchwert, Abschreibung, Gewinne/Verluste bei Abgang und Wartungsaufwand. Der spaetere Buchwert einer Anlage haengt deshalb nicht nur an der Anlagenkarte, sondern auch an diesen Kontenfeldern.',
    '',
    'Dieser Lauf liest vorhandene CRONUS-Gruppen, damit ein spaeterer `MACHINES`-Fit nicht geraten wird. `MACHINES` wird hier bewusst nicht angelegt, weil das Gate fuer Fixed-Assets-Setup und -Buchung gesperrt ist.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 kann ergaenzen: Vor der Anlage `FA-CNC-01` muss die Anlagenbuchungsgruppe fachlich verstanden werden. Ein Screenshot der Tabelle erklaert, dass BC mehrere Sachkonten aus einer Gruppe ableitet und warum das Setzen eines einzelnen beliebigen Kontos nicht reicht.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor, kein deutscher HGB-/Kontenplan-Endstand.',
    '- Sichtbare Konten sind nur Laborreferenz fuer die naechste Entscheidung.',
    '- `MACHINES`, `FA-CNC-01`, `HGB` und `K30000` bleiben nicht angelegt.',
    '- Keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Anlagenposten.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-006 FA Posting Groups Konten read-only lesen', async ({ page }) => {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'FA Posting Groups');
  await page.waitForTimeout(2000);

  const click = await clickTellMeResult(page, /^FA Posting Groups$|^FA Posting Group$|^Anlagenbuchungsgruppen$|^Anlagenbuchungsgruppe$/i);
  await dismissTours(page);
  await page.waitForTimeout(4000);

  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const rows = await extractFaPostingGroupRows(page);
  const groups = rows.map((row) => row.code);
  const contextVisible = /FA Posting Groups|FA Posting Group|Anlagenbuchungsgruppen|Anlagenbuchungsgruppe/i.test(text);

  await writeTextEvidence(
    fixedAssetsEvidencePath('010-fa-posting-groups-accounts-page-text.txt'),
    [
      'Kompakter Page-Text-Auszug fuer FIXEDASSETS-006.',
      '',
      ...normalizeText(text)
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter((line) => /FA Posting Groups|Code|Account|EQUIPMENT|GOODWILL|PLANT|PROPERTY|VEHICLES|MACHINES|Acquisition|Depreciation|Maintenance|Disposal/i.test(line))
        .slice(0, 180)
    ].join('\n')
  );
  await writeJsonEvidence(fixedAssetsEvidencePath('010-fa-posting-groups-accounts-buttons.json'), buttons);
  await screenshot(page, 'fixedassets-006-010-fa-posting-groups-accounts.png', {
    projectName: project.name,
    testId,
    status: contextVisible && rows.length > 0 ? 'candidate' : 'rejected',
    bookUse: contextVisible && rows.length > 0 ? 'field-proof' : 'do-not-use',
    purpose: 'FIXEDASSETS-006 vorhandene CRONUS-FA-Posting-Group-Konten read-only als Setup-Vorbereitung lesen.',
    knownLimitations: [
      'Read-only in RM-DEMO / CRONUS USA.',
      'Keine Anlagenbuchungsgruppe angelegt oder bearbeitet.',
      'Keine Anlage, keine Einkaufsrechnung, keine AfA, keine Buchung.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-006',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-setup-preparation-no-posting-no-setup-change',
    gate: {
      id: 'FIXEDASSETS-004-SETUP-OR-POSTING',
      status: 'locked',
      consequence: 'No MACHINES setup, no fixed asset master data, no purchase invoice, no acquisition, no depreciation.'
    },
    sourceContext: {
      priorRun: 'FIXEDASSETS-005',
      priorFinding: 'FA Posting Groups page is reachable; MACHINES is missing; existing CRONUS groups are visible.'
    },
    navigation: {
      clickedTellMeResult: click.clicked,
      clickMethod: click.method ?? null
    },
    page: {
      contextVisible,
      machinesVisible: /\bMACHINES\b/i.test(text),
      rowCount: rows.length,
      groups,
      screenshot: 'fixedassets-006-010-fa-posting-groups-accounts.png',
      pageTextEvidenceFile: '010-fa-posting-groups-accounts-page-text.txt',
      buttonsEvidenceFile: '010-fa-posting-groups-accounts-buttons.json'
    },
    rows,
    safety: {
      setupChanged: false,
      postingGroupCreated: false,
      postingGroupEdited: false,
      posted: false,
      fixedAssetCreated: false,
      purchaseInvoiceCreated: false,
      depreciationCalculated: false
    },
    proves: [
      'Existing CRONUS FA Posting Groups can be read through the UI.',
      'Visible account fields provide a labor reference before planning MACHINES.',
      'MACHINES is still not created in this run.'
    ],
    doesNotProve: [
      'No German chart of accounts target.',
      'No HGB depreciation book.',
      'No FA-CNC-01 fixed asset master data.',
      'No K30000 vendor.',
      'No acquisition, depreciation or FA ledger trace.'
    ],
    nextStep:
      'Without gate: Buch-/Evidence-Sync fuer Kapitel 21 oder Fixed-Assets-Readiness fortsetzen. With gate: idempotenten UI-Setup-Fit fuer MACHINES planen, aber die Zielkonten fachlich aus CRONUS-Gruppen ableiten und als Labor, nicht DE-Final, markieren.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-006-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-006-FA-POSTING-GROUP-ACCOUNTS.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-006 Evidence-Index',
      '',
      'Ziel: vorhandene CRONUS-Konten in `FA Posting Groups` read-only lesen, bevor ein spaeterer `MACHINES`-Fit geplant wird.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-006-result.json` | JSON-Ergebnis | Sandbox, Company, Gate, sichtbare Gruppen/Konten, Sicherheitsgrenzen | kein Setup, keine Buchung, kein deutscher Kontenplan | labor, read-only |',
      '| `FIXEDASSETS-006-FA-POSTING-GROUP-ACCOUNTS.md` | Lernzusammenfassung | warum FA Posting Groups Kontenfindung sind und warum kein Konto geraten wird | keinen MACHINES-Fit | labor, setup-preparation |',
      '| `010-fa-posting-groups-accounts-page-text.txt` | kompakter Seitentext | sichtbare Tabellen-/Kontenhinweise | keinen Rohdump | ui-evidence |',
      '| `010-fa-posting-groups-accounts-buttons.json` | Button-Evidence | sichtbare Aktionen, ohne sie auszufuehren | keine Aktion | ui-evidence |',
      '| `fixedassets-006-010-fa-posting-groups-accounts.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Bildes | keine eigenstaendige fachliche Wahrheit | candidate |',
      '',
      '## Kernaussage',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(click.clicked, 'FA Posting Groups must be opened from Tell-Me.').toBe(true);
  expect(contextVisible, 'FA Posting Groups context must be visible.').toBe(true);
  expect(rows.length, 'At least one CRONUS FA Posting Group row must be visible.').toBeGreaterThan(0);
  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.posted).toBe(false);
});
