# SOLUTIONARCHITECT-001 Readiness

Status: `labor`, `book-sync`, `read-only`, `no-posting`, `no-setup-change`, `no-extension-development`, `no-architecture-decision-implemented`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Buchkapitel | Kapitel 31 Business Central Solution Architect Pfad |
| Arbeitstyp | Buch-/Zielbild-Sync ohne BC-Lauf |
| BC-Ausfuehrung | nein |
| Setup geaendert | nein |
| Stammdaten geaendert | nein |
| Buchung | nein |
| AL-/Extension-Entwicklung | nein |
| AppSource-/Extension-Installation | nein |
| API-/Web-Service-/Connector-Setup | nein |
| Power-Platform-/Power-BI-Setup | nein |
| produktive Architekturentscheidung umgesetzt | nein |

## Was geprueft wurde

Dieser Lauf gleicht Kapitel 31 gegen den aktuellen Evidence-Stand ab. Praktisch belegt sind:

- O2C-Laborprozess mit `S-ORD101068` -> `PS-INV103297`.
- P2P-Laborprozess mit `106049` -> `108219`.
- Inventory-Laborbuchung `INV008-899959` und Lagerbewertung.
- Payments-Readiness bis Post-Dialog mit Abbruch.
- Reporting-Teil-/Negativbefunde zu `PRODUCTLINE`/`CHANNEL`.
- Security-, Migration-, Integrations- und Operations-Readiness ohne Setup-Aenderung.

Fuer Solution Architecture bedeutet das: Das Projekt hat genug Evidence, um Anforderungen und Standardgrenzen fachlich zu diskutieren. Es hat aber noch keine freigegebene Zielarchitektur, keine Architecture Decision Records, keine Extension-Auswahl, kein Customizing und keine produktive Umsetzung.

## Anfaenger-Lernwert

Ein Solution Architect klickt nicht einfach den naechsten technischen Hebel. Er ordnet ein:

1. Welcher Business-Central-Standardprozess traegt den Kernbedarf?
2. Welche Stammdaten, Buchungsgruppen, Dimensionen, Steuerlogik und Rollen muessen passen?
3. Welche Evidence beweist den Happy Path, die Postenspur und die Abweichung?
4. Ist die Luecke ein Setup-Thema, ein Prozessdesign-Thema, eine Extension, eine Integration oder echtes Customizing?
5. Welcher UAT-Fall beweist die Entscheidung?
6. Welche Betriebsfolge entsteht fuer Support, Monitoring, Release-Waves und Owner?

Das Buch soll deshalb nicht den Eindruck erwecken, dass ein Mini-Case automatisch eine Empfehlung fuer die produktive Umsetzung ist. Jede Empfehlung braucht Standardnachweis, Fit-Gap, Risiko, UAT und Gate.

## Microsoft-Learn-Abgleich

Microsoft Learn stuetzt die Trennung zwischen Standardfunktion, Implementierungsanalyse und Erweiterung:

- Business Central bietet Standardfunktionen fuer viele Geschaeftsbereiche; daraus folgt zuerst ein Standardnachweis, nicht sofort Customizing.
- Dynamics-365-Implementierungsleitfaden und Fit-to-Standard/Fit-Gap-Logik behandeln Abweichungen als bewusste Projektentscheidung.
- AL-Extensions und AppSource sind Erweiterungswege, aber sie brauchen Entwicklung, Test, Lifecycle- und Upgradebetrachtung.

Quellen:

- https://learn.microsoft.com/en-us/dynamics365/business-central/across-business-functionality
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-fit-to-standard-fit-gap-analysis
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-dev-overview

## Buchwirkung

Kapitel 31 wurde als Entscheidungs- und Zielbildkapitel eingeordnet. Die Architektur-Kompetenzmatrix bleibt fachlich sinnvoll, aber der aktuelle Laborstatus ist klar:

- Keine AL-/Extension-Entwicklung.
- Keine AppSource-App installieren oder pilotieren.
- Keine API/Web Services, Connectoren, Power Platform oder Power BI einrichten.
- Keine produktive Architekturentscheidung oder ADR umsetzen.
- Keine Setup-, Stammdaten-, Buchungs-, Integrations-, Security- oder Operations-Aenderung.
- CRONUS-USA-Laborbelege nicht als deutschen Zielarchitektur-Endstand verkaufen.

## Grenzen

- Kein UI-Screenshot wurde erzeugt.
- Keine Business-Central-Seite wurde geoeffnet.
- Kein Architecture Decision Record wurde freigegeben.
- Keine Zielarchitektur wurde finalisiert.
- Keine Extension-, AppSource-, AL-, API-, Connector-, Power-Platform- oder Power-BI-Umsetzung wurde getestet.
- Kein deutscher Finalnachweis fuer Zielarchitektur, UAT, Security, Betrieb, Datenmigration oder Release-Wave-Readiness.

## Naechster Schritt

Ohne Gate: `UAT-001-READINESS` als Kapitel-32-Buch-/Zielbild-Sync vorbereiten. Keine neue Buchung, keine Setup-Aenderung und keine neuen Prozesslaeufe; vorhandene Evidence in eine UAT-Testbibliothekslogik einordnen.

Mit Gate: spaeter `SOLUTIONARCHITECT-002-ARCHITECTURE-DECISION-OR-ADR` fuer genau eine konkrete Architekturentscheidung freigeben. Der Lauf braucht Standardnachweis, Fit-Gap, Risiko, UAT-Fall, Owner, Rollback, Betriebsfolge und klare Labor-/DE-Trennung.
