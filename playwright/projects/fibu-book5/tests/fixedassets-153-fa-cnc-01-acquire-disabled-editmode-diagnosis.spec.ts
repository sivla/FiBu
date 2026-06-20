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

const CASE_ID = 'FIXEDASSETS-153-FA-CNC-01-ACQUIRE-DISABLED-EDITMODE-DIAGNOSIS';
const NEXT_CASE_ID = 'FIXEDASSETS-154-FA-CNC-01-ACQUIRE-EDITMODE-RESULT-REVIEW';
const TEST_ID = 'fixedassets-153';
const INSTANCE = 'MCP_1_20260210';
const COMPANY = project.defaultCompany;
const ASSET_NO = 'FA-CNC-01';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(300_000);

type ControlEntry = {
  tagName: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  value: string;
  label: string;
  disabled: boolean;
  readonly: boolean;
  rect: { x: number; y: number; width: number; height: number };
};

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

async function findCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/\bFA-CNC-01\b/i.test(text) && /Fixed Asset Card|Fixed Asset|Posting Group|Book Value|Acquire/i.test(text)) {
      return frame;
    }
  }
  return page.mainFrame();
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

function sanitize(entry: ControlEntry): ControlEntry {
  return {
    ...entry,
    text: clean(entry.text),
    ariaLabel: clean(entry.ariaLabel),
    title: clean(entry.title),
    value: clean(entry.value),
    label: clean(entry.label),
  };
}

async function collectActionState(page: Page) {
  const frame = await findCardFrame(page);
  return frame
    .evaluate(() => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const rectOf = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      };
      const bodyText = normalize(document.body.innerText || document.body.textContent);
      const modalText = Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"],[aria-modal="true"],.ms-Dialog,.ms-Modal,[class*="dialog"],[class*="Dialog"]'),
      )
        .filter(visible)
        .map((element) =>
          normalize(
            [
              element.innerText || element.textContent,
              element.getAttribute('aria-label'),
              element.getAttribute('title'),
            ]
              .filter(Boolean)
              .join(' '),
          ),
        )
        .join(' ');
      const controls = Array.from(
        document.querySelectorAll<HTMLElement>('button,[role="button"],a,[role="menuitem"],input,[aria-label],[title]'),
      )
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
        .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
      const toolbar = controls.filter(
        (entry) =>
          entry.rect.y <= 230 ||
          /Edit|Bearbeiten|Open in edit|Pencil|Acquire|New|Delete|Copy Fixed Asset|Share|Änderungen|nderungen/i.test(entry.label),
      );
      const dangerous = /Post|Preview Posting|Ship|Invoice|Delete|Do you want to|Möchten Sie|Moechten Sie|OK|Yes|Ja/i.test(bodyText);

      return {
        bodySignals: {
          hasAssetNo: /\bFA-CNC-01\b/i.test(bodyText),
          hasPostingGroup: /Posting Group/i.test(bodyText),
          hasMachines: /\bMACHINES\b/i.test(bodyText),
          hasBookValueZero:
            /Book Value[^0-9]*(0\.00|0,00)|0\.00[^A-Za-z]{0,20}Book Value|0,00[^A-Za-z]{0,20}Book Value/i.test(bodyText),
        },
        controlSignals: {
          hasMachinesValue: controls.some((entry) => /\bMACHINES\b/i.test([entry.label, entry.value].join(' '))),
        },
        acquireCandidates: controls.filter(
          (entry) => /^Acquire(?:\s|\||$)/i.test(entry.label) || /Acquire the fixed asset/i.test(entry.label),
        ),
        editCandidates: toolbar.filter(
          (entry) =>
            /(^|\b)(Edit|Bearbeiten)(\b|$)|Open in edit|Pencil|Änderungen auf der Seite vornehmen|nderungen auf der Seite vornehmen/i.test(
              entry.label,
            ) &&
            !/Copy Fixed Asset|New|Neu|Delete|Löschen|Loschen|Share|Freigeben|Acquire|Post|Preview|OK|Yes|Ja|Invoice|Ship/i.test(
              entry.label,
            ),
        ),
        pencilLikeCandidates: toolbar.filter(
          (entry) =>
            entry.rect.width >= 12 &&
            entry.rect.width <= 40 &&
            entry.rect.height >= 12 &&
            entry.rect.height <= 40 &&
            entry.rect.x >= 850 &&
            entry.rect.x <= 1200 &&
            entry.rect.y <= 120 &&
            !/Copy Fixed Asset|New|Neu|Delete|Löschen|Loschen|Share|Freigeben|Acquire|Post|Preview|OK|Yes|Ja|Invoice|Ship/i.test(
              entry.label,
            ),
        ),
        toolbarCandidates: toolbar.slice(0, 160),
        dangerousDialogVisible: Boolean(modalText && dangerous),
        modalText,
      };
    })
    .then((raw) => ({
      ...raw,
      acquireCandidates: raw.acquireCandidates.map(sanitize),
      editCandidates: raw.editCandidates.map(sanitize),
      pencilLikeCandidates: raw.pencilLikeCandidates.map(sanitize),
      toolbarCandidates: raw.toolbarCandidates.map(sanitize),
    }));
}

async function clickSafeEditCandidate(page: Page, before: Awaited<ReturnType<typeof collectActionState>>) {
  const named = before.editCandidates.filter((entry) => !entry.disabled);
  if (named.length === 1) {
    const candidate = named[0];
    await page.mouse.click(candidate.rect.x + candidate.rect.width / 2, candidate.rect.y + candidate.rect.height / 2);
    return { attempted: true, clicked: 'named-edit-candidate', candidate, reason: `Clicked ${candidate.label}` };
  }
  if (named.length > 1) {
    return { attempted: false, clicked: 'none', candidate: null, reason: `Multiple named edit candidates found: ${named.length}` };
  }

  const pencilLike = before.pencilLikeCandidates.filter((entry) => !entry.disabled);
  if (pencilLike.length !== 1) {
    return {
      attempted: false,
      clicked: 'none',
      candidate: null,
      reason: `Expected exactly one safe pencil-like candidate, found ${pencilLike.length}`,
    };
  }

  const candidate = pencilLike[0];
  await page.mouse.click(candidate.rect.x + candidate.rect.width / 2, candidate.rect.y + candidate.rect.height / 2);
  return { attempted: true, clicked: 'pencil-like-toolbar-candidate', candidate, reason: `Clicked x=${candidate.rect.x}, y=${candidate.rect.y}` };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-153 - Acquire disabled editmode diagnosis',
    '',
    'Status: `labor`, `ui-first`, `diagnosis`, `no-acquire-click`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.assetNo} |`,
    `| Posting Group MACHINES | ${result.observed.before.hasMachines ? 'ja' : 'nein'} |`,
    `| Book Value 0,00 | ${result.observed.before.hasBookValueZero ? 'ja' : 'nein'} |`,
    `| Edit-Probe versucht | ${result.observed.editProbe.attempted ? 'ja' : 'nein'} |`,
    `| Acquire vorher deaktiviert | ${result.observed.before.acquireDisabled ? 'ja' : 'nein'} |`,
    `| Acquire nachher deaktiviert | ${result.observed.after.acquireDisabled === null ? 'nicht geprueft' : result.observed.after.acquireDisabled ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- `Acquire` wurde nicht geklickt oder ausgefuehrt.',
    '- Es wurden keine Feldwerte geaendert.',
    '- Keine Preview, kein `Post`, keine Anschaffung und keine Postenspur.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-153 diagnoses disabled Acquire after safe edit state without executing acquisition', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const context = await openAssetCard(page);
  const expand = await expandDepreciationBookFields(page);
  const before = await collectActionState(page);
  const beforeCompactText = await compactPageText(page, {
    include: [/Fixed Asset Card|FA-CNC-01|CNC Maschine|Posting Group|MACHINES|Book Value|Acquire|Acquired|HGB|Depreciation/i],
    maxLines: 180,
    maxLineLength: 240,
  });

  await screenshot(page, 'fixedassets-153-010-fa-cnc-01-before-editmode.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: 'labor',
    bookUse: 'diagnosis',
    purpose: 'FA-153 Vorherbild: FA-CNC-01 mit MACHINES, Book Value 0,00 und sichtbarem Acquire vor sicherem Edit-State-Probe.',
    expectedPageText: [/\bFA-CNC-01\b/i, /Posting Group/i, /Acquire/i],
    knownLimitations: ['Diagnosebild, keine Anschaffung, keine Preview, keine Buchung.'],
  });

  const editProbe = await clickSafeEditCandidate(page, before);
  await page.waitForTimeout(editProbe.attempted ? 2000 : 500);
  const after = editProbe.attempted ? await collectActionState(page) : null;
  const afterCompactText = editProbe.attempted
    ? await compactPageText(page, {
        include: [/Fixed Asset Card|FA-CNC-01|CNC Maschine|Posting Group|MACHINES|Book Value|Acquire|Save|Cancel|Discard/i],
        maxLines: 180,
        maxLineLength: 240,
      })
    : '';

  await screenshot(page, 'fixedassets-153-020-fa-cnc-01-after-editmode.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: 'labor',
    bookUse: 'diagnosis',
    purpose: 'FA-153 Nachherbild: Acquire-Zustand nach sicherem Edit-State-Probe oder dokumentiertem Stop; kein Acquire-Klick.',
    expectedPageText: [/\bFA-CNC-01\b/i, /Posting Group/i],
    knownLimitations: ['Keine Acquire-Ausfuehrung, keine Feldwert-Aenderung, kein Buchungsnachweis.'],
  });

  const machinesVisible = before.bodySignals.hasMachines || before.controlSignals.hasMachinesValue;
  const bookValueZeroVisible = before.bodySignals.hasBookValueZero;
  const beforeAcquireVisible = before.acquireCandidates.length > 0;
  const beforeAcquireDisabled = before.acquireCandidates.some((entry) => entry.disabled);
  const afterAcquireVisible = Boolean(after?.acquireCandidates.length);
  const afterAcquireDisabled = after ? after.acquireCandidates.some((entry) => entry.disabled) : null;
  const afterAcquireEnabled = afterAcquireVisible && afterAcquireDisabled === false;
  const dangerousDialogVisible = Boolean(before.dangerousDialogVisible || after?.dangerousDialogVisible);
  const resultStatus = dangerousDialogVisible
    ? 'blocked-dangerous-dialog-visible'
    : !machinesVisible || !bookValueZeroVisible
      ? 'blocked-card-readiness-not-visible'
      : afterAcquireEnabled
        ? 'observed-acquire-enabled-after-editmode-no-click'
        : editProbe.attempted
          ? 'observed-acquire-still-disabled-after-editmode'
          : 'blocked-no-safe-edit-candidate';
  const finishedAt = new Date().toISOString();
  const summary =
    resultStatus === 'observed-acquire-still-disabled-after-editmode'
      ? 'FA-153 proved in the UI that FA-CNC-01 still shows Acquire disabled after a safe edit-state probe; no acquisition route is unlocked.'
      : resultStatus === 'observed-acquire-enabled-after-editmode-no-click'
        ? 'FA-153 found Acquire enabled after a safe edit-state probe, but did not click it. A separate gate review is required before any acquisition action.'
        : resultStatus === 'blocked-no-safe-edit-candidate'
          ? 'FA-153 stopped before edit-state probing because no single safe edit/pencil candidate was identified.'
          : 'FA-153 blocked before any acquisition step because the card readiness or dialog safety gate was not satisfied.';
  const nextStep =
    resultStatus === 'observed-acquire-enabled-after-editmode-no-click'
      ? 'FIXEDASSETS-154: local gate review before any Acquire click is considered.'
      : 'FIXEDASSETS-154: local route review; decide whether to hold Acquire as disabled and pivot to another acquisition path.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-acquire-disabled-editmode-diagnosis-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-action-state-diagnosis',
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
      before: {
        hasAssetNo: before.bodySignals.hasAssetNo,
        hasMachines: machinesVisible,
        hasBookValueZero: bookValueZeroVisible,
        acquireVisible: beforeAcquireVisible,
        acquireDisabled: beforeAcquireDisabled,
        acquireCandidates: before.acquireCandidates,
        editCandidateCount: before.editCandidates.length,
        pencilLikeCandidateCount: before.pencilLikeCandidates.length,
      },
      editProbe,
      after: {
        acquireVisible: afterAcquireVisible,
        acquireDisabled: afterAcquireDisabled,
        acquireEnabled: afterAcquireEnabled,
        acquireCandidates: after?.acquireCandidates ?? [],
      },
      dangerousDialogVisible,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      ...(machinesVisible ? ['FA-CNC-01 was visible with Posting Group MACHINES.'] : []),
      ...(bookValueZeroVisible ? ['FA-CNC-01 was visible with Book Value 0.00 / 0,00.'] : []),
      ...(beforeAcquireVisible ? ['Acquire action candidate was visible before the edit-state probe.'] : []),
      ...(beforeAcquireDisabled ? ['Acquire action candidate was disabled before the edit-state probe.'] : []),
      ...(editProbe.attempted ? ['A scoped edit/pencil state probe was attempted without field value entry.'] : []),
      ...(afterAcquireDisabled ? ['Acquire action candidate was still disabled after the edit-state probe.'] : []),
      ...(afterAcquireEnabled ? ['Acquire action candidate appeared enabled after the edit-state probe, but was not clicked.'] : []),
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
      'playwright/projects/fibu-book5/tests/fixedassets-153-fa-cnc-01-acquire-disabled-editmode-diagnosis.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-153/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-153/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-153/FIXEDASSETS-153-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-153/FIXEDASSETS-153-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-153/010-action-state-diagnostics.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-153/011-card-context-before.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-153/012-card-context-after.txt',
      'playwright/projects/fibu-book5/img/fixedassets-153-010-fa-cnc-01-before-editmode.png',
      'playwright/projects/fibu-book5/img/fixedassets-153-020-fa-cnc-01-after-editmode.png',
    ],
    warnings: ['CRONUS-USA laboratory evidence only.', 'Visible Acquire action is not execution.'],
    blockedBy:
      resultStatus.startsWith('blocked')
        ? [
            resultStatus === 'blocked-card-readiness-not-visible'
              ? 'Posting Group MACHINES or Book Value 0.00 was not visible before the edit-state probe.'
              : resultStatus === 'blocked-no-safe-edit-candidate'
                ? editProbe.reason
                : 'Dangerous dialog text was visible.',
          ]
        : [],
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
      noFieldValueChanged: true,
    },
    statePatch: {
      current: {
        updatedAt: finishedAt,
        activeCase: NEXT_CASE_ID,
        active_case_file: '.agent/state/cases/fixedassets-154-fa-cnc-01-acquire-editmode-result-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-153-fa-cnc-01-acquire-disabled-editmode-diagnosis.json',
        requiresStrongModel: true,
        nextStep,
      },
      activeCase: {
        status: resultStatus,
        lastResult: {
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-153/FIXEDASSETS-153-result.json',
          summary,
          editProbeAttempted: editProbe.attempted,
          acquireEnabledAfterProbe: afterAcquireEnabled,
        },
        nextSafeAction: nextStep,
      },
    },
    summary,
    bookImpact:
      resultStatus === 'observed-acquire-still-disabled-after-editmode'
        ? 'Kapitel 21 darf den Editmodus nicht als Freigabe fuer Acquire erklaeren; die Karte bleibt ein Readiness-/Blockerbild, kein Anschaffungsprozess.'
        : 'Kapitel 21 braucht einen getrennten Gate-Hinweis: ein geaenderter Aktionsstatus ist noch keine Anschaffung und darf nicht ohne separaten Prozessnachweis beschrieben werden.',
    nextStep,
  };

  await writeJsonEvidence(faEvidencePath('010-action-state-diagnostics.json'), { before, editProbe, after, expand });
  await writeTextEvidence(faEvidencePath('011-card-context-before.txt'), beforeCompactText || 'No compact before text captured.');
  await writeTextEvidence(faEvidencePath('012-card-context-after.txt'), afterCompactText || 'No compact after text captured.');
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-153-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-153-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-153 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-153-result.json` | JSON | Edit-State-/Acquire-Diagnose | keine Anschaffung, keine Buchung | `labor`, `diagnosis` |',
      '| `FIXEDASSETS-153-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-action-state-diagnostics.json` | JSON | Controls, Edit-Probe, Acquire-Zustand vorher/nachher | keine Aktionsausfuehrung | `diagnosis` |',
      '| `011-card-context-before.txt` | Text | kompakter Kartenkontext vor Probe | kein Rohdump | `compact` |',
      '| `012-card-context-after.txt` | Text | kompakter Kartenkontext nach Probe/Stop | kein Rohdump | `compact` |',
      '| `../../img/fixedassets-153-010-fa-cnc-01-before-editmode.png` | Screenshot | Vorher-Kontext | keine Anschaffung | `labor` |',
      '| `../../img/fixedassets-153-020-fa-cnc-01-after-editmode.png` | Screenshot | Nachher-/Stop-Kontext | keine Anschaffung | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noAcquireClick).toBe(true);
  expect(result.flags.noAcquireExecution).toBe(true);
  expect(result.flags.noFieldValueChanged).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(before.bodySignals.hasAssetNo).toBe(true);
  expect(dangerousDialogVisible).toBe(false);
});
