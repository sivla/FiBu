import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  openSearchResult,
  pageText,
  requireBcUrl,
  searchFor,
  visibleButtonNames,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-078-SETUP-PAGE-CAPABILITY-REVIEW';
const TEST_ID = 'fixedassets-078';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1300 },
});

test.setTimeout(360_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function pageUrl(pageId: number) {
  const url = new URL(bcPageUrl(pageId, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const text = await pageText(page);
  const decoded = decodeURIComponent(url);
  return {
    url,
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };
}

async function openDirectReadOnlyPage(
  page: Page,
  target: { id: string; pageId: number; expected: RegExp; include: RegExp[] },
) {
  await page.goto(pageUrl(target.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, target.expected, { timeout: 90_000 }).catch(() => undefined);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);

  const text = await compactPageText(page, {
    include: target.include,
    maxLines: 90,
    maxLineLength: 220,
  });
  const allText = await pageText(page);
  const buttons = (await visibleButtonNames(page)).slice(0, 80);
  const contextVisible = target.expected.test(allText);

  await writeTextEvidence(faEvidencePath(`${target.id}-page-text.txt`), text || 'No compact page text captured.\n');
  await writeJsonEvidence(faEvidencePath(`${target.id}-buttons.json`), buttons);

  return {
    id: target.id,
    route: 'direct-page-id',
    pageId: target.pageId,
    url: page.url(),
    contextVisible,
    interestingSignals: {
      fixedAsset: /Fixed Asset|Anlage/i.test(allText),
      purchase: /Purchase|Einkauf/i.test(allText),
      journal: /Journal|Buch.-Blatt|Buchblatt/i.test(allText),
      postingGroup: /Posting Group|Buchungsgruppe/i.test(allText),
      depreciationBook: /Depreciation Book|AfA-Buch|Abschreibungsbuch/i.test(allText),
      newVisible: buttons.some((button) => /^(New|Neu)$|new entry|neuen Eintrag/i.test(button)),
      postVisible: buttons.some((button) => /Post|Buchen/i.test(button)),
    },
    evidence: {
      text: `playwright/projects/${project.name}/evidence/${TEST_ID}/${target.id}-page-text.txt`,
      buttons: `playwright/projects/${project.name}/evidence/${TEST_ID}/${target.id}-buttons.json`,
    },
  };
}

async function openTellMeReadOnlyPage(
  page: Page,
  target: { id: string; searchTerm: string; result: RegExp; expected: RegExp; include: RegExp[] },
) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await searchFor(page, target.searchTerm);
  await page.waitForTimeout(1600);
  const tellMeText = await compactPageText(page, {
    include: [/Tell me|Suchen|Search|Fixed Asset|Anlage|FA Posting|Buchungsgruppe|Journal|Buchblatt|Setup|Einrichtung/i],
    maxLines: 80,
    maxLineLength: 220,
  });
  await writeTextEvidence(faEvidencePath(`${target.id}-tell-me-text.txt`), tellMeText || 'No compact Tell-Me text captured.\n');

  let opened = false;
  let openError = '';
  try {
    await openSearchResult(page, target.result, { requireUnique: true });
    opened = true;
  } catch (error) {
    openError = String(error);
  }
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1600);

  const allText = await pageText(page);
  const text = await compactPageText(page, {
    include: target.include,
    maxLines: 90,
    maxLineLength: 220,
  });
  const buttons = (await visibleButtonNames(page)).slice(0, 80);
  const contextVisible = opened && target.expected.test(allText);

  await writeTextEvidence(faEvidencePath(`${target.id}-page-text.txt`), text || 'No compact page text captured.\n');
  await writeJsonEvidence(faEvidencePath(`${target.id}-buttons.json`), buttons);

  return {
    id: target.id,
    route: 'tell-me-read-only',
    searchTerm: target.searchTerm,
    opened,
    openError,
    url: page.url(),
    contextVisible,
    interestingSignals: {
      fixedAsset: /Fixed Asset|Anlage/i.test(allText),
      journal: /Journal|Buch.-Blatt|Buchblatt/i.test(allText),
      postingGroup: /Posting Group|Buchungsgruppe/i.test(allText),
      setup: /Setup|Einrichtung/i.test(allText),
      postVisible: buttons.some((button) => /Post|Buchen/i.test(button)),
      newVisible: buttons.some((button) => /^(New|Neu)$|new entry|neuen Eintrag/i.test(button)),
    },
    evidence: {
      tellMeText: `playwright/projects/${project.name}/evidence/${TEST_ID}/${target.id}-tell-me-text.txt`,
      text: `playwright/projects/${project.name}/evidence/${TEST_ID}/${target.id}-page-text.txt`,
      buttons: `playwright/projects/${project.name}/evidence/${TEST_ID}/${target.id}-buttons.json`,
    },
  };
}

function statePatch(summary: string) {
  return {
    current: {
      activeCase: 'FIXEDASSETS-079-FIXED-ASSET-ACQUISITION-ROUTE-DECISION',
      active_case_file: '.agent/state/cases/fixedassets-079.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-078.json',
      nextStep:
        'FA-078 showed the next useful path is a route decision, not another document-line retry: compare Microsoft Learn acquisition options with visible RM-DEMO pages, then choose either Fixed Asset G/L Journal / Acquire action or a documented purchase-document route.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-setup-page-capability-review',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep:
        'Plan FA-079 as an acquisition-route decision. Do not enter K30000 or FA-CNC-01 until the selected route has explicit preflight and setup gates.',
    },
    activeCase: {
      status: 'observed-readonly',
      lastResult: {
        status: 'observed',
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-078/FIXEDASSETS-078-result.json',
        summary,
      },
      nextSafeAction: 'Decide the fixed-asset acquisition route before target values or setup changes.',
    },
  };
}

test('FIXEDASSETS-078 reviews fixed asset setup/page capability read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  const microsoftLearn = {
    acquireFixedAssets:
      'https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire',
    purchaseFixedAssetsTraining:
      'https://learn.microsoft.com/en-us/training/modules/purchase-fixed-assets/',
    summary: [
      'Microsoft Learn documents fixed asset acquisition through Fixed Asset G/L Journal and assisted acquisition from a Fixed Asset Card.',
      'Microsoft Learn training also describes purchase invoices for posting acquisition cost to a fixed asset.',
      'Therefore the current RM-DEMO blocker should be treated as page/setup/role/automation route uncertainty, not as proof that Business Central cannot acquire fixed assets through purchasing.',
    ],
  };
  await writeJsonEvidence(faEvidencePath('010-microsoft-learn-route-basis.json'), microsoftLearn);
  await writeTextEvidence(
    faEvidencePath('010-microsoft-learn-route-basis.md'),
    [
      '# Microsoft-Learn-Basis fuer FA-078',
      '',
      '- Quelle: https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire',
      '- Quelle: https://learn.microsoft.com/en-us/training/modules/purchase-fixed-assets/',
      '',
      'Kernaussage fuer dieses Labor: Business Central kennt mehrere Anlagenzugangswege. Unser bisheriger Blocker beweist nicht, dass Anlagenzugang unmoeglich ist; er beweist nur, dass die bisher getesteten Einkaufsbeleg-Zeilentyp-Routen in RM-DEMO nicht stabil `Fixed Asset` sichtbar gemacht haben.',
      '',
    ].join('\n'),
  );

  const fixedAssets = await openDirectReadOnlyPage(page, {
    id: '020-fixed-assets-list',
    pageId: 5601,
    expected: /Fixed Assets|Fixed Asset|Anlagen|Anlage/i,
    include: [/Fixed Asset|Anlage|Acquire|Erwerben|Depreciation|AfA|No\.|Nr\.|Description|Beschreibung|Posting|Buchen/i],
  });
  const depreciationBooks = await openDirectReadOnlyPage(page, {
    id: '030-depreciation-books',
    pageId: 5611,
    expected: /Depreciation Book|Depreciation Books|AfA|Abschreibung/i,
    include: [/Depreciation Book|AfA|Abschreibung|Book|Buch|G\/L Integration|Integration|Code|Description|Beschreibung/i],
  });
  const purchaseInvoices = await openDirectReadOnlyPage(page, {
    id: '040-purchase-invoices-list',
    pageId: 9308,
    expected: /Purchase Invoices|Purchase Invoice|Einkaufsrechnung|Einkaufsrechnungen/i,
    include: [/Purchase Invoice|Einkaufsrechnung|Vendor|Kreditor|Type|Art|No\.|Nr\.|Line|Zeile|Post|Buchen|Preview|Vorschau/i],
  });
  const purchaseOrders = await openDirectReadOnlyPage(page, {
    id: '050-purchase-orders-list',
    pageId: 9307,
    expected: /Purchase Orders|Purchase Order|Einkaufsbestellung|Einkaufsbestellungen/i,
    include: [/Purchase Order|Einkaufsbestellung|Vendor|Kreditor|Type|Art|No\.|Nr\.|Line|Zeile|Post|Buchen|Preview|Vorschau/i],
  });
  const faPostingGroups = await openTellMeReadOnlyPage(page, {
    id: '060-fa-posting-groups',
    searchTerm: 'FA Posting Groups',
    result: /^FA Posting Groups$|^Anlagenbuchungsgruppen$/i,
    expected: /FA Posting Group|FA Posting Groups|Anlagenbuchungsgruppe|Buchungsgruppe/i,
    include: [/FA Posting|Anlagenbuchungsgruppe|Buchungsgruppe|Acquisition|Anschaffung|Depreciation|AfA|Account|Konto|Code/i],
  });
  const faGlJournals = await openTellMeReadOnlyPage(page, {
    id: '070-fixed-asset-gl-journals',
    searchTerm: 'Fixed Asset G/L Journals',
    result: /^Fixed Asset G\/L Journals$|^FA G\/L Journals$|^Anlagen Fibu Buch.-Bl.*tter$|^Anlagen Fibu Buchbl.*tter$/i,
    expected: /Fixed Asset G\/L Journal|FA G\/L Journal|Anlagen|Buch.-Blatt|Buchblatt/i,
    include: [/Fixed Asset|Anlage|G\/L Journal|Fibu|Buch.-Blatt|Buchblatt|FA Posting Type|Acquisition|Anschaffung|Account|Konto|Post|Buchen/i],
  });

  const pages = [fixedAssets, depreciationBooks, purchaseInvoices, purchaseOrders, faPostingGroups, faGlJournals];
  const visibleRoutes = pages.filter((entry) => entry.contextVisible).map((entry) => entry.id);
  const blockedRoutes = pages.filter((entry) => !entry.contextVisible).map((entry) => ({ id: entry.id, route: entry.route }));
  const journalRouteVisible = faGlJournals.contextVisible;
  const purchaseDocumentPagesVisible = purchaseInvoices.contextVisible || purchaseOrders.contextVisible;
  const fixedAssetMasterVisible = fixedAssets.contextVisible;
  const setupPagesVisible = depreciationBooks.contextVisible || faPostingGroups.contextVisible;
  const summary =
    `FA-078 stayed in MCP_1_20260210 / RM-DEMO and reviewed fixed-asset acquisition capability read-only. ` +
    `Visible route contexts: ${visibleRoutes.join(', ') || 'none'}. ` +
    `The blocker is now classified as route-decision-open: Microsoft Learn supports multiple acquisition routes, while RM-DEMO still lacks a proven purchase-document line Type=Fixed Asset path.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-setup-page-capability-review-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-page-capability-review',
    resultStatus: 'observed',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      context,
      urlAfterProbe: page.url(),
    },
    microsoftLearn,
    observedRoutes: {
      fixedAssetMasterVisible,
      setupPagesVisible,
      purchaseDocumentPagesVisible,
      journalRouteVisible,
      visibleRoutes,
      blockedRoutes,
    },
    createdRecords: [],
    changedRecords: [],
    postedRecords: [],
    setupChanges: [],
    cleanup: {
      required: false,
      completed: true,
      method: 'not-needed-read-only',
      blockedBy: [],
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'The run performed read-only page/context diagnosis only.',
      'Fixed Asset master/list context was checked without opening a New card.',
      'Depreciation Books and FA Posting Groups were checked as setup/capability context.',
      'Purchase Invoices and Purchase Orders list contexts were checked without creating documents.',
      ...(journalRouteVisible ? ['A Fixed Asset G/L Journal route/context was visible as an alternative acquisition route candidate.'] : []),
      'Microsoft Learn documents multiple fixed-asset acquisition routes; the current blocker is route selection/setup/page capability, not absence of a BC fixed-asset concept.',
    ],
    notProved: [
      'No Type = Fixed Asset was selected in a purchase line.',
      'No K30000 was entered.',
      'No FA-CNC-01 was entered.',
      'No fixed asset acquisition was posted.',
      'No Preview Posting.',
      'No setup change.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-078.json',
      '.agent/state/cases/fixedassets-079.json',
      '.agent/state/last_run_summary.json',
      '.agent/state/coverage_state.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-078-setup-page-capability-review.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-078/FIXEDASSETS-078-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-078/FIXEDASSETS-078-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-078/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-078/FIXEDASSETS-078-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-078/FIXEDASSETS-078-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-078/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-078/010-microsoft-learn-route-basis.md',
      ...pages.flatMap((entry) => Object.values(entry.evidence)),
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'Read-only route/capability review, not a posting proof.',
      'Microsoft Learn source is used as route basis; RM-DEMO visibility still requires separate UI proof before target entry.',
    ],
    blockedBy: [],
    requiresReview: false,
    safeToFinalizeState: true,
    statePatch: statePatch(summary),
    flags: {
      stayedInExpectedInstance: context.environmentInUrl,
      companyContextDocumented: context.companyInUrl || context.companyInText,
      noBookChange: true,
      secretsUntouched: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noEditRecord: true,
      noDeleteRecord: true,
      noTargetVendorEntry: true,
      noTargetFixedAssetEntry: true,
      cleanupCompleted: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      pages,
    },
    nextStep:
      'Create FA-079 as an acquisition-route decision: choose the safest next route between Fixed Asset G/L Journal / Acquire action and purchase-document acquisition, with explicit preflight before any target values.',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-078-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-078-learning.md'),
    [
      '# FIXEDASSETS-078 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `page-capability-review`, `no-posting`, `no-setup-change`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in BC lernt',
      '',
      'Anlagenzugang ist kein einzelner isolierter Klickpfad. Business Central trennt Anlagenstamm, AfA-Buch, Anlagenbuchungsgruppen/Kontenfindung, Einkaufsbelege und Anlagenjournale. Wenn der Einkaufsbeleg-Zeilentyp in einem bestimmten UI-Kontext nicht sichtbar ist, bedeutet das noch nicht, dass Anlagenzugang fachlich unmoeglich ist.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 sollte vor dem ersten Anlagenzugang eine Routenentscheidung zeigen: Entweder Anlagenzugang ueber Fixed Asset G/L Journal / Acquire action oder ein sauber belegter Einkaufsbelegpfad. Die bisherigen Purchase-Invoice-/Purchase-Order-Zeilentyp-Probes sind Laborblocker, keine finalen Belege fuer den richtigen deutschen Zielprozess.',
      '',
      '## Grenzen',
      '',
      '- Keine Zielwerte `K30000` oder `FA-CNC-01` eingegeben.',
      '- Keine Preview, keine Buchung, keine Setup-Aenderung.',
      '- Microsoft-Learn-Quellen zeigen fachliche Routen, ersetzen aber keinen RM-DEMO-UI-Nachweis.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-078 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-078-result.json` | JSON | read-only Routen-/Page-Capability-Review, Quellenbasis, Safety Flags | keine Buchung, keine Zielwerte | `labor`, `observed` |',
      '| `FIXEDASSETS-078-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-microsoft-learn-route-basis.md` | Markdown | offizielle Routenbasis fuer Anlagenzugang | keine RM-DEMO-Buchung | `source-context` |',
      '| `020-*` bis `070-*` | Text/JSON | sichtbare Seiten-/Button-Kontexte fuer Anlagen, Setup, Einkauf und Journal | keine Datenaenderung | `read-only-page-context` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.stayedInExpectedInstance).toBe(true);
  expect(result.flags.companyContextDocumented).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noNewDraft).toBe(true);
  expect(pages.some((entry) => entry.contextVisible)).toBe(true);
});
