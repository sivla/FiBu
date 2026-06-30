# Permission Blockers

## Aktueller Status

Der fruehere Rechteblocker ist fuer TARGET-009 nicht mehr aktiv. `UNIVERSAARL-DE` ist in `playthru` ueber den gefuehrten Assistenten sichtbar geworden.

Status:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: Universaarl GmbH
- Case: `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE`
- Status: `done`
- Verwendeter Pfad: `Mandanten` -> Pfeil neben `Neu` -> `Neues Unternehmen erstellen` -> `Neu erstellen - Keine Daten`
- Weiterhin verboten: `Kopieren`, `Testunternehmen`, CRONUS-/Demo-Kopie, API-Abkuerzung
- Naechster Case: `TARGET-010-UNIVERSAARL-COMPANY-CONTEXT-PROOF`

Der naechste Schritt ist kein weiterer Company-Creation-Versuch. Zuerst wird `UNIVERSAARL-DE` bewusst geoeffnet oder als aktiver Company-Kontext sichtbar gemacht. Danach wird die Seite `Unternehmensinformationen` read-only geprueft.

## Historischer Blocker

`UNIVERSAARL-DE` kann noch nicht erstellt werden, weil aktuell keine ausreichenden Business-Central-Rechte für Company Creation vorhanden sind.

Status:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: Universaarl GmbH
- Case: `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE`
- Status: `parked-until-super-permissions`
- Blocker: `missing-super-or-company-create-permission`

Das ist kein fachlicher Beweis, dass der Business-Central-Weg falsch ist. Es ist ein Berechtigungsblocker.

## Warum wir nicht tricksen

Company Creation ist eine wirksame administrative Aktion. Sie darf nicht durch CRONUS-Kopie, Testunternehmen, API-Abkürzung oder einen unsauberen Wizard-Abschluss ersetzt werden.

Für das Buch ist wichtig: Die Universaarl GmbH soll als eigene Musterfirma sauber entstehen. Demodaten dürfen nicht unbemerkt zur Zielbasis werden, weil sie Stammdaten, Konten, Buchungslogik und Beispiele vorwegnehmen.

## Quellenbasis

Microsoft Learn ist die primäre Quelle für Business-Central-Produktverhalten:

- [Create new companies in Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company)
- [Set up Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/setup)
- [Business functionality supported by Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/across-business-functionality)
- [Administer Business Central online](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/tenant-admin-center)
- [Dynamics 365 Implementation Guide](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/overview)
- [Success by Design](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design)

Die daraus abgeleiteten Regeln für dieses Projekt:

- Eine Company ist der Arbeitsbereich für Business-Daten einer Organisationseinheit oder rechtlichen Einheit.
- Für Company Creation sind ausreichende Berechtigungen erforderlich; im Projekt wird bis zur Rechtefreigabe nicht weiter live gespeichert.
- Datenbasis-Optionen wie Sample Data, Setup Data Only oder No Data müssen getrennt bewertet werden.
- Copy Company ist eine eigene Funktion und nicht automatisch die Zielbasis für Universaarl.
- Setup Data Only oder No Data sind die Kandidaten für eine saubere Musterfirma, wenn die UI diese Route eindeutig erlaubt.

## Was erlaubt bleibt

Bis zur Rechtefreigabe bleibt produktive Read-only- und Repo-Arbeit erlaubt:

- Companies Page ansehen
- My Settings ansehen
- Actions inventarisieren
- Tooltips erfassen
- UI erklären
- Quellen prüfen
- Buchtexte vorbereiten
- Playwright-Read-only-Tests verbessern
- Atlanten und Coverage pflegen
- Look and Feel dokumentieren
- Daten- und Usecase-Pläne vorbereiten
- Buchmaster kuratieren
- Repo-Qualität verbessern
- Umlaute und Encoding prüfen
- Queue verbessern

## Was warten muss

Bis zur Rechtefreigabe warten:

- `UNIVERSAARL-DE` erstellen
- Company Information in `UNIVERSAARL-DE`
- Foundation Setup in `UNIVERSAARL-DE`
- Stammdaten in `UNIVERSAARL-DE`
- operative Prozess-Evidence in `UNIVERSAARL-DE`
- Preview Posting, Posting und Payment in `UNIVERSAARL-DE`

## Unblock-Kriterium

Der Nutzer bestätigt, dass SUPER-Rechte oder ausreichende Company-Creation-Rechte vorhanden sind.

Danach:

1. State prüfen.
2. Permission Blocker auf `resolved` setzen.
3. `TARGET-009` oder einen besseren Company-Creation-Case reaktivieren.
4. Smart Decision Card schreiben.
5. `playthru` öffnen.
6. Seite `Mandanten` öffnen.
7. Prüfen, dass `UNIVERSAARL-DE` noch nicht vorhanden ist.
8. UI-first Company Creation über den Pfeil neben `Neu` und den Menüeintrag `Neues Unternehmen erstellen`.
9. Sichtbaren Save-Erfolg oder exakten Fehler erfassen.
10. Danach Sample-Data-Check.
11. Danach Company Information.
12. Danach Foundation.

Vor Schritt 8 muss die Checkliste `READY-FOR-SUPER-PERMISSIONS-CHECKLIST.md` erfüllt sein. Besonders wichtig sind:

- OQ-0001: Hauptbutton `Neu`, Dropdown-Pfeil und Menüeintrag `Neues Unternehmen erstellen` getrennt prüfen.
- OQ-0005: Datenbasis nicht unklar bestaetigen; keine CRONUS-/Testunternehmen-/Sample-Data-Route als finale Universaarl-Basis verwenden.
- OQ-0007: alte Debugging-Screenshots nicht als erfolgreiche Company-Creation-Bilder nutzen.

Der kompakte Startpunkt für den ersten Lauf nach Rechtefreigabe ist `UNIVERSAARL-SUPER-PERMISSION-RESUME-RUNBOOK.md`. Dieses Runbook verbindet Permission-Checkliste, TARGET-009 und das W1 Foundation Gate in einer Reihenfolge.
