import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { compactPageText, dismissTours, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const TEST_ID = 'fixedassets-244';
const CASE_ID = 'FIXEDASSETS-244-FA-CALCULATE-DEPRECIATION-TELLME-READONLY';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const SEARCH_TERM = 'Calculate Depreciation';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

type TellMeCandidate = {
  frameUrl: string;
  tagName: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  value: string;
  combined: string;
  isInput: boolean;
};

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function asciiEvidenceText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function rmDemoHomeUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

async function visibleButtonNames(page: Page) {
  const names = new Set<string>();
  for (const frame of page.frames()) {
    const buttons = frame.getByRole('button');
    const count = await buttons.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await buttons.nth(index).innerText({ timeout: 250 }).catch(() => '');
      const name = asciiEvidenceText(text);
      if (name) {
        names.add(name);
      }
    }
  }
  return [...names]
    .filter((name) => /OK|Yes|Ja|Calculate|Depreciation|AfA|Preview|Post|Buchen|New|Neu|Edit|Bearbeiten|Delete|Loeschen/i.test(name))
    .slice(0, 40);
}

async function collectTellMeCandidates(page: Page) {
  const candidates: TellMeCandidate[] = [];

  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .locator('body')
      .evaluate((body) => {
        const interesting = /Calculate\s+Depreciation|Depreciation|Fixed Asset|AfA|Anlage|Anlagen/i;
        const elements = Array.from(
          body.querySelectorAll('button,a,[role],input,textarea,[aria-label],[title],div,span')
        );

        return elements
          .map((element) => {
            const htmlElement = element as HTMLElement & { value?: string };
            const rect = htmlElement.getBoundingClientRect();
            const style = window.getComputedStyle(htmlElement);
            const visible =
              rect.width > 0 &&
              rect.height > 0 &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              Number(style.opacity || '1') > 0;
            if (!visible) {
              return undefined;
            }

            const tagName = htmlElement.tagName.toLowerCase();
            const role = htmlElement.getAttribute('role') ?? '';
            const ariaLabel = htmlElement.getAttribute('aria-label') ?? '';
            const title = htmlElement.getAttribute('title') ?? '';
            const value = typeof htmlElement.value === 'string' ? htmlElement.value : '';
            const text = (htmlElement.innerText || htmlElement.textContent || '').replace(/\s+/g, ' ').trim();
            const toAscii = (valueToNormalize: string) =>
              valueToNormalize
                .normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\x20-\x7E]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            const textAscii = toAscii(text);
            const ariaLabelAscii = toAscii(ariaLabel);
            const titleAscii = toAscii(title);
            const valueAscii = toAscii(value);
            const combined = [textAscii, ariaLabelAscii, titleAscii, valueAscii].filter(Boolean).join(' | ').trim();
            const isExactCandidate = /Calculate\s+Depreciation/i.test(combined);
            const isSearchGroup =
              /Seiten.*Aufgaben|Pages.*Tasks|Nach.*Calculate|search.*Calculate|suchen.*Calculate/i.test(combined);
            if (!interesting.test(combined) || (!isExactCandidate && !isSearchGroup)) {
              return undefined;
            }
            if (combined.length > 260 && !isSearchGroup) {
              return undefined;
            }

            return {
              tagName,
              role,
              text: textAscii.slice(0, 240),
              ariaLabel: ariaLabelAscii.slice(0, 240),
              title: titleAscii.slice(0, 240),
              value: valueAscii.slice(0, 240),
              combined: combined.slice(0, 360),
              isInput: ['input', 'textarea'].includes(tagName) || role === 'textbox'
            };
          })
          .filter(Boolean)
          .slice(0, 120);
      })
      .catch(() => []);

    for (const candidate of frameCandidates) {
      candidates.push({
        ...(candidate as Omit<TellMeCandidate, 'frameUrl'>),
        frameUrl: frame.url()
      });
    }
  }

  const seen = new Set<string>();
  return candidates
    .filter((candidate) => {
      if (!candidate.role && candidate.combined.length > 220) {
        return false;
      }

      const key = candidate.combined;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

async function detectRequestPageOpened(page: Page, text: string) {
  const buttons = await visibleButtonNames(page);
  const hasOkButton = buttons.some((button) => /^OK$|^Ok$|^Okay$/i.test(button));
  const hasRequestFields =
    /Depreciation Book|AfA-Buch|Posting Date|Buchungsdatum|Document No\.|Belegnr\.|No\. of Depreciation Days|Use Force No\. of Days/i.test(
      text
    );
  return {
    requestPageOpened: hasOkButton && hasRequestFields,
    visibleButtons: buttons
  };
}

test('FIXEDASSETS-244 Calculate Depreciation Tell-Me read-only inventory', async ({ page }) => {
  await page.goto(rmDemoHomeUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);

  const initialUrl = page.url();
  const initialText = await pageText(page);
  const initialUrlParsed = new URL(initialUrl);
  const instanceMatches = initialUrl.includes(EXPECTED_INSTANCE);
  const companyFromUrl = initialUrlParsed.searchParams.get('company');
  const companyVisibleInText = new RegExp(EXPECTED_COMPANY, 'i').test(initialText);

  expect(instanceMatches, `BC URL muss Instanz ${EXPECTED_INSTANCE} enthalten.`).toBe(true);
  expect(companyFromUrl, `BC URL muss Company ${EXPECTED_COMPANY} enthalten.`).toBe(EXPECTED_COMPANY);

  await searchFor(page, SEARCH_TERM);

  const tellMeText = await pageText(page);
  const candidates = await collectTellMeCandidates(page);
  const nonInputCandidates = candidates.filter((candidate) => !candidate.isInput);
  const calculateDepreciationResultVisible = nonInputCandidates.some((candidate) =>
    /Calculate\s+Depreciation/i.test(candidate.combined)
  );
  const depreciationContextVisible = /Calculate\s+Depreciation|Depreciation|Fixed Asset/i.test(tellMeText);
  const requestPage = await detectRequestPageOpened(page, tellMeText);

  const resultStatus = requestPage.requestPageOpened ? 'blocked' : 'observed';
  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-calculate-depreciation-tellme-readonly',
    caseId: CASE_ID,
    source: 'playwright-readonly-tellme-search-inventory',
    resultStatus,
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    url: {
      initialUrl,
      finalUrl: page.url(),
      instanceMatches,
      companyFromUrl,
      companyVisibleInText
    },
    search: {
      term: SEARCH_TERM,
      tellMeOpened: true,
      termAccepted: new RegExp(SEARCH_TERM, 'i').test(tellMeText),
      depreciationContextVisible,
      calculateDepreciationResultVisible,
      nonInputCandidateCount: nonInputCandidates.length,
      candidates
    },
    safety: {
      requestPageOpened: requestPage.requestPageOpened,
      visibleButtons: requestPage.visibleButtons,
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noTellMeResultClicked: true,
      noOkConfirmed: true
    },
    proved:
      resultStatus === 'observed'
        ? [
            'Business Central wurde read-only in MCP_1_20260210 / RM-DEMO geoeffnet.',
            'Tell-Me/Search wurde mit Calculate Depreciation befuellt.',
            calculateDepreciationResultVisible
              ? 'Tell-Me zeigt einen sichtbaren Calculate-Depreciation-Kandidaten ohne Klick auf den Treffer.'
              : 'Tell-Me liefert AfA-/Depreciation-Kontext; ein eindeutiger nicht-Input-Treffer fuer Calculate Depreciation ist in diesem Lauf nicht bewiesen.',
            'Kein Treffer wurde ausgewaehlt, keine Request Page wurde geoeffnet, kein OK bestaetigt.'
          ]
        : [
            'Business Central wurde read-only in MCP_1_20260210 / RM-DEMO geoeffnet.',
            'Tell-Me/Search wurde mit Calculate Depreciation befuellt.',
            'Eine moegliche Request-Page-/OK-Situation wurde erkannt und der Lauf als blocked markiert.'
          ],
    notProved: [
      'Die Calculate-Depreciation-Request-Page wurde bewusst nicht geoeffnet.',
      'Es wurde keine AfA berechnet.',
      'Es wurde keine Fixed-Asset-G/L-Journal-Zeile erzeugt oder geprueft.',
      'Es wurde kein Preview Posting und keine Buchung ausgefuehrt.',
      'Dies ist kein deutscher Finalnachweis.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/fixedassets-244/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-244/FIXEDASSETS-244-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-244/FIXEDASSETS-244-FA-CALCULATE-DEPRECIATION-TELLME-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-244/010-tellme-search-results.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-244/010-tellme-search-page-text.txt'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-244/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-244/FIXEDASSETS-244-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-244/FIXEDASSETS-244-FA-CALCULATE-DEPRECIATION-TELLME-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-244/010-tellme-search-results.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-244/010-tellme-search-page-text.txt'
    ],
    statePatch: {
      current: {
        activeCase: 'FIXEDASSETS-245-FA-CALCULATE-DEPRECIATION-REQUEST-PAGE-PREFLIGHT',
        active_case_file: '.agent/state/cases/fixedassets-245-fa-calculate-depreciation-request-page-preflight.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-244-fa-calculate-depreciation-tellme-readonly.json',
        nextStep:
          resultStatus === 'observed' && calculateDepreciationResultVisible
            ? 'FIXEDASSETS-245: guarded Calculate Depreciation request-page preflight; choose the Tell-Me result only to inspect the request page, do not confirm OK or create journal lines.'
            : 'FIXEDASSETS-245: review alternative Calculate Depreciation route because Tell-Me did not prove a clean non-input result candidate.'
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase: 'FIXEDASSETS-245-FA-CALCULATE-DEPRECIATION-REQUEST-PAGE-PREFLIGHT',
        depreciationReadiness:
          resultStatus === 'observed' && calculateDepreciationResultVisible
            ? 'FA-244 proved the Calculate Depreciation Tell-Me candidate read-only without opening the request page. Next gated step may inspect the request page without OK.'
            : 'FA-244 ran Tell-Me read-only; clean Calculate Depreciation candidate remains to be reviewed before request-page preflight.'
      }
    },
    blockedBy: requestPage.requestPageOpened ? ['request-page-or-ok-situation-opened-unexpectedly'] : [],
    requiresReview: true,
    safeToFinalizeState: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'Read-only Tell-Me result inventory completed without choosing a result.'
        : 'Request-page or OK situation detected; do not continue without review.'
  };

  await writeJsonEvidence(faEvidencePath('010-tellme-search-results.json'), {
    caseId: CASE_ID,
    searchTerm: SEARCH_TERM,
    resultStatus,
    calculateDepreciationResultVisible,
    depreciationContextVisible,
    requestPageOpened: requestPage.requestPageOpened,
    candidates
  });
  await writeTextEvidence(
    faEvidencePath('010-tellme-search-page-text.txt'),
    asciiEvidenceText(await compactPageText(page, {
      include: [/Calculate\s+Depreciation|Depreciation|Fixed Asset|AfA|Anlage|Search|Suchen|Tell/i],
      maxLines: 120,
      maxLineLength: 220
    }))
  );
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-244-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-244-FA-CALCULATE-DEPRECIATION-TELLME-READONLY.md'),
    [
      '# FIXEDASSETS-244 Calculate Depreciation Tell-Me Read-only',
      '',
      'Status: `labor`, `read-only`, `no-posting`, `no-preview`, `no-setup-change`, `not-final`.',
      '',
      '## Zweck',
      '',
      'Dieser Lauf prueft den Microsoft-Learn-dokumentierten Einstieg `Calculate Depreciation` ueber Tell-Me/Search, ohne den Treffer zu waehlen und ohne die Request Page zu oeffnen.',
      '',
      '## Ergebnis',
      '',
      `- Umgebung: \`${EXPECTED_INSTANCE}\``,
      `- Company: \`${EXPECTED_COMPANY}\``,
      `- Suchbegriff: \`${SEARCH_TERM}\``,
      `- Tell-Me-Kontext sichtbar: ${depreciationContextVisible ? 'ja' : 'nein'}`,
      `- Eindeutiger nicht-Input-Kandidat Calculate Depreciation sichtbar: ${calculateDepreciationResultVisible ? 'ja' : 'nein'}`,
      `- Request Page/OK-Situation geoeffnet: ${requestPage.requestPageOpened ? 'ja' : 'nein'}`,
      '',
      '## Buchwirkung',
      '',
      calculateDepreciationResultVisible
        ? 'Kapitel 21 kann den Einstieg `Suche/Alt+Q -> Calculate Depreciation` als Labor-Klickpfad-Kandidat fuehren. Der naechste Schritt muss die Request Page separat und kontrolliert pruefen, ohne `OK` zu bestaetigen.'
        : 'Kapitel 21 darf den Einstieg noch nicht als sicheren Klickpfad zeigen. Zuerst muss die Suchtreffer-Disambiguierung oder ein alternativer UI-Pfad verbessert werden.',
      '',
      '## Grenzen',
      '',
      '- Kein Treffer wurde angeklickt.',
      '- Keine Request Page wurde geoeffnet.',
      '- Keine AfA wurde berechnet.',
      '- Keine Journalzeile, kein Preview Posting und keine Buchung.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      resultStatus === 'observed' && calculateDepreciationResultVisible
        ? '`FIXEDASSETS-245`: Request-Page-Preflight fuer `Calculate Depreciation` kontrolliert oeffnen, aber vor `OK` stoppen.'
        : '`FIXEDASSETS-245`: alternativen Calculate-Depreciation-Pfad oder strengeren Tell-Me-Result-Locator pruefen.',
      ''
    ].join('\n')
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-244 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-244-result.json` | JSON-Ergebnis | Sandbox, Company, Suchbegriff, sichtbare Kandidaten, Safety Flags | keine Request-Page-Ausfuehrung | labor, read-only |',
      '| `FIXEDASSETS-244-FA-CALCULATE-DEPRECIATION-TELLME-READONLY.md` | Lernzusammenfassung | Buchwirkung und naechsten Gate-Schritt | keinen AfA-Berechnungslauf | labor, not-final |',
      '| `010-tellme-search-results.json` | UI-Struktur | gefundene sichtbare Tell-Me-Kandidaten | keinen Klick auf Treffer | navigation-evidence |',
      '| `010-tellme-search-page-text.txt` | kompakter Seitentext | relevanter Tell-Me-/Search-Kontext | keine Rohseite und kein Screenshot | text-evidence |',
      ''
    ].join('\n')
  );

  expect(requestPage.requestPageOpened, 'Calculate Depreciation Request Page darf in FA-244 nicht geoeffnet werden.').toBe(false);
  expect(depreciationContextVisible, 'Tell-Me muss einen AfA-/Depreciation-Kontext liefern.').toBe(true);
});
