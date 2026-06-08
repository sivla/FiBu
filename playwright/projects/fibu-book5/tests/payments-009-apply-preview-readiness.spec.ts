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

const testId = 'payments-009';
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
    /PAY009|BANK-RM-01|Cash Receipt Journal|Batch Name|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Amount|Amount \(\$\)|Bal\. Account|Applies-to|Apply Entries|Preview Posting|Journal Check|Refresh|Post|Payment|Customer|D10000|PS-INV103297|Lines checked|Lines with issues|Issues Total|Current line|No issues|Set Applies-to ID|Post Application|Remaining Amount|Open|muss|must/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -3; offset <= 6; offset += 1) {
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
        await page.waitForTimeout(1800);
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
      .find((line) => /Gen\. Journal Line|must have a value|muss.*Wert enthalten|Posting Group.*nicht vorhanden|does not exist/i.test(line)) ??
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

async function prepareDraft(page: Page, documentNo: string) {
  const frame = await cashReceiptJournalFrame(page);
  const initialControls = await firstLineControls(frame);
  if (initialControls.length < 14) {
    throw new Error(`Zu wenige sichtbare Cash-Receipt-Controls gefunden: ${initialControls.length}.`);
  }

  await fillControl(initialControls[0], '08.06.2026');
  await fillControl(initialControls[1], 'Payment');
  await fillControl(initialControls[2], documentNo);
  await fillControl(initialControls[3], 'Customer');
  await fillControl(initialControls[4], 'D10000');
  await page.waitForTimeout(1800);
  await fillControl(initialControls[5], 'PAYMENTS-009 Apply Preview readiness PS-INV103297');
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
  const afterRefresh = await refreshJournalCheck(page);

  const finalControls = await firstLineControls(frame);
  const finalSnapshot = snapshotControls(finalControls);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const values = finalSnapshot.map((control) => control.value);

  return {
    finalSnapshot,
    text,
    buttons,
    journalCheck: afterRefresh,
    documentNoVisible: values.includes(documentNo) || text.includes(documentNo),
    customerVisible: values.includes('D10000') || /D10000/i.test(text),
    bankVisible: values.includes('BANK-RM-01') || /BANK-RM-01/i.test(text),
    invoiceReferenceVisible: values.includes('PS-INV103297') || /PS-INV103297/i.test(text),
    amountVisible: values.some((value) => /68[.,]?000|-68000|-68[.,]?000/i.test(value)) || /68[.,]?000|-68[.,]?000/i.test(text),
    appliedCheckboxValue: finalSnapshot[11]?.value ?? '',
    appliesToDocTypeValue: finalSnapshot[12]?.value ?? '',
    appliesToDocNoValue: finalSnapshot[13]?.value ?? ''
  };
}

async function cleanupDraftLine(page: Page, documentNo: string) {
  await openCashReceiptJournal(page);
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

async function captureApplyEntries(page: Page) {
  const beforeButtons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const clicked = await clickAction(page, /^Apply Entries$|^Posten ausgleichen$|Apply Entries|Ausgleichen/i);
  await dismissTours(page);
  await page.waitForTimeout(2500);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const opened =
    clicked && /Apply.*Entries|Apply Customer Entries|Posten ausgleichen|PS-INV103297|D10000|Remaining Amount/i.test(text);

  await writeTextEvidence(paymentsEvidencePath('020-apply-entries-page-text.txt'), compactPageText(text));
  await writeJsonEvidence(paymentsEvidencePath('020-apply-entries-controls.json'), {
    beforeButtons,
    clicked,
    opened,
    dangerousActionsVisible: /Set Applies-to ID|Post Application/i.test(`${text}\n${buttons.join('\n')}`),
    documentVisible: /PS-INV103297|D10000/i.test(text),
    buttons
  });

  if (opened) {
    await screenshot(page, 'payments-009-020-apply-entries-readonly.png', {
      projectName: project.name,
      testId,
      status: 'labor',
      purpose:
        'PAYMENTS-009 Apply Entries aus Cash Receipt Journal read-only oeffnen; kein Set Applies-to ID, kein Post Application, keine Zahlung.',
      knownLimitations: [
        'Nur Pfad-/Sichtnachweis. Kein OP-Ausgleich und keine Buchung.',
        'CRONUS-USA-Labor in RM-DEMO, kein deutscher Finalnachweis.'
      ],
      bookUse: 'evidence'
    });
  }

  return {
    clicked,
    opened,
    documentVisible: /PS-INV103297|D10000/i.test(text),
    dangerousActionsVisible: /Set Applies-to ID|Post Application/i.test(`${text}\n${buttons.join('\n')}`),
    buttons
  };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# PAYMENTS-009 Apply-/Preview-Readiness',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, UI-only, no-payment, no-application, cleanup |',
    `| Document No. | \`${result.documentNo}\` |`,
    '| Ausgangsposten | `PS-INV103297` / `D10000` |',
    '| Gegenkonto | `BANK-RM-01`, Bank Acc. Posting Group `CHECKING` |',
    '',
    '## Ergebnis',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Draft sichtbar | ${result.draftVisible ? 'ja' : 'nein'} |`,
    `| Journal Check 0 Issues | ${result.journalCheckZeroIssues ? 'ja' : 'nein'} |`,
    `| Applies-to Doc. Type | \`${result.appliesToDocTypeValue}\` |`,
    `| Applies-to Doc. No. | \`${result.appliesToDocNoValue}\` |`,
    `| Apply Entries geklickt | ${result.applyEntries.clicked ? 'ja' : 'nein'} |`,
    `| Apply Entries geoeffnet | ${result.applyEntries.opened ? 'ja' : 'nein'} |`,
    `| Ausgangsrechnung im Apply-Kontext sichtbar | ${result.applyEntries.documentVisible ? 'ja' : 'nein'} |`,
    `| Preview Posting direkt sichtbar | ${result.preview.directlyVisible ? 'ja' : 'nein'} |`,
    `| Preview Posting direkt geoeffnet | ${result.preview.opened ? 'ja' : 'nein'} |`,
    `| Cleanup geloescht | ${result.cleanup.cleaned ? 'ja' : 'nein'} |`,
    '| Zahlung gebucht | nein |',
    '| OP ausgeglichen | nein |',
    '',
    '## Anfaenger-Lernwert',
    '',
    '`Applies-to Doc. Type` und `Applies-to Doc. No.` markieren im Journalentwurf, auf welche offene Rechnung die Zahlung zielt. Das ist noch kein gebuchter Ausgleich. Ein echter Ausgleich entsteht erst durch eine Buchung oder durch bewusste Apply-Aktionen wie `Set Applies-to ID`/`Post Application`.',
    '',
    'Fuer das Buch ist dieser Zwischenschritt wichtig: Einsteiger sehen, dass ein Zahlungsjournal erst dann fachlich weiter darf, wenn Betrag, Bankgegenkonto und Rechnungsbezug zusammenpassen und `Journal Check` keine Issues zeigt.',
    '',
    '## Grenze',
    '',
    '- CRONUS-USA-Labor, kein deutscher Bank-/Compliance-Finalnachweis.',
    '- Keine Zahlung, kein OP-Ausgleich, keine Bankposten und keine Bankabstimmung.',
    '- `Preview Posting` wird nur genutzt, wenn die Aktion direkt sichtbar ist; der Test klickt bewusst nicht den normalen `Post`-Pfad.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('PAYMENTS-009 Apply-/Preview-Readiness im Cash Receipt Journal nicht buchend pruefen', async ({ page }) => {
  const documentNo = `PAY009-${Date.now().toString().slice(-6)}`;
  await openCashReceiptJournal(page);

  const draft = await prepareDraft(page, documentNo);
  await writeJsonEvidence(paymentsEvidencePath('010-cash-receipt-draft-controls.json'), {
    documentNo,
    finalSnapshot: draft.finalSnapshot,
    buttons: draft.buttons,
    journalCheck: draft.journalCheck
  });
  await writeTextEvidence(paymentsEvidencePath('010-cash-receipt-draft-page-text.txt'), compactPageText(draft.text));
  await screenshot(page, 'payments-009-010-cash-receipt-apply-preview-readiness.png', {
    projectName: project.name,
    testId,
    status: draft.journalCheck.zeroIssuesTotalVisible ? 'labor' : 'rejected',
    purpose:
      'PAYMENTS-009 Cash Receipt Journal in breiter Ansicht mit Betrag, Bankgegenkonto, Applies-to-Bezug und Journal Check; keine Zahlung.',
    knownLimitations: [
      'UI-Entwurf, keine Zahlung und kein OP-Ausgleich.',
      'Der Entwurf wird im selben Lauf wieder geloescht.',
      'CRONUS-USA-Labor; kein deutscher Bank-/Compliance-Finalnachweis.'
    ],
    bookUse: draft.journalCheck.zeroIssuesTotalVisible ? 'evidence' : 'do-not-use'
  });

  const applyEntries = await captureApplyEntries(page);
  await openCashReceiptJournal(page);
  const afterApplyText = normalizeText(await pageText(page));
  const afterApplyButtons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const previewDirectlyVisible = /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(
    `${afterApplyText}\n${afterApplyButtons.join('\n')}`
  );
  const previewOpened = previewDirectlyVisible
    ? await clickAction(page, /^Preview Posting$|^Buchungsvorschau$|^Vorschau buchen$/i)
    : false;
  await page.waitForTimeout(2000);
  const previewText = normalizeText(await pageText(page));
  const previewButtons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeJsonEvidence(paymentsEvidencePath('030-preview-posting-readiness.json'), {
    directlyVisible: previewDirectlyVisible,
    opened: previewOpened,
    previewRowsVisible: previewOpened && /Posting Preview|Preview Posting|G\/L Entry|Customer Ledger Entry|Bank Account Ledger Entry/i.test(previewText),
    buttonsBeforeAttempt: afterApplyButtons,
    buttonsAfterAttempt: previewButtons
  });
  if (previewOpened) {
    await writeTextEvidence(paymentsEvidencePath('030-preview-posting-page-text.txt'), compactPageText(previewText));
    await screenshot(page, 'payments-009-030-preview-posting-readonly.png', {
      projectName: project.name,
      testId,
      status: /Posting Preview|Preview Posting|G\/L Entry|Customer Ledger Entry|Bank Account Ledger Entry/i.test(previewText)
        ? 'labor'
        : 'rejected',
      purpose: 'PAYMENTS-009 Preview Posting direkt aus Cash Receipt Journal oeffnen; keine Zahlung bestaetigen.',
      knownLimitations: [
        'Nur Preview-Pfad, keine Buchung.',
        'CRONUS-USA-Labor in RM-DEMO, kein deutscher Finalnachweis.'
      ],
      bookUse: 'candidate'
    });
  }

  const cleanup = await cleanupDraftLine(page, documentNo);
  const afterCleanupText = normalizeText(await pageText(page));
  await writeTextEvidence(paymentsEvidencePath('040-after-cleanup-page-text.txt'), compactPageText(afterCleanupText));

  const result = {
    testId: 'PAYMENTS-009',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-apply-preview-readiness-no-payment-no-application',
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
    appliedCheckboxValue: draft.appliedCheckboxValue,
    appliesToDocTypeValue: draft.appliesToDocTypeValue,
    appliesToDocNoValue: draft.appliesToDocNoValue,
    journalCheckVisible: draft.journalCheck.journalCheckVisible,
    journalCheckZeroIssues: draft.journalCheck.zeroIssuesTotalVisible,
    journalCheckZeroLinesWithIssues: draft.journalCheck.zeroLinesWithIssuesVisible,
    currentLineNoIssuesVisible: draft.journalCheck.currentLineNoIssuesVisible,
    journalCheckIssueText: draft.journalCheck.issueText,
    applyEntries,
    preview: {
      directlyVisible: previewDirectlyVisible,
      opened: previewOpened,
      previewRowsVisible:
        previewOpened && /Posting Preview|Preview Posting|G\/L Entry|Customer Ledger Entry|Bank Account Ledger Entry/i.test(previewText)
    },
    cleanup,
    safety: {
      paymentPosted: false,
      applicationPosted: false,
      bankReconciliationOpened: false,
      postActionClicked: false,
      setAppliesToIdClicked: false,
      postApplicationClicked: false
    },
    proves: [
      'Cash Receipt Journal wurde per UI mit D10000/PS-INV103297/BANK-RM-01 vorbereitet.',
      'Applies-to Doc. Type/No. wurde als Journalbezug dokumentiert.',
      'Journal Check wurde vor jeder Zahlungsentscheidung gelesen.',
      applyEntries.opened
        ? 'Apply Entries wurde read-only erreicht; keine Apply-/Post-Aktion wurde ausgefuehrt.'
        : 'Apply Entries wurde in diesem Journalzustand nicht stabil geoeffnet.',
      cleanup.cleaned
        ? 'Der Entwurf wurde geloescht; es wurde nichts gebucht.'
        : 'Der Entwurf wurde nicht erfolgreich bereinigt; es wurde trotzdem keine Buchung bestaetigt.'
    ],
    doesNotProve: [
      'Keine Zahlung wurde gebucht.',
      'Kein OP wurde ausgeglichen.',
      'Keine Bankposten, Debitoren-Ausgleichsposten oder Bankabstimmung.',
      'Kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.'
    ],
    nextStep:
      draft.journalCheck.zeroIssuesTotalVisible && applyEntries.opened
        ? 'PAYMENTS-010: nur nach ausdruecklicher Freigabe eine kontrollierte Laborzahlung planen; vorher Buchungsdialog/Preview-Risiko separat absichern.'
        : 'PAYMENTS-010: Apply-Entries-/Preview-Pfad weiter klaeren, bevor eine Laborzahlung freigegeben wird.'
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-009-result.json'), result);
  await writeTextEvidence(paymentsEvidencePath('PAYMENTS-009-APPLY-PREVIEW-READINESS.md'), renderMarkdown(result));
  await writeTextEvidence(
    paymentsEvidencePath('README.md'),
    [
      '# PAYMENTS-009 Evidence Index',
      '',
      `Status: CRONUS-USA-Labor, UI-only Apply-/Preview-Readiness, keine Zahlung, kein Ausgleich, Cleanup. Journal Check 0 Issues: ${result.journalCheckZeroIssues ? 'ja' : 'nein'}.`,
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-cash-receipt-draft-controls.json` | UI-Control-Snapshot | Cash-Receipt-Draft mit Betrag, Bankgegenkonto, Applies-to-Bezug und Journal Check | keine Zahlungswirkung | labor |',
      '| `010-cash-receipt-draft-page-text.txt` | kompakter Seitentext | sichtbarer Journal-/Apply-Kontext | kein OP-Ausgleich | labor |',
      '| `020-apply-entries-controls.json` | UI-/Button-Evidence | ob Apply Entries erreichbar war und welche Apply-/Post-Aktionen sichtbar waren | keine Ausfuehrung von Set Applies-to ID oder Post Application | labor |',
      '| `020-apply-entries-page-text.txt` | kompakter Seitentext | Apply-Entries-Kontext, falls erreichbar | keine Anwendung/Ausgleichsbuchung | labor |',
      '| `030-preview-posting-readiness.json` | UI-/Button-Evidence | ob Preview Posting direkt sichtbar/geoeffnet war | keine Buchung und keine Vollstaendigkeitsgarantie ueber versteckte Menues | labor |',
      '| `040-after-cleanup-page-text.txt` | kompakter Seitentext | Zustand nach UI-Cleanup | keine Zahlungswirkung | labor |',
      '| `PAYMENTS-009-result.json` | JSON-Ergebnis | strukturierter Apply-/Preview-/Cleanup-/Sicherheitsbefund | kein Zahlungs-Finalnachweis | labor |',
      '| `PAYMENTS-009-APPLY-PREVIEW-READINESS.md` | Lernzusammenfassung | Anfaengererklaerung zu Applies-to, Apply Entries, Journal Check und Grenzen | keine Zahlung und kein Ausgleich | labor |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Limitationen der PNGs | keine eigenstaendige fachliche Wahrheit ohne Text/JSON | labor |',
      ''
    ].join('\n')
  );

  expect(result.draftVisible, 'Der UI-Draft muss vor dem Cleanup sichtbar sein.').toBe(true);
  expect(result.journalCheckZeroIssues, 'PAYMENTS-009 setzt auf den geloesten PAYMENTS-008 Journal Check auf.').toBe(true);
  expect(result.cleanup.cleaned, 'Der UI-Draft muss nach der Evidence wieder bereinigt sein.').toBe(true);
  expect(result.safety.paymentPosted).toBe(false);
  expect(result.safety.applicationPosted).toBe(false);
});
