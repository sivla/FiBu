# GOVERNANCE-016 - BC Bugfixing Playbook

Status: `done-doc-source-sync-no-bc-run`

Umgebung: `MCP_1_20260210`

Aktuelle Projektcompany: `RM-DEMO`

## Was aufgenommen wurde

`BC-BUGFIXING-PLAYBOOK.md` wurde als zentrale Fehleranalyse-Checkliste fuer Business Central angelegt.

Der Grundsatz lautet: Fehler zuerst klassifizieren, dann loesen.

## Fehlerklassen

- Oberflaeche
- Page / Tabelle
- Berechtigung
- Stammdaten
- Prozessstatus
- Buchungslogik / Posting Setup
- Extension
- Daten / Filter / Company
- Integration / Hintergrundprozess
- Performance

## Warum das wichtig ist

FiBu Buch 5 soll Business Central nicht nur anklicken, sondern verstehen. Wenn ein Klickpfad scheitert, muss daraus ein Lernfall entstehen:

- Was sieht der Anwender?
- Welche Page und Tabelle steckt dahinter?
- Welche Einrichtung oder welches Stammdatum fehlt?
- Ist es ein Rechte-, Extension-, Filter-, Setup- oder Performanceproblem?
- Was muss im Buch oder in der Klickanleitung ergaenzt werden?

## Quellen

- Microsoft Learn: [Troubleshooting tools overview](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-troubleshooting-overview)
- Microsoft Learn: [Permission Error Trace Telemetry](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/telemetry-permission-error-trace)
- Microsoft Learn: [Discoverability of Events](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-events-discoverability)
- Microsoft Learn: [Telemetry overview](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/telemetry-overview)
- Microsoft Learn: [Performance troubleshooting](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/performance/performance-work-perf-problem)
- Microsoft Learn: [Page View Telemetry](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/telemetry-page-view-trace)
- Microsoft Learn: [Web Service Request Telemetry](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/telemetry-webservices-trace)

## Projektwirkung

Aktualisiert:

- `BC-BUGFIXING-PLAYBOOK.md`
- `DOCUMENTATION-MAP.md`
- `BC-PLAYWRIGHT-PATTERNS.md`
- `MICROSOFT-DOC-VALIDATION.md`
- `WORKAROUNDS-AND-ERRORS.md`
- Buchkapitel 37 im Master-Blueprint

Keine BC-Ausfuehrung, keine Setup-Aenderung, keine Buchung, kein Company-Wechsel.
