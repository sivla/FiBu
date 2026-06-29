# Permission Blockers

## Aktueller Blocker

`UNIVERSAARL-DE` kann noch nicht erstellt werden, weil aktuell keine ausreichenden Business-Central-Rechte fuer Company Creation vorhanden sind.

Status:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: Universaarl GmbH
- Case: `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE`
- Status: `parked-until-super-permissions`
- Blocker: `missing-super-or-company-create-permission`

Das ist kein fachlicher Beweis, dass der Business-Central-Weg falsch ist. Es ist ein Berechtigungsblocker.

## Warum wir nicht tricksen

Company Creation ist eine wirksame administrative Aktion. Sie darf nicht durch CRONUS-Kopie, Testunternehmen, API-Abkuerzung oder einen unsauberen Wizard-Abschluss ersetzt werden.

Fuer das Buch ist wichtig: Die Universaarl GmbH soll als eigene Musterfirma sauber entstehen. Demodaten duerfen nicht unbemerkt zur Zielbasis werden, weil sie Stammdaten, Konten, Buchungslogik und Beispiele vorwegnehmen.

## Quellenbasis

Microsoft Learn ist die primaere Quelle fuer Business-Central-Produktverhalten:

- [Create new companies in Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company)
- [Set up Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/setup)
- [Business functionality supported by Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/across-business-functionality)
- [Administer Business Central online](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/tenant-admin-center)
- [Dynamics 365 Implementation Guide](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/overview)
- [Success by Design](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design)

Die daraus abgeleiteten Regeln fuer dieses Projekt:

- Eine Company ist der Arbeitsbereich fuer Business-Daten einer Organisationseinheit oder rechtlichen Einheit.
- Fuer Company Creation sind ausreichende Berechtigungen erforderlich; im Projekt wird bis zur Rechtefreigabe nicht weiter live gespeichert.
- Datenbasis-Optionen wie Sample Data, Setup Data Only oder No Data muessen getrennt bewertet werden.
- Copy Company ist eine eigene Funktion und nicht automatisch die Zielbasis fuer Universaarl.
- Setup Data Only oder No Data sind die Kandidaten fuer eine saubere Musterfirma, wenn die UI diese Route eindeutig erlaubt.

## Was erlaubt bleibt

Bis zur Rechtefreigabe bleibt produktive Read-only- und Repo-Arbeit erlaubt:

- Companies Page ansehen
- My Settings ansehen
- Actions inventarisieren
- Tooltips erfassen
- UI erklaeren
- Quellen pruefen
- Buchtexte vorbereiten
- Playwright-Read-only-Tests verbessern
- Atlanten und Coverage pflegen
- Look and Feel dokumentieren
- Daten- und Usecase-Plaene vorbereiten
- Buchmaster kuratieren
- Repo-Qualitaet verbessern
- Umlaute und Encoding pruefen
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

Der Nutzer bestaetigt, dass SUPER-Rechte oder ausreichende Company-Creation-Rechte vorhanden sind.

Danach:

1. State pruefen.
2. Permission Blocker auf `resolved` setzen.
3. `TARGET-009` oder einen besseren Company-Creation-Case reaktivieren.
4. Smart Decision Card schreiben.
5. `playthru` oeffnen.
6. Seite `Mandanten` oeffnen.
7. Pruefen, dass `UNIVERSAARL-DE` noch nicht vorhanden ist.
8. UI-first Company Creation ueber `Neu` / `Neues Unternehmen erstellen`.
9. Sichtbaren Save-Erfolg oder exakten Fehler erfassen.
10. Danach Sample-Data-Check.
11. Danach Company Information.
12. Danach Foundation.

Vor Schritt 8 muss die Checkliste `READY-FOR-SUPER-PERMISSIONS-CHECKLIST.md` erfuellt sein. Besonders wichtig sind:

- OQ-0001: Hauptbutton `Neu`, Dropdown-Pfeil und `Neues Unternehmen erstellen` getrennt pruefen.
- OQ-0005: Datenbasis nicht unklar bestaetigen; keine CRONUS-/Testunternehmen-/Sample-Data-Route als finale Universaarl-Basis verwenden.
- OQ-0007: alte Debugging-Screenshots nicht als erfolgreiche Company-Creation-Bilder nutzen.
