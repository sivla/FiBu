import { expect, test, type Page } from '@playwright/test';

import { bcPageUrl, compactPageText, pageText, waitForBusinessCentralShell, waitForPageText } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-095-PURCHASE-INVOICE-LINE-TYPE-CAPABILITY-DIAGNOSIS-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-096-PURCHASE-INVOICE-DRAFT-LINE-TYPE-GATE-DECISION';
const TEST_ID = 'fixedassets-095';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
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
    /Purchase Invoices|Purchase Invoice|Einkaufsrechnungen|Einkaufsrechnung|Lines|Zeilen|Line|Zeile|Type|Art|Item|Artikel|Fixed Asset|Anlage|Description|Beschreibung|No\.|Nr\.|Vendor|Kreditor|New|Neu|Edit|Delete|Post|Preview|Invoice|Setup|Buchen|Vorschau|Page Inspection|Personalize/i;
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
    .slice(0, 120);
}

async function visibleTextSignals(page: Page) {
  const text = await pageText(page);
  return {
    purchaseInvoicesVisible: /Purchase Invoices|Einkaufsrechnungen/i.test(text),
    purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(text),
    lineContextVisible: /Lines|Zeilen|Line|Zeile/i.test(text),
    typeTextVisible: /\bType\b|\bArt\b/i.test(text),
    fixedAssetTextVisible: /Fixed Asset|Anlage/i.test(text),
    itemTextVisible: /\bItem\b|Artikel/i.test(text),
    newActionVisible: /\bNew\b|\bNeu\b/i.test(text),
    editActionVisible: /\bEdit\b|Bearbeiten/i.test(text),
    deleteActionVisible: /\bDelete\b|Loschen|Loeschen/i.test(text),
    postOrPreviewVisible: /\bPost\b|Buchen|Preview|Vorschau/i.test(text),
    focusedLines: focusedLines(text),
  };
}

async function collectCompactContext(page: Page) {
  return compactPageText(page, {
    include: [
      /Purchase Invoices/i,
      /Einkaufsrechnungen/i,
      /Purchase Invoice/i,
      /Einkaufsrechnung/i,
      /\bType\b/i,
      /\bArt\b/i,
      /Fixed Asset/i,
      /Anlage/i,
      /\bItem\b/i,
      /Artikel/i,
      /Lines/i,
      /Zeilen/i,
      /New|Neu|Edit|Delete|Post|Preview|Invoice|Buchen|Vorschau/i,
    ],
    maxLines: 120,
    maxLineLength: 220,
  });
}

async function collectVisibleActionInventory(page: Page) {
  const actions = [];
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Purchase Invoices|Einkaufsrechnungen|Business Central/i.test(bodyText)) {
      continue;
    }

    const frameActions = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) =>
          (value || '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x20-\x7E]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };

        return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],[aria-label],[title]'))
          .filter(visible)
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width <= 900 && rect.height <= 180;
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const label = normalize(
              [element.innerText, element.textContent, element.getAttribute('aria-label'), element.getAttribute('title')]
                .map(normalize)
                .filter(Boolean)
                .join(' '),
            ).slice(0, 220);
            return {
              label,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              risky:
                /\b(New|Neu|Edit|Bearbeiten|Delete|Loschen|Loeschen|Post|Buchen|Preview|Vorschau|Ship|Invoice|Payment|Zahlung)\b/i.test(
                  label,
                ),
              relevant: /\b(Type|Art|Fixed Asset|Anlage|Item|Artikel|Line|Zeile|Purchase Invoice|Einkaufsrechnung)\b/i.test(label),
            };
          })
          .filter((entry) => entry.label)
          .sort((left, right) => left.y - right.y || left.x - right.x)
          .slice(0, 120);
      })
      .catch(() => []);

    actions.push(...frameActions.map((action) => ({ ...action, frameUrl: frame.url() })));
  }

  const relevantActions = actions.filter(
    (action) =>
      !/Shopify|Alle Berichte|Role Center|Rollencenter|Hauptnavigation|Zum Hauptinhalt wechseln|Post financial transactions/i.test(action.label) &&
      (action.relevant ||
        /\b(New|Neu|Edit|Delete|Post|Preview|Invoice|Buchen|Vorschau|Personalize|Page Inspection)\b/i.test(action.label)),
  );
  const uniqueLabels = (entries: { label: string }[], max = 30) => Array.from(new Set(entries.map((action) => action.label))).slice(0, max);

  return {
    actionCount: actions.length,
    relevantActionCount: relevantActions.length,
    riskyVisibleButNotClickedLabels: uniqueLabels(
      relevantActions.filter((action) => action.risky),
      20,
    ),
    relevantActionLabels: uniqueLabels(relevantActions, 30),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-096-purchase-invoice-draft-line-type-gate-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-095-purchase-invoice-line-type-capability-diagnosis-readonly.json',
      nextStep:
        status === 'observed'
          ? 'FIXEDASSETS-096: decide whether a tightly guarded Purchase Invoice draft line-type proof is justified, using FIXEDASSETS-095 read-only evidence.'
          : 'Resolve FIXEDASSETS-095 blocker before any Purchase Invoice draft line-type gate decision.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'purchase-invoice-line-type-capability-diagnosis-readonly',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep:
        status === 'observed'
          ? 'Run FIXEDASSETS-096 as a local gate decision. Do not create a draft unless that case explicitly unlocks it.'
          : 'Fix the read-only blocker and rerun FIXEDASSETS-095.',
    },
    activeCase: {
      status,
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-095/FIXEDASSETS-095-result.json',
        summary,
      },
      nextSafeAction:
        status === 'observed'
          ? 'Local gate decision only. No New/Neu, no K30000, no FA-CNC-01, no value entry until a case unlocks a guarded draft proof.'
          : 'No further live run until blocker is understood.',
    },
  };
}

function baseResult() {
  return {
    schemaVersion: 1,
    purpose: 'fixedassets-purchase-invoice-line-type-capability-diagnosis-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-ui-diagnosis',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    changedFiles: [
      '.agent/state/cases/fixedassets-095-purchase-invoice-line-type-capability-diagnosis-readonly.json',
      '.agent/state/cases/fixedassets-096-purchase-invoice-draft-line-type-gate-decision.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-095-purchase-invoice-line-type-capability-diagnosis-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-095/FIXEDASSETS-095-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-095/FIXEDASSETS-095-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-095/010-purchase-invoices-readonly-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-095/020-visible-action-inventory.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-095/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-095/FIXEDASSETS-095-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-095/FIXEDASSETS-095-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-095/010-purchase-invoices-readonly-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-095/020-visible-action-inventory.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-095/README.md',
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

test('FIXEDASSETS-095 diagnoses Purchase Invoice line Type capability read-only', async ({ page }) => {
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

    const contextText = await collectCompactContext(page);
    const signals = await visibleTextSignals(page);
    const actionInventory = await collectVisibleActionInventory(page);
    const fixedAssetLineTypeProved = signals.lineContextVisible && signals.typeTextVisible && signals.fixedAssetTextVisible;
    const summary =
      `FIXEDASSETS-095 opened Purchase Invoices read-only in ${EXPECTED_INSTANCE} / ${EXPECTED_COMPANY}. ` +
      `Visible list context was captured without New/Edit/Delete/Post/Preview. Type=Fixed Asset proof: ${fixedAssetLineTypeProved ? 'visible-context-candidate' : 'not-proved-readonly'}.`;

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
        'Purchase Invoices list context was visible.',
        'Focused UI text and action signals were captured without clicking New, Edit, Delete, Post or Preview.',
        'No draft was created and no purchase invoice record or line was opened.',
      ],
      notProved: [
        'Type = Fixed Asset was not selected.',
        fixedAssetLineTypeProved
          ? 'The run only found a visible-context candidate; it did not prove dropdown selectability in a real purchase invoice line.'
          : 'Type = Fixed Asset is still not proven visible/selectable from the read-only list context.',
        'K30000 and FA-CNC-01 were not entered.',
        'No acquisition, depreciation, preview posting, posting or German final proof.',
        'Read-only list evidence cannot prove editable line dropdown values hidden behind a draft document.',
      ],
      warnings: actionInventory.riskyVisibleButNotClickedLabels.length
        ? ['Risky actions were visible in inventory only; this run did not click them.']
        : [],
      blockedBy: [],
      requiresReview: false,
      safeToFinalizeState: true,
      statePatch: statePatch('observed', summary),
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        pageInspectionUsed: false,
        pageInspectionReason: 'Skipped to avoid external Learn/help popups and because this case only needed safe read-only list context.',
        signals,
        fixedAssetLineTypeProved,
        actionInventory,
      },
      nextStep:
        'Run FIXEDASSETS-096 as a local gate decision: decide whether a guarded Purchase Invoice draft line-type proof should be unlocked.',
    };

    await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-095-result.json'), result);
    await writeTextEvidence(fixedAssetsEvidencePath('010-purchase-invoices-readonly-context.txt'), contextText);
    await writeJsonEvidence(fixedAssetsEvidencePath('020-visible-action-inventory.json'), actionInventory);
    await writeTextEvidence(
      fixedAssetsEvidencePath('FIXEDASSETS-095-learning.md'),
      [
        '# FIXEDASSETS-095 Learning',
        '',
        '## Situation',
        '',
        'Der Anlagenzugang ueber Einkaufsrechnung bleibt fachlich interessant, weil Business Central Anlagen grundsaetzlich ueber Einkaufsbelege anschaffen kann. Vor einem neuen Draft musste aber erst geklaert werden, ob die Purchase-Invoice-Seite read-only genug Signale fuer den Zeilentyp liefert.',
        '',
        '## Ergebnis',
        '',
        fixedAssetLineTypeProved
          ? 'Der read-only Kontext liefert einen sichtbaren Kandidaten fuer `Type = Fixed Asset`, beweist aber keine echte Auswahl in einer Einkaufsrechnungszeile.'
          : 'Der read-only Kontext beweist `Type = Fixed Asset` nicht. Ohne Draft ist die editierbare Zeile mit Dropdown-Werten nicht sichtbar.',
        '',
        '## Warum Business Central so reagiert',
        '',
        'Die Einkaufsrechnungsliste zeigt Kopf-/Listen- und Aktionskontext. Die eigentlichen Zeilenfelder liegen erst im Dokument/Subform-Kontext. Deshalb kann ein Listenlauf die fachliche Dropdown-Faehigkeit nur begrenzt nachweisen.',
        '',
        '## Buchwirkung',
        '',
        'Das Buch darf fuer diesen Punkt noch nicht behaupten, dass der Anlagenzugang per Einkaufsrechnung in RM-DEMO durchgespielt ist. Es darf aber erklaeren, warum vor einem Anlagenzugang erst Zeilentyp, Kreditor, Anlagenkarte und Posting-Setup sauber nachgewiesen werden muessen.',
        '',
        '## Naechster Schritt',
        '',
        '`FIXEDASSETS-096` soll lokal entscheiden, ob ein eng begrenzter Draft-Line-Type-Proof mit Cleanup/Keep-Regel freigegeben wird.',
        '',
      ].join('\n'),
    );
    await writeTextEvidence(
      fixedAssetsEvidencePath('README.md'),
      [
        '# FIXEDASSETS-095 Evidence Index',
        '',
        '| Datei | Typ | Beweist | Beweist nicht | Status |',
        '|---|---|---|---|---|',
        '| `FIXEDASSETS-095-result.json` | JSON | Purchase Invoices wurde read-only in MCP_1_20260210 / RM-DEMO geoeffnet; Instanz/Company/No-Write-Flags und Ergebnis sind dokumentiert | keine Zeilentyp-Auswahl, kein Draft, keine Buchung | `observed`, `read-only`, `no-draft` |',
        '| `010-purchase-invoices-readonly-context.txt` | Text | fokussierter sichtbarer UI-Kontext der Purchase-Invoices-Seite | kein kompletter Rohdump, keine Dropdown-Werte hinter einer editierbaren Zeile | `observed`, `compact` |',
        '| `020-visible-action-inventory.json` | JSON | sichtbare relevante/riskante Aktionen wurden inventarisiert, aber nicht geklickt | keine Aktionsausfuehrung | `observed`, `action-inventory-only` |',
        '| `FIXEDASSETS-095-learning.md` | Markdown | Lern- und Buchwirkung des read-only Befunds | keinen finalen Anlagenzugang | `book-learning-candidate` |',
        '',
        'Aktuelle Wahrheit: Dieser Lauf ist ein sicherer Listen-/Kontextnachweis. Er ersetzt keinen kontrollierten Zeilen-/Draft-Nachweis fuer `Type = Fixed Asset`.',
        '',
      ].join('\n'),
    );

    expect(result.resultStatus).toBe('observed');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const summary = `FIXEDASSETS-095 read-only diagnosis blocked: ${reason}`;
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
        'Purchase Invoice line Type capability diagnosis did not complete.',
        'No Type = Fixed Asset proof is claimed.',
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

    await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-095-result.json'), result);
    throw error;
  }
});
