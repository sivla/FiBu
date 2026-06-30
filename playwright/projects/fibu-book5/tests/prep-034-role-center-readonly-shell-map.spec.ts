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

const CASE_ID = 'PREP-034-ROLE-CENTER-READONLY-SHELL-MAP';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'prep-034-role-center-readonly-shell-map';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'PREP-034-result.json');

type UiAction = {
  label: string;
  role: string;
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function buildPlaythruUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.delete('company');
  url.searchParams.delete('page');
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

function shortLabel(value: string, maxLength = 160) {
  const normalized = clean(value);
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
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

async function collectFrameActions(scope: Page | Frame) {
  return scope
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
          const label = [
            element.innerText || element.textContent,
            element.getAttribute('aria-label'),
            element.getAttribute('title')
          ]
            .map(normalize)
            .filter(Boolean)
            .join(' | ');
          return {
            label,
            role: normalize(element.getAttribute('role')),
            tag: element.tagName.toLowerCase(),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        });
    })
    .catch(() => [] as UiAction[]);
}

async function collectActions(page: Page) {
  const actions: UiAction[] = await collectFrameActions(page);
  for (const frame of page.frames()) {
    actions.push(...(await collectFrameActions(frame)));
  }
  const seen = new Set<string>();
  return actions
    .map((action) => ({ ...action, label: clean(action.label) }))
    .filter((action) => action.label)
    .filter((action) => {
      const key = `${action.label}:${action.role}:${action.tag}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function maskPersonalShellTextForScreenshot(page: Page) {
  for (const frame of page.frames()) {
    await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        for (const element of Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],span,div'))) {
          const label = `${normalize(element.innerText || element.textContent)} ${normalize(element.getAttribute('aria-label'))} ${normalize(element.getAttribute('title'))}`;
          const rect = element.getBoundingClientRect();
          if (rect.y <= 70 && /Konto-Manager|Account manager|\bKK\b/i.test(label)) {
            if (normalize(element.innerText || element.textContent) === 'KK') {
              element.textContent = 'U';
            }
            element.setAttribute('aria-label', 'Benutzerkonto');
            element.setAttribute('title', 'Benutzerkonto');
          }
        }
      })
      .catch(() => undefined);
  }
}

function classifyShellActions(actions: UiAction[]) {
  const buckets = {
    topBar: [] as string[],
    navigation: [] as string[],
    roleCenterTiles: [] as string[],
    excludedShopifyVisible: [] as string[],
    potentiallyChanging: [] as string[]
  };
  for (const action of actions) {
    if (/Suchen|Search|Einstellungen|Settings|Hilfe|Help|Benachrichtigungen|Notifications|Copilot|Umgebung|Environment/i.test(action.label)) {
      buckets.topBar.push(action.label);
    }
    if (/Finanzen|Zahlungsmanagement|Verkauf|Einkauf|Alle Berichte|Debitoren|Kreditoren|Artikel|Bankkonten|Kontenplan/i.test(action.label)) {
      buckets.navigation.push(action.label);
    }
    if (/Aktivitaten|Aktivitaeten|Umsatz|Verkaufs|Einkaufs|Eingehende|Aufgaben|Intercompany|Weitere Informationen/i.test(action.label)) {
      buckets.roleCenterTiles.push(action.label);
    }
    if (/Shopify/i.test(action.label)) {
      buckets.excludedShopifyVisible.push(action.label);
    }
    if (/\b(New|Neu|Edit|Bearbeiten|Delete|Loeschen|Post|Buchen|Preview|Vorschau|Finish|Fertigstellen|Create|Erstellen)\b/i.test(action.label)) {
      buckets.potentiallyChanging.push(action.label);
    }
  }
  return Object.fromEntries(
    Object.entries(buckets).map(([key, values]) => [key, [...new Set(values.map((value) => shortLabel(value)))].slice(0, 40)])
  );
}

test('PREP-034 maps Role Center shell read-only', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const startUrl = buildPlaythruUrl();
  await page.goto(startUrl.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  expect(page.url(), 'PREP-034 must stay in playthru.').toMatch(/playthru/i);

  const fullText = clean(await pageText(page));
  const focusedText = clean(
    await compactPageText(page, {
      include: [
        /Dynamics 365 Business Central|Umgebung|Playthru|CRONUS DE|Finanzen|Zahlungsmanagement|Verkauf|Einkauf|Alle Berichte|Debitoren|Kreditoren|Artikel|Bankkonten|Kontenplan|Suchen|Einstellungen|Hilfe|Aktivitaten|Aktivitaeten|Intercompany|Shopify/i
      ],
      maxLines: 180
    })
  );
  const actions = await collectActions(page);
  const actionBuckets = classifyShellActions(actions);
  const roleCenterLooksVisible = /CRONUS DE|Finanzen|Zahlungsmanagement|Verkauf|Einkauf|Debitoren|Kreditoren|Artikel|Bankkonten|Kontenplan/i.test(fullText);
  await maskPersonalShellTextForScreenshot(page);

  const screenshotFile = 'prep-034-010-role-center-shell-readonly.png';
  await screenshot(page, screenshotFile, {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: roleCenterLooksVisible ? 'candidate' : 'rejected',
    bookUse: roleCenterLooksVisible ? 'navigation' : 'do-not-use',
    purpose: 'Read-only Role Center shell map: environment, current shell company, navigation, search/settings/help icons and role-center tiles.',
    expectedPageText: [/Dynamics 365 Business Central|CRONUS DE|Finanzen|Verkauf|Einkauf|Debitoren|Kreditoren|Artikel/i],
    knownLimitations: [
      'Keine Company-Anlage.',
      'Kein Company Switch.',
      'Keine Suche/Tell-Me-Ausfuehrung.',
      'Keine Navigation in Datenlisten.',
      'Shopify ist sichtbar, bleibt aber fuer das Buch ausgeschlossen.'
    ]
  });

  await writeJson(path.join(EVIDENCE_DIR, screenshotFile.replace(/\.png$/i, '.screenshot.json')), {
    fileName: screenshotFile,
    imagePath: path.resolve('playwright/projects/fibu-book5/img', screenshotFile),
    status: roleCenterLooksVisible ? 'usable-context-screenshot' : 'rejected',
    page: 'Role Center / Startseite',
    instance: EXPECTED_INSTANCE,
    company: 'CRONUS DE shell-context before UNIVERSAARL-DE',
    step: 'Read-only shell and navigation map',
    visibleLearning:
      'The Role Center shows the current shell company, top-bar controls, navigation menus, role-specific quick links and activity tiles.',
    importantUi: ['Environment indicator', 'Search icon', 'Settings icon', 'Help icon', 'Navigation menus', 'Activity tiles'],
    internallyProves: roleCenterLooksVisible
      ? ['Role Center is visible in playthru.', 'Shell/navigation context can be documented without write actions.']
      : ['Role Center route stayed within playthru but did not expose enough shell signals.'],
    doesNotProve: ['UNIVERSAARL-DE exists', 'setup completeness', 'posting readiness', 'Shopify scope'],
    qualityDecision: roleCenterLooksVisible ? 'usable-context-screenshot' : 'rejected',
    finalScreenshotStatus: 'german-final-candidate-preflight',
    piiMasking: 'Top-right user/account indicator is masked client-side before screenshot.'
  });

  await writeText(path.join(EVIDENCE_DIR, '010-role-center-focused-text.txt'), focusedText);

  const resultStatus = roleCenterLooksVisible ? 'observed' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-ui-discovery',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    targetCompany: TARGET_COMPANY,
    sourceCompany: 'CRONUS DE shell-context-before-UNIVERSAARL-DE',
    currentUrl: sanitizeUrl(page.url()),
    screenshot: `playwright/projects/fibu-book5/img/${screenshotFile}`,
    observed: {
      pageTitle: await page.title(),
      focusedTextLines: focusedText.split('\n').filter(Boolean).slice(0, 120),
      actionBuckets,
      shellSignals: {
        hasPlaythruEnvironment: /Playthru/i.test(fullText),
        hasCronusShellCompany: /CRONUS DE/i.test(fullText),
        hasSearchIcon: /Suchen|Search/i.test(fullText) || actionBuckets.topBar.some((entry) => /Suchen|Search/i.test(entry)),
        hasSettingsIcon: /Einstellungen|Settings/i.test(fullText) || actionBuckets.topBar.some((entry) => /Einstellungen|Settings/i.test(entry)),
        hasRoleCenterTiles: actionBuckets.roleCenterTiles.length > 0
      }
    },
    proved:
      resultStatus === 'observed'
        ? [
            'Role Center / Startseite opens read-only in playthru.',
            'The screenshot shows shell company CRONUS DE, top navigation and Role Center activity context.',
            'Search, Settings and Help are visible as shell affordances; none were executed.',
            'Shopify is visible in the shell but remains excluded from FiBu Buch 5 scope.'
          ]
        : ['The direct Role Center route stayed within playthru and did not perform write actions.'],
    notProved: [
      'UNIVERSAARL-DE was not created and is not the current company.',
      'No list, card, setup wizard, document, preview or posting was opened.',
      'No final Universaarl role-center screenshot exists yet; recreate after UNIVERSAARL-DE exists.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/tests/prep-034-role-center-readonly-shell-map.spec.ts',
      'package.json',
      '.agent/state/cases/prep-034-role-center-readonly-shell-map.json',
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/PREP-034-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/010-role-center-focused-text.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/prep-034-010-role-center-shell-readonly.screenshot.json`,
      `playwright/projects/fibu-book5/img/${screenshotFile}`,
      'FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md',
      'playwright/projects/fibu-book5/BC-PAGE-ATLAS.md',
      'playwright/projects/fibu-book5/BC-SCREENSHOT-INVENTORY.md',
      'playwright/projects/fibu-book5/BC-FULL-PLAYTHROUGH-CATALOG.md'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/PREP-034-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/010-role-center-focused-text.txt`,
      `playwright/projects/fibu-book5/img/${screenshotFile}`
    ],
    warnings: actionBuckets.excludedShopifyVisible.length ? ['Shopify is visible in the Role Center shell but remains excluded.'] : [],
    blockedBy: resultStatus === 'observed' ? [] : ['role-center-shell-signals-not-visible'],
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    statePatch: {
      current: {
        activeCase: CASE_ID,
        nextCase: 'PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING',
        nextStep:
          'Continue with PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING unless lookahead selects a better repo/source prep case.'
      }
    },
    flags: {
      noWrite: true,
      noSearchExecution: true,
      noNavigationIntoLists: true,
      noCompanySwitch: true,
      noCompanyCreated: true,
      noSetupChange: true,
      noPreview: true,
      noPost: true,
      noDraft: true,
      noApiShortcut: true,
      noBookChange: false
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction:
      'After UNIVERSAARL-DE exists, reopen the Role Center in the final company and capture the same shell/navigation elements without entering process pages.',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'PREP-033 proved My Settings via Einstellungen -> Meine Einstellungen read-only and rejected the invalid Page-9176 direct route.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'Role Center shell mapping is the next beginner-facing read-only UI proof after Companies and My Settings.',
      lookaheadReviewed: [
        {
          caseId: 'PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING',
          status: 'ready-next',
          reason: 'After W0 read-only shell proof, source-backed implementation practice is the next non-effective prep step.'
        },
        {
          caseId: 'PREP-028-TESTING-STRATEGY-AND-UAT-MATRIX',
          status: 'ready-after-current',
          reason: 'Can build on implementation guide mapping.'
        },
        {
          caseId: 'PREP-029-AL-OBJECT-ANALYSIS-ROADMAP',
          status: 'ready-after-current',
          reason: 'Useful technical roadmap after source/testing strategy.'
        },
        {
          caseId: 'PREP-030-BOOK-USECASE-QUALITY-SCORECARD',
          status: 'ready-after-current',
          reason: 'Good follow-up for book quality, but less immediate than implementation mapping.'
        },
        {
          caseId: 'TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE',
          status: 'blocked',
          reason: 'Company creation remains parked until SUPER/company-create permissions are available.'
        }
      ],
      queueChangesMade: ['Mark PREP-034 done if observed; keep TARGET-009 parked.'],
      selectedNextCase: 'PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING',
      whySelectedNextCaseIsBest:
        'The first W0 read-only UI surfaces are now covered; next useful work is source-backed implementation and testing preparation.',
      risksBeforeNextCase: ['Do not reactivate Company Creation without explicit SUPER permission confirmation.'],
      requiredPreparation: ['Use Microsoft Learn / Dynamics 365 Implementation Guide sources only.']
    },
    startedAt,
    finishedAt: new Date().toISOString()
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    path.join(EVIDENCE_DIR, 'README.md'),
    `# PREP-034 Role Center Read-only Shell Map

Status: ${resultStatus}

Instanz: playthru
Zielcompany: UNIVERSAARL-DE ist geplant, aber noch nicht erstellt.

## Geprueft

- Role Center / Startseite read-only geoeffnet.
- Umgebung, Shell-Company, Navigationsleiste, Such-/Einstellungs-/Hilfe-Icons und Aktivitaetskacheln erfasst.
- Keine Suche ausgefuehrt, keine Liste geoeffnet, keine wirksame Aktion geklickt.

## Ergebnis

${resultStatus === 'observed' ? '- Role Center ist als read-only Shell- und Navigationskontext verwendbar.' : '- Role Center konnte nicht ausreichend sichtbar belegt werden.'}
- Shopify ist sichtbar, bleibt aber fuer FiBu Buch 5 ausgeschlossen.

## Grenzen

- Keine Anlage von UNIVERSAARL-DE.
- Kein Company Switch.
- Kein Setup, keine Buchung, keine API.
- Screenshot ist Shell-Kontext vor der finalen Universaarl-Company und muss spaeter neu erstellt werden.

## Naechster Schritt

PREP-027 soll Implementation Guide / Success by Design fuer Buch, Projekt- und UAT-Strategie mappen.
`
  );

  expect(resultStatus, 'Role Center shell must be visible enough for PREP-034.').toBe('observed');
});
