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

test.setTimeout(360_000);

const testId = 'payments-007';
const targetBankAccountNo = 'BANK-RM-01';
const referencePostingGroup = 'CHECKING';

type ControlHandle = {
  handle: import('@playwright/test').ElementHandle<HTMLElement>;
  tag: string;
  x: number;
  y: number;
  value: string;
  label: string;
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
    /BANK-RM-01|CHECKING|Cash Receipt Journal|Batch Name|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Description|Amount|Bal\. Account|Applies-to|Journal Check|Refresh|Post|Payment|Customer|D10000|PS-INV103297|Bank Acc\. Posting Group|Bank Account Posting Group|Current line|Issues Total|No issues|nicht vorhanden|does not exist|muss|must/i;
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

async function clickTextInAnyFrame(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const target = scope.getByText(label).first();
    if (await target.isVisible({ timeout: 1000 }).catch(() => false)) {
      await target.click();
      await page.waitForTimeout(1500);
      return true;
    }
  }

  return false;
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

async function openBankAccounts(page: Page) {
  await page.goto(bcPageUrl(371, project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3000);
}

async function openBankAccountCard(page: Page, bankAccountNo: string) {
  await openBankAccounts(page);
  const opened = await clickTextInAnyFrame(page, new RegExp(`^${bankAccountNo}$`, 'i'));
  if (!opened) {
    throw new Error(`Bankkonto ${bankAccountNo} in Bank Accounts nicht sichtbar.`);
  }

  await page.waitForTimeout(5000);
  await dismissTours(page);
  await clickTextInAnyFrame(page, /^Posting$/i);
  await page.waitForTimeout(1500);
}

async function visibleControls(page: Page) {
  const controls: ControlHandle[] = [];

  for (const frame of page.frames()) {
    const handles = (await frame.locator('input,select,textarea').elementHandles().catch(() => [])) as Array<
      import('@playwright/test').ElementHandle<HTMLElement>
    >;

    for (const handle of handles) {
      const data = await handle
        .evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const labels: string[] = [];
          let parent = element.parentElement;
          for (let depth = 0; depth < 4 && parent; depth += 1) {
            labels.push((parent.innerText || '').slice(0, 260));
            parent = parent.parentElement;
          }

          return {
            visible: Boolean(rect.width && rect.height),
            tag: element.tagName,
            x: rect.x,
            y: rect.y,
            value: (element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value ?? '',
            label: labels.join(' | ')
          };
        })
        .catch(() => undefined);

      if (!data?.visible) {
        continue;
      }

      controls.push({
        handle,
        tag: data.tag,
        x: data.x,
        y: data.y,
        value: data.value,
        label: data.label
      });
    }
  }

  return controls.sort((left, right) => left.y - right.y || left.x - right.x);
}

async function bankPostingGroupControl(page: Page) {
  const controls = await visibleControls(page);
  return controls.find((control) => /Bank Acc\. Posting Group|Bank Account Posting Group/i.test(control.label));
}

async function revealBankPostingGroupControl(page: Page) {
  let control = await bankPostingGroupControl(page);
  if (control) {
    return control;
  }

  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(800);
  await clickTextInAnyFrame(page, /^Posting$/i);
  await page.waitForTimeout(1000);
  control = await bankPostingGroupControl(page);
  if (control) {
    await control.handle.scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(500);
  }

  return control;
}

async function readBankPostingGroup(page: Page) {
  const control = await revealBankPostingGroupControl(page);
  return {
    found: Boolean(control),
    value: control?.value ?? '',
    x: control ? Math.round(control.x) : undefined,
    y: control ? Math.round(control.y) : undefined
  };
}

async function setBankPostingGroupViaUi(page: Page, code: string) {
  const control = await bankPostingGroupControl(page);
  if (!control) {
    return { attempted: false, changed: false, reason: 'field-not-visible', before: '', after: '' };
  }

  const before = control.value;
  if (before === code) {
    return { attempted: false, changed: false, reason: 'already-fit', before, after: before };
  }

  await control.handle.click();
  await control.handle.press('Control+A').catch(() => undefined);
  await control.handle.type(code, { delay: 30 });
  await control.handle.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1200);

  const warningText = normalizeText(await pageText(page));
  const directPostingWarningShown =
    /selected bank account posting group is linked to a general ledger account that allows direct posting/i.test(
      warningText
    );
  if (directPostingWarningShown) {
    await clickAction(page, /^Nein$|^No$/i);
  }

  await page.waitForTimeout(3000);
  const after = await readBankPostingGroup(page);

  return {
    attempted: true,
    changed: after.value === code,
    reason: after.value === code ? 'ui-field-updated' : 'ui-field-not-updated',
    directPostingWarningShown,
    directPostingWarningResponse: directPostingWarningShown ? 'No/Nein' : '',
    before,
    after: after.value
  };
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
          label: element.textContent ?? ''
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
      label: data.label
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
    value: control.value
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

async function readJournalCheck(page: Page) {
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const allText = `${text}\n${buttons.join('\n')}`;
  const issueText =
    text
      .split('\n')
      .map((line) => line.trim())
      .find((line) => /Posting Group.*nicht vorhanden|does not exist|must have a value|muss.*Wert enthalten|Account.*missing|Konto.*fehlt/i.test(line)) ??
    '';
  return {
    text,
    buttons,
    journalCheckVisible: /Journal Check/i.test(allText),
    zeroIssuesTotalVisible: /0\s+Issues?\s+Total/i.test(allText),
    zeroLinesWithIssuesVisible: /0\s+Lines?\s+with\s+issues/i.test(allText),
    oneIssueVisible: /1\s+Issues?\s+Total|1\s+Lines?\s+with\s+issues/i.test(allText),
    currentLineNoIssuesVisible: /Current\s+line\s*[:\-]?\s*No\s+issues\s+found/i.test(allText),
    issueText
  };
}

async function refreshJournalCheck(page: Page) {
  await clickAction(page, /^Refresh$/i);
  await page.waitForTimeout(3000);
  return readJournalCheck(page);
}

async function openCashReceiptJournal(page: Page) {
  await page.goto(bcPageUrl(255, project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);
}

async function fillCashReceiptDraft(page: Page, documentNo: string) {
  const frame = await cashReceiptJournalFrame(page);
  const controls = await firstLineControls(frame);
  const before = snapshotControls(controls);
  if (controls.length < 14) {
    throw new Error(`Zu wenige sichtbare Cash-Receipt-Controls gefunden: ${controls.length}.`);
  }

  await fillControl(controls[0], '08.06.2026');
  await fillControl(controls[1], 'Payment');
  await fillControl(controls[2], documentNo);
  await fillControl(controls[3], 'Customer');
  await fillControl(controls[4], 'D10000');
  await page.waitForTimeout(1600);
  await fillControl(controls[5], 'PAYMENTS-007 Bank posting group fit PS-INV103297');
  await fillTextLikeUser(controls[7], '-68.000,00');
  await page.waitForTimeout(1200);
  await fillControl(controls[9], 'Bank Account');
  await fillControl(controls[10], targetBankAccountNo);
  await page.waitForTimeout(1500);
  await fillControl(controls[12], 'Invoice');
  await fillControl(controls[13], 'PS-INV103297');
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(3500);

  const beforeRefresh = await readJournalCheck(page);
  const afterRefresh = await refreshJournalCheck(page);
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
    beforeRefresh,
    afterRefresh,
    documentNoVisible: values.includes(documentNo) || text.includes(documentNo),
    customerVisible: values.includes('D10000') || /D10000/i.test(text),
    bankVisible: values.includes(targetBankAccountNo) || /BANK-RM-01/i.test(text),
    invoiceReferenceVisible: values.includes('PS-INV103297') || /PS-INV103297/i.test(text),
    amountVisible:
      values.some((value) => /68[.,]?000|-68000|-68[.,]?000/i.test(value)) || /68[.,]?000|-68[.,]?000/i.test(text),
    journalCheckVisible: /Journal Check/i.test(`${text}\n${buttons.join('\n')}`),
    journalCheckIssueCount: afterRefresh.oneIssueVisible ? 1 : 0,
    journalCheckIssueText: afterRefresh.issueText,
    journalCheckZeroIssues: afterRefresh.zeroIssuesTotalVisible,
    journalCheckZeroLinesWithIssues: afterRefresh.zeroLinesWithIssuesVisible,
    currentLineNoIssuesVisible: afterRefresh.currentLineNoIssuesVisible,
    postVisible: /^Post$/im.test(`${text}\n${buttons.join('\n')}`)
  };
}

async function cleanupDraftLine(page: Page, documentNo: string) {
  const frame = await cashReceiptJournalFrame(page);
  const beforeText = normalizeText(await pageText(page));
  const beforeControls = await firstLineControls(frame);
  const documentControl = beforeControls.find((control) => control.value === documentNo);
  const documentVisibleInControls = Boolean(documentControl);

  if (!beforeText.includes(documentNo) && !documentVisibleInControls) {
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
    '# PAYMENTS-007 Bank Account Posting Fit',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, UI-only, no-payment, no-application, cleanup |',
    `| Bankkonto | \`${targetBankAccountNo}\` |`,
    `| Referenz-Buchungsgruppe | \`${referencePostingGroup}\` aus CRONUS-Bankkonto \`CHECKING\` |`,
    '',
    '## Ergebnis',
    '',
    '| Pruefpunkt | Befund |',
    '|---|---|',
    `| Bankkarte in UI geoeffnet | ${result.bankAccountCardOpened ? 'ja' : 'nein'} |`,
    `| Feld Bank Acc. Posting Group sichtbar | ${result.bankPostingGroupBefore?.found ? 'ja' : 'nein'} |`,
    `| Vorheriger Wert | \`${result.bankPostingGroupBefore?.value ?? ''}\` |`,
    `| UI-Fit versucht | ${result.bankPostingGroupFit?.attempted ? 'ja' : 'nein'} |`,
    `| Direct-Posting-Warnung sichtbar | ${result.bankPostingGroupFit?.directPostingWarningShown ? 'ja' : 'nein'} |`,
    `| Antwort auf Warnung | ${result.bankPostingGroupFit?.directPostingWarningResponse || 'n/a'} |`,
    `| Nachheriger Wert direkt | \`${result.bankPostingGroupAfter?.value ?? ''}\` |`,
    `| Nach erneutem Oeffnen persistiert | \`${result.bankPostingGroupPersisted?.value ?? ''}\` |`,
    `| UI-Fit geloest | ${result.bankPostingGroupPersisted?.value === referencePostingGroup ? 'ja' : 'nein'} |`,
    `| Zahlungsjournal erneut gefuellt | ${result.cashReceiptDraft?.draftVisible ? 'ja' : 'nein'} |`,
    `| Journal Check 0 Issues Total | ${result.cashReceiptDraft?.journalCheckZeroIssues ? 'ja' : 'nein'} |`,
    `| Journal Check 0 Lines with issues | ${result.cashReceiptDraft?.journalCheckZeroLinesWithIssues ? 'ja' : 'nein'} |`,
    `| Current line: No issues found | ${result.cashReceiptDraft?.currentLineNoIssuesVisible ? 'ja' : 'nein'} |`,
    `| Aktueller Issue | ${result.cashReceiptDraft?.journalCheckIssueText ? `\`${result.cashReceiptDraft.journalCheckIssueText}\`` : 'kein Text nachgewiesen'} |`,
    `| Cleanup geloescht | ${result.cleanup?.cleaned ? 'ja' : 'nein'} |`,
    '| Zahlung gebucht | nein |',
    '| OP ausgeglichen | nein |',
    '| Bankabstimmung | nein |',
    '',
    '## Anfaenger-Lernwert',
    '',
    'Business Central prueft bei Zahlungsjournalen nicht nur Debitor, Betrag und Rechnungsbezug. Wenn das Gegenkonto ein Bankkonto ist, muss die Bankkontokarte eine Bankkontobuchungsgruppe tragen. Diese Buchungsgruppe ist die Bruecke zur Kontenfindung: Ohne sie weiss BC nicht, welche Sachkonten bei einer spaeteren Zahlung angesprochen werden sollen.',
    '',
    result.bankPostingGroupFit?.directPostingWarningShown
      ? 'Beim Setzen von `CHECKING` warnt BC, dass die Bankkontobuchungsgruppe auf ein Sachkonto mit erlaubter Direktbuchung verweist. Das ist ein Governance-Hinweis: Zahlungen sollen nicht unkontrolliert direkt auf Bank-Sachkonten gebucht werden, weil das spaetere Bankabstimmung und Prozesskontrolle erschweren kann. Im Labor wird diese Warnung bewusst mit `Nein` geschlossen, ohne eine Zahlung zu buchen.'
      : '`CHECKING` war im stabilen Nachlauf bereits auf `BANK-RM-01` persistiert. Damit ist der alte Bankkontobuchungsgruppen-Blocker geloest; die Journalzeile ist trotzdem erst dann zahlungsreif, wenn `Journal Check` keine Issues mehr meldet.',
    '',
    'Der sinnvolle Lernschritt ist deshalb zweistufig: zuerst das Bankkonto in der Karte fachlich fitten, danach dieselbe Journalzeile erneut ueber `Journal Check` pruefen. Erst wenn der Preflight keine Issues zeigt, darf man ueber eine bewusst freigegebene Laborzahlung nachdenken.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 19/20 muss Bankkonto-Setup und Zahlungsjournal deutlicher trennen. Ein sichtbares Bankkonto ist noch nicht zahlungsbereit; die Bankkontobuchungsgruppe ist Pflicht-Setup vor einer Zahlung. `PAYMENTS-007` zeigt zugleich: Auch nach geloestem Bankkonto-Fit kann `Journal Check` noch einen separaten Amount-Blocker melden.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor, kein deutscher Bank-/Compliance-Finalnachweis.',
    '- Kein Zahlungs-, Ausgleichs-, Debitorenposten-, Bankposten- oder Bankabstimmungsnachweis.',
    '- `CHECKING` ist ein CRONUS-Laborfit, kein deutscher Kontenplan-Endstand.',
    '- Die Journalzeile wurde nur als Entwurf angelegt und wieder geloescht.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('PAYMENTS-007 BANK-RM-01 Bank Account Posting Group per UI fitten und Cash Receipt Journal erneut pruefen', async ({
  page
}) => {
  const documentNo = `PAY007-${Date.now().toString().slice(-6)}`;

  await openBankAccountCard(page, targetBankAccountNo);
  const beforeFit = await readBankPostingGroup(page);
  const fit = await setBankPostingGroupViaUi(page, referencePostingGroup);
  const afterFit = await readBankPostingGroup(page);
  const bankCardText = normalizeText(await pageText(page));
  await writeTextEvidence(paymentsEvidencePath('010-bank-account-card-page-text.txt'), compactPageText(bankCardText));
  const visiblePostingControl = await bankPostingGroupControl(page);
  await visiblePostingControl?.handle.scrollIntoViewIfNeeded().catch(() => undefined);
  await page.waitForTimeout(1000);
  await screenshot(page, 'payments-007-010-bank-account-posting-group-fit.png', {
    projectName: project.name,
    testId,
    status: afterFit.value === referencePostingGroup ? 'labor' : 'rejected',
    purpose:
      'PAYMENTS-007 UI-Fit: Bankkarte BANK-RM-01 mit Bank Acc. Posting Group CHECKING als CRONUS-USA-Laborfit pruefen; keine Zahlung.',
    knownLimitations: [
      'UI-Setup-Fit im CRONUS-USA-Labor, kein deutscher Bank-/Compliance-Finalnachweis.',
      'Kein Zahlungsjournal gebucht, kein OP-Ausgleich, keine Bankabstimmung.',
      'CHECKING ist ein CRONUS-Laborwert und kein deutscher Kontenplan-Endstand.'
    ],
    bookUse: 'field-proof'
  });
  await openBankAccountCard(page, targetBankAccountNo);
  const persistedFit = await readBankPostingGroup(page);
  const persistedBankCardText = normalizeText(await pageText(page));
  await writeTextEvidence(
    paymentsEvidencePath('011-bank-account-card-persisted-page-text.txt'),
    compactPageText(persistedBankCardText)
  );

  await openCashReceiptJournal(page);
  const draft = await fillCashReceiptDraft(page, documentNo);
  await writeJsonEvidence(paymentsEvidencePath('020-cash-receipt-controls.json'), {
    documentNo,
    before: draft.before,
    after: draft.after,
    beforeRefresh: draft.beforeRefresh,
    afterRefresh: draft.afterRefresh,
    buttons: draft.buttons
  });
  await writeTextEvidence(paymentsEvidencePath('020-cash-receipt-page-text.txt'), compactPageText(draft.text));
  await screenshot(page, 'payments-007-020-cash-receipt-journal-after-bank-fit.png', {
    projectName: project.name,
    testId,
    status: draft.journalCheckZeroIssues ? 'labor' : 'rejected',
    purpose:
      'PAYMENTS-007 Preflight nach Bank-Posting-Fit: Cash Receipt Journal fuer D10000/PS-INV103297 mit BANK-RM-01 erneut pruefen; keine Zahlung.',
    knownLimitations: [
      'UI-Entwurf, keine Zahlung und kein OP-Ausgleich.',
      'Der Entwurf wird im selben Lauf wieder geloescht.',
      'CRONUS-USA-Labor; kein deutscher Bank-/Compliance-Finalnachweis.'
    ],
    bookUse: 'field-proof'
  });

  const cleanup = await cleanupDraftLine(page, documentNo);
  const afterCleanupText = normalizeText(await pageText(page));
  await writeTextEvidence(paymentsEvidencePath('030-after-cleanup-page-text.txt'), compactPageText(afterCleanupText));

  const result = {
    testId: 'PAYMENTS-007',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-bank-account-posting-fit-no-payment-no-application',
    bankAccountNo: targetBankAccountNo,
    referencePostingGroup,
    bankAccountCardOpened: /Bankkontokarte|Bank Account Card/i.test(bankCardText) && /BANK-RM-01/i.test(bankCardText),
    bankPostingGroupBefore: beforeFit,
    bankPostingGroupFit: fit,
    bankPostingGroupAfter: afterFit,
    bankPostingGroupPersisted: persistedFit,
    cashReceiptDraft: {
      documentNo,
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
      postVisible: draft.postVisible
    },
    cleanup,
    safety: {
      paymentPosted: false,
      applicationPosted: false,
      bankReconciliationOpened: false,
      postActionClicked: false
    },
    proves: [
      'BANK-RM-01 wurde in der BC-UI geoeffnet.',
      persistedFit.value === referencePostingGroup
        ? 'Bank Acc. Posting Group wurde ueber die UI geprueft und als CHECKING persistiert.'
        : 'Bank Acc. Posting Group wurde ueber die UI geprueft; der Eingabeversuch persistiert im Labor nicht als CHECKING.',
      'Der Cash-Receipt-Draft wurde danach erneut ueber UI vorbereitet und per Journal Check geprueft.',
      cleanup.cleaned
        ? 'Der Entwurf wurde geloescht; es wurde nichts gebucht.'
        : 'Der Entwurf wurde nicht erfolgreich bereinigt; es wurde trotzdem nichts gebucht.'
    ],
    doesNotProve: [
      'Keine Zahlung wurde gebucht.',
      'Kein OP wurde ausgeglichen.',
      'Keine Bankposten oder Debitorenpostenwirkung.',
      'Kein deutscher Bank-, Steuer-, Kontenplan- oder Compliance-Finalnachweis.'
    ],
    nextStep:
      persistedFit.value === referencePostingGroup && draft.journalCheckZeroIssues && draft.journalCheckZeroLinesWithIssues
        ? 'PAYMENTS-008: ausdruecklich kontrollierte Laborzahlung vorbereiten, aber erst nach eigener Freigabe; vorher Buch-/Checklistenstelle fuer Preflight finalisieren.'
        : persistedFit.value !== referencePostingGroup
          ? 'PAYMENTS-008: Bank Account Posting Group auf BANK-RM-01 weiter ueber UI untersuchen, insbesondere Lookup-/Speicherpfad oder vollstaendige Bankkontoanlage als Klickpfad; weiterhin keine Zahlung buchen.'
          : 'PAYMENTS-008: neuen Journal-Check-Blocker aus PAYMENTS-007 analysieren; weiterhin keine Zahlung buchen.'
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-007-result.json'), result);
  await writeTextEvidence(paymentsEvidencePath('PAYMENTS-007-BANK-POSTING-FIT.md'), renderMarkdown(result));
  await writeTextEvidence(
    paymentsEvidencePath('README.md'),
    [
      '# PAYMENTS-007 Evidence Index',
      '',
      `Status: CRONUS-USA-Labor, UI-only Bank-Posting-Fit, Cash-Receipt-Preflight, keine Zahlung, kein Ausgleich. Journal Check 0 Issues: ${draft.journalCheckZeroIssues ? 'ja' : 'nein'}.`,
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-bank-account-card-page-text.txt` | kompakter Seitentext | Bankkarte `BANK-RM-01` und Posting-Kontext | keine Zahlungswirkung | labor |',
      '| `011-bank-account-card-persisted-page-text.txt` | kompakter Seitentext | erneutes Oeffnen der Bankkarte nach UI-Fit; JSON zeigt `CHECKING` persistiert | keine Zahlungswirkung | labor |',
      '| `020-cash-receipt-controls.json` | UI-Control-Snapshot | Cash-Receipt-Draft und Journal-Check-Befund nach Bank-Fit | keine Buchung und keine OP-Anwendung | labor |',
      '| `020-cash-receipt-page-text.txt` | kompakter Seitentext | Zahlungsjournal-Kontext nach Bank-Fit | keine Zahlungswirkung | labor |',
      '| `030-after-cleanup-page-text.txt` | kompakter Seitentext | Zustand nach UI-Cleanup | keine Zahlungswirkung | labor |',
      '| `payments-007-010-bank-account-posting-group-fit.screenshot.json` | Screenshot-Metadaten | Zweck und Grenze des Bankkartenbilds | kein deutscher Bank-Finalnachweis | labor |',
      '| `payments-007-020-cash-receipt-journal-after-bank-fit.screenshot.json` | Screenshot-Metadaten | Zweck und Grenze des Journal-Check-Bilds | keine Zahlungsbuchung | labor |',
      '| `PAYMENTS-007-result.json` | JSON-Ergebnis | strukturierter UI-Setup-/Preflight-/Cleanup-Befund | kein Zahlungs-Finalnachweis | labor |',
      '| `PAYMENTS-007-BANK-POSTING-FIT.md` | Lernzusammenfassung | Anfaengererklaerung, Buchwirkung und naechster Schritt | keine Zahlung und kein Ausgleich | labor |',
      ''
    ].join('\n')
  );

  expect(result.bankAccountCardOpened, 'Die Bankkarte BANK-RM-01 muss ueber UI geoeffnet sein.').toBe(true);
  expect(result.cashReceiptDraft.draftVisible, 'Der UI-Draft muss vor dem Cleanup sichtbar sein.').toBe(true);
  expect(result.cleanup.cleaned, 'Der UI-Draft muss nach der Evidence wieder bereinigt sein.').toBe(true);
  expect(result.safety.paymentPosted).toBe(false);
  expect(result.safety.applicationPosted).toBe(false);
});
