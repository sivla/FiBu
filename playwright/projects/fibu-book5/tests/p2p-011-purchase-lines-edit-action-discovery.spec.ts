import { test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { project } from '../project';

const caseId = 'P2P-011-PURCHASE-LINES-EDIT-ACTION-DISCOVERY';
const environment = process.env.BC_ENVIRONMENT ?? 'MCP_1_20260210';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const purchaseOrderNo = process.env.P2P011_PURCHASE_ORDER_NO ?? '106054';
const targetItem = 'RAW-STEEL';
const evidenceDir = path.join(process.cwd(), 'playwright/projects/fibu-book5/evidence/p2p-011');

type ActionCandidate = {
  frameIndex: number;
  text: string;
  aria: string;
  title: string;
  role: string;
  controlName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  risk: 'safe-menu' | 'edit-candidate' | 'risky' | 'context';
};

async function ensureDirs() {
  await fs.mkdir(evidenceDir, { recursive: true });
}

async function writeJson(fileName: string, data: unknown) {
  await fs.writeFile(path.join(evidenceDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, data: string) {
  await fs.writeFile(path.join(evidenceDir, fileName), scrubEvidenceText(data), 'utf8');
}

function scrubEvidenceText(data: string) {
  return data
    .split('\n')
    .filter((line) => !/tokenFactory|clientId|authority|cacheLocation|upn|requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|shouldAttachOauthTokens/i.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
    .concat('\n');
}

function purchaseOrderUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', company);
  url.searchParams.set('page', '50');
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${purchaseOrderNo}'`);
  return url.toString();
}

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value);
    if (/webshell\.suite\.office\.com/i.test(url.hostname)) return 'https://webshell.suite.office.com/[redacted-frame]';
    for (const key of [...url.searchParams.keys()]) {
      if (/token|tenant|trace|client|auth|session|sid|tid|upn|shsid|aadTenant/i.test(key)) url.searchParams.delete(key);
    }
    url.pathname = url.pathname.replace(/^\/[0-9a-f-]{36}\//i, '/[tenant-id]/');
    return url.toString();
  } catch {
    return value
      .replace(/(businesscentral\.dynamics\.com)\/[0-9a-f-]{36}\//i, '$1/[tenant-id]/')
      .replace(/https:\/\/webshell\.suite\.office\.com\/[^\s"']+/gi, 'https://webshell.suite.office.com/[redacted-frame]')
      .replace(/(token|tenant|trace|client|auth|session|sid|tid|upn|shsid)=([^&\s]+)/gi, '$1=[redacted]');
  }
}

async function clickFirstVisible(page: Page, labels: RegExp[]) {
  const scopes = [page, ...page.frames()];
  const rankedScopes = [];
  for (const scope of scopes) {
    const text = await scope.locator('body').innerText({ timeout: 500 }).catch(() => '');
    rankedScopes.push({ scope, inPurchaseContext: text.includes(purchaseOrderNo) || /RAW-STEEL|Purchase Order/i.test(text) });
  }
  rankedScopes.sort((left, right) => Number(right.inPurchaseContext) - Number(left.inPurchaseContext));
  for (const { scope } of rankedScopes) {
    for (const label of labels) {
      for (const role of ['button', 'menuitem', 'link'] as const) {
        const match = scope.getByRole(role, { name: label }).first();
        if (await match.isVisible({ timeout: 700 }).catch(() => false)) {
          await match.click({ timeout: 4000 });
          await page.waitForTimeout(1000);
          return { clicked: true, label: label.source, role };
        }
      }
    }
  }
  return { clicked: false };
}

async function enableWideLayout(page: Page) {
  return clickFirstVisible(page, [/Breite Layoutansicht anzeigen|Breites Layout|Wide layout/i]);
}

async function enableLinesFocusMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const control = scope.getByRole('menuitemcheckbox', { name: /Fokusmodus.*Seitenteil|Fokusmodus umschalten|Focus mode|Toggle focus mode/i }).first();
    if (await control.isVisible({ timeout: 800 }).catch(() => false)) {
      const checked = await control.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await control.click({ timeout: 3000 });
        await page.waitForTimeout(1000);
      }
      return { clicked: checked !== 'true', alreadyFocused: checked === 'true' };
    }
  }
  return { clicked: false };
}

function classifyAction(label: string): ActionCandidate['risk'] {
  if (/Account Manager|Konto-Manager|Business Manager Role Center|Headline RC|Guten Abend|Learn more|Shopify/i.test(label)) return 'context';
  if (/Post|Buchen|Preview|Vorschau|Receive|Empfangen|Invoice|Fakturieren|Delete|Loeschen|L.schen|New|Neu|Copy|Excel/i.test(label)) return 'risky';
  if (/Edit|Bearbeiten|List|Liste|Line|Zeile|Manage|Verwalten|Personalize|Personalisieren/i.test(label)) return 'edit-candidate';
  if (/More options|Weitere Optionen|Actions|Aktionen|Related|Navigate|Zeigen|Anzeigen/i.test(label)) return 'safe-menu';
  return 'context';
}

async function actionInventory(page: Page, label: string) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 800 }).catch(() => '');
    const inPurchaseContext = bodyText.includes(purchaseOrderNo) || /RAW-STEEL|Purchase Order/i.test(bodyText);
    if (!inPurchaseContext) {
      frames.push({ label, frameIndex, frameUrl: sanitizeUrl(frame.url()), candidates: [] });
      continue;
    }
    const entries = await frame.evaluate(({ frameIndex }) => {
      const normalize = (value: string | null | undefined, max = 180) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
      const visible = (element: Element) => {
        const html = element as HTMLElement;
        const rect = html.getBoundingClientRect();
        const style = window.getComputedStyle(html);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      return [...document.querySelectorAll('button,[role="button"],[role="menuitem"],[role="menuitemcheckbox"],a,[aria-label],[title],[controlname]')]
        .filter(visible)
        .map((element) => {
          const html = element as HTMLElement;
          const rect = html.getBoundingClientRect();
          return {
            frameIndex,
            text: normalize(html.innerText || html.textContent),
            aria: normalize(html.getAttribute('aria-label')),
            title: normalize(html.getAttribute('title')),
            role: normalize(html.getAttribute('role') || html.tagName),
            controlName: normalize(html.getAttribute('controlname') ?? html.closest('[controlname]')?.getAttribute('controlname')),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
        .filter((entry) => /Edit|Bearbeiten|List|Liste|Line|Zeile|Manage|Verwalten|More options|Weitere Optionen|Actions|Aktionen|Personalize|Personalisieren|Focus|Fokus|Wide|Breite|Post|Preview|Receive|Invoice|Delete|New|Excel/i.test(`${entry.text} ${entry.aria} ${entry.title} ${entry.controlName}`))
        .slice(0, 160);
    }, { frameIndex }).catch(() => []);
    const candidates: ActionCandidate[] = entries
      .filter((entry: any) => !/Account Manager|Konto-Manager|Business Manager Role Center|Headline RC|Guten Abend|Shopify/i.test(`${entry.text} ${entry.aria} ${entry.title} ${entry.controlName}`))
      .map((entry: any) => {
      const actionLabel = `${entry.text} ${entry.aria} ${entry.title} ${entry.controlName}`;
      return { ...entry, risk: classifyAction(actionLabel) };
    });
    frames.push({ label, frameIndex, frameUrl: sanitizeUrl(frame.url()), candidates });
  }
  return frames;
}

async function compactUiText(page: Page) {
  return compactPageText(page, {
    include: [/106054|K10000|Stahlwerk|RAW-STEEL|FRA-ZL|ATLANTA|Purchase Order|Lines|Quantity|Qty\. to Receive|Direct Unit Cost|Edit|Bearbeiten|Line|Zeile|Manage|Verwalten/i],
    maxLines: 180,
  });
}

async function safeOpenMenu(page: Page, label: string, patterns: RegExp[]) {
  const before = await actionInventory(page, `${label}-before`);
  const click = await clickFirstVisible(page, patterns);
  const after = await actionInventory(page, `${label}-after`);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  return { label, click, beforeCandidateCount: before.flatMap((frame) => frame.candidates).length, after };
}

function flattenCandidates(inventories: Array<{ after?: Array<{ candidates: ActionCandidate[] }>; candidates?: ActionCandidate[] }>) {
  const candidates = inventories.flatMap((entry: any) => entry.after ? entry.after.flatMap((frame: any) => frame.candidates) : (entry.candidates ?? []));
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.text}|${candidate.aria}|${candidate.title}|${candidate.controlName}|${candidate.risk}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

test.describe('P2P-011 purchase lines edit action discovery', () => {
  test.use({
    storageState: 'playwright/.auth/bc-user.json',
    viewport: { width: 2600, height: 1400 },
  });

  test('discovers safe edit/action candidates without changing purchase line values', async ({ page }) => {
    test.setTimeout(180_000);
    await ensureDirs();
    const result: Record<string, unknown> = {
      schemaVersion: 1,
      caseId,
      source: 'playwright-ui-labor-action-discovery',
      resultStatus: 'started',
      instance: environment,
      company,
      sourceCompany: company,
      purchaseOrderNo,
      selectedRoute: 'Route A - true Purchase Lines edit/action discovery',
      targetItem,
      previewPosting: false,
      posted: false,
      setupChanges: [],
      createdRecords: [],
      changedRecords: [],
      postedRecords: [],
      flags: {
        noPost: true,
        noPreview: true,
        noSetupChange: true,
        noCompanySwitch: true,
        noApiShortcut: true,
        noBookChange: true,
        noFieldValueEntry: true,
      },
      migrationRelevance: 'needed-for-german-final',
      mustRecreateInFinalSandbox: true,
      finalScreenshotNeeded: true,
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: {},
    };

    await page.goto(purchaseOrderUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await hideFactBoxPane(page);
    const wideLayout = await enableWideLayout(page);
    const focusMode = await enableLinesFocusMode(page);
    const initialText = await pageText(page);
    const safeUrl = sanitizeUrl(page.url());
    const contextOk = safeUrl.includes(environment) && safeUrl.includes(`company=${company}`) && initialText.includes(purchaseOrderNo);
    const rawSteelVisible = /RAW-STEEL/i.test(initialText);

    await screenshot(page, 'p2p-011-010-action-discovery-start.png', {
      projectName: project.name,
      testId: 'p2p-011',
      status: 'labor',
      bookUse: 'evidence',
      purpose: 'P2P-011 start context for Purchase Lines edit/action discovery on draft 106054.',
      expectedPageText: [/106054|Purchase Order|RAW-STEEL|Lines|Quantity/i],
      knownLimitations: ['Action discovery only; no value entry, Preview Posting or posting.'],
    });
    await writeText('010-start-text.txt', await compactUiText(page));
    await writeJson('011-start-action-inventory.json', await actionInventory(page, 'start'));

    const menuAttempts = [];
    if (contextOk) {
      menuAttempts.push(await safeOpenMenu(page, 'more-options', [/^Weitere Optionen$|^More options$/i, /Weitere Optionen|More options/i]));
      menuAttempts.push(await safeOpenMenu(page, 'line', [/^Line$|^Zeile$/i, /^Lines$|^Zeilen$/i]));
      menuAttempts.push(await safeOpenMenu(page, 'manage', [/^Manage$|^Verwalten$/i]));
      menuAttempts.push(await safeOpenMenu(page, 'actions', [/^Actions$|^Aktionen$/i]));
      menuAttempts.push(await safeOpenMenu(page, 'personalize', [/^Personalize$|^Personalisieren$/i]));
      await page.keyboard.press('Escape').catch(() => undefined);
    }

    await screenshot(page, 'p2p-011-020-after-action-menus.png', {
      projectName: project.name,
      testId: 'p2p-011',
      status: 'labor',
      bookUse: 'evidence',
      purpose: 'P2P-011 after safe menu/action discovery attempts.',
      expectedPageText: [/106054|Purchase Order|RAW-STEEL|Quantity|Direct Unit Cost|Qty\. to Receive/i],
      knownLimitations: ['Menus were inventoried only; no field value was entered.'],
    });
    await writeText('020-after-action-discovery-text.txt', await compactUiText(page));
    await writeJson('021-menu-attempts.json', menuAttempts);
    const finalInventory = await actionInventory(page, 'final');
    await writeJson('022-final-action-inventory.json', finalInventory);

    const allCandidates = flattenCandidates([
      ...menuAttempts,
      ...finalInventory,
    ] as any);
    const editCandidates = allCandidates.filter((candidate) => candidate.risk === 'edit-candidate');
    const riskyCandidates = allCandidates.filter((candidate) => candidate.risk === 'risky');
    const usefulEditCandidate = editCandidates.find((candidate) => /^(Edit|Bearbeiten|Edit List|Liste bearbeiten)$/i.test(`${candidate.text || candidate.aria}`.trim()));

    result.details = {
      url: safeUrl,
      contextOk,
      rawSteelVisible,
      wideLayout,
      focusMode,
      menuAttempts: menuAttempts.map((attempt) => ({
        label: attempt.label,
        click: attempt.click,
        afterCandidateCount: attempt.after.flatMap((frame) => frame.candidates).length,
      })),
      candidateSummary: {
        total: allCandidates.length,
        editCandidateCount: editCandidates.length,
        riskyCandidateCount: riskyCandidates.length,
        usefulEditCandidate: usefulEditCandidate ?? null,
      },
    };
    result.screenshots = [
      'playwright/projects/fibu-book5/img/p2p-011-010-action-discovery-start.png',
      'playwright/projects/fibu-book5/img/p2p-011-020-after-action-menus.png',
    ];
    result.evidenceRefs = [
      'playwright/projects/fibu-book5/evidence/p2p-011/010-start-text.txt',
      'playwright/projects/fibu-book5/evidence/p2p-011/011-start-action-inventory.json',
      'playwright/projects/fibu-book5/evidence/p2p-011/020-after-action-discovery-text.txt',
      'playwright/projects/fibu-book5/evidence/p2p-011/021-menu-attempts.json',
      'playwright/projects/fibu-book5/evidence/p2p-011/022-final-action-inventory.json',
    ];
    result.resultStatus = contextOk && rawSteelVisible ? 'observed' : 'blocked';
    result.proved = [
      `Purchase Order ${purchaseOrderNo} was opened in ${environment}/${company}.`,
      rawSteelVisible ? 'RAW-STEEL remained visible during action discovery.' : 'RAW-STEEL was not visible in the captured page text.',
      'Safe action/menu discovery was attempted without repeating Select-items search or display-cell edit routes.',
      'No field value entry, Preview Posting, posting, setup change, company switch or API shortcut was executed.',
    ];
    result.notProved = [
      'Location FRA-ZL, Quantity 4 and Qty. to Receive 2 are not proven by P2P-011.',
      'Preview Posting and Receive remain locked.',
      'German final P2P proof remains open.',
    ];
    result.blockedBy = usefulEditCandidate ? [] : [
      'no-clear-safe-purchase-lines-edit-action-found-in-visible-action-inventory',
      'action-discovery-found-menu-context-but-not-a-proven-line-value-entry-route',
    ];
    result.nextStep = usefulEditCandidate
      ? 'Create a gated P2P-012 value-entry attempt using the discovered edit/action candidate; still no Preview Posting until target values are visible.'
      : 'Switch to alternative standard UI route such as Purchase Journal/Item Journal or plan a cleaner lab company route; do not repeat P2P-009/P2P-010.';

    await writeJson('P2P-011-result.json', result);
  });
});
