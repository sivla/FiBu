# OPERATIONS-001 Readiness

Status: `labor`, `book-sync`, `read-only`, `no-posting`, `no-setup-change`, `no-job-queue-change`, `no-telemetry-change`, `no-admin-change`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Buchkapitel | Kapitel 30 Betrieb, Monitoring und Hypercare |
| Arbeitstyp | Buch-/Zielbild-Sync ohne BC-Lauf |
| BC-Ausfuehrung | nein |
| Job Queue angelegt oder gestartet | nein |
| Telemetrie / Application Insights geaendert | nein |
| Admin Center geoeffnet oder geaendert | nein |
| Monitoring-Connector eingerichtet | nein |
| Produktivumgebung angefasst | nein |
| Buchung | nein |

## Was geprueft wurde

Dieser Lauf gleicht Kapitel 30 gegen den aktuellen Evidence-Stand ab. Praktisch vorhanden sind Laborbelege fuer Kernprozesse und mehrere Readiness-Bloecke:

- O2C-Laborbuchung `PS-INV103297`.
- P2P-Laborbuchung `108219`.
- Inventory-Laborbuchung `INV008-899959`.
- Payments-Readiness bis Post-Dialog mit Abbruch.
- Reporting-Readiness mit dokumentierten Negativ-/Teilbefunden.
- Security-, Compliance-, Migration- und Integrations-Readiness ohne Setup-Aenderungen.

Fuer Betrieb bedeutet das: Hypercare darf nicht erst bei einem Fehler beginnen. Ein belastbarer Betriebsnachweis braucht offene Tickets, betroffene Seite, Benutzer, Company, Uhrzeit mit Zeitzone, Job-Queue-Status, Integration/Extension-Kontext, Support Owner und, falls freigegeben, Telemetrie/Monitoring.

## Anfaenger-Lernwert

Ein sichtbarer Job-Queue- oder Admin-Einstieg ist noch kein Betriebsnachweis. Einsteiger muessen vier Ebenen trennen:

1. Prozess funktioniert: Beleg, Postenspur und Bericht sind fachlich nachgewiesen.
2. Betrieb beobachtet: Fehler, Job Queues, E-Mail, Workflows, Integrationen und Supportfaelle werden regelmaessig kontrolliert.
3. Telemetrie analysiert: Performance, Fehler und Umgebungszustand werden ueber Application Insights oder gleichwertige freigegebene Auswertung betrachtet.
4. Hypercare handelt: Ticket, Ursache, Workaround, Fix, Owner, Nachtest und Buch-/Prozessauswirkung werden dokumentiert.

Das Buch soll deshalb nicht nur sagen, dass Business Central "ueberwacht" wird. Es muss zeigen, welche Kontrollfrage zu welchem Ort gehoert und wann ein Setup-/Admin-Gate noetig ist.

## Microsoft-Learn-Abgleich

Microsoft Learn beschreibt fuer Business Central mehrere Betriebshebel, die im Buch getrennt bleiben muessen:

- Job Queue Entries koennen Reports und Codeunits einmalig oder wiederkehrend ausfuehren; Status, Fehler, Log Entries und Benachrichtigungen sind Teil des Monitorings.
- Business Central Telemetry sendet Umgebungs- und App-/Extension-Signale an Azure Application Insights und hilft bei Fehler- und Performanceanalyse.
- Das Business Central Administration Center ist ein Admin-Portal fuer Production-/Sandbox-Umgebungen, Benachrichtigungsempfaenger, Zugriff und Application-Insights-Telemetrie.

Quellen:

- https://learn.microsoft.com/en-us/dynamics365/business-central/admin-job-queues-schedule-tasks
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/telemetry-overview
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/tenant-admin-center

## Buchwirkung

Kapitel 30 wurde als Betriebszielbild eingeordnet. Die Schrittfolge bleibt fachlich richtig, aber der aktuelle Laborstatus ist klar:

- Keine Job Queue anlegen, aendern, starten oder neu planen.
- Keine Job-Queue-Benachrichtigung einrichten.
- Keine Telemetrie- oder Application-Insights-Konfiguration aendern.
- Kein Admin-Center-/Tenant-Setup aendern.
- Keine Produktivumgebung anfassen.
- Kein Monitoring-Connector und keine Power-Platform-/Power-BI-Betriebsintegration einrichten.

## Grenzen

- Kein UI-Screenshot wurde erzeugt.
- Kein Job-Queue-Log wurde live gelesen.
- Keine Application-Insights-Verbindung wurde geprueft.
- Keine Admin-Center-Ansicht wurde geoeffnet.
- Kein produktiver Hypercare-Ticketprozess wurde ausgefuehrt.
- Kein deutscher Finalnachweis fuer Betrieb, Security Review, Support Owner, Release-Wave-Nachtest oder Monitoring.

## Naechster Schritt

Ohne Gate: `SOLUTIONARCHITECT-001-READINESS` als Kapitel-31-Buch-/Zielbild-Sync vorbereiten. Keine AL-/Extension-Entwicklung, keine produktive Architekturentscheidung umsetzen, keine Setup-/Buchungs-/Integrationsaenderung.

Mit Gate: spaeter `OPERATIONS-002-JOB-QUEUE-OR-MONITORING-SETUP` fuer genau einen Betriebshebel freigeben, inklusive UI-first Klickpfad, Vorher/Nachher, Job-/Telemetry-/Admin-Grenze, Support Owner, Rueckfallregel und klarer Labor-/DE-Trennung.
