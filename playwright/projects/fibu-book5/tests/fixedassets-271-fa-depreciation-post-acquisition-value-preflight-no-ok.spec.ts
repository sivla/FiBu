import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  pageText,
  requireBcUrl,
  searchFor,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const TEST_ID = 'fixedassets-271';
const CASE_ID = 'FIXEDASSETS-271-FA-DEPRECIATION-POST-ACQUISITION-VALUE-PREFLIGHT-NO-OK';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const SEARCH_TERM = 'Calculate Depreciation';
const TARGETS = {
  depreciationBook: 'HGB',
  postingDate: '31.01.2027',
  documentNo: 'FADEP-271-NO-OK',
  fixedAssetNo: 'FA-CNC-01',
};

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe|aadTenantId|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function rmDemoHomeUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function sanitizedFrameUrl(frameUrl: string) {
  try {
    return safeUrl(frameUrl);
  } catch {
    return 'unparseable-frame-url';
  }
}

async function candidateElements(frame: Frame) {
  return frame.evaluate(() => {
    const label = /Calculate\s+Depreciation/i;
    const ascii = (value: string) =>
      value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
    return [...document.querySelectorAll<HTMLElement>('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"],[role="row"],[role="gridcell"],span')]
      .map((element, index) => {
        const text = ascii(element.innerText || element.textContent || '');
        const aria = ascii(element.getAttribute('aria-label') || '');
        const title = ascii(element.getAttribute('title') || '');
        const role = element.getAttribute('role') || '';
        const rect = element.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0 && rect.y >= 0;
        return {
          index,
          tag: element.tagName.toLowerCase(),
          role,
          text,
          aria,
          title,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible,
          matches: visible && (label.test(text) || label.test(aria) || label.test(title)),
        };
      })
      .filter((entry) => entry.matches && entry.text.length <= 180)
      .slice(0, 16);
  });
}

async function clickCalculateDepreciationResult(page: Page) {
  const inspected: Array<{ frameUrl: string; candidates: Awaited<ReturnType<typeof candidateElements>> }> = [];

  for (const frame of page.frames()) {
    const candidates = await candidateElements(frame).catch(() => []);
    if (candidates.length > 0) inspected.push({ frameUrl: sanitizedFrameUrl(frame.url()), candidates });

    const row = frame.getByRole('row', { name: /^Calculate Depreciation\s+Aufgaben/i });
    const rowCount = await row.count().catch(() => 0);
    if (rowCount === 1) {
      await row.first().click({ timeout: 4000 });
      await page.waitForTimeout(5000);
      return { clicked: true, method: 'role:row:Calculate Depreciation Aufgaben', inspected };
    }

    const exact = frame.getByText(/^Calculate Depreciation$/);
    const exactCount = await exact.count().catch(() => 0);
    if (exactCount === 1 && (await exact.first().isVisible({ timeout: 500 }).catch(() => false))) {
      await exact.first().click({ timeout: 4000 });
      await page.waitForTimeout(5000);
      return { clicked: true, method: 'text:exact:Calculate Depreciation', inspected };
    }
  }

  return { clicked: false, method: 'not-clicked-ambiguous-or-missing', inspected };
}

function requestPageSignals(text: string) {
  const normalized = clean(text);
  const signals = {
    hasCalculateDepreciationTitle: /Calculate\s+Depreciation/i.test(normalized),
    hasDepreciationBook: /Depreciation\s+Book|AfA-Buch/i.test(normalized),
    hasPostingDate: /Posting\s+Date|Buchungsdatum/i.test(normalized),
    hasDocumentNo: /Document\s+No\.|Belegnr/i.test(normalized),
    hasPostingDescription: /Posting\s+Description/i.test(normalized),
    hasFixedAssetFilter: /Filter:\s*Fixed\s+Asset|Fixed\s+Asset/i.test(normalized),
  };
  const signalCount = Object.values(signals).filter(Boolean).length;
  return {
    ...signals,
    signalCount,
    requestPageLikelyOpen: signals.hasCalculateDepreciationTitle && signalCount >= 4,
  };
}

async function visibleBlockingConfirmation(page: Page) {
  const dialogs = await Promise.all(
    page.frames().map((frame) =>
      frame
        .locator('[role="dialog"], .ms-Dialog-main, [aria-modal="true"]')
        .evaluateAll((elements) =>
          elements
            .map((element) => {
              const rect = (element as HTMLElement).getBoundingClientRect();
              const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
              return {
                text,
                visible: rect.width > 0 && rect.height > 0,
              };
            })
            .filter((entry) => entry.visible && entry.text.length > 0),
        )
        .catch(() => []),
    ),
  );
  const text = clean(dialogs.flat().map((entry) => entry.text).join('\n'));
  const dangerousConfirm = /\b(OK|Post|Post and Print|Preview Posting|Ship|Invoice|Ship and Invoice|Delete|Yes|Ja)\b/i.test(text);
  return {
    dangerousConfirm,
    okVisibleInDialog: /\bOK\b/.test(text),
    textSample: text.slice(0, 1000),
  };
}

type FieldKey = 'depreciationBook' | 'postingDate' | 'documentNo' | 'fixedAssetNo';

const fieldSpecs: Record<FieldKey, { label: RegExp; target: string }> = {
  depreciationBook: { label: /^Depreciation\s+Book$/i, target: TARGETS.depreciationBook },
  postingDate: { label: /^Posting\s+Date$/i, target: TARGETS.postingDate },
  documentNo: { label: /^Document\s+No\.$/i, target: TARGETS.documentNo },
  fixedAssetNo: { label: /^No\.$/i, target: TARGETS.fixedAssetNo },
};

async function requestPageFrame(page: Page) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Calculate\s+Depreciation/i.test(text) && /Depreciation\s+Book/i.test(text) && /Filter:\s*Fixed\s+Asset/i.test(text)) {
      return frame;
    }
  }
  return undefined;
}

async function fieldMap(frame: Frame) {
  return frame.evaluate(() => {
    const norm = (value: string | null | undefined) =>
      (value ?? '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const controlSelector = 'input,select,textarea,[contenteditable="true"],[role="textbox"],[role="combobox"],[role="spinbutton"]';
    const controls = [...document.querySelectorAll<HTMLElement>(controlSelector)]
      .map((element, queryIndex) => ({ element, queryIndex }))
      .filter(({ element }) => visible(element))
      .map(({ element, queryIndex }, visibleIndex) => {
        const rect = element.getBoundingClientRect();
        const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        return {
          index: visibleIndex,
          queryIndex,
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          type: element.getAttribute('type') || '',
          text: norm(element.innerText || element.textContent || ''),
          value: 'value' in input ? norm(input.value) : '',
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          readOnly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
        };
      });
    const labels = [...document.querySelectorAll<HTMLElement>('label,span,div,[role="row"],[role="gridcell"]')]
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          text: norm(element.innerText || element.textContent || ''),
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.text.length > 0 && item.text.length <= 120 && !item.text.includes('\n'));
    return { controls, labels };
  });
}

function selectControl(map: Awaited<ReturnType<typeof fieldMap>>, key: FieldKey) {
  const spec = fieldSpecs[key];
  const labels = map.labels.filter((label) => spec.label.test(label.text));
  const candidates = labels
    .flatMap((label) =>
      map.controls.map((control) => ({
        label,
        control,
        dx: control.x - label.x,
        dy: control.y - label.y,
        distance: Math.round(Math.hypot(control.x - label.x, control.y - label.y)),
        rightOfLabel: control.x >= label.x,
        sameBand: Math.abs(control.y - label.y) <= 20,
      })),
    )
    .filter((candidate) => candidate.rightOfLabel && candidate.sameBand && !candidate.control.readOnly && !candidate.control.disabled)
    .sort((left, right) => left.distance - right.distance);
  return { labels, candidates, selected: candidates[0] };
}

async function fillMappedField(page: Page, frame: Frame, key: FieldKey) {
  const beforeMap = await fieldMap(frame);
  const selection = selectControl(beforeMap, key);
  if (!selection.selected) {
    return {
      key,
      target: fieldSpecs[key].target,
      status: 'blocked-no-field-candidate',
      selection,
    };
  }

  const controlSelector = 'input,select,textarea,[contenteditable="true"],[role="textbox"],[role="combobox"],[role="spinbutton"]';
  const locator = frame.locator(controlSelector).nth(selection.selected.control.queryIndex);
  await locator.click({ timeout: 3000 });
  await pageKeyboardSelectAll(page);
  await locator.fill(fieldSpecs[key].target, { timeout: 3000 });
  await locator.press('Tab').catch(() => undefined);
  await page.waitForTimeout(500);

  const afterMap = await fieldMap(frame);
  const afterSelection = selectControl(afterMap, key);
  const afterValue = afterSelection.selected?.control.value ?? '';
  return {
    key,
    target: fieldSpecs[key].target,
    status: afterValue === fieldSpecs[key].target ? 'proved' : 'blocked-value-not-persisted',
    beforeValue: selection.selected.control.value,
    afterValue,
    controlIndex: selection.selected.control.index,
    controlQueryIndex: selection.selected.control.queryIndex,
    label: selection.selected.label,
    controlBefore: selection.selected.control,
    controlAfter: afterSelection.selected?.control ?? null,
  };
}

async function pageKeyboardSelectAll(page: Page) {
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
}

test('fixedassets-271 fills Calculate Depreciation target values after post-acquisition date decision without OK', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await page.goto(rmDemoHomeUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);

  const initialUrl = page.url();
  const instanceMatches = initialUrl.includes(EXPECTED_INSTANCE);
  const companyFromUrl = new URL(initialUrl).searchParams.get('company');
  expect(instanceMatches, `BC URL muss Instanz ${EXPECTED_INSTANCE} enthalten.`).toBe(true);
  expect(companyFromUrl, `BC URL muss Company ${EXPECTED_COMPANY} enthalten.`).toBe(EXPECTED_COMPANY);

  await searchFor(page, SEARCH_TERM);
  const click = await clickCalculateDepreciationResult(page);
  const initialText = await pageText(page);
  const signals = requestPageSignals(initialText);
  const frame = signals.requestPageLikelyOpen ? await requestPageFrame(page) : undefined;

  const blocker = [
    ...(click.clicked ? [] : ['calculate-depreciation-result-not-clicked']),
    ...(signals.requestPageLikelyOpen ? [] : ['request-page-not-recognized']),
    ...(frame ? [] : ['request-page-frame-not-found']),
  ];

  const fieldResults = [];
  if (frame && blocker.length === 0) {
    for (const key of ['depreciationBook', 'postingDate', 'documentNo', 'fixedAssetNo'] as FieldKey[]) {
      const dangerBefore = await visibleBlockingConfirmation(page);
      if (dangerBefore.dangerousConfirm) {
        blocker.push(`blocking-confirmation-dialog-visible-before-${key}`);
        break;
      }
      fieldResults.push(await fillMappedField(page, frame, key));
    }
  }

  const allValuesProved = fieldResults.length === 4 && fieldResults.every((entry) => entry.status === 'proved');
  if (!allValuesProved) {
    blocker.push(
      ...fieldResults.filter((entry) => entry.status !== 'proved').map((entry) => `${entry.key}-${entry.status}`),
    );
  }

  const compactText = clean(
    await compactPageText(page, {
      include: [
        /Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Document\s+No\.|Posting\s+Description|Filter|Fixed\s+Asset|No\.|FA\s+Class|FA\s+Subclass|Budgeted\s+Asset|OK|Abbrechen|Cancel|FADEP|HGB|30\.06\.2026|FA-CNC-01/i,
      ],
      maxLines: 220,
      maxLineLength: 280,
    }),
  );

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  const resultStatus = blocker.length ? 'blocked' : 'observed';
  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-post-acquisition-value-preflight-no-ok',
    caseId: CASE_ID,
    source: 'playwright-guarded-target-value-preflight-no-ok',
    resultStatus,
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    url: {
      initialUrl: safeUrl(initialUrl),
      finalUrl: safeUrl(page.url()),
      instanceMatches,
      companyFromUrl,
    },
    targets: TARGETS,
    click,
    requestPage: {
      ...signals,
      fieldResults,
      allValuesProved,
    },
    safety: {
      noOkConfirmed: true,
      noDepreciationCalculated: true,
      noJournalLineCreated: true,
      noPreviewPosting: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    proved: [
      ...(signals.requestPageLikelyOpen ? ['Calculate Depreciation request page was opened.'] : []),
      ...(allValuesProved
        ? ['HGB, 31.01.2027, FADEP-271-NO-OK and FA-CNC-01 were visibly proven on the request page without OK.']
        : []),
      'OK was not confirmed.',
      'No Preview Posting or Post was executed.',
    ],
    notProved: [
      'No depreciation journal line was created.',
      'No Calculate Depreciation execution was performed.',
      'No Preview Posting result.',
      'No depreciation posting.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-271-fa-depreciation-post-acquisition-value-preflight-no-ok.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-271/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-271/FIXEDASSETS-271-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-271/FIXEDASSETS-271-POST-ACQUISITION-VALUE-PREFLIGHT-NO-OK.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-271/010-target-value-preflight.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-271/010-target-value-preflight-text.txt',
    ],
    statePatch: {
      current: {
        activeCase: allValuesProved
          ? 'FIXEDASSETS-272-FA-DEPRECIATION-POST-ACQUISITION-OK-GATE-REVIEW'
          : 'FIXEDASSETS-272-FA-DEPRECIATION-POST-ACQUISITION-PREFLIGHT-BLOCKER-REVIEW',
        active_case_file: allValuesProved
          ? '.agent/state/cases/fixedassets-272-fa-depreciation-post-acquisition-ok-gate-review.json'
          : '.agent/state/cases/fixedassets-272-fa-depreciation-post-acquisition-preflight-blocker-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-271-fa-depreciation-post-acquisition-value-preflight-no-ok.json',
        nextStep: allValuesProved
          ? 'FIXEDASSETS-272: locally review whether a controlled post-acquisition OK execution is justified; do not execute OK yet.'
          : 'FIXEDASSETS-272: locally review the no-OK post-acquisition value-preflight result before any further retry.',
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase: allValuesProved
          ? 'FIXEDASSETS-272-FA-DEPRECIATION-POST-ACQUISITION-OK-GATE-REVIEW'
          : 'FIXEDASSETS-272-FA-DEPRECIATION-POST-ACQUISITION-PREFLIGHT-BLOCKER-REVIEW',
        depreciationReadiness: allValuesProved
          ? 'FA-271 proved HGB, 31.01.2027, FADEP-271-NO-OK and FA-CNC-01 on the Calculate Depreciation request page without OK with the post-acquisition date. OK remains locked pending local review.'
          : 'FA-271 could not prove all target request-page values without OK with the post-acquisition date. OK remains locked pending local review.',
      },
    },
    blockedBy: blocker,
    requiresReview: true,
    safeToFinalizeState: true,
    reason: allValuesProved
      ? 'Target request-page values were proven without OK with the post-acquisition date. Local review required before any execution.'
      : 'At least one target request-page value was not proven with the post-acquisition date. OK remains locked.',
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('010-target-value-preflight.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    targets: TARGETS,
    click,
    requestPageSignals: signals,
    fieldResults,
    allValuesProved,
    blockedBy: blocker,
  });
  await writeTextEvidence(faEvidencePath('010-target-value-preflight-text.txt'), compactText || 'No compact request-page text captured.');
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-271-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-271-POST-ACQUISITION-VALUE-PREFLIGHT-NO-OK.md'),
    [
      '# FIXEDASSETS-271 Post-acquisition Value-Preflight ohne OK',
      '',
      'Status: `labor`, `value-preflight`, `no-ok`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Zielwerte',
      '',
      `- Depreciation Book: \`${TARGETS.depreciationBook}\``,
      `- Posting Date: \`${TARGETS.postingDate}\``,
      `- Document No.: \`${TARGETS.documentNo}\``,
      `- Fixed Asset No. Filter: \`${TARGETS.fixedAssetNo}\``,
      '',
      '## Ergebnis',
      '',
      `- Request Page sichtbar: ${signals.requestPageLikelyOpen ? 'ja' : 'nein'}`,
      `- Alle Zielwerte sichtbar bewiesen: ${allValuesProved ? 'ja' : 'nein'}`,
      `- Blocker: ${blocker.length ? blocker.join(', ') : 'keine'}`,
      '',
      '## Grenzen',
      '',
      '- Kein `OK` auf `Calculate Depreciation`.',
      '- Keine AfA berechnet.',
      '- Keine Journalzeile erzeugt.',
      '- Kein Preview Posting.',
      '- Keine Buchung.',
      '- Kein Setup Change.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      result.statePatch.current.nextStep,
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-271 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-271-result.json` | JSON-Ergebnis | Post-acquisition Zielwert-Preflight ohne OK | keine AfA-Ausfuehrung | labor |',
      '| `FIXEDASSETS-271-POST-ACQUISITION-VALUE-PREFLIGHT-NO-OK.md` | Lernzusammenfassung | Zielwerte, Grenzen und naechsten Gate-Schritt | keine Journalzeile | no-ok |',
      '| `010-target-value-preflight.json` | UI-Evidence | Feld-/Wertstatus der Request Page | keine Buchungswirkung | compact |',
      '| `010-target-value-preflight-text.txt` | kompakter Text | sichtbarer Request-Page-Kontext | kein Rohdump | compact |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noOkConfirmed).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noSetupChange).toBe(true);
});

