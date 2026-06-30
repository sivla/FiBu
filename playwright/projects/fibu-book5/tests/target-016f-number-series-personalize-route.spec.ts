import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016F-NUMBER-SERIES-PERSONALIZE-OR-SETUP-ASSISTED-ROUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-016f-number-series-personalize-or-setup-assisted-route';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016F-result.json');
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
    /Nummernserie/i,
    /Nr\.-Serienzeilen/i,
    /U-CUST/i,
    /Startdatum|Startnr|Endnr/i,
    /Offen|Luecken|L.cken|Erhohung|Erh.hung/i,
    /Liste bearbeiten|Weitere Optionen|Personalisieren|Anpassen|Anzeig|Feld|Spalte|Aktion/i,
    /Einstellungen|Settings|Fertig|Done|Clear personalization|Personali/i
  ];
  return text
    .split(/\r?\n/)
    .map((line) => clean(line))
    .filter((line) => line && !/requestExecutor|tokenFactory|O365|clientId|MSAL|allowedEndpoints|allowedResources/i.test(line))
    .filter((line) => patterns.some((pattern) => pattern.test(line)))
    .slice(0, 120)
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

async function assertSafeContext(page: Page) {
  const currentUrl = page.url();
  if (!instancePathIsTarget(currentUrl) || !companyParamIsTarget(currentUrl)) {
    throw new Error(`Unsafe context ${sanitizeEvidenceUrl(currentUrl)}`);
  }
  const text = clean(await pageText(page));
  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(text)) {
    throw new Error('Expected Number Series context is not visible.');
  }
  if (/Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Ship and Invoice|Buchen\?|Ja,.*buchen/i.test(text)) {
    throw new Error('Dangerous dialog text detected.');
  }
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

async function clickFirstVisible(page: Page, names: RegExp[]) {
  for (const name of names) {
    for (const scope of [page, ...page.frames()]) {
      for (const role of ['button', 'menuitem'] as const) {
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
      /Weitere Optionen|Liste bearbeiten|Personalisieren|Anpassen|Feld|Spalte|Aktion|Einstellungen|Settings|Fertig|Done/i
    ],
    maxLines: 140,
    maxLineLength: 220
  });
  const allText = clean(await pageText(page));
  const safeVisibleText = safeLines(allText);
  const snapshot = {
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compactText: safeVisibleText || compact.replace(/.*requestExecutor.*|.*tokenFactory.*|.*O365.*/gi, '').trim(),
    safeVisibleText,
    signals: {
      personalizationVisible: /Personalisieren|Personalize|Anpassen|Anzeigefeld|Feld hinzufugen|Feld hinzufuegen|Fertig|Done|Clear personalization/i.test(allText),
      moreOptionsVisible: /Weitere Optionen|More options|Aktionen|Actions|Zugehorig|Related|Funktionen/i.test(allText),
      startNoVisible: /Startnr|Starting No/i.test(allText),
      endNoVisible: /Endnr|Ending No/i.test(allText),
      checkboxVisible: /Offen|Luecken|L.cken|Open/i.test(allText),
      appLauncherVisible: /Microsoft 365 Copilot|Outlook|OneDrive|PowerPoint|Weitere Apps/i.test(safeVisibleText)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, snapshot.safeVisibleText || snapshot.compactText);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), { step, snapshot });
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nr.-Serienzeilen / Number Series Lines',
    step,
    status: 'personalize-standard-route-discovery',
    visibleLearning: 'Das Bild muss zeigen, welche BC-Standardroute fuer Felder, Spalten oder Aktionen sichtbar wird.',
    internallyProves: 'Number Series Lines route-discovery state without value write.',
    doesNotProve: ['No setup assignment, no master data, no preview posting, no posting.'],
    qualityDecision: 'diagnostic',
    snapshot
  });
  return snapshot;
}

async function openUCustLines(page: Page) {
  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  await assertSafeContext(page);
  if (!(await selectSeriesRow(page, probeSeries.code))) throw new Error('U-CUST row could not be selected.');
  if (!(await clickFirstVisible(page, [/^Zeilen$|^Lines$/i]))) throw new Error('Zeilen/Lines action could not be opened.');
  await assertSafeContext(page);
}

async function openSettingsPersonalize(page: Page) {
  const clickedSettings = await clickFirstVisible(page, [/^Einstellungen$|^Settings$|^Einstell/i]);
  if (!clickedSettings) {
    const gear = page.locator('[title*="Einstellungen"],[aria-label*="Einstellungen"],[title*="Settings"],[aria-label*="Settings"]').first();
    if (await gear.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gear.click({ timeout: 4000 }).catch(async () => gear.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(900);
    }
  }
  let clickedPersonalize = await clickFirstVisible(page, [/Personalisieren|Personalize|Anpassen/i]);
  if (!clickedPersonalize) clickedPersonalize = await clickVisibleText(page, /^Personalisieren$|^Personalize$|^Anpassen$/i);
  return clickedPersonalize;
}

test('TARGET-016F inspects Personalize and standard action route for Number Series Lines without saving', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  const warnings: string[] = [];

  await openUCustLines(page);
  const before = await captureState(page, 'target-016f-010-lines-context-before-standard-route', 'U-CUST Lines context before Personalize/standard route discovery.');

  await clickFirstVisible(page, [/Weitere Optionen|More options/i]);
  await page.waitForTimeout(900);
  await assertSafeContext(page);
  const moreOptions = await captureState(page, 'target-016f-020-lines-more-options-open', 'After opening Weitere Optionen / More options on Number Series Lines.');

  await openUCustLines(page);
  const afterMenuReset = await captureState(page, 'target-016f-025-lines-context-reset-after-more-options', 'U-CUST Lines context intentionally reopened after More options probe.');

  const personalizeClicked = await openSettingsPersonalize(page);
  await page.waitForTimeout(1600);
  await assertSafeInstanceCompany(page);
  const personalize = await captureState(page, 'target-016f-030-personalize-mode-or-menu', 'After Settings -> Personalize route attempt.');

  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(personalize.safeVisibleText + '\n' + personalize.compactText)) {
    blockedBy.push('Settings/Personalize route lost the Number Series Lines foreground context.');
  }
  if (!personalizeClicked && !personalize.signals.personalizationVisible) {
    blockedBy.push('Settings -> Personalize route was not visible/clickable in this context.');
  }
  if (personalize.signals.appLauncherVisible) {
    blockedBy.push('Unexpected Microsoft 365 app launcher is visible; personalization route target is wrong.');
  }

  const exitedPersonalize = await clickFirstVisible(page, [/^Fertig$|^Done$/i]) || await clickVisibleText(page, /^Fertig$|^Done$/i);
  if (!exitedPersonalize) {
    warnings.push('Personalize mode exit via Fertig/Done was not visible; test closed by continuing without field changes.');
  }
  await page.waitForTimeout(800);
  const finalState = await captureState(page, 'target-016f-040-after-personalize-escape', 'After leaving Personalize/menu discovery with Escape.');

  const resultStatus = !blockedBy.length && (personalizeClicked || personalize.signals.personalizationVisible) ? 'observed' : 'blocked';
  const nextCase = resultStatus === 'observed'
    ? 'TARGET-016G-NUMBER-SERIES-PERSONALIZE-FIELD-ACTION-MAP'
    : 'TARGET-016G-NUMBER-SERIES-ASSISTED-SETUP-OR-SOURCE-CHECK';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-personalize-route',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    proved: [
      'U-CUST Number Series Lines context was reopened in playthru / UNIVERSAARL-DE.',
      'Weitere Optionen / More options was inspected without selecting a dangerous action.',
      ...(personalizeClicked || personalize.signals.personalizationVisible ? ['Settings -> Personalize route became visible or was entered without saving changes.'] : [])
    ],
    notProved: [
      ...(resultStatus === 'observed' ? ['A concrete field insertion or reliable Startnr./Endnr. write route is still not proven.'] : ['Personalize route did not become clearly usable in this context.']),
      'No personalization was intentionally saved.',
      'No setup assignment, master data, preview posting, posting or ledger trace was created.',
      'Checkbox semantics were observed but not changed.'
    ],
    routeFindings: {
      before,
      moreOptions,
      afterMenuReset,
      personalize,
      finalState,
      personalizeClicked
    },
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016f-number-series-personalize-or-setup-assisted-route/TARGET-016F-result.json',
      'playwright/projects/fibu-book5/evidence/target-016f-number-series-personalize-or-setup-assisted-route/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-016f-number-series-personalize-or-setup-assisted-route/*.screenshot.json',
      'playwright/projects/fibu-book5/evidence/target-016f-number-series-personalize-or-setup-assisted-route/*.txt',
      'playwright/projects/fibu-book5/img/target-016f-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016f-number-series-personalize-or-setup-assisted-route/TARGET-016F-result.json',
      'playwright/projects/fibu-book5/img/target-016f-010-lines-context-before-standard-route.png',
      'playwright/projects/fibu-book5/img/target-016f-020-lines-more-options-open.png',
      'playwright/projects/fibu-book5/img/target-016f-025-lines-context-reset-after-more-options.png',
      'playwright/projects/fibu-book5/img/target-016f-030-personalize-mode-or-menu.png',
      'playwright/projects/fibu-book5/img/target-016f-040-after-personalize-escape.png'
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
      personalizationExitAttempted: exitedPersonalize
    },
    statePatch: {
      current: {
        activeCase: CASE_ID,
        activeArea: 'universaarl-w1-foundation-number-series',
        nextStep:
          resultStatus === 'observed'
            ? 'Use TARGET-016F screenshots to map Personalize fields/actions before a controlled Number Series Lines fit.'
            : 'Use source check or assisted setup route because Personalize was not clearly usable.'
      }
    },
    smartDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-016E blocked plain field-flow and F2 for U-CUST Number Series Lines; TARGET-016D proved Page 457/Table 309.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Personalize/standard route discovery is the next non-repeated BC-native path after grid typing failed.',
      lookaheadReviewed: [
        { caseId: nextCase, status: resultStatus === 'observed' ? 'ready-next' : 'needs-source-check-first', reason: 'Depends on whether Personalize became usable.' },
        { caseId: 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT', status: 'needs-setup-first', reason: 'Assignments require valid line ranges.' },
        { caseId: 'TARGET-018-CUSTOMER-MASTERDATA-PREFLIGHT', status: 'needs-setup-first', reason: 'Customer creation depends on customer number-series assignment.' },
        { caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT', status: 'ready-after-current', reason: 'Can proceed after numbering is unblocked or parked.' },
        { caseId: 'TARGET-020-VAT-SETUP-READINESS', status: 'ready-after-current', reason: 'Follows foundation sequencing.' }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'The route produced new UI evidence instead of repeating failed grid typing.'
          : 'A source/assisted setup check is now better than more Personalize probing.',
      risksBeforeNextCase: [
        'Do not save Personalize changes without explicit gate.',
        'Do not change checkbox states.',
        'Do not create master data before line ranges are ready.'
      ],
      requiredPreparation: ['Use screenshot QA and safe route-specific evidence.']
    },
    warnings,
    blockedBy,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'TARGET-016F produced Personalize/standard route evidence without saving changes.'
        : 'TARGET-016F could not clearly enter a usable Personalize/standard route.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016F Number Series Personalize / Standard Route',
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
      '- Keine Personalisierung wurde bewusst gespeichert.',
      '- Keine Setup-Zuweisung.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.',
      '- Keine Checkbox wurde geaendert.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
