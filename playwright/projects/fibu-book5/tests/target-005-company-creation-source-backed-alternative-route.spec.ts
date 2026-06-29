import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  compactPageText,
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  waitForBcReady
} from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-005-COMPANY-CREATION-SOURCE-BACKED-ALTERNATIVE-ROUTE';
const EVIDENCE_ID = 'target-005-company-creation-source-backed-alternative-route';
const PROJECT = 'fibu-book5';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);

type Candidate = {
  frameUrl: string;
  tagName: string;
  role: string | null;
  text: string;
  ariaLabel: string;
  title: string;
  href: string | null;
  label: string;
  visible: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  risk: string[];
  safeToClick: boolean;
};

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.delete('company');
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

function sanitizeUrl(value: string) {
  const url = new URL(value);
  const allowedParams = ['page', 'company'];
  for (const key of [...url.searchParams.keys()]) {
    if (!allowedParams.includes(key)) {
      url.searchParams.delete(key);
    }
  }
  return url.toString();
}

function sanitizeEvidenceText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function sanitizeBusinessText(value: string) {
  return sanitizeEvidenceText(value)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactory|requestExecutor|O365MSAL|shouldAttachOauthTokens/i.test(line))
    .join('\n');
}

async function writeJson(fileName: string, value: unknown) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), JSON.stringify(value, null, 2), 'utf8');
}

async function writeText(fileName: string, value: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const normalized = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/(?:\n[ \t]*)+$/g, '')
    .concat('\n');
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), normalized, 'utf8');
}

function classifyCandidate(label: string, href: string | null) {
  const risk: string[] = [];
  if (/learn\.microsoft|training|docs\.microsoft|go\.microsoft|support|hilfe|help/i.test(`${label} ${href ?? ''}`)) {
    risk.push('external-help-or-learn-result');
  }
  if (/copy|kopieren|testunternehmen|test company|demo|cronos|cronus/i.test(label)) {
    risk.push('copy-test-demo-or-cronus-route');
  }
  if (/finish|fertig|ok|create|erstellen|save|speichern|yes|ja/i.test(label) && !/^create new company$/i.test(label.trim())) {
    risk.push('could-confirm-or-create');
  }

  const exactCreate = /^create new company$/i.test(label.trim());
  const exactAssistedSetup = /^(assisted setup|unterstuetzte einrichtung|unterstützte einrichtung)$/i.test(label.trim());
  const safeToClick = risk.length === 0 && (exactCreate || exactAssistedSetup);
  return { risk, safeToClick };
}

async function collectSearchCandidates(page: Page, term: string) {
  await searchFor(page, term);
  const candidates: Candidate[] = [];

  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .locator('a,button,[role="button"],[role="menuitem"],[role="option"],[aria-label],[title]')
      .evaluateAll((elements) =>
        elements.slice(0, 180).map((element) => {
          const htmlElement = element as HTMLElement;
          const rect = htmlElement.getBoundingClientRect();
          const href = (htmlElement as HTMLAnchorElement).href || htmlElement.getAttribute('href');
          const text = (htmlElement.innerText || htmlElement.textContent || '').replace(/\s+/g, ' ').trim();
          const ariaLabel = htmlElement.getAttribute('aria-label') || '';
          const title = htmlElement.getAttribute('title') || '';
          return {
            tagName: htmlElement.tagName,
            role: htmlElement.getAttribute('role'),
            text,
            ariaLabel,
            title,
            href,
            visible: rect.width > 0 && rect.height > 0,
            boundingBox: rect.width > 0 && rect.height > 0
              ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
              : null
          };
        })
      )
      .catch(() => []);

    for (const candidate of frameCandidates) {
      const label = [candidate.text, candidate.ariaLabel, candidate.title].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      if (!label || !/company|unternehmen|mandant|assisted|einricht|setup|create new/i.test(label)) {
        continue;
      }
      const classification = classifyCandidate(label, candidate.href);
      candidates.push({
        frameUrl: frame.url(),
        tagName: candidate.tagName,
        role: candidate.role,
        text: sanitizeEvidenceText(candidate.text),
        ariaLabel: sanitizeEvidenceText(candidate.ariaLabel),
        title: sanitizeEvidenceText(candidate.title),
        href: candidate.href,
        label: sanitizeEvidenceText(label),
        visible: candidate.visible,
        boundingBox: candidate.boundingBox,
        risk: classification.risk,
        safeToClick: classification.safeToClick
      });
    }
  }

  return candidates;
}

async function clickFirstSafeCandidate(page: Page, candidates: Candidate[]) {
  const candidate = candidates.find((entry) => entry.safeToClick && entry.boundingBox);
  if (!candidate?.boundingBox) {
    return { clicked: false, reason: 'no-safe-exact-create-new-company-or-assisted-setup-candidate' };
  }

  await page.mouse.click(candidate.boundingBox.x + candidate.boundingBox.width / 2, candidate.boundingBox.y + candidate.boundingBox.height / 2);
  await page.waitForTimeout(5000);
  return { clicked: true, label: candidate.label };
}

async function writeScreenshotMetadata(fileName: string, value: Record<string, unknown>) {
  await writeJson(fileName.replace(/\.png$/i, '.screenshot.json'), {
    fileName,
    imagePath: path.resolve('playwright/projects/fibu-book5/img', fileName),
    ...value
  });
}

test('TARGET-005 source-backed alternative company creation route discovery', async ({ page }) => {
  test.setTimeout(180_000);

  const companiesUrl = buildPlaythruUrl(357);
  const assistedSetupUrl = buildPlaythruUrl(1801);
  const startedAt = new Date().toISOString();
  const sourceBasis = {
    source: 'Microsoft Learn: Create new companies in Business Central',
    url: 'https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company',
    localRegistry: 'playwright/projects/fibu-book5/BC-SOURCE-REGISTRY.md',
    acceptedOptions: ['Production - Setup Data Only', 'Create New - No Data'],
    rejectedOptions: ['Copy Company', 'Test Company', 'Evaluation - Sample Data', 'CRONUS copy', 'direct Companies list-row save']
  };
  const directAssistedSetup = {
    attempted: false,
    opened: false,
    url: sanitizeUrl(assistedSetupUrl),
    text: '',
    companyCreationHints: [] as string[],
    error: ''
  };

  await page.goto(companiesUrl);
  await waitForBcReady(page, { expectedText: /Mandanten|Companies|Name|Anzeigename|Display Name|Testunternehmen/i });
  await dismissTours(page);

  const beforeText = await compactPageText(page, {
    include: [/Mandanten|Companies|Name|Anzeigename|Display Name|UNIVERSAARL|CRONUS|My Company|Neu|New|Kopieren|Copy|Testunternehmen|Assisted|Einricht/i],
    maxLines: 60
  }).then(sanitizeBusinessText);
  expect(beforeText).not.toMatch(/UNIVERSAARL-DE/i);

  await screenshot(page, 'target-005-010-companies-source-route-before.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: 'candidate',
    bookUse: 'navigation',
    purpose: 'Companies page before source-backed alternative route discovery.',
    expectedPageText: [/Mandanten|Companies/i],
    knownLimitations: ['UNIVERSAARL-DE does not exist yet.', 'Visible CRONUS/Shell company is not Universaarl final proof.']
  });
  await writeScreenshotMetadata('target-005-010-companies-source-route-before.png', {
    status: 'candidate',
    bookUse: 'navigation',
    page: 'Companies / Mandanten, Page 357',
    instance: 'playthru',
    company: 'Shell context before UNIVERSAARL-DE exists',
    step: 'Before source-backed route discovery',
    visibleLearning: 'The Companies page is the list where existing companies are checked before creation.',
    importantUi: ['Name', 'Display Name/Anzeigename', 'New/Neu', 'Copy/Kopieren', 'Testunternehmen'],
    internallyProves: ['UNIVERSAARL-DE is not visible in the captured Companies context.'],
    doesNotProve: ['Company creation', 'wizard data basis', 'setup', 'posting'],
    qualityDecision: 'usable-context-screenshot',
    finalScreenshotStatus: 'german-final-candidate-context'
  });

  directAssistedSetup.attempted = true;
  try {
    await page.goto(assistedSetupUrl);
    await waitForBcReady(page, { expectedText: /Assisted Setup|Unterst.tzte Einrichtung|Einrichtung|Setup/i, timeout: 60_000 });
    await dismissTours(page);
    directAssistedSetup.text = await compactPageText(page, {
      include: [/Assisted Setup|Unterst.tzte Einrichtung|Setup|Company|Unternehmen|Mandant|Create New|Production|No Data|Daten|Demo|CRONUS|Copy|Kopieren/i],
      maxLines: 120
    }).then(sanitizeBusinessText);
    directAssistedSetup.opened = /Assisted Setup|Unterst.tzte Einrichtung|Einrichtung|Setup/i.test(directAssistedSetup.text);
    directAssistedSetup.companyCreationHints = directAssistedSetup.text
      .split('\n')
      .filter((line) => /company|unternehmen|mandant|create new|setup data|no data/i.test(line))
      .slice(0, 20);
  } catch (error) {
    directAssistedSetup.error = error instanceof Error ? error.message : String(error);
  }

  const createCandidates = directAssistedSetup.opened ? [] : await collectSearchCandidates(page, 'Create New Company');
  const createClick = await clickFirstSafeCandidate(page, createCandidates);
  let routeOpened = directAssistedSetup.opened || createClick.clicked;
  let routeType = directAssistedSetup.opened ? 'direct-assisted-setup-page-1801' : createClick.clicked ? 'create-new-company-search-result' : 'none';

  let assistedCandidates: Candidate[] = [];
  let assistedClick: Awaited<ReturnType<typeof clickFirstSafeCandidate>> | undefined;
  if (!routeOpened) {
    await page.goto(companiesUrl);
    await waitForBcReady(page, { expectedText: /Mandanten|Companies|Name|Anzeigename|Display Name|Testunternehmen/i });
    await dismissTours(page);
    assistedCandidates = await collectSearchCandidates(page, 'Assisted Setup');
    assistedClick = await clickFirstSafeCandidate(page, assistedCandidates);
    routeOpened = assistedClick.clicked;
    routeType = assistedClick.clicked ? 'assisted-setup-search-result' : 'none';
  }

  await screenshot(page, 'target-005-020-after-source-backed-route-discovery.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: routeOpened ? 'candidate' : 'rejected',
    bookUse: routeOpened ? 'navigation' : 'do-not-use',
    purpose: 'Source-backed route discovery after safe filtered search result handling.',
    expectedPageText: [/Business Central|Mandanten|Companies|Assisted|Einricht|Setup|Company|Unternehmen/i],
    knownLimitations: ['No Finish, Create, OK, Save, Copy Company, Testunternehmen or CRONUS route was confirmed.']
  });
  await writeScreenshotMetadata('target-005-020-after-source-backed-route-discovery.png', {
    status: routeOpened ? 'candidate' : 'rejected',
    bookUse: routeOpened ? 'navigation' : 'do-not-use',
    page: routeOpened ? 'Source-backed candidate route context' : 'Search result inventory context',
    instance: 'playthru',
    company: 'Shell context before UNIVERSAARL-DE exists',
    step: 'After filtered Create New Company / Assisted Setup route discovery',
    visibleLearning: routeOpened
      ? 'A source-backed route context can be reached without selecting Copy Company, Testunternehmen or CRONUS.'
      : 'The filtered search did not prove a safe exact source-backed route from the current UI context.',
    importantUi: ['Create New Company', 'Assisted Setup', 'blocked external Learn/help results', 'no Finish/Create confirmation'],
    internallyProves: routeOpened
      ? [
          directAssistedSetup.opened
            ? 'The direct Assisted Setup page opened without confirming company creation.'
            : 'A filtered source-backed navigation candidate was clicked without confirming company creation.'
        ]
      : ['No safe exact route candidate was clicked.'],
    doesNotProve: ['UNIVERSAARL-DE creation', 'blank/setup-only wizard fields', 'Production - Setup Data Only selection', 'setup completion'],
    qualityDecision: routeOpened ? 'usable-route-context' : 'rejected-route-context',
    finalScreenshotStatus: routeOpened ? 'german-final-candidate-preflight' : 'not-final-rejected'
  });

  const afterText = await compactPageText(page, {
    include: [/Create New Company|New Company|Assisted|Setup|Einricht|Company|Unternehmen|Mandanten|Companies|Production|Setup Data|No Data|Sample|Demo|CRONUS|Copy|Kopieren|Testunternehmen|Finish|Fertig|OK|Erstellen|Create/i],
    maxLines: 100
  }).then(sanitizeBusinessText);
  const fullText = await pageText(page).then(sanitizeBusinessText);
  const sanitizedUrl = sanitizeUrl(page.url());
  const stillInsideBusinessCentral = /businesscentral\.dynamics\.com/i.test(page.url());
  const externalLearnOpened = /learn\.microsoft|training/i.test(page.url()) || /Microsoft Learn|Training/i.test(fullText);
  const hasBlankOrSetupOnlyOption = /Production\s*-\s*Setup Data Only|Create New\s*-\s*No Data|Setup Data Only|No Data|leere|leer|nur einricht/i.test(fullText);
  const hasForbiddenRouteOnly = /Copy Company|Kopieren|Testunternehmen|Evaluation\s*-\s*Sample Data|Sample Data|Demo|CRONUS/i.test(fullText) && !hasBlankOrSetupOnlyOption;
  const routeUsableForNextGate = routeOpened && stillInsideBusinessCentral && !externalLearnOpened && hasBlankOrSetupOnlyOption && !hasForbiddenRouteOnly;

  const status = routeUsableForNextGate
    ? 'observed-source-backed-blank-or-setup-route'
    : routeOpened
      ? 'blocked-route-opened-but-data-basis-not-proven'
      : 'blocked-no-safe-source-backed-route';

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-universaarl-target',
    resultStatus: status.startsWith('observed') ? 'observed' : 'blocked',
    startedAt,
    completedAt: new Date().toISOString(),
    instance: 'playthru',
    targetCompany: TARGET_COMPANY,
    currentUrl: sanitizedUrl,
    pageTitle: await page.title().then(sanitizeEvidenceText).catch(() => ''),
    sourceBasis,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChangeFromTest: true,
      noFinishCreateOkSave: true,
      noCopyCompany: true,
      noTestCompany: true,
      noCronusCopy: true
    },
    routeDiscovery: {
      routeType,
      createClick,
      assistedClick,
      routeOpened,
      stillInsideBusinessCentral,
      externalLearnOpened,
      hasBlankOrSetupOnlyOption,
      hasForbiddenRouteOnly,
      routeUsableForNextGate,
      directAssistedSetup,
      createCandidates: createCandidates.slice(0, 50),
      assistedCandidates: assistedCandidates.slice(0, 50)
    },
    visibleText: {
      beforeText,
      afterText
    },
    screenshots: [
      'playwright/projects/fibu-book5/img/target-005-010-companies-source-route-before.png',
      'playwright/projects/fibu-book5/img/target-005-020-after-source-backed-route-discovery.png'
    ],
    proved: [
      'playthru Companies context can be opened by direct Page 357 URL without a company switch.',
      directAssistedSetup.opened
        ? 'The direct Assisted Setup page 1801 can be opened in playthru without Finish/Create/OK/Save.'
        : routeOpened
          ? 'A filtered source-backed navigation candidate was clicked without Finish/Create/OK/Save.'
          : 'No safe exact Create New Company or Assisted Setup candidate was clicked from the current filtered search context.'
    ],
    notProved: [
      'UNIVERSAARL-DE was not created.',
      'No wizard Finish/Create/OK/Save was clicked.',
      'No Production - Setup Data Only or Create New - No Data route is final unless the option is visible and mapped.',
      'Company creation remains locked until blank/setup-only data basis is proven immediately before the effective action.'
    ],
    blockedBy: routeUsableForNextGate
      ? []
      : [
          routeOpened
            ? 'source-backed-route-opened-but-blank-or-setup-only-data-basis-not-proven'
            : 'no-safe-exact-source-backed-create-company-route-found'
        ],
    safeToFinalizeState: true,
    requiresReview: !routeUsableForNextGate,
    statePatch: {
      current: {
        activeCase: CASE_ID,
        active_case_file: '.agent/state/cases/target-005-company-creation-source-backed-alternative-route.json',
        nextStep: routeUsableForNextGate
          ? 'TARGET-006: map the visible blank/setup-only company creation wizard fields and prepare a Smart Decision Card before any Finish/Create action.'
          : 'TARGET-006: use a more specific safe route to reach the Create New Company assisted setup guide; do not repeat Companies list-row save, Copy Company, Testunternehmen, CRONUS or blind Tell-Me Enter.',
        latestTarget005: {
          status,
          resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-005-result.json`,
          routeType,
          routeUsableForNextGate,
          noCompanyCreated: true
        }
      }
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-005-COMPANY-CREATION-SOURCE-BACKED-ALTERNATIVE-ROUTE',
      lastEvidenceSummary:
        'TARGET-001 to TARGET-004 proved playthru context, Companies page, rejected direct list-row save and rejected scoped menu paths. TARGET-005 tested a source-backed filtered route without creating data.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'The target company still does not exist, so foundation setup and business processes remain blocked until a safe company creation route is proven.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-006-COMPANY-CREATION-WIZARD-FIELD-MAP',
          status: routeUsableForNextGate ? 'ready-next' : 'needs-ui-discovery-first',
          reason: routeUsableForNextGate
            ? 'A candidate route can be mapped before any effective action.'
            : 'The assistant route is not sufficiently proven yet.'
        },
        {
          caseId: 'TARGET-004-FOUNDATION-SETUP-READINESS',
          status: 'ready-after-current',
          reason: 'Only meaningful after UNIVERSAARL-DE exists.'
        },
        {
          caseId: 'TARGET-005-NUMBER-SERIES-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Requires created company and foundation setup context.'
        },
        {
          caseId: 'TARGET-006-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Requires created company and baseline setup.'
        },
        {
          caseId: 'TARGET-007-DIMENSIONS-FOUNDATION',
          status: 'ready-after-current',
          reason: 'Can follow after company and foundation setup.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: routeUsableForNextGate
        ? 'TARGET-006-COMPANY-CREATION-WIZARD-FIELD-MAP'
        : 'TARGET-006-COMPANY-CREATION-SPECIFIC-ASSISTED-SETUP-ROUTE',
      whySelectedNextCaseIsBest: routeUsableForNextGate
        ? 'The next risk is field/data-basis mapping before a create action.'
        : 'The next risk is finding the exact assistant route without opening external help or repeating rejected paths.',
      risksBeforeNextCase: [
        'Search results may include external help links.',
        'The UI may expose only copy/test/demo options.',
        'Any Finish/Create/OK/Save action is still default-locked.'
      ],
      requiredPreparation: [
        'Use source registry and screenshot metadata.',
        'Reject Copy Company, Testunternehmen, Demo and CRONUS routes.',
        'Stop before effective wizard confirmation.'
      ]
    },
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-005-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-005.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/route-candidates.json`
    ],
    validationCommands: [
      'npm run agent:preflight',
      'npm run agent:context',
      'npm run agent:dry-run',
      'npm run agent:run-plan',
      'npm run fibu:target:company-creation-source-route',
      `npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-005-result.json`,
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await writeJson('route-candidates.json', {
    caseId: CASE_ID,
    sourceBasis,
    directAssistedSetup,
    createCandidates,
    assistedCandidates
  });
  await writeJson('TARGET-005-result.json', result);
  await writeText(
    'TARGET-005.md',
    [
      '# TARGET-005 Source-backed Company Creation Route',
      '',
      '| Punkt | Ergebnis |',
      '|---|---|',
      `| Instanz | playthru |`,
      `| Zielcompany | ${TARGET_COMPANY} |`,
      `| Quelle | ${sourceBasis.url} |`,
      `| Route | ${routeType} |`,
      `| Route geoeffnet | ${routeOpened ? 'ja' : 'nein'} |`,
      `| Blank/setup-only Option sichtbar | ${hasBlankOrSetupOnlyOption ? 'ja' : 'nein'} |`,
      `| Fuer naechstes Gate nutzbar | ${routeUsableForNextGate ? 'ja' : 'nein'} |`,
      '',
      '## Grenze',
      '',
      '- Keine Company wurde erstellt.',
      '- Kein Finish/Create/OK/Save wurde bestaetigt.',
      '- Copy Company, Testunternehmen, Demo und CRONUS bleiben abgelehnt.',
      '',
      '## Naechster Schritt',
      '',
      routeUsableForNextGate
        ? 'Den sichtbaren Assistenten im naechsten Case feldweise mappen und erst danach eine Smart Decision Card fuer die wirksame Erstellung schreiben.'
        : 'Einen spezifischeren UI-Pfad zum Create-New-Company-/Assisted-Setup-Guide suchen, ohne externe Help-/Learn-Treffer oder blindes Enter zu verwenden.',
      ''
    ].join('\n')
  );

  if (!routeUsableForNextGate) {
    test.info().annotations.push({
      type: 'blocked',
      description: result.blockedBy.join(', ')
    });
  }
});
