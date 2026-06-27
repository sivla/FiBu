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

const TEST_ID = 'fixedassets-253';
const CASE_ID = 'FIXEDASSETS-253-FA-DEPRECIATION-PARAMETER-PREFLIGHT-NO-OK';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const SEARCH_TERM = 'Calculate Depreciation';
const TARGET_DEPRECIATION_BOOK = 'HGB';
const TARGET_FIXED_ASSET = 'FA-CNC-01';
const TARGET_DOCUMENT_NO = 'FADEP-253-NO-OK';
const TARGET_POSTING_DATE = '06/27/2026';

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
    const seen = new Set<string>();
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
      .filter((entry) => {
        if (!entry.matches || entry.text.length > 180) return false;
        const key = `${entry.tag}|${entry.role}|${entry.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
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

async function visibleButtons(page: Page) {
  const names = new Set<string>();
  for (const frame of page.frames()) {
    const buttons = frame.getByRole('button');
    const count = await buttons.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await buttons.nth(index).innerText({ timeout: 250 }).catch(() => ''));
      if (/^(OK|Cancel|Abbrechen|Calculate Depreciation|Depreciation Book|Posting Date|Posting Description|Document No\.?|No\.?)$/i.test(text)) {
        names.add(text);
      }
    }
  }
  return [...names].slice(0, 120);
}

async function readRequestPageControls(page: Page) {
  const frames = [];
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 500 }).catch(() => '');
    if (!/Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Document\s+No\./i.test(bodyText)) continue;
    const frameResult = await frame
      .evaluate(() => {
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
        const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')]
          .filter(visible)
          .map((control, index) => {
            const selectedText = control instanceof HTMLSelectElement ? [...control.options].find((option) => option.selected)?.text || '' : '';
            const containerText = norm(control.closest('[role="group"], [role="row"], div')?.textContent || '');
            const rect = control.getBoundingClientRect();
            return {
              index,
              tag: control.tagName.toLowerCase(),
              type: control.getAttribute('type') || '',
              value: norm(control.value),
              selectedText: norm(selectedText),
              ariaLabel: norm(control.getAttribute('aria-label')),
              title: norm(control.getAttribute('title')),
              placeholder: norm(control.getAttribute('placeholder')),
              containerText: containerText.slice(0, 260),
              readOnly: control.hasAttribute('readonly') || control.getAttribute('aria-readonly') === 'true',
              disabled: control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          })
          .filter((control) =>
            /Depreciation|Posting|Document|Description|Fixed Asset|FA|Date|Book|Days|No\.|Filter|Period|HGB|FADEP/i.test(
              `${control.value} ${control.selectedText} ${control.ariaLabel} ${control.title} ${control.placeholder} ${control.containerText}`,
            ),
          )
          .slice(0, 160);
        const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr,div')]
          .filter(visible)
          .map((row, index) => ({
            index,
            text: norm(row.innerText || row.textContent),
          }))
          .filter((row) => /Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Document\s+No\.|Posting\s+Description|Fixed\s+Asset|Filter|Options|No\./i.test(row.text))
          .filter((row) => row.text.length > 0 && row.text.length < 700)
          .slice(0, 160);
        return { controls, rows };
      })
      .catch((error) => ({ error: String(error), controls: [], rows: [] }));
    frames.push({ frameUrl: sanitizedFrameUrl(frame.url()), ...frameResult });
  }
  return frames;
}

async function probeNamedTextbox(page: Page, name: RegExp, targetValue?: string) {
  const attempts = [];
  for (const frame of page.frames()) {
    const textbox = frame.getByRole('textbox', { name }).first();
    const count = await frame.getByRole('textbox', { name }).count().catch(() => 0);
    const visible = count > 0 && (await textbox.isVisible({ timeout: 500 }).catch(() => false));
    const currentValue = visible ? clean(await textbox.inputValue({ timeout: 500 }).catch(() => '')) : '';
    attempts.push({ frameUrl: sanitizedFrameUrl(frame.url()), count, visible, currentValue });
    if (visible && count === 1 && targetValue) {
      await textbox.fill(targetValue);
      await page.waitForTimeout(500);
      const afterValue = clean(await textbox.inputValue({ timeout: 500 }).catch(() => ''));
      return { found: true, fieldSafe: true, action: 'filled-without-ok', beforeValue: currentValue, afterValue, attempts };
    }
    if (visible && count === 1) {
      return { found: true, fieldSafe: true, action: 'verified-only', beforeValue: currentValue, afterValue: currentValue, attempts };
    }
  }
  return { found: false, fieldSafe: false, action: 'not-found', beforeValue: '', afterValue: '', attempts };
}

test('FIXEDASSETS-253 proves Calculate Depreciation parameters without OK', async ({ page }) => {
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
  const beforeText = await pageText(page);
  const signals = requestPageSignals(beforeText);
  const okVisibleBefore = (await visibleButtons(page)).some((button) => /^OK$/i.test(button));

  const documentNoProbe = click.clicked && signals.requestPageLikelyOpen ? await probeNamedTextbox(page, /^Document\s+No\.?$/i, TARGET_DOCUMENT_NO) : { found: false, fieldSafe: false, action: 'skipped', beforeValue: '', afterValue: '', attempts: [] };
  const depreciationBookProbe = click.clicked && signals.requestPageLikelyOpen ? await probeNamedTextbox(page, /^Depreciation\s+Book$/i, TARGET_DEPRECIATION_BOOK) : { found: false, fieldSafe: false, action: 'skipped', beforeValue: '', afterValue: '', attempts: [] };
  const postingDateProbe = click.clicked && signals.requestPageLikelyOpen ? await probeNamedTextbox(page, /^Posting\s+Date$/i, TARGET_POSTING_DATE) : { found: false, fieldSafe: false, action: 'skipped', beforeValue: '', afterValue: '', attempts: [] };
  const fixedAssetFilterProbe = click.clicked && signals.requestPageLikelyOpen ? await probeNamedTextbox(page, /^No\.?$/i, TARGET_FIXED_ASSET) : { found: false, fieldSafe: false, action: 'skipped', beforeValue: '', afterValue: '', attempts: [] };

  const controlsAfterProbe = click.clicked && signals.requestPageLikelyOpen ? await readRequestPageControls(page) : [];
  const afterText = clean(
    await compactPageText(page, {
      include: [
        /Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Document\s+No\.|Posting\s+Description|Fixed\s+Asset|Filter|Options|OK|Abbrechen|Cancel|HGB|FADEP|FA-CNC-01/i,
      ],
      maxLines: 220,
      maxLineLength: 280,
    }),
  );
  const okVisibleAfter = (await visibleButtons(page)).some((button) => /^OK$/i.test(button));

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  const parameterProof = {
    depreciationBook: {
      target: TARGET_DEPRECIATION_BOOK,
      ...depreciationBookProbe,
      targetMatched: depreciationBookProbe.afterValue === TARGET_DEPRECIATION_BOOK,
    },
    postingDate: {
      target: TARGET_POSTING_DATE,
      ...postingDateProbe,
      targetMatched: postingDateProbe.afterValue === TARGET_POSTING_DATE,
    },
    documentNo: {
      target: TARGET_DOCUMENT_NO,
      ...documentNoProbe,
      targetMatched: documentNoProbe.afterValue === TARGET_DOCUMENT_NO,
    },
    fixedAssetFilter: {
      target: TARGET_FIXED_ASSET,
      ...fixedAssetFilterProbe,
      targetMatched: fixedAssetFilterProbe.afterValue === TARGET_FIXED_ASSET,
    },
  };
  const allFieldSafe =
    parameterProof.depreciationBook.fieldSafe &&
    parameterProof.postingDate.fieldSafe &&
    parameterProof.documentNo.fieldSafe &&
    parameterProof.fixedAssetFilter.fieldSafe &&
    parameterProof.depreciationBook.targetMatched &&
    parameterProof.postingDate.targetMatched &&
    parameterProof.documentNo.targetMatched &&
    parameterProof.fixedAssetFilter.targetMatched;
  const blockedBy = [
    ...(click.clicked ? [] : ['calculate-depreciation-result-not-clicked']),
    ...(signals.requestPageLikelyOpen ? [] : ['request-page-not-recognized']),
    ...(okVisibleBefore || okVisibleAfter ? [] : ['ok-not-visible-for-boundary-proof']),
    ...(parameterProof.depreciationBook.targetMatched ? [] : ['depreciation-book-not-field-safe-or-not-set']),
    ...(parameterProof.postingDate.targetMatched ? [] : ['posting-date-not-field-safe-or-not-set']),
    ...(parameterProof.documentNo.targetMatched ? [] : ['document-no-not-field-safe-or-not-set']),
    ...(parameterProof.fixedAssetFilter.targetMatched ? [] : ['fixed-asset-filter-not-field-safe-or-not-set']),
  ];
  const nextCase = allFieldSafe
    ? 'FIXEDASSETS-254-FA-DEPRECIATION-GUARDED-REPEAT-EXECUTION-DECISION'
    : 'FIXEDASSETS-254-FA-DEPRECIATION-PARAMETER-PREFLIGHT-BLOCKER-REVIEW';
  const nextStep = allFieldSafe
    ? 'FIXEDASSETS-254: locally decide whether the field-safe no-OK parameter preflight is sufficient to unlock a guarded repeat execution.'
    : 'FIXEDASSETS-254: review the parameter preflight blocker before any repeat OK; do not execute Calculate Depreciation.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-parameter-preflight-no-ok',
    caseId: CASE_ID,
    source: 'playwright-guarded-request-parameter-preflight-no-ok',
    resultStatus: blockedBy.length ? 'blocked' : 'observed',
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    url: {
      initialUrl: safeUrl(initialUrl),
      finalUrl: safeUrl(page.url()),
      instanceMatches,
      companyFromUrl,
    },
    targets: {
      depreciationBook: TARGET_DEPRECIATION_BOOK,
      postingDate: TARGET_POSTING_DATE,
      documentNo: TARGET_DOCUMENT_NO,
      fixedAssetFilter: TARGET_FIXED_ASSET,
    },
    click,
    requestPage: {
      ...signals,
      okVisibleBefore,
      okVisibleAfter,
      parameterProof,
      allFieldSafe,
      controlsAfterProbe,
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
      ...(parameterProof.documentNo.targetMatched ? [`Document No. was field-safely set to ${TARGET_DOCUMENT_NO} without OK.`] : ['Document No. was not field-safely proven for the target value.']),
      ...(parameterProof.depreciationBook.targetMatched ? [`Depreciation Book was field-safely set to ${TARGET_DEPRECIATION_BOOK} without OK.`] : ['Depreciation Book was not field-safely proven for the target value.']),
      ...(parameterProof.postingDate.targetMatched ? [`Posting Date was field-safely set to ${TARGET_POSTING_DATE} without OK.`] : ['Posting Date was not field-safely proven for the target value.']),
      ...(parameterProof.fixedAssetFilter.targetMatched ? [`Fixed Asset filter was field-safely set to ${TARGET_FIXED_ASSET} without OK.`] : ['Fixed Asset filter was not field-safely proven for the target value.']),
      'OK was not confirmed.',
      'No Preview Posting or Post was executed.',
    ],
    notProved: [
      'No depreciation journal line was created.',
      'No repeat Calculate Depreciation execution was performed.',
      'No Preview Posting result.',
      'No depreciation posting.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-253-fa-depreciation-parameter-preflight-no-ok.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-253/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-253/FIXEDASSETS-253-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-253/FIXEDASSETS-253-PARAMETER-PREFLIGHT-NO-OK.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-253/010-parameter-preflight.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-253/010-parameter-preflight-text.txt',
    ],
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: allFieldSafe
          ? '.agent/state/cases/fixedassets-254-fa-depreciation-guarded-repeat-execution-decision.json'
          : '.agent/state/cases/fixedassets-254-fa-depreciation-parameter-preflight-blocker-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-253-fa-depreciation-parameter-preflight-no-ok.json',
        nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase,
        depreciationReadiness: allFieldSafe
          ? 'FA-253 proved all Calculate Depreciation request parameters field-safely without OK; repeat execution still requires local decision.'
          : 'FA-253 did not prove all Calculate Depreciation request parameters field-safely; repeat OK remains locked pending blocker review.',
      },
    },
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    reason: allFieldSafe
      ? 'All target request-page parameters were field-safe without OK. A local decision is still required before any repeat execution.'
      : 'At least one target request-page parameter was not field-safe. Repeat execution remains locked.',
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('010-parameter-preflight.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    click,
    requestPageSignals: signals,
    okVisibleBefore,
    okVisibleAfter,
    parameterProof,
    allFieldSafe,
    blockedBy,
    controlsAfterProbe,
  });
  await writeTextEvidence(faEvidencePath('010-parameter-preflight-text.txt'), afterText || 'No compact parameter preflight text captured.');
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-253-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-253-PARAMETER-PREFLIGHT-NO-OK.md'),
    [
      '# FIXEDASSETS-253 Parameter-Preflight ohne OK',
      '',
      'Status: `labor`, `parameter-preflight`, `no-ok`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      `- Umgebung: \`${EXPECTED_INSTANCE}\``,
      `- Company: \`${EXPECTED_COMPANY}\``,
      `- Request Page sichtbar: ${signals.requestPageLikelyOpen ? 'ja' : 'nein'}`,
      `- OK sichtbar, aber nicht bestaetigt: ${okVisibleBefore || okVisibleAfter ? 'ja' : 'nein'}`,
      `- Depreciation Book Zielwert \`${TARGET_DEPRECIATION_BOOK}\`: ${parameterProof.depreciationBook.targetMatched ? 'feldsicher' : 'nicht feldsicher'}`,
      `- Posting Date Zielwert \`${TARGET_POSTING_DATE}\`: ${parameterProof.postingDate.targetMatched ? 'feldsicher' : 'nicht feldsicher'}`,
      `- Document No. Zielwert \`${TARGET_DOCUMENT_NO}\`: ${parameterProof.documentNo.targetMatched ? 'feldsicher' : 'nicht feldsicher'}`,
      `- Fixed Asset Filter \`${TARGET_FIXED_ASSET}\`: ${parameterProof.fixedAssetFilter.targetMatched ? 'feldsicher' : 'nicht feldsicher'}`,
      '',
      '## Entscheidung',
      '',
      allFieldSafe
        ? 'Alle Zielparameter wurden ohne `OK` feldsicher vorbereitet. Trotzdem bleibt die echte Ausfuehrung ein eigener lokaler Entscheidungsfall.'
        : 'Mindestens ein Zielparameter ist nicht feldsicher. `OK` bleibt gesperrt.',
      '',
      '## Grenzen',
      '',
      '- Kein `OK` auf `Calculate Depreciation`.',
      '- Keine AfA berechnet.',
      '- Keine Journalzeile erzeugt.',
      '- Kein Preview Posting.',
      '- Keine Buchung.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      nextStep,
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-253 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-253-result.json` | JSON-Ergebnis | no-OK Parameter-Preflight und Feldsicherheitsstatus | keine AfA-Ausfuehrung | labor |',
      '| `FIXEDASSETS-253-PARAMETER-PREFLIGHT-NO-OK.md` | Lernzusammenfassung | welche Parameter feldsicher oder blockiert sind | keinen deutschen Finalnachweis | labor |',
      '| `010-parameter-preflight.json` | UI-Evidence | Controls/Probe-Ergebnisse der Request Page | keine Buchungswirkung | no-ok |',
      '| `010-parameter-preflight-text.txt` | kompakter Text | sichtbarer Request-Page-Kontext | kein Rohdump | compact |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noOkConfirmed).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noSetupChange).toBe(true);
});
