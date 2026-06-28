import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import {
  compactPageText,
  openBcPageById,
  pageText,
  screenshot,
  waitForPageText,
  writeEvidenceText
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

const caseId = 'RM-DE-LAB-CREATE-003-CREATE-NEW-COMPANY-ACTION-ROUTE';
const testId = 'rm-de-lab-create-003';
const targetCompany = 'RM-DE-LAB';
const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence', testId);

async function writeJson(fileName: string, data: unknown) {
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.writeFile(path.join(evidenceDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function collectCompanyActionCandidates(page: Page) {
  const all: Array<Record<string, unknown> & { text: string; ariaLabel: string; title: string; score: number }> = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const interesting = /Create New Company|New Company|Assisted|Setup|Company|Companies|Neu|Unternehmen|Einrichten|Copy|Kopieren/i;
        return Array.from(document.querySelectorAll<HTMLElement>('button,a,[role="button"],[role="menuitem"],[aria-label],[title]'))
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const role = normalize(element.getAttribute('role'));
            const label = [text, ariaLabel, title].join(' ');
            let score = 0;
            if (/Create New Company/i.test(label)) score -= 100;
            if (/New Company/i.test(label)) score -= 80;
            if (/Assisted|Setup/i.test(label)) score -= 30;
            if (/Copy|Kopieren|Delete|L.schen|Switch|Wechsel/i.test(label)) score += 200;
            if (/Aktualisieren|Refresh|F5/i.test(label)) score += 200;
            return {
              index,
              tag: element.tagName.toLowerCase(),
              role,
              text,
              ariaLabel,
              title,
              label,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              score,
              matched: interesting.test(label)
            };
          })
          .filter((entry) => entry.matched)
          .sort((a, b) => a.score - b.score)
          .slice(0, 120);
      })
      .catch(() => []);
    all.push(...entries);
  }
  return all.sort((a, b) => a.score - b.score);
}

async function clickExactCreateNewCompanyIfVisible(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const candidates = [
      scope.getByRole('button', { name: /Create New Company/i }),
      scope.getByRole('menuitem', { name: /Create New Company/i }),
      scope.getByText(/Create New Company/i)
    ];
    for (const locator of candidates) {
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);
        if (!(await candidate.isVisible({ timeout: 500 }).catch(() => false))) {
          continue;
        }
        const details = await candidate
          .evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              role: element.getAttribute('role') || '',
              text: (element.textContent || '').replace(/\s+/g, ' ').trim(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .catch(() => null);
        await candidate.click({ timeout: 3000 });
        await page.waitForTimeout(3000);
        return { clicked: true, details, scopeUrl: scope.url() };
      }
    }
  }

  return { clicked: false };
}

async function collectWizardContext(page: Page) {
  const text = await pageText(page);
  const wizardVisible = /Create New Company|Assisted Company Setup|company setup|Set up company|Einricht|Unternehmen/i.test(text)
    && /Next|Weiter|Back|Zur.ck|Finish|Fertig stellen|Company Name|Name/i.test(text);
  const controls = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(document.querySelectorAll<HTMLElement>('input,textarea,button,a,[role="button"],[role="textbox"],[role="combobox"],[aria-label],[title]'))
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            return {
              index,
              tag: element.tagName.toLowerCase(),
              role: normalize(element.getAttribute('role')),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              value: normalize((element as HTMLInputElement).value),
              text: normalize(element.innerText || element.textContent),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter((entry) => /Create New Company|Assisted|Setup|Company|Name|Next|Weiter|Finish|Fertig|Back|Zur.ck/i.test([entry.text, entry.ariaLabel, entry.title, entry.value].join(' ')))
          .slice(0, 120);
      })
      .catch(() => []);
    controls.push(...entries);
  }
  return { wizardVisible, textSnippet: text.replace(/\s+/g, ' ').slice(0, 1200), controls };
}

function markdownSummary(result: {
  resultStatus: string;
  createActionClicked: boolean;
  wizardVisible: boolean;
  routeDecision: string;
}) {
  return [
    '# RM-DE-LAB-CREATE-003 Create New Company Action Route',
    '',
    `Status: \`${result.resultStatus}\`, \`company-create-route-gate\`, \`needs-german-final-rebuild\`.`,
    '',
    '## Zweck',
    '',
    '`RM-DE-LAB-CREATE-002` zeigte, dass direkte Listenzeilen-Anlage blockiert ist und BC den `Create New Company`-/Assisted-Setup-Pfad verlangt. Dieser Lauf prueft genau diesen Pfad, ohne einen unbekannten Wizard abzuschliessen.',
    '',
    '## Ergebnis',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Create-New-Company-Aktion geklickt | ${result.createActionClicked ? 'ja' : 'nein'} |`,
    `| Wizard-/Assisted-Kontext sichtbar | ${result.wizardVisible ? 'ja' : 'nein'} |`,
    `| Routenentscheidung | ${result.routeDecision} |`,
    '',
    '## Grenzen',
    '',
    '- Es wurde keine Company gespeichert oder gewechselt.',
    '- Es wurde kein unbekannter Wizard final bestaetigt.',
    '- Kein Setup, kein Posting, kein Preview Posting und kein API-Shortcut.',
    '- RM-DEMO bleibt Labor; deutsche Zielcompany muss spaeter neu/final belegt werden.',
    ''
  ].join('\n');
}

test('RM-DE-LAB-CREATE-003 checks Create New Company action route without finishing wizard', async ({ page }) => {
  test.setTimeout(8 * 60_000);
  await page.setViewportSize({ width: 2400, height: 1300 });

  await openBcPageById(page, 357, { envPrefix: project.envPrefix });
  const startUrl = decodeURIComponent(page.url());
  expect(startUrl, 'Der Lauf muss in MCP_1_20260210 bleiben.').toMatch(/MCP_1_20260210/i);
  expect(startUrl, 'Der Lauf muss aus RM-DEMO starten.').toMatch(/company=RM-DEMO/i);
  await waitForPageText(page, /Companies|Unternehmen|Company Name|Display Name|CRONUS|RM-DEMO/i, { timeout: 45_000 });

  await writeEvidenceText(
    path.join(evidenceDir, '010-companies-before-action-route.txt'),
    await compactPageText(page, {
      include: [/Companies|Company|Unternehmen|RM-|CRONUS|My Company|Display Name|Evaluation Company|Assisted Company Setup|Setup Status|Create New Company|Copy|Neu|Weitere Optionen/i],
      maxLines: 240
    })
  );
  await screenshot(page, 'rm-de-lab-create-003-010-companies-action-route-start.png', {
    testId,
    status: 'labor',
    bookUse: 'evidence',
    purpose: 'Companies Page 357 vor der Suche nach dem expliziten Create-New-Company-/Assisted-Setup-Pfad.',
    expectedPageText: [/Companies|Unternehmen|Company Name|Display Name/i],
    knownLimitations: ['Routen-Gate; noch keine Company-Anlage.']
  });

  const actionCandidatesBefore = await collectCompanyActionCandidates(page);
  const clickResult = await clickExactCreateNewCompanyIfVisible(page);
  const rawWizardContext = await collectWizardContext(page);
  const wizardContext = {
    ...rawWizardContext,
    wizardVisible: clickResult.clicked && rawWizardContext.wizardVisible
  };
  const actionCandidatesAfter = await collectCompanyActionCandidates(page);

  await screenshot(page, 'rm-de-lab-create-003-020-after-create-route-attempt.png', {
    testId,
    status: clickResult.clicked ? 'labor' : 'rejected',
    bookUse: 'evidence',
    purpose: clickResult.clicked
      ? 'Nach Klick auf den expliziten Create-New-Company-Pfad; kein Finish/keine Company-Speicherung.'
      : 'Create-New-Company-Pfad war nicht sichtbar; Action-Inventar dient als Blocker-Evidence.',
    expectedPageText: [/Companies|Unternehmen|Company|Display Name/i],
    knownLimitations: ['Kein Company-Wechsel, kein Setup, kein deutscher Finalnachweis.']
  });

  await writeEvidenceText(
    path.join(evidenceDir, '020-after-create-route-attempt.txt'),
    await compactPageText(page, {
      include: [/Companies|Company|Unternehmen|RM-|CRONUS|Create New Company|Assisted|Setup|Next|Weiter|Finish|Fertig|Name|Display Name|Fehler|Error/i],
      maxLines: 260
    })
  );

  const resultStatus = clickResult.clicked && wizardContext.wizardVisible ? 'observed' : 'blocked';
  const routeDecision = clickResult.clicked && wizardContext.wizardVisible
    ? 'Create New Company / assisted setup route opens a wizard context. Next case may map fields and only then decide whether to finish RM-DE-LAB creation.'
    : 'Create New Company action was not visible/clickable from Page 357 start context. Do not edit list row again; use scoped action/menu discovery or park RM-DE-LAB.';
  const timestamp = new Date().toISOString();
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId,
    source: 'playwright-ui-company-create-new-company-route',
    resultStatus,
    runPlanId: 'RM-DE-LAB-CREATE-003',
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    timestamp,
    instance: 'MCP_1_20260210',
    sourceCompany: 'RM-DEMO',
    targetCompany,
    pageId: 357,
    createActionClicked: clickResult.clicked,
    clickResult,
    wizardVisible: wizardContext.wizardVisible,
    wizardContext,
    actionCandidatesBefore,
    actionCandidatesAfter,
    routeDecision,
    proved: [
      'Business Central direct URL Page 357 stayed in MCP_1_20260210 with company RM-DEMO.',
      clickResult.clicked
        ? 'An exact Create New Company action was clicked without using API or Tell-Me search.'
        : 'The exact Create New Company action was not visible/clickable from the Page 357 start context.',
      wizardContext.wizardVisible
        ? 'A company setup/assisted wizard context was visible after the route attempt.'
        : 'No safely usable company setup/assisted wizard context was proven.'
    ],
    notProved: [
      'RM-DE-LAB was not proven as a saved company.',
      'No wizard Finish/OK was confirmed.',
      'No company switch was performed.',
      'No setup, template, chart of accounts, number series, posting groups or master data were configured.',
      'No German final proof was created.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-003/RM-DE-LAB-CREATE-003-result.json',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-003/RM-DE-LAB-CREATE-003-action-candidates.json',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-003/RM-DE-LAB-CREATE-003.md',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-003/010-companies-before-action-route.txt',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-003/020-after-create-route-attempt.txt'
    ],
    statePatch: {
      current: {
        activeArea: 'company',
        activeCase: caseId,
        active_case_file: '.agent/state/cases/rm-de-lab-create-003-create-new-company-action-route.json',
        lastReferenceCase: caseId,
        lastReferenceCaseFile: '.agent/state/cases/rm-de-lab-create-003-create-new-company-action-route.json',
        nextStep: clickResult.clicked && wizardContext.wizardVisible
          ? 'RM-DE-LAB-CREATE-004: map assisted setup wizard fields before any Finish/OK.'
          : 'Park RM-DE-LAB or run a scoped Companies action/menu discovery; do not edit the Companies list row again.'
      }
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-003/RM-DE-LAB-CREATE-003-result.json',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-003/RM-DE-LAB-CREATE-003.md'
    ],
    blockedBy: resultStatus === 'blocked' ? ['create-new-company-action-not-visible-or-wizard-not-proven'] : [],
    requiresReview: resultStatus === 'blocked',
    safeToFinalizeState: false,
    flags: {
      noPost: true,
      noPreviewPosting: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noTemplateCopy: true,
      noDelete: true,
      noCompanyCreated: true,
      noWizardFinish: true
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction: 'In einer spaeteren deutschen Zielinstanz muss der Company-Create-/Assisted-Setup-Pfad neu als German-Final-Candidate belegt werden.',
    mustRecreateInFinalSandbox: true,
    targetGermanCompanyImpact: 'Der Lauf klaert nur den Labor-Klickpfad zur Company-Anlage; deutsche Foundation- und Finalnachweise bleiben offen.',
    finalScreenshotNeeded: true,
    reason: routeDecision
  };

  await writeJson('RM-DE-LAB-CREATE-003-result.json', result);
  await writeJson('RM-DE-LAB-CREATE-003-action-candidates.json', {
    timestamp,
    actionCandidatesBefore,
    actionCandidatesAfter,
    clickResult,
    wizardContext
  });
  await writeEvidenceText(
    path.join(evidenceDir, 'RM-DE-LAB-CREATE-003.md'),
    markdownSummary({
      resultStatus,
      createActionClicked: clickResult.clicked,
      wizardVisible: wizardContext.wizardVisible,
      routeDecision
    })
  );
  await writeEvidenceText(
    path.join(evidenceDir, 'README.md'),
    [
      '# Evidence RM-DE-LAB-CREATE-003',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `RM-DE-LAB-CREATE-003-result.json` | JSON | Create-New-Company-/Assisted-Setup-Routen-Gate | gespeicherte Company | labor |',
      '| `RM-DE-LAB-CREATE-003-action-candidates.json` | JSON | sichtbare Kandidaten fuer Company-Anlageaktionen | vollstaendige interne BC-Aktionsliste | diagnostic |',
      '| `RM-DE-LAB-CREATE-003.md` | Markdown | Routenentscheidung und Grenzen | deutsches Finalsetup | book-draft-anchor |',
      '| `010-companies-before-action-route.txt` | UI-Text | Companies-Kontext vor Routenversuch | Wizard-Felder | labor |',
      '| `020-after-create-route-attempt.txt` | UI-Text | Kontext nach Routenversuch | Company-Speicherung | labor/rejected |',
      '| `rm-de-lab-create-003-010-companies-action-route-start.png` | Screenshot | Startkontext Page 357 | Setup/Finalzustand | labor |',
      '| `rm-de-lab-create-003-020-after-create-route-attempt.png` | Screenshot | Routenversuch oder Blocker | gespeicherte Company | labor/rejected |',
      ''
    ].join('\n')
  );

  expect(decodeURIComponent(page.url()), 'Der Lauf muss in MCP_1_20260210 bleiben.').toMatch(/MCP_1_20260210/i);
  expect(decodeURIComponent(page.url()), 'Der Lauf darf nicht in RM-DE-LAB wechseln.').toMatch(/company=RM-DEMO/i);
});
