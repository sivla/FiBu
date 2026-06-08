import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  bcPageUrl,
  dismissTours,
  pageText,
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

test.setTimeout(330_000);

const testId = 'payments-008';
const pageIdCashReceiptJournal = 255;

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
    /PAY008|BANK-RM-01|Cash Receipt Journal|Batch Name|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Description|Posting Group|Amount|Amount \(\$\)|Bal\. Account|Applies-to|Journal Check|Refresh|Post|Payment|Customer|D10000|PS-INV103297|Lines checked|Lines with issues|Issues Total|Current line|No issues|muss|must/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -3; offset <= 5; offset += 1) {
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

async function openCashReceiptJournal(page: Page) {
  await page.goto(bcPageUrl(pageIdCashReceiptJournal, project.envPrefix), {
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
      .find((line) => /Amount.*Gen\. Journal Line|Gen\. Journal Line.*Amount/i.test(line)) ??
    text
      .split('\n')
      .map((line) => line.trim())
      .find((line) => /Posting Group.*nicht vorhanden|does not exist|must have a value|muss.*Wert enthalten/i.test(line)) ??
    '';

  return {
    buttons,
    journalCheckVisible: /Journal Check/i.test(allText),
    zeroIssuesTotalVisible: /0\s+Issues?\s+Total/i.test(allText),
    zeroLinesWithIssuesVisible: /0\s+Lines?\s+with\s+issues/i.test(allText),
    oneIssueVisible: /1\s+Issues?\s+Total|1\s+Lines?\s+with\s+issues/i.test(allText),
    currentLineNoIssuesVisible: /Current\s+line\s*[:\-]?\s*No\s+issues\s+found/i.test(allText),
    issueText,
    amountIssueText: /Amount/i.test(issueText) ? issueText : '',
    bankPostingGroupIssueText: /Bank Account Posting Group/i.test(issueText) ? issueText : ''
  };
}

async function refreshJournalCheck(page: Page) {
  await clickAction(page, /^Refresh$/i);
  await page.waitForTimeout(3000);
  return readJournalCheck(page);
}

function amountInterpretation(snapshot: ReturnType<typeof snapshotControls>) {
  const amount = snapshot[7]?.value ?? '';
  const amountLcy = snapshot[8]?.value ?? '';
  return {
    amountFieldIndex: 7,
    amountFieldValue: amount,
    amountLcyFieldIndex: 8,
    amountLcyFieldValue: amountLcy,
    amountFieldLooksFilled: /68[.,]?000|-68000|-68[.,]?000/i.test(amount),
    amountLcyLooksFilled: /67[.,]?673|-67673|-67[.,]?673/i.test(amountLcy)
  };
}

async function fillDraftForDiagnosis(page: Page, documentNo: string) {
  const frame = await cashReceiptJournalFrame(page);
  const initialControls = await firstLineControls(frame);
  const before = snapshotControls(initialControls);
  if (initialControls.length < 14) {
    throw new Error(`Zu wenige sichtbare Cash-Receipt-Controls gefunden: ${initialControls.length}.`);
  }

  await fillControl(initialControls[0], '08.06.2026');
  await fillControl(initialControls[1], 'Payment');
  await fillControl(initialControls[2], documentNo);
  await fillControl(initialControls[3], 'Customer');
  await fillControl(initialControls[4], 'D10000');
  await page.waitForTimeout(1800);
  await fillControl(initialControls[5], 'PAYMENTS-008 Amount field diagnosis PS-INV103297');
  await typeTextLikeUser(initialControls[7], '-68.000,00', 'Tab');
  await page.waitForTimeout(1200);
  const afterFirstAmount = await readJournalCheck(page);

  const controlsAfterFirstAmount = await firstLineControls(frame);
  await fillControl(controlsAfterFirstAmount[9], 'Bank Account');
  await fillControl(controlsAfterFirstAmount[10], 'BANK-RM-01');
  await page.waitForTimeout(1500);
  await fillControl(controlsAfterFirstAmount[12], 'Invoice');
  await fillControl(controlsAfterFirstAmount[13], 'PS-INV103297');
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(2500);
  const afterFullDraftBeforeRefresh = await readJournalCheck(page);

  const controlsBeforeRefocus = await firstLineControls(frame);
  const beforeRefocus = snapshotControls(controlsBeforeRefocus);
  const amountBeforeRefocus = amountInterpretation(beforeRefocus);

  await typeTextLikeUser(controlsBeforeRefocus[7], '-68.000,00', 'Enter');
  await page.waitForTimeout(1500);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1800);
  const afterAmountRefocusBeforeRefresh = await readJournalCheck(page);
  const controlsAfterRefocus = await firstLineControls(frame);
  const afterRefocus = snapshotControls(controlsAfterRefocus);
  const amountAfterRefocus = amountInterpretation(afterRefocus);
  const afterRefresh = await refreshJournalCheck(page);

  const finalControls = await firstLineControls(frame);
  const finalSnapshot = snapshotControls(finalControls);
  const amountAfterRefresh = amountInterpretation(finalSnapshot);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const values = finalSnapshot.map((control) => control.value);

  return {
    before,
    beforeRefocus,
    afterRefocus,
    finalSnapshot,
    amountBeforeRefocus,
    amountAfterRefocus,
    amountAfterRefresh,
    checks: [
      { step: 'after-first-amount-entry', input: '-68.000,00', ...afterFirstAmount },
      { step: 'after-full-draft-before-refresh', input: 'full draft', ...afterFullDraftBeforeRefresh },
      { step: 'after-amount-refocus-before-refresh', input: '-68.000,00 plus Enter/Tab', ...afterAmountRefocusBeforeRefresh },
      { step: 'after-refresh', input: 'Refresh', ...afterRefresh }
    ],
    text,
    buttons,
    documentNoVisible: values.includes(documentNo) || text.includes(documentNo),
    customerVisible: values.includes('D10000') || /D10000/i.test(text),
    bankVisible: values.includes('BANK-RM-01') || /BANK-RM-01/i.test(text),
    invoiceReferenceVisible: values.includes('PS-INV103297') || /PS-INV103297/i.test(text),
    amountVisible: values.some((value) => /68[.,]?000|-68000|-68[.,]?000/i.test(value)) || /68[.,]?000|-68[.,]?000/i.test(text),
    amountLcyVisible: values.some((value) => /67[.,]?673|-67673|-67[.,]?673/i.test(value)) || /67[.,]?673|-67[.,]?673/i.test(text),
    finalJournalCheck: afterRefresh,
    postVisible: /^Post$/im.test(`${text}\n${buttons.join('\n')}`)
  };
}

async function cleanupDraftLine(page: Page, documentNo: string) {
  const frame = await cashReceiptJournalFrame(page);
  const beforeText = normalizeText(await pageText(page));
  const beforeControls = await firstLineControls(frame);
  const documentControl = beforeControls.find((control) => control.value === documentNo);

  if (!beforeText.includes(documentNo) && !documentControl) {
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
  const documentStillVisibleInControls = afterControls.some((control) => control.value === documentNo);
  return {
    attempted: true,
    cleaned: !afterText.includes(documentNo) && !documentStillVisibleInControls,
    documentNoStillVisible: afterText.includes(documentNo) || documentStillVisibleInControls
  };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# PAYMENTS-008 Cash Receipt Amount Field Diagnosis',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, UI-only, no-payment, no-application, cleanup |',
    `| Document No. | \`${result.documentNo}\` |`,
    '| Ausgangsposten | `PS-INV103297` / `D10000` |',
    '| Gegenkonto | `BANK-RM-01`, Bank Acc. Posting Group `CHECKING` seit `PAYMENTS-007` |',
    '',
    '## Ergebnis',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Entwurfszeile sichtbar | ${result.draftVisible ? 'ja' : 'nein'} |`,
    `| Amount-Feld Index 7 nach Refresh | \`${result.amountAfterRefresh.amountFieldValue}\` |`,
    `| Amount-LCY/Amount ($) Index 8 nach Refresh | \`${result.amountAfterRefresh.amountLcyFieldValue}\` |`,
    `| Amount-Feld sichtbar gefuellt | ${result.amountAfterRefresh.amountFieldLooksFilled ? 'ja' : 'nein'} |`,
    `| Amount-LCY sichtbar gefuellt | ${result.amountAfterRefresh.amountLcyLooksFilled ? 'ja' : 'nein'} |`,
    `| Journal Check nach Refresh 0 Issues | ${result.journalCheckZeroIssues ? 'ja' : 'nein'} |`,
    `| Current line no issues | ${result.currentLineNoIssuesVisible ? 'ja' : 'nein'} |`,
    `| Aktueller Issue | ${result.journalCheckIssueText ? `\`${result.journalCheckIssueText}\`` : 'kein Text nachgewiesen'} |`,
    `| Cleanup geloescht | ${result.cleanup.cleaned ? 'ja' : 'nein'} |`,
    '| Zahlung gebucht | nein |',
    '| OP ausgeglichen | nein |',
    '',
    '## Journal-Check-Verlauf',
    '',
    '| Schritt | Eingabe | 0 Issues | Current line ok | Issue |',
    '|---|---|---|---|---|',
    ...result.checks.map(
      (check: any) =>
        `| ${check.step} | \`${check.input}\` | ${check.zeroIssuesTotalVisible ? 'ja' : 'nein'} | ${check.currentLineNoIssuesVisible ? 'ja' : 'nein'} | ${check.issueText ? `\`${check.issueText}\`` : 'kein Text'} |`
    ),
    '',
    '## Anfaenger-Lernwert',
    '',
    'Im Zahlungsjournal gibt es zwei nebeneinanderliegende Betragsanzeigen: das fachliche `Amount`-Feld und die lokale/umgerechnete Anzeige `Amount ($)`. Fuer eine Buchung zaehlt nicht, dass irgendein Betrag optisch sichtbar ist, sondern ob `Journal Check` die aktuelle `Gen. Journal Line` ohne Issues validiert.',
    '',
    'Dieser Lauf ist deshalb bewusst keine Zahlung. Er zeigt nur, ob Business Central den Betrag nach erneutem Fokus auf das eigentliche Amount-Feld und nach `Refresh` als zahlungsreifen Journalbetrag akzeptiert. Solange `Journal Check` weiter ein Issue meldet, bleibt der `Post`-Button fachlich gesperrt, auch wenn er sichtbar ist.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 19/20 sollte die breite Layoutansicht und den Unterschied zwischen `Amount` und `Amount ($)` erklaeren. Einsteiger sollen lernen: erst Betrag im lokalen Format erfassen, dann den rechten `Journal Check` lesen, danach erst ueber Ausgleich und Buchung sprechen.',
    '',
    '## Grenze',
    '',
    '- CRONUS-USA-Labor, kein deutscher Bank-/Compliance-Finalnachweis.',
    '- Keine Zahlung, kein OP-Ausgleich, keine Bankposten und keine Bankabstimmung.',
    '- Der Lauf prueft nur das Amount-/Journal-Check-Verhalten nach geloestem Bankkonto-Fit.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('PAYMENTS-008 Amount-Feld und Amount-LCY im Cash Receipt Journal unterscheiden', async ({ page }) => {
  const documentNo = `PAY008-${Date.now().toString().slice(-6)}`;
  await openCashReceiptJournal(page);

  const draft = await fillDraftForDiagnosis(page, documentNo);
  await writeJsonEvidence(paymentsEvidencePath('010-amount-field-diagnosis-controls.json'), {
    documentNo,
    before: draft.before,
    beforeRefocus: draft.beforeRefocus,
    afterRefocus: draft.afterRefocus,
    finalSnapshot: draft.finalSnapshot,
    amountBeforeRefocus: draft.amountBeforeRefocus,
    amountAfterRefocus: draft.amountAfterRefocus,
    checks: draft.checks,
    buttons: draft.buttons
  });
  await writeTextEvidence(paymentsEvidencePath('010-amount-field-page-text.txt'), compactPageText(draft.text));
  await screenshot(page, 'payments-008-010-cash-receipt-amount-field-diagnosis.png', {
    projectName: project.name,
    testId,
    status: draft.finalJournalCheck.zeroIssuesTotalVisible ? 'labor' : 'rejected',
    purpose:
      'PAYMENTS-008 UI-Diagnose: Cash Receipt Journal in breiter Ansicht, Amount-Feld vs. Amount ($), Journal Check nach geloestem Bankkonto-Fit; keine Zahlung.',
    knownLimitations: [
      'UI-Entwurf, keine Zahlung und kein OP-Ausgleich.',
      'Der Entwurf wird im selben Lauf wieder geloescht.',
      'CRONUS-USA-Labor; kein deutscher Bank-/Compliance-Finalnachweis.'
    ],
    bookUse: 'field-proof'
  });

  const cleanup = await cleanupDraftLine(page, documentNo);
  const afterCleanupText = normalizeText(await pageText(page));
  await writeTextEvidence(paymentsEvidencePath('020-after-cleanup-page-text.txt'), compactPageText(afterCleanupText));

  const result = {
    testId: 'PAYMENTS-008',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-amount-field-diagnosis-no-payment-no-application',
    documentNo,
    sourceContext: {
      postedSalesInvoiceNo: 'PS-INV103297',
      customerNo: 'D10000',
      targetBankAccountNo: 'BANK-RM-01',
      bankAccountPostingGroup: 'CHECKING',
      amountInput: '-68.000,00'
    },
    draftVisible: draft.documentNoVisible,
    customerVisible: draft.customerVisible,
    bankVisible: draft.bankVisible,
    invoiceReferenceVisible: draft.invoiceReferenceVisible,
    amountVisible: draft.amountVisible,
    amountLcyVisible: draft.amountLcyVisible,
    amountBeforeRefocus: draft.amountBeforeRefocus,
    amountAfterRefocus: draft.amountAfterRefocus,
    amountAfterRefresh: draft.amountAfterRefresh,
    checks: draft.checks.map(({ buttons, ...check }) => check),
    journalCheckVisible: draft.finalJournalCheck.journalCheckVisible,
    journalCheckZeroIssues: draft.finalJournalCheck.zeroIssuesTotalVisible,
    journalCheckZeroLinesWithIssues: draft.finalJournalCheck.zeroLinesWithIssuesVisible,
    currentLineNoIssuesVisible: draft.finalJournalCheck.currentLineNoIssuesVisible,
    journalCheckIssueText: draft.finalJournalCheck.issueText,
    amountIssueText: draft.finalJournalCheck.amountIssueText,
    bankPostingGroupIssueText: draft.finalJournalCheck.bankPostingGroupIssueText,
    readyForPaymentPosting: draft.finalJournalCheck.zeroIssuesTotalVisible && draft.finalJournalCheck.zeroLinesWithIssuesVisible,
    postVisible: draft.postVisible,
    cleanup,
    safety: {
      paymentPosted: false,
      applicationPosted: false,
      bankReconciliationOpened: false,
      postActionClicked: false
    },
    proves: [
      'Cash Receipt Journal wurde in breiter UI-Ansicht als nicht buchender Entwurf gefuellt.',
      'Amount-Feld und Amount-LCY/Amount ($) wurden im Control-Snapshot getrennt dokumentiert.',
      'Journal Check wurde nach erneutem Fokus auf Amount und nach Refresh gelesen.',
      cleanup.cleaned
        ? 'Der Entwurf wurde geloescht; es wurde nichts gebucht.'
        : 'Der Entwurf wurde nicht erfolgreich bereinigt; es wurde trotzdem nichts gebucht.'
    ],
    doesNotProve: [
      'Keine Zahlung wurde gebucht.',
      'Kein OP wurde ausgeglichen.',
      'Keine Bankposten, Debitoren-Ausgleichsposten oder Bankabstimmung.',
      'Kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.'
    ],
    nextStep:
      draft.finalJournalCheck.zeroIssuesTotalVisible && draft.finalJournalCheck.zeroLinesWithIssuesVisible
        ? 'PAYMENTS-009: vor einer Laborzahlung zuerst Apply-Entries/Applies-to-Bezug und Buchungsvorschau nicht buchend pruefen; weiterhin keine Zahlung ohne ausdrueckliche Freigabe.'
        : 'PAYMENTS-009: Amount-Validierung weiter ueber UI klaeren, bevorzugt ueber Apply Entries/Set Applies-to ID oder andere BC-Standardaktion statt direkte Spaltenindex-Eingabe; weiterhin keine Zahlung.'
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-008-result.json'), result);
  await writeTextEvidence(paymentsEvidencePath('PAYMENTS-008-AMOUNT-FIELD-DIAGNOSIS.md'), renderMarkdown(result));
  await writeTextEvidence(
    paymentsEvidencePath('README.md'),
    [
      '# PAYMENTS-008 Evidence Index',
      '',
      `Status: CRONUS-USA-Labor, UI-only Amount-/Journal-Check-Diagnose, keine Zahlung, kein Ausgleich, Cleanup. Journal Check 0 Issues: ${result.journalCheckZeroIssues ? 'ja' : 'nein'}.`,
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-amount-field-diagnosis-controls.json` | UI-Control-Snapshot | Amount-Feld, Amount-LCY/Amount ($), Journal-Check-Verlauf und Buttons in breiter Ansicht | keine Zahlungswirkung | labor |',
      '| `010-amount-field-page-text.txt` | kompakter Seitentext | Cash Receipt Journal mit Amount-/Journal-Check-Kontext | keine Zahlungswirkung | labor |',
      '| `020-after-cleanup-page-text.txt` | kompakter Seitentext | Zustand nach UI-Cleanup | keine Zahlungswirkung | labor |',
      '| `payments-008-010-cash-receipt-amount-field-diagnosis.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Amount-Diagnosebilds | keine Zahlungsfreigabe | labor |',
      '| `PAYMENTS-008-result.json` | JSON-Ergebnis | strukturierter UI-Amount-/Cleanup-/Sicherheitsbefund | kein Zahlungs-Finalnachweis | labor |',
      '| `PAYMENTS-008-AMOUNT-FIELD-DIAGNOSIS.md` | Lernzusammenfassung | Anfaengererklaerung zu Amount vs. Amount ($), Journal Check und Buchwirkung | keine Zahlung und kein Ausgleich | labor |',
      ''
    ].join('\n')
  );

  expect(result.draftVisible, 'Der UI-Draft muss vor dem Cleanup sichtbar sein.').toBe(true);
  expect(result.cleanup.cleaned, 'Der UI-Draft muss nach der Evidence wieder bereinigt sein.').toBe(true);
  expect(result.safety.paymentPosted).toBe(false);
  expect(result.safety.applicationPosted).toBe(false);
});
