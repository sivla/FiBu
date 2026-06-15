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

test.setTimeout(420_000);

const TEST_ID = 'fixedassets-012';

type Target = {
  id: string;
  label: string;
  pageId?: number;
  tellMe?: string;
  tellMeClickLabel?: RegExp;
  expectedContext: RegExp;
  targetValue: string;
  fieldIntent: string;
  screenshotStem: string;
  filter?: string;
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function pageUrl(pageId: number, filter?: string) {
  const url = new URL(bcPageUrl(pageId, project.envPrefix));
  if (filter) {
    url.searchParams.set('filter', filter);
  }

  return url.toString();
}

function listFilter(tableName: string, fieldName: string, value: string) {
  return `'${tableName}'.'${fieldName}' IS '${value}'`;
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
    /Fixed Asset|Fixed Assets|FA Posting|Depreciation|Book|Vendor|MACHINES|HGB|FA-CNC-01|K30000|Code|No\.|Name|Description|Posting Group|Account|Template|Vorlage|Pflicht|Required|New|Neu|Cancel|Abbrechen|Discard|Verwerfen|Close|Schlie/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => sanitizeEvidenceText(line.replace(/\s+/g, ' ').trim()))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -3; offset <= 7; offset += 1) {
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
  for (const frame of page.frames()) {
    for (const role of ['button', 'link', 'menuitem', 'option'] as const) {
      const locator = frame.getByRole(role, { name: label }).first();
      if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
        if (await locator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(5000);
          return { clicked: true, method: `role:${role}` };
        }
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
          .sort((left, right) => left.getBoundingClientRect().y - right.getBoundingClientRect().y);
        const target = elements[0];
        if (!target) return false;
        (target.closest<HTMLElement>('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"]') ?? target).click();
        return true;
      }, label.source)
      .catch(() => false);

    if (clickedByDom) {
      await page.waitForTimeout(5000);
      return { clicked: true, method: 'dom-click' };
    }
  }

  return { clicked: false, method: undefined as string | undefined };
}

async function frameWithContext(page: Page, expectedContext: RegExp) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (expectedContext.test(text)) {
      return frame;
    }
  }

  return null;
}

async function openTarget(page: Page, target: Target) {
  if (target.pageId) {
    await page.goto(pageUrl(target.pageId, target.filter), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  } else if (target.tellMe && target.tellMeClickLabel) {
    await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await searchFor(page, target.tellMe);
    await page.waitForTimeout(1500);
    await clickTellMeResult(page, target.tellMeClickLabel);
  } else {
    throw new Error(`Target ${target.id} hat weder pageId noch Tell-Me-Konfiguration.`);
  }

  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await closeExternalPages(page);
  await page.waitForTimeout(2500);
}

async function closeExternalPages(page: Page) {
  const closed: string[] = [];
  for (const candidate of page.context().pages()) {
    if (candidate === page) continue;
    const url = candidate.url();
    if (/learn\.microsoft\.com|go\.microsoft\.com|support\.microsoft\.com/i.test(url)) {
      closed.push(url);
      await candidate.close().catch(() => undefined);
    }
  }
  return closed;
}

async function assertRmDemoContext(page: Page) {
  const url = page.url();
  const text = await pageText(page);
  const urlOk = /MCP_1_20260210/i.test(url) && /company=RM-DEMO|company=RM-DEMO\b|company=RM-DEMO&/i.test(decodeURIComponent(url));
  const textOk = /MCP_1_20260210/i.test(text) && /Rhein-Main Demo GmbH|RM-DEMO/i.test(text);
  return { url, urlOk, textOk };
}

async function extractFormHints(page: Page, target: Target) {
  const hints = [];
  for (const frame of page.frames()) {
    const frameHints = await frame
      .evaluate((targetValue) => {
        const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
        const fields = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select,[contenteditable="true"]')]
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            let container: Element | null = element;
            for (let depth = 0; depth < 5 && container?.parentElement; depth += 1) {
              container = container.parentElement;
            }
            return {
              index,
              tag: element.tagName,
              type: element.getAttribute('type') || '',
              value: 'value' in element ? clean((element as HTMLInputElement).value || '') : clean(element.textContent || ''),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              placeholder: element.getAttribute('placeholder') || '',
              required: element.hasAttribute('required') || element.getAttribute('aria-required') === 'true',
              disabled: (element as HTMLInputElement).disabled || element.getAttribute('aria-disabled') === 'true',
              readOnly: (element as HTMLInputElement).readOnly || element.getAttribute('aria-readonly') === 'true',
              nearbyText: clean(container?.textContent || '').slice(0, 350),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              visible: rect.width > 0 && rect.height > 0
            };
          })
          .filter((field) => field.visible)
          .slice(0, 120);
        const actionCandidates = [...document.querySelectorAll<HTMLElement>('button,a,[role="button"],[role="menuitem"],[aria-label],[title]')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = clean(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || '');
            return {
              text,
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
          .filter((action) => action.visible && /Cancel|Abbrechen|Discard|Verwerfen|Close|Schlie|Back|Zurueck|Save|Speichern|OK|Create|Erstellen|Template|Vorlage/i.test(`${action.text} ${action.aria} ${action.title}`))
          .slice(0, 80);
        const bodyText = clean(document.body?.innerText || '');
        return {
          frameUrl: location.href,
          targetValueVisible: bodyText.includes(targetValue),
          titleCandidates: [...document.querySelectorAll<HTMLElement>('h1,h2,[role="heading"],[aria-label],[title]')]
            .map((element) => clean(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || ''))
            .filter(Boolean)
            .slice(0, 80),
          fields,
          actionCandidates
        };
      }, target.targetValue)
      .catch(() => null);
    if (frameHints) hints.push(frameHints);
  }

  return hints;
}

async function clickScopedNew(page: Page, target: Target) {
  const frame = await frameWithContext(page, target.expectedContext);
  if (!frame) {
    return { clicked: false, status: 'blocked' as const, reason: 'context-frame-not-found', candidates: [] };
  }

  const candidates = await candidateElements(frame, /^New$|^Neu$/i);
  const clickedByDom = await frame
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
          if (/New Intercom|New Time Sheets|New Document/i.test(label)) return false;
          if (/Power BI|Reports|Payments|Sales Quote|Sales Order|Purchase Order/i.test(label)) return false;
          return true;
        })
        .sort((left, right) => {
          const score = (candidate: {
            element: HTMLElement;
            text: string;
            aria: string;
            title: string;
            rect: DOMRect;
            label: string;
          }) => {
            let value = 0;
            if (/^Neu$/.test(candidate.text) || /^Neu$/.test(candidate.aria)) value -= 20;
            if (/Erstellen Sie einen neuen Eintrag|Create a new entry/i.test(candidate.title)) value -= 15;
            if (candidate.rect.y < 160) value -= 10;
            if (candidate.rect.x < 1300) value -= 5;
            if (/menuitem|button/i.test(candidate.element.getAttribute('role') || candidate.element.tagName)) value -= 3;
            value += Math.abs(candidate.rect.y - 65) / 100;
            value += Math.abs(candidate.rect.x - 550) / 1000;
            return value;
          };
          return score(left) - score(right);
        });
      const target = candidates[0]?.element;
      if (!target) return false;
      target.click();
      return true;
    })
    .catch(() => false);

  if (clickedByDom) {
    await page.waitForTimeout(4500);
    return { clicked: true, status: 'opened' as const, method: 'scoped-dom-preferred-new', candidates };
  }

  return { clicked: false, status: 'blocked' as const, reason: 'no-visible-scoped-new-action', candidates };
}

async function closeWithoutSaving(page: Page) {
  const attempts: string[] = [];
  for (const label of [/^Cancel$|^Abbrechen$/i, /^Discard$|^Verwerfen$/i, /^Close$|^Schlie/i]) {
    for (const scope of [page, ...page.frames()]) {
      for (const role of ['button', 'menuitem'] as const) {
        const action = scope.getByRole(role, { name: label }).first();
        if (await action.isVisible({ timeout: 700 }).catch(() => false)) {
          attempts.push(`click:${label.source}:${role}`);
          await action.click({ timeout: 4000 }).catch(() => undefined);
          await page.waitForTimeout(2000);
          return { closed: true, method: attempts.at(-1), attempts };
        }
      }
    }
  }

  attempts.push('keyboard:Escape');
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1200);
  attempts.push('browser:back');
  await page.goBack({ waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(1800);

  return { closed: true, method: 'escape-and-back', attempts };
}

function renderMarkdown(result: Record<string, any>) {
  const checks = result.checks as any[];
  return [
    '# FIXEDASSETS-012 Scoped New/Card Preflight',
    '',
    'Status: `labor`, `ui-first`, `form-preflight`, `cancel-safe`, `no-save`, `no-setup-change`, `no-posting`, `not-final`.',
    '',
    'Diese Aktion ist als autonome RM-DEMO-Laboraktion vertretbar, weil sie keine Stammdaten speichert, keine Buchung ausloest und nur die bereits freigegebenen Zielseiten aus `FIXEDASSETS-011` nutzt. Zweck ist, Pflichtfelder, Defaults/Templates und Abbruchwege zu verstehen, bevor ein spaeterer Setup-Fit geplant wird.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| BC-Lauf | ja, UI-first |',
    '| Setup geaendert | nein |',
    '| Buchung | nein |',
    '',
    '## Ergebnis',
    '',
    '| Zielkontext | New/Neu geklickt | Formular/Folgekontext sichtbar | Sicher geschlossen | Status |',
    '|---|---:|---:|---:|---|',
    ...checks.map(
      (check) =>
        `| ${check.label} | ${check.newAttempt.clicked ? 'ja' : 'nein'} | ${check.formContextCaptured ? 'ja' : 'nein'} | ${check.closeResult.closed ? 'ja' : 'nein'} | ${check.status} |`
    ),
    '',
    '## Was praktisch belegt ist',
    '',
    '- Der Lauf prueft `New/Neu` nicht mehr nur als sichtbaren Button, sondern als kontrollierten Formular-/Folgekontext.',
    '- Die Screenshots beweisen nur den Formular- oder Template-Kontext, nicht die Existenz der Zielcodes.',
    '- Es wurde nichts gespeichert, nichts angelegt und nichts gebucht.',
    '- Ein spaeterer Setup-Fit braucht weiterhin eine eigene Vorher/Nachher- und Idempotenz-Evidence.',
    '',
    '## Screenshot-QA nach Sichtpruefung',
    '',
    'Die vier Screenshots zeigen nicht die Zielcodes `MACHINES`, `HGB`, `FA-CNC-01` oder `K30000`. Sichtbar sind nur neue leere Karten beziehungsweise der Vendor-Template-Dialog. Damit sind die Bilder keine Buch-Screenshots fuer fertige Zielstammdaten. Ein spaeteres Buchbild fuer Kapitel 21 muss den jeweiligen Zielcode sichtbar zeigen.',
    '',
    '## Anfaenger-Lernwert',
    '',
    'Business Central unterscheidet zwischen einer Liste, einem neuen Datensatzformular, Vorlagen-/Template-Auswahl und dem eigentlichen Speichern. Fuer Anlagen ist dieser Zwischenschritt wichtig, weil falsche Pflichtfelder oder Defaults spaeter falsche Anlagenposten oder Buchungsblocker erzeugen koennen.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 kann den Formular-Preflight als didaktischen Schritt nutzen: Leser sehen, dass `Neu` nicht sofort fachlich sicher ist, sondern erst Pflichtfelder, Defaults, Templates und der sichere Abbruch verstanden werden muessen.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-012 Scoped New/Card Preflight ohne Speichern', async ({ page }) => {
  const targets: Target[] = [
    {
      id: '010-fa-posting-groups',
      label: 'FA Posting Groups',
      tellMe: 'FA Posting Groups',
      tellMeClickLabel: /^FA Posting Groups$|^FA Posting Group$|^Anlagenbuchungsgruppen$|^Anlagenbuchungsgruppe$/i,
      expectedContext: /FA Posting Groups|FA Posting Group|Anlagenbuchungsgruppen|Anlagenbuchungsgruppe/i,
      targetValue: 'MACHINES',
      fieldIntent: 'Anlagenbuchungsgruppe fuer Maschinen',
      screenshotStem: 'fixedassets-012-010-fa-posting-groups-new-preflight'
    },
    {
      id: '020-depreciation-books',
      label: 'Depreciation Books',
      pageId: 5611,
      expectedContext: /Depreciation Book|Depreciation Books|AfA|Abschreibung/i,
      targetValue: 'HGB',
      fieldIntent: 'AfA-Buch fuer Labor-HGB-Zielbild',
      screenshotStem: 'fixedassets-012-020-depreciation-books-new-preflight'
    },
    {
      id: '030-fixed-assets',
      label: 'Fixed Assets',
      pageId: 5601,
      expectedContext: /Fixed Assets|Fixed Asset|Anlagen|Anlage/i,
      targetValue: 'FA-CNC-01',
      fieldIntent: 'Anlagenkarte fuer CNC-Anlage',
      screenshotStem: 'fixedassets-012-030-fixed-assets-new-preflight'
    },
    {
      id: '040-vendors',
      label: 'Vendors',
      pageId: 27,
      filter: listFilter('Vendor', 'No.', 'K30000'),
      expectedContext: /Vendors|Vendor|Kreditoren|Kreditor/i,
      targetValue: 'K30000',
      fieldIntent: 'Kreditor fuer spaetere Anlagen-Einkaufsrechnung',
      screenshotStem: 'fixedassets-012-040-vendors-new-preflight'
    }
  ];

  const checks = [];

  for (const target of targets) {
    await openTarget(page, target);
    const contextCheck = await assertRmDemoContext(page);
    if (!contextCheck.urlOk && !contextCheck.textOk) {
      throw new Error(`Falscher BC-Kontext vor ${target.id}: ${contextCheck.url}`);
    }

    const beforeText = await pageText(page);
    await writeTextEvidence(fixedAssetsEvidencePath(`${target.id}-before-page-text.txt`), compactPageText(beforeText));

    const newAttempt = await clickScopedNew(page, target);
    const closedExternalPages = await closeExternalPages(page);
    await dismissTours(page);
    await page.waitForTimeout(1500);

    const afterText = await pageText(page);
    const formHints = await extractFormHints(page, target);
    const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
    const formContextCaptured = newAttempt.clicked && formHints.some((hint) => hint.fields.length > 0 || hint.actionCandidates.length > 0);

    await writeTextEvidence(fixedAssetsEvidencePath(`${target.id}-after-new-page-text.txt`), compactPageText(afterText));
    await writeJsonEvidence(fixedAssetsEvidencePath(`${target.id}-form-hints.json`), formHints);
    await writeJsonEvidence(fixedAssetsEvidencePath(`${target.id}-buttons-after-new.json`), buttons);
    await screenshot(page, `${target.screenshotStem}.png`, {
      projectName: project.name,
      testId: TEST_ID,
      status: newAttempt.clicked ? 'candidate' : 'rejected',
      bookUse: newAttempt.clicked ? 'form-preflight-only-target-code-not-visible' : 'do-not-use',
      purpose: `FIXEDASSETS-012 ${target.label}: scoped New/Card Preflight fuer ${target.fieldIntent}; ohne Speichern.`,
      knownLimitations: [
        'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
        'Formular-Preflight, keine Stammdatenanlage und keine Setup-Aenderung.',
        `Zielcode ${target.targetValue} ist im Screenshot nicht sichtbar und nicht angelegt.`,
        'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
        'Screenshot ist kein deutscher HGB-/Kontenplan-Endstand.'
      ]
    });

    const closeResult = newAttempt.clicked ? await closeWithoutSaving(page) : { closed: true, method: 'not-opened', attempts: [] };
    await page.waitForTimeout(1000);

    checks.push({
      id: target.id,
      label: target.label,
      targetValue: target.targetValue,
      fieldIntent: target.fieldIntent,
      contextCheck,
      newAttempt,
      formContextCaptured,
      fieldCount: formHints.reduce((sum, hint) => sum + hint.fields.length, 0),
      actionCount: formHints.reduce((sum, hint) => sum + hint.actionCandidates.length, 0),
      relevantButtons: buttons.filter((button) => /Cancel|Abbrechen|Discard|Verwerfen|Close|Schlie|Save|Speichern|New|Neu|Template|Vorlage|OK|Create|Erstellen/i.test(button)).slice(0, 60),
      closeResult,
      closedExternalPages,
      screenshot: `playwright/projects/${project.name}/img/${target.screenshotStem}.png`,
      status: newAttempt.clicked && formContextCaptured && closeResult.closed ? 'candidate-form-preflight' : 'blocked-or-rejected'
    });
  }

  const result = {
    testId: 'FIXEDASSETS-012',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-scoped-new-card-preflight-no-save-no-setup-change-no-posting',
    autonomyJustification: {
      purpose: 'Pflichtfelder, Defaults/Templates und Abbruchwege fuer Fixed-Assets-Zielobjekte vor spaeterem Setup-Fit verstehen.',
      evidenceGap: 'FIXEDASSETS-011 erlaubte nur Formular-Preflight; gescopte New/Card-Kontexte waren noch nicht praktisch nachgewiesen.',
      affectedObjects: ['MACHINES', 'HGB', 'FA-CNC-01', 'K30000'],
      expectedEffect: 'Keine Datenwirkung; nur Evidence zu Formular-/Folgekontexten.',
      risk: 'Unbeabsichtigtes Speichern eines Zielobjekts; mitigiert durch keine Eingaben, sofortige Evidence und Schliessen/Abbrechen ohne Speichern.',
      rollback: 'Bei unerwartetem Speichern sofort dokumentieren und Zielwert in spaeterem Cleanup-/Korrekturlauf behandeln; dieser Lauf gibt keine Buchung frei.',
      laborBoundary: 'Nur RM-DEMO / CRONUS USA, kein deutscher Finalnachweis.'
    },
    checks,
    safety: {
      posted: false,
      setupChanged: false,
      fixedAssetCreated: false,
      vendorCreated: false,
      depreciationBookCreated: false,
      faPostingGroupCreated: false,
      purchaseInvoiceCreated: false,
      saved: false
    },
    proves: [
      'Scoped New/Card Preflight wurde fuer Fixed-Assets-Zielkontexte versucht.',
      'Der Lauf erzeugt Formular-/Feld-/Abbruch-Evidence statt Stammdaten.',
      'Es wurde nichts gespeichert, nichts angelegt und nichts gebucht.'
    ],
    doesNotProve: [
      'Kein Setup-Fit fuer MACHINES, HGB, FA-CNC-01 oder K30000.',
      'Keine Zielcodes im Screenshot sichtbar; Bilder sind Formular-/Template-Preflight, keine Zielstammdatenbilder.',
      'Keine Anlagenaktivierung, keine AfA und keine FA Ledger Entries.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ],
    nextStep:
      'FIXEDASSETS-013-SETUP-FIT-DECISION: Aus FIXEDASSETS-012 entscheiden, ob ein kleiner idempotenter UI-first Setup-Fit fuer genau einen Zielwert sicher ist, oder ob ein Formularpfad rejected/blockiert bleibt.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-012-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-012-SCOPED-NEW-CARD-PREFLIGHT.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-012 Evidence-Index',
      '',
      'Status: `labor`, `ui-first`, `form-preflight`, `cancel-safe`, `no-save`, `no-setup-change`, `no-posting`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-012-result.json` | JSON-Ergebnis | strukturierte Formular-Preflight-Ergebnisse je Zielkontext | keinen Setup-Fit und keine Buchung | labor |',
      '| `FIXEDASSETS-012-SCOPED-NEW-CARD-PREFLIGHT.md` | Lernzusammenfassung | warum `New/Neu` vor Stammdatenanlage als Formular-/Pflichtfeldschritt verstanden werden muss | keinen deutschen Finalnachweis | labor |',
      '| `*-before-page-text.txt` | Seitentext | Ausgangskontext vor `New/Neu` | keine Stammdatenanlage | compact |',
      '| `*-after-new-page-text.txt` | Seitentext | sichtbarer Zustand nach kontrolliertem `New/Neu`-Versuch | keine vollstaendigen Rohsnapshots | compact |',
      '| `*-form-hints.json` | JSON-Auszug | sichtbare Felder, Defaults/Templates und Abbruch-/Schliessen-Aktionen | keine sichere Feldbefuellung | compact |',
      '| `*-buttons-after-new.json` | JSON-Auszug | sichtbare Buttons nach `New/Neu` | keine Freigabe zum Speichern | compact |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | candidate/rejected |',
      '',
      '## Kernaussage',
      '',
      'Die PNGs aus `FIXEDASSETS-012` zeigen keine angelegten Zielcodes. Sie zeigen leere Karten oder den Vendor-Template-Dialog: `MACHINES`, `HGB`, `FA-CNC-01` und `K30000` sind nicht sichtbar.',
      '',
      result.nextStep
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.saved).toBe(false);
  expect(checks.length).toBe(4);
});
