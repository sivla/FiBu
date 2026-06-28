import { CustomerContext, CustomerIssueClassification, findKnownIssueMatches } from './customer-context';
import { EnvironmentType, decideSafeAction } from './safe-actions';

export type TicketProblemClass = CustomerIssueClassification;

export type EvidenceChannel = 'ticket' | 'ui' | 'data' | 'telemetry' | 'code' | 'repro' | 'customer-question';

export type TicketTriageInput = {
  ticketText: string;
  customerContext?: CustomerContext;
  environment?: EnvironmentType;
  hasExplicitApproval?: boolean;
};

export type TicketTriageResult = {
  problemClass: TicketProblemClass;
  confidence: 'low' | 'medium' | 'high';
  facts: string[];
  hypotheses: string[];
  recommendedChannels: EvidenceChannel[];
  nextActions: string[];
  questions: string[];
  safetyNotes: string[];
  knownIssueMatches: string[];
};

const classSignals: Array<{
  problemClass: TicketProblemClass;
  signals: RegExp[];
  channels: EvidenceChannel[];
  hypotheses: string[];
  nextActions: string[];
}> = [
  {
    problemClass: 'permission',
    signals: [/permission|berechtigung|zugriff|execute|tabledata|security filter/i],
    channels: ['ticket', 'ui', 'data', 'telemetry'],
    hypotheses: ['fehlendes Permission Set', 'fehlendes Execute-Recht', 'Security Filter', 'Rolle/Profile-Verwechslung'],
    nextActions: ['Fehlermeldung exakt sichern', 'Effective Permissions read-only pruefen', 'Permission-Telemetry vorbereiten']
  },
  {
    problemClass: 'setup-configuration',
    signals: [/posting group|buchungsgruppe|setup|einrichtung|nummernserie|dimension|inventory posting|vat posting/i],
    channels: ['ticket', 'data', 'ui'],
    hypotheses: ['fehlendes oder falsches Setup', 'unpassende Posting Group', 'Pflichtdimension blockiert Prozess'],
    nextActions: ['Setup-Kombination read-only pruefen', 'betroffene Datenklasse eingrenzen', 'Aenderung nur mit Freigabe planen']
  },
  {
    problemClass: 'user-guidance',
    signals: [/wie kann ich|wo finde ich|spalte fehlt|feld fehlt|nicht sichtbar|anleitung|help|hilfe/i],
    channels: ['ticket', 'ui'],
    hypotheses: ['Bedienhilfe noetig', 'Profil oder Personalisierung blendet Feld aus', 'Kunde ist auf falscher Page'],
    nextActions: ['Page und Rolle klaeren', 'UI Evidence read-only sammeln', 'kurze Anleitung oder Rueckfrage formulieren']
  },
  {
    problemClass: 'standard-limitation',
    signals: [/standard|geht das|nicht moeglich|feature|anforderung|soll automatisch|customizing/i],
    channels: ['ticket', 'data', 'code'],
    hypotheses: ['Standard kann das Verhalten nicht abbilden', 'Workaround oder Erweiterung noetig'],
    nextActions: ['Standardverhalten abgleichen', 'Alternative oder Erweiterungsbedarf beschreiben']
  },
  {
    problemClass: 'integration',
    signals: [/api|odata|schnittstelle|integration|webhook|edi|power automate|extern/i],
    channels: ['ticket', 'data', 'telemetry'],
    hypotheses: ['Integration liefert fehlerhafte Daten', 'API-Fehler oder Mapping-Problem', 'Job/Flow nicht erfolgreich'],
    nextActions: ['API/OData nur read-only pruefen', 'Telemetry/API-Status vorbereiten', 'keine Integration ausloesen']
  },
  {
    problemClass: 'performance',
    signals: [/langsam|performance|timeout|dauer|haengt|loading/i],
    channels: ['ticket', 'ui', 'telemetry'],
    hypotheses: ['Page Performance', 'Datenmenge', 'Extension oder API-Latenz'],
    nextActions: ['Zeitpunkt und Page klaeren', 'Page Performance Query vorbereiten', 'UI-Repro nur read-only planen']
  },
  {
    problemClass: 'bug',
    signals: [/bug|exception|fehler|crash|stack|codeunit|extension|reproduzierbar/i],
    channels: ['ticket', 'ui', 'telemetry', 'code', 'repro'],
    hypotheses: ['Bug in Standard oder Extension', 'Datenzustand triggert Fehler', 'Codepfad braucht Analyse'],
    nextActions: ['Repro-Bedingungen klaeren', 'Telemetry und Codekontext pruefen', 'Regressionstest planen']
  },
  {
    problemClass: 'data-problem',
    signals: [/posten|entry|ledger|beleg|status|offen|gebucht|betrag|bestand|datensatz/i],
    channels: ['ticket', 'data', 'ui'],
    hypotheses: ['Datenstatus passt nicht zur Erwartung', 'Entry-Spur oder Belegstatus erklaert Verhalten'],
    nextActions: ['Beleg-/Entry-Spur read-only pruefen', 'Status und gespeicherte Werte dokumentieren']
  }
];

function splitFacts(ticketText: string): string[] {
  return ticketText
    .split(/[.!?\r\n]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8)
    .slice(0, 6);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function triageTicket(input: TicketTriageInput): TicketTriageResult {
  const ticketText = input.ticketText.trim();
  if (!ticketText) {
    throw new Error('Tickettext fehlt. Triage braucht mindestens eine Problembeschreibung.');
  }

  const environment = input.environment ?? 'unknown';
  const matches = classSignals
    .map((entry) => ({
      entry,
      score: entry.signals.filter((signal) => signal.test(ticketText)).length
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = matches[0]?.entry;
  const knownIssueMatches = input.customerContext
    ? findKnownIssueMatches(input.customerContext, ticketText).map((issue) => issue.id)
    : [];

  const problemClass = knownIssueMatches.length > 0
    ? input.customerContext!.knownIssues.find((issue) => issue.id === knownIssueMatches[0])!.classification
    : best?.problemClass ?? 'unknown';

  const channels = best?.channels ?? ['ticket', 'customer-question'];
  const hypotheses = best?.hypotheses ?? ['Problemklasse unklar', 'Ticket braucht mehr Kontext'];
  const nextActions = best?.nextActions ?? ['gezielte Rueckfragen stellen', 'keine BC-Aktion ohne Environment-Kontext'];

  const safetyDecision = decideSafeAction({
    environment,
    risk: environment === 'unknown' ? 'unknown' : 'read-only',
    hasExplicitApproval: input.hasExplicitApproval ?? false
  });

  const questions: string[] = [];
  if (!/production|sandbox|test|training|mandant|company|environment/i.test(ticketText)) {
    questions.push('Welche Environment und Company sind betroffen?');
  }
  if (!/screenshot|fehlermeldung|error|meldung|zeitpunkt|correlation/i.test(ticketText)) {
    questions.push('Gibt es Screenshot, genaue Fehlermeldung, Zeitpunkt oder Correlation ID?');
  }
  if (problemClass === 'unknown') {
    questions.push('Was hat der User erwartet und was ist tatsaechlich passiert?');
  }

  return {
    problemClass,
    confidence: knownIssueMatches.length > 0 ? 'high' : matches.length > 1 ? 'medium' : best ? 'medium' : 'low',
    facts: splitFacts(ticketText),
    hypotheses: unique(hypotheses),
    recommendedChannels: unique(channels),
    nextActions: unique(nextActions),
    questions,
    safetyNotes: [
      safetyDecision.allowed ? 'Nur read-only Diagnose geplant.' : safetyDecision.reason,
      'Keine Buchung, Zahlung, E-Mail, Job Queue, Integration, Setup- oder Rechteaenderung ohne Freigabe.'
    ],
    knownIssueMatches
  };
}
