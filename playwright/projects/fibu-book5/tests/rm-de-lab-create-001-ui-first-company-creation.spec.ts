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

const caseId = 'RM-DE-LAB-CREATE-001-UI-FIRST-COMPANY-CREATION';
const testId = 'rm-de-lab-create-001';
const targetCompany = 'RM-DE-LAB';
const targetDisplayName = 'Rhein-Main DE Lab';
const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence', testId);
const registryPath = path.resolve('playwright/projects/fibu-book5/COMPANY-REGISTRY.json');
const registryMdPath = path.resolve('playwright/projects/fibu-book5/COMPANY-REGISTRY.md');

async function writeJson(fileName: string, data: unknown) {
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.writeFile(path.join(evidenceDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function escapedRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function visibleTargetCompany(page: Page) {
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

async function targetCompanyValueVisible(page: Page) {
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

async function hasVisibleSaveError(page: Page) {
  const text = await pageText(page);
  if (/Die Seite enth.lt einen Fehler|The page has an error|Nicht gespeichert|Not saved/i.test(text)) {
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

async function candidateTextControls(scope: Page | Frame) {
  return scope
    .evaluate(() => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };

      return Array.from(document.querySelectorAll<HTMLElement>('input,textarea,[contenteditable="true"],[role="textbox"],[role="combobox"],[aria-label]'))
        .filter(visible)
        .map((element, index) => {
          const rect = element.getBoundingClientRect();
          return {
            index,
            tag: element.tagName.toLowerCase(),
            role: normalize(element.getAttribute('role')),
            type: normalize(element.getAttribute('type')),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            placeholder: normalize(element.getAttribute('placeholder')),
            value: normalize((element as HTMLInputElement).value),
            text: normalize(element.innerText || element.textContent),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        })
        .filter((entry) => !/search|suchen|tell me|was m.chten/i.test([entry.ariaLabel, entry.title, entry.placeholder].join(' ')))
        .slice(0, 80);
    })
    .catch(() => []);
}

async function fillCompanyNameIfUnambiguous(page: Page) {
  const attempts: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const bodyText = await scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Companies|Unternehmen|Company Name|Display Name|Evaluation Company|Assisted Company Setup/i.test(bodyText)) {
      continue;
    }

    const locators = [
      scope.getByRole('textbox', { name: /^Name$/i }),
      scope.getByRole('textbox', { name: /Company Name|Unternehmen.*Name|Mandantenname/i }),
      scope.getByLabel(/^Name$/i),
      scope.getByLabel(/Company Name|Unternehmen.*Name|Mandantenname/i)
    ];

    for (const locator of locators) {
      const count = await locator.count().catch(() => 0);
      attempts.push(`locator-count=${count}`);
      if (count !== 1) {
        continue;
      }

      const candidate = locator.first();
      if (!(await candidate.isVisible({ timeout: 1000 }).catch(() => false))) {
        attempts.push('candidate-not-visible');
        continue;
      }

      await candidate.fill(targetCompany, { timeout: 5000 });
      await page.keyboard.press('Tab');
      await page.keyboard.type(targetDisplayName);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2000);
      return { filled: true, scopeUrl: scope.url(), attempts };
    }
  }

  const text = await pageText(page);
  if (/Neu - Companies|New - Companies/i.test(text)) {
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

    attempts.push(`active-fallback=${JSON.stringify(activeDetails)}`);
    await page.keyboard.type(targetCompany);
    await page.keyboard.press('Tab');
    await page.keyboard.type(targetDisplayName);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2500);
    return { filled: true, scopeUrl: page.url(), attempts, activeFallback: activeDetails };
  }

  return { filled: false, attempts };
}

async function writeRegistryProofIfVisible(result: { timestamp: string; created: boolean; visibleAfter: boolean }) {
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf8')) as {
    updatedAt?: string;
    companies: Array<Record<string, unknown> & { company: string; status?: string; actualVisibleInBc?: string; lastProof?: string[] }>;
  };
  const target = registry.companies.find((entry) => entry.company === targetCompany);
  if (target && result.visibleAfter) {
    registry.updatedAt = result.timestamp;
    target.status = result.created ? 'actual-visible-created-rm-de-lab-create-001' : 'actual-visible-existing-rm-de-lab-create-001';
    target.actualVisibleInBc = 'actual-visible-rm-de-lab-create-001';
    target.lastProof = [
      ...(target.lastProof ?? []),
      'RM-DE-LAB-CREATE-001 Companies page UI proof'
    ];
  }
  await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');

  if (result.visibleAfter) {
    const markdown = await fs.readFile(registryMdPath, 'utf8');
    const updated = markdown
      .replace('Stand: 16.06.2026', `Stand: ${result.timestamp.slice(0, 10)}`)
      .replace(
        /\| `RM-DE-LAB` \| ([^\n]+?) \| planned-only \/ not-created \| ([^\n]+?) \| erst nach eigenem UI-first Company-Creation-Case; Foundation-Setup erst nach actual-visible Proof \| `RM-DE-LAB-001` Governance-Entscheidung, kein BC-Nachweis \|/,
        '| `RM-DE-LAB` | geplante saubere deutsch orientierte Labor-/Rebuild-Company innerhalb `MCP_1_20260210` | UI-first Companies Page 357; Shell-Company ohne Setup-/Template-Proof | Ziel: deutsch orientiertes Labor, DE-Final weiter offen | actual-visible / shell-created-or-existing | 6, 7, 10-13, 19-21, 23, 25 | Foundation-Setup erst nach eigenem Setup-Case; keine deutschen Finalclaims | `RM-DE-LAB-CREATE-001` Companies-Page UI-Proof |'
      );
    await fs.writeFile(registryMdPath, updated, 'utf8');
  }
}

function markdownSummary(result: {
  created: boolean;
  visibleBefore: boolean;
  visibleAfter: boolean;
  blockedBy: string[];
  urlAfter: string;
}) {
  const status = result.visibleAfter ? '`labor-proven`, `company-context`, `needs-german-final-rebuild`' : '`labor-blocked`, `company-context`, `needs-german-final-rebuild`';
  return [
    '# RM-DE-LAB-CREATE-001 UI-first Company Creation',
    '',
    `Status: ${status}.`,
    '',
    '## Zweck',
    '',
    'Dieser Lauf prueft und entsperrt die geplante deutsch orientierte Laborcompany `RM-DE-LAB` innerhalb der bestehenden Sandbox `MCP_1_20260210`. Der Lauf nutzt die Companies-Seite per Direct URL Page 357 und keinen API-Shortcut.',
    '',
    '## Ergebnis',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Zielcompany | \`${targetCompany}\` |`,
    `| Bereits vorher sichtbar | ${result.visibleBefore ? 'ja' : 'nein'} |`,
    `| In diesem Lauf angelegt | ${result.created ? 'ja' : 'nein'} |`,
    `| Danach sichtbar | ${result.visibleAfter ? 'ja' : 'nein'} |`,
    `| URL nach Lauf | ${result.urlAfter} |`,
    `| Blocker | ${result.blockedBy.length ? result.blockedBy.map((entry) => `\`${entry}\``).join(', ') : 'keine'} |`,
    '',
    '## Grenzen',
    '',
    '- Das ist nur eine Labor-/Shell-Company innerhalb `MCP_1_20260210`.',
    '- Es wurde kein Setup, keine Vorlage, kein Posting, kein Preview Posting und kein Company-Wechsel ausgefuehrt.',
    '- Die Company ist kein deutscher Finalnachweis und ersetzt keine spaetere deutsche Zielinstanz.',
    '',
    '## Rebuild-Hinweis',
    '',
    'In einer spaeteren deutschen Zielinstanz muss die Company neu als `german-final-candidate` angelegt oder registriert werden. Alle Foundation-/VAT-/Kontenplan-/Posting-Gruppen-Nachweise muessen dort neu erzeugt werden.',
    ''
  ].join('\n');
}

test('RM-DE-LAB-CREATE-001 creates or proves RM-DE-LAB via Companies page UI', async ({ page }) => {
  test.setTimeout(8 * 60_000);
  await page.setViewportSize({ width: 2400, height: 1300 });

  await openBcPageById(page, 357, { envPrefix: project.envPrefix });
  const startUrl = decodeURIComponent(page.url());
  expect(startUrl, 'Der Lauf muss in MCP_1_20260210 bleiben.').toMatch(/MCP_1_20260210/i);
  expect(startUrl, 'Der Lauf muss aus RM-DEMO starten.').toMatch(/company=RM-DEMO/i);
  await waitForPageText(page, /Companies|Unternehmen|Company Name|Display Name|CRONUS|RM-DEMO/i, { timeout: 45_000 });

  const visibleBefore = await visibleTargetCompany(page);
  await writeEvidenceText(
    path.join(evidenceDir, '010-companies-before.txt'),
    await compactPageText(page, {
      include: [/Companies|Company|Unternehmen|RM-|CRONUS|My Company|Display Name|Evaluation Company|Assisted Company Setup|Setup Status/i],
      maxLines: 200
    })
  );

  let created = false;
  const blockedBy: string[] = [];
  let newAction: unknown = null;
  let fillResult: unknown = null;
  let controlsAfterNew: unknown[] = [];

  if (!visibleBefore) {
    await screenshot(page, 'rm-de-lab-create-001-010-before-new.png', {
      testId,
      status: 'labor',
      bookUse: 'evidence',
      purpose: 'Companies Page 357 vor der kontrollierten RM-DE-LAB-Anlage; RM-DE-LAB ist noch nicht sichtbar.',
      expectedPageText: [/Companies|Unternehmen|Company Name|Display Name/i],
      knownLimitations: ['Vorher-Bild; kein deutscher Finalnachweis.']
    });

    newAction = await clickBcScoredAction(page, {
      actionPattern: /^New$|^Neu$|Erstellen Sie einen neuen Eintrag/i,
      scopeText: /Companies|Unternehmen|Company Name|Display Name|CRONUS|RM-DEMO/i,
      titleBonusPattern: /New|Neu|Erstellen Sie einen neuen Eintrag/i,
      rejectPattern: /Delete|L.schen|Copy|Kopieren|Switch|Wechsel/i,
      preferredYMin: 0,
      preferredYMax: 160,
      waitAfterClick: 2500
    });

    if (!(newAction as { clicked?: boolean }).clicked) {
      blockedBy.push('new-action-not-found-in-companies-context');
    } else {
      const suspiciousDialogText = await pageText(page);
      if (/Do you want to delete|M. möchten Sie.*l.schen|Soll.*gel.scht werden|confirm deletion/i.test(suspiciousDialogText)) {
        blockedBy.push('dangerous-dialog-after-new');
      } else if (/Copy Company|Unternehmen kopieren|Copy Data|Firmendaten kopieren/i.test(suspiciousDialogText)) {
        blockedBy.push('copy-company-wizard-opened-no-template-choice-in-this-case');
      } else {
        fillResult = await fillCompanyNameIfUnambiguous(page);
        if (!(fillResult as { filled?: boolean }).filled) {
          controlsAfterNew = (
            await Promise.all([page, ...page.frames()].map((scope) => candidateTextControls(scope)))
          ).flat();
          blockedBy.push('company-name-field-not-unambiguous');
        } else {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(5000);
          created = await visibleTargetCompany(page);
          if (created && (await hasVisibleSaveError(page))) {
            blockedBy.push('target-company-visible-but-save-error-remains');
            created = false;
          } else if (!created) {
            const targetValueVisible = await targetCompanyValueVisible(page);
            blockedBy.push(targetValueVisible ? 'target-company-value-visible-but-not-saved' : 'target-company-not-visible-after-name-entry');
          }
        }
      }
    }
  }

  const visibleAfter = await visibleTargetCompany(page);
  const targetValueVisibleAfter = await targetCompanyValueVisible(page);
  const saveErrorAfter = await hasVisibleSaveError(page);
  if (saveErrorAfter || targetValueVisibleAfter) {
    await screenshot(page, 'rm-de-lab-create-001-030-blocked-unsaved-row.png', {
      testId,
      status: saveErrorAfter ? 'rejected' : 'labor',
      bookUse: 'evidence',
      purpose: 'RM-DE-LAB wurde als Companies-Zielwert erreicht, aber bleibt wegen Seitenfehler/Nicht gespeichert ein Blocker statt gespeicherter Company-Proof.',
      expectedPageText: [/Companies|Unternehmen|Company Name|Display Name/i],
      knownLimitations: ['Blockerbild; keine gespeicherte Company, kein Setup, kein deutscher Finalnachweis.']
    });
  }
  await writeEvidenceText(
    path.join(evidenceDir, '020-companies-after.txt'),
    await compactPageText(page, {
      include: [/Companies|Company|Unternehmen|RM-|CRONUS|My Company|Display Name|Evaluation Company|Assisted Company Setup|Setup Status/i],
      maxLines: 220
    })
  );

  if (visibleAfter) {
    await screenshot(page, 'rm-de-lab-create-001-020-after-visible.png', {
      testId,
      status: 'labor',
      bookUse: 'evidence',
      purpose: 'RM-DE-LAB ist in der Companies-Liste sichtbar; dies beweist nur die Labor-Shell-Company, kein Setup und keinen deutschen Finalzustand.',
      expectedPageText: [/Companies|Unternehmen|Company Name|Display Name/i, /RM-DE-LAB/i],
      knownLimitations: ['Keine Foundation-/VAT-/Posting-Setup-Werte, keine deutsche Finalinstanz.']
    });
  }

  const timestamp = new Date().toISOString();
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId,
    source: 'playwright-ui-company-create',
    resultStatus: visibleAfter && !saveErrorAfter ? 'observed' : 'blocked',
    runPlanId: 'RM-DE-LAB-CREATE-001',
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    timestamp,
    instance: 'MCP_1_20260210',
    startCompany: 'RM-DEMO',
    targetCompany,
    pageId: 357,
    visibleBefore,
    created,
    visibleAfter,
    targetValueVisibleAfter,
    saveErrorAfter,
    newAction,
    fillResult,
    controlsAfterNew,
    proved: [
      'Business Central direct URL Page 357 stayed in MCP_1_20260210 with start company RM-DEMO.',
      visibleAfter && !saveErrorAfter
        ? 'RM-DE-LAB is visible in the Companies page UI after the run.'
        : targetValueVisibleAfter
          ? 'RM-DE-LAB value was entered into the Companies UI but remained blocked/unsaved.'
          : 'RM-DE-LAB was not visible after the controlled UI attempt.'
    ],
    notProved: [
      'No company switch was performed.',
      'No setup, VAT, chart of accounts, number series, posting groups or master data were configured.',
      'No German final proof was created.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-001/RM-DE-LAB-CREATE-001-result.json',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-001/RM-DE-LAB-CREATE-001.md',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-001/010-companies-before.txt',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-001/020-companies-after.txt',
      'playwright/projects/fibu-book5/COMPANY-REGISTRY.json',
      'playwright/projects/fibu-book5/COMPANY-REGISTRY.md'
    ],
    statePatch: {
      current: {
        activeArea: 'company',
        activeCase: caseId,
        active_case_file: '.agent/state/cases/rm-de-lab-create-001-ui-first-company-creation.json',
        lastReferenceCase: caseId,
        lastReferenceCaseFile: '.agent/state/cases/rm-de-lab-create-001-ui-first-company-creation.json'
      }
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-001/RM-DE-LAB-CREATE-001-result.json',
      'playwright/projects/fibu-book5/evidence/rm-de-lab-create-001/RM-DE-LAB-CREATE-001.md'
    ],
    blockedBy,
    requiresReview: !visibleAfter || saveErrorAfter,
    safeToFinalizeState: visibleAfter && !saveErrorAfter,
    flags: {
      noPost: true,
      noPreviewPosting: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noTemplateCopy: true
    },
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    reason: visibleAfter && !saveErrorAfter
      ? 'RM-DE-LAB is now actual-visible as a laboratory shell company inside MCP_1_20260210.'
      : 'Company creation route blocked before a safe visible RM-DE-LAB proof.'
  };

  await writeJson('RM-DE-LAB-CREATE-001-result.json', result);
  await writeEvidenceText(path.join(evidenceDir, 'RM-DE-LAB-CREATE-001.md'), markdownSummary({
    created,
    visibleBefore,
    visibleAfter,
    blockedBy,
    urlAfter: decodeURIComponent(page.url())
  }));
  await writeEvidenceText(
    path.join(evidenceDir, 'README.md'),
    [
      '# Evidence RM-DE-LAB-CREATE-001',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `RM-DE-LAB-CREATE-001-result.json` | JSON | Company-Create/Visible-Proof Ergebnis, Safety Flags, Grenzen | Foundation Setup oder deutschen Finalzustand | labor |',
      '| `RM-DE-LAB-CREATE-001.md` | Markdown | Warum RM-DE-LAB Labor-Shell ist und was spaeter neu aufgebaut werden muss | VAT/Kontenplan/Posting-Gruppen | labor, book-draft-anchor |',
      '| `010-companies-before.txt` | UI-Text | Companies-Liste vor Aktion | Rohsnapshot | labor |',
      '| `020-companies-after.txt` | UI-Text | Companies-Liste nach Aktion | Foundation-Setup | labor |',
      '| `rm-de-lab-create-001-020-after-visible.png` | Screenshot | sichtbare gespeicherte RM-DE-LAB Company, falls vorhanden | Setup oder Finalnachweis | labor |',
      '| `rm-de-lab-create-001-030-blocked-unsaved-row.png` | Screenshot | ungespeicherte/fehlerhafte RM-DE-LAB-Zeile als Blocker | gespeicherte Company | rejected/labor-blocked |',
      ''
    ].join('\n')
  );

  if (visibleAfter && !saveErrorAfter) {
    await writeRegistryProofIfVisible({ timestamp, created, visibleAfter });
  }

  expect(decodeURIComponent(page.url()), 'Der Lauf muss in MCP_1_20260210 bleiben.').toMatch(/MCP_1_20260210/i);
});
