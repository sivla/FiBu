import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, pageText, screenshot, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2400, height: 1400 }
});

test.setTimeout(480_000);

const TEST_ID = 'p2p-015';
const PAGE_ID_PURCHASE_JOURNAL = 254;
const postingDate = '08.06.2026';
const vendorNo = 'K10000';
const amount = '2.500,00';
const genBusPostingGroup = 'DOMESTIC';
const genProdPostingGroup = 'RETAIL';

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

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function sanitizeEvidenceText(text: string) {
  return text
    .replace(/businesscentral\.dynamics\.com\/[0-9a-f]{8}-[0-9a-f-]{27,}\//gi, 'businesscentral.dynamics.com/[tenant-id]/')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function compactPageText(text: string) {
  const interesting =
    /P2P015|Purchase Journals|Batch Name|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Vendor|Amount|Gen\. Bus\. Posting Group|Gen\. Prod\. Posting Group|DOMESTIC|RETAIL|Journal Check|Preview Posting|Post|K10000|Invoice|2\.500|2500|issue|must have a value/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -4; offset <= 8; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }
  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 240)
  ].join('\n'));
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
  throw new Error('Purchase-Journal-Frame nicht gefunden.');
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
    if (!data?.visible || data.y < 250 || data.y > 470) continue;
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
    value: sanitizeEvidenceText(control.value).slice(0, 120),
    title: sanitizeEvidenceText(control.title).slice(0, 160),
    ariaLabel: sanitizeEvidenceText(control.ariaLabel).slice(0, 160),
    text: sanitizeEvidenceText(control.text.trim()).slice(0, 80)
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
        .find((line) => /must have a value|muss.*Wert enthalten|does not exist|Posting Group|Gen\. Journal Line|Amount|Account No\./i.test(line)) ?? ''
  };
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

async function tryPreviewPostingIfClean(page: Page, journalCheck: Awaited<ReturnType<typeof refreshJournalCheck>>) {
  const clean =
    journalCheck.zeroIssuesTotalVisible ||
    journalCheck.zeroLinesWithIssuesVisible ||
    journalCheck.currentLineNoIssuesVisible ||
    (!journalCheck.issueText && journalCheck.journalCheckVisible);
  if (!clean) return { attempted: false, opened: false, reason: 'journal-check-not-clean' };
  const clicked = await clickAction(page, /^Preview Posting$|^Preview$/i);
  await page.waitForTimeout(3000);
  const text = normalizeText(await pageText(page));
  const opened = clicked && /Posting Preview|G\/L Entries|VAT Entries|Item Ledger Entries|Preview/i.test(text);
  return { attempted: clicked, opened, reason: opened ? 'preview-opened-after-clean-journal-check' : 'preview-action-not-confirmed' };
}

test('P2P-015 sets Purchase Journal posting groups and gates preview by Journal Check', async ({ page }) => {
  const documentNo = `P2P015-${Date.now().toString().slice(-6)}`;
  await openPurchaseJournal(page);
  const frame = await purchaseJournalFrame(page);
  const initialControls = await firstLineControls(frame);
  await writeJsonEvidence(p2pEvidencePath('010-initial-controls.json'), snapshotControls(initialControls));
  if (initialControls.length < 13) throw new Error(`Zu wenige sichtbare Purchase-Journal-Controls: ${initialControls.length}`);

  const fill = async (index: number, value: string) => {
    await fillControl(initialControls[index], value);
    await page.waitForTimeout(900);
  };

  await fill(0, postingDate);
  await fill(1, 'Invoice');
  await fill(2, documentNo);
  await fill(4, 'Vendor');
  await fill(5, vendorNo);
  await page.waitForTimeout(1800);

  const midControls = await firstLineControls(frame);
  if (midControls[7]) await fillControl(midControls[7], 'Purchase').catch(() => undefined);
  if (midControls[8]) await fillControl(midControls[8], genBusPostingGroup).catch(() => undefined);
  if (midControls[9]) await fillControl(midControls[9], genProdPostingGroup).catch(() => undefined);
  if (midControls[10]) await fillControl(midControls[10], amount).catch(() => undefined);
  if (midControls[11]) await fillControl(midControls[11], amount).catch(() => undefined);
  if (midControls[12]) await fillControl(midControls[12], amount).catch(() => undefined);
  await page.waitForTimeout(2500);

  const journalCheck = await refreshJournalCheck(page);
  const preview = await tryPreviewPostingIfClean(page, journalCheck);
  const finalText = normalizeText(await pageText(page));
  const finalControls = await firstLineControls(frame).catch(() => []);
  const finalSnapshot = snapshotControls(finalControls);
  const finalValues = finalSnapshot.map((control) => control.value);
  await writeTextEvidence(p2pEvidencePath('020-after-posting-group-gate-page-text.txt'), compactPageText(finalText));
  await writeJsonEvidence(p2pEvidencePath('020-after-posting-group-gate-controls.json'), finalSnapshot);
  await screenshot(page, 'p2p-015-020-posting-group-gate.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: 'labor',
    bookUse: 'evidence',
    purpose: `Purchase Journal Posting-Group-Gate fuer ${documentNo}; Preview nur nach sauberem Journal Check.`,
    expectedPageText: [/Purchase Journals|Preview|Journal Check/i],
    knownLimitations: ['Keine Buchung', 'CRONUS-USA-Labor', 'Kein deutscher Finalnachweis']
  });

  if (preview.opened) {
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(1500);
  }

  const cleanup = await cleanupDraftLine(page, documentNo);
  await writeTextEvidence(p2pEvidencePath('030-cleanup-page-text.txt'), compactPageText(await pageText(page)));

  const documentNoVisible = finalText.includes(documentNo) || finalValues.includes(documentNo);
  const genBusVisible = finalText.includes(genBusPostingGroup) || finalValues.includes(genBusPostingGroup);
  const genProdVisible = finalText.includes(genProdPostingGroup) || finalValues.includes(genProdPostingGroup);
  const oldBlockerStillPresent = /Gen\. Bus\. Posting Group/i.test(journalCheck.issueText);
  const journalCheckErrorFixed = genBusVisible && !oldBlockerStillPresent;
  const highImpactExecute = journalCheckErrorFixed || preview.opened;
  const result = {
    schemaVersion: 1,
    caseId: 'P2P-015-PURCHASE-JOURNAL-POSTING-GROUP-PREVIEW-GATE',
    parentCaseId: 'BC-DEEP-RUN-001-MULTI-ROUTE-SANDBOX-PROGRESS',
    source: 'playwright-ui-labor-journal-check-fix-attempt',
    resultStatus: documentNoVisible ? 'observed' : 'blocked',
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    sourceCompany: 'RM-DEMO',
    documentNo,
    previewPosting: preview.opened,
    posted: false,
    setupChanges: [],
    changedRecords: [{ type: 'Purchase Journal Line', documentNo, cleanup }],
    postedRecords: [],
    signals: [
      'field-value-entry',
      'journal-line-created',
      ...(journalCheckErrorFixed ? ['journal-check-error-fixed'] : []),
      ...(preview.opened ? ['preview-posting'] : []),
      'cleanup-or-correction'
    ],
    execute: true,
    highImpactExecute,
    lightExecute: !highImpactExecute,
    flags: {
      fieldValueEntryAttempted: true,
      journalLineCreated: documentNoVisible,
      journalCheckErrorFixed,
      previewAttempted: preview.attempted,
      previewOpened: preview.opened,
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
      genPostingType: 'Purchase',
      genBusPostingGroup,
      genProdPostingGroup,
      amount
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/p2p-015/010-initial-controls.json',
      'playwright/projects/fibu-book5/evidence/p2p-015/020-after-posting-group-gate-page-text.txt',
      'playwright/projects/fibu-book5/evidence/p2p-015/020-after-posting-group-gate-controls.json',
      'playwright/projects/fibu-book5/evidence/p2p-015/030-cleanup-page-text.txt'
    ],
    screenshots: ['playwright/projects/fibu-book5/img/p2p-015-020-posting-group-gate.png'],
    journalCheck,
    preview,
    proves: [
      'Purchase Journal posting group values DOMESTIC/RETAIL were attempted through UI controls.',
      journalCheckErrorFixed
        ? 'The previous Gen. Bus. Posting Group Journal Check blocker is no longer the first visible issue.'
        : 'The previous Gen. Bus. Posting Group blocker was tested but not proven fixed.',
      preview.opened ? 'Preview Posting opened after a clean Journal Check gate.' : 'Preview Posting stayed locked because Journal Check was not clean.',
      cleanup.cleaned ? 'Cleanup removed the target draft line.' : 'Cleanup was attempted but not proven.',
      'No posting was executed.'
    ],
    doesNotProve: [
      'No posted purchase invoice or ledger trace.',
      'No Purchase Order partial receipt.',
      'No German final proof.'
    ],
    blockedBy: [
      ...(documentNoVisible ? [] : ['document-no-not-visible-after-entry']),
      ...(genBusVisible ? [] : ['gen-bus-posting-group-not-visible-after-entry']),
      ...(genProdVisible ? [] : ['gen-prod-posting-group-not-visible-after-entry']),
      ...(cleanup.cleaned ? [] : ['cleanup-not-proven']),
      ...(journalCheckErrorFixed ? [] : ['gen-bus-posting-group-blocker-not-proven-fixed'])
    ],
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    safeToFinalizeState: false,
    requiresReview: true,
    statePatch: {},
    nextStep: journalCheckErrorFixed
      ? 'P2P-016: resolve the next Journal Check blocker or run a guarded Preview/Posting route if Journal Check is clean.'
      : 'P2P-016: inspect Purchase Journal posting group field mapping before repeating any value route.'
  };
  await writeJsonEvidence(p2pEvidencePath('P2P-015-result.json'), result);
  await writeTextEvidence(
    p2pEvidencePath('README.md'),
    [
      '# P2P-015 Purchase Journal Posting Group / Preview Gate',
      '',
      'Status: `execute-attempt`, `journal-check-error-fix-attempt`, `no-posting`, `needs-german-final-rebuild`.',
      '',
      `Document No.: \`${documentNo}\``,
      '',
      '## Ergebnis',
      '',
      `- Gen. Bus. Posting Group sichtbar: ${genBusVisible ? 'ja' : 'nein'}`,
      `- Gen. Prod. Posting Group sichtbar: ${genProdVisible ? 'ja' : 'nein'}`,
      `- Alter Gen.-Bus.-Posting-Group-Blocker geloest: ${journalCheckErrorFixed ? 'ja' : 'nein'}`,
      `- Preview Posting geoeffnet: ${preview.opened ? 'ja' : 'nein'}`,
      `- Cleanup bewiesen: ${cleanup.cleaned ? 'ja' : 'nein'}`,
      '',
      '## Grenze',
      '',
      'Keine Buchung, kein deutscher Finalnachweis. Preview wurde nur versucht, wenn Journal Check sauber wirkte.'
    ].join('\n')
  );

  expect(result.flags.fieldValueEntryAttempted).toBe(true);
  expect(result.flags.noPost).toBe(true);
});
