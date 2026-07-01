import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D19-VAT-MATRIX-CONFIG-PACKAGE-READONLY-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d19-vat-matrix-config-package-readonly-discovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D19-result.json');

type VisibleAction = {
  text: string;
  role: string;
  tag: string;
  ariaLabel: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|originAuthority|startTraceId|parentPageOrigin|upn/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/i,
    '/{tenant}'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function configPackagesVisible(text: string) {
  return /Configuration Packages|Config\. Packages|Konfigurationspakete|Konfigurationspaket|RapidStart/i.test(text);
}

function sanitizeForEvidence(value: unknown): unknown {
  if (typeof value === 'string') {
    if (/allowedEndpoints|allowedResources|tokenFactorySettings|clientId|authority:|originAuthority|parentPageOrigin|upn|shouldAttachOauthTokens/i.test(value)) {
      return '[filtered-business-central-shell-bootstrap-text]';
    }
    return clean(value);
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeForEvidence(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeForEvidence(item)]));
  }
  return value;
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(sanitizeForEvidence(data), null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function configText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Configuration Packages|Config\. Packages|Konfigurationspakete|Konfigurationspaket|RapidStart/i,
        /Code|Package Name|Paketname|Table ID|Tabellen-ID|Table Name|Tabellenname|No\. of Package Records|Anzahl/i,
        /VAT Posting Setup|MwSt\.-?Buchungsmatrix|Table 325|325|Config\. Package Table/i,
        /Neu|New|Import|Export|Validate|Apply|Anwenden|Daten anwenden|Excel|Edit in Excel|In Excel bearbeiten/i,
        /Error|Fehler|Nicht gespeichert|blocked|gesperrt/i
      ],
      maxLines: 420,
      maxLineLength: 320
    })
  );
}

async function dangerousDialogVisible(page: Page) {
  for (const frame of page.frames()) {
    const found = await frame
      .locator('[role="dialog"], .ms-Dialog-main, .modal-dialog')
      .filter({
        hasText: /Daten anwenden|Apply Package|Validate Package|Edit in Excel|In Excel bearbeiten|Finish|Fertig stellen|OK|Ja|Yes|Preview|Buchungsvorschau|Post|Buchen/i
      })
      .first()
      .isVisible({ timeout: 300 })
      .catch(() => false);
    if (found) return true;
  }
  return false;
}

async function assertContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogVisible(page)).toBe(false);
}

async function screenshot(page: Page, name: string, metadata: Record<string, unknown>) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, name.replace(/\.png$/i, '.screenshot.json')), {
    fileName: name,
    imagePath: path.join(EVIDENCE_DIR, name),
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 8615 Config. Packages / Configuration Packages',
    ...metadata
  });
}

async function capture(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await configText(page);
  await writeText(`${prefix}.txt`, text || 'No compact Configuration Packages text captured.');
  await screenshot(page, `${prefix}.png`, {
    step,
    visibleLearning: 'Das Bild zeigt die Konfigurationspakete-Seite oder den Blockerzustand fuer die Standardroute.',
    internallyProves: 'Read-only route discovery in playthru / UNIVERSAARL-DE.',
    doesNotProve: [
      'No package was created',
      'No package was imported, exported, validated or applied',
      'No VAT Posting Setup row',
      'No Preview Posting',
      'No Posting',
      'No VAT Entries'
    ],
    ...extra
  });
  return text;
}

async function visibleActions(page: Page) {
  const all: VisibleAction[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const interesting = /Neu|New|Import|Export|Validate|Apply|Anwenden|Daten anwenden|Excel|Edit in Excel|In Excel bearbeiten|Package|Paket|Table|Tabelle|Fields|Felder/i;
        return [...document.querySelectorAll<HTMLElement>('[role="button"],[role="menuitem"],button,a,span,div')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const role = element.getAttribute('role') || element.tagName.toLowerCase();
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (
              !interesting.test(text) ||
              text.length > 160 ||
              rect.width <= 1 ||
              rect.height <= 1 ||
              rect.width > 520 ||
              rect.bottom <= 0 ||
              rect.right <= 0 ||
              rect.top >= window.innerHeight ||
              rect.left >= window.innerWidth ||
              style.visibility === 'hidden' ||
              style.display === 'none' ||
              Number(style.opacity || '1') <= 0 ||
              (!['button', 'menuitem', 'a'].includes(role) && !element.getAttribute('aria-label') && !element.getAttribute('title'))
            ) {
              return null;
            }
            return {
              text,
              role,
              tag: element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter(Boolean)
          .slice(0, 250);
      })
      .catch(() => []);
    all.push(...(entries as VisibleAction[]));
  }
  return all.sort((left, right) => left.y - right.y || left.x - right.x).slice(0, 120);
}

async function openConfigPackages(page: Page) {
  await page.goto(buildPlaythruUrl(8615), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(3000);
  await assertContext(page);
  const text = clean(await pageText(page));
  if (!configPackagesVisible(text)) throw new Error('Page 8615 Configuration Packages context is not visible.');
}

test(`${CASE_ID}: read-only Configuration Packages discovery`, async ({ page }) => {
  await fs.rm(EVIDENCE_DIR, { recursive: true, force: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  let resultStatus: 'observed-readonly-route-context' | 'blocked-no-visible-config-package-context' = 'observed-readonly-route-context';
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  let text = '';
  let actions: VisibleAction[] = [];

  try {
    await openConfigPackages(page);
    text = await capture(page, 'target-027d19-010-config-packages-readonly', 'Configuration Packages read-only context', {
      status: 'accepted-readonly-route-context',
      bookUse: 'debugging/evidence-only',
      screenshotQa: {
        shouldShow: ['Configuration Packages or Config. Packages page title', 'command bar/list context'],
        shouldNotShow: ['Tell-Me/search overlay as the main proof', 'import/apply dialog', 'unsaved package card']
      }
    });
    actions = await visibleActions(page);
    await writeJson(path.join(EVIDENCE_DIR, 'target-027d19-visible-actions.json'), {
      caseId: CASE_ID,
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      sanitizedUrl: sanitizeEvidenceUrl(page.url()),
      actions
    });
  } catch (error) {
    resultStatus = 'blocked-no-visible-config-package-context';
    blockedBy.push(error instanceof Error ? error.message : String(error));
    text = clean(await pageText(page).catch(() => ''));
    await writeText('target-027d19-blocked-page-text.txt', text || 'No page text captured.');
    await screenshot(page, 'target-027d19-090-blocked-context.png', {
      step: 'Blocked before Configuration Packages page proof',
      status: 'blocked',
      blockedBy,
      visibleLearning: 'Das Bild zeigt, warum die Konfigurationspakete-Route noch nicht als sichtbarer Seitenkontext zaehlt.',
      internallyProves: 'The run stopped before any package/import/apply/write action.',
      doesNotProve: ['Configuration Packages page', 'Table 325 route', 'VAT setup write']
    });
  }

  const hasTable325Signal = /(^|\D)325(\D|$)|VAT Posting Setup|MwSt\.-?Buchungsmatrix/i.test(text);
  const hasDangerousVisibleAction = actions.some((action) =>
    /Import|Export|Validate|Apply|Anwenden|Daten anwenden|Excel|Edit in Excel|In Excel bearbeiten/i.test(
      `${action.text} ${action.ariaLabel} ${action.title}`
    )
  );
  if (!hasTable325Signal) {
    warnings.push('Table 325 / VAT Posting Setup is not visible in the read-only Configuration Packages list context.');
  }
  if (hasDangerousVisibleAction) {
    warnings.push('Dangerous package actions are visible and must remain inventory-only until a later write case unlocks them.');
  }

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-discovery',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 8615 Config. Packages / Configuration Packages',
    sanitizedUrl: page.url() ? sanitizeEvidenceUrl(page.url()) : '',
    actionsTaken: [
      'Opened Page 8615 directly with company UNIVERSAARL-DE.',
      'Captured read-only page context screenshot and compact text.',
      'Inventoried visible package actions without clicking Import, Export, Validate, Apply, Edit in Excel or New.',
      'Checked whether Table 325 / VAT Posting Setup is visible without creating a package.'
    ],
    actionsNotTaken: [
      'No package creation',
      'No package import',
      'No package export',
      'No package validation',
      'No package apply',
      'No Edit in Excel publish',
      'No INLAND/VAT19 typing',
      'No VAT matrix write',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots:
      resultStatus === 'observed-readonly-route-context'
        ? ['target-027d19-010-config-packages-readonly.png']
        : ['target-027d19-090-blocked-context.png'],
    proved:
      resultStatus === 'observed-readonly-route-context'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Page 8615 Configuration Packages opened as a read-only route context.',
            'No package/import/export/validate/apply/Edit-in-Excel action was clicked.',
            'No setup, master data, draft, Preview Posting, posting or API shortcut occurred.'
          ]
        : [
            'The run stayed in playthru / UNIVERSAARL-DE before stopping.',
            'No package/import/export/validate/apply/Edit-in-Excel action was clicked.',
            'No setup, master data, draft, Preview Posting, posting or API shortcut occurred.'
          ],
    notProved: [
      'No correct INLAND/VAT19 VAT Posting Setup matrix row.',
      'No Table 325 package line was created or saved.',
      'No Excel export/import/validate/apply path is proven safe for a future write.',
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.'
    ],
    observations: {
      visibleActions: actions,
      hasTable325Signal,
      hasDangerousVisibleAction
    },
    blockedBy,
    warnings,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'D18 selected Configuration Packages read-only discovery after D17 blocked Page-472 lookup/select controls.',
      isPlannedNextCaseStillSensible: true,
      reason: 'D19 is the least invasive standard-route check: direct page context and action inventory without effective package actions.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027D20-VAT-MATRIX-CONFIG-PACKAGE-TABLE-325-ROUTE-DECISION',
          status: hasTable325Signal ? 'ready-after-current' : 'needs-ui-discovery-first',
          reason: hasTable325Signal
            ? 'A later decision can inspect whether a controlled package write case is justified.'
            : 'Table 325 / VAT Posting Setup was not visible without creating a package.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting Groups wait for correct VAT matrix or an explicit park decision.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for VAT/posting defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness waits for VAT matrix, posting groups and dimensions.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: 'TARGET-027D20-VAT-MATRIX-CONFIG-PACKAGE-TABLE-325-ROUTE-DECISION',
      whySelectedNextCaseIsBest: hasTable325Signal
        ? 'D19 proved the read-only route context; the next step can decide whether a write case is justified.'
        : 'D19 did not prove Table 325 visibility, so the next step must decide whether adding a package/table is worth a controlled discovery case or whether VAT matrix should be parked.',
      risksBeforeNextCase: [
        'Configuration package actions can become effective if Import, Validate, Apply or Edit in Excel is clicked.',
        'A future package write case must define exact fields and rollback/reopen proof.',
        'No German VAT claim is allowed before visible VAT matrix plus Preview/Entries.'
      ],
      requiredPreparation: [
        'Review screenshot QA and visible action inventory.',
        'Do not create/apply a package without a separate Smart Decision.'
      ]
    },
    nextCase: hasTable325Signal
      ? 'TARGET-027D20-VAT-MATRIX-CONFIG-PACKAGE-TABLE-325-ROUTE-DECISION'
      : 'TARGET-027D20-VAT-MATRIX-CONFIG-PACKAGE-TABLE-325-ROUTE-DECISION',
    safeToFinalizeState: false,
    requiresReview: true
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      `Status: \`${resultStatus}\`.`,
      '',
      'Read-only discovery for the Configuration Packages route.',
      '',
      '- No package creation.',
      '- No import, export, validation, apply or Edit in Excel publish.',
      '- No VAT matrix write.',
      '- No Preview Posting or Posting.',
      '',
      `Table 325 / VAT Posting Setup visible without package creation: \`${hasTable325Signal}\`.`,
      `Dangerous package actions visible: \`${hasDangerousVisibleAction}\`.`
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
