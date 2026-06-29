import { expect, test } from '@playwright/test';
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

const CASE_ID = 'TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const EVIDENCE_ID = 'target-009-main-neu-list-company-create-gate';
const PROJECT = 'fibu-book5';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-009-result.json');

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
    if (value) kept.searchParams.set(key, value);
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
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function writeScreenshotMetadata(fileName: string, value: Record<string, unknown>) {
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath: path.resolve('playwright/projects/fibu-book5/img', fileName),
    ...value
  });
}

async function clickMainNew(page: import('@playwright/test').Page) {
  const candidates = await page
    .locator('button,[role="button"],[role="menuitem"]')
    .evaluateAll((nodes) =>
      nodes
        .map((node) => {
          const element = node as HTMLElement;
          const rect = element.getBoundingClientRect();
          const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
          const ariaLabel = element.getAttribute('aria-label') || '';
          const title = element.getAttribute('title') || '';
          return {
            label: [text, ariaLabel, title].filter(Boolean).join(' | '),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            clickX: Math.round(rect.x + rect.width / 2),
            clickY: Math.round(rect.y + rect.height / 2)
          };
        })
        .filter((entry) => /^Neu\b/i.test(entry.label) && entry.y >= 40 && entry.y <= 150 && entry.x >= 450 && entry.x <= 850)
    );
  const main =
    candidates.sort((a, b) => a.x - b.x)[0] ??
    ({
      label: 'geometry-fallback-main-Neu-from-companies-actionbar',
      x: 482,
      y: 96,
      width: 84,
      height: 38,
      clickX: 523,
      clickY: 111
    } as const);
  await page.mouse.click(main.clickX, main.clickY);
  await page.waitForTimeout(2500);
  return main;
}

async function tooltipAfterHover(page: import('@playwright/test').Page, x: number, y: number) {
  await page.mouse.move(x, y);
  await page.waitForTimeout(900);
  const text = clean(
    await compactPageText(page, {
      include: [/Neu|Erstellen Sie einen neuen Eintrag|Verwandte Aktionen|Tooltip|Mandanten/i],
      maxLines: 80
    })
  );
  return text;
}

async function openNewDropdown(page: import('@playwright/test').Page) {
  await page.mouse.move(580, 111);
  await page.waitForTimeout(700);
  const tooltip = await tooltipAfterHover(page, 580, 111);
  await page.mouse.click(580, 111);
  await page.waitForTimeout(1000);
  return tooltip;
}

async function clickCreateNewCompanyFromDropdown(page: import('@playwright/test').Page) {
  await page.mouse.move(620, 183);
  await page.waitForTimeout(700);
  const tooltip = clean(
    await compactPageText(page, {
      include: [/Neues Unternehmen erstellen|Unterstutzung|Erstellen eines neuen Unternehmens|Neu/i],
      maxLines: 80
    })
  );
  await page.mouse.click(620, 183);
  await page.waitForTimeout(2500);
  return tooltip;
}

async function activeElementInfo(page: import('@playwright/test').Page) {
  return page
    .evaluate(() => {
      const element = document.activeElement as HTMLInputElement | HTMLTextAreaElement | HTMLElement | null;
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role') || '',
        ariaLabel: element.getAttribute('aria-label') || '',
        title: element.getAttribute('title') || '',
        value: 'value' in element ? String((element as HTMLInputElement).value || '') : '',
        text: (element.textContent || '').replace(/\s+/g, ' ').trim(),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    })
    .catch(() => null);
}

test('TARGET-009 creates UNIVERSAARL-DE through controlled main Neu list row if BC saves it', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();
  const companiesUrl = buildPlaythruUrl(357);

  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  expect(page.url(), 'TARGET-009 must stay in playthru.').toMatch(/playthru/i);

  const beforeFullText = clean(await pageText(page));
  const alreadyExists = /UNIVERSAARL-DE|Universaarl GmbH/i.test(beforeFullText);
  await screenshot(page, 'target-009-010-before-main-neu-create.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: 'candidate',
    bookUse: 'preflight',
    purpose: 'Mandantenliste vor kontrollierter Haupt-Neu-Anlage.',
    expectedPageText: [/Mandanten|Neu|Name|Anzeigename/i],
    knownLimitations: ['Vorher-Bild; keine Zielcompany-Anlage.']
  });

  let mainNewClicked: unknown = null;
  let mainNewTooltip = '';
  let dropdownTooltip = '';
  let createNewCompanyTooltip = '';
  let activeBeforeTyping: unknown = null;
  let activeAfterTyping: unknown = null;
  let afterText = '';
  let finalText = beforeFullText;
  let savedVisible = alreadyExists;
  let errorVisible = false;

  if (!alreadyExists) {
    mainNewTooltip = await tooltipAfterHover(page, 523, 111);
    dropdownTooltip = await openNewDropdown(page);
    createNewCompanyTooltip = await clickCreateNewCompanyFromDropdown(page);
    mainNewClicked = {
      route: 'Neu dropdown -> Neues Unternehmen erstellen',
      mainNewTooltip,
      dropdownTooltip,
      createNewCompanyTooltip
    };
    await page.waitForTimeout(800);
    // After main Neu, BC opens a foreground "Neu - Mandanten" ListPart and
    // focuses an empty Name cell visually. The outer document activeElement is
    // still the runinframe iframe, so click the visible Name cell before typing.
    await page.mouse.click(660, 262);
    await page.waitForTimeout(300);
    activeBeforeTyping = await activeElementInfo(page);
    await page.keyboard.type(TARGET_COMPANY, { delay: 10 });
    await page.keyboard.press('Tab');
    await page.keyboard.type(LEGAL_NAME, { delay: 10 });
    await page.keyboard.press('Tab');
    activeAfterTyping = await activeElementInfo(page);
    await page.waitForTimeout(2500);
    afterText = clean(
      await compactPageText(page, {
        include: [/Mandanten|Neu - Mandanten|UNIVERSAARL|Universaarl|CRONUS|My Company|Name|Anzeigename|Fehler|Error|Nicht gespeichert|Speichern/i],
        maxLines: 240
      })
    );

    // Move focus back to the parent list; BC list pages often save on row leave.
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(1500);
    await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(2500);
    finalText = clean(await pageText(page));
    savedVisible = /UNIVERSAARL-DE|Universaarl GmbH/i.test(finalText);
    errorVisible = /Fehler|Error|Nicht gespeichert|not saved|validation/i.test(`${afterText}\n${finalText}`);
  }

  await screenshot(page, 'target-009-020-after-main-neu-create-attempt.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: savedVisible ? 'candidate' : 'blocked',
    bookUse: savedVisible ? 'process-proof' : 'error',
    purpose: savedVisible
      ? 'Mandantenliste nach kontrollierter Anlage von UNIVERSAARL-DE.'
      : 'Mandantenliste nach kontrolliertem Anlageversuch; Zielcompany nicht sichtbar.',
    expectedPageText: [/Mandanten|UNIVERSAARL|Universaarl|Name|Anzeigename/i],
    knownLimitations: ['Kein Company-Wechsel, keine Company Information, kein Setup, kein Posting.']
  });
  await writeScreenshotMetadata('target-009-020-after-main-neu-create-attempt.png', {
    status: savedVisible ? 'candidate' : 'blocked',
    bookUse: savedVisible ? 'company-creation-proof' : 'company-creation-blocker',
    page: 'Mandanten / Companies, Page 357',
    instance: EXPECTED_INSTANCE,
    company: 'current shell context before company switch',
    step: savedVisible ? 'After entering UNIVERSAARL-DE and returning to Companies list' : 'After controlled main Neu save attempt',
    visibleLearning: savedVisible
      ? 'UNIVERSAARL-DE ist in der Mandantenliste sichtbar. Eine neue Company entsteht ueber die direkte Neu-Listenanlage erst nach Name/Anzeigename und Speichern/Zeilenwechsel.'
      : 'Der kontrollierte Neu-Weg hat die Zielcompany nicht sichtbar gespeichert; der Fehler oder fehlende Speichernachweis bleibt der naechste Hebel.',
    importantUi: ['Neu', 'Name', 'Anzeigename', TARGET_COMPANY, LEGAL_NAME],
    internallyProves: savedVisible
      ? ['UNIVERSAARL-DE appears in the Companies list after the controlled main Neu route.']
      : ['UNIVERSAARL-DE is not visible after the controlled main Neu route attempt.'],
    doesNotProve: ['Company Information setup', 'foundation setup', 'chart of accounts', 'posting'],
    qualityDecision: savedVisible ? 'usable-company-creation-proof' : 'blocked-needs-error-diagnosis',
    finalScreenshotStatus: savedVisible ? 'german-final-candidate-preflight' : 'not-final-blocked'
  });

  const resultStatus = savedVisible ? (alreadyExists ? 'observed-existing' : 'observed-created') : 'blocked';
  const blockedBy = savedVisible ? [] : [errorVisible ? 'error-or-not-saved-visible' : 'target-company-not-visible-after-create-attempt'];
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE',
    lastEvidenceSummary:
      'TARGET-008 screenshot QA showed that the actual opened route was the direct Neu list-create part, not a guided wizard.',
    isPlannedNextCaseStillSensible: true,
    reason:
      'The practical UI route is now the direct main Neu list row. It is the fastest path to a target company without Copy/Testunternehmen/CRONUS.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-010-UNIVERSAARL-COMPANY-CONTEXT-PROOF',
        status: savedVisible ? 'ready-next' : 'blocked',
        reason: savedVisible ? 'UNIVERSAARL-DE is visible and can be opened/verified next.' : 'Company is not visible yet.'
      },
      {
        caseId: 'TARGET-004-FOUNDATION-SETUP-READINESS',
        status: savedVisible ? 'ready-after-current' : 'needs-setup-first',
        reason: 'Foundation setup only makes sense after target company context is proven.'
      },
      {
        caseId: 'TARGET-005-NUMBER-SERIES-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Needs company context and foundation baseline.'
      },
      {
        caseId: 'TARGET-006-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Needs company context and foundation baseline.'
      },
      {
        caseId: 'TARGET-007-DIMENSIONS-FOUNDATION',
        status: savedVisible ? 'ready-after-current' : 'blocked',
        reason: 'Dimensions belong after company and setup context.'
      }
    ],
    queueChangesMade: savedVisible
      ? ['Set next case to UNIVERSAARL-DE company context proof.']
      : ['Keep creation blocked and require error/save diagnostics.'],
    selectedNextCase: savedVisible
      ? 'TARGET-010-UNIVERSAARL-COMPANY-CONTEXT-PROOF'
      : 'TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-BLOCKER-DIAGNOSIS',
    whySelectedNextCaseIsBest: savedVisible
      ? 'After the company is visible, the next value is proving the active company context and Company Information before setup.'
      : 'The value entry route did not visibly save; next step must read the exact BC validation/save condition.',
    risksBeforeNextCase: savedVisible
      ? ['Company switch must be explicit and documented.', 'Company Information may still be empty.']
      : ['Do not retry blind typing; first diagnose save/error behavior.'],
    requiredPreparation: savedVisible
      ? ['Open/switch to UNIVERSAARL-DE intentionally.', 'Capture shell context and Company Information.']
      : ['Capture error details, active field info and save action behavior.']
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
    currentUrl: sanitizeUrl(page.url()),
    actionsTaken: alreadyExists
      ? ['Opened Companies page and stopped because UNIVERSAARL-DE is already visible.']
      : [
          'Opened Companies / Mandanten page 357 in playthru.',
          'Hovered Neu and the dropdown arrow.',
          'Opened the Neu dropdown.',
          'Selected Neues Unternehmen erstellen.',
          'Entered UNIVERSAARL-DE in the active Name field.',
          'Entered Universaarl GmbH in the next field.',
          'Left the row and reopened Companies page to verify persistence.'
        ],
    actionsNotTaken: [
      'No Copy/Kopieren route.',
      'No Testunternehmen/demo route.',
      'No CRONUS copy.',
      'No API shortcut.',
      'No company switch.',
      'No setup, preview posting, posting or payment.'
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
      companyCreatedOrAlreadyVisible: savedVisible
    },
    observed: {
      alreadyExists,
      mainNewClicked,
      mainNewTooltip,
      dropdownTooltip,
      createNewCompanyTooltip,
      activeBeforeTyping,
      activeAfterTyping,
      afterText,
      savedVisible,
      errorVisible,
      screenshots: [
        'playwright/projects/fibu-book5/img/target-009-010-before-main-neu-create.png',
        'playwright/projects/fibu-book5/img/target-009-020-after-main-neu-create-attempt.png'
      ]
    },
    proved: savedVisible
      ? [
          'Companies / Mandanten page 357 opens in playthru.',
          'UNIVERSAARL-DE is visible in the Companies list after the controlled main Neu route or was already visible.',
          'No Copy/Testunternehmen/CRONUS/API route was used.'
        ]
      : [
          'Companies / Mandanten page 357 opens in playthru.',
          'The main Neu route was attempted with target values.',
          'UNIVERSAARL-DE is not visible after the attempt.'
        ],
    notProved: [
      'No Company Information was configured.',
      'No foundation setup was configured.',
      'No chart of accounts, VAT setup, number series or posting groups were proven.',
      'No posting or ledger trace exists.'
    ],
    blockedBy,
    requiresReview: !savedVisible,
    safeToFinalizeState: true,
    statePatch: {},
    bookImpact: {
      draftOnly: true,
      beginnerTextReady: savedVisible,
      reason: savedVisible
        ? 'The book can now explain the actual main Neu company creation path and the after-create check.'
        : 'The book can explain the blocker, but not present the company as created.'
    },
    nextStepDecision,
    nextStep: nextStepDecision.selectedNextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-009-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-009.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-009-020-after-main-neu-create-attempt.screenshot.json`
    ],
    validationCommands: [
      'npm run fibu:target:main-neu-company-create-gate',
      `npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-009-result.json`,
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'TARGET-009.md',
    [
      '# TARGET-009 Hauptbutton Neu: Universaarl-Company anlegen',
      '',
      '| Punkt | Ergebnis |',
      '|---|---|',
      '| Instanz | playthru |',
      '| Seite | Mandanten / Companies, Page 357 |',
      `| Zielcompany sichtbar | ${savedVisible ? 'ja' : 'nein'} |`,
      `| Company vorher schon vorhanden | ${alreadyExists ? 'ja' : 'nein'} |`,
      `| Fehler sichtbar | ${errorVisible ? 'ja' : 'nein'} |`,
      '| Copy/Test/CRONUS/API | nein |',
      '| Company Switch | nein |',
      '',
      '## Screenshot-QA',
      '',
      savedVisible
        ? 'Das Nachher-Bild muss `UNIVERSAARL-DE` oder `Universaarl GmbH` in der Mandantenliste zeigen. Es beweist noch keine Company-Information und kein Setup.'
        : 'Das Nachher-Bild zeigt die Mandantenliste nach dem Anlageversuch ohne sichtbare Zielcompany. Der naechste Schritt ist Fehler-/Save-Diagnose, kein blinder Retry.',
      '',
      '## Buchnotiz',
      '',
      savedVisible
        ? 'Die neue Company wird ueber `Mandanten` und `Neu` angelegt. Nach der Eingabe von Name und Anzeigename wird die Liste erneut geprueft. Erst wenn `UNIVERSAARL-DE` sichtbar ist, geht es mit dem Wechsel in die Company und der Company Information weiter.'
        : 'Die direkte `Neu`-Route reicht erst dann als Buchpfad, wenn Business Central die neue Company sichtbar speichert oder eine konkrete Fehlermeldung zeigt.',
      ''
    ].join('\n')
  );
});
