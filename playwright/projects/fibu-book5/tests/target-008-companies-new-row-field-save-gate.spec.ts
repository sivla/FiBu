import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-008-COMPANIES-NEW-ROW-FIELD-SAVE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const EVIDENCE_ID = 'target-008-companies-new-row-field-save-gate';
const PROJECT = 'fibu-book5';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-008-result.json');

type UiCandidate = {
  label: string;
  text: string;
  ariaLabel: string;
  title: string;
  role: string;
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
  clickX: number;
  clickY: number;
};

function buildPlaythruUrl(pageId = 357) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.delete('company');
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) {
      kept.searchParams.set(key, value);
    }
  }
  return kept.toString();
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const normalized = content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/(?:\n[ \t]*)+$/g, '')
    .concat('\n');
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), normalized, 'utf8');
}

async function writeScreenshotMetadata(fileName: string, value: Record<string, unknown>) {
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath: path.resolve('playwright/projects/fibu-book5/img', fileName),
    ...value
  });
}

async function collectControls(page: Page, pattern: RegExp) {
  const controls: UiCandidate[] = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate((source) => {
        const pattern = new RegExp(source, 'i');
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,input,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const role = normalize(element.getAttribute('role'));
            const label = [text, ariaLabel, title].filter(Boolean).join(' | ');
            return {
              label,
              text,
              ariaLabel,
              title,
              role,
              tag: element.tagName.toLowerCase(),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              clickX: Math.round(rect.x + rect.width / 2),
              clickY: Math.round(rect.y + rect.height / 2)
            };
          })
          .filter((entry) => pattern.test(entry.label))
          .slice(0, 120);
      }, pattern.source)
      .catch(() => []);
    controls.push(...entries);
  }
  return controls;
}

async function findNewDropdown(page: Page) {
  const candidates = await collectControls(page, /Verwandte Aktionen f.r Neu|Related actions for New|Neu/i);
  const accessible = candidates.find(
    (entry) => /Verwandte Aktionen f.r Neu|Related actions for New/i.test(entry.label) && entry.y >= 90
  );
  const geometric = candidates.find(
    (entry) =>
      entry.y >= 90 &&
      entry.y <= 140 &&
      entry.x >= 520 &&
      entry.x <= 590 &&
      entry.width <= 40 &&
      entry.height >= 20 &&
      entry.height <= 50
  );
  return (
    accessible ??
    geometric ??
    ({
      label: 'geometry-fallback-splitbutton-next-to-Neu-from-target-007-screenshot-qa',
      text: '',
      ariaLabel: '',
      title: '',
      role: 'geometry-fallback',
      tag: 'coordinate',
      x: 568,
      y: 101,
      width: 24,
      height: 28,
      clickX: 580,
      clickY: 111
    } satisfies UiCandidate)
  );
}

async function clickCreateNewCompanyMenuItem(page: Page) {
  const exact = page.getByRole('menuitem', { name: /Neues Unternehmen erstellen|Create New Company/i });
  const exactCount = await exact.count().catch(() => 0);
  for (let index = 0; index < exactCount; index += 1) {
    const item = exact.nth(index);
    if (await item.isVisible({ timeout: 500 }).catch(() => false)) {
      await item.click({ timeout: 3000 });
      await page.waitForTimeout(4000);
      return { clicked: true, route: 'menuitem', label: clean(await item.innerText().catch(() => '')) };
    }
  }

  const textItem = page.getByText(/Neues Unternehmen erstellen|Create New Company/i).first();
  if (await textItem.isVisible({ timeout: 500 }).catch(() => false)) {
    await textItem.click({ timeout: 3000 });
    await page.waitForTimeout(4000);
    return { clicked: true, route: 'text', label: clean(await textItem.innerText().catch(() => '')) };
  }

  const coordinateCandidates = await collectControls(page, /Neues Unternehmen erstellen|Create New Company/i);
  const coordinate = coordinateCandidates.find((entry) => entry.y >= 80 && entry.y <= 260 && entry.x >= 450 && entry.x <= 850);
  if (coordinate) {
    await page.mouse.click(coordinate.clickX, coordinate.clickY + Math.round(coordinate.height * 0.7));
    await page.waitForTimeout(5000);
    return { clicked: true, route: 'coordinate-menuitem-lower-half', label: clean(coordinate.label) };
  }

  return { clicked: false, route: 'not-visible', label: '' };
}

function sourceDecisionCard() {
  return {
    currentCase: CASE_ID,
    decision: 'Use Companies / Mandanten -> Neu dropdown -> Neues Unternehmen erstellen as the official route gate.',
    sourceBasis: [
      {
        source: 'Microsoft Learn: Create new companies in Business Central',
        url: 'https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company',
        relevantClaim:
          'The Create New Company assisted setup guide is available from the Companies page and from the Company field lookup in My Settings.'
      },
      {
        source: 'Microsoft Learn template options',
        url: 'https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company',
        relevantClaim:
          'Production - Setup Data Only creates setup data without sample data; Create New - No Data creates a blank company.'
      }
    ],
    rejectedAlternatives: [
      'Kopieren / Copy because it uses an existing company as basis.',
      'Testunternehmen / demo / sample data because Universaarl must not inherit demo master data.',
      'Direct unsaved list row save until BC UI proves the row fields and save behavior clearly.',
      'API shortcut because the book needs a UI-first click path.'
    ],
    selectedRoute:
      'Open the wizard route only. Do not click Next, Finish, Create, OK or Save until field mapping and data basis are visible and documented.',
    risk:
      'The wizard might offer an unsafe copy/demo route or a finish button before the data basis is understood.',
    stopRule:
      'Stop after the wizard/context screenshot. If any error, dialog or unclear route appears, write blocker evidence and do not create a company.'
  };
}

test('TARGET-008 opens the official new company route gate from Mandanten without finishing it', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();
  const companiesUrl = buildPlaythruUrl(357);
  const decisionCard = sourceDecisionCard();

  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  expect(page.url(), 'TARGET-008 must stay in playthru.').toMatch(/playthru/i);

  const beforeFullText = clean(await pageText(page));
  const targetAlreadyVisible = /UNIVERSAARL-DE|Universaarl GmbH/i.test(beforeFullText);
  const beforeText = clean(
    await compactPageText(page, {
      include: [/Mandanten|Companies|Company|Name|Anzeigename|UNIVERSAARL|CRONUS|My Company|Neu|Kopieren|Testunternehmen|Einrichtungsstatus/i],
      maxLines: 180
    })
  );

  await screenshot(page, 'target-008-010-companies-before-create-route.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: 'candidate',
    bookUse: 'preflight',
    purpose: 'Mandantenliste vor dem Oeffnen der offiziellen Neues-Unternehmen-erstellen-Route.',
    expectedPageText: [/Mandanten|Companies|Company|Neu/i],
    knownLimitations: ['Vorher-Bild; noch keine Company-Anlage.']
  });
  await writeScreenshotMetadata('target-008-010-companies-before-create-route.png', {
    status: 'candidate',
    bookUse: 'preflight',
    page: 'Mandanten / Companies, Page 357',
    instance: EXPECTED_INSTANCE,
    company: 'current shell company before UNIVERSAARL-DE exists',
    step: 'Before opening Neues Unternehmen erstellen',
    visibleLearning:
      'Die Seite Mandanten ist die zentrale Liste der Companies. Neu und der Pfeil daneben sind in der Aktionsleiste sichtbar.',
    importantUi: ['Neu', 'Pfeil neben Neu', 'Mandantenliste'],
    internallyProves: ['Page 357 opens inside playthru before any create action.'],
    doesNotProve: ['UNIVERSAARL-DE creation', 'data basis choice', 'Company Information setup'],
    qualityDecision: 'usable-preflight-screenshot',
    finalScreenshotStatus: 'german-final-candidate-preflight'
  });

  const dropdown = await findNewDropdown(page);
  let createRoute = { clicked: false, route: 'skipped', label: '' };
  let afterText = '';
  let controlsAfter: UiCandidate[] = [];
  let fullTextAfter = beforeFullText;

  if (!targetAlreadyVisible) {
    await page.mouse.click(dropdown.clickX, dropdown.clickY);
    await page.waitForTimeout(1000);
    createRoute = await clickCreateNewCompanyMenuItem(page);
    fullTextAfter = clean(await pageText(page));
    afterText = clean(
      await compactPageText(page, {
        include: [
          /Mandanten|Companies|Company|UNIVERSAARL|Neues Unternehmen erstellen|Create New Company|Production|Setup Data Only|No Data|Evaluation|Sample|Demo|CRONUS|Weiter|Next|Fertig|Finish|Erstellen|Create|Name|Anzeigename|Error|Fehler/i
        ],
        maxLines: 260
      })
    );
    controlsAfter = await collectControls(
      page,
      /Neues Unternehmen erstellen|Create New Company|Production|Setup Data|No Data|Evaluation|Sample|Demo|CRONUS|Weiter|Next|Fertig|Finish|Erstellen|Create|OK|Speichern|Save|Name|Anzeigename|Company/i
    );
  }

  const hasWizardSignal =
    /Neues Unternehmen erstellen|Create New Company|Production\s*-\s*Setup Data Only|Create New\s*-\s*No Data|Setup Data Only|No Data/i.test(
      fullTextAfter
    );
  const openedMainNewListPart = /Neu\s*-\s*Mandanten|Liste mit Titel Neu - Mandanten/i.test(fullTextAfter);
  const usableWizardSignal = hasWizardSignal && !openedMainNewListPart;
  const hasNoDataOption = /Create New\s*-\s*No Data|No Data|ohne Daten|keine Daten/i.test(fullTextAfter);
  const hasSetupOnlyOption = /Production\s*-\s*Setup Data Only|Setup Data Only|nur Setup|Einrichtungsdaten/i.test(
    fullTextAfter
  );
  const hasDemoOption = /Evaluation|Sample Data|Beispieldaten|Demo|Testunternehmen|CRONUS/i.test(fullTextAfter);
  const hasEffectiveConfirm = /Weiter|Next|Fertig|Finish|Erstellen|Create|OK|Speichern|Save/i.test(fullTextAfter);
  const errorText = /Fehler|Error|Something went wrong|nicht m.glich|not possible/i.test(fullTextAfter);

  await screenshot(page, 'target-008-020-create-new-company-route-opened.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: createRoute.clicked && usableWizardSignal ? 'candidate' : 'blocked',
    bookUse: createRoute.clicked && usableWizardSignal ? 'navigation' : 'do-not-use',
    purpose: 'Kontext nach Auswahl von Neues Unternehmen erstellen; kein Weiter/Fertig/Erstellen.',
    expectedPageText: [/Neues Unternehmen erstellen|Create New Company|Mandanten|Companies|Company/i],
    knownLimitations: ['Kein Wizard-Finish, keine Company-Anlage, kein Setup.']
  });
  await writeScreenshotMetadata('target-008-020-create-new-company-route-opened.png', {
    status: createRoute.clicked && usableWizardSignal ? 'candidate' : 'blocked',
    bookUse: createRoute.clicked && usableWizardSignal ? 'navigation' : 'do-not-use',
    page: createRoute.clicked && usableWizardSignal
      ? 'Neues Unternehmen erstellen / Create New Company context'
      : openedMainNewListPart
        ? 'Neu - Mandanten list-create part'
        : 'Companies route blocker context',
    instance: EXPECTED_INSTANCE,
    company: 'current shell company before UNIVERSAARL-DE exists',
    step: 'After selecting Neues Unternehmen erstellen',
    visibleLearning: createRoute.clicked && usableWizardSignal
      ? 'Die offizielle Company-Erstellungsroute oeffnet einen Assistenten-/Wizard-Kontext. Die Datenbasis muss vor Weiter/Fertig eindeutig gelesen werden.'
      : openedMainNewListPart
        ? 'Der Klick oeffnet die direkte Neu-Listenanlage. Das ist eine brauchbare UI-Route, aber nicht der gefuehrte Create-New-Company-Wizard.'
      : 'Die sichtbare Route konnte keinen eindeutig nutzbaren Erstellungsdialog beweisen.',
    importantUi: controlsAfter
      .map((entry) => entry.label)
      .filter(Boolean)
      .slice(0, 20),
    internallyProves: createRoute.clicked
      ? ['The visible Neues Unternehmen erstellen route was selected without finishing the wizard.']
      : ['The route could not be selected safely.'],
    doesNotProve: ['UNIVERSAARL-DE saved company', 'Company Information setup', 'final German setup'],
    qualityDecision: createRoute.clicked && usableWizardSignal ? 'usable-route-screenshot-needs-next-gate' : 'blocked-or-main-new-route-screenshot',
    finalScreenshotStatus: createRoute.clicked && usableWizardSignal ? 'german-final-candidate-preflight' : 'not-final-blocked'
  });

  const resultStatus = targetAlreadyVisible
    ? 'observed-existing'
    : createRoute.clicked && usableWizardSignal
      ? 'observed-route-opened'
      : createRoute.clicked && openedMainNewListPart
        ? 'observed-main-new-list-route'
      : 'blocked';
  const blockedBy =
    resultStatus === 'blocked'
      ? [
          createRoute.clicked ? 'wizard-context-not-proven-after-create-route-click' : 'neues-unternehmen-erstellen-menuitem-not-clickable',
          openedMainNewListPart ? 'click-opened-main-new-list-route-not-guided-create-new-company' : '',
          errorText ? 'error-visible-after-route-attempt' : ''
        ].filter(Boolean)
      : [];
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-008-COMPANIES-NEW-ROW-FIELD-SAVE-GATE',
    lastEvidenceSummary:
      'TARGET-007 proved the Neu dropdown with Neues Unternehmen erstellen visible. Microsoft Learn says the Create New Company guide is available from Companies and My Settings.',
    isPlannedNextCaseStillSensible: true,
    reason:
      'Company creation remains the prerequisite for all Universaarl setup and process cases. The official wizard route is better than repeating direct list-cell save attempts.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-009-COMPANY-CREATION-WIZARD-FIELD-DATA-BASIS-GATE',
        status: resultStatus === 'observed-route-opened'
          ? 'ready-next'
          : resultStatus === 'observed-main-new-list-route'
            ? 'replace-with-better-case'
            : 'blocked',
        reason:
          resultStatus === 'observed-route-opened'
            ? 'The route opened; next step is field/data-basis mapping before any Next/Finish.'
            : resultStatus === 'observed-main-new-list-route'
              ? 'The actual opened route is the direct Neu list part, so the next case should test controlled row values and save semantics.'
            : 'No wizard route is proven yet.'
      },
      {
        caseId: 'TARGET-004-FOUNDATION-SETUP-READINESS',
        status: 'ready-after-current',
        reason: 'Only meaningful after UNIVERSAARL-DE exists.'
      },
      {
        caseId: 'TARGET-005-NUMBER-SERIES-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Needs created company and foundation setup.'
      },
      {
        caseId: 'TARGET-006-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Posting groups depend on company and setup baseline.'
      },
      {
        caseId: 'TARGET-007-DIMENSIONS-FOUNDATION',
        status: 'ready-after-current',
        reason: 'Can follow foundation setup after company creation.'
      }
    ],
    queueChangesMade: [
      resultStatus === 'observed-route-opened'
        ? 'Insert TARGET-009 wizard field/data-basis gate before any company creation finish.'
        : resultStatus === 'observed-main-new-list-route'
          ? 'Treat the screenshot as main Neu list-route evidence; do not claim the guided route opened.'
        : 'Keep TARGET-008 blocked and require a scoped fallback route.'
    ],
    selectedNextCase:
      resultStatus === 'observed-route-opened'
        ? 'TARGET-009-COMPANY-CREATION-WIZARD-FIELD-DATA-BASIS-GATE'
        : resultStatus === 'observed-main-new-list-route'
          ? 'TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE'
        : 'TARGET-008-FALLBACK-SCOPED-COMPANY-CREATION-ROUTE',
    whySelectedNextCaseIsBest:
      resultStatus === 'observed-route-opened'
        ? 'The next risk is not navigation but wizard fields, template/data-basis choice and final confirmation.'
        : resultStatus === 'observed-main-new-list-route'
          ? 'The actual UI route is now clear: direct Neu opens an unsaved list row, so the next valuable step is controlled entry of Name and Display Name with save/error evidence.'
        : 'The official route did not produce a usable wizard, so creation must remain locked.',
    risksBeforeNextCase: [
      'Next/Finish/Create may create the company.',
      'Sample/demo routes must not become Universaarl basis.',
      'Company name cannot be changed after creation; only Display Name can.'
    ],
    requiredPreparation: [
      'Read visible wizard fields from screenshot and DOM.',
      'Prefer Production - Setup Data Only or Create New - No Data; reject sample/demo/copy.',
      'Only finish if name, display name, template and confirmation effect are unambiguous.'
    ]
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-target',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    targetCompany: TARGET_COMPANY,
    legalName: LEGAL_NAME,
    pageId: 357,
    primaryCompany: TARGET_COMPANY,
    activeCompany: 'current shell company before UNIVERSAARL-DE exists',
    sourceDecisionCards: [decisionCard],
    currentUrl: sanitizeUrl(page.url()),
    actionsTaken: [
      'Opened Companies / Mandanten page 357 in playthru.',
      targetAlreadyVisible
        ? 'Stopped because UNIVERSAARL-DE is already visible.'
        : 'Opened the Neu dropdown and attempted the visible Neues Unternehmen erstellen route.',
      'Stopped before Next, Finish, Create, OK or Save.'
    ],
    actionsNotTaken: [
      'No company was finished/created by this run.',
      'No Copy/Kopieren route.',
      'No Testunternehmen/demo/sample route selected.',
      'No CRONUS copy.',
      'No API shortcut.',
      'No company switch.',
      'No setup, posting or preview posting.'
    ],
    flags: {
      noPost: true,
      noPreviewPosting: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noTemplateCopy: true,
      noTestCompany: true,
      noCronusCopy: true,
      noWizardFinish: true,
      noCompanyCreated: true
    },
    observed: {
      companiesUrl: sanitizeUrl(companiesUrl.toString()),
      beforeText,
      afterText,
      targetAlreadyVisible,
      dropdown,
      createRoute,
      controlsAfter,
      hasWizardSignal,
      usableWizardSignal,
      openedMainNewListPart,
      hasNoDataOption,
      hasSetupOnlyOption,
      hasDemoOption,
      hasEffectiveConfirm,
      errorText,
      screenshots: [
        'playwright/projects/fibu-book5/img/target-008-010-companies-before-create-route.png',
        'playwright/projects/fibu-book5/img/target-008-020-create-new-company-route-opened.png'
      ]
    },
    proved: [
      'Companies / Mandanten page 357 opens in playthru.',
      targetAlreadyVisible
        ? 'UNIVERSAARL-DE is already visible before creation route.'
        : 'UNIVERSAARL-DE is not visible before the route attempt.',
      createRoute.clicked
        ? openedMainNewListPart
          ? 'The click opened the direct Neu list-create part, not a guided Create New Company wizard.'
          : 'The visible Neues Unternehmen erstellen route can be selected from the Neu dropdown without using search or API.'
        : 'The visible Neues Unternehmen erstellen route could not be selected safely in this run.',
      usableWizardSignal
        ? 'A Create New Company / company creation context is visible after selecting the route.'
        : 'No usable wizard context is proven after selecting the route.'
    ],
    notProved: [
      'UNIVERSAARL-DE was not created.',
      'No wizard field values were entered.',
      'No template/data-basis was selected.',
      'No Company Information or foundation setup was proven.',
      'No final German process evidence exists yet.'
    ],
    blockedBy,
    requiresReview: resultStatus !== 'observed-route-opened',
    safeToFinalizeState: true,
    statePatch: {},
    bookImpact: {
      draftOnly: true,
      beginnerTextReady: resultStatus === 'observed-route-opened',
      reason:
        'This evidence explains the route from Mandanten to the company creation wizard, but not yet the final creation step.'
    },
    nextStepDecision,
    nextStep: nextStepDecision.selectedNextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-008-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-008.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-008-010-companies-before-create-route.screenshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-008-020-create-new-company-route-opened.screenshot.json`
    ],
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:companies-new-row-field-save-gate',
      `npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-008-result.json`,
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'TARGET-008.md',
    [
      '# TARGET-008 Mandanten: Neues Unternehmen erstellen',
      '',
      '| Punkt | Ergebnis |',
      '|---|---|',
      '| Instanz | playthru |',
      '| Seite | Mandanten / Companies, Page 357 |',
      `| Zielcompany vorher sichtbar | ${targetAlreadyVisible ? 'ja' : 'nein'} |`,
      `| Route angeklickt | ${createRoute.clicked ? 'ja' : 'nein'} |`,
      `| Wizard-/Create-Kontext sichtbar | ${usableWizardSignal ? 'ja' : 'nein'} |`,
      `| Direkte Neu-Listenanlage geoeffnet | ${openedMainNewListPart ? 'ja' : 'nein'} |`,
      `| No-Data-Option sichtbar | ${hasNoDataOption ? 'ja' : 'nein'} |`,
      `| Setup-Only-Option sichtbar | ${hasSetupOnlyOption ? 'ja' : 'nein'} |`,
      `| Demo/Sample/CRONUS-Signal sichtbar | ${hasDemoOption ? 'ja' : 'nein'} |`,
      '| Company erstellt | nein |',
      '',
      '## Screenshot-QA',
      '',
      openedMainNewListPart
        ? 'Das erste Bild zeigt die Mandantenliste vor der Route. Das zweite Bild zeigt die direkte `Neu - Mandanten`-Listenanlage mit leerer Zeile. Das ist kein gefuehrter Wizard. In diesem Lauf wurde kein Wert eingetragen und nicht gespeichert.'
        : 'Das erste Bild zeigt die Mandantenliste vor der Route. Das zweite Bild zeigt den Kontext nach der Auswahl von `Neues Unternehmen erstellen`. In diesem Lauf wurde kein `Weiter`, `Fertig`, `Erstellen`, `OK` oder `Speichern` bestaetigt.',
      '',
      '## Buchnotiz',
      '',
      openedMainNewListPart
        ? 'Die Mandantenliste ist der beste Einstieg fuer die Anlage einer neuen Company. In der Praxis oeffnet die sichtbare Neuanlage eine eigene Listenansicht mit leerer Zeile. Fuer `UNIVERSAARL-DE` muss im naechsten Schritt kontrolliert werden, welche Felder beschrieben werden muessen und wann Business Central speichert.'
        : 'Die Mandantenliste ist der beste Einstieg fuer die Anlage einer neuen Company. Der Hauptbutton `Neu` und der Pfeil daneben fuehren zu unterschiedlichen Bedienwegen. Fuer die Universaarl GmbH verwenden wir keine Kopie einer Demo-Company und kein Testunternehmen. Die naechste Entscheidung betrifft die Datenbasis: Setupdaten ohne Beispieldaten oder eine komplett leere Company.',
      '',
      '## Naechster Schritt',
      '',
      nextStepDecision.selectedNextCase,
      ''
    ].join('\n')
  );
});
