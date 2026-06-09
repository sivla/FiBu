import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(360_000);

const testId = 'payments-013';
const paymentDocumentNo = 'PAY011-PS103297';
const bankAccountNo = 'BANK-RM-01';

type ProbeTarget = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  screenshotFile: string;
  expectedContext: RegExp;
  purpose: string;
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
    /PAY011|PS-INV103297|BANK-RM-01|Bank Account Ledger|Bank Acc|Bankkonto|Bankposten|Ledger Entries|Document No\.|Document Type|Posting Date|Amount|Remaining|Closed|Open|Entry No\.|G\/L Entries|Customer Ledger|D10000|Business account|18200|Payment|Journal|Navigate|Find Entries/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -3; offset <= 8; offset += 1) {
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
      .slice(0, 220)
  ].join('\n'));
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

async function openFilteredPageAndCapture(page: Page, target: ProbeTarget) {
  await page.goto(filteredBcPageUrl(target.pageId, target.tableName, target.filterField, target.filterValue), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);

  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const contextVisible = target.expectedContext.test(text);
  const documentVisible = text.includes(paymentDocumentNo);
  const bankVisible = text.includes(bankAccountNo);
  const bankLedgerContextVisible = /Bank Account Ledger Entries|Bank Account Ledger Entry|Bankposten/i.test(text);
  const amountVisible = /68[.,]000|68000|67[.,]673|67673|326[.,]40|326,40/i.test(text);
  const relevantButtons = buttons.filter((button) => /Entry|Posten|Navigate|Find|Show|Open|Dimension|Ledger|Bank/i.test(button));
  const status = bankLedgerContextVisible && (documentVisible || bankVisible) ? 'labor' : 'rejected';

  await writeTextEvidence(paymentsEvidencePath(`${target.id}-page-text.txt`), compactPageText(text));
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status,
    purpose: target.purpose,
    knownLimitations: [
      'Read-only UI-Nachweis zur vorhandenen Laborzahlung; keine weitere Zahlung und keine Bankabstimmung.',
      'CRONUS-USA-Labor, kein deutscher Bank-/Compliance-Finalnachweis.',
      `Technischer UI-Pfad mit Page-ID ${target.pageId} und Filter ${target.filterField} = ${target.filterValue}; Buch-Klickpfad bleibt ueber Tell-Me oder Related Entries zu ergaenzen.`
    ],
    bookUse: status === 'labor' ? 'posting-trace' : 'do-not-use'
  });

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValue: target.filterValue,
    contextVisible,
    bankLedgerContextVisible,
    documentVisible,
    bankVisible,
    amountVisible,
    relevantButtons,
    status,
    screenshot: target.screenshotFile,
    textEvidenceFile: `${target.id}-page-text.txt`
  };
}

async function captureTellMe(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'Bank Account Ledger Entries');
  await page.waitForTimeout(2500);

  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const candidateVisible = /Bank Account Ledger Entries|Bank Account Ledger Entry|Bankposten/i.test(text);

  await writeTextEvidence(paymentsEvidencePath('010-tell-me-bank-account-ledger-page-text.txt'), compactPageText(text));
  await screenshot(page, 'payments-013-010-tell-me-bank-account-ledger.png', {
    projectName: project.name,
    testId,
    status: candidateVisible ? 'candidate' : 'rejected',
    purpose: 'PAYMENTS-013 Tell-Me-Suche fuer Bank Account Ledger Entries als Buch-Klickpfad-Kandidat.',
    knownLimitations: [
      'Nur Navigationsevidence; Suchtreffer wird in diesem Schritt nicht blind per Enter geoeffnet.',
      'Keine Zahlung, keine Bankabstimmung, kein Setup.'
    ],
    bookUse: 'navigation'
  });

  return {
    candidateVisible,
    buttons: buttons.filter((button) => /Bank|Ledger|Entry|Posten|Search|Suchen/i.test(button)),
    textEvidenceFile: '010-tell-me-bank-account-ledger-page-text.txt',
    screenshot: 'payments-013-010-tell-me-bank-account-ledger.png'
  };
}

function renderMarkdown(result: Record<string, any>) {
  const rows = result.probes
    .map(
      (probe: Record<string, any>) =>
        `| ${probe.id} | ${probe.status} | ${probe.bankLedgerContextVisible ? 'ja' : 'nein'} | ${probe.documentVisible ? 'ja' : 'nein'} | ${probe.bankVisible ? 'ja' : 'nein'} | ${probe.screenshot} |`
    )
    .join('\n');

  return [
    '# PAYMENTS-013 Bank Ledger Read-only',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Modus | read-only, no-posting, no-bank-reconciliation, no-setup-change |',
    `| Zahlungsbeleg | \`${paymentDocumentNo}\` |`,
    `| Bankkonto | \`${bankAccountNo}\` |`,
    '',
    '## Ergebnis',
    '',
    result.bankLedgerProofVisible
      ? 'Ein belastbarer Bank-Account-Ledger-UI-Nachweis wurde gefunden.'
      : 'Ein belastbarer Bank-Account-Ledger-UI-Nachweis wurde in diesem Lauf noch nicht gefunden.',
    '',
    '| Probe | Status | Bank-Ledger-Kontext | Zahlungsbeleg sichtbar | Bankkonto sichtbar | Screenshot |',
    '|---|---|---:|---:|---:|---|',
    rows,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Die G/L Entries aus `PAYMENTS-011` zeigen die Bankwirkung im Hauptbuch. Das ist aber nicht automatisch dasselbe wie ein sichtbarer Bankposten. Fuer das Buch muss ein Leser lernen, dass Business Central Bankwirkung, Debitorenausgleich und Bankabstimmung in unterschiedlichen Fenstern zeigt. Dieser Lauf klaert deshalb nur den UI-Pfad zu Bank Account Ledger Entries; er fuehrt keine Bankabstimmung aus.',
    '',
    '## Grenzen',
    '',
    '- Keine weitere Zahlung.',
    '- Keine Bankabstimmung.',
    '- Keine Setup- oder Stammdaten-Aenderung.',
    '- Kein deutscher Bank-/Compliance-Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('PAYMENTS-013 Bank Account Ledger Entries read-only klaeren', async ({ page }) => {
  const tellMe = await captureTellMe(page);

  const targets: ProbeTarget[] = [
    {
      id: '020-page-372-document-no',
      pageId: 372,
      tableName: 'Bank Account Ledger Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      screenshotFile: 'payments-013-020-page-372-document-no.png',
      expectedContext: /Bank Account Ledger Entries|Bank Account Ledger Entry|Bankposten/i,
      purpose: `PAYMENTS-013 Page 372 mit Document No. ${paymentDocumentNo} pruefen.`
    },
    {
      id: '030-page-372-bank-account-no',
      pageId: 372,
      tableName: 'Bank Account Ledger Entry',
      filterField: 'Bank Account No.',
      filterValue: bankAccountNo,
      screenshotFile: 'payments-013-030-page-372-bank-account-no.png',
      expectedContext: /Bank Account Ledger Entries|Bank Account Ledger Entry|Bankposten/i,
      purpose: `PAYMENTS-013 Page 372 mit Bank Account No. ${bankAccountNo} pruefen.`
    },
    {
      id: '040-page-371-document-no-legacy',
      pageId: 371,
      tableName: 'Bank Account Ledger Entry',
      filterField: 'Document No.',
      filterValue: paymentDocumentNo,
      screenshotFile: 'payments-013-040-page-371-document-no-legacy.png',
      expectedContext: /Bank Account Ledger Entries|Bank Account Ledger Entry|Bankposten/i,
      purpose: 'PAYMENTS-013 alten Page-371-Pfad kontrolliert als Vergleich pruefen.'
    }
  ];

  const probes = [];
  for (const target of targets) probes.push(await openFilteredPageAndCapture(page, target));

  const positiveProbes = probes.filter((probe) => probe.status === 'labor');
  const result = {
    testId: 'PAYMENTS-013',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-bank-ledger-path',
    sourceEvidence: 'payments-011/payments-012',
    postedInThisRun: false,
    setupChanged: false,
    bankReconciliationDone: false,
    paymentDocumentNo,
    bankAccountNo,
    tellMe,
    probes,
    bankLedgerProofVisible: positiveProbes.length > 0,
    bestProbe: positiveProbes[0]?.id ?? null,
    proves:
      positiveProbes.length > 0
        ? ['Bank Account Ledger Entries sind fuer die vorhandene Laborzahlung oder das Bankkonto ueber einen UI-Pfad sichtbar.']
        : ['Page 372 und Page 371 wurden read-only geprueft; der Bank-Ledger-Nachweis bleibt offen.'],
    doesNotProve: [
      'Keine Bankabstimmung.',
      'Keine weitere Zahlung.',
      'Keine Kreditorenzahlung.',
      'Kein deutscher Bank-/Compliance-Finalnachweis.'
    ],
    nextStep:
      positiveProbes.length > 0
        ? 'PAYMENTS-014-BANK-LEDGER-BOOK-SYNC: Kapitel 20 und Evidence-Pack mit dem Bank-Account-Ledger-UI-Pfad synchronisieren; keine Bankabstimmung.'
        : 'PAYMENTS-014-BANK-LEDGER-ALTERNATIVE-PATH: Related Entries/Find Entries von PAY011-PS103297 oder BANK-RM-01 read-only pruefen; keine Zahlung und keine Bankabstimmung.'
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-013-result.json'), result);
  await writeTextEvidence(paymentsEvidencePath('PAYMENTS-013-BANK-LEDGER-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    paymentsEvidencePath('README.md'),
    [
      '# PAYMENTS-013 Evidence Index',
      '',
      'Status: read-only, no-posting, no-bank-reconciliation, no-setup-change, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `PAYMENTS-013-result.json` | JSON-Ergebnis | strukturierter Befund zu Tell-Me, Page 372 und Page 371 fuer Bank Account Ledger Entries | keine Bankabstimmung und keine neue Zahlung | read-only |',
      '| `PAYMENTS-013-BANK-LEDGER-READONLY.md` | Lernzusammenfassung | warum Bankposten, Debitorenausgleich und Sachposten verschiedene Nachweisschichten sind | keinen deutschen Finalnachweis | labor, read-only |',
      '| `010-*` | Tell-Me-Evidence | ob Bank Account Ledger Entries als Buch-Klickpfad-Kandidat sichtbar sind | keinen geoeffneten Bankposten | navigation-evidence |',
      '| `020-*` bis `040-*` | gefilterte UI-Proben | ob Page 372 oder Page 371 Bank Account Ledger Entries zur Zahlung oder Bank zeigt | keine Bankabstimmung | mixed |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit | mixed |',
      ''
    ].join('\n')
  );

  expect(probes.length).toBe(targets.length);
});
