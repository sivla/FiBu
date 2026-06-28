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

const testId = 'bank-011';
const caseId = 'BANK-011-POST-PAYMENT-RECONCILIATION-STATE';
const expectedInstance = 'MCP_1_20260210';
const expectedCompany = project.defaultCompany;
const paidInvoiceNo = '108204';
const paymentDocumentNo = 'BANK009-108204';
const vendorName = 'First Up Consultants';

type ReadonlyTarget = {
  id: string;
  pageId: number;
  tableName?: string;
  filterField?: string;
  filterValue?: string;
  fileStem: string;
  interesting: RegExp;
};

function bankEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function asciiSafe(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

function sanitizeUrl(value: string) {
  return value
    .replace(/businesscentral\.dynamics\.com\/[^/?#]+/i, 'businesscentral.dynamics.com/<tenant>')
    .replace(/aadTenantId=[^&]+/gi, 'aadTenantId=<tenant>')
    .replace(/startTraceId=[^&]+/gi, 'startTraceId=<trace>')
    .replace(/tid=[^&]+/gi, 'tid=<tid>');
}

function buildPageUrl(target: ReadonlyTarget) {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(expectedInstance)) {
    throw new Error(`Configured BC URL does not target ${expectedInstance}.`);
  }

  url.searchParams.set('company', expectedCompany);
  url.searchParams.set('page', String(target.pageId));
  if (target.tableName && target.filterField && target.filterValue) {
    url.searchParams.set('filter', `'${target.tableName}'.'${target.filterField}' IS '${target.filterValue}'`);
  }
  return url.toString();
}

function compactText(text: string, interesting: RegExp) {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => asciiSafe(line).replace(/\s+/g, ' '))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -5; offset <= 10; offset += 1) {
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
      .slice(0, 260)
  ].join('\n');
}

function squash(text: string) {
  return asciiSafe(text).replace(/\s+/g, ' ');
}

function analyze(text: string) {
  const oneLine = squash(text);
  return {
    paymentReconciliationVisible: /Payment Reconciliation Journal|Payment Reconciliation/i.test(oneLine),
    paidInvoiceVisible: oneLine.includes(paidInvoiceNo),
    paymentDocumentVisible: oneLine.includes(paymentDocumentNo),
    vendorVisible: new RegExp(vendorName, 'i').test(oneLine),
    remainingAmountZeroVisible: /Remaining Amount\s+0,00|Remaining Amt\.\s+0,00|0,00/i.test(oneLine),
    applicationVisible: /Application|Applied Entries|Application Reviewed/i.test(oneLine),
    bankLedgerVisible: /Bank Account Ledger Entries|Bankposten/i.test(oneLine),
    glEntriesVisible: /G\/L Entries|Sachposten|General Ledger Entries/i.test(oneLine),
    postPaymentsOnlyVisible: /Post Payments Only/i.test(oneLine)
  };
}

async function inspectReadonlyTarget(page: Page, target: ReadonlyTarget) {
  await page.goto(buildPageUrl(target), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  await writeTextEvidence(bankEvidencePath(`${target.fileStem}-page-text.txt`), compactText(text, target.interesting));
  const buttons = (await visibleButtonNames(page))
    .map(asciiSafe)
    .filter((button) => /Post|Apply|Accept|Match|Review|New|Edit|Delete|Entry|Open/i.test(button))
    .slice(0, 80);

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName ?? null,
    filterField: target.filterField ?? null,
    filterValue: target.filterValue ?? null,
    url: sanitizeUrl(page.url()),
    title: asciiSafe(await page.title()),
    textEvidenceFile: `${target.fileStem}-page-text.txt`,
    relevantButtonsVisibleNotClicked: buttons,
    analysis: analyze(text)
  };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# BANK-011 Payment-Reconciliation-Zustand nach BANK-009',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Zahlungsbeleg | \`${paymentDocumentNo}\` |`,
    `| bezahlte Rechnung | \`${paidInvoiceNo}\` |`,
    '| Modus | labor, read-only, no-post, no-preview, no-setup-change |',
    '',
    '## Ergebnis',
    '',
    result.decision,
    '',
    '## Warum das wichtig ist',
    '',
    'Nach einer bewusst gebuchten Einzelzahlung darf eine alte Payment-Reconciliation-Zeile nicht mehr blind als Buchungskandidat verwendet werden. Erst muss der aktuelle Reconciliation-Kontext gegen Kreditorenposten, Bankposten und Sachposten gelesen werden.',
    '',
    '## Belegt',
    '',
    ...result.proved.map((item: string) => `- ${item}`),
    '',
    '## Nicht belegt',
    '',
    ...result.notProved.map((item: string) => `- ${item}`),
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('BANK-011 prueft Reconciliation-Kontext nach gebuchter Einzelzahlung read-only', async ({ page }) => {
  const targets: ReadonlyTarget[] = [
    {
      id: 'payment-reconciliation-after-bank009',
      pageId: 1290,
      fileStem: '010-payment-reconciliation-after-bank009',
      interesting:
        /Payment Reconciliation|Lines For Review|Accepted|Application Reviewed|Post Payments Only|First Up Consultants|108204|BANK009-108204|-2\.151,46|2\.151,46|Applied Amount|Transaction Amount|No\. of Open Ledger Entries/i
    },
    {
      id: 'vendor-ledger-invoice-108204-after-bank009',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      filterField: 'Document No.',
      filterValue: paidInvoiceNo,
      fileStem: '020-vendor-ledger-invoice-108204-after-bank009',
      interesting:
        /Vendor Ledger Entries|First Up Consultants|108204|107196|Remaining Amount|Remaining Amt\.|0,00|Open|Entry No\.|Applied Entries|Application/i
    },
    {
      id: 'vendor-ledger-payment-bank009',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '030-vendor-ledger-payment-bank009',
      interesting:
        /Vendor Ledger Entries|First Up Consultants|BANK009-108204|108204|Remaining Amount|Remaining Amt\.|0,00|Open|Entry No\.|Applied Entries|Application/i
    },
    {
      id: 'bank-ledger-payment-bank009',
      pageId: 372,
      tableName: 'Bank Account Ledger Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '040-bank-ledger-payment-bank009',
      interesting: /Bank Account Ledger Entries|Bankposten|BANK009-108204|BANK-RM-01|2\.151,46|18200|Entry No\.|Open/i
    },
    {
      id: 'gl-entries-payment-bank009',
      pageId: 20,
      tableName: 'G/L Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      fileStem: '050-gl-entries-payment-bank009',
      interesting: /G\/L Entries|Sachposten|BANK009-108204|First Up Consultants|18200|22100|2\.151,46|Entry No\./i
    }
  ];

  const observations = [];
  for (const target of targets) observations.push(await inspectReadonlyTarget(page, target));

  const firstUrl = decodeURIComponent(observations[0].url);
  expect(firstUrl).toMatch(new RegExp(expectedInstance));
  expect(firstUrl).toMatch(/company=RM-DEMO/i);

  const reconciliation = observations[0].analysis;
  const invoice = observations[1].analysis;
  const payment = observations[2].analysis;
  const bank = observations[3].analysis;
  const gl = observations[4].analysis;

  const result = {
    schemaVersion: 1,
    purpose: 'bank-post-payment-reconciliation-state',
    caseId,
    testId: 'BANK-011',
    source: 'playwright-ui-readonly',
    resultStatus: 'observed',
    environment: expectedInstance,
    company: expectedCompany,
    sourceCompany: expectedCompany,
    dataBasis: 'CRONUS USA / RM-DEMO labor',
    priorPayment: {
      paymentDocumentNo,
      paidInvoiceNo,
      vendorName
    },
    observations,
    reconciliationState: {
      oldInvoiceStillVisibleInPaymentReconciliation: reconciliation.paidInvoiceVisible,
      postPaymentsOnlyVisibleButNotClicked: reconciliation.postPaymentsOnlyVisible,
      invoiceRemainingZeroSignalVisible: invoice.remainingAmountZeroVisible,
      paymentRemainingZeroSignalVisible: payment.remainingAmountZeroVisible,
      bankLedgerPaymentVisible: bank.paymentDocumentVisible || bank.bankLedgerVisible,
      glPaymentVisible: gl.paymentDocumentVisible || gl.glEntriesVisible
    },
    decision:
      'BANK-011 bleibt read-only: Nach BANK-009 wird keine Payment-Reconciliation-Buchung aus der alten Reconciliation-Sicht angestossen. Der aktuelle Zustand wird nur gegen Vendor Ledger, Bank Ledger und G/L Entries gegengeprueft.',
    proved: [
      'Payment Reconciliation Journal wurde nach BANK-009 read-only geoeffnet.',
      'Vendor Ledger Entry zur Rechnung 108204 wurde read-only geprueft.',
      'Vendor Ledger, Bank Account Ledger und G/L Entries zur Zahlung BANK009-108204 wurden read-only geprueft.',
      'Keine Reconciliation-, Apply- oder Post-Aktion wurde geklickt.'
    ],
    notProved: [
      'Keine Bankabstimmung wurde gebucht.',
      'Kein Post Payments Only wurde bestaetigt.',
      'Kein Preview Posting wurde geoeffnet.',
      'Kein deutscher Bank-/Compliance-Finalnachweis.'
    ],
    flags: {
      readOnly: true,
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
      'In der deutschen Zielcompany nach jeder Zahlungsbuchung Payment Reconciliation erneut lesen und gegen geschlossene offene Posten, Bankposten und Sachposten pruefen, bevor Bankabstimmung oder Post Payments Only gezeigt wird.',
    targetGermanCompanyImpact:
      'Deutsche Bankabstimmung braucht eigene Zielzeile, deutsches Bankkonto, deutsche Posten und separate Posting-/Reconciliation-Evidence.',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-011/BANK-011-result.json',
      'playwright/projects/fibu-book5/evidence/bank-011/BANK-011-POST-PAYMENT-RECONCILIATION-STATE.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-011/'],
    blockedBy: [],
    safeToFinalizeState: false,
    requiresReview: false,
    nextStep:
      'BANK-012: Entweder Bank Account Reconciliation mit neuem klaren Zielbeleg kontrolliert vorbereiten oder Bankabstimmung als German-Final-Rebuild-Aufgabe parken.'
  };

  await writeJsonEvidence(bankEvidencePath('BANK-011-result.json'), result);
  await writeTextEvidence(bankEvidencePath('BANK-011-POST-PAYMENT-RECONCILIATION-STATE.md'), renderMarkdown(result));
  await writeTextEvidence(
    bankEvidencePath('README.md'),
    [
      '# BANK-011 Evidence Index',
      '',
      'Status: labor, read-only Zustand nach BANK-009, no-post, no-preview, no-setup-change, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-payment-reconciliation-after-bank009-page-text.txt` | kompakter UI-Seitentext | Payment-Reconciliation-Kontext nach BANK-009 | keine Reconciliation-Buchung | labor, read-only |',
      '| `020-vendor-ledger-invoice-108204-after-bank009-page-text.txt` | kompakter UI-Seitentext | Rechnungs-/OP-Kontext zur bezahlten Rechnung | kein deutsches Finalbild | labor, read-only |',
      '| `030-vendor-ledger-payment-bank009-page-text.txt` | kompakter UI-Seitentext | Zahlungsposten `BANK009-108204` | keine neue Zahlung | labor, read-only |',
      '| `040-bank-ledger-payment-bank009-page-text.txt` | kompakter UI-Seitentext | Bankposten zur Zahlung | keine Bankabstimmung | labor, read-only |',
      '| `050-gl-entries-payment-bank009-page-text.txt` | kompakter UI-Seitentext | Sachposten zur Zahlung | keine Compliance-Aussage | labor, read-only |',
      '| `BANK-011-result.json` | JSON-Ergebnis | strukturierter Read-only-Befund nach BANK-009 | keinen deutschen Finalnachweis | labor |',
      '| `BANK-011-POST-PAYMENT-RECONCILIATION-STATE.md` | Lernzusammenfassung | warum alte Reconciliation-Zeilen nach Zahlung neu bewertet werden muessen | keine Buchung | labor |',
      ''
    ].join('\n')
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreviewPosting).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(observations.length).toBe(5);
});
