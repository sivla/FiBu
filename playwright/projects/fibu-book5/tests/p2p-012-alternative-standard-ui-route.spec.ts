import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, pageText, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2400, height: 1400 }
});

test.setTimeout(300_000);

const TEST_ID = 'p2p-012';

type RouteCandidate = {
  id: string;
  label: string;
  pageId: number;
  expected: RegExp;
  materialSignals: RegExp[];
  quantitySignals: RegExp[];
  valueSignals: RegExp[];
  ledgerSignals: RegExp[];
  chapterFit: 'p2p' | 'inventory' | 'mixed' | 'readiness-only';
};

type RouteResult = {
  id: string;
  label: string;
  pageId: number;
  status: 'observed' | 'blocked';
  url: string;
  compactTextPath: string;
  screenshot: string;
  signals: {
    expectedPage: boolean;
    material: boolean;
    quantity: boolean;
    value: boolean;
    ledger: boolean;
  };
  fachlicheBewertung: {
    canShowMaterialReceipt: boolean;
    canShowQuantityLocationValue: boolean;
    canCreateLedgerEntries: boolean;
    usefulForBookChapter: string;
    doesNotProve: string[];
  };
  blockedBy: string[];
};

const candidates: RouteCandidate[] = [
  {
    id: 'purchase-journal',
    label: 'Purchase Journal',
    pageId: 254,
    expected: /Purchase Journal|Purchase Journals|Einkaufsjournal|Einkaufsjournale|Batch Name/i,
    materialSignals: [/Item|Artikel|Type|Art/i],
    quantitySignals: [/Quantity|Menge|Location|Lagerort/i],
    valueSignals: [/Amount|Betrag|Unit Cost|Direct Unit Cost|Einstand/i],
    ledgerSignals: [/Post|Buchen|Preview|Vorschau|Document No|Belegnr/i],
    chapterFit: 'p2p'
  },
  {
    id: 'item-journal',
    label: 'Item Journal',
    pageId: 40,
    expected: /Item Journal|Item Journals|Artikel Buch|Artikeljournal|Batch Name/i,
    materialSignals: [/Item No|Artikel|Entry Type|Postenart/i],
    quantitySignals: [/Quantity|Menge|Location|Lagerort/i],
    valueSignals: [/Unit Cost|Einstand|Amount|Betrag/i],
    ledgerSignals: [/Post|Buchen|Preview|Vorschau|Document No|Belegnr/i],
    chapterFit: 'inventory'
  },
  {
    id: 'purchase-invoices',
    label: 'Purchase Invoices',
    pageId: 9308,
    expected: /Purchase Invoices|Purchase Invoice|Einkaufsrechnungen|Einkaufsrechnung|Buy-from Vendor/i,
    materialSignals: [/Vendor|Kreditor|Invoice|Rechnung|Amount|Betrag/i],
    quantitySignals: [/Quantity|Menge|Location|Lagerort/i],
    valueSignals: [/Amount|Betrag|Direct Unit Cost|Unit Cost|Einstand/i],
    ledgerSignals: [/Post|Buchen|Preview|Vorschau|Posted|Gebucht/i],
    chapterFit: 'p2p'
  },
  {
    id: 'requisition-worksheet',
    label: 'Requisition Worksheet',
    pageId: 291,
    expected: /Requisition Worksheet|Bestellvorschlag|Planungsarbeitsblatt|Worksheet|Batch Name/i,
    materialSignals: [/Item|Artikel|Vendor|Kreditor/i],
    quantitySignals: [/Quantity|Menge|Location|Lagerort/i],
    valueSignals: [/Unit Cost|Direct Unit Cost|Einstand|Amount|Betrag/i],
    ledgerSignals: [/Carry Out Action|Aktion durchf|Create Purchase|Bestellung erstellen/i],
    chapterFit: 'readiness-only'
  }
];

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function sanitizeUrl(raw: string) {
  const url = new URL(raw);
  for (const key of [...url.searchParams.keys()]) {
    if (!['company', 'page'].includes(key)) {
      url.searchParams.delete(key);
    }
  }
  return url.toString().replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '[tenant-id]');
}

function compact(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 80)
    .join('\n');
}

async function openCandidate(page: Page, candidate: RouteCandidate) {
  await page.goto(bcPageUrl(candidate.pageId, project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await dismissTours(page);
  await page.waitForTimeout(1000);
}

function anySignal(text: string, signals: RegExp[]) {
  return signals.some((signal) => signal.test(text));
}

function evaluateRoute(candidate: RouteCandidate, text: string, expectedPage: boolean) {
  const material = anySignal(text, candidate.materialSignals);
  const quantity = anySignal(text, candidate.quantitySignals);
  const value = anySignal(text, candidate.valueSignals);
  const ledger = anySignal(text, candidate.ledgerSignals);
  const canShowMaterialReceipt = expectedPage && material && quantity && candidate.chapterFit !== 'readiness-only';
  const canShowQuantityLocationValue = expectedPage && quantity && value;
  const canCreateLedgerEntries = expectedPage && ledger && candidate.chapterFit !== 'readiness-only';

  return {
    signals: { expectedPage, material, quantity, value, ledger },
    fachlicheBewertung: {
      canShowMaterialReceipt,
      canShowQuantityLocationValue,
      canCreateLedgerEntries,
      usefulForBookChapter:
        candidate.chapterFit === 'inventory'
          ? 'Inventory-Kapitel und P2P-Abgrenzung; gut fuer Mengen-/Lagerwertwirkung, aber kein Kreditorenprozess.'
          : candidate.chapterFit === 'p2p'
            ? 'P2P-Kapitel; potenziell geeignet, wenn Werteingabe und Posting-Gate spaeter sichtbar kontrollierbar sind.'
            : 'Nur Readiness-/Planungsroute; nicht als gebuchter P2P- oder Inventory-Nachweis ausreichend.',
      doesNotProve: [
        'keine Werteingabe',
        'kein Preview Posting',
        'keine Buchung',
        'keine Ledger Entries',
        'kein deutscher Finalnachweis'
      ]
    }
  };
}

test('P2P-012 evaluates alternative standard UI routes without field entry', async ({ page }) => {
  const routeResults: RouteResult[] = [];
  const blockedBy = new Set<string>();

  for (const candidate of candidates) {
    let text = '';
    let status: RouteResult['status'] = 'observed';
    let routeBlockedBy: string[] = [];
    try {
      await openCandidate(page, candidate);
      text = await pageText(page);
    } catch (error) {
      status = 'blocked';
      text = String(error instanceof Error ? error.message : error);
      routeBlockedBy = [`${candidate.id}-open-blocked`];
      blockedBy.add(`${candidate.id}-open-blocked`);
    }

    const expectedPage = candidate.expected.test(text);
    if (!expectedPage) {
      routeBlockedBy.push(`${candidate.id}-expected-page-signal-missing`);
      blockedBy.add(`${candidate.id}-expected-page-signal-missing`);
    }

    const textPath = p2pEvidencePath(`${candidate.id}-text.txt`);
    await writeTextEvidence(textPath, compact(text));

    const screenshotName = `p2p-012-${candidate.id}.png`;
    if (status === 'observed') {
      await screenshot(page, screenshotName, {
        projectName: project.name,
        testId: TEST_ID,
        status: 'labor',
        bookUse: 'evidence',
        purpose: `${candidate.label} als alternative Standard-UI-Route read-only bewerten.`,
        expectedPageText: [candidate.expected],
        knownLimitations: [
          'Keine Werteingabe',
          'Kein Preview Posting',
          'Keine Buchung',
          'Keine deutschen Finalclaims'
        ]
      }).catch(async () => {
        routeBlockedBy.push(`${candidate.id}-screenshot-context-not-clear`);
        blockedBy.add(`${candidate.id}-screenshot-context-not-clear`);
      });
    }

    const evaluated = evaluateRoute(candidate, text, expectedPage);
    routeResults.push({
      id: candidate.id,
      label: candidate.label,
      pageId: candidate.pageId,
      status,
      url: sanitizeUrl(page.url()),
      compactTextPath: `playwright/projects/fibu-book5/evidence/${TEST_ID}/${candidate.id}-text.txt`,
      screenshot: `playwright/projects/fibu-book5/img/${screenshotName}`,
      signals: evaluated.signals,
      fachlicheBewertung: evaluated.fachlicheBewertung,
      blockedBy: routeBlockedBy
    });
  }

  const preferredRoute =
    routeResults.find((route) => route.id === 'item-journal' && route.signals.expectedPage && route.signals.quantity && route.signals.value) ??
    routeResults.find((route) => route.signals.expectedPage && route.fachlicheBewertung.canShowQuantityLocationValue) ??
    null;

  const result = {
    schemaVersion: 1,
    caseId: 'P2P-012-ALTERNATIVE-STANDARD-UI-ROUTE',
    parentCaseId: 'BC-DEEP-RUN-001-MULTI-ROUTE-SANDBOX-PROGRESS',
    source: 'playwright-ui-labor-route-comparison',
    resultStatus: preferredRoute ? 'observed' : 'blocked',
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    sourceCompany: 'RM-DEMO',
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
      noSearch: true
    },
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    safeToFinalizeState: false,
    requiresReview: true,
    statePatch: {},
    preferredRoute: preferredRoute
      ? {
          id: preferredRoute.id,
          label: preferredRoute.label,
          reason: 'Observed route has visible page context plus quantity/value signals without returning to Purchase Order line editing.'
        }
      : null,
    routeResults,
    proved: [
      'P2P-012 opened alternative standard UI candidates by direct page URL, not by Tell-Me/search.',
      'No field value entry, Preview Posting, posting, setup change, company switch or API shortcut was executed.',
      preferredRoute
        ? `${preferredRoute.label} is the strongest observed next route for a controlled follow-up.`
        : 'No alternative route was strong enough for controlled follow-up.'
    ],
    notProved: [
      'No material receipt, purchase invoice or inventory posting was created.',
      'No ledger entries were created or traced.',
      'No German final proof was created.'
    ],
    blockedBy: [...blockedBy],
    nextStep: preferredRoute
      ? `Create a controlled follow-up case for ${preferredRoute.label}; define exact journal/document fields, Preview/Check gate and ledger trace before posting.`
      : 'Switch to Fixed Assets depreciation, Bank Reconciliation or clean lab company planning; do not repeat Purchase Order line edits.'
  };

  await writeJsonEvidence(p2pEvidencePath('P2P-012-result.json'), result);
  await writeTextEvidence(
    p2pEvidencePath('README.md'),
    [
      '# P2P-012 Alternative Standard-UI Route',
      '',
      'Status: `labor-route-comparison`, `read-only`, `needs-german-final-rebuild`.',
      '',
      'Dieser Lauf vergleicht alternative Standard-UI-Routen fuer P2P/Inventory-Wirkung, ohne die blockierten Purchase-Order-Line-Edit-Routen aus P2P-009 bis P2P-011 zu wiederholen.',
      '',
      '| Route | Page ID | Status | Mengen-/Lager-/Wertsignal | Buchkapitel-Nutzen | Grenze |',
      '|---|---:|---|---|---|---|',
      ...routeResults.map((route) =>
        `| ${route.label} | ${route.pageId} | ${route.status} | ${
          route.signals.quantity && route.signals.value ? 'ja' : 'nein/unklar'
        } | ${route.fachlicheBewertung.usefulForBookChapter} | Keine Werteingabe, kein Preview, keine Buchung |`
      ),
      '',
      '## Ergebnis',
      '',
      preferredRoute
        ? `Bevorzugte naechste Route: ${preferredRoute.label}.`
        : 'Keine Route ist stark genug fuer einen direkten kontrollierten Posting-Follow-up.',
      '',
      '## Buchwirkung',
      '',
      'Das Buch darf diesen Befund als Labor-Routenentscheidung nutzen: Purchase-Order-Line-Zell-Edits werden nicht weiter blind wiederholt; der naechste P2P/Inventory-Versuch muss eine besser kontrollierbare Standard-UI verwenden.',
      '',
      '## German Final Rebuild',
      '',
      'Alle spaeteren finalen Screenshots und Buchungsnachweise muessen in der deutschen Zielinstanz neu erzeugt werden.'
    ].join('\n')
  );

  expect(routeResults.length).toBe(candidates.length);
});
