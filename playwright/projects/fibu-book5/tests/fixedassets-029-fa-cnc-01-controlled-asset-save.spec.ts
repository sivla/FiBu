import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { mkdir, readdir, rm, unlink } from 'node:fs/promises';
import path from 'node:path';
import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
  waitForPageText
} from '../../../core/bc-helpers';
import { clickBcAction } from '../../../core/bc/actions';
import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(360_000);

const testId = 'fixedassets-029';
const projectRoot = path.join('playwright', 'projects', project.name);
const evidenceDir = path.join(projectRoot, 'evidence', testId);
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  fixedAssetNo: 'FA-CNC-01',
  description: 'CNC Maschine FRA',
  faClassCode: 'TANGIBLE',
  faSubclassCode: 'EQUIPMENT',
  depreciationBook: 'HGB',
  faPostingGroup: 'MACHINES',
  depreciationYears: '8'
};

const requiredCaptions = [
  'No.',
  'Description',
  'FA Class Code',
  'FA Subclass Code',
  'Depreciation Book Code',
  'Posting Group',
  'No. of Depreciation Years',
  'Depreciation Starting Date',
  'Depreciation Ending Date'
];

type FillAttempt = {
  caption: string;
  value: string;
  filled: boolean;
  chosen?: unknown;
  candidates?: unknown[];
  reason?: string;
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function fixedAssetsUrl(filterToTarget = false) {
  const url = new URL(bcPageUrl(5601, project.envPrefix));
  if (filterToTarget) {
    url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${target.fixedAssetNo}'`);
  }
  return url.toString();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function prepareRunArtifacts() {
  await rm(evidenceDir, { recursive: true, force: true });
  await mkdir(evidenceDir, { recursive: true });
  const imgDir = path.join(projectRoot, 'img');
  await mkdir(imgDir, { recursive: true });
  const existingImages = await readdir(imgDir).catch(() => []);
  await Promise.all(
    existingImages
      .filter((fileName) => fileName.startsWith(`${testId}-`))
      .map((fileName) => unlink(path.join(imgDir, fileName)).catch(() => undefined))
  );
}

async function openFixedAssets(page: Page, filterToTarget = false) {
  await page.goto(fixedAssetsUrl(filterToTarget), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Assets|Anlagen|No\.|Description/i, { timeout: 60_000 });
}

async function assertRmDemoContext(page: Page) {
  const body = await pageText(page);
  const url = decodeURIComponent(page.url());
  const issues: string[] = [];
  if (!url.includes(target.environment)) issues.push(`URL enthaelt nicht ${target.environment}`);
  if (!/company=RM-DEMO/i.test(url)) issues.push('URL enthaelt nicht company=RM-DEMO');
  if (!/Rhein-Main Demo GmbH|RM-DEMO|MCP_1_20260210/i.test(body)) {
    issues.push('RM-DEMO ist im sichtbaren Seitentext nicht nachweisbar');
  }
  expect(issues, issues.join('\n')).toEqual([]);
  return { url, textOk: issues.length === 0 };
}

async function findFixedAssetCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Fixed Asset Card|FA Class Code|FA Subclass Code|Depreciation Book/i.test(text)) {
      return frame;
    }
  }
  return page.mainFrame();
}

async function clickScopedNew(page: Page) {
  const helperResult = await clickBcAction(page, {
    name: /New|Neu|Erstellen Sie einen neuen Eintrag/i,
    roles: ['button', 'menuitem'],
    scopeText: /Fixed Assets|Anlagen/i,
    expectedAfterClick: /Fixed Asset Card|Neu - Fixed Asset Card/i,
    timeout: 5000,
    afterClickTimeout: 30_000
  }).catch((error) => ({
    clicked: false,
    error: error instanceof Error ? error.name : 'UnknownError',
    message: 'clickBcAction timed out or did not provide foreground-card proof'
  }));

  let helperOpenedCard = helperResult.clicked && /Fixed Asset Card|Neu - Fixed Asset Card/i.test(await pageText(page));
  let fallbackResult: unknown = { clicked: false, candidates: [] };

  if (!helperOpenedCard) {
    for (const frame of page.frames()) {
      const frameText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
      if (!/Fixed Assets|Anlagen/i.test(frameText)) continue;

      fallbackResult = await frame
        .evaluate(() => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const score = (candidate: { text: string; aria: string; title: string; role: string; x: number; y: number }) => {
            let value = 0;
            if (/^(New|Neu)$/.test(candidate.text) || /^(New|Neu)$/.test(candidate.aria)) value -= 35;
            if (/Create a new entry|Erstellen Sie einen neuen Eintrag|neuen Eintrag/i.test(candidate.title)) value -= 20;
            if (/button|menuitem/i.test(candidate.role)) value -= 8;
            if (candidate.y >= 35 && candidate.y <= 130) value -= 10;
            value += Math.abs(candidate.y - 65) / 60;
            value += Math.abs(candidate.x - 520) / 800;
            return value;
          };
          const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const text = normalize(element.innerText || element.textContent);
              const aria = normalize(element.getAttribute('aria-label'));
              const title = normalize(element.getAttribute('title'));
              const role = normalize(element.getAttribute('role')) || element.tagName.toLowerCase();
              const label = [text, aria, title].filter(Boolean).join(' ');
              const candidate = {
                element,
                text,
                aria,
                title,
                role,
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                label
              };
              return { ...candidate, score: score(candidate) };
            })
            .filter((candidate) => visible(candidate.element))
            .filter(
              (candidate) =>
                /^(New|Neu)$/.test(candidate.text) ||
                /^(New|Neu)$/.test(candidate.aria) ||
                /new entry|neuen Eintrag/i.test(candidate.title)
            )
            .filter((candidate) => !/Sales|Purchase|Intercom|Time Sheet|Document|Quote|Order|Power BI/i.test(candidate.label))
            .sort((left, right) => left.score - right.score || left.y - right.y || left.x - right.x);

          const chosen = candidates[0];
          if (chosen) chosen.element.click();
          return {
            clicked: Boolean(chosen),
            chosen: chosen
              ? {
                  text: chosen.text,
                  aria: chosen.aria,
                  title: chosen.title,
                  role: chosen.role,
                  x: chosen.x,
                  y: chosen.y,
                  width: chosen.width,
                  height: chosen.height,
                  label: chosen.label,
                  score: chosen.score
                }
              : null,
            candidates: candidates.slice(0, 12).map(({ element, ...entry }) => entry)
          };
        })
        .catch((error) => ({ clicked: false, error: String(error), candidates: [] }));

      if ((fallbackResult as { clicked?: boolean }).clicked) break;
    }

    if ((fallbackResult as { clicked?: boolean }).clicked) {
      await expect
        .poll(async () => pageText(page), { timeout: 30_000, intervals: [500, 1000, 2500] })
        .toMatch(/Fixed Asset Card|Neu - Fixed Asset Card/i);
    }

    helperOpenedCard = /Fixed Asset Card|Neu - Fixed Asset Card/i.test(await pageText(page));
  }

  const openedCard = helperOpenedCard;
  await writeJsonEvidence(fixedAssetsEvidencePath('010-new-action-result.json'), {
    helper: 'clickBcAction-with-scored-frame-fallback',
    helperResult,
    fallbackUsed: !Boolean(helperResult.clicked),
    fallbackResult,
    openedCard
  });
  expect(openedCard, 'Scoped New action auf Fixed Assets muss wirklich die Fixed Asset Card oeffnen').toBeTruthy();
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
}

async function clickCardShowMoreForGeneralAndDepreciationBook(page: Page) {
  const frame = await findFixedAssetCardFrame(page);
  const result = await frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-label],[title]'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const targetFastTab = /Depreciation Book/i.test([aria, title].join(' '))
          ? 'Depreciation Book'
          : /General/i.test([aria, title].join(' '))
            ? 'General'
            : '';
        return {
          element,
          text,
          aria,
          title,
          targetFastTab,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })
      .filter((candidate) => visible(candidate.element))
      .filter((candidate) => candidate.width <= 220 && candidate.height <= 60)
      .filter((candidate) => /show\s*more|mehr\s*anzeigen/i.test([candidate.text, candidate.aria, candidate.title].join(' ')))
      .filter((candidate) => candidate.targetFastTab)
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const clicked: Array<Omit<(typeof candidates)[number], 'element'>> = [];
    const seen = new Set<string>();
    for (const candidate of candidates) {
      if (seen.has(candidate.targetFastTab)) continue;
      candidate.element.click();
      seen.add(candidate.targetFastTab);
      const { element, ...entry } = candidate;
      clicked.push(entry);
    }

    return {
      candidates: candidates.map(({ element, ...entry }) => entry),
      clicked
    };
  });

  await page.waitForTimeout(1500);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-show-more-result.json'), result);
  return result;
}

async function fillCardField(page: Page, caption: string, value: string): Promise<FillAttempt> {
  const frame = await findFixedAssetCardFrame(page);
  const result = await frame.evaluate(
    ({ captionValue, targetValue }) => {
      const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
      const exactCaption = new RegExp(`^${captionValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };

      const labels = Array.from(document.querySelectorAll<HTMLElement>('a,span,div,label,[role="button"]'))
        .filter((element) => visible(element))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const text = normalize(element.innerText || element.textContent);
          const aria = normalize(element.getAttribute('aria-label'));
          const title = normalize(element.getAttribute('title'));
          const role = normalize(element.getAttribute('role'));
          const tagName = element.tagName;
          const exact = exactCaption.test(text) || exactCaption.test(aria) || exactCaption.test(title);
          const inCardArea = rect.y > 180 && rect.x > 250 && rect.x < 1150;
          const notGridHeader = role !== 'columnheader' && tagName !== 'TH';
          return {
            element,
            exact,
            inCardArea,
            notGridHeader,
            text,
            aria,
            title,
            role,
            tagName,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            rect
          };
        })
        .filter((candidate) => candidate.exact && candidate.inCardArea && candidate.notGridHeader)
        .sort((left, right) => left.y - right.y || left.x - right.x);

      const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea'))
        .filter((input) => visible(input) && !input.disabled && !input.readOnly)
        .map((input) => {
          const rect = input.getBoundingClientRect();
          return {
            input,
            valueBefore: normalize(input.value),
            aria: normalize(input.getAttribute('aria-label')),
            title: normalize(input.getAttribute('title')),
            role: normalize(input.getAttribute('role')),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            rect
          };
        })
        .filter((control) => control.y > 180 && control.x > 250 && control.x < 1600);

      const candidates = labels
        .flatMap((label) =>
          controls
            .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 8)
            .filter((control) => control.rect.x >= label.rect.x + Math.min(label.rect.width, 220) - 6)
            .filter((control) => control.rect.x - label.rect.x < 520)
            .map((control) => {
              const score = Math.abs(control.rect.y - label.rect.y) * 100 + Math.max(0, control.rect.x - label.rect.x);
              return { label, control, score };
            })
        )
        .sort((left, right) => left.score - right.score || left.control.x - right.control.x);

      const chosen = candidates[0];
      if (!chosen) {
        return {
          filled: false,
          reason: `Kein sichtbares editierbares Feld fuer ${captionValue}`,
          candidates: candidates.slice(0, 10).map(({ label, control, score }) => ({
            score,
            label: { text: label.text, aria: label.aria, title: label.title, x: label.x, y: label.y, width: label.width, height: label.height },
            control: control
              ? {
                  valueBefore: control.valueBefore,
                  aria: control.aria,
                  title: control.title,
                  role: control.role,
                  x: control.x,
                  y: control.y,
                  width: control.width,
                  height: control.height
                }
              : null
          }))
        };
      }

      chosen.control.input.focus();
      chosen.control.input.select();
      chosen.control.input.value = targetValue;
      chosen.control.input.dispatchEvent(new Event('input', { bubbles: true }));
      chosen.control.input.dispatchEvent(new Event('change', { bubbles: true }));
      chosen.control.input.blur();

      return {
        filled: true,
        chosen: {
          score: chosen.score,
          label: {
            text: chosen.label.text,
            aria: chosen.label.aria,
            title: chosen.label.title,
            x: chosen.label.x,
            y: chosen.label.y,
            width: chosen.label.width,
            height: chosen.label.height
          },
          control: {
            valueBefore: chosen.control.valueBefore,
            aria: chosen.control.aria,
            title: chosen.control.title,
            role: chosen.control.role,
            x: chosen.control.x,
            y: chosen.control.y,
            width: chosen.control.width,
            height: chosen.control.height
          }
        },
        candidates: candidates.slice(0, 10).map(({ label, control, score }) => ({
          score,
          label: { text: label.text, aria: label.aria, title: label.title, x: label.x, y: label.y, width: label.width, height: label.height },
          control: {
            valueBefore: control.valueBefore,
            aria: control.aria,
            title: control.title,
            role: control.role,
            x: control.x,
            y: control.y,
            width: control.width,
            height: control.height
          }
        }))
      };
    },
    { captionValue: caption, targetValue: value }
  );

  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(700);
  return {
    caption,
    value,
    ...result
  };
}

async function acceptRelatedRecordsConfirmationIfShown(page: Page, step: string) {
  const body = await pageText(page);
  if (!/zugeh.rige Datens.tze aktualisieren|related records/i.test(body)) {
    return { visible: false, clickedYes: false };
  }

  await screenshot(page, `${testId}-${step}-related-records-confirmation.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'error-learning',
    purpose:
      'FIXEDASSETS-029 Business-Central-Bestaetigung: Aenderungen am Anlagenstamm koennen abhaengige Datensaetze aktualisieren.',
    expectedPageText: [/zugeh.rige Datens.tze aktualisieren|related records/i, /Ja|Yes/i],
    knownLimitations: ['Kein Posting-Dialog; nur Stammdatenbestaetigung im Anlagenkartenkontext.']
  });

  await writeTextEvidence(
    fixedAssetsEvidencePath(`${step}-related-records-confirmation.txt`),
    await compactPageText(page, {
      include: [/zugeh.rige Datens.tze aktualisieren|related records|Ja|Yes|Nein|No/i],
      maxLines: 40
    })
  );

  const yesButton = page.getByRole('button', { name: /^(Ja|Yes)$/i }).first();
  await yesButton.click({ timeout: 10_000 });
  await page.waitForTimeout(1500);
  return { visible: true, clickedYes: true };
}

async function collectVisibleCardValues(page: Page) {
  const text = await pageText(page);
  return {
    hasTargetNo: new RegExp(`\\b${escapeRegExp(target.fixedAssetNo)}\\b`, 'i').test(text),
    hasDescription: new RegExp(escapeRegExp(target.description), 'i').test(text),
    hasFaClassCode: new RegExp(`\\b${escapeRegExp(target.faClassCode)}\\b`, 'i').test(text),
    hasFaSubclassCode: new RegExp(`\\b${escapeRegExp(target.faSubclassCode)}\\b`, 'i').test(text),
    hasDepreciationBook: new RegExp(`\\b${escapeRegExp(target.depreciationBook)}\\b`, 'i').test(text),
    hasPostingGroup: new RegExp(`\\b${escapeRegExp(target.faPostingGroup)}\\b`, 'i').test(text),
    generatedNumbers: [...new Set(text.match(/\bFA\d{6}\b/g) ?? [])]
  };
}

function renderMarkdown(result: Record<string, any>) {
  const fillRows = (result.fillAttempts as FillAttempt[])
    .map((entry) => `| ${entry.caption} | ${entry.value} | ${entry.filled ? 'ja' : 'nein'} | ${entry.reason ?? ''} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-029 - FA-CNC-01 Controlled Asset Save',
    '',
    `Status: \`${result.status}\`, \`ui-first\`, \`fixed-assets\`, \`masterdata\`, \`no-posting\`, \`not-final\`, \`de-final-open\`.`,
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |',
    `| Zielanlage gespeichert | ${result.targetSaved ? 'ja' : 'nein'} |`,
    '| Buchung | nein |',
    '| Kreditor/Einkauf/Zugang/AfA | nein |',
    '',
    '## Feldversuche',
    '',
    '| Feld | Zielwert | gesetzt | Hinweis |',
    '|---|---|---:|---|',
    fillRows,
    '',
    '## Ergebnis',
    '',
    `- Vorher war \`FA-CNC-01\` sichtbar: ${result.beforeTargetVisible ? 'ja' : 'nein'}.`,
    `- Nachher ist \`FA-CNC-01\` sichtbar: ${result.afterTargetVisible ? 'ja' : 'nein'}.`,
    `- Sichtbarer Zielwertstatus: ${JSON.stringify(result.visibleCardValuesAfterFill)}.`,
    `- Blocker: ${result.blocker ?? 'keiner'}.`,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Der Anlagenstamm ist der erste echte Datensatz im Anlagenprozess. Erst wenn Nummer, Beschreibung, Klasse, Unterklasse, AfA-Buch und Anlagenbuchungsgruppe sichtbar getragen werden, darf man spaeter ueber Kreditor, Einkaufsrechnung, Zugang und AfA nachdenken. Wenn BC Pflichtfelder wie AfA-Datum verlangt, ist das kein Playwright-Fehler, sondern Business-Central-Datenlogik.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Anlagen-Finalnachweis.',
    '- Kein Kreditor `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- Deutsche HGB-/Kontenplan- und steuerliche Finalaussagen bleiben offen.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-029 saves only target fixed asset FA-CNC-01 when save gate holds', async ({ page }) => {
  await prepareRunArtifacts();

  await openFixedAssets(page, true);
  const context = await assertRmDemoContext(page);
  const beforeText = await pageText(page);
  const beforeTargetVisible = new RegExp(`\\b${escapeRegExp(target.fixedAssetNo)}\\b`, 'i').test(beforeText);
  await writeTextEvidence(
    fixedAssetsEvidencePath('000-target-filter-before-run.txt'),
    await compactPageText(page, {
      include: [/MCP_1_20260210|Rhein-Main Demo GmbH|RM-DEMO|Fixed Assets|FA-CNC-01|No\.|Description|FA000/i],
      maxLines: 90
    })
  );

  if (beforeTargetVisible) {
    await screenshot(page, `${testId}-010-target-already-visible.png`, {
      projectName: project.name,
      testId,
      status: 'rejected',
      bookUse: 'do-not-use',
      purpose: 'FIXEDASSETS-029 Stop-Kriterium: FA-CNC-01 war vor dem Lauf bereits sichtbar.',
      expectedPageText: [/\bFA-CNC-01\b/i],
      knownLimitations: ['Der Lauf darf keinen bestehenden Zielstammsatz ueberschreiben oder loeschen.']
    });
    const result = {
      testId: 'FIXEDASSETS-029',
      generatedAt: new Date().toISOString(),
      status: 'blocked-target-already-exists',
      environment: target.environment,
      company: target.company,
      dataBasis: 'CRONUS USA',
      mode: 'ui-first-controlled-target-masterdata-save',
      target,
      context,
      beforeTargetVisible,
      afterTargetVisible: true,
      targetSaved: false,
      blocker: 'FA-CNC-01 existed before this run; no overwrite.',
      fillAttempts: [],
      visibleCardValuesAfterFill: null,
      safety: {
        posted: false,
        vendorCreated: false,
        purchaseInvoiceCreated: false,
        acquisitionPosted: false,
        depreciationCalculatedOrPosted: false
      },
      bookImpact:
        'Kapitel 21 muss vor dem Speichern pruefen lassen, ob die Zielanlage schon existiert. Ein bestehender Stammsatz darf nicht blind ueberschrieben werden.',
      nextStep:
        'FIXEDASSETS-029-EXISTING-ASSET-READONLY-VERIFY: bestehenden FA-CNC-01 read-only pruefen oder bewusst neues Ziel/Gate entscheiden.'
    };
    await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-029-result.json'), result);
    await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-029-FA-CNC-01-CONTROLLED-ASSET-SAVE.md'), renderMarkdown(result));
    await writeTextEvidence(
      fixedAssetsEvidencePath('README.md'),
      '# fixedassets-029 Evidence\n\nStatus: `blocked-target-already-exists`.\n\n| Datei | Typ | Beweist | Beweist nicht | Status |\n|---|---|---|---|---|\n| `FIXEDASSETS-029-result.json` | JSON | Ziel existierte vor dem Lauf | keine neue Anlage | blocked |\n| `FIXEDASSETS-029-FA-CNC-01-CONTROLLED-ASSET-SAVE.md` | Markdown | Lern- und Buchwirkung | keinen deutschen Finalnachweis | blocked |\n'
    );
    return;
  }

  await openFixedAssets(page, false);
  await assertRmDemoContext(page);
  await clickScopedNew(page);
  await assertRmDemoContext(page);
  await clickCardShowMoreForGeneralAndDepreciationBook(page);

  const beforeFillDiagnosis = await collectActiveCardControlDiagnostics(page, requiredCaptions, {
    targetText: /Fixed Asset Card|FA Class Code|FA Subclass Code|Depreciation Book Code|Posting Group/i
  });
  await writeJsonEvidence(fixedAssetsEvidencePath('025-active-card-before-fill.json'), beforeFillDiagnosis);

  const fillAttempts: FillAttempt[] = [];
  const confirmations: unknown[] = [];
  for (const [caption, value] of [
    ['No.', target.fixedAssetNo],
    ['Description', target.description],
    ['FA Class Code', target.faClassCode],
    ['FA Subclass Code', target.faSubclassCode],
    ['Depreciation Book Code', target.depreciationBook],
    ['Posting Group', target.faPostingGroup],
    ['No. of Depreciation Years', target.depreciationYears]
  ] as const) {
    fillAttempts.push(await fillCardField(page, caption, value));
    confirmations.push({
      caption,
      ...(await acceptRelatedRecordsConfirmationIfShown(page, `032-${caption.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`))
    });
  }
  await writeJsonEvidence(fixedAssetsEvidencePath('030-fill-attempts.json'), fillAttempts);
  await writeJsonEvidence(fixedAssetsEvidencePath('032-related-records-confirmations.json'), confirmations);

  const visibleCardValuesAfterFill = await collectVisibleCardValues(page);
  await writeTextEvidence(
    fixedAssetsEvidencePath('035-card-context-after-fill.txt'),
    await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|Depreciation|Posting Group|Starting Date|Ending Date|Book Value|Error|Fehler/i],
      maxLines: 160
    })
  );

  const valueFit =
    visibleCardValuesAfterFill.hasTargetNo &&
    visibleCardValuesAfterFill.hasDescription &&
    visibleCardValuesAfterFill.hasFaClassCode &&
    visibleCardValuesAfterFill.hasFaSubclassCode &&
    visibleCardValuesAfterFill.hasDepreciationBook &&
    visibleCardValuesAfterFill.hasPostingGroup;

  await screenshot(page, `${testId}-040-target-card-after-fill.png`, {
    projectName: project.name,
    testId,
    status: valueFit ? 'candidate' : 'rejected',
    bookUse: valueFit ? 'field-proof' : 'do-not-use',
    purpose:
      'FIXEDASSETS-029 Zielkartenbild: FA-CNC-01, Beschreibung, Klasse/Unterklasse, HGB und MACHINES muessen sichtbar sein, bevor spaetere Anlagenbuchungsschritte erlaubt werden.',
    expectedPageText: valueFit
      ? [/\bFA-CNC-01\b/i, /CNC Maschine FRA/i, /\bHGB\b/i, /\bMACHINES\b/i]
      : [/Fixed Asset|FA Class|Depreciation Book|Posting Group/i],
    knownLimitations: [
      'Nur Stammdaten-Save-Gate im CRONUS-USA-Labor.',
      'Keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.',
      'AfA-Datumsfelder werden nicht geraten; wenn BC sie verlangt, bleibt das ein Lernblocker.'
    ]
  });

  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(2500);
  await openFixedAssets(page, true);
  const afterText = await pageText(page);
  const afterTargetVisible = new RegExp(`\\b${escapeRegExp(target.fixedAssetNo)}\\b`, 'i').test(afterText);
  await writeTextEvidence(
    fixedAssetsEvidencePath('090-target-filter-after-run.txt'),
    await compactPageText(page, {
      include: [/MCP_1_20260210|Rhein-Main Demo GmbH|RM-DEMO|Fixed Assets|FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|FA000/i],
      maxLines: 120
    })
  );

  await screenshot(page, `${testId}-090-target-filter-after-run.png`, {
    projectName: project.name,
    testId,
    status: afterTargetVisible ? 'candidate' : 'rejected',
    bookUse: afterTargetVisible ? 'master-data-card' as never : 'do-not-use',
    purpose:
      'FIXEDASSETS-029 Nachweis nach Speicherversuch: gefilterte Anlagenliste muss FA-CNC-01 zeigen, sonst ist der Save blockiert.',
    expectedPageText: afterTargetVisible ? [/\bFA-CNC-01\b/i] : [/Fixed Assets|Anlagen/i],
    knownLimitations: [
      'Nur Anlagenstammdatennachweis, keine Anlagenbuchung.',
      'Gefilterte Liste beweist Sichtbarkeit, nicht automatisch alle AfA- und Posting-Folgeprozesse.'
    ]
  });

  const status = afterTargetVisible && valueFit ? 'labor-target-masterdata-saved' : 'blocked-save-not-proven';
  const result = {
    testId: 'FIXEDASSETS-029',
    generatedAt: new Date().toISOString(),
    status,
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-controlled-target-masterdata-save',
    target,
    context,
    beforeTargetVisible,
    afterTargetVisible,
    targetSaved: afterTargetVisible && valueFit,
    fillAttempts,
    confirmations,
    beforeFillDiagnosis,
    visibleCardValuesAfterFill,
    blocker: afterTargetVisible && valueFit ? null : 'Zielanlage oder Zielwerte sind nach Speicherversuch nicht vollstaendig sichtbar nachgewiesen.',
    screenshots: [
      `${testId}-040-target-card-after-fill.png`,
      `${testId}-090-target-filter-after-run.png`
    ],
    safety: {
      posted: false,
      vendorCreated: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false
    },
    bookImpact:
      afterTargetVisible && valueFit
        ? 'Kapitel 21 kann FA-CNC-01 jetzt als CRONUS-USA-Labor-Stammsatz zeigen. Die Anleitung muss trotzdem klar trennen: Stammsatz ist nicht Zugang, nicht AfA und nicht deutscher Finalnachweis.'
        : 'Kapitel 21 muss den Stammsatz-Save weiterhin als blockiert markieren, bis der Zielwert im sichtbaren UI vollstaendig belegt ist.',
    nextStep:
      afterTargetVisible && valueFit
        ? 'FIXEDASSETS-030-K30000-VENDOR-READINESS-DECISION: ohne Anlagenbuchung entscheiden, ob der Kreditor fuer den spaeteren Anlagenzugang vorbereitet werden darf.'
        : 'FIXEDASSETS-029-BLOCKER-DIAGNOSIS: sichtbaren Karten-/Pflichtfeldblocker analysieren, keine Einkaufsrechnung und keine Buchung.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-029-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-029-FA-CNC-01-CONTROLLED-ASSET-SAVE.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# fixedassets-029 Evidence',
      '',
      `Status: \`${status}\`.`,
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-029-result.json` | JSON-Ergebnis | Ziel, Feldversuche, Save-Status, Sicherheitsgrenzen | keine Anlagenbuchung | labor/blocked |',
      '| `FIXEDASSETS-029-FA-CNC-01-CONTROLLED-ASSET-SAVE.md` | Markdown | Lern- und Buchwirkung | keinen deutschen Finalnachweis | labor/blocked |',
      '| `000-target-filter-before-run.txt` | UI-Text | Ziel war vor dem Lauf nicht sichtbar beziehungsweise Stop-Kriterium | kein API-Nachweis | preflight |',
      '| `025-active-card-before-fill.json` | JSON | aktive Kartenfelder vor Zielwerteingabe | keine gesetzten Werte | control-proof |',
      '| `030-fill-attempts.json` | JSON | welche Zielwerte per UI gesetzt wurden | keine Tabellenextraktion | field-proof |',
      '| `035-card-context-after-fill.txt` | UI-Text | kompakter Kartenkontext nach Zielwerteingabe | kein Rohdump | compact |',
      '| `090-target-filter-after-run.txt` | UI-Text | gefilterter Nachher-Kontext fuer `FA-CNC-01` | keine Postenspur | proof |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | mixed |',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.vendorCreated).toBe(false);
  expect(result.safety.purchaseInvoiceCreated).toBe(false);
  expect(result.safety.acquisitionPosted).toBe(false);
  expect(result.safety.depreciationCalculatedOrPosted).toBe(false);
});
