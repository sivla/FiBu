import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell,
  writeEvidenceText
} from '../../../core/bc-helpers';

const CASE_ID = 'TARGET-003-UNIVERSAARL-COMPANY-CREATION-EXECUTION-ROUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence/target-003');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-003-result.json');

test.use({ storageState: 'playwright/.auth/bc-user.json' });

type Candidate = {
  index: number;
  tag: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
};

function buildPlaythruUrl(pageId = 357) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  if (/MCP_1_20260210/i.test(url.pathname)) {
    url.pathname = url.pathname.replace(/MCP_1_20260210/gi, EXPECTED_INSTANCE);
  }
  if (!url.pathname.toLowerCase().includes(EXPECTED_INSTANCE)) {
    throw new Error(`Configured BC URL cannot be scoped to ${EXPECTED_INSTANCE} without guessing.`);
  }
  url.searchParams.delete('company');
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function collectCompanyActionCandidates(page: Page) {
  const all: Candidate[] = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const interesting =
          /Create New Company|New Company|Assisted|Setup|Company|Companies|Mandanten|Neu|Unternehmen|Einrichten|Testunternehmen|Copy|Kopieren/i;
        return Array.from(
          document.querySelectorAll<HTMLElement>(
            'button,a,[role="button"],[role="menuitem"],[aria-label],[title]'
          )
        )
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const role = normalize(element.getAttribute('role'));
            const label = [text, ariaLabel, title].join(' ');
            let score = 0;
            if (/Create New Company/i.test(label)) score -= 100;
            if (/New Company/i.test(label)) score -= 80;
            if (/Assisted|Einricht|Setup/i.test(label)) score -= 30;
            if (/Testunternehmen|Copy|Kopieren|Delete|L.schen|Switch|Wechsel/i.test(label)) score += 180;
            if (/Aktualisieren|Refresh|F5/i.test(label)) score += 200;
            return {
              index,
              tag: element.tagName.toLowerCase(),
              role,
              text,
              ariaLabel,
              title,
              label,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              score,
              matched: interesting.test(label)
            };
          })
          .filter((entry) => entry.matched)
          .sort((a, b) => a.score - b.score)
          .slice(0, 160);
      })
      .catch(() => []);
    all.push(...entries);
  }
  return all.sort((a, b) => a.score - b.score);
}

async function clickExactCreateNewCompanyIfVisible(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const candidates = [
      scope.getByRole('button', { name: /Create New Company/i }),
      scope.getByRole('menuitem', { name: /Create New Company/i }),
      scope.getByText(/Create New Company/i)
    ];
    for (const locator of candidates) {
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);
        if (!(await candidate.isVisible({ timeout: 500 }).catch(() => false))) continue;
        const details = await candidate
          .evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              role: element.getAttribute('role') || '',
              text: (element.textContent || '').replace(/\s+/g, ' ').trim(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .catch(() => null);
        await candidate.click({ timeout: 3000 });
        await page.waitForTimeout(3000);
        return { clicked: true, details, scopeUrl: scope.url() };
      }
    }
  }
  return { clicked: false };
}

async function collectWizardContext(page: Page) {
  const text = await pageText(page);
  const wizardVisible =
    /Create New Company|Assisted Company Setup|company setup|Set up company|Einricht|Unternehmen/i.test(text) &&
    /Next|Weiter|Back|Zur.ck|Finish|Fertig stellen|Company Name|Name|Template|Vorlage|Daten/i.test(text);
  const controls = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(
          document.querySelectorAll<HTMLElement>(
            'input,textarea,button,a,[role="button"],[role="textbox"],[role="combobox"],[aria-label],[title]'
          )
        )
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            return {
              index,
              tag: element.tagName.toLowerCase(),
              role: normalize(element.getAttribute('role')),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              value: normalize((element as HTMLInputElement).value),
              text: normalize(element.innerText || element.textContent),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter((entry) =>
            /Create New Company|Assisted|Setup|Company|Name|Next|Weiter|Finish|Fertig|Back|Zur.ck|Template|Vorlage|Daten/i.test(
              [entry.text, entry.ariaLabel, entry.title, entry.value].join(' ')
            )
          )
          .slice(0, 160);
      })
      .catch(() => []);
    controls.push(...entries);
  }
  return { wizardVisible, textSnippet: text.replace(/\s+/g, ' ').slice(0, 1600), controls };
}

function smartDecisionCard() {
  return {
    decisionId: 'TARGET-003-COMPANY-CREATION-ROUTE',
    caseId: CASE_ID,
    actionCandidate: 'Open official Create New Company / assisted setup route; create only if blank/no-sample route is visible and understood.',
    businessQuestion:
      'Which Business Central route can create a clean Universaarl company without copying CRONUS or sample/demo master data?',
    bookPurpose:
      'The book needs a beginner-safe company creation path before any setup, master data or posting can be explained in UNIVERSAARL-DE.',
    currentContext: {
      instance: EXPECTED_INSTANCE,
      company: 'current playthru shell company before UNIVERSAARL-DE exists',
      page: 'Companies / Mandanten page 357',
      record: TARGET_COMPANY
    },
    sourcesChecked: [
      'playwright/projects/fibu-book5/BC-SOURCE-REGISTRY.md',
      'playwright/projects/fibu-book5/BC-SOURCE-CLAIM-RULES.md',
      'playwright/projects/fibu-book5/TARGET-SANDBOX-REBUILD-PLAN.md',
      'playwright/projects/fibu-book5/UNIVERSAARL-FINAL-TRACK-PLAN.md',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company'
    ],
    existingEvidenceChecked: [
      'playwright/projects/fibu-book5/evidence/target-001/TARGET-001-result.json',
      'playwright/projects/fibu-book5/evidence/target-002/TARGET-002-result.json'
    ],
    alternatives: [
      {
        option: 'Blank / No Data company creation',
        benefit: 'Best fit for a clean Universaarl Musterfirma if visible and understood.',
        risk: 'May not be exposed in the current UI route.',
        bookFit: 'Strong',
        decision: 'prefer'
      },
      {
        option: 'Setup Data Only / Production Setup',
        benefit: 'Can provide necessary setup without sample master data if Microsoft/BC UI confirms the data basis.',
        risk: 'Could still create prefilled assumptions that must be explained.',
        bookFit: 'Good if data basis is visible.',
        decision: 'investigate'
      },
      {
        option: 'Copy Company / CRONUS / Testunternehmen',
        benefit: 'Fast start.',
        risk: 'Creates demo/sample assumptions and a mixed book world.',
        bookFit: 'Bad for final Universaarl basis.',
        decision: 'reject'
      },
      {
        option: 'Direct Companies list-row save',
        benefit: 'Technically visible from TARGET-002.',
        risk: 'BC validation points to Create New Company / assisted setup and row save is not a clean book path.',
        bookFit: 'Diagnostic only.',
        decision: 'reject'
      }
    ],
    selectedOption: 'Investigate official Create New Company / assisted setup route first.',
    whyThisIsTheMostSensibleNextStep:
      'It follows Microsoft Learn and the BC row validation message, while avoiding direct row save, CRONUS copy and demo/test company routes.',
    whyNotOtherOptions:
      'Direct row save already produced an unsaved-row warning; copy/test/demo routes would pollute the Universaarl final track with sample data.',
    expectedEffect:
      'Either open a scoped company creation wizard for field mapping or document that the official action is not visible/clickable from page 357.',
    risk:
      'A wizard may offer only copy/demo/sample routes or a Finish button before the data basis is understood.',
    correctionOrFallbackPath:
      'Do not Finish. Capture route blocker and create a follow-up for scoped action/menu discovery or source-backed alternative route.',
    screenshotPlan:
      'Capture Companies page before route attempt and after route attempt or blocker.',
    bookExplanationPlan:
      'Explain Mandanten, why UNIVERSAARL-DE needs a clean company, and why demo/copy/testcompany is not the final book basis.',
    decision: 'investigate-readonly-first'
  };
}

function resultBase() {
  return {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-ui-company-create-new-company-route',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-003/TARGET-003-result.json',
      'playwright/projects/fibu-book5/evidence/target-003/README.md',
      'playwright/projects/fibu-book5/evidence/target-003/TARGET-003.md',
      'playwright/projects/fibu-book5/evidence/target-003/010-companies-before-route.txt',
      'playwright/projects/fibu-book5/evidence/target-003/020-after-create-route-attempt.txt'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-003/TARGET-003-result.json',
      'playwright/projects/fibu-book5/evidence/target-003/README.md',
      'playwright/projects/fibu-book5/evidence/target-003/TARGET-003.md'
    ],
    statePatch: {},
    safeToFinalizeState: false,
    flags: {
      noPost: true,
      noPreviewPosting: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: false,
      noTemplateCopy: true,
      noDelete: true,
      noCompanyCreated: true,
      noWizardFinish: true,
      smartDecisionCardWritten: true
    }
  };
}

function markdownSummary(result: {
  resultStatus: string;
  createActionClicked: boolean;
  wizardVisible: boolean;
  routeDecision: string;
}) {
  return [
    '# TARGET-003 Universaarl Company Creation Execution Route',
    '',
    `Status: \`${result.resultStatus}\`, \`company-create-route-gate\`, \`german-final-candidate\`.`,
    '',
    '## Smart Decision',
    '',
    'Die direkte Mandanten-Listenzeile ist kein Buchpfad fuer die Universaarl-Musterfirma. Der sichere naechste Schritt ist die offizielle Create-New-Company-/Assisted-Setup-Route. Demo-, Copy-, Testunternehmen- und CRONUS-Routen werden nicht als Universaarl-Basis verwendet.',
    '',
    '## Ergebnis',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Create-New-Company-Aktion geklickt | ${result.createActionClicked ? 'ja' : 'nein'} |`,
    `| Wizard-/Assisted-Kontext sichtbar | ${result.wizardVisible ? 'ja' : 'nein'} |`,
    `| Routenentscheidung | ${result.routeDecision} |`,
    '',
    '## Grenzen',
    '',
    '- Es wurde keine Company gespeichert oder gewechselt.',
    '- Es wurde kein unbekannter Wizard final bestaetigt.',
    '- Kein Setup, kein Posting, kein Preview Posting und kein API-Shortcut.',
    '- UNIVERSAARL-DE ist weiterhin erst dann Buchbasis, wenn eine saubere Anlage oder ein Blocker mit Folgeweg bewiesen ist.',
    ''
  ].join('\n');
}

test('TARGET-003 checks official Create New Company route before any effective creation', async ({ page }) => {
  test.setTimeout(8 * 60_000);
  await page.setViewportSize({ width: 2400, height: 1300 });
  const startedAt = new Date().toISOString();
  const decisionCard = smartDecisionCard();

  try {
    await fs.mkdir(EVIDENCE_DIR, { recursive: true });
    const companiesUrl = buildPlaythruUrl(357);
    await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    expect(page.url(), 'TARGET-003 must stay in playthru.').toMatch(/playthru/i);

    const beforeText = await pageText(page);
    const targetAlreadyVisible = /UNIVERSAARL-DE|Universaarl GmbH/i.test(beforeText);
    await writeEvidenceText(
      path.join(EVIDENCE_DIR, '010-companies-before-route.txt'),
      await compactPageText(page, {
        include: [
          /Mandanten|Companies|Company|Name|Anzeigename|UNIVERSAARL|CRONUS|My Company|Testunternehmen|Einrichtungsstatus|Create New Company|Assisted|Neu|Kopieren/i
        ],
        maxLines: 220
      })
    );
    await screenshot(page, 'target-003-010-companies-before-route.png', {
      testId: 'target-003',
      status: 'candidate',
      bookUse: 'evidence',
      purpose: 'TARGET-003 Companies-Seite vor offizieller Create-New-Company-Routenpruefung.',
      expectedPageText: [/Mandanten|Companies|Company|Name/i],
      knownLimitations: ['Vorher-Bild; noch keine Company-Anlage.']
    });

    const actionCandidatesBefore = await collectCompanyActionCandidates(page);
    const clickResult = targetAlreadyVisible ? { clicked: false, reason: 'target-already-visible' } : await clickExactCreateNewCompanyIfVisible(page);
    const rawWizardContext = await collectWizardContext(page);
    const wizardContext = {
      ...rawWizardContext,
      wizardVisible: Boolean(clickResult.clicked && rawWizardContext.wizardVisible)
    };
    const actionCandidatesAfter = await collectCompanyActionCandidates(page);

    await writeEvidenceText(
      path.join(EVIDENCE_DIR, '020-after-create-route-attempt.txt'),
      await compactPageText(page, {
        include: [
          /Mandanten|Companies|Company|UNIVERSAARL|Create New Company|Assisted|Setup|Next|Weiter|Finish|Fertig|Name|Display Name|Fehler|Error|Testunternehmen|Kopieren|CRONUS/i
        ],
        maxLines: 260
      })
    );
    await screenshot(page, 'target-003-020-after-create-route-attempt.png', {
      testId: 'target-003',
      status: clickResult.clicked ? 'candidate' : 'rejected',
      bookUse: 'evidence',
      purpose: clickResult.clicked
        ? 'Nach Klick auf den expliziten Create-New-Company-Pfad; kein Finish/keine Company-Speicherung.'
        : 'Create-New-Company-Pfad war nicht sichtbar; Action-Inventar dient als Blocker-Evidence.',
      expectedPageText: [/Mandanten|Companies|Company|Name/i],
      knownLimitations: ['Kein Company-Wechsel, kein Setup, kein deutscher Finalnachweis.']
    });

    const resultStatus = targetAlreadyVisible
      ? 'observed-existing'
      : clickResult.clicked && wizardContext.wizardVisible
        ? 'observed-route-opened'
        : 'blocked';
    const routeDecision = targetAlreadyVisible
      ? 'UNIVERSAARL-DE is already visible; do not create a duplicate. Next case should prove company context and Company Information.'
      : clickResult.clicked && wizardContext.wizardVisible
        ? 'Create New Company / assisted setup route opens a wizard context. Next case must map fields and data-basis options before any Finish.'
        : 'Create New Company action was not visible/clickable from Page 357 start context. Do not edit the Companies list row again; use scoped menu/action discovery or a documented alternative route.';
    const timestamp = new Date().toISOString();
    const blockedBy =
      resultStatus === 'blocked' ? ['create-new-company-action-not-visible-or-wizard-not-proven'] : [];

    const result = {
      ...resultBase(),
      resultStatus,
      timestamp,
      instance: EXPECTED_INSTANCE,
      targetCompany: TARGET_COMPANY,
      legalName: LEGAL_NAME,
      pageId: 357,
      smartDecisionCards: [decisionCard],
      effectiveActionsTaken: clickResult.clicked ? ['clicked-exact-create-new-company-action-without-finish'] : [],
      effectiveActionsBlocked: [
        'direct-companies-list-row-save',
        'copy-company',
        'test-company',
        'cronos-copy',
        'wizard-finish',
        'company-switch'
      ],
      whyActionsWereSafeOrBlocked: [
        'The only permitted action was opening an exact Create New Company route for diagnosis.',
        'Finish/OK/Create was blocked until wizard fields, data basis and sample-data effect are visible.',
        'Direct list-row save was rejected because TARGET-002 and Microsoft source decision point to assisted setup.'
      ],
      bookReasoning: [
        'A beginner needs to understand Company before setup, master data or posting.',
        'The book must not start Universaarl from CRONUS/sample data unless that choice is explicit and justified.'
      ],
      sourceBasis: [
        'playwright/projects/fibu-book5/BC-SOURCE-REGISTRY.md',
        'playwright/projects/fibu-book5/BC-SOURCE-CLAIM-RULES.md',
        'https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company'
      ],
      nextSensibleStep:
        resultStatus === 'observed-route-opened'
          ? 'TARGET-004: map assisted setup wizard fields and data-basis options before any Finish.'
          : resultStatus === 'observed-existing'
            ? 'TARGET-004: prove UNIVERSAARL-DE company context and Company Information.'
            : 'TARGET-004: scoped Companies menu/action discovery for the exact Create New Company route, or document an alternative official route.',
      createActionClicked: clickResult.clicked,
      clickResult,
      wizardVisible: wizardContext.wizardVisible,
      wizardContext,
      actionCandidatesBefore,
      actionCandidatesAfter,
      routeDecision,
      proved: [
        'Business Central direct URL Page 357 stayed in playthru.',
        targetAlreadyVisible
          ? 'UNIVERSAARL-DE or Universaarl GmbH is visible before creation attempt.'
          : 'UNIVERSAARL-DE is not visible before the route attempt.',
        clickResult.clicked
          ? 'An exact Create New Company action was clicked without using API or Tell-Me search.'
          : 'The exact Create New Company action was not visible/clickable from the Page 357 start context.',
        wizardContext.wizardVisible
          ? 'A company setup/assisted wizard context was visible after the route attempt.'
          : 'No safely usable company setup/assisted wizard context was proven.'
      ],
      notProved: [
        'UNIVERSAARL-DE was not proven as a newly saved company in this run.',
        'No wizard Finish/OK was confirmed.',
        'No company switch was performed.',
        'No setup, chart of accounts, number series, posting groups or master data were configured.',
        'No posting, Preview Posting, payment, ledger trace or final German book proof was created.'
      ],
      blockedBy,
      requiresReview: resultStatus === 'blocked',
      safeToFinalizeState: true,
      statePatch: {
        activeCase: {
          status: resultStatus,
          lastResult: {
            resultFile: 'playwright/projects/fibu-book5/evidence/target-003/TARGET-003-result.json',
            targetAlreadyVisible,
            createActionClicked: clickResult.clicked,
            wizardVisible: wizardContext.wizardVisible
          },
          nextSafeAction:
            resultStatus === 'observed-route-opened'
              ? 'Map assisted setup wizard fields and data-basis options before any Finish.'
              : resultStatus === 'observed-existing'
                ? 'Prove UNIVERSAARL-DE Company Information and shell context.'
                : 'Run scoped action/menu discovery; do not use direct Companies row save.'
        }
      },
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        companiesUrl: sanitizeUrl(companiesUrl.toString()),
        finalUrl: sanitizeUrl(page.url()),
        title: await page.title(),
        targetAlreadyVisible,
        screenshots: [
          'playwright/projects/fibu-book5/img/target-003-010-companies-before-route.png',
          'playwright/projects/fibu-book5/img/target-003-020-after-create-route-attempt.png'
        ]
      },
      warnings:
        resultStatus === 'blocked'
          ? ['No official Create New Company wizard was proven from this UI context; company creation remains locked.']
          : []
    };

    await writeJson(RESULT_PATH, result);
    await writeJson(path.join(EVIDENCE_DIR, 'TARGET-003-action-candidates.json'), {
      timestamp,
      actionCandidatesBefore,
      actionCandidatesAfter,
      clickResult,
      wizardContext
    });
    await writeEvidenceText(
      path.join(EVIDENCE_DIR, 'TARGET-003.md'),
      markdownSummary({
        resultStatus,
        createActionClicked: Boolean(clickResult.clicked),
        wizardVisible: wizardContext.wizardVisible,
        routeDecision
      })
    );
    await writeEvidenceText(
      path.join(EVIDENCE_DIR, 'README.md'),
      [
        '# Evidence TARGET-003',
        '',
        '| Datei | Typ | Beweist | Beweist nicht | Status |',
        '|---|---|---|---|---|',
        '| `TARGET-003-result.json` | JSON | Smart Decision Card, Routenentscheidung und Blocker/Route | gespeicherte Company | german-final-candidate |',
        '| `TARGET-003-action-candidates.json` | JSON | sichtbare Kandidaten fuer Company-Anlageaktionen | vollstaendige interne BC-Aktionsliste | diagnostic |',
        '| `TARGET-003.md` | Markdown | Routenentscheidung und Grenzen | deutsches Setup | book-draft-anchor |',
        '| `010-companies-before-route.txt` | UI-Text | Companies-Kontext vor Routenversuch | Wizard-Felder | candidate |',
        '| `020-after-create-route-attempt.txt` | UI-Text | Kontext nach Routenversuch | Company-Speicherung | candidate/rejected |',
        '| `target-003-010-companies-before-route.png` | Screenshot | Companies-Seite vor Routenversuch | Setup/Finalzustand | candidate |',
        '| `target-003-020-after-create-route-attempt.png` | Screenshot | Routenversuch oder Blocker | gespeicherte Company | candidate/rejected |',
        ''
      ].join('\n')
    );
  } catch (error) {
    const result = {
      ...resultBase(),
      resultStatus: 'blocked',
      timestamp: new Date().toISOString(),
      instance: EXPECTED_INSTANCE,
      targetCompany: TARGET_COMPANY,
      legalName: LEGAL_NAME,
      smartDecisionCards: [decisionCard],
      effectiveActionsTaken: [],
      effectiveActionsBlocked: ['company-create', 'wizard-finish', 'company-switch'],
      whyActionsWereSafeOrBlocked: ['The route failed before any safe company creation could be proven.'],
      bookReasoning: ['Company creation remains a prerequisite for the Universaarl book track.'],
      sourceBasis: ['https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company'],
      nextSensibleStep: 'Review TARGET-003 blocker and choose a scoped read-only route discovery.',
      proved: [],
      notProved: ['TARGET-003 did not complete its company creation route gate.'],
      blockedBy: [error instanceof Error ? error.message : String(error)],
      requiresReview: true,
      safeToFinalizeState: false,
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        currentUrl: page.url() ? sanitizeUrl(page.url()) : ''
      }
    };
    await writeJson(RESULT_PATH, result);
    throw error;
  }
});
