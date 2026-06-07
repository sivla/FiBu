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
| nächster blockierender Meilenstein | `MASTERDATA-001` bis `MASTERDATA-007` |

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

Status:

- Debitor `D10000` und Artikel `RM-M100` wurden mit Playwright über die angemeldete Business-Central-Webclient-Session und die Standard-API angelegt.
- Evidence: `img/masterdata-005-customers-after-api.png`, `img/masterdata-005-items-after-api.png` und `playwright/projects/fibu-book5/evidence/masterdata-005/api-result.json`.
- Der API-Weg ist idempotent und löscht das beim ersten UI-Experiment entstandene leere Artefakt `C00010`, falls es ohne Anzeigename vorhanden ist.

Harte fachliche Grenze:

- `MASTERDATA-005` beweist Existenz, Name, Adresse, Kosten und Verkaufspreis.
- `MASTERDATA-005` beweist noch nicht Buchungsfähigkeit.
- Beim Erstlauf waren `Base Unit of Measure`, `Gen. Prod. Posting Group` und `Inventory Posting Group` sichtbar leer. Das war kein kosmetischer Fehler, sondern ein Buchungsblocker für `UAT-O2C-001`.
- Die Korrektur erfolgt in `MASTERDATA-006`, damit Stammdatenerzeugung und Posting-Fit getrennt prüfbar bleiben.

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

Status nach Testlauf:

- `MASTERDATA-006` ist als CRONUS-Technikfit grün.
- Debitor `D10000` trägt nach `Apply Template` die notwendige Customer-Posting-Grundlogik.
- Artikel `RM-M100` trägt `PCS`, `RETAIL`, `RESALE` und `FURNITURE`.
- Eine API-Probe kann einen Verkaufsauftrag mit Zeile `RM-M100`, Menge `1`, Preis `68.000`, Lagerort `FRA-ZL` erstellen und wieder löschen.
- Harte fachliche Grenze: Das ist noch kein deutscher Ziel-Fit mit `EUR` und `19 %` USt. Der aktuelle Probelauf nutzt CRONUS-USA-Steuerlogik; die API-Evidence zeigt `currencyCode = USD`, `taxCode = FURNITURE`, `taxPercent = 0`.

Update 07.06.2026:

- Per Playwright MCP wurde geprueft, dass `EUR` als Currency in BC existiert.
- Am Debitor `D10000` war `Currency Code` zunaechst leer; dadurch zog der Laborauftrag lokale CRONUS-USA-Waehrung.
- `D10000` wurde auf `Currency Code = EUR` gesetzt und nach Reload persistent nachgewiesen.
- Ein MCP-Gegencheck mit Verkaufsauftrag `S-ORD101051` bestaetigte: neue Auftraege fuer `D10000` zeigen `Currency Code: EUR` und EUR-Summenfelder.
- Der Laborauftrag `S-ORD101051` wurde per UI wieder geloescht. Die USt-Logik `19 %` ist dadurch noch nicht geloest.

Update Steuerlogik per MCP:

- Ein weiterer MCP-Lauf mit `S-ORD101052` bestaetigte: Kopf und Zeile koennen `D10000`, `RM-M100`, Menge `1` und `Currency Code: EUR` zeigen.
- Der Zeilenkontext zeigt aber `Tax Area Code` leer und `Tax Group Code = FURNITURE`.
- MCP oeffnete die Steuerseiten `Tax Groups` Page 467, `Tax Details` Page 468, `Tax Areas` Page 469, `VAT Business Posting Groups` Page 470 und `VAT Product Posting Groups` Page 471.
- Die sichtbare Laborsteuerlogik ist US Sales Tax, nicht deutsche USt. Beispiel: `Tax Details` enthaelt GA/FURNITURE mit `Tax Below Maximum 3,0`, nicht `19 %`.
- Direkter MCP-Quercheck Page 472 oeffnete `VAT Posting Setup` / `Tax Posting Setup`; die zugehoerige Card Page 473 zeigt `VAT Calculation Type = Sales Tax`.
- Konsequenz: `EUR` ist fuer `D10000` geloest; `19 %` bleibt fuer den deutschen Zielmandanten oder ein explizites deutsches VAT-Setup offen.

Update Steuerherkunft per MCP:

- MCP oeffnete die Artikelkarte `RM-M100` und bestaetigte im Bereich `Costs & Posting`: `Gen. Prod. Posting Group = RETAIL`, `Tax Group Code = FURNITURE`, `Inventory Posting Group = RESALE`.
- MCP oeffnete die Debitorenkarte `D10000` und bestaetigte im Bereich `Invoicing`: `Tax Liable` ist aktiv, `Tax Area Code` ist leer, `Gen. Bus. Posting Group = DOMESTIC`, `Customer Posting Group = DOMESTIC`, `Currency Code = EUR`.
- Evidence: `playwright/projects/fibu-book5/evidence/mcp-tax-origin/tax-origin-mcp-summary.json`.
- Lernregel: Die Verkaufszeile erbt ihre Sales-Tax-Produktlogik aus dem Artikel. Der Debitor liefert die Geschaefts-/Debitorenbuchungslogik und die Waehrung. Ein leerer `Tax Area Code` plus `FURNITURE` ist kein deutscher 19-%-USt-Nachweis.

### `MASTERDATA-007`: Standarddimensionen für O2C setzen

Ziel:

- Artikel `RM-M100` bekommt `PRODUCTLINE = MACHINE`.
- Debitor `D10000` bekommt `CHANNEL = B2B`.
- Beide Werte werden mit `Same Code` gepflegt, damit der spätere Beleg nicht beliebige Werte durchlässt.

Status nach Testlauf:

- `MASTERDATA-007` ist als API-/Evidence-Nachweis grün.
- Evidence liegt unter `playwright/projects/fibu-book5/evidence/masterdata-007/`.
- Laborbilder liegen unter `img/masterdata-007-*`.
- Harte Grenze: Die Daten sind persistent nachgewiesen, aber ein gutes Buchbild des eigentlichen Dialogs `Default Dimensions` fehlt noch.

### `UAT-O2C-001`: erster Verkaufsauftrag als Lern- und Laborlauf

Ziel:

- Verkaufsauftragsliste öffnen.
- Auftragskopf mit `D10000` sichtbar machen.
- Verkaufszeile `RM-M100`, Menge `1`, Lagerort `FRA-ZL`, Preis `68.000` sichtbar machen.
- Zielmodell `EUR` / `19 %` / `80.920` gegen CRONUS-Labor vergleichen.
- Entwurfsauftrag nach dem Screenshot wieder entfernen.

Status nach Testlauf:

- `UAT-O2C-001` ist als Klickpfad bis zur Zeile grün.
- Laborbilder liegen unter `img/uat-o2c-001-*`.
- Evidence liegt unter `playwright/projects/fibu-book5/evidence/uat-o2c-001/`.
- `045-target-vs-labor-delta.md` zeigt die harte Setup-Grenze: Ziel `EUR` / `19 %` / `80.920`, Labor `USD` / `0 %` / `68.000`.
- Dieselbe Evidence zeigt jetzt auch: `CHANNEL = B2B` und `PRODUCTLINE = MACHINE` sind im Dimensionsdialog der Verkaufszeile nachgewiesen.
- `999-cleanup.json` beweist, dass der Laborauftrag nach dem Screenshot entfernt wurde.

Lernentscheidung:

Der Lauf ist für Anfänger wertvoll, weil er zeigt, dass ein Auftrag technisch laufen kann, obwohl Steuer- und Währungssetup fachlich noch nicht passen. Das Buch muss deshalb Klickpfad, Labor-Evidence und deutschen Ziel-Endstand sauber trennen.

Dimensionsentscheidung:

- Standarddimensionen an Artikel und Debitor sind Voraussetzung, aber kein vollstaendiger Prozessnachweis.
- `UAT-O2C-001` weist `PRODUCTLINE = MACHINE` jetzt im Verkaufszeilen-Dimensionsdialog nach.
- Der naechste fachliche Ausbau muss dieselbe Dimension nach dem Buchen in Sachposten oder Reporting wiederfinden.

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
