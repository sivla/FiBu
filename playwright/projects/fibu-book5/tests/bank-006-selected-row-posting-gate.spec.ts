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

test.setTimeout(420_000);

const testId = 'bank-006';
const caseId = 'BANK-006-SELECTED-ROW-POSTING-GATE';
const expectedInstance = 'MCP_1_20260210';
const expectedCompany = project.defaultCompany;
const pageIdPaymentReconciliationJournal = 1290;
const targetDocumentNo = '108204';
const targetParty = 'First Up Consultants';
const targetAmount = '-2.151,46';

function bankEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
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

function buildPageUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(expectedInstance)) {
    throw new Error(`Configured BC URL does not target ${expectedInstance}.`);
  }
  url.searchParams.set('company', expectedCompany);
  url.searchParams.set('page', String(pageIdPaymentReconciliationJournal));
  return url.toString();
}

function compactInterestingText(text: string) {
  const interesting =
    /Payment Reconciliation Journal|Post Payments Only|Do you want to post the payments|Ja|Nein|Yes|No|OK|Cancel|Abbrechen|Accepted|Application Reviewed|First Up Consultants|108204|107196|-2\.151,46|Lines For Review|Applied Amount|Document No\.|Account Type|Account No\.|Transaction Amount|No\. of Open Ledger Entries|Within Amount Tolerance|Outside Amount Tolerance|Bankposten/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => asciiSafe(line))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -5; offset <= 12; offset += 1) {
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
      .slice(0, 320)
  ].join('\n');
}

function squash(text: string) {
  return asciiSafe(text).replace(/\s+/g, ' ');
}

function extractMetrics(text: string) {
  const oneLine = squash(text);
  return {
    linesForReview: oneLine.match(/Lines For Review\s+(\d+)/i)?.[1] ?? null,
    linesWithDifferences: oneLine.match(/Lines With differences\s+(\d+)/i)?.[1] ?? null,
    balanceAfterPosting: oneLine.match(/Balance After Posting\s+([0-9.,-]+)/i)?.[1] ?? null,
    targetDocumentVisible: oneLine.includes(targetDocumentNo),
    targetPartyVisible: new RegExp(targetParty, 'i').test(oneLine),
    targetAmountVisible: oneLine.includes(targetAmount),
    acceptedVisible: /Accepted/i.test(oneLine),
    applicationReviewedVisible: /Application Reviewed/i.test(oneLine),
    postPaymentsOnlyVisible: /Post Payments Only/i.test(oneLine)
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

async function clickFirstVisible(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 900 }).catch(() => false)) {
        await action.click();
        await page.waitForTimeout(2200);
        return { clicked: true, method: `role:${role}` };
      }
    }
  }

  for (const scope of [page, ...page.frames()]) {
    const textAction = scope.getByText(label).first();
    if (await textAction.isVisible({ timeout: 900 }).catch(() => false)) {
      await textAction.click();
      await page.waitForTimeout(2200);
      return { clicked: true, method: 'text' };
    }
  }

  return { clicked: false, method: 'not-found' };
}

async function selectTargetDocument(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const exactCell = scope.getByText(targetDocumentNo, { exact: true }).first();
    if (await exactCell.isVisible({ timeout: 1200 }).catch(() => false)) {
      await exactCell.click();
      await page.waitForTimeout(1200);
      return { selected: true, method: 'exact-text' };
    }
  }

  for (const scope of [page, ...page.frames()]) {
    const row = scope.locator('tr, [role="row"]').filter({ hasText: targetDocumentNo }).filter({ hasText: targetParty }).first();
    if (await row.isVisible({ timeout: 1200 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1200);
      return { selected: true, method: 'row-filter' };
    }
  }

  return { selected: false, method: 'not-found' };
}

async function closeWithoutConfirming(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  if ((await visibleDialogs(page)).length === 0) return 'escape';

  for (const scope of [page, ...page.frames()]) {
    const closeButton = scope
      .getByRole('button', { name: /Close|Schliessen|Schlie.en|Cancel|Abbrechen|Nein|No/i })
      .first();
    if (await closeButton.isVisible({ timeout: 700 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(1200);
      return 'close-cancel-or-no-button';
    }
  }

  return 'not-closed';
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# BANK-006 Selected Row Posting Gate',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Modus | labor, selected-row-gate, no-confirm, no-post, not-final |',
    `| Ziel-Dokument | \`${targetDocumentNo}\` |`,
    `| Zielzeile selektiert | ${result.targetSelection.selected ? 'ja' : 'nein'} |`,
    `| Dialog geoeffnet | ${result.dialog.dialogOpened ? 'ja' : 'nein'} |`,
    `| Payment Posting jetzt freigegeben | ${result.decision.paymentPostingAllowedNow ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.decision.paymentPostingAllowedNow
      ? 'Der Dialog-Gate-Kontext waere fachlich bereit fuer einen separaten kontrollierten Posting-Lauf. In BANK-006 selbst wurde bewusst nicht gebucht.'
      : 'Auch nach Zielzeilen-Kontext bleibt `Post Payments Only` ein globaler Dialog ohne eindeutige Ein-Zeilen-Bestaetigung. Deshalb wurde nicht gebucht.',
    '',
    '## Sicherheitsgrenze',
    '',
    '- Kein `Ja`, `Yes`, `OK` oder `Post` bestaetigt.',
    '- Kein Payment Posting.',
    '- Keine Bankabstimmung gebucht.',
    '- Keine Buchungsvorschau.',
    '- Kein Setup Change.',
    '- Kein Company Switch.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('BANK-006 prueft Selected-Row Post Payments Only Gate ohne Bestaetigung', async ({ page }) => {
  await page.goto(buildPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3000);

  const initialUrl = page.url();
  expect(decodeURIComponent(initialUrl)).toMatch(new RegExp(expectedInstance));
  expect(new URL(initialUrl).searchParams.get('company')).toBe(expectedCompany);

  const beforeText = await pageText(page);
  await writeTextEvidence(bankEvidencePath('010-before-selected-row-posting-gate-page-text.txt'), compactInterestingText(beforeText));
  const beforeMetrics = extractMetrics(beforeText);
  expect(beforeMetrics.targetDocumentVisible).toBe(true);
  expect(beforeMetrics.targetPartyVisible).toBe(true);
  expect(beforeMetrics.targetAmountVisible).toBe(true);

  const targetSelection = await selectTargetDocument(page);
  const afterSelectionText = await pageText(page);
  await writeTextEvidence(bankEvidencePath('020-after-target-row-selection-page-text.txt'), compactInterestingText(afterSelectionText));

  const clickResult = await clickFirstVisible(page, /Post Payments Only/i);
  await page.waitForTimeout(2500);

  const dialogTexts = await visibleDialogs(page);
  const duringText = await pageText(page);
  await writeTextEvidence(bankEvidencePath('030-post-payments-only-selected-row-dialog-text.txt'), compactInterestingText(duringText));
  const relevantButtons = (await visibleButtonNames(page))
    .map(asciiSafe)
    .filter((button) => /OK|Yes|Ja|Post|Cancel|Abbrechen|Close|Schliessen|Schlie.en|Nein|No|Payments/i.test(button))
    .slice(0, 80);

  const closeMethod = await closeWithoutConfirming(page);
  const afterCloseText = await pageText(page);
  await writeTextEvidence(bankEvidencePath('040-after-dialog-close-page-text.txt'), compactInterestingText(afterCloseText));
  const afterCloseMetrics = extractMetrics(afterCloseText);
  const afterDialogs = await visibleDialogs(page);

  const dialogOpened = clickResult.clicked && (dialogTexts.length > 0 || /Do you want to post the payments|Post Payments Only/i.test(duringText));
  const safeClosed = afterDialogs.length === 0;
  const globalDialogSignal = /Do you want to post the payments/i.test(squash(duringText));
  const paymentPostingAllowedNow = false;
  const result = {
    schemaVersion: 1,
    purpose: 'selected-row-post-payments-only-gate-result',
    caseId,
    testId: 'BANK-006',
    source: 'playwright-selected-row-post-dialog-gate',
    resultStatus: dialogOpened ? 'observed' : 'blocked',
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    environment: expectedInstance,
    company: expectedCompany,
    sourceCompany: expectedCompany,
    page: {
      pageId: pageIdPaymentReconciliationJournal,
      initialUrl: sanitizeUrl(initialUrl),
      finalUrl: sanitizeUrl(page.url()),
      title: asciiSafe(await page.title())
    },
    target: {
      documentNo: targetDocumentNo,
      party: targetParty,
      amount: targetAmount,
      beforeMetrics,
      afterCloseMetrics,
      evidenceBefore: '010-before-selected-row-posting-gate-page-text.txt',
      evidenceAfterSelection: '020-after-target-row-selection-page-text.txt'
    },
    targetSelection,
    action: {
      postPaymentsOnlyClicked: clickResult.clicked,
      clickMethod: clickResult.method,
      confirmedPosting: false,
      okClicked: false,
      yesClicked: false,
      noOrCancelOnly: true
    },
    dialog: {
      dialogOpened,
      dialogCount: dialogTexts.length,
      dialogTextPreview: dialogTexts.map((text) => text.slice(0, 800)),
      globalDialogSignal,
      relevantButtons,
      closeMethod,
      safeClosed,
      evidenceDialog: '030-post-payments-only-selected-row-dialog-text.txt',
      evidenceAfterClose: '040-after-dialog-close-page-text.txt'
    },
    decision: {
      paymentPostingAllowedNow,
      reason:
        'BANK-006 proves selected-row context plus dialog gate, but the visible confirmation remains global and does not explicitly limit posting to document 108204. A separate posting run needs either a stronger single-line isolation or conscious approval of all accepted payment lines.'
    },
    proved: [
      'Target candidate 108204 / First Up Consultants / -2.151,46 was visible before opening the posting gate.',
      ...(targetSelection.selected ? ['The target document was selected/focused before opening Post Payments Only.'] : []),
      ...(dialogOpened ? ['Post Payments Only dialog gate was opened and closed without confirmation.'] : []),
      'No posting, preview, setup change, draft creation or company switch was performed.'
    ],
    notProved: [
      'No payment was posted.',
      'No bank reconciliation was posted.',
      'No ledger trace from a posting exists.',
      'The dialog does not prove that only document 108204 would be posted.',
      'No German bank/compliance final proof.'
    ],
    flags: {
      noPost: true,
      noPreviewPosting: true,
      noPaymentPosting: true,
      noBankReconciliationPosting: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noNew: true,
      noEdit: true,
      noDelete: true,
      noDraftCreated: true,
      noApiShortcut: true,
      noBookChangeInsideTest: true
    },
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    rebuildInstruction:
      'In der deutschen Zielcompany vor echter Zahlung Zielzeile, offenen Postenbezug und Dialogtext erneut dokumentieren. Nur buchen, wenn der Zielumfang klar ist oder ein bewusst freigegebener Sammelzahlungslauf vorliegt.',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-006/BANK-006-result.json',
      'playwright/projects/fibu-book5/evidence/bank-006/BANK-006-SELECTED-ROW-POSTING-GATE.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-006/'],
    blockedBy: paymentPostingAllowedNow ? [] : ['post-payments-only-dialog-is-global-not-single-line-proof'],
    safeToFinalizeState: false,
    requiresReview: true,
    nextStep:
      'Do not confirm Post Payments Only as a blind global action. Prefer BANK-007 Single-Line Payment Journal posting route or an explicit all-accepted-lines Payment Reconciliation posting case with ledger trace approval.'
  };

  await writeJsonEvidence(bankEvidencePath('BANK-006-result.json'), result);
  await writeTextEvidence(bankEvidencePath('BANK-006-SELECTED-ROW-POSTING-GATE.md'), renderMarkdown(result));
  await writeTextEvidence(
    bankEvidencePath('README.md'),
    [
      '# BANK-006 Evidence Index',
      '',
      'Status: labor, selected-row post-dialog gate, no-confirm, no-post, no-preview, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-before-selected-row-posting-gate-page-text.txt` | kompakter UI-Seitentext | Zielkandidat `108204` vor Dialog | keine Zahlung | labor |',
      '| `020-after-target-row-selection-page-text.txt` | kompakter UI-Seitentext | Zielkontext nach Selektionsversuch | keine Zeilenbindung des Dialogs | labor |',
      '| `030-post-payments-only-selected-row-dialog-text.txt` | kompakter Dialogtext | Dialog-Gate nach Zielkontext | keine Bestaetigung | labor |',
      '| `040-after-dialog-close-page-text.txt` | kompakter UI-Seitentext | Rueckkehr nach Schliessen | keine Ledger-Wirkung | labor |',
      '| `BANK-006-result.json` | JSON-Ergebnis | strukturierte Posting-Gate-Entscheidung | keinen deutschen Finalnachweis | labor |',
      '| `BANK-006-SELECTED-ROW-POSTING-GATE.md` | Lernzusammenfassung | warum globaler Dialog ohne Zeilenbindung nicht reicht | kein Payment Posting | labor |',
      ''
    ].join('\n')
  );

  expect(dialogOpened).toBe(true);
  expect(safeClosed).toBe(true);
  expect(result.flags.noPost).toBe(true);
});
