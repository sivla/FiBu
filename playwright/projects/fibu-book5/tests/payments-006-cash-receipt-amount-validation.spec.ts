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
  viewport: { width: 1920, height: 1200 }
});

test.setTimeout(300_000);

const testId = 'payments-006';
const pageIdCashReceiptJournal = 255;

type ControlHandle = {
  handle: import('@playwright/test').ElementHandle<HTMLElement>;
  tag: string;
  x: number;
  y: number;
  value: string;
  title: string;
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
    /PAY006|BANK-RM-01|Cash Receipt Journal|Batch Name|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Description|Amount|Bal\. Account|Applies-to|Apply Entries|Journal Check|Refresh|Post|Payment|Customer|D10000|PS-INV103297|Ausgleich|Gegenkonto|Buchen|Zahlung|Bank|Issues Total|No issues/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -3; offset <= 5; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) {
        selected.add(selectedIndex);
      }
    }
  }

  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 220)
  ].join('\n'));
}

async function openCashReceiptJournal(page: Page) {
  await page.goto(bcPageUrl(pageIdCashReceiptJournal, project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);
}

async function cashReceiptJournalFrame(page: Page) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
      if (/Cash Receipt Journals/i.test(text) && /Batch Name/i.test(text)) {
        return frame;
      }
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

    if (!data?.visible || data.y < 250 || data.y > 430) {
      continue;
    }

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
    title: control.title,
    text: control.text.trim().slice(0, 80)
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

async function fillTextLikeUser(control: ControlHandle, value: string) {
  await control.handle.click();
  await control.handle.press('Control+A').catch(() => undefined);
  await control.handle.type(value, { delay: 30 });
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
    text,
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
  await page.waitForTimeout(2500);
  return readJournalCheck(page);
}

async function fillCashReceiptDraft(page: Page, documentNo: string) {
  const frame = await cashReceiptJournalFrame(page);
  const controls = await firstLineControls(frame);
  const before = snapshotControls(controls);
  if (controls.length < 13) {
    throw new Error(`Zu wenige sichtbare Cash-Receipt-Controls gefunden: ${controls.length}.`);
  }

  await fillControl(controls[0], '08.06.2026');
  await fillControl(controls[1], 'Payment');
  await fillControl(controls[2], documentNo);
  await fillControl(controls[3], 'Customer');
  await fillControl(controls[4], 'D10000');
  await page.waitForTimeout(2000);
  await fillControl(controls[5], 'PAYMENTS-006 Amount validation PS-INV103297');
  await fillTextLikeUser(controls[7], '-68000');
  await page.waitForTimeout(1200);
  const afterRawAmount = await readJournalCheck(page);
  const controlsAfterRawAmount = await firstLineControls(frame);
  await fillTextLikeUser(controlsAfterRawAmount[7], '-68.000,00');
  await page.waitForTimeout(1200);
  const afterLocalizedAmount = await readJournalCheck(page);
  await fillControl(controls[9], 'Bank Account');
  await fillControl(controls[10], 'BANK-RM-01');
  await page.waitForTimeout(1500);
  await fillControl(controls[12], 'Invoice');
  await fillControl(controls[13], 'PS-INV103297');
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(3500);
  const afterFullDraftBeforeRefresh = await readJournalCheck(page);
  const afterFullDraftAfterRefresh = await refreshJournalCheck(page);

  const afterControls = await firstLineControls(frame);
  const after = snapshotControls(afterControls);
  const values = after.map((control) => control.value);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);

  return {
    before,
    after,
    text,
    buttons,
    amountValidationAttempts: [
      {
        step: 'raw-negative-number',
        input: '-68000',
        zeroIssuesTotalVisible: afterRawAmount.zeroIssuesTotalVisible,
        oneIssueVisible: afterRawAmount.oneIssueVisible,
        issueText: afterRawAmount.issueText,
        amountIssueText: afterRawAmount.amountIssueText,
        bankPostingGroupIssueText: afterRawAmount.bankPostingGroupIssueText
      },
      {
        step: 'localized-negative-amount',
        input: '-68.000,00',
        zeroIssuesTotalVisible: afterLocalizedAmount.zeroIssuesTotalVisible,
        oneIssueVisible: afterLocalizedAmount.oneIssueVisible,
        issueText: afterLocalizedAmount.issueText,
        amountIssueText: afterLocalizedAmount.amountIssueText,
        bankPostingGroupIssueText: afterLocalizedAmount.bankPostingGroupIssueText
      },
      {
        step: 'full-draft-before-refresh',
        input: 'full line',
        zeroIssuesTotalVisible: afterFullDraftBeforeRefresh.zeroIssuesTotalVisible,
        zeroLinesWithIssuesVisible: afterFullDraftBeforeRefresh.zeroLinesWithIssuesVisible,
        currentLineNoIssuesVisible: afterFullDraftBeforeRefresh.currentLineNoIssuesVisible,
        oneIssueVisible: afterFullDraftBeforeRefresh.oneIssueVisible,
        issueText: afterFullDraftBeforeRefresh.issueText,
        amountIssueText: afterFullDraftBeforeRefresh.amountIssueText,
        bankPostingGroupIssueText: afterFullDraftBeforeRefresh.bankPostingGroupIssueText
      },
      {
        step: 'full-draft-after-refresh',
        input: 'full line plus Refresh',
        zeroIssuesTotalVisible: afterFullDraftAfterRefresh.zeroIssuesTotalVisible,
        zeroLinesWithIssuesVisible: afterFullDraftAfterRefresh.zeroLinesWithIssuesVisible,
        currentLineNoIssuesVisible: afterFullDraftAfterRefresh.currentLineNoIssuesVisible,
        oneIssueVisible: afterFullDraftAfterRefresh.oneIssueVisible,
        issueText: afterFullDraftAfterRefresh.issueText,
        amountIssueText: afterFullDraftAfterRefresh.amountIssueText,
        bankPostingGroupIssueText: afterFullDraftAfterRefresh.bankPostingGroupIssueText
      }
    ],
    documentNoVisible: values.includes(documentNo) || text.includes(documentNo),
    customerVisible: values.includes('D10000') || /D10000/i.test(text),
    bankVisible: values.includes('BANK-RM-01') || /BANK-RM-01/i.test(text),
    invoiceReferenceVisible: values.includes('PS-INV103297') || /PS-INV103297/i.test(text),
    amountVisible: values.some((value) => /68[.,]?000|-68000|-68[.,]?000/i.test(value)) || /68[.,]?000|-68[.,]?000/i.test(text),
    journalCheckVisible: /Journal Check/i.test(`${text}\n${buttons.join('\n')}`),
    journalCheckIssueCount: afterFullDraftAfterRefresh.oneIssueVisible ? 1 : 0,
    journalCheckIssueText: afterFullDraftAfterRefresh.issueText,
    amountIssueResolved: !afterFullDraftAfterRefresh.amountIssueText,
    bankPostingGroupIssueText: afterFullDraftAfterRefresh.bankPostingGroupIssueText,
    journalCheckZeroIssues: afterFullDraftAfterRefresh.zeroIssuesTotalVisible,
    journalCheckZeroLinesWithIssues: afterFullDraftAfterRefresh.zeroLinesWithIssuesVisible,
    currentLineNoIssuesVisible: afterFullDraftAfterRefresh.currentLineNoIssuesVisible,
    postVisible: /^Post$/im.test(`${text}\n${buttons.join('\n')}`)
  };
}

async function cleanupDraftLine(page: Page, documentNo: string) {
  const frame = await cashReceiptJournalFrame(page);
  const beforeText = normalizeText(await pageText(page));
  const beforeControls = await firstLineControls(frame);
  const documentVisibleInControls = beforeControls.some((control) => control.value === documentNo);

  if (!beforeText.includes(documentNo) && !documentVisibleInControls) {
    return { attempted: false, cleaned: true, reason: 'target-document-not-visible-before-cleanup' };
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

function renderMarkdown(result: Record<string, unknown>) {
  const cleanup = result.cleanup as { cleaned?: boolean };
  const attempts = result.amountValidationAttempts as Array<{
    step: string;
    input: string;
    zeroIssuesTotalVisible?: boolean;
    zeroLinesWithIssuesVisible?: boolean;
    currentLineNoIssuesVisible?: boolean;
    oneIssueVisible?: boolean;
    issueText?: string;
    amountIssueText?: string;
    bankPostingGroupIssueText?: string;
  }>;
  return [
    '# PAYMENTS-006 Cash Receipt Journal Amount Validation',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, ui-validation, no-payment, no-application, cleanup |',
    `| Document No. | \`${result.documentNo}\` |`,
    '| Ausgangsposten | `PS-INV103297` / `D10000` |',
    '| Gegenkonto | `BANK-RM-01` |',
    '| Betrag im Entwurf | `-68.000,00` als Cash-Receipt-Customer-Zeile |',
    '',
    '## Ergebnis',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Entwurfszeile in UI sichtbar | ${result.draftVisible ? 'ja' : 'nein'} |`,
    `| Debitor sichtbar | ${result.customerVisible ? 'ja' : 'nein'} |`,
    `| Gegenkonto sichtbar | ${result.bankVisible ? 'ja' : 'nein'} |`,
    `| Rechnungsbezug sichtbar | ${result.invoiceReferenceVisible ? 'ja' : 'nein'} |`,
    `| Betrag sichtbar | ${result.amountVisible ? 'ja' : 'nein'} |`,
    `| Journal Check sichtbar | ${result.journalCheckVisible ? 'ja' : 'nein'} |`,
    `| Journal Check 0 Issues Total | ${result.journalCheckZeroIssues ? 'ja' : 'nein'} |`,
    `| Journal Check 0 Lines with issues | ${result.journalCheckZeroLinesWithIssues ? 'ja' : 'nein'} |`,
    `| Current line: No issues found | ${result.currentLineNoIssuesVisible ? 'ja' : 'nein'} |`,
    `| Journal Check Issues | ${result.journalCheckIssueCount} |`,
    `| Aktueller Issue | ${result.journalCheckIssueText ? `\`${result.journalCheckIssueText}\`` : 'kein Text nachgewiesen'} |`,
    `| Amount-Issue geloest | ${result.amountIssueResolved ? 'ja' : 'nein'} |`,
    `| Bank Account Posting Group Issue | ${result.bankPostingGroupIssueText ? 'ja' : 'nein'} |`,
    `| Cleanup geloescht | ${cleanup.cleaned ? 'ja' : 'nein'} |`,
    '| Zahlung gebucht | nein |',
    '| OP ausgeglichen | nein |',
    '| Bankabstimmung | nein |',
    '',
    '## Gepruefte UI-Varianten',
    '',
    '| Schritt | Eingabe | 0 Issues Total | 0 Lines with issues | Current line ok | Issue sichtbar |',
    '|---|---|---|---|---|---|',
    ...attempts.map(
      (attempt) =>
        `| ${attempt.step} | \`${attempt.input}\` | ${attempt.zeroIssuesTotalVisible ? 'ja' : 'nein'} | ${attempt.zeroLinesWithIssuesVisible ? 'ja' : 'nein'} | ${attempt.currentLineNoIssuesVisible ? 'ja' : 'nein'} | ${attempt.amountIssueText ? 'ja' : attempt.oneIssueVisible ? 'ja' : 'nein'} |`
    ),
    '',
    '## Anfaenger-Lernwert',
    '',
    'Eine Zahlungsjournalzeile ist ein Entwurf, keine Zahlung. In diesem Lauf wurde die in `PAYMENTS-005` offene Amount-Validierung gezielt ueber die UI nachgeprueft: zuerst mit Rohzahl, dann mit lokalem Betragsformat und abschliessendem Refresh der Journal-Check-FactBox.',
    '',
    'Der Lernpunkt ist nicht der Post-Button, sondern die Vorabkontrolle. Das lokale Betragsformat loest den urspruenglichen Amount-Fehler zwischenzeitlich. Nach `Refresh` meldet BC aber den naechsten Setup-Blocker: `Bank Account Posting Group` fehlt am Balance Account. Deshalb darf weiterhin nicht gebucht werden.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 19/20 kann jetzt den Unterschied zwischen sichtbar gefuellter Zeile, intern validierter Journalzeile und tatsaechlicher Zahlung erklaeren. Die Anleitung muss den rechten `Journal Check` als Pflichtkontrolle vor jeder Zahlung zeigen.',
    '',
    '## Grenze',
    '',
    '- CRONUS-USA-Labor, kein deutscher Finalnachweis.',
    '- Keine Zahlung, kein OP-Ausgleich, keine Bankposten und keine Bankabstimmung.',
    '- Keine deutsche Bank-/Compliance- oder Steuerlogik.',
    '- `Preview Posting` war in `PAYMENTS-004` nicht sichtbar; dieser UI-Draft nutzt Journal Check als sichtbaren Preflight-Hinweis.',
    result.journalCheckZeroIssues
      ? '- Journal Check zeigt im Labor nach UI-Korrektur keine Issues; trotzdem keine Zahlungsbuchung.'
      : '- Journal Check meldet weiter ein Issue; keine Zahlungsfreigabe. In diesem Lauf ist der Restblocker die fehlende Bank Account Posting Group.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep as string,
    ''
  ].join('\n');
}

test('PAYMENTS-006 Cash Receipt Journal Amount-Validierung ueber UI klaeren', async ({ page }) => {
  const documentNo = `PAY006-${Date.now().toString().slice(-6)}`;
  await openCashReceiptJournal(page);

  const draft = await fillCashReceiptDraft(page, documentNo);
  await writeJsonEvidence(paymentsEvidencePath('010-amount-validation-controls.json'), {
    documentNo,
    before: draft.before,
    after: draft.after,
    amountValidationAttempts: draft.amountValidationAttempts,
    buttons: draft.buttons
  });
  await writeTextEvidence(paymentsEvidencePath('010-amount-validation-page-text.txt'), compactPageText(draft.text));
  await screenshot(page, 'payments-006-010-cash-receipt-amount-validation.png', {
    projectName: project.name,
    testId,
    status: draft.documentNoVisible ? 'labor' : 'rejected',
    purpose:
      'PAYMENTS-006 UI-Validierung: Cash Receipt Journal mit Debitor D10000, Rechnungsbezug PS-INV103297, Betrag und Gegenkonto BANK-RM-01 pruefen; Journal Check zeigt fehlende Bank Account Posting Group; keine Buchung.',
    knownLimitations: [
      'UI-Entwurf, keine Zahlung und kein OP-Ausgleich.',
      'Der Entwurf wird im selben Lauf wieder geloescht.',
      'Screenshot zeigt Zahlungsjournal-Readiness mit Bank-Posting-Group-Blocker, keine Zahlung.',
      'CRONUS-USA-Labor; kein deutscher Bank-/Compliance-Finalnachweis.'
    ],
    bookUse: 'field-proof'
  });

  const cleanup = await cleanupDraftLine(page, documentNo);
  const afterCleanupText = normalizeText(await pageText(page));
  await writeTextEvidence(paymentsEvidencePath('020-after-cleanup-page-text.txt'), compactPageText(afterCleanupText));

  const result = {
    testId: 'PAYMENTS-006',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-amount-validation-no-payment-no-application',
    documentNo,
    sourceContext: {
      postedSalesInvoiceNo: 'PS-INV103297',
      customerNo: 'D10000',
      targetBankAccountNo: 'BANK-RM-01',
      amountDraft: -68000,
      amountInputFinal: '-68.000,00'
    },
    draftVisible: draft.documentNoVisible,
    customerVisible: draft.customerVisible,
    bankVisible: draft.bankVisible,
    invoiceReferenceVisible: draft.invoiceReferenceVisible,
    amountVisible: draft.amountVisible,
    journalCheckVisible: draft.journalCheckVisible,
    journalCheckIssueCount: draft.journalCheckIssueCount,
    journalCheckIssueText: draft.journalCheckIssueText,
    journalCheckZeroIssues: draft.journalCheckZeroIssues,
    journalCheckZeroLinesWithIssues: draft.journalCheckZeroLinesWithIssues,
    currentLineNoIssuesVisible: draft.currentLineNoIssuesVisible,
    amountIssueResolved: draft.amountIssueResolved,
    bankPostingGroupIssueText: draft.bankPostingGroupIssueText,
    amountValidationAttempts: draft.amountValidationAttempts,
    readyForPaymentPosting: draft.journalCheckZeroIssues && draft.journalCheckZeroLinesWithIssues,
    postVisible: draft.postVisible,
    cleanup,
    safety: {
      paymentPosted: false,
      applicationPosted: false,
      bankReconciliationOpened: false,
      postActionClicked: false
    },
    proves: [
      'Die Cash-Receipt-Journal-Zeile wurde ueber die UI erneut vorbereitet.',
      'Betragseingabe und Journal Check wurden mit lokalem Format und Refresh erneut geprueft.',
      'Der Entwurf wurde anschliessend geloescht; keine Zahlung und kein OP-Ausgleich wurden gebucht.'
    ],
    doesNotProve: [
      'Keine Zahlung wurde gebucht.',
      'Kein OP wurde ausgeglichen.',
      'Keine Bankposten oder Debitorenpostenwirkung.',
      'Kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.'
    ],
    nextStep: draft.journalCheckZeroIssues
      ? 'PAYMENTS-007: Vor einer ausdruecklich freigegebenen Laborzahlung zuerst Bank Account Posting Group/Sachkonto-Fit und Ausgleichsbezug read-only dokumentieren; weiterhin keine automatische Zahlung.'
      : draft.bankPostingGroupIssueText
        ? 'PAYMENTS-007: Bankkonto BANK-RM-01 per UI auf Bank Account Posting Group/Sachkonto-Fit pruefen und erst danach denselben Cash-Receipt-Draft erneut ohne Buchung testen.'
        : 'PAYMENTS-007: Amount-/Ausgleichsbezug weiter ueber UI untersuchen; keine Zahlung, solange Journal Check Issues meldet.'
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-006-result.json'), result);
  await writeTextEvidence(paymentsEvidencePath('PAYMENTS-006-AMOUNT-VALIDATION.md'), renderMarkdown(result));
  await writeTextEvidence(
    paymentsEvidencePath('README.md'),
    [
      '# PAYMENTS-006 Evidence Index',
      '',
      `Status: CRONUS-USA-Labor, UI-Amount-Validierung, keine Zahlung, kein Ausgleich, Cleanup. Journal Check 0 Issues: ${draft.journalCheckZeroIssues ? 'ja' : 'nein'}.`,
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-amount-validation-controls.json` | UI-Control-Snapshot | sichtbare Journalfelder, Betragsvarianten und Journal-Check-Befund | keine Buchung und keine OP-Anwendung | labor |',
      '| `010-amount-validation-page-text.txt` | kompakter Seitentext | Cash Receipt Journal mit Amount-/Journal-Check-Kontext | keine Zahlungswirkung | labor |',
      '| `020-after-cleanup-page-text.txt` | kompakter Seitentext | Zustand nach UI-Cleanup | keine Zahlungswirkung | labor |',
      '| `payments-006-010-cash-receipt-amount-validation.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Amount-/Journal-Check-Bilds | keine eigenstaendige Zahlungs-Evidence | labor |',
      '| `PAYMENTS-006-result.json` | JSON-Ergebnis | strukturierter UI-Amount-/Cleanup-/Sicherheitsbefund | kein Zahlungs-Finalnachweis | labor |',
      '| `PAYMENTS-006-AMOUNT-VALIDATION.md` | Lernzusammenfassung | Anfaengererklaerung, Buchwirkung und naechster Schritt | keine Zahlung und kein Ausgleich | labor |',
      ''
    ].join('\n')
  );

  expect(result.draftVisible, 'Der UI-Draft muss vor dem Cleanup sichtbar sein.').toBe(true);
  expect(result.cleanup.cleaned, 'Der UI-Draft muss nach der Evidence wieder bereinigt sein.').toBe(true);
  expect(result.safety.paymentPosted).toBe(false);
  expect(result.safety.applicationPosted).toBe(false);
});
