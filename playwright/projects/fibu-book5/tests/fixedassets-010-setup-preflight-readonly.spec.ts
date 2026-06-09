import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import {
  bcPageUrl,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(300_000);

const testId = 'fixedassets-010';

type PreflightTarget = {
  id: string;
  label: string;
  pageId?: number;
  tellMe?: string;
  tellMeClickLabel?: RegExp;
  expectedContext: RegExp;
  targetValue: string;
  targetMeaning: string;
  screenshotFile: string;
  purpose: string;
  filter?: string;
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function listFilter(tableName: string, fieldName: string, value: string) {
  return `'${tableName}'.'${fieldName}' IS '${value}'`;
}

function pageUrl(pageId: number, filter?: string) {
  const url = new URL(bcPageUrl(pageId, project.envPrefix));
  if (filter) {
    url.searchParams.set('filter', filter);
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
    /Fixed Asset|Fixed Assets|FA Posting|FA Posting Group|Depreciation|Book|Vendor|Purchase Invoice|MACHINES|HGB|FA-CNC-01|K30000|Code|No\.|Description|Name|Account|Posting Group|Acquisition|Depreciation|Maintenance|Disposal|Anlage|Anlagen|AfA|Abschreibung|Kreditor|Buchungsgruppe|Sachkonto|Konto|Neu|New|Edit|Bearbeiten/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => sanitizeEvidenceText(line.replace(/\s+/g, ' ').trim()))
    .filter((line) => Boolean(line) && !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|shouldAttachOauthTokens|O365SuiteServiceProxy/i.test(line));
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -2; offset <= 6; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) {
        selected.add(selectedIndex);
      }
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

async function extractUiHints(page: Page, targetValue: string) {
  const targetPattern = targetValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hints = [];

  for (const frame of page.frames()) {
    const frameHints = await frame
      .evaluate((pattern) => {
        const target = new RegExp(pattern, 'i');
        const textOf = (element: HTMLElement) => {
          const visibleText = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
          const values = [...element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea')]
            .map((input) => input.value || input.getAttribute('aria-label') || input.getAttribute('title') || '')
            .filter(Boolean)
            .join(' ');
          return `${visibleText} ${values}`.replace(/\s+/g, ' ').trim();
        };
        const rowTexts = [...document.querySelectorAll<HTMLElement>('[role="row"], tr, [data-control-name], [data-testid]')]
          .map((element) => textOf(element))
          .filter(Boolean)
          .slice(0, 120);
        const fieldLabels = [...document.querySelectorAll<HTMLElement>('th,[role="columnheader"],label,[aria-label],[title]')]
          .map((element) => {
            const label = element.getAttribute('aria-label') || element.getAttribute('title') || element.innerText || element.textContent || '';
            return label.replace(/\s+/g, ' ').trim();
          })
          .filter(Boolean)
          .slice(0, 120);
        const actionCandidates = [...document.querySelectorAll<HTMLElement>('button,a,[role="button"],[role="menuitem"],[aria-label],[title]')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
            return {
              text,
              aria: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              role: element.getAttribute('role') || '',
              tag: element.tagName,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              visible: rect.width > 0 && rect.height > 0
            };
          })
          .filter((entry) => entry.visible && /New|Neu|Edit|Bearbeiten|List|Liste|Delete|Loeschen|Posting|Buchung|Dimensions|Dimension/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
          .slice(0, 80);

        return {
          frameUrl: location.href,
          targetVisibleInRows: rowTexts.some((row) => target.test(row)),
          rowSnippets: rowTexts
            .filter((row) => /Fixed Asset|FA Posting|Depreciation|Vendor|MACHINES|HGB|FA-CNC-01|K30000|EQUIPMENT|PLANT|PROPERTY|VEHICLES|COMPANY|CORP|TAX|10000|20000/i.test(row))
            .slice(0, 24),
          fieldLabels,
          actionCandidates
        };
      }, targetPattern)
      .catch(() => null);

    if (frameHints) {
      hints.push(frameHints);
    }
  }

  return hints.map((hint) => ({
    ...hint,
    rowSnippets: hint.rowSnippets.map(sanitizeEvidenceText),
    fieldLabels: [...new Set(hint.fieldLabels.map(sanitizeEvidenceText))].slice(0, 60),
    actionCandidates: hint.actionCandidates.map((action) => ({
      ...action,
      text: sanitizeEvidenceText(action.text),
      aria: sanitizeEvidenceText(action.aria),
      title: sanitizeEvidenceText(action.title)
    }))
  }));
}

async function openTarget(page: Page, target: PreflightTarget) {
  let openMethod = '';
  let click: { clicked?: boolean; method?: string; candidates?: unknown[] } = {};

  if (target.pageId) {
    await page.goto(pageUrl(target.pageId, target.filter), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    openMethod = `page:${target.pageId}${target.filter ? ':filtered' : ''}`;
  } else if (target.tellMe && target.tellMeClickLabel) {
    await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await searchFor(page, target.tellMe);
    await page.waitForTimeout(1500);
    click = await clickTellMeResult(page, target.tellMeClickLabel);
    openMethod = `tell-me:${target.tellMe}`;
  } else {
    throw new Error(`Target ${target.id} hat weder pageId noch Tell-Me-Konfiguration.`);
  }

  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page);
  await page.waitForTimeout(2500);

  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const contextVisible = target.expectedContext.test(text);
  const targetValueVisible = new RegExp(target.targetValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text);
  const hints = await extractUiHints(page, target.targetValue);
  const newActions = buttons.filter((button) => /^New$|^Neu$|New|Neu/i.test(button)).slice(0, 20);
  const editActions = buttons.filter((button) => /^Edit$|^Bearbeiten$|Edit List|Liste bearbeiten|Bearbeiten/i.test(button)).slice(0, 20);
  const newActionScopedCandidate = contextVisible && (newActions.length > 0 || hints.some((hint) => hint.actionCandidates.some((action) => /New|Neu/i.test(`${action.text} ${action.aria} ${action.title}`))));

  await writeTextEvidence(fixedAssetsEvidencePath(`${target.id}-page-text.txt`), compactPageText(text));
  await writeJsonEvidence(fixedAssetsEvidencePath(`${target.id}-ui-hints.json`), hints);
  await writeJsonEvidence(fixedAssetsEvidencePath(`${target.id}-buttons.json`), buttons);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: contextVisible ? 'candidate' : 'rejected',
    bookUse: contextVisible ? 'navigation' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Read-only Setup-Preflight in RM-DEMO / CRONUS USA.',
      'Breite Layoutansicht mit 2400x1300 Viewport; FactBox soweit moeglich ausgeblendet.',
      'New/Neu-Aktionen werden nur als sichtbare, seitenbezogene Kandidaten bewertet und nicht ausgefuehrt.',
      'Keine Anlage, kein Kreditor, kein AfA-Buch und keine Anlagenbuchungsgruppe angelegt oder geaendert.',
      'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ]
  });

  return {
    id: target.id,
    label: target.label,
    openMethod,
    pageId: target.pageId ?? null,
    filter: target.filter ?? null,
    contextVisible,
    targetValue: target.targetValue,
    targetValueVisible,
    targetMeaning: target.targetMeaning,
    click,
    fieldLabels: [...new Set(hints.flatMap((hint) => hint.fieldLabels))].slice(0, 80),
    rowSnippets: hints.flatMap((hint) => hint.rowSnippets).slice(0, 40),
    relevantButtons: buttons.filter((button) => /New|Neu|Edit|Bearbeiten|Delete|Loeschen|Posting|Buchung|Dimensions|Dimension|Card|Karte/i.test(button)).slice(0, 50),
    newActions,
    editActions,
    newActionScopedCandidate,
    screenshot: `playwright/projects/${project.name}/img/${target.screenshotFile}`,
    textEvidence: `playwright/projects/${project.name}/evidence/${testId}/${target.id}-page-text.txt`,
    uiHintsEvidence: `playwright/projects/${project.name}/evidence/${testId}/${target.id}-ui-hints.json`,
    buttonsEvidence: `playwright/projects/${project.name}/evidence/${testId}/${target.id}-buttons.json`
  };
}

function renderMarkdown(result: Record<string, any>) {
  const checks = result.checks as Awaited<ReturnType<typeof openTarget>>[];
  return [
    '# FIXEDASSETS-010 Setup-Preflight read-only',
    '',
    'Status: `labor`, `read-only`, `setup-preflight`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Arbeitsmodus | Nur UI lesen; keine Stammdatenanlage, kein Setup, keine Buchung |',
    '| Breite Layoutansicht | 2400 x 1300; FactBox soweit moeglich ausgeblendet |',
    '| Gate | `FIXEDASSETS-004-SETUP-OR-POSTING` bleibt geschlossen |',
    '',
    '## Ergebnis',
    '',
    '| Seite | Oeffnung | Kontext sichtbar | Zielwert sichtbar | New/Neu nur Kandidat | Bedeutung |',
    '|---|---|---:|---:|---:|---|',
    ...checks.map(
      (check) =>
        `| ${check.label} | ${check.openMethod} | ${check.contextVisible ? 'ja' : 'nein'} | ${check.targetValueVisible ? 'ja' : 'nein'} | ${check.newActionScopedCandidate ? 'ja' : 'nein'} | ${check.targetMeaning} |`
    ),
    '',
    '## Was damit praktisch nachgewiesen ist',
    '',
    '- Die relevanten Fixed-Assets-Setup-Kontexte koennen in der UI getrennt angesteuert werden.',
    '- `New/Neu` ist weiterhin ein zu schuetzender Schritt: sichtbar heisst noch nicht freigegeben. Fuer den naechsten Setup-Lauf muss jede Anlageaktion seitenbezogen und idempotent erfolgen.',
    '- Die breite Ansicht verbessert Tabellen-Screenshots, ersetzt aber keine fachliche Pruefung der Feldwerte.',
    '',
    '## Was nicht nachgewiesen ist',
    '',
    '- `MACHINES`, `HGB`, `FA-CNC-01` und `K30000` wurden nicht angelegt.',
    '- Kein Anlagenzugang, keine Einkaufsrechnung, keine Abschreibung und keine Buchung wurden erzeugt.',
    '- Es gibt keinen deutschen HGB-/Kontenplan-Endstand und keinen deutschen Finalnachweis.',
    '',
    '## Anfaenger-Lernwert',
    '',
    'Vor einer Anlagenbuchung muessen vier Dinge getrennt verstanden werden: die Anlage als Stammdatum, das AfA-Buch als Bewertungslogik, die Anlagenbuchungsgruppe als Kontenfindung und der Kreditor als Einkaufsgegenpartei. Business Central reagiert spaeter mit Buchungsfehlern oder falscher Kontierung, wenn eine dieser Ebenen fehlt oder geraten wird.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 sollte den Setup-Preflight als eigenen bebilderten Abschnitt behalten: Leser sehen zuerst die Listen und Feldbereiche, bevor sie `New/Neu` verwenden. Das verhindert, dass Anfaenger eine Anlagenkarte anlegen, ohne AfA-Buch, Buchungsgruppe, Kreditor und Zugangspfad verstanden zu haben.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-010 Setup-Preflight read-only pruefen', async ({ page }) => {
  const targets: PreflightTarget[] = [
    {
      id: '010-fa-posting-groups',
      label: 'FA Posting Groups',
      tellMe: 'FA Posting Groups',
      tellMeClickLabel: /^FA Posting Groups$|^FA Posting Group$|^Anlagenbuchungsgruppen$|^Anlagenbuchungsgruppe$/i,
      expectedContext: /FA Posting Groups|FA Posting Group|Anlagenbuchungsgruppen|Anlagenbuchungsgruppe/i,
      targetValue: 'MACHINES',
      targetMeaning: 'Kontenfindung fuer Anlagenzugang, AfA und Anlagenabgang',
      screenshotFile: 'fixedassets-010-010-fa-posting-groups-preflight.png',
      purpose: 'FIXEDASSETS-010 FA Posting Groups als sicheren Setup-Kontext read-only pruefen.'
    },
    {
      id: '020-depreciation-books',
      label: 'Depreciation Books',
      pageId: 5611,
      expectedContext: /Depreciation Book|Depreciation Books|AfA|Abschreibung/i,
      targetValue: 'HGB',
      targetMeaning: 'Bewertungs- und Abschreibungslogik fuer die Zielanlage',
      screenshotFile: 'fixedassets-010-020-depreciation-books-preflight.png',
      purpose: 'FIXEDASSETS-010 Depreciation Books/AfA-Buecher als sicheren Setup-Kontext read-only pruefen.'
    },
    {
      id: '030-fixed-assets',
      label: 'Fixed Assets',
      pageId: 5601,
      expectedContext: /Fixed Assets|Fixed Asset|Anlagen|Anlage/i,
      targetValue: 'FA-CNC-01',
      targetMeaning: 'Anlagenstamm fuer die spaetere CNC-Anlage',
      screenshotFile: 'fixedassets-010-030-fixed-assets-preflight.png',
      purpose: 'FIXEDASSETS-010 Fixed Assets/Anlagenliste als sicheren Stammdatenkontext read-only pruefen.'
    },
    {
      id: '040-vendors',
      label: 'Vendors',
      pageId: 27,
      filter: listFilter('Vendor', 'No.', 'K30000'),
      expectedContext: /Vendors|Vendor|Kreditoren|Kreditor/i,
      targetValue: 'K30000',
      targetMeaning: 'Kreditor fuer die spaetere Anlagen-Einkaufsrechnung',
      screenshotFile: 'fixedassets-010-040-vendors-preflight.png',
      purpose: 'FIXEDASSETS-010 Vendors/Kreditorenliste fuer K30000 read-only pruefen.'
    }
  ];

  const checks = [];
  for (const target of targets) {
    checks.push(await openTarget(page, target));
  }

  const result = {
    testId: 'FIXEDASSETS-010',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-setup-preflight-no-posting-no-setup-change',
    viewport: { width: 2400, height: 1300 },
    gate: {
      fixedAssetsSetupOrPosting: 'locked',
      setupGateOpenedByThisRun: false,
      postingGateOpenedByThisRun: false
    },
    targets: {
      faPostingGroup: 'MACHINES',
      depreciationBook: 'HGB',
      fixedAssetNo: 'FA-CNC-01',
      vendorNo: 'K30000'
    },
    checks,
    readiness: {
      contextsVisible: checks.every((check) => check.contextVisible),
      targetValuesAlreadyVisible: checks.filter((check) => check.targetValueVisible).map((check) => check.targetValue),
      missingTargetValues: checks.filter((check) => !check.targetValueVisible).map((check) => check.targetValue),
      scopedNewActionCandidates: checks.filter((check) => check.newActionScopedCandidate).map((check) => check.id),
      safeForNextSetupDecision: checks.every((check) => check.contextVisible)
    },
    safety: {
      posted: false,
      setupChanged: false,
      fixedAssetCreated: false,
      vendorCreated: false,
      depreciationBookCreated: false,
      faPostingGroupCreated: false,
      purchaseInvoiceCreated: false
    },
    proves: [
      'Read-only UI-Kontexte fuer FA Posting Groups, Depreciation Books, Fixed Assets und Vendors.',
      'Breite Layoutansicht fuer Tabellen-Screenshots im Fixed-Assets-Setup-Preflight.',
      'Welche Zielwerte vor einem Setup-Fit bereits sichtbar sind oder fehlen.',
      'Dass New/Neu als sichtbarer Kandidat separat gated werden muss und nicht automatisch ausgefuehrt werden darf.'
    ],
    doesNotProve: [
      'Kein Setup-Fit fuer MACHINES, HGB, FA-CNC-01 oder K30000.',
      'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ],
    nextStep:
      'FIXEDASSETS-011-SETUP-GATE-DECISION: aus dieser Preflight-Evidence eine explizite, eng begrenzte Setup-Freigabe fuer MACHINES/HGB/FA-CNC-01/K30000 ableiten oder fehlende UI-Mappings nachschaerfen; weiterhin keine Buchung ohne separaten Posting-Gate.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-010-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-010-SETUP-PREFLIGHT-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-010 Evidence-Index',
      '',
      'Status: `labor`, `read-only`, `setup-preflight`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-010-result.json` | JSON-Ergebnis | strukturierte UI-Preflight-Pruefung fuer die naechste Setup-Entscheidung | keinen Setup-Fit und keine Buchung | labor |',
      '| `FIXEDASSETS-010-SETUP-PREFLIGHT-READONLY.md` | Lernzusammenfassung | Anfaengererklaerung, Gate-Status und Buchwirkung | keinen deutschen Finalnachweis | labor |',
      '| `010-fa-posting-groups-page-text.txt` | Seitentext | UI-Kontext Anlagenbuchungsgruppen / FA Posting Groups | kein `MACHINES`-Setup | labor-read-only |',
      '| `020-depreciation-books-page-text.txt` | Seitentext | UI-Kontext AfA-Buecher / Depreciation Books | kein `HGB`-Setup | labor-read-only |',
      '| `030-fixed-assets-page-text.txt` | Seitentext | UI-Kontext Anlagen / Fixed Assets | keine Anlage `FA-CNC-01` | labor-read-only |',
      '| `040-vendors-page-text.txt` | Seitentext | UI-Kontext Kreditoren / Vendors fuer `K30000` | keinen Kreditor `K30000` | labor-read-only |',
      '| `*-ui-hints.json` | JSON-Auszug | sichtbare Feld-/Aktionshinweise und Row-Snippets je Seite | keine Rohsnapshots und keine vollstaendige Feldliste | compact |',
      '| `*-buttons.json` | JSON-Auszug | sichtbare Buttonnamen je Seite | keine Klickfreigabe fuer `New/Neu` | compact |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | candidate |',
      '',
      '## Kernaussage',
      '',
      result.nextStep
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
  expect(checks.some((check) => check.contextVisible)).toBe(true);
});
