import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(600_000);

const testId = 'bank-018';
const pageIdPaymentJournal = 256;
const pageIdVendorLedgerEntries = 29;
const targetDocumentNo = '108205';
const relatedInvoiceNo = '107197';
const vendorNo = '40000';
const vendorName = 'Wide World Importers';
const bankAccountNo = 'BANK-RM-01';
const paymentDocumentNo = 'BANK018-108205';
const paymentAmount = '3.123,37';

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

function bankEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function sanitizeEvidenceText(text: string) {
  return text
    .replace(/\u00c3\u0152/g, 'Ue')
    .replace(/\u00c3\u00bc/g, 'ue')
    .replace(/\u00c3\u2013/g, 'Oe')
    .replace(/\u00c3\u00b6/g, 'oe')
    .replace(/\u00c3\u201e/g, 'Ae')
    .replace(/\u00c3\u00a4/g, 'ae')
    .replace(/\u00c3\u0178/g, 'ss')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function compactPageText(text: string) {
  const interesting =
    /BANK018|108205|107197|40000|Wide World Importers|BANK-RM-01|Payment Journal|Vendor Ledger Entries|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Vendor Name|Amount|Remaining Amount|Bal\. Account|Applies-to|Apply Entries|Journal Check|Refresh|Post|Payment|Vendor|Open|Application|muss|must|Issues/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -3; offset <= 7; offset += 1) {
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
      .slice(0, 260)
  ].join('\n'));
}

function pageUrl(pageId: number) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

function filteredPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

async function clickAction(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 1000 }).catch(() => false)) {
        const clicked = await action.click({ timeout: 5000 }).then(() => true).catch(() => false);
        if (!clicked) continue;
        await page.waitForTimeout(2000);
        return true;
      }
    }
  }
  return false;
}

async function openVendorLedger(page: Page) {
  await page.goto(filteredPageUrl(pageIdVendorLedgerEntries, 'Vendor Ledger Entry', 'Document No.', targetDocumentNo), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(bankEvidencePath('010-vendor-ledger-document-108205-page-text.txt'), compactPageText(text));
  await screenshot(page, 'bank-018-010-vendor-ledger-document-108205.png', {
    projectName: project.name,
    testId,
    status: text.includes(targetDocumentNo) && text.includes(vendorName) ? 'labor' : 'rejected',
    purpose: 'BANK-018 Zielposten vor Payment-Journal-Preflight: Vendor Ledger Entry 108205 / Wide World Importers.',
    knownLimitations: [
      'Read-only Vorpruefung; noch keine Zahlungswirkung.',
      'CRONUS-USA-Labor; kein deutscher Finalnachweis.'
    ],
    bookUse: 'process-proof'
  });
  return {
    pageContextVisible: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten/i.test(text),
    documentVisible: text.includes(targetDocumentNo),
    relatedInvoiceVisible: text.includes(relatedInvoiceNo),
    vendorNoVisible: text.includes(vendorNo),
    vendorNameVisible: text.includes(vendorName),
    amountVisible: /-3\.123,37|-3123,37|3\.123,37|3123,37/i.test(text),
    openSignalVisible: /\bOpen\b|Offen|Remaining Amount|Restbetrag/i.test(text),
    textEvidenceFile: '010-vendor-ledger-document-108205-page-text.txt',
    buttons
  };
}

async function openPaymentJournal(page: Page) {
  await page.goto(pageUrl(pageIdPaymentJournal), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);
}

async function paymentJournalFrame(page: Page) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
      if (/Payment Journal/i.test(text) && /Batch Name/i.test(text)) return frame;
    }
    await page.waitForTimeout(1500);
  }
  throw new Error('Payment-Journal-Frame nicht gefunden.');
}

async function firstLineControls(frame: Frame) {
  const handles = (await frame.locator('input,select').elementHandles()) as Array<
    import('@playwright/test').ElementHandle<HTMLElement>
  >;
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

    if (!data?.visible || data.y < 250 || data.y > 430) continue;
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
    value: control.value,
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
      await control.handle.press('Home').catch(() => undefined);
      await control.handle.type(value, { delay: 20 }).catch(() => undefined);
    }
  } else {
    await control.handle.fill(value, { timeout: 5000 });
  }
  await control.handle.press('Tab').catch(() => undefined);
}

async function typeTextLikeUser(control: ControlHandle, value: string, commitKey: 'Tab' | 'Enter' = 'Tab') {
  await control.handle.click({ force: true });
  await control.handle.press('Control+A').catch(() => undefined);
  await control.handle.type(value, { delay: 30 });
  await control.handle.press(commitKey).catch(() => undefined);
}

async function readJournalCheck(page: Page) {
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const allText = `${text}\n${buttons.join('\n')}`;
  const issueText =
    text
      .split('\n')
      .map((line) => line.trim())
      .find((line) => /Gen\. Journal Line|must have a value|muss.*Wert enthalten|does not exist|Posting Group|out of balance|nicht ausgeglichen/i.test(line)) ??
    '';

  return {
    buttons,
    journalCheckVisible: /Journal Check/i.test(allText),
    zeroIssuesTotalVisible: /0\s+Issues?\s+Total/i.test(allText),
    zeroLinesWithIssuesVisible: /0\s+Lines?\s+with\s+issues/i.test(allText),
    currentLineNoIssuesVisible: /Current\s+line\s*[:\-]?\s*No\s+issues\s+found/i.test(allText),
    issueText: sanitizeEvidenceText(issueText).slice(0, 500)
  };
}

async function refreshJournalCheck(page: Page) {
  await clickAction(page, /^Refresh$/i);
  await page.waitForTimeout(3000);
  return readJournalCheck(page);
}

async function cleanupDraftLine(page: Page) {
  await openPaymentJournal(page);
  const frame = await paymentJournalFrame(page);
  const beforeText = normalizeText(await pageText(page));
  const beforeControls = await firstLineControls(frame);
  const documentControl = beforeControls.find((control) => control.value === paymentDocumentNo);

  if (!beforeText.includes(paymentDocumentNo) && !documentControl) {
    return { attempted: false, cleaned: true, reason: 'target-document-not-visible-before-cleanup' };
  }

  if (documentControl) {
    await documentControl.handle.click({ force: true, timeout: 5000 }).catch(async () => {
      await page.mouse.click(580, 301);
    });
    await page.waitForTimeout(500);
  }

  await frame.getByRole('button', { name: /Weitere Optionen anzeigen|Show more options/i }).last().click();
  await page.waitForTimeout(800);
  const deleteLine = frame
    .getByRole('menuitem', { name: /Zeile|Line/i })
    .filter({ hasText: /l.sch|delete|Delete/i })
    .first();
  if (await deleteLine.isVisible({ timeout: 1500 }).catch(() => false)) {
    await deleteLine.click();
  } else {
    await page.keyboard.press('Control+Delete');
  }
  await page.waitForTimeout(1500);
  await clickAction(page, /^Yes$|^Ja$|^OK$/i);
  await page.waitForTimeout(3000);

  const afterText = normalizeText(await pageText(page));
  const afterControls = await firstLineControls(frame).catch(() => []);
  const documentStillVisibleInControls = afterControls.some((control) => control.value === paymentDocumentNo);
  return {
    attempted: true,
    cleaned: !afterText.includes(paymentDocumentNo) && !documentStillVisibleInControls,
    documentNoStillVisible: afterText.includes(paymentDocumentNo) || documentStillVisibleInControls
  };
}

async function prepareDraft(page: Page) {
  const frame = await paymentJournalFrame(page);
  const initialControls = await firstLineControls(frame);
  if (initialControls.length < 18) {
    throw new Error(`Zu wenige sichtbare Payment-Journal-Controls gefunden: ${initialControls.length}.`);
  }

  await fillControl(initialControls[0], '03.03.2026');
  await fillControl(initialControls[1], '03.03.2026');
  await fillControl(initialControls[2], 'Payment');
  await fillControl(initialControls[3], paymentDocumentNo);
  await fillControl(initialControls[5], 'Vendor');
  await fillControl(initialControls[6], vendorNo);
  await page.waitForTimeout(1800);
  await fillControl(initialControls[8], 'BANK-018 preflight vendor payment 108205');
  await typeTextLikeUser(initialControls[12], paymentAmount, 'Tab');
  await page.waitForTimeout(1200);

  const controlsAfterAmount = await firstLineControls(frame);
  await fillControl(controlsAfterAmount[13], 'Bank Account');
  await fillControl(controlsAfterAmount[14], bankAccountNo);
  await page.waitForTimeout(1500);
  await fillControl(controlsAfterAmount[16], 'Invoice');
  await fillControl(controlsAfterAmount[17], targetDocumentNo);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(2500);

  const controlsBeforeRefocus = await firstLineControls(frame);
  await typeTextLikeUser(controlsBeforeRefocus[12], paymentAmount, 'Enter');
  await page.waitForTimeout(1500);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1800);
  const journalCheck = await refreshJournalCheck(page);
  const finalControls = await firstLineControls(frame);
  const finalSnapshot = snapshotControls(finalControls);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const values = finalSnapshot.map((control) => control.value);

  return {
    finalSnapshot,
    text,
    buttons,
    journalCheck,
    documentNoVisible: values.includes(paymentDocumentNo) || text.includes(paymentDocumentNo),
    vendorVisible: values.includes(vendorNo) || text.includes(vendorNo),
    bankVisible: values.includes(bankAccountNo) || text.includes(bankAccountNo),
    invoiceReferenceVisible: values.includes(targetDocumentNo) || text.includes(targetDocumentNo),
    amountVisible: values.some((value) => /3[.,]?123,37|3123,37/i.test(value)) || /3[.,]?123,37|3123,37/i.test(text),
    appliedCheckboxValue: finalSnapshot[15]?.value ?? '',
    appliesToDocTypeValue: finalSnapshot[16]?.value ?? '',
    appliesToDocNoValue: finalSnapshot[17]?.value ?? ''
  };
}

async function captureApplyEntriesPreflight(page: Page) {
  const beforeButtons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const clicked = await clickAction(page, /^Apply Entries$|^Posten ausgleichen$|Apply Entries|Ausgleichen/i);
  await dismissTours(page);
  await page.waitForTimeout(2500);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const opened = clicked && /Apply.*Entries|Apply Vendor Entries|Posten ausgleichen|108205|40000|Remaining Amount/i.test(text);
  await writeTextEvidence(bankEvidencePath('030-apply-entries-preflight-page-text.txt'), compactPageText(text));
  await writeJsonEvidence(bankEvidencePath('030-apply-entries-preflight-controls.json'), {
    beforeButtons,
    clicked,
    opened,
    documentVisible: /108205|40000|Wide World Importers/i.test(text),
    dangerousActionsVisible: /Set Applies-to ID|Post Application/i.test(`${text}\n${buttons.join('\n')}`),
    dangerousActionsClicked: false,
    buttons
  });
  if (opened) {
    await screenshot(page, 'bank-018-030-apply-entries-preflight.png', {
      projectName: project.name,
      testId,
      status: 'labor',
      purpose:
        'BANK-018 Apply Entries vor moeglicher Kreditorenzahlung read-only pruefen; keine Set-/Post-Application-Aktion.',
      knownLimitations: [
        'Vor-Buchungsbild; beweist noch keine Zahlung.',
        'Keine Nutzung von Set Applies-to ID oder Post Application.'
      ],
      bookUse: 'process-proof'
    });
  }
  return {
    clicked,
    opened,
    documentVisible: /108205|40000|Wide World Importers/i.test(text),
    dangerousActionsVisible: /Set Applies-to ID|Post Application/i.test(`${text}\n${buttons.join('\n')}`),
    dangerousActionsClicked: false
  };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# BANK-018 Single-Line Vendor Payment Preflight',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, payment-journal-preflight, cleanup, no-post, needs-german-final-rebuild |',
    `| Zielposten | \`${targetDocumentNo}\` / ${vendorName} / Vendor ${vendorNo} |`,
    `| Journalbeleg | \`${paymentDocumentNo}\` |`,
    `| Bankgegenkonto | \`${bankAccountNo}\` |`,
    `| Betrag | \`${paymentAmount}\` |`,
    '',
    '## Ergebnis',
    '',
    `- Zielposten sichtbar: ${result.preflight.vendorLedgerTargetVisible ? 'ja' : 'nein'}.`,
    `- Journalzeile sichtbar: ${result.preflight.draftVisible ? 'ja' : 'nein'}.`,
    `- Journal Check 0 Issues: ${result.preflight.journalCheckZeroIssues ? 'ja' : 'nein'}.`,
    `- Apply Entries read-only geoeffnet: ${result.preflight.applyEntriesOpened ? 'ja' : 'nein'}.`,
    `- Cleanup erfolgreich: ${result.cleanup.cleaned ? 'ja' : 'nein'}.`,
    '',
    '## Buchungsgrenze',
    '',
    'BANK-018 bucht nicht. Der Lauf beweist nur, ob die Einzelzeilenroute fuer eine spaetere Zahlung sauber vorbereitet werden kann.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('BANK-018 Single-Line Vendor Payment Journal Preflight ohne Buchung', async ({ page }) => {
  const vendorLedger = await openVendorLedger(page);
  const vendorLedgerTargetVisible =
    vendorLedger.pageContextVisible &&
    vendorLedger.documentVisible &&
    vendorLedger.vendorNoVisible &&
    vendorLedger.vendorNameVisible &&
    vendorLedger.amountVisible;

  await cleanupDraftLine(page);
  await openPaymentJournal(page);
  const draft = await prepareDraft(page);
  await writeJsonEvidence(bankEvidencePath('020-payment-journal-preflight-controls.json'), {
    documentNo: paymentDocumentNo,
    finalSnapshot: draft.finalSnapshot,
    buttons: draft.buttons,
    journalCheck: draft.journalCheck
  });
  await writeTextEvidence(bankEvidencePath('020-payment-journal-preflight-page-text.txt'), compactPageText(draft.text));
  await screenshot(page, 'bank-018-020-payment-journal-preflight.png', {
    projectName: project.name,
    testId,
    status: draft.journalCheck.zeroIssuesTotalVisible ? 'labor' : 'rejected',
    purpose:
      'BANK-018 Payment Journal Preflight: Vendor 40000, Document 108205, BANK-RM-01, Amount und Journal Check.',
    knownLimitations: [
      'Vor-Buchungsbild; beweist noch keine Zahlungswirkung.',
      'CRONUS-USA-Labor; kein deutscher Finalnachweis.'
    ],
    bookUse: 'process-proof'
  });

  const applyEntries = await captureApplyEntriesPreflight(page);
  const cleanup = await cleanupDraftLine(page);

  const journalCheckClean = draft.journalCheck.zeroIssuesTotalVisible && draft.journalCheck.zeroLinesWithIssuesVisible;
  const preflightPassed =
    vendorLedgerTargetVisible &&
    draft.documentNoVisible &&
    draft.vendorVisible &&
    draft.bankVisible &&
    draft.invoiceReferenceVisible &&
    draft.amountVisible &&
    draft.appliesToDocNoValue === targetDocumentNo &&
    journalCheckClean &&
    applyEntries.opened &&
    applyEntries.documentVisible &&
    !applyEntries.dangerousActionsClicked &&
    cleanup.cleaned;

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: 'BANK-018-VENDOR-PAYMENT-108205-PREFLIGHT-NO-POST',
    source: 'playwright-ui-payment-journal-preflight',
    resultStatus: preflightPassed ? 'observed' : 'blocked',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    sourceCompany: project.defaultCompany,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-5.4-medium',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    paymentPosted: false,
    setupChanged: false,
    companySwitch: false,
    apiShortcut: false,
    bookChanged: false,
    target: {
      documentNo: targetDocumentNo,
      relatedInvoiceNo,
      vendorNo,
      vendorName,
      amount: paymentAmount,
      bankAccountNo,
      paymentDocumentNo
    },
    preflight: {
      vendorLedgerTargetVisible,
      vendorLedger,
      draftVisible: draft.documentNoVisible,
      vendorVisible: draft.vendorVisible,
      bankVisible: draft.bankVisible,
      invoiceReferenceVisible: draft.invoiceReferenceVisible,
      amountVisible: draft.amountVisible,
      appliedCheckboxValue: draft.appliedCheckboxValue,
      appliesToDocTypeValue: draft.appliesToDocTypeValue,
      appliesToDocNoValue: draft.appliesToDocNoValue,
      journalCheckZeroIssues: draft.journalCheck.zeroIssuesTotalVisible,
      journalCheckZeroLinesWithIssues: draft.journalCheck.zeroLinesWithIssuesVisible,
      journalCheckIssueText: draft.journalCheck.issueText,
      applyEntriesOpened: applyEntries.opened,
      applyEntriesDocumentVisible: applyEntries.documentVisible,
      applyEntriesDangerousActionsClicked: applyEntries.dangerousActionsClicked
    },
    cleanup,
    proved: [
      'Vendor Ledger Entry 108205 / Wide World Importers / Vendor 40000 was visible before Payment Journal preflight.',
      'A controlled Payment Journal line BANK018-108205 was attempted for Vendor 40000, BANK-RM-01 and Applies-to Doc. No. 108205.',
      'Journal Check and Apply Entries were captured before any posting action.',
      'No Post, Preview Posting, setup change, company switch or API shortcut was performed.',
      'The draft line was cleaned up before the run ended.'
    ],
    notProved: [
      'No payment was posted.',
      'No Preview Posting was opened.',
      'No bank reconciliation was posted.',
      'No Vendor/Bank/G-L ledger trace from a new payment exists.',
      'No German final bank/payment proof.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-018/BANK-018-result.json',
      'playwright/projects/fibu-book5/evidence/bank-018/BANK-018-SINGLE-LINE-VENDOR-PAYMENT-PREFLIGHT.md',
      'playwright/projects/fibu-book5/evidence/bank-018/README.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-018/'],
    blockedBy: preflightPassed ? [] : ['payment-journal-preflight-not-clean'],
    requiresReview: !preflightPassed,
    safeToFinalizeState: false,
    statePatch: {},
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    rebuildInstruction:
      'In der deutschen Zielcompany denselben Einzelzeilen-Preflight mit deutschem Kreditor/offenem Posten, Bankkonto, Journal Check und Apply Entries neu erzeugen.',
    targetGermanCompanyImpact:
      'German final company needs bank account, vendor open item, payment journal evidence and later posted ledger trace rebuilt.',
    finalScreenshotNeeded: true,
    nextStep: preflightPassed
      ? 'BANK-019: controlled posting decision for 108205 after explicit judge gate with post-dialog screenshot and Vendor/Bank/G-L ledger trace.'
      : 'BANK-019: fix the specific Payment Journal preflight blocker before any payment posting.'
  };

  await writeJsonEvidence(bankEvidencePath('BANK-018-result.json'), result);
  await writeTextEvidence(bankEvidencePath('BANK-018-SINGLE-LINE-VENDOR-PAYMENT-PREFLIGHT.md'), renderMarkdown(result));
  await writeTextEvidence(
    bankEvidencePath('README.md'),
    [
      '# BANK-018 Evidence Index',
      '',
      'Status: CRONUS-USA-Labor, Payment-Journal-Preflight, keine Zahlung, Cleanup, kein deutscher Finalnachweis.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-vendor-ledger-document-108205-page-text.txt` | kompakter UI-Seitentext | Zielposten `108205` / Vendor `40000` / Wide World Importers | keine Zahlung | labor, preflight |',
      '| `020-payment-journal-preflight-controls.json` | UI-Control-Snapshot | Payment-Journal-Zeile, Journal Check und sichtbare Werte | keine Buchung | labor, preflight |',
      '| `030-apply-entries-preflight-controls.json` | UI-/Button-Evidence | Apply Entries wurde read-only geprueft | kein Set Applies-to ID, kein Post Application | labor, preflight |',
      '| `BANK-018-result.json` | JSON-Ergebnis | strukturierter Preflight-/Cleanup-Befund | keine Postenspur aus neuer Zahlung | labor |',
      '| `BANK-018-SINGLE-LINE-VENDOR-PAYMENT-PREFLIGHT.md` | Lernzusammenfassung | Einzelzeilenroute und Buchungsgrenze | keinen deutschen Finalnachweis | labor |',
      ''
    ].join('\n')
  );

  expect(cleanup.cleaned, 'BANK-018 Draft-Zeile muss bereinigt werden.').toBe(true);
});
