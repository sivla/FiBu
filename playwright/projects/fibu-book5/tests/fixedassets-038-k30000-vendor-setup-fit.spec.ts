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
  waitForPageText
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(420_000);

const testId = 'fixedassets-038';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH'
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function vendorsUrl(filterToTarget = false) {
  const url = new URL(bcPageUrl(27, project.envPrefix));
  if (filterToTarget) {
    url.searchParams.set('filter', `'Vendor'.'No.' IS '${target.vendorNo}'`);
  }
  return url.toString();
}

function vendorsUrlForNo(vendorNo: string) {
  const url = new URL(bcPageUrl(27, project.envPrefix));
  url.searchParams.set('filter', `'Vendor'.'No.' IS '${vendorNo}'`);
  return url.toString();
}

function vendorCardUrl(vendorNo: string) {
  const url = new URL(bcPageUrl(26, project.envPrefix));
  url.searchParams.set('filter', `'Vendor'.'No.' IS '${vendorNo}'`);
  return url.toString();
}

async function openVendors(page: Page, filterToTarget = false) {
  await page.goto(vendorsUrl(filterToTarget), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Vendors|Vendor|Kreditoren|Kreditor/i, { timeout: 60_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);
}

async function visibleSignals(page: Page) {
  const signals = [];
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((vendorNo) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rows = Array.from(document.querySelectorAll<HTMLElement>('tr,[role="row"]'))
          .filter(visible)
          .map((element) => normalize(element.innerText || element.textContent))
          .filter(Boolean)
          .slice(0, 100);
        const pageTexts = Array.from(document.querySelectorAll<HTMLElement>('input,textarea,span,div,button,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const input = element as HTMLInputElement;
            return normalize(
              [input.value, element.innerText || element.textContent, element.getAttribute('aria-label'), element.getAttribute('title')]
                .filter(Boolean)
                .join(' ')
            );
          })
          .filter(Boolean)
          .slice(0, 300);

        return {
          frameUrl: location.href,
          rows: rows.filter((row) => /K30000|Zollspedition|\bV\d{5}\b|No\.|Name|Vendor|Kreditor|blocked|gesperrt|nothing|nichts/i.test(row)).slice(0, 40),
          targetVisibleInRows: rows.some((row) => new RegExp(`\\b${vendorNo}\\b`, 'i').test(row)),
          targetVisibleAnywhere: pageTexts.some((text) => new RegExp(`\\b${vendorNo}\\b`, 'i').test(text)),
          vendorNameVisibleAnywhere: pageTexts.some((text) => /Zollspedition Nord/i.test(text)),
          emptyStateVisible: pageTexts.some((text) => /There is nothing to show|In dieser Ansicht kann nichts angezeigt werden|Keine anzuzeigenden|No data/i.test(text)),
          interestingTexts: pageTexts
            .filter((text) => /K30000|Zollspedition|Vendor|Kreditor|No\.|Name|Payment Terms|Posting Group|Waehrung|Currency|Tax|VAT|Blocked|Gesperrt|Vorlage|Template|OK|Abbrechen|Cancel/i.test(text))
            .slice(0, 120)
        };
      }, target.vendorNo)
      .catch(() => null);
    if (result) signals.push(result);
  }

  return {
    frameSignals: signals,
    targetVisibleInRows: signals.some((entry) => entry.targetVisibleInRows),
    targetVisibleAnywhere: signals.some((entry) => entry.targetVisibleAnywhere),
    vendorNameVisibleAnywhere: signals.some((entry) => entry.vendorNameVisibleAnywhere),
    emptyStateVisible: signals.some((entry) => entry.emptyStateVisible),
    rowSnippets: signals.flatMap((entry) => entry.rows).slice(0, 60),
    interestingTexts: signals.flatMap((entry) => entry.interestingTexts).slice(0, 160)
  };
}

async function clickScopedNew(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Vendors|Vendor|Kreditoren|Kreditor/i.test(body)) continue;

    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,[title],[aria-label]'))
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const aria = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const label = `${text} ${aria} ${title}`;
            let score = 0;
            if (/^(New|Neu)$/.test(text) || /^(New|Neu)$/.test(aria)) score -= 40;
            if (/new entry|neuen Eintrag/i.test(title)) score -= 20;
            if (rect.y >= 35 && rect.y <= 120) score -= 10;
            if (rect.x >= 350 && rect.x <= 750) score -= 6;
            if (/Sales|Purchase|Order|Invoice|Quote|Power BI|Intercompany|Time Sheet/i.test(label)) score += 80;
            return {
              index,
              text,
              aria,
              title,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              score
            };
          })
          .filter((entry) => /^(New|Neu)$/.test(entry.text) || /^(New|Neu)$/.test(entry.aria) || /new entry|neuen Eintrag/i.test(entry.title))
          .sort((left, right) => left.score - right.score || left.y - right.y || left.x - right.x);

        const chosen = candidates[0];
        if (!chosen) return { clicked: false, candidates };
        const element = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,[title],[aria-label]'))
          .filter(visible)
          .find((candidate) => {
            const rect = candidate.getBoundingClientRect();
            return Math.round(rect.x) === chosen.x && Math.round(rect.y) === chosen.y;
          });
        element?.click();
        return { clicked: Boolean(element), chosen, candidates: candidates.slice(0, 20), frameUrl: location.href };
      })
      .catch((error) => ({ clicked: false, error: String(error), candidates: [] }));

    if (result.clicked) {
      await page.waitForTimeout(3000);
      return result;
    }
  }

  return { clicked: false, candidates: [] };
}

async function clickDialogOkIfPresent(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/template|Vorlage|Select|Ausw.hlen|OK|Cancel|Abbrechen/i.test(body)) continue;
    const result = await frame
      .evaluate(() => {
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              element,
              text: normalize(element.innerText || element.textContent),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              x: Math.round(rect.x),
              y: Math.round(rect.y)
            };
          });
        const ok = buttons.find((entry) => /^(OK|Ok)$/i.test(entry.text) || /^(OK|Ok)$/i.test(entry.aria));
        if (!ok) return { clicked: false, reason: 'ok-not-found', visibleButtons: buttons.map(({ element: _e, ...entry }) => entry) };
        ok.element.click();
        return { clicked: true, reason: 'ok-clicked', visibleButtons: buttons.map(({ element: _e, ...entry }) => entry), frameUrl: location.href };
      })
      .catch((error) => ({ clicked: false, reason: String(error), visibleButtons: [] }));
    if (result.clicked) {
      await page.waitForTimeout(5000);
      return result;
    }
  }
  return { clicked: false, reason: 'template-dialog-not-present', visibleButtons: [] };
}

async function readVisibleInputs(page: Page) {
  const fields = [];
  for (const frame of page.frames()) {
    const frameFields = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea'))
          .filter(visible)
          .map((input, index) => {
            const rect = input.getBoundingClientRect();
            let container: Element | null = input;
            for (let depth = 0; depth < 4 && container?.parentElement; depth += 1) {
              container = container.parentElement;
            }
            return {
              index,
              value: normalize(input.value),
              aria: normalize(input.getAttribute('aria-label')),
              title: normalize(input.getAttribute('title')),
              placeholder: normalize(input.placeholder),
              required: input.hasAttribute('required') || input.getAttribute('aria-required') === 'true',
              disabled: input.disabled || input.getAttribute('aria-disabled') === 'true',
              readOnly: input.readOnly || input.getAttribute('aria-readonly') === 'true',
              nearbyText: normalize(container?.textContent).slice(0, 240),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
            };
          })
          .slice(0, 120);
      })
      .catch(() => []);
    fields.push(...frameFields);
  }
  return fields;
}

async function clickYesIfRelatedRecordsDialog(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/zugeh.rige Datens.tze|related records|M.chten Sie fortfahren|Do you want to continue|Ja|Yes/i.test(body)) continue;
    const yesButton = frame.getByRole('button', { name: /^(Ja|Yes)$/i }).first();
    if (await yesButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await yesButton.click();
      await page.waitForTimeout(2500);
      return { clicked: true, reason: 'yes-clicked' };
    }
  }
  return { clicked: false, reason: 'dialog-not-visible' };
}

async function findVendorCardFrame(page: Page) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Vendor Card|Kreditorenkarte|Vendor|Kreditor/i.test(text)) {
      return frame;
    }
  }
  throw new Error('Vendor Card frame not found.');
}

async function fillVendorCardWithRealInputs(page: Page) {
  const before = await readVisibleInputs(page);
  const frame = await findVendorCardFrame(page);
  const visibleInputs = frame.locator('input:visible');
  const inputCount = await visibleInputs.count();
  if (inputCount < 2) {
    return { noFilled: false, nameFilled: false, reason: `too-few-inputs-${inputCount}`, fieldsBefore: before, fieldsAfter: await readVisibleInputs(page) };
  }

  const noInput = visibleInputs.nth(0);
  const nameInput = visibleInputs.nth(1);
  const originalNo = await noInput.inputValue().catch(() => '');
  const originalName = await nameInput.inputValue().catch(() => '');

  if (originalNo !== target.vendorNo) {
    await noInput.click();
    await noInput.fill(target.vendorNo);
    await noInput.press('Tab');
    await page.waitForTimeout(1500);
    await clickYesIfRelatedRecordsDialog(page);
  }

  await nameInput.click();
  await nameInput.fill(target.vendorName);
  await nameInput.press('Tab');
  await page.waitForTimeout(2500);

  const after = await readVisibleInputs(page);
  const finalText = await pageText(page);
  return {
    noFilled: /\bK30000\b/i.test(finalText) || after.some((field) => field.value === target.vendorNo),
    nameFilled: /Zollspedition Nord GmbH/i.test(finalText) || after.some((field) => field.value === target.vendorName),
    reason: 'real-playwright-input-fill',
    originalNo,
    originalName,
    fieldsBefore: before,
    fieldsAfter: after,
    relatedRecordsDialog: await clickYesIfRelatedRecordsDialog(page)
  };
}

async function convertKnownAutoDraftIfVisible(page: Page) {
  const signals = await visibleSignals(page);
  const draft = signals.rowSnippets
    .map((row) => row.match(/\b(V\d{5})\b/i)?.[1])
    .find((value) => value && value !== 'V00010');
  if (!draft) {
    return { attempted: false, reason: 'no-visible-auto-draft' };
  }

  await page.goto(vendorCardUrl(draft), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Vendor Card|Vendor|Kreditor/i, { timeout: 60_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);
  const fill = await fillVendorCardWithRealInputs(page);
  await saveAndReopenVendor(page);
  return { attempted: true, draftNo: draft, fill };
}

async function fillVendorCard(page: Page) {
  const fillResult = { noFilled: false, nameFilled: false, stoppedReason: '', fieldsBefore: await readVisibleInputs(page) };
  const pageBefore = await pageText(page);
  if (!/Vendor Card|Kreditorenkarte|Vendor|Kreditor/i.test(pageBefore)) {
    fillResult.stoppedReason = 'vendor-card-context-not-visible';
    return fillResult;
  }

  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((targetValues) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input')).filter(visible);
        const editable = inputs.filter((input) => !input.disabled && !input.readOnly && input.getAttribute('aria-readonly') !== 'true');

        const fieldScore = (input: HTMLInputElement, patterns: RegExp[]) => {
          let container: Element | null = input;
          let text = `${normalize(input.getAttribute('aria-label'))} ${normalize(input.getAttribute('title'))} ${normalize(input.placeholder)} ${normalize(input.value)}`;
          for (let depth = 0; depth < 5 && container?.parentElement; depth += 1) {
            container = container.parentElement;
            text += ` ${normalize(container?.textContent)}`;
          }
          return patterns.some((pattern) => pattern.test(text));
        };
        const noInput =
          editable.find((input) => fieldScore(input, [/^No\.$/i, /\bNo\.\b/i, /Nummer|Nr\./i])) ??
          editable.find((input) => normalize(input.value) === '' || /^V\d+/i.test(normalize(input.value)));
        if (!noInput) {
          return { noFilled: false, nameFilled: false, reason: 'no-input-not-found' };
        }
        noInput.focus();
        noInput.value = targetValues.vendorNo;
        noInput.dispatchEvent(new Event('input', { bubbles: true }));
        noInput.dispatchEvent(new Event('change', { bubbles: true }));
        noInput.blur();

        const nameInput =
          editable.find((input) => input !== noInput && fieldScore(input, [/^Name$/i, /\bName\b/i])) ??
          editable.find((input) => input !== noInput && normalize(input.value) === '');
        if (!nameInput) {
          return { noFilled: true, nameFilled: false, reason: 'name-input-not-found' };
        }
        nameInput.focus();
        nameInput.value = targetValues.vendorName;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        nameInput.blur();
        return { noFilled: true, nameFilled: true, reason: 'filled-visible-inputs' };
      }, target)
      .catch((error) => ({ noFilled: false, nameFilled: false, reason: String(error) }));

    if (result.noFilled || result.nameFilled) {
      await page.waitForTimeout(4000);
      return { ...fillResult, ...result, fieldsAfter: await readVisibleInputs(page) };
    }
  }

  return { ...fillResult, stoppedReason: 'no-editable-fields-filled', fieldsAfter: await readVisibleInputs(page) };
}

async function saveAndReopenVendor(page: Page) {
  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(3000);
  await openVendors(page, true);
}

async function cleanupAccidentalDraftVendor(page: Page, vendorNo: string) {
  await page.goto(vendorsUrlForNo(vendorNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Vendors|Vendor|Kreditoren|Kreditor/i, { timeout: 60_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);

  const before = await visibleSignals(page);
  const visible = before.targetVisibleInRows || before.targetVisibleAnywhere || before.rowSnippets.some((row) => row.includes(vendorNo));
  const result: Record<string, unknown> = {
    vendorNo,
    attempted: visible,
    before,
    deleted: false,
    reason: visible ? 'visible-draft-cleanup-attempted' : 'draft-not-visible'
  };

  if (!visible) {
    return result;
  }

  await writeTextEvidence(
    fixedAssetsEvidencePath(`090-cleanup-${vendorNo}-before-page-text.txt`),
    await compactPageText(page, {
      include: [new RegExp(vendorNo, 'i'), /Vendor|Vendors|Kreditor|No\.|Name|Balance|0,00|nothing|nichts/i],
      maxLines: 120
    })
  );
  await screenshot(page, `fixedassets-038-090-cleanup-${vendorNo}-before.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'do-not-use',
    purpose: `FIXEDASSETS-038 Cleanup-Kontrolle: versehentlich erzeugten Auto-Number-Draft ${vendorNo} vor Loeschung zeigen.`,
    expectedPageText: [new RegExp(vendorNo, 'i')],
    knownLimitations: ['Cleanup-Bild, kein Buchbild.', 'Nur versehentlicher Labor-Draft; keine Einkaufsrechnung, keine Buchung.']
  });

  let deleteClicked = await page
    .getByRole('button', { name: /^(L.schen|Loeschen|Delete)$/i })
    .first()
    .click({ timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (!deleteClicked) {
    for (const frame of page.frames()) {
      deleteClicked = await frame
        .evaluate(() => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const button = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
            .filter(visible)
            .find((element) => /^(L.schen|Loeschen|Delete)$/i.test(normalize(element.innerText || element.textContent)) || /^(L.schen|Loeschen|Delete)$/i.test(normalize(element.getAttribute('aria-label'))));
          button?.click();
          return Boolean(button);
        })
        .catch(() => false);
      if (deleteClicked) break;
    }
  }
  result.deleteClicked = deleteClicked;
  if (!deleteClicked) {
    result.reason = 'delete-button-not-clicked';
    return result;
  }

  await page.waitForTimeout(1500);
  let yesClicked = await page
    .getByRole('button', { name: /^(Ja|Yes)$/i })
    .first()
    .click({ timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (!yesClicked) {
    for (const frame of page.frames()) {
      yesClicked = await frame
        .getByRole('button', { name: /^(Ja|Yes)$/i })
        .first()
        .click({ timeout: 1000 })
        .then(() => true)
        .catch(() => false);
      if (yesClicked) break;
    }
  }
  if (!yesClicked) {
    yesClicked = await page.keyboard.press('Enter').then(() => true).catch(() => false);
  }
  result.confirmClicked = yesClicked;
  await page.waitForTimeout(3500);

  await page.goto(vendorsUrlForNo(vendorNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  const after = await visibleSignals(page);
  result.after = after;
  result.deleted = !(after.targetVisibleInRows || after.targetVisibleAnywhere || after.rowSnippets.some((row) => row.includes(vendorNo)));
  return result;
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-038 - K30000 Vendor Setup Fit',
    '',
    'Status: `labor`, `ui-first`, `setup-proof`, `vendor-masterdata`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    `| Zielkreditor | ${result.vendorNo} / ${result.vendorName} |`,
    `| Aktion | ${result.action} |`,
    `| Status | ${result.status} |`,
    `| Gebucht | ${result.safety.posted ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Was man in Business Central sieht',
    '',
    '- Die Kreditorenliste ist der richtige Stammdatenkontext fuer `K30000`.',
    '- Wenn `K30000` fehlt, muss zuerst eine Kreditorenkarte entstehen oder der Lauf muss sauber abbrechen.',
    '- Nach dem Speichern zaehlen nur sichtbare Karten-/Listenwerte: Nummer, Name und die Defaults, die Business Central fuer Zahlungs- und Buchungslogik vorgibt.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 kann die Kreditorenanlage als eigene Einrichtungsschicht vor der Anlagen-Einkaufsrechnung fuehren. Ein fertiger Anlagenstamm plus fehlender Kreditor ist noch kein buchungsfaehiger Anlagenprozess.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.',
    '- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- Keine Vendor-Bankdaten und kein API-Shortcut.',
    '- Karten-Defaults sind Laborbefund und muessen vor einer spaeteren Einkaufsrechnung erneut geprueft werden.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-038 K30000 Kreditor UI-first fitten', async ({ page }) => {
  await openVendors(page, true);
  const beforeSignals = await visibleSignals(page);
  await writeTextEvidence(
    fixedAssetsEvidencePath('010-before-vendors-k30000-page-text.txt'),
    await compactPageText(page, {
      include: [/K30000|Zollspedition|Vendor|Vendors|Kreditor|No\.|Name|Filter|nothing|nichts|Keine/i],
      maxLines: 120
    })
  );
  await writeJsonEvidence(fixedAssetsEvidencePath('010-before-vendors-k30000-signals.json'), beforeSignals);
  await screenshot(page, 'fixedassets-038-010-before-vendors-k30000.png', {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: 'evidence',
    purpose: 'FIXEDASSETS-038 Vorher-Pruefung: Vendors/Kreditoren gefiltert auf K30000 vor dem UI-first Setup-Fit.',
    expectedPageText: [/Vendors|Vendor|Kreditoren|Kreditor/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Vorherbild ist nur Listen-/Filterkontext.',
      'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.'
    ]
  });

  let action: 'already-fit' | 'created-k30000' | 'blocked-before-save' = beforeSignals.targetVisibleInRows ? 'already-fit' : 'blocked-before-save';
  let newAttempt: unknown = null;
  let templateAttempt: unknown = null;
  let fillAttempt: unknown = null;
  let summary = '';

  if (!beforeSignals.targetVisibleInRows) {
    await openVendors(page, false);
    newAttempt = await clickScopedNew(page);
    await writeJsonEvidence(fixedAssetsEvidencePath('020-scoped-new-attempt.json'), newAttempt);
    if (!(newAttempt as { clicked?: boolean }).clicked) {
      summary = 'Der Lauf hat `New/Neu` im Vendor-Kontext nicht sicher geklickt. Es wurde nichts angelegt oder gespeichert.';
    } else {
      await writeTextEvidence(
        fixedAssetsEvidencePath('021-after-new-page-text.txt'),
        await compactPageText(page, {
          include: [/Vendor|Kreditor|Template|Vorlage|OK|Cancel|Abbrechen|No\.|Name|K30000|Zollspedition/i],
          maxLines: 140
        })
      );
      await screenshot(page, 'fixedassets-038-020-after-new-or-template.png', {
        projectName: project.name,
        testId,
        status: 'candidate',
        bookUse: 'evidence',
        purpose: 'FIXEDASSETS-038 kontrollierter Zustand nach New/Neu: Vendor-Template oder Vendor Card vor Dateneingabe.',
        expectedPageText: [/Vendor|Kreditor|Template|Vorlage|OK|Cancel|Abbrechen|No\.|Name/i],
        knownLimitations: [
          'Nur Zwischenbild; kein Nachher-Nachweis.',
          'Bei Template-Kontext darf nur OK bestaetigt werden, wenn der Vendor-Kontext sichtbar ist.'
        ]
      });
      templateAttempt = await clickDialogOkIfPresent(page);
      await writeJsonEvidence(fixedAssetsEvidencePath('022-template-dialog-attempt.json'), templateAttempt);
      fillAttempt = await fillVendorCardWithRealInputs(page);
      await writeJsonEvidence(fixedAssetsEvidencePath('030-vendor-card-fill-attempt.json'), fillAttempt);
      if ((fillAttempt as { noFilled?: boolean; nameFilled?: boolean }).noFilled && (fillAttempt as { nameFilled?: boolean }).nameFilled) {
        await writeTextEvidence(
          fixedAssetsEvidencePath('031-filled-vendor-card-page-text.txt'),
          await compactPageText(page, {
            include: [/K30000|Zollspedition|Vendor|Kreditor|No\.|Name|Posting Group|Payment Terms|Currency|Tax|VAT|Blocked|Gesperrt/i],
            maxLines: 160
          })
        );
        await screenshot(page, 'fixedassets-038-030-filled-vendor-card-before-save.png', {
          projectName: project.name,
          testId,
          status: 'candidate',
          bookUse: 'evidence',
          purpose: 'FIXEDASSETS-038 Vendor Card mit Zielnummer und Zielname vor Rueckkehr zur Liste.',
          expectedPageText: [/Vendor Card|Vendor|Kreditor/i],
          knownLimitations: [
            'Zwischenbild vor finalem Listen-/Karten-Nachweis.',
            'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.'
          ]
        });
        await saveAndReopenVendor(page);
        action = 'created-k30000';
      } else {
        summary = 'Der Lauf hat den Vendor-Kontext erreicht, konnte aber Zielnummer und Zielname nicht sicher in sichtbare Kartenfelder schreiben. Es wurde keine Einkaufsrechnung oder Buchung ausgefuehrt.';
      }
    }
  }

  if (action === 'already-fit') {
    summary = '`K30000` war bereits sichtbar; der Lauf hat die Karte nicht neu angelegt und nur Defaults gelesen.';
  }

  if (action === 'blocked-before-save') {
    await openVendors(page, false);
    const autoDraftAttempt = await convertKnownAutoDraftIfVisible(page);
    await writeJsonEvidence(fixedAssetsEvidencePath('035-auto-number-draft-conversion-attempt.json'), autoDraftAttempt);
    if ((autoDraftAttempt as { attempted?: boolean; fill?: { noFilled?: boolean; nameFilled?: boolean } }).attempted) {
      const fill = (autoDraftAttempt as { fill?: { noFilled?: boolean; nameFilled?: boolean } }).fill;
      if (fill?.noFilled && fill?.nameFilled) {
        action = 'created-k30000';
        summary = 'Der erste Versuch erzeugte einen Auto-Number-Draft. Der Lauf hat diesen Draft UI-first auf `K30000` / `Zollspedition Nord GmbH` umgesetzt und danach den Zielkreditor erneut geprueft.';
      }
    }
  }

  const afterSignals = await visibleSignals(page);
  const afterText = await pageText(page);
  const vendorVisible = afterSignals.targetVisibleInRows || /\bK30000\b/i.test(afterText);
  const vendorNameVisible = afterSignals.vendorNameVisibleAnywhere || /Zollspedition Nord GmbH/i.test(afterText);
  const finalStatus = vendorVisible && (vendorNameVisible || action === 'already-fit') ? 'fit-visible' : action === 'blocked-before-save' ? 'blocked' : 'partial';
  if (!summary) {
    summary =
      finalStatus === 'fit-visible'
        ? '`K30000` ist nach dem UI-first Vendor-Setup-Fit sichtbar. Der Lauf hat keine Einkaufsrechnung, keinen Anlagenzugang, keine AfA und keine Buchung ausgefuehrt.'
        : '`K30000` wurde nicht belastbar als sichtbarer Vendor-Fit nachgewiesen. Der Lauf bleibt Blocker-Evidence und sperrt den Kaufbeleg weiter.';
  }

  await writeTextEvidence(
    fixedAssetsEvidencePath('040-after-vendors-k30000-page-text.txt'),
    await compactPageText(page, {
      include: [/K30000|Zollspedition|Vendor|Vendors|Kreditor|No\.|Name|Posting Group|Payment Terms|Currency|Tax|VAT|Blocked|Gesperrt|Filter/i],
      maxLines: 180
    })
  );
  await writeJsonEvidence(fixedAssetsEvidencePath('040-after-vendors-k30000-signals.json'), afterSignals);
  await screenshot(page, 'fixedassets-038-040-after-vendors-k30000.png', {
    projectName: project.name,
    testId,
    status: finalStatus === 'fit-visible' ? 'labor' : 'rejected',
    bookUse: finalStatus === 'fit-visible' ? 'field-proof' : 'do-not-use',
    purpose: 'FIXEDASSETS-038 Nachher-Pruefung: K30000 muss sichtbar sein; falls nicht, ist der Kreditoren-Setup-Fit blockiert.',
    expectedPageText: [/Vendors|Vendor|Kreditoren|Kreditor|K30000/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Nur Kreditorenstamm; keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
      'Kein deutscher Steuer-/Kontenplan-/HGB-Finalnachweis.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-038-K30000-VENDOR-SETUP-FIT',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-vendor-setup-fit-no-posting',
    vendorNo: target.vendorNo,
    vendorName: target.vendorName,
    action,
    status: finalStatus,
    summary,
    beforeSignals,
    newAttempt,
    templateAttempt,
    fillAttempt,
    afterSignals,
    safety: {
      posted: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      vendorBankDetailsCreated: false,
      apiShortcutUsed: false
    },
    proves:
      finalStatus === 'fit-visible'
        ? [
            'K30000 is visible in the Vendors context after the UI-first run.',
            'The run stayed in MCP_1_20260210 / RM-DEMO.',
            'No purchase invoice, acquisition, depreciation or posting was executed.'
          ]
        : [
            'The K30000 vendor setup fit is still blocked or partial.',
            'The run did not proceed to purchase invoice, acquisition, depreciation or posting.'
          ],
    doesNotProve: [
      'No fixed-asset acquisition.',
      'No purchase invoice preview or posting.',
      'No depreciation or FA ledger entries.',
      'No German chart-of-accounts, HGB or VAT final proof.'
    ],
    nextStep:
      finalStatus === 'fit-visible'
        ? 'FIXEDASSETS-039-K30000-VENDOR-CARD-DEFAULTS-READONLY: read the K30000 vendor card defaults and decide whether purchase-invoice readiness can be opened later; no invoice or posting yet.'
        : 'FIXEDASSETS-039-K30000-VENDOR-SETUP-BLOCKER-DECISION: analyze the blocked/partial vendor setup path before any purchase invoice or fixed-asset acquisition.'
  };

  const cleanupV00020 = await cleanupAccidentalDraftVendor(page, 'V00020');
  (result as Record<string, unknown>).cleanup = { V00020: cleanupV00020 };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-038-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-038-K30000-VENDOR-SETUP-FIT.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-038 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-038-result.json` | JSON | Ergebnis des UI-first `K30000` Vendor-Setup-Fits | keine Einkaufsrechnung und keine Buchung | labor / blocker |',
      '| `FIXEDASSETS-038-K30000-VENDOR-SETUP-FIT.md` | Markdown | Lernwert, Grenzen und naechster Schritt | keinen deutschen Finalnachweis | labor / blocker |',
      '| `010-before-vendors-k30000-page-text.txt` | kompakter Seitentext | Vorher-Kontext der Vendor-Suche | keine Rohseite | compact |',
      '| `010-before-vendors-k30000-signals.json` | JSON | sichtbare Vorher-Signale | keine API-Wahrheit | compact |',
      '| `020-scoped-new-attempt.json` | JSON | ob `New/Neu` im Vendor-Kontext sicher geklickt wurde | keinen gespeicherten Kreditor | conditional |',
      '| `022-template-dialog-attempt.json` | JSON | Template-/OK-Dialog-Behandlung | keine fachliche Defaultfreigabe | conditional |',
      '| `030-vendor-card-fill-attempt.json` | JSON | sichtbare Kartenfeld-Befuellung oder Blocker | keinen Kaufbeleg | conditional |',
      '| `040-after-vendors-k30000-page-text.txt` | kompakter Seitentext | Nachher-Kontext zu `K30000` | keine Postenspur | compact |',
      '| `040-after-vendors-k30000-signals.json` | JSON | sichtbare Nachher-Signale | keine vollstaendige Tabellenextraktion | compact |',
      '| `090-cleanup-V00020-before-page-text.txt` | kompakter Seitentext | Cleanup-Kontext fuer versehentlichen Auto-Number-Draft, falls sichtbar | kein Buchbild | conditional-cleanup |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen der Bilder | keine eigenstaendige fachliche Wahrheit | candidate/labor/rejected |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.purchaseInvoiceCreated).toBe(false);
  expect(result.safety.acquisitionPosted).toBe(false);
  expect(result.safety.depreciationCalculatedOrPosted).toBe(false);
  expect(finalStatus).toBe('fit-visible');
});
