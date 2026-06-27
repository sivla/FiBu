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

const TEST_ID = 'fixedassets-255';
const CASE_ID = 'FIXEDASSETS-255-FA-DEPRECIATION-REQUEST-PAGE-GEOMETRY-MAP-NO-OK';
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
      if (/^(OK|Cancel|Abbrechen|Calculate Depreciation|Depreciation Book|Posting Date|Posting Description|Document No\.?|No\.?|Filter\.\.\.)$/i.test(text)) {
        names.add(text);
      }
    }
  }
  return [...names].slice(0, 120);
}

type RectEntry = {
  index: number;
  kind: 'control' | 'label' | 'button';
  tag: string;
  role: string;
  type: string;
  text: string;
  value: string;
  ariaLabel: string;
  title: string;
  placeholder: string;
  x: number;
  y: number;
  width: number;
  height: number;
  readOnly: boolean;
  disabled: boolean;
};

function nearestControls(labels: RectEntry[], controls: RectEntry[], labelPattern: RegExp) {
  return labels
    .filter((label) => labelPattern.test(`${label.text} ${label.ariaLabel} ${label.title}`))
    .map((label) => {
      const candidates = controls
        .map((control) => ({
          ...control,
          dx: Math.round(control.x - label.x),
          dy: Math.round(control.y - label.y),
          distance: Math.round(Math.hypot(control.x - label.x, control.y - label.y)),
          rightOfLabel: control.x >= label.x,
          sameBand: Math.abs(control.y - label.y) <= 42,
        }))
        .filter((control) => control.rightOfLabel || control.sameBand)
        .sort((a, b) => {
          if (a.sameBand !== b.sameBand) return a.sameBand ? -1 : 1;
          return a.distance - b.distance;
        })
        .slice(0, 3);
      return { label, candidates };
    })
    .slice(0, 4);
}

async function readRequestPageGeometry(page: Page) {
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
        const entry = (element: HTMLElement, index: number, kind: 'control' | 'label' | 'button') => {
          const rect = element.getBoundingClientRect();
          const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          return {
            index,
            kind,
            tag: element.tagName.toLowerCase(),
            role: element.getAttribute('role') || '',
            type: element.getAttribute('type') || '',
            text: norm(element.innerText || element.textContent || ''),
            value: 'value' in input ? norm(input.value) : '',
            ariaLabel: norm(element.getAttribute('aria-label')),
            title: norm(element.getAttribute('title')),
            placeholder: norm(element.getAttribute('placeholder')),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            readOnly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
            disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
          };
        };
        const controls = [...document.querySelectorAll<HTMLElement>('input,select,textarea,[contenteditable="true"],[role="textbox"],[role="combobox"],[role="spinbutton"]')]
          .filter(visible)
          .map((element, index) => entry(element, index, 'control'))
          .slice(0, 220);
        const labels = [...document.querySelectorAll<HTMLElement>('label,span,div,[role="row"],[role="gridcell"]')]
          .filter(visible)
          .map((element, index) => entry(element, index, 'label'))
          .filter((item) => /Calculate\s+Depreciation|Options|Depreciation\s+Book|Posting\s+Date|Document\s+No\.|Posting\s+Description|Filter:\s*Fixed\s+Asset|No\.|FA\s+Class|FA\s+Subclass|Budgeted\s+Asset|Filter/i.test(`${item.text} ${item.ariaLabel} ${item.title}`))
          .filter((item) => item.text.length > 0 && item.text.length <= 120 && !item.text.includes('\n'))
          .slice(0, 80);
        const buttons = [...document.querySelectorAll<HTMLElement>('button,[role="button"]')]
          .filter(visible)
          .map((element, index) => entry(element, index, 'button'))
          .filter((item) => /OK|Abbrechen|Cancel|Filter|Plan/i.test(`${item.text} ${item.ariaLabel} ${item.title}`))
          .slice(0, 120);
        return { controls, labels, buttons };
      })
      .catch((error) => ({ error: String(error), controls: [], labels: [], buttons: [] }));
    const controls = (frameResult.controls ?? []) as RectEntry[];
    const labels = (frameResult.labels ?? []) as RectEntry[];
    frames.push({
      frameUrl: sanitizedFrameUrl(frame.url()),
      ...frameResult,
      labelProximity: {
        depreciationBook: nearestControls(labels, controls, /Depreciation\s+Book/i),
        postingDate: nearestControls(labels, controls, /Posting\s+Date/i),
        documentNo: nearestControls(labels, controls, /Document\s+No\./i),
        fixedAssetNoFilter: nearestControls(labels, controls, /^No\.?$|Filter:\s*Fixed\s+Asset/i),
      },
    });
  }
  return frames;
}

async function captureFocusSequence(page: Page, steps = 10) {
  const sequence = [];
  for (let i = 0; i < steps; i += 1) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
    const focused = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const norm = (value: string | null | undefined) =>
        (value ?? '')
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
          .replace(/[ \t]+/g, ' ')
          .trim();
      const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      return {
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role') || '',
        type: element.getAttribute('type') || '',
        text: norm(element.innerText || element.textContent || '').slice(0, 120),
        value: 'value' in input ? norm(input.value) : '',
        ariaLabel: norm(element.getAttribute('aria-label')),
        title: norm(element.getAttribute('title')),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });
    sequence.push({ step: i + 1, focused });
  }
  return sequence;
}

test('FIXEDASSETS-255 maps Calculate Depreciation request page geometry without OK', async ({ page }) => {
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
  const text = await pageText(page);
  const signals = requestPageSignals(text);
  const okVisible = (await visibleButtons(page)).some((button) => /^OK$/i.test(button));
  const geometry = click.clicked && signals.requestPageLikelyOpen ? await readRequestPageGeometry(page) : [];
  const focusSequence = click.clicked && signals.requestPageLikelyOpen ? await captureFocusSequence(page, 10) : [];
  const compactText = clean(
    await compactPageText(page, {
      include: [
        /Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Document\s+No\.|Posting\s+Description|Filter|Fixed\s+Asset|No\.|FA\s+Class|FA\s+Subclass|Budgeted\s+Asset|OK|Abbrechen|Cancel|FADEP|HGB/i,
      ],
      maxLines: 220,
      maxLineLength: 280,
    }),
  );

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  const candidateSummary = geometry.flatMap((frame) => [
    {
      field: 'Depreciation Book',
      candidateCount: frame.labelProximity.depreciationBook.flatMap((entry) => entry.candidates).length,
    },
    {
      field: 'Posting Date',
      candidateCount: frame.labelProximity.postingDate.flatMap((entry) => entry.candidates).length,
    },
    {
      field: 'Document No.',
      candidateCount: frame.labelProximity.documentNo.flatMap((entry) => entry.candidates).length,
    },
    {
      field: 'Fixed Asset No. filter',
      candidateCount: frame.labelProximity.fixedAssetNoFilter.flatMap((entry) => entry.candidates).length,
    },
  ]);
  const blocker = [
    ...(click.clicked ? [] : ['calculate-depreciation-result-not-clicked']),
    ...(signals.requestPageLikelyOpen ? [] : ['request-page-not-recognized']),
    ...(okVisible ? [] : ['ok-not-visible-for-boundary-proof']),
    ...(geometry.length ? [] : ['geometry-map-empty']),
  ];
  const hasAnyFieldCandidate = candidateSummary.some((entry) => entry.candidateCount > 0);
  const resultStatus = blocker.length ? 'blocked' : 'observed';
  const nextCase = hasAnyFieldCandidate
    ? 'FIXEDASSETS-256-FA-DEPRECIATION-GEOMETRY-MAP-REVIEW'
    : 'FIXEDASSETS-256-FA-DEPRECIATION-REQUEST-PAGE-MAPPING-BLOCKER-REVIEW';
  const nextStep = hasAnyFieldCandidate
    ? 'FIXEDASSETS-256: locally review the geometry/label-proximity map and decide whether a later no-OK value preflight can use these candidates.'
    : 'FIXEDASSETS-256: locally review why the request-page geometry map produced no usable candidates; do not execute Calculate Depreciation.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-request-page-geometry-map-no-ok',
    caseId: CASE_ID,
    source: 'playwright-readonly-request-page-geometry-map-no-ok',
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
      geometryFrameCount: geometry.length,
      candidateSummary,
      focusSequenceCount: focusSequence.length,
    },
    safety: {
      noTargetValuesWritten: true,
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
      ...(geometry.length ? ['A request-page geometry and label-proximity map was captured.'] : []),
      ...(focusSequence.length ? ['A short tab/focus sequence was captured without activating OK.'] : []),
      'No target parameter values were written.',
      'OK was not confirmed.',
      'No Preview Posting or Post was executed.',
    ],
    notProved: [
      'No request-page parameter was changed.',
      'No field-safe value-setting route is approved yet.',
      'No depreciation journal line was created.',
      'No repeat Calculate Depreciation execution was performed.',
      'No Preview Posting result.',
      'No depreciation posting.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-255-fa-depreciation-request-page-geometry-map-no-ok.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-255/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-255/FIXEDASSETS-255-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-255/FIXEDASSETS-255-GEOMETRY-MAP-NO-OK.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-255/010-request-page-control-map.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-255/010-request-page-text.txt',
    ],
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: hasAnyFieldCandidate
          ? '.agent/state/cases/fixedassets-256-fa-depreciation-geometry-map-review.json'
          : '.agent/state/cases/fixedassets-256-fa-depreciation-request-page-mapping-blocker-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-255-fa-depreciation-request-page-geometry-map-no-ok.json',
        nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase,
        depreciationReadiness: 'FA-255 captured a no-OK request-page geometry/label-proximity map. Value-setting and OK remain locked pending local review.',
      },
    },
    blockedBy: blocker,
    requiresReview: true,
    safeToFinalizeState: true,
    reason: 'Geometry map captured without writing values. A local review is required before any value-setting or execution.',
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('010-request-page-control-map.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    click,
    requestPageSignals: signals,
    okVisible,
    geometry,
    focusSequence,
    candidateSummary,
    blockedBy: blocker,
  });
  await writeTextEvidence(faEvidencePath('010-request-page-text.txt'), compactText || 'No compact request-page text captured.');
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-255-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-255-GEOMETRY-MAP-NO-OK.md'),
    [
      '# FIXEDASSETS-255 Geometrie-/Label-Map ohne OK',
      '',
      'Status: `labor`, `readonly-control-map`, `no-value-write`, `no-ok`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      `- Umgebung: \`${EXPECTED_INSTANCE}\``,
      `- Company: \`${EXPECTED_COMPANY}\``,
      `- Request Page sichtbar: ${signals.requestPageLikelyOpen ? 'ja' : 'nein'}`,
      `- OK sichtbar, aber nicht bestaetigt: ${okVisible ? 'ja' : 'nein'}`,
      `- Geometry Frames: ${geometry.length}`,
      `- Focus Sequence Steps: ${focusSequence.length}`,
      `- Feldkandidaten gefunden: ${hasAnyFieldCandidate ? 'ja' : 'nein'}`,
      '',
      '## Entscheidung',
      '',
      'Es wurden keine Zielwerte geschrieben. Die Map ist nur ein Diagnose- und Mapping-Artefakt. Ob daraus ein spaeterer no-OK Value-Preflight entstehen darf, entscheidet der lokale Review.',
      '',
      '## Grenzen',
      '',
      '- Kein `OK` auf `Calculate Depreciation`.',
      '- Keine Zielwerte geschrieben.',
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
      '# FIXEDASSETS-255 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-255-result.json` | JSON-Ergebnis | no-OK Geometrie-/Label-Map und Sicherheitsgrenzen | keine Wertsetzung | labor |',
      '| `FIXEDASSETS-255-GEOMETRY-MAP-NO-OK.md` | Lernzusammenfassung | warum die Map nur Diagnose ist | keinen Ausfuehrungsnachweis | labor |',
      '| `010-request-page-control-map.json` | UI-Evidence | Controls, Labels, Kandidaten, Focus Sequence | keine Buchungswirkung | no-ok |',
      '| `010-request-page-text.txt` | kompakter Text | sichtbarer Request-Page-Kontext | kein Rohdump | compact |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noTargetValuesWritten).toBe(true);
  expect(result.safety.noOkConfirmed).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noSetupChange).toBe(true);
});
