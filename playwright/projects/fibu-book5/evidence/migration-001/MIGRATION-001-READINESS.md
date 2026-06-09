# MIGRATION-001 Readiness

Status: `labor`, `book-sync`, `read-only`, `no-posting`, `no-setup-change`, `no-import`, `no-new-company`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Buchkapitel | Kapitel 28 Migration, Opening Balances und Cutover |
| Arbeitstyp | Buch-/Zielbild-Sync ohne BC-Lauf |
| BC-Ausfuehrung | nein |
| Datenmigration | nein |
| Import | nein |
| Opening-Balance-Buchung | nein |
| Neue Company | nein |

## Was geprueft wurde

Dieser Lauf gleicht Kapitel 28 gegen den aktuellen Evidence-Stand ab. Praktisch vorhanden sind im Labor bereits:

- Stammdaten- und Prozess-Evidence fuer `RM-DEMO`.
- O2C-Laborbuchung `PS-INV103297`.
- P2P-Laborbuchung `108219`.
- kontrollierter Trainings-/Opening-Balance-Zugang `INV008-899959`.
- Gate-Disziplin fuer neue Companies, Wiederholungsbuchungen, Zahlungen, VAT, Security und Setup.

Dieser Lauf hat bewusst keine Daten importiert und keine Salden gebucht. Kapitel 28 beschreibt damit das Zielbild fuer einen spaeteren Migrations-/Cutover-Test, nicht einen ausgefuehrten Migrationstest in `RM-DEMO`.

## Anfaenger-Lernwert

Migration ist kein einzelner Klick auf `Import`. Ein Einsteiger muss drei Ebenen auseinanderhalten:

1. Stammdatenmigration: Debitoren, Kreditoren, Artikel, Sachkonten, Dimensionen und Bankkonten muessen fachlich bereinigt und gemappt werden.
2. Opening Balances: Anfangssalden sind Buchungslogik. Sie erzeugen Posten und muessen gegen Nebenbuecher, Sachkonten, Lagerbewertung und Bank abgestimmt werden.
3. Cutover: Der Produktivstart braucht Freeze, Export, Import, Validierung, Freigabe und Rueckfallplan.

`INV008-899959` ist fuer das aktuelle Labor nur ein kontrollierter Trainings-/Opening-Balance-Zugang fuer `RM-M100`. Er beweist, wie ein Artikeljournal Bestand und Wert erzeugt. Er ist kein produktiver Opening-Balance-Endstand und kein deutscher Cutover-Nachweis.

## Microsoft-Learn-Abgleich

Microsoft Learn beschreibt Configuration Packages als Werkzeug fuer Setup- und Migrationsdaten. Wichtig fuer das Buch:

- Configuration Packages koennen Setup- und Stammdatentabellen buendeln.
- Posted Entries sollen nicht als Paketdaten importiert werden; gebuchte Posten entstehen ueber Journale oder Belege.
- Fuer Import/Export sind direkte Berechtigungen noetig.
- Schema, Tabellen, Felder und Primaerschluessel muessen zur Zielumgebung passen.

Quellen:

- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/set-up-standard-company-configuration-packages
- https://learn.microsoft.com/en-ca/dynamics365/business-central/across-import-data-configuration-packages

## Buchwirkung

Kapitel 28 wurde so eingeordnet, dass `RM-DEMO` keine produktive Migration simuliert. Die Schrittfolge bleibt fachlich richtig, wird aber als Zielbild markiert:

- Erst Datenqualitaet und Mapping.
- Dann Testimport nur in freigegebenem Kontext.
- Opening Balances nur mit Journal-/Posting-Freigabe.
- Cutover nur mit Freigabe, Abstimmung und Rueckfallplan.

## Grenzen

- Kein Migration Package wurde angelegt.
- Keine Excel-Datei wurde exportiert oder importiert.
- Keine Opening-Balance-Buchung wurde erzeugt.
- Keine neue Company wurde angelegt.
- Kein deutscher Finalnachweis fuer Migration, Salden oder Cutover.

## Naechster Schritt

Ohne Gate: `INTEGRATIONS-001-READINESS` als Kapitel-29-Buch-/Zielbild-Sync vorbereiten. Keine Extension installieren, keine API-/Connector-Einrichtung, kein Power-Platform-/Power-BI-Setup und kein produktiver Integrationslauf.

Mit Gate: spaeter einen UI-first Migrations-Readiness-Lauf fuer Configuration Packages planen, aber erst nach ausdruecklicher Freigabe und ohne Import in Produktiv- oder Fremdmandanten.
