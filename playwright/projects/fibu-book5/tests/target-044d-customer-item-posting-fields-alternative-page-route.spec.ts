import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1500 }
});
test.setTimeout(420_000);

const CASE_ID = 'TARGET-044D-CUSTOMER-ITEM-POSTING-FIELDS-ALTERNATIVE-PAGE-ROUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-044d-customer-item-posting-fields-alternative-page-route';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');

type Probe = {
  id: 'customer-u-cust-100' | 'item-u-item-hw100';
  pageId: number;
  pageName: string;
  tableName: 'Customer' | 'Item';
  fieldName: 'No.';
  recordNo: string;
  expectedRecordText: RegExp;
  expandTargets: RegExp[];
  importantTerms: string[];
  screenshotPrefix: string;
};

const probes: Probe[] = [
  {
    id: 'customer-u-cust-100',
    pageId: 21,
    pageName: 'Customer Card / Debitorenkarte',
    tableName: 'Customer',
    fieldName: 'No.',
    recordNo: 'U-CUST-100',
    expectedRecordText: /U-CUST-100|Universaarl Kunde 100/i,
    expandTargets: [/^Fakturierung$|^Invoicing$/i, /^Zahlungen$|^Payments$/i],
    importantTerms: [
      'Debitorenbuchungsgruppe',
      'Customer Posting Group',
      'Geschäftsbuchungsgruppe',
      'Geschaeftsbuchungsgruppe',
      'Gen. Bus. Posting Group',
      'MwSt.-Geschäftsbuchungsgruppe',
      'MwSt.-Geschaeftsbuchungsgruppe',
      'VAT Bus. Posting Group',
      'Zahlungsbedingungscode',
      'Payment Terms Code',
      'Gesperrt',
      'Blocked'
    ],
    screenshotPrefix: 'target-044d-010-customer'
  },
  {
    id: 'item-u-item-hw100',
    pageId: 30,
    pageName: 'Item Card / Artikelkarte',
    tableName: 'Item',
    fieldName: 'No.',
    recordNo: 'U-ITEM-HW100',
    expectedRecordText: /U-ITEM-HW100|Universaarl Hardware 100|STK/i,
    expandTargets: [/Einstandspreise und Buchung|Costs and Posting/i, /Indirekte Steuer|Indirect Tax/i, /Beschaffung|Replenishment/i],
    importantTerms: [
      'Basiseinheit',
      'Base Unit of Measure',
      'Lagerbuchungsgruppe',
      'Item Posting Group',
      'Produktbuchungsgruppe',
      'Gen. Prod. Posting Group',
      'MwSt.-Produktbuchungsgruppe',
      'VAT Prod. Posting Group',
      'Einstandspreismethode',
      'Costing Method',
      'Lagerabgangsmethode',
      'Costing Method',
      'Lagerbestand',
      'Inventory'
    ],
    screenshotPrefix: 'target-044d-020-item'
  }
];

function buildCardUrl(probe: Probe) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(probe.pageId));
  url.searchParams.set('filter', `${probe.tableName}.'${probe.fieldName}' IS '@*${probe.recordNo}*'`);
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'filter', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter(
      (line) =>
        !/trustedOriginAuthorities|tokenFactory|cacheLocation|allowedEndpoints|parentPageOrigin|aadTenantId|clientId|requestExecutor/i.test(
          line
        ) &&
        !/upn|allowedResources|originAuthorityValidator|shouldAttachOauthTokens|authority|accessToken|refreshToken|bearer/i.test(
          line
        )
    )
    .join('\n')
    .trim();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function dangerText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Delete\?|Loeschen\?|Loschen\?|Neu|New|Bearbeiten|Edit|Create\?|Erstellen\?|Apply Template|Vorlage anwenden/i.test(
    text
  );
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function writeJson(fileName: string, payload: unknown) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(fileName.replace(/\.png$/i, '.screenshot.json'), {
    caseId: CASE_ID,
    fileName,
    imagePath: `playwright/projects/fibu-book5/img/${fileName}`,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function assertReadonlyContext(page: Page, expected: RegExp) {
  const currentUrl = page.url();
  expect(instancePathIsTarget(currentUrl), `Wrong instance in URL: ${sanitizeEvidenceUrl(currentUrl)}`).toBe(true);
  expect(companyParamIsTarget(currentUrl), `Wrong company in URL: ${sanitizeEvidenceUrl(currentUrl)}`).toBe(true);
  expect(cleanText(await pageText(page))).toMatch(expected);

  const dialogTexts: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = cleanText(await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (dangerText(text)) dialogTexts.push(text);
    }
  }
  expect(dialogTexts, 'A write-like or dangerous dialog is visible.').toEqual([]);
}

function pageParam(rawUrl: string) {
  return new URL(rawUrl).searchParams.get('page') ?? '';
}

async function assertStillOnPage(page: Page, probe: Probe) {
  await assertReadonlyContext(page, probe.expectedRecordText);
  expect(pageParam(page.url()), `Unexpected navigation away from ${probe.pageName}: ${sanitizeEvidenceUrl(page.url())}`).toBe(
    String(probe.pageId)
  );
}

async function clickVisiblePattern(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((patternSource) => {
        const patternValue = new RegExp(patternSource, 'i');
        const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],span[role="button"],a[role="button"]'))
          .filter(visible)
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            aria: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            expanded: normalize(element.getAttribute('aria-expanded')),
            rect: rectOf(element)
          }))
          .filter((entry) => {
            const value = `${entry.text} ${entry.aria} ${entry.title}`;
            return patternValue.test(value) && entry.rect.width >= 10 && entry.rect.height >= 8;
          })
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'not-found', candidates: [] };
        chosen.element.scrollIntoView({ block: 'center', inline: 'center' });
        chosen.element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        chosen.element.click();
        return {
          clicked: true,
          chosen: {
            text: chosen.text,
            aria: chosen.aria,
            title: chosen.title,
            expanded: chosen.expanded,
            rect: chosen.rect
          },
          candidates: candidates.slice(0, 8).map(({ element: _element, ...entry }) => entry)
        };
      }, pattern.source)
      .catch((error) => ({ clicked: false, reason: String(error), candidates: [] }));
    if (result.clicked) {
      await page.waitForTimeout(1000);
      return result;
    }
  }
  return { clicked: false, reason: 'not-found-in-any-frame', candidates: [] };
}

async function clickFastTabHeader(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((patternSource) => {
        const patternValue = new RegExp(patternSource, 'i');
        const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('span[role="button"],button[aria-expanded]'))
          .filter(visible)
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            aria: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            expanded: normalize(element.getAttribute('aria-expanded')),
            rect: rectOf(element)
          }))
          .filter((entry) => {
            const value = `${entry.text} ${entry.aria} ${entry.title}`;
            return patternValue.test(value) && /true|false/i.test(entry.expanded) && entry.rect.x < 1200;
          })
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'fasttab-not-found', candidates: [] };
        chosen.element.scrollIntoView({ block: 'center', inline: 'center' });
        chosen.element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        chosen.element.click();
        return {
          clicked: true,
          chosen: {
            text: chosen.text,
            aria: chosen.aria,
            title: chosen.title,
            expanded: chosen.expanded,
            rect: chosen.rect
          },
          candidates: candidates.slice(0, 8).map(({ element: _element, ...entry }) => entry)
        };
      }, pattern.source)
      .catch((error) => ({ clicked: false, reason: String(error), candidates: [] }));
    if (result.clicked) {
      await page.waitForTimeout(1000);
      return result;
    }
  }
  return { clicked: false, reason: 'fasttab-not-found-in-any-frame', candidates: [] };
}

async function revealMoreFields(page: Page) {
  const clicks = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await clickVisiblePattern(page, /Mehr anzeigen|Show more/i);
    if (!result.clicked) break;
    clicks.push(result);
    await page.waitForTimeout(800);
  }
  return clicks;
}

async function collectSignals(page: Page, terms: string[]) {
  const signals: Record<string, any[]> = Object.fromEntries(terms.map((term) => [term, []]));
  for (const frame of page.frames()) {
    const frameSignals = await frame
      .evaluate((targetTerms) => {
        const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const elements = Array.from(document.querySelectorAll<HTMLElement>('*'))
          .filter(visible)
          .map((element) => ({
            tag: element.tagName,
            role: normalize(element.getAttribute('role')),
            text: normalize(element.innerText || element.textContent),
            aria: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            rect: rectOf(element)
          }))
          .filter((entry) => `${entry.text} ${entry.aria} ${entry.title}`.trim().length > 0)
          .filter((entry) => entry.text.length <= 260);
        return Object.fromEntries(
          targetTerms.map((term) => {
            const pattern = term.toLocaleLowerCase();
            const hits = elements
              .filter((entry) => `${entry.text} ${entry.aria} ${entry.title}`.toLocaleLowerCase().includes(pattern))
              .slice(0, 12);
            return [term, hits];
          })
        );
      }, terms)
      .catch(() => Object.fromEntries(terms.map((term) => [term, []])));
    for (const term of terms) signals[term].push(...(frameSignals[term] ?? []));
  }
  return Object.fromEntries(
    Object.entries(signals).map(([term, hits]) => [
      term,
      hits
        .filter((hit, index, list) => index === list.findIndex((other) => JSON.stringify(other.rect) === JSON.stringify(hit.rect) && other.text === hit.text))
        .slice(0, 12)
    ])
  );
}

async function inspectProbe(page: Page, probe: Probe) {
  await page.goto(buildCardUrl(probe), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await expect
    .poll(async () => cleanText(await pageText(page)), { timeout: 35_000, intervals: [1000, 1500, 2500] })
    .toMatch(probe.expectedRecordText);
  await assertStillOnPage(page, probe);

  const initialText = await compactPageText(page, {
    include: [probe.expectedRecordText, /Fakturierung|Zahlungen|Lieferung|Einstandspreise|Buchung|Indirekte Steuer|Posting|Buchungsgruppe|MwSt|VAT|Payment|Zahlungs|Costing|Einstand|Lager/i],
    maxLines: 180,
    maxLineLength: 240
  });
  await writeText(`${probe.id}-initial.txt`, initialText);

  const revealClicks = await revealMoreFields(page);
  const expanded = [];
  for (const target of probe.expandTargets) {
    const clickResult = await clickFastTabHeader(page, target);
    expanded.push({ target: target.source, clickResult });
    await assertStillOnPage(page, probe);
    await revealMoreFields(page);
    await assertStillOnPage(page, probe);
  }

  const finalText = await compactPageText(page, {
    include: [probe.expectedRecordText, ...probe.importantTerms.map((term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))],
    maxLines: 220,
    maxLineLength: 260
  });
  const signals = await collectSignals(page, probe.importantTerms);
  await writeText(`${probe.id}-expanded.txt`, finalText || cleanText(await pageText(page)).slice(0, 9000));
  await writeJson(`${probe.id}-alternative-route-surface.json`, {
    page: probe.pageName,
    pageId: probe.pageId,
    recordNo: probe.recordNo,
    url: sanitizeEvidenceUrl(page.url()),
    revealClicks,
    expanded,
    signals
  });
  await screenshotWithMetadata(page, `${probe.screenshotPrefix}-expanded-standard-page-route.png`, {
    page: probe.pageName,
    pageId: probe.pageId,
    recordNo: probe.recordNo,
    step: 'expanded-standard-page-route',
    purpose: 'Read-only alternative standard page route after Personalize blocker.',
    status: 'universaarl-readonly-observed',
    importantUi: ['FastTabs', 'Mehr anzeigen', 'visible posting/VAT/payment/costing terms'],
    internallyProves: `${probe.recordNo} card can be inspected through standard page expansion without writes.`,
    doesNotProve: [
      'No posting/VAT value correctness.',
      'No setup write.',
      'No document, Preview Posting, Posting or ledger trace.'
    ],
    signalSummary: Object.fromEntries(Object.entries(signals).map(([term, hits]) => [term, hits.length]))
  });

  return {
    id: probe.id,
    page: probe.pageName,
    pageId: probe.pageId,
    recordNo: probe.recordNo,
    url: sanitizeEvidenceUrl(page.url()),
    revealClicks,
    expanded,
    signals: Object.fromEntries(
      Object.entries(signals).map(([term, hits]) => [
        term,
        {
          visible: hits.length > 0,
          hitCount: hits.length,
          bestSignal: hits[0] ?? null,
          hits
        }
      ])
    ),
    visibleTerms: Object.entries(signals)
      .filter(([, hits]) => hits.length > 0)
      .map(([term]) => term),
    missingTerms: Object.entries(signals)
      .filter(([, hits]) => hits.length === 0)
      .map(([term]) => term),
    screenshots: [`playwright/projects/fibu-book5/img/${probe.screenshotPrefix}-expanded-standard-page-route.png`],
    textFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${probe.id}-initial.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${probe.id}-expanded.txt`
    ],
    surfaceFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${probe.id}-alternative-route-surface.json`
  };
}

function resultReadme(result: any) {
  const rows = result.pages
    .flatMap((pageEntry: any) =>
      Object.entries(pageEntry.signals).map(([term, value]: any) => `| ${pageEntry.id} | ${term} | ${value.visible ? 'sichtbar' : 'nicht sichtbar'} | ${value.hitCount} |`)
    )
    .join('\n');
  return [
    '# TARGET-044D - Alternative Standard Page Route',
    '',
    `Status: ${result.resultStatus}`,
    '',
    'Dieser Lauf prueft Debitorenkarte und Artikelkarte ohne Personalisieren. Er nutzt nur Standardseiten-FastTabs, Mehr anzeigen und sichtbare Felder.',
    '',
    '| Seite | Feldbegriff | Sichtbarkeit | Signale |',
    '|---|---|---|---:|',
    rows,
    '',
    '## Nicht gemacht',
    '',
    '- kein Neu',
    '- kein Bearbeiten',
    '- keine Feld- oder Einrichtungsaenderung',
    '- keine Personalisierung',
    '- kein Beleg/Draft',
    '- keine Buchungsvorschau',
    '- keine Buchung',
    '- kein API Shortcut',
    '',
    `Naechster Case: ${result.nextCase}`,
    ''
  ].join('\n');
}

test('TARGET-044D uses expanded standard pages for customer/item field discovery', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const pages = [];
  const blockedBy: string[] = [];

  for (const probe of probes) {
    try {
      pages.push(await inspectProbe(page, probe));
    } catch (error) {
      blockedBy.push(`${probe.id}: ${String(error).replace(/\u001b\[[0-9;]*m/g, '').replace(/Received string:[\s\S]*/i, 'Received string: {redacted-page-text}')}`);
    }
  }

  const observed = blockedBy.length === 0 && pages.length === probes.length;
  const visibleTerms = pages.flatMap((entry) => entry.visibleTerms);
  const customerVisible = pages.find((entry) => entry.id === 'customer-u-cust-100')?.visibleTerms ?? [];
  const itemVisible = pages.find((entry) => entry.id === 'item-u-item-hw100')?.visibleTerms ?? [];
  const customerReadyForFit = customerVisible.some((term) => /Debitorenbuchungsgruppe|Customer Posting Group|Gesch.*buchungsgruppe|VAT Bus|MwSt.-Gesch/i.test(term));
  const itemReadyForFit = itemVisible.some((term) => /Lagerbuchungsgruppe|Item Posting Group|Produktbuchungsgruppe|Gen. Prod|VAT Prod|MwSt.-Produkt/i.test(term));
  const readyForControlledFit = observed && customerReadyForFit && itemReadyForFit;
const nextCase = readyForControlledFit
  ? 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT'
  : 'TARGET-036D2F-U-VEND-MANUAL-NOS-ROUTE-RECOVERY';

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT',
    lastEvidenceSummary: 'TARGET-044C blocked the Personalize route before stable target-card field discovery.',
    isPlannedNextCaseStillSensible: readyForControlledFit,
  reason: readyForControlledFit
    ? 'Expanded standard pages exposed enough customer and item field terms to prepare one narrow controlled fit case with exact values.'
    : 'Expanded standard pages did not expose enough customer and item posting/VAT field terms for a safe write; chart, VAT and posting-group setup chains are already classified, so the next useful Foundation step is the planned U-VEND Manual Nos route recovery.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT',
        status: readyForControlledFit ? 'ready-next' : 'needs-ui-discovery-first',
        reason: readyForControlledFit
          ? 'Use only if exact target values are named before writing.'
          : 'Still missing enough visible route/value truth.'
      },
      {
        caseId: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
        status: 'blocked',
        reason: 'Already blocked by screenshot truth gate; do not reactivate it as next case.'
      },
      {
        caseId: 'TARGET-026O-CHART-OF-ACCOUNTS-VISIBLE-SCREENSHOT-RECOVERY',
        status: 'ready-after-current',
        reason: 'Already completed with visible chart screenshot recovery; it supports the next VAT preflight.'
      },
      {
        caseId: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
        status: 'blocked',
        reason: 'The VAT route has already progressed through follow-ups and is parked by TARGET-027D24.'
      },
    {
      caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
      status: 'ready-after-current',
      reason: 'Already completed; not a valid active fallback after TARGET-044D.'
    },
    {
      caseId: 'TARGET-036D2F-U-VEND-MANUAL-NOS-ROUTE-RECOVERY',
      status: readyForControlledFit ? 'ready-after-current' : 'ready-next',
      reason: 'Only planned open Foundation recovery case: vendor creation remains blocked until U-VEND Manual Nos is proven safely.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C remains blocked until posting/VAT/payment field readiness is proven.'
      },
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
        status: 'blocked',
        reason: 'Vendor numbering remains parked and unrelated.'
      }
    ],
    queueChangesMade: [
      'TARGET-044D ran as expanded standard-page read-only discovery.',
      `Selected ${nextCase} as next case.`
    ],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: readyForControlledFit
      ? 'It turns visible standard-page field route evidence into one narrow fit gate without documents.'
      : 'It avoids another customer/item write attempt and follows the established W1 sequence after chart and VAT route decisions.',
    risksBeforeNextCase: [
      'Do not claim posting readiness from field visibility.',
      'Do not edit customer, item or setup fields without exact target values.',
      'Keep Preview Posting and Posting false.'
    ],
    requiredPreparation: readyForControlledFit
      ? ['Name exact posting/VAT/payment/costing target values.', 'Write Smart Decision before any field write.', 'Keep O2C/P2P documents locked.']
      : [
        'Read TARGET-036D2E and TARGET-036D2F before attempting the number-series route.',
        'Only U-VEND Manual Nos may be touched if the active case proves a safer route.',
        'Keep customer/item field writes, O2C/P2P documents, Preview Posting and Posting locked.'
      ]
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-standard-page-field-discovery',
    resultStatus: observed ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: pages.at(-1)?.url ?? '',
    page: 'Customer Card and Item Card expanded standard page route',
    actionsTaken: [
      'Opened U-CUST-100 Customer Card read-only via direct filtered page URL.',
      'Expanded safe standard FastTabs and clicked Mehr anzeigen/Show more where visible.',
      'Opened U-ITEM-HW100 Item Card read-only via direct filtered page URL.',
      'Expanded safe standard FastTabs and clicked Mehr anzeigen/Show more where visible.',
      'Captured screenshots, compact text, field signals and next-step decision.'
    ],
    actionsNotTaken: [
      'No New action clicked.',
      'No Edit action clicked.',
      'No customer field changed.',
      'No item field changed.',
      'No setup value changed.',
      'No personalization opened or applied.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No company switch.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    personalizationApplied: false,
    screenshots: pages.flatMap((entry) => entry.screenshots),
    proved: [
      observed ? 'U-CUST-100 and U-ITEM-HW100 were inspected on standard pages in playthru / UNIVERSAARL-DE.' : '',
      'Standard FastTabs and Mehr anzeigen/Show more were used as the alternative route instead of Personalize.',
      visibleTerms.length ? `Visible relevant terms captured: ${[...new Set(visibleTerms)].join(', ')}.` : 'No relevant posting/VAT field term was visible after standard-page expansion.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut, personalization or company switch occurred.'
    ].filter(Boolean),
    notProved: [
      'Field visibility is not value correctness.',
      'No customer or item posting field was changed.',
      'No VAT Posting Setup, General Posting Setup or Inventory Posting Setup correctness is proven by this route.',
      'No O2C, P2P, Preview Posting, Posting, Customer Ledger Entry, Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.'
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-044D-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      'playwright/projects/fibu-book5/img/target-044d-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-044D-result.json`,
      ...pages.flatMap((entry) => entry.screenshots)
    ],
    pages,
    visibleFieldTerms: [...new Set(visibleTerms)],
    missingFieldTerms: [...new Set(pages.flatMap((entry) => entry.missingTerms))],
    warnings: [
      'Visible terms are not posting readiness.',
      'This case intentionally does not write target values.',
      'TARGET-045 remains locked unless exact values and Smart Decision are prepared.'
    ],
    blockedBy,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noPersonalizationApplied: true
    },
    nextStepDecision,
  statePatch: {
    current: {
      activeArea: readyForControlledFit ? 'universaarl-customer-item-posting-fields-controlled-fit' : 'universaarl-number-series-route-recovery',
      activeCase: nextCase,
      active_case_file: readyForControlledFit
        ? '.agent/state/cases/target-045-customer-item-posting-fields-controlled-fit.json'
        : '.agent/state/cases/target-036d2f-u-vend-manual-nos-route-recovery.json',
      nextStep: readyForControlledFit
        ? 'Prepare TARGET-045 controlled customer/item posting field fit with exact target values.'
        : 'Run TARGET-036D2F U-VEND Manual Nos route recovery before retrying vendor creation.'
    },
      activeCase: {
        status: observed ? 'observed' : 'blocked',
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-044D-result.json`,
        nextCase
      }
    },
    requiresReview: false,
    safeToFinalizeState: observed,
    reason: observed
      ? 'Alternative standard-page route completed without writes.'
      : `Alternative standard-page route blocked: ${blockedBy.join('; ')}`,
    nextCase
  };

  await writeJson('TARGET-044D-result.json', result);
  await writeJson('field-availability-summary.json', {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    visibleFieldTerms: result.visibleFieldTerms,
    missingFieldTerms: result.missingFieldTerms,
    readyForControlledFit,
    pages: pages.map((entry) => ({
      id: entry.id,
      visibleTerms: entry.visibleTerms,
      missingTerms: entry.missingTerms,
      screenshot: entry.screenshots[0]
    }))
  });
  await writeText('README.md', resultReadme(result));

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.flags.noPersonalizationApplied).toBe(true);
  expect(result.resultStatus, JSON.stringify(blockedBy, null, 2)).toBe('observed');
});
