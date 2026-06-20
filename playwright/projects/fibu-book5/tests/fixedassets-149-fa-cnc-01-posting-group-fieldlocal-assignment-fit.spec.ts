import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-149-FA-CNC-01-POSTING-GROUP-FIELDLOCAL-ASSIGNMENT-FIT';
const NEXT_CASE_ID = 'FIXEDASSETS-150-FA-CNC-01-POSTING-GROUP-FIELDLOCAL-ASSIGNMENT-REVIEW';
const TEST_ID = 'fixedassets-149';
const INSTANCE = 'MCP_1_20260210';
const COMPANY = project.defaultCompany;
const ASSET_NO = 'FA-CNC-01';
const FROM_POSTING_GROUP = 'EQUIPMENT';
const TO_POSTING_GROUP = 'MACHINES';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(420_000);

type AssignmentStatus =
  | 'changed-labor-posting-group-fit'
  | 'already-fit-labor-posting-group'
  | 'blocked-safety-gate'
  | 'blocked-fieldlocal-button-not-found'
  | 'blocked-fieldlocal-selection-not-confirmed'
  | 'blocked-wrong-related-card-route';

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function fixedAssetCardUrl() {
  const url = new URL(bcPageUrl(5600, project.envPrefix));
  url.searchParams.set('company', COMPANY);
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${ASSET_NO}'`);
  return url.toString();
}

function clean(value: string | null | undefined) {
  return (value || '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const parsed = new URL(url);
  const text = await pageText(page);
  const result = {
    url,
    instanceInUrl: decoded.includes(INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === COMPANY,
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(INSTANCE),
  };

  if (!result.instanceInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context for ${CASE_ID}: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function openAssetCard(page: Page) {
  await page.goto(fixedAssetCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset Card|Fixed Asset|Depreciation Book|Book Value/i, { timeout: 90_000 });
  await waitForPageText(page, /\bFA-CNC-01\b/i, { timeout: 60_000 });
  await page.waitForTimeout(1000);
  return assertSandboxContext(page);
}

async function findCardFrame(page: Page) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/\bFA-CNC-01\b/i.test(text) && /Fixed Asset Card|Fixed Asset|Posting Group|Book Value/i.test(text)) {
      return frame;
    }
  }
  return page.mainFrame();
}

async function expandDepreciationBookFields(page: Page) {
  const frame = await findCardFrame(page);
  const buttons = frame.getByRole('button', {
    name: /Depreciation Book, (Mehr anzeigen|Show more)|Depreciation Book.*Show more fields/i,
  });
  const count = await buttons.count().catch(() => 0);
  const attempts: Array<Record<string, unknown>> = [];

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    const label = clean(
      [
        await button.innerText({ timeout: 500 }).catch(() => ''),
        (await button.getAttribute('aria-label').catch(() => '')) ?? '',
        (await button.getAttribute('title').catch(() => '')) ?? '',
      ].join(' | '),
    );
    if (/\b(Acquire|Edit|Post|Preview|New|Delete|Copy|OK|Yes|Ja|Invoice|Ship)\b/i.test(label)) {
      attempts.push({ index, label, clicked: false, skippedReason: 'dangerous-label' });
      continue;
    }
    const box = await button.boundingBox().catch(() => null);
    if (!box) {
      attempts.push({ index, label, clicked: false, skippedReason: 'not-visible' });
      continue;
    }
    await button.click({ timeout: 3000 });
    await page.waitForTimeout(900);
    attempts.push({ index, label, clicked: true });
    break;
  }

  return { candidateCount: count, attempts, clicked: attempts.some((attempt) => attempt.clicked) };
}

async function postingGroupState(page: Page) {
  const frame = await findCardFrame(page);
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const rectOf = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
    };
    const labels = Array.from(document.querySelectorAll<HTMLElement>('label,span,div,a'))
      .filter(visible)
      .map((element) => ({
        element,
        text: normalize(element.innerText || element.textContent),
        ariaLabel: normalize(element.getAttribute('aria-label')),
        title: normalize(element.getAttribute('title')),
        rect: rectOf(element),
      }))
      .filter((entry) => entry.text === 'Posting Group')
      .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
    const label = labels[0];
    if (!label) return { found: false, value: '', reason: 'posting-group-label-not-found' };

    const rowCenterY = label.rect.y + label.rect.height / 2;
    const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement>(
      'input,textarea,select,[role="combobox"],[contenteditable="true"]',
    ))
      .filter(visible)
      .map((element) => ({
        element,
        tagName: element.tagName.toUpperCase(),
        role: normalize(element.getAttribute('role')),
        ariaLabel: normalize(element.getAttribute('aria-label')),
        title: normalize(element.getAttribute('title')),
        value: normalize((element as HTMLInputElement).value || element.textContent),
        disabled: 'disabled' in element ? Boolean((element as HTMLInputElement).disabled) : false,
        readOnly: 'readOnly' in element ? Boolean((element as HTMLInputElement).readOnly) : false,
        rect: rectOf(element),
      }))
      .filter((entry) => Math.abs(entry.rect.y + entry.rect.height / 2 - rowCenterY) <= 24 && entry.rect.x > label.rect.x - 20)
      .sort((left, right) => left.rect.x - right.rect.x);

    const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-label],[title]'))
      .filter(visible)
      .map((element) => ({
        element,
        tagName: element.tagName.toUpperCase(),
        role: normalize(element.getAttribute('role')),
        ariaLabel: normalize(element.getAttribute('aria-label')),
        title: normalize(element.getAttribute('title')),
        text: normalize(element.innerText || element.textContent),
        rect: rectOf(element),
      }))
      .filter((entry) => Math.abs(entry.rect.y + entry.rect.height / 2 - rowCenterY) <= 28 && entry.rect.x >= label.rect.x)
      .sort((left, right) => left.rect.x - right.rect.x);

    const value = controls[0]?.value ?? '';
    const safeButtons = buttons.slice(0, 8).map(({ element: _element, ...entry }) => entry);
    return {
      found: true,
      value,
      label: { text: label.text, rect: label.rect },
      controls: controls.slice(0, 6).map(({ element: _element, ...entry }) => ({
        ...entry,
        editable: !entry.disabled && !entry.readOnly,
      })),
      buttons: safeButtons,
      fieldLocalSelectButton: safeButtons.find((button) => /Posting Group/i.test(`${button.ariaLabel} ${button.title}`) && /W.hlen|Select|value/i.test(`${button.ariaLabel} ${button.title}`)),
    };
  });
}

async function foregroundStatus(page: Page, phase: string) {
  const text = await compactPageText(page, {
    include: [/Fixed Asset Card|Depreciation Book Card|FA-CNC-01|HGB depreciation book|Posting Group|MACHINES|EQUIPMENT|Book Value|Acquire|Preview|Post/i],
    maxLines: 120,
  }).catch(() => '');
  const fullText = text || (await pageText(page).catch(() => ''));
  const result = {
    phase,
    hasFixedAssetCard: /Fixed Asset Card/i.test(fullText),
    hasAssetNo: /\bFA-CNC-01\b/i.test(fullText),
    hasWrongRelatedDepreciationBookCard: /Depreciation Book Card|HGB depreciation book/i.test(fullText),
    hasPostingGroupText: /Posting Group/i.test(fullText),
    compactText: fullText,
  };
  return {
    ...result,
    ok: result.hasFixedAssetCard && result.hasAssetNo && result.hasPostingGroupText && !result.hasWrongRelatedDepreciationBookCard,
  };
}

async function dangerousDialogState(page: Page) {
  const text = await pageText(page);
  return {
    hasPostingDialog: /Ship and Invoice|Receive and Invoice|Preview Posting|Post and Print|Buchen und drucken/i.test(text),
    hasDangerousConfirm: /\bOK\b|\bYes\b|\bJa\b|Are you sure|Moechten Sie|M.chten Sie/i.test(text),
    acquireActionVisible: /\bAcquire\b|Anschaffen|Erwerben/i.test(text),
  };
}

async function clickFieldLocalPostingGroupButton(page: Page) {
  const frame = await findCardFrame(page);
  const target = await frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const rectOf = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
    };
    const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-label],[title]'))
      .filter(visible)
      .map((element, index) => {
        const text = normalize(element.innerText || element.textContent);
        const ariaLabel = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const label = `${text} ${ariaLabel} ${title}`;
        return { element, index, text, ariaLabel, title, label, rect: rectOf(element) };
      })
      .filter((entry) => /Posting Group/i.test(entry.label))
      .filter((entry) => /W.hlen|Select|value/i.test(entry.label))
      .filter((entry) => !/\b(Acquire|Post|Preview|Invoice|Ship|Delete|OK|Yes|Ja|New|Copy)\b/i.test(entry.label))
      .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);

    const chosen = buttons[0];
    const serializable = buttons.slice(0, 8).map(({ element: _element, ...entry }) => entry);
    if (!chosen) return { clicked: false, reason: 'field-local-posting-group-button-not-found', candidates: serializable };
    chosen.element.click();
    const { element: _element, ...chosenInfo } = chosen;
    return { clicked: true, chosen: chosenInfo, candidates: serializable };
  });
  await page.waitForTimeout(1500);
  return target;
}

async function selectVisibleMachines(page: Page) {
  const attempts: Array<Record<string, unknown>> = [];
  for (const scope of [page, ...page.frames()]) {
    const locators = [
      scope.getByRole('option', { name: /^MACHINES\b/i }),
      scope.getByRole('row', { name: /^MACHINES\b/i }),
      scope.getByText(/^MACHINES\b/i),
    ];
    for (const locator of locators) {
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);
        const text = clean(await candidate.innerText({ timeout: 500 }).catch(() => ''));
        if (/\b(New|Neu|Edit|Delete|Post|Preview|Acquire|OK|Yes|Ja|Finish|Fertig stellen)\b/i.test(text)) {
          attempts.push({ text, clicked: false, skippedReason: 'dangerous-candidate' });
          continue;
        }
        const visible = await candidate.isVisible({ timeout: 500 }).catch(() => false);
        if (!visible) {
          attempts.push({ text, clicked: false, skippedReason: 'not-visible' });
          continue;
        }
        const clicked = await candidate.click({ timeout: 4000 }).then(() => true).catch((error) => {
          attempts.push({ text, clicked: false, error: String(error) });
          return false;
        });
        if (clicked) {
          await page.waitForTimeout(1800);
          attempts.push({ text, clicked: true });
          return { selected: true, attempts };
        }
      }
    }
  }
  return { selected: false, attempts };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-149 - FA-CNC-01 Posting Group field-local assignment fit',
    '',
    `Status: \`${result.resultStatus}\`, \`ui-first\`, \`setup-fit\`, \`no-acquire\`, \`no-preview\`, \`no-posting\`, \`not-final\`.`,
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.assetNo} |`,
    `| Vorher Posting Group | ${result.before?.postingGroup || '(nicht ermittelt)'} |`,
    `| Nachher Posting Group | ${result.after?.postingGroup || '(nicht ermittelt)'} |`,
    `| Datenaenderung | ${result.changedPostingGroup ? 'ja' : 'nein'} |`,
    '| Acquire / Preview / Posting | nein |',
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    '- Die Anlagenbuchungsgruppe auf der Anlagenkarte ist Stammdaten-/Setup-Kontext, keine Anschaffung.',
    '- Ein Feld mit Linktext kann zu einer verwandten Karte fuehren; fuer eine Wertauswahl braucht man den feldlokalen Auswahlknopf.',
    '- `MACHINES` gilt erst, wenn der Wert nach Neuoeffnen der Karte sichtbar ist.',
    '- Ein Screenshot ist nur belastbar, wenn er den Zielwert wirklich sichtbar zeigt.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.',
    '- Keine Anschaffung, keine Preview Posting, keine Buchung.',
    '- Kein Kreditor, keine Einkaufsrechnung, keine FA Ledger Entries in diesem Lauf.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

async function writeResult(page: Page, partial: Record<string, any>) {
  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-posting-group-fieldlocal-assignment-fit-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-ui-fieldlocal-setup-fit',
    resultStatus: partial.resultStatus as AssignmentStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: INSTANCE,
    company: COMPANY,
    assetNo: ASSET_NO,
    changedPostingGroup: Boolean(partial.changedPostingGroup),
    proved: partial.proved ?? [],
    notProved: [
      'No acquisition was executed.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No purchase invoice, journal line, amount, vendor or draft was created.',
      'No German fixed-assets final proof is produced.',
      ...(partial.notProved ?? []),
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-149-fa-cnc-01-posting-group-fieldlocal-assignment-fit.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-149/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-149/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-149/FIXEDASSETS-149-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-149/FIXEDASSETS-149-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-149/010-before-state.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-149/020-fieldlocal-click-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-149/030-selection-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-149/040-after-state.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-149/fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.screenshot.json',
      'playwright/projects/fibu-book5/img/fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.png',
    ],
    warnings: partial.warnings ?? [],
    blockedBy: partial.blockedBy ?? [],
    requiresReview: true,
    safeToFinalizeState: true,
    flags: {
      noBookChange: true,
      noPost: true,
      noPreview: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noDeleteRecord: true,
      noAcquireExecution: true,
      noAmountEntry: true,
      noTargetVendorEntry: true,
      setupChangeOnlyFaPostingGroup: Boolean(partial.changedPostingGroup),
      noSetupChange: !partial.changedPostingGroup,
    },
    statePatch: {
      current: {
        updatedAt: '2026-06-21T02:05:00.000Z',
        activeCase: NEXT_CASE_ID,
        active_case_file: '.agent/state/cases/fixedassets-150-fa-cnc-01-posting-group-fieldlocal-assignment-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-149-fa-cnc-01-posting-group-fieldlocal-assignment-fit.json',
        requiresStrongModel: true,
        nextStep: 'FIXEDASSETS-150: review FA-149 field-local assignment evidence before any acquisition route is unlocked.',
      },
      activeCase: {
        status: partial.resultStatus,
        lastResult: {
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-149/FIXEDASSETS-149-result.json',
          summary: partial.summary,
        },
        nextSafeAction: 'FIXEDASSETS-150: local review of field-local assignment evidence.',
      },
    },
    ...partial,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-149-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-149-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-149 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-149-result.json` | JSON | Ergebnis, Safety, Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-149-learning.md` | Markdown | Lernwert und Buchwirkung | keine Anschaffung/Buchung | `labor` |',
      '| `010-before-state.json` | JSON | Kartenwert vor Feldaktion | keine Posten | `field-proof` |',
      '| `020-fieldlocal-click-result.json` | JSON | Feldlokaler Posting-Group-Klick | keine Auswahlgarantie | `technical-context` |',
      '| `030-selection-result.json` | JSON | MACHINES-Auswahlversuch | keine Buchungswirkung | `setup-fit` |',
      '| `040-after-state.json` | JSON | Kartenwert nach Neuoeffnen | keine FA Ledger Entries | `field-proof` |',
      '| `../../img/fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.png` | Screenshot | Kartenkontrollpunkt oder Blockerbild | nicht alleinige Wahrheit | `candidate/labor/rejected` |',
      '',
      `Aktuelle Wahrheit: ${result.summary}`,
      '',
    ].join('\n'),
  );

  return result;
}

test('FIXEDASSETS-149 assigns FA-CNC-01 Posting Group through the field-local selector only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const context = await openAssetCard(page);
  await expandDepreciationBookFields(page);
  const before = await postingGroupState(page);
  await writeJsonEvidence(faEvidencePath('010-before-state.json'), { context, before });

  const beforeValue = clean(before.value).toUpperCase();
  if (beforeValue !== FROM_POSTING_GROUP && beforeValue !== TO_POSTING_GROUP) {
    await screenshot(page, 'fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: 'rejected',
      bookUse: 'field-proof',
      purpose: 'FA-149 Safety-Blocker: Posting Group vor dem Fit ist weder EQUIPMENT noch MACHINES.',
      expectedPageText: [/\bFA-CNC-01\b/i, /Posting Group/i],
      knownLimitations: ['Keine Aenderung, keine Anschaffung, keine Preview, keine Buchung.'],
    });
    await writeResult(page, {
      resultStatus: 'blocked-safety-gate' satisfies AssignmentStatus,
      observed: { startedAt, finishedAt: new Date().toISOString(), context, before },
      before: { postingGroup: before.value, raw: before },
      blockedBy: [`Unexpected Posting Group before fit: ${before.value || '(blank)'}`],
      summary: `FA-149 blocked before change: Posting Group is ${before.value || '(blank)'}, expected EQUIPMENT or MACHINES.`,
      bookImpact: 'Kapitel 21 darf den MACHINES-Kartenfit nicht behaupten.',
      nextStep: 'FIXEDASSETS-150: review the unexpected Posting Group blocker.',
    });
    return;
  }

  if (beforeValue === TO_POSTING_GROUP) {
    await screenshot(page, 'fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: 'candidate',
      bookUse: 'field-proof',
      purpose: 'FA-149: FA-CNC-01 zeigt bereits MACHINES als Posting Group; kein Edit erforderlich.',
      expectedPageText: [/\bFA-CNC-01\b/i, /\bMACHINES\b/i],
      knownLimitations: ['Kein Anlagenzugang, keine Preview, keine Buchung.'],
    });
    await writeJsonEvidence(faEvidencePath('020-fieldlocal-click-result.json'), { skipped: true, reason: 'already-fit' });
    await writeJsonEvidence(faEvidencePath('030-selection-result.json'), { skipped: true, reason: 'already-fit' });
    await writeJsonEvidence(faEvidencePath('040-after-state.json'), before);
    await writeResult(page, {
      resultStatus: 'already-fit-labor-posting-group' satisfies AssignmentStatus,
      observed: { startedAt, finishedAt: new Date().toISOString(), context, before },
      before: { postingGroup: before.value, raw: before },
      after: { postingGroup: before.value, raw: before },
      changedPostingGroup: false,
      proved: ['FA-CNC-01 is visible in MCP_1_20260210 / RM-DEMO.', 'Posting Group MACHINES is visible on the Fixed Asset Card.', 'No acquisition, Preview Posting, posting, draft creation, company switch or API shortcut was performed.'],
      summary: 'FA-CNC-01 already shows MACHINES as Posting Group; no UI setup change was needed.',
      bookImpact: 'Kapitel 21 kann MACHINES als aktuellen CRONUS-USA-Labor-Kartenwert dokumentieren, aber weiter keine Anschaffung oder Buchung behaupten.',
      nextStep: 'FIXEDASSETS-150: review field-local assignment evidence before acquisition route.',
    });
    return;
  }

  const clickResult = await clickFieldLocalPostingGroupButton(page);
  await writeJsonEvidence(faEvidencePath('020-fieldlocal-click-result.json'), clickResult);
  if (!clickResult.clicked) {
    await screenshot(page, 'fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: 'rejected',
      bookUse: 'field-proof',
      purpose: 'FA-149 Blockerbild: feldlokaler Posting-Group-Auswahlknopf wurde nicht sicher gefunden.',
      expectedPageText: [/\bFA-CNC-01\b/i, /\bEQUIPMENT\b/i],
      knownLimitations: ['Keine Aenderung, keine Anschaffung, keine Preview, keine Buchung.'],
    });
    await writeJsonEvidence(faEvidencePath('030-selection-result.json'), { skipped: true, reason: 'field-local-button-not-found' });
    await writeJsonEvidence(faEvidencePath('040-after-state.json'), before);
    await writeResult(page, {
      resultStatus: 'blocked-fieldlocal-button-not-found' satisfies AssignmentStatus,
      observed: { startedAt, finishedAt: new Date().toISOString(), context, before, clickResult },
      before: { postingGroup: before.value, raw: before },
      blockedBy: ['Field-local Posting Group select-value button was not found safely.'],
      summary: 'FA-149 blocked: no safe field-local Posting Group select-value button was found.',
      bookImpact: 'Kapitel 21 muss den Kartenfit weiter offen halten; der richtige UI-Hebel fehlt noch als robuster Pfad.',
      nextStep: 'FIXEDASSETS-150: review the missing field-local button evidence.',
    });
    return;
  }

  const foregroundAfterClick = await foregroundStatus(page, 'after-fieldlocal-button-click');
  if (foregroundAfterClick.hasWrongRelatedDepreciationBookCard) {
    await writeJsonEvidence(faEvidencePath('030-selection-result.json'), { skipped: true, foregroundAfterClick });
    await screenshot(page, 'fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: 'rejected',
      bookUse: 'field-proof',
      purpose: 'FA-149 Related-Card-Blocker: Der Feldpfad hat eine verwandte AfA-Buch-Karte statt der Posting-Group-Werteliste geoeffnet.',
      expectedPageText: [/Depreciation Book Card|Fixed Asset Card|FA-CNC-01/i],
      knownLimitations: ['Kein MACHINES-Fit, keine Anschaffung, keine Preview, keine Buchung.'],
    });
    await openAssetCard(page);
    await expandDepreciationBookFields(page);
    const after = await postingGroupState(page);
    await writeJsonEvidence(faEvidencePath('040-after-state.json'), after);
    await writeResult(page, {
      resultStatus: 'blocked-wrong-related-card-route' satisfies AssignmentStatus,
      observed: { startedAt, finishedAt: new Date().toISOString(), context, before, clickResult, foregroundAfterClick, after },
      before: { postingGroup: before.value, raw: before },
      after: { postingGroup: after.value, raw: after },
      blockedBy: ['Field-local route opened a related Depreciation Book Card instead of the Posting Group value list.'],
      summary: 'FA-149 blocked: the field-local route lost the Fixed Asset Card context and opened a related card.',
      bookImpact: 'Kapitel 21 darf den MACHINES-Kartenfit nicht behaupten; die Fehlerfalle ist ein guter Debugging-Lernfall.',
      nextStep: 'FIXEDASSETS-150: review wrong-related-card blocker before another assignment route.',
    });
    return;
  }

  const selection = await selectVisibleMachines(page);
  await writeJsonEvidence(faEvidencePath('030-selection-result.json'), { selection, foregroundAfterClick, dangerousDialog: await dangerousDialogState(page) });
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1500);

  const dangerAfterSelection = await dangerousDialogState(page);
  if (dangerAfterSelection.hasPostingDialog || dangerAfterSelection.hasDangerousConfirm) {
    await screenshot(page, 'fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: 'rejected',
      bookUse: 'error',
      purpose: 'FA-149 Safety-Blocker: Nach dem Auswahlversuch erschien ein riskanter Dialog.',
      expectedPageText: [/\bFA-CNC-01\b|Posting Group|MACHINES|EQUIPMENT/i],
      knownLimitations: ['Keine Dialogbestaetigung, keine Anschaffung, keine Preview, keine Buchung.'],
    });
    await openAssetCard(page);
    await expandDepreciationBookFields(page);
    const after = await postingGroupState(page);
    await writeJsonEvidence(faEvidencePath('040-after-state.json'), after);
    await writeResult(page, {
      resultStatus: 'blocked-safety-gate' satisfies AssignmentStatus,
      observed: { startedAt, finishedAt: new Date().toISOString(), context, before, clickResult, selection, dangerAfterSelection, after },
      before: { postingGroup: before.value, raw: before },
      after: { postingGroup: after.value, raw: after },
      blockedBy: ['Risky posting or confirmation dialog appeared after selection attempt.'],
      summary: 'FA-149 blocked: a risky posting or confirmation dialog appeared after the Posting Group selection attempt.',
      bookImpact: 'Keine Buchwirkung; Dialogursache muss vor einem weiteren Setup-Fit geklaert werden.',
      nextStep: 'FIXEDASSETS-150: review risky dialog blocker.',
    });
    return;
  }

  await openAssetCard(page);
  await expandDepreciationBookFields(page);
  const after = await postingGroupState(page);
  await writeJsonEvidence(faEvidencePath('040-after-state.json'), after);
  await writeTextEvidence(
    faEvidencePath('041-after-card-text.txt'),
    await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine|Posting Group|EQUIPMENT|MACHINES|Book Value|Acquired|HGB|Depreciation/i],
      maxLines: 160,
    }),
  );

  const changedPostingGroup = clean(after.value).toUpperCase() === TO_POSTING_GROUP;
  await screenshot(page, 'fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: changedPostingGroup ? 'candidate' : 'rejected',
    bookUse: 'field-proof',
    purpose: changedPostingGroup
      ? 'FA-149: FA-CNC-01 zeigt nach Neuoeffnen MACHINES als Posting Group; kontrollierter feldlokaler UI-first Setup-Fit ohne Anschaffung/Buchung.'
      : 'FA-149: Kartenbild nach feldlokalem Auswahlversuch; MACHINES ist nicht final als Posting Group nachgewiesen.',
    expectedPageText: changedPostingGroup ? [/\bFA-CNC-01\b/i, /\bMACHINES\b/i] : [/\bFA-CNC-01\b/i],
    knownLimitations: ['Kein Anlagenzugang, keine Preview, keine Buchung.', 'Screenshot ist nur mit JSON/Text-Evidence belastbar.'],
  });

  await writeResult(page, {
    resultStatus: changedPostingGroup ? ('changed-labor-posting-group-fit' satisfies AssignmentStatus) : ('blocked-fieldlocal-selection-not-confirmed' satisfies AssignmentStatus),
    observed: { startedAt, finishedAt: new Date().toISOString(), context, before, clickResult, foregroundAfterClick, selection, dangerAfterSelection, after },
    before: { postingGroup: before.value, raw: before },
    after: { postingGroup: after.value, raw: after },
    changedPostingGroup,
    proved: changedPostingGroup
      ? [
          'FA-CNC-01 was opened in MCP_1_20260210 / RM-DEMO.',
          'Before the field-local action, Posting Group EQUIPMENT was visible.',
          'The field-local Posting Group select-value button was clicked.',
          'After UI-first selection and reopen, Posting Group MACHINES was visible on the Fixed Asset Card.',
          'No Acquire, Preview Posting, posting, draft creation, company switch or API shortcut was performed.',
        ]
      : [
          'FA-CNC-01 was opened in MCP_1_20260210 / RM-DEMO.',
          'The field-local Posting Group select-value button was clicked.',
          'The assignment fit did not finish with MACHINES visible after reopen.',
        ],
    blockedBy: changedPostingGroup ? [] : [`After reopen, Posting Group is ${after.value || '(blank)'}, expected MACHINES.`],
    warnings: changedPostingGroup ? ['This is a CRONUS-USA laboratory setup fit, not a German fixed-assets final proof.'] : [],
    summary: changedPostingGroup
      ? 'FA-149 changed FA-CNC-01 Posting Group from EQUIPMENT to MACHINES through the field-local UI selector and confirmed the value after reopening the card.'
      : `FA-149 did not confirm MACHINES after reopen. Visible value: ${after.value || '(blank)'}.`,
    bookImpact: changedPostingGroup
      ? 'Kapitel 21 darf den CRONUS-USA-Labor-Kartenfit `FA-CNC-01 -> MACHINES` als Stammdaten-/Setup-Voraussetzung dokumentieren. Weiterhin keine Anschaffung, keine AfA, keine Postenspur und kein deutscher Finalnachweis.'
      : 'Kapitel 21 darf den Posting-Group-Kartenfit nicht behaupten; der Feld-Fit bleibt Blocker.',
    nextStep: 'FIXEDASSETS-150: review FA-149 field-local assignment evidence before unlocking any acquisition route.',
  });

  expect(dangerAfterSelection.hasPostingDialog).toBe(false);
  expect(dangerAfterSelection.hasDangerousConfirm).toBe(false);
});
