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

const CASE_ID = 'TARGET-004-COMPANY-CREATION-SCOPED-ACTION-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence/target-004-company-creation-scoped-action-discovery');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-004-result.json');

test.use({ storageState: 'playwright/.auth/bc-user.json' });

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
};

type MenuAttempt = {
  label: string;
  clicked: boolean;
  blockedReason?: string;
  menuItems: UiCandidate[];
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

function sanitizeUiEvidenceText(text: string) {
  return text
    .replace(new RegExp('\\u00e2\\u20ac\\u017e|\\u00e2\\u20ac\\u0153|\\u00e2\\u20ac\\u009d', 'g'), '"')
    .replace(new RegExp('\\u00e2\\u20ac\\u201c|\\u00e2\\u20ac\\u201d', 'g'), '-')
    .replace(new RegExp('\\u00e2\\u20ac\\u00a6', 'g'), '...')
    .replace(new RegExp('\\u00e2\\u201a\\u00ac', 'g'), 'EUR')
    .split('\n')
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|O365MSAL|RequestExecutor|clientId|authority|sessionStorage|upn|shouldAttachOauthTokens/i.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .concat('\n');
}

async function collectVisibleControls(page: Page, pattern: RegExp) {
  const controls: UiCandidate[] = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate((source) => {
        const matcher = new RegExp(source, 'i');
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(
          document.querySelectorAll<HTMLElement>(
            'button,a,[role="button"],[role="menuitem"],[aria-label],[title]'
          )
        )
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent).slice(0, 260);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const role = normalize(element.getAttribute('role'));
            const label = [text, ariaLabel, title].filter(Boolean).join(' | ').slice(0, 360);
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
              height: Math.round(rect.height)
            };
          })
          .filter((entry) => matcher.test(entry.label))
          .filter((entry) => !['form', 'nav'].includes(entry.tag))
          .slice(0, 200);
      }, pattern.source)
      .catch(() => []);
    controls.push(...entries);
  }
  return controls;
}

async function collectMenuItems(page: Page) {
  return collectVisibleControls(
    page,
    /Create New Company|New Company|Assisted|Setup|Company|Mandanten|Unternehmen|Neu|Kopieren|Copy|Testunternehmen|Wizard|Einricht|Vorlage|Template|Blank|Leere|Production|Produktiv|Demo|CRONUS|Finish|Fertig|OK|Erstellen/
  );
}

async function findSafeCommandBarExpanders(page: Page) {
  const candidates: (UiCandidate & { clickX: number; clickY: number; kind: string })[] = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate(() => {
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
            const text = normalize(element.innerText || element.textContent).slice(0, 260);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const role = normalize(element.getAttribute('role'));
            const label = [text, ariaLabel, title].filter(Boolean).join(' | ').slice(0, 360);
            let kind = '';
            if (/^Weitere Optionen$/i.test(ariaLabel) || /^Weitere Optionen$/i.test(title) || /^Weitere Optionen$/i.test(text)) {
              kind = 'commandbar-more-options';
            }
            if (/Verwandte Aktionen f.r Neu/i.test(ariaLabel) || /Verwandte Aktionen f.r Neu/i.test(title)) {
              kind = 'new-related-actions-dropdown';
            }
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
              clickY: Math.round(rect.y + rect.height / 2),
              kind
            };
          })
          .filter((entry) => entry.kind)
          .filter((entry) => entry.y >= 45 && entry.y <= 105)
          .filter((entry) => entry.x >= 350 && entry.x <= 1200)
          .slice(0, 20);
      })
      .catch(() => []);
    candidates.push(...entries);
  }
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.kind}:${candidate.x}:${candidate.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function clickSafeMenuExpanders(page: Page, companiesUrl: URL) {
  const attempts: MenuAttempt[] = [];
  const safeExpanders = await findSafeCommandBarExpanders(page);

  for (const expander of safeExpanders) {
    const label = `${expander.kind}:${expander.label}`;
    let clicked = false;
    let blockedReason = '';
    if (/Kopieren|Testunternehmen|Delete|L.schen|Switch|Wechsel|OK|Finish|Fertig/i.test(expander.label)) {
      blockedReason = `unsafe-expander-label:${expander.label}`;
    } else {
      await page.mouse.click(expander.clickX, expander.clickY);
      await page.waitForTimeout(1200);
      clicked = true;
      if (!/page=357/i.test(page.url())) {
        blockedReason = `wrong-page-after-expander:${sanitizeUrl(page.url())}`;
        await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
        await waitForBusinessCentralShell(page);
      }
    }
    attempts.push({
      label,
      clicked,
      blockedReason: clicked ? undefined : blockedReason || 'not-visible',
      menuItems: await collectMenuItems(page)
    });
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(300);
  }
  return attempts;
}

async function clickExactCreateNewCompanyIfVisible(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const candidates = [
      scope.getByRole('button', { name: /^Create New Company$/i }),
      scope.getByRole('menuitem', { name: /^Create New Company$/i }),
      scope.getByText(/^Create New Company$/i)
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
        await page.waitForTimeout(2500);
        return { clicked: true, details, scopeUrl: scope.url() };
      }
    }
  }
  return { clicked: false };
}

async function collectWizardRisk(page: Page) {
  const text = await pageText(page);
  const wizardLike = /Create New Company|Assisted|Setup|Einricht|Unternehmen|Company/i.test(text);
  const riskyButtons = await collectVisibleControls(page, /Finish|Fertig|OK|Erstellen|Create|Next|Weiter|Copy|Kopieren|Testunternehmen|CRONUS|Demo/i);
  return {
    wizardLike,
    riskyButtons,
    textSnippet: text.replace(/\s+/g, ' ').slice(0, 1800)
  };
}

function resultBase() {
  return {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-ui-scoped-company-action-discovery',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-004-company-creation-scoped-action-discovery/TARGET-004-result.json',
      'playwright/projects/fibu-book5/evidence/target-004-company-creation-scoped-action-discovery/TARGET-004-action-map.json',
      'playwright/projects/fibu-book5/evidence/target-004-company-creation-scoped-action-discovery/TARGET-004.md'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-004-company-creation-scoped-action-discovery/TARGET-004-result.json',
      'playwright/projects/fibu-book5/evidence/target-004-company-creation-scoped-action-discovery/TARGET-004-action-map.json',
      'playwright/projects/fibu-book5/evidence/target-004-company-creation-scoped-action-discovery/TARGET-004.md'
    ],
    statePatch: {},
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
      noSearch: true
    }
  };
}

function markdownSummary(result: {
  resultStatus: string;
  targetAlreadyVisible: boolean;
  exactCreateClicked: boolean;
  routeDecision: string;
  nextCase: string;
}) {
  return [
    '# TARGET-004 Company Creation Scoped Action Discovery',
    '',
    `Status: \`${result.resultStatus}\`, \`german-final-candidate\`.`,
    '',
    '## Ergebnis',
    '',
    '| Frage | Antwort |',
    '|---|---|',
    `| UNIVERSAARL-DE sichtbar | ${result.targetAlreadyVisible ? 'ja' : 'nein'} |`,
    `| Exakte Aktion Create New Company geklickt | ${result.exactCreateClicked ? 'ja' : 'nein'} |`,
    `| Naechster Case | \`${result.nextCase}\` |`,
    '',
    '## Routenentscheidung',
    '',
    result.routeDecision,
    '',
    '## Grenzen',
    '',
    '- Keine Company wurde erstellt.',
    '- Kein Wizard wurde mit OK, Finish, Erstellen oder Weiter bestaetigt.',
    '- Keine Copy-, Testunternehmen-, Demo- oder CRONUS-Route wurde verwendet.',
    '- Keine Suche wurde geoeffnet.',
    '- Kein Setup, kein Preview Posting und kein Posting.',
    ''
  ].join('\n');
}

test('TARGET-004 inventories scoped Companies actions without saving or copying a company', async ({ page }) => {
  test.setTimeout(8 * 60_000);
  await page.setViewportSize({ width: 2400, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const startedAt = new Date().toISOString();
  const companiesUrl = buildPlaythruUrl(357);
  await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  expect(page.url(), 'TARGET-004 must stay in playthru.').toMatch(/playthru/i);

  const beforeText = await pageText(page);
  const targetAlreadyVisible = /UNIVERSAARL-DE|Universaarl GmbH/i.test(beforeText);
  await writeEvidenceText(
    path.join(EVIDENCE_DIR, '010-companies-before-scoped-action-discovery.txt'),
    sanitizeUiEvidenceText(await compactPageText(page, {
      include: [/Mandanten|Companies|Company|Name|UNIVERSAARL|CRONUS|My Company|Neu|Kopieren|Testunternehmen|Create New Company|Assisted|Setup|Aktionen|Actions/i],
      maxLines: 240
    }))
  );
  await screenshot(page, 'target-004-010-companies-before-scoped-action-discovery.png', {
    testId: 'target-004-company-creation-scoped-action-discovery',
    status: 'candidate',
    bookUse: 'evidence',
    purpose: 'Companies-Seite vor scoped Action/Menu Discovery fuer UNIVERSAARL-DE.',
    expectedPageText: [/Mandanten|Companies|Company|Name/i],
    knownLimitations: ['Vorher-Bild; noch keine Company-Anlage.']
  });

  const initialCandidates = await collectMenuItems(page);
  const menuAttempts = await clickSafeMenuExpanders(page, companiesUrl);
  const visibleAfterMenus = await collectMenuItems(page);
  const exactCreateClick = targetAlreadyVisible
    ? { clicked: false, reason: 'target-already-visible' }
    : await clickExactCreateNewCompanyIfVisible(page);
  const wizardRisk = await collectWizardRisk(page);

  await writeEvidenceText(
    path.join(EVIDENCE_DIR, '020-after-scoped-action-discovery.txt'),
    sanitizeUiEvidenceText(await compactPageText(page, {
      include: [/Mandanten|Companies|Company|UNIVERSAARL|Create New Company|Assisted|Setup|Next|Weiter|Finish|Fertig|OK|Erstellen|Testunternehmen|Kopieren|CRONUS|Demo|Fehler|Error/i],
      maxLines: 260
    }))
  );
  await screenshot(page, 'target-004-020-after-scoped-action-discovery.png', {
    testId: 'target-004-company-creation-scoped-action-discovery',
    status: exactCreateClick.clicked ? 'candidate' : 'rejected',
    bookUse: 'evidence',
    purpose: exactCreateClick.clicked
      ? 'Exakter Create-New-Company-Pfad wurde bis zum naechsten riskanten Schritt geoeffnet; kein Finish.'
      : 'Scoped Action Discovery fand keinen sicheren exakten Create-New-Company-Pfad.',
    expectedPageText: [/Business Central/i],
    knownLimitations: ['Kein OK, kein Finish, keine Company-Anlage.']
  });

  const resultStatus = targetAlreadyVisible
    ? 'observed-existing'
    : exactCreateClick.clicked && wizardRisk.wizardLike
      ? 'observed-route-opened'
      : 'blocked';
  const nextCase =
    resultStatus === 'observed-existing'
      ? 'TARGET-004-FOUNDATION-SETUP-READINESS'
      : resultStatus === 'observed-route-opened'
        ? 'TARGET-005-COMPANY-CREATION-WIZARD-FIELD-MAP'
        : 'TARGET-005-COMPANY-CREATION-SOURCE-BACKED-ALTERNATIVE-ROUTE';
  const routeDecision =
    resultStatus === 'observed-existing'
      ? 'UNIVERSAARL-DE is already visible. Do not create a duplicate; move to Company Information and foundation setup readiness.'
      : resultStatus === 'observed-route-opened'
        ? 'An exact Create New Company route opened a wizard-like context. Stop before Finish/OK/Create and map fields, templates and data basis next.'
        : 'Scoped action/menu discovery did not expose a safe exact Create New Company route. Direct row save, Copy Company, Testunternehmen, Demo and CRONUS remain rejected; next step must use a source-backed alternative route or a more specific Business Central setup entry point.';
  const blockedBy =
    resultStatus === 'blocked' ? ['safe-create-new-company-action-not-found-after-scoped-menu-discovery'] : [];

  const result = {
    ...resultBase(),
    resultStatus,
    timestamp: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    targetCompany: TARGET_COMPANY,
    legalName: LEGAL_NAME,
    pageId: 357,
    smartDecisionCards: [
      {
        decisionId: 'TARGET-004-SCOPED-COMPANY-ACTION-DISCOVERY',
        actionCandidate: 'Open only safe scoped action/menu expanders on Companies Page 357.',
        selectedOption: 'Scoped menu/action discovery; no direct row save, no copy, no test company, no search.',
        expectedEffect: 'Find whether an exact Create New Company route is visible without creating data.',
        fallback: 'If not visible, document blocker and choose a source-backed alternative route.'
      }
    ],
    effectiveActionsTaken: menuAttempts.filter((entry) => entry.clicked).map((entry) => `opened-safe-menu:${entry.label}`),
    effectiveActionsBlocked: [
      'direct-companies-list-row-save',
      'copy-company',
      'test-company',
      'cronos-copy',
      'wizard-finish',
      'wizard-ok',
      'company-switch',
      'tell-me-search'
    ],
    initialCandidates,
    menuAttempts,
    visibleAfterMenus,
    exactCreateClick,
    wizardRisk,
    targetAlreadyVisible,
    exactCreateClicked: exactCreateClick.clicked,
    routeDecision,
    nextSensibleStep: nextCase,
    proved: [
      'Business Central direct URL Page 357 stayed in playthru.',
      targetAlreadyVisible
        ? 'UNIVERSAARL-DE or Universaarl GmbH is visible before creation.'
        : 'UNIVERSAARL-DE is not visible on Companies before route discovery.',
      'Scoped safe menu/action expanders were attempted without Tell-Me search.',
      exactCreateClick.clicked
        ? 'An exact Create New Company control was clicked without Finish/OK/Create.'
        : 'No exact safe Create New Company control was proven after scoped menu discovery.'
    ],
    notProved: [
      'UNIVERSAARL-DE was not created in this run.',
      'No blank/no-sample/setup-only data basis was proven.',
      'No wizard fields were mapped.',
      'No Company Information, setup, posting groups, VAT or number series were configured.',
      'No final German book proof was created.'
    ],
    blockedBy,
    requiresReview: resultStatus === 'blocked',
    safeToFinalizeState: true,
    statePatch: {
      activeCase: {
        status: resultStatus,
        nextSafeAction: routeDecision,
        nextCase,
        resultFile: 'playwright/projects/fibu-book5/evidence/target-004-company-creation-scoped-action-discovery/TARGET-004-result.json'
      }
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      companiesUrl: sanitizeUrl(companiesUrl.toString()),
      finalUrl: sanitizeUrl(page.url()),
      title: await page.title(),
      screenshots: [
        'playwright/projects/fibu-book5/img/target-004-010-companies-before-scoped-action-discovery.png',
        'playwright/projects/fibu-book5/img/target-004-020-after-scoped-action-discovery.png'
      ]
    },
    warnings:
      resultStatus === 'blocked'
        ? ['Company creation remains locked because no exact safe Create New Company route was proven.']
        : []
  };

  await writeJson(RESULT_PATH, result);
  await writeJson(path.join(EVIDENCE_DIR, 'TARGET-004-action-map.json'), {
    timestamp: result.timestamp,
    initialCandidates,
    menuAttempts,
    visibleAfterMenus,
    exactCreateClick,
    wizardRisk
  });
  await writeEvidenceText(
    path.join(EVIDENCE_DIR, 'TARGET-004.md'),
    markdownSummary({
      resultStatus,
      targetAlreadyVisible,
      exactCreateClicked: Boolean(exactCreateClick.clicked),
      routeDecision,
      nextCase
    })
  );
  await writeEvidenceText(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# Evidence TARGET-004',
      '',
      '| Datei | Typ | Inhalt | Grenze |',
      '|---|---|---|---|',
      '| `TARGET-004-result.json` | JSON | Result, Decision Card, naechste Route | keine Company-Anlage |',
      '| `TARGET-004-action-map.json` | JSON | sichtbare Controls, Menues, Wizard-Risiken | keine interne BC-Metadatenvollstaendigkeit |',
      '| `TARGET-004.md` | Markdown | knappe Routenentscheidung | kein Buchfinalnachweis |',
      '| `010-companies-before-scoped-action-discovery.txt` | UI-Text | Companies-Kontext vorher | keine Aktion bestaetigt |',
      '| `020-after-scoped-action-discovery.txt` | UI-Text | Kontext nach Menue-/Routenversuch | kein Finish/OK/Create |',
      ''
    ].join('\n')
  );
});
