import { expect, test } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, pageText, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

const testId = 'payments-003';
const targetBank = {
  number: 'BANK-RM-01',
  displayName: 'Hausbank Rhein-Main',
  purpose: 'Laborbankkonto fuer Zahlungseingang, OP-Ausgleich und spaetere Bankabstimmung'
};

type ApiResponse = {
  ok: boolean;
  status: number;
  bankAccount?: {
    number?: string;
    displayName?: string;
    bankAccountNumber?: string;
    blocked?: boolean;
    currencyCode?: string;
  };
};

type BankAccountRecord = {
  id?: string;
  number?: string;
  displayName?: string;
  bankAccountNumber?: string;
  generalLedgerAccountNumber?: string;
  bankAccountPostingGroup?: string;
};

function paymentsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

async function runBankAccountFitApi(page: import('@playwright/test').Page) {
  return page.evaluate(
    async ({ companyName, targetBank }) => {
      const token = document.documentElement.innerHTML.match(/"accessToken":"([^"]+)/)?.[1];
      if (!token) {
        throw new Error('BC accessToken im Webclient nicht gefunden.');
      }

      const [tenant, environment] = location.pathname.split('/').filter(Boolean);
      const root = `https://api.businesscentral.dynamics.com/v2.0/${tenant}/${environment}/api/v2.0`;
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
      const companiesResponse = await fetch(`${root}/companies`, { headers });
      const companies = await companiesResponse.json();
      const company = companies.value.find((entry: { name: string }) => entry.name === companyName);
      if (!company) {
        throw new Error(`Company ${companyName} nicht gefunden.`);
      }

      const endpoint = `${root}/companies(${company.id})/bankAccounts`;
      const beforeResponse = await fetch(endpoint, { headers });
      const beforeText = await beforeResponse.text();
      const before = beforeResponse.ok ? JSON.parse(beforeText).value ?? [] : [];
      const existing = before.find((entry: BankAccountRecord) => entry.number === targetBank.number);

      let createResponseResult: ApiResponse | null = null;
      let action: 'already-exists' | 'created' | 'api-create-rejected' = 'already-exists';

      if (!existing) {
        const createResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: targetBank.number,
            displayName: targetBank.displayName
          })
        });
        const createText = await createResponse.text();
        let createJson: unknown = undefined;
        try {
          createJson = createText ? JSON.parse(createText) : undefined;
        } catch {
          createJson = undefined;
        }
        createResponseResult = {
          ok: createResponse.ok,
          status: createResponse.status,
          bankAccount:
            createJson && typeof createJson === 'object'
              ? {
                  number: (createJson as BankAccountRecord).number,
                  displayName: (createJson as BankAccountRecord).displayName,
                  bankAccountNumber: (createJson as BankAccountRecord).bankAccountNumber,
                  blocked: (createJson as { blocked?: boolean }).blocked,
                  currencyCode: (createJson as { currencyCode?: string }).currencyCode
                }
              : undefined
        };
        action = createResponse.ok ? 'created' : 'api-create-rejected';
      }

      const afterResponse = await fetch(endpoint, { headers });
      const afterText = await afterResponse.text();
      const after = afterResponse.ok ? JSON.parse(afterText).value ?? [] : [];
      const targetAfterRaw = after.find((entry: BankAccountRecord) => entry.number === targetBank.number) ?? null;
      const targetAfter = targetAfterRaw
        ? {
            number: targetAfterRaw.number,
            displayName: targetAfterRaw.displayName,
            bankAccountNumber: targetAfterRaw.bankAccountNumber,
            generalLedgerAccountNumber: targetAfterRaw.generalLedgerAccountNumber,
            bankAccountPostingGroup: targetAfterRaw.bankAccountPostingGroup,
            currencyCode: (targetAfterRaw as { currencyCode?: string }).currencyCode,
            blocked: (targetAfterRaw as { blocked?: boolean }).blocked
          }
        : null;

      return {
        endpoint: 'api/v2.0/.../bankAccounts',
        beforeResponse: { ok: beforeResponse.ok, status: beforeResponse.status },
        afterResponse: { ok: afterResponse.ok, status: afterResponse.status },
        before: before.map((entry: BankAccountRecord) => ({
          number: entry.number,
          displayName: entry.displayName,
          generalLedgerAccountNumber: entry.generalLedgerAccountNumber,
          bankAccountPostingGroup: entry.bankAccountPostingGroup
        })),
        after: after.map((entry: BankAccountRecord) => ({
          number: entry.number,
          displayName: entry.displayName,
          generalLedgerAccountNumber: entry.generalLedgerAccountNumber,
          bankAccountPostingGroup: entry.bankAccountPostingGroup
        })),
        action,
        createResponse: createResponseResult,
        targetAfter
      };
    },
    { companyName: project.defaultCompany, targetBank }
  );
}

test('PAYMENTS-003 Bankkonto BANK-RM-01 idempotent fitten oder Setup-Grenze dokumentieren', async ({ page }) => {
  test.setTimeout(240_000);

  await page.goto(bcPageUrl(371, project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(3000);

  const fitResult = await runBankAccountFitApi(page);

  await page.goto(bcPageUrl(371, project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(4000);
  const uiText = await pageText(page);
  const targetVisibleInUi = /BANK-RM-01/i.test(uiText);

  await screenshot(page, 'payments-003-010-bank-accounts-bank-rm-01-fit.png', {
    projectName: project.name,
    testId,
    status: fitResult.targetAfter ? 'labor' : 'rejected',
    bookUse: fitResult.targetAfter ? 'field-proof' : 'do-not-use',
    purpose:
      'PAYMENTS-003 Bank Accounts nach idempotentem Bankkonto-Fit pruefen; keine Zahlung, kein Ausgleich, keine Bankabstimmung.',
    expectedPageText: fitResult.targetAfter ? [/BANK-RM-01/i] : [/Bank Accounts|Bank Account/i],
    knownLimitations: [
      'CRONUS-USA-Labor, kein deutscher Bank-/Compliance-Finalnachweis.',
      'Dieser Lauf legt keine Zahlungsjournalzeile an und bucht nichts.',
      'Bank Account Posting Group, Gegenkonto, Zahlungsausgleich und Bankabstimmung bleiben Folgepruefung.'
    ]
  });

  const result = {
    testId: 'PAYMENTS-003',
    environment: {
      sandbox: 'MCP_1_20260210',
      company: project.defaultCompany,
      baseData: 'CRONUS USA',
      uiLanguage: 'mixed German/English'
    },
    mode: 'idempotent-bank-account-fit-no-payment-no-application',
    targetBank,
    api: fitResult,
    ui: {
      bankAccountsPageOpened: /Bank Accounts|Bank Account/i.test(uiText),
      targetVisibleInUi
    },
    safety: {
      paymentPosted: false,
      applicationPosted: false,
      journalLineCreated: false,
      bankReconciliationOpened: false
    },
    paymentReadiness: {
      bankAccountExists: Boolean(fitResult.targetAfter),
      readyForPaymentPosting: false,
      reason:
        'Bankkonto-Fit ist nur ein Stammdaten-Schritt. Vor Zahlung muessen Zahlungsjournalzeile, Gegenkonto, Betrag, Ausgleichsbezug und Preflight getrennt geprueft werden.'
    },
    limitations: [
      'Kein deutscher Bank-/Compliance-Finalnachweis.',
      'Keine Zahlung, kein Ausgleich, keine Bankabstimmung.',
      'Bank Account Posting Group und Bank-Sachkonto sind noch nicht als Zahlungsfit nachgewiesen.'
    ],
    nextStep: fitResult.targetAfter
      ? 'PAYMENTS-004 als kontrollierte, nicht buchende Zahlungsjournal-Readiness-Zeile planen; weiterhin keine Zahlung buchen.'
      : 'PAYMENTS-003-Blocker analysieren: API/UI-Pflichtfelder fuer Bank Account Card und Bank Account Posting Group klaeren; weiterhin keine Zahlung buchen.'
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-003-result.json'), result);

  await writeTextEvidence(
    paymentsEvidencePath('PAYMENTS-003-BANK-ACCOUNT-FIT.md'),
    [
      '# PAYMENTS-003 Bankkonto-Fit',
      '',
      '| Feld | Wert |',
      '|---|---|',
      '| Umgebung | `MCP_1_20260210` |',
      `| Company | \`${project.defaultCompany}\` |`,
      '| Status | labor, setup-proof, no-payment, no-application |',
      '| Zielbankkonto | `BANK-RM-01` / `Hausbank Rhein-Main` |',
      `| Aktion | ${fitResult.action} |`,
      `| Bankkonto nach Lauf vorhanden | ${fitResult.targetAfter ? 'ja' : 'nein'} |`,
      `| In Bank-Accounts-UI sichtbar | ${targetVisibleInUi ? 'ja' : 'nein'} |`,
      '',
      '## Ergebnis',
      '',
      fitResult.targetAfter
        ? '`BANK-RM-01` ist als CRONUS-USA-Laborbankkonto vorhanden und in der Bankkontenliste sichtbar. Damit ist der vorherige harte Bankkonto-Blocker fuer den naechsten Payments-Schritt geloest.'
        : '`BANK-RM-01` konnte in diesem Lauf nicht erzeugt werden. Der Payments-Block bleibt vor einer Zahlungsbuchung gesperrt.',
      '',
      '## Anfaenger-Lernwert',
      '',
      'Ein Bankkonto in Business Central ist mehr als ein sichtbarer Name. Es ist der Stammdatensatz, ueber den Zahlungsjournale und Bankabstimmung spaeter laufen. Dass ein Zahlungsjournal sichtbar ist, reicht nicht: Das Gegenkonto muss fachlich existieren und spaeter mit Bankkontobuchungsgruppe, Betrag und Ausgleichsbezug geprueft werden.',
      '',
      '## Was dieser Lauf nicht beweist',
      '',
      '- Keine Zahlung.',
      '- Kein OP-Ausgleich.',
      '- Keine Bankabstimmung.',
      '- Kein deutscher Bank-/Compliance-Finalnachweis.',
      '- Noch kein Nachweis, dass `BANK-RM-01` fuer eine konkrete Zahlungsjournalbuchung vollstaendig eingerichtet ist.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  await writeTextEvidence(
    paymentsEvidencePath('README.md'),
    [
      '# PAYMENTS-003 Evidence Index',
      '',
      'Status: CRONUS-USA-Labor, idempotenter Bankkonto-Fit, keine Zahlung, kein Ausgleich, keine Bankabstimmung.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `PAYMENTS-003-result.json` | JSON-Ergebnis | API-/UI-Befund zu `BANK-RM-01` | keine Zahlungsbuchung und kein deutscher Bank-Finalnachweis | labor |',
      '| `PAYMENTS-003-BANK-ACCOUNT-FIT.md` | Lernzusammenfassung | warum Bankkonto-Fit vor Zahlungsjournal noetig ist | keine Journal-/Ausgleichsfreigabe | labor |',
      '| `payments-003-010-bank-accounts-bank-rm-01-fit.screenshot.json` | Screenshot-Metadaten | Zweck und Grenze des Bankkontenbilds | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | labor |',
      '',
      '## Kernergebnis',
      '',
      fitResult.targetAfter
        ? '`BANK-RM-01` ist als Laborbankkonto vorhanden. Der naechste Payments-Schritt darf eine nicht buchende Zahlungsjournal-Readiness vorbereiten, aber noch keine Zahlung buchen.'
        : '`BANK-RM-01` ist weiterhin nicht vorhanden. Der naechste Schritt ist Bank-Account-Card-/Pflichtfeldanalyse, keine Zahlung.',
      ''
    ].join('\n')
  );

  expect(result.ui.bankAccountsPageOpened).toBe(true);
});
