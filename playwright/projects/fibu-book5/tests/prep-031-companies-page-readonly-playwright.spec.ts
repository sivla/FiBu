import { expect, test, type Frame, type Page } from '@playwright/test';
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

const CASE_ID = 'PREP-031-COMPANIES-PAGE-READONLY-PLAYWRIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'prep-031-companies-page-readonly-playwright';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'PREP-031-result.json');

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

async function writeText(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const normalized = content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/(?:\n[ \t]*)+$/g, '')
    .concat('\n');
  await fs.writeFile(filePath, normalized, 'utf8');
}

async function collectScopeControls(scope: Page | Frame, offsetX = 0, offsetY = 0) {
  return scope
    .evaluate(
      ({ offsetX: frameOffsetX, offsetY: frameOffsetY }) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };

        return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const role = normalize(element.getAttribute('role'));
            const label = [text, ariaLabel, title].filter(Boolean).join(' | ');
            const x = Math.round(rect.x + frameOffsetX);
            const y = Math.round(rect.y + frameOffsetY);
            return {
              label,
              text,
              ariaLabel,
              title,
              role,
              tag: element.tagName.toLowerCase(),
              x,
              y,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              clickX: Math.round(x + rect.width / 2),
              clickY: Math.round(y + rect.height / 2)
            };
          });
      },
      { offsetX, offsetY }
    )
    .catch(() => [] as UiCandidate[]);
}

async function collectControls(page: Page) {
  const controls: UiCandidate[] = await collectScopeControls(page);
  for (const frame of page.frames()) {
    let offsetX = 0;
    let offsetY = 0;
    const frameElement = await frame.frameElement().catch(() => null);
    const box = frameElement ? await frameElement.boundingBox().catch(() => null) : null;
    if (box) {
      offsetX = box.x;
      offsetY = box.y;
    }
    const entries = await collectScopeControls(frame, offsetX, offsetY);
    controls.push(...entries);
  }
  return controls;
}

async function hoverText(page: Page, candidate: UiCandidate | null) {
  if (!candidate) return '';
  await page.mouse.move(candidate.clickX, candidate.clickY);
  await page.waitForTimeout(900);
  return clean(
    await compactPageText(page, {
      include: [/Neu|New|Verwandte Aktionen|Related actions|Tooltip|Unternehmen|Company|Mandanten|Create/i],
      maxLines: 120
    })
  );
}

async function screenshotMeta(fileName: string, extra: Record<string, unknown>) {
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath: path.resolve('playwright/projects/fibu-book5/img', fileName),
    ...extra
  });
}

test('PREP-031 observes Companies page Neu split-button read-only', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();
  const companiesUrl = buildPlaythruUrl(357);
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  expect(page.url(), 'PREP-031 must stay in playthru.').toMatch(/playthru/i);

  const initialText = clean(await pageText(page));
  const targetCompanyVisibleBefore = new RegExp(TARGET_COMPANY, 'i').test(initialText);
  const controlsBefore = await collectControls(page);
  const mainNew = controlsBefore
    .filter((entry) => /^Neu\b|^New\b/i.test(entry.label))
    .filter((entry) => entry.y >= 40 && entry.y <= 170)
    .sort((a, b) => a.x - b.x)[0] ?? null;
  const dropdown = controlsBefore
    .filter((entry) => /Verwandte Aktionen.*Neu|Related actions.*New|More options.*New|Weitere Optionen.*Neu/i.test(entry.label))
    .filter((entry) => entry.y >= 40 && entry.y <= 180)
    .sort((a, b) => a.x - b.x)[0] ?? null;

  const mainNewTooltipText = await hoverText(page, mainNew);
  const dropdownTooltipText = await hoverText(page, dropdown);

  await screenshot(page, 'prep-031-010-companies-page-before-dropdown.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: 'candidate',
    bookUse: 'navigation',
    purpose: 'Read-only Companies/Mandanten page before opening the Neu dropdown arrow.',
    expectedPageText: [/Mandanten|Companies|Company|Neu|New/i],
    knownLimitations: ['Vorher-Bild; keine Company-Anlage, kein Speichern, kein Setup.']
  });
  await screenshotMeta('prep-031-010-companies-page-before-dropdown.png', {
    status: 'candidate',
    bookUse: 'navigation',
    page: 'Mandanten / Companies, Page 357',
    instance: EXPECTED_INSTANCE,
    company: 'shell-context-before-UNIVERSAARL-DE',
    step: 'Mandantenliste vor Dropdown-Oeffnung',
    visibleLearning: 'Die Seite Mandanten verwaltet Companies im Environment; der Button Neu steht in der Aktionsleiste.',
    importantUi: ['Neu', 'Pfeil neben Neu'],
    internallyProves: ['Companies Page 357 opens read-only in playthru.'],
    doesNotProve: ['UNIVERSAARL-DE exists', 'company creation', 'save', 'setup'],
    qualityDecision: 'usable-context-screenshot',
    finalScreenshotStatus: 'german-final-candidate-preflight'
  });

  let dropdownOpened = false;
  let menuLabels: string[] = [];
  let blockedReason = '';

  if (dropdown) {
    await page.mouse.click(dropdown.clickX, dropdown.clickY);
    await page.waitForTimeout(1200);
    const controlsAfter = await collectControls(page);
    menuLabels = [
      ...new Set(
        controlsAfter
          .filter((entry) => /Neu|New|Neues Unternehmen|Create New Company|Kopieren|Copy|Testunternehmen|Evaluation Company/i.test(entry.label))
          .filter((entry) => entry.y >= 60 && entry.y <= 420)
          .map((entry) => clean(entry.label))
          .filter(Boolean)
      )
    ];
    dropdownOpened = menuLabels.some((label) => /Neues Unternehmen|Create New Company|Neu|New/i.test(label));
  } else {
    blockedReason = 'No accessible related-action/dropdown control for Neu was found; geometry fallback intentionally disabled.';
  }

  const resultStatus = dropdownOpened ? 'observed' : 'blocked';
  await screenshot(page, 'prep-031-020-companies-new-dropdown-open.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: dropdownOpened ? 'candidate' : 'rejected',
    bookUse: dropdownOpened ? 'navigation' : 'do-not-use',
    purpose: dropdownOpened
      ? 'Read-only Companies/Mandanten page with opened dropdown arrow beside Neu.'
      : 'Companies/Mandanten page after safe dropdown probe; no menu opened.',
    expectedPageText: [/Mandanten|Companies|Company|Neu|New/i],
    knownLimitations: [
      'Keine Dropdown-Auswahl.',
      'Keine Company-Anlage.',
      'Kein Speichern, kein Setup, kein Wizard-Finish.'
    ]
  });
  await screenshotMeta('prep-031-020-companies-new-dropdown-open.png', {
    status: dropdownOpened ? 'candidate' : 'rejected',
    bookUse: dropdownOpened ? 'navigation' : 'do-not-use',
    page: 'Mandanten / Companies, Page 357',
    instance: EXPECTED_INSTANCE,
    company: 'shell-context-before-UNIVERSAARL-DE',
    step: dropdownOpened ? 'Pfeil neben Neu geoeffnet' : 'Dropdown-Probe ohne sicheren Pfeiltreffer',
    visibleLearning: dropdownOpened
      ? 'Der Hauptbutton Neu, der Pfeil daneben und die Menueintraege sind unterschiedliche Ziele.'
      : 'Ohne sicher erkannten Pfeil darf kein Koordinaten-Fallback auf Neu erfolgen.',
    importantUi: ['Neu', 'Pfeil neben Neu', 'Neues Unternehmen erstellen'],
    internallyProves: dropdownOpened
      ? ['The related-action dropdown beside Neu can be opened read-only in playthru.']
      : ['The test refused to use an unsafe geometry fallback.'],
    doesNotProve: ['UNIVERSAARL-DE creation', 'company save', 'Company Information setup'],
    qualityDecision: dropdownOpened ? 'usable-clickguide-screenshot' : 'rejected-path',
    finalScreenshotStatus: 'german-final-candidate-preflight'
  });

  const hasCreateNewCompany = menuLabels.some((label) => /Neues Unternehmen erstellen|Create New Company/i.test(label));
  const hasCopy = menuLabels.some((label) => /Kopieren|Copy/i.test(label));
  const hasTestCompany = menuLabels.some((label) => /Testunternehmen|Evaluation Company/i.test(label));

  const nextStepDecisionCard = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary:
      'PREP-026 mapped official W0/W1 sources; TARGET-007 had historical dropdown evidence but PREP-031 needed a current read-only screenshot QA run.',
    isPlannedNextCaseStillSensible: true,
    reason:
      'The Companies Page split-button is the exact UI confusion currently blocking safe beginner instructions; read-only observation is useful while company creation permissions are missing.',
    lookaheadReviewed: [
      {
        caseId: 'PREP-032-CH04-ERP-BASICS-UNIVERSAARL-REWRITE',
        status: dropdownOpened ? 'ready-next' : 'needs-ui-discovery-first',
        reason: dropdownOpened
          ? 'Chapter text can now use the current Companies Page screenshot QA without claiming company creation.'
          : 'The book rewrite should wait until the dropdown screenshot is usable or explicitly treated as rejected.'
      },
      {
        caseId: 'PREP-033-MY-SETTINGS-READONLY-CONTEXT',
        status: 'ready-after-current',
        reason: 'My Settings is read-only context evidence and does not depend on company creation.'
      },
      {
        caseId: 'PREP-034-ROLE-CENTER-READONLY-SHELL-MAP',
        status: 'ready-after-current',
        reason: 'Role Center shell mapping remains useful for page/context language.'
      },
      {
        caseId: 'PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING',
        status: 'ready-after-current',
        reason: 'Can follow after current UI evidence or book rewrite.'
      },
      {
        caseId: 'TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE',
        status: 'blocked',
        reason: 'Company creation remains parked until SUPER/company-create permissions are confirmed.'
      }
    ],
    queueChangesMade: dropdownOpened
      ? ['Mark PREP-031 done and select PREP-032 as next book-facing use of the screenshot.']
      : ['Mark PREP-031 blocked and keep PREP-032 dependent on a usable/rejected screenshot decision.'],
    selectedNextCase: dropdownOpened
      ? 'PREP-032-CH04-ERP-BASICS-UNIVERSAARL-REWRITE'
      : 'PREP-032-CH04-ERP-BASICS-UNIVERSAARL-REWRITE',
    whySelectedNextCaseIsBest: dropdownOpened
      ? 'The screenshot now gives Chapter 4/Company basics a concrete UI anchor without creating a company.'
      : 'Even the blocker is a useful book/QA lesson, but Chapter 4 must describe the limitation rather than overclaim the dropdown.',
    risksBeforeNextCase: [
      'Do not claim UNIVERSAARL-DE exists.',
      'Do not say Neues Unternehmen erstellen was clicked.',
      'Do not use Copy/Testunternehmen as the Universaarl target route.'
    ],
    requiredPreparation: [
      'Use only visible PREP-031 screenshot facts.',
      'Keep company creation parked until permissions are confirmed.',
      'Explain main button versus arrow versus menu entry in beginner language.'
    ]
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readonly-ui-discovery',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    targetCompany: TARGET_COMPANY,
    legalName: LEGAL_NAME,
    currentUrl: sanitizeUrl(page.url()),
    page: {
      pageId: 357,
      name: 'Companies / Mandanten',
      type: 'list'
    },
    observed: {
      targetCompanyVisibleBefore,
      mainNew,
      dropdown,
      mainNewTooltipText,
      dropdownTooltipText,
      dropdownOpened,
      menuLabels,
      hasCreateNewCompany,
      hasCopy,
      hasTestCompany,
      screenshots: [
        'playwright/projects/fibu-book5/img/prep-031-010-companies-page-before-dropdown.png',
        'playwright/projects/fibu-book5/img/prep-031-020-companies-new-dropdown-open.png'
      ]
    },
    proved: dropdownOpened
      ? [
          'Companies / Mandanten Page 357 opens in playthru.',
          'The main Neu button and the related-action/dropdown control beside Neu are distinct UI targets.',
          'The dropdown can be opened read-only without selecting a menu entry, saving data or creating a company.',
          hasCreateNewCompany
            ? 'Neues Unternehmen erstellen / Create New Company is visible in the dropdown context.'
            : 'The dropdown opened, but Create New Company text was not captured as a stable visible label.'
        ]
      : ['Companies / Mandanten Page 357 opens in playthru.', 'Unsafe geometry fallback was rejected.'],
    notProved: [
      'UNIVERSAARL-DE was not created and is not proven as existing.',
      'No Create New Company menu entry was selected.',
      'No wizard, setup data option, Company Information, save or company switch was performed.',
      'No German final process claim is proven.'
    ],
    blockedBy: dropdownOpened ? [] : [blockedReason],
    requiresReview: !dropdownOpened,
    safeToFinalizeState: true,
    statePatch: {},
    flags: {
      noWrite: true,
      noCompanyCreated: true,
      noCompanyValueEntered: true,
      noDraftCreated: true,
      noSetupChange: true,
      noPreview: true,
      noPost: true,
      noPayment: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noSearch: true,
      dropdownOnly: dropdownOpened
    },
    screenshotQa: [
      {
        image: 'prep-031-010-companies-page-before-dropdown.png',
        status: 'usable-context-screenshot',
        importantVisibleArea: 'Companies/Mandanten command bar with Neu before the dropdown is opened.',
        limitation: 'Does not show a selected create route.'
      },
      {
        image: 'prep-031-020-companies-new-dropdown-open.png',
        status: dropdownOpened ? 'usable-clickguide-screenshot' : 'rejected-path',
        importantVisibleArea: dropdownOpened
          ? 'Opened related-action dropdown beside Neu.'
          : 'Safe failure/no coordinate fallback.',
        limitation: 'Does not create or save a company.'
      }
    ],
    actionsTaken: [
      'Opened Companies / Mandanten Page 357 directly in playthru.',
      'Hovered main Neu and the related-action dropdown control when found.',
      dropdownOpened
        ? 'Opened only the dropdown arrow next to Neu and captured menu labels.'
        : 'Stopped before clicking any fallback coordinates.'
    ],
    actionsNotTaken: [
      'Did not click main Neu.',
      'Did not click Neues Unternehmen erstellen.',
      'Did not click Kopieren.',
      'Did not click Testunternehmen.',
      'Did not enter UNIVERSAARL-DE.',
      'Did not save, finish, switch company, run setup, preview or post.'
    ],
    nextStepDecisionCard,
    nextCase: 'PREP-032-CH04-ERP-BASICS-UNIVERSAARL-REWRITE',
    changedFiles: [
      'playwright/projects/fibu-book5/tests/prep-031-companies-page-readonly-playwright.spec.ts',
      'playwright/projects/fibu-book5/evidence/prep-031-companies-page-readonly-playwright/PREP-031-result.json',
      'playwright/projects/fibu-book5/evidence/prep-031-companies-page-readonly-playwright/README.md',
      'playwright/projects/fibu-book5/evidence/prep-031-companies-page-readonly-playwright/*.screenshot.json'
    ],
    validationCommands: [
      'npm run agent:preflight',
      'npm run agent:context',
      'npm run agent:dry-run',
      'npm run agent:run-plan',
      'npm run agent:marathon:check || true',
      'npx tsc --noEmit',
      'npm run fibu:prep:031:companies-readonly',
      'npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/prep-031-companies-page-readonly-playwright/PREP-031-result.json',
      'npm run agent:state-finalize -- --input playwright/projects/fibu-book5/evidence/prep-031-companies-page-readonly-playwright/PREP-031-result.json',
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# PREP-031 Companies Page Read-only',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Case | ${CASE_ID} |`,
      '| Instanz | playthru |',
      '| Page | Mandanten / Companies, Page 357 |',
      `| Status | ${resultStatus} |`,
      `| UNIVERSAARL-DE sichtbar | ${targetCompanyVisibleBefore ? 'ja' : 'nein'} |`,
      `| Dropdown geoeffnet | ${dropdownOpened ? 'ja' : 'nein'} |`,
      `| Neues Unternehmen erstellen sichtbar | ${hasCreateNewCompany ? 'ja' : 'nein'} |`,
      `| Kopieren sichtbar | ${hasCopy ? 'ja' : 'nein'} |`,
      `| Testunternehmen sichtbar | ${hasTestCompany ? 'ja' : 'nein'} |`,
      '',
      '## Screenshot-QA',
      '',
      '- `prep-031-010-companies-page-before-dropdown.png`: Kontextbild der Mandantenliste vor der Dropdown-Oeffnung.',
      `- \`prep-031-020-companies-new-dropdown-open.png\`: ${dropdownOpened ? 'Brauchbares Clickguide-Bild fuer den Pfeil neben Neu.' : 'Rejected Path, weil kein sicherer Pfeiltreffer erkannt wurde.'}`,
      '',
      '## Grenze',
      '',
      'Es wurde keine Company angelegt, kein Wert eingegeben, kein Wizard beendet, kein Setup gestartet und kein Company-Wechsel durchgefuehrt.',
      '',
      '## Naechster Schritt',
      '',
      '`PREP-032-CH04-ERP-BASICS-UNIVERSAARL-REWRITE`: den beobachteten UI-Kontext in direkt lesbaren Buchtext ueberfuehren, ohne zu behaupten, dass UNIVERSAARL-DE schon existiert.',
      ''
    ].join('\n')
  );
});
