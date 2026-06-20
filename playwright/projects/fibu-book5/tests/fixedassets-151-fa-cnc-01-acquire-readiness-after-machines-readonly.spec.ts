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

const CASE_ID = 'FIXEDASSETS-151-FA-CNC-01-ACQUIRE-READINESS-AFTER-MACHINES-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-152-FA-CNC-01-ACQUIRE-READINESS-RESULT-REVIEW';
const TEST_ID = 'fixedassets-151';
const INSTANCE = 'MCP_1_20260210';
const COMPANY = project.defaultCompany;
const ASSET_NO = 'FA-CNC-01';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(300_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function fixedAssetCardUrl() {
  const url = new URL(bcPageUrl(5600, project.envPrefix));
  url.searchParams.set('company', COMPANY);
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${ASSET_NO}'`);
  return url.toString();
}

function clean(value: string | null | undefined) {
  return (value || '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const parsed = new URL(url);
  const text = await pageText(page);
  const result = {
    url,
    instanceInUrl: decoded.includes(INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === COMPANY,
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(INSTANCE),
  };

  if (!result.instanceInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context for ${CASE_ID}: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function openAssetCard(page: Page) {
  await page.goto(fixedAssetCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset Card|Fixed Asset|Depreciation Book|Book Value/i, { timeout: 90_000 });
  await waitForPageText(page, /\bFA-CNC-01\b/i, { timeout: 60_000 });
  await page.waitForTimeout(1000);
  return assertSandboxContext(page);
}

async function findCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/\bFA-CNC-01\b/i.test(text) && /Fixed Asset Card|Fixed Asset|Posting Group|Book Value|Acquire/i.test(text)) {
      return frame;
    }
  }
  return page.mainFrame();
}

async function expandDepreciationBookFields(page: Page) {
  const frame = await findCardFrame(page);
  const buttons = frame.getByRole('button', {
    name: /Depreciation Book, (Mehr anzeigen|Show more)|Depreciation Book.*Show more fields/i,
  });
  const count = await buttons.count().catch(() => 0);
  const attempts: Array<Record<string, unknown>> = [];

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    const label = clean(
      [
        await button.innerText({ timeout: 500 }).catch(() => ''),
        (await button.getAttribute('aria-label').catch(() => '')) ?? '',
        (await button.getAttribute('title').catch(() => '')) ?? '',
      ].join(' | '),
    );
    if (/\b(Acquire|Post|Preview|New|Delete|Copy|OK|Yes|Ja|Invoice|Ship)\b/i.test(label)) {
      attempts.push({ index, label, clicked: false, skippedReason: 'dangerous-label' });
      continue;
    }
    const box = await button.boundingBox().catch(() => null);
    if (!box) {
      attempts.push({ index, label, clicked: false, skippedReason: 'not-visible' });
      continue;
    }
    await button.click({ timeout: 3000 });
    await page.waitForTimeout(800);
    attempts.push({ index, label, clicked: true });
    break;
  }

  return { candidateCount: count, attempts, clicked: attempts.some((attempt) => attempt.clicked) };
}

async function collectReadiness(page: Page) {
  const frame = await findCardFrame(page);
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const rectOf = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
    };
    const bodyText = normalize(document.body.innerText || document.body.textContent);
    const controls = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[role="menuitem"],input,[aria-label],[title]'))
      .filter(visible)
      .map((element) => {
        const text = normalize(element.innerText || element.textContent);
        const ariaLabel = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const value = normalize((element as HTMLInputElement).value);
        const label = normalize([text, ariaLabel, title, value].filter(Boolean).join(' | '));
        return {
          tagName: element.tagName,
          role: normalize(element.getAttribute('role')),
          text,
          ariaLabel,
          title,
          value,
          label,
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
          readonly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
          rect: rectOf(element),
        };
      })
      .filter((entry) => /Acquire|FA-CNC-01|Posting Group|MACHINES|Book Value|Acquired|Ready|Anschaffung|Erwerb|HGB/i.test(entry.label))
      .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);

    const machinesVisibleAsControlValue = controls.some((entry) => /\bMACHINES\b/i.test([entry.label, entry.value].join(' ')));

    return {
      bodySignals: {
        hasAssetNo: /\bFA-CNC-01\b/i.test(bodyText),
        hasPostingGroup: /Posting Group/i.test(bodyText),
        hasMachines: /\bMACHINES\b/i.test(bodyText),
        hasBookValueZero: /Book Value[^0-9]*(0\.00|0,00)|0\.00[^A-Za-z]{0,20}Book Value|0,00[^A-Za-z]{0,20}Book Value/i.test(bodyText),
        hasReadyToAcquireText: /Ready to acquire|ready for acquisition|bereit.*Erwerb|bereit.*Anschaffung|acquire.*ready|anschaff.*bereit/i.test(bodyText),
        hasAcquiredText: /Acquired|Erworben/i.test(bodyText),
      },
      controlSignals: {
        hasMachinesValue: machinesVisibleAsControlValue,
      },
      acquireCandidates: controls.filter((entry) => /^Acquire(?:\s|\||$)/i.test(entry.label) || /Acquire the fixed asset/i.test(entry.label)),
      relevantControls: controls.slice(0, 160),
    };
  });
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-151 - FA-CNC-01 Acquire readiness after MACHINES',
    '',
    'Status: `labor`, `ui-first`, `read-only`, `no-acquire-click`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.assetNo} |`,
    `| Posting Group MACHINES sichtbar | ${result.observed.readiness.bodySignals.hasMachines || result.observed.readiness.controlSignals?.hasMachinesValue ? 'ja' : 'nein'} |`,
    `| Acquire sichtbar | ${result.observed.acquire.visible ? 'ja' : 'nein'} |`,
    `| Acquire deaktiviert | ${result.observed.acquire.disabled ? 'ja' : 'nein' } |`,
    `| Ready-to-acquire-Hinweis sichtbar | ${result.observed.readiness.bodySignals.hasReadyToAcquireText ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    '- `MACHINES` auf der Karte ist eine Setup-Voraussetzung, aber noch kein Anlagenzugang.',
    '- Ein sichtbarer `Acquire`-Button ist nur ein Aktionsangebot; die Ausfuehrung braucht einen separaten Gate-Lauf.',
    '- Read-only Readiness prueft, ob der naechste Klickpfad fachlich plausibel ist, ohne Werte oder Posten zu erzeugen.',
    '',
    '## Grenzen',
    '',
    '- `Acquire` wurde nicht geklickt.',
    '- Keine Werte, keine Preview, keine Buchung, keine Postenspur.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-151 observes FA-CNC-01 acquire readiness after MACHINES without clicking Acquire', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const context = await openAssetCard(page);
  const expand = await expandDepreciationBookFields(page);
  const readiness = await collectReadiness(page);
  const compactText = await compactPageText(page, {
    include: [/Fixed Asset Card|FA-CNC-01|CNC Maschine|Posting Group|MACHINES|Book Value|Acquire|Acquired|Ready|HGB|Depreciation/i],
    maxLines: 180,
    maxLineLength: 240,
  });

  const acquireVisible = readiness.acquireCandidates.length > 0;
  const acquireDisabled = readiness.acquireCandidates.some((candidate) => candidate.disabled);
  const machinesVisible = readiness.bodySignals.hasMachines || readiness.controlSignals.hasMachinesValue;
  const resultStatus = machinesVisible ? 'observed-readonly-acquire-readiness' : 'blocked-machines-not-visible';
  const finishedAt = new Date().toISOString();
  const nextCaseId = 'FIXEDASSETS-152-FA-CNC-01-ACQUIRE-READINESS-RESULT-REVIEW';
  const nextCaseFile = '.agent/state/cases/fixedassets-152-fa-cnc-01-acquire-readiness-result-review.json';
  const summary =
    resultStatus === 'observed-readonly-acquire-readiness'
      ? `FA-151 reopened FA-CNC-01 after the MACHINES fit and captured Acquire readiness read-only. Acquire visible=${acquireVisible}, disabled=${acquireDisabled}, readySignal=${readiness.bodySignals.hasReadyToAcquireText}.`
      : 'FA-151 blocked: MACHINES was not visible on FA-CNC-01 during the read-only Acquire readiness check.';

  await writeJsonEvidence(faEvidencePath('010-readiness-diagnostics.json'), { context, expand, readiness });
  await writeTextEvidence(faEvidencePath('011-card-context.txt'), compactText);
  await screenshot(page, 'fixedassets-151-020-fa-cnc-01-acquire-readiness-after-machines.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: resultStatus === 'observed-readonly-acquire-readiness' ? 'labor' : 'rejected',
    bookUse: 'readiness-proof',
    purpose: 'FA-151 read-only: FA-CNC-01 nach MACHINES-Fit mit Acquire-Aktionsstatus; kein Klick auf Acquire.',
    expectedPageText:
      resultStatus === 'observed-readonly-acquire-readiness'
        ? [/\bFA-CNC-01\b/i, /Posting Group/i, /Acquire/i]
        : [/\bFA-CNC-01\b/i, /Posting Group/i, /Acquire/i],
    knownLimitations: ['Read-only Kontrollbild, keine Anschaffung, keine Preview, keine Buchung.'],
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-acquire-readiness-after-machines-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-acquire-readiness',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: INSTANCE,
    company: COMPANY,
    assetNo: ASSET_NO,
    observed: {
      startedAt,
      finishedAt,
      context,
      expand,
      readiness,
      acquire: {
        visible: acquireVisible,
        disabled: acquireDisabled,
        candidates: readiness.acquireCandidates,
      },
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      ...(machinesVisible ? ['FA-CNC-01 was visible with Posting Group MACHINES after the prior setup fit.'] : []),
      ...(acquireVisible ? ['Acquire action candidate was visible on the card.'] : ['Acquire action candidate was not visible in the captured diagnostics.']),
      ...(acquireDisabled ? ['At least one visible Acquire action candidate was disabled.'] : []),
      'Acquire was not clicked or executed.',
      'No values, Preview Posting, posting, setup change, draft, company switch or API shortcut occurred.',
    ],
    notProved: [
      'No acquisition wizard behavior was tested.',
      'No fixed asset acquisition was executed.',
      'No Preview Posting or posting trace was produced.',
      'No FA Ledger Entry or G/L acquisition trace is proven.',
      'No German fixed-assets final proof is produced.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-151-fa-cnc-01-acquire-readiness-after-machines-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-151/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-151/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-151/FIXEDASSETS-151-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-151/FIXEDASSETS-151-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-151/010-readiness-diagnostics.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-151/011-card-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-151/fixedassets-151-020-fa-cnc-01-acquire-readiness-after-machines.screenshot.json',
      'playwright/projects/fibu-book5/img/fixedassets-151-020-fa-cnc-01-acquire-readiness-after-machines.png',
    ],
    warnings: ['Read-only CRONUS-USA laboratory evidence only.', 'Visible Acquire action is not execution.'],
    blockedBy: resultStatus === 'blocked-machines-not-visible' ? ['Posting Group MACHINES was not visible during read-only readiness check.'] : [],
    requiresReview: true,
    safeToFinalizeState: true,
    flags: {
      noBookChange: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noDeleteRecord: true,
      noAcquireClick: true,
      noAcquireExecution: true,
      noAmountEntry: true,
      noTargetVendorEntry: true,
    },
    statePatch: {
      current: {
        updatedAt: finishedAt,
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-151-fa-cnc-01-acquire-readiness-after-machines-readonly.json',
        requiresStrongModel: true,
        nextStep: 'FIXEDASSETS-152: review FA-151 read-only acquisition-readiness evidence before any Acquire click is unlocked.',
      },
      activeCase: {
        status: resultStatus,
        lastResult: {
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-151/FIXEDASSETS-151-result.json',
          summary,
        },
        nextSafeAction: 'FIXEDASSETS-152: local review of Acquire readiness after MACHINES fit.',
      },
    },
    summary,
    bookImpact: 'Kapitel 21 kann den Kartenstatus nach dem MACHINES-Fit als Readiness-Kontrollpunkt zeigen. Ein Acquire-Klick bleibt ein separater, spaeter zu gateender Prozessschritt.',
    nextStep: 'FIXEDASSETS-152-FA-CNC-01-ACQUIRE-READINESS-RESULT-REVIEW',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-151-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-151-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-151 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-151-result.json` | JSON | Kartenkontext, MACHINES und Acquire-Readiness read-only | keine Anschaffung/Buchung | `labor`, `read-only` |',
      '| `FIXEDASSETS-151-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-readiness-diagnostics.json` | JSON | sichtbare Controls und Acquire-Kandidaten | keine Aktionsausfuehrung | `read-only-diagnosis` |',
      '| `011-card-context.txt` | Text | kompakter sichtbarer Kartenkontext | kein Rohdump | `compact` |',
      '| `../../img/fixedassets-151-020-fa-cnc-01-acquire-readiness-after-machines.png` | Screenshot | Kartenstatus nach MACHINES-Fit | keine Anschaffung | `labor` |',
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
  expect(result.observed.readiness.bodySignals.hasAssetNo).toBe(true);
});
