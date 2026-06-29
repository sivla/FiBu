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

const CASE_ID = 'TARGET-002-UNIVERSAARL-DE-COMPANY-CREATION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence/target-002');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-002-result.json');

const safeBlankRoute = /blank|leer|ohne beispiel|ohne demodaten|production|produktive|setup only|nur setup/i;
const demoRoute = /testunternehmen|evaluation|demo|sample|beispiel|cronus|kopieren|copy/i;

test.use({ storageState: 'playwright/.auth/bc-user.json' });

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

async function collectActionNames(page: Page) {
  const names = new Set<string>();
  const addName = (text: string) => {
    let normalized = text.replace(/\s+/g, ' ').trim();
    normalized = normalized.replace(/[^\x20-\x7E]/g, '').trim();
    normalized = normalized.replace(/^Lschen$/i, 'Loeschen');
    if (!normalized || normalized.length < 2 || normalized.length > 80) {
      return;
    }
    if (!/[A-Za-z0-9]/.test(normalized)) {
      return;
    }
    names.add(normalized);
  };
  for (const name of await visibleButtonNames(page)) {
    addName(name);
  }
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['menuitem', 'option'] as const) {
      const locator = scope.getByRole(role);
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const text = await locator.nth(index).innerText({ timeout: 300 }).catch(() => '');
        addName(text);
      }
    }
  }
  return [...names].sort((left, right) => left.localeCompare(right));
}

async function openNewDropdownWithoutSelecting(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const candidates = [
      scope.getByRole('button', { name: /^Neu\b|^New\b/i }),
      scope.getByRole('menuitem', { name: /^Neu\b|^New\b/i })
    ];
    for (const candidate of candidates) {
      const count = await candidate.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const item = candidate.nth(index);
        if (!(await item.isVisible({ timeout: 500 }).catch(() => false))) {
          continue;
        }
        const box = await item.boundingBox().catch(() => null);
        if (!box) {
          continue;
        }
        await page.mouse.click(box.x + box.width - 8, box.y + box.height / 2);
        await page.waitForTimeout(800);
        return true;
      }
    }
  }
  return false;
}

function baseResult() {
  return {
    schemaVersion: 1,
    purpose: 'universaarl-company-creation-gate',
    caseId: CASE_ID,
    source: 'playwright-ui-company-creation-gate',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    changedFiles: ['playwright/projects/fibu-book5/evidence/target-002/TARGET-002-result.json'],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-002/TARGET-002-result.json',
      'playwright/projects/fibu-book5/evidence/target-002/010-companies-before.txt',
      'playwright/projects/fibu-book5/evidence/target-002/020-new-options.txt'
    ],
    flags: {
      noCompanyCreated: true,
      noCompanyValueEntered: true,
      noPost: true,
      noPreview: true,
      noShip: true,
      noInvoice: true,
      noPayment: true,
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

test('TARGET-002 inventories company creation options and stops before unsafe demo routes', async ({ page }) => {
  test.setTimeout(6 * 60_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();

  try {
    const companiesUrl = buildPlaythruUrl(357);
    await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    expect(page.url(), 'TARGET-002 must stay in playthru.').toMatch(/playthru/i);

    await fs.mkdir(EVIDENCE_DIR, { recursive: true });
    const beforeText = await pageText(page);
    const beforeCompact = await compactPageText(page, {
      include: [/Mandanten|Companies|Company|Name|Anzeigename|UNIVERSAARL|CRONUS|My Company|Testunternehmen|Einrichtungsstatus/i],
      maxLines: 160
    });
    await fs.writeFile(path.join(EVIDENCE_DIR, '010-companies-before.txt'), `${beforeCompact}\n`, 'utf8');
    await screenshot(page, 'target-002-010-companies-before.png', {
      testId: 'target-002',
      status: 'candidate',
      bookUse: 'evidence',
      purpose: 'TARGET-002 Companies-Seite vor Company-Anlage beweisen.',
      expectedPageText: [/Mandanten|Companies|Company|Name/i],
      knownLimitations: ['Vorher-Bild; noch keine Company-Anlage.']
    });

    const targetAlreadyVisible = /UNIVERSAARL-DE|Universaarl GmbH/i.test(beforeText);
    let dropdownOpened = false;
    let unsavedBlankRowOpened = false;
    let actionNames = await collectActionNames(page);
    if (!targetAlreadyVisible) {
      dropdownOpened = await openNewDropdownWithoutSelecting(page);
      const afterNewText = await pageText(page);
      unsavedBlankRowOpened =
        /Keine pers.nlichen Daten zum Unternehmensnamen|Unternehmensnamen hinzuf.gen|personal data|restricted data/i.test(
          afterNewText
        );
      actionNames = await collectActionNames(page);
    }
    const optionText = actionNames.join('\n');
    await fs.writeFile(path.join(EVIDENCE_DIR, '020-new-options.txt'), `${optionText}\n`, 'utf8');
    await screenshot(page, 'target-002-020-new-options-inventory.png', {
      testId: 'target-002',
      status: 'candidate',
      bookUse: 'evidence',
      purpose: 'TARGET-002 sichtbare Neu-/Company-Optionen inventarisieren, ohne Option auszufuehren.',
      expectedPageText: [/Neu|New|Mandanten|Companies|Company/i],
      knownLimitations: ['Optionen wurden nur sichtbar gemacht; keine Erstellung bestaetigt.']
    });

    const hasBlankRoute = safeBlankRoute.test(optionText) || unsavedBlankRowOpened;
    const hasOnlyDemoRoute = !hasBlankRoute && demoRoute.test(optionText);
    const blockedBy = targetAlreadyVisible
      ? []
      : hasBlankRoute
        ? [
            unsavedBlankRowOpened
              ? 'direct-new-opened-unsaved-company-row-no-values-entered'
              : 'blank-route-visible-but-not-executed-in-this-gate'
          ]
        : ['no-blank-setup-only-production-route-visible', hasOnlyDemoRoute ? 'only-demo-copy-testcompany-routes-visible' : 'no-safe-create-route-visible'];

    const resultStatus = targetAlreadyVisible ? 'observed-existing' : 'blocked';
    const result = {
      ...baseResult(),
      resultStatus,
      instance: EXPECTED_INSTANCE,
      targetCompany: TARGET_COMPANY,
      legalName: LEGAL_NAME,
      proved: [
        'Companies page was opened in playthru by direct page id 357.',
        targetAlreadyVisible
          ? 'UNIVERSAARL-DE or Universaarl GmbH is visible before creation attempt.'
          : 'UNIVERSAARL-DE is not visible before the creation gate.',
        dropdownOpened ? 'The New dropdown/action area was opened without selecting a route.' : 'Visible actions were inventoried without opening a create wizard.',
        unsavedBlankRowOpened ? 'A direct New action opened an unsaved blank Companies row; no target values were entered.' : 'No unsaved blank Companies row was detected.',
        'No Create/Finish/OK route was confirmed.',
        'No CRONUS copy or demo/sample route was executed.'
      ],
      notProved: [
        'UNIVERSAARL-DE was not created by this run.',
        'No Company Information, setup, posting or German final process was proven.',
        hasBlankRoute
          ? 'A possible blank/direct-row route needs a separate explicit execution case before creation because previous list-row company creation evidence showed save-risk.'
          : 'No blank/setup-only/production-without-sample-data route was visible in this evidence.'
      ],
      warnings: hasOnlyDemoRoute ? ['Visible creation options appear to be demo/copy/testcompany oriented; not suitable for final target without explicit decision.'] : [],
      blockedBy,
      requiresReview: true,
      safeToFinalizeState: true,
      statePatch: {
        activeCase: {
          status: resultStatus,
          lastResult: {
            resultFile: 'playwright/projects/fibu-book5/evidence/target-002/TARGET-002-result.json',
            targetAlreadyVisible,
            hasBlankRoute,
            hasOnlyDemoRoute,
            unsavedBlankRowOpened
          },
          nextSafeAction: targetAlreadyVisible
            ? 'TARGET-003 Company Information route.'
            : 'Review visible creation options and define a safe UI-first blank/setup-only creation route before confirming company creation.'
        }
      },
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        companiesUrl: sanitizeUrl(companiesUrl.toString()),
        finalUrl: sanitizeUrl(page.url()),
        title: await page.title(),
        targetAlreadyVisible,
        dropdownOpened,
        unsavedBlankRowOpened,
        actionNames,
        hasBlankRoute,
        hasOnlyDemoRoute,
        screenshots: [
          'playwright/projects/fibu-book5/img/target-002-010-companies-before.png',
          'playwright/projects/fibu-book5/img/target-002-020-new-options-inventory.png'
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
      notProved: ['TARGET-002 did not complete its safe company creation gate.'],
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
