import fs from 'node:fs';
import path from 'node:path';

export const evidencePackFiles = [
  '00-ticket-summary.md',
  '01-screenshot-analysis.md',
  '02-hypotheses.md',
  '03-repro-plan.md',
  '04-page-inspection.md',
  '05-data-checks.md',
  '06-telemetry.md',
  '07-repro-steps.md',
  '08-root-cause.md',
  '09-fix-or-workaround.md',
  '10-regression-test.md',
  '11-book-chapter-draft.md',
  '12-lessons-learned.md',
  '13-follow-up-questions.md',
  '14-risk-notes.md'
];

export type EvidenceScaffoldInput = {
  id: string;
  title: string;
  evidenceRoot?: string;
};

export type EvidenceScaffoldResult = {
  id: string;
  title: string;
  slug: string;
  packDir: string;
  files: string[];
};

export function normalizeTicketId(id: string): string {
  return id
    .trim()
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
}

export function slugifyTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de-DE')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function fileTemplate(fileName: string, id: string, title: string): string {
  const header = `# ${fileName.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' ')}\n\n`;
  const commonStatus =
    `| Feld | Wert |\n|---|---|\n| Ticket-ID | ${id} |\n| Titel | ${title} |\n| Status | synthetisch/unbestaetigt/read-only geplant |\n| Datenschutzstatus | keine echten Kundendaten |\n\n`;

  switch (fileName) {
    case '00-ticket-summary.md':
      return `${header}${commonStatus}| Environment | unbekannt |\n| Company | unbekannt |\n| User/Rolle | unbekannt |\n| Erwartung | offen |\n| Ist-Verhalten | aus Ticket zu analysieren |\n`;
    case '01-screenshot-analysis.md':
      return `${header}Keine echten Screenshots vorhanden. Analyse erfolgt erst nach anonymisiertem oder synthetischem Material.\n`;
    case '02-hypotheses.md':
      return `${header}| Hypothese | Wahrscheinlichkeit | Test | Ergebnis | Status |\n|---|---:|---|---|---|\n| Ursache noch offen | mittel | read-only Evidence sammeln | offen | offen |\n`;
    case '03-repro-plan.md':
      return `${header}1. Tickettext auswerten.\n2. Environment und Company klaeren.\n3. Read-only Page Inspection planen.\n4. Keine Schreibaktion ohne Freigabe ausfuehren.\n`;
    case '04-page-inspection.md':
      return `${header}| Merkmal | Wert |\n|---|---|\n| Page | noch nicht live geprueft |\n| Source Table | noch nicht live geprueft |\n| Company | unbekannt |\n| Environment | unbekannt |\n\nNoch nicht live geprueft. Diese Datei ist ein synthetischer Scaffold, bis echte Page Inspection read-only erfolgt.\n`;
    case '05-data-checks.md':
      return `${header}Read-only Datenchecks sind geplant, aber noch nicht ausgefuehrt. Keine produktiven Rohdaten speichern.\n`;
    case '06-telemetry.md':
      return `${header}Nicht geprueft / keine Telemetry angebunden. Correlation IDs und Logs erst anonymisiert dokumentieren.\n`;
    case '07-repro-steps.md':
      return `${header}1. Read-only Kontext sammeln.\n2. Repro nur in Sandbox/Testumgebung planen.\n3. Keine Buchung, Zahlung, E-Mail, Job Queue oder Integration ausloesen.\n`;
    case '08-root-cause.md':
      return `${header}## Bestaetigte Ursache\n\nRoot Cause offen.\n\n## Beleg\n\nNoch keine Evidence vorhanden.\n\n## Technische Erklaerung\n\nNoch offen.\n\n## Fachliche Erklaerung\n\nNoch offen.\n\n## Ausgeschlossene Hypothesen\n\nNoch keine Hypothese ausgeschlossen.\n`;
    case '09-fix-or-workaround.md':
      return `${header}Noch kein Fix oder Workaround bestaetigt. Jede Aenderung braucht Freigabe und Rollback-Plan.\n`;
    case '10-regression-test.md':
      return `${header}## Testplan\n\n1. Ausgangslage read-only belegen.\n2. Erwartetes Verhalten beschreiben.\n3. Regression in Sandbox/Testumgebung pruefen.\n\n## Assertions\n\n- Keine Schreibaktion ohne Freigabe.\n- Alter Fehler ist nachvollziehbar dokumentiert oder widerlegt.\n- Expected Result wird vor dem Test festgelegt.\n`;
    case '11-book-chapter-draft.md':
      return `${header}Buchkapitel-Entwurf noch offen. Erst nach bestaetigter Ursache in Buchwissen ueberfuehren.\n`;
    case '12-lessons-learned.md':
      return `${header}Noch keine Lesson Learned. Wird nach Evidence und Root Cause ergaenzt.\n`;
    case '13-follow-up-questions.md':
      return `${header}- Welche Environment und Company sind betroffen?\n- Welche Rolle/User-Gruppe ist betroffen?\n- Gibt es anonymisierte Screenshots oder Fehlermeldungen?\n`;
    case '14-risk-notes.md':
      return `${header}- Production bleibt read-only.\n- Keine echten Kundendaten committen.\n- Keine Rechte-, Setup- oder Stammdatenaenderung ohne Freigabe.\n`;
    default:
      return `${header}${commonStatus}`;
  }
}

export function createEvidencePack(input: EvidenceScaffoldInput): EvidenceScaffoldResult {
  const id = normalizeTicketId(input.id);
  const title = input.title.trim();
  if (!id) {
    throw new Error('Ticket-ID fehlt.');
  }
  if (!title) {
    throw new Error('Titel fehlt.');
  }

  const slug = slugifyTitle(title);
  const evidenceRoot = input.evidenceRoot ?? path.resolve('debugging-book', 'evidence');
  const packDir = path.join(evidenceRoot, `${id}-${slug}`);

  if (fs.existsSync(packDir)) {
    throw new Error(`Evidence Pack existiert bereits: ${packDir}`);
  }

  fs.mkdirSync(packDir, { recursive: true });
  for (const fileName of evidencePackFiles) {
    fs.writeFileSync(path.join(packDir, fileName), fileTemplate(fileName, id, title), 'utf8');
  }

  return {
    id,
    title,
    slug,
    packDir,
    files: evidencePackFiles.map((fileName) => path.join(packDir, fileName))
  };
}
