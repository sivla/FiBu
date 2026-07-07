import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  pageText,
  requireBcUrl,
  searchFor,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(240_000);

const CASE_ID = 'VAT-POSTING-SETUP-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'vat-posting-setup-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

type ProbeStatus = 'observed' | 'blocked' | 'rejected';

type TargetPage = {
  id: string;
  pageId: number;
  label: string;
  title: RegExp;
  bodySignals: RegExp[];
  include: RegExp[];
  searchTerms: string[];
  beginnerLearning: string;
  internallyProves: string;
  doesNotProve: string[];
};

type PageResult = {
  id: string;
  pageId: number;
  label: string;
  status: ProbeStatus;
  routeUsed: string[];
  url: string;
  screenshot: string;
  screenshotMetadata: string;
  textFile: string;
  visibleSignals: string[];
  blockedBy: string[];
  warnings: string[];
};

const targetPages: TargetPage[] = [
  {
    id: 'vat-business-posting-groups',
    pageId: 470,
    label: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    title: /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|USt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i,
    bodySignals: [/\bCode\b/i, /Beschreibung|Description/i],
    include: [/MwSt|USt|VAT|Gesch|Business Posting|Buchungsgruppe|\bCode\b|Beschreibung|Description|INLAND|EU|EXPORT/i],
    searchTerms: ['MwSt.-Geschaeftsbuchungsgruppen', 'VAT Business Posting Groups'],
    beginnerLearning:
      'Die MwSt.-Geschaeftsbuchungsgruppen ordnen den steuerlichen Kontext des Geschaeftspartners ein, zum Beispiel Inland, EU oder Export.',
    internallyProves: 'The VAT Business Posting Groups list is reachable read-only in the Universaarl target company.',
    doesNotProve: [
      'No VAT Business Posting Group was created or changed.',
      'No VAT Posting Setup row is proven correct.',
      'No customer, vendor or document VAT assignment is proven.'
    ]
  },
  {
    id: 'vat-product-posting-groups',
    pageId: 471,
    label: 'MwSt.-Produktbuchungsgruppen / VAT Product Posting Groups',
    title: /MwSt\.-?Produktbuchungsgruppen|USt\.-?Produktbuchungsgruppen|VAT Product Posting Groups/i,
    bodySignals: [/\bCode\b/i, /Beschreibung|Description/i],
    include: [/MwSt|USt|VAT|Produkt|Product Posting|Buchungsgruppe|\bCode\b|Beschreibung|Description|VAT19|19/i],
    searchTerms: ['MwSt.-Produktbuchungsgruppen', 'VAT Product Posting Groups'],
    beginnerLearning:
      'Die MwSt.-Produktbuchungsgruppen ordnen ein, welche steuerliche Logik fuer Artikel, Dienstleistungen oder Sachkonten gilt.',
    internallyProves: 'The VAT Product Posting Groups list is reachable read-only in the Universaarl target company.',
    doesNotProve: [
      'No VAT Product Posting Group was created or changed.',
      'No VAT percent or VAT account correctness is proven.',
      'No item, service or G/L account VAT assignment is proven.'
    ]
  },
  {
    id: 'vat-posting-setup',
    pageId: 472,
    label: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    title: /MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Posting Setup/i,
    bodySignals: [/MwSt|USt|VAT/i, /Gesch[a-z]*ftsbuchungsgruppe|Bus\. Posting Group/i, /Produktbuchungsgruppe|Prod\. Posting Group/i],
    include: [
      /MwSt|USt|VAT|Buchungsmatrix|Gesch|Produkt|VAT %|MwSt\. %|Berechnungsart|Calculation Type|Umsatzsteuerkonto|Vorsteuerkonto|Sales VAT|Purchase VAT|INLAND|VAT19|1406|3806/i
    ],
    searchTerms: ['MwSt.-Buchungsmatrix', 'VAT Posting Setup'],
    beginnerLearning:
      'Die MwSt.-Buchungsmatrix verbindet Geschaeftspartnergruppe und Produktgruppe mit Steuersatz, Berechnungsart und Steuerkonten.',
    internallyProves: 'The VAT Posting Setup matrix is reachable read-only in the Universaarl target company.',
    doesNotProve: [
      'No INLAND/VAT19 row was created or changed.',
      'No German 19 percent VAT correctness is proven.',
      'No Preview Posting, VAT Entry or G/L Entry exists.'
    ]
  }
];

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|originAuthorityValidator|upn:|shouldAttachOauthTokens/i.test(line))
    .join('\n')
    .trim();
}

function targetUrl(pageId?: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) throw new Error('Business Central URL must include an environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  if (pageId) url.searchParams.set('page', String(pageId));
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
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

function dangerousDialogSignal(text: string) {
  return /\b(Post|Buchen|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Yes|Ja|OK)\b/i.test(
    text
  );
}

function searchOverlaySignal(text: string) {
  return /Wie mochten Sie weiter verfahren|Was mochten Sie tun|Tell me|Nach .* suchen|Seiten und Aufgaben|Zu Seiten und Aufgaben wechseln/i.test(
    text
  );
}

function writeActionWarnings(text: string) {
  return [
    /Neu|New/i.test(text) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Bearbeiten|Edit|Liste bearbeiten/i.test(text) ? 'Edit/List Edit action may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting or Preview Posting action text may be visible but was not clicked.'
      : ''
  ].filter(Boolean);
}

async function visibleText(page: Page) {
  const frameTexts = await Promise.all(
    page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1200 }).catch(() => ''))
  );
  return clean(`${await pageText(page).catch(() => '')}\n${frameTexts.join('\n')}`);
}

async function compactText(page: Page, target: TargetPage) {
  return clean(
    await compactPageText(page, {
      include: [...target.include, /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Weitere Optionen|More options|Code|Beschreibung|Description/i],
      maxLines: 180,
      maxLineLength: 240
    }).catch(() => '')
  );
}

function targetVisible(text: string, target: TargetPage) {
  return target.title.test(text) && target.bodySignals.every((signal) => signal.test(text));
}

async function clickSearchResult(page: Page, target: TargetPage) {
  const scopes: Array<Page | Frame> = [page, ...page.frames()];
  for (const scope of scopes) {
    const locators = [
      scope.getByRole('option', { name: target.title }),
      scope.getByRole('button', { name: target.title }),
      scope.getByRole('link', { name: target.title }),
      scope.getByText(target.title)
    ];
    for (const locator of locators) {
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < Math.min(count, 4); index += 1) {
        const item = locator.nth(index);
        if (!(await item.isVisible({ timeout: 500 }).catch(() => false))) continue;
        await item.click({ timeout: 5000 });
        return true;
      }
    }
  }
  return false;
}

async function openReadOnlyPage(page: Page, target: TargetPage) {
  const routeUsed = [`direct-page-${target.pageId}`];
  await page.goto(targetUrl(target.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await expect.poll(async () => visibleText(page), { timeout: 20_000 }).toMatch(/Business Central|Dynamics 365|Universaarl|MwSt|VAT|USt|Kontenplan/i);

  let fullText = await visibleText(page);
  if (targetVisible(fullText, target) && !searchOverlaySignal(fullText)) {
    return { routeUsed, text: clean(`${fullText}\n${await compactText(page, target)}`) };
  }

  for (const term of target.searchTerms) {
    routeUsed.push(`search-fallback:${term}`);
    await page.goto(targetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await searchFor(page, term);
    const clicked = await clickSearchResult(page, target);
    routeUsed.push(clicked ? 'exact-visible-result-clicked' : 'exact-visible-result-not-found');
    if (!clicked) continue;
    await waitForBusinessCentralShell(page);
    await page.keyboard.press('Escape').catch(() => undefined);
    await expect.poll(async () => visibleText(page), { timeout: 15_000 }).toMatch(/Business Central|Dynamics 365|Universaarl|MwSt|VAT|USt/i);
    fullText = await visibleText(page);
    if (targetVisible(fullText, target) && !searchOverlaySignal(fullText)) {
      return { routeUsed, text: clean(`${fullText}\n${await compactText(page, target)}`) };
    }
  }

  return { routeUsed, text: clean(`${await visibleText(page)}\n${await compactText(page, target)}`) };
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const imagePath = evidencePath(PROJECT, EVIDENCE_ID, fileName);
  const metadataPath = evidencePath(PROJECT, EVIDENCE_ID, fileName.replace(/\.png$/i, '.screenshot.json'));
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJsonEvidence(metadataPath, {
    fileName,
    imagePath: `${EVIDENCE_DIR_REL}/${fileName}`,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
  return {
    screenshot: `${EVIDENCE_DIR_REL}/${fileName}`,
    screenshotMetadata: `${EVIDENCE_DIR_REL}/${path.basename(metadataPath)}`
  };
}

async function probeVatPage(page: Page, target: TargetPage, index: number): Promise<PageResult> {
  const route = await openReadOnlyPage(page, target);
  const text = route.text;
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const titleVisible = target.title.test(text);
  const bodySignalsVisible = target.bodySignals.every((signal) => signal.test(text));
  const searchOverlay = searchOverlaySignal(text);
  const dangerousDialog = dangerousDialogSignal(text);
  const status: ProbeStatus =
    !safeContext || dangerousDialog ? 'blocked' : titleVisible && bodySignalsVisible && !searchOverlay ? 'observed' : 'rejected';

  const stem = `vat-readfirst-${String(index).padStart(3, '0')}-${target.id}`;
  const textFile = `${stem}.txt`;
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), text || 'No visible VAT setup text captured.');
  const shot = await screenshotWithMetadata(page, `${stem}.png`, {
    page: target.label,
    pageId: target.pageId,
    routeUsed: route.routeUsed,
    status,
    screenshotQa: {
      titleVisible,
      bodySignalsVisible,
      searchOverlay,
      dangerousDialog,
      acceptedAsProof: status === 'observed'
    },
    whatAUserSees: target.beginnerLearning,
    internallyProves: status === 'observed' ? target.internallyProves : `No accepted proof for ${target.label}.`,
    doesNotProve: target.doesNotProve,
    importantUi: ['Page title', 'Code/list columns', 'visible setup context', 'write-capable actions if visible but untouched'],
    finalScreenshotStatus: status === 'observed' ? 'draft-candidate' : 'rejected'
  });

  return {
    id: target.id,
    pageId: target.pageId,
    label: target.label,
    status,
    routeUsed: route.routeUsed,
    url: sanitizeUrl(currentUrl),
    screenshot: shot.screenshot,
    screenshotMetadata: shot.screenshotMetadata,
    textFile: `${EVIDENCE_DIR_REL}/${textFile}`,
    visibleSignals: text.split('\n').slice(0, 60),
    blockedBy:
      status === 'observed'
        ? []
        : [
            ...(!safeContext ? [`Expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}, but URL context was unsafe.`] : []),
            ...(!titleVisible ? [`Page title not visible for ${target.label}.`] : []),
            ...(!bodySignalsVisible ? [`Required list/setup body signals not visible for ${target.label}.`] : []),
            ...(searchOverlay ? [`Visible text still looks like Tell-Me/search overlay for ${target.label}.`] : []),
            ...(dangerousDialog ? [`Dangerous dialog/action signal visible for ${target.label}; no confirmation was performed.`] : [])
          ],
    warnings: writeActionWarnings(text)
  };
}

test('VAT-POSTING-SETUP-READFIRST captures VAT setup pages read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const startedAt = new Date().toISOString();
  const pages: PageResult[] = [];
  for (let index = 0; index < targetPages.length; index += 1) {
    pages.push(await probeVatPage(page, targetPages[index], index + 1));
  }

  const observed = pages.filter((entry) => entry.status === 'observed');
  const blocked = pages.filter((entry) => entry.status === 'blocked');
  const rejected = pages.filter((entry) => entry.status === 'rejected');
  const resultStatus = blocked.length > 0 ? 'blocked' : rejected.length > 0 ? 'partially-observed' : 'observed';
  const nextCase = resultStatus === 'observed' ? 'POSTING-GROUPS-SETUP-READFIRST' : 'VAT-POSTING-SETUP-ROUTE-RECOVERY';
  const evidenceRefs = [
    `${EVIDENCE_DIR_REL}/result.json`,
    `${EVIDENCE_DIR_REL}/README.md`,
    ...pages.flatMap((entry) => [entry.textFile, entry.screenshot, entry.screenshotMetadata])
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-setup-readfirst',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'VAT/USt setup context',
    url: pages.at(-1)?.url ?? '',
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    companySwitch: false,
    confidentialRealCustomerDataUsed: false,
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE with stored auth.',
      'Opened VAT Business Posting Groups read-only.',
      'Opened VAT Product Posting Groups read-only.',
      'Opened VAT Posting Setup read-only.',
      'Captured text evidence, screenshot and screenshot-QA metadata for each VAT setup context.'
    ],
    actionsNotTaken: [
      'No New/Neu action clicked.',
      'No Edit/List Edit action clicked.',
      'No value typed.',
      'No VAT setup changed.',
      'No posting setup changed.',
      'No master data changed.',
      'No sales or purchase document created.',
      'No journal line created.',
      'No Preview Posting.',
      'No Posting.',
      'No Payment.',
      'No API shortcut.',
      'No company switch.',
      'No confidential real customer data used.'
    ],
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      `${observed.length}/${targetPages.length} VAT/USt setup pages passed screenshot QA as visible read-only context.`,
      'VAT/USt context was observed without setup, master data, document, Preview Posting, Posting, Payment or API change.',
      ...observed.map((entry) => `${entry.label} was visible read-only.`)
    ],
    notProved: [
      'No German VAT correctness.',
      'No 19 percent VAT setup completeness.',
      'No VAT account correctness.',
      'No customer, vendor, item or G/L account VAT default assignment.',
      'No Preview Posting, VAT Entry or G/L Entry.',
      ...rejected.map((entry) => `${entry.label} did not pass full screenshot QA.`),
      ...blocked.map((entry) => `${entry.label} was blocked before accepted proof.`)
    ],
    blockedBy: pages.flatMap((entry) => entry.blockedBy),
    warnings: Array.from(new Set(pages.flatMap((entry) => entry.warnings))),
    pages,
    screenshots: pages.map((entry) => entry.screenshot),
    evidenceRefs,
    changedFiles: evidenceRefs,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noPostingSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      readOnlyDirectPageRoutes: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'U-ITEM-HW100 price/cost was proven at item-card level; Foundation returns to VAT/USt setup context before any O2C/P2P route.',
      isPlannedNextCaseStillSensible: true,
      reason:
        resultStatus === 'observed'
          ? 'All three VAT setup contexts are visible read-only; the next useful Foundation step is Posting Groups setup read-first.'
          : 'VAT setup context is not fully accepted yet; route recovery is safer than any setup or master-data work.',
      lookaheadReviewed: [
        {
          caseId: 'POSTING-GROUPS-SETUP-READFIRST',
          status: resultStatus === 'observed' ? 'ready-next' : 'ready-after-current',
          reason: 'Posting Groups should follow only after VAT/USt context is at least visibly mapped.'
        },
        {
          caseId: 'DIMENSIONS-READFIRST-RECOVERY',
          status: 'ready-after-current',
          reason: 'Dimensions remain a Foundation dependency before process documents, but are not needed inside this VAT read-first case.'
        },
        {
          caseId: 'FOUNDATION-READINESS-DECISION',
          status: resultStatus === 'observed' ? 'ready-after-current' : 'blocked',
          reason: 'Foundation readiness needs accepted VAT, posting-group and dimensions context before master-data routing.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'O2C waits for Foundation readiness, posting groups and customer/item dependency checks.'
        },
        {
          caseId: 'P2P-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'P2P waits for Foundation readiness, posting groups and vendor/item dependency checks.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'VAT read-first should hand off to Posting Groups setup context, not documents or writes.'
          : 'A route recovery case prevents false setup claims from weak screenshots.',
      risksBeforeNextCase: [
        'Do not treat visible VAT setup pages as German tax correctness.',
        'Do not write VAT setup without source-backed Smart Decision and explicit write case.',
        'Do not create O2C/P2P documents before Foundation readiness.'
      ],
      requiredPreparation:
        resultStatus === 'observed'
          ? ['Create or activate POSTING-GROUPS-SETUP-READFIRST as next Foundation read-only case.']
          : ['Review rejected/blocked screenshots and improve the route before any setup work.']
    },
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'VAT/USt setup context observed read-only.'
        : 'VAT/USt setup context needs route review before follow-up.',
    nextCase
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# VAT-POSTING-SETUP-READFIRST',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Screenshot-QA-Regel',
      '',
      '- Akzeptiert wird nur ein sichtbarer Seitenkontext der echten USt-/MwSt.-Seite.',
      '- Suchtreffer, Role Center, versteckter Text oder alte Seitenreste gelten nicht als Beweis.',
      '- Neu, Bearbeiten, Liste bearbeiten, Loeschen, Preview und Buchen bleiben ungeklickt.',
      '',
      '## Grenzen',
      '',
      '- Keine MwSt.-Einrichtung wurde angelegt oder geaendert.',
      '- Keine Buchungsgruppen wurden geaendert.',
      '- Keine Stammdaten, kein Beleg, keine Preview, keine Buchung.',
      '- Keine finale deutsche USt- oder Steuerberaterbehauptung.',
      '',
      '## Evidence-Dateien',
      '',
      ...evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(blocked, blocked.map((entry) => `${entry.id}: ${entry.blockedBy.join('; ')}`).join('\n')).toHaveLength(0);
});
