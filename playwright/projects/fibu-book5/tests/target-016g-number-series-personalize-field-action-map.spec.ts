import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016G-NUMBER-SERIES-PERSONALIZE-FIELD-ACTION-MAP';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-016g-number-series-personalize-field-action-map';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016G-result.json');
const probeSeries = { code: 'U-CUST' };

function buildPlaythruUrl(pageId = 456) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeEvidenceUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const sanitizedPath = url.pathname.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
      '/{tenant}/'
    );
    const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
    for (const key of ['page', 'company', 'profile']) {
      const value = url.searchParams.get(key);
      if (value) kept.searchParams.set(key, value);
    }
    return kept.toString();
  } catch {
    return rawUrl.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant}');
  }
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE.toLowerCase());
}

function codePattern(code: string) {
  return new RegExp(`\\b${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
}

function safeLines(text: string) {
  const patterns = [
    /Nummernserie|Nr\.-Serienzeilen|No\. Series/i,
    /U-CUST/i,
    /Startdatum|Startnr|Endnr|Letzte Nr|Warnungsnr/i,
    /Offen|Luecken|L.cken|Erhohung|Erh.hung|Inkrement/i,
    /Personalisieren|Wird personalisiert|Fertig|Feld|Spalte|Aktion|Ausblenden|Verschieben|Anzeigen/i,
    /Hinzufugen|Hinzufuegen|Add field|Clear personalization|Personalisierung loschen/i,
    /Einstellungen|Settings|Liste bearbeiten|Zeilen/i
  ];
  return text
    .split(/\r?\n/)
    .map((line) => clean(line))
    .filter((line) => line && !/requestExecutor|tokenFactory|O365|clientId|MSAL|allowedEndpoints|allowedResources|authorization/i.test(line))
    .filter((line) => patterns.some((pattern) => pattern.test(line)))
    .slice(0, 160)
    .join('\n');
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function assertSafeInstanceCompany(page: Page) {
  const currentUrl = page.url();
  if (!instancePathIsTarget(currentUrl) || !companyParamIsTarget(currentUrl)) {
    throw new Error(`Unsafe context ${sanitizeEvidenceUrl(currentUrl)}`);
  }
  const text = clean(await pageText(page));
  if (/Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Ship and Invoice|Buchen\?|Ja,.*buchen/i.test(text)) {
    throw new Error('Dangerous dialog text detected.');
  }
}

async function assertNumberSeriesContext(page: Page) {
  await assertSafeInstanceCompany(page);
  const text = clean(await pageText(page));
  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(text)) {
    throw new Error('Expected Number Series context is not visible.');
  }
}

async function clickFirstVisible(page: Page, names: RegExp[]) {
  for (const name of names) {
    for (const scope of [page, ...page.frames()]) {
      for (const role of ['button', 'menuitem', 'link'] as const) {
        const locator = scope.getByRole(role, { name }).first();
        if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
          await locator.click({ timeout: 4000 }).catch(async () => locator.click({ timeout: 4000, force: true }));
          await page.waitForTimeout(900);
          return true;
        }
      }
    }
  }
  return false;
}

async function clickVisibleText(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const candidates = await scope.getByText(name).all();
    for (const candidate of candidates) {
      if (await candidate.isVisible({ timeout: 500 }).catch(() => false)) {
        await candidate.click({ timeout: 4000 }).catch(async () => candidate.click({ timeout: 4000, force: true }));
        await page.waitForTimeout(900);
        return true;
      }
    }
  }
  return false;
}

async function selectSeriesRow(page: Page, code: string) {
  for (const scope of [page, ...page.frames()]) {
    const row = scope.getByRole('row', { name: codePattern(code) }).first();
    if (await row.isVisible({ timeout: 800 }).catch(() => false)) {
      await row.click({ timeout: 4000 }).catch(async () => row.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
    const text = scope.getByText(codePattern(code)).first();
    if (await text.isVisible({ timeout: 800 }).catch(() => false)) {
      await text.click({ timeout: 4000 }).catch(async () => text.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
  }
  return false;
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [
      /Nr\.-Serienzeilen|Nummernserie|U-CUST|Startdatum|Startnr|Endnr|Letzte Nr|Warnungsnr|Erhohung|Erh.hung|Luecken|L.cken|Offen/i,
      /Personalisieren|Wird personalisiert|Fertig|Feld|Spalte|Aktion|Hinzufugen|Hinzufuegen|Add field|Ausblenden|Verschieben/i
    ],
    maxLines: 180,
    maxLineLength: 240
  });
  const allText = clean(await pageText(page));
  const safeVisibleText = safeLines(allText);
  const controls = await collectControlLabels(page);
  const snapshot = {
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compactText: safeVisibleText || compact.replace(/.*requestExecutor.*|.*tokenFactory.*|.*O365.*/gi, '').trim(),
    safeVisibleText,
    controls,
    signals: {
      personalizationModeVisible: /Wird personalisiert|Personalizing|Fertig|Done/i.test(allText),
      addFieldVisible: /Feld.*hinzuf|Add field/i.test(allText),
      startNoVisible: /Startnr|Starting No/i.test(allText),
      endNoVisible: /Endnr|Ending No/i.test(allText),
      checkboxVisible: /Offen|Luecken|L.cken|Open/i.test(allText),
      savePersonalizationVisible: /Speichern|Save/i.test(allText),
      appLauncherVisible: /Microsoft 365 Copilot|Outlook|OneDrive|PowerPoint|Weitere Apps/i.test(safeVisibleText)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, snapshot.safeVisibleText || snapshot.compactText);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), { step, snapshot });
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nr.-Serienzeilen / Number Series Lines',
    step,
    status: 'personalize-field-action-map',
    visibleLearning: 'Das Bild muss zeigen, welche Felder, Buttons oder Personalisieren-Elemente wirklich sichtbar sind.',
    internallyProves: 'Number Series Lines personalization inspection without saving changes.',
    doesNotProve: ['No setup assignment, no master data, no preview posting, no posting.'],
    qualityDecision: 'diagnostic',
    snapshot
  });
  return snapshot;
}

async function collectControlLabels(page: Page) {
  const found = new Set<string>();
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'link', 'checkbox', 'textbox'] as const) {
      const locators = await scope.getByRole(role).all().catch(() => []);
      for (const locator of locators.slice(0, 80)) {
        if (!(await locator.isVisible({ timeout: 100 }).catch(() => false))) continue;
        const label = clean(
          (await locator.getAttribute('aria-label').catch(() => null)) ??
            (await locator.getAttribute('title').catch(() => null)) ??
            (await locator.textContent().catch(() => null)) ??
            ''
        );
        if (
          label &&
          /Personalisieren|Wird personalisiert|Fertig|Feld|Spalte|Aktion|Hinzufugen|Hinzufuegen|Add field|Startnr|Endnr|Offen|Luecken|Zeilen|Liste bearbeiten/i.test(label)
        ) {
          found.add(`${role}: ${label}`.slice(0, 180));
        }
      }
    }
  }
  return [...found].slice(0, 80);
}

async function openUCustLines(page: Page) {
  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  await assertNumberSeriesContext(page);
  if (!(await selectSeriesRow(page, probeSeries.code))) throw new Error('U-CUST row could not be selected.');
  if (!(await clickFirstVisible(page, [/^Zeilen$|^Lines$/i]))) throw new Error('Zeilen/Lines action could not be opened.');
  await assertNumberSeriesContext(page);
}

async function enterPersonalize(page: Page) {
  const clickedSettings = await clickFirstVisible(page, [/^Einstellungen$|^Settings$|^Einstell/i]);
  if (!clickedSettings) {
    const gear = page.locator('[title*="Einstellungen"],[aria-label*="Einstellungen"],[title*="Settings"],[aria-label*="Settings"]').first();
    if (await gear.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gear.click({ timeout: 4000 }).catch(async () => gear.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(900);
    }
  }
  const clickedPersonalize =
    (await clickFirstVisible(page, [/Personalisieren|Personalize|Anpassen/i])) ||
    (await clickVisibleText(page, /^Personalisieren$|^Personalize$|^Anpassen$/i));
  await page.waitForTimeout(1600);
  await assertSafeInstanceCompany(page);
  return clickedPersonalize;
}

async function hoverImportantPersonalizeControls(page: Page) {
  const hovered: string[] = [];
  const names = [/Fertig|Done/i, /Feld.*hinzuf|Add field/i, /Startnr|Starting No/i, /Endnr|Ending No/i, /Offen|Open/i, /Luecken|L.cken|Gaps/i];
  for (const name of names) {
    let didHover = false;
    for (const scope of [page, ...page.frames()]) {
      const candidates = [
        scope.getByRole('button', { name }).first(),
        scope.getByRole('columnheader', { name }).first(),
        scope.getByText(name).first()
      ];
      for (const candidate of candidates) {
        if (await candidate.isVisible({ timeout: 300 }).catch(() => false)) {
          await candidate.hover({ timeout: 3000 }).catch(() => undefined);
          await page.waitForTimeout(450);
          hovered.push(String(name));
          didHover = true;
          break;
        }
      }
      if (didHover) break;
    }
  }
  return hovered;
}

test('TARGET-016G maps Number Series Lines Personalize fields/actions without saving changes', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  const warnings: string[] = [];

  await openUCustLines(page);
  const before = await captureState(page, 'target-016g-010-lines-context-before-personalize-map', 'U-CUST Lines context before Personalize field/action mapping.');

  const personalizeClicked = await enterPersonalize(page);
  const enteredPersonalize = await captureState(page, 'target-016g-020-personalize-mode-field-action-map', 'Personalize mode on Number Series Lines.');

  if (!personalizeClicked && !enteredPersonalize.signals.personalizationModeVisible) {
    blockedBy.push('Personalize mode did not become visible on Number Series Lines.');
  }
  if (enteredPersonalize.signals.appLauncherVisible) {
    blockedBy.push('Unexpected Microsoft 365 app launcher is visible; target context is wrong.');
  }

  const hoveredControls = await hoverImportantPersonalizeControls(page);
  const afterHover = await captureState(page, 'target-016g-030-personalize-hover-tooltip-map', 'Tooltip/hover map for visible Personalize and Number Series Lines controls.', {
    hoveredControls
  });

  const addFieldOpened =
    (await clickFirstVisible(page, [/Feld.*hinzuf|Feld.*anzeigen|Add field|Show field/i])) ||
    (await clickVisibleText(page, /Feld.*hinzuf|Feld.*anzeigen|Add field|Show field/i));
  let addFieldPanel = null;
  if (addFieldOpened) {
    await page.waitForTimeout(1300);
    await assertSafeInstanceCompany(page);
    addFieldPanel = await captureState(page, 'target-016g-040-add-field-panel-no-selection', 'Field-add/personalization panel opened without selecting a field.', {
      fieldPanelOpened: true
    });
  } else {
    warnings.push('No visible Add field / Feld hinzufuegen entry was safely clickable in this personalization context.');
  }

  const exitedPersonalize = (await clickFirstVisible(page, [/^Fertig$|^Done$/i])) || (await clickVisibleText(page, /^Fertig$|^Done$/i));
  if (!exitedPersonalize) {
    warnings.push('Personalize exit via Fertig/Done was not visible; no changes were made, but exit proof is weaker.');
  }
  await page.waitForTimeout(900);
  const afterExit = await captureState(page, 'target-016g-050-after-personalize-field-map-exit', 'After leaving Personalize field/action mapping with no saved changes.');

  const mappedFieldSignals = [
    enteredPersonalize.signals.startNoVisible || afterHover.signals.startNoVisible || Boolean(addFieldPanel?.signals?.startNoVisible),
    enteredPersonalize.signals.endNoVisible || afterHover.signals.endNoVisible || Boolean(addFieldPanel?.signals?.endNoVisible),
    enteredPersonalize.signals.checkboxVisible || afterHover.signals.checkboxVisible || Boolean(addFieldPanel?.signals?.checkboxVisible)
  ].filter(Boolean).length;

  const resultStatus = !blockedBy.length && enteredPersonalize.signals.personalizationModeVisible ? 'observed' : 'blocked';

  const nextCase =
    resultStatus === 'observed' && addFieldOpened
      ? 'TARGET-016H-NUMBER-SERIES-LINES-VALUE-ENTRY-ROUTE-DECISION'
      : 'TARGET-016H-NUMBER-SERIES-SOURCE-OR-ASSISTED-SETUP-ROUTE';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-personalize-field-action-map',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    proved: [
      'U-CUST Number Series Lines context was reopened in playthru / UNIVERSAARL-DE.',
      ...(enteredPersonalize.signals.personalizationModeVisible ? ['Personalize mode on Nr.-Serienzeilen was visible.'] : []),
      'Visible Number Series Lines fields/actions were screenshot-mapped without saving personalization changes.',
      ...(addFieldOpened ? ['The field-add/personalization panel was opened without selecting or adding a field.'] : [])
    ],
    notProved: [
      'A reliable persistent Startnr./Endnr. write route is still not proven.',
      'No field was added, removed or moved in Personalize mode.',
      'No setup assignment, master data, preview posting, posting or ledger trace was created.',
      'Checkbox behavior was observed as UI context but no checkbox value was changed.'
    ],
    fieldActionMap: {
      before,
      enteredPersonalize,
      afterHover,
      addFieldOpened,
      addFieldPanel,
      afterExit,
      mappedFieldSignals,
      controls: {
        before: before.controls,
        personalize: enteredPersonalize.controls,
        hover: afterHover.controls,
        addFieldPanel: addFieldPanel?.controls ?? [],
        afterExit: afterExit.controls
      }
    },
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016g-number-series-personalize-field-action-map/TARGET-016G-result.json',
      'playwright/projects/fibu-book5/evidence/target-016g-number-series-personalize-field-action-map/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-016g-number-series-personalize-field-action-map/*.screenshot.json',
      'playwright/projects/fibu-book5/evidence/target-016g-number-series-personalize-field-action-map/*.txt',
      'playwright/projects/fibu-book5/img/target-016g-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016g-number-series-personalize-field-action-map/TARGET-016G-result.json',
      'playwright/projects/fibu-book5/img/target-016g-010-lines-context-before-personalize-map.png',
      'playwright/projects/fibu-book5/img/target-016g-020-personalize-mode-field-action-map.png',
      'playwright/projects/fibu-book5/img/target-016g-030-personalize-hover-tooltip-map.png',
      ...(addFieldOpened ? ['playwright/projects/fibu-book5/img/target-016g-040-add-field-panel-no-selection.png'] : []),
      'playwright/projects/fibu-book5/img/target-016g-050-after-personalize-field-map-exit.png'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookChange: true,
      noSetupAssignment: true,
      checkboxChanged: false,
      setupChanged: false,
      personalizationSaved: false,
      personalizationChangesMade: false,
      personalizationExitAttempted: exitedPersonalize,
      addFieldPanelOpenedWithoutSelection: addFieldOpened
    },
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file:
          nextCase === 'TARGET-016H-NUMBER-SERIES-SOURCE-OR-ASSISTED-SETUP-ROUTE'
            ? '.agent/state/cases/target-016h-number-series-source-or-assisted-setup-route.json'
            : '.agent/state/cases/target-016h-number-series-lines-value-entry-route-decision.json',
        activeArea: 'universaarl-w1-foundation-number-series',
        nextStep:
          resultStatus === 'observed'
            ? 'Use TARGET-016G Personalize field/action map to decide the next controlled Number Series route; source-backed or Assisted Setup route is preferred if no Add field panel was visible.'
            : 'Use source check or assisted setup route because Personalize field/action mapping was blocked.'
      }
    },
    smartDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-016F proved Settings -> Personalisieren enters Nr.-Serienzeilen personalization mode and exits via Fertig without changes.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The next non-repeated step is to map fields/actions in the now-proven Personalize mode before any write attempt.',
      lookaheadReviewed: [
        { caseId: nextCase, status: resultStatus === 'observed' ? 'ready-next' : 'needs-source-check-first', reason: 'Depends on whether Personalize exposes useful field/action affordances.' },
        { caseId: 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT', status: 'needs-setup-first', reason: 'Assignments require valid line ranges.' },
        { caseId: 'TARGET-018-CUSTOMER-MASTERDATA-PREFLIGHT', status: 'needs-setup-first', reason: 'Customer creation depends on customer number-series assignment.' },
        { caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT', status: 'ready-after-current', reason: 'Can proceed after numbering is unblocked or consciously parked.' },
        { caseId: 'TARGET-020-VAT-SETUP-READINESS', status: 'ready-after-current', reason: 'Follows foundation sequencing.' }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'TARGET-016G adds field/action UI knowledge without changing setup and avoids repeating failed grid typing.'
          : 'A source/assisted setup route is safer than more Personalize probing after a blocked map.',
      risksBeforeNextCase: [
        'Do not save Personalize changes without explicit gate.',
        'Do not change checkbox states.',
        'Do not create master data before line ranges are ready.'
      ],
      requiredPreparation: ['Review TARGET-016G screenshots and decide route based on visible field/action affordances.']
    },
    warnings,
    blockedBy,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'TARGET-016G mapped Number Series Lines Personalize field/action affordances without saving changes.'
        : 'TARGET-016G could not safely map Personalize field/action affordances.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016G Number Series Personalize Field/Action Map',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenze',
      '',
      '- Keine Personalisierung wurde gespeichert.',
      '- Kein Feld wurde hinzugefuegt, entfernt oder verschoben.',
      '- Keine Setup-Zuweisung.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.',
      '- Keine Checkbox wurde geaendert.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
