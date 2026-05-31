# Projektfit und Datenlücken für Buch 5

Diese Datei beantwortet die Frage: Passen die vorhandenen CRONUS-/`RM-DEMO`-Daten bereits zum Buch, oder müssen Rhein-Main-Daten zuerst aufgebaut werden?

## Kurzantwort

`RM-DEMO` ist aktuell eine CRONUS-basierte Trainingscompany. Das ist gut als Spielwiese und technische Grundlage. Für das Buch reicht das aber nicht aus, weil die Buchfälle eine eigene Rhein-Main-Industriegruppe mit eigenen Stammdaten, Dimensionen, Lagerorten, Artikeln, Debitoren, Kreditoren und Prozessfällen voraussetzen.

Der Audit `MASTERDATA-001` hat das bestätigt. Details stehen in `MASTERDATA-AUDIT-RESULTS.md`.

Deshalb gilt:

1. O2C nicht direkt buchen.
2. Zuerst Daten- und Setup-Fit prüfen.
3. Fehlende Rhein-Main-Daten anlegen.
4. Erst danach `UAT-O2C-001` vollständig ausführen.

## Muss-Daten aus dem Buch

### Companies

| Company | Zweck | Status in `RM-DEMO` |
|---|---|---|
| `RM-PROD` | Produktion, Fertigung, gesteuertes Lager | zu prüfen / vermutlich fehlt |
| `RM-SALES` | Vertrieb, Onlineshop, Dropshipping | zu prüfen / vermutlich fehlt |
| `RM-SERVICE` | Service, Wartung, Miete | zu prüfen / vermutlich fehlt |
| `RM-SHARED` | Einkauf, Shared Services, Finance | zu prüfen / vermutlich fehlt |
| `RM-CH` | Ausland/Intercompany | zu prüfen / vermutlich fehlt |
| `RM-DEMO` | aktuelle Trainingscompany für erste Tests | vorhanden |

Arbeitsentscheidung:

Für frühe Buchscreenshots kann `RM-DEMO` als konsolidierte Trainingscompany dienen. Das muss im Buch erklärt werden, weil das Buch fachlich mehrere Companies beschreibt. Später können die echten Rhein-Main-Companies zusätzlich angelegt werden.

### Dimensionen

| Dimension | Werte |
|---|---|
| `COMPANY-GROUP` | `PROD`, `SALES`, `SERVICE`, `SHARED`, `AT` |
| `DEPARTMENT` | `SALES`, `PURCH`, `WHSE`, `PROD`, `SERV`, `FIN`, `ADMIN` |
| `CHANNEL` | `B2B`, `SHOP`, `IC`, `SERVICE`, `PROJECT` |
| `PRODUCTLINE` | `MACHINE`, `SPARE`, `RENTAL`, `SERVICE` |
| `LOCATION-GROUP` | `DIRECTED`, `SIMPLE`, `VAN`, `PROJECT`, `DROP` |

Für `UAT-O2C-001` mindestens erforderlich:

- `PRODUCTLINE = MACHINE`
- `CHANNEL = B2B`
- `DEPARTMENT = SALES`
- `LOCATION-GROUP = DIRECTED`

### Lagerorte

| Lagerort | Zweck |
|---|---|
| `FRA-ZL` | zentrales/gesteuertes Lager |
| `MZ-EINFACH` | einfaches Lager |
| `VAN-SERV` | Servicefahrzeuglager |
| `PROJ-LAG` | Projektlager |

Für `UAT-O2C-001` mindestens erforderlich:

- `FRA-ZL`

### Debitoren

| Nr. | Name | Land | Trainingsfall |
|---|---|---|---|
| `D10000` | Müller Maschinenbau GmbH | DE | Standardverkauf Maschine |
| `D11000` | Handwerk24 Onlinekunde | DE | Onlineshop-Ersatzteil |
| `D20000` | Alpha Machines SAS | FR | EU-Lieferung |
| `D30000` | SwissTech AG | CH | Ausfuhrlieferung |
| `D90000` | RM-SALES GmbH IC | DE | Intercompany |

Für `UAT-O2C-001` mindestens erforderlich:

- `D10000`

### Kreditoren

| Nr. | Name | Land | Trainingsfall |
|---|---|---|---|
| `K10000` | Stahlwerk Ruhr GmbH | DE | Rohmaterial Einkauf |
| `K11000` | Elektro Parts GmbH | DE | Elektronik Einkauf |
| `K20000` | Dropship Europe BV | NL | Direktlieferung |
| `K30000` | Zollspedition Nord GmbH | DE | Import/EUSt |
| `K40000` | Lohnfertiger Süd GmbH | DE | Fremdarbeit |

### Artikel, Ressourcen und Anlagen

| Nr. | Beschreibung | Typ | Kosten/Preis |
|---|---|---|---:|
| `RM-M100` | Standardmaschine M100 | Fertigerzeugnis | `42.000 / 68.000` |
| `RM-X500` | Sondermaschine X500 | Projekt/Fertigung | `90.000 / 145.000` |
| `SP-PUMP-01` | Ersatzteil Pumpe | Lagerartikel | `180 / 320` |
| `SP-SENSOR-02` | Sensor Set | serienpflichtiger Lagerartikel | `75 / 149` |
| `RAW-STEEL` | Stahlträger | Rohmaterial | `2.500 / -` |
| `COMP-CTRL` | Steuerungseinheit | Komponente | `3.200 / -` |
| `KIT-MAINT` | Wartungskit | Montageartikel | `240 / 450` |
| `RES-TECH` | Servicetechniker Stunde | Ressource | `65 / 115` |
| `FA-CNC-01` | CNC-Anlage | Anlage | `250.000` |

Für `UAT-O2C-001` mindestens erforderlich:

- `RM-M100`

### Posting-Setup für `UAT-O2C-001`

| Bereich | Erwartung |
|---|---|
| Debitorenbuchungsgruppe | Forderung Inland |
| Geschäftsbuchungsgruppe Debitor | inländischer Verkauf |
| USt-Geschäftsbuchungsgruppe | Inland/Deutschland |
| Produktbuchungsgruppe Artikel | Maschine |
| USt-Produktbuchungsgruppe | voller deutscher Satz |
| Lagerbuchungsgruppe | Fertigerzeugnisse Maschinen |
| Allgemeine Buchungsmatrix | Erlös und Wareneinsatz für Maschine |
| USt-Buchungsmatrix | `19 %` |
| Lagerbuchungsmatrix | Bestand für `FRA-ZL` |

## Nächster technischer Schritt

`MASTERDATA-001` öffnet die relevanten BC-Seiten und sichert Screenshots/Text:

- `Customers`
- `Items`
- `Locations`
- `Dimensions`
- `General Posting Setup`
- `VAT Posting Setup`
- `Inventory Posting Setup`

Danach wird entschieden, welche Daten in `RM-DEMO` angelegt werden und welche Buchstellen angepasst werden müssen.
