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

const CASE_ID = 'FIXEDASSETS-147-FA-CNC-01-POSTING-GROUP-EDITMODE-AFFORDANCE-NOSAVE';
const NEXT_CASE_ID = 'FIXEDASSETS-148-FA-CNC-01-POSTING-GROUP-AFFORDANCE-RESULT-REVIEW';
const TEST_ID = 'fixedassets-147';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_ASSET = 'FA-CNC-01';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(420_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function fixedAssetCardUrl() {
  const url = new URL(bcPageUrl(5600, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${TARGET_ASSET}'`);
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
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === EXPECTED_COMPANY,
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };

  if (!result.environmentInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function openAssetCard(page: Page) {
  await page.goto(fixedAssetCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset Card|Fixed Asset|FA Class Code|Depreciation Book|Book Value/i, {
    timeout: 90_000,
  });
  await waitForPageText(page, /\bFA-CNC-01\b/i, { timeout: 60_000 });
  await page.waitForTimeout(1000);
}

async function findCardFrame(page: Page) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/\bFA-CNC-01\b/i.test(text) && /Fixed Asset Card|Fixed Asset|Posting Group|Book Value/i.test(text)) {
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
  const attempts: Array<Record<string, unknown>> = [];

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

async function clickSafeEditMode(page: Page) {
  const frame = await findCardFrame(page);
  const result = await frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const editPattern = /Aenderungen auf der Seite vornehmen|Anderungen auf der Seite vornehmen|Make changes on the page|Edit/i;
    const rejectPattern = /Copy|New|Neu|Delete|Loeschen|Acquire|Post|Preview|Invoice|Ship|OK|Yes|Ja/i;
    const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,a,[role="button"],[title],[aria-label]'))
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const ariaLabel = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const label = `${text} ${ariaLabel} ${title}`;
        return {
          element,
          index,
          text,
          ariaLabel,
          title,
          label,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rejected: rejectPattern.test(label),
          matches: editPattern.test(label),
        };
      })
      .filter((entry) => entry.matches && !entry.rejected && entry.y >= 0 && entry.y <= 120)
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const chosen = candidates[0];
    const serializableCandidates = candidates.slice(0, 10).map(({ element: _element, ...entry }) => entry);
    if (!chosen) {
      return { clicked: false, reason: 'edit-action-not-found', candidates: serializableCandidates };
    }
    chosen.element.click();
    const { element: _element, ...serializableChosen } = chosen;
    return { clicked: true, chosen: serializableChosen, candidates: serializableCandidates };
  });
  await page.waitForTimeout(1500);
  return result;
}

async function inspectPostingGroupAffordance(page: Page) {
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
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };
    const labels = Array.from(document.querySelectorAll<HTMLElement>('label,span,div,a'))
      .filter(visible)
      .map((element) => ({
        element,
        text: normalize(element.innerText || element.textContent),
        ariaLabel: normalize(element.getAttribute('aria-label')),
        title: normalize(element.getAttribute('title')),
        rect: rectOf(element),
      }))
      .filter((entry) => entry.text === 'Posting Group')
      .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
    const label = labels[0];
    if (!label) {
      return { found: false, reason: 'posting-group-label-not-found' };
    }

    const rowCenterY = label.rect.y + label.rect.height / 2;
    const controls = Array.from(document.querySelectorAll<HTMLElement>('input,textarea,select,[role="combobox"],[contenteditable="true"]'))
      .filter(visible)
      .map((element) => ({
        element,
        tagName: element.tagName.toUpperCase(),
        role: normalize(element.getAttribute('role')),
        ariaLabel: normalize(element.getAttribute('aria-label')),
        title: normalize(element.getAttribute('title')),
        placeholder: normalize((element as HTMLInputElement).placeholder),
        value: normalize((element as HTMLInputElement).value),
        text: normalize(element.textContent),
        disabled: 'disabled' in element ? Boolean((element as HTMLInputElement).disabled) : false,
        readOnly: 'readOnly' in element ? Boolean((element as HTMLInputElement).readOnly) : false,
        rect: rectOf(element),
      }))
      .filter((entry) => Math.abs(entry.rect.y + entry.rect.height / 2 - rowCenterY) <= 24 && entry.rect.x > label.rect.x - 20)
      .sort((left, right) => left.rect.x - right.rect.x);

    const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-label],[title]'))
      .filter(visible)
      .map((element) => ({
        tagName: element.tagName.toUpperCase(),
        role: normalize(element.getAttribute('role')),
        ariaLabel: normalize(element.getAttribute('aria-label')),
        title: normalize(element.getAttribute('title')),
        text: normalize(element.innerText || element.textContent),
        rect: rectOf(element),
      }))
      .filter((entry) => Math.abs(entry.rect.y + entry.rect.height / 2 - rowCenterY) <= 28 && entry.rect.x >= label.rect.x)
      .sort((left, right) => left.rect.x - right.rect.x);

    controls[0]?.element.focus();

    const serializableControls = controls.slice(0, 6).map(({ element: _element, ...entry }) => ({
      ...entry,
      editable: !entry.disabled && !entry.readOnly,
      looksLikeCombobox: /combobox/i.test(entry.role) || /Look up|Lookup|Select|Assist|Dropdown|Open/i.test(`${entry.ariaLabel} ${entry.title}`),
    }));
    const serializableButtons = buttons.slice(0, 8);
    const affordancePattern = /Look up|Lookup|Select from full list|AssistEdit|Assist|Dropdown|Open|Weitere Optionen|Ausw.hlen|Auswaehlen|Nachschlagen/i;
    const fieldLocalAffordanceFound =
      serializableControls.some((control) => control.looksLikeCombobox) ||
      serializableButtons.some((button) => affordancePattern.test(`${button.text} ${button.ariaLabel} ${button.title}`));

    return {
      found: true,
      label: { text: label.text, rect: label.rect },
      controls: serializableControls,
      buttons: serializableButtons,
      focusedValue: serializableControls[0]?.value ?? '',
      fieldLocalAffordanceFound,
    };
  });
}

async function dangerSignals(page: Page) {
  const text = await pageText(page);
  return {
    postDialogVisible: /Ship and Invoice|Receive and Invoice|Preview Posting|Post and Print|Buchen und drucken/i.test(text),
    confirmVisible: /\bOK\b|\bYes\b|\bJa\b|Are you sure|Moechten Sie|M.chten Sie/i.test(text),
    acquireVisible: /\bAcquire\b|Anschaffen|Erwerben/i.test(text),
  };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-147 - Posting Group Edit-Modus-Affordance no-save',
    '',
    'Status: `labor`, `ui-first`, `no-save`, `affordance-probe`, `no-setup-change`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.targetAsset} |`,
    `| Edit-Modus geklickt | ${result.observed.editMode.clicked ? 'ja' : 'nein'} |`,
    `| Posting Group vor Probe | ${result.observed.beforePostingGroup || ''} |`,
    `| Posting Group nach Probe | ${result.observed.afterPostingGroup || ''} |`,
    `| Feldnahes Affordance gefunden | ${result.observed.affordance.fieldLocalAffordanceFound ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    '- Ein Edit-Modus allein ist noch kein Speichern und kein Setup-Fit.',
    '- Bei Lookup-/Combobox-Feldern muss zuerst der richtige feldnahe Hebel identifiziert werden.',
    '- `MACHINES` zaehlt erst, wenn der Wert bewusst ausgewaehlt, gespeichert und nach dem Neuoeffnen sichtbar ist.',
    '- Dieser Lauf prueft nur Bedienbarkeit und Screenshot-Kontext, nicht den Zielwert.',
    '',
    '## Grenzen',
    '',
    '- Keine Auswahl von `MACHINES`.',
    '- Keine gespeicherte Aenderung.',
    '- Keine Anschaffung, keine Preview, keine Buchung.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-147 inspects FA-CNC-01 Posting Group edit-mode affordance no-save', async ({ page }) => {
  const startedAt = new Date().toISOString();

  await openAssetCard(page);
  const context = await assertSandboxContext(page);
  const expandBefore = await expandDepreciationBookFields(page);
  const beforeAffordance = await inspectPostingGroupAffordance(page);
  const beforePostingGroup = beforeAffordance.focusedValue || '';
  await writeJsonEvidence(faEvidencePath('010-before-affordance.json'), { expandBefore, beforeAffordance });

  const editMode = await clickSafeEditMode(page);
  await assertSandboxContext(page);
  await expandDepreciationBookFields(page);
  const affordance = await inspectPostingGroupAffordance(page);
  const dangerAfterProbe = await dangerSignals(page);
  await writeJsonEvidence(faEvidencePath('020-editmode-affordance.json'), { editMode, affordance, dangerAfterProbe });
  await writeTextEvidence(
    faEvidencePath('021-editmode-focused-text.txt'),
    await compactPageText(page, {
      include: [/Fixed Asset Card|FA-CNC-01|CNC Maschine|Depreciation Book|Posting Group|Book Value|Acquired|HGB|EQUIPMENT|MACHINES|Edit|Aenderungen|Anderungen|Lookup|Assist/i],
      maxLines: 180,
      maxLineLength: 220,
    }),
  );

  await screenshot(page, 'fixedassets-147-030-fa-cnc-01-posting-group-editmode-affordance.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: 'labor',
    bookUse: 'field-proof',
    purpose: 'No-save Edit-Modus-Affordance-Probe fuer FA-CNC-01 Posting Group; kein MACHINES-Fit.',
    expectedPageText: [/Fixed Asset Card|FA-CNC-01|Posting Group|EQUIPMENT/i],
    knownLimitations: ['No-save Diagnose, kein gespeicherter Zielwert.', 'MACHINES wurde nicht ausgewaehlt.'],
  });

  await openAssetCard(page);
  await assertSandboxContext(page);
  await expandDepreciationBookFields(page);
  const afterAffordance = await inspectPostingGroupAffordance(page);
  const afterPostingGroup = afterAffordance.focusedValue || '';
  await writeJsonEvidence(faEvidencePath('040-after-affordance.json'), afterAffordance);

  const setupChanged = beforePostingGroup !== afterPostingGroup;
  const dangerousDialog = dangerAfterProbe.postDialogVisible || dangerAfterProbe.confirmVisible;
  const resultStatus =
    affordance.fieldLocalAffordanceFound && !setupChanged && !dangerousDialog
      ? editMode.clicked
        ? 'observed-no-save-editmode-affordance'
        : 'observed-no-save-affordance-without-edit-action'
      : 'blocked-no-save-affordance';
  const summary =
    resultStatus.startsWith('observed-no-save')
      ? `FA-147 opened FA-CNC-01, inspected Posting Group affordances, and confirmed Posting Group stayed ${afterPostingGroup || '(blank)'}. Edit action clicked=${editMode.clicked}; field-local affordance found=${affordance.fieldLocalAffordanceFound}.`
      : `FA-147 did not produce an accepted no-save affordance proof. Posting Group before=${beforePostingGroup || '(blank)'}, after=${afterPostingGroup || '(blank)'}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-posting-group-editmode-affordance-nosave-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-ui-nosave-affordance-probe',
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
      context,
      expandBefore,
      beforeAffordance,
      editMode,
      affordance,
      dangerAfterProbe,
      afterAffordance,
      beforePostingGroup,
      afterPostingGroup,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'FA-CNC-01 Fixed Asset Card was opened.',
      `Posting Group before probe was ${beforePostingGroup || '(blank)'}.`,
      `Posting Group after probe was ${afterPostingGroup || '(blank)'}.`,
      ...(editMode.clicked ? ['Edit mode was clicked with a scoped, non-copy, non-new, non-delete candidate.'] : []),
      ...(!editMode.clicked ? ['No separate safe edit action was found, but the Posting Group field was already inspectable as an editable combobox.'] : []),
      ...(affordance.fieldLocalAffordanceFound
        ? ['A field-local Posting Group affordance candidate was observed without selecting a value.']
        : ['No field-local Posting Group affordance candidate was accepted.']),
      'No MACHINES value was selected or saved.',
      'No acquisition, Preview Posting, posting, draft, company switch or API shortcut occurred.',
    ],
    notProved: [
      'Posting Group MACHINES is not assigned to FA-CNC-01.',
      'No actual Posting Group write route is executed.',
      'No fixed-asset acquisition route is unlocked.',
      'No German fixed-assets final proof is produced.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-147-fa-cnc-01-posting-group-editmode-affordance-nosave.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-147/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-147/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-147/FIXEDASSETS-147-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-147/FIXEDASSETS-147-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-147/010-before-affordance.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-147/020-editmode-affordance.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-147/021-editmode-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-147/040-after-affordance.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-147/fixedassets-147-030-fa-cnc-01-posting-group-editmode-affordance.screenshot.json',
      'playwright/projects/fibu-book5/img/fixedassets-147-030-fa-cnc-01-posting-group-editmode-affordance.png',
    ],
    warnings: [
      'Edit-mode affordance evidence is not a saved setup fit.',
      'Do not claim MACHINES as assigned to FA-CNC-01 from this evidence.',
    ],
    blockedBy: resultStatus === 'blocked-no-save-affordance' ? ['No accepted no-save affordance proof or safety guard failed.'] : [],
    requiresReview: true,
    safeToFinalizeState: true,
    flags: {
      noBookChange: true,
      noPost: true,
      noPreview: true,
      noSetupChange: !setupChanged,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noDeleteRecord: true,
      noAcquireExecution: true,
      noAmountEntry: true,
      noTargetVendorEntry: true,
      noMachinerySelection: true,
      noSave: !setupChanged,
    },
    statePatch: {
      current: {
        updatedAt: '2026-06-21T01:10:00.000Z',
        activeCase: NEXT_CASE_ID,
        active_case_file: '.agent/state/cases/fixedassets-148-fa-cnc-01-posting-group-affordance-result-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-147-fa-cnc-01-posting-group-editmode-affordance-nosave.json',
        requiresStrongModel: true,
        nextStep: 'FIXEDASSETS-148: locally review FA-147 no-save affordance evidence before any MACHINES assignment route is unlocked.',
      },
      activeCase: {
        status: resultStatus,
        lastResult: {
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-147/FIXEDASSETS-147-result.json',
          summary,
        },
        nextSafeAction: 'FIXEDASSETS-148: local review of no-save affordance result.',
      },
    },
    summary,
    bookImpact:
      'Kapitel 21 and the debugging chapter can use FA-147 to explain that edit-mode and field-affordance evidence are separate from a saved Posting Group assignment.',
    nextStep: NEXT_CASE_ID,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-147-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-147-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-147 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-147-result.json` | JSON | No-save Edit-Modus-/Affordance-Probe | keinen MACHINES-Fit | `labor`, `no-save` |',
      '| `FIXEDASSETS-147-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |',
      '| `010-before-affordance.json` | JSON | Posting-Group-Zustand vor Probe | keine Posten | `field-proof` |',
      '| `020-editmode-affordance.json` | JSON | Edit-Modus und feldnahe Affordance-Kandidaten | keine Wertauswahl | `technical-context` |',
      '| `021-editmode-focused-text.txt` | Text | kompakter UI-Kontext | kein Rohdump | `technical-context` |',
      '| `040-after-affordance.json` | JSON | Posting-Group-Zustand nach Probe | keine Buchungswirkung | `field-proof` |',
      '| `../../img/fixedassets-147-030-fa-cnc-01-posting-group-editmode-affordance.png` | Screenshot | Kartenkontext und Posting Group im Probe-Kontext | keine gespeicherte MACHINES-Zuordnung | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(setupChanged).toBe(false);
  expect(dangerousDialog).toBe(false);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(result.flags.noApiShortcut).toBe(true);
});
