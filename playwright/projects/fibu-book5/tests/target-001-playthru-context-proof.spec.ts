import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  pageText,
  requireBcUrl,
  screenshot,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';

const CASE_ID = 'TARGET-001-PLAYTHRU-CONTEXT-PROOF';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence/target-001');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-001-result.json');

const dangerousDialogAction =
  /\b(OK|Yes|Ja|Post|Preview|Delete|New|Edit|Buchen|Vorschau|Loeschen|Neu|Bearbeiten|Finish|Fertigstellen|Create|Erstellen)\b/i;

test.use({ storageState: 'playwright/.auth/bc-user.json' });

function buildPlaythruUrl(pageId?: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  if (/MCP_1_20260210/i.test(url.pathname)) {
    url.pathname = url.pathname.replace(/MCP_1_20260210/gi, EXPECTED_INSTANCE);
  }

  if (!url.pathname.toLowerCase().includes(EXPECTED_INSTANCE)) {
    throw new Error(`Configured BC URL cannot be scoped to ${EXPECTED_INSTANCE} without guessing.`);
  }

  url.searchParams.delete('company');
  if (pageId) {
    url.searchParams.set('page', String(pageId));
  }

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

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function dialogTexts(page: Page) {
  const texts: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"], .ms-Dialog-main');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => '');
      const normalized = text.replace(/\s+/g, ' ').trim();
      if (normalized) {
        texts.push(normalized);
      }
    }
  }
  return [...new Set(texts)];
}

async function actionInventory(page: Page) {
  const names = new Set(await visibleButtonNames(page));
  for (const scope of [page, ...page.frames()]) {
    const menuitems = scope.getByRole('menuitem');
    const count = await menuitems.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await menuitems.nth(index).innerText({ timeout: 300 }).catch(() => '');
      const normalized = text.replace(/\s+/g, ' ').trim();
      if (normalized) {
        names.add(normalized);
      }
    }
  }
  return [...names].sort((left, right) => left.localeCompare(right));
}

function baseResult() {
  return {
    schemaVersion: 1,
    purpose: 'universaarl-target-context-proof',
    caseId: CASE_ID,
    source: 'playwright-readonly-ui',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-001/TARGET-001-result.json'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-001/TARGET-001-result.json',
      'playwright/projects/fibu-book5/evidence/target-001/010-role-center-context.txt',
      'playwright/projects/fibu-book5/evidence/target-001/020-companies-context.txt'
    ],
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noShip: true,
      noInvoice: true,
      noPayment: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noSearch: true
    },
    statePatch: {},
    safeToFinalizeState: false
  };
}

test('TARGET-001 proves playthru context and reads Companies page without changes', async ({ page }) => {
  test.setTimeout(6 * 60_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();

  try {
    const startUrl = buildPlaythruUrl();
    await page.goto(startUrl.toString(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    expect(page.url(), 'TARGET-001 must stay in playthru.').toMatch(/playthru/i);

    const roleCenterText = await compactPageText(page, {
      include: [/Business Central|Search|Suchen|Settings|Einstellungen|Role Center|Companies|Company/i],
      maxLines: 80
    });
    await fs.mkdir(EVIDENCE_DIR, { recursive: true });
    await fs.writeFile(path.join(EVIDENCE_DIR, '010-role-center-context.txt'), `${roleCenterText}\n`, 'utf8');
    await screenshot(page, 'target-001-010-playthru-role-center.png', {
      testId: 'target-001',
      status: 'candidate',
      bookUse: 'evidence',
      purpose: 'TARGET-001 read-only Startkontext in der playthru-Instanz pruefen.',
      expectedPageText: [/Business Central|Search|Suchen/i],
      knownLimitations: ['Noch keine Zielcompany-Anlage und kein deutscher Finalprozess.']
    });

    const companiesUrl = buildPlaythruUrl(357);
    await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    expect(page.url(), 'Companies page must stay in playthru.').toMatch(/playthru/i);

    const dialogs = await dialogTexts(page);
    const dangerousDialogs = dialogs.filter((text) => dangerousDialogAction.test(text));
    if (dangerousDialogs.length > 0) {
      throw new Error(`Dangerous dialog visible without approval: ${dangerousDialogs.join(' | ')}`);
    }

    const fullText = await pageText(page);
    const companiesText = await compactPageText(page, {
      include: [/Companies|Company|Unternehmen|Name|Display Name|Evaluation|Assisted|Setup|UNIVERSAARL|CRONUS|RM-DEMO/i],
      maxLines: 140
    });
    await fs.writeFile(path.join(EVIDENCE_DIR, '020-companies-context.txt'), `${companiesText}\n`, 'utf8');
    await screenshot(page, 'target-001-020-companies-page-readonly.png', {
      testId: 'target-001',
      status: 'candidate',
      bookUse: 'evidence',
      purpose: 'TARGET-001 Companies-Seite read-only pruefen, ohne Company anzulegen oder zu wechseln.',
      expectedPageText: [/Companies|Company|Unternehmen|Name/i],
      knownLimitations: ['Nur sichtbarer UI-Kontext; keine Company-Anlage, kein Setup, kein Wechsel.']
    });

    const actions = await actionInventory(page);
    const companyCreationActionLabels = actions.filter((name) => /New|Neu|Create|Erstellen|Copy|Kopieren|Company|Unternehmen/i.test(name));
    const universaarlVisible = /UNIVERSAARL-DE|Universaarl GmbH/i.test(fullText);

    const result = {
      ...baseResult(),
      resultStatus: 'observed',
      instance: EXPECTED_INSTANCE,
      targetCompany: TARGET_COMPANY,
      legalName: LEGAL_NAME,
      proved: [
        'Business Central opened in the playthru instance by direct URL.',
        'Companies page was opened read-only by direct page id 357.',
        'No Tell-Me/Search route was used.',
        'No New/Edit/Delete/Post/Preview/Setup action was clicked.',
        'Company creation action labels were inventoried without executing them.'
      ],
      notProved: [
        'UNIVERSAARL-DE was not created in this case.',
        'No setup, posting, process document, ledger trace or German final proof was produced.',
        universaarlVisible
          ? 'UNIVERSAARL-DE visibility alone is not yet proof of complete company setup.'
          : 'UNIVERSAARL-DE is not visible in the captured Companies page text.'
      ],
      warnings: [],
      blockedBy: [],
      requiresReview: false,
      safeToFinalizeState: true,
      statePatch: {
        activeCase: {
          status: 'observed',
          lastResult: {
            resultFile: 'playwright/projects/fibu-book5/evidence/target-001/TARGET-001-result.json',
            universaarlDeVisible: universaarlVisible
          },
          nextSafeAction: universaarlVisible
            ? 'TARGET-003 Company Information read-only/fit gate before using UNIVERSAARL-DE as active company.'
            : 'TARGET-002 UI-first UNIVERSAARL-DE company creation route.'
        }
      },
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        roleCenterUrl: sanitizeUrl(startUrl.toString()),
        finalRoleCenterUrl: sanitizeUrl(page.url()),
        companiesUrl: sanitizeUrl(companiesUrl.toString()),
        finalCompaniesUrl: sanitizeUrl(page.url()),
        title: await page.title(),
        universaarlDeVisible: universaarlVisible,
        companyCreationActionLabels,
        dialogCount: dialogs.length,
        screenshots: [
          'playwright/projects/fibu-book5/img/target-001-010-playthru-role-center.png',
          'playwright/projects/fibu-book5/img/target-001-020-companies-page-readonly.png'
        ]
      }
    };

    await writeJson(RESULT_PATH, result);
  } catch (error) {
    const result = {
      ...baseResult(),
      resultStatus: 'blocked',
      instance: EXPECTED_INSTANCE,
      targetCompany: TARGET_COMPANY,
      legalName: LEGAL_NAME,
      proved: [],
      notProved: [
        'playthru context proof did not complete.',
        'UNIVERSAARL-DE existence or creation route is not proven.'
      ],
      warnings: [],
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
