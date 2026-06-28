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
import { clickBcScoredAction } from '../../../core/bc/actions';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

const caseId = 'RM-DE-LAB-CREATE-002-SAVE-ERROR-DIAGNOSIS';
const testId = 'rm-de-lab-create-002';
const targetCompany = 'RM-DE-LAB';
const targetDisplayName = 'Rhein-Main DE Lab';
const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence', testId);

async function writeJson(fileName: string, data: unknown) {
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.writeFile(path.join(evidenceDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function escapedRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function targetCompanyVisibleText(page: Page) {
  if (new RegExp(escapedRegExp(targetCompany), 'i').test(await pageText(page))) {
    return true;
  }

  for (const scope of [page, ...page.frames()]) {
    if (await scope.getByText(new RegExp(escapedRegExp(targetCompany), 'i')).first().isVisible({ timeout: 500 }).catch(() => false)) {
      return true;
    }
  }

  return false;
}

async function targetCompanyVisibleAsInput(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const found = await scope
      .evaluate((target) => {
        return Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea')).some(
          (element) => (element.value || '').trim().toUpperCase() === target
        );
      }, targetCompany.toUpperCase())
      .catch(() => false);
    if (found) {
      return true;
    }
  }

  return false;
}

async function hasSaveErrorSignal(page: Page) {
  const text = await pageText(page);
  if (/Die Seite enth.lt einen Fehler|The page has an error|Nicht gespeichert|Not saved|Fehler|error/i.test(text)) {
    return true;
  }

  for (const scope of [page, ...page.frames()]) {
    if (
      await scope
        .getByText(/Die Seite enth.lt einen Fehler|The page has an error|Nicht gespeichert|Not saved/i)
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false)
    ) {
      return true;
    }
  }

  return false;
}

async function fillCompanyRowByKnownFocusRoute(page: Page) {
  const attempts: string[] = [];
  const text = await pageText(page);
  if (!/Neu - Companies|New - Companies|Companies|Company Name|Display Name/i.test(text)) {
    return { filled: false, attempts: ['companies-new-row-context-not-visible'] };
  }

  const activeDetails = await page
    .evaluate(() => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const element = document.activeElement as HTMLElement | null;
      if (!element) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        role: normalize(element.getAttribute('role')),
        ariaLabel: normalize(element.getAttribute('aria-label')),
        title: normalize(element.getAttribute('title')),
        text: normalize(element.innerText || element.textContent),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    })
    .catch(() => null);

  attempts.push(`active-before-type=${JSON.stringify(activeDetails)}`);
  await page.keyboard.type(targetCompany);
  await page.keyboard.press('Tab');
  await page.keyboard.type(targetDisplayName);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(3000);
  return { filled: true, attempts, activeBeforeType: activeDetails };
}

async function collectTargetRowControls(page: Page) {
  const all: unknown[] = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate((targets) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const targetRegex = new RegExp(targets.join('|'), 'i');

        return Array.from(document.querySelectorAll<HTMLElement>('input,textarea,[role="gridcell"],[role="row"],[aria-label],[title]'))
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            const value = normalize((element as HTMLInputElement).value);
            const text = normalize(element.innerText || element.textContent);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            return {
              index,
              tag: element.tagName.toLowerCase(),
              role: normalize(element.getAttribute('role')),
              ariaLabel,
              title,
              value,
              text,
              className: normalize(element.getAttribute('class')),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              matched: targetRegex.test([value, text, ariaLabel, title].join(' '))
            };
          })
          .filter((entry) => entry.matched)
          .slice(0, 80);
      }, [targetCompany, targetDisplayName])
      .catch(() => []);
    all.push(...entries);
  }
  return all;
}

async function collectErrorDiagnostics(page: Page) {
  const all: unknown[] = [];
  for (const scope of [page, ...page.frames()]) {
    const entries = await scope
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const errorPattern = /fehler|error|invalid|validation|nicht gespeichert|not saved|required|pflicht|cannot|can't|kann nicht|ung.ltig|warn/i;

        return Array.from(document.querySelectorAll<HTMLElement>('*'))
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            const value = normalize((element as HTMLInputElement).value);
            const text = normalize(element.innerText || element.textContent);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const describedBy = normalize(element.getAttribute('aria-describedby'));
            const errormessage = normalize(element.getAttribute('aria-errormessage'));
            const invalid = normalize(element.getAttribute('aria-invalid'));
            const role = normalize(element.getAttribute('role'));
            const className = normalize(element.getAttribute('class'));
            const summary = [value, text, ariaLabel, title, describedBy, errormessage, invalid, role, className].join(' ');
            return {
              index,
              tag: element.tagName.toLowerCase(),
              role,
              ariaLabel,
              title,
              describedBy,
              errormessage,
              invalid,
              value,
              text: text.slice(0, 500),
              className,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              matched: errorPattern.test(summary)
            };
          })
          .filter((entry) => entry.matched)
          .slice(0, 120);
      })
      .catch(() => []);
    all.push(...entries);
  }
  return all;
}

async function hoverLikelyErrorIndicators(page: Page) {
  const attempts: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const candidates = scope.locator(
      '[aria-label*="Fehler" i], [aria-label*="error" i], [title*="Fehler" i], [title*="error" i], [aria-invalid="true"], [class*="error" i], [data-icon-name*="Error" i]'
    );
    const count = Math.min(await candidates.count().catch(() => 0), 8);
    for (let index = 0; index < count; index += 1) {
      const candidate = candidates.nth(index);
      const details = await candidate
        .evaluate((element) => ({
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          ariaLabel: element.getAttribute('aria-label') || '',
          title: element.getAttribute('title') || '',
          text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120)
        }))
        .catch(() => null);
      const label = JSON.stringify(details);
      if (/Aktualisieren|Refresh|F5/i.test(label)) {
        attempts.push(`skip-refresh-like-${index}=${label}`);
        continue;
      }
      if (await candidate.isVisible({ timeout: 500 }).catch(() => false)) {
        await candidate.hover({ timeout: 1000 }).catch(() => undefined);
        await page.waitForTimeout(300);
        attempts.push(`hovered-${index}=${label}`);
      }
    }
  }
  return attempts;
}

function markdownSummary(result: {
  resultStatus: string;
  targetValueVisibleAfter: boolean;
  saveErrorAfter: boolean;
  errorCore: string;
  nextRouteDecision: string;
}) {
  return [
    '# RM-DE-LAB-CREATE-002 Save Error Diagnosis',
    '',
    'Status: `labor-blocked`, `ui-first-company-create-diagnosis`, `needs-german-final-rebuild`.',
    '',
    '## Zweck',
    '',
    'Dieser Lauf diagnostiziert den Companies-Page-Blocker aus `RM-DE-LAB-CREATE-001`. Er wiederholt nicht blind eine weitere Company-Anlage, sondern sammelt gezielt UI-/DOM-Signale zur ungespeicherten `RM-DE-LAB`-Zeile.',
    '',
    '## Ergebnis',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Result Status | \`${result.resultStatus}\` |`,
    `| Zielwert sichtbar | ${result.targetValueVisibleAfter ? 'ja' : 'nein'} |`,
    `| Save-/Page-Error sichtbar | ${result.saveErrorAfter ? 'ja' : 'nein'} |`,
    `| Fehlerkern | ${result.errorCore || 'nicht genauer als Page-/Save-Error sichtbar'} |`,
    `| Naechste Route | ${result.nextRouteDecision} |`,
    '',
    '## Was Anfaenger daraus lernen',
    '',
    '- Ein sichtbarer Wert in einer BC-Listenzeile ist noch kein gespeicherter Datensatz.',
    '- `Nicht gespeichert` und eine Fehlerleiste bedeuten: erst Fehlerdetails oder eine andere UI-Route pruefen, nicht mit Setup oder Company-Wechsel fortfahren.',
    '- Fuer eine Buch-/Clickguide-Anleitung braucht der Screenshot nicht nur den Code, sondern auch den Zustand, den man fachlich sehen will: Zielwert, Spaltenkontext und Fehlerstatus.',
    '',
    '## Grenzen',
    '',
    '- Es wurde keine Company gespeichert oder gewechselt.',
    '- Kein Setup, keine Datenmigration, kein Posting, kein Preview Posting und kein API-Shortcut.',
    '- Das ist weiterhin RM-DEMO-Labor innerhalb `MCP_1_20260210`, kein deutscher Finalnachweis.',
    ''
  ].join('\n');
}

test('RM-DE-LAB-CREATE-002 diagnoses Companies row save error without switching company', async ({ page }) => {
  test.setTimeout(8 * 60_000);
  await page.setViewportSize({ width: 2400, height: 1300 });

  await openBcPageById(page, 357, { envPrefix: project.envPrefix });
  const startUrl = decodeURIComponent(page.url());
  expect(startUrl, 'Der Lauf muss in MCP_1_20260210 bleiben.').toMatch(/MCP_1_20260210/i);
  expect(startUrl, 'Der Lauf muss aus RM-DEMO starten.').toMatch(/company=RM-DEMO/i);
  await waitForPageText(page, /Companies|Unternehmen|Company Name|Display Name|CRONUS|RM-DEMO/i, { timeout: 45_000 });

  const visibleBefore = await targetCompanyVisibleText(page);
  await writeEvidenceText(
    path.join(evidenceDir, '010-companies-before.txt'),
    await compactPageText(page, {
      include: [/Companies|Company|Unternehmen|RM-|CRONUS|My Company|Display Name|Evaluation Company|Assisted Company Setup|Setup Status|Fehler|Error|Nicht gespeichert/i],
      maxLines: 220
    })
  );

  await screenshot(page, 'rm-de-lab-create-002-010-before-diagnosis.png', {
    testId,
    status: 'labor',
    bookUse: 'evidence',
    purpose: 'Companies Page 357 vor der gezielten Save-Error-Diagnose; Kontext RM-DEMO/MCP_1_20260210 bleibt sichtbar.',
    expectedPageText: [/Companies|Unternehmen|Company Name|Display Name/i],
    knownLimitations: ['Vorher-Bild; keine gespeicherte RM-DE-LAB-Company und kein deutscher Finalnachweis.']
  });

  let newAction: unknown = null;
  let fillResult: unknown = { skipped: visibleBefore, reason: 'target-company-visible-before' };
  const reproductionAttempts: string[] = [];

  if (!visibleBefore) {
    newAction = await clickBcScoredAction(page, {
      actionPattern: /^New$|^Neu$|Erstellen Sie einen neuen Eintrag/i,
      scopeText: /Companies|Unternehmen|Company Name|Display Name|CRONUS|RM-DEMO/i,
      titleBonusPattern: /New|Neu|Erstellen Sie einen neuen Eintrag/i,
      rejectPattern: /Delete|L.schen|Copy|Kopieren|Switch|Wechsel/i,
      preferredYMin: 0,
      preferredYMax: 160,
      waitAfterClick: 2500
    });
    reproductionAttempts.push(`new-clicked=${Boolean((newAction as { clicked?: boolean }).clicked)}`);

    if ((newAction as { clicked?: boolean }).clicked) {
      fillResult = await fillCompanyRowByKnownFocusRoute(page);
      reproductionAttempts.push(`filled=${Boolean((fillResult as { filled?: boolean }).filled)}`);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(3500);
    }
  }

  const targetValueVisibleAfter = await targetCompanyVisibleAsInput(page);
  const targetTextVisibleAfter = await targetCompanyVisibleText(page);
  const saveErrorAfterBeforeHover = await hasSaveErrorSignal(page);
  const errorDiagnosticsBeforeHover = await collectErrorDiagnostics(page);
  const hoverAttempts = await hoverLikelyErrorIndicators(page);
  const errorDiagnosticsAfterHover = await collectErrorDiagnostics(page);
  const targetRowControls = await collectTargetRowControls(page);
  const saveErrorAfter = await hasSaveErrorSignal(page);

  await screenshot(page, 'rm-de-lab-create-002-020-save-error-diagnostics.png', {
    testId,
    status: saveErrorAfter ? 'rejected' : 'labor',
    bookUse: 'evidence',
    purpose: 'Diagnosebild der Companies-Zeile: Zielwert, sichtbarer Fehlerzustand und Spaltenkontext muessen zusammen lesbar sein.',
    expectedPageText: [/Companies|Unternehmen|Company Name|Display Name/i],
    knownLimitations: ['Blockerdiagnose; keine gespeicherte Company, kein Company-Wechsel, kein Setup.']
  });

  const errorCore = (() => {
    const candidates = [...errorDiagnosticsAfterHover, ...errorDiagnosticsBeforeHover] as Array<{
      text?: string;
      ariaLabel?: string;
      title?: string;
      value?: string;
      invalid?: string;
    }>;
    const rowSpecific = candidates
      .map((entry) => [entry.text, entry.ariaLabel, entry.title, entry.value, entry.invalid].filter(Boolean).join(' '))
      .find((entry) => /Create New Company|assisted setup guide|make sure you get everything you need/i.test(entry));
    if (rowSpecific) {
      return rowSpecific.replace(/\s+/g, ' ').trim().slice(0, 300);
    }
    const joined = candidates
      .map((entry) => [entry.text, entry.ariaLabel, entry.title, entry.value, entry.invalid].filter(Boolean).join(' '))
      .find((entry) => /Die Seite enth.lt einen Fehler|The page has an error|Nicht gespeichert|Not saved|Fehler|error|invalid/i.test(entry));
    return joined ? joined.replace(/\s+/g, ' ').trim().slice(0, 300) : '';
  })();

  const nextRouteDecision = saveErrorAfter || targetValueVisibleAfter
    ? 'Do not proceed to RM-DE-LAB setup. Next safe route: Companies creation route with explicit setup-assist/status value decision or an assisted company setup/copy-company route, still UI-first and documented.'
    : 'No target row/error signal reproduced. Next safe route: inspect available Companies actions/read-only create routes before any new create attempt.';

  await writeEvidenceText(
    path.join(evidenceDir, '020-companies-after-diagnosis.txt'),
    await compactPageText(page, {
      include: [/Companies|Company|Unternehmen|RM-|CRONUS|My Company|Display Name|Evaluation Company|Assisted Company Setup|Setup Status|Fehler|Error|Nicht gespeichert/i],
      maxLines: 260
    })
  );

  const timestamp = new Date().toISOString();
  const blockedBy = saveErrorAfter || targetValueVisibleAfter
    ? ['company-row-target-value-visible-but-not-persisted']
    : ['company-row-save-error-not-reproduced'];
  const resultStatus = 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId,
    source: 'playwright-ui-company-save-error-diagnosis',
    resultStatus,
    runPlanId: 'RM-DE-LAB-CREATE-002',
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    timestamp,
    instance: 'MCP_1_20260210',
    sourceCompany: 'RM-DEMO',
    targetCompany,
    targetDisplayName,
    pageId: 357,
    visibleBefore,
    targetTextVisibleAfter,
    targetValueVisibleAfter,
    saveErrorAfterBeforeHover,
    saveErrorAfter,
    newAction,
    fillResult,
    reproductionAttempts,
    hoverAttempts,
    targetRowControls,
    errorDiagnosticsBeforeHover,
    errorDiagnosticsAfterHover,
    diagnosedErrorCore: errorCore,
    nextRouteDecision,
    proved: [
      'Business Central direct URL Page 357 stayed in MCP_1_20260210 with company RM-DEMO.',
      targetValueVisibleAfter
        ? 'RM-DE-LAB and/or Rhein-Main DE Lab are visible as unsaved row input values.'
        : 'The diagnostic run did not prove a saved RM-DE-LAB company.',
      saveErrorAfter
        ? 'Companies page shows a save/page error signal after the target row value appears.'
        : 'No safe saved-company proof was obtained.'
    ],
    notProved: [
      'RM-DE-LAB was not proven as a saved company.',
      'No company switch was performed.',
      'No setup, template, chart of accounts, number series, posting groups or master data were configured.',
      'No German final proof was created.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-002/RM-DE-LAB-CREATE-002-result.json',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-002/RM-DE-LAB-CREATE-002.md',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-002/010-companies-before.txt',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-002/020-companies-after-diagnosis.txt'
    ],
    statePatch: {
      current: {
        activeArea: 'company',
        activeCase: caseId,
        active_case_file: '.agent/state/cases/rm-de-lab-create-002-save-error-diagnosis.json',
        lastReferenceCase: caseId,
        lastReferenceCaseFile: '.agent/state/cases/rm-de-lab-create-002-save-error-diagnosis.json',
        nextStep: 'RM-DE-LAB-CREATE-003: choose explicit assisted setup/status/copy-company UI route, or park RM-DE-LAB and continue RM-DEMO process work.'
      }
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-002/RM-DE-LAB-CREATE-002-result.json',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-002/RM-DE-LAB-CREATE-002.md'
    ],
    blockedBy,
    requiresReview: true,
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
      noCompanyCreated: true
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction: 'In einer spaeteren deutschen Zielinstanz muss eine Zielcompany ueber einen belegten UI-Klickpfad neu angelegt oder aus Vorlage kopiert werden; diese RM-DEMO-Diagnose darf nur als Labor-/Debugging-Referenz dienen.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'Der Fehler zeigt, dass sichtbare Companies-Zeilenwerte nicht als gespeicherte Company zaehlen; deutsche Zielcompany braucht spaeter eigenen Speichernachweis.',
    finalScreenshotNeeded: true,
    reason: 'The company-create row remains blocked before a saved company proof; setup must not start from this state.'
  };

  await writeJson('RM-DE-LAB-CREATE-002-result.json', result);
  await writeJson('RM-DE-LAB-CREATE-002-diagnostics.json', {
    timestamp,
    targetRowControls,
    errorDiagnosticsBeforeHover,
    errorDiagnosticsAfterHover,
    hoverAttempts
  });
  await writeEvidenceText(
    path.join(evidenceDir, 'RM-DE-LAB-CREATE-002.md'),
    markdownSummary({
      resultStatus,
      targetValueVisibleAfter,
      saveErrorAfter,
      errorCore,
      nextRouteDecision
    })
  );
  await writeEvidenceText(
    path.join(evidenceDir, 'README.md'),
    [
      '# Evidence RM-DE-LAB-CREATE-002',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `RM-DE-LAB-CREATE-002-result.json` | JSON | Companies-Page-Fehlerdiagnose, Safety Flags, naechste Route | gespeicherte RM-DE-LAB Company | labor-blocked |',
      '| `RM-DE-LAB-CREATE-002-diagnostics.json` | JSON | DOM-/UI-Fehler- und Zielwertsignale | vollstaendige BC-Tabellenlogik | diagnostic |',
      '| `RM-DE-LAB-CREATE-002.md` | Markdown | Lernfall: sichtbare Zeilenwerte sind kein Speichernachweis | deutsches Finalsetup | book-draft-anchor |',
      '| `010-companies-before.txt` | UI-Text | Companies-Kontext vor Diagnose | Inputwerte | labor |',
      '| `020-companies-after-diagnosis.txt` | UI-Text | Fehler-/Companies-Kontext nach Diagnose | gespeicherte Company | labor-blocked |',
      '| `rm-de-lab-create-002-010-before-diagnosis.png` | Screenshot | Startkontext Companies Page 357 | Setup/Finalzustand | labor |',
      '| `rm-de-lab-create-002-020-save-error-diagnostics.png` | Screenshot | Zielwert-/Fehlerzustand im UI-Kontext | gespeicherte Company | rejected/labor-blocked |',
      ''
    ].join('\n')
  );

  expect(decodeURIComponent(page.url()), 'Der Lauf muss in MCP_1_20260210 bleiben.').toMatch(/MCP_1_20260210/i);
  expect(decodeURIComponent(page.url()), 'Der Lauf darf nicht in RM-DE-LAB wechseln.').toMatch(/company=RM-DEMO/i);
});
