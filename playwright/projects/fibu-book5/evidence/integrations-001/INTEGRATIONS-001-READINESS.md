# INTEGRATIONS-001 Readiness

Status: `labor`, `book-sync`, `read-only`, `no-posting`, `no-setup-change`, `no-extension-install`, `no-api-setup`, `no-connector-setup`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Buchkapitel | Kapitel 29 Integrationen |
| Arbeitstyp | Buch-/Zielbild-Sync ohne BC-Lauf |
| BC-Ausfuehrung | nein |
| Extension installiert | nein |
| API/Web-Service eingerichtet | nein |
| Connector eingerichtet | nein |
| Power Platform eingerichtet | nein |
| Power BI eingerichtet | nein |
| Buchung | nein |

## Was geprueft wurde

Dieser Lauf gleicht Kapitel 29 gegen den aktuellen Evidence-Stand ab. Praktisch vorhanden sind im Labor bereits starke Standardprozess-Nachweise:

- O2C-Laborbuchung `PS-INV103297`.
- P2P-Laborbuchung `108219`.
- Inventory-Laborbuchung `INV008-899959`.
- Payments-Readiness bis Post-Dialog mit Abbruch.
- Reporting-Readiness und Negativbefunde zu `PRODUCTLINE`/`CHANNEL`.
- Compliance-, Security- und Migration-Readiness ohne Setup-Aenderung.

Fuer Integrationen bedeutet das: Der Standardnachweis ist die Ausgangsbasis. Eine Extension, Power-Platform-Loesung, API-Integration oder Power-BI-Anbindung darf erst bewertet werden, wenn klar ist, welcher konkrete Standardprozess trotz Setup, UAT und Schulung nicht wirtschaftlich oder kontrollsicher genug traegt.

## Anfaenger-Lernwert

Integration ist kein schneller Technik-Klick. Ein Einsteiger muss vier Ebenen auseinanderhalten:

1. Standardprozess: Kann Business Central den Prozess mit Setup und Bedienung bereits tragen?
2. Erweiterung: Braucht es eine AppSource-App oder Extension, und ist sie in einer Sandbox getestet?
3. Integration: Welche Daten fliessen wohin, mit welcher Authentifizierung, welchem Mapping, welchem Fehlerprotokoll und welchem Monitoring?
4. Betrieb: Wer besitzt Support, Berechtigungen, Rollback, Updates und UAT nach Release-Wechseln?

Sichtbare Seiten wie `Extension Management`, `Web Services`, `API Setup`, `Power Automate`, `Power BI` oder `Job Queue Entries` beweisen nur einen Einstieg. Sie beweisen keine funktionierende Integration.

## Microsoft-Learn-Abgleich

Microsoft Learn beschreibt fuer Business Central mehrere Integrationswege, die im Buch getrennt bleiben muessen:

- APIs und Web Services koennen Business-Central-Daten fuer externe Systeme bereitstellen oder konsumierbar machen.
- AppSource-Apps/Extensions werden administriert und muessen vor produktiver Nutzung verwaltet, getestet und verantwortet werden.
- Power Platform und Power BI sind Integrations- und Auswertungsschichten, ersetzen aber keinen fachlichen BC-Posten- oder Prozessnachweis.

Quellen:

- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/webservices/web-services
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/
- https://learn.microsoft.com/en-gb/dynamics365/business-central/admin-manage-appsource-apps
- https://learn.microsoft.com/en-us/dynamics365/business-central/admin-powerplatform

## Buchwirkung

Kapitel 29 wurde so eingeordnet, dass es keine produktive Integration simuliert. Die Schrittfolge bleibt als Zielbild richtig, aber der Laborstatus ist klar:

- Keine Extension installieren.
- Keine AppSource-App pilotieren.
- Keine API, keinen Web Service und keinen Connector einrichten.
- Kein Power-Automate-/Power-BI-Setup erzeugen.
- Kein produktiver Datenaustausch.
- Kein Job-Queue- oder Monitoring-Setup veraendern.

## Grenzen

- Kein UI-Screenshot wurde erzeugt.
- Keine Extension-Version wurde aus BC gelesen.
- Kein API-Endpunkt wurde eingerichtet oder getestet.
- Kein Connector wurde autorisiert.
- Kein Power-BI-Dataset wurde aktualisiert.
- Kein deutscher Finalnachweis fuer Datenschutz, GoBD, E-Rechnung, Banking, DATEV, Shipping, WMS oder BI.

## Naechster Schritt

Ohne Gate: `OPERATIONS-001` ist inzwischen erledigt. Naechster sicherer Block ist `SOLUTIONARCHITECT-001-READINESS` als Kapitel-31-Buch-/Zielbild-Sync. Keine AL-/Extension-Entwicklung, keine produktive Architekturentscheidung umsetzen und keine Setup-/Buchungs-/Integrationsaenderung.

Mit Gate: spaeter `INTEGRATIONS-002-SETUP-OR-CONNECTOR` fuer genau einen Integrationskandidaten freigeben, inklusive UI-first Klickpfad, UAT, Rollen/Berechtigungen, Fehlerfall, Rollback, Monitoring und Support Owner.
