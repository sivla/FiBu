import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { createBcStepTimeline } from '../../../core/bc/step-timeline';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(240_000);
test.skip(
  process.env.MASTER_DATA_FIELD_MAP_READFIRST_VALIDATION_LIVE_APPROVED !== '1' ||
    process.env.MASTER_DATA_FIELD_MAP_READFIRST_VALIDATION_RUNNER_GUARD_CHECKED !== '1',
  'MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION must run through the guarded runner with --live-approved.'
);

const CASE_ID = 'MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'master-data-field-map-readfirst-validation';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

const SURFACES = [
  {
    id: 'customers',
    pageId: 22,
    label: 'Debitoren / Customers',
    expected: [/Debitor|Customer|Kunde/i, /Nr\.|No\.|Name/i],
    fieldSignals: [
      /Debitorenbuchungsgruppe|Customer Posting Group|Buchungsgruppe|Posting Group/i,
      /USt|VAT|MwSt/i,
      /Zahlungsbedingung|Payment Terms/i,
      /Vorlage|Template/i
    ]
  },
  {
    id: 'vendors',
    pageId: 27,
    label: 'Kreditoren / Vendors',
    expected: [/Kreditor|Vendor|Lieferant/i, /Nr\.|No\.|Name/i],
    fieldSignals: [
      /Kreditorenbuchungsgruppe|Vendor Posting Group|Buchungsgruppe|Posting Group/i,
      /USt|VAT|MwSt/i,
      /Zahlungsbedingung|Payment Terms|Zahlungsart|Payment Method/i,
      /Bank|IBAN|SWIFT|BIC/i,
      /Vorlage|Template/i
    ]
  },
  {
    id: 'items-services',
    pageId: 31,
    label: 'Artikel und Services / Items and Services',
    expected: [/Artikel|Item|Service|Dienstleistung/i, /Nr\.|No\.|Beschreibung|Description|Typ|Type/i],
    fieldSignals: [
      /Basiseinheit|Base Unit|Einheit|Unit of Measure/i,
      /Produktbuchungsgruppe|Product Posting Group|Posting Group/i,
      /USt|VAT|MwSt/i,
      /Lagerbuchungsgruppe|Inventory Posting Group|Inventory|Lager/i,
      /Kalkulationsmethode|Costing Method|Kosten|Cost/i,
      /Vorlage|Template/i
    ]
  }
] as const;

function buildTargetUrl(pageId: number) {
  const url = new URL(process.env.MASTER_DATA_FIELD_MAP_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) throw new Error('Business Central URL must include a tenant/environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/i,
    '/{tenant}'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|upn:/i.test(line))
    .join('\n')
    .trim();
}

function isTargetContext(rawUrl: string) {
  const url = new URL(rawUrl);
  return (
    url.pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE) &&
    (url.searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY
  );
}

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`);
}

async function compactSurfaceText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Debitor|Customer|Kunde|Kreditor|Vendor|Lieferant|Artikel|Item|Service|Nr\.|No\.|Name|Beschreibung|Description|Typ|Type|Vorlage|Template|Buchungsgruppe|Posting Group|Zahlungsbedingung|Payment Terms|USt|MwSt|VAT|Einheit|Unit|Lager|Inventory|Kosten|Cost|Neu|New|Bearbeiten|Edit/i
      ],
      maxLines: 180,
      maxLineLength: 240
    }).catch(() => '')
  );
}

async function collectVisibleActionHints(page: Page) {
  const actions = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const interesting = /Neu|New|Bearbeiten|Edit|Vorlage|Template|Excel|Suchen|Search|Filter|Filtern|Buchen|Post|Preview|Vorschau/i;
        return [...document.querySelectorAll<HTMLElement>('[role="button"],[role="menuitem"],button,a,span,div')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (!interesting.test(text) || text.length > 160 || rect.width <= 1 || rect.height <= 1) return null;
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter(Boolean)
          .slice(0, 120);
      })
      .catch(() => []);
    actions.push(...(entries as Array<Record<string, unknown>>));
  }
  return actions.slice(0, 180);
}

test(`${CASE_ID} validates Master Data field-map surfaces read-first`, async ({ page }) => {
  await fs.rm(EVIDENCE_DIR, { recursive: true, force: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const stepTimeline = createBcStepTimeline({
    project: PROJECT,
    evidenceId: EVIDENCE_ID,
    caseId: CASE_ID,
    evidenceDir: EVIDENCE_DIR,
    evidenceDirRelative: EVIDENCE_DIR_REL
  });

  const surfaceResults: Array<Record<string, unknown>> = [];
  const screenshots: string[] = [];
  const visualStatePaths: string[] = [];
  const allActionHints: Record<string, unknown> = {};

  for (const surface of SURFACES) {
    let text = '';
    await stepTimeline.step(page, {
      stepId: `010-open-${surface.id}`,
      action: `Open ${surface.label} read-first`,
      claim: `${surface.label} must be visible as a real Business Central surface in playthru / UNIVERSAARL-DE before any write gate.`,
      expectedPageText: [...surface.expected],
      run: async () => {
        await page.goto(buildTargetUrl(surface.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
        await waitForBusinessCentralShell(page);
        await dismissTours(page);
        text = (await compactSurfaceText(page)) || (await fullText(page));
      },
      verdict: (_before, after) =>
        ['side-pane-open', 'list-page-open', 'target-page-open', 'card-page-open'].includes(after.classification) ? 'proven' : 'not-proven',
      stopReason: (_before, after) =>
        after.classification === 'search-overlay-open'
          ? 'Search/Tell-Me overlay remained open after direct page navigation.'
          : after.classification === 'role-center-background'
            ? 'Only Role Center background was visible after direct page navigation.'
            : null
    });

    const actionHints = await collectVisibleActionHints(page);
    allActionHints[surface.id] = actionHints;
    const signalMatches = surface.fieldSignals.filter((signal) => signal.test(text)).map((signal) => signal.source);
    const expectedMatches = surface.expected.filter((signal) => signal.test(text)).map((signal) => signal.source);
    const visibleEnough = isTargetContext(page.url()) && expectedMatches.length >= 2;
    const textFile = `${surface.id}-visible-text.txt`;
    await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), text || 'No compact surface text captured.');

    const afterEntry = stepTimeline.timeline.entries.at(-1);
    if (afterEntry) {
      screenshots.push(afterEntry.afterScreenshot);
      visualStatePaths.push(afterEntry.afterVisualState);
    }

    surfaceResults.push({
      id: surface.id,
      page: surface.label,
      pageId: surface.pageId,
      sanitizedUrl: sanitizeUrl(page.url()),
      visibleEnough,
      expectedMatches,
      fieldSignalMatches: signalMatches,
      actionHintsCount: actionHints.length,
      textPath: `${EVIDENCE_DIR_REL}/${textFile}`,
      decision:
        visibleEnough && signalMatches.length > 0
          ? 'surface-valid-for-training-and-route-planning'
          : visibleEnough
            ? 'surface-visible-but-field-signals-incomplete'
            : 'surface-not-proven',
      notWritePermission: true
    });
  }

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'visible-action-hints.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    actionsWereClicked: false,
    actionHints: allActionHints
  });

  stepTimeline.timeline.businessCentralOpened = true;
  stepTimeline.timeline.playwrightLiveRunExecuted = true;
  stepTimeline.timeline.liveActionsExecuted = false;
  const stepTimelinePath = await stepTimeline.write();

  const provenSurfaces = surfaceResults.filter((surface) => surface.visibleEnough === true).map((surface) => String(surface.id));
  const fieldSignalSurfaceCount = surfaceResults.filter((surface) => (surface.fieldSignalMatches as string[]).length > 0).length;
  const routeDecision =
    provenSurfaces.length === SURFACES.length && fieldSignalSurfaceCount >= 2
      ? 'ready-for-local-write-gate-decision-not-write'
      : 'needs-template-or-foundation-follow-up-before-write-gate';
  const nextCase =
    routeDecision === 'ready-for-local-write-gate-decision-not-write'
      ? 'MASTER-DATA-TEMPLATE-ROUTE-DECISION'
      : 'FOUNDATION-SETUP-SOURCE-GAP-DECISION';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readfirst-master-data-field-map-validation',
    resultStatus: provenSurfaces.length === SURFACES.length ? 'observed-readfirst' : 'blocked-readfirst',
    decision: routeDecision,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    liveActionsExecuted: false,
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    companySwitch: false,
    recordsCreated: false,
    recordsEdited: false,
    templatesChanged: false,
    surfaceResults,
    screenshots,
    visualStatePaths,
    stepTimeline: stepTimelinePath,
    visibleActionHintsPath: `${EVIDENCE_DIR_REL}/visible-action-hints.json`,
    actionsTaken: [
      'Opened Customers read-first in playthru / UNIVERSAARL-DE.',
      'Opened Vendors read-first in playthru / UNIVERSAARL-DE.',
      'Opened Items/Services read-first in playthru / UNIVERSAARL-DE.',
      'Captured before/after screenshots and visual-state JSON through the step timeline.',
      'Captured visible action hints without clicking New, Edit, templates, Save, OK, Create, Preview or Post.'
    ],
    actionsNotTaken: [
      'No customer, vendor, item or service was created.',
      'No existing master data was edited.',
      'No values were typed.',
      'No template dialog was opened or changed.',
      'No setup field was changed.',
      'No document or draft was created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No company switch.',
      'No book edit.'
    ],
    proved:
      provenSurfaces.length === SURFACES.length
        ? [
            'Customers, Vendors and Items/Services were opened as real Business Central read-first surfaces in playthru / UNIVERSAARL-DE.',
            'Step Timeline captured before/after screenshots and visual-state JSON for each surface.',
            'The run did not click write-capable actions and did not change setup or master data.'
          ]
        : [
            'The run stayed no-write and captured diagnostic evidence for the attempted Master Data surfaces.'
          ],
    notProved: [
      'No master-data write gate is approved by this run.',
      'No customer/vendor/item template route is proven safe.',
      'No posting group, VAT, payment, UOM, inventory, O2C, P2P, Preview Posting or Posting readiness is proven.',
      'No UAT acceptance is proven.'
    ],
    blockedBy:
      provenSurfaces.length === SURFACES.length
        ? []
        : surfaceResults.filter((surface) => surface.visibleEnough !== true).map((surface) => `${surface.id}-surface-not-proven`),
    warnings: [
      'Visible New/Edit/template/action text is action inventory only and was not clicked.',
      'Visible fields are not proof of setup correctness or safe persistence.',
      'A later write gate must still isolate descriptive fields from posting, VAT, payment and inventory dependencies.'
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'The local Master Data field map needed validation against real Business Central surfaces before any write gate.',
      isPlannedNextCaseStillSensible: provenSurfaces.length === SURFACES.length,
      reason:
        provenSurfaces.length === SURFACES.length
          ? 'All three master-data surfaces were visible read-first; the output can now feed a local template/write-gate decision.'
          : 'At least one master-data surface was not visible enough for the field-map validation.',
      lookaheadReviewed: [
        {
          caseId: 'MASTER-DATA-TEMPLATE-ROUTE-DECISION',
          status: provenSurfaces.length === SURFACES.length ? 'ready-next' : 'blocked',
          reason: 'Templates and mandatory markers should be decided locally before any record write.'
        },
        {
          caseId: 'CUSTOMER-U-CUST-100-FIELD-COMPLETION-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Customer descriptive writes may only follow a local template/write-gate decision and still cannot imply O2C readiness.'
        },
        {
          caseId: 'FOUNDATION-SETUP-SOURCE-GAP-DECISION',
          status: routeDecision === 'needs-template-or-foundation-follow-up-before-write-gate' ? 'ready-next' : 'ready-after-current',
          reason: 'Use if master-data field validation shows foundation dependencies still block safe write gates.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        routeDecision === 'ready-for-local-write-gate-decision-not-write'
          ? 'A local template route decision is the right bridge before any narrow write-gate.'
          : 'Foundation or template gaps must be classified before attempting a write gate.',
      risksBeforeNextCase: [
        'Treating visible fields as setup correctness would create false readiness.',
        'Opening template/create dialogs without a cancel-safe plan could create records or change templates.'
      ],
      requiredPreparation: [
        'Review visual-state JSON and action hints.',
        'Keep posting, VAT, payment, UOM and inventory fields outside any first narrow write gate.',
        'Require a separate Smart Decision before any write.'
      ]
    },
    safeToFinalizeState: false,
    requiresReview: false,
    nextCase
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      `# ${CASE_ID}`,
      '',
      'Dieser Lauf validiert die Master-Data-Feldkarte lesend gegen echte Business-Central-Oberflaechen.',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      `Entscheidung: ${routeDecision}`,
      '',
      'Nicht enthalten: keine Stammdatenanlage, keine Vorlagenaenderung, keine Setup-Aenderung, kein Beleg, keine Buchungsvorschau, keine Buchung.',
      '',
      'Evidence:',
      `- ${EVIDENCE_DIR_REL}/result.json`,
      `- ${stepTimelinePath}`,
      `- ${EVIDENCE_DIR_REL}/visible-action-hints.json`,
      ''
    ].join('\n')
  );

  expect(provenSurfaces.length, 'Customers, Vendors and Items/Services must all be visible enough for this read-first validation.').toBe(SURFACES.length);
});
