# GOVERNANCE-014 - Personalisieren als UI-Diagnose

Status: `done-doc-source-sync-no-bc-run`

Umgebung: `MCP_1_20260210`

Aktuelle Projektcompany: `RM-DEMO`

## Was aufgenommen wurde

Personalisieren wird als wiederverwendbares Diagnosemuster fuer Business-Central-Klickanleitungen aufgenommen.

Wenn ein erwartetes Feld, eine Spalte oder eine Aktion nicht sichtbar ist, wird zuerst geprueft, ob das Element ueber Personalisieren, Ansichten, Seiteneinstellungen, Rolle, Profil oder Berechtigung sichtbar gemacht werden kann.

## Warum das wichtig ist

Klickanleitungen scheitern oft nicht daran, dass Business Central fachlich anders arbeitet, sondern daran, dass die sichtbare Page vom Standard, vom Nutzer, vom Profil oder von der Rolle abweicht.

Das ist besonders relevant fuer:

- Verkaufs- und Einkaufszeilen
- Journalzeilen
- Ledger-Listen
- Setup-Listen
- Aktionen in der Aktionsleiste
- Buchscreenshots mit Spaltennachweis

## Grenze

Personalisieren beweist UI-Verfuegbarkeit, aber keine Tabellen-, Posting-, Steuer- oder Berechtigungslogik.

Ein Debug-Screenshot im Personalisierungsmodus darf erklaeren, warum ein Feld fehlt. Ein finales Buchbild muss danach in der normalen Ansicht zeigen, was der Leser fachlich sehen soll.

## Quellen

- Microsoft Learn: [Personalise your workspace](https://learn.microsoft.com/en-au/dynamics365/business-central/ui-personalization-user)
- Microsoft Learn: [Customize pages for profiles](https://learn.microsoft.com/en-us/dynamics365/business-central/ui-personalization-manage)
- Microsoft Learn release plan: [Add more fields and columns by personalizing pages](https://learn.microsoft.com/en-us/dynamics365/release-plan/2025wave2/smb/dynamics365-business-central/add-more-fields-columns-personalizing-pages)

## Projektwirkung

Aktualisiert:

- `BC-PLAYWRIGHT-PATTERNS.md`
- `MICROSOFT-DOC-VALIDATION.md`
- `WORKAROUNDS-AND-ERRORS.md`
- Buchkapitel 37 im Master-Blueprint

Keine BC-Ausfuehrung, keine Setup-Aenderung, keine Buchung, kein Company-Wechsel.
