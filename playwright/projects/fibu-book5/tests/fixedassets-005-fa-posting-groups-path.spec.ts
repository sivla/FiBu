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

const testId = 'fixedassets-005';

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
    /FA Posting Groups|FA Posting Group|Fixed Asset|Fixed Assets|Depreciation|Acquisition|Book Value|MACHINES|TANGIBLE|INTANGIBLE|Anlagenbuchungsgruppen|Anlagenbuchungsgruppe|Anlagen|AfA|Abschreibung|Buchungsgruppe|Sachkonto|Konto|Code|Description|Beschreibung|New|Neu|Edit|Bearbeiten|Delete|Loeschen|Pages and Tasks|Seiten und Aufgaben/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -3; offset <= 7; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) {
        selected.add(selectedIndex);
      }
    }
  }

  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 220)
  ].join('\n'));
}

async function captureState(page: Page, fileStem: string, screenshotFile: string, purpose: string) {
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(fixedAssetsEvidencePath(`${fileStem}-page-text.txt`), compactPageText(text));
  await writeJsonEvidence(fixedAssetsEvidencePath(`${fileStem}-buttons.json`), buttons);

  const contextVisible = /FA Posting Groups|FA Posting Group|Anlagenbuchungsgruppen|Anlagenbuchungsgruppe/i.test(text);
  await screenshot(page, screenshotFile, {
    projectName: project.name,
    testId,
    status: contextVisible ? 'candidate' : 'rejected',
    bookUse: contextVisible ? 'evidence' : 'do-not-use',
    purpose,
    knownLimitations: [
      'Read-only UI-Pfadklaerung in RM-DEMO / CRONUS USA.',
      'Keine Anlagenbuchungsgruppe angelegt, geaendert oder geloescht.',
      'Kein Anlagenzugang, keine AfA, keine Buchung.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ]
  });

  return {
    text,
    buttons,
    contextVisible,
    machinesVisible: /(^|\s)MACHINES(\s|$)/i.test(text),
    existingCronusGroups: [...new Set((text.match(/\b(EQUIPMENT|GOODWILL|PLANT|PROPERTY|VEHICLES)\b/gi) ?? []).map((entry) => entry.toUpperCase()))],
    newVisible: /^Neu$|^New$|[\n ]Neu[\n ]|[\n ]New[\n ]/i.test(text) || buttons.some((button) => /^New$|^Neu$/i.test(button)),
    editVisible:
      /Liste bearbeiten|Bearbeiten|Edit List|Edit/i.test(text) || buttons.some((button) => /^Edit$|^Bearbeiten$|^Liste bearbeiten$|^Edit List$/i.test(button)),
    relevantButtons: buttons
      .filter((button) => /New|Neu|Edit|Bearbeiten|Delete|Loeschen|Posting|Buchung|Account|Konto/i.test(button))
      .slice(0, 60),
    textEvidenceFile: `${fileStem}-page-text.txt`,
    buttonEvidenceFile: `${fileStem}-buttons.json`,
    screenshot: screenshotFile
  };
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

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-005 FA Posting Groups UI-Pfad',
    '',
    'Status: `labor`, `read-only`, `ui-path`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Zielseite | `FA Posting Groups` / Anlagenbuchungsgruppen |',
    '| Zielwert | `MACHINES` |',
    '| Setup-Aenderung | nein |',
    '| Buchung | nein |',
    '',
    '## Ergebnis',
    '',
    '| Frage | Befund |',
    '|---|---|',
    `| Tell-Me zeigt FA Posting Groups | ${result.tellMe.candidateVisible ? 'ja' : 'nein'} |`,
    `| Treffer wurde per UI geklickt | ${result.click.clicked ? 'ja' : 'nein'} |`,
    `| Klickmethode | ${result.click.method ?? 'keine'} |`,
    `| Anlagenbuchungsgruppen-Kontext sichtbar | ${result.result.contextVisible ? 'ja' : 'nein'} |`,
    `| MACHINES sichtbar | ${result.result.machinesVisible ? 'ja' : 'nein'} |`,
    `| Vorhandene CRONUS-Gruppen sichtbar | ${result.result.existingCronusGroups.length > 0 ? result.result.existingCronusGroups.join(', ') : 'nein'} |`,
    `| Neu-Aktion sichtbar | ${result.result.newVisible ? 'ja' : 'nein'} |`,
    `| Bearbeiten-Aktion sichtbar | ${result.result.editVisible ? 'ja' : 'nein'} |`,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Anlagenbuchungsgruppen sind die Kontenfindungsschicht der Anlagenbuchhaltung. Eine Anlage kann zwar als Stammdatensatz existieren, aber ohne passende Anlagenbuchungsgruppe weiss Business Central nicht sicher, welche Sachkonten fuer Zugang, Buchwert, Gewinn/Verlust oder Abschreibung genutzt werden sollen.',
    '',
    'Dieser Lauf ist deshalb absichtlich nur ein Pfadnachweis. Er klaert, ob der Leser und der Playwright-Agent die richtige Einrichtungsseite ueber die Oberflaeche erreichen koennen, bevor `MACHINES` eingerichtet oder eine Anlage gekauft wird.',
    '',
    '## Buchwirkung',
    '',
    result.result.contextVisible
      ? 'Kapitel 21 kann den UI-Pfad zu `FA Posting Groups` als Labor-Kandidat aufnehmen. `MACHINES` bleibt aber offen, solange die Gruppe nicht angelegt und ihre Konten nicht fachlich geprueft sind.'
      : 'Kapitel 21 darf den bisherigen Tell-Me-Klick noch nicht als belastbaren Anlagenbuchungsgruppen-Pfad zeigen. Der Einrichtungsblock bleibt vor Setup und Buchung gesperrt.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor, gemischte UI, kein deutscher HGB-/Kontenplan-Endstand.',
    '- Keine Anlagenbuchungsgruppe wurde angelegt oder bearbeitet.',
    '- Keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Anlagenposten.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-005 FA Posting Groups UI-Pfad read-only klaeren', async ({ page }) => {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'FA Posting Groups');
  await page.waitForTimeout(2000);

  const tellMe = await captureState(
    page,
    '010-fa-posting-groups-tell-me',
    'fixedassets-005-010-fa-posting-groups-tell-me.png',
    'FIXEDASSETS-005 Tell-Me-Suche nach FA Posting Groups als UI-Pfadklaerung.'
  );
  const click = await clickTellMeResult(page, /^FA Posting Groups$|^FA Posting Group$|^Anlagenbuchungsgruppen$|^Anlagenbuchungsgruppe$/i);
  await writeJsonEvidence(fixedAssetsEvidencePath('010-fa-posting-groups-tell-me-candidates.json'), {
    candidateVisible: /FA Posting Groups|FA Posting Group|Anlagenbuchungsgruppen|Anlagenbuchungsgruppe/i.test(tellMe.text),
    click
  });

  await dismissTours(page);
  await page.waitForTimeout(5000);
  const resultState = await captureState(
    page,
    '020-fa-posting-groups-result',
    'fixedassets-005-020-fa-posting-groups-result.png',
    'FIXEDASSETS-005 Ergebnis nach UI-Klick auf FA Posting Groups pruefen.'
  );

  const result = {
    testId: 'FIXEDASSETS-005',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-ui-path-no-posting-no-setup-change',
    sourceContext: {
      priorRun: 'FIXEDASSETS-004',
      priorFinding:
        'FA-CNC-01, HGB, MACHINES und K30000 fehlen; Purchase Invoices ist erreichbar; FA Posting Groups blieb Klickpfadproblem.'
    },
    tellMe: {
      candidateVisible: /FA Posting Groups|FA Posting Group|Anlagenbuchungsgruppen|Anlagenbuchungsgruppe/i.test(tellMe.text),
      relevantButtons: tellMe.relevantButtons,
      textEvidenceFile: tellMe.textEvidenceFile,
      buttonEvidenceFile: tellMe.buttonEvidenceFile,
      screenshot: tellMe.screenshot
    },
    click: {
      clicked: click.clicked,
      method: click.method,
      candidateCount: click.candidates.reduce((sum, frameCandidates) => sum + frameCandidates.candidates.length, 0),
      candidatesEvidenceFile: '010-fa-posting-groups-tell-me-candidates.json'
    },
    result: {
      contextVisible: resultState.contextVisible,
      machinesVisible: resultState.machinesVisible,
      existingCronusGroups: resultState.existingCronusGroups,
      newVisible: resultState.newVisible,
      editVisible: resultState.editVisible,
      relevantButtons: resultState.relevantButtons,
      textEvidenceFile: resultState.textEvidenceFile,
      buttonEvidenceFile: resultState.buttonEvidenceFile,
      screenshot: resultState.screenshot
    },
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
      'Ob der UI-/Tell-Me-Pfad zu FA Posting Groups in RM-DEMO belastbar erreicht wird.',
      'Ob die Zielgruppe MACHINES bereits sichtbar ist.',
      'Ob der naechste Anlagen-Setup-Fit eine sichere UI-Ausgangsseite hat.'
    ],
    doesNotProve: [
      'Keine Anlagenbuchungsgruppe MACHINES wurde eingerichtet.',
      'Keine Konten der Anlagenbuchungsgruppe wurden fachlich validiert.',
      'Keine Anlage FA-CNC-01, kein HGB-AfA-Buch und kein Kreditor K30000 wurden angelegt.',
      'Keine Einkaufsrechnung, keine Aktivierung, keine AfA und kein deutscher Finalnachweis.'
    ],
    nextStep: resultState.contextVisible
      ? resultState.machinesVisible
        ? 'FIXEDASSETS-006: vorhandene MACHINES-Konten read-only pruefen und danach erst entscheiden, ob FA-CNC-01/HGB/K30000 per UI angelegt werden.'
        : 'FIXEDASSETS-006: idempotenten UI-Setup-Fit fuer MACHINES vorbereiten; vorher CRONUS-Konten aus vorhandenen Gruppen lesen, kein Konto raten.'
      : 'FIXEDASSETS-006: alternativen offiziellen UI-Pfad zu Anlagenbuchungsgruppen suchen oder Kapitel 21 als blockiert markieren; kein MACHINES-Setup ohne Zielkontext.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-005-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-005-FA-POSTING-GROUPS-PATH.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-005 Evidence-Index',
      '',
      'Ziel: Read-only klaeren, ob `FA Posting Groups` als UI-Pfad fuer den naechsten Anlagen-Setup-Fit belastbar erreichbar ist.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-005-result.json` | JSON-Ergebnis | Sandbox, Company, Tell-Me-Kandidat, Klickmethode, Zielkontext, MACHINES-Sichtbarkeit, Sicherheitsgrenzen | keine Anlage, keine Setup-Aenderung, keine Buchung | labor, read-only |',
      '| `FIXEDASSETS-005-FA-POSTING-GROUPS-PATH.md` | Lernzusammenfassung | warum FA Posting Groups vor Anlagenzugang/AfA geklaert werden muessen | keinen deutschen Kontenplan-Endstand | labor |',
      '| `010-fa-posting-groups-tell-me-page-text.txt` | Seitentext | Such-/Tell-Me-Kontext | keine Zielseite | labor-candidate |',
      '| `010-fa-posting-groups-tell-me-buttons.json` | Button-Evidence | sichtbare Aktionen im Suchkontext | keine Setup-Wirkung | ui-evidence |',
      '| `010-fa-posting-groups-tell-me-candidates.json` | DOM-Kandidaten | welche UI-Elemente als Treffer erkannt wurden und welche Klickmethode genutzt wurde | keine fachliche Einrichtung | ui-diagnostic |',
      '| `020-fa-posting-groups-result-page-text.txt` | Seitentext | Zustand nach Klickversuch | nur dann Zielnachweis, wenn Anlagenbuchungsgruppen-Kontext sichtbar ist | labor/rejected |',
      '| `020-fa-posting-groups-result-buttons.json` | Button-Evidence | sichtbare Aktionen nach Klickversuch | keine ausgefuehrte Aktion | ui-evidence |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen der Bilder | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | mixed |',
      '',
      '## Kernaussage',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.posted).toBe(false);
  expect(result.tellMe.candidateVisible, 'Tell-Me muss FA Posting Groups zumindest als Kandidat zeigen.').toBe(true);
});
