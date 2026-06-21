import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { clickBcTopIconAction } from '../../../core/bc/actions';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-170-FA-BALACCOUNT-82000-SETUP-FIT';
const TEST_ID = 'fixedassets-170';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_POSTING_GROUPS_PAGE_ID = 5612;
const TARGET_GROUP = 'MACHINES';
const TARGET_FIELD = 'Acquisition Cost Bal. Acc.';
const TARGET_ACCOUNT = '82000';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(240_000);

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
    url.searchParams.delete(key);
  }
  return url.toString();
}

function faPostingGroupsUrl() {
  const url = new URL(bcPageUrl(FA_POSTING_GROUPS_PAGE_ID, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', `'FA Posting Group'.'Code' IS '${TARGET_GROUP}'`);
  return url.toString();
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function sanitizeEvidenceValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return normalizeText(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeEvidenceValue(entry));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        if (key === 'scopeUrl' && typeof entry === 'string') {
          return [key, safeUrl(entry)];
        }
        return [key, sanitizeEvidenceValue(entry)];
      }),
    );
  }
  return value;
}

function compactEvidenceText(text: string) {
  const interesting = /FA Posting Group|MACHINES|Acquisition Cost|Bal\. Acc|Balancing Account|12210|82000|Account/i;
  const lines = text
    .split('\n')
    .map((line) => normalizeText(line))
    .filter(Boolean)
    .filter((line) => interesting.test(line))
    .filter((line) => !/aadTenantId|startTraceId|storageState|tokenFactory|requestExecutorSettings/i.test(line));
  return [
    'Kompakter, sanitizter Auszug; keine Rohseite, keine Auth-/Shell-Artefakte.',
    '',
    ...[...new Set(lines)].slice(0, 160),
  ].join('\n');
}

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const text = await pageText(page);
  return {
    url: safeUrl(url),
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
}

async function openMachinesPostingGroup(page: Page) {
  await page.goto(faPostingGroupsUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);
}

async function findFaFrame(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1500 }).catch(() => '');
    if (/FA Posting Group|Anlagenbuchungsgruppe/i.test(body)) {
      return frame;
    }
  }
  return undefined;
}

async function readRiskDialog(page: Page) {
  const dialogs = [];
  for (const scope of [page, ...page.frames()]) {
    const count = await scope.getByRole('dialog').count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = normalizeText(await scope.getByRole('dialog').nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (text) dialogs.push(text);
    }
  }
  return dialogs.find((text) => /OK|Yes|Ja|Post|Preview|Delete|New|Edit|L.schen|Buchen|Vorschau/i.test(text)) ?? '';
}

async function readSignals(frame: Frame) {
  return frame.evaluate((targetCaption) => {
    function clean(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7e]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    const bodyText = clean(document.body?.innerText || document.body?.textContent || '');
    const targetValue =
      bodyText.match(new RegExp(`${targetCaption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d{5})\\b`, 'i'))?.[1] ??
      '';
    const labels = [...document.querySelectorAll<HTMLElement>('label,span,div')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: clean(element.innerText || element.textContent),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((label) => /Acquisition Cost|Bal\. Acc|MACHINES|FA Posting Group|Account/i.test(label.text))
      .slice(0, 120);
    const targetLabel = labels.find((label) => /Acquisition Cost Bal\. Acc\./i.test(label.text)) ?? null;
    const inputs = [...document.querySelectorAll<HTMLInputElement>('input')]
      .filter(visible)
      .map((input) => {
        const rect = input.getBoundingClientRect();
        return {
          value: clean(input.value),
          aria: clean(input.getAttribute('aria-label')),
          title: clean(input.getAttribute('title')),
          readOnly: input.readOnly || input.getAttribute('aria-readonly') === 'true',
          disabled: input.disabled || input.getAttribute('aria-disabled') === 'true',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .slice(0, 80);
    const focusedLines = bodyText
      .split(/\s{2,}|\n/)
      .map((line) => clean(line))
      .filter((line) => /FA Posting Group|MACHINES|Acquisition Cost|Bal\. Acc|Balancing Account|12210|82000|Account/i.test(line))
      .slice(0, 140);

    return {
      pageContextVisible: /FA Posting Group|FA Posting Groups|Anlagenbuchungsgruppe/i.test(bodyText),
      machinesVisible: /\bMACHINES\b/i.test(bodyText),
      targetFieldCaptionVisible: /Acquisition Cost Bal\. Acc\./i.test(bodyText),
      targetValue,
      accountSignals: [...new Set(bodyText.match(/\b\d{5}\b/g) ?? [])],
      targetLabel,
      inputs,
      focusedLines,
    };
  }, TARGET_FIELD);
}

async function setBalancingAccountFromVisibleLabel(page: Page, frame: Frame) {
  const editMode = await clickBcTopIconAction(page, {
    title: /Seite vornehmen|make changes|edit/i,
    scopeText: /FA Posting Group Card|FA Posting Group/i,
    yMax: 90,
    expectedAfterClick: /FA Posting Group|MACHINES/i,
  }).catch((error) => ({
    clicked: false,
    reason: `edit-mode-click-failed: ${String(error)}`,
    attempts: [],
    candidates: [],
  }));
  await page.waitForTimeout(1500);
  const sanitizedEditMode = sanitizeEvidenceValue(editMode);
  if (!editMode.clicked) {
    return { attempted: false, reason: 'edit-mode-not-activated', editMode: sanitizedEditMode };
  }

  const label = frame.getByText(/Acquisition Cost Bal\. Acc\./i).first();
  await expect(label).toBeVisible({ timeout: 15_000 });
  await label.scrollIntoViewIfNeeded().catch(() => undefined);
  await page.waitForTimeout(400);
  const box = await label.boundingBox();
  if (!box) {
    return { attempted: false, reason: 'target-label-without-bounding-box' };
  }

  const clickX = box.x + Math.max(330, box.width + 145);
  const clickY = box.y + box.height / 2;
  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(250);
  await page.keyboard.press('Control+A');
  await page.keyboard.type(TARGET_ACCOUNT);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(3500);
  return {
    attempted: true,
    reason: 'edit-mode-and-clicked-visible-target-row-value-region',
    editMode: sanitizedEditMode,
    clickX: Math.round(clickX),
    clickY: Math.round(clickY),
  };
}

function learningMarkdown(result: Record<string, unknown>) {
  return [
    '# FIXEDASSETS-170 Acquisition Cost Bal. Acc. Setup-Fit',
    '',
    'Status: `labor`, `ui-first`, `setup-proof`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${EXPECTED_INSTANCE} |`,
    `| Company | ${EXPECTED_COMPANY} |`,
    '| Datenbasis | CRONUS-USA-Labor |',
    '| Zielobjekt | FA Posting Group `MACHINES` |',
    '| Ziel-Feld | `Acquisition Cost Bal. Acc.` |',
    '| Zielwert | `82000` |',
    `| Ergebnis | ${String(result.resultStatus ?? '')} |`,
    `| Vorherwert | ${String(result.beforeTargetValue ?? '(leer/nicht sichtbar)')} |`,
    `| Nachherwert | ${String(result.afterTargetValue ?? '(leer/nicht sichtbar)')} |`,
    '| Buchung | nein |',
    '| Preview Posting | nein |',
    '| Journalwerte | nein |',
    '',
    '## Was ein Anfaenger daraus lernen soll',
    '',
    '`Acquisition Cost Bal. Acc.` ist kein Anlagenwert und keine Journalzeile. Es ist ein Kontenfindungsfeld in der Anlagenbuchungsgruppe. Wenn Business Central spaeter einen Anlagenzugang buchen soll, braucht das Setup ein Gegenkonto fuer den Zugang. Fehlt der Wert, kann die spaetere Buchung oder Vorschau blockieren, obwohl Anlage und Kreditor korrekt aussehen.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 darf diesen Schritt als RM-DEMO-Labor-Setupvoraussetzung dokumentieren: Erst die Anlagenbuchungsgruppe pruefen, dann einen Anlagenzugang vorbereiten. Der Nachweis ist kein deutscher Kontenplan-Endstand.',
    '',
    '## Naechster Schritt',
    '',
    'FA-171 soll die Evidence lokal pruefen und erst danach entscheiden, ob ein kontrollierter Journal-Preflight mit Wertfeldern freigegeben wird.',
    '',
  ].join('\n');
}

test('FIXEDASSETS-170 MACHINES Acquisition Cost Bal. Acc. auf 82000 UI-first fitten', async ({ page }) => {
  await openMachinesPostingGroup(page);
  const beforeContext = await sandboxContext(page);
  expect(beforeContext.environmentInUrl).toBe(true);
  expect(beforeContext.companyInUrl).toBe(true);
  expect(beforeContext.wrongEnvironmentVisible).toBe(false);

  const beforeFrame = await findFaFrame(page);
  expect(beforeFrame, 'FA Posting Group Frame muss sichtbar sein.').toBeTruthy();
  const beforeSignals = await readSignals(beforeFrame!);
  expect(beforeSignals.pageContextVisible).toBe(true);
  expect(beforeSignals.machinesVisible).toBe(true);
  expect(beforeSignals.targetFieldCaptionVisible).toBe(true);

  await writeJsonEvidence(fixedAssetsEvidencePath('010-before-context.json'), {
    caseId: CASE_ID,
    context: beforeContext,
    signals: beforeSignals,
  });
  await writeTextEvidence(fixedAssetsEvidencePath('010-before-focused-text.txt'), compactEvidenceText(await pageText(page)));
  await screenshot(page, 'fixedassets-170-010-machines-balaccount-before.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: 'labor',
    bookUse: 'setup-before',
    purpose: 'FIXEDASSETS-170 Vorher-Nachweis: MACHINES FA Posting Group mit Feld Acquisition Cost Bal. Acc. vor dem Setup-Fit.',
    expectedPageText: [/FA Posting Group|FA Posting Groups/i, /\bMACHINES\b/i, /Acquisition Cost Bal\. Acc\./i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Vorherbild beweist den Zielkontext; es ist noch keine Anlagenbuchung und kein deutscher Kontenplan-Endstand.',
    ],
  });

  const beforeTargetValue = beforeSignals.targetValue;
  let writeAttempt: Record<string, unknown> = { attempted: false, reason: 'already-fit' };
  if (beforeTargetValue !== TARGET_ACCOUNT) {
    writeAttempt = await setBalancingAccountFromVisibleLabel(page, beforeFrame!);
    const riskDialog = await readRiskDialog(page);
    if (riskDialog) {
      const blocked = {
        schemaVersion: 1,
        caseId: CASE_ID,
        source: 'playwright-ui-first-setup-fit',
        resultStatus: 'blocked',
        proved: [
          'Business Central wurde in MCP_1_20260210 geoeffnet.',
          'Company RM-DEMO wurde ueber URL-Kontext bestaetigt.',
          'FA Posting Group MACHINES und Feld Acquisition Cost Bal. Acc. wurden vor der Aktion sichtbar gefunden.',
        ],
        notProved: ['Acquisition Cost Bal. Acc. = 82000 wurde nicht bestaetigt, weil ein riskanter Dialog sichtbar wurde.'],
        warnings: [riskDialog],
        blockedBy: ['risk-dialog-visible-after-field-entry'],
        requiresReview: true,
        safeToFinalizeState: false,
        changedFiles: [
          'playwright/projects/fibu-book5/evidence/fixedassets-170/FIXEDASSETS-170-result.json',
          'playwright/projects/fibu-book5/evidence/fixedassets-170/010-before-context.json',
        ],
        evidenceRefs: [
          'playwright/projects/fibu-book5/evidence/fixedassets-170/010-before-context.json',
          'playwright/projects/fibu-book5/img/fixedassets-170-010-machines-balaccount-before.png',
        ],
        flags: {
          noJournalValue: true,
          noPreview: true,
          noPost: true,
          noDraft: true,
          noCompanySwitch: true,
          noApiShortcut: true,
          noBookChange: true,
        },
      };
      await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-170-result.json'), blocked);
      throw new Error(`Riskanter Dialog nach Feldaktion sichtbar: ${riskDialog}`);
    }
  }

  await openMachinesPostingGroup(page);
  const afterContext = await sandboxContext(page);
  expect(afterContext.environmentInUrl).toBe(true);
  expect(afterContext.companyInUrl).toBe(true);
  expect(afterContext.wrongEnvironmentVisible).toBe(false);
  const afterFrame = await findFaFrame(page);
  expect(afterFrame, 'FA Posting Group Frame muss nach Reopen sichtbar sein.').toBeTruthy();
  const afterSignals = await readSignals(afterFrame!);
  const afterTargetValue = afterSignals.targetValue;
  const resultStatus =
    afterTargetValue === TARGET_ACCOUNT
      ? beforeTargetValue === TARGET_ACCOUNT
        ? 'already-fit'
        : 'setup-fit-applied'
      : 'blocked';

  await writeJsonEvidence(fixedAssetsEvidencePath('020-after-context.json'), {
    caseId: CASE_ID,
    context: afterContext,
    signals: afterSignals,
    writeAttempt,
  });
  await writeTextEvidence(fixedAssetsEvidencePath('020-after-focused-text.txt'), compactEvidenceText(await pageText(page)));
  await screenshot(page, 'fixedassets-170-020-machines-balaccount-after.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: afterTargetValue === TARGET_ACCOUNT ? 'labor' : 'rejected',
    bookUse: afterTargetValue === TARGET_ACCOUNT ? 'setup-after' : 'do-not-use',
    purpose: 'FIXEDASSETS-170 Nachher-Nachweis: MACHINES / Acquisition Cost Bal. Acc. muss 82000 zeigen.',
    expectedPageText: [/FA Posting Group|FA Posting Groups/i, /\bMACHINES\b/i, /Acquisition Cost Bal\. Acc\./i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Nur Setup-Fit; keine Journalwerte, kein Preview Posting, keine Buchung und kein deutscher Kontenplan-Endstand.',
    ],
  });

  const success = afterTargetValue === TARGET_ACCOUNT;
  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-ui-first-setup-fit',
    resultStatus,
    environment: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    target: {
      page: 'FA Posting Group Card',
      postingGroup: TARGET_GROUP,
      field: TARGET_FIELD,
      value: TARGET_ACCOUNT,
    },
    beforeTargetValue,
    afterTargetValue,
    setupChanged: success && beforeTargetValue !== TARGET_ACCOUNT,
    writeAttempt,
    proved: success
      ? [
          'Business Central wurde in MCP_1_20260210 geoeffnet.',
          'Company RM-DEMO wurde ueber URL-Kontext bestaetigt.',
          'FA Posting Group MACHINES wurde sichtbar geoeffnet.',
          'Das Feld Acquisition Cost Bal. Acc. wurde im sichtbaren BC-Kontext gefunden.',
          `Nach dem UI-first Setup-Fit zeigt MACHINES / Acquisition Cost Bal. Acc. den Wert ${TARGET_ACCOUNT}.`,
          'Es wurden keine Journalwerte eingegeben, kein Preview Posting geoeffnet und keine Buchung ausgefuehrt.',
        ]
      : [
          'Business Central wurde in MCP_1_20260210 geoeffnet.',
          'Company RM-DEMO wurde ueber URL-Kontext bestaetigt.',
          'FA Posting Group MACHINES und Feld Acquisition Cost Bal. Acc. wurden sichtbar gefunden.',
        ],
    notProved: success
      ? [
          'Kein Anlagenzugang.',
          'Keine Preview-Posting-Wirkung.',
          'Keine Sachposten oder Anlagenposten.',
          'Kein deutscher Kontenplan-Endstand.',
          'Keine deutsche steuerliche Finalaussage.',
        ]
      : [
          'Acquisition Cost Bal. Acc. = 82000 wurde nach Reopen nicht sichtbar nachgewiesen.',
          'Journal- und Posting-Readiness bleiben gesperrt.',
        ],
    warnings: success ? [] : ['target-value-not-visible-after-reopen'],
    blockedBy: success ? [] : ['target-value-not-visible-after-reopen'],
    requiresReview: !success,
    safeToFinalizeState: success,
    statePatch: success
      ? {
          current: {
            activeCase: 'FIXEDASSETS-171-FA-BALACCOUNT-SETUP-FIT-REVIEW',
            active_case_file: '.agent/state/cases/fixedassets-171-fa-balaccount-setup-fit-review.json',
          },
          lastRunSummary: {
            runId: CASE_ID,
            resultStatus,
            bcRun: true,
            company: EXPECTED_COMPANY,
            setupChanged: success && beforeTargetValue !== TARGET_ACCOUNT,
            posted: false,
            previewPosting: false,
            summary: 'FA-170 pruefte MACHINES / Acquisition Cost Bal. Acc. UI-first und wies den Laborwert 82000 nach.',
          },
          activeCase: {
            status: 'completed',
            lastResult: resultStatus,
            lastEvidence: 'playwright/projects/fibu-book5/evidence/fixedassets-170/FIXEDASSETS-170-result.json',
          },
        }
      : {},
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/fixedassets-170/FIXEDASSETS-170-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-170/FIXEDASSETS-170-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-170/010-before-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-170/020-after-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-170/010-before-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-170/020-after-focused-text.txt',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-170/FIXEDASSETS-170-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-170/FIXEDASSETS-170-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-170/010-before-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-170/020-after-context.json',
      'playwright/projects/fibu-book5/img/fixedassets-170-010-machines-balaccount-before.png',
      'playwright/projects/fibu-book5/img/fixedassets-170-020-machines-balaccount-after.png',
    ],
    flags: {
      noJournalValue: true,
      noPreview: true,
      noPost: true,
      noDraft: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-170-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-170-learning.md'), learningMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-170 Evidence',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-before-context.json` | JSON | Instanz, Company, MACHINES-Kontext und Vorher-Signale | keine Buchung | labor |',
      '| `010-before-focused-text.txt` | Text | kompakter sichtbarer Seitenkontext vor dem Fit | keine Rohseite | labor |',
      '| `020-after-context.json` | JSON | Nachher-Signale mit Zielwert, falls sichtbar | keine Postenspur | labor |',
      '| `020-after-focused-text.txt` | Text | kompakter sichtbarer Seitenkontext nach Reopen | keine Rohseite | labor |',
      '| `FIXEDASSETS-170-result.json` | Result | Ergebnis, Flags und Grenzen | keinen DE-Finalnachweis | labor |',
      '| `FIXEDASSETS-170-learning.md` | Lernnotiz | Bedeutung des Balancing-Account-Setup-Felds | keine Buchung | book-candidate |',
      '| `fixedassets-170-010-machines-balaccount-before.png` | Screenshot | sichtbarer Vorher-Kontext | keine Nachher-Wirkung | setup-before |',
      '| `fixedassets-170-020-machines-balaccount-after.png` | Screenshot | sichtbarer Nachher-Kontext | keine Postenspur | setup-after |',
      '',
    ].join('\n'),
  );

  expect(afterTargetValue).toBe(TARGET_ACCOUNT);
});
