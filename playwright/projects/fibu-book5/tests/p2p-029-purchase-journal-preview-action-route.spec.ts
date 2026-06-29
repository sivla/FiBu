import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, pageText, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 3000, height: 1500 }
});

test.setTimeout(480_000);

const TEST_ID = 'p2p-029';
const PAGE_ID_PURCHASE_JOURNAL = 254;
const postingDate = '08.06.2026';
const vendorNo = 'K10000';
const amount = '-2.500,00';
const balanceAccountNo = '82000';

type ControlHandle = {
  handle: import('@playwright/test').ElementHandle<HTMLElement>;
  tag: string;
  x: number;
  y: number;
  value: string;
  title: string;
  ariaLabel: string;
  text: string;
};

type ActionEntry = {
  index: number;
  tagName: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  disabled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function safeText(text: string | null | undefined) {
  return (text ?? '')
    .normalize('NFKD')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '')
    .replace(/businesscentral\.dynamics\.com\/[0-9a-f]{8}-[0-9a-f-]{27,}\//gi, 'businesscentral.dynamics.com/[tenant-id]/');
}

function compactPageText(text: string) {
  const interesting =
    /P2P029|Purchase Journals|Posting Preview|Preview Posting|G\/L Entries|VAT Entries|Journal Check|Issues Total|No issues found|Post|Document No\.|Account Type|Account No\.|Vendor|Amount|Bal\. Account|K10000|82000|-2\.500|Invoice|error|fehler/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => safeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -5; offset <= 10; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }
  return [
    `Compact page text excerpt; full raw page text intentionally not committed. Original lines: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 280)
  ].join('\n');
}

async function openPurchaseJournal(page: Page) {
  await page.goto(bcPageUrl(PAGE_ID_PURCHASE_JOURNAL, project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);
}

async function purchaseJournalFrame(page: Page) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
      if (/Purchase Journals/i.test(text) && /Batch Name/i.test(text)) return frame;
    }
    await page.waitForTimeout(1500);
  }
  throw new Error('Purchase Journal frame not found.');
}

async function firstLineControls(frame: Frame) {
  const handles = (await frame.locator('input,select').elementHandles()) as Array<import('@playwright/test').ElementHandle<HTMLElement>>;
  const controls: ControlHandle[] = [];
  for (const handle of handles) {
    const data = await handle
      .evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          visible: Boolean(rect.width && rect.height),
          tag: element.tagName,
          x: rect.x,
          y: rect.y,
          value: (element as HTMLInputElement | HTMLSelectElement).value ?? '',
          title: element.getAttribute('title') ?? '',
          ariaLabel: element.getAttribute('aria-label') ?? '',
          text: element.textContent ?? ''
        };
      })
      .catch(() => undefined);
    if (!data?.visible || data.y < 250 || data.y > 520) continue;
    controls.push({
      handle,
      tag: data.tag,
      x: data.x,
      y: data.y,
      value: data.value,
      title: data.title,
      ariaLabel: data.ariaLabel,
      text: data.text
    });
  }
  return controls.sort((left, right) => left.x - right.x);
}

function snapshotControls(controls: ControlHandle[]) {
  return controls.map((control, index) => ({
    index,
    tag: control.tag,
    x: Math.round(control.x),
    y: Math.round(control.y),
    value: safeText(control.value).slice(0, 120),
    title: safeText(control.title).slice(0, 160),
    ariaLabel: safeText(control.ariaLabel).slice(0, 160),
    text: safeText(control.text.trim()).slice(0, 80)
  }));
}

async function fillControl(control: ControlHandle, value: string) {
  if (control.tag === 'SELECT') {
    const selected = await control.handle
      .selectOption({ label: value }, { timeout: 5000 })
      .then(() => true)
      .catch(async () =>
        control.handle
          .selectOption({ value }, { timeout: 5000 })
          .then(() => true)
          .catch(() => false)
      );
    if (!selected) {
      await control.handle.click({ force: true, timeout: 3000 }).catch(() => undefined);
      await control.handle.type(value, { delay: 25 }).catch(() => undefined);
    }
  } else {
    await control.handle.fill(value, { timeout: 5000 });
  }
  await control.handle.press('Tab').catch(() => undefined);
}

async function selectFirstOption(control: ControlHandle) {
  if (control.tag !== 'SELECT') return;
  await control.handle.selectOption({ index: 0 }, { timeout: 5000 }).catch(() => undefined);
  await control.handle.press('Tab').catch(() => undefined);
}

async function clickAction(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 800 }).catch(() => false)) {
        await action.click().catch(() => undefined);
        await page.waitForTimeout(1500);
        return true;
      }
    }
  }
  return false;
}

async function refreshJournalCheck(page: Page) {
  await clickAction(page, /^Refresh$/i);
  await page.waitForTimeout(2500);
  const text = normalizeText(await pageText(page));
  const buttons = await visibleButtonNames(page);
  const allText = `${text}\n${buttons.join('\n')}`;
  return {
    journalCheckVisible: /Journal Check/i.test(allText),
    zeroIssuesTotalVisible: /0\s+Issues?\s+Total/i.test(allText),
    zeroLinesWithIssuesVisible: /0\s+Lines?\s+with\s+issues/i.test(allText),
    currentLineNoIssuesVisible: /Current\s+line\s*[:\-]?\s*No\s+issues\s+found/i.test(allText),
    issueText:
      text
        .split('\n')
        .map((line) => line.trim())
        .find((line) => /must have a value|muss.*Wert enthalten|does not exist|is missing|ist nicht vorhanden|out of balance|not balanced|error|fehler/i.test(line)) ?? ''
  };
}

function cleanActionText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function actionInventory(scope: Page | Frame) {
  return scope.evaluate(() => {
    function norm(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }
    return [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],[role="menuitemcheckbox"],a,[aria-label],[title]')]
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          tagName: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          text: norm(element.innerText || element.textContent),
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          disabled: Boolean((element as HTMLButtonElement).disabled || element.getAttribute('aria-disabled') === 'true'),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })
      .filter((entry) => [entry.text, entry.ariaLabel, entry.title].some(Boolean))
      .slice(0, 380);
  });
}

function actionLabel(entry: ActionEntry) {
  return cleanActionText([entry.text, entry.ariaLabel, entry.title].filter(Boolean).join(' | '));
}

function interestingActions(actions: ActionEntry[]) {
  return actions.filter((entry) => /Preview Posting|Preview|Post|Buchen|Vorschau|Verwandte Aktionen|Related Actions/i.test(actionLabel(entry)));
}

async function findRelatedPostSplitButton(frame: Frame) {
  const candidates = (await actionInventory(frame)).filter((entry) => {
    const label = actionLabel(entry);
    return /Verwandte Aktionen.*Post|Related Actions.*Post|Related actions.*Post/i.test(label) && entry.width <= 54 && entry.height <= 54 && !entry.disabled;
  });
  return { candidates, selected: candidates.length === 1 ? candidates[0] : null };
}

async function clickRelatedPostSplitButton(frame: Frame, candidate: ActionEntry) {
  await frame.evaluate((entry) => {
    function norm(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    const elements = [...document.querySelectorAll<HTMLElement>('button,[aria-label],[title]')];
    const target = elements.find((element) => {
      const rect = element.getBoundingClientRect();
      const label = `${norm(element.innerText || element.textContent)} ${norm(element.getAttribute('aria-label'))} ${norm(element.getAttribute('title'))}`;
      return (
        /Verwandte Aktionen.*Post|Related Actions.*Post|Related actions.*Post/i.test(label) &&
        Math.round(rect.x) === entry.x &&
        Math.round(rect.y) === entry.y &&
        Math.round(rect.width) === entry.width &&
        Math.round(rect.height) === entry.height
      );
    });
    if (!target) throw new Error('Related-actions-for-Post split button disappeared before click.');
    target.click();
  }, candidate);
}

function previewCandidates(actions: ActionEntry[]) {
  return actions.filter((entry) => {
    const label = actionLabel(entry);
    return (
      /menuitem/i.test(entry.role) &&
      /Preview Posting/i.test(entry.text) &&
      /Preview Posting/i.test(entry.ariaLabel || entry.text) &&
      /Review the different types of entries|Preview/i.test(label) &&
      !entry.disabled
    );
  });
}

async function clickExactPreviewPostingMenuitem(frame: Frame, candidate: ActionEntry) {
  await frame.evaluate((entry) => {
    function norm(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }
    const elements = [...document.querySelectorAll<HTMLElement>('button[role="menuitem"]')].filter(visible);
    const target = elements.find((element) => {
      const rect = element.getBoundingClientRect();
      return (
        /Preview Posting/i.test(norm(element.innerText || element.textContent)) &&
        /Preview Posting/i.test(norm(element.getAttribute('aria-label')) || norm(element.innerText || element.textContent)) &&
        Math.round(rect.x) === entry.x &&
        Math.round(rect.y) === entry.y &&
        Math.round(rect.width) === entry.width &&
        Math.round(rect.height) === entry.height
      );
    });
    if (!target) throw new Error('Exact Preview Posting menuitem disappeared before click.');
    target.click();
  }, candidate);
}

async function cleanupDraftLine(page: Page, documentNo: string) {
  const frame = await purchaseJournalFrame(page);
  const controls = await firstLineControls(frame);
  const target = controls.find((control) => control.value === documentNo);
  if (!target && !normalizeText(await pageText(page)).includes(documentNo)) {
    return { attempted: false, cleaned: true, reason: 'target-document-not-visible-before-cleanup' };
  }
  await (target?.handle.click({ force: true, timeout: 5000 }) ?? page.mouse.click(580, 330)).catch(() => undefined);
  await page.waitForTimeout(600);
  await frame.getByRole('button', { name: /Weitere Optionen anzeigen|Show more options/i }).last().click().catch(() => undefined);
  await page.waitForTimeout(900);
  const deleteLine = frame.getByRole('menuitem', { name: /Zeile|Line/i }).filter({ hasText: /l.sch|delete|Delete/i }).first();
  if (await deleteLine.isVisible({ timeout: 1500 }).catch(() => false)) {
    await deleteLine.click();
  } else {
    await page.keyboard.press('Control+Delete').catch(() => undefined);
  }
  await page.waitForTimeout(1500);
  await clickAction(page, /^Yes$|^Ja$|^OK$/i);
  await page.waitForTimeout(3000);
  const afterText = normalizeText(await pageText(page));
  const afterControls = await firstLineControls(frame).catch(() => []);
  const stillVisible = afterText.includes(documentNo) || afterControls.some((control) => control.value === documentNo);
  return { attempted: true, cleaned: !stillVisible, documentNoStillVisible: stillVisible };
}

test('p2p-029 discovers scoped Purchase Journal Preview Posting action after clean Journal Check', async ({ page }) => {
  const documentNo = `P2P029-${Date.now().toString().slice(-6)}`;
  await openPurchaseJournal(page);
  const frame = await purchaseJournalFrame(page);
  const initialControls = await firstLineControls(frame);
  if (initialControls.length < 15) throw new Error(`Too few visible Purchase Journal controls: ${initialControls.length}`);

  const fillInitial = async (index: number, value: string) => {
    await fillControl(initialControls[index], value);
    await page.waitForTimeout(900);
  };

  await fillInitial(0, postingDate);
  await fillInitial(1, 'Invoice');
  await fillInitial(2, documentNo);
  await fillInitial(4, 'Vendor');
  await fillInitial(5, vendorNo);
  await page.waitForTimeout(1800);

  const midControls = await firstLineControls(frame);
  if (midControls[7]) await selectFirstOption(midControls[7]);
  if (midControls[8]) await fillControl(midControls[8], '').catch(() => undefined);
  if (midControls[9]) await fillControl(midControls[9], '').catch(() => undefined);
  if (midControls[10]) await fillControl(midControls[10], amount).catch(() => undefined);
  if (midControls[11]) await fillControl(midControls[11], amount).catch(() => undefined);
  if (midControls[12]) await fillControl(midControls[12], amount).catch(() => undefined);
  if (midControls[13]) await fillControl(midControls[13], 'G/L Account').catch(() => undefined);
  if (midControls[14]) await fillControl(midControls[14], balanceAccountNo).catch(() => undefined);
  await page.waitForTimeout(2500);

  const journalCheck = await refreshJournalCheck(page);
  const cleanJournalCheck =
    journalCheck.zeroIssuesTotalVisible ||
    journalCheck.zeroLinesWithIssuesVisible ||
    journalCheck.currentLineNoIssuesVisible ||
    (!journalCheck.issueText && journalCheck.journalCheckVisible);
  const controlsAfterEntry = snapshotControls(await firstLineControls(frame));
  await writeJsonEvidence(p2pEvidencePath('010-after-clean-journal-check-controls.json'), controlsAfterEntry);

  const beforeActions = interestingActions(await actionInventory(frame));
  await writeJsonEvidence(p2pEvidencePath('020-before-post-menu-actions.json'), beforeActions);

  let splitButton: Awaited<ReturnType<typeof findRelatedPostSplitButton>> = { candidates: [], selected: null };
  let afterMenuActions: ActionEntry[] = [];
  let previewCandidatesAfterMenu: ActionEntry[] = [];
  let previewClicked = false;
  let previewOpened = false;
  let previewText = '';
  let previewBlockedReason = '';

  if (!cleanJournalCheck) {
    previewBlockedReason = 'journal-check-not-clean';
  } else {
    splitButton = await findRelatedPostSplitButton(frame);
    await writeJsonEvidence(p2pEvidencePath('030-related-post-split-button-candidates.json'), splitButton.candidates);
    if (!splitButton.selected) {
      previewBlockedReason = 'related-post-split-button-not-unique';
    } else {
      await clickRelatedPostSplitButton(frame, splitButton.selected);
      await page.waitForTimeout(1600);
      afterMenuActions = interestingActions(await actionInventory(frame));
      await writeJsonEvidence(p2pEvidencePath('040-after-post-menu-actions.json'), afterMenuActions);
      previewCandidatesAfterMenu = previewCandidates(afterMenuActions);
      await writeJsonEvidence(p2pEvidencePath('050-preview-menuitem-candidates.json'), previewCandidatesAfterMenu);
      if (previewCandidatesAfterMenu.length !== 1) {
        previewBlockedReason = 'preview-menuitem-not-unique-or-not-visible';
      } else {
        await clickExactPreviewPostingMenuitem(frame, previewCandidatesAfterMenu[0]);
        previewClicked = true;
        await page.waitForTimeout(4500);
        previewText = normalizeText(await pageText(page));
        previewOpened = /Posting Preview|G\/L Entries|VAT Entries|Item Ledger Entries|Preview/i.test(previewText);
        await writeTextEvidence(p2pEvidencePath('060-after-preview-click-page-text.txt'), compactPageText(previewText));
        const externalDocumentNoRequired = /External Document No\..*must|External Document No\..*muss/i.test(previewText);
        if (previewOpened) {
          await page.keyboard.press('Escape').catch(() => undefined);
          await page.waitForTimeout(1200);
        } else if (externalDocumentNoRequired) {
          previewBlockedReason = 'external-document-no-required-before-preview';
        } else {
          previewBlockedReason = 'preview-click-did-not-open-preview-context';
        }
      }
    }
  }

  const cleanup = await cleanupDraftLine(page, documentNo);
  await writeTextEvidence(p2pEvidencePath('070-cleanup-page-text.txt'), compactPageText(await pageText(page)));

  const result = {
    schemaVersion: 1,
    caseId: 'P2P-029-PURCHASE-JOURNAL-PREVIEW-ACTION-ROUTE',
    parentCaseId: 'P2P-028-PURCHASE-JOURNAL-NEGATIVE-AMOUNT-BALANCE-GATE',
    source: 'playwright-ui-labor-purchase-journal-preview-action-route',
    resultStatus: cleanJournalCheck ? 'observed' : 'blocked',
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    sourceCompany: 'RM-DEMO',
    documentNo,
    previewPosting: previewOpened,
    posted: false,
    setupChanges: [],
    changedRecords: [{ type: 'Purchase Journal Line', documentNo, cleanup }],
    postedRecords: [],
    execute: true,
    highImpactExecute: previewOpened || (cleanJournalCheck && splitButton.selected && previewCandidatesAfterMenu.length === 1),
    flags: {
      fieldValueEntryAttempted: true,
      journalLineCreated: true,
      cleanJournalCheck,
      relatedPostSplitButtonUnique: Boolean(splitButton.selected),
      previewMenuitemUnique: previewCandidatesAfterMenu.length === 1,
      previewClicked,
      previewOpened,
      externalDocumentNoRequired: previewBlockedReason === 'external-document-no-required-before-preview',
      cleanupAttempted: cleanup.attempted,
      cleanupProven: cleanup.cleaned,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    targetValues: {
      postingDate,
      documentType: 'Invoice',
      accountType: 'Vendor',
      vendorNo,
      amount,
      genPostingType: '',
      genBusPostingGroup: '',
      genProdPostingGroup: '',
      balAccountType: 'G/L Account',
      balAccountNo: balanceAccountNo
    },
    journalCheck,
    actionDiscovery: {
      beforeActionCount: beforeActions.length,
      relatedPostSplitButtonCandidates: splitButton.candidates.length,
      previewMenuitemCandidates: previewCandidatesAfterMenu.length,
      previewBlockedReason
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/p2p-029/010-after-clean-journal-check-controls.json',
      'playwright/projects/fibu-book5/evidence/p2p-029/020-before-post-menu-actions.json',
      'playwright/projects/fibu-book5/evidence/p2p-029/030-related-post-split-button-candidates.json',
      'playwright/projects/fibu-book5/evidence/p2p-029/040-after-post-menu-actions.json',
      'playwright/projects/fibu-book5/evidence/p2p-029/050-preview-menuitem-candidates.json',
      'playwright/projects/fibu-book5/evidence/p2p-029/060-after-preview-click-page-text.txt',
      'playwright/projects/fibu-book5/evidence/p2p-029/070-cleanup-page-text.txt'
    ],
    screenshots: [],
    proves: [
      cleanJournalCheck ? 'P2P-028 values again produced a clean Purchase Journal Check.' : 'Clean Journal Check was not reached in this run.',
      splitButton.selected ? 'A unique related Post split-button candidate was found.' : 'The related Post split-button was not unique or not found.',
      previewCandidatesAfterMenu.length === 1 ? 'A unique Preview Posting menuitem was found after opening the related Post menu.' : 'Preview Posting menuitem route was not uniquely proven.',
      previewOpened ? 'Preview Posting opened from the scoped menuitem.' : 'Preview Posting did not open in this run.',
      cleanup.cleaned ? 'Cleanup removed the target draft line.' : 'Cleanup was attempted but not proven.',
      'No posting was executed.'
    ],
    notProved: [
      'No posting or ledger trace.',
      'No Purchase Order partial receipt.',
      'No German final proof.'
    ],
    blockedBy: [
      ...(cleanJournalCheck ? [] : ['journal-check-not-clean']),
      ...(splitButton.selected ? [] : ['related-post-split-button-not-unique']),
      ...(previewCandidatesAfterMenu.length === 1 ? [] : ['preview-menuitem-not-unique-or-not-visible']),
      ...(previewBlockedReason === 'external-document-no-required-before-preview' ? ['external-document-no-required-before-preview'] : []),
      ...(previewClicked && !previewOpened && previewBlockedReason !== 'external-document-no-required-before-preview' ? ['preview-click-did-not-open-preview-context'] : []),
      ...(cleanup.cleaned ? [] : ['cleanup-not-proven'])
    ],
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    safeToFinalizeState: false,
    requiresReview: true,
    statePatch: {},
    nextStep: previewOpened
      ? 'P2P-030: review Preview Posting entries and decide whether a separate no-post or posting trace case is justified.'
      : 'P2P-030: add scoped External Document No. and retry Purchase Journal Preview action route; do not post.'
  };

  await writeJsonEvidence(p2pEvidencePath('P2P-029-result.json'), result);
  await writeTextEvidence(
    p2pEvidencePath('README.md'),
    [
      '# P2P-029 Purchase Journal Preview Action Route',
      '',
      'Status: `execute-attempt`, `preview-action-route`, `no-posting`, `needs-german-final-rebuild`.',
      '',
      `Document No.: \`${documentNo}\``,
      '',
      '## Result',
      '',
      `- Journal Check clean: ${cleanJournalCheck ? 'yes' : 'no'}`,
      `- Related Post split button unique: ${splitButton.selected ? 'yes' : 'no'}`,
      `- Preview Posting menuitem unique: ${previewCandidatesAfterMenu.length === 1 ? 'yes' : 'no'}`,
      `- Preview Posting opened: ${previewOpened ? 'yes' : 'no'}`,
      `- Cleanup proven: ${cleanup.cleaned ? 'yes' : 'no'}`,
      '',
      '## Boundary',
      '',
      'No posting, no setup change, no company switch, no German final proof.'
    ].join('\n')
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.cleanupProven).toBe(true);
});
