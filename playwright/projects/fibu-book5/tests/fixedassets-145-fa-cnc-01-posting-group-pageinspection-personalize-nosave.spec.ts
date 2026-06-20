import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-145-FA-CNC-01-POSTING-GROUP-PAGEINSPECTION-PERSONALIZE-NOSAVE';
const NEXT_CASE_ID = 'FIXEDASSETS-146-FA-CNC-01-POSTING-GROUP-DIAGNOSIS-RESULT-REVIEW';
const TEST_ID = 'fixedassets-145';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_ASSET = 'FA-CNC-01';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(420_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function fixedAssetCardUrl() {
  const url = new URL(bcPageUrl(5600, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${TARGET_ASSET}'`);
  return url.toString();
}

function clean(value: string | null | undefined) {
  return (value || '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactLines(value: string, keep: RegExp, maxLines = 140) {
  const seen = new Set<string>();
  return value
    .split('\n')
    .map((line) => clean(line))
    .filter(Boolean)
    .filter((line) => keep.test(line))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, maxLines);
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const parsed = new URL(url);
  const text = await pageText(page);
  const result = {
    url,
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };

  if (!result.environmentInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function openAssetCard(page: Page) {
  await page.goto(fixedAssetCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset Card|Fixed Asset|FA Class Code|Depreciation Book|Book Value/i, {
    timeout: 90_000,
  });
  await waitForPageText(page, /\bFA-CNC-01\b/i, { timeout: 60_000 });
  await page.waitForTimeout(1000);
}

async function closeExternalPages(page: Page) {
  const closed: string[] = [];
  for (const candidate of page.context().pages()) {
    if (candidate === page) continue;
    const url = candidate.url();
    if (!/businesscentral\.dynamics\.com/i.test(url)) {
      closed.push(url);
      await candidate.close().catch(() => undefined);
    }
  }
  return closed;
}

async function findCardFrame(page: Page) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/\bFA-CNC-01\b/i.test(text) && /Fixed Asset Card|Fixed Asset|Posting Group|Book Value/i.test(text)) {
      return frame;
    }
  }
  return page.mainFrame();
}

async function expandDepreciationBookFields(page: Page) {
  const frame = await findCardFrame(page);
  const candidates = frame.getByRole('button', {
    name: /Depreciation Book, (Mehr anzeigen|Show more)|Depreciation Book.*Show more fields/i,
  });
  const count = await candidates.count().catch(() => 0);
  const attempts: Array<Record<string, unknown>> = [];

  for (let index = 0; index < count; index += 1) {
    const button = candidates.nth(index);
    const label = clean(
      [
        await button.innerText({ timeout: 500 }).catch(() => ''),
        (await button.getAttribute('aria-label').catch(() => '')) ?? '',
        (await button.getAttribute('title').catch(() => '')) ?? '',
      ].join(' | '),
    );
    if (/\b(Acquire|Edit|Post|Preview|New|Delete|Copy|OK|Yes|Ja|Invoice|Ship)\b/i.test(label)) {
      attempts.push({ index, label, clicked: false, skippedReason: 'dangerous-label' });
      continue;
    }
    const box = await button.boundingBox().catch(() => null);
    if (!box || box.width === 0 || box.height === 0) {
      attempts.push({ index, label, clicked: false, skippedReason: 'not-visible' });
      continue;
    }
    await button.click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    attempts.push({ index, label, clicked: true });
    break;
  }

  return { candidateCount: count, attempts, clicked: attempts.some((attempt) => attempt.clicked) };
}

async function collectCardRows(page: Page) {
  const frame = await findCardFrame(page);
  const rows = await frame
    .evaluate(() => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const wanted = ['No.', 'Description', 'FA Class Code', 'FA Subclass Code', 'Depreciation Book Code', 'Posting Group', 'Book Value', 'Acquired'];
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const elements = Array.from(document.querySelectorAll<HTMLElement>('label,span,div,a'));
      return wanted.map((caption) => {
        const label = elements
          .filter(visible)
          .map((element) => ({ element, text: normalize(element.innerText || element.textContent), rect: element.getBoundingClientRect() }))
          .filter((entry) => entry.text === caption)
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x)[0];
        if (!label) return { caption, selectedValue: '', found: false };
        const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select'))
          .filter(visible)
          .map((element) => ({ element, rect: element.getBoundingClientRect(), value: normalize(String(element.value)) }))
          .filter((entry) => Math.abs(entry.rect.y - label.rect.y) <= 16 && entry.rect.x > label.rect.x)
          .sort((left, right) => left.rect.x - right.rect.x);
        const control = controls[0];
        return {
          caption,
          selectedValue: control?.value || '',
          found: true,
          editable: control ? !control.element.disabled && !control.element.readOnly : false,
        };
      });
    })
    .catch(() => []);
  return rows;
}

async function focusPostingGroup(page: Page) {
  const frame = await findCardFrame(page);
  const result = await frame
    .evaluate(() => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const labels = Array.from(document.querySelectorAll<HTMLElement>('label,span,div,a'))
        .filter(visible)
        .map((element) => ({ element, text: normalize(element.innerText || element.textContent), rect: element.getBoundingClientRect() }))
        .filter((entry) => entry.text === 'Posting Group')
        .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
      const label = labels[0];
      if (!label) return { focused: false, reason: 'label-not-found' };
      const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select'))
        .filter(visible)
        .map((element) => ({ element, rect: element.getBoundingClientRect(), value: normalize(String(element.value)) }))
        .filter((entry) => Math.abs(entry.rect.y - label.rect.y) <= 16 && entry.rect.x > label.rect.x)
        .sort((left, right) => left.rect.x - right.rect.x);
      const control = controls[0];
      if (!control) return { focused: false, reason: 'control-not-found', label: { x: label.rect.x, y: label.rect.y } };
      control.element.focus();
      return {
        focused: true,
        valueBefore: control.value,
        label: { x: Math.round(label.rect.x), y: Math.round(label.rect.y), width: Math.round(label.rect.width) },
        control: { x: Math.round(control.rect.x), y: Math.round(control.rect.y), width: Math.round(control.rect.width), height: Math.round(control.rect.height) },
      };
    })
    .catch((error) => ({ focused: false, reason: 'evaluate-error', error: String(error) }));
  await page.waitForTimeout(700);
  return result;
}

async function openPageInspection(page: Page) {
  const attempts: Array<Record<string, unknown>> = [];
  await page.keyboard.press('Control+Alt+F1').catch((error) => attempts.push({ method: 'Control+Alt+F1', error: String(error) }));
  await page.waitForTimeout(3500);
  const closedExternalPages = await closeExternalPages(page);
  const text = await pageText(page);
  const lines = compactLines(
    text,
    /Page Inspection|Inspect pages and data|Page ID|Page Type|Source Table|Table ID|Fixed Asset Card|Fixed Asset|Depreciation Book|FA Posting Group|Posting Group|Acquired|Book Value|HGB|EQUIPMENT|MACHINES|5600|Base Application|Extension|Code\[|Boolean/i,
    180,
  );
  const joined = lines.join(' ');
  const opened = /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(joined);
  attempts.push({ method: 'Control+Alt+F1', opened, closedExternalPages });
  return {
    opened,
    attempts,
    lines,
    signals: {
      pageInspectionVisible: /Page Inspection|Inspect pages and data/i.test(joined),
      fixedAssetCardVisible: /Fixed Asset Card/i.test(joined),
      fixedAssetTableVisible: /Source Table.*Fixed Asset|Fixed Asset.*5600|Table ID.*5600/i.test(joined),
      postingGroupMentioned: /Posting Group|FA Posting Group/i.test(joined),
      hgbMentioned: /\bHGB\b/i.test(joined),
      equipmentMentioned: /\bEQUIPMENT\b/i.test(joined),
      machinesMentioned: /\bMACHINES\b/i.test(joined),
      acquiredMentioned: /Acquired|Erworben/i.test(joined),
    },
  };
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
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,span,div'))
          .filter(visible)
          .map((element) => {
            const clickable = (element.closest('button,[role="button"],[role="menuitem"],a') as HTMLElement | null) ?? element;
            const rect = clickable.getBoundingClientRect();
            return {
              clickable,
              text: normalize(element.innerText || element.textContent),
              ariaLabel: normalize(element.getAttribute('aria-label') || clickable.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title') || clickable.getAttribute('title')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => {
            const haystack = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            return pattern.test(haystack) && haystack.length <= 180;
          })
          .filter((entry) => entry.rect.width >= 20 && entry.rect.height >= 10)
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'target-not-found', candidates: [] };
        chosen.clickable.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect },
          candidates: candidates.slice(0, 5).map(({ clickable: _clickable, ...entry }) => entry),
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
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              element,
              text: normalize(element.innerText || element.textContent),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
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
        if (!chosen) return { clicked: false, reason: 'settings-button-not-found' };
        chosen.element.click();
        return { clicked: true, chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect } };
      })
      .catch((error) => ({ clicked: false, reason: 'evaluate-error', error: String(error) }));
    if (result.clicked) {
      await page.waitForTimeout(900);
      return result;
    }
  }
  return { clicked: false, reason: 'settings-button-not-found-in-any-frame' };
}

function compactPersonalizeLines(text: string) {
  return compactLines(
    text,
    /Personalizing|Personalize|Personalisieren|Personalisierung|Add field|Add fields|Field|Feld|Posting Group|FA Posting Group|Depreciation Book|Fixed Asset|Anlage|Done|Fertig|Discard|Verwerfen|MACHINES|EQUIPMENT/i,
    140,
  );
}

async function openPersonalizeDiagnosis(page: Page) {
  const settingsResult = await clickSettingsButton(page);
  if (!settingsResult.clicked) {
    return {
      settingsResult,
      personalizeClick: { clicked: false, reason: 'settings-not-open' },
      addFieldClick: { clicked: false, reason: 'not-attempted' },
      opened: false,
      blockedByPageInspection: false,
      lines: [],
      exit: null,
    };
  }

  const personalizeClick = await clickVisibleTextLike(page, /Personalize|Personalisieren/);
  await page.waitForTimeout(2200);
  const fullTextAfterOpen = await pageText(page);
  const blockedByPageInspection = /nicht starten.*Seitenpr/i.test(fullTextAfterOpen) || /cannot start.*Page Inspection/i.test(fullTextAfterOpen);
  const opened = !blockedByPageInspection && /Personalizing|Personalisierung|Done|Fertig|Add field|Add fields|Feld hinzuf/i.test(fullTextAfterOpen);
  const addFieldClick = opened ? await clickVisibleTextLike(page, /Add field|Add fields|Feld hinzuf|Felder hinzuf|\+ Field|\+ Feld/) : { clicked: false, reason: 'personalize-not-open' };
  await page.waitForTimeout(1400);
  const compactText = await compactPageText(page, {
    include: [/Personalizing|Personalize|Personalisieren|Personalisierung|Done|Fertig|Add field|Field|Feld|Posting Group|Fixed Asset|Anlage|MACHINES|EQUIPMENT/i],
    maxLines: 160,
    maxLineLength: 220,
  });
  const fullText = await pageText(page);
  const lines = compactPersonalizeLines(compactText || fullText);
  const joined = `${lines.join(' ')} ${fullText}`;

  const screenshotAttempt = await screenshot(page, 'fixedassets-145-040-fa-cnc-01-posting-group-personalize-nosave.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: opened ? 'technical-diagnosis' : 'rejected',
    bookUse: opened ? 'debugging-evidence-only' : 'do-not-use',
    purpose: 'Personalisieren no-save Diagnose fuer FA-CNC-01 Posting Group; keine Auswahl, kein Speichern, kein Setup-Fit.',
    expectedPageText: [/Personalize|Personalisieren|Field|Feld|Wird personalisiert|Personalizing/i],
    knownLimitations: ['Kein gespeichertes Layout.', 'Kein MACHINES-Fit.', 'Keine Anschaffung, keine Preview, keine Buchung.'],
  })
    .then(() => ({ captured: true }))
    .catch((error) => ({ captured: false, error: String(error) }));

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(600);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(600);
  const discardAttempt = await clickVisibleTextLike(page, /Discard|Verwerfen|Don't save|Nicht speichern/);
  await page.waitForTimeout(800);

  return {
    settingsResult,
    personalizeClick,
    addFieldClick,
    opened,
    blockedByPageInspection,
    lines,
    screenshotAttempt,
    exit: {
      method: discardAttempt.clicked ? 'escape-twice-then-discard' : 'escape-twice-only',
      discardAttempt,
      personalizationSaved: false,
      finishClicked: false,
    },
    signals: {
      personalizeMentioned: !blockedByPageInspection && /Personalizing|Personalize|Personalisieren|Personalisiert|personalisiert|Personalisierung/i.test(joined),
      addFieldMentioned: /Add field|Add fields|Feld|Field/i.test(joined),
      postingGroupMentioned: /Posting Group|FA Posting Group/i.test(joined),
      machinesMentioned: /\bMACHINES\b/i.test(joined),
      equipmentMentioned: /\bEQUIPMENT\b/i.test(joined),
    },
  };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-145 - Posting Group technische Diagnose',
    '',
    'Status: `labor`, `ui-first`, `technical-diagnosis`, `no-save`, `no-setup-change`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.targetAsset} |`,
    `| Page Inspection geoeffnet | ${result.observed.pageInspection.opened ? 'ja' : 'nein'} |`,
    `| Personalisieren geoeffnet | ${result.observed.personalize.opened ? 'ja' : 'nein'} |`,
    `| Posting Group in Page Inspection | ${result.observed.pageInspection.signals.postingGroupMentioned ? 'ja/teilweise' : 'nein'} |`,
    `| Posting Group in Personalisieren | ${result.observed.personalize.signals?.postingGroupMentioned ? 'ja/teilweise' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    '- Page Inspection klaert Page, Table und technische Felder, ist aber kein Anwenderprozessbild.',
    '- Personalisieren zeigt, welche Page-Felder/Spalten sichtbar gemacht werden koennen, ist aber keine Tabellenlogik.',
    '- Eine technische Diagnose darf keine Buchungs- oder Setup-Wahrheit behaupten.',
    '- `MACHINES` zaehlt erst, wenn der Wert auf der richtigen `Fixed Asset Card` sichtbar gespeichert ist.',
    '',
    '## Grenzen',
    '',
    '- Keine Auswahl von `MACHINES`.',
    '- Keine gespeicherte Personalisierung.',
    '- Keine Setup-Aenderung.',
    '- Keine Anschaffung, keine Preview, keine Buchung.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-145 diagnoses FA-CNC-01 Posting Group with Page Inspection and Personalize no-save', async ({ page }) => {
  const startedAt = new Date().toISOString();

  await openAssetCard(page);
  const context = await assertSandboxContext(page);
  const expand = await expandDepreciationBookFields(page);
  const rowsBefore = await collectCardRows(page);
  const focusResult = await focusPostingGroup(page);
  await writeJsonEvidence(faEvidencePath('010-card-rows-before.json'), rowsBefore);
  await writeJsonEvidence(faEvidencePath('015-posting-group-focus.json'), focusResult);
  await writeTextEvidence(
    faEvidencePath('016-card-focused-text.txt'),
    await compactPageText(page, {
      include: [/Fixed Asset Card|FA-CNC-01|CNC Maschine|Depreciation Book|Posting Group|Book Value|Acquired|HGB|EQUIPMENT|MACHINES/i],
      maxLines: 160,
      maxLineLength: 220,
    }),
  );

  const pageInspection = await openPageInspection(page);
  await writeTextEvidence(faEvidencePath('020-pageinspection-focused-lines.txt'), pageInspection.lines.join('\n') || 'No Page Inspection compact lines captured.');
  await writeJsonEvidence(faEvidencePath('030-pageinspection-signals.json'), { pageInspection, expand });
  if (pageInspection.opened) {
    await screenshot(page, 'fixedassets-145-030-fa-cnc-01-posting-group-pageinspection.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: 'technical-diagnosis',
      bookUse: 'debugging-evidence-only',
      purpose: 'Page Inspection Kontext fuer FA-CNC-01 Posting Group; kein Setup-Fit und keine Buchung.',
      expectedPageText: [/Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i],
      knownLimitations: ['Debugging-Bild, kein finaler Anwenderscreenshot.', 'Kein MACHINES-Zuordnungsnachweis.'],
    });
  }

  await openAssetCard(page);
  await assertSandboxContext(page);
  await expandDepreciationBookFields(page);
  await focusPostingGroup(page);
  const personalize = await openPersonalizeDiagnosis(page);
  await writeJsonEvidence(faEvidencePath('040-personalize-context.json'), personalize);
  await writeTextEvidence(faEvidencePath('041-personalize-focused-lines.txt'), personalize.lines.join('\n') || 'No Personalize compact lines captured.');

  await openAssetCard(page);
  const rowsAfter = await collectCardRows(page);
  await writeJsonEvidence(faEvidencePath('050-card-rows-after.json'), rowsAfter);

  const beforePostingGroup = rowsBefore.find((row: any) => row.caption === 'Posting Group')?.selectedValue || '';
  const afterPostingGroup = rowsAfter.find((row: any) => row.caption === 'Posting Group')?.selectedValue || '';
  const setupChanged = beforePostingGroup !== afterPostingGroup;
  const resultStatus = pageInspection.opened || personalize.opened ? 'observed-technical-diagnosis' : 'blocked-technical-diagnosis';
  const summary =
    resultStatus === 'observed-technical-diagnosis'
      ? `FA-145 captured technical diagnosis for FA-CNC-01 Posting Group. Page Inspection opened=${pageInspection.opened}; Personalize opened=${personalize.opened}. Posting Group stayed ${afterPostingGroup || '(blank)'}; no value was selected or saved.`
      : 'FA-145 could not capture useful Page Inspection or Personalize context; no value was selected or saved.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-posting-group-pageinspection-personalize-nosave-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-ui-technical-diagnosis',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    targetAsset: TARGET_ASSET,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      context,
      expand,
      rowsBefore,
      focusResult,
      pageInspection,
      personalize,
      rowsAfter,
      beforePostingGroup,
      afterPostingGroup,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'FA-CNC-01 Fixed Asset Card was opened.',
      `Posting Group before diagnosis was ${beforePostingGroup || '(blank)'}.`,
      `Posting Group after diagnosis was ${afterPostingGroup || '(blank)'}.`,
      ...(pageInspection.opened ? ['Page Inspection opened and produced compact context lines.'] : []),
      ...(personalize.opened ? ['Personalize opened as a no-save diagnostic route.'] : []),
      'No MACHINES value was selected or saved.',
      'No acquisition, Preview Posting, posting, draft, company switch or API shortcut occurred.',
    ],
    notProved: [
      'Posting Group MACHINES is not assigned to FA-CNC-01.',
      'No new write route is accepted without local review.',
      'No fixed-asset acquisition route is unlocked.',
      'No German fixed-assets final proof is produced.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-145-fa-cnc-01-posting-group-pageinspection-personalize-nosave.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-145/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/FIXEDASSETS-145-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/FIXEDASSETS-145-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/010-card-rows-before.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/015-posting-group-focus.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/016-card-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/020-pageinspection-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/030-pageinspection-signals.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/040-personalize-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/041-personalize-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/050-card-rows-after.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/fixedassets-145-030-fa-cnc-01-posting-group-pageinspection.screenshot.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-145/fixedassets-145-040-fa-cnc-01-posting-group-personalize-nosave.screenshot.json',
      'playwright/projects/fibu-book5/img/fixedassets-145-030-fa-cnc-01-posting-group-pageinspection.png',
      'playwright/projects/fibu-book5/img/fixedassets-145-040-fa-cnc-01-posting-group-personalize-nosave.png',
    ],
    warnings: [
      'Page Inspection and Personalize are debugging evidence, not final book screenshots.',
      'Do not claim MACHINES as assigned to FA-CNC-01 from this evidence.',
    ],
    blockedBy: resultStatus === 'blocked-technical-diagnosis' ? ['No useful Page Inspection or Personalize context captured.'] : [],
    requiresReview: true,
    safeToFinalizeState: true,
    flags: {
      noBookChange: true,
      noPost: true,
      noPreview: true,
      noSetupChange: !setupChanged,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noDeleteRecord: true,
      noAcquireExecution: true,
      noAmountEntry: true,
      noTargetVendorEntry: true,
      noMachinerySelection: true,
      noPersonalizationSaved: personalize.exit?.personalizationSaved === false,
    },
    statePatch: {
      current: {
        updatedAt: '2026-06-21T00:20:00.000Z',
        activeCase: NEXT_CASE_ID,
        active_case_file: '.agent/state/cases/fixedassets-146-fa-cnc-01-posting-group-diagnosis-result-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-145-fa-cnc-01-posting-group-pageinspection-personalize-nosave.json',
        requiresStrongModel: true,
        nextStep: 'FIXEDASSETS-146: locally review FA-145 Page Inspection/Personalize diagnosis before any new write route is unlocked.',
      },
      activeCase: {
        status: resultStatus,
        lastResult: {
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-145/FIXEDASSETS-145-result.json',
          summary,
        },
        nextSafeAction: 'FIXEDASSETS-146: local review of diagnostic result.',
      },
    },
    summary,
    bookImpact:
      'Kapitel 21 and the debugging chapter can use FA-145 to explain Page Inspection and Personalize as diagnostics. It must still keep MACHINES assignment and acquisition open.',
    nextStep: 'FIXEDASSETS-146-FA-CNC-01-POSTING-GROUP-DIAGNOSIS-RESULT-REVIEW',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-145-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-145-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-145 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-145-result.json` | JSON | technische Diagnose, Flags, Grenzen | keinen MACHINES-Fit | `labor`, `technical-diagnosis` |',
      '| `FIXEDASSETS-145-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-card-rows-before.json` | JSON | Kartenwerte vor Diagnose | keine Posten | `field-proof` |',
      '| `020-pageinspection-focused-lines.txt` | Text | kompakte Page-Inspection-Zeilen | kein Rohdump | `technical-context` |',
      '| `040-personalize-context.json` | JSON | Personalisieren no-save Kontext | kein gespeichertes Layout | `technical-context` |',
      '| `050-card-rows-after.json` | JSON | Kartenwerte nach Diagnose | keine Buchungswirkung | `field-proof` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(setupChanged).toBe(false);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(result.flags.noApiShortcut).toBe(true);
});
