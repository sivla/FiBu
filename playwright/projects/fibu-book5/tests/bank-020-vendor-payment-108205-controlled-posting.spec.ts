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

test.setTimeout(900_000);

const testId = 'bank-020';
const pageIdPaymentJournal = 256;
const paymentDocumentNo = 'BANK018-108205';
const postedPurchaseInvoiceNo = '108205';
const vendorNo = '40000';
const bankAccountNo = 'BANK-RM-01';
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

type TraceTarget = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  fileStem: string;
  imageFileName: string;
  labelPattern: RegExp;
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
    /BANK018|108205|107197|40000|Wide World Importers|BANK-RM-01|Payment Journal|Vendor Ledger Entries|Detailed Vendor|Bank Account Ledger|G\/L Entries|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Amount|Amount \(\$\)|Bal\. Account|Applies-to|Apply Entries|Journal Check|Refresh|Post|Payment|Vendor|Remaining Amount|Open|Closed|Application|successful|posted|muss|must/i;
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

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function unfilteredBcPageUrl(pageId: number) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

async function clickAction(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 1000 }).catch(() => false)) {
        const clicked = await action.click({ timeout: 5000 }).then(() => true).catch(() => false);
        if (!clicked) continue;
        await page.waitForTimeout(2000).catch(() => undefined);
        return true;
      }
    }
  }
  return false;
}

async function openPaymentJournal(page: Page) {
  await page.goto(unfilteredBcPageUrl(pageIdPaymentJournal), {
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
      .find((line) => /Gen\. Journal Line|must have a value|muss.*Wert enthalten|does not exist|Posting Group/i.test(line)) ??
    '';

  return {
    buttons,
    journalCheckVisible: /Journal Check/i.test(allText),
    zeroIssuesTotalVisible: /0\s+Issues?\s+Total/i.test(allText),
    zeroLinesWithIssuesVisible: /0\s+Lines?\s+with\s+issues/i.test(allText),
    currentLineNoIssuesVisible: /Current\s+line\s*[:\-]?\s*No\s+issues\s+found/i.test(allText),
    issueText
  };
}

async function refreshJournalCheck(page: Page) {
  await clickAction(page, /^Refresh$/i);
  await page.waitForTimeout(3000);
  return readJournalCheck(page);
}

async function prepareDraft(page: Page) {
  const frame = await paymentJournalFrame(page);
  const initialControls = await firstLineControls(frame);
  if (initialControls.length < 18) {
    throw new Error(`Zu wenige sichtbare Payment-Journal-Controls gefunden: ${initialControls.length}.`);
  }

  await fillControl(initialControls[0], '08.06.2026');
  await fillControl(initialControls[1], '08.06.2026');
  await fillControl(initialControls[2], 'Payment');
  await fillControl(initialControls[3], paymentDocumentNo);
  await fillControl(initialControls[5], 'Vendor');
  await fillControl(initialControls[6], vendorNo);
  await page.waitForTimeout(1800);
  await fillControl(initialControls[8], 'BANK-020 lab vendor payment 108205');
  await typeTextLikeUser(initialControls[12], paymentAmount, 'Tab');
  await page.waitForTimeout(1200);

  const controlsAfterAmount = await firstLineControls(frame);
  await fillControl(controlsAfterAmount[13], 'Bank Account');
  await fillControl(controlsAfterAmount[14], bankAccountNo);
  await page.waitForTimeout(1500);
  await fillControl(controlsAfterAmount[16], 'Invoice');
  await fillControl(controlsAfterAmount[17], postedPurchaseInvoiceNo);
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
    vendorVisible: values.includes(vendorNo) || new RegExp(vendorNo).test(text),
    bankVisible: values.includes(bankAccountNo) || new RegExp(bankAccountNo).test(text),
    invoiceReferenceVisible: values.includes(postedPurchaseInvoiceNo) || new RegExp(postedPurchaseInvoiceNo).test(text),
    amountVisible: values.some((value) => /3[.,]123[.,]37|3123[.,]37/i.test(value)) || /3[.,]123[.,]37|3123[.,]37/i.test(text),
    appliedCheckboxValue: finalSnapshot[15]?.value ?? '',
    appliesToDocTypeValue: finalSnapshot[16]?.value ?? '',
    appliesToDocNoValue: finalSnapshot[17]?.value ?? ''
  };
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

async function openFilteredPageAndCapture(page: Page, target: TraceTarget) {
  await page.goto(filteredBcPageUrl(target.pageId, target.tableName, target.filterField, target.filterValue), {
    waitUntil: 'domcontentloaded'
  });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(3000);
  await dismissTours(page);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(bankEvidencePath(`${target.fileStem}-page-text.txt`), compactPageText(text));
  await screenshot(page, target.imageFileName, {
    projectName: project.name,
    testId,
    status: target.labelPattern.test(text) && text.includes(target.filterValue) ? 'labor' : 'rejected',
    purpose: `BANK-020 UI-Postenspur fuer Kreditorenzahlung ${paymentDocumentNo}: ${target.id}.`,
    knownLimitations: [
      'CRONUS-USA-Laborposten, kein deutscher Bank-/Steuer-/Compliance-Finalnachweis.',
      `Gefilterte UI-Ansicht auf ${target.filterField} = ${target.filterValue}; keine weitere Buchung.`
    ],
    bookUse: 'evidence'
  });

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValue: target.filterValue,
    pageContextVisible: target.labelPattern.test(text),
    filterValueVisible: text.includes(target.filterValue),
    vendorVisible: new RegExp(vendorNo).test(text),
    invoiceVisible: text.includes(postedPurchaseInvoiceNo),
    paymentDocumentVisible: text.includes(paymentDocumentNo),
    amountVisible: /3[.,]123[.,]37|3123[.,]37/i.test(text),
    remainingAmountZeroVisible: /Remaining Amount[\s\S]{0,220}0,00|Restbetrag[\s\S]{0,220}0,00/i.test(text),
    appliedEntriesVisible: /Applied Entries\s*1|Applied Entries1/i.test(text),
    applicationVisible: /\bApplication\b/i.test(text),
    glBankAccountEffectVisible: /18200|BANK-RM-01|Bank Account BANK-RM-01/i.test(text),
    openStillVisible: /\bOpen\b|Offen|Remaining Amount|Restbetrag/i.test(text),
    closedVisible: /\bClosed\b|Geschlossen|Closed by/i.test(text),
    relevantButtons: buttons.filter((button) => /Entry|Posten|Apply|Ausgleich|Navigate|Find|Show|Open|Dimension/i.test(button)),
    textEvidenceFile: `${target.fileStem}-page-text.txt`,
    screenshot: target.imageFileName
  };
}

async function checkVendorEntryStillOpen(page: Page) {
  const target: TraceTarget = {
    id: 'vendor-ledger-before-payment',
    pageId: 29,
    tableName: 'Vendor Ledger Entry',
    filterField: 'Document No.',
    filterValue: postedPurchaseInvoiceNo,
    fileStem: '010-vendor-ledger-before-payment',
    imageFileName: 'bank-020-010-vendor-ledger-before-payment.png',
    labelPattern: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten/i
  };
  const trace = await openFilteredPageAndCapture(page, target);
  return {
    ...trace,
    stillOpenEnoughForPayment: trace.filterValueVisible && !trace.remainingAmountZeroVisible && !trace.closedVisible
  };
}

async function checkPaymentDocumentNotAlreadyPosted(page: Page) {
  const target: TraceTarget = {
    id: 'existing-payment-document-guard',
    pageId: 29,
    tableName: 'Vendor Ledger Entry',
    filterField: 'Document No.',
    filterValue: paymentDocumentNo,
    fileStem: '005-existing-payment-document-guard',
    imageFileName: 'bank-020-005-existing-payment-document-guard.png',
    labelPattern: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten/i
  };
  const trace = await openFilteredPageAndCapture(page, target);
  return {
    ...trace,
    safeToPostOnce: !trace.paymentDocumentVisible && !trace.filterValueVisible
  };
}

async function captureApplyEntriesPreflight(page: Page) {
  const beforeButtons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const clicked = await clickAction(page, /^Apply Entries$|^Posten ausgleichen$|Apply Entries|Ausgleichen/i);
  await dismissTours(page);
  await page.waitForTimeout(2500);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const opened =
    clicked && /Apply.*Entries|Apply Vendor Entries|Posten ausgleichen|108205|40000|Remaining Amount/i.test(text);
  await writeTextEvidence(bankEvidencePath('030-apply-entries-preflight-page-text.txt'), compactPageText(text));
  await writeJsonEvidence(bankEvidencePath('030-apply-entries-preflight-controls.json'), {
    beforeButtons,
    clicked,
    opened,
    documentVisible: /108205|40000/i.test(text),
    dangerousActionsVisible: /Set Applies-to ID|Post Application/i.test(`${text}\n${buttons.join('\n')}`),
    dangerousActionsClicked: false,
    buttons
  });
  if (opened) {
    await screenshot(page, 'bank-020-030-apply-entries-preflight.png', {
      projectName: project.name,
      testId,
      status: 'labor',
      purpose:
        'BANK-020 Apply Entries vor Kreditorenzahlung read-only pruefen; Applies-to ist ueber Journalfelder gesetzt, keine separate Apply-Aktion.',
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
    documentVisible: /108205|40000/i.test(text),
    dangerousActionsVisible: /Set Applies-to ID|Post Application/i.test(`${text}\n${buttons.join('\n')}`),
    dangerousActionsClicked: false
  };
}

async function postDraftOnce(page: Page) {
  await openPaymentJournal(page);
  const frame = await paymentJournalFrame(page);
  const controlsBeforePost = snapshotControls(await firstLineControls(frame));
  const beforeText = normalizeText(await pageText(page));
  const draftVisibleBeforePost =
    beforeText.includes(paymentDocumentNo) || controlsBeforePost.some((control) => control.value === paymentDocumentNo);
  const postVisibleBeforeClick = (await visibleButtonNames(page)).some((button) => /^Post$|^Buchen$/i.test(button));
  const clickedPost = postVisibleBeforeClick ? await clickAction(page, /^Post$|^Buchen$/i) : false;
  await page.waitForTimeout(2500);
  const dialogText = normalizeText(await pageText(page));
  const dialogButtons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const confirmationDialogVisible =
    clickedPost && /Do you want to post|journal lines|Buch\.-Blatt|buchen|Ja|Nein|Yes|No/i.test(`${dialogText}\n${dialogButtons.join('\n')}`);

  await writeTextEvidence(bankEvidencePath('040-post-confirm-dialog-page-text.txt'), compactPageText(dialogText));
  await screenshot(page, 'bank-020-040-post-confirm-dialog.png', {
    projectName: project.name,
    testId,
    status: confirmationDialogVisible ? 'labor' : 'rejected',
    purpose: `BANK-020 Buchungsdialog vor der genau einmaligen Labor-Kreditorenzahlung ${paymentDocumentNo}.`,
    knownLimitations: [
      'Vor-Bestaetigungsbild; beweist noch keine Posten.',
      'CRONUS-USA-Labor; kein deutscher Bank-/Compliance-Finalnachweis.'
    ],
    bookUse: 'process-proof'
  });

  const confirmed = confirmationDialogVisible ? await clickAction(page, /^Yes$|^Ja$|^OK$/i) : false;
  await page.waitForTimeout(12_000);
  const resultText = normalizeText(await pageText(page));
  const resultButtons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(bankEvidencePath('050-post-result-page-text.txt'), compactPageText(resultText));
  await screenshot(page, 'bank-020-050-post-result.png', {
    projectName: project.name,
    testId,
    status: confirmed ? 'labor' : 'rejected',
    purpose: `BANK-020 Zustand nach Bestaetigung der Labor-Kreditorenzahlung ${paymentDocumentNo}.`,
    knownLimitations: [
      'Kurzlebiger Ergebniszustand; belastbarer Nachweis folgt ueber gefilterte Postenlisten.',
      'CRONUS-USA-Labor; kein deutscher Finalnachweis.'
    ],
    bookUse: 'evidence'
  });
  await clickAction(page, /^OK$|^Schlie|^Close$/i);

  return {
    draftVisibleBeforePost,
    postVisibleBeforeClick,
    clickedPost,
    confirmationDialogVisible,
    confirmed,
    resultTextHasSuccess: /successfully posted|erfolgreich gebucht|journal lines were successfully/i.test(resultText),
    buttonsInDialog: dialogButtons,
    resultButtons
  };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# BANK-020 Kontrollierte Labor-Kreditorenzahlung',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, Bank/Payments vendor payment, UI-first, no-bank-reconciliation, not-final |',
    `| Zahlungsbeleg | \`${result.paymentDocumentNo}\` |`,
    '| Ausgangsrechnung | `108205` / `40000` |',
    '| Gegenkonto | `BANK-RM-01` |',
    '| Betrag | `3.123,37` |',
    '',
    '## Entscheidungssatz',
    '',
    result.decisionSentence,
    '',
    '## Preflight',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Kreditorenposten vorher offen sichtbar | ${result.preflight.vendorEntryOpen ? 'ja' : 'nein'} |`,
    `| Draft sichtbar | ${result.preflight.draftVisible ? 'ja' : 'nein'} |`,
    `| 40000 sichtbar | ${result.preflight.vendorVisible ? 'ja' : 'nein'} |`,
    `| BANK-RM-01 sichtbar | ${result.preflight.bankVisible ? 'ja' : 'nein'} |`,
    `| 108205 als Applies-to Doc. No. sichtbar | ${result.preflight.invoiceReferenceVisible ? 'ja' : 'nein'} |`,
    `| Amount 3.123,37 sichtbar | ${result.preflight.amountVisible ? 'ja' : 'nein'} |`,
    `| Applied Checkbox | \`${result.preflight.appliedCheckboxValue}\` |`,
    `| Journal Check 0 Issues | ${result.preflight.journalCheckZeroIssues ? 'ja' : 'nein'} |`,
    `| Apply Entries geoeffnet | ${result.preflight.applyEntriesOpened ? 'ja' : 'nein'} |`,
    '',
    '## Buchung',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Post-Dialog sichtbar | ${result.posting.confirmationDialogVisible ? 'ja' : 'nein'} |`,
    `| Genau einmal bestaetigt | ${result.posting.confirmed ? 'ja' : 'nein'} |`,
    `| Erfolgstext sichtbar | ${result.posting.resultTextHasSuccess ? 'ja' : 'nein'} |`,
    '',
    '## Postenspur',
    '',
    '| Postenart | sichtbar | Hinweis |',
    '|---|---:|---|',
    ...result.traces.map(
      (trace: any) =>
        `| ${trace.id} | ${trace.filterValueVisible || trace.paymentDocumentVisible || trace.invoiceVisible ? 'ja' : 'nein'} | ${trace.textEvidenceFile} |`
    ),
    '',
    '## Anfaenger-Lernwert',
    '',
    'Eine Kreditorenzahlung schliesst den Einkaufskreis nicht durch eine neue Einkaufsrechnung, sondern durch einen Zahlungsbezug auf den offenen Kreditorenposten. Im Payment Journal muessen deshalb Kreditor, Betrag, Bankgegenkonto und `Applies-to Doc. No.` zusammenpassen.',
    '',
    'Nach der Buchung muss der Leser nicht nur die gebuchte Zahlung sehen, sondern auch pruefen, ob die urspruengliche Einkaufsrechnung als offener Posten erledigt ist, welche detaillierten Kreditorenposten entstanden sind und welche Sachkonten getroffen wurden.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor, kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.',
    '- Keine Bankabstimmung in diesem Lauf.',
    '- Keine deutsche Vorsteuer- oder E-Rechnungs-Finalaussage.',
    '- Deutsche Final-Screenshots muessen spaeter neu erzeugt werden.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('BANK-020 Single-Line Vendor Payment buchen und Postenspur sichern', async ({ page }) => {
  const existingPaymentGuard = await checkPaymentDocumentNotAlreadyPosted(page);
  await writeJsonEvidence(bankEvidencePath('005-existing-payment-document-guard.json'), existingPaymentGuard);
  expect(
    existingPaymentGuard.safeToPostOnce,
    'BANK018-108205 darf vor diesem Lauf noch nicht als gebuchter Kreditorenposten sichtbar sein.'
  ).toBe(true);

  const vendorBefore = await checkVendorEntryStillOpen(page);
  await writeJsonEvidence(bankEvidencePath('010-vendor-ledger-before-payment.json'), vendorBefore);
  expect(vendorBefore.stillOpenEnoughForPayment, '108205 muss vor BANK-020 noch als offener Kreditorenposten sichtbar sein.').toBe(true);

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
  await screenshot(page, 'bank-020-020-payment-journal-preflight.png', {
    projectName: project.name,
    testId,
    status: draft.journalCheck.zeroIssuesTotalVisible ? 'labor' : 'rejected',
    purpose:
      'BANK-020 Payment Journal vor Labor-Kreditorenzahlung: 40000, 108205, BANK-RM-01, Amount und Journal Check.',
    knownLimitations: [
      'Vor-Buchungsbild; beweist noch keine Zahlungswirkung.',
      'CRONUS-USA-Labor; kein deutscher Finalnachweis.'
    ],
    bookUse: 'process-proof'
  });

  const applyEntries = await captureApplyEntriesPreflight(page);
  const preflightPassed =
    vendorBefore.stillOpenEnoughForPayment &&
    draft.documentNoVisible &&
    draft.vendorVisible &&
    draft.bankVisible &&
    draft.invoiceReferenceVisible &&
    draft.amountVisible &&
    draft.appliedCheckboxValue === 'on' &&
    draft.appliesToDocNoValue === postedPurchaseInvoiceNo &&
    draft.journalCheck.zeroIssuesTotalVisible &&
    draft.journalCheck.zeroLinesWithIssuesVisible &&
    applyEntries.opened &&
    applyEntries.documentVisible &&
    !applyEntries.dangerousActionsClicked;

  if (!preflightPassed) {
    const cleanup = await cleanupDraftLine(page);
    const blocker = {
      testId: 'BANK-020',
      environment: 'MCP_1_20260210',
      company: project.defaultCompany,
      mode: 'preflight-blocked-no-vendor-payment',
      paymentDocumentNo,
      existingPaymentGuard,
      vendorBefore,
      draft,
      applyEntries,
      cleanup,
      posted: false,
      nextStep: 'BANK-020 Payment-Journal-Preflight gezielt korrigieren; bis dahin keine Kreditorenzahlung buchen.'
    };
    await writeJsonEvidence(bankEvidencePath('BANK-020-result.json'), blocker);
    await writeTextEvidence(bankEvidencePath('BANK-020-VENDOR-PAYMENT-BLOCKER.md'), renderMarkdown({
      environment: 'MCP_1_20260210',
      company: project.defaultCompany,
      paymentDocumentNo,
      decisionSentence: 'Preflight blockiert; keine Kreditorenzahlung gebucht.',
      preflight: {
        vendorEntryOpen: vendorBefore.stillOpenEnoughForPayment,
        draftVisible: draft.documentNoVisible,
        vendorVisible: draft.vendorVisible,
        bankVisible: draft.bankVisible,
        invoiceReferenceVisible: draft.invoiceReferenceVisible,
        amountVisible: draft.amountVisible,
        appliedCheckboxValue: draft.appliedCheckboxValue,
        journalCheckZeroIssues: draft.journalCheck.zeroIssuesTotalVisible,
        applyEntriesOpened: applyEntries.opened
      },
      posting: { confirmationDialogVisible: false, confirmed: false, resultTextHasSuccess: false },
      traces: [],
      nextStep: blocker.nextStep
    }));
    throw new Error('BANK-020 Preflight nicht vollstaendig; keine Kreditorenzahlung gebucht.');
  }

  const decisionSentence =
    'Diese Buchung ist als autonome RM-DEMO-Laborbuchung vertretbar, weil der offene Kreditorenposten 108205 fuer 40000 im UI sichtbar ist, die Payment-Journal-Zeile mit BANK-RM-01 und 3.123,37 auf genau diese Rechnung verweist, Journal Check 0 Issues zeigt, Apply Entries read-only geprueft wurde und die erwartete Postenspur Kreditorenposten, detaillierte Kreditorenposten, Bankposten und Sachposten umfasst; Risiko und Grenze bleiben CRONUS-USA-Labor ohne Bankabstimmung und ohne deutschen Finalnachweis.';
  await writeTextEvidence(bankEvidencePath('035-posting-decision.txt'), decisionSentence);

  const posting = await postDraftOnce(page);
  expect(posting.confirmationDialogVisible, 'Der Post-Dialog muss vor Bestaetigung sichtbar sein.').toBe(true);
  expect(posting.confirmed, 'BANK-020 muss genau einmal bestaetigt werden.').toBe(true);

  const traceTargets: TraceTarget[] = [
    {
      id: 'vendor-ledger-invoice-after-payment',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      filterField: 'Document No.',
      filterValue: postedPurchaseInvoiceNo,
      fileStem: '060-vendor-ledger-invoice-after-payment',
      imageFileName: 'bank-020-060-vendor-ledger-invoice-after-payment.png',
      labelPattern: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten/i
    },
    {
      id: 'vendor-ledger-payment',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '061-vendor-ledger-payment',
      imageFileName: 'bank-020-061-vendor-ledger-payment.png',
      labelPattern: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten/i
    },
    {
      id: 'detailed-vendor-ledger-payment',
      pageId: 574,
      tableName: 'Detailed Vendor Ledg. Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '062-detailed-vendor-ledger-payment',
      imageFileName: 'bank-020-062-detailed-vendor-ledger-payment.png',
      labelPattern: /Detailed Vendor|Detailed Vend|Detaillierte Kreditorenposten|Vendor Ledger/i
    },
    {
      id: 'bank-account-ledger-payment',
      pageId: 372,
      tableName: 'Bank Account Ledger Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '063-bank-account-ledger-payment',
      imageFileName: 'bank-020-063-bank-account-ledger-payment.png',
      labelPattern: /Bank Account Ledger Entries|Bank Account Ledger Entry|Bankposten/i
    },
    {
      id: 'gl-entries-payment',
      pageId: 20,
      tableName: 'G/L Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '064-gl-entries-payment',
      imageFileName: 'bank-020-064-gl-entries-payment.png',
      labelPattern: /G\/L Entries|G\/L Entry|Sachposten|Account No\.|Konto/i
    }
  ];

  const traces = [];
  for (const target of traceTargets) {
    traces.push(await openFilteredPageAndCapture(page, target));
  }

  const invoiceRemainingAmountZeroVisible =
    traces.find((entry) => entry.id === 'vendor-ledger-invoice-after-payment')?.remainingAmountZeroVisible ?? false;
  const invoiceAppliedEntriesVisible =
    traces.find((entry) => entry.id === 'vendor-ledger-invoice-after-payment')?.appliedEntriesVisible ?? false;
  const detailedVendorLedgerApplicationVisible =
    traces.find((entry) => entry.id === 'detailed-vendor-ledger-payment')?.applicationVisible ?? false;
  const bankAccountLedgerPageVisible =
    traces.find((entry) => entry.id === 'bank-account-ledger-payment')?.paymentDocumentVisible ?? false;
  const glBankAccountEffectVisible =
    traces.find((entry) => entry.id === 'gl-entries-payment')?.glBankAccountEffectVisible ?? false;

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: 'BANK-020-VENDOR-PAYMENT-108205-CONTROLLED-POSTING',
    source: 'playwright-ui-payment-journal-posting',
    resultStatus: posting.confirmed ? 'observed' : 'blocked',
    testId: 'BANK-020',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    sourceCompany: project.defaultCompany,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-5.4-high',
    dataBasis: 'CRONUS USA',
    mode: 'controlled-ui-vendor-payment',
    bcRun: true,
    playwrightRun: true,
    previewPosting: false,
    paymentPosted: posting.confirmed,
    setupChanged: false,
    companySwitch: false,
    apiShortcut: false,
    bookChanged: false,
    paymentDocumentNo,
    sourceContext: {
      postedPurchaseInvoiceNo,
      vendorNo,
      bankAccountNo,
      amountInput: paymentAmount
    },
    decisionSentence,
    preflight: {
      existingPaymentDocumentNotPostedBeforeRun: existingPaymentGuard.safeToPostOnce,
      vendorEntryOpen: vendorBefore.stillOpenEnoughForPayment,
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
      applyEntriesOpened: applyEntries.opened,
      applyEntriesDocumentVisible: applyEntries.documentVisible
    },
    posting,
    posted: posting.confirmed,
    traces,
    traceSummary: {
      invoiceVendorLedgerVisible: traces.find((entry) => entry.id === 'vendor-ledger-invoice-after-payment')?.invoiceVisible ?? false,
      paymentVendorLedgerVisible: traces.find((entry) => entry.id === 'vendor-ledger-payment')?.paymentDocumentVisible ?? false,
      detailedVendorLedgerVisible: traces.find((entry) => entry.id === 'detailed-vendor-ledger-payment')?.paymentDocumentVisible ?? false,
      bankLedgerVisible: traces.find((entry) => entry.id === 'bank-account-ledger-payment')?.paymentDocumentVisible ?? false,
      glEntriesVisible: traces.find((entry) => entry.id === 'gl-entries-payment')?.paymentDocumentVisible ?? false
    },
    postTraceInterpretation: {
      invoiceRemainingAmountZeroVisible,
      invoiceAppliedEntriesVisible,
      detailedVendorLedgerApplicationVisible,
      bankAccountLedgerPageVisible,
      glBankAccountEffectVisible,
      noBankReconciliation: true,
      notGermanFinalProof: true
    },
    proves: [
      'Die Labor-Kreditorenzahlung wurde UI-first aus dem Payment Journal gebucht.',
      '40000, 108205, BANK-RM-01, Betrag und Journal Check wurden vor der Buchung sichtbar geprueft.',
      'Nach der Buchung wurden Kreditorenposten, detaillierte Kreditorenposten, Bankposten und Sachposten gefiltert geprueft.'
    ],
    doesNotProve: [
      'Keine Bankabstimmung.',
      'Kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.',
      'Keine deutsche 19-Prozent-Vorsteuer.',
      'Keine E-Rechnung.'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-020/'],
    blockedBy: posting.confirmed ? [] : ['payment-posting-not-confirmed'],
    requiresReview: !invoiceRemainingAmountZeroVisible,
    safeToFinalizeState: false,
    statePatch: {},
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    rebuildInstruction:
      'In der deutschen Zielcompany dieselbe kontrollierte Kreditorenzahlung mit deutschem Kreditor, deutschem Bankkonto, Post-Dialog und Vendor/Bank/G-L Ledger Trace neu erzeugen.',
    targetGermanCompanyImpact:
      'German final company needs its own vendor payment posting and ledger trace; RM-DEMO remains laboratory reference only.',
    finalScreenshotNeeded: true,
    nextStep:
      'BANK-021: trace-review/book-sync for BANK-020; then decide whether bank reconciliation remains lab-sufficient or needs a fresh statement route.'
  };

  await writeJsonEvidence(bankEvidencePath('BANK-020-result.json'), result);
  await writeTextEvidence(bankEvidencePath('BANK-020-VENDOR-PAYMENT.md'), renderMarkdown(result));
  await writeTextEvidence(
    bankEvidencePath('README.md'),
    [
      '# BANK-020 Evidence Index',
      '',
      'Status: CRONUS-USA-Labor, autonome UI-Kreditorenzahlung, OP-Ausgleich/Payment-Trace, keine Bankabstimmung, kein deutscher Finalnachweis.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `005-existing-payment-document-guard.json` | UI-Duplikat-Guard | `BANK018-108205` war vor der Buchung nicht als Kreditorenposten sichtbar | keine fachliche Zahlungswirkung | labor, preflight |',
      '| `010-vendor-ledger-before-payment.json` | UI-Preflight | `108205` war vor Zahlung als Kreditorenposten sichtbar/offen genug fuer Zahlung | keine Zahlungswirkung | labor, preflight |',
      '| `020-payment-journal-preflight-controls.json` | UI-Control-Snapshot | Payment-Journal-Zeile mit 40000, BANK-RM-01, Betrag, Applies-to und Journal Check | keine Zahlung vor Bestaetigung | labor, preflight |',
      '| `030-apply-entries-preflight-controls.json` | UI-/Button-Evidence | Apply Entries wurde vor Buchung read-only geprueft | kein Set Applies-to ID, kein Post Application | labor, preflight |',
      '| `035-posting-decision.txt` | Entscheidungssatz | warum die autonome Laborbuchung vertretbar war | keine Posten | labor, autonomous-posting |',
      '| `040-post-confirm-dialog-page-text.txt` | kompakter Seitentext | Post-Dialog vor Bestaetigung | keine Posten vor Ja | labor, process-proof |',
      '| `050-post-result-page-text.txt` | kompakter Seitentext | Zustand nach Bestaetigung | keine vollstaendige Postenspur allein | labor |',
      '| `060-vendor-ledger-invoice-after-payment-page-text.txt` | kompakter UI-Seitentext | Rechnung `108205` nach Zahlung | keine Bankabstimmung, keine deutsche Finalaussage | labor, posting-trace |',
      '| `061-vendor-ledger-payment-page-text.txt` | kompakter UI-Seitentext | Zahlungsbeleg `BANK018-108205` | keine Bankabstimmung | labor, posting-trace |',
      '| `062-detailed-vendor-ledger-payment-page-text.txt` | kompakter UI-Seitentext | detaillierte Kreditorenposten zur Zahlung | keine Unapply-Pruefung | labor, posting-trace |',
      '| `063-bank-account-ledger-payment-page-text.txt` | kompakter UI-Seitentext | Bank Account Ledger Entry zur Zahlung, falls sichtbar | keine Bankabstimmung | labor, posting-trace |',
      '| `064-gl-entries-payment-page-text.txt` | kompakter UI-Seitentext | Sachposten zur Zahlung | keinen deutschen Kontenplan-Endstand | labor, posting-trace |',
      '| `BANK-020-result.json` | JSON-Ergebnis | strukturierter Preflight-, Posting- und Postenspur-Befund | keine Compliance-Finalaussage | labor |',
      '| `BANK-020-VENDOR-PAYMENT.md` | Lernzusammenfassung | Anfaengererklaerung, OP-Ausgleich, Buchwirkung, Grenzen und naechster Schritt | keinen deutschen Finalnachweis | labor |',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(true);
  expect(result.traceSummary.paymentVendorLedgerVisible).toBe(true);
  expect(result.traceSummary.glEntriesVisible).toBe(true);
});
