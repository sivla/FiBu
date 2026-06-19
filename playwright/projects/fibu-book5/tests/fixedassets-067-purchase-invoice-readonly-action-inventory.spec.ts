import { expect, test, type Page } from '@playwright/test';

import { bcPageUrl, pageText, waitForBusinessCentralShell, waitForPageText } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-067-PURCHASE-INVOICE-READONLY-ACTION-INVENTORY';
const TEST_ID = 'fixedassets-067';
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

function compactLines(text: string) {
  const keep = /Purchase Invoices|Einkaufsrechnungen|Purchase Invoice|Einkaufsrechnung|New|Neu|Edit|Delete|Post|Preview|Buchen|Vorschau|Vendor|Kreditor|No\.|Nr\./i;
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
    .slice(0, 80);
}

async function collectVisibleActions(page: Page) {
  const frameResults = [];
  for (const frame of page.frames()) {
    const frameText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Purchase Invoices|Einkaufsrechnungen/i.test(frameText)) {
      continue;
    }

    const actions = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const safe = (value: string | null | undefined) =>
          normalize(value)
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

        return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,[aria-label],[title]'))
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
              text,
              aria,
              title,
              label,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              risky: /\b(New|Neu|Edit|Bearbeiten|Delete|Loeschen|Loschen|Post|Buchen|Preview|Vorschau|Ship|Liefern|Invoice|Fakturieren|Payment|Zahlung)\b/i.test(label),
            };
          })
          .filter((entry) => entry.label)
          .sort((left, right) => left.y - right.y || left.x - right.x)
          .slice(0, 120);
      })
      .catch(() => []);

    frameResults.push({
      frameUrl: frame.url(),
      actions,
    });
  }

  const riskyActions = frameResults.flatMap((frame) =>
    frame.actions
      .filter((action) => action.risky)
      .map((action) => ({
        frameUrl: frame.frameUrl,
        label: action.label,
        x: action.x,
        y: action.y,
      })),
  );

  return { frameResults, riskyActions };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-067.json',
      nextStep:
        status === 'observed'
          ? 'Review FIXEDASSETS-067 action inventory. Next safe step is either explicit approval for FIXEDASSETS-066 draft-capable guarded probe or another read-only UI context probe.'
          : 'Resolve FIXEDASSETS-067 read-only blocker before any draft-capable fixed-assets probe.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'read-only-action-inventory',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep:
        status === 'observed'
          ? 'Review action inventory; do not run draft-capable probe without explicit approval.'
          : 'Fix the read-only blocker and rerun action inventory.',
    },
    activeCase: {
      status,
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-067/FIXEDASSETS-067-result.json',
        summary,
      },
      nextSafeAction:
        status === 'observed'
          ? 'Use inventory to plan the next read-only or approval-gated step. Do not click New/Neu without explicit approval.'
          : 'No further live run until blocker is understood.',
    },
  };
}

function baseResult() {
  return {
    schemaVersion: 1,
    purpose: 'fixedassets-readonly-action-inventory-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-action-inventory',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    changedFiles: [
      '.agent/state/cases/fixedassets-067.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-067-purchase-invoice-readonly-action-inventory.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-067/FIXEDASSETS-067-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-067/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-067/FIXEDASSETS-067-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-067/README.md',
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
      noScreenshot: true,
    },
  };
}

test('FIXEDASSETS-067 inventories Purchase Invoices actions without clicking', async ({ page }) => {
  const startedAt = new Date().toISOString();
  let finalUrl = '';
  let title = '';

  try {
    await page.goto(purchaseInvoicesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|Vendor|Kreditor/i, { timeout: 90_000 });

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

    const text = await pageText(page);
    const actionInventory = await collectVisibleActions(page);
    const summary =
      `FIXEDASSETS-067 opened Purchase Invoices read-only in ${EXPECTED_INSTANCE} / ${EXPECTED_COMPANY} ` +
      `and inventoried ${actionInventory.frameResults.reduce((sum, frame) => sum + frame.actions.length, 0)} visible action candidates without clicking them.`;
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
        'Purchase Invoices page context was visible.',
        'Visible actions were inventoried without clicking any action.',
        'No New/Neu action was clicked.',
        'No Delete/Edit/Post/Preview action was clicked.',
        'No draft was created.',
      ],
      notProved: [
        'No Type = Fixed Asset line proof.',
        'No K30000 header context.',
        'No FA-CNC-01 line context.',
        'No posting, acquisition, depreciation or German final proof.',
        'Action visibility does not prove that actions are safe to execute.',
      ],
      warnings: actionInventory.riskyActions.length
        ? ['Risky actions are visible in inventory only; visibility is not permission to click them.']
        : [],
      blockedBy: [],
      requiresReview: false,
      safeToFinalizeState: true,
      statePatch: statePatch('observed', summary),
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        safePageTextLines: compactLines(text),
        actionInventory,
      },
    };

    await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-067-result.json'), result);
    await writeTextEvidence(
      fixedAssetsEvidencePath('README.md'),
      [
        '# FIXEDASSETS-067 Evidence Index',
        '',
        '| Datei | Typ | Beweist | Beweist nicht | Status |',
        '|---|---|---|---|---|',
        '| `FIXEDASSETS-067-result.json` | JSON | Purchase-Invoices-Seite wurde read-only geoeffnet; sichtbare Aktionen wurden inventarisiert, ohne sie zu klicken | keine Zeilentyp-Auswahl, keinen Draft, keine Buchung | `observed`, `read-only`, `no-action-click` |',
        '',
        'Aktuelle Wahrheit: Der Lauf liest nur sichtbare Aktionen. Riskante Aktionen wie `New/Neu`, `Delete`, `Post` oder `Preview` duerfen aus dieser Evidence nicht als freigegeben gelten.',
        '',
      ].join('\n'),
    );

    expect(result.resultStatus).toBe('observed');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const summary = `FIXEDASSETS-067 blocked: ${reason}`;
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
        'Purchase Invoices read-only action inventory did not complete.',
        'No action inventory is claimed.',
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

    await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-067-result.json'), result);
    throw error;
  }
});
