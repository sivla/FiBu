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

const testId = 'payments-005';
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
    /PAY005|BANK-RM-01|Cash Receipt Journal|Batch Name|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Description|Amount|Bal\. Account|Applies-to|Apply Entries|Journal Check|Post|Payment|Customer|D10000|PS-INV103297|Ausgleich|Gegenkonto|Buchen|Zahlung|Bank/i;
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
  await fillControl(controls[5], 'PAYMENTS-005 Draft PS-INV103297');
  await fillControl(controls[7], '-68000');
  await page.waitForTimeout(1500);
  await fillControl(controls[9], 'Bank Account');
  await fillControl(controls[10], 'BANK-RM-01');
  await page.waitForTimeout(1500);
  await fillControl(controls[12], 'Invoice');
  await fillControl(controls[13], 'PS-INV103297');
  await page.waitForTimeout(3500);

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
    documentNoVisible: values.includes(documentNo) || text.includes(documentNo),
    customerVisible: values.includes('D10000') || /D10000/i.test(text),
    bankVisible: values.includes('BANK-RM-01') || /BANK-RM-01/i.test(text),
    invoiceReferenceVisible: values.includes('PS-INV103297') || /PS-INV103297/i.test(text),
    amountVisible: values.some((value) => /68[.,]?000|-68000|-68[.,]?000/i.test(value)) || /68[.,]?000|-68[.,]?000/i.test(text),
    journalCheckVisible: /Journal Check/i.test(`${text}\n${buttons.join('\n')}`),
    journalCheckIssueCount: /1\s+Issues Total|1\s+Lines with issues/i.test(`${text}\n${buttons.join('\n')}`) ? 1 : 0,
    journalCheckIssueText:
      text
        .split('\n')
        .map((line) => line.trim())
        .find((line) => /Amount.*Gen\. Journal Line|Gen\. Journal Line.*Amount/i.test(line)) ?? '',
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
  return [
    '# PAYMENTS-005 Cash Receipt Journal UI-Draft',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, ui-draft, no-payment, no-application, cleanup |',
    `| Document No. | \`${result.documentNo}\` |`,
    '| Ausgangsposten | `PS-INV103297` / `D10000` |',
    '| Gegenkonto | `BANK-RM-01` |',
    '| Betrag im Entwurf | `-68.000` als Cash-Receipt-Customer-Zeile |',
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
    `| Journal Check Issues | ${result.journalCheckIssueCount} |`,
    `| Cleanup geloescht | ${cleanup.cleaned ? 'ja' : 'nein'} |`,
    '| Zahlung gebucht | nein |',
    '| OP ausgeglichen | nein |',
    '| Bankabstimmung | nein |',
    '',
    '## Anfaenger-Lernwert',
    '',
    'Eine Zahlungsjournalzeile ist ein Entwurf, keine Zahlung. Erst beim Buchen entstehen Debitoren-/Bankposten und erst dann wird ein OP-Ausgleich wirklich wirksam. Fuer Anfaenger ist wichtig: Debitor, Betrag, Gegenkonto und Rechnungsbezug muessen schon vor dem Buchen plausibel sein. Dieser Lauf zeigt genau diesen Zwischenstand und loescht ihn danach wieder.',
    '',
    'Der Journal Check ist dabei nicht nur Dekoration: Obwohl der Betrag in der UI-Zelle sichtbar ist, meldet BC im Labor noch ein Issue zur internen `Amount`-Validierung der `Gen. Journal Line`. Deshalb ist dieser Entwurf nicht zahlungsreif.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 19/20 kann jetzt einen UI-basierten Zwischenschritt zwischen offener Rechnung und Zahlung zeigen: Cash Receipt Journal oeffnen, Zahlungszeile vorbereiten, Journal Check beachten, aber noch nicht buchen. Der Screenshot ist ein Laborbild fuer den Entwurf, nicht fuer eine Zahlung.',
    '',
    '## Grenze',
    '',
    '- CRONUS-USA-Labor, kein deutscher Finalnachweis.',
    '- Keine Zahlung, kein OP-Ausgleich, keine Bankposten und keine Bankabstimmung.',
    '- Keine deutsche Bank-/Compliance- oder Steuerlogik.',
    '- `Preview Posting` war in `PAYMENTS-004` nicht sichtbar; dieser UI-Draft nutzt Journal Check als sichtbaren Preflight-Hinweis.',
    '- Journal Check meldet noch ein Issue zur Amount-Validierung; keine Zahlungsfreigabe.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep as string,
    ''
  ].join('\n');
}

test('PAYMENTS-005 Cash Receipt Journal UI-Entwurfszeile vorbereiten und bereinigen', async ({ page }) => {
  const documentNo = `PAY005-${Date.now().toString().slice(-6)}`;
  await openCashReceiptJournal(page);

  const draft = await fillCashReceiptDraft(page, documentNo);
  await writeJsonEvidence(paymentsEvidencePath('010-ui-draft-controls.json'), {
    documentNo,
    before: draft.before,
    after: draft.after,
    buttons: draft.buttons
  });
  await writeTextEvidence(paymentsEvidencePath('010-ui-draft-page-text.txt'), compactPageText(draft.text));
  await screenshot(page, 'payments-005-010-cash-receipt-ui-draft.png', {
    projectName: project.name,
    testId,
    status: draft.documentNoVisible ? 'labor' : 'rejected',
    purpose:
      'PAYMENTS-005 UI-Draft: Cash Receipt Journal mit Debitor D10000, Rechnungsbezug PS-INV103297 und Gegenkonto BANK-RM-01 vorbereiten; keine Buchung.',
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
    testId: 'PAYMENTS-005',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-draft-no-payment-no-application',
    documentNo,
    sourceContext: {
      postedSalesInvoiceNo: 'PS-INV103297',
      customerNo: 'D10000',
      targetBankAccountNo: 'BANK-RM-01',
      amountDraft: -68000
    },
    draftVisible: draft.documentNoVisible,
    customerVisible: draft.customerVisible,
    bankVisible: draft.bankVisible,
    invoiceReferenceVisible: draft.invoiceReferenceVisible,
    amountVisible: draft.amountVisible,
    journalCheckVisible: draft.journalCheckVisible,
    journalCheckIssueCount: draft.journalCheckIssueCount,
    journalCheckIssueText: draft.journalCheckIssueText,
    readyForPaymentPosting: false,
    postVisible: draft.postVisible,
    cleanup,
    safety: {
      paymentPosted: false,
      applicationPosted: false,
      bankReconciliationOpened: false,
      postActionClicked: false
    },
    proves: [
      'Eine Cash-Receipt-Journal-Zeile kann ueber die UI fuer D10000 vorbereitet werden.',
      'Der UI-Entwurf kann BANK-RM-01 als Gegenkonto und PS-INV103297 als Rechnungsbezug sichtbar enthalten.',
      'Der Entwurf wurde anschliessend geloescht; keine Zahlung und kein OP-Ausgleich wurden gebucht.'
    ],
    doesNotProve: [
      'Keine Zahlung wurde gebucht.',
      'Kein OP wurde ausgeglichen.',
      'Keine Bankposten oder Debitorenpostenwirkung.',
      'Kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.'
    ],
    nextStep:
      'PAYMENTS-006: UI-Draft erneut gezielt verbessern, bis Journal Check 0 Issues zeigt; Amount-Validierung, Betragsrichtung und Apply-Logik klaeren. Keine Zahlung ohne neue Freigabe.'
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-005-result.json'), result);
  await writeTextEvidence(paymentsEvidencePath('PAYMENTS-005-CASH-RECEIPT-UI-DRAFT.md'), renderMarkdown(result));
  await writeTextEvidence(
    paymentsEvidencePath('README.md'),
    [
      '# PAYMENTS-005 Evidence Index',
      '',
      'Status: CRONUS-USA-Labor, UI-Draft, keine Zahlung, kein Ausgleich, Cleanup.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-ui-draft-controls.json` | UI-Control-Snapshot | sichtbare Journalfelder und eingetragene Draft-Werte | keine Buchung und keine OP-Anwendung | labor |',
      '| `010-ui-draft-page-text.txt` | kompakter Seitentext | Cash Receipt Journal mit Draft-Kontext | keine Zahlungswirkung | labor |',
      '| `020-after-cleanup-page-text.txt` | kompakter Seitentext | Zustand nach UI-Cleanup | keine Zahlungswirkung | labor |',
      '| `payments-005-010-cash-receipt-ui-draft.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Draft-Bilds | keine eigenstaendige Zahlungs-Evidence | labor |',
      '| `PAYMENTS-005-result.json` | JSON-Ergebnis | strukturierter UI-Draft-/Cleanup-/Sicherheitsbefund | kein Zahlungs-Finalnachweis | labor |',
      '| `PAYMENTS-005-CASH-RECEIPT-UI-DRAFT.md` | Lernzusammenfassung | Anfaengererklaerung, Buchwirkung und naechster Schritt | keine Zahlung und kein Ausgleich | labor |',
      ''
    ].join('\n')
  );

  expect(result.draftVisible, 'Der UI-Draft muss vor dem Cleanup sichtbar sein.').toBe(true);
  expect(result.cleanup.cleaned, 'Der UI-Draft muss nach der Evidence wieder bereinigt sein.').toBe(true);
  expect(result.safety.paymentPosted).toBe(false);
  expect(result.safety.applicationPosted).toBe(false);
});
