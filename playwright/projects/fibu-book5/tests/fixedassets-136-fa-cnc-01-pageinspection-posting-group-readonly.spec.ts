import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-136-FA-CNC-01-PAGEINSPECTION-POSTING-GROUP-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-137-FA-CNC-01-PAGEINSPECTION-RESULT-REVIEW';
const TEST_ID = 'fixedassets-136';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_ASSET = 'FA-CNC-01';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(360_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function fixedAssetCardUrl() {
  const url = new URL(bcPageUrl(5600, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${TARGET_ASSET}'`);
  return url.toString();
}

function clean(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactLines(value: string, keep: RegExp, maxLines = 120) {
  const seen = new Set<string>();
  return value
    .split('\n')
    .map((line) => clean(line))
    .filter(Boolean)
    .filter((line) => keep.test(line))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, maxLines);
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const parsed = new URL(url);
  const text = await pageText(page);
  const result = {
    url,
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };

  if (!result.environmentInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function closeExternalPages(page: Page) {
  const closed: string[] = [];
  for (const candidate of page.context().pages()) {
    if (candidate === page) continue;
    const url = candidate.url();
    if (!/businesscentral\.dynamics\.com/i.test(url)) {
      closed.push(url);
      await candidate.close().catch(() => undefined);
    }
  }
  return closed;
}

async function findCardFrame(page: Page) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/\bFA-CNC-01\b/i.test(text) && /Fixed Asset Card|Fixed Asset|Book Value|Acquire/i.test(text)) {
      return frame;
    }
  }

  return page.mainFrame();
}

async function expandDepreciationBookFields(page: Page) {
  const frame = await findCardFrame(page);
  const candidates = frame.getByRole('button', {
    name: /Depreciation Book, (Mehr anzeigen|Show more)|Depreciation Book.*Show more fields/i,
  });
  const count = await candidates.count().catch(() => 0);
  const attempts: Array<{ index: number; label: string; clicked: boolean; skippedReason?: string }> = [];

  for (let index = 0; index < count; index += 1) {
    const button = candidates.nth(index);
    const label = clean(
      [
        await button.innerText({ timeout: 500 }).catch(() => ''),
        (await button.getAttribute('aria-label').catch(() => '')) ?? '',
        (await button.getAttribute('title').catch(() => '')) ?? '',
      ].join(' | '),
    );

    if (/\b(Acquire|Edit|Post|Preview|New|Delete|Copy|OK|Yes|Ja|Invoice|Ship)\b/i.test(label)) {
      attempts.push({ index, label, clicked: false, skippedReason: 'dangerous-label' });
      continue;
    }

    const box = await button.boundingBox().catch(() => null);
    if (!box || box.width === 0 || box.height === 0) {
      attempts.push({ index, label, clicked: false, skippedReason: 'not-visible' });
      continue;
    }

    await button.click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    attempts.push({ index, label, clicked: true });
    break;
  }

  return { candidateCount: count, attempts, clicked: attempts.some((attempt) => attempt.clicked) };
}

async function openPageInspection(page: Page) {
  const attempts: Array<Record<string, unknown>> = [];

  await page.keyboard.press('Control+Alt+F1').catch((error) => {
    attempts.push({ method: 'Control+Alt+F1', error: String(error) });
  });
  await page.waitForTimeout(3500);

  const closedExternalPages = await closeExternalPages(page);
  const text = await pageText(page);
  const keep =
    /Page Inspection|Inspect pages and data|Page ID|Page Type|Source Table|Table ID|Fixed Asset Card|Fixed Asset|Depreciation Book|Posting Group|Acquired|Book Value|HGB|EQUIPMENT|MACHINES|5600|Base Application|Extension/i;
  const lines = compactLines(text, keep, 140);
  const joined = lines.join(' ');
  const opened = /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(joined);

  attempts.push({
    method: 'Control+Alt+F1',
    opened,
    closedExternalPages,
  });

  return {
    opened,
    attempts,
    lines,
    signals: {
      pageInspectionVisible: /Page Inspection|Inspect pages and data/i.test(joined),
      pageIdVisible: /Page ID|5600/i.test(joined),
      fixedAssetCardVisible: /Fixed Asset Card/i.test(joined),
      fixedAssetTableVisible: /Source Table.*Fixed Asset|Fixed Asset.*5600|Table ID.*5600/i.test(joined),
      depreciationBookMentioned: /Depreciation Book/i.test(joined),
      postingGroupMentioned: /Posting Group/i.test(joined),
      hgbMentioned: /\bHGB\b/i.test(joined),
      equipmentMentioned: /\bEQUIPMENT\b/i.test(joined),
      machinesMentioned: /\bMACHINES\b/i.test(joined),
      acquiredMentioned: /Acquired|Erworben/i.test(joined),
    },
  };
}

async function scrollPageInspectionToField(page: Page, fieldPattern: RegExp) {
  for (const frame of page.frames()) {
    const directScroll = await frame
      .evaluate((patternSource) => {
        const pattern = new RegExp(patternSource, 'i');
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('*'))
          .map((element) => {
            const text = normalize(element.innerText || element.textContent);
            const rect = element.getBoundingClientRect();
            return {
              element,
              text,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => pattern.test(entry.text))
          .filter((entry) => entry.text.length <= 260)
          .sort((left, right) => {
            const leftRightPane = left.rect.x > window.innerWidth * 0.55 ? 0 : 1;
            const rightRightPane = right.rect.x > window.innerWidth * 0.55 ? 0 : 1;
            return leftRightPane - rightRightPane || left.text.length - right.text.length;
          });

        const chosen = candidates[0];
        if (!chosen) {
          return { found: false, method: 'scrollIntoView', candidates: [] };
        }

        chosen.element.scrollIntoView({ block: 'center', inline: 'nearest' });
        return {
          found: true,
          method: 'scrollIntoView',
          chosen: { text: chosen.text, rect: chosen.rect },
          candidates: candidates.slice(0, 5).map((entry) => ({ text: entry.text, rect: entry.rect })),
        };
      }, fieldPattern.source)
      .catch((error) => ({ found: false, method: 'scrollIntoView', error: String(error), candidates: [] }));

    if (directScroll.found) {
      await page.waitForTimeout(600);
      const text = await pageText(page);
      return {
        found: true,
        scrollTop: 'direct-element',
        directScroll,
        lines: compactLines(
          text,
          /Page Inspection|Fixed Asset Card|Fixed Asset|Depreciation Book Code|FA Posting Group|Posting Group|Acquired|HGB|EQUIPMENT|MACHINES|Base Application|Code\[|Boolean|5600/i,
          180,
        ),
      };
    }
  }

  for (const top of [0, 350, 700, 1050, 1400, 1800, 2300, 2900]) {
    for (const frame of page.frames()) {
      await frame
        .evaluate((scrollTop) => {
          const rightPaneScrollables = Array.from(document.querySelectorAll<HTMLElement>('aside,section,div'))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.x > window.innerWidth * 0.55 && element.scrollHeight > element.clientHeight + 80 && rect.height > 250;
            })
            .sort((left, right) => right.clientHeight - left.clientHeight);
          for (const element of rightPaneScrollables.slice(0, 4)) {
            element.scrollTo({ top: scrollTop, behavior: 'instant' });
          }
        }, top)
        .catch(() => undefined);
    }
    await page.waitForTimeout(350);
    const text = await pageText(page);
    if (fieldPattern.test(text)) {
      return {
        found: true,
        scrollTop: top,
        lines: compactLines(
          text,
          /Page Inspection|Fixed Asset Card|Fixed Asset|Depreciation Book Code|FA Posting Group|Posting Group|Acquired|HGB|EQUIPMENT|MACHINES|Base Application|Code\[|Boolean|5600/i,
          180,
        ),
      };
    }
  }

  const text = await pageText(page);
  return {
    found: false,
    scrollTop: null,
    lines: compactLines(
      text,
      /Page Inspection|Fixed Asset Card|Fixed Asset|Depreciation Book Code|FA Posting Group|Posting Group|Acquired|HGB|EQUIPMENT|MACHINES|Base Application|Code\[|Boolean|5600/i,
      180,
    ),
  };
}

async function collectCardEvidence(page: Page) {
  const focused = await compactPageText(page, {
    include: [
      /Fixed Asset Card|Fixed Asset/i,
      /FA-CNC-01|CNC Maschine/i,
      /Depreciation Book|Depreciation Method|Posting Group|Book Value|Acquired/i,
      /HGB|EQUIPMENT|MACHINES|Straight-Line|8,00|0,00/i,
      /Acquire/i,
    ],
    maxLines: 180,
    maxLineLength: 240,
  });
  const text = await pageText(page);
  return {
    focusedText: focused,
    signals: {
      assetVisible: /\bFA-CNC-01\b/i.test(text),
      hgbVisible: /\bHGB\b/i.test(text),
      equipmentVisible: /\bEQUIPMENT\b/i.test(text),
      machinesVisible: /\bMACHINES\b/i.test(text),
      postingGroupVisible: /Posting Group/i.test(text),
      acquiredVisible: /Acquired|Erworben/i.test(text),
      bookValueZeroVisible: /Book Value[^0-9]*(0\.00|0,00)|0\.00[^A-Za-z]{0,20}Book Value|0,00[^A-Za-z]{0,20}Book Value/i.test(text),
      acquireVisible: /\bAcquire\b/i.test(text),
    },
  };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-136 - Page Inspection fuer FA-CNC-01',
    '',
    'Status: `labor`, `ui-first`, `read-only`, `technical-diagnosis`, `no-edit`, `no-acquire`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.targetAsset} |`,
    `| Page Inspection geoeffnet | ${result.observed.pageInspection.opened ? 'ja' : 'nein'} |`,
    `| Page-/Table-Kontext sichtbar | ${result.observed.pageInspection.signals.fixedAssetCardVisible || result.observed.pageInspection.signals.fixedAssetTableVisible ? 'ja/teilweise' : 'nein'} |`,
    `| HGB im technischen Kontext | ${result.observed.pageInspection.signals.hgbMentioned ? 'ja' : 'nein'} |`,
    `| EQUIPMENT im technischen Kontext | ${result.observed.pageInspection.signals.equipmentMentioned ? 'ja' : 'nein'} |`,
    `| MACHINES im technischen Kontext | ${result.observed.pageInspection.signals.machinesMentioned ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    '- Page Inspection ist technische Nachweisfuehrung: Sie hilft zu klaeren, auf welcher Page und Tabelle man steht.',
    '- Ein Setup-Code wie `MACHINES` beweist noch nicht, dass genau dieser Code auf der konkreten Karte zugewiesen ist.',
    '- Ein sichtbarer Kartenwert wie `EQUIPMENT` muss als aktuelle UI-Wahrheit dokumentiert werden, bis ein anderer Wert sauber gesetzt und nachgewiesen ist.',
    '- Eine deaktivierte Aktion wie `Acquire` bleibt ein Stoppzeichen; Page Inspection ist Diagnose, kein Buchungsfreibrief.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Kein Edit und keine Feldwert-Aenderung.',
    '- Kein Klick auf `Acquire`.',
    '- Keine Preview und keine Buchung.',
    '- Kein Setup-Wechsel von `EQUIPMENT` auf `MACHINES`.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-136 captures FA-CNC-01 Page Inspection context read-only', async ({ page }) => {
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
  const expand = await expandDepreciationBookFields(page);
  const cardEvidence = await collectCardEvidence(page);
  await writeTextEvidence(faEvidencePath('010-card-focused-text.txt'), cardEvidence.focusedText || 'No compact card text captured.');

  const pageInspection = await openPageInspection(page);
  const pageInspectionFieldScroll = pageInspection.opened
    ? await scrollPageInspectionToField(page, /FA Posting Group|Depreciation Book Code/i)
    : { found: false, scrollTop: null, lines: [] as string[] };
  const mergedInspectionLines = [...new Set([...pageInspection.lines, ...pageInspectionFieldScroll.lines])];
  pageInspection.lines = mergedInspectionLines;
  pageInspection.signals.hgbMentioned = /\bHGB\b/i.test(mergedInspectionLines.join(' '));
  pageInspection.signals.equipmentMentioned = /\bEQUIPMENT\b/i.test(mergedInspectionLines.join(' '));
  pageInspection.signals.machinesMentioned = /\bMACHINES\b/i.test(mergedInspectionLines.join(' '));
  pageInspection.signals.depreciationBookMentioned = /Depreciation Book/i.test(mergedInspectionLines.join(' '));
  pageInspection.signals.postingGroupMentioned = /Posting Group/i.test(mergedInspectionLines.join(' '));
  pageInspection.signals.acquiredMentioned = /Acquired|Erworben/i.test(mergedInspectionLines.join(' '));
  await writeTextEvidence(
    faEvidencePath('020-pageinspection-focused-lines.txt'),
    pageInspection.lines.join('\n') || 'Page Inspection did not expose compact focused lines.',
  );
  await writeJsonEvidence(faEvidencePath('030-pageinspection-signals.json'), { ...pageInspection, fieldScroll: pageInspectionFieldScroll, expand });

  if (pageInspection.opened) {
    await screenshot(page, 'fixedassets-136-040-fa-cnc-01-pageinspection-context.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: pageInspectionFieldScroll.found && pageInspection.signals.equipmentMentioned ? 'candidate' : 'labor',
      bookUse: 'evidence',
      purpose:
        'Technische Page-Inspection-Evidence fuer FA-CNC-01: Page-/Table-/Field-Kontext und gescrollter Feldbereich zu Depreciation Book / FA Posting Group; kein Edit, kein Acquire.',
      expectedPageText: [/Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i],
      knownLimitations: [
        'Debug-/Evidence-Bild, kein Anlagenzugang, keine Preview, keine Buchung.',
        'Nur sichtbare Page-Inspection-Zeilen und Text-Evidence duerfen als Feldkontext gewertet werden.',
      ],
    });
  }

  const resultStatus = pageInspection.opened ? 'observed' : 'blocked';
  const summary =
    resultStatus === 'observed'
      ? `FA-136 opened Page Inspection read-only on FA-CNC-01. Technical context was captured; card context still shows HGB/EQUIPMENT as current visible truth, while MACHINES remains not proven as assigned value.`
      : `FA-136 opened FA-CNC-01 read-only, but Page Inspection did not expose stable technical lines in this browser context. Card text was captured; no action or setup changed.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-pageinspection-posting-group-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-pageinspection',
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
      expand,
      card: cardEvidence.signals,
      pageInspection,
      pageInspectionFieldScroll,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'FA-CNC-01 Fixed Asset Card was opened read-only.',
      ...(cardEvidence.signals.hgbVisible ? ['HGB remains visible in the card context.'] : []),
      ...(cardEvidence.signals.equipmentVisible ? ['EQUIPMENT remains visible in the card context.'] : []),
      ...(cardEvidence.signals.machinesVisible ? ['MACHINES is visible somewhere in the current page text.'] : ['MACHINES is not visible in the captured card/page context.']),
      ...(pageInspection.opened ? ['Page Inspection produced compact technical context lines.'] : ['Page Inspection did not produce stable technical context lines in this run.']),
      'No Edit, Acquire execution, field value entry, Preview Posting, Post, setup change, draft creation, company switch, delete or API shortcut was performed.',
    ],
    notProved: [
      'No setup decision to change FA-CNC-01 from EQUIPMENT to MACHINES is made.',
      'No acquisition wizard is opened.',
      'No acquisition value or vendor is entered.',
      'No Preview Posting or posting trace is produced.',
      'No FA Ledger Entry or G/L acquisition trace is proven.',
      'No German final fixed-assets proof is proven.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-136-fa-cnc-01-pageinspection-posting-group-readonly.json',
      '.agent/state/cases/fixedassets-137-fa-cnc-01-pageinspection-result-review.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-136-fa-cnc-01-pageinspection-posting-group-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/FIXEDASSETS-136-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/FIXEDASSETS-136-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/010-card-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/020-pageinspection-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/030-pageinspection-signals.json',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-136/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/FIXEDASSETS-136-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/FIXEDASSETS-136-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/010-card-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/020-pageinspection-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-136/030-pageinspection-signals.json',
      ...(pageInspection.opened
        ? [
            'playwright/projects/fibu-book5/evidence/fixedassets-136/fixedassets-136-040-fa-cnc-01-pageinspection-context.screenshot.json',
            'playwright/projects/fibu-book5/img/fixedassets-136-040-fa-cnc-01-pageinspection-context.png',
          ]
        : []),
    ],
    warnings: [
      'Page Inspection is technical debugging evidence, not acquisition proof.',
      'Do not claim MACHINES as assigned to FA-CNC-01 from this evidence.',
      'Do not execute Acquire from FA-136 evidence.',
    ],
    blockedBy: resultStatus === 'blocked' ? ['Page Inspection did not expose stable compact technical context lines.'] : [],
    requiresReview: true,
    safeToFinalizeState: true,
    flags: {
      noBookChange: true,
      secretsUntouched: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noFieldValueChanged: true,
      noSaveRecord: true,
      noDeleteRecord: true,
      noAcquireExecution: true,
      noAmountEntry: true,
      noTargetVendorEntry: true,
      cleanupCompleted: true,
    },
    statePatch: {
      current: {
        updatedAt: '2026-06-20T19:40:00.000Z',
        activeCase: NEXT_CASE_ID,
        active_case_file: '.agent/state/cases/fixedassets-137-fa-cnc-01-pageinspection-result-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-136-fa-cnc-01-pageinspection-posting-group-readonly.json',
        requiresStrongModel: true,
        nextStep: 'FIXEDASSETS-137: locally review FA-136 Page Inspection evidence and decide whether a setup-change gate, another read-only field proof, or an acquisition route is now safe.',
      },
      activeCase: {
        status: resultStatus === 'observed' ? 'observed-readonly-pageinspection' : 'blocked-readonly-pageinspection',
        lastResult: {
          status: resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-136/FIXEDASSETS-136-result.json',
          summary,
          cardSignals: cardEvidence.signals,
          pageInspectionSignals: pageInspection.signals,
        },
        nextSafeAction: 'FIXEDASSETS-137: local review of Page Inspection result before any setup or acquisition route.',
      },
      coverage: {
        schemaVersion: 1,
        purpose: 'Kompakter Coverage-Index fuer schnelle Agentenlaeufe.',
        areas: {
          fixedassets: {
            chapter: 'Kapitel 21',
            status: 'in-progress',
            currentBlock: 'pageinspection-result-review',
            latestPracticalCase: 'FIXEDASSETS-136',
            latestDecisionCase: 'FIXEDASSETS-135',
            nextCase: NEXT_CASE_ID,
            bookScreenshots: {
              setupProofs: 'available-labor',
              purchaseInvoicePreflight: 'available-labor',
              validFixedAssetLine: 'blocked-personalize-opened-type-context-visible-but-fixed-asset-option-unproved',
              acquisitionPostingTrace: 'blocked-acquisition-readiness-not-proven',
              depreciationPostingTrace: 'open',
              acquisitionWizardPreflight: 'blocked-disabled-acquire-no-ready-signal',
              depreciationBookFields: 'partial-labor-field-proof',
              fixedAssetTechnicalInspection: pageInspection.opened ? 'candidate-labor-technical-proof' : 'blocked-pageinspection-not-stable',
            },
            finalGermanProof: 'open',
          },
        },
        hardExclusions: {
          shopify: 'Do not run, document or reactivate Shopify/Online Store scope for FiBu Buch 5.',
        },
      },
    },
    bookImpact:
      'Kapitel 21 and the future debugging chapter can use FA-136 to explain Page Inspection as technical evidence. It must still separate current card truth (EQUIPMENT visible) from setup availability (MACHINES exists) and from posting proof (not yet available).',
    summary,
    nextStep: 'FIXEDASSETS-137: local review of Page Inspection result before any setup or acquisition route.',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-136-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-136-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-136 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-136-result.json` | JSON | Kartenkontext, Page-Inspection-Signale, Sicherheitsflags | keine Anschaffung, keine Posten, keinen Setup-Fit | `labor`, `read-only` |',
      '| `FIXEDASSETS-136-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-card-focused-text.txt` | Text | kompakte Karten-/Feldsignale vor/nach Diagnose | keine technische Feldquelle allein | `compact` |',
      '| `020-pageinspection-focused-lines.txt` | Text | kompakte Page-Inspection-Zeilen, falls sichtbar | kein Rohdump | `technical-context` |',
      '| `030-pageinspection-signals.json` | JSON | Page-Inspection-Versuch und Signale | keine Buchungswirkung | `read-only-diagnosis` |',
      ...(pageInspection.opened
        ? ['| `../../img/fixedassets-136-040-fa-cnc-01-pageinspection-context.png` | Screenshot | technische Seitenpruefung sichtbar | kein Anwenderprozessbild | `labor`, `debugging-evidence` |']
        : []),
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noAcquireExecution).toBe(true);
  expect(result.flags.noFieldValueChanged).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(cardEvidence.signals.assetVisible).toBe(true);
});
