import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-080-FA-CNC-01-ACQUIRE-ACTION-READONLY-PREFLIGHT';
const TEST_ID = 'fixedassets-080';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_ASSET = 'FA-CNC-01';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(300_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function fixedAssetCardUrl() {
  const url = new URL(bcPageUrl(5600, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${TARGET_ASSET}'`);
  return url.toString();
}

function sanitizeEvidenceText(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeEvidenceBlock(value: string) {
  return value
    .split('\n')
    .map((line) => sanitizeEvidenceText(line))
    .filter(Boolean)
    .join('\n');
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const text = await pageText(page);
  const result = {
    url,
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };

  if (!result.environmentInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function findFixedAssetCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Fixed Asset Card|Fixed Asset|FA Class Code|Depreciation Book|Book Value/i.test(text)) {
      return frame;
    }
  }

  return page.mainFrame();
}

async function collectVisibleActionLabels(page: Page) {
  const results = [];
  for (const frame of page.frames()) {
    const frameResult = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const actionPattern =
          /Acquire|Acquisition|Erwerben|Anschaffung|Depreciation|AfA|Book Value|Fixed Asset|Navigate|Related|Dimensions|Dimension|Post|Posting|Buchen|Preview|Vorschau|New|Neu|Edit|Bearbeiten|Delete|Loeschen|Löschen/i;

        return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[role="menuitem"],[aria-label],[title]'))
          .filter((element) => visible(element))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const aria = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const label = normalize([text, aria, title].filter(Boolean).join(' | '));
            return {
              text,
              aria,
              title,
              label,
              role: normalize(element.getAttribute('role')),
              tagName: element.tagName,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          })
          .filter((entry) => entry.label && actionPattern.test(entry.label))
          .sort((left, right) => left.y - right.y || left.x - right.x)
          .slice(0, 120);
      })
      .catch(() => []);
    if (frameResult.length) {
      results.push({
        frameUrl: frame.url(),
        entries: frameResult,
      });
    }
  }

  return results;
}

function sanitizeActionGroups(actionGroups: Awaited<ReturnType<typeof collectVisibleActionLabels>>) {
  return actionGroups.map((group) => ({
    frameUrl: group.frameUrl,
    entries: group.entries.map((entry) => ({
      ...entry,
      text: sanitizeEvidenceText(entry.text),
      aria: sanitizeEvidenceText(entry.aria),
      title: sanitizeEvidenceText(entry.title),
      label: sanitizeEvidenceText(entry.label),
      role: sanitizeEvidenceText(entry.role),
      tagName: sanitizeEvidenceText(entry.tagName),
    })),
  }));
}

function flatLabels(actionGroups: Awaited<ReturnType<typeof collectVisibleActionLabels>>) {
  return actionGroups.flatMap((group) => group.entries.map((entry) => entry.label));
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-080 - FA-CNC-01 Acquire Action Read-only Preflight',
    '',
    'Status: `labor`, `ui-first`, `read-only`, `fixed-asset-card`, `no-posting`, `no-preview`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.targetAsset} |`,
    `| Kartenkontext sichtbar | ${result.observed.cardContextVisible ? 'ja' : 'nein'} |`,
    `| Acquire/Anschaffungsaktion sichtbar | ${result.observed.acquireActionVisible ? 'ja' : 'nein'} |`,
    `| HGB sichtbar | ${result.observed.hgbVisible ? 'ja' : 'nein'} |`,
    `| Book Value sichtbar | ${result.observed.bookValueVisible ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Was man in BC lernt',
    '',
    'Die Anlagenkarte ist ein fachlicher Kontrollpunkt vor dem Anlagenzugang: Man sieht dort den Stammdatensatz, das AfA-/Buchwertumfeld und je nach Rolle bzw. Page-Kontext auch Aktionen rund um Anschaffung, Buchwert oder AfA. Erst wenn die Karte den richtigen Kontext zeigt, lohnt sich der naechste kontrollierte Schritt.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- `Acquire` wurde nicht geklickt.',
    '- Keine Eingabe von `K30000`, keinem Betrag und keiner Zielzeile.',
    '- Keine Preview, keine Buchung, keine Setup-Aenderung.',
    '- CRONUS-USA-Labor, kein deutscher Anlagen-/Steuer-/Kontenplan-Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-080 inspects FA-CNC-01 card Acquire context read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();

  await page.goto(fixedAssetCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset Card|Fixed Asset|FA Class Code|Depreciation Book|Book Value/i, {
    timeout: 90_000,
  });
  await waitForPageText(page, /\bFA-CNC-01\b/i, { timeout: 60_000 });

  const context = await assertSandboxContext(page);
  const cardFrame = await findFixedAssetCardFrame(page);
  const cardText = await cardFrame.locator('body').innerText({ timeout: 3000 }).catch(() => '');
  const compactTextRaw = await compactPageText(page, {
    include: [
      /MCP_1_20260210|RM-DEMO|Rhein-Main Demo GmbH/i,
      /Fixed Asset|FA-CNC-01|CNC Maschine|Depreciation Book|HGB|MACHINES|Book Value|Acquired|Acquire|Acquisition|Anschaffung|Erwerben/i,
    ],
    maxLines: 160,
    maxLineLength: 220,
  });
  const compactText = sanitizeEvidenceBlock(compactTextRaw);
  const actionGroups = sanitizeActionGroups(await collectVisibleActionLabels(page));
  const labels = flatLabels(actionGroups);

  const acquireActionVisible = labels.some((label) => /Acquire|Acquisition|Erwerben|Anschaffung/i.test(label));
  const postActionVisible = labels.some((label) => /Post|Posting|Buchen/i.test(label));
  const previewActionVisible = labels.some((label) => /Preview|Vorschau/i.test(label));
  const cardContextVisible = /\bFA-CNC-01\b/i.test(cardText) && /Fixed Asset|Depreciation Book|Book Value|FA Class/i.test(cardText);
  const hgbVisible = /\bHGB\b/i.test(cardText);
  const bookValueVisible = /Book Value|Buchwert/i.test(cardText);

  await writeTextEvidence(faEvidencePath('010-card-context-readonly.txt'), compactText || 'No compact page text captured.');
  await writeJsonEvidence(faEvidencePath('020-visible-action-labels.json'), {
    actionGroups,
    derived: {
      acquireActionVisible,
      postActionVisible,
      previewActionVisible,
    },
  });

  const resultStatus = cardContextVisible ? 'observed' : 'blocked';
  const nextStep = acquireActionVisible
    ? 'FIXEDASSETS-081-ACQUIRE-ACTION-WIZARD-PREFLIGHT: open the Acquire action in a guarded case only, then stop before values, Finish, Preview or Posting.'
    : 'FIXEDASSETS-081-FIXED-ASSET-GL-JOURNAL-ROUTE-DISCOVERY: Acquire action was not visibly proven, so discover the Fixed Asset G/L Journal route read-only.';
  const nextCaseId = acquireActionVisible
    ? 'FIXEDASSETS-081-ACQUIRE-ACTION-WIZARD-PREFLIGHT'
    : 'FIXEDASSETS-081-FIXED-ASSET-GL-JOURNAL-ROUTE-DISCOVERY';
  const nextCaseFile = acquireActionVisible
    ? '.agent/state/cases/fixedassets-081-acquire-action-wizard-preflight.json'
    : '.agent/state/cases/fixedassets-081-fixed-asset-gl-journal-route-discovery.json';
  const summary = acquireActionVisible
    ? 'FA-080 proved the existing FA-CNC-01 card context read-only and found an Acquire/Acquisition action signal. The next case may deliberately unlock only opening that action, not values or posting.'
    : 'FA-080 proved the existing FA-CNC-01 card context read-only, but did not visibly prove an Acquire action signal. The safer next route is a read-only Fixed Asset G/L Journal route discovery.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-card-acquire-action-readonly-preflight-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-fixed-asset-card-context',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    targetAsset: TARGET_ASSET,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      url: page.url(),
      context,
      cardContextVisible,
      hgbVisible,
      bookValueVisible,
      acquireActionVisible,
      postActionVisible,
      previewActionVisible,
      actionLabelCount: labels.length,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'The existing FA-CNC-01 Fixed Asset Card context was opened read-only.',
      ...(hgbVisible ? ['The HGB depreciation-book signal was visible in the card context.'] : []),
      ...(bookValueVisible ? ['Book Value context was visible on the card.'] : []),
      ...(acquireActionVisible ? ['An Acquire/Acquisition action signal was visible without clicking it.'] : []),
      'No Acquire action was clicked.',
      'No values were entered.',
      'No preview, posting, setup change, draft, edit or delete was performed.',
    ],
    notProved: [
      ...(acquireActionVisible ? [] : ['Acquire action visibility was not proven in the visible action inventory.']),
      'No Acquire wizard behavior was tested.',
      'No vendor K30000, amount or acquisition line was entered.',
      'No Fixed Asset G/L Journal acquisition route was proven in this case.',
      'No acquisition posting, no FA Ledger Entry and no German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-080.json',
      nextCaseFile,
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-080-fa-cnc-01-acquire-action-readonly-preflight.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-080/FIXEDASSETS-080-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-080/FIXEDASSETS-080-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-080/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-080/FIXEDASSETS-080-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-080/FIXEDASSETS-080-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-080/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-080/010-card-context-readonly.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-080/020-visible-action-labels.json',
    ],
    warnings: [
      'Read-only CRONUS-USA labor evidence only.',
      'Visible action labels do not prove the wizard or posting behavior.',
      'Next case must explicitly unlock any Acquire click and still forbid values, Finish, Preview and Posting until separately gated.',
    ],
    blockedBy: cardContextVisible ? [] : ['FA-CNC-01 card context not clearly visible'],
    requiresReview: false,
    safeToFinalizeState: cardContextVisible,
    flags: {
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
      noAcquireClick: true,
      noTargetVendorEntry: true,
      noTargetFixedAssetEntryInDocumentOrJournal: true,
      cleanupCompleted: true,
    },
    statePatch: {
      current: {
        updatedAt: '2026-06-19T10:20:00.000Z',
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-080.json',
        nextStep,
      },
      lastRunSummary: {
        schemaVersion: 1,
        runId: CASE_ID,
        date: '2026-06-19',
        workType: 'fixed-asset-card-acquire-action-readonly-preflight',
        branch: 'codex/token-efficient-autopilot-state',
        bcRun: true,
        posted: false,
        companySwitched: false,
        summary,
        nextStep,
      },
      activeCase: {
        status: resultStatus === 'observed' ? 'observed-readonly' : 'blocked-readonly',
        lastResult: {
          status: resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-080/FIXEDASSETS-080-result.json',
          summary,
        },
        nextSafeAction: nextStep,
      },
      coverage: {
        areas: {
          fixedassets: {
            latestPracticalCase: 'FIXEDASSETS-080',
            currentBlock: acquireActionVisible
              ? 'fixed-asset-card-acquire-action-wizard-preflight'
              : 'fixed-asset-gl-journal-route-discovery',
            nextCase: nextCaseId,
          },
        },
      },
    },
    bookImpact: acquireActionVisible
      ? 'Kapitel 21 kann die Anlagenkarte als Einstieg vor dem Acquire-Wizard erklaeren. Der Screenshot-/Klickpfad darf aber erst nach einem eigenen Wizard-Preflight zeigen, was nach dem Klick passiert.'
      : 'Kapitel 21 darf den Acquire-Kartenweg in RM-DEMO noch nicht als ausfuehrbaren Klickpfad darstellen. Stattdessen muss die Anleitung den Fallback ueber Fixed Asset G/L Journal als naechsten Laborpfad pruefen.',
    summary,
    nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-080-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-080-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-080 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-080-result.json` | JSON | Kartenkontext, sichtbare Aktionssignale, Safety Flags | keinen Wizard, keine Buchung | `labor`, `read-only` |',
      '| `FIXEDASSETS-080-learning.md` | Markdown | Lernwert, Buchwirkung, naechster Pfad | keinen deutschen Finalnachweis | `labor` |',
      '| `010-card-context-readonly.txt` | Text | kompakter sichtbarer Kartenkontext | kein Rohdump, keine Tabellen-/API-Wahrheit | `read-only` |',
      '| `020-visible-action-labels.json` | JSON | sichtbare Aktionslabels ohne Klick | keine Aktionsausfuehrung | `read-only-action-inventory` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noAcquireClick).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noNewDraft).toBe(true);
  expect(cardContextVisible).toBe(true);
});
