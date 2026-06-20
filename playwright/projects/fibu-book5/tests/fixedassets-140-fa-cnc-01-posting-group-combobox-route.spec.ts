import { test, type Frame, type Page } from '@playwright/test';
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
import { clickBcTopIconAction } from '../../../core/bc/actions';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-140-FA-CNC-01-POSTING-GROUP-COMBOBOX-ROUTE';
const TEST_ID = 'fixedassets-140';
const NEXT_CASE_ID = 'FIXEDASSETS-141-FA-CNC-01-COMBOBOX-RESULT-REVIEW';
const INSTANCE = 'MCP_1_20260210';
const COMPANY = project.defaultCompany;
const ASSET_NO = 'FA-CNC-01';
const FROM_POSTING_GROUP = 'EQUIPMENT';
const TO_POSTING_GROUP = 'MACHINES';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(360_000);

type CardRow = {
  caption: string;
  selectedValue: string;
  diagnosis: string;
  editable: boolean;
};

type RunStatus =
  | 'changed-labor-posting-group-fit'
  | 'already-fit-labor-posting-group'
  | 'blocked-safety-gate';

const captions = ['No.', 'Description', 'FA Class Code', 'FA Subclass Code', 'Depreciation Book Code', 'Posting Group', 'Book Value', 'Acquired'];

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function fixedAssetCardUrl() {
  const url = new URL(bcPageUrl(5600, project.envPrefix));
  url.searchParams.set('company', COMPANY);
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${ASSET_NO}'`);
  return url.toString();
}

function faLedgerEntriesUrl() {
  const url = new URL(bcPageUrl(5604, project.envPrefix));
  url.searchParams.set('company', COMPANY);
  url.searchParams.set('filter', `'FA Ledger Entry'.'FA No.' IS '${ASSET_NO}'`);
  return url.toString();
}

function normalize(value: string | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function valueOf(rows: CardRow[], caption: string) {
  return rows.find((row) => row.caption === caption)?.selectedValue ?? '';
}

async function assertContext(page: Page) {
  const decodedUrl = decodeURIComponent(page.url());
  const body = await pageText(page);
  const result = {
    url: page.url(),
    instanceInUrl: decodedUrl.includes(INSTANCE),
    companyInUrl: /company=RM-DEMO/i.test(decodedUrl),
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(body),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(body) && !decodedUrl.includes(INSTANCE),
  };

  if (!result.instanceInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context for ${CASE_ID}: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function findCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/\bFA-CNC-01\b/i.test(text) && /Fixed Asset Card|Fixed Asset|Depreciation Book|Posting Group|Book Value/i.test(text)) {
      return frame;
    }
  }

  return page.mainFrame();
}

async function openAssetCard(page: Page) {
  await page.goto(fixedAssetCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset Card|Fixed Asset|Depreciation Book|Book Value/i, { timeout: 90_000 });
  await waitForPageText(page, /\bFA-CNC-01\b/i, { timeout: 60_000 });
  return assertContext(page);
}

async function clickVisibleShowMoreControls(page: Page) {
  const frame = await findCardFrame(page);
  const result = await frame.evaluate(() => {
    const clean = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-label],[title]'))
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = clean(element.innerText || element.textContent);
        const aria = clean(element.getAttribute('aria-label'));
        const title = clean(element.getAttribute('title'));
        const label = `${text} ${aria} ${title}`;
        return {
          element,
          text,
          aria,
          title,
          label,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) => /show\s*more|mehr\s*anzeigen/i.test(entry.label))
      .filter((entry) => /General|Depreciation Book|Allgemein/i.test(entry.label))
      .filter((entry) => !/\b(Acquire|Post|Preview|Invoice|Ship|Delete|OK|Yes|Ja)\b/i.test(entry.label))
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const clicked: unknown[] = [];
    const seen = new Set<string>();
    for (const candidate of candidates) {
      const group = /Depreciation Book/i.test(candidate.label) ? 'Depreciation Book' : /General|Allgemein/i.test(candidate.label) ? 'General' : candidate.label;
      if (seen.has(group)) continue;
      candidate.element.click();
      seen.add(group);
      const { element: _element, ...serializable } = candidate;
      clicked.push(serializable);
    }

    return { clicked };
  });

  await page.waitForTimeout(900);
  return result;
}

async function readVisibleRows(page: Page): Promise<CardRow[]> {
  const frame = await findCardFrame(page);
  return frame.evaluate((captionValues) => {
    const clean = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const esc = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement>(
      'input,textarea,select,[contenteditable="true"],a.value,[class*="value"]',
    ))
      .filter(visible)
      .map((control) => {
        const rect = control.getBoundingClientRect();
        const input = control as HTMLInputElement;
        const checked = input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked : null;
        const value =
          'value' in input
            ? clean(String(input.value))
            : checked === null
              ? clean(control.innerText || control.textContent || control.getAttribute('aria-label') || control.getAttribute('title'))
              : String(checked);
        const editable =
          (control.getAttribute('contenteditable') === 'true' || control.tagName === 'SELECT' || 'value' in input) &&
          !('disabled' in input && Boolean(input.disabled)) &&
          !('readOnly' in input && Boolean(input.readOnly));
        return {
          value,
          editable,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect,
        };
      })
      .filter((entry) => entry.y > 130 && entry.x > 40 && entry.x < 2450);

    return captionValues.map((caption) => {
      const exact = new RegExp(`^${esc(caption)}$`, 'i');
      const labels = Array.from(document.querySelectorAll<HTMLElement>('a,span,div,label,[role="button"]'))
        .filter(visible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            text: clean(element.innerText || element.textContent),
            aria: clean(element.getAttribute('aria-label')),
            title: clean(element.getAttribute('title')),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            rect,
          };
        })
        .filter((entry) => exact.test(entry.text) || exact.test(entry.aria) || exact.test(entry.title))
        .filter((entry) => entry.y > 130 && entry.x > 40 && entry.x < 2100)
        .sort((left, right) => left.y - right.y || left.x - right.x);

      const selected = labels
        .flatMap((label) =>
          controls
            .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 12)
            .filter((control) => control.rect.x >= label.rect.x + Math.min(label.rect.width, 220) - 12)
            .filter((control) => control.rect.x - label.rect.x < 760)
            .map((control) => ({
              control,
              score: Math.abs(control.rect.y - label.rect.y) * 100 + Math.max(0, control.rect.x - label.rect.x),
            })),
        )
        .sort((left, right) => left.score - right.score || Number(right.control.editable) - Number(left.control.editable))[0];

      return {
        caption,
        selectedValue: selected?.control.value ?? '',
        diagnosis: selected ? (selected.control.editable ? 'visible-editable-card-row-control' : 'visible-readonly-card-row-control') : labels.length ? 'caption-visible-no-row-control' : 'caption-not-visible',
        editable: Boolean(selected?.control.editable),
      };
    });
  }, captions);
}

async function collectVisibleMachineCandidates(page: Page) {
  const candidates: Array<Record<string, unknown>> = [];
  for (const scope of [page, ...page.frames()]) {
    const found = await scope.evaluate((targetText) => {
      const clean = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      return Array.from(document.querySelectorAll<HTMLElement>('tr,[role="row"],[role="option"],[role="menuitem"],button,a,div,span'))
        .filter(visible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const text = clean(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title'));
          return {
            text,
            role: element.getAttribute('role') || element.tagName.toLowerCase(),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
        .filter((entry) => entry.text.toUpperCase().includes(targetText));
    }, TO_POSTING_GROUP);
    candidates.push(...found);
  }
  return candidates;
}

async function fillPostingGroup(page: Page) {
  const frame = await findCardFrame(page);
  const target = await frame.evaluate(() => {
    const clean = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const exact = /^Posting Group$/i;

    const labels = Array.from(document.querySelectorAll<HTMLElement>('a,span,div,label,[role="button"]'))
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: clean(element.innerText || element.textContent),
          aria: clean(element.getAttribute('aria-label')),
          title: clean(element.getAttribute('title')),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          rect,
        };
      })
      .filter((entry) => exact.test(entry.text) || exact.test(entry.aria) || exact.test(entry.title))
      .filter((entry) => entry.y > 130 && entry.x > 40 && entry.x < 2100)
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select'))
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        const label = clean(element.getAttribute('aria-label') || element.getAttribute('title'));
        return {
          index,
          label,
          valueBefore: clean(String(element.value)),
          disabled: Boolean(element.disabled),
          readOnly: Boolean(element.readOnly),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect,
        };
      })
      .filter((control) => !control.disabled && !control.readOnly && control.y > 130 && control.x > 40 && control.x < 2450);

    const chosen = labels
      .flatMap((label) =>
        controls
          .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 14)
          .filter((control) => control.rect.x >= label.rect.x + Math.min(label.rect.width, 220) - 12)
          .filter((control) => control.rect.x - label.rect.x < 820)
          .map((control) => ({
            label,
            control,
            score: Math.abs(control.rect.y - label.rect.y) * 100 + Math.max(0, control.rect.x - label.rect.x),
          })),
      )
      .sort((left, right) => left.score - right.score)[0];

    return chosen
      ? {
          found: true,
          label: {
            text: chosen.label.text,
            x: chosen.label.x,
            y: chosen.label.y,
            width: chosen.label.width,
          },
          inputIndex: chosen.control.index,
          inputLabel: chosen.control.label,
          valueBefore: chosen.control.valueBefore,
          x: chosen.control.x,
          y: chosen.control.y,
          width: chosen.control.width,
          height: chosen.control.height,
        }
      : { found: false, inputIndex: -1, labels, controls };
  });

  if (!target.found || target.inputIndex < 0) {
    return { attempted: false, filled: false, reason: 'posting-group-combobox-control-not-found', target };
  }

  const routeAttempts: Array<Record<string, unknown>> = [];
  let selected = false;
  let selectionError = '';

  const clickAndTryVisibleMachine = async (name: string, x: number, y: number) => {
    await page.mouse.click(x, y);
    await page.waitForTimeout(1100);
    const candidates = await collectVisibleMachineCandidates(page);
    routeAttempts.push({ name, candidates });
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
          const text = await candidate.innerText({ timeout: 500 }).catch(() => '');
          if (/\b(New|Neu|Edit|Delete|Post|Preview|Acquire|OK|Yes|Ja|Finish|Fertig stellen)\b/i.test(text)) {
            routeAttempts.push({ name, rejectedDangerousCandidate: text.replace(/\s+/g, ' ').trim() });
            continue;
          }
          if (!(await candidate.isVisible({ timeout: 500 }).catch(() => false))) continue;
          selected = await candidate.click({ timeout: 4000 }).then(() => true).catch((error) => {
            selectionError = String(error);
            return false;
          });
          if (selected) return true;
        }
      }
    }
    return false;
  };

  await page.mouse.click(target.x + Math.min(target.width - 4, 120), target.y + Math.max(6, Math.floor(target.height / 2)));
  await page.keyboard.press('Alt+ArrowDown').catch((error) => routeAttempts.push({ name: 'alt-arrow-down-error', error: String(error) }));
  selected = await clickAndTryVisibleMachine('alt-arrow-down', target.x + Math.min(target.width - 4, 120), target.y + Math.max(6, Math.floor(target.height / 2)));

  if (!selected) {
    selected = await clickAndTryVisibleMachine('right-edge-dropdown-click', target.x + target.width - 14, target.y + Math.max(6, Math.floor(target.height / 2)));
  }

  if (!selected) {
    await page.mouse.click(target.x + Math.min(target.width - 4, 120), target.y + Math.max(6, Math.floor(target.height / 2)));
    await page.keyboard.press('Control+A').catch(() => undefined);
    await page.keyboard.type(TO_POSTING_GROUP, { delay: 25 });
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown').catch(() => undefined);
    await page.keyboard.press('Enter').catch(() => undefined);
    await page.waitForTimeout(1400);
    routeAttempts.push({ name: 'typed-value-arrowdown-enter', candidates: await collectVisibleMachineCandidates(page) });
  }

  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1600);
  const rowsAfter = await readVisibleRows(page);
  const valueAfter = valueOf(rowsAfter, 'Posting Group');

  return {
    attempted: true,
    filled: normalize(valueAfter) === TO_POSTING_GROUP || normalize(valueAfter).startsWith(TO_POSTING_GROUP),
    valueAfter,
    rowsAfter,
    routeAttempts,
    selected,
    selectionError,
    target,
  };
}
async function safetyDialogScan(page: Page, phase: string) {
  const dialogTexts: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"]');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => '');
      if (text.trim()) dialogTexts.push(text.replace(/\s+/g, ' ').trim());
    }
  }
  const dangerous = dialogTexts.filter((text) => /\b(Post|Preview|Acquire|Delete|Invoice|Ship|Payment|OK|Yes|Ja|Finish|Fertig stellen)\b/i.test(text));
  return { phase, dialogTexts, dangerous, ok: dangerous.length === 0 };
}

async function checkLedgerSafety(page: Page) {
  await page.goto(faLedgerEntriesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /FA Ledger Entries|FA Ledger Entry|Anlagenposten|Entry No\./i, { timeout: 60_000 });
  const text = await compactPageText(page, {
    include: [/FA-CNC-01|Entry No\.|Document No\.|Amount|Book Value|Acquisition|Depreciation|Anschaffung|AfA/i],
    maxLines: 120,
  });
  const hasTargetLedgerTrace = /\bFA-CNC-01\b/i.test(text) && /Entry No\.|Document No\.|Amount|Acquisition|Depreciation|Anschaffung|AfA/i.test(text);
  await writeTextEvidence(faEvidencePath('020-fa-ledger-entries-safety.txt'), text || 'No compact FA Ledger Entries text captured.');
  await writeJsonEvidence(faEvidencePath('020-safety-check.json'), {
    page: 'FA Ledger Entries',
    pageId: 5604,
    url: page.url(),
    hasTargetLedgerTrace,
  });
  return { page: 'FA Ledger Entries', pageId: 5604, url: page.url(), hasTargetLedgerTrace, compactText: text };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-140 - FA-CNC-01 Posting Group Assignment Fit',
    '',
    `Status: \`${result.resultStatus}\`, \`ui-first\`, \`setup-fit\`, \`no-acquire\`, \`no-preview\`, \`no-posting\`, \`not-final\`.`,
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${result.assetNo} |`,
    `| Vorher Posting Group | ${result.before?.postingGroup ?? '(nicht ermittelt)'} |`,
    `| Nachher Posting Group | ${result.after?.postingGroup ?? '(nicht ermittelt)'} |`,
    `| Datenaenderung | ${result.changedPostingGroup ? 'ja' : 'nein'} |`,
    '| Acquire / Preview / Posting | nein |',
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    '- Die Anlagenbuchungsgruppe ist Stammdaten-/Setup-Kontext auf der Anlagenkarte, noch keine Anschaffung.',
    '- Erst wenn `FA-CNC-01` vor dem Edit eindeutig `EQUIPMENT` zeigt und keine Anlagenposten existieren, ist ein kontrollierter Wechsel auf `MACHINES` vertretbar.',
    '- `MACHINES` als Setup-Code reicht nicht aus; der Code muss auf der konkreten Karte sichtbar zugewiesen sein.',
    '- Nach der Aenderung muss die Karte neu geoeffnet werden, damit der gespeicherte Zustand und nicht nur ein Eingabefeld bewiesen ist.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.',
    '- Keine Anschaffung, kein Kreditor, keine Einkaufsrechnung, keine FA Ledger Entries.',
    '- Keine Preview Posting und keine Buchung.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

async function writeResult(page: Page, partial: Record<string, any>) {
  const conditionalEvidenceRefs = [
    ...(partial.after ? ['playwright/projects/fibu-book5/evidence/fixedassets-140/050-after-visible-rows.json'] : []),
    ...(partial.screenshotCaptured ? ['playwright/projects/fibu-book5/evidence/fixedassets-140/fixedassets-140-060-fa-cnc-01-posting-group-machines.screenshot.json'] : []),
    ...(partial.screenshotCaptured ? ['playwright/projects/fibu-book5/img/fixedassets-140-060-fa-cnc-01-posting-group-machines.png'] : []),
  ];
  const result = {
    schemaVersion: 1,
    purpose: 'fixed-asset-posting-group-assignment-fit-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-ui-setup-fit',
    resultStatus: partial.resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: INSTANCE,
    company: COMPANY,
    assetNo: ASSET_NO,
    changedPostingGroup: false,
    proved: [],
    notProved: [
      'No acquisition was executed.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No purchase invoice, journal line, amount, vendor or draft was created.',
      'No German fixed-assets final proof is produced.',
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/tests/fixedassets-140-fa-cnc-01-posting-group-combobox-route.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-140/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-140/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-140/FIXEDASSETS-140-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-140/FIXEDASSETS-140-posting-group-assignment-fit.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-140/010-before-visible-rows.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-140/020-fa-ledger-entries-safety.txt',
      ...conditionalEvidenceRefs,
    ],
    warnings: [],
    blockedBy: [],
    requiresReview: true,
    safeToFinalizeState: true,
    flags: {
      noBookChange: true,
      noPost: true,
      noPreview: true,
      noSetupChange: partial.resultStatus === 'blocked-safety-gate',
      setupChangeOnlyFaPostingGroup: partial.resultStatus === 'changed-labor-posting-group-fit',
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noDeleteRecord: true,
      noAcquireExecution: true,
      noAmountEntry: true,
      noTargetVendorEntry: true,
    },
    statePatch: {
      current: {
        updatedAt: '2026-06-20T21:45:00.000Z',
        activeCase: NEXT_CASE_ID,
        active_case_file: '.agent/state/cases/fixedassets-141-fa-cnc-01-combobox-result-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-140-fa-cnc-01-posting-group-combobox-route.json',
        requiresStrongModel: true,
        nextStep: 'FIXEDASSETS-141: review FA-140 combobox-route evidence before any acquisition route is unlocked.',
      },
      activeCase: {
        status: partial.resultStatus,
        lastResult: {
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-140/FIXEDASSETS-140-result.json',
          summary: partial.summary,
        },
        nextSafeAction: 'FIXEDASSETS-141: local review of combobox-route evidence.',
      },
    },
    ...partial,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-140-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-140-posting-group-assignment-fit.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# fixedassets-140 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-140-result.json` | JSON | Ergebnis, Safety, Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-140-posting-group-assignment-fit.md` | Markdown | Lernwert und Buchwirkung | keine Anschaffung/Buchung | `labor` |',
      '| `010-before-visible-rows.json` | JSON | Kartenwerte vor Aenderung | keine Posten | `field-proof` |',
      '| `020-fa-ledger-entries-safety.txt` | Text | kompakter Ledger-Sicherheitscheck | keinen Abschlussbericht | `safety` |',
      '| `040-fill-result.json` | JSON | UI-first Feldfuellung, falls erfolgt | keine Buchungswirkung | `setup-fit` |',
      ...(partial.after ? ['| `050-after-visible-rows.json` | JSON | Kartenwerte nach Neuoeffnen | keine FA Ledger Entries | `field-proof` |'] : []),
      ...(partial.screenshotCaptured
        ? ['| `../../img/fixedassets-140-060-fa-cnc-01-posting-group-machines.png` | Screenshot | sichtbarer Kartenkontrollpunkt oder Blockerbild | nicht alleinige Wahrheit | `candidate/labor` |']
        : []),
      '',
      `Aktuelle Wahrheit: ${result.summary}`,
      '',
    ].join('\n'),
  );

  return result;
}

test('FIXEDASSETS-140 fits FA-CNC-01 Posting Group to MACHINES with UI-first safety gates', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const context = await openAssetCard(page);
  await clickVisibleShowMoreControls(page);
  const beforeRows = await readVisibleRows(page);
  await writeJsonEvidence(faEvidencePath('010-before-visible-rows.json'), beforeRows);
  await writeTextEvidence(
    faEvidencePath('010-before-card-text.txt'),
    await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine|Posting Group|EQUIPMENT|MACHINES|Book Value|Acquired|HGB|Depreciation/i],
      maxLines: 160,
    }),
  );

  const beforePostingGroup = normalize(valueOf(beforeRows, 'Posting Group'));
  const beforeBookValue = normalize(valueOf(beforeRows, 'Book Value'));
  const beforeAcquired = normalize(valueOf(beforeRows, 'Acquired'));
  const ledgerSafety = await checkLedgerSafety(page);

  const before = {
    postingGroup: valueOf(beforeRows, 'Posting Group'),
    bookValue: valueOf(beforeRows, 'Book Value'),
    acquired: valueOf(beforeRows, 'Acquired'),
    rows: beforeRows,
  };

  const safetyIssues: string[] = [];
  if (beforePostingGroup !== FROM_POSTING_GROUP && beforePostingGroup !== TO_POSTING_GROUP) {
    safetyIssues.push(`Unexpected Posting Group before edit: ${before.postingGroup || '(blank)'}`);
  }
  if (!/0[,.]00/.test(beforeBookValue)) {
    safetyIssues.push(`Book Value is not visibly zero: ${before.bookValue || '(blank)'}`);
  }
  if (/TRUE|YES|JA/i.test(beforeAcquired)) {
    safetyIssues.push(`Acquired appears true: ${before.acquired}`);
  }
  if (ledgerSafety.hasTargetLedgerTrace) {
    safetyIssues.push('FA Ledger Entries already show target trace for FA-CNC-01.');
  }

  if (safetyIssues.length > 0) {
    await openAssetCard(page);
    await clickVisibleShowMoreControls(page);
    await screenshot(page, 'fixedassets-140-060-fa-cnc-01-posting-group-machines.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: 'labor',
      bookUse: 'field-proof',
      purpose:
        'FA-140 Blockerbild: FA-CNC-01 zeigt Posting Group EQUIPMENT, aber Book Value/Acquired sind fuer den Safety-Gate nicht sichtbar genug; deshalb keine Aenderung.',
      expectedPageText: [/\bFA-CNC-01\b/i, /\bEQUIPMENT\b/i],
      knownLimitations: ['Blockerbild vor dem Edit; kein MACHINES-Fit, keine Anschaffung, keine Preview, keine Buchung.'],
    });
    await writeResult(page, {
      resultStatus: 'blocked-safety-gate' satisfies RunStatus,
      observed: { startedAt, finishedAt: new Date().toISOString(), context, before, ledgerSafety, safetyIssues },
      before,
      ledgerSafety,
      blockedBy: safetyIssues,
      requiresReview: true,
      flags: { noSetupChange: true },
      summary: `FA-140 blocked before edit: ${safetyIssues.join('; ')}`,
      screenshotCaptured: true,
      bookImpact: 'Kapitel 21 darf den Posting-Group-Fit nicht behaupten, solange der Sicherheitsgate blockiert.',
      nextStep: 'FIXEDASSETS-141: Blocker lokal bewerten und naechsten sicheren UI-first Hebel festlegen.',
    });
    return;
  }

  if (beforePostingGroup === TO_POSTING_GROUP) {
    await screenshot(page, 'fixedassets-140-060-fa-cnc-01-posting-group-machines.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: 'candidate',
      bookUse: 'field-proof',
      purpose: 'FA-140: FA-CNC-01 zeigt bereits MACHINES als Posting Group; kein Edit erforderlich.',
      expectedPageText: [/\bFA-CNC-01\b/i, /\bMACHINES\b/i],
      knownLimitations: ['Kein Anlagenzugang, keine Preview, keine Buchung.'],
    });
    await writeResult(page, {
      resultStatus: 'already-fit-labor-posting-group' satisfies RunStatus,
      observed: { startedAt, finishedAt: new Date().toISOString(), context, before, ledgerSafety },
      before,
      after: before,
      ledgerSafety,
      proved: ['FA-CNC-01 is visible in RM-DEMO.', 'Posting Group MACHINES is visible on the Fixed Asset Card.', 'No FA Ledger Entries for FA-CNC-01 were detected in the compact safety check.'],
      changedPostingGroup: false,
      summary: 'FA-CNC-01 already shows MACHINES as Posting Group; no UI setup change was needed.',
      bookImpact: 'Kapitel 21 kann MACHINES als aktuellen CRONUS-USA-Labor-Kartenwert dokumentieren, aber weiter keine Anschaffung oder Buchung behaupten.',
      nextStep: 'FIXEDASSETS-141: review assignment evidence before acquisition route.',
    });
    return;
  }

  await openAssetCard(page);
  await clickVisibleShowMoreControls(page);
  const wideLayout = await clickBcTopIconAction(page, {
    title: /Breite Layoutansicht anzeigen|wide layout/i,
    scopeText: /Fixed Asset Card/i,
    yMax: 80,
  }).catch((error) => ({ clicked: false, attempts: [String(error)] }));
  const editIcon = await clickBcTopIconAction(page, {
    title: /Seite vornehmen|make changes|edit/i,
    scopeText: /Fixed Asset Card/i,
    expectedAfterClick: /Fixed Asset Card/i,
    yMax: 80,
  });
  await page.waitForTimeout(1500);
  await writeJsonEvidence(faEvidencePath('030-edit-actions.json'), { wideLayout, editIcon });

  if (!editIcon.clicked) {
    await clickVisibleShowMoreControls(page);
    const editAttemptRows = await readVisibleRows(page);
    await writeJsonEvidence(faEvidencePath('032-after-edit-attempt-visible-rows.json'), editAttemptRows);
    const postingGroupStillEditable = editAttemptRows.find((row) => row.caption === 'Posting Group')?.editable === true;
    if (!postingGroupStillEditable) {
      await writeResult(page, {
        resultStatus: 'blocked-safety-gate' satisfies RunStatus,
        observed: { startedAt, finishedAt: new Date().toISOString(), context, before, ledgerSafety, wideLayout, editIcon, editAttemptRows },
        before,
        ledgerSafety,
        blockedBy: ['Edit icon could not be clicked safely and Posting Group is not editable.'],
        requiresReview: true,
        summary: 'FA-140 blocked: edit icon could not be clicked safely and Posting Group is not editable.',
        bookImpact: 'Kapitel 21 muss den Karten-Fit weiter als offen markieren.',
        nextStep: 'FIXEDASSETS-141: review edit action blocker.',
      });
      return;
    }
  }

  const dialogBeforeFill = await safetyDialogScan(page, 'before-fill');
  await writeJsonEvidence(faEvidencePath('035-dialog-scan-before-fill.json'), dialogBeforeFill);
  if (!dialogBeforeFill.ok) {
    await writeResult(page, {
      resultStatus: 'blocked-safety-gate' satisfies RunStatus,
      observed: { startedAt, finishedAt: new Date().toISOString(), context, before, ledgerSafety, dialogBeforeFill },
      before,
      ledgerSafety,
      blockedBy: ['Dangerous dialog visible before fill.'],
      requiresReview: true,
      summary: 'FA-140 blocked: a dangerous dialog appeared before filling Posting Group.',
      bookImpact: 'Keine Buchwirkung; zuerst Dialogursache klaeren.',
      nextStep: 'FIXEDASSETS-141: review dangerous dialog evidence.',
    });
    return;
  }

  await clickVisibleShowMoreControls(page);
  const fillResult = await fillPostingGroup(page);
  await writeJsonEvidence(faEvidencePath('040-fill-result.json'), fillResult);
  if (!fillResult.filled) {
    await screenshot(page, 'fixedassets-140-060-fa-cnc-01-posting-group-machines.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: 'labor',
      bookUse: 'field-proof',
      purpose:
        'FA-140 Feldfuell-Blocker: FA-CNC-01 zeigt weiter EQUIPMENT als Posting Group; Tippen/Dropdown-Fallback haben MACHINES nicht final gesetzt.',
      expectedPageText: [/\bFA-CNC-01\b/i],
      knownLimitations: ['Blockerbild nach Fill-Versuch; kein MACHINES-Fit, keine Anschaffung, keine Preview, keine Buchung.'],
    });
    await writeResult(page, {
      resultStatus: 'blocked-safety-gate' satisfies RunStatus,
      observed: { startedAt, finishedAt: new Date().toISOString(), context, before, ledgerSafety, fillResult },
      before,
      ledgerSafety,
      blockedBy: [`Posting Group could not be filled: ${fillResult.reason ?? fillResult.valueAfter ?? 'unknown'}`],
      requiresReview: true,
      screenshotCaptured: true,
      summary: 'FA-140 blocked: Posting Group field was not filled to MACHINES.',
      bookImpact: 'Kapitel 21 muss den Posting-Group-Kartenfit weiter offen halten.',
      nextStep: 'FIXEDASSETS-141: review wrong-related-card or field-fill blocker.',
    });
    return;
  }

  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(2500);
  const dialogAfterSave = await safetyDialogScan(page, 'after-save');
  await writeJsonEvidence(faEvidencePath('045-dialog-scan-after-save.json'), dialogAfterSave);

  await openAssetCard(page);
  await clickVisibleShowMoreControls(page);
  const afterRows = await readVisibleRows(page);
  await writeJsonEvidence(faEvidencePath('050-after-visible-rows.json'), afterRows);
  await writeTextEvidence(
    faEvidencePath('050-after-card-text.txt'),
    await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine|Posting Group|EQUIPMENT|MACHINES|Book Value|Acquired|HGB|Depreciation/i],
      maxLines: 160,
    }),
  );
  const afterPostingGroup = normalize(valueOf(afterRows, 'Posting Group'));
  const after = {
    postingGroup: valueOf(afterRows, 'Posting Group'),
    bookValue: valueOf(afterRows, 'Book Value'),
    acquired: valueOf(afterRows, 'Acquired'),
    rows: afterRows,
  };

  const changedPostingGroup = afterPostingGroup === TO_POSTING_GROUP;
  await screenshot(page, 'fixedassets-140-060-fa-cnc-01-posting-group-machines.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: changedPostingGroup ? 'candidate' : 'rejected',
    bookUse: 'field-proof',
    purpose: changedPostingGroup
      ? 'FA-140: FA-CNC-01 zeigt nach Neuoeffnen MACHINES als Posting Group; kontrollierter UI-first Setup-Fit ohne Anschaffung/Buchung.'
      : 'FA-140: Kartenbild nach Fill-Versuch; MACHINES ist nicht final als Posting Group nachgewiesen.',
    expectedPageText: changedPostingGroup ? [/\bFA-CNC-01\b/i, /\bMACHINES\b/i] : [/\bFA-CNC-01\b/i],
    knownLimitations: ['Kein Anlagenzugang, keine Preview, keine Buchung.', 'Screenshot ist nur mit JSON/Text-Evidence belastbar.'],
  });

  await writeResult(page, {
    resultStatus: changedPostingGroup ? ('changed-labor-posting-group-fit' satisfies RunStatus) : ('blocked-safety-gate' satisfies RunStatus),
    observed: { startedAt, finishedAt: new Date().toISOString(), context, before, ledgerSafety, wideLayout, editIcon, fillResult, dialogAfterSave, after },
    before,
    after,
    ledgerSafety,
    fillResult,
    changedPostingGroup,
    proved: changedPostingGroup
      ? [
          'FA-CNC-01 was opened in MCP_1_20260210 / RM-DEMO.',
          'Before edit, Posting Group EQUIPMENT was visible.',
          'No FA Ledger Entries for FA-CNC-01 were detected in the compact safety check.',
          'After UI-first edit and reopen, Posting Group MACHINES was visible on the Fixed Asset Card.',
          'No Acquire, Preview Posting, posting, draft creation, company switch or API shortcut was performed.',
        ]
      : ['FA-CNC-01 was opened in MCP_1_20260210 / RM-DEMO.', 'The assignment fit did not finish with MACHINES visible after reopen.'],
    blockedBy: changedPostingGroup ? [] : [`After reopen, Posting Group is ${after.postingGroup || '(blank)'}, expected MACHINES.`],
    requiresReview: true,
    summary: changedPostingGroup
      ? 'FA-140 changed FA-CNC-01 Posting Group from EQUIPMENT to MACHINES through the UI and confirmed the value after reopening the card.'
      : `FA-140 did not confirm MACHINES after reopen. Visible value: ${after.postingGroup || '(blank)'}.`,
    bookImpact: changedPostingGroup
      ? 'Kapitel 21 darf den CRONUS-USA-Labor-Kartenfit `FA-CNC-01 -> MACHINES` als Stammdaten-/Setup-Voraussetzung dokumentieren. Weiterhin keine Anschaffung, keine AfA, keine Postenspur und kein deutscher Finalnachweis.'
      : 'Kapitel 21 darf den Posting-Group-Kartenfit nicht behaupten; der Feld-Fit bleibt Blocker.',
    nextStep: 'FIXEDASSETS-141: review FA-140 combobox-route evidence before unlocking any acquisition route.',
  });
});
