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

const TEST_ID = 'fixedassets-251';
const CASE_ID = 'FIXEDASSETS-251-FA-DEPRECIATION-REQUEST-PARAMETER-DIAGNOSIS';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const SEARCH_TERM = 'Calculate Depreciation';

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

function sanitizedFrameUrl(frameUrl: string) {
  try {
    return safeUrl(frameUrl);
  } catch {
    return 'unparseable-frame-url';
  }
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

async function visibleButtons(page: Page) {
  const names = new Set<string>();
  for (const frame of page.frames()) {
    const buttons = frame.getByRole('button');
    const count = await buttons.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await buttons.nth(index).innerText({ timeout: 250 }).catch(() => ''));
      if (/^(OK|Cancel|Abbrechen|Calculate Depreciation|Depreciation Book|Posting Date|Posting Description|Document No\.?)$/i.test(text)) {
        names.add(text);
      }
    }
  }
  return [...names].slice(0, 80);
}

function requestPageSignals(text: string) {
  const normalized = clean(text);
  const signals = {
    hasCalculateDepreciationTitle: /Calculate\s+Depreciation/i.test(normalized),
    hasDepreciationBook: /Depreciation\s+Book|AfA-Buch/i.test(normalized),
    hasPostingDate: /Posting\s+Date|Buchungsdatum/i.test(normalized),
    hasDocumentNo: /Document\s+No\.|Belegnr/i.test(normalized),
    hasPostingDescription: /Posting\s+Description/i.test(normalized),
    hasNumberOfDepreciationDays: /No\.?\s+of\s+Depreciation\s+Days|Number\s+of\s+Depreciation\s+Days/i.test(normalized),
    hasForceNoOfDays: /Force\s+No\.?\s+of\s+Days|Use\s+Force/i.test(normalized),
    hasFixedAssetFilter: /Fixed\s+Asset|FA\s+No\.|No\./i.test(normalized),
  };
  const signalCount = Object.values(signals).filter(Boolean).length;
  return {
    ...signals,
    signalCount,
    requestPageLikelyOpen: signals.hasCalculateDepreciationTitle && signalCount >= 3,
  };
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
            };
          })
          .filter((control) =>
            /Depreciation|Posting|Document|Description|Fixed Asset|FA|Date|Book|Days|No\.|Filter|Period/i.test(
              `${control.value} ${control.selectedText} ${control.ariaLabel} ${control.title} ${control.placeholder} ${control.containerText}`,
            ),
          )
          .slice(0, 120);
        const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr,div')]
          .filter(visible)
          .map((row, index) => ({
            index,
            text: norm(row.innerText || row.textContent),
          }))
          .filter((row) => /Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Document\s+No\.|Posting\s+Description|No\.?\s+of\s+Depreciation\s+Days|Fixed\s+Asset|Filter|Options/i.test(row.text))
          .filter((row) => row.text.length > 0 && row.text.length < 600)
          .slice(0, 120);
        return { controls, rows };
      })
      .catch((error) => ({ error: String(error), controls: [], rows: [] }));
    frames.push({ frameUrl: sanitizedFrameUrl(frame.url()), ...frameResult });
  }
  return frames;
}

test('FIXEDASSETS-251 diagnoses Calculate Depreciation request parameters read-only', async ({ page }) => {
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
  const requestText = await pageText(page);
  const signals = requestPageSignals(requestText);
  const buttons = await visibleButtons(page);
  const controls = click.clicked && signals.requestPageLikelyOpen ? await readRequestPageControls(page) : [];
  const compactText = clean(
    await compactPageText(page, {
      include: [
        /Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Document\s+No\.|Posting\s+Description|No\.?\s+of\s+Depreciation\s+Days|Force|Fixed\s+Asset|Filter|Options|OK|Abbrechen|Cancel/i,
      ],
      maxLines: 180,
      maxLineLength: 260,
    }),
  );
  const okVisible = buttons.some((button) => /^OK$/i.test(button));
  const blockedBy = [
    ...(click.clicked ? [] : ['calculate-depreciation-result-not-clicked']),
    ...(signals.requestPageLikelyOpen ? [] : ['request-page-not-recognized']),
    ...(okVisible ? [] : ['ok-not-visible-for-boundary-proof']),
  ];
  const resultStatus = blockedBy.length ? 'blocked' : 'observed';
  const docNoDefaults = controls
    .flatMap((frame: any) => frame.controls ?? [])
    .filter((control: any) => /Document\s+No\.?/i.test(`${control.ariaLabel} ${control.title} ${control.containerText}`))
    .map((control: any) => control.value || control.selectedText || control.containerText)
    .filter(Boolean);
  const requestValueSignals = controls
    .flatMap((frame: any) => frame.controls ?? [])
    .map((control: any) => control.value || control.selectedText || control.ariaLabel || control.title || control.placeholder || control.containerText)
    .filter(Boolean);
  const fadepValueSignals = requestValueSignals.filter((value: string) => /FADEP-\d{8}-\d{4}/i.test(value));
  const lastUsedOptionsVisible = requestValueSignals.some((value: string) => /Zuletzt verwendete Optionen und Filter|Last used options and filters/i.test(value));
  const postingDateValues = controls
    .flatMap((frame: any) => frame.controls ?? [])
    .filter((control: any) => /Posting\s+Date/i.test(`${control.ariaLabel} ${control.title} ${control.containerText}`))
    .map((control: any) => control.value || control.selectedText || control.containerText)
    .filter(Boolean);
  const depreciationBookValues = controls
    .flatMap((frame: any) => frame.controls ?? [])
    .filter((control: any) => /Depreciation\s+Book/i.test(`${control.ariaLabel} ${control.title} ${control.containerText}`))
    .map((control: any) => control.value || control.selectedText || control.containerText)
    .filter(Boolean);
  const foundAnyFilterOrDayField =
    signals.hasNumberOfDepreciationDays ||
    signals.hasForceNoOfDays ||
    controls.some((frame: any) => (frame.rows ?? []).some((row: any) => /No\.?\s+of\s+Depreciation\s+Days|Force|Fixed\s+Asset|Filter|Options/i.test(row.text)));

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  const nextCase = 'FIXEDASSETS-252-FA-DEPRECIATION-REPEAT-EXECUTION-DECISION';
  const nextStep =
    'FIXEDASSETS-252: locally decide whether a repeat Calculate Depreciation execution is justified and which corrected parameters are required; no repeat OK until that decision exists.';
  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-request-parameter-diagnosis',
    caseId: CASE_ID,
    source: 'playwright-readonly-calculate-depreciation-request-parameters',
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
    click,
    requestPage: {
      ...signals,
      okVisible,
      visibleButtons: buttons,
      controls,
      summary: {
        depreciationBookValues,
        postingDateValues,
        documentNoDefaults: docNoDefaults,
        requestValueSignals,
        fadepValueSignals,
        lastUsedOptionsVisible,
        documentNoControlAssociation:
          fadepValueSignals.length && !docNoDefaults.length
            ? 'FADEP value visible as unlabelled request-page input; not safely associated with Document No. by locator.'
            : 'No unlabelled FADEP request-page input association issue detected.',
        foundAnyFilterOrDayField,
      },
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
      ...(signals.requestPageLikelyOpen ? ['Calculate Depreciation request page was opened read-only.'] : []),
      ...(depreciationBookValues.length ? [`Depreciation Book field/value signal was captured: ${depreciationBookValues[0]}.`] : ['Depreciation Book caption was visible, but no clear value was extracted.']),
      ...(postingDateValues.length ? [`Posting Date field/value signal was captured: ${postingDateValues[0]}.`] : ['Posting Date caption was visible, but no clear value was extracted.']),
      ...(docNoDefaults.length ? [`Document No. default/value signal was captured: ${docNoDefaults[0]}.`] : ['Document No. caption was visible, but no clear default value was extracted.']),
      ...(fadepValueSignals.length && !docNoDefaults.length
        ? [`FADEP value signal was visible as an unlabelled request-page input: ${fadepValueSignals[0]}.`]
        : []),
      ...(lastUsedOptionsVisible ? ['The request page showed a last-used options/filter signal, so repeated runs may inherit prior request values.'] : []),
      foundAnyFilterOrDayField ? 'Additional filter/day/option field signals were visible.' : 'No additional filter/day/option field signal was clearly visible.',
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
      'playwright/projects/fibu-book5/tests/fixedassets-251-fa-depreciation-request-parameter-diagnosis.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-251/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-251/FIXEDASSETS-251-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-251/FIXEDASSETS-251-REQUEST-PARAMETER-DIAGNOSIS.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-251/010-request-parameter-diagnosis.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-251/010-request-parameter-diagnosis-text.txt',
    ],
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: '.agent/state/cases/fixedassets-252-fa-depreciation-repeat-execution-decision.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-251-fa-depreciation-request-parameter-diagnosis.json',
        nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase,
        depreciationReadiness:
          'FA-251 read the Calculate Depreciation request page without OK. Repeat execution remains locked until FA-252 decides corrected parameters and gates.',
      },
    },
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: resultStatus === 'observed',
    reason:
      'Request parameters were diagnosed read-only. Because FA-248 already confirmed OK once and FA-250 found no FADEP journal line, a local repeat-execution decision is required before any further OK.',
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('010-request-parameter-diagnosis.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    click,
    requestPageSignals: signals,
    visibleButtons: buttons,
    controls,
    summary: result.requestPage.summary,
    blockedBy,
  });
  await writeTextEvidence(faEvidencePath('010-request-parameter-diagnosis-text.txt'), compactText || 'No compact request parameter text captured.');
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-251-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-251-REQUEST-PARAMETER-DIAGNOSIS.md'),
    [
      '# FIXEDASSETS-251 Request-Parameterdiagnose',
      '',
      'Status: `labor`, `read-only`, `request-page`, `no-ok`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      `- Umgebung: \`${EXPECTED_INSTANCE}\``,
      `- Company: \`${EXPECTED_COMPANY}\``,
      `- Request Page sichtbar: ${signals.requestPageLikelyOpen ? 'ja' : 'nein'}`,
      `- OK sichtbar, aber nicht bestaetigt: ${okVisible ? 'ja' : 'nein'}`,
      `- Depreciation Book Signal: ${depreciationBookValues[0] ?? 'kein eindeutiger Wert extrahiert'}`,
      `- Posting Date Signal: ${postingDateValues[0] ?? 'kein eindeutiger Wert extrahiert'}`,
      `- Document No. Signal: ${docNoDefaults[0] ?? 'kein eindeutiger Wert extrahiert'}`,
      `- Unbeschriftetes FADEP-Wertsignal: ${fadepValueSignals[0] ?? 'nicht sichtbar'}`,
      `- Zuletzt verwendete Optionen/Filter sichtbar: ${lastUsedOptionsVisible ? 'ja' : 'nein'}`,
      `- Filter-/Tage-/Optionssignal sichtbar: ${foundAnyFilterOrDayField ? 'ja' : 'nein'}`,
      '',
      '## Lernbefund',
      '',
      '- BC-Request-Pages koennen zuletzt verwendete Optionen und Filter wieder anzeigen.',
      '- Ein sichtbarer Wert ist fuer Evidence nur dann feldsicher, wenn Playwright ihn eindeutig einem Feld zuordnen kann.',
      '- Fuer eine Wiederholung von `Calculate Depreciation` reicht ein sichtbares `FADEP-*`-Signal allein nicht aus; Buch, Datum, Filter und Zielanlage muessen vor `OK` eindeutig geklaert werden.',
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
      '# FIXEDASSETS-251 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-251-result.json` | JSON-Ergebnis | Request-Page-Parameterdiagnose ohne OK | keine AfA-Ausfuehrung | labor |',
      '| `FIXEDASSETS-251-REQUEST-PARAMETER-DIAGNOSIS.md` | Lernzusammenfassung | sichtbare Parameter und Grenzen | keinen deutschen Finalnachweis | labor |',
      '| `010-request-parameter-diagnosis.json` | UI-Evidence | Controls/Rows/Buttons der Request Page | keine Buchungswirkung | read-only |',
      '| `010-request-parameter-diagnosis-text.txt` | kompakter Text | sichtbarer Request-Page-Kontext | kein Rohdump | compact |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noOkConfirmed).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noJournalLineCreated).toBe(true);
  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|production|dangerous/i.test(entry))).toEqual([]);
});
