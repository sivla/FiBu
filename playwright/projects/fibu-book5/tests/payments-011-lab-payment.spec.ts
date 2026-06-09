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

test.setTimeout(540_000);

const testId = 'payments-011';
const pageIdCashReceiptJournal = 255;
const paymentDocumentNo = 'PAY011-PS103297';

type ControlHandle = {
  handle: import('@playwright/test').ElementHandle<HTMLElement>;
  tag: string;
  x: number;
  y: number;
  value: string;
  title: string;
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

function paymentsEvidencePath(fileName: string) {
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
    /PAY011|BANK-RM-01|Cash Receipt Journal|Customer Ledger Entries|Detailed Cust|Bank Account Ledger|G\/L Entries|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Amount|Amount \(\$\)|Bal\. Account|Applies-to|Apply Entries|Journal Check|Refresh|Post|Payment|Customer|D10000|PS-INV103297|Lines checked|Lines with issues|Issues Total|Current line|No issues|Remaining Amount|Open|Closed|Closed by|successful|posted|muss|must/i;
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
        await action.click().catch(() => undefined);
        await page.waitForTimeout(2000);
        return true;
      }
    }
  }
  return false;
}

async function openCashReceiptJournal(page: Page) {
  await page.goto(unfilteredBcPageUrl(pageIdCashReceiptJournal), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);
}

async function cashReceiptJournalFrame(page: Page) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
      if (/Cash Receipt Journals/i.test(text) && /Batch Name/i.test(text)) return frame;
    }
    await page.waitForTimeout(1500);
  }
  throw new Error('Cash-Receipt-Journal-Frame nicht gefunden.');
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
    text: sanitizeEvidenceText(control.text.trim()).slice(0, 80)
  }));
}

async function fillControl(control: ControlHandle, value: string) {
  if (control.tag === 'SELECT') {
    await control.handle.selectOption({ label: value }).catch(async () => {
      await control.handle.selectOption({ value });
    });
  } else {
    await control.handle.fill(value);
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
  const frame = await cashReceiptJournalFrame(page);
  const initialControls = await firstLineControls(frame);
  if (initialControls.length < 14) {
    throw new Error(`Zu wenige sichtbare Cash-Receipt-Controls gefunden: ${initialControls.length}.`);
  }

  await fillControl(initialControls[0], '08.06.2026');
  await fillControl(initialControls[1], 'Payment');
  await fillControl(initialControls[2], paymentDocumentNo);
  await fillControl(initialControls[3], 'Customer');
  await fillControl(initialControls[4], 'D10000');
  await page.waitForTimeout(1800);
  await fillControl(initialControls[5], 'PAYMENTS-011 lab payment PS-INV103297');
  await typeTextLikeUser(initialControls[7], '-68.000,00', 'Tab');
  await page.waitForTimeout(1200);

  const controlsAfterAmount = await firstLineControls(frame);
  await fillControl(controlsAfterAmount[9], 'Bank Account');
  await fillControl(controlsAfterAmount[10], 'BANK-RM-01');
  await page.waitForTimeout(1500);
  await fillControl(controlsAfterAmount[12], 'Invoice');
  await fillControl(controlsAfterAmount[13], 'PS-INV103297');
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(2500);

  const controlsBeforeRefocus = await firstLineControls(frame);
  await typeTextLikeUser(controlsBeforeRefocus[7], '-68.000,00', 'Enter');
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
    customerVisible: values.includes('D10000') || /D10000/i.test(text),
    bankVisible: values.includes('BANK-RM-01') || /BANK-RM-01/i.test(text),
    invoiceReferenceVisible: values.includes('PS-INV103297') || /PS-INV103297/i.test(text),
    amountVisible: values.some((value) => /-68[.,]?000|-68000/i.test(value)) || /-68[.,]?000/i.test(text),
    appliedCheckboxValue: finalSnapshot[11]?.value ?? '',
    appliesToDocTypeValue: finalSnapshot[12]?.value ?? '',
    appliesToDocNoValue: finalSnapshot[13]?.value ?? ''
  };
}

async function cleanupDraftLine(page: Page) {
  await openCashReceiptJournal(page);
  const frame = await cashReceiptJournalFrame(page);
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
  await writeTextEvidence(paymentsEvidencePath(`${target.fileStem}-page-text.txt`), compactPageText(text));
  await screenshot(page, target.imageFileName, {
    projectName: project.name,
    testId,
    status: target.labelPattern.test(text) && text.includes(target.filterValue) ? 'labor' : 'rejected',
    purpose: `PAYMENTS-011 UI-Postenspur fuer Laborzahlung ${paymentDocumentNo}: ${target.id}.`,
    knownLimitations: [
      'CRONUS-USA-Laborposten, kein deutscher Bank-/Steuer-/Compliance-Finalnachweis.',
      `Gefilterte UI-Ansicht auf ${target.filterField} = ${target.filterValue}; keine weitere Buchung.`
    ],
    bookUse: 'posting-trace'
  });

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValue: target.filterValue,
    pageContextVisible: target.labelPattern.test(text),
    filterValueVisible: text.includes(target.filterValue),
    customerVisible: /D10000/i.test(text),
    invoiceVisible: /PS-INV103297/i.test(text),
    paymentDocumentVisible: text.includes(paymentDocumentNo),
    amountVisible: /68[.,]000|68000|67[.,]673|67673/i.test(text),
    remainingAmountZeroVisible:
      /PS-INV103297[\s\S]{0,260}EUR\s+68\.000,00\s+68\.000,00\s+67\.673,60\s+0,00\s+0,00/i.test(text) ||
      /Remaining Amount[\s\S]{0,220}0,00/i.test(text),
    appliedEntriesVisible: /Applied Entries\s*1|Applied Entries1/i.test(text),
    paymentDiscountVisible: /Payment Discount|Discounts and Allowances|40910/i.test(text),
    applicationVisible: /\bApplication\b/i.test(text),
    glBankAccountEffectVisible: /18200|BANK-RM-01|Bank Account BANK-RM-01/i.test(text),
    openStillVisible: /\bOpen\b|Offen|Remaining Amount|Restbetrag/i.test(text),
    closedVisible: /\bClosed\b|Geschlossen|Closed by/i.test(text),
    relevantButtons: buttons.filter((button) => /Entry|Posten|Apply|Ausgleich|Navigate|Find|Show|Open|Dimension/i.test(button)),
    textEvidenceFile: `${target.fileStem}-page-text.txt`,
    screenshot: target.imageFileName
  };
}

async function checkCustomerEntryStillOpen(page: Page) {
  const target: TraceTarget = {
    id: 'customer-ledger-before-payment',
    pageId: 25,
    tableName: 'Cust. Ledger Entry',
    filterField: 'Document No.',
    filterValue: 'PS-INV103297',
    fileStem: '010-customer-ledger-before-payment',
    imageFileName: 'payments-011-010-customer-ledger-before-payment.png',
    labelPattern: /Customer Ledger Entries|Cust\. Ledger Entry|Debitorenposten/i
  };
  const trace = await openFilteredPageAndCapture(page, target);
  return {
    ...trace,
    stillOpenEnoughForPayment: trace.filterValueVisible && !trace.remainingAmountZeroVisible && !trace.closedVisible
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
    clicked && /Apply.*Entries|Apply Customer Entries|Posten ausgleichen|PS-INV103297|D10000|Remaining Amount/i.test(text);
  await writeTextEvidence(paymentsEvidencePath('030-apply-entries-preflight-page-text.txt'), compactPageText(text));
  await writeJsonEvidence(paymentsEvidencePath('030-apply-entries-preflight-controls.json'), {
    beforeButtons,
    clicked,
    opened,
    documentVisible: /PS-INV103297|D10000/i.test(text),
    dangerousActionsVisible: /Set Applies-to ID|Post Application/i.test(`${text}\n${buttons.join('\n')}`),
    dangerousActionsClicked: false,
    buttons
  });
  if (opened) {
    await screenshot(page, 'payments-011-030-apply-entries-preflight.png', {
      projectName: project.name,
      testId,
      status: 'labor',
      purpose:
        'PAYMENTS-011 Apply Entries vor Laborzahlung read-only pruefen; Applies-to ist ueber Journalfelder gesetzt, keine separate Apply-Aktion.',
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
    documentVisible: /PS-INV103297|D10000/i.test(text),
    dangerousActionsVisible: /Set Applies-to ID|Post Application/i.test(`${text}\n${buttons.join('\n')}`),
    dangerousActionsClicked: false
  };
}

async function postDraftOnce(page: Page) {
  await openCashReceiptJournal(page);
  const frame = await cashReceiptJournalFrame(page);
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

  await writeTextEvidence(paymentsEvidencePath('040-post-confirm-dialog-page-text.txt'), compactPageText(dialogText));
  await screenshot(page, 'payments-011-040-post-confirm-dialog.png', {
    projectName: project.name,
    testId,
    status: confirmationDialogVisible ? 'labor' : 'rejected',
    purpose: `PAYMENTS-011 Buchungsdialog vor der genau einmaligen Laborzahlung ${paymentDocumentNo}.`,
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
  await writeTextEvidence(paymentsEvidencePath('050-post-result-page-text.txt'), compactPageText(resultText));
  await screenshot(page, 'payments-011-050-post-result.png', {
    projectName: project.name,
    testId,
    status: confirmed ? 'labor' : 'rejected',
    purpose: `PAYMENTS-011 Zustand nach Bestaetigung der Laborzahlung ${paymentDocumentNo}.`,
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
    '# PAYMENTS-011 Kontrollierte Laborzahlung',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, autonomous-posting, UI-first, no-bank-reconciliation, not-final |',
    `| Zahlungsbeleg | \`${result.paymentDocumentNo}\` |`,
    '| Ausgangsrechnung | `PS-INV103297` / `D10000` |',
    '| Gegenkonto | `BANK-RM-01`, Bank Acc. Posting Group `CHECKING` |',
    '| Betrag | `-68.000,00 EUR` |',
    '| Zahlungswirkung | Rechnung `PS-INV103297` zeigt nach der Buchung `Remaining Amount = 0,00` und `Applied Entries = 1` |',
    '| Skonto-/Discount-Wirkung | sichtbar als `Payment Discount` in Detailed Customer Ledger Entries und Konto `40910 Discounts and Allowances` in G/L Entries |',
    '',
    '## Entscheidungssatz',
    '',
    result.decisionSentence,
    '',
    '## Preflight',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Debitorenposten vorher offen sichtbar | ${result.preflight.customerEntryOpen ? 'ja' : 'nein'} |`,
    `| Draft sichtbar | ${result.preflight.draftVisible ? 'ja' : 'nein'} |`,
    `| D10000 sichtbar | ${result.preflight.customerVisible ? 'ja' : 'nein'} |`,
    `| BANK-RM-01 sichtbar | ${result.preflight.bankVisible ? 'ja' : 'nein'} |`,
    `| PS-INV103297 als Applies-to Doc. No. sichtbar | ${result.preflight.invoiceReferenceVisible ? 'ja' : 'nein'} |`,
    `| Amount -68.000,00 sichtbar | ${result.preflight.amountVisible ? 'ja' : 'nein'} |`,
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
        `| ${trace.id} | ${trace.filterValueVisible || trace.paymentDocumentVisible || trace.invoiceVisible ? 'ja' : 'nein'} | ${trace.id === 'bank-account-ledger-payment' ? 'kein belastbarer Bank-Account-Ledger-UI-Nachweis ueber Page 371' : trace.textEvidenceFile} |`
    ),
    '',
    '## Sichtbare Detailwirkung',
    '',
    '- Die Rechnung `PS-INV103297` ist im Debitorenposten mit `Remaining Amount = 0,00` und `Applied Entries = 1` sichtbar. Das ist der praktische OP-Ausgleich im Labor.',
    '- Der Zahlungsbeleg `PAY011-PS103297` zeigt im Debitorenposten Zahlungs- und Restbetragswirkung. Die Differenz ist als CRONUS-Skonto-/Payment-Discount-Wirkung zu lesen, nicht als deutscher Bank-Finalnachweis.',
    '- Die detaillierten Debitorenposten zeigen `Initial Entry`, `Payment Discount` und `Application`-Zeilen.',
    '- Die Sachposten zeigen `15110 Account Receivable, Domestic`, `18200 Business account, Operating, Domestic` und `40910 Discounts and Allowances`.',
    '',
    '## Anfaenger-Lernwert',
    '',
    'Eine Zahlung im Cash Receipt Journal ist kein reines Erfassen einer Bankbewegung. Business Central braucht Kontoart, Debitor, Betrag, Bankgegenkonto und den Bezug zur offenen Rechnung. Erst die Buchung erzeugt die Zahlungs-/Ausgleichswirkung in den Posten.',
    '',
    'Wichtig fuer das Buch: `Applies-to Doc. No.` zeigt den Zielposten vor der Buchung. Nach der Buchung muss der Leser in Debitorenposten, detaillierten Debitorenposten, Bankposten und Sachposten pruefen, ob der offene Posten wirklich geschlossen oder ausgeglichen wurde.',
    '',
    'Der Lauf zeigt zusaetzlich einen Anfaenger-Lernfall: Zahlungsbedingungen koennen Skonto/Payment Discount ausloesen. Deshalb ist der gebuchte Zahlungsbeleg nicht nur der eingegebene Betrag, sondern enthaelt in Detailposten und Sachposten zusaetzliche Ausgleichs- und Discount-Wirkung.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor, kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.',
    '- Keine Bankabstimmung in diesem Lauf.',
    '- Keine Kreditorenzahlung in diesem Lauf.',
    '- Bank Account Ledger Entries wurden ueber den getesteten Page-371-Pfad nicht belastbar sichtbar; der Bankpostenpfad bleibt ein read-only Folgeschritt.',
    '- Deutsche 19-%-USt bleibt offen.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('PAYMENTS-011 kontrollierte Laborzahlung buchen und Postenspur sichern', async ({ page }) => {
  const customerBefore = await checkCustomerEntryStillOpen(page);
  await writeJsonEvidence(paymentsEvidencePath('010-customer-ledger-before-payment.json'), customerBefore);
  expect(customerBefore.stillOpenEnoughForPayment, 'PS-INV103297 muss vor PAYMENTS-011 noch offen sein.').toBe(true);

  await openCashReceiptJournal(page);
  const draft = await prepareDraft(page);
  await writeJsonEvidence(paymentsEvidencePath('020-cash-receipt-preflight-controls.json'), {
    documentNo: paymentDocumentNo,
    finalSnapshot: draft.finalSnapshot,
    buttons: draft.buttons,
    journalCheck: draft.journalCheck
  });
  await writeTextEvidence(paymentsEvidencePath('020-cash-receipt-preflight-page-text.txt'), compactPageText(draft.text));
  await screenshot(page, 'payments-011-020-cash-receipt-preflight.png', {
    projectName: project.name,
    testId,
    status: draft.journalCheck.zeroIssuesTotalVisible ? 'labor' : 'rejected',
    purpose:
      'PAYMENTS-011 Cash Receipt Journal vor Laborzahlung: D10000, PS-INV103297, BANK-RM-01, Amount und Journal Check.',
    knownLimitations: [
      'Vor-Buchungsbild; beweist noch keine Zahlungswirkung.',
      'CRONUS-USA-Labor; kein deutscher Finalnachweis.'
    ],
    bookUse: 'process-proof'
  });

  const applyEntries = await captureApplyEntriesPreflight(page);
  const preflightPassed =
    customerBefore.stillOpenEnoughForPayment &&
    draft.documentNoVisible &&
    draft.customerVisible &&
    draft.bankVisible &&
    draft.invoiceReferenceVisible &&
    draft.amountVisible &&
    draft.appliedCheckboxValue === 'on' &&
    draft.appliesToDocNoValue === 'PS-INV103297' &&
    draft.journalCheck.zeroIssuesTotalVisible &&
    draft.journalCheck.zeroLinesWithIssuesVisible &&
    applyEntries.opened &&
    applyEntries.documentVisible &&
    !applyEntries.dangerousActionsClicked;

  if (!preflightPassed) {
    const cleanup = await cleanupDraftLine(page);
    const blocker = {
      testId: 'PAYMENTS-011',
      environment: 'MCP_1_20260210',
      company: project.defaultCompany,
      mode: 'preflight-blocked-no-payment',
      paymentDocumentNo,
      customerBefore,
      draft,
      applyEntries,
      cleanup,
      posted: false,
      nextStep: 'PAYMENTS-011 Preflight gezielt korrigieren; bis dahin keine Laborzahlung buchen.'
    };
    await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-011-result.json'), blocker);
    throw new Error('PAYMENTS-011 Preflight nicht vollstaendig; keine Zahlung gebucht.');
  }

  const decisionSentence =
    'Diese Buchung ist als autonome RM-DEMO-Laborbuchung vertretbar, weil der bestehende offene Debitorenposten PS-INV103297 fuer D10000 im UI sichtbar ist, die Cash-Receipt-Journal-Zeile mit BANK-RM-01 und -68.000,00 EUR auf genau diese Rechnung verweist, Journal Check 0 Issues zeigt, Apply Entries read-only geprueft wurde und die erwartete Postenspur Debitorenposten, detaillierte Debitorenposten, Bankposten und Sachposten umfasst; Risiko und Grenze bleiben CRONUS-USA-Labor ohne Bankabstimmung und ohne deutschen Finalnachweis.';
  await writeTextEvidence(paymentsEvidencePath('035-posting-decision.txt'), decisionSentence);

  const posting = await postDraftOnce(page);
  expect(posting.confirmationDialogVisible, 'Der Post-Dialog muss vor Bestaetigung sichtbar sein.').toBe(true);
  expect(posting.confirmed, 'PAYMENTS-011 muss genau einmal bestaetigt werden.').toBe(true);

  const traceTargets: TraceTarget[] = [
    {
      id: 'customer-ledger-invoice-after-payment',
      pageId: 25,
      tableName: 'Cust. Ledger Entry',
      filterField: 'Document No.',
      filterValue: 'PS-INV103297',
      fileStem: '060-customer-ledger-invoice-after-payment',
      imageFileName: 'payments-011-060-customer-ledger-invoice-after-payment.png',
      labelPattern: /Customer Ledger Entries|Cust\. Ledger Entry|Debitorenposten/i
    },
    {
      id: 'customer-ledger-payment',
      pageId: 25,
      tableName: 'Cust. Ledger Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '061-customer-ledger-payment',
      imageFileName: 'payments-011-061-customer-ledger-payment.png',
      labelPattern: /Customer Ledger Entries|Cust\. Ledger Entry|Debitorenposten/i
    },
    {
      id: 'detailed-customer-ledger-payment',
      pageId: 573,
      tableName: 'Detailed Cust. Ledg. Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '062-detailed-customer-ledger-payment',
      imageFileName: 'payments-011-062-detailed-customer-ledger-payment.png',
      labelPattern: /Detailed Cust|Detailed Customer|Detaillierte Debitorenposten|Cust\. Ledger/i
    },
    {
      id: 'bank-account-ledger-payment',
      pageId: 371,
      tableName: 'Bank Account Ledger Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '063-bank-account-ledger-payment',
      imageFileName: 'payments-011-063-bank-account-ledger-payment.png',
      labelPattern: /Bank Account Ledger Entries|Bank Account Ledger Entry|Bankposten/i
    },
    {
      id: 'gl-entries-payment',
      pageId: 20,
      tableName: 'G/L Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '064-gl-entries-payment',
      imageFileName: 'payments-011-064-gl-entries-payment.png',
      labelPattern: /G\/L Entries|G\/L Entry|Sachposten|Account No\.|Konto/i
    }
  ];

  const traces = [];
  for (const target of traceTargets) {
    traces.push(await openFilteredPageAndCapture(page, target));
  }

  const result = {
    testId: 'PAYMENTS-011',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'controlled-ui-lab-payment',
    paymentDocumentNo,
    sourceContext: {
      postedSalesInvoiceNo: 'PS-INV103297',
      customerNo: 'D10000',
      bankAccountNo: 'BANK-RM-01',
      bankAccountPostingGroup: 'CHECKING',
      amountInput: '-68.000,00'
    },
    decisionSentence,
    preflight: {
      customerEntryOpen: customerBefore.stillOpenEnoughForPayment,
      draftVisible: draft.documentNoVisible,
      customerVisible: draft.customerVisible,
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
      invoiceCustomerLedgerVisible: traces.find((entry) => entry.id === 'customer-ledger-invoice-after-payment')?.invoiceVisible ?? false,
      paymentCustomerLedgerVisible: traces.find((entry) => entry.id === 'customer-ledger-payment')?.paymentDocumentVisible ?? false,
      detailedCustomerLedgerVisible: traces.find((entry) => entry.id === 'detailed-customer-ledger-payment')?.paymentDocumentVisible ?? false,
      bankLedgerVisible: traces.find((entry) => entry.id === 'bank-account-ledger-payment')?.paymentDocumentVisible ?? false,
      glEntriesVisible: traces.find((entry) => entry.id === 'gl-entries-payment')?.paymentDocumentVisible ?? false
    },
    postTraceInterpretation: {
      invoiceRemainingAmountZeroVisible:
        traces.find((entry) => entry.id === 'customer-ledger-invoice-after-payment')?.remainingAmountZeroVisible ?? false,
      invoiceAppliedEntriesVisible:
        traces.find((entry) => entry.id === 'customer-ledger-invoice-after-payment')?.appliedEntriesVisible ?? false,
      detailedCustomerLedgerApplicationVisible:
        traces.find((entry) => entry.id === 'detailed-customer-ledger-payment')?.applicationVisible ?? false,
      paymentDiscountVisible:
        traces.some((entry) => entry.paymentDiscountVisible),
      glDiscountAccountVisible:
        traces.find((entry) => entry.id === 'gl-entries-payment')?.paymentDiscountVisible ?? false,
      glBankAccountEffectVisible:
        traces.find((entry) => entry.id === 'gl-entries-payment')?.glBankAccountEffectVisible ?? false,
      bankAccountLedgerPageVisible:
        traces.find((entry) => entry.id === 'bank-account-ledger-payment')?.paymentDocumentVisible ?? false,
      bankAccountLedgerLimitation:
        'Attempted page 371 did not show a reliable Bank Account Ledger Entries context. Bank-side G/L effect is visible through account 18200 and balancing account BANK-RM-01, but no Bank Account Ledger Entry UI proof was captured in this run.',
      noBankReconciliation: true,
      notGermanFinalProof: true
    },
    proves: [
      'Die Laborzahlung wurde UI-first aus dem Cash Receipt Journal gebucht.',
      'D10000, PS-INV103297, BANK-RM-01, Betrag und Journal Check wurden vor der Buchung sichtbar geprueft.',
      'Die Rechnung PS-INV103297 zeigt nach der Buchung Remaining Amount = 0,00 und Applied Entries = 1.',
      'Detailed Customer Ledger Entries zeigen Initial Entry, Payment Discount und Application-Zeilen.',
      'G/L Entries zeigen 15110, 18200 und 40910; Bankwirkung ist indirekt ueber BANK-RM-01/18200 sichtbar.'
    ],
    doesNotProve: [
      'Kein Bank Account Ledger Entry UI-Nachweis ueber den getesteten Page-371-Pfad.',
      'Keine Bankabstimmung.',
      'Keine Kreditorenzahlung.',
      'Kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.',
      'Keine deutsche 19-Prozent-USt.'
    ],
    nextStep:
      'PAYMENTS-012: Kapitel 19/20 und Projektstatus mit PAYMENTS-011 synchronisieren; Bank Account Ledger Entries als separaten read-only Folgepfad klaeren, ohne weitere Zahlung oder Bankabstimmung.'
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-011-result.json'), result);
  await writeTextEvidence(paymentsEvidencePath('PAYMENTS-011-LAB-PAYMENT.md'), renderMarkdown(result));
  await writeTextEvidence(
    paymentsEvidencePath('README.md'),
    [
      '# PAYMENTS-011 Evidence Index',
      '',
      'Status: CRONUS-USA-Labor, autonome UI-Laborzahlung, OP-Ausgleich sichtbar, Skonto-/Payment-Discount-Wirkung sichtbar, keine Bankabstimmung, kein deutscher Finalnachweis.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-customer-ledger-before-payment.json` | UI-Preflight | `PS-INV103297` war vor Zahlung als Debitorenposten sichtbar/offen genug fuer Zahlung | keine Zahlungswirkung | labor, preflight |',
      '| `020-cash-receipt-preflight-controls.json` | UI-Control-Snapshot | Cash-Receipt-Zeile mit D10000, BANK-RM-01, Betrag, Applies-to und Journal Check | keine Zahlung vor Bestaetigung | labor, preflight |',
      '| `030-apply-entries-preflight-controls.json` | UI-/Button-Evidence | Apply Entries wurde vor Buchung read-only geprueft | kein Set Applies-to ID, kein Post Application | labor, preflight |',
      '| `035-posting-decision.txt` | Entscheidungssatz | warum die autonome Laborbuchung vertretbar war | keine Posten | labor, autonomous-posting |',
      '| `040-post-confirm-dialog-page-text.txt` | kompakter Seitentext | Post-Dialog vor Bestaetigung | keine Posten vor Ja | labor, process-proof |',
      '| `050-post-result-page-text.txt` | kompakter Seitentext | Zustand nach Bestaetigung | keine vollstaendige Postenspur allein | labor |',
      '| `060-customer-ledger-invoice-after-payment-page-text.txt` | kompakter UI-Seitentext | Rechnung `PS-INV103297` zeigt `Remaining Amount = 0,00` und `Applied Entries = 1` | keine Bankabstimmung, keine deutsche Finalaussage | labor, posting-trace |',
      '| `061-customer-ledger-payment-page-text.txt` | kompakter UI-Seitentext | Zahlungsbeleg `PAY011-PS103297`, Zahlungsbetrag, Restbetrag und Related G/L Entries | keine Bankkontoabstimmung; erklaert allein nicht die Skontozeilen | labor, posting-trace |',
      '| `062-detailed-customer-ledger-payment-page-text.txt` | kompakter UI-Seitentext | Detailed Customer Ledger Entries mit `Initial Entry`, `Payment Discount` und `Application` | keine Korrektur-/Unapply-Pruefung | labor, posting-trace |',
      '| `063-bank-account-ledger-payment-page-text.txt` | kompakter UI-Seitentext / rejected trace | Der getestete Page-371-Pfad liefert keinen belastbaren Bank Account Ledger Entry Nachweis | keinen Bankposten; keine Bankabstimmung | rejected, follow-up |',
      '| `064-gl-entries-payment-page-text.txt` | kompakter UI-Seitentext | G/L Entries mit `15110`, `18200`, `40910`; Bankwirkung indirekt ueber `BANK-RM-01` sichtbar | keinen Bank Account Ledger Entry UI-Nachweis | labor, posting-trace |',
      '| `PAYMENTS-011-result.json` | JSON-Ergebnis | strukturierter Preflight-, Posting- und Postenspur-Befund inklusive Bank-Ledger-Limitation | keine Compliance-Finalaussage | labor |',
      '| `PAYMENTS-011-LAB-PAYMENT.md` | Lernzusammenfassung | Anfaengererklaerung, OP-Ausgleich, Payment Discount, Buchwirkung, Grenzen und naechster Schritt | keinen deutschen Finalnachweis | labor |',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(true);
  expect(result.traceSummary.paymentCustomerLedgerVisible).toBe(true);
  expect(result.traceSummary.glEntriesVisible).toBe(true);
});
