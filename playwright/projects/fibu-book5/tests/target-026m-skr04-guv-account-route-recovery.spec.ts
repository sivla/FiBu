import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-026M-SKR04-GUV-ACCOUNT-ROUTE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-026m-skr04-guv-account-route-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-026M-RECOVERY-result.json');
const CHART_OF_ACCOUNTS_PAGE_ID = 16;
const GL_ACCOUNT_CARD_PAGE_ID = 17;

const targetAccounts = [
  {
    no: '4400',
    name: 'Umsatzerloese Inland 19 Prozent',
    expectedType: 'GuV',
    purpose: 'SKR04-Umsatzerloeskonto fuer spaetere General Posting Setup Sales Account'
  },
  {
    no: '5400',
    name: 'Wareneingang / Materialaufwand',
    expectedType: 'GuV',
    purpose: 'SKR04-Wareneingangs-/Materialaufwandskonto fuer spaetere Einkaufskostenlogik'
  }
];

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function literalPattern(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function buildPlaythruUrl(pageId: number, filter?: string) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  if (filter) url.searchParams.set('filter', filter);
  return url;
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function containsForbiddenDialog(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Delete\?|Loeschen\?|L.schen\?|Apply\?|Anwenden\?/i.test(
    text
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function assertSafeContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  const text = await safeText(page);
  expect(containsForbiddenDialog(text), 'Keine Buchungs-, Loesch-, Apply- oder Preview-Dialoge erlaubt').toBe(false);
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (expected.test(bodyText)) return { frame, bodyText: clean(bodyText) };
  }
  throw new Error(`Kein BC-Frame mit ${expected} gefunden.`);
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = path.join(EVIDENCE_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [
      /Sachkontokarte|G\/L Account|Kontenplan|Chart of Accounts|Nr\.|No\.|Name|GuV\/Bilanz|Income\/Balance|GuV|Bilanz|4400|5400|Umsatzerloese|Wareneingang|Buchung|Edit|Bearbeiten|Gespeichert|Saved/i
    ],
    maxLines: 180,
    maxLineLength: 240
  });
  const text = await safeText(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact: clean(compact),
    visible: {
      page17: /page=17/i.test(page.url()),
      account4400: /4400[\s\S]{0,500}Umsatzerloese/i.test(text),
      account5400: /5400[\s\S]{0,500}Wareneingang/i.test(text),
      guvFor4400: /4400[\s\S]{0,500}(GuV|Income Statement)/i.test(text),
      guvFor5400: /5400[\s\S]{0,500}(GuV|Income Statement)/i.test(text)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, snapshot.compact || text.slice(0, 7000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: /page=17/i.test(page.url()) ? 'Sachkontokarte / G/L Account Card' : 'Kontenplan / Chart of Accounts',
    step,
    status: 'universaarl-guv-account-route-recovery',
    visibleLearning: [
      'Umsatz- und Aufwandkonten muessen im Kontenplan als GuV-Konten sichtbar sein.',
      'Ein sichtbares Konto ist noch kein fachlich korrektes Konto, wenn GuV/Bilanz falsch steht.',
      'Dieser Case bleibt auf Sachkonto-Feldkorrektur beschraenkt.'
    ],
    importantUi: ['Sachkontokarte', 'GuV/Bilanz', 'Kontoart', 'Kontenplan-Reopen-Proof'],
    internallyProves: snapshot.visible.guvFor4400 || snapshot.visible.guvFor5400 ? 'Ein Zielkonto ist als GuV sichtbar.' : 'Kontext oder Blockerzustand; kein fertiger GuV-Beweis.',
    doesNotProve: ['Kein VAT Setup.', 'Keine Posting Groups.', 'Keine Stammdaten.', 'Kein Beleg, keine Preview, keine Buchung.'],
    finalScreenshotStatus: 'universaarl-foundation-evidence',
    ...extra
  });
  return snapshot;
}

async function firstVisible(locator: Locator, timeout = 800) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible({ timeout }).catch(() => false)) return candidate;
  }
  return undefined;
}

async function clickAction(frame: Frame, name: RegExp) {
  for (const role of ['button', 'menuitem'] as const) {
    const action = await firstVisible(frame.getByRole(role, { name }), 1000);
    if (action) {
      await action.click({ force: true });
      return true;
    }
  }
  const textAction = await firstVisible(frame.getByText(name), 1000);
  if (textAction) {
    await textAction.click({ force: true });
    return true;
  }
  return false;
}

async function openChartOfAccounts(page: Page) {
  await page.goto(buildPlaythruUrl(CHART_OF_ACCOUNTS_PAGE_ID).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertSafeContext(page);
}

async function openGlAccountCard(page: Page, accountNo: string, accountName: string) {
  const filter = `'G/L Account'.'No.' IS '${accountNo}'`;
  await page.goto(buildPlaythruUrl(GL_ACCOUNT_CARD_PAGE_ID, filter).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await assertSafeContext(page);
  const { frame, bodyText } = await findBcFrame(page, new RegExp(`${accountNo}|${accountName}|Sachkontokarte|G/L Account`, 'i'));
  return { frame, bodyText };
}

async function activateEditMode(page: Page, frame: Frame) {
  const before = await collectActionCandidates(frame);
  const clicked = await clickAction(frame, /^Bearbeiten$|^Edit$/i);
  if (clicked) {
    await page.waitForTimeout(1400);
    return { method: 'explicit-edit-action', clicked, before, after: await collectActionCandidates(frame) };
  }
  await page.keyboard.press('Control+Shift+E').catch(() => undefined);
  await page.waitForTimeout(1400);
  return { method: 'keyboard-control-shift-e', clicked, before, after: await collectActionCandidates(frame) };
}

async function collectActionCandidates(frame: Frame) {
  return frame.evaluate(() => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    return Array.from(document.querySelectorAll<HTMLElement>('button,a,[role="button"],[aria-label],[title]'))
      .filter((element) => visible(element))
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          text: normalize(element.innerText || element.textContent),
          aria: normalize(element.getAttribute('aria-label')),
          title: normalize(element.getAttribute('title')),
          role: normalize(element.getAttribute('role')),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })
      .filter((entry) => /edit|bearbeit|stift|pencil|expand|maxim|open|oeffnen|öffnen/i.test([entry.text, entry.aria, entry.title].join(' ')))
      .slice(0, 40);
  });
}

async function fieldDiagnostics(frame: Frame, captions: string[]) {
  return frame.evaluate((captionValues) => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const escapeRegExpLocal = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select'))
      .filter((input) => visible(input))
      .map((input, index) => {
        const rect = input.getBoundingClientRect();
        return {
          index,
          value: normalize((input as HTMLInputElement).value),
          aria: normalize(input.getAttribute('aria-label')),
          title: normalize(input.getAttribute('title')),
          disabled: input.disabled,
          readOnly: input instanceof HTMLInputElement ? input.readOnly : false,
          editable: !input.disabled && !(input instanceof HTMLInputElement && input.readOnly),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect
        };
      });
    const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,a,[role="button"],[aria-label],[title],span,div,label'))
      .filter((element) => visible(element))
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          text: normalize(element.innerText || element.textContent),
          aria: normalize(element.getAttribute('aria-label')),
          title: normalize(element.getAttribute('title')),
          role: normalize(element.getAttribute('role')),
          tagName: element.tagName,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect
        };
      });

    return captionValues.map((caption) => {
      const exactCaption = new RegExp(`^${escapeRegExpLocal(caption)}$`, 'i');
      const labels = buttons
        .filter((entry) => exactCaption.test(entry.text) || exactCaption.test(entry.aria) || exactCaption.test(entry.title))
        .sort((left, right) => left.y - right.y || left.x - right.x);
      const label = labels[0];
      const controls = label
        ? inputs
            .filter((input) => Math.abs(input.rect.y - label.rect.y) <= 14)
            .filter((input) => input.rect.x >= label.rect.x)
            .sort((left, right) => left.x - right.x)
            .slice(0, 10)
        : [];
      const nearbyButtons = label
        ? buttons
            .filter((button) => Math.abs(button.rect.y - label.rect.y) <= 16)
            .filter((button) => button.rect.x >= label.rect.x)
            .sort((left, right) => left.x - right.x)
            .slice(0, 12)
        : [];
      return {
        caption,
        label: label ? { text: label.text, aria: label.aria, title: label.title, x: label.x, y: label.y, width: label.width, height: label.height } : null,
        controls: controls.map((input) => ({
          index: input.index,
          value: input.value,
          aria: input.aria,
          title: input.title,
          editable: input.editable,
          disabled: input.disabled,
          readOnly: input.readOnly,
          x: input.x,
          y: input.y,
          width: input.width,
          height: input.height
        })),
        nearbyButtons: nearbyButtons.map((button) => ({
          index: button.index,
          text: button.text,
          aria: button.aria,
          title: button.title,
          role: button.role,
          tagName: button.tagName,
          x: button.x,
          y: button.y,
          width: button.width,
          height: button.height
        }))
      };
    });
  }, captions);
}

async function setGuvOnCard(page: Page, frame: Frame) {
  const before = await fieldDiagnostics(frame, ['Nr.', 'Name', 'GuV/Bilanz', 'Kontoart']);
  const attempts: Array<Record<string, unknown>> = [{ step: 'field-diagnostics-before', before }];
  const targetField = before.find((entry) => entry.caption === 'GuV/Bilanz');
  const editable = targetField?.controls.find((control) => control.editable);
  if (editable) {
    const input = frame.locator('input,textarea,select').nth(editable.index);
    await input.click({ force: true });
    await input.fill('GuV').catch(async () => {
      await page.keyboard.press('Control+A').catch(() => undefined);
      await page.keyboard.insertText('GuV');
    });
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab').catch(() => undefined);
    await page.waitForTimeout(1600);
    attempts.push({ step: 'editable-control-fill', index: editable.index });
  } else if (targetField?.label) {
    const clickPoint = {
      x: targetField.label.x + Math.max(targetField.label.width + 40, 260),
      y: targetField.label.y + Math.max(8, Math.round(targetField.label.height / 2))
    };
    await page.mouse.click(clickPoint.x, clickPoint.y);
    await page.waitForTimeout(500);
    await page.keyboard.press('Alt+ArrowDown').catch(() => undefined);
    await page.waitForTimeout(600);
    const guvOption = page.getByText(/^GuV$|^Income Statement$/i).last();
    if (await guvOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await guvOption.click({ force: true });
      attempts.push({ step: 'field-row-click-visible-guv-option', clickPoint });
    } else {
      await page.keyboard.press('ArrowUp').catch(() => undefined);
      await page.keyboard.press('Enter').catch(() => undefined);
      attempts.push({ step: 'field-row-click-keyboard-fallback', clickPoint });
    }
    await page.waitForTimeout(1600);
    await page.keyboard.press('Tab').catch(() => undefined);
  } else {
    attempts.push({ step: 'no-guv-bilanz-field-label-found' });
  }

  const after = await fieldDiagnostics(frame, ['Nr.', 'Name', 'GuV/Bilanz', 'Kontoart']);
  attempts.push({ step: 'field-diagnostics-after', after });
  const afterTargetField = after.find((entry) => entry.caption === 'GuV/Bilanz');
  const fieldValues = [
    ...(afterTargetField?.controls.map((control) => control.value) ?? []),
    ...(afterTargetField?.nearbyButtons.map((button) => button.text) ?? [])
  ];
  return {
    changedVisibleOnCard: fieldValues.some((value) => /^(GuV|Income Statement)$|GuV\/Bilanz\s+GuV/i.test(String(value))),
    attempts
  };
}

async function recoverAccount(page: Page, target: (typeof targetAccounts)[number]) {
  const steps: Array<Record<string, unknown>> = [];
  const { frame, bodyText } = await openGlAccountCard(page, target.no, target.name);
  const contextOk = literalPattern(target.no).test(bodyText) && literalPattern(target.name).test(bodyText);
  steps.push({ step: 'open-filtered-card', contextOk, bodyText: bodyText.slice(0, 1200), url: sanitizeEvidenceUrl(page.url()) });
  if (!contextOk) {
    return { status: 'blocked', reason: 'Filtered G/L Account Card did not show the target account number and name.', steps };
  }

  await captureState(page, `target-026m-recovery-${target.no}-010-card-before`, `Before GuV/Bilanz recovery for ${target.no}.`, { targetAccount: target });
  const editMode = await activateEditMode(page, frame);
  steps.push({ step: 'activate-edit-mode', editMode });
  await captureState(page, `target-026m-recovery-${target.no}-020-card-editmode-before-field`, `Edit mode / field context before GuV/Bilanz change for ${target.no}.`, {
    targetAccount: target,
    editMode
  });

  const setResult = await setGuvOnCard(page, frame);
  steps.push({ step: 'set-guv-on-card', setResult });
  await captureState(page, `target-026m-recovery-${target.no}-030-card-after-field-attempt`, `After GuV/Bilanz field attempt for ${target.no}.`, {
    targetAccount: target,
    setResult
  });

  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(1800);
  await openChartOfAccounts(page);
  await captureState(page, `target-026m-recovery-${target.no}-040-chart-reopen-proof`, `Chart of Accounts reopen proof for ${target.no}.`, {
    targetAccount: target,
    setResult
  });
  const text = await safeText(page);
  const rowPattern = new RegExp(`${target.no}[\\s\\S]{0,500}${target.name}[\\s\\S]{0,500}(GuV|Income Statement)[\\s\\S]{0,500}Buchung`, 'i');
  const reversePattern = new RegExp(`${target.name}[\\s\\S]{0,500}${target.no}[\\s\\S]{0,500}(GuV|Income Statement)[\\s\\S]{0,500}Buchung`, 'i');
  const visibleAsGuv = rowPattern.test(text) || reversePattern.test(text);
  return visibleAsGuv
    ? { status: 'observed', reason: `${target.no} ${target.name} ist nach Reopen als GuV/Buchung sichtbar.`, steps }
    : { status: 'blocked', reason: `${target.no} ${target.name} ist nach Reopen nicht als GuV/Buchung sichtbar.`, steps };
}

test('TARGET-026M recovery sets or proves 4400 and 5400 as GuV accounts', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const accountResults = [];
  for (const target of targetAccounts) {
    accountResults.push({ targetAccount: target, accountResult: await recoverAccount(page, target) });
  }

  const blockedBy = accountResults.filter((entry) => entry.accountResult.status !== 'observed').map((entry) => entry.accountResult.reason);
  const resultStatus = blockedBy.length === 0 ? 'observed' : 'blocked';
  const nextStepDecisionCard = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-026M-SKR04-GUV-ACCOUNT-ROUTE-RECOVERY',
    lastEvidenceSummary: 'TARGET-026M showed 4400 and 5400 visible but still Bilanz/Buchung after list-cell and stale card-fallback attempts.',
    isPlannedNextCaseStillSensible: true,
    reason: 'VAT and Posting Groups must wait until the two GuV starter accounts are actually GuV/Buchung.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
        status: resultStatus === 'observed' ? 'ready-next' : 'needs-ui-discovery-first',
        reason: resultStatus === 'observed' ? 'Starter account types can be checked as a set.' : 'GuV/Bilanz card route remains blocked.'
      },
      {
        caseId: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
        status: resultStatus === 'observed' ? 'ready-after-current' : 'needs-setup-first',
        reason: 'VAT setup depends on correct G/L account foundation.'
      },
      {
        caseId: 'TARGET-028-CUSTOMER-VENDOR-ITEM-MASTERDATA',
        status: 'needs-setup-first',
        reason: 'Master data waits for posting groups, VAT setup and dimensions.'
      },
      {
        caseId: 'TARGET-029-FIRST-SALES-PURCHASE-DRAFT-GATE',
        status: 'needs-setup-first',
        reason: 'Document drafts need foundation setup.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase:
      resultStatus === 'observed'
        ? 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT'
        : 'TARGET-026M-SKR04-GUV-ACCOUNT-ROUTE-RECOVERY-FOLLOWUP',
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'The next best step is a full chart-of-accounts checkpoint before VAT/posting setup.'
        : 'The GuV field route still needs focused diagnostics before more setup.',
    risksBeforeNextCase:
      resultStatus === 'observed'
        ? ['1200 remains a wrong bank-path legacy account and must stay blocked for bank/payment/VAT/posting use.']
        : ['4400/5400 still cannot be used for posting setup.'],
    requiredPreparation:
      resultStatus === 'observed'
        ? ['Checkpoint all starter accounts and types.']
        : ['Use Page Inspection or AL/object analysis to identify the exact GuV/Bilanz control.']
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    source: 'playwright-controlled-setup-recovery',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    actionsTaken: [
      'Opened G/L Account Card page 17 with filter for each target account.',
      'Activated edit mode where available.',
      'Diagnosed and attempted GuV/Bilanz field route.',
      'Reopened Chart of Accounts page 16 for proof.'
    ],
    actionsNotTaken: ['No VAT setup', 'No posting groups', 'No master data', 'No document draft', 'No Preview Posting', 'No Posting', 'No API shortcut'],
    setupChanged: resultStatus === 'observed',
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved:
      resultStatus === 'observed'
        ? [
            `Instanz ${EXPECTED_INSTANCE} und Company ${TARGET_COMPANY} wurden kontrolliert.`,
            '4400 Umsatzerloese Inland 19 Prozent ist nach Reopen als GuV/Buchung sichtbar.',
            '5400 Wareneingang / Materialaufwand ist nach Reopen als GuV/Buchung sichtbar.'
          ]
        : [`Instanz ${EXPECTED_INSTANCE} und Company ${TARGET_COMPANY} wurden kontrolliert.`, 'Sachkontokarten-/Feldroute wurde diagnostiziert.'],
    notProved: [
      'Kein vollstaendiger Kontenplan.',
      'Keine SKR04- oder Steuerberaterfreigabe.',
      'Keine VAT Posting Setup Zeile.',
      'Keine Posting Groups.',
      'Keine Stammdatenanlage.',
      'Kein Dokument, keine Preview, keine Buchung.'
    ],
    changedFiles: [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/`],
    screenshots: accountResults.flatMap(({ targetAccount }) => [
      `target-026m-recovery-${targetAccount.no}-010-card-before.png`,
      `target-026m-recovery-${targetAccount.no}-020-card-editmode-before-field.png`,
      `target-026m-recovery-${targetAccount.no}-030-card-after-field-attempt.png`,
      `target-026m-recovery-${targetAccount.no}-040-chart-reopen-proof.png`
    ]),
    evidenceRefs: [],
    warnings: ['1200 Bank Saarland remains blocked for bank/payment/VAT/posting use.'],
    blockedBy,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    flags: {
      setupChangeAttempted: true,
      noVatSetupChange: true,
      noPostingGroupChange: true,
      noMasterData: true,
      noDocumentOrDraft: true,
      noPreview: true,
      noPost: true,
      noApiShortcut: true,
      noBookChange: true
    },
    accountResults,
    nextStepDecisionCard,
    nextCase: nextStepDecisionCard.selectedNextCase,
    reason:
      resultStatus === 'observed'
        ? 'GuV/Bilanz recovery succeeded for both target starter accounts.'
        : `GuV/Bilanz recovery remains blocked: ${blockedBy.join('; ')}`
  };

  result.evidenceRefs = [
    ...result.screenshots,
    ...result.screenshots.map((name) => name.replace(/\.png$/i, '.screenshot.json')),
    ...result.screenshots.map((name) => name.replace(/\.png$/i, '.snapshot.json')),
    ...result.screenshots.map((name) => name.replace(/\.png$/i, '.txt')),
    'TARGET-026M-RECOVERY-result.json'
  ];

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-026M SKR04 GuV Account Route Recovery',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Zielkonten',
      '',
      ...accountResults.map((entry) => `- ${entry.targetAccount.no} ${entry.targetAccount.name}: ${entry.accountResult.status} - ${entry.accountResult.reason}`),
      '',
      '## Grenzen',
      '',
      '- Kein VAT Setup.',
      '- Keine Posting Groups.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Kein API Shortcut.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
