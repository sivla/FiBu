import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(180_000);
test.skip(
  process.env.PWS_MD_004_LIVE_APPROVED !== '1' || process.env.PWS_MD_004_RUNNER_GUARD_CHECKED !== '1',
  'PWS-MD-004 must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'PWS-MD-004-CUSTOMER-CARD-TEMPLATE-REQUIRED-FIELDS-PREFLIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'pws-md-004-customer-card-template-required-fields-preflight';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

type ActionCandidate = {
  scope: string;
  text: string;
  ariaLabel: string;
  title: string;
  role: string;
  ariaHaspopup: string;
  ariaExpanded: string;
  disabled: boolean;
};

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

function targetInstanceUrl() {
  const url = new URL(process.env.PWS_MD_004_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before PWS-MD-004 can build a page URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  if (!url.pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE)) {
    throw new Error('PWS-MD-004 target URL must resolve to playthru before navigation.');
  }
  if ((url.searchParams.get('company') ?? '').toUpperCase() !== TARGET_COMPANY) {
    throw new Error('PWS-MD-004 target URL must resolve to UNIVERSAARL-DE before navigation.');
  }
  return url;
}

function buildTargetUrl(pageId: number) {
  const url = targetInstanceUrl();
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function customerListSignalCount(text: string) {
  return [/Debitor|Customer|Kunde/i, /Nr\.|No\.|Name/i].filter((signal) => signal.test(text)).length;
}

function unsafeActionWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu may be visible but was not clicked as a write route.' : '',
    /Edit|Bearbeiten|Liste bearbeiten/i.test(text) ? 'Edit/List Edit may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text) ? 'Posting/Preview text may be visible but was not clicked.' : '',
    /Template|Vorlage/i.test(text) ? 'Template text may be visible but no template was selected or changed.' : ''
  ].filter(Boolean);
}

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`);
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = evidencePath(PROJECT, EVIDENCE_ID, fileName);
  const metadataPath = evidencePath(PROJECT, EVIDENCE_ID, fileName.replace(/\.png$/i, '.screenshot.json'));
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
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

async function captureReadOnlyCheckpoint(
  page: Page,
  fileName: string,
  metadata: Record<string, unknown>,
  captures: Capture[]
) {
  const shot = await screenshotWithMetadata(page, fileName, metadata);
  captures.push(shot);
  return shot;
}

async function clickFirstVisible(page: Page, label: RegExp) {
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const candidates: Array<{ name: string; locator: Locator }> = [
      { name: 'role-link', locator: scope.getByRole('link', { name: label }).first() },
      { name: 'role-button', locator: scope.getByRole('button', { name: label }).first() },
      { name: 'anchor-text', locator: scope.locator('a').filter({ hasText: label }).first() },
      { name: 'visible-text', locator: scope.getByText(label).first() }
    ];
    for (const candidate of candidates) {
      if (await candidate.locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        await candidate.locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
        await candidate.locator.click({ timeout: 5000 });
        return `${candidate.name}-scope-${scopeIndex}`;
      }
    }
  }
  return '';
}

async function hoverNewWithoutClick(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const label of [/^Neu$/i, /^New$/i, /Neu|New/i]) {
      const button = scope.getByRole('button', { name: label }).first();
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        await button.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
        await button.hover({ timeout: 3000 }).catch(() => undefined);
        return label.source;
      }
    }
  }
  return '';
}

async function collectNewActionCandidates(page: Page): Promise<ActionCandidate[]> {
  const candidates: ActionCandidate[] = [];
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const found = await scope.locator('button, [role="button"], a').evaluateAll((elements) =>
      elements
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const text = (htmlElement.innerText || htmlElement.textContent || '').trim();
          const ariaLabel = htmlElement.getAttribute('aria-label') || '';
          const title = htmlElement.getAttribute('title') || '';
          const role = htmlElement.getAttribute('role') || htmlElement.tagName.toLowerCase();
          const ariaHaspopup = htmlElement.getAttribute('aria-haspopup') || '';
          const ariaExpanded = htmlElement.getAttribute('aria-expanded') || '';
          const disabled = Boolean((htmlElement as HTMLButtonElement).disabled || htmlElement.getAttribute('aria-disabled') === 'true');
          return { text, ariaLabel, title, role, ariaHaspopup, ariaExpanded, disabled };
        })
        .filter((item) => /Neu|New|Vorlage|Template|Create|Anlegen/i.test(`${item.text} ${item.ariaLabel} ${item.title}`))
        .slice(0, 30)
    );
    for (const item of found) {
      candidates.push({ scope: `scope-${scopeIndex}`, ...item });
    }
  }
  return candidates;
}

async function tryOpenOnlyExplicitMoreOptions(page: Page) {
  const candidates = await collectNewActionCandidates(page);
  const safeSeparateDropdown = candidates.find(
    (candidate) =>
      /Neu|New/i.test(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`) &&
      /menu|listbox|true/i.test(candidate.ariaHaspopup) &&
      !/^\s*(Neu|New)\s*$/i.test(candidate.text)
  );
  return {
    opened: false,
    reason: safeSeparateDropdown
      ? 'A possible New/Neu dropdown-like candidate was visible, but it was not clicked because it was not visually separated enough from the create action.'
      : 'No explicit safe and visually separated New/Neu dropdown was visible. The run used hover and metadata only.',
    safeSeparateDropdown: safeSeparateDropdown ?? null
  };
}

test('PWS-MD-004 inspects customer New/template/required-field preflight without saving', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];

  await page.goto(buildTargetUrl(22), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);

  const rawTextAfterOpen = await fullText(page);
  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004-010-customer-list-context.png',
    {
      page: 'Debitoren / Customers',
      pageId: 22,
      step: 'Customer list context before any New/Neu inspection',
      importantUi: ['Page title', 'company context', 'customer list or empty-list state', 'visible toolbar'],
      visibleSignals: rawTextAfterOpen.split('\n').slice(0, 50),
      internallyProves: 'Business Central reached the customer surface before any write-capable action was inspected.',
      doesNotProve: ['No customer card opened', 'No customer template selected', 'No customer saved'],
      finalScreenshotStatus: 'draft-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  let rawTextAfterRoute = rawTextAfterOpen;
  let customerRouteUsed = '';
  if (customerListSignalCount(rawTextAfterOpen) < 2) {
    customerRouteUsed = await clickFirstVisible(page, /^Debitoren$|^Customers$|^Kunden$/i);
    if (customerRouteUsed) {
      await waitForBusinessCentralShell(page);
      await dismissTours(page);
      await expect.poll(async () => customerListSignalCount(await fullText(page)), { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
      rawTextAfterRoute = await fullText(page);
      await captureReadOnlyCheckpoint(
        page,
        'pws-md-004-015-customer-route-context.png',
        {
          page: 'Debitoren / Customers',
          pageId: 22,
          step: 'Role Center customer link route',
          routeUsed: customerRouteUsed,
          importantUi: ['visible Debitoren/Customers route', 'customer list after route'],
          visibleSignals: rawTextAfterRoute.split('\n').slice(0, 50),
          internallyProves: 'The customer list was reached through visible user navigation without opening New/Neu.',
          doesNotProve: ['No customer card opened', 'No customer template selected', 'No customer saved'],
          finalScreenshotStatus: 'draft-candidate',
          noWrite: true,
          noPost: true,
          noPreview: true
        },
        captures
      );
    }
  }

  const hoveredNew = await hoverNewWithoutClick(page);
  await page.waitForTimeout(900);
  const actionCandidates = await collectNewActionCandidates(page);
  const rawTextAfterHover = await fullText(page);
  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004-020-new-hover-or-tooltip-context.png',
    {
      page: 'Debitoren / Customers',
      pageId: 22,
      step: 'New/Neu hover and tooltip/attribute context without clicking New',
      hoveredNew: hoveredNew || 'no New/Neu button visible enough to hover',
      actionCandidates,
      importantUi: ['New/Neu button', 'tooltip if Business Central exposes one', 'button attributes used to avoid blind clicking'],
      visibleSignals: rawTextAfterHover.split('\n').slice(0, 60),
      internallyProves: 'The run inspected the New/Neu surface without triggering record creation.',
      doesNotProve: ['No dropdown item was selected', 'No template dialog accepted', 'No customer card saved'],
      finalScreenshotStatus: 'draft-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  const safeMenuAttempt = await tryOpenOnlyExplicitMoreOptions(page);
  const rawTextAfterMenuAttempt = await fullText(page);
  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004-030-menu-boundary-context.png',
    {
      page: 'Debitoren / Customers',
      pageId: 22,
      step: 'Safe menu/dropdown boundary check',
      safeMenuAttempt,
      importantUi: ['More/Weitere Optionen menu if visible', 'New/Neu boundary', 'no selection of create/template actions'],
      visibleSignals: rawTextAfterMenuAttempt.split('\n').slice(0, 70),
      internallyProves: safeMenuAttempt.opened
        ? 'An explicit options menu was opened without selecting a create/template action.'
        : 'No explicit safe options menu was available; the run did not click the New/Neu create action.',
      doesNotProve: ['No customer template list completeness', 'No customer card required-field completeness', 'No customer creation route approval'],
      finalScreenshotStatus: safeMenuAttempt.opened ? 'draft-candidate' : 'boundary-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );
  await page.keyboard.press('Escape').catch(() => undefined);

  const compact = clean(
    await compactPageText(page, {
      include: [
        /Debitor|Customer|Kunde|Nr\.|No\.|Name|Vorlage|Template|Buchungsgruppe|Posting Group|Zahlungsbedingung|Payment Terms|MwSt|VAT|Neu|New|Bearbeiten|Edit|Pflicht|Required/i
      ],
      maxLines: 160,
      maxLineLength: 240
    }).catch(() => '')
  );
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(900);
  const rawTextAfterInspection = await fullText(page);
  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004-040-page-inspection-context.png',
    {
      page: 'Debitoren / Customers',
      pageId: 22,
      step: 'Page Inspection technical field context',
      importantUi: ['Page Inspection pane', 'page id/name', 'table/source context', 'field names if visible'],
      visibleSignals: rawTextAfterInspection.split('\n').slice(0, 80),
      internallyProves: /Business Manager Role Center/i.test(rawTextAfterInspection)
        ? 'Page Inspection opened, but it described the Role Center shell rather than the customer table. This is useful as a UI boundary, not as customer-field proof.'
        : 'The run attempted a technical field-context check for reproducibility and required-field planning.',
      doesNotProve: [
        'No full card validation',
        'No mandatory-field enforcement',
        /Business Manager Role Center/i.test(rawTextAfterInspection)
          ? 'No accepted Customer table/Page Inspection proof from this screenshot.'
          : 'No API or AL shortcut'
      ],
      finalScreenshotStatus: 'draft-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );
  await page.keyboard.press('Escape').catch(() => undefined);

  const rawText = clean(`${rawTextAfterOpen}\n${rawTextAfterRoute}\n${rawTextAfterHover}\n${rawTextAfterMenuAttempt}\n${rawTextAfterInspection}`);
  const text = compact || rawText;
  const textFile = 'pws-md-004-010-customer-preflight-context.txt';
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), text || 'No compact page text captured.');

  const customerSignals = customerListSignalCount(rawText);
  const hasNewSurface = actionCandidates.some((candidate) => /Neu|New|Vorlage|Template/i.test(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`));
  const hasFieldSignals = /No\.|Nr\.|Name|Customer Posting Group|Debitorenbuchungsgruppe|Payment Terms|Zahlungsbedingung/i.test(rawText);
  const existingUniversaarlCustomer = /U-CUST-100|Universaarl Kunde 100/i.test(rawText);
  const pageInspectionCustomerAccepted =
    /Customer \(18\)|Customer List|Debitorenliste|Table.*Customer|Tabelle.*Debitor/i.test(rawTextAfterInspection) &&
    !/Business Manager Role Center/i.test(rawTextAfterInspection);
  const status = customerSignals >= 2 && captures.length >= 4 ? 'observed-prewrite-boundary' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-master-data-preflight',
    resultStatus: status,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Debitoren / Customers',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken: [
      'Opened the customer context page through the guarded runner.',
      'Captured customer list, New/Neu hover or tooltip context, menu-boundary context and Page Inspection context.',
      'Collected New/Neu/template action attributes without selecting create/template actions.',
      'Kept the run read-first and no-save.'
    ],
    actionsNotTaken: [
      'No New/Neu create action clicked.',
      'No template selected.',
      'No customer card saved.',
      'No values typed.',
      'No customer created.',
      'No customer posting group changed.',
      'No payment terms changed.',
      'No sales document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No API shortcut.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: captures.map((capture) => capture.screenshot),
    screenshotQa: {
      requiredCheckpoints: [
        'customer list context',
        'New/Neu button hover or tooltip context',
        'safe dropdown/menu boundary if available',
        'Page Inspection context'
      ],
      capturedCheckpoints: captures.map((capture) => capture.screenshot),
      acceptedForSurfacePreflight: status === 'observed-prewrite-boundary',
      acceptedForCustomerWriteGate: false,
      pageInspectionCustomerAccepted,
      reason:
        status === 'observed-prewrite-boundary'
          ? pageInspectionCustomerAccepted
            ? 'Mehrere Oberflaechen-Zustaende wurden dokumentiert. Der Lauf versteht die New/Neu-Grenze besser, gibt aber noch keine Anlage frei.'
            : 'Mehrere Oberflaechen-Zustaende wurden dokumentiert. Page Inspection landete jedoch auf dem Role Center und ist deshalb kein Debitoren-Tabellenbeweis.'
          : 'Customer preflight context was not visible enough for the no-save boundary.'
    },
    proved:
      status === 'observed-prewrite-boundary'
        ? [
            'Customer context remains reachable in playthru / UNIVERSAARL-DE.',
            'The New/Neu surface can be inspected without selecting a create/template action.',
            'Multi-checkpoint screenshot QA gives a better UI basis than a single end-state screenshot.',
            existingUniversaarlCustomer
              ? 'Existing customer U-CUST-100 / Universaarl Kunde 100 is visible, so the next step should be reopen/field proof instead of blind duplicate creation.'
              : 'No existing U-CUST-100 signal was captured in the text evidence.'
          ]
        : [],
    notProved: [
      hasNewSurface ? 'New/Neu surface was observed, but no create route was approved.' : 'New/Neu surface was not sufficiently observed.',
      hasFieldSignals
        ? 'Customer list/Page Inspection field signals were observed, but required-field enforcement was not tested.'
        : 'Required-field or card-field signals were not sufficiently visible.',
      pageInspectionCustomerAccepted
        ? 'Customer Page Inspection was visible, but no full card validation was tested.'
        : 'Page Inspection opened on the Role Center shell, not accepted as Customer table proof.',
      'No customer card was saved.',
      'No customer template correctness.',
      'No customer posting group correctness.',
      'No VAT correctness.',
      'No sales process readiness.',
      'No customer creation or reopen proof.'
    ],
    blockedBy:
      status === 'observed-prewrite-boundary'
        ? []
        : ['Customer list, New/Neu or Page Inspection context was not visible enough for the prewrite boundary.'],
    warnings: unsafeActionWarnings(rawText),
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      readOnlyDirectPageRoute: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'PWS-MD-005-CUSTOMER-U-CUST-100-CONTROLLED-CREATE-GATE',
      lastEvidenceSummary:
        'Customer list, New/Neu preflight surface and technical context were inspected without saving or creating a customer.',
      isPlannedNextCaseStillSensible: false,
      reason:
        existingUniversaarlCustomer
          ? 'U-CUST-100 is already visible. A create gate would risk duplicate work; the better next case is reopen/card field proof.'
          : 'A customer write gate still needs an explicit route decision from the preflight screenshots. This run improved UI understanding but intentionally did not approve create/save.',
      lookaheadReviewed: [
        {
          caseId: 'PWS-MD-005-CUSTOMER-U-CUST-100-CONTROLLED-CREATE-GATE',
          status: existingUniversaarlCustomer ? 'obsolete' : 'needs-ui-discovery-first',
          reason: existingUniversaarlCustomer
            ? 'U-CUST-100 already exists visibly; do not create a duplicate customer.'
            : 'Only sensible after a safe card/template route and required-field route are accepted.'
        },
        {
          caseId: 'PWS-MD-004B-CUSTOMER-REOPEN-AND-FIELD-PROOF',
          status: 'ready-next',
          reason: existingUniversaarlCustomer
            ? 'Open existing U-CUST-100 read-only/card-safe and prove key fields, posting groups, payment terms and no-save boundary.'
            : 'Use screenshots from PWS-MD-004 to decide whether a controlled no-save card route or a write gate is next.'
        },
        {
          caseId: 'PWS-MD-VENDOR-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Vendor remains parked behind customer route and payment/bank boundaries.'
        },
        {
          caseId: 'PWS-MD-ITEM-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Item remains parked behind UOM, posting, VAT product, inventory and costing checks.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: 'PWS-MD-004B-CUSTOMER-REOPEN-AND-FIELD-PROOF',
      whySelectedNextCaseIsBest:
        existingUniversaarlCustomer
          ? 'Existing customer evidence should be consumed first; reopening it gives stronger customer-card evidence without duplicate creation.'
          : 'The next step should consume the new screenshots and decide the exact safe create route instead of blindly clicking New/Neu.',
      risksBeforeNextCase: ['Do not treat visible New/Neu as proof that saving a customer is safe.'],
      requiredPreparation: ['Review PWS-MD-004 screenshots and action-candidate metadata.']
    },
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/${textFile}`,
      ...captures.flatMap((capture) => [capture.screenshot, capture.screenshotMetadata]),
      `${EVIDENCE_DIR_REL}/PWS-MD-004-result.json`
    ],
    nextCase: 'PWS-MD-004B-CUSTOMER-REOPEN-AND-FIELD-PROOF',
    requiresReview: false,
    safeToFinalizeState: false
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'PWS-MD-004-result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# PWS-MD-004 Customer Card/Template Required-fields Preflight',
      '',
      'Dieser Lauf ist ein lesender Prewrite-Grenznachweis. Er legt keinen Debitor an und gibt keine Debitorenanlage frei.',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Nicht enthalten',
      '',
      '- Keine Debitorenanlage.',
      '- Keine Vorlagenauswahl.',
      '- Keine Buchungsgruppen- oder Zahlungsbedingungsaenderung.',
      '- Kein Verkaufsbeleg.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine API-Abkuerzung.',
      '',
      '## Evidence-Dateien',
      '',
      ...result.evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(status, 'Customer preflight must capture enough no-save UI context.').toBe('observed-prewrite-boundary');
});
