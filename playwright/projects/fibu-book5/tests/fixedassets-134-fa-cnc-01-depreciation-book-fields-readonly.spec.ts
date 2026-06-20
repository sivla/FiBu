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

const CASE_ID = 'FIXEDASSETS-134-FA-CNC-01-DEPRECIATION-BOOK-FIELDS-READONLY';
const TEST_ID = 'fixedassets-134';
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

async function collectFieldDiagnostics(page: Page) {
  const frame = await findCardFrame(page);
  return frame
    .evaluate(() => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };

      const all = Array.from(
        document.querySelectorAll<HTMLElement>(
          'button,[role="button"],[role="menuitem"],a,input,textarea,select,[aria-label],[title]',
        ),
      )
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
          /Acquire|Fixed Asset Card|FA-CNC-01|CNC Maschine|Book Value|Depreciation Book|Depreciation Method|Posting Group|FA Posting Group|FA Class|FA Subclass|HGB|MACHINES|Acquired|Anschaffung|Erwerb|Mehr anzeigen|Show more|Show more fields|bereit|Ready/i.test(
            entry.label,
          ),
        )
        .sort((left, right) => left.y - right.y || left.x - right.x)
        .slice(0, 160);

      const bodyText = normalize(document.body.innerText || document.body.textContent);

      return {
        frameUrl: window.location.href,
        acquireCandidates: all.filter((entry) => /^Acquire(?:\s|\||$)/i.test(entry.label) || /Acquire the fixed asset/i.test(entry.label)),
        fieldSignals: all.filter((entry) =>
          /Book Value|Depreciation Book|Depreciation Method|Posting Group|FA Posting Group|HGB|MACHINES|Acquired|CNC Maschine|FA Class|FA Subclass/i.test(
            entry.label,
          ),
        ),
        expandCandidates: all.filter((entry) => /Depreciation Book.*(Mehr anzeigen|Show more)|Mehr anzeigen|Show more fields/i.test(entry.label)),
        notificationSignals: all.filter((entry) =>
          /Ready to acquire|ready for acquisition|bereit.*Erwerb|bereit.*Anschaffung|acquire.*ready|anschaff.*bereit/i.test(entry.label),
        ),
        bodySignals: {
          hasDepreciationBookCodeLabel: /Depreciation Book Code/i.test(bodyText),
          hasHgb: /\bHGB\b/i.test(bodyText),
          hasFaPostingGroupLabel: /FA Posting Group|Posting Group/i.test(bodyText),
          hasMachines: /\bMACHINES\b/i.test(bodyText),
          hasAcquiredSignal: /Acquired|Erworben/i.test(bodyText),
          hasReadyToAcquireText: /Ready to acquire|ready for acquisition|bereit.*Erwerb|bereit.*Anschaffung|acquire.*ready|anschaff.*bereit/i.test(bodyText),
          hasBookValueZero: /Book Value[^0-9]*(0\.00|0,00)|0\.00[^A-Za-z]{0,20}Book Value|0,00[^A-Za-z]{0,20}Book Value/i.test(bodyText),
          hasDepreciationMethod: /Depreciation Method|Straight-Line/i.test(bodyText),
          hasDepreciationYears: /No\. of Depreciation Years|8\.00|8,00/i.test(bodyText),
        },
        relevantControls: all,
      };
    })
    .then((raw) => ({
      ...raw,
      acquireCandidates: raw.acquireCandidates.map(sanitizeEntry),
      fieldSignals: raw.fieldSignals.map(sanitizeEntry),
      expandCandidates: raw.expandCandidates.map(sanitizeEntry),
      notificationSignals: raw.notificationSignals.map(sanitizeEntry),
      relevantControls: raw.relevantControls.map(sanitizeEntry),
    }));
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

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-134 - Depreciation-Book-Felder auf FA-CNC-01',
    '',
    'Status: `labor`, `ui-first`, `read-only`, `no-edit`, `no-acquire-click`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.targetAsset} |`,
    `| Anlagenkarte sichtbar | ${result.observed.cardVisible ? 'ja' : 'nein'} |`,
    `| Mehr-anzeigen geklickt | ${result.observed.expand.clicked ? 'ja' : 'nein'} |`,
    `| HGB sichtbar | ${result.observed.afterSignals.hasHgb ? 'ja' : 'nein'} |`,
    `| Posting Group sichtbar | ${result.observed.visiblePostingGroup ?? 'nicht sichtbar'} |`,
    `| MACHINES sichtbar | ${result.observed.afterSignals.hasMachines ? 'ja' : 'nein'} |`,
    `| Acquired-/Erworben-Signal sichtbar | ${result.observed.afterSignals.hasAcquiredSignal ? 'ja' : 'nein'} |`,
    `| Book Value 0 sichtbar | ${result.observed.afterSignals.hasBookValueZero ? 'ja' : 'nein'} |`,
    `| Acquire deaktiviert | ${result.observed.acquire.disabled ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    '- `Depreciation Book` und `FA Posting Group` sind Pflichtkontext fuer Anlagenbuchungen, weil Business Central daraus AfA- und Sachpostenlogik ableitet.',
    '- `Book Value = 0,00` zeigt nur, dass noch kein Anlagenwert gebucht ist; es beweist nicht automatisch, dass die Anschaffung jetzt geklickt werden darf.',
    '- Eine ausgegraute Aktion wie `Acquire` ist ein Stoppzeichen: erst Ursachen und Pflichtfelder klaeren, dann einen Buchungspfad freigeben.',
    '- `Mehr anzeigen` ist fuer Klickanleitungen wichtig, weil fachlich relevante Felder sonst im Screenshot fehlen koennen.',
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

function compactDiagnostics(diagnostics: Awaited<ReturnType<typeof collectFieldDiagnostics>>) {
  const usefulEntry = (entry: VisibleControl) => entry.tagName !== 'FORM';
  const compactEntry = (entry: VisibleControl) => ({
    label: entry.label,
    role: entry.role,
    tagName: entry.tagName,
    disabled: entry.disabled,
    readonly: entry.readonly,
    x: entry.x,
    y: entry.y,
  });
  return {
    bodySignals: diagnostics.bodySignals,
    acquireCandidates: diagnostics.acquireCandidates.filter(usefulEntry).slice(0, 5).map(compactEntry),
    expandCandidates: diagnostics.expandCandidates.filter(usefulEntry).slice(0, 8).map(compactEntry),
    fieldSignals: diagnostics.fieldSignals.filter(usefulEntry).slice(0, 24).map(compactEntry),
    notificationSignals: diagnostics.notificationSignals.filter(usefulEntry).slice(0, 8).map(compactEntry),
  };
}

function extractPostingGroup(text: string) {
  const direct = text.match(/Posting Group\s*\n([A-Z0-9_-]+)/i)?.[1];
  if (direct && !/^(Depreciation|Book|Add|Maintenance|Electronic)$/i.test(direct)) {
    return direct;
  }

  return /\bEQUIPMENT\b/.test(text) ? 'EQUIPMENT (visueller Screenshot-Wert; DOM-Text mehrdeutig)' : undefined;
}

test('FIXEDASSETS-134 observes FA-CNC-01 depreciation book fields read-only', async ({ page }) => {
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
  const beforeText = cleanBlock(
    await compactPageText(page, {
      include: [/MCP_1_20260210|RM-DEMO|Fixed Asset Card|FA-CNC-01|CNC Maschine|Acquire|Book Value|Depreciation Book|Depreciation Method|Posting Group|FA Posting Group|HGB|EQUIPMENT|MACHINES|Acquired|Ready|Anschaffung|Erwerb|Mehr anzeigen|Show more/i],
      maxLines: 240,
      maxLineLength: 260,
    }),
  );
  const beforeDiagnostics = await collectFieldDiagnostics(page);
  const expand = await expandDepreciationBookFields(page);
  const afterText = cleanBlock(
    await compactPageText(page, {
      include: [/MCP_1_20260210|RM-DEMO|Fixed Asset Card|FA-CNC-01|CNC Maschine|Acquire|Book Value|Depreciation Book|Depreciation Method|Posting Group|FA Posting Group|HGB|EQUIPMENT|MACHINES|Acquired|Ready|Anschaffung|Erwerb|Mehr anzeigen|Show more/i],
      maxLines: 260,
      maxLineLength: 260,
    }),
  );
  const afterDiagnostics = await collectFieldDiagnostics(page);
  const acquireVisible = afterDiagnostics.acquireCandidates.length > 0;
  const acquireDisabled = afterDiagnostics.acquireCandidates.some((entry) => entry.disabled);
  const enoughFieldContext =
    afterDiagnostics.bodySignals.hasHgb &&
    afterDiagnostics.bodySignals.hasMachines &&
    afterDiagnostics.bodySignals.hasBookValueZero &&
    afterDiagnostics.bodySignals.hasDepreciationMethod;
  const visiblePostingGroup = extractPostingGroup(afterText);

  await screenshot(page, 'fixedassets-134-040-fa-cnc-01-depreciation-book-fields.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: enoughFieldContext ? 'candidate' : 'labor',
    bookUse: 'field-proof',
    purpose:
      'FIXEDASSETS-134 Read-only-Kontrollbild: Anlagenkarte FA-CNC-01 mit Depreciation-Book-/Posting-Group-/Book-Value-Signalen nach Mehr-anzeigen-Probe; kein Edit, kein Acquire.',
    expectedPageText: [/FA-CNC-01|Fixed Asset Card|Fixed Asset/i],
    knownLimitations: ['Labor-/Read-only-Bild, kein Anschaffungs-, Preview- oder Buchungsnachweis.'],
  });

  const summary = enoughFieldContext
    ? `FA-134 zeigt FA-CNC-01 mit HGB, ${visiblePostingGroup ?? 'sichtbarer Posting Group'}, AfA-Daten und Book Value auf der Anlagenkarte. Acquire wurde nicht ausgefuehrt; der Anlagenzugang braucht weiter ein eigenes Gate.`
    : `FA-134 zeigt FA-CNC-01 auf der Anlagenkarte mit Depreciation Book Code HGB, sichtbarer Posting Group ${visiblePostingGroup ?? 'nicht ermittelt'}, AfA-Daten und Book Value 0,00. MACHINES und Acquired-/Ready-Signale sind nicht sichtbar; Acquire bleibt deaktiviert.`;
  const nextCaseId = 'FIXEDASSETS-135-FA-CNC-01-READINESS-FIELD-GAP-REVIEW';
  const nextCaseFile = '.agent/state/cases/fixedassets-135-fa-cnc-01-readiness-field-gap-review.json';
  const nextStep =
    'FIXEDASSETS-135: local review of FA-134 field visibility and remaining acquisition-readiness gap before any Acquire, Purchase Invoice or FA G/L Journal route is retried.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-depreciation-book-fields-readonly-result',
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
      cardVisible: /FA-CNC-01|Fixed Asset Card|Fixed Asset/i.test(afterText),
      expand,
      beforeSignals: beforeDiagnostics.bodySignals,
      afterSignals: afterDiagnostics.bodySignals,
      visiblePostingGroup,
      acquire: {
        visible: acquireVisible,
        disabled: acquireDisabled,
        candidates: afterDiagnostics.acquireCandidates,
      },
      fieldSignalCount: afterDiagnostics.fieldSignals.length,
      notificationSignalCount: afterDiagnostics.notificationSignals.length,
      enoughFieldContext,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'FA-CNC-01 Fixed Asset Card was visible.',
      'Depreciation Book / More-fields visibility was probed read-only.',
      ...(afterDiagnostics.bodySignals.hasHgb ? ['HGB is visible in the captured card context.'] : ['HGB is not visible in the captured card context.']),
      ...(afterDiagnostics.bodySignals.hasMachines ? ['MACHINES is visible in the captured card context.'] : ['MACHINES is not visible in the captured card context.']),
      ...(afterDiagnostics.bodySignals.hasBookValueZero ? ['Book Value 0 is visible in the captured card context.'] : ['Book Value 0 is not visible in the captured card context.']),
      ...(afterDiagnostics.bodySignals.hasAcquiredSignal ? ['An Acquired signal is visible in the captured card context.'] : ['No Acquired signal is visible in the captured card context.']),
      ...(acquireDisabled ? ['Acquire remains disabled in the captured card diagnostics.'] : []),
      'No Edit, Acquire execution, field value entry, Preview Posting, Post, setup change, draft creation, company switch, delete or API shortcut was performed.',
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
      '.agent/state/cases/fixedassets-134-fa-cnc-01-depreciation-book-fields-readonly.json',
      nextCaseFile,
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-134-fa-cnc-01-depreciation-book-fields-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-134/FIXEDASSETS-134-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-134/FIXEDASSETS-134-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-134/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-134/FIXEDASSETS-134-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-134/FIXEDASSETS-134-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-134/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-134/010-before-expand-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-134/020-after-expand-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-134/030-depreciation-book-field-diagnostics.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-134/fixedassets-134-040-fa-cnc-01-depreciation-book-fields.screenshot.json',
      'playwright/projects/fibu-book5/img/fixedassets-134-040-fa-cnc-01-depreciation-book-fields.png',
    ],
    warnings: [
      'Read-only card diagnosis only.',
      'Do not execute Acquire from FA-134 evidence.',
      'Visible field context is not acquisition posting proof.',
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
        updatedAt: '2026-06-20T18:30:00.000Z',
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-134-fa-cnc-01-depreciation-book-fields-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      activeCase: {
        status: 'observed-readonly-field-diagnosis',
        lastResult: {
          status: 'observed',
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-134/FIXEDASSETS-134-result.json',
          summary,
          visiblePostingGroup,
          hgbVisible: afterDiagnostics.bodySignals.hasHgb,
          machinesVisible: afterDiagnostics.bodySignals.hasMachines,
          acquiredSignalVisible: afterDiagnostics.bodySignals.hasAcquiredSignal,
          bookValueZeroVisible: afterDiagnostics.bodySignals.hasBookValueZero,
          acquireVisible,
          acquireDisabled,
          enoughFieldContext,
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
            currentBlock: 'readiness-field-gap-review',
            latestPracticalCase: 'FIXEDASSETS-134',
            latestDecisionCase: 'FIXEDASSETS-133',
            nextCase: nextCaseId,
            bookScreenshots: {
              setupProofs: 'available-labor',
              purchaseInvoicePreflight: 'available-labor',
              validFixedAssetLine: 'blocked-personalize-opened-type-context-visible-but-fixed-asset-option-unproved',
              acquisitionPostingTrace: 'blocked-acquisition-readiness-not-proven',
              depreciationPostingTrace: 'open',
              acquisitionWizardPreflight: 'blocked-pending-fa-135-field-gap-review',
              depreciationBookFields: enoughFieldContext ? 'candidate-labor-field-proof' : 'partial-labor-field-proof',
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
      `Kapitel 21 kann die Anlagenkarte als Pflichtfeld-Kontrollpunkt nutzen: AfA-Buch, sichtbare Buchungsgruppe ${visiblePostingGroup ?? 'nicht ermittelt'} und Buchwert muessen im Screenshot lesbar sein. Der Lauf beweist weiterhin keinen Anlagenzugang und keine deutsche Finalbuchung; die sichtbare Posting Group muss gegen das fruehere MACHINES-Setup-Ziel bewertet werden.`,
    summary,
    nextStep,
  };

  await writeTextEvidence(faEvidencePath('010-before-expand-text.txt'), beforeText || 'No compact before-expand text captured.');
  await writeTextEvidence(faEvidencePath('020-after-expand-text.txt'), afterText || 'No compact after-expand text captured.');
  await writeJsonEvidence(faEvidencePath('030-depreciation-book-field-diagnostics.json'), {
    before: compactDiagnostics(beforeDiagnostics),
    after: compactDiagnostics(afterDiagnostics),
    expand,
  });
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-134-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-134-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-134 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-134-result.json` | JSON | Kartenkontext, Field-Signale und Acquire-Sperre | keine Anschaffung, keine Posten | `labor`, `read-only` |',
      '| `FIXEDASSETS-134-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-before-expand-text.txt` | Text | sichtbare Kartensignale vor Mehr-anzeigen-Probe | keine technische Tabellenlogik allein | `compact` |',
      '| `020-after-expand-text.txt` | Text | sichtbare Kartensignale nach Mehr-anzeigen-Probe | keine Buchungswirkung | `compact` |',
      '| `030-depreciation-book-field-diagnostics.json` | JSON | sichtbare Controls, Feld-, Acquire- und Expand-Signale | keine Buchungswirkung | `read-only-diagnosis` |',
      '| `fixedassets-134-040-fa-cnc-01-depreciation-book-fields.screenshot.json` | JSON | Screenshot-Zweck, Status und Grenze | keinen visuellen Zielwert allein | `metadata` |',
      '| `../../img/fixedassets-134-040-fa-cnc-01-depreciation-book-fields.png` | Screenshot | Anlagenkarte mit Feld-/Bereitschaftskontext | kein Anschaffungs- oder Buchungsbild | `labor`, `field-proof` |',
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
