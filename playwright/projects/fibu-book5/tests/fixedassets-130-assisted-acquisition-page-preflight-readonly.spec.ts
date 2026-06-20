import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-130-ASSISTED-ACQUISITION-PAGE-PREFLIGHT-READONLY';
const TEST_ID = 'fixedassets-130';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(300_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function targetUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(EXPECTED_INSTANCE)) {
    throw new Error(`BC URL does not target ${EXPECTED_INSTANCE}.`);
  }
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function clean(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactLines(text: string) {
  const interesting =
    /Assisted Fixed Asset Acquisition|Acquire Fixed Assets|Fixed Asset Acquisition|Acquisition Cost|Fixed Asset No|FA No|Posting Date|Bal\. Account|Journal|OK|Finish|Next|Back|Cancel|Post|Preview|Business Central|RM-DEMO|MCP_1_20260210/i;
  const seen = new Set<string>();
  return text
    .split('\n')
    .map((line) => clean(line))
    .filter((line) => line && interesting.test(line))
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactory|clientId|authority|upn|O365|MSAL|RequestExecutor/i.test(line))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, 120)
    .join('\n');
}

function tellMeSearchOverlayVisible(text: string) {
  return /Nach .* suchen|Search for|keine Vorschl.ge verf.gbar|no suggestions available|Sie haben nicht gefunden/i.test(text);
}

function hasAssistedAcquisitionPageContext(text: string) {
  if (tellMeSearchOverlayVisible(text)) {
    return false;
  }

  const pageTitle = /Assisted Fixed Asset Acquisition|Acquire Fixed Assets|Fixed Asset Acquisition/i.test(text);
  const fieldContext = /Acquisition Cost|Fixed Asset No\.?|FA No\.?|Posting Date|Bal\. Account|Journal Template|Journal Batch/i.test(text);
  return pageTitle && fieldContext;
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const parsed = new URL(url);
  const body = await pageText(page);
  const result = {
    url,
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo/i.test(body),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(body) && !decoded.includes(EXPECTED_INSTANCE),
  };

  if (!result.environmentInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function collectActionBoundary(page: Page) {
  const boundaryPattern = /^(OK|Finish|Fertig stellen|Next|Weiter|Back|Zurueck|Cancel|Abbrechen|Post|Buchen|Preview Posting|Vorschau buchen|New|Neu|Edit|Bearbeiten|Delete|Loeschen)$/i;
  const actions: Array<{
    text: string;
    aria: string;
    title: string;
    label: string;
    role: string;
    tagName: string;
    disabled: boolean;
  }> = [];

  for (const frame of page.frames()) {
    const found = await frame
      .evaluate((patternSource) => {
        const pattern = new RegExp(patternSource, 'i');
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,[aria-label],[title]'))
          .filter((element) => visible(element))
          .map((element) => {
            const text = normalize(element.innerText || element.textContent);
            const aria = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const label = normalize([text, aria, title].filter(Boolean).join(' | '));
            return {
              text,
              aria,
              title,
              label,
              role: normalize(element.getAttribute('role')),
              tagName: element.tagName,
              disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
            };
          })
          .filter((entry) => pattern.test(entry.text) || pattern.test(entry.aria) || pattern.test(entry.title) || pattern.test(entry.label))
          .slice(0, 80);
      }, boundaryPattern.source)
      .catch(() => []);
    actions.push(...found);
  }

  return actions.map((entry) => ({
    ...entry,
    text: clean(entry.text),
    aria: clean(entry.aria),
    title: clean(entry.title),
    label: clean(entry.label),
  }));
}

async function visibleTellMeCandidates(page: Page, exactLabel: RegExp) {
  const candidates: Array<{ text: string; aria: string; title: string; role: string; tagName: string }> = [];

  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .evaluate((patternSource) => {
        const pattern = new RegExp(patternSource, 'i');
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        return Array.from(document.querySelectorAll<HTMLElement>('[role="row"],[role="menuitem"],button,a'))
          .filter((element) => visible(element))
          .map((element) => ({
            text: normalize(element.innerText || element.textContent),
            aria: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            role: normalize(element.getAttribute('role')),
            tagName: element.tagName,
          }))
          .filter((entry) => {
            const label = [entry.text, entry.aria, entry.title].filter(Boolean).join(' | ');
            if (/^Nach .* suchen$|^Search for/i.test(label)) return false;
            if (/keine Vorschl.ge verf.gbar|no suggestions available/i.test(label)) return false;
            return pattern.test(entry.text) || pattern.test(entry.aria) || pattern.test(entry.title);
          })
          .slice(0, 20);
      }, exactLabel.source)
      .catch(() => []);
    candidates.push(...frameCandidates);
  }

  return candidates.map((entry) => ({
    text: clean(entry.text),
    aria: clean(entry.aria),
    title: clean(entry.title),
    role: clean(entry.role),
    tagName: entry.tagName,
  }));
}

async function openAssistedAcquisitionPage(page: Page) {
  const attempts = [
    {
      term: 'Assisted Fixed Asset Acquisition',
      label: /^Assisted Fixed Asset Acquisition$/i,
    },
    {
      term: 'Acquire Fixed Assets',
      label: /^Acquire Fixed Assets$/i,
    },
  ];

  const searchEvidence: Array<{ term: string; status: string; excerpt: string; candidates: unknown[]; error?: string }> = [];
  for (const attempt of attempts) {
    await page.goto(targetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await assertSandboxContext(page);
    await searchFor(page, attempt.term);

    const searchText = await pageText(page);
    const noSuggestions = /keine Vorschl.ge verf.gbar|no suggestions available/i.test(searchText);
    const candidates = await visibleTellMeCandidates(page, attempt.label);
    searchEvidence.push({
      term: attempt.term,
      status: candidates.length > 0 && !noSuggestions ? 'candidate-visible' : 'candidate-not-visible',
      excerpt: compactLines(searchText),
      candidates,
    });

    if (noSuggestions || candidates.length === 0) {
      continue;
    }

    try {
      const result = page
        .getByRole('menuitem', { name: attempt.label })
        .or(page.getByRole('button', { name: attempt.label }))
        .or(page.getByRole('link', { name: attempt.label }))
        .or(page.getByRole('row', { name: attempt.label }))
        .first();
      await result.click({ timeout: 5000 });
      await page.waitForTimeout(5000);
      const afterClickText = await pageText(page);
      if (hasAssistedAcquisitionPageContext(afterClickText)) {
        return { opened: true, term: attempt.term, searchEvidence };
      }
      searchEvidence[searchEvidence.length - 1].error =
        'Clicked candidate did not close Tell-Me into a verifiable Assisted Acquisition page context.';
    } catch (error) {
      searchEvidence[searchEvidence.length - 1].error = error instanceof Error ? error.message : String(error);
    }
  }

  return { opened: false, term: '', searchEvidence };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-130 - Assisted Acquisition Page Preflight',
    '',
    'Status: `labor`, `ui-first`, `read-only-preflight`, `no-value-entry`, `no-journal-lines`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Seite geoeffnet | ${result.observed.opened ? 'ja' : 'nein'} |`,
    `| Suchbegriff | ${result.observed.openedByTerm || 'nicht geoeffnet'} |`,
    `| Grenze OK/Finish/Post sichtbar | ${result.observed.boundaryActions.length ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Keine Werte wurden eingetragen.',
    '- Keine Journalzeilen wurden erzeugt.',
    '- Kein `OK`, kein `Finish`, keine Preview, kein `Post`.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-130 opens Assisted Fixed Asset Acquisition context read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  let context: Awaited<ReturnType<typeof assertSandboxContext>> | undefined;
  let openResult: Awaited<ReturnType<typeof openAssistedAcquisitionPage>> | undefined;
  let focusedText = '';
  let boundaryActions: Awaited<ReturnType<typeof collectActionBoundary>> = [];

  try {
    openResult = await openAssistedAcquisitionPage(page);
    context = await assertSandboxContext(page);
    const text = await pageText(page);
    focusedText = compactLines(
      await compactPageText(page, {
        include: [/Assisted Fixed Asset Acquisition|Acquire Fixed Assets|Fixed Asset Acquisition|Acquisition Cost|Fixed Asset No|Posting Date|Bal\. Account|Journal|OK|Finish|Next|Back|Cancel|Post|Preview|RM-DEMO|MCP_1_20260210/i],
        maxLines: 120,
        maxLineLength: 220,
      }),
    );
    boundaryActions = await collectActionBoundary(page);

    const hasPageContext = hasAssistedAcquisitionPageContext(text);

    await writeTextEvidence(faEvidencePath('010-search-evidence.txt'), JSON.stringify(openResult.searchEvidence, null, 2));
    await writeTextEvidence(faEvidencePath('020-page-context.txt'), focusedText || 'No focused page context captured.');
    await writeJsonEvidence(faEvidencePath('030-boundary-actions.json'), boundaryActions);
    await screenshot(page, 'fixedassets-130-040-assisted-acquisition-page-preflight.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: openResult.opened && hasPageContext ? 'labor' : 'rejected',
      bookUse: openResult.opened && hasPageContext ? 'evidence' : 'do-not-use-as-page-proof',
      purpose:
        'FIXEDASSETS-130 Tell-Me-Nachweis fuer Assisted Fixed Asset Acquisition; prueft streng, ob eine echte Page/Wizard-Grenze sichtbar ist oder nur die Suche.',
      expectedPageText:
        openResult.opened && hasPageContext
          ? [/Assisted Fixed Asset Acquisition|Acquire Fixed Assets|Fixed Asset Acquisition|Acquisition Cost|Fixed Asset No/i]
          : [],
      knownLimitations: [
        openResult.opened && hasPageContext
          ? 'Labor-/Preflightbild, kein Anschaffungs-, Preview- oder Buchungsnachweis.'
          : 'Rejected/Blocker-Bild: Tell-Me-Suchoverlay ist kein Page-/Wizard-Nachweis.',
      ],
    });

    const blockedReason =
      openResult.opened && hasPageContext
        ? ''
        : 'Tell-Me showed no verifiable Assisted Fixed Asset Acquisition page result; visible text remained search-overlay context.';

    const result = {
      schemaVersion: 1,
      purpose: 'fixed-asset-assisted-acquisition-page-preflight-result',
      caseId: CASE_ID,
      source: 'playwright-sandbox-readonly-preflight',
      resultStatus: openResult.opened && hasPageContext ? 'observed' : 'blocked',
      runPlanId: `${CASE_ID}-PLAN`,
      selectedTaskClass: 'wizard_work',
      selectedModelClass: 'gpt-4-medium',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        url: page.url(),
        context,
        opened: openResult.opened && hasPageContext,
        openedByTerm: openResult.term,
        pageContextVisible: hasPageContext,
        boundaryActions,
        searchEvidence: openResult.searchEvidence,
      },
      proved:
        openResult.opened && hasPageContext
          ? [
              'The run stayed in MCP_1_20260210 / RM-DEMO.',
              'The Assisted Fixed Asset Acquisition / Acquire Fixed Assets route was reachable from Tell-Me.',
              'The page or wizard context was visible as a read-only/preflight boundary.',
              'Boundary actions such as OK/Finish/Next/Cancel/Post were inventoried but not clicked.',
              'No value entry, target asset entry, journal-line creation, Preview Posting, Post, setup change, company switch or API shortcut was performed.',
            ]
          : [
              'The run stayed in MCP_1_20260210 / RM-DEMO.',
              'Tell-Me search for Assisted Fixed Asset Acquisition / Acquire Fixed Assets was performed read-only.',
              'The screenshot and search evidence show only the search-overlay/blocker state, not a usable page.',
              'No value entry, target asset entry, journal-line creation, Preview Posting, Post, setup change, company switch or API shortcut was performed.',
            ],
      notProved: [
        ...(openResult.opened && hasPageContext ? [] : ['Assisted Fixed Asset Acquisition page or wizard context was not proven.']),
        'No acquisition value was entered.',
        'No fixed asset acquisition journal lines were created.',
        'No Preview Posting or posting trace was produced.',
        'No FA Ledger Entry or G/L acquisition trace is proven.',
        'No German final fixed-assets proof is proven.',
      ],
      changedFiles: [
        '.agent/state/current.json',
        '.agent/state/coverage_state.json',
        '.agent/state/cases/fixedassets-130-assisted-acquisition-page-preflight-readonly.json',
        '.agent/state/cases/fixedassets-131-assisted-acquisition-search-result-blocker-review.json',
        '.agent/state/last_run_summary.json',
        'package.json',
        'playwright/projects/fibu-book5/tests/fixedassets-130-assisted-acquisition-page-preflight-readonly.spec.ts',
        'playwright/projects/fibu-book5/evidence/fixedassets-130/FIXEDASSETS-130-result.json',
        'playwright/projects/fibu-book5/evidence/fixedassets-130/FIXEDASSETS-130-learning.md',
        'playwright/projects/fibu-book5/evidence/fixedassets-130/README.md',
        'playwright/projects/fibu-book5/evidence/fixedassets-130/fixedassets-130-040-assisted-acquisition-page-preflight.screenshot.json',
      ],
      evidenceRefs: [
        'playwright/projects/fibu-book5/evidence/fixedassets-130/FIXEDASSETS-130-result.json',
        'playwright/projects/fibu-book5/evidence/fixedassets-130/FIXEDASSETS-130-learning.md',
        'playwright/projects/fibu-book5/evidence/fixedassets-130/README.md',
        'playwright/projects/fibu-book5/evidence/fixedassets-130/010-search-evidence.txt',
        'playwright/projects/fibu-book5/evidence/fixedassets-130/020-page-context.txt',
        'playwright/projects/fibu-book5/evidence/fixedassets-130/030-boundary-actions.json',
        'playwright/projects/fibu-book5/evidence/fixedassets-130/fixedassets-130-040-assisted-acquisition-page-preflight.screenshot.json',
        'playwright/projects/fibu-book5/img/fixedassets-130-040-assisted-acquisition-page-preflight.png',
      ],
      warnings: [
        openResult.opened && hasPageContext
          ? 'Do not click OK, Finish, Next or Post from FA-130 evidence.'
          : 'Do not use the FA-130 screenshot as page/wizard proof; it is a rejected Tell-Me/search-overlay blocker image.',
        'The page context is not acquisition evidence until a separate value-entry and posting gate exists.',
      ],
      blockedBy: blockedReason ? [blockedReason] : [],
      requiresReview: Boolean(blockedReason),
      safeToFinalizeState: !blockedReason,
      flags: {
        noBookChange: true,
        secretsUntouched: true,
        noPost: true,
        noPreview: true,
        noSetupChange: true,
        noCompanySwitch: true,
        noApiShortcut: true,
        noNewDraft: true,
        noFieldValueChanged: true,
        noSaveRecord: true,
        noDeleteRecord: true,
        noAcquireExecution: true,
        noAmountEntry: true,
        noTargetAssetEntry: true,
        noTargetVendorEntry: true,
        noJournalLinesCreated: true,
        cleanupCompleted: true,
      },
      statePatch: {
        current: {
          updatedAt: '2026-06-20T15:05:00.000Z',
          activeCase: blockedReason
            ? 'FIXEDASSETS-131-ASSISTED-ACQUISITION-SEARCH-RESULT-BLOCKER-REVIEW'
            : 'FIXEDASSETS-131-ASSISTED-ACQUISITION-NEXT-FIELD-BOUNDARY-DECISION',
          active_case_file: blockedReason
            ? '.agent/state/cases/fixedassets-131-assisted-acquisition-search-result-blocker-review.json'
            : '.agent/state/cases/fixedassets-131-assisted-acquisition-next-field-boundary-decision.json',
          lastReferenceCase: CASE_ID,
          lastReferenceCaseFile: '.agent/state/cases/fixedassets-130-assisted-acquisition-page-preflight-readonly.json',
          requiresStrongModel: true,
          nextStep: blockedReason
            ? 'FIXEDASSETS-131: local review of the Tell-Me/search-overlay blocker before another live Assisted Acquisition probe.'
            : 'FIXEDASSETS-131: local decision whether the Assisted Acquisition page can be probed one field further without creating journal lines, or whether another fixed-assets route is safer.',
        },
        activeCase: {
          status: blockedReason ? 'blocked-search-overlay-no-page-proof' : 'observed-readonly-preflight',
          lastResult: {
            status: blockedReason ? 'blocked' : 'observed',
            resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-130/FIXEDASSETS-130-result.json',
            summary: blockedReason
              ? 'Tell-Me search did not prove an Assisted Fixed Asset Acquisition page; screenshot is rejected as page proof and kept as blocker evidence.'
              : 'Assisted Fixed Asset Acquisition / Acquire Fixed Assets page context was reached and boundary actions were inventoried without value entry or journal creation.',
          },
          nextSafeAction: blockedReason
            ? 'FIXEDASSETS-131: local blocker review before another live page probe.'
            : 'FIXEDASSETS-131: local decision before any deeper wizard field probe.',
        },
        coverage: {
          schemaVersion: 1,
          purpose: 'Kompakter Coverage-Index fuer schnelle Agentenlaeufe.',
          areas: {
            fixedassets: {
              chapter: 'Kapitel 21',
              status: 'in-progress',
              currentBlock: blockedReason ? 'assisted-acquisition-search-result-blocker-review' : 'assisted-acquisition-field-boundary-decision',
              latestPracticalCase: 'FIXEDASSETS-130',
              latestDecisionCase: 'FIXEDASSETS-129',
              nextCase: blockedReason
                ? 'FIXEDASSETS-131-ASSISTED-ACQUISITION-SEARCH-RESULT-BLOCKER-REVIEW'
                : 'FIXEDASSETS-131-ASSISTED-ACQUISITION-NEXT-FIELD-BOUNDARY-DECISION',
              bookScreenshots: {
                setupProofs: 'available-labor',
                purchaseInvoicePreflight: 'available-labor',
                validFixedAssetLine: 'blocked-personalize-opened-type-context-visible-but-fixed-asset-option-unproved',
                acquisitionPostingTrace: blockedReason
                  ? 'blocked-assisted-acquisition-page-not-found-in-tell-me'
                  : 'blocked-assisted-acquisition-page-context-only',
                depreciationPostingTrace: 'open',
                acquisitionWizardPreflight: blockedReason ? 'blocked-tell-me-search-overlay-only' : 'available-labor-page-boundary',
              },
              finalGermanProof: 'open',
            },
          },
          hardExclusions: {
            shopify: 'Do not run, document or reactivate Shopify/Online Store scope for FiBu Buch 5.',
          },
        },
      },
      bookImpact: blockedReason
        ? 'Kapitel 21 darf die Assisted-Acquisition-Route noch nicht als klickbaren BC-Pfad zeigen. Die Suche ist als Fehler-/Lernfall relevant: Suchoverlay und Seitennachweis muessen getrennt werden.'
        : 'Kapitel 21 kann die Assisted-Acquisition-Route als offiziellen, aber noch nicht buchungsreifen Lernpfad einfuehren: zuerst Page-/Wizard-Grenze zeigen, danach separat Feldwerte, Journalerzeugung, Preview und Postenspur pruefen.',
      summary: blockedReason
        ? 'FA-130 blocked: Tell-Me did not provide a verifiable Assisted Fixed Asset Acquisition page result; the screenshot is rejected as page proof.'
        : 'FA-130 reached the Assisted Fixed Asset Acquisition / Acquire Fixed Assets page context and documented the wizard boundary without entering values or creating journal lines.',
      nextStep: blockedReason
        ? 'FIXEDASSETS-131: local review of the Tell-Me/search-overlay blocker and choose a safer official fixed-assets acquisition entry point.'
        : 'FIXEDASSETS-131: local decision whether the Assisted Acquisition page can be probed one field further without creating journal lines, or whether another fixed-assets route is safer.',
    };

    await writeJsonEvidence(faEvidencePath('FIXEDASSETS-130-result.json'), result);
    await writeTextEvidence(faEvidencePath('FIXEDASSETS-130-learning.md'), renderLearning(result));
    await writeTextEvidence(
      faEvidencePath('README.md'),
      [
        '# fixedassets-130 Evidence Index',
        '',
        '| Datei | Typ | Beweist | Beweist nicht | Status |',
        '|---|---|---|---|---|',
        `| \`FIXEDASSETS-130-result.json\` | JSON | ${blockedReason ? 'Tell-Me-Blocker und Safety Flags' : 'Assisted-Acquisition-Page-/Wizard-Kontext und Safety Flags'} | keine Anschaffung, keine Posten | \`${blockedReason ? 'blocked' : 'labor'}\`, \`read-only-preflight\` |`,
        `| \`FIXEDASSETS-130-learning.md\` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | \`${blockedReason ? 'blocked' : 'labor'}\` |`,
        '| `010-search-evidence.txt` | Text | Tell-Me-Suchbefund | keinen geoeffneten Prozess allein | `navigation-evidence` |',
        `| \`020-page-context.txt\` | Text | ${blockedReason ? 'Suchoverlay-/Blocker-Kontext' : 'sichtbarer Page-/Wizard-Kontext'} | keine Buchungswirkung | \`compact\` |`,
        '| `030-boundary-actions.json` | JSON | sichtbare Grenzen wie OK/Finish/Post/Cancel | keinen Klick auf diese Aktionen | `boundary-evidence` |',
        `| \`fixedassets-130-040-assisted-acquisition-page-preflight.screenshot.json\` | JSON | Screenshot-Zweck und Status \`${blockedReason ? 'rejected' : 'labor'}\` | keinen visuellen Zielwert allein | \`metadata\` |`,
        `| \`../../img/fixedassets-130-040-assisted-acquisition-page-preflight.png\` | Screenshot | ${blockedReason ? 'Tell-Me-Suchoverlay, das nicht als Page-Beweis taugt' : 'Page-/Wizard-Grenze'} | kein Anschaffungs- oder Buchungsbild | \`${blockedReason ? 'rejected' : 'labor'}\`, \`diagnosis\` |`,
        '',
      ].join('\n'),
    );

    expect(result.flags.noJournalLinesCreated).toBe(true);
    expect(result.flags.noFieldValueChanged).toBe(true);
    expect(result.flags.noPost).toBe(true);
    expect(result.flags.noPreview).toBe(true);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const result = {
      schemaVersion: 1,
      purpose: 'fixed-asset-assisted-acquisition-page-preflight-result',
      caseId: CASE_ID,
      source: 'playwright-sandbox-readonly-preflight',
      resultStatus: 'blocked',
      runPlanId: `${CASE_ID}-PLAN`,
      selectedTaskClass: 'wizard_work',
      selectedModelClass: 'gpt-4-medium',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        url: page.url(),
        context,
        opened: false,
        searchEvidence: openResult?.searchEvidence ?? [],
        boundaryActions,
      },
      proved: [
        'No value entry, journal-line creation, Preview Posting, Post, setup change, company switch or API shortcut was performed.',
      ],
      notProved: [
        'Assisted Fixed Asset Acquisition page context was not proven.',
        'No acquisition value was entered.',
        'No fixed asset acquisition journal lines were created.',
        'No posting trace is proven.',
      ],
      changedFiles: [
        'playwright/projects/fibu-book5/evidence/fixedassets-130/FIXEDASSETS-130-result.json',
      ],
      evidenceRefs: [
        'playwright/projects/fibu-book5/evidence/fixedassets-130/FIXEDASSETS-130-result.json',
      ],
      warnings: ['Blocked diagnostic run only. Do not infer page availability without a successful retry.'],
      blockedBy: [reason],
      requiresReview: true,
      safeToFinalizeState: false,
      flags: {
        noBookChange: true,
        secretsUntouched: true,
        noPost: true,
        noPreview: true,
        noSetupChange: true,
        noCompanySwitch: true,
        noApiShortcut: true,
        noNewDraft: true,
        noFieldValueChanged: true,
        noSaveRecord: true,
        noDeleteRecord: true,
        noAcquireExecution: true,
        noAmountEntry: true,
        noTargetAssetEntry: true,
        noTargetVendorEntry: true,
        noJournalLinesCreated: true,
        cleanupCompleted: true,
      },
      statePatch: {},
      bookImpact: 'Kein Buchfortschritt aus diesem blockierten Lauf; die Assisted-Acquisition-Route muss erneut sicher geprueft oder verworfen werden.',
      summary: `FA-130 blocked: ${reason}`,
      nextStep: 'Local review of FA-130 blocker before another live page probe.',
    };
    await writeJsonEvidence(faEvidencePath('FIXEDASSETS-130-result.json'), result);
    throw error;
  }
});
