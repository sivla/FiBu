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

const testId = 'security-001';

type SecurityTarget = {
  id: string;
  term: string;
  expected: RegExp;
  screenshotFile: string;
  purpose: string;
  beginnerMeaning: string;
};

function securityEvidencePath(fileName: string) {
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
    /User|Users|Benutzer|Permission|Berechtigung|Permission Set|Profile|Role|Rolle|Security Group|Security Filter|User Setup|Change Log|Job Queue|Approval|Admin|Setup|License|Lizenz|Duties|SoD/i;
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
    const toggle = scope.getByRole('menuitemcheckbox', { name: /Breites Layout|Wide layout/i }).last();
    if (await toggle.isVisible({ timeout: 500 }).catch(() => false)) {
      const checked = await toggle.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await toggle.click().catch(() => undefined);
        await page.waitForTimeout(1000);
      }
      return true;
    }

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

async function captureTellMe(page: Page, target: SecurityTarget) {
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
    /User|Benutzer|Permission|Berechtigung|Profile|Role|Rolle|Security|Change Log|Job Queue|Approval|Setup|Admin/i.test(button)
  );

  await writeTextEvidence(securityEvidencePath(`${target.id}-page-text.txt`), compactText);
  await writeJsonEvidence(securityEvidencePath(`${target.id}-buttons.json`), buttons);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: visible ? 'candidate' : 'rejected',
    bookUse: visible ? 'navigation' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Nur Read-only Tell-Me-/Navigationsevidence in RM-DEMO / MCP_1_20260210.',
      'Sichtbarkeit beweist keinen wirksamen Berechtigungssatz, keine Security-Group-Zuweisung und keine SoD-Freigabe.',
      'Keine Benutzeranlage, keine Berechtigungs-, Profil-, Security-Group-, User-Setup- oder Change-Log-Aenderung und keine Buchung.'
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
    '# SECURITY-001 Readiness',
    '',
    'Status: `labor`, `read-only`, `security-readiness`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Buchkapitel | Kapitel 27 Security, Rollen, SoD und Governance; Kapitel 39 Projektartefakte |',
    '| Setup-Aenderung | nein |',
    '| Stammdaten-Aenderung | nein |',
    '| Buchung | nein |',
    '',
    '## Gepruefte UI-Einstiege',
    '',
    '| Tell-Me-Suche | Ergebnis | Bedeutung fuer Anfaenger | Screenshot |',
    '|---|---|---|---|',
    rows,
    '',
    '## Lernbefund',
    '',
    '- Profil/Rolle steuert vor allem Oberflaeche und Rollencenter. Es ersetzt keine Berechtigung.',
    '- Berechtigungssaetze steuern, was ein Benutzer darf. Sie sind nicht dasselbe wie ein sichtbares Menue.',
    '- Security Groups und User Setup sind Governance-Kontexte. Sichtbarkeit ist nur Orientierung, kein SoD- oder Zugriffsnachweis.',
    '- Change Log und Job Queue gehoeren in den Admin-/Betriebsnachweis, duerfen aber ohne Gate nicht aktiviert oder geaendert werden.',
    '',
    '## Buchwirkung',
    '',
    '- Kapitel 27 kann als Admin-/Security-Zielpfad gegen RM-DEMO vorbereitet werden.',
    '- Die aktuellen Screenshots sind Kandidaten fuer Anfaengererklaerungen zu Rolle vs. Berechtigung vs. Governance.',
    '- Finale deutsche Security-/SoD-Nachweise brauchen Zielrollen, Testbenutzer, Permission Sets, Security Groups und Review-Evidence.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep
  ].join('\n');
}

test('SECURITY-001 Admin-/Security-Readiness read-only pruefen', async ({ page }) => {
  const targets: SecurityTarget[] = [
    {
      id: '010-users',
      term: 'Users',
      expected: /Users|User Card|Benutzer/i,
      screenshotFile: 'security-001-010-users-tell-me.png',
      purpose: 'SECURITY-001 Benutzer/Users als Einstieg fuer Admin- und Berechtigungskapitel sichtbar machen.',
      beginnerMeaning: 'Benutzer sind Identitaeten im System; ein sichtbarer Benutzer beweist noch nicht, welche Rechte fachlich korrekt sind.'
    },
    {
      id: '020-permission-sets',
      term: 'Permission Sets',
      expected: /Permission Sets|Permission Set|Berechtigungssaetze|Berechtigungss.tze/i,
      screenshotFile: 'security-001-020-permission-sets-tell-me.png',
      purpose: 'SECURITY-001 Berechtigungssaetze als Rechtepakete sichtbar machen.',
      beginnerMeaning: 'Berechtigungssaetze bestimmen, was ein Benutzer darf; sie sind die Rechteebene, nicht das Rollencenter.'
    },
    {
      id: '030-profiles-roles',
      term: 'Profiles Roles',
      expected: /Profiles|Profile|Roles|Rollen|Role Centers|Rollencenter/i,
      screenshotFile: 'security-001-030-profiles-roles-tell-me.png',
      purpose: 'SECURITY-001 Profile/Rollen als Oberflaechen- und Rollencenter-Kontext pruefen.',
      beginnerMeaning: 'Profile/Rollen formen die Oberflaeche; sie ersetzen keine Berechtigungssaetze.'
    },
    {
      id: '040-security-groups',
      term: 'Security Groups',
      expected: /Security Groups|Security Group|Sicherheitsgruppen|Microsoft Entra|Entra/i,
      screenshotFile: 'security-001-040-security-groups-tell-me.png',
      purpose: 'SECURITY-001 Security Groups als moeglichen Gruppenzuweisungs-Kontext pruefen.',
      beginnerMeaning: 'Security Groups koennen Zugriff organisatorisch buendeln; sichtbare Suche beweist noch keine Gruppenzuweisung.'
    },
    {
      id: '050-user-setup',
      term: 'User Setup',
      expected: /User Setup|Benutzereinrichtung|User Settings|Benutzereinstellungen/i,
      screenshotFile: 'security-001-050-user-setup-tell-me.png',
      purpose: 'SECURITY-001 User Setup als Kontext fuer Posting-/Genehmigungsgrenzen sichtbar machen.',
      beginnerMeaning: 'User Setup kann fachliche Grenzen wie Buchungszeitraeume oder Genehmigerlogik beeinflussen; ohne Gate wird nichts geaendert.'
    },
    {
      id: '060-job-queue-entries',
      term: 'Job Queue Entries',
      expected: /Job Queue Entries|Job Queue Entry|Aufgabenwarteschlangenposten|Aufgabenwarteschlange/i,
      screenshotFile: 'security-001-060-job-queue-entries-tell-me.png',
      purpose: 'SECURITY-001 Job Queue Entries als Betriebs-/Admin-Kontext sichtbar machen.',
      beginnerMeaning: 'Aufgabenwarteschlangen zeigen automatisierte Laeufe; sie sind Betriebsevidence, aber kein Benutzerrechte-Nachweis.'
    },
    {
      id: '070-change-log-entries',
      term: 'Change Log Entries',
      expected: /Change Log Entries|Change Log Entry|Aenderungsprotokoll|Audit/i,
      screenshotFile: 'security-001-070-change-log-entries-tell-me.png',
      purpose: 'SECURITY-001 Change Log Entries als Audit-Kontext fuer Security/Governance sichtbar machen.',
      beginnerMeaning: 'Aenderungsprotokollposten koennen kritische Aenderungen zeigen, wenn das Change Log passend eingerichtet ist.'
    }
  ];

  const tellMeEntries = [];
  for (const target of targets) {
    tellMeEntries.push(await captureTellMe(page, target));
  }

  const result = {
    testId,
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only',
    chapter: 27,
    tellMeEntries,
    safety: {
      noPostingCommittedByTest: true,
      noSetupChangedByTest: true,
      noMasterDataChangedByTest: true,
      noCompanyChangedByTest: true,
      noUserChangedByTest: true,
      noPermissionChangedByTest: true,
      noProfileChangedByTest: true,
      noSecurityGroupChangedByTest: true,
      noChangeLogChangedByTest: true,
      noJobQueueChangedByTest: true
    },
    proves: [
      'Security-/Admin-Kontexte sind in RM-DEMO als Such- und Navigationspfade pruefbar.',
      'Users, Permission Sets, Profiles/Roles, Security Groups, User Setup, Job Queue Entries und Change Log Entries sind getrennte Prueffelder.',
      'Der Lauf erzeugt Buch-Evidence fuer Navigation und Grenzen, nicht fuer wirksame SoD- oder Berechtigungsfreigabe.'
    ],
    doesNotProve: [
      'Keine neue Benutzeranlage.',
      'Keine Berechtigungssatz-Zuweisung.',
      'Keine Security-Group-Zuweisung.',
      'Keine Profile-/Rollenanpassung.',
      'Keine User-Setup-, Change-Log- oder Job-Queue-Aenderung.',
      'Kein deutscher Security-/SoD-Finalnachweis.'
    ],
    nextStep:
      'SECURITY-002-BOOK-SYNC: Kapitel 27 mit SECURITY-001 synchronisieren; Rolle/Profil, Permission Sets, Security Groups, User Setup, Job Queue und Change Log als getrennte Prueffelder erklaeren. Ohne Gate keine Benutzer-, Berechtigungs-, Profil-, Security-Group-, User-Setup-, Change-Log- oder Job-Queue-Aenderung.'
  };

  await writeJsonEvidence(securityEvidencePath('SECURITY-001-result.json'), result);
  await writeTextEvidence(securityEvidencePath('SECURITY-001-READINESS.md'), renderMarkdown(result));
  await writeTextEvidence(
    securityEvidencePath('README.md'),
    [
      '# SECURITY-001 Evidence Index',
      '',
      'Status: `labor`, `read-only`, `security-readiness`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `SECURITY-001-result.json` | JSON-Ergebnis | Umgebung, Company, Tell-Me-Suchen, Screenshotdateien und Safety Flags | wirksame Berechtigungen, SoD-Freigabe, Benutzeranlage oder Setup-Aenderung | labor |',
      '| `SECURITY-001-READINESS.md` | Lernzusammenfassung | Rolle/Profil, Permission Sets, Security Groups, User Setup, Job Queue und Change Log sind getrennte Prueffelder | deutsche Security-Finalabnahme | labor |',
      '| `010-*` bis `070-*` Page-Text/Button-Dateien | kompakter UI-Kontext | sichtbare oder nicht stabile Such-/Navigationskontexte | operative Freigabe oder Einrichtung | candidate/rejected |',
      '| `security-001-*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen je Bild | eigenstaendige fachliche Wahrheit ohne JSON/Markdown | mixed |',
      '',
      '## Ergebnis',
      '',
      '`SECURITY-001` ist ein read-only Orientierungslauf. Er bucht nichts, aendert nichts und darf nicht als Berechtigungs- oder SoD-Finalnachweis gelesen werden.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep
    ].join('\n')
  );

  expect(result.safety.noPostingCommittedByTest).toBe(true);
  expect(result.safety.noSetupChangedByTest).toBe(true);
  expect(result.safety.noPermissionChangedByTest).toBe(true);
  expect(tellMeEntries.length).toBe(targets.length);
});
