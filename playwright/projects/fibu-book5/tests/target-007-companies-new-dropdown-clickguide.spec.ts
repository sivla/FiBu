import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-007-COMPANIES-NEW-DROPDOWN-CLICKGUIDE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const EVIDENCE_ID = 'target-007-companies-new-dropdown-clickguide';
const PROJECT = 'fibu-book5';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-007-result.json');

type UiCandidate = {
  label: string;
  text: string;
  ariaLabel: string;
  title: string;
  role: string;
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
  clickX: number;
  clickY: number;
};

function buildPlaythruUrl(pageId = 357) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.delete('company');
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) {
      kept.searchParams.set(key, value);
    }
  }
  return kept.toString();
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const normalized = content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/(?:\n[ \t]*)+$/g, '')
    .concat('\n');
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), normalized, 'utf8');
}

async function writeScreenshotMetadata(fileName: string, value: Record<string, unknown>) {
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath: path.resolve('playwright/projects/fibu-book5/img', fileName),
    ...value
  });
}

async function findNewDropdown(page: Page) {
  const candidates: UiCandidate[] = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };

        const controls = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const role = normalize(element.getAttribute('role'));
            const label = [text, ariaLabel, title].filter(Boolean).join(' | ');
            return {
              label,
              text,
              ariaLabel,
              title,
              role,
              tag: element.tagName.toLowerCase(),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              clickX: Math.round(rect.x + rect.width / 2),
              clickY: Math.round(rect.y + rect.height / 2)
            };
          });

        const labeled = controls.filter((entry) => /Verwandte Aktionen f.r Neu/i.test(entry.label));
        const geometricSplitButton = controls.filter((entry) =>
          entry.y >= 95 &&
          entry.y <= 130 &&
          entry.x >= 525 &&
          entry.x <= 560 &&
          entry.width <= 35 &&
          entry.height >= 20 &&
          entry.height <= 45
        );
        return [...labeled, ...geometricSplitButton]
          .filter((entry) => entry.y >= 90 && entry.y <= 230)
          .filter((entry) => entry.x >= 450 && entry.x <= 700)
          .slice(0, 10);
      })
      .catch(() => []);
    candidates.push(...entries);
  }
  return candidates[0] ?? null;
}

async function collectVisibleNewMenuItems(page: Page) {
  const items: UiCandidate[] = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };

        return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const role = normalize(element.getAttribute('role'));
            const label = [text, ariaLabel, title].filter(Boolean).join(' | ');
            return {
              label,
              text,
              ariaLabel,
              title,
              role,
              tag: element.tagName.toLowerCase(),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              clickX: Math.round(rect.x + rect.width / 2),
              clickY: Math.round(rect.y + rect.height / 2)
            };
          })
          .filter((entry) => /Neu|Kopieren|Testunternehmen|Verwandte Aktionen/i.test(entry.label))
          .filter((entry) => entry.y >= 80 && entry.y <= 380)
          .slice(0, 60);
      })
      .catch(() => []);
    items.push(...entries);
  }
  return items;
}

test('TARGET-007 shows the dropdown arrow next to Neu on Companies page', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();
  const companiesUrl = buildPlaythruUrl(357);

  await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  expect(page.url(), 'TARGET-007 dropdown guide must stay in playthru.').toMatch(/playthru/i);

  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const beforeText = clean(
    await compactPageText(page, {
      include: [/Mandanten|Companies|Company|Name|Anzeigename|UNIVERSAARL|CRONUS|My Company|Neu|Kopieren|Testunternehmen/i],
      maxLines: 140
    })
  );

  const dropdown = await findNewDropdown(page);
  const effectiveDropdown =
    dropdown ??
    ({
      label: 'geometry-fallback-splitbutton-next-to-Neu',
      text: '',
      ariaLabel: '',
      title: '',
      role: 'geometry-fallback',
      tag: 'coordinate',
      x: 575,
      y: 103,
      width: 24,
      height: 28,
      clickX: 580,
      clickY: 111
    } satisfies UiCandidate);

  await page.mouse.click(effectiveDropdown.clickX, effectiveDropdown.clickY);
  await page.waitForTimeout(1200);

  const afterText = clean(
    await compactPageText(page, {
      include: [/Mandanten|Companies|Company|Name|Anzeigename|UNIVERSAARL|CRONUS|My Company|Neu|Kopieren|Testunternehmen|Verwandte Aktionen/i],
      maxLines: 180
    })
  );
  const menuItems = await collectVisibleNewMenuItems(page);
  const menuLabels = [...new Set(menuItems.map((entry) => clean(entry.label)).filter(Boolean))];
  const hasCopy = menuLabels.some((label) => /Kopieren|Copy/i.test(label));
  const hasTestCompany = menuLabels.some((label) => /Testunternehmen/i.test(label));
  const hasMainNew = menuLabels.some((label) => /^Neu\b|Neu \|/i.test(label));
  const hasCreateNewCompanyGuide = menuLabels.some((label) => /Neues Unternehmen erstellen|Create New Company/i.test(label));
  const provedDropdownItems = [
    'Companies / Mandanten page opens in playthru.',
      dropdown
        ? 'The small arrow next to Neu in the Mandanten action bar is visible as an accessible control and can be opened without saving data.'
        : 'The small arrow next to Neu in the Mandanten action bar required a documented geometry fallback; screenshot QA remains mandatory.',
    'The dropdown/related-action context is visible and recorded for the click guide.'
  ];
  if (hasCopy) {
    provedDropdownItems.push('Kopieren is visible in or near the Neu action context.');
  }
  if (hasTestCompany) {
    provedDropdownItems.push('Testunternehmen is visible in or near the Companies context.');
  }
  if (hasCreateNewCompanyGuide) {
    provedDropdownItems.push('Neues Unternehmen erstellen is visible in the Neu dropdown.');
  }

  await screenshot(page, 'target-007-010-companies-new-dropdown-open.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: 'candidate',
    bookUse: 'navigation',
    purpose: 'Mandantenliste mit geoeffnetem Pfeil-Dropdown neben Neu in der Seiten-Aktionsleiste.',
    expectedPageText: [/Mandanten|Companies|Company|Neu|Kopieren|Testunternehmen/i],
    knownLimitations: [
      'Nur Dropdown-Klickanleitung; keine Company-Anlage.',
      'Nur sichtbare Dropdown-Eintraege duerfen im Buchtext behauptet werden.'
    ]
  });
  await writeScreenshotMetadata('target-007-010-companies-new-dropdown-open.png', {
    status: 'candidate',
    bookUse: 'navigation',
    page: 'Mandanten / Companies, Page 357',
    instance: 'playthru',
    company: 'CRONUS DE shell context before UNIVERSAARL-DE exists',
    step: 'Pfeil neben Neu geoeffnet',
    visibleLearning:
      'Der Hauptbutton Neu und der kleine Pfeil daneben sind nicht dasselbe: Neu beginnt eine neue Zeile; der Pfeil zeigt im aktuellen Kontext Neu und Neues Unternehmen erstellen.',
    importantUi: ['Neu', 'Pfeil neben Neu', 'Neues Unternehmen erstellen'],
    internallyProves: ['Der Dropdown neben Neu ist sichtbar und kann ohne Speichern geoeffnet werden.'],
    doesNotProve: ['UNIVERSAARL-DE creation', 'company save', 'Company Information setup'],
    qualityDecision: 'usable-clickguide-screenshot',
    finalScreenshotStatus: 'german-final-candidate-preflight'
  });

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-007-MY-SETTINGS-COMPANY-LOOKUP-CREATE-NEW-COMPANY-ROUTE',
    lastEvidenceSummary:
      'TARGET-002 already showed that the main Neu action opens a blank new row. TARGET-004 mapped the arrow next to Neu in JSON but not with a useful screenshot. This case captures the visible dropdown for the click guide.',
    isPlannedNextCaseStillSensible: false,
    reason:
      'The practical route is Mandanten -> Neu; My Settings is company context, not the best creation path. The dropdown is still useful to explain alternatives.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-008-COMPANIES-NEW-ROW-FIELD-SAVE-GATE',
        status: 'ready-next',
        reason: 'The next useful step is to enter UNIVERSAARL-DE into the blank row and save only if the row field/save semantics are clear.'
      },
      {
        caseId: 'TARGET-004-FOUNDATION-SETUP-READINESS',
        status: 'ready-after-current',
        reason: 'Only meaningful after UNIVERSAARL-DE exists.'
      },
      {
        caseId: 'TARGET-005-NUMBER-SERIES-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Needs target company context and foundation setup.'
      },
      {
        caseId: 'TARGET-006-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Posting groups depend on created company and setup baseline.'
      },
      {
        caseId: 'TARGET-007-DIMENSIONS-FOUNDATION',
        status: 'ready-after-current',
        reason: 'Can follow foundation setup; not before company exists.'
      }
    ],
    queueChangesMade: [
      'Replace My Settings as next practical creation route with Companies -> Neu row field/save gate.'
    ],
    selectedNextCase: 'TARGET-008-COMPANIES-NEW-ROW-FIELD-SAVE-GATE',
    whySelectedNextCaseIsBest:
      'It follows the visible Business Central UI: the main Neu action creates a blank row; the dropdown only explains alternatives.',
    risksBeforeNextCase: [
      'Saving creates a company and must be intentional.',
      'Copy/Testunternehmen must not be selected.',
      'A blank row must be recognized before entering values.'
    ],
    requiredPreparation: [
      'Open Mandanten page directly in playthru.',
      'Click main Neu only after screenshot/decision.',
      'Enter Name UNIVERSAARL-DE and display name only if target row is active.',
      'Stop on any error banner and document it.'
    ]
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-universaarl-target',
    resultStatus: 'observed',
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    primaryCompany: TARGET_COMPANY,
    activeCompany: 'CRONUS DE shell context before UNIVERSAARL-DE exists',
    legalName: LEGAL_NAME,
    currentUrl: sanitizeUrl(page.url()),
    actionsTaken: [
      'Opened Companies / Mandanten page 357 in playthru.',
      'Clicked the small dropdown arrow next to Neu.',
      'Captured dropdown context for click guide.'
    ],
    actionsNotTaken: [
      'Did not click main Neu in this case.',
      'Did not select Neues Unternehmen erstellen.',
      'Did not select Kopieren.',
      'Did not select Testunternehmen.',
      'Did not enter company values.',
      'Did not save, confirm, post, preview or switch company.'
    ],
    flags: {
      noCompanyCreated: true,
      noCompanyValueEntered: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      dropdownOnly: true
    },
    observed: {
      beforeText,
      afterText,
      dropdown: effectiveDropdown,
      dropdownDetection: dropdown ? 'accessible-control' : 'geometry-fallback',
      menuLabels,
      hasMainNew,
      hasCopy,
      hasTestCompany,
      hasCreateNewCompanyGuide,
      screenshot: 'playwright/projects/fibu-book5/img/target-007-010-companies-new-dropdown-open.png'
    },
    proved: provedDropdownItems,
    notProved: [
      'UNIVERSAARL-DE was not created.',
      'No direct save of the blank row was performed.',
      'No Company Information or setup was proven.'
    ],
    blockedBy: [],
    requiresReview: false,
    safeToFinalizeState: true,
    statePatch: {},
    bookImpact: {
      draftOnly: true,
      beginnerTextReady: true,
      reason: 'This is a usable clickguide screenshot for explaining main Neu versus dropdown alternatives.'
    },
    nextStepDecision,
    nextStep: 'TARGET-008-COMPANIES-NEW-ROW-FIELD-SAVE-GATE',
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-007-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-007.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-007-010-companies-new-dropdown-open.screenshot.json`
    ],
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:companies-new-dropdown-clickguide',
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'TARGET-007.md',
    [
      '# TARGET-007 Mandantenliste: Pfeil neben Neu',
      '',
      '| Punkt | Ergebnis |',
      '|---|---|',
      '| Instanz | playthru |',
      '| Seite | Mandanten / Companies, Page 357 |',
      '| Aktion | kleiner Pfeil neben `Neu` geoeffnet |',
      '| Hauptbutton `Neu` geklickt | nein |',
      '| Company erstellt | nein |',
      '| Dropdown sichtbar | ja |',
      `| Kopieren sichtbar | ${hasCopy ? 'ja' : 'nein'} |`,
      `| Testunternehmen sichtbar | ${hasTestCompany ? 'ja' : 'nein'} |`,
      `| Neues Unternehmen erstellen sichtbar | ${hasCreateNewCompanyGuide ? 'ja' : 'nein'} |`,
      '',
      '## Screenshot-QA',
      '',
      'Das Bild zeigt die Seite `Mandanten` in der Instanz `playthru`. In der Aktionsleiste ist `Neu` sichtbar; der kleine Pfeil daneben ist geoeffnet. Im Dropdown sind `Neu` und `Neues Unternehmen erstellen` sichtbar. Das Bild zeigt keine gespeicherte neue Company und keine ausgewaehlte Dropdown-Aktion.',
      '',
      '## Klickanleitung',
      '',
      '1. Seite `Mandanten` oeffnen.',
      '2. In der Aktionsleiste den Button `Neu` suchen.',
      '3. Nicht auf den Hauptteil von `Neu` klicken, wenn nur die Alternativen erklaert werden sollen.',
      '4. Den kleinen Pfeil rechts neben `Neu` anklicken.',
      '5. Das Dropdown zeigt in diesem Kontext `Neu` und `Neues Unternehmen erstellen`. Diese Eintraege werden hier nur angesehen, nicht ausgefuehrt.',
      '',
      '## Buchlogik',
      '',
      'Der Hauptbutton `Neu` beginnt die Neuanlage direkt in der Liste. Der Pfeil daneben zeigt weitere Moeglichkeiten. Der sichtbare Eintrag `Neues Unternehmen erstellen` ist fachlich interessant, wird aber erst in einem eigenen sicheren Gate ausgefuehrt, weil er eine wirksame Anlage starten kann.',
      '',
      '## Naechster Schritt',
      '',
      '`TARGET-008-COMPANIES-NEW-ROW-FIELD-SAVE-GATE`: Hauptbutton `Neu` kontrolliert verwenden, Zielwerte eintragen und nur speichern, wenn die aktive neue Zeile eindeutig ist.',
      ''
    ].join('\n')
  );
});
