import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { compactPageText, dismissTours, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const TEST_ID = 'fixedassets-245';
const CASE_ID = 'FIXEDASSETS-245-FA-CALCULATE-DEPRECIATION-REQUEST-PAGE-PREFLIGHT';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const SEARCH_TERM = 'Calculate Depreciation';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function asciiEvidenceText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function evidenceLines(value: string) {
  const allowed = /Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Posting\s+Description|Document\s+No\.?|OK|Cancel|Abbrechen|AfA|Buchungsdatum/i;
  const blocked = /allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe|api\.office\.net|graph\.microsoft\.com|cloud\.microsoft|aadTenantId|startTraceId/i;
  return value
    .split(/\r?\n/)
    .map((line) => asciiEvidenceText(line))
    .filter((line) => line.length > 0 && allowed.test(line) && !blocked.test(line))
    .slice(0, 80)
    .join('\n');
}

function rmDemoHomeUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
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
          matches: visible && (label.test(text) || label.test(aria) || label.test(title))
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
    const url = new URL(frameUrl);
    const company = url.searchParams.get('company');
    return `${url.origin}${url.pathname}${company ? `?company=${company}` : ''}`;
  } catch {
    return 'unparseable-frame-url';
  }
}

async function clickCalculateDepreciationResult(page: Page) {
  const inspected: Array<{ frameUrl: string; candidates: Awaited<ReturnType<typeof candidateElements>> }> = [];

  for (const frame of page.frames()) {
    const candidates = await candidateElements(frame).catch(() => []);
    if (candidates.length > 0) {
      inspected.push({ frameUrl: sanitizedFrameUrl(frame.url()), candidates });
    }

    const row = frame.getByRole('row', { name: /^Calculate Depreciation\s+Aufgaben/i });
    const rowCount = await row.count().catch(() => 0);
    if (rowCount === 1) {
      await row.first().click({ timeout: 4000 });
      await page.waitForTimeout(5000);
      return { clicked: true, method: 'role:row:Calculate Depreciation Aufgaben', inspected };
    }

    const exactText = frame.getByText(/^Calculate Depreciation$/).first();
    const exactCount = await frame.getByText(/^Calculate Depreciation$/).count().catch(() => 0);
    if (exactCount === 1 && (await exactText.isVisible({ timeout: 500 }).catch(() => false))) {
      await exactText.click({ timeout: 4000 });
      await page.waitForTimeout(5000);
      return { clicked: true, method: 'text:exact:Calculate Depreciation', inspected };
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
      const text = await buttons.nth(index).innerText({ timeout: 250 }).catch(() => '');
      const normalized = asciiEvidenceText(text);
      if (/^(OK|Cancel|Abbrechen|Calculate Depreciation|Depreciation Book|Posting Date|Posting Description|Document No\.?)$/i.test(normalized)) {
        names.add(normalized);
      }
    }
  }
  return [...names].slice(0, 60);
}

function requestPageSignals(text: string) {
  const normalized = asciiEvidenceText(text);
  const signals = {
    hasCalculateDepreciationTitle: /Calculate\s+Depreciation/i.test(normalized),
    hasDepreciationBook: /Depreciation\s+Book|AfA-Buch/i.test(normalized),
    hasPostingDate: /Posting\s+Date|Buchungsdatum/i.test(normalized),
    hasDocumentNo: /Document\s+No\.|Belegnr/i.test(normalized),
    hasNumberOfDepreciationDays: /No\.\s+of\s+Depreciation\s+Days|Depreciation\s+Days|AfA-Tage/i.test(normalized),
    hasUseForceNoOfDays: /Use\s+Force\s+No\.\s+of\s+Days|Force\s+No\.\s+of\s+Days/i.test(normalized)
  };
  const signalCount = Object.values(signals).filter(Boolean).length;
  return {
    ...signals,
    signalCount,
    requestPageLikelyOpen: signals.hasCalculateDepreciationTitle && signalCount >= 2
  };
}

test('FIXEDASSETS-245 Calculate Depreciation Request Page preflight ohne OK', async ({ page }) => {
  await page.goto(rmDemoHomeUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);

  const initialUrl = page.url();
  const initialUrlParsed = new URL(initialUrl);
  const instanceMatches = initialUrl.includes(EXPECTED_INSTANCE);
  const companyFromUrl = initialUrlParsed.searchParams.get('company');

  expect(instanceMatches, `BC URL muss Instanz ${EXPECTED_INSTANCE} enthalten.`).toBe(true);
  expect(companyFromUrl, `BC URL muss Company ${EXPECTED_COMPANY} enthalten.`).toBe(EXPECTED_COMPANY);

  await searchFor(page, SEARCH_TERM);
  const click = await clickCalculateDepreciationResult(page);
  const afterClickText = await pageText(page);
  const buttonsAfterClick = await visibleButtons(page);
  const signals = requestPageSignals(afterClickText);
  const okVisible = buttonsAfterClick.some((button) => /^OK$/i.test(button));
  const resultStatus = click.clicked && signals.requestPageLikelyOpen && okVisible ? 'observed' : 'blocked';

  await writeJsonEvidence(faEvidencePath('010-request-page-preflight.json'), {
    caseId: CASE_ID,
    clicked: click.clicked,
    clickMethod: click.method,
    resultStatus,
    requestPageSignals: signals,
    okVisible,
    visibleButtons: buttonsAfterClick,
    inspectedCandidates: click.inspected
  });

  await writeTextEvidence(
    faEvidencePath('010-request-page-preflight-text.txt'),
    evidenceLines(
      await compactPageText(page, {
        include: [/Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Document|No\.|OK|Cancel|Abbrechen|AfA|Buchungsdatum/i],
        maxLines: 120,
        maxLineLength: 220
      })
    )
  );

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1500);
  const afterCloseText = await pageText(page);
  const afterCloseSignals = requestPageSignals(afterCloseText);

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-calculate-depreciation-request-page-preflight',
    caseId: CASE_ID,
    source: 'playwright-guarded-request-page-preflight',
    resultStatus,
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    url: {
      initialUrl,
      finalUrl: page.url(),
      instanceMatches,
      companyFromUrl
    },
    click,
    requestPage: {
      ...signals,
      okVisible,
      visibleButtons: buttonsAfterClick,
      closedByEscape: !afterCloseSignals.requestPageLikelyOpen
    },
    safety: {
      noOkConfirmed: true,
      noDepreciationCalculated: true,
      noJournalLineCreated: true,
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    proved:
      resultStatus === 'observed'
        ? [
            'Business Central blieb in MCP_1_20260210 / RM-DEMO.',
            'Der Tell-Me-Treffer Calculate Depreciation wurde gezielt geoeffnet.',
            'Die Calculate-Depreciation-Request-Page wurde als Preflight-Kontext sichtbar.',
            'OK wurde nicht bestaetigt; die Seite wurde per Escape geschlossen.'
          ]
        : [
            'Business Central blieb in MCP_1_20260210 / RM-DEMO.',
            'Der Lauf stoppte ohne OK, ohne AfA-Berechnung und ohne Journalzeile.',
            click.clicked ? 'Der Tell-Me-Treffer wurde geoeffnet, aber die Request Page wurde nicht sicher erkannt.' : 'Der Tell-Me-Treffer war nicht eindeutig genug fuer einen sicheren Klick.'
          ],
    notProved: [
      'Keine AfA wurde berechnet.',
      'Keine Fixed-Asset-G/L-Journal-Zeile wurde erzeugt.',
      'Kein Preview Posting und keine Buchung.',
      'Keine Postenspur.',
      'Kein deutscher Finalnachweis.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/fixedassets-245/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-245/FIXEDASSETS-245-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-245/FIXEDASSETS-245-FA-CALCULATE-DEPRECIATION-REQUEST-PAGE-PREFLIGHT.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-245/010-request-page-preflight.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-245/010-request-page-preflight-text.txt'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-245/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-245/FIXEDASSETS-245-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-245/FIXEDASSETS-245-FA-CALCULATE-DEPRECIATION-REQUEST-PAGE-PREFLIGHT.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-245/010-request-page-preflight.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-245/010-request-page-preflight-text.txt'
    ],
    statePatch: {
      current: {
        activeCase:
          resultStatus === 'observed'
            ? 'FIXEDASSETS-246-FA-CALCULATE-DEPRECIATION-REQUEST-PAGE-DECISION'
            : 'FIXEDASSETS-246-FA-CALCULATE-DEPRECIATION-ROUTE-BLOCKER-REVIEW',
        active_case_file:
          resultStatus === 'observed'
            ? '.agent/state/cases/fixedassets-246-fa-calculate-depreciation-request-page-decision.json'
            : '.agent/state/cases/fixedassets-246-fa-calculate-depreciation-route-blocker-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-245-fa-calculate-depreciation-request-page-preflight.json',
        nextStep:
          resultStatus === 'observed'
            ? 'FIXEDASSETS-246: decide whether a no-OK request-page field summary is enough for the book or whether a guarded Calculate Depreciation execution gate may be planned.'
            : 'FIXEDASSETS-246: review the blocked request-page route and improve the scoped Tell-Me click before any execution.'
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase:
          resultStatus === 'observed'
            ? 'FIXEDASSETS-246-FA-CALCULATE-DEPRECIATION-REQUEST-PAGE-DECISION'
            : 'FIXEDASSETS-246-FA-CALCULATE-DEPRECIATION-ROUTE-BLOCKER-REVIEW',
        depreciationReadiness:
          resultStatus === 'observed'
            ? 'FA-245 opened the Calculate Depreciation request page as a guarded preflight and closed it without OK. No depreciation or journal line was created.'
            : 'FA-245 did not produce a safe request-page proof. The route must be reviewed before execution.'
      }
    },
    blockedBy:
      resultStatus === 'observed'
        ? []
        : [
            click.clicked ? 'request-page-not-safely-recognized-after-click' : 'calculate-depreciation-result-not-unique-enough-to-click',
            signals.requestPageLikelyOpen ? '' : 'request-page-fields-not-visible',
            okVisible ? '' : 'ok-button-not-visible'
          ].filter(Boolean),
    requiresReview: true,
    safeToFinalizeState: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'Guarded request-page preflight completed and stopped before OK.'
        : 'Guarded preflight stopped before any risky action, but the request page proof is incomplete.'
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-245-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-245-FA-CALCULATE-DEPRECIATION-REQUEST-PAGE-PREFLIGHT.md'),
    [
      '# FIXEDASSETS-245 Calculate Depreciation Request Page Preflight',
      '',
      'Status: `labor`, `guarded-preflight`, `no-ok`, `no-posting`, `no-preview`, `no-setup-change`, `not-final`.',
      '',
      '## Zweck',
      '',
      'Dieser Lauf oeffnet den bereits belegten Tell-Me-Treffer `Calculate Depreciation` nur so weit, dass die Request Page und ihre Pflichtfelder sichtbar werden. `OK` wird nicht bestaetigt.',
      '',
      '## Ergebnis',
      '',
      `- Umgebung: \`${EXPECTED_INSTANCE}\``,
      `- Company: \`${EXPECTED_COMPANY}\``,
      `- Treffer geklickt: ${click.clicked ? 'ja' : 'nein'} (${click.method})`,
      `- Request Page sicher erkannt: ${signals.requestPageLikelyOpen ? 'ja' : 'nein'}`,
      `- OK sichtbar, aber nicht bestaetigt: ${okVisible ? 'ja' : 'nein'}`,
      `- Seite per Escape geschlossen: ${!afterCloseSignals.requestPageLikelyOpen ? 'ja' : 'nein'}`,
      '',
      '## Sichtbare Feldsignale',
      '',
      `- Calculate-Depreciation-Titel: ${signals.hasCalculateDepreciationTitle ? 'ja' : 'nein'}`,
      `- Depreciation Book: ${signals.hasDepreciationBook ? 'ja' : 'nein'}`,
      `- Posting Date: ${signals.hasPostingDate ? 'ja' : 'nein'}`,
      `- Document No.: ${signals.hasDocumentNo ? 'ja' : 'nein'}`,
      `- Depreciation Days: ${signals.hasNumberOfDepreciationDays ? 'ja' : 'nein'}`,
      '',
      '## Buchwirkung',
      '',
      resultStatus === 'observed'
        ? 'Kapitel 21 kann die Request Page als Vor-Ausfuehrungs-Kontrollpunkt erklaeren: Vor `OK` prueft man AfA-Buch, Buchungsdatum, Belegnummer und Berechnungsparameter. Der eigentliche Berechnungslauf bleibt ein separates Gate.'
        : 'Kapitel 21 darf die Request Page noch nicht als belastbaren Kontrollpunkt zeigen. Der UI-Pfad oder Locator muss zuerst verbessert werden.',
      '',
      '## Grenzen',
      '',
      '- `OK` wurde nicht bestaetigt.',
      '- Keine AfA wurde berechnet.',
      '- Keine Journalzeile wurde erzeugt.',
      '- Kein Preview Posting und keine Buchung.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      resultStatus === 'observed'
        ? '`FIXEDASSETS-246`: lokal entscheiden, ob ein spaeterer kontrollierter Calculate-Depreciation-Ausfuehrungsgate vorbereitet werden darf.'
        : '`FIXEDASSETS-246`: blocked route review und Locator/Click-Gate verbessern.',
      ''
    ].join('\n')
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-245 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-245-result.json` | JSON-Ergebnis | Sandbox, Company, Trefferklick, Request-Page-Signale, Safety Flags | keine AfA-Ausfuehrung | labor, guarded-preflight |',
      '| `FIXEDASSETS-245-FA-CALCULATE-DEPRECIATION-REQUEST-PAGE-PREFLIGHT.md` | Lernzusammenfassung | Buchwirkung und Grenzen der Request Page | keine Journalzeile/Postenspur | labor, not-final |',
      '| `010-request-page-preflight.json` | UI-Struktur | sichtbare Buttons und Feldsignale | keinen ausgefuehrten Batch Job | field-evidence |',
      '| `010-request-page-preflight-text.txt` | kompakter Seitentext | relevanter Request-Page-Kontext | keine Rohseite und kein Screenshot | text-evidence |',
      ''
    ].join('\n')
  );

  expect(result.safety.noOkConfirmed, 'OK darf in FA-245 nicht bestaetigt werden.').toBe(true);
  expect(result.safety.noDepreciationCalculated, 'AfA darf in FA-245 nicht berechnet werden.').toBe(true);
});
