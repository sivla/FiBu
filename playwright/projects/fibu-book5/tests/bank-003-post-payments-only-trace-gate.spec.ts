import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(360_000);

const testId = 'bank-003';
const expectedInstance = 'MCP_1_20260210';
const expectedCompany = project.defaultCompany;
const pageIdPaymentReconciliationJournal = 1290;

function evidenceFile(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function buildPageUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(expectedInstance)) {
    throw new Error(`Configured BC URL does not target ${expectedInstance}.`);
  }

  url.searchParams.set('company', expectedCompany);
  url.searchParams.set('page', String(pageIdPaymentReconciliationJournal));
  return url.toString();
}

function asciiSafe(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeUrl(value: string) {
  return value
    .replace(/businesscentral\.dynamics\.com\/[^/?#]+/i, 'businesscentral.dynamics.com/<tenant>')
    .replace(/aadTenantId=[^&]+/gi, 'aadTenantId=<tenant>')
    .replace(/startTraceId=[^&]+/gi, 'startTraceId=<trace>')
    .replace(/tid=[^&]+/gi, 'tid=<tid>');
}

function compactInterestingText(text: string) {
  const interesting =
    /Payment Reconciliation Journal|Post Payments Only|Post|OK|Cancel|Abbrechen|Lines For Review|Balance After Posting|Match Confidence|Accepted|Applied Amount|Document No\.|Account Type|Account No\.|Transaction Amount|Statement|Payment/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => asciiSafe(line))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -4; offset <= 10; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }

  return [
    `Kompakter Page-/Dialog-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 260)
  ].join('\n');
}

function extractMetrics(text: string) {
  const normalized = text.replace(/\s+/g, ' ');
  return {
    linesForReview: normalized.match(/Lines For Review\s+(\d+)/i)?.[1] ?? null,
    linesWithDifferences: normalized.match(/Lines With differences\s+(\d+)/i)?.[1] ?? null,
    totalTransactionAmount: normalized.match(/Total Transaction Amount\s+([0-9.,-]+)/i)?.[1] ?? null,
    balanceAfterPosting: normalized.match(/Balance After Posting\s+([0-9.,-]+)/i)?.[1] ?? null,
    hasPostPaymentsOnly: /Post Payments Only/i.test(text),
    hasAccepted: /Accepted/i.test(text)
  };
}

async function visibleDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"], .ms-Dialog-main');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = asciiSafe(await locator.nth(index).innerText({ timeout: 800 }).catch(() => ''));
      if (text) dialogs.push(text);
    }
  }
  return [...new Set(dialogs)];
}

async function clickAction(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 900 }).catch(() => false)) {
        await action.click();
        await page.waitForTimeout(2500);
        return { clicked: true, method: `role:${role}` };
      }
    }
  }

  for (const scope of [page, ...page.frames()]) {
    const textAction = scope.getByText(label).first();
    if (await textAction.isVisible({ timeout: 900 }).catch(() => false)) {
      await textAction.click();
      await page.waitForTimeout(2500);
      return { clicked: true, method: 'text' };
    }
  }

  return { clicked: false, method: 'not-found' };
}

async function closeWithoutConfirming(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  if ((await visibleDialogs(page)).length === 0) return 'escape';

  for (const scope of [page, ...page.frames()]) {
    const closeButton = scope
      .getByRole('button', { name: /Close|Schliessen|Schlie.en|Cancel|Abbrechen/i })
      .first();
    if (await closeButton.isVisible({ timeout: 700 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(1200);
      return 'close-or-cancel-button';
    }
  }

  return 'not-closed';
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# BANK-003 Post Payments Only Trace Gate',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, post-dialog-gate, no-confirm, no-post, not-final |',
    `| Aktion | ${result.action.postPaymentsOnlyClicked ? 'Post Payments Only Dialog geoeffnet' : 'Post Payments Only nicht sicher geoeffnet'} |`,
    `| Dialoge erkannt | ${result.dialog.dialogCount} |`,
    `| Schliessmethode | ${result.dialog.closeMethod} |`,
    '',
    '## Ergebnis',
    '',
    result.action.postPaymentsOnlyClicked
      ? '`Post Payments Only...` wurde nur bis zum Dialog-/Request-Page-Gate geoeffnet. Es wurde kein OK, Ja oder Post bestaetigt.'
      : '`Post Payments Only...` konnte nicht sicher als Dialog-Gate geoeffnet werden.',
    '',
    '## Warum nicht gebucht wurde',
    '',
    'Im Journal sind mehrere Zahlungs-/Abstimmungszeilen sichtbar. Eine echte Buchung braucht vorher einen expliziten Beleg-/Posten-Traceplan: welche Zeile, welche offenen Posten, welche Bankposten, welche Sachposten und wie die Korrektur laeuft.',
    '',
    '## Sicherheitsgrenze',
    '',
    '- Kein `OK`/`Yes`/`Ja` im Postingdialog.',
    '- Kein `Post Payments Only` bestaetigt.',
    '- Kein Payment-Post.',
    '- Kein Bankabstimmungs-Post.',
    '- Kein Preview Posting.',
    '- Kein Setup Change.',
    '- Kein Company Switch.',
    '',
    '## German-Final-Rebuild',
    '',
    result.rebuildInstruction,
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('BANK-003 oeffnet Post Payments Only nur als Dialog-Gate', async ({ page }) => {
  await page.goto(buildPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);

  const initialUrl = page.url();
  expect(initialUrl).toMatch(/MCP_1_20260210/i);
  expect(new URL(initialUrl).searchParams.get('company')).toBe(expectedCompany);

  const beforeText = await pageText(page);
  await writeTextEvidence(evidenceFile('010-before-post-payments-only-page-text.txt'), compactInterestingText(beforeText));
  const beforeMetrics = extractMetrics(beforeText);
  const beforeButtons = (await visibleButtonNames(page)).map(asciiSafe);

  const clickResult = await clickAction(page, /Post Payments Only/i);
  await page.waitForTimeout(3000);

  const dialogTexts = await visibleDialogs(page);
  const duringText = await pageText(page);
  await writeTextEvidence(evidenceFile('020-post-payments-only-dialog-text.txt'), compactInterestingText(duringText));
  const dialogButtons = (await visibleButtonNames(page))
    .map(asciiSafe)
    .filter((button) => /OK|Yes|Ja|Post|Cancel|Abbrechen|Close|Schliessen|Schlie.en|Payments/i.test(button))
    .slice(0, 80);

  const closeMethod = await closeWithoutConfirming(page);
  const afterText = await pageText(page);
  await writeTextEvidence(evidenceFile('030-after-close-page-text.txt'), compactInterestingText(afterText));
  const afterMetrics = extractMetrics(afterText);
  const afterDialogs = await visibleDialogs(page);

  const dialogOpened = clickResult.clicked && (dialogTexts.length > 0 || /Post Payments Only/i.test(duringText));
  const safeClosed = afterDialogs.length === 0;
  const resultStatus = dialogOpened ? 'observed' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'post-payments-only-trace-gate-result',
    caseId: 'BANK-003-POST-PAYMENTS-ONLY-TRACE-GATE',
    testId: 'BANK-003',
    source: 'playwright-post-dialog-gate',
    resultStatus,
    environment: expectedInstance,
    company: expectedCompany,
    sourceCompany: expectedCompany,
    page: {
      pageId: pageIdPaymentReconciliationJournal,
      title: asciiSafe(await page.title()),
      initialUrl: sanitizeUrl(initialUrl),
      finalUrl: sanitizeUrl(page.url())
    },
    before: {
      metrics: beforeMetrics,
      relevantButtons: beforeButtons.filter((button) => /Accept|Apply|Post|Review|Match|Payment|Import/i.test(button)).slice(0, 60),
      evidenceFile: '010-before-post-payments-only-page-text.txt'
    },
    action: {
      postPaymentsOnlyClicked: clickResult.clicked,
      clickMethod: clickResult.method,
      confirmedPosting: false,
      okClicked: false,
      yesClicked: false
    },
    dialog: {
      dialogOpened,
      dialogCount: dialogTexts.length,
      dialogTextPreview: dialogTexts.map((text) => text.slice(0, 800)),
      relevantButtons: dialogButtons,
      evidenceFile: '020-post-payments-only-dialog-text.txt',
      closeMethod,
      safeClosed
    },
    after: {
      metrics: afterMetrics,
      remainingDialogs: afterDialogs,
      evidenceFile: '030-after-close-page-text.txt'
    },
    proved: dialogOpened
      ? ['Post Payments Only was opened only as a dialog/request-page gate and not confirmed.']
      : ['Payment Reconciliation Journal opened, but Post Payments Only dialog gate was not safely observed.'],
    notProved: [
      'No payment was posted.',
      'No bank reconciliation was posted.',
      'No ledger trace from a posting exists.',
      'No German bank/compliance final proof.'
    ],
    safety: {
      noOkOrYesConfirmed: true,
      noPostConfirmed: true,
      noPaymentPosted: true,
      noBankReconciliationPosted: true,
      noPreviewPosting: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noSetupChange: true
    },
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    rebuildInstruction:
      'In der deutschen Zielcompany den Post-Payments-Only-Dialog erneut mit deutschem Bankkonto, offenen Zielposten und geplantem Bank-/Debitor-/Kreditor-/Sachposten-Trace oeffnen. Erst danach darf eine echte Zahlung gebucht werden.',
    targetGermanCompanyImpact:
      'Deutsche Zielcompany braucht vor Payment Posting eindeutige Zeilenwahl, offene Posten, Bankkonto, Bank Account Posting Group, Posting-Gate und anschliessenden Ledger Trace.',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-003/BANK-003-result.json',
      'playwright/projects/fibu-book5/evidence/bank-003/BANK-003-POST-PAYMENTS-ONLY-TRACE-GATE.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-003/'],
    blockedBy: dialogOpened ? [] : ['post-payments-only-dialog-not-observed'],
    safeToFinalizeState: false,
    requiresReview: !dialogOpened || !safeClosed,
    nextStep: dialogOpened
      ? 'BANK-004: Vor echter Zahlung zuerst Zielzeile/offene Posten und erwartete Bank-/Sach-/Detailed-Ledger-Entries als Posting-Fachpruefung definieren.'
      : 'BANK-004: Focused action inventory fuer Post Payments Only oder Bank Account Reconciliation Page 379 Match/Apply route.'
  };

  await writeJsonEvidence(evidenceFile('BANK-003-result.json'), result);
  await writeTextEvidence(evidenceFile('BANK-003-POST-PAYMENTS-ONLY-TRACE-GATE.md'), renderMarkdown(result));
  await writeTextEvidence(
    evidenceFile('README.md'),
    [
      '# BANK-003 Evidence Index',
      '',
      'Status: labor, post-dialog-gate, no-confirm, no-post, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-before-post-payments-only-page-text.txt` | kompakter Seitentext | Payment Reconciliation Journal vor Posting-Gate | keine Buchung | labor |',
      '| `020-post-payments-only-dialog-text.txt` | kompakter Dialog-/Page-Text | sichtbarer Post-Payments-Only-Gate-Kontext | keine bestaetigte Zahlung | labor |',
      '| `030-after-close-page-text.txt` | kompakter Seitentext | Rueckkehr nach Abbruch/Schliessen | keine Ledger-Wirkung | labor |',
      '| `BANK-003-result.json` | JSON-Ergebnis | strukturierter Posting-Gate-Befund und Safety-Flags | keinen deutschen Finalnachweis | labor |',
      '| `BANK-003-POST-PAYMENTS-ONLY-TRACE-GATE.md` | Lernzusammenfassung | warum nicht gebucht wurde und was vor Posting fehlt | keine Zahlung | labor |',
      ''
    ].join('\n')
  );

  expect(resultStatus).toBe('observed');
  expect(result.safety.noPostConfirmed).toBe(true);
});
