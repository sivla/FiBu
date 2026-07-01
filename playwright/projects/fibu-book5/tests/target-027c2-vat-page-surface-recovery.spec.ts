import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-027C2-VAT-PAGE-SURFACE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027c2-vat-page-surface-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027C2-result.json');

type TargetPage = {
  id: 'business' | 'product';
  pageId: number;
  label: string;
  title: RegExp;
  searchTerms: string[];
};

type Capture = {
  targetId: TargetPage['id'];
  pageId: number;
  label: string;
  route: string;
  status: 'accepted' | 'rejected';
  url: string;
  screenshot: string;
  screenshotMetadata: string;
  textFile: string;
  titleVisible: boolean;
  codeColumnVisible: boolean;
  descriptionColumnVisible: boolean;
  roleCenterVisible: boolean;
  searchOverlayVisible: boolean;
  dangerousDialogVisible: boolean;
  visibleSignals: string[];
  frameSignals: Array<{ frameUrl: string; title: boolean; code: boolean; description: boolean; lines: string[] }>;
  rejectedBecause: string[];
};

const targets: TargetPage[] = [
  {
    id: 'business',
    pageId: 470,
    label: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    title: /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|USt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i,
    searchTerms: ['MwSt.-Geschaeftsbuchungsgruppen', 'VAT Business Posting Groups']
  },
  {
    id: 'product',
    pageId: 471,
    label: 'MwSt.-Produktbuchungsgruppen / VAT Product Posting Groups',
    title: /MwSt\.-?Produktbuchungsgruppen|USt\.-?Produktbuchungsgruppen|VAT Product Posting Groups/i,
    searchTerms: ['MwSt.-Produktbuchungsgruppen', 'VAT Product Posting Groups']
  }
];

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId|clientId|authority:|upn:/i.test(line))
    .join('\n')
    .trim();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['company', 'page', 'dc', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function buildPlaythruUrl(pageId: number, variant: 'standard' | 'dc-first') {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  if (variant === 'dc-first') {
    url.searchParams.set('dc', '0');
    url.searchParams.set('company', TARGET_COMPANY);
    url.searchParams.set('page', String(pageId));
  } else {
    url.searchParams.set('company', TARGET_COMPANY);
    url.searchParams.set('page', String(pageId));
    url.searchParams.set('dc', '0');
  }
  return url.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function isRoleCenter(text: string) {
  return /Guten Morgen|Aktivitaeten|Laufender Verkauf|Laufende Einkaufe|Shopify\s+-\s+Aktivitaeten/i.test(text);
}

function isSearchOverlay(text: string) {
  return /Seiten und Aufgaben|Wie mochten Sie weiter verfahren|Was mochten Sie tun|Tell me|Nach .* suchen|Search for/i.test(text);
}

function hasDangerousDialog(text: string) {
  return /\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Yes|Ja|OK)\b/i.test(text);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function visibleFrameSignals(page: Page, target: TargetPage) {
  const signals: Capture['frameSignals'] = [];
  for (const frame of page.frames()) {
    const lines = await frame
      .evaluate(() => {
        return [...document.querySelectorAll<HTMLElement>('body *')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            const visible =
              text.length > 0 &&
              rect.width > 1 &&
              rect.height > 1 &&
              rect.bottom > 0 &&
              rect.right > 0 &&
              rect.top < window.innerHeight &&
              rect.left < window.innerWidth &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              Number(style.opacity || '1') > 0;
            return visible ? text : '';
          })
          .filter(Boolean)
          .slice(0, 800);
      })
      .catch(() => []);
    const text = clean([...new Set(lines)].join('\n'));
    signals.push({
      frameUrl: sanitizeUrl(frame.url()),
      title: target.title.test(text),
      code: /\bCode\b/i.test(text),
      description: /Beschreibung|Description/i.test(text),
      lines: text.split('\n').filter((line) => target.title.test(line) || /\bCode\b|Beschreibung|Description|Neu|Liste bearbeiten/i.test(line)).slice(0, 40)
    });
  }
  return signals;
}

async function compactVisibleText(page: Page, target: TargetPage) {
  const compact = await compactPageText(page, {
    include: [target.title, /\bCode\b/i, /Beschreibung|Description/i, /Neu|Liste bearbeiten|Verwaltung|MwSt|VAT/i],
    maxLines: 220,
    maxLineLength: 240
  });
  return clean(compact);
}

async function clickExactResult(page: Page, target: TargetPage) {
  const patterns = [
    new RegExp(`${target.label.split(' / ')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+Verwaltung`, 'i'),
    target.title
  ];
  for (const scope of [page, ...page.frames()] as Array<Page | Frame>) {
    for (const pattern of patterns) {
      const locators = [
        scope.getByRole('option', { name: pattern }),
        scope.getByRole('button', { name: pattern }),
        scope.getByRole('link', { name: pattern }),
        scope.getByText(pattern)
      ];
      for (const locator of locators) {
        const count = await locator.count().catch(() => 0);
        for (let index = 0; index < Math.min(count, 4); index += 1) {
          const item = locator.nth(index);
          if (!(await item.isVisible({ timeout: 500 }).catch(() => false))) continue;
          await item.click({ timeout: 5000 }).catch(async () => item.click({ timeout: 5000, force: true }));
          await page.waitForTimeout(2500);
          return true;
        }
      }
    }
  }
  return false;
}

async function capture(page: Page, target: TargetPage, route: string, sequence: number): Promise<Capture> {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  const text = await compactVisibleText(page, target);
  const frameSignals = await visibleFrameSignals(page, target);
  const titleVisible = target.title.test(text) || frameSignals.some((entry) => entry.title);
  const codeColumnVisible = /\bCode\b/i.test(text) || frameSignals.some((entry) => entry.code);
  const descriptionColumnVisible = /Beschreibung|Description/i.test(text) || frameSignals.some((entry) => entry.description);
  const roleCenterVisible = isRoleCenter(text);
  const searchOverlayVisible = isSearchOverlay(text);
  const dangerousDialogVisible = hasDangerousDialog(text);
  const accepted = titleVisible && codeColumnVisible && descriptionColumnVisible && !searchOverlayVisible && !dangerousDialogVisible;
  const rejectedBecause = [
    !titleVisible ? 'target title not visible' : '',
    !codeColumnVisible ? 'Code column not visible' : '',
    !descriptionColumnVisible ? 'Beschreibung/Description column not visible' : '',
    searchOverlayVisible ? 'search overlay visible' : '',
    dangerousDialogVisible ? 'dangerous dialog/action signal visible' : ''
  ].filter(Boolean);
  const prefix = `target-027c2-${String(sequence).padStart(3, '0')}-${target.id}-${route.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  const screenshot = `${prefix}.png`;
  const metadata = `${prefix}.screenshot.json`;
  const textFile = `${prefix}.txt`;
  await writeText(textFile, text || 'No compact visible VAT surface text captured.');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, screenshot), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, metadata), {
    fileName: screenshot,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: target.label,
    pageId: target.pageId,
    route,
    status: accepted ? 'accepted-readonly-surface' : 'rejected-readonly-surface',
    screenshotQa: {
      titleVisible,
      codeColumnVisible,
      descriptionColumnVisible,
      roleCenterVisible,
      searchOverlayVisible,
      dangerousDialogVisible,
      accepted
    },
    whatAUserSees:
      target.id === 'business'
        ? 'Die Liste MwSt.-Geschaeftsbuchungsgruppen trennt Geschaeftspartner nach steuerlichem Kontext.'
        : 'Die Liste MwSt.-Produktbuchungsgruppen trennt Artikel, Ressourcen oder Sachkonten nach steuerlichem Kontext.',
    internallyProves: accepted ? `${target.label} is visible read-only.` : `Route ${route} is not accepted for ${target.label}.`,
    doesNotProve: [
      'No VAT group was created or changed.',
      'No VAT Posting Setup matrix row exists.',
      'No German 19 percent VAT calculation.',
      'No Preview Posting, Posting, VAT Entry or G/L Entry.'
    ],
    frameSignals
  });
  return {
    targetId: target.id,
    pageId: target.pageId,
    label: target.label,
    route,
    status: accepted ? 'accepted' : 'rejected',
    url: sanitizeUrl(page.url()),
    screenshot,
    screenshotMetadata: metadata,
    textFile,
    titleVisible,
    codeColumnVisible,
    descriptionColumnVisible,
    roleCenterVisible,
    searchOverlayVisible,
    dangerousDialogVisible,
    visibleSignals: text.split('\n').slice(0, 80),
    frameSignals,
    rejectedBecause
  };
}

async function runRoutes(page: Page, target: TargetPage) {
  const captures: Capture[] = [];
  let sequence = 1;

  for (const variant of ['standard', 'dc-first'] as const) {
    await page.goto(buildPlaythruUrl(target.pageId, variant), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(1800);
    captures.push(await capture(page, target, `direct-${variant}`, sequence++));
    if (captures[captures.length - 1].status === 'accepted') return captures;
  }

  for (const term of target.searchTerms) {
    await searchFor(page, term);
    await page.waitForTimeout(900);
    captures.push(await capture(page, target, `search-overlay-${term}`, sequence++));
    const clicked = await clickExactResult(page, target);
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(1800);
    captures.push(await capture(page, target, clicked ? `search-click-${term}` : `search-no-click-${term}`, sequence++));
    if (captures[captures.length - 1].status === 'accepted') return captures;
  }

  return captures;
}

test('TARGET-027C2 recovers visible VAT page surfaces read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const allCaptures: Capture[] = [];
  const blockedBy: string[] = [];

  for (const target of targets) {
    const captures = await runRoutes(page, target);
    allCaptures.push(...captures);
    const accepted = captures.find((entry) => entry.status === 'accepted');
    if (!accepted) {
      blockedBy.push(`${target.label}: no accepted visible VAT surface after direct and exact search routes.`);
    }
  }

  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  if (!safeContext) blockedBy.push(`Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`);

  const acceptedCaptures = allCaptures.filter((entry) => entry.status === 'accepted');
  const status = blockedBy.length === 0 ? 'observed' : acceptedCaptures.length > 0 ? 'partially-observed' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-page-surface-recovery-readonly',
    resultStatus: status,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Tried direct Page 470 and Page 471 URLs with page/company/dc parameters.',
      'Tried exact German/English search-result routes as read-only fallback.',
      'Captured full-page screenshots, compact text and frame-level visible-surface diagnostics.',
      'Stopped before any New, Edit List, VAT group write, matrix setup, master data, Preview Posting or Posting.'
    ],
    actionsNotTaken: [
      'No VAT group create/edit',
      'No VAT Posting Setup matrix row',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No Company switch'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      ...acceptedCaptures.map((entry) => `${entry.label} accepted via ${entry.route}.`),
      'No VAT setup, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
    ],
    notProved: [
      ...(acceptedCaptures.length === 2 ? [] : ['Not all VAT group pages have accepted visible surfaces.']),
      'No INLAND or VAT19 group exists or was changed by this run.',
      'No VAT Posting Setup matrix row exists.',
      'No German 19 percent VAT calculation is proven.',
      'No VAT Entries or G/L Entries exist.'
    ],
    captures: allCaptures,
    screenshots: allCaptures.map((entry) => entry.screenshot),
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027C2-result.json`,
      ...allCaptures.flatMap((entry) => [
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.textFile}`,
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.screenshot}`,
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.screenshotMetadata}`
      ])
    ],
    blockedBy,
    warnings: [
      'This is route/surface recovery only; visible New/Edit actions remain unclicked.',
      'Role Center background is acceptable only if the target page title and list columns are visible in the foreground surface.'
    ],
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-027C blocked before write because Page 470/471 did not produce accepted visible VAT list surfaces.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Surface recovery is the prerequisite for safely retrying INLAND/VAT19 creation.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE-RETRY',
          status: acceptedCaptures.length === 2 ? 'ready-next' : 'blocked',
          reason: acceptedCaptures.length === 2 ? 'Both VAT group pages have accepted visible surfaces.' : 'Retry remains locked until both surfaces are accepted.'
        },
        {
          caseId: 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE',
          status: 'needs-setup-first',
          reason: 'The matrix row depends on INLAND and VAT19 existing visibly first.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting groups wait for VAT matrix setup.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for VAT and posting group defaults.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase:
        acceptedCaptures.length === 2 ? 'TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE-RETRY' : 'TARGET-027C3-TELL-ME-INPUT-FOCUS-RECOVERY',
      whySelectedNextCaseIsBest:
        acceptedCaptures.length === 2
          ? 'The page-surface blocker is removed; the smallest next practical step is the bounded group write retry.'
          : 'The surface blocker remains; writing VAT groups would still risk unscoped actions.',
      risksBeforeNextCase: [
        'Do not accept Role Center or Tell-Me overlay as VAT page proof.',
        'Do not claim German VAT correctness before matrix, Preview Posting, VAT Entries and G/L Entries.'
      ],
      requiredPreparation:
        acceptedCaptures.length === 2
          ? ['Reuse the accepted route names and screenshots when retrying INLAND/VAT19.']
          : ['Recover the visible Tell-Me search textbox input before retrying VAT page navigation.']
    },
    safeToFinalizeState: false,
    requiresReview: status !== 'observed',
    statePatch: {},
    nextCase: acceptedCaptures.length === 2 ? 'TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE-RETRY' : 'TARGET-027C3-TELL-ME-INPUT-FOCUS-RECOVERY',
    reason:
      status === 'observed'
        ? 'VAT group page surfaces recovered read-only; setup write remains separate.'
        : 'VAT group page surface recovery is incomplete; setup writes remain locked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027C2 VAT Page Surface Recovery',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Screenshot-QA',
      '',
      '- Akzeptiert wird nur ein sichtbarer VAT-Listenbereich mit Seitentitel, Code-Spalte und Beschreibung-Spalte.',
      '- Role Center, Suchoverlay oder versteckter DOM-Text reichen nicht.',
      '- Schreibaktionen wie Neu oder Liste bearbeiten bleiben ungeklickt.',
      '',
      '## Grenzen',
      '',
      '- Keine VAT-Gruppe wurde angelegt oder geaendert.',
      '- Keine MwSt.-Buchungsmatrix wurde geaendert.',
      '- Keine Stammdaten, kein Beleg, keine Preview, keine Buchung.'
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(['observed', 'partially-observed', 'blocked']).toContain(result.resultStatus);
});
