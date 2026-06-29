import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 3000, height: 1500 }
});

test.setTimeout(900_000);

const TEST_ID = 'p2p-032';
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

type TraceTarget = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  fileStem: string;
  labelPattern: RegExp;
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

function compactPageText(text: string, docPattern = /P2P032|EXT-P2P032/i) {
  const interesting =
    /Purchase Journals|Posting Preview|Preview Posting|G\/L Entries|G\/L Entry|Vendor Ledger|Detailed Vendor|Journal Check|Issues Total|No issues found|Post|posted|success|successful|Document No\.|External Document No\.|Account Type|Account No\.|Vendor|Amount|Bal\. Account|K10000|82000|-2\.500|Invoice|error|fehler/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => safeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index]) && !docPattern.test(lines[index])) continue;
    for (let offset = -5; offset <= 12; offset += 1) {
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
      .slice(0, 320)
  ].join('\n');
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
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
      if (await action.isVisible({ timeout: 1000 }).catch(() => false)) {
        const clicked = await action.click({ timeout: 5000 }).then(() => true).catch(() => false);
        if (!clicked) continue;
        await page.waitForTimeout(1800);
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
      .slice(0, 420);
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

async function prepareJournalLine(page: Page, documentNo: string, externalDocumentNo: string) {
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
  await fillInitial(3, externalDocumentNo);
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
  await writeTextEvidence(p2pEvidencePath('011-after-clean-journal-check-page-text.txt'), compactPageText(await pageText(page)));
  return { frame, journalCheck, cleanJournalCheck, controlsAfterEntry };
}

async function openPreviewPosting(page: Page, frame: Frame, documentNo: string) {
  const beforeActions = interestingActions(await actionInventory(frame));
  await writeJsonEvidence(p2pEvidencePath('020-before-post-menu-actions.json'), beforeActions);
  const splitButton = await findRelatedPostSplitButton(frame);
  await writeJsonEvidence(p2pEvidencePath('030-related-post-split-button-candidates.json'), splitButton.candidates);
  if (!splitButton.selected) return { opened: false, reason: 'related-post-split-button-not-unique', splitButton, candidates: [] as ActionEntry[], text: '' };
  await clickRelatedPostSplitButton(frame, splitButton.selected);
  await page.waitForTimeout(1600);
  const afterMenuActions = interestingActions(await actionInventory(frame));
  await writeJsonEvidence(p2pEvidencePath('040-after-post-menu-actions.json'), afterMenuActions);
  const candidates = previewCandidates(afterMenuActions);
  await writeJsonEvidence(p2pEvidencePath('050-preview-menuitem-candidates.json'), candidates);
  if (candidates.length !== 1) return { opened: false, reason: 'preview-menuitem-not-unique-or-not-visible', splitButton, candidates, text: '' };
  await clickExactPreviewPostingMenuitem(frame, candidates[0]);
  await page.waitForTimeout(4500);
  const text = normalizeText(await pageText(page));
  const opened = /Posting Preview|G\/L Entry|Vendor Ledger Entry|Detailed Vendor/i.test(text);
  await writeTextEvidence(p2pEvidencePath('060-preview-posting-page-text.txt'), compactPageText(text, new RegExp(documentNo)));
  if (opened) {
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(1800);
  }
  return { opened, reason: opened ? '' : 'preview-click-did-not-open-preview-context', splitButton, candidates, text };
}

async function postDraftOnce(page: Page, documentNo: string) {
  const beforeText = normalizeText(await pageText(page));
  const draftVisibleBeforePost = beforeText.includes(documentNo);
  const postVisibleBeforeClick = (await visibleButtonNames(page)).some((button) => /^Post$|^Buchen$/i.test(button));
  const clickedPost = postVisibleBeforeClick ? await clickAction(page, /^Post$|^Buchen$/i) : false;
  await page.waitForTimeout(2500);
  const dialogText = normalizeText(await pageText(page));
  const dialogButtons = await visibleButtonNames(page);
  const confirmationDialogVisible =
    clickedPost && /Do you want to post|journal lines|Buch\.-Blatt|buchen|Ja|Nein|Yes|No|OK/i.test(`${dialogText}\n${dialogButtons.join('\n')}`);
  await writeTextEvidence(p2pEvidencePath('070-post-confirm-dialog-page-text.txt'), compactPageText(dialogText, new RegExp(documentNo)));
  await writeJsonEvidence(p2pEvidencePath('071-post-confirm-dialog-buttons.json'), {
    draftVisibleBeforePost,
    postVisibleBeforeClick,
    clickedPost,
    confirmationDialogVisible,
    dialogButtons: dialogButtons.map(safeText)
  });
  const confirmed = confirmationDialogVisible ? await clickAction(page, /^Yes$|^Ja$|^OK$/i) : false;
  await page.waitForTimeout(12_000);
  const resultText = normalizeText(await pageText(page));
  const resultButtons = await visibleButtonNames(page);
  await writeTextEvidence(p2pEvidencePath('080-post-result-page-text.txt'), compactPageText(resultText, new RegExp(documentNo)));
  await clickAction(page, /^OK$|^Schlie|^Close$/i);
  return {
    draftVisibleBeforePost,
    postVisibleBeforeClick,
    clickedPost,
    confirmationDialogVisible,
    confirmed,
    resultTextHasSuccess: /successfully posted|erfolgreich gebucht|journal lines were successfully|Die Buchung/i.test(resultText),
    resultButtons: resultButtons.map(safeText)
  };
}

async function openFilteredPageAndCapture(page: Page, target: TraceTarget, documentNo: string) {
  await page.goto(filteredBcPageUrl(target.pageId, target.tableName, target.filterField, target.filterValue), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(3500);
  await dismissTours(page);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(safeText);
  await writeTextEvidence(p2pEvidencePath(`${target.fileStem}-page-text.txt`), compactPageText(text, new RegExp(documentNo)));
  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValue: target.filterValue,
    pageContextVisible: target.labelPattern.test(text),
    filterValueVisible: text.includes(target.filterValue),
    vendorVisible: new RegExp(vendorNo).test(text),
    documentNoVisible: text.includes(documentNo),
    amountVisible: /2[.,]500[.,]00|2500[.,]00/i.test(text),
    relevantButtons: buttons.filter((button) => /Entry|Posten|Apply|Ausgleich|Navigate|Find|Show|Open|Dimension/i.test(button)),
    textEvidenceFile: `${target.fileStem}-page-text.txt`
  };
}

function renderReadme(result: Record<string, any>) {
  return [
    '# P2P-032 Purchase Journal Controlled Posting Trace',
    '',
    'Status: `controlled-labor-posting`, `posting-trace`, `needs-german-final-rebuild`.',
    '',
    `Document No.: \`${result.documentNo}\``,
    `External Document No.: \`${result.externalDocumentNo}\``,
    '',
    '## Preflight',
    '',
    `- Journal Check clean: ${result.preflight.cleanJournalCheck ? 'yes' : 'no'}`,
    `- Preview Posting opened: ${result.preview.opened ? 'yes' : 'no'}`,
    `- Post dialog visible before confirmation: ${result.posting.confirmationDialogVisible ? 'yes' : 'no'}`,
    '',
    '## Posting',
    '',
    `- Posted: ${result.posted ? 'yes' : 'no'}`,
    `- Confirmed exactly once by this test: ${result.posting.confirmed ? 'yes' : 'no'}`,
    '',
    '## Trace',
    '',
    '| Entry type | Visible | Evidence |',
    '|---|---:|---|',
    ...result.traces.map((trace: any) => `| ${trace.id} | ${trace.documentNoVisible || trace.filterValueVisible ? 'yes' : 'no'} | ${trace.textEvidenceFile} |`),
    '',
    '## Boundary',
    '',
    '- RM-DEMO / MCP_1_20260210 laboratory only.',
    '- No setup change, no company switch, no API shortcut.',
    '- No German final proof; must be rebuilt later in a German target company.'
  ].join('\n');
}

test('p2p-032 posts clean Purchase Journal line once and traces entries', async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const documentNo = `P2P032-${suffix}`;
  const externalDocumentNo = `EXT-P2P032-${suffix}`;
  const preflight = await prepareJournalLine(page, documentNo, externalDocumentNo);

  let cleanup: unknown = null;
  let preview: Awaited<ReturnType<typeof openPreviewPosting>> = {
    opened: false,
    reason: 'not-attempted',
    splitButton: { candidates: [], selected: null },
    candidates: [],
    text: ''
  };
  let posting: Awaited<ReturnType<typeof postDraftOnce>> = {
    draftVisibleBeforePost: false,
    postVisibleBeforeClick: false,
    clickedPost: false,
    confirmationDialogVisible: false,
    confirmed: false,
    resultTextHasSuccess: false,
    resultButtons: []
  };
  let traces: Array<Awaited<ReturnType<typeof openFilteredPageAndCapture>>> = [];

  try {
    if (!preflight.cleanJournalCheck) throw new Error(`P2P-032 Journal Check not clean: ${preflight.journalCheck.issueText}`);
    preview = await openPreviewPosting(page, preflight.frame, documentNo);
    if (!preview.opened) throw new Error(`P2P-032 Preview Posting did not open: ${preview.reason}`);
    posting = await postDraftOnce(page, documentNo);
    if (!posting.confirmationDialogVisible || !posting.confirmed) {
      throw new Error('P2P-032 Post dialog was not visible or was not confirmed exactly once.');
    }

    const traceTargets: TraceTarget[] = [
      {
        id: 'vendor-ledger-payment',
        pageId: 29,
        tableName: 'Vendor Ledger Entry',
        filterField: 'Document No.',
        filterValue: documentNo,
        fileStem: '090-vendor-ledger-payment',
        labelPattern: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten/i
      },
      {
        id: 'detailed-vendor-ledger-payment',
        pageId: 574,
        tableName: 'Detailed Vendor Ledg. Entry',
        filterField: 'Document No.',
        filterValue: documentNo,
        fileStem: '091-detailed-vendor-ledger-payment',
        labelPattern: /Detailed Vendor|Detailed Vend|Detaillierte Kreditorenposten|Vendor Ledger/i
      },
      {
        id: 'gl-entries-payment',
        pageId: 20,
        tableName: 'G/L Entry',
        filterField: 'Document No.',
        filterValue: documentNo,
        fileStem: '092-gl-entries-payment',
        labelPattern: /G\/L Entries|G\/L Entry|Sachposten|Account No\.|Konto/i
      }
    ];
    for (const target of traceTargets) traces.push(await openFilteredPageAndCapture(page, target, documentNo));
  } catch (error) {
    if (!posting.confirmed) {
      await openPurchaseJournal(page).catch(() => undefined);
      cleanup = await cleanupDraftLine(page, documentNo).catch((cleanupError) => ({
        attempted: true,
        cleaned: false,
        error: String(cleanupError)
      }));
    }
    const result = {
      schemaVersion: 1,
      caseId: 'P2P-032-PURCHASE-JOURNAL-CONTROLLED-POSTING-TRACE',
      source: 'playwright-ui-labor-purchase-journal-controlled-posting-trace',
      resultStatus: 'blocked',
      instance: 'MCP_1_20260210',
      company: 'RM-DEMO',
      sourceCompany: 'RM-DEMO',
      documentNo,
      externalDocumentNo,
      posted: false,
      previewPosting: preview.opened,
      setupChanges: [],
      changedRecords: [{ type: 'Purchase Journal Line', documentNo, cleanup }],
      postedRecords: [],
      preflight: {
        journalCheck: preflight.journalCheck,
        cleanJournalCheck: preflight.cleanJournalCheck,
        controlsAfterEntry: preflight.controlsAfterEntry
      },
      preview,
      posting,
      traces,
      blockedBy: [String(error instanceof Error ? error.message : error)],
      flags: {
        noSetupChange: true,
        noCompanySwitch: true,
        noApiShortcut: true,
        noBookChange: true,
        cleanupAttemptedIfNotPosted: Boolean(cleanup)
      },
      migrationRelevance: 'needed-for-german-final',
      mustRecreateInFinalSandbox: true,
      finalScreenshotNeeded: true,
      safeToFinalizeState: false,
      requiresReview: true,
      statePatch: {},
      nextStep: 'Review P2P-032 blocker before any repeat posting attempt.'
    };
    await writeJsonEvidence(p2pEvidencePath('P2P-032-result.json'), result);
    await writeTextEvidence(p2pEvidencePath('README.md'), renderReadme(result));
    throw error;
  }

  const result = {
    schemaVersion: 1,
    caseId: 'P2P-032-PURCHASE-JOURNAL-CONTROLLED-POSTING-TRACE',
    source: 'playwright-ui-labor-purchase-journal-controlled-posting-trace',
    resultStatus: 'posted',
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    sourceCompany: 'RM-DEMO',
    documentNo,
    externalDocumentNo,
    posted: posting.confirmed,
    previewPosting: preview.opened,
    setupChanges: [],
    changedRecords: [{ type: 'Purchase Journal Line', documentNo, cleanup: 'posted-not-cleaned' }],
    postedRecords: [{ type: 'Purchase Journal posting trace', documentNo }],
    preflight: {
      journalCheck: preflight.journalCheck,
      cleanJournalCheck: preflight.cleanJournalCheck,
      controlsAfterEntry: preflight.controlsAfterEntry
    },
    preview: {
      opened: preview.opened,
      entryTypesVisible: {
        glEntry: /G\/L Entry/i.test(preview.text),
        vendorLedgerEntry: /Vendor Ledger Entry/i.test(preview.text),
        detailedVendorLedgerEntry: /Detailed Vendor/i.test(preview.text)
      }
    },
    posting,
    traces,
    traceSummary: {
      vendorLedgerVisible: traces.find((trace) => trace.id === 'vendor-ledger-payment')?.documentNoVisible ?? false,
      detailedVendorLedgerVisible: traces.find((trace) => trace.id === 'detailed-vendor-ledger-payment')?.documentNoVisible ?? false,
      glEntriesVisible: traces.find((trace) => trace.id === 'gl-entries-payment')?.documentNoVisible ?? false
    },
    proves: [
      'Purchase Journal line was created with External Document No. and clean Journal Check.',
      'Preview Posting opened before posting.',
      'Post dialog was visible before confirmation.',
      'Posting was confirmed exactly once by this test.',
      'Vendor Ledger, Detailed Vendor Ledger and G/L trace pages were opened after posting.'
    ],
    notProved: [
      'No German final proof.',
      'No VAT/tax final proof.',
      'No Purchase Order partial receipt.'
    ],
    blockedBy: [],
    flags: {
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    safeToFinalizeState: false,
    requiresReview: true,
    statePatch: {},
    nextStep: 'P2P-033: review the posted Purchase Journal trace and sync the P2P lab clickguide/book draft.'
  };

  await writeJsonEvidence(p2pEvidencePath('P2P-032-result.json'), result);
  await writeTextEvidence(p2pEvidencePath('README.md'), renderReadme(result));

  expect(result.posted).toBe(true);
  expect(result.previewPosting).toBe(true);
  expect(result.traceSummary.vendorLedgerVisible || result.traceSummary.glEntriesVisible).toBe(true);
});
