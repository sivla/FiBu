# MASTERDATA-001 Audit-Ergebnis

Stand: 31.05.2026

## Ergebnis

Der korrigierte Audit hat echte Business-Central-Seiten über direkte Page-IDs geöffnet. Ergebnis: `RM-DEMO` enthält CRONUS-Daten, aber nicht die Rhein-Main-Stammdaten aus dem Buch.

Damit ist bestätigt:

- `UAT-O2C-001` darf noch nicht vollständig gebucht werden.
- Zuerst müssen Rhein-Main-Dimensionen, Lagerorte, Debitoren, Artikel und Posting-Fit aufgebaut werden.
- Die bisherigen CRONUS-Daten können als Vorlage und technischer Unterbau dienen, ersetzen aber nicht die Buchdaten.

## Audit-Lauf

```text
npm run fibu:audit:data
```

Ergebnis:

```text
7 passed
```

Geöffnete Seiten:

| Seite | Page-ID | Ergebnis |
|---|---:|---|
| Customers | 22 | geöffnet |
| Items | 31 | geöffnet |
| Locations | 15 | geöffnet |
| Dimensions | 536 | geöffnet |
| General Posting Setup | 314 | geöffnet |
| Tax/VAT Posting Setup | 472 | geöffnet |
| Inventory Posting Setup | 5826 | geöffnet |

## Wesentliche Lücken

### Debitoren

Ist:

- CRONUS-Debitoren wie `10000 Adatum Corporation`, `20000 Trey Research`, `30000 School of Fine Art`.

Soll:

- `D10000 Müller Maschinenbau GmbH`
- `D11000 Handwerk24 Onlinekunde`
- `D20000 Alpha Machines SAS`
- `D30000 SwissTech AG`
- `D90000 RM-SALES GmbH IC`

Bewertung:

Debitoren müssen angelegt werden. CRONUS-Debitoren sind für die Rhein-Main-Fallstudie fachlich falsch.

Aufbau-Befund aus `MASTERDATA-005`:

- `D10000 Müller Maschinenbau GmbH` wurde über Playwright als angemeldeten Träger und die Business-Central-API angelegt.
- Der Debitor ist in der Customers-Liste sichtbar und per Evidence dokumentiert.
- Screenshot: `img/masterdata-005-customers-after-api.png`.
- API-Nachweis: `playwright/projects/fibu-book5/evidence/masterdata-005/api-result.json`.

### Artikel

Ist:

- CRONUS-Möbel-/Büroartikel wie `1900-S`, `1906-S`, `1920-S`.

Soll:

- `RM-M100`
- `RM-X500`
- `SP-PUMP-01`
- `SP-SENSOR-02`
- `RAW-STEEL`
- `COMP-CTRL`
- `KIT-MAINT`

Bewertung:

Artikel müssen angelegt werden. Bestehende CRONUS-Artikel können höchstens als technische Vorlage für Felder und Posting Groups dienen.

Aufbau-Befund aus `MASTERDATA-005`:

- `RM-M100 Standardmaschine M100` wurde über Playwright als angemeldeten Träger und die Business-Central-API angelegt.
- Kosten und Verkaufspreis sind sichtbar nachgewiesen: `42.000 / 68.000`.
- Harte Grenze: `Base Unit of Measure`, `Gen. Prod. Posting Group` und `Inventory Posting Group` sind im aktuellen Item-Card-Nachweis leer. Der Artikel existiert, ist aber noch nicht O2C-buchungsfähig.
- Screenshot: `img/masterdata-005-items-after-api.png`.
- API-Nachweis: `playwright/projects/fibu-book5/evidence/masterdata-005/api-result.json`.

### Lagerorte

Ist:

- `EAST`
- `MAIN`
- `OUT. LOG.`
- `OWN LOG.`
- `SILVER`
- `WEST`
- `WHITE`
- `YELLOW`

Soll:

- `FRA-ZL`
- `MZ-EINFACH`
- `VAN-SERV`
- `PROJ-LAG`

Bewertung:

Lagerorte müssen angelegt werden. Für `FRA-ZL` muss später entschieden werden, ob wir sofort gesteuerte Lagerlogik aktivieren oder erst einen einfachen Trainingslagerort verwenden.

Aufbau-Befund aus `MASTERDATA-004`:

- `FRA-ZL` wurde als Lagerort mit Name `Frankfurt Zentrallager` angelegt.
- Für den ersten O2C-Fit wurde noch keine gesteuerte Warehouse-Logik aktiviert.
- Diese Entscheidung hält den ersten Verkaufsauftrag testbar; gesteuerte Einlagerung, Bins, Picks und Warehouse Employees werden später im Warehouse-Block geprüft.
- Evidence liegt unter `playwright/projects/fibu-book5/evidence/masterdata-004/`.

### Dimensionen

Ist:

- CRONUS-Dimensionswerte wie `EUROPE`, `AMERICA`, `HOME`, `INDUSTRIAL`, `ADM`, `PROD`, `SALES`.

Soll:

- `PRODUCTLINE = MACHINE`, `SPARE`, `RENTAL`, `SERVICE`
- `CHANNEL = B2B`, `SHOP`, `IC`, `SERVICE`, `PROJECT`
- `DEPARTMENT = SALES`, `PURCH`, `WHSE`, `PROD`, `SERV`, `FIN`, `ADMIN`
- `LOCATION-GROUP = DIRECTED`, `SIMPLE`, `VAN`, `PROJECT`, `DROP`
- optional `COMPANY-GROUP`

Bewertung:

Dimensionen müssen fachlich aufgebaut oder CRONUS-Dimensionen bewusst gemappt werden. Für das Buch ist ein expliziter Rhein-Main-Code besser als implizites CRONUS-Recycling.

Technischer Befund:

- Page `536` öffnet die Dimensions-Hauptseite.
- Page `560` öffnet die Dimension-Value-Liste und ist für den Dimensionen-Audit zu eng.
- Für Stammdatenaufbau wird `536` verwendet.

Aufbau-Befund aus `MASTERDATA-002`:

- `PRODUCTLINE`, `CHANNEL` und `LOCATION-GROUP` wurden über die BC-UI angelegt.
- `DEPARTMENT` war bereits vorhanden.
- Die Neuanlage funktioniert zuverlässig erst, wenn Playwright nach `Neu` innerhalb der Form `Neu - Dimensions` arbeitet.
- Evidence liegt unter `playwright/projects/fibu-book5/evidence/masterdata-002/`.

Aufbau-Befund aus `MASTERDATA-003`:

- Die Mindestwerte für den ersten O2C-Fall sind vorhanden: `MACHINE`, `B2B`, `SALES`, `DIRECTED`.
- `DEPARTMENT` enthielt bereits CRONUS-Werte; `SALES` wurde als vorhandener Wert bestätigt.
- Persistenz wurde nicht nur optisch, sondern durch erneutes Öffnen der `Dimension Values`-Seiten geprüft.
- Evidence liegt unter `playwright/projects/fibu-book5/evidence/masterdata-003/`.

### Posting Setup

Ist:

- CRONUS-Posting-Setup ist vorhanden.
- Inventory Posting Setup enthält Kombinationen für `MAIN`, `EAST`, `WEST` usw. und Gruppen wie `FINISHED`, `RAW MAT`, `RESALE`.

Soll:

- O2C muss für `D10000` + `RM-M100` + `FRA-ZL` + 19 % USt funktionieren.
- Dafür braucht es passende Customer/Vendor Posting Groups, General Posting Setup, VAT Posting Setup und Inventory Posting Setup.

Bewertung:

Wir sollten nicht sofort eigene Kontenmatrix komplett neu bauen. Für den ersten Trainingslauf ist besser:

1. vorhandene CRONUS-Posting-Gruppen fachlich prüfen
2. Rhein-Main-Stammdaten zunächst auf passende vorhandene Gruppen legen
3. Lücken nur dort ergänzen, wo der Prozess sonst nicht bucht oder das Buch falsche Logik lernt

## Harte nächste Reihenfolge

1. `MASTERDATA-002`: Dimensionen anlegen. Status: erledigt.
2. `MASTERDATA-004`: Lagerort `FRA-ZL` anlegen. Status: erledigt.
3. `MASTERDATA-005`: Debitor `D10000` und Artikel `RM-M100` anlegen. Status: erledigt.
4. `MASTERDATA-006`: Posting-Fit mit Buchungsvorschau prüfen. Status: nächster Pflichtschritt.
5. Erst dann `UAT-O2C-001` vollständig buchen.

## Testqualitäts-Learning

Der erste `MASTERDATA-001`-Lauf war ein False Positive, weil die Suche nicht zuverlässig die Zielseite geöffnet hatte. Die korrigierte Fassung nutzt direkte Page-IDs und prüft, dass nicht nur Role-Center-Text gelesen wird.

Regel:

Ein grüner Test ist nur dann Evidence, wenn die richtige Business-Central-Seite nachweisbar geöffnet wurde.
