# Rhein-Main-Stammdatenaufbau für Buch 5

Diese Datei ist die harte Projektentscheidung für den nächsten Arbeitsblock.

## Brutale Consultant-Diagnose

Die im Buch verwendeten Rhein-Main-Stammdaten existieren in der aktuellen Business-Central-Spielwiese nicht. `RM-DEMO` ist eine CRONUS-basierte Trainingscompany. Damit können wir Navigation, Screenshots, Login und BC-Grundverhalten lernen. Für fachliche Buchtests reicht das nicht.

Wenn wir jetzt `UAT-O2C-001` buchen würden, hätten wir drei Probleme:

1. Debitor `D10000` existiert nicht.
2. Artikel `RM-M100` existiert nicht.
3. Dimensionen, Lagerorte, Buchungsgruppen und USt-Logik passen nicht zum Buch.

Das Ergebnis wäre kein Rhein-Main-Test, sondern ein hübscher Screenshot mit falscher Datenbasis.

## Zielbild für den ersten belastbaren Buchlauf

Wir bauen zuerst einen **Mindestdatenstand Rhein-Main in `RM-DEMO`**.

Warum nicht sofort alle Companies?

- Das Buch beschreibt fachlich mehrere Companies: `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED`, `RM-AT`.
- Für die ersten Lern- und Screenshotläufe ist eine konsolidierte Trainingscompany schneller, stabiler und didaktisch sauberer.
- Echte Mehr-Company-/Intercompany-Fälle kommen später als eigener Block.
- O2C, P2P, Lager, Dimensionen und Posting können in `RM-DEMO` zuerst verstanden und bebildert werden.

Projektentscheidung:

| Entscheidung | Wert |
|---|---|
| technische Startcompany | `RM-DEMO` |
| fachliches Modell | Rhein-Main Mindestdatenstand |
| echte Mehr-Company-Struktur | späterer Ausbau |
| nächster blockierender Meilenstein | `MASTERDATA-001` bis `MASTERDATA-006` |

## Reihenfolge

Business Central muss in der richtigen Reihenfolge aufgebaut werden. Sonst entstehen später Daten, die sich nur mit Gutschriften, Korrekturen oder Neuaufbau sauber reparieren lassen.

| Reihenfolge | Bereich | Warum zuerst? |
|---:|---|---|
| 1 | Dimensionen und Dimensionswerte | werden an Debitoren, Artikeln und Posten gebraucht |
| 2 | Lagerorte | werden an Artikeln und Belegen gebraucht |
| 3 | Buchungsgruppen prüfen/ableiten | steuern Kontenfindung und Steuerlogik |
| 4 | Debitoren | liefern Zahlungs-, Steuer- und Dimensionlogik |
| 5 | Kreditoren | für P2P und Dropshipping |
| 6 | Artikel | brauchen Buchungsgruppen, Kosten, Preise, Lagerlogik |
| 7 | Ressourcen/Anlagen/Projekte | für spätere Kapitel |
| 8 | Preise und Standarddimensionen | machen Belege wiederholbar |
| 9 | Setup-Fit-Test | prüft, ob Buchungsvorschau plausibel ist |
| 10 | `UAT-O2C-001` | erster echter Buchprozess |

## Meilensteine

### `MASTERDATA-001`: Datenmodell und Seiten prüfen

Ziel:

- relevante BC-Seiten öffnen
- Ist-Stand als Screenshots/Text sichern
- Buch-/BC-Lücken dokumentieren

Status:

- vorbereitet
- nicht ausreichend als fachlicher Test, weil Stammdaten fehlen

### `MASTERDATA-002`: Dimensionen aufbauen

Mindestumfang:

- `PRODUCTLINE = MACHINE`
- `CHANNEL = B2B`
- `DEPARTMENT = SALES`
- `LOCATION-GROUP = DIRECTED`

Späterer Vollumfang:

- alle Dimensionen aus Kapitel 7 und 10

Status 31.05.2026:

- Testlauf `npm run fibu:masterdata:dimensions` bestanden.
- Dimensionen angelegt: `PRODUCTLINE`, `CHANNEL`, `LOCATION-GROUP`.
- Dimension `DEPARTMENT` existierte bereits in CRONUS und wurde bewusst wiederverwendet.
- Fehlversuch `LINE` aus einem früheren Grid-Fokus-Lauf wurde geprüft; im finalen Lauf war kein Cleanup mehr erforderlich.
- Evidence: `img/masterdata-002-dimensions-rhein-main.png` und `playwright/projects/fibu-book5/evidence/masterdata-002/`.

Nächster Schritt:

- Dimensionswerte anlegen: `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `DEPARTMENT=SALES`, `LOCATION-GROUP=DIRECTED`.

Status 31.05.2026:

- Testlauf `npm run fibu:masterdata:dimension-values` bestanden.
- Dimensionswerte persistent nachgewiesen: `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `DEPARTMENT=SALES`, `LOCATION-GROUP=DIRECTED`.
- Evidence: `img/masterdata-003-dimension-values-rhein-main.png` und `playwright/projects/fibu-book5/evidence/masterdata-003/`.

Technischer Befund:

- Die `Dimension Values`-Liste gibt sichtbare Werte nicht zuverlässig über `innerText` aus.
- Der Test prüft deshalb Grid-/Input-Werte und öffnet die Seite erneut.
- Für Buch und UAT gilt: Sichtbar im Screenshot reicht nicht; nach Reload wiedergefunden ist belastbar.

### `MASTERDATA-004`: Lagerorte aufbauen

Mindestumfang:

- `FRA-ZL`

Späterer Vollumfang:

- `MZ-EINFACH`
- `VAN-SERV`
- `PROJ-LAG`

Status 31.05.2026:

- Testlauf `npm run fibu:masterdata:locations` bestanden.
- Lagerort `FRA-ZL` mit Name `Frankfurt Zentrallager` wurde angelegt.
- Evidence: `img/masterdata-004-locations-rhein-main.png` und `playwright/projects/fibu-book5/evidence/masterdata-004/`.

Projektentscheidung:

- `FRA-ZL` wird für den ersten O2C-Fit zunächst als einfacher Lagerort angelegt.
- Gesteuerte Lagerlogik, Lagerplätze, Warehouse Receipts/Picks und Warehouse Employees werden später im Warehouse-Block aktiviert und getestet.
- Grund: Wenn `FRA-ZL` sofort als gesteuertes Lager konfiguriert wird, verändert sich der O2C-Klickpfad massiv. Das ist fachlich richtig für Warehouse-Schulung, aber zu früh für den ersten Verkaufsauftrag.

### `MASTERDATA-005`: Debitor und Artikel für O2C aufbauen

Mindestumfang:

- Debitor `D10000`
- Artikel `RM-M100`
- Standarddimensionen
- Preis `68.000 EUR`
- Kosten `42.000 EUR`
- Lagerortbezug `FRA-ZL`

### `MASTERDATA-006`: Posting-Fit prüfen

Ziel:

- Customer Posting Group vorhanden
- Gen. Business Posting Group vorhanden
- VAT Business Posting Group vorhanden
- Gen. Product Posting Group für Maschine vorhanden oder passend abgeleitet
- VAT Product Posting Group für `19 %` vorhanden
- Inventory Posting Group vorhanden
- General Posting Setup vollständig
- VAT Posting Setup ergibt `19 %`
- Inventory Posting Setup für `FRA-ZL` vollständig

Erst wenn dieser Schritt grün ist, darf `UAT-O2C-001` gebucht werden.

## Was ins Buch muss

Das Buch muss klarer sagen, dass die Rhein-Main-Daten nicht automatisch in einer nackten CRONUS-Instanz vorhanden sind.

Ergänzungsbedarf:

- `RM-DEMO` als technische Trainingscompany erklären.
- Mindestdatenstand vor erstem Prozess einführen.
- Stammdatenaufbau als eigener vorbereitender Klickpfad.
- O2C-Voraussetzungen schärfen: Debitor, Artikel, Lagerort, Dimensionen, Posting-Setup.
- Wenn ein Leser mit nacktem CRONUS startet, muss er wissen, welche Daten vorher anzulegen sind.

## Tool-Entscheidung

Für Buchscreenshots bleibt Playwright führend. Für Massendaten ist die UI jedoch langsam und fragil.

Empfehlung:

| Aufgabe | Werkzeug |
|---|---|
| sichtbare Klickanleitung | Playwright über BC-UI |
| wenige didaktische Stammdaten | Playwright über BC-UI |
| viele Stammdaten | später Konfigurationspakete oder API prüfen |
| Nachweis-Screenshots | Playwright |
| Buchaktualisierung | Markdown |

Für den ersten Lauf legen wir die Mindestdaten bewusst über die UI an, weil der Leser dadurch Business Central lernt. Für spätere Wiederholbarkeit kann ein Importweg ergänzt werden.
