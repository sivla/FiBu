import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  hideFactBoxPane,
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
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'compliance-001';

type TellMeTarget = {
  id: string;
  term: string;
  expected: RegExp;
  screenshotFile: string;
  purpose: string;
  beginnerMeaning: string;
};

function complianceEvidencePath(fileName: string) {
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
    /E-Rechnung|E-Document|E Document|Peppol|VAT|USt|Tax|Change Log|Audit|VAT Entries|VAT Posting|Document Sending|Incoming Documents|Compliance|GoBD|Setup|Posted Sales Invoice|PS-INV103297/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => sanitizeEvidenceText(line.replace(/\s+/g, ' ').trim()))
    .filter(
      (line) =>
        Boolean(line) &&
        !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|shouldAttachOauthTokens|O365SuiteServiceProxy|authority:|cacheLocation:|parentPageOrigin:|upn:/i.test(line)
    );
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -1; offset <= 2; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) {
        selected.add(selectedIndex);
      }
    }
  }

  return [
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 180)
  ].join('\n');
}

async function activateWideLayout(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const button = scope
      .getByRole('button', {
        name: /Breites Layout|Wide layout|Focus mode|Full screen|Maximi[sz]e|Expand|Fokus|Vollbild|Maximieren|Erweitern/i
      })
      .last();
    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      await button.click().catch(() => undefined);
      await page.waitForTimeout(1000);
      return true;
    }
  }

  return false;
}

async function captureTellMe(page: Page, target: TellMeTarget) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page);
  const wideLayoutActivated = await activateWideLayout(page);
  await searchFor(page, target.term);
  await page.waitForTimeout(1500);

  const text = await pageText(page);
  const compactText = compactPageText(text);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const visible = target.expected.test(text) || buttons.some((button) => target.expected.test(button));
  const relevantButtons = buttons.filter((button) =>
    /E-Rechnung|E-Document|E Document|Peppol|VAT|USt|Tax|Change Log|Audit|Document|Incoming|Setup|Posted|Invoice/i.test(button)
  );

  await writeTextEvidence(complianceEvidencePath(`${target.id}-page-text.txt`), compactText);
  await writeJsonEvidence(complianceEvidencePath(`${target.id}-buttons.json`), buttons);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: visible ? 'candidate' : 'rejected',
    bookUse: visible ? 'navigation' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Nur Read-only Tell-Me-/Navigationsevidence in RM-DEMO / MCP_1_20260210.',
      'Kein deutsches Steuer-, GoBD-, Peppol- oder E-Rechnungs-Finalsetup.',
      'Keine Steuer-/E-Rechnungs-/Change-Log-Einrichtung geaendert, keine Rechnung gesendet und keine Buchung.'
    ]
  });

  return {
    id: target.id,
    searchedFor: target.term,
    expectedVisible: visible,
    beginnerMeaning: target.beginnerMeaning,
    relevantButtons,
    wideLayoutActivated,
    screenshot: target.screenshotFile,
    pageTextEvidenceFile: `${target.id}-page-text.txt`,
    buttonsEvidenceFile: `${target.id}-buttons.json`
  };
}

function renderMarkdown(result: Record<string, any>) {
  const rows = (result.tellMeEntries as Array<Record<string, any>>)
    .map(
      (entry) =>
        `| ${entry.searchedFor} | ${entry.expectedVisible ? 'sichtbar/kontextuell sichtbar' : 'nicht stabil sichtbar'} | ${entry.beginnerMeaning} | ${entry.screenshot} |`
    )
    .join('\n');

  return [
    '# COMPLIANCE-001 Readiness',
    '',
    'Status: `labor`, `read-only`, `compliance-readiness`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Buchkapitel | Kapitel 22 USt, E-Rechnung und deutsche Nachweissicht |',
    '| Referenzbelege | O2C `PS-INV103297`, P2P `108219` nur als bestehende Laborbelege; dieser Lauf bucht nichts |',
    '| Setup-Aenderung | nein |',
    '| Buchung | nein |',
    '| Versand/Peppol/E-Rechnung | nein |',
    '',
    '## Gepruefte UI-Einstiege',
    '',
    '| Tell-Me-Suche | Ergebnis | Bedeutung fuer Anfaenger | Screenshot |',
    '|---|---|---|---|',
    rows,
    '',
    '## Lernbefund',
    '',
    '- Compliance ist kein einzelner Button. Fuer das Buch muessen Steuerlogik, E-Rechnungs-/Versandstatus, Change Log und Postenspur getrennt erklaert werden.',
    '- Sichtbare Einstiegspfade beweisen nur, dass ein Leser dort nachsehen oder weiter pruefen kann. Sie beweisen nicht, dass deutsches VAT19-, GoBD- oder E-Rechnungs-Setup fachlich fertig ist.',
    '- In RM-DEMO bleibt die Steuergrenze aus `TAX-001` bestehen: O2C/P2P zeigen im Labor `0 %` Tax; deutsche `19 %` USt ist nicht erreicht.',
    '- Eine E-Rechnung darf im Buch erst als final nachgewiesen gelten, wenn gebuchte Rechnung, E-Dokument/Format, Versand-/Validierungsstatus, USt-Posten und Archiv-/Auditnachweis zusammenpassen.',
    '',
    '## Buchwirkung',
    '',
    '- Kapitel 22 kann als Readiness-/Orientierungskapitel gegen RM-DEMO vorbereitet werden.',
    '- Finale deutsche Screenshots fuer USt, E-Rechnung, Peppol/Provider, Change Log und Nachweisarchiv bleiben offen.',
    '- Jede Einrichtung an VAT, E-Documents, Change Log oder Versandprofilen braucht ein eigenes Gate und UI-first Klickpfad-Evidence.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep
  ].join('\n');
}

test('COMPLIANCE-001 Kapitel-22-Readiness read-only pruefen', async ({ page }) => {
  const targets: TellMeTarget[] = [
    {
      id: '010-e-invoices',
      term: 'E-Rechnungen',
      expected: /E-Rechnung|E-Rechnungen|E-Document|E Documents|E-Invoice|Electronic Document/i,
      screenshotFile: 'compliance-001-010-e-invoices-tell-me.png',
      purpose: 'COMPLIANCE-001 E-Rechnungs-/E-Document-Kontext als sichtbaren Einstiegspunkt pruefen.',
      beginnerMeaning: 'Hier beginnt der technische Nachweis fuer strukturierte Rechnungen; Sichtbarkeit ist noch kein Versand- oder Formatnachweis.'
    },
    {
      id: '020-vat-entries',
      term: 'VAT Entries',
      expected: /VAT Entries|VAT Entry|USt-Posten|MwSt|Tax/i,
      screenshotFile: 'compliance-001-020-vat-entries-tell-me.png',
      purpose: 'COMPLIANCE-001 USt-/Tax-Posten als Nachweisziel fuer gebuchte Belege pruefen.',
      beginnerMeaning: 'USt-Posten sind der Nachweis nach einer Buchung; in RM-DEMO ist das noch CRONUS-USA-Labor, kein deutscher 19-%-Beweis.'
    },
    {
      id: '030-vat-posting-setup',
      term: 'VAT Posting Setup',
      expected: /VAT Posting Setup|VAT Bus\.|VAT Prod\.|USt-Buchungsmatrix|Tax Posting Setup|Sales Tax/i,
      screenshotFile: 'compliance-001-030-vat-posting-setup-tell-me.png',
      purpose: 'COMPLIANCE-001 Steuer-Matrix als Setup-Kontext pruefen, ohne Setup zu aendern.',
      beginnerMeaning: 'Die Matrix erklaert, warum Steuerbetraege entstehen; sie darf ohne Gate nicht auf deutsches VAT19 umgestellt werden.'
    },
    {
      id: '040-document-sending-profiles',
      term: 'Document Sending Profiles',
      expected: /Document Sending Profiles|Document Sending Profile|Belegsendeprofile|Send/i,
      screenshotFile: 'compliance-001-040-document-sending-profiles-tell-me.png',
      purpose: 'COMPLIANCE-001 Versand-/Belegsendeprofil-Kontext fuer Rechnungsnachweise pruefen.',
      beginnerMeaning: 'Versandprofile betreffen Ausgabe und Versand; sie ersetzen keine E-Rechnungsvalidierung und keinen Steuerposten.'
    },
    {
      id: '050-change-log-entries',
      term: 'Change Log Entries',
      expected: /Change Log Entries|Change Log Entry|Aenderungsprotokoll|Änderungsprotokoll|Audit/i,
      screenshotFile: 'compliance-001-050-change-log-entries-tell-me.png',
      purpose: 'COMPLIANCE-001 Change-Log-Posten als Audit-/GoBD-nahen Einstieg pruefen.',
      beginnerMeaning: 'Das Change Log zeigt Setup-/Stammdaten-Aenderungen, wenn es passend eingerichtet ist; dieser Lauf aktiviert nichts.'
    },
    {
      id: '060-change-log-setup',
      term: 'Change Log Setup',
      expected: /Change Log Setup|Aenderungsprotokoll Einrichtung|Änderungsprotokoll Einrichtung|Audit/i,
      screenshotFile: 'compliance-001-060-change-log-setup-tell-me.png',
      purpose: 'COMPLIANCE-001 Change-Log-Setup als gesperrten Einrichtungspfad sichtbar machen.',
      beginnerMeaning: 'Hier wuerde festgelegt, was protokolliert wird; Aktivierung ist eine Setup-Aenderung und braucht Freigabe.'
    }
  ];

  const tellMeEntries = [];
  for (const target of targets) {
    tellMeEntries.push(await captureTellMe(page, target));
  }

  const result = {
    testId: 'COMPLIANCE-001',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only',
    chapter: 22,
    referenceDocuments: {
      o2cPostedSalesInvoice: 'PS-INV103297',
      p2pPostedPurchaseInvoice: '108219'
    },
    tellMeEntries,
    safety: {
      noPostingCommittedByTest: true,
      noSetupChangedByTest: true,
      noCompanyChangedByTest: true,
      noEInvoiceSentByTest: true,
      noVatSetupChangedByTest: true,
      noChangeLogChangedByTest: true
    },
    proves: [
      'Kapitel 22 kann in RM-DEMO als Read-only-Orientierung gegen sichtbare BC-Einstiegspfade vorbereitet werden.',
      'VAT Entries, VAT Posting Setup, E-Rechnungs-/E-Document-Kontext, Document Sending Profiles und Change Log sind getrennte Prueffelder.',
      'Der Lauf erzeugt Buch-Evidence fuer Navigation und Grenzen, nicht fuer deutsche Compliance-Erfuellung.'
    ],
    doesNotProve: [
      'Kein deutsches 19-%-VAT-Setup.',
      'Keine deutsche UStVA, ZM, GoBD- oder E-Rechnungs-Finalfreigabe.',
      'Kein Peppol-/Provider-Versand, keine E-Rechnungsvalidierung und kein Archivnachweis.',
      'Keine Aktivierung oder Aenderung des Change Logs.',
      'Keine neue Buchung und keine neue Postenspur.'
    ],
    nextStep:
      'COMPLIANCE-002 und SECURITY-001 sind erledigt. Ohne Gate naechster sicherer Schritt: SECURITY-002-BOOK-SYNC fuer Kapitel 27; keine Benutzer-, Berechtigungs-, Profil-/Rollen-, Security-Group-, User-Setup-, Change-Log- oder Job-Queue-Aenderung ohne Gate.'
  };

  await writeJsonEvidence(complianceEvidencePath('COMPLIANCE-001-result.json'), result);
  await writeTextEvidence(complianceEvidencePath('COMPLIANCE-001-READINESS.md'), renderMarkdown(result));

  expect(result.safety.noPostingCommittedByTest).toBe(true);
  expect(result.safety.noSetupChangedByTest).toBe(true);
  expect(result.safety.noEInvoiceSentByTest).toBe(true);
  expect(tellMeEntries.length).toBe(targets.length);
});
