import { expect, test, type Page } from '@playwright/test';

import { bcPageUrl, pageText, waitForBusinessCentralShell, waitForPageText } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-070-LINE-TYPE-SELECTION-DIAGNOSIS';
const TEST_ID = 'fixedassets-070';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 },
});

test.setTimeout(180_000);

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function purchaseInvoicesUrl() {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function asciiSafe(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function focusedLines(text: string) {
  const keep =
    /Purchase Invoices|Einkaufsrechnungen|Purchase Invoice|Einkaufsrechnung|Lines|Zeilen|Type|Art|Item|Artikel|Fixed Asset|Anlage|FA-CNC-01|K30000|Vendor|Kreditor|Select items|Elemente auswahlen|New|Neu|Edit|Delete|Post|Preview|Buchen|Vorschau/i;
  const seen = new Set<string>();
  return text
    .split('\n')
    .map(asciiSafe)
    .filter((line) => line && keep.test(line))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, 100);
}

async function visibleTextSignals(page: Page) {
  const text = await pageText(page);
  return {
    purchaseInvoicesVisible: /Purchase Invoices|Einkaufsrechnungen/i.test(text),
    purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(text),
    linesVisible: /Lines|Zeilen/i.test(text),
    typeVisible: /\bType\b|\bArt\b/i.test(text),
    itemVisible: /\bItem\b|Artikel/i.test(text),
    fixedAssetVisible: /Fixed Asset|Anlage/i.test(text),
    selectItemsVisible: /Select items|Elemente auswahlen/i.test(text),
    k30000Visible: /K30000/i.test(text),
    faCnc01Visible: /FA-CNC-01/i.test(text),
    newVisible: /\bNew\b|\bNeu\b/i.test(text),
    previewOrPostVisible: /Preview|Vorschau|Post|Buchen/i.test(text),
    focusedLines: focusedLines(text),
  };
}

function isRelevantLineTypeAction(label: string) {
  const irrelevantNavigation =
    /Finance Post financial|Cash Management Process|Sales Make quotes|Purchasing Manage purchase invoices|Shopify|Alle Berichte|Rollencenter|Role Center|Hauptnavigation/i;
  if (irrelevantNavigation.test(label)) {
    return false;
  }

  return /\b(New|Neu|Delete|Loeschen|Loschen|Post|Preview|Vorschau|Invoice|Lines|Line|Zeilen|Zeile|Type|Art|Fixed Asset|Anlage|Item|Artikel|Vendor|Kreditor|Purchase Invoice|Purchase Invoices|Einkaufsrechnung|Einkaufsrechnungen)\b/i.test(
    label,
  );
}

async function collectActionInventory(page: Page) {
  const frames = [];
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Purchase Invoices|Einkaufsrechnungen|Business Central/i.test(bodyText)) {
      continue;
    }

    const actions = await frame
      .evaluate(() => {
        const safe = (value: string | null | undefined) =>
          (value || '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x20-\x7E]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const shorten = (value: string, maxLength = 180) => (value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value);
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };

        return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],[aria-label],[title]'))
          .filter(visible)
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return !(rect.width > 1600 && rect.height > 500);
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = shorten(safe(element.innerText || element.textContent));
            const aria = shorten(safe(element.getAttribute('aria-label')));
            const title = shorten(safe(element.getAttribute('title')));
            const label = shorten(`${text} ${aria} ${title}`.replace(/\s+/g, ' ').trim(), 220);
            return {
              label,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              risky:
                /\b(New|Neu|Edit|Bearbeiten|Delete|Loeschen|Loschen|Post|Buchen|Preview|Vorschau|Ship|Liefern|Invoice|Fakturieren|Payment|Zahlung)\b/i.test(
                  label,
                ),
              relevant: /\b(Type|Art|Item|Artikel|Fixed Asset|Anlage|Line|Zeile|Select items|Elemente auswahlen|New|Neu)\b/i.test(label),
            };
          })
          .filter((entry) => entry.label)
          .sort((left, right) => left.y - right.y || left.x - right.x)
          .slice(0, 120);
      })
      .catch(() => []);

    frames.push({ frameUrl: frame.url(), actions });
  }

  const allActions = frames.flatMap((frame) => frame.actions.map((action) => ({ ...action, frameUrl: frame.frameUrl })));
  const evidenceActions = allActions.filter((action) => isRelevantLineTypeAction(action.label));
  return {
    actionCount: allActions.length,
    evidenceActionCount: evidenceActions.length,
    omittedIrrelevantActionCount: allActions.length - evidenceActions.length,
    riskyActions: evidenceActions.filter((action) => action.risky).slice(0, 30),
    relevantActions: evidenceActions.filter((action) => action.relevant).slice(0, 30),
    sampleActionLabels: Array.from(new Set(evidenceActions.map((action) => action.label))).slice(0, 40),
    frames: frames.map((frame) => ({ frameUrl: frame.frameUrl, actionCount: frame.actions.length })),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-070.json',
      nextStep:
        status === 'observed'
          ? 'Review FIXEDASSETS-070 read-only UI diagnosis and decide whether a Page Inspection/Personalize probe or explicit approval for guarded draft line-type selection is the next safe step.'
          : 'Resolve FIXEDASSETS-070 read-only UI diagnosis blocker before any draft-capable fixed-assets probe.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: 'FIXEDASSETS-070-READONLY-UI-DIAGNOSIS',
      date: '2026-06-19',
      workType: 'read-only-ui-context-diagnosis',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep:
        status === 'observed'
          ? 'Use the focused UI signals to choose the next read-only Page Inspection/Personalize step or request explicit approval for a guarded draft probe.'
          : 'Fix the read-only blocker and rerun before any draft-capable probe.',
    },
    activeCase: {
      status,
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-070/FIXEDASSETS-070-readonly-ui-diagnosis-result.json',
        summary,
      },
      nextSafeAction:
        status === 'observed'
          ? 'Do not enter K30000 or FA-CNC-01 yet. Either inspect the Purchase Invoice Lines page/table context read-only or request explicit approval for a guarded draft Type-selection probe.'
          : 'No further live run until blocker is understood.',
    },
  };
}

function baseResult() {
  return {
    schemaVersion: 1,
    purpose: 'fixedassets-readonly-line-type-ui-diagnosis-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-ui-diagnosis',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    changedFiles: [
      '.agent/state/cases/fixedassets-070.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-070-purchase-invoice-line-type-readonly-diagnosis.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-070/FIXEDASSETS-070-readonly-ui-diagnosis-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-070/010-purchase-invoices-readonly-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-070/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-070/FIXEDASSETS-070-readonly-ui-diagnosis-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-070/010-purchase-invoices-readonly-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-070/README.md',
    ],
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noBookChange: true,
      noApiShortcut: true,
      noActionClick: true,
      noRecordOpen: true,
      noScreenshot: true,
    },
  };
}

test('FIXEDASSETS-070 diagnoses Purchase Invoice line type signals read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  let finalUrl = '';
  let title = '';

  try {
    await page.goto(purchaseInvoicesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|Vendor|Kreditor|Business Central/i, { timeout: 90_000 });

    finalUrl = page.url();
    title = await page.title();
    const decodedUrl = decodeURIComponent(finalUrl);
    const detectedInstance = decodedUrl.includes(EXPECTED_INSTANCE) ? EXPECTED_INSTANCE : null;
    const detectedCompany = new URL(finalUrl).searchParams.get('company');

    if (detectedInstance !== EXPECTED_INSTANCE) {
      throw new Error(`Detected instance mismatch: ${detectedInstance ?? 'not detected'}.`);
    }
    if (detectedCompany !== EXPECTED_COMPANY) {
      throw new Error(`Detected company mismatch: ${detectedCompany ?? 'not detected'}.`);
    }

    const signals = await visibleTextSignals(page);
    const actionInventory = await collectActionInventory(page);
    const summary =
      `FIXEDASSETS-070 opened Purchase Invoices read-only in ${EXPECTED_INSTANCE} / ${EXPECTED_COMPANY} ` +
      `and captured focused line-type signals without clicking actions or creating a draft.`;
    const result = {
      ...baseResult(),
      resultStatus: 'observed',
      environment: {
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: EXPECTED_COMPANY,
        detectedInstance,
        detectedCompany,
        url: finalUrl,
        title,
      },
      proved: [
        `Business Central URL stayed in ${EXPECTED_INSTANCE}.`,
        `Company URL parameter stayed ${EXPECTED_COMPANY}.`,
        'Purchase Invoices context was visible.',
        'Focused UI text/action signals were collected without clicking New, Edit, Delete, Post or Preview.',
        'No draft was created and no record was opened.',
      ],
      notProved: [
        'Type = Fixed Asset was not selected or proven in a purchase invoice line.',
        'K30000 and FA-CNC-01 were not entered.',
        'No acquisition, depreciation, posting, preview posting or German final proof.',
        'Read-only visible text cannot prove dropdown values hidden behind an unclicked editable line.',
      ],
      warnings: actionInventory.riskyActions.length
        ? ['Risky actions are visible in inventory only; this run did not click them.']
        : [],
      blockedBy: [],
      requiresReview: false,
      safeToFinalizeState: true,
      statePatch: statePatch('observed', summary),
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        signals,
        actionInventory,
      },
      nextStep:
        'Use this read-only diagnosis to decide between Page Inspection/Personalize for Purchase Invoice Lines or explicit approval for a guarded draft line-type selection probe.',
    };

    await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-070-readonly-ui-diagnosis-result.json'), result);
    await writeTextEvidence(
      fixedAssetsEvidencePath('010-purchase-invoices-readonly-focused-text.txt'),
      signals.focusedLines.join('\n'),
    );
    await writeTextEvidence(
      fixedAssetsEvidencePath('README.md'),
      [
        '# FIXEDASSETS-070 Evidence Index',
        '',
        '| Datei | Typ | Beweist | Beweist nicht | Status |',
        '|---|---|---|---|---|',
        '| `FIXEDASSETS-070-line-type-diagnosis.json` | JSON | lokale Auswertung aus FIXEDASSETS-066: Zeilenkontext sichtbar, aber Type blieb Item | keine UI-Neupruefung, keine Zeilentyp-Auswahl | `local-diagnosis-complete` |',
        '| `FIXEDASSETS-070-line-type-diagnosis.md` | Markdown | Lernzusammenfassung zum Blocker aus FIXEDASSETS-066 | keinen neuen BC-Lauf | `local-diagnosis-complete` |',
        '| `FIXEDASSETS-070-readonly-ui-diagnosis-result.json` | JSON | Purchase Invoices wurde read-only in MCP_1_20260210 / RM-DEMO geoeffnet; fokussierte Zeilentyp-Signale und sichtbare Aktionen wurden ohne Klick gesammelt | keine Auswahl von Type = Fixed Asset; kein K30000/FA-CNC-01; keine Buchung | `observed`, `read-only`, `no-action-click` |',
        '| `010-purchase-invoices-readonly-focused-text.txt` | Text | kompakter UI-Text mit relevanten Suchsignalen | kein vollstaendiger Rohdump und kein Screenshot | `observed`, `read-only` |',
        '',
        'Aktuelle Wahrheit: FIXEDASSETS-070 ist weiterhin Diagnose. Die Evidence darf nicht als Beweis fuer eine Anlagenzeile verwendet werden. Der naechste Schritt muss entweder eine weitere read-only Seiten-/Personalisierungspruefung sein oder eine ausdruecklich freigegebene, guardierte Draft-Probe.',
        '',
      ].join('\n'),
    );

    expect(result.resultStatus).toBe('observed');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const summary = `FIXEDASSETS-070 read-only UI diagnosis blocked: ${reason}`;
    const result = {
      ...baseResult(),
      resultStatus: 'blocked',
      environment: {
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: EXPECTED_COMPANY,
        url: finalUrl || page.url(),
        title,
      },
      proved: [],
      notProved: [
        'Purchase Invoices read-only line type diagnosis did not complete.',
        'No line-type signal is claimed.',
      ],
      warnings: [],
      blockedBy: [reason],
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: statePatch('blocked', summary),
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
      },
    };

    await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-070-readonly-ui-diagnosis-result.json'), result);
    throw error;
  }
});
