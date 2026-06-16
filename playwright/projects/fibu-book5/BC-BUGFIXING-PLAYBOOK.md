# Business Central Bugfixing Playbook

Stand: 16.06.2026

Zweck: Dieses Playbook sammelt die wiederverwendbare Fehleranalyse-Denkweise fuer FiBu Buch 5. Es ist kein Ersatz fuer Fall-Evidence, sondern die Checkliste, bevor ein Fehler vorschnell als Buchfehler, Playwright-Fehler oder BC-Fehler gewertet wird.

## Grundregel

Wenn in Business Central etwas nicht funktioniert, zuerst die Fehlerklasse bestimmen. Nicht sofort weiterklicken und nicht sofort Daten oder Rechte aendern.

| Ebene | Leitfrage | Typische Werkzeuge |
|---|---|---|
| Oberflaeche | Ist Feld, Spalte oder Aktion sichtbar, ausgeblendet oder personalisiert? | Personalisieren, Rollen/Profil, Screenshot-QA |
| Page / Tabelle | Auf welcher Page und Source Table bin ich wirklich? | Page Inspection / `Ctrl+Alt+F1` |
| Berechtigung | Darf der User Page, Tabelle, Aktion oder Codeunit ausfuehren? | Users, Permission Sets, Effective Permissions, Permission Recorder, Permission Error Telemetry |
| Stammdaten | Fehlt ein Kunde, Kreditor, Artikel, Bankkonto, Lagerort, Anlage oder eine Nummernserie? | Karten/Listen, Masterdata-Backlog, Setup-Readiness-Matrix |
| Prozessstatus | Ist der Beleg offen, freigegeben, gebucht, storniert oder gesperrt? | Belegkarte, Statusfeld, Related Entries |
| Buchungslogik | Fehlt eine Posting Group, ein Konto, VAT/Tax Setup, Dimension oder Wechselkurs? | Preview Posting, Journal Check, Posting Setup Pages |
| Extension | Kommt Verhalten aus Standard-BC oder App/Customization? | Page Inspection, Extension Management, Event Recorder |
| Daten / Filter | Sieht der User wegen Filter, Security Filter oder Company-Kontext nichts? | Filterleiste, Page Inspection, Company Registry |
| Integration / Hintergrund | Kommt der Fehler aus API, Power Automate, Job Queue, E-Mail, Bank oder EDI? | Job Queue Entries, Job Queue Log Entries, Telemetry, Webservice-Telemetry |
| Performance | Ist es ein fachlicher Fehler oder langsames Laden/Blockieren? | FactBoxes ausblenden, Filter setzen, Page View Telemetry, Performance-Troubleshooting |

## Standardablauf fuer Fehleranalyse

1. Fehler exakt aufnehmen: Screenshot, Fehlermeldung, User, Company, Page, Aktion, Zeitpunkt.
2. Reproduzierbarkeit pruefen: gleicher User, anderer User, andere Company, anderer Browser, Sandbox/CRONUS.
3. Page technisch klaeren: Page Inspection, Page ID, Source Table, Felder, Filter, Extensions.
4. UI-Sichtbarkeit klaeren: Personalisieren, Ansichten, Rolle/Profil, Sprache, Berechtigung.
5. Daten pruefen: Stammdaten, Kopf-/Zeilenfelder, Status, Nummernserie, Datum, Waehrung.
6. Buchungslogik pruefen: Posting Groups, VAT/Tax, Inventory, Bank, Dimensionen, Konten.
7. Rechte pruefen: Permission Sets, Effective Permissions, Permission Recorder oder Telemetry.
8. Hintergrund pruefen: Job Queue, Integration, Telemetry, Extension-Updates, Performance.
9. Ergebnis dokumentieren: Ursache, Workaround, dauerhafte Loesung, Testfall, Buchwirkung.

## Kopf-/Zeilenlogik bei Belegen

Bei Sales Orders, Purchase Orders, Journals und vielen anderen BC-Prozessen entstehen Fehler oft aus der Kombination von Kopf, Zeile und Setup.

| Bereich | Beispiele |
|---|---|
| Kopf | Customer/Vendor, Posting Date, Currency, Payment Terms, Gen. Bus. Posting Group, VAT Bus. Posting Group |
| Zeile | Type, No., Quantity, Unit Price, Location Code, Gen. Prod. Posting Group, VAT Prod. Posting Group |
| Setup | General Posting Setup, VAT/Tax Posting Setup, Inventory Posting Setup, Customer/Vendor/Bank Posting Group |
| Dimensionen | Header-Dimension, Stammdaten-Default-Dimension, Zeilendimension, Pflichtdimension |

Merksatz: Wenn Buchen nicht geht, ist es selten nur die Page. Sehr oft fehlt Setup aus der Kombination Kopf plus Zeile plus Posting Matrix.

## Ticket- und Handover-Vorlage

```md
Fehlerbild:
- Umgebung:
- Company:
- User/Rolle/Profil:
- Page:
- Page ID:
- Source Table:
- Aktion:
- Erwartetes Verhalten:
- Tatsaechliches Verhalten:
- Fehlermeldung:
- Repro-Schritte:
- Stammdaten/Beleg:
- Posting Groups / Dimensionen / VAT:
- Extension-Hinweis:
- Screenshot/Evidence:
- Vermutete Fehlerklasse:
- Naechster Test:
```

## Projektregel

Fuer Buch- und Klickanleitungsarbeit wird jeder relevante Fehler als Lernfall behandelt. Erst wenn Fehlerklasse, sichtbarer Befund, Ursache und Grenze dokumentiert sind, wird entschieden, ob Buchtext, Testdaten, Setup, Playwright-Helper oder ein Workaround angepasst werden.
