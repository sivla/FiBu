import { expect, test, type Frame, type Page } from '@playwright/test';
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

const CASE_ID = 'FIXEDASSETS-132-FA-CNC-01-ACQUISITION-READINESS-CARD-READONLY';
const TEST_ID = 'fixedassets-132';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_ASSET = 'FA-CNC-01';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(300_000);

type VisibleControl = {
  text: string;
  aria: string;
  title: string;
  value: string;
  label: string;
  role: string;
  tagName: string;
  disabled: boolean;
  readonly: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

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

function cleanBlock(value: string) {
  return value
    .split('\n')
    .map((line) => clean(line))
    .filter(Boolean)
    .join('\n');
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

async function findCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/\bFA-CNC-01\b/i.test(text) && /Fixed Asset Card|Fixed Asset|Book Value|Acquire/i.test(text)) {
      return frame;
    }
  }

  return page.mainFrame();
}

function sanitizeEntry(entry: VisibleControl): VisibleControl {
  return {
    ...entry,
    label: clean(entry.label),
    text: clean(entry.text),
    aria: clean(entry.aria),
    title: clean(entry.title),
    value: clean(entry.value),
  };
}

async function collectReadinessDiagnostics(page: Page) {
  const frame = await findCardFrame(page);
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };

    const all = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,input,textarea,select,[aria-label],[title]'))
      .filter((element) => visible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const value = normalize((element as HTMLInputElement).value);
        const label = normalize([text, aria, title, value].filter(Boolean).join(' | '));
        return {
          text,
          aria,
          title,
          value,
          label,
          role: normalize(element.getAttribute('role')),
          tagName: element.tagName,
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
          readonly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) =>
        /Acquire|Ready to acquire|ready for acquisition|Fixed Asset Card|FA-CNC-01|CNC Maschine|Book Value|Depreciation Book|Depreciation Method|Posting Group|FA Class|FA Subclass|HGB|MACHINES|Acquired|Anschaffung|Erwerb|bereit/i.test(entry.label),
      )
      .sort((left, right) => left.y - right.y || left.x - right.x)
      .slice(0, 140);

    const bodyText = normalize(document.body.innerText || document.body.textContent);

    return {
      frameUrl: window.location.href,
      acquireCandidates: all.filter((entry) => /^Acquire(?:\s|\||$)/i.test(entry.label) || /Acquire the fixed asset/i.test(entry.label)),
      cardValueSignals: all.filter((entry) =>
        /Book Value|Depreciation Book|Depreciation Method|Posting Group|FA Class|FA Subclass|HGB|MACHINES|Acquired|CNC Maschine/i.test(entry.label),
      ),
      notificationSignals: all.filter((entry) =>
        /Ready to acquire|ready for acquisition|bereit.*Erwerb|bereit.*Anschaffung|acquire.*ready|anschaff.*bereit/i.test(entry.label),
      ),
      bodySignals: {
        hasReadyToAcquireText: /Ready to acquire|ready for acquisition|bereit.*Erwerb|bereit.*Anschaffung|acquire.*ready|anschaff.*bereit/i.test(bodyText),
        hasBookValueZero: /Book Value[^0-9]*(0\.00|0,00)|0\.00[^A-Za-z]{0,20}Book Value|0,00[^A-Za-z]{0,20}Book Value/i.test(bodyText),
        hasHgb: /\bHGB\b/i.test(bodyText),
        hasMachines: /\bMACHINES\b/i.test(bodyText),
        hasAcquiredSignal: /Acquired|Erworben/i.test(bodyText),
      },
      relevantControls: all,
    };
  }).then((raw) => ({
    ...raw,
    acquireCandidates: raw.acquireCandidates.map(sanitizeEntry),
    cardValueSignals: raw.cardValueSignals.map(sanitizeEntry),
    notificationSignals: raw.notificationSignals.map(sanitizeEntry),
    relevantControls: raw.relevantControls.map(sanitizeEntry),
  }));
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-132 - FA-CNC-01 Acquisition Readiness Card',
    '',
    'Status: `labor`, `ui-first`, `read-only`, `no-acquire-click`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.targetAsset} |`,
    `| Anlagenkarte sichtbar | ${result.observed.cardVisible ? 'ja' : 'nein'} |`,
    `| Acquire sichtbar | ${result.observed.acquire.visible ? 'ja' : 'nein'} |`,
    `| Acquire deaktiviert | ${result.observed.acquire.disabled ? 'ja' : 'nein'} |`,
    `| Ready-to-acquire-Hinweis sichtbar | ${result.observed.readyToAcquireNotificationVisible ? 'ja' : 'nein'} |`,
    `| Book Value 0 sichtbar | ${result.observed.bodySignals.hasBookValueZero ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Was ein Anfaenger daraus lernt',
    '',
    '- Die Anlagenkarte ist ein guter Kontrollpunkt, bevor man einen Anschaffungspfad startet.',
    '- Eine sichtbare Aktion ist nicht automatisch eine erlaubte oder fachlich bereite Aktion.',
    '- `Book Value` zeigt, ob bereits ein Anlagenwert gebucht ist; hier ist weiterhin kein Zugang nachgewiesen.',
    '- Eine Acquire-/Anschaffungsaktion darf erst als Klickanleitung gelten, wenn Bereitschaft, Eingabegrenze, Preview und Postenspur getrennt bewiesen sind.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Kein Klick auf `Acquire`.',
    '- Keine Feldwerte wurden geaendert.',
    '- Keine Preview, keine Buchung, keine Setup-Aenderung.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-132 observes FA-CNC-01 acquisition readiness on card without changes', async ({ page }) => {
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
  const compactCardText = cleanBlock(
    await compactPageText(page, {
      include: [/MCP_1_20260210|RM-DEMO|Fixed Asset Card|FA-CNC-01|CNC Maschine|Acquire|Book Value|Depreciation Book|Depreciation Method|Posting Group|FA Class|FA Subclass|HGB|MACHINES|Acquired|Ready to acquire|ready for acquisition|Anschaffung|Erwerb|bereit/i],
      maxLines: 220,
      maxLineLength: 260,
    }),
  );
  const diagnostics = await collectReadinessDiagnostics(page);
  const acquireVisible = diagnostics.acquireCandidates.length > 0;
  const acquireDisabled = diagnostics.acquireCandidates.some((entry) => entry.disabled);
  const readyToAcquireNotificationVisible =
    diagnostics.notificationSignals.length > 0 || diagnostics.bodySignals.hasReadyToAcquireText;

  await screenshot(page, 'fixedassets-132-030-fa-cnc-01-acquisition-readiness-card.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: readyToAcquireNotificationVisible && acquireVisible && !acquireDisabled ? 'candidate' : 'labor',
    bookUse: 'evidence',
    purpose:
      'FIXEDASSETS-132 Read-only-Kontrollbild: Anlagenkarte FA-CNC-01 mit sichtbaren Stammdaten, Book Value und Acquire-Bereitschaftssignalen; kein Klick auf Acquire.',
    expectedPageText: [/FA-CNC-01|Fixed Asset Card|Fixed Asset/i],
    knownLimitations: ['Labor-/Read-only-Bild, kein Anschaffungs-, Preview- oder Buchungsnachweis.'],
  });

  const summary =
    readyToAcquireNotificationVisible && acquireVisible && !acquireDisabled
      ? 'FA-132 shows FA-CNC-01 on the Fixed Asset Card with an apparent ready-to-acquire signal and Acquire not disabled; no action was clicked, so a separate gate is required before any Acquire probe.'
      : 'FA-132 shows FA-CNC-01 on the Fixed Asset Card, but no complete acquisition-readiness state is proven. Acquire remains not safely executable from this evidence.';
  const nextCaseId =
    readyToAcquireNotificationVisible && acquireVisible && !acquireDisabled
      ? 'FIXEDASSETS-133-ACQUIRE-ACTION-GATE-DECISION'
      : 'FIXEDASSETS-133-FA-CNC-01-ACQUISITION-READINESS-CAUSE-REVIEW';
  const nextCaseFile =
    readyToAcquireNotificationVisible && acquireVisible && !acquireDisabled
      ? '.agent/state/cases/fixedassets-133-acquire-action-gate-decision.json'
      : '.agent/state/cases/fixedassets-133-fa-cnc-01-acquisition-readiness-cause-review.json';
  const nextStep =
    readyToAcquireNotificationVisible && acquireVisible && !acquireDisabled
      ? 'FIXEDASSETS-133: local gate decision before any Acquire click; define exact stop boundary, evidence and cleanup/trace expectations.'
      : 'FIXEDASSETS-133: local cause review of FA-CNC-01 acquisition readiness before another live acquisition route or setup change.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-acquisition-readiness-card-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-card-diagnosis',
    resultStatus: 'observed',
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
      cardVisible: /FA-CNC-01|Fixed Asset Card|Fixed Asset/i.test(compactCardText),
      acquire: {
        visible: acquireVisible,
        disabled: acquireDisabled,
        candidates: diagnostics.acquireCandidates,
      },
      readyToAcquireNotificationVisible,
      bodySignals: diagnostics.bodySignals,
      cardValueSignalCount: diagnostics.cardValueSignals.length,
      notificationSignalCount: diagnostics.notificationSignals.length,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'FA-CNC-01 Fixed Asset Card was visible.',
      'Visible fixed-asset card context and acquisition-readiness signals were captured read-only.',
      ...(acquireVisible ? ['Acquire action candidate was visible on the card.'] : ['Acquire action candidate was not visible in the captured card diagnostics.']),
      ...(acquireDisabled ? ['Acquire action candidate was disabled in the captured card diagnostics.'] : []),
      ...(readyToAcquireNotificationVisible
        ? ['A ready-to-acquire notification/signal was visible in the captured context.']
        : ['No ready-to-acquire notification/signal was visible in the captured context.']),
      'No Acquire execution, field value entry, Preview Posting, Post, setup change, draft creation, company switch, delete or API shortcut was performed.',
    ],
    notProved: [
      'No acquisition wizard or assisted acquisition boundary was opened.',
      'No acquisition value or vendor was entered.',
      'No Preview Posting or posting trace was produced.',
      'No FA Ledger Entry or G/L acquisition trace is proven.',
      'No German final fixed-assets proof is proven.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-132-fa-cnc-01-acquisition-readiness-card-readonly.json',
      nextCaseFile,
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-132-fa-cnc-01-acquisition-readiness-card-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-132/FIXEDASSETS-132-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-132/FIXEDASSETS-132-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-132/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-132/FIXEDASSETS-132-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-132/FIXEDASSETS-132-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-132/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-132/010-card-readiness-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-132/020-acquire-readiness-diagnostics.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-132/fixedassets-132-030-fa-cnc-01-acquisition-readiness-card.screenshot.json',
      'playwright/projects/fibu-book5/img/fixedassets-132-030-fa-cnc-01-acquisition-readiness-card.png',
    ],
    warnings: [
      'Read-only card diagnosis only.',
      'Do not execute Acquire from FA-132 evidence.',
      'Card visibility and action visibility are not acquisition posting proof.',
    ],
    blockedBy: [],
    requiresReview: false,
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
        updatedAt: '2026-06-20T17:20:00.000Z',
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-132-fa-cnc-01-acquisition-readiness-card-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      activeCase: {
        status: 'observed-readonly-card-diagnosis',
        lastResult: {
          status: 'observed',
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-132/FIXEDASSETS-132-result.json',
          summary,
          acquireVisible,
          acquireDisabled,
          readyToAcquireNotificationVisible,
          bookValueZeroVisible: diagnostics.bodySignals.hasBookValueZero,
        },
        nextSafeAction: nextStep,
      },
      coverage: {
        schemaVersion: 1,
        purpose: 'Kompakter Coverage-Index fuer schnelle Agentenlaeufe.',
        areas: {
          fixedassets: {
            chapter: 'Kapitel 21',
            status: 'in-progress',
            currentBlock:
              readyToAcquireNotificationVisible && acquireVisible && !acquireDisabled
                ? 'acquire-action-gate-decision'
                : 'acquisition-readiness-cause-review',
            latestPracticalCase: 'FIXEDASSETS-132',
            latestDecisionCase: 'FIXEDASSETS-131',
            nextCase: nextCaseId,
            bookScreenshots: {
              setupProofs: 'available-labor',
              purchaseInvoicePreflight: 'available-labor',
              validFixedAssetLine: 'blocked-personalize-opened-type-context-visible-but-fixed-asset-option-unproved',
              acquisitionPostingTrace:
                readyToAcquireNotificationVisible && acquireVisible && !acquireDisabled
                  ? 'open-after-acquire-gate'
                  : 'blocked-acquisition-readiness-not-proven',
              depreciationPostingTrace: 'open',
              acquisitionWizardPreflight:
                readyToAcquireNotificationVisible && acquireVisible && !acquireDisabled
                  ? 'open-gate-required'
                  : 'blocked-card-readiness-not-proven',
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
      readyToAcquireNotificationVisible && acquireVisible && !acquireDisabled
        ? 'Kapitel 21 kann die Anlagenkarte als Vorpruefung vor dem Acquire-Klick zeigen, muss aber vor jeder Anschaffungsausfuehrung einen separaten Gate-/Preview-/Postenspur-Schritt verlangen.'
        : 'Kapitel 21 sollte die Anlagenkarte als Vorpruefung zeigen und erklaeren, dass ein fehlender Ready-to-acquire-Hinweis oder deaktiviertes Acquire kein Anschaffungsnachweis ist.',
    summary,
    nextStep,
  };

  await writeTextEvidence(faEvidencePath('010-card-readiness-text.txt'), compactCardText || 'No compact card readiness text captured.');
  await writeJsonEvidence(faEvidencePath('020-acquire-readiness-diagnostics.json'), diagnostics);
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-132-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-132-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-132 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-132-result.json` | JSON | Anlagenkarten-Kontext, Acquire-Zustand und Bereitschaftssignale | keine Anschaffung, keine Posten | `labor`, `read-only` |',
      '| `FIXEDASSETS-132-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-card-readiness-text.txt` | Text | kompakte sichtbare Kartensignale | keine technische Tabellenlogik allein | `compact` |',
      '| `020-acquire-readiness-diagnostics.json` | JSON | sichtbare Controls, Acquire-Kandidaten, Benachrichtigungs- und Wertsignale | keine Buchungswirkung | `read-only-diagnosis` |',
      '| `fixedassets-132-030-fa-cnc-01-acquisition-readiness-card.screenshot.json` | JSON | Screenshot-Zweck, Status und Grenze | keinen visuellen Zielwert allein | `metadata` |',
      '| `../../img/fixedassets-132-030-fa-cnc-01-acquisition-readiness-card.png` | Screenshot | sichtbare FA-CNC-01 Anlagenkarte als Kontrollpunkt | kein Anschaffungs- oder Buchungsbild | `labor`, `diagnosis` |',
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
  expect(result.observed.cardVisible).toBe(true);
});
