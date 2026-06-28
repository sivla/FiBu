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

const testId = 'bank-002';
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

function compactText(text: string) {
  const interesting =
    /Payment Reconciliation Journal|One or more lines|Review applications|Accept Applications|Apply Automatically|Post Payments Only|Match Confidence|Lines For Review|Lines With differences|Total Transaction Amount|Balance After Posting|Statement Ending Balance|Document No\.|Account Type|Account No\.|Difference|Applied Amount|Transaction Amount|First Up Consultants|Wide World Importers/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => asciiSafe(line))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -3; offset <= 8; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }

  return [
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 220)
  ].join('\n');
}

function extractMetrics(text: string) {
  const normalized = text.replace(/\s+/g, ' ');
  const linesForReview = normalized.match(/Lines For Review\s+(\d+)/i)?.[1] ?? null;
  const linesWithDifferences = normalized.match(/Lines With differences\s+(\d+)/i)?.[1] ?? null;
  const totalTransactionAmount = normalized.match(/Total Transaction Amount\s+([0-9.,-]+)/i)?.[1] ?? null;
  const balanceAfterPosting = normalized.match(/Balance After Posting\s+([0-9.,-]+)/i)?.[1] ?? null;

  return {
    linesForReview,
    linesWithDifferences,
    totalTransactionAmount,
    balanceAfterPosting,
    hasAcceptApplications: /Accept Applications/i.test(text),
    hasPostPaymentsOnly: /Post Payments Only/i.test(text),
    hasReviewApplications: /Review applications/i.test(text),
    hasMatchConfidence: /Match Confidence/i.test(text)
  };
}

async function readDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"], .ms-Dialog-main');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = asciiSafe(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
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

async function revealAcceptApplications(page: Page) {
  if (/Accept Applications/i.test(await pageText(page))) return 'already-visible';
  for (const label of [/Manual Application/i, /^Start$/i, /^Line$/i, /Weitere Optionen|More options/i]) {
    const clicked = await clickAction(page, label);
    if (clicked.clicked && /Accept Applications/i.test(await pageText(page))) return `after-${clicked.method}`;
  }
  return 'not-visible';
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# BANK-002 Payment Reconciliation Accept Applications',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, controlled-apply-attempt, no-post, no-preview, not-final |',
    `| Aktion versucht | ${result.action.acceptApplicationsClicked ? 'Accept Applications' : 'nicht ausgefuehrt'} |`,
    '',
    '## Ergebnis',
    '',
    result.action.acceptApplicationsClicked
      ? '`Accept Applications` wurde im Payment Reconciliation Journal kontrolliert angeklickt. `Post Payments Only` wurde nicht angeklickt.'
      : '`Accept Applications` konnte nicht sicher angeklickt werden.',
    '',
    '## Vorher / Nachher',
    '',
    '| Kennzahl | Vorher | Nachher |',
    '|---|---:|---:|',
    `| Lines For Review | ${result.before.metrics.linesForReview ?? ''} | ${result.after.metrics.linesForReview ?? ''} |`,
    `| Lines With differences | ${result.before.metrics.linesWithDifferences ?? ''} | ${result.after.metrics.linesWithDifferences ?? ''} |`,
    `| Balance After Posting | ${result.before.metrics.balanceAfterPosting ?? ''} | ${result.after.metrics.balanceAfterPosting ?? ''} |`,
    '',
    '## Sicherheitsgrenze',
    '',
    '- Kein `Post Payments Only`.',
    '- Kein Preview Posting.',
    '- Kein Bankabstimmungs-Post.',
    '- Kein Company Switch.',
    '- Keine API-Abkuerzung.',
    '- Keine Buchaenderung.',
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

test('BANK-002 versucht Accept Applications ohne Post Payments Only', async ({ page }) => {
  await page.goto(buildPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);

  const initialUrl = page.url();
  expect(initialUrl).toMatch(/MCP_1_20260210/i);
  expect(new URL(initialUrl).searchParams.get('company')).toBe(expectedCompany);

  const beforeText = await pageText(page);
  await writeTextEvidence(evidenceFile('010-before-accept-applications-page-text.txt'), compactText(beforeText));
  const beforeMetrics = extractMetrics(beforeText);
  const beforeButtons = (await visibleButtonNames(page)).map(asciiSafe);

  const revealMethod = await revealAcceptApplications(page);
  const acceptClick = /Accept Applications/i.test(await pageText(page))
    ? await clickAction(page, /Accept Applications/i)
    : { clicked: false, method: 'not-visible' };
  await page.waitForTimeout(4500);

  const dialogsAfterClick = await readDialogs(page);
  const dangerousPostDialog = dialogsAfterClick.some((dialog) => /Post Payments Only|Post|Buchen|Yes|Ja/i.test(dialog));
  if (dangerousPostDialog) {
    throw new Error(`Unexpected dangerous dialog after Accept Applications attempt: ${dialogsAfterClick.join(' | ')}`);
  }

  const afterText = await pageText(page);
  await writeTextEvidence(evidenceFile('020-after-accept-applications-page-text.txt'), compactText(afterText));
  const afterMetrics = extractMetrics(afterText);
  const afterButtons = (await visibleButtonNames(page)).map(asciiSafe);
  const postPaymentsClicked = false;

  const resultStatus = acceptClick.clicked ? 'observed' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'payment-reconciliation-accept-applications-result',
    caseId: 'BANK-002-CONTROLLED-RECONCILIATION-DRAFT-PREFLIGHT',
    testId: 'BANK-002',
    source: 'playwright-controlled-ui-action',
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
      relevantButtons: beforeButtons.filter((button) => /Accept|Apply|Post|Review|Match|Payment|Import/i.test(button)).slice(0, 50),
      evidenceFile: '010-before-accept-applications-page-text.txt'
    },
    action: {
      revealMethod,
      acceptApplicationsClicked: acceptClick.clicked,
      acceptApplicationsClickMethod: acceptClick.method,
      dialogsAfterClick,
      postPaymentsOnlyClicked: postPaymentsClicked
    },
    after: {
      metrics: afterMetrics,
      relevantButtons: afterButtons.filter((button) => /Accept|Apply|Post|Review|Match|Payment|Import/i.test(button)).slice(0, 50),
      evidenceFile: '020-after-accept-applications-page-text.txt'
    },
    proved: acceptClick.clicked
      ? ['Payment Reconciliation Journal action Accept Applications was attempted through the UI without clicking Post Payments Only.']
      : ['Payment Reconciliation Journal opened, but Accept Applications was not safely clickable.'],
    notProved: [
      'No payment was posted.',
      'No bank reconciliation was posted.',
      'No Preview Posting was run.',
      'No German bank/compliance final proof.'
    ],
    safety: {
      noPostPaymentsOnly: true,
      noPost: true,
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
      'In der deutschen Zielcompany Payment Reconciliation Journal mit deutschem Bankkonto und echten Zielbelegen neu aufbauen. Erst Anwendungen akzeptieren/matchen, dann vor jedem Post/Payment-Post die Ledger- und Bankwirkung planen und fotografisch belegen.',
    targetGermanCompanyImpact:
      'Deutsche Zielcompany braucht Bankkonto, Bank Account Posting Group, offene Posten, Payment Reconciliation Journal und Bank-/G/L-/Detailed Ledger Trace neu.',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-002/BANK-002-result.json',
      'playwright/projects/fibu-book5/evidence/bank-002/BANK-002-PAYMENT-RECONCILIATION-ACCEPT-APPLICATIONS.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-002/'],
    blockedBy: acceptClick.clicked ? [] : ['accept-applications-not-clickable'],
    safeToFinalizeState: false,
    requiresReview: !acceptClick.clicked,
    nextStep: acceptClick.clicked
      ? 'BANK-003: Post Payments Only nur mit expliziter Posting-/Ledger-Trace-Fachpruefung versuchen; alternativ Bank Account Reconciliation Page 379 Match/Apply tiefer pruefen.'
      : 'BANK-003: Action-Inventory/Focused menu route fuer Accept Applications oder Bank Account Reconciliation Match pruefen.'
  };

  await writeJsonEvidence(evidenceFile('BANK-002-result.json'), result);
  await writeTextEvidence(evidenceFile('BANK-002-PAYMENT-RECONCILIATION-ACCEPT-APPLICATIONS.md'), renderMarkdown(result));
  await writeTextEvidence(
    evidenceFile('README.md'),
    [
      '# BANK-002 Evidence Index',
      '',
      'Status: labor, controlled apply/match attempt, no-post, no-preview, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-before-accept-applications-page-text.txt` | kompakter Seitentext | Payment Reconciliation Journal vor Aktion | keinen Post | labor |',
      '| `020-after-accept-applications-page-text.txt` | kompakter Seitentext | Payment Reconciliation Journal nach Aktion | keinen Payment-Post | labor |',
      '| `BANK-002-result.json` | JSON-Ergebnis | strukturierter Aktionsbefund und Safety-Flags | keine Bankbuchung | labor |',
      '| `BANK-002-PAYMENT-RECONCILIATION-ACCEPT-APPLICATIONS.md` | Lernzusammenfassung | was Accept Applications im Labor belegt und was nicht | keinen deutschen Finalnachweis | labor |',
      ''
    ].join('\n')
  );

  expect(resultStatus).toBe('observed');
});
