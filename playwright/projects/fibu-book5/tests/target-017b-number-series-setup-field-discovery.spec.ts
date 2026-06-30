import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-017B-NUMBER-SERIES-SETUP-FIELD-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-017b-number-series-setup-field-discovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-017B-result.json');

type Rect = { x: number; y: number; width: number; height: number };
type SetupArea = {
  id: string;
  pageId: number;
  title: string;
  titlePattern: RegExp;
  targets: FieldTarget[];
};
type FieldTarget = {
  id: string;
  fieldIntent: string;
  numberSeries: string;
  captions: string[];
};
type Candidate = {
  frameIndex: number;
  caption: string;
  labelText: string;
  labelRect: Rect;
  nearbyControls: ControlInfo[];
  nearbyButtons: ControlInfo[];
  nearbyText: string[];
  tooltipText: string;
  status: 'visible-with-control' | 'visible-no-control' | 'not-visible';
};
type ControlInfo = {
  tag: string;
  role: string;
  ariaLabel: string;
  title: string;
  value: string;
  text: string;
  readOnly: boolean;
  disabled: boolean;
  rect: Rect;
};
type Discovery = {
  setupArea: string;
  pageId: number;
  fieldIntent: string;
  numberSeries: string;
  candidates: Candidate[];
  status: 'field-route-found' | 'field-visible-no-control' | 'field-not-visible';
  reason: string;
};

const setupAreas: SetupArea[] = [
  {
    id: 'sales-receivables-setup',
    pageId: 459,
    title: 'Einrichtung Debitoren und Verkauf / Sales & Receivables Setup',
    titlePattern: /Einrichtung Debitoren und Verkauf|Sales & Receivables Setup|Debitoren.*Verkauf/i,
    targets: [
      {
        id: 'sales-customer-nos',
        fieldIntent: 'Customer Nos.',
        numberSeries: 'U-CUST',
        captions: ['Debitorennummern', 'Debitorennr.', 'Customer Nos.', 'Customer numbers']
      }
    ]
  },
  {
    id: 'purchases-payables-setup',
    pageId: 460,
    title: 'Kreditoren & Einkauf Einr. / Purchases & Payables Setup',
    titlePattern: /Kreditoren.*Einkauf|Purchases & Payables Setup/i,
    targets: [
      {
        id: 'purchase-order-nos',
        fieldIntent: 'Purchase Order Nos.',
        numberSeries: 'U-PO',
        captions: ['Bestellungsnummern', 'Bestellnummern', 'Einkaufsbestellungsnummern', 'Order Nos.', 'Purchase Order Nos.']
      }
    ]
  },
  {
    id: 'inventory-setup',
    pageId: 461,
    title: 'Lager Einrichtung / Inventory Setup',
    titlePattern: /Lager Einrichtung|Inventory Setup/i,
    targets: [
      {
        id: 'inventory-item-nos',
        fieldIntent: 'Item Nos.',
        numberSeries: 'U-ITEM',
        captions: ['Artikelnummern', 'Artikelnr.', 'Item Nos.', 'Item numbers']
      }
    ]
  }
];

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
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

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function dangerousText(text: string) {
  return /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Preview Posting|Buchungsvorschau|Delete\?|Loeschen\?|Ship and Invoice|Liefern und fakturieren|Neues Unternehmen erstellen|Create New Company/i.test(
    text
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    finalScreenshotStatus: 'universaarl-foundation-field-discovery',
    ...metadata
  });
}

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function assertSafeSetupContext(page: Page, setup: SetupArea) {
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) throw new Error(`Unsafe BC context: ${sanitizeUrl(url)}`);
  const text = await safeText(page);
  if (!setup.titlePattern.test(text)) throw new Error(`${setup.title} is not visible.`);
  if (dangerousText(text)) throw new Error('Risky dialog/action text is visible.');
}

async function openSetupPage(page: Page, setup: SetupArea) {
  await page.goto(buildPlaythruUrl(setup.pageId).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  await assertSafeSetupContext(page, setup);
}

async function clickEditModeIfVisible(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const locator of [
      scope.locator('button[title*="Aenderungen"],button[title*="Änderungen"],button[aria-label*="Aenderungen"],button[aria-label*="Änderungen"]').first(),
      scope.getByRole('button', { name: /^Bearbeiten$|^Edit$/i }).first()
    ]) {
      if ((await locator.isVisible({ timeout: 700 }).catch(() => false)) && (await locator.isEnabled({ timeout: 700 }).catch(() => false))) {
        await locator.click({ timeout: 3000 });
        await page.waitForTimeout(700);
        return true;
      }
    }
  }
  return false;
}

async function expandVisibleShowMore(page: Page) {
  let clicked = 0;
  for (let pass = 0; pass < 3; pass += 1) {
    let didClick = false;
    for (const scope of [page, ...page.frames()]) {
      const locators = [
        scope.getByRole('button', { name: /^Mehr anzeigen$|^Show more$/i }),
        scope.getByText(/^Mehr anzeigen$|^Show more$/i)
      ];
      for (const locator of locators) {
        const count = await locator.count().catch(() => 0);
        for (let index = 0; index < count; index += 1) {
          const item = locator.nth(index);
          if (!(await item.isVisible({ timeout: 250 }).catch(() => false))) continue;
          const box = await item.boundingBox().catch(() => null);
          if (!box || box.y < 180) continue;
          await item.click({ timeout: 1500 }).catch(() => undefined);
          await page.waitForTimeout(350);
          didClick = true;
          clicked += 1;
        }
      }
    }
    if (!didClick) break;
  }
  return clicked;
}

async function scrollToCaption(page: Page, target: FieldTarget) {
  for (const caption of target.captions) {
    for (const scope of [page, ...page.frames()]) {
      const locator = scope.getByText(new RegExp(caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first();
      if (await locator.isVisible({ timeout: 600 }).catch(() => false)) {
        await locator.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => undefined);
        await locator.hover({ timeout: 1500 }).catch(() => undefined);
        await page.waitForTimeout(500);
        return caption;
      }
    }
  }
  await page.mouse.wheel(0, 750);
  await page.waitForTimeout(350);
  return null;
}

async function collectCandidates(page: Page, target: FieldTarget): Promise<Candidate[]> {
  const all: Candidate[] = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    all.push(...(await collectCandidatesInScope(frame, frameIndex, target)));
  }
  all.push(...(await collectCandidatesInScope(page, -1, target)));
  const seen = new Set<string>();
  return all.filter((candidate) => {
    const key = `${candidate.frameIndex}:${candidate.caption}:${candidate.labelText}:${candidate.labelRect.x}:${candidate.labelRect.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function collectCandidatesInScope(scope: Frame | Page, frameIndex: number, target: FieldTarget): Promise<Candidate[]> {
  return scope
    .evaluate(
      ({ captions, frameIndexValue }) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        };
        const matches = (value: string, caption: string) => value.toLowerCase().includes(caption.toLowerCase());
        const controlSelector = 'input,textarea,select,[role="textbox"],[role="combobox"],[contenteditable="true"],button,a,[role="button"]';
        const controls = Array.from(document.querySelectorAll<HTMLElement>(controlSelector))
          .filter(visible)
          .map((element) => {
            const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            const info = {
              tag: element.tagName,
              role: normalize(element.getAttribute('role')),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              value: normalize('value' in input ? input.value : ''),
              text: normalize(element.innerText || element.textContent).slice(0, 180),
              readOnly: Boolean('readOnly' in input && input.readOnly) || element.getAttribute('aria-readonly') === 'true',
              disabled: Boolean('disabled' in input && input.disabled) || element.getAttribute('aria-disabled') === 'true',
              rect: rectOf(element)
            };
            return { element, info };
          });
        const elements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(visible);
        const candidates: any[] = [];
        for (const caption of captions) {
          for (const element of elements) {
            const text = normalize(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title'));
            if (!text || text.length > 220 || !matches(text, caption)) continue;
            const labelRect = rectOf(element);
            const centerY = labelRect.y + labelRect.height / 2;
            const nearby = controls
              .filter((control) => {
                const rect = control.info.rect;
                const controlY = rect.y + rect.height / 2;
                return Math.abs(controlY - centerY) <= 40 && rect.x >= labelRect.x - 5;
              })
              .map((control) => control.info)
              .sort((a, b) => a.rect.x - b.rect.x);
            const nearbyText = elements
              .filter((candidate) => {
                const rect = rectOf(candidate);
                const y = rect.y + rect.height / 2;
                return Math.abs(y - centerY) <= 60 && rect.x >= labelRect.x - 20;
              })
              .map((candidate) => normalize(candidate.innerText || candidate.textContent || ''))
              .filter(Boolean)
              .slice(0, 16);
            candidates.push({
              frameIndex: frameIndexValue,
              caption,
              labelText: text,
              labelRect,
              nearbyControls: nearby.filter((control) => !['BUTTON', 'A'].includes(control.tag)).slice(0, 8),
              nearbyButtons: nearby.filter((control) => ['BUTTON', 'A'].includes(control.tag) || /button/i.test(control.role)).slice(0, 8),
              nearbyText,
              tooltipText: normalize(element.getAttribute('title') || element.getAttribute('aria-label') || ''),
              status: nearby.some((control) => !['BUTTON', 'A'].includes(control.tag)) ? 'visible-with-control' : 'visible-no-control'
            });
          }
        }
        return candidates;
      },
      { captions: target.captions, frameIndexValue: frameIndex }
    )
    .catch(() => [] as Candidate[]);
}

async function captureSetupDiscovery(page: Page, setup: SetupArea, discoveries: Discovery[]) {
  const compact = await compactPageText(page, {
    include: [
      setup.titlePattern,
      /Nummernserie|Nummerierung|Numbering|Number Series|Debitor|Kreditor|Artikel|Customer|Vendor|Item|Order|Bestell|Auftrag|U-/i
    ],
    maxLines: 260,
    maxLineLength: 240
  });
  await writeText(`target-017b-${setup.id}-text.txt`, compact);
  await writeJson(path.join(EVIDENCE_DIR, `target-017b-${setup.id}-discovery.json`), discoveries);
  await screenshotWithMetadata(page, `target-017b-${setup.id}-field-discovery.png`, {
    page: setup.title,
    pageId: setup.pageId,
    step: 'Field discovery for blocked number-series setup fields.',
    visibleLearning: 'Die Seite wird fuer Nummernserien-Feldsuche verwendet; sichtbare Labels reichen nicht, wenn kein zugeordnetes Eingabe-/Lookupfeld sichtbar ist.',
    importantUi: setup.targets.map((target) => `${target.fieldIntent} -> ${target.numberSeries}`),
    internallyProves: ['Setup page opened in playthru / UNIVERSAARL-DE.', 'Field labels, nearby controls and text snapshots were captured.'],
    doesNotProve: ['Number-series assignment for blocked fields.', 'Master data creation.', 'Preview posting.', 'Posting.'],
    discoveries
  });
}

async function runDiscoveryForSetup(page: Page, setup: SetupArea): Promise<Discovery[]> {
  await openSetupPage(page, setup);
  const editModeClicked = await clickEditModeIfVisible(page);
  const showMoreClicks = await expandVisibleShowMore(page);
  const discoveries: Discovery[] = [];
  for (const target of setup.targets) {
    await scrollToCaption(page, target);
    const candidates = await collectCandidates(page, target);
    const fieldRoutes = candidates.filter((candidate) => candidate.status === 'visible-with-control');
    const status =
      fieldRoutes.length > 0 ? 'field-route-found' : candidates.length > 0 ? 'field-visible-no-control' : 'field-not-visible';
    discoveries.push({
      setupArea: setup.id,
      pageId: setup.pageId,
      fieldIntent: target.fieldIntent,
      numberSeries: target.numberSeries,
      candidates,
      status,
      reason:
        status === 'field-route-found'
          ? `Found ${fieldRoutes.length} visible label/control route(s) after editModeClicked=${editModeClicked}, showMoreClicks=${showMoreClicks}.`
          : status === 'field-visible-no-control'
            ? `Label is visible, but no same-row input/lookup control was found after editModeClicked=${editModeClicked}, showMoreClicks=${showMoreClicks}.`
            : `No visible label found after editModeClicked=${editModeClicked}, showMoreClicks=${showMoreClicks}.`
    });
  }
  await captureSetupDiscovery(page, setup, discoveries);
  return discoveries;
}

test('TARGET-017B discovers blocked setup number-series fields without assigning values', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const allDiscoveries: Discovery[] = [];
  const blockedBy: string[] = [];
  for (const setup of setupAreas) {
    try {
      allDiscoveries.push(...(await runDiscoveryForSetup(page, setup)));
    } catch (error) {
      blockedBy.push(`${setup.id}: ${String(error)}`);
    }
  }

  const routesFound = allDiscoveries.filter((discovery) => discovery.status === 'field-route-found');
  const visibleNoControl = allDiscoveries.filter((discovery) => discovery.status === 'field-visible-no-control');
  const notVisible = allDiscoveries.filter((discovery) => discovery.status === 'field-not-visible');
  const resultStatus = blockedBy.length > 0 ? 'blocked' : routesFound.length > 0 ? 'observed' : 'blocked';
  const selectedNextCase =
    routesFound.length === allDiscoveries.length
      ? 'TARGET-017C-NUMBER-SERIES-REMAINING-SETUP-ASSIGNMENT'
      : 'TARGET-019-POSTING-GROUPS-PREFLIGHT-OR-NUMBERING-PARK-DECISION';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-number-series-setup-field-discovery',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    proved: [
      'Sales/Purchase/Inventory setup pages were opened only in playthru / UNIVERSAARL-DE.',
      ...routesFound.map((discovery) => `${discovery.setupArea}: ${discovery.fieldIntent} has visible field/control route candidates.`),
      ...visibleNoControl.map((discovery) => `${discovery.setupArea}: ${discovery.fieldIntent} label is visible but no same-row input/lookup control was found.`),
      ...notVisible.map((discovery) => `${discovery.setupArea}: ${discovery.fieldIntent} label was not visible after layout expansion attempt.`),
      'No values were assigned in TARGET-017B.',
      'No master data, document draft, preview posting or posting was executed.'
    ],
    notProved: [
      'TARGET-017B does not assign U-CUST, U-PO or U-ITEM.',
      'Legal German invoice numbering compliance is not proven.',
      'Posting groups, VAT, dimensions, master data and posting readiness are still open.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-017b-number-series-setup-field-discovery/TARGET-017B-result.json',
      'playwright/projects/fibu-book5/evidence/target-017b-number-series-setup-field-discovery/*.json',
      'playwright/projects/fibu-book5/evidence/target-017b-number-series-setup-field-discovery/*.txt',
      'playwright/projects/fibu-book5/img/target-017b-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-017b-number-series-setup-field-discovery/TARGET-017B-result.json',
      ...setupAreas.map((setup) => `playwright/projects/fibu-book5/img/target-017b-${setup.id}-field-discovery.png`)
    ],
    discoveries: allDiscoveries,
    blockedBy: [
      ...blockedBy,
      ...allDiscoveries
        .filter((discovery) => discovery.status !== 'field-route-found')
        .map((discovery) => `${discovery.setupArea}/${discovery.fieldIntent}: ${discovery.reason}`)
    ],
    warnings: [
      'TARGET-017B is discovery-only; it does not assign values.',
      'A visible label without a same-row input/lookup is not enough for setup assignment.',
      'If all three routes become visible, use a separate assignment case with before/after/reopen proof.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true,
      noNumberSeriesLineCheckboxChange: true,
      setupChanged: false,
      fieldDiscoveryOnly: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-017B-NUMBER-SERIES-SETUP-FIELD-DISCOVERY',
      lastEvidenceSummary: 'TARGET-017 assigned/proved U-SO, U-SINV, U-VEND and U-PINV, but blocked U-CUST, U-PO and U-ITEM.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Blocked fields need UI discovery before any master data or blind setup write.',
      lookaheadReviewed: [
        {
          caseId: selectedNextCase,
          status: routesFound.length === allDiscoveries.length ? 'ready-next' : 'replace-with-better-case',
          reason:
            routesFound.length === allDiscoveries.length
              ? 'All missing field routes are visible enough for a separate assignment gate.'
              : 'Remaining numbering setup may be parked if fields are not assignable through the current card UI.'
        },
        {
          caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Posting groups are independent enough to inspect if remaining numbering fields are parked with a documented limit.'
        },
        {
          caseId: 'TARGET-020-VAT-SETUP-READINESS',
          status: 'ready-after-current',
          reason: 'VAT setup follows posting group preflight before documents.'
        },
        {
          caseId: 'TARGET-021-DIMENSIONS-FOUNDATION',
          status: 'ready-after-current',
          reason: 'Dimensions can proceed after numbering/posting setup sequencing is clear.'
        },
        {
          caseId: 'TARGET-022-CORE-MASTERDATA-PLAN',
          status: 'needs-setup-first',
          reason: 'Master data waits for numbering, posting groups, VAT and dimensions.'
        }
      ],
      queueChangesMade: [`Selected ${selectedNextCase} based on TARGET-017B field discovery.`],
      selectedNextCase,
      whySelectedNextCaseIsBest:
        routesFound.length === allDiscoveries.length
          ? 'The remaining setup field routes are visible and can be assigned in a guarded follow-up.'
          : 'The remaining fields are not all writable through the current UI route; the project should either park them explicitly or continue with posting-group preflight.',
      risksBeforeNextCase: [
        'Do not create customers/vendors/items until numbering gaps are consciously resolved or parked.',
        'Do not treat visible labels as assigned values.',
        'Do not claim legal numbering compliance.'
      ],
      requiredPreparation: ['Review TARGET-017B screenshots and discovery JSON before any assignment follow-up.']
    },
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: {},
    reason:
      resultStatus === 'observed'
        ? 'TARGET-017B discovered at least one missing field route without changing setup values.'
        : 'TARGET-017B did not find enough missing setup field routes to assign values safely.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-017B Number Series Setup Field Discovery',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Gefundene Routen',
      '',
      ...routesFound.map((discovery) => `- ${discovery.setupArea}: ${discovery.fieldIntent} -> ${discovery.numberSeries}`),
      ...(routesFound.length === 0 ? ['- Keine vollstaendige Feld-/Control-Route gefunden.'] : []),
      '',
      '## Grenzen',
      '',
      '- Keine neuen Nummernserienwerte zugewiesen.',
      '- Keine Stammdaten.',
      '- Kein Belegentwurf.',
      '- Keine Preview und keine Buchung.',
      '- Keine Checkbox-Aenderung an Nummernserienzeilen.',
      '- Keine rechtliche Aussage zur deutschen Rechnungsnummern-Compliance.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.setupChanged).toBe(false);
});
