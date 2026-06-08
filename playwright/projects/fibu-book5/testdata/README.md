# Testdaten fuer FiBu Buch 5

Stand: 08.06.2026

Diese Testdaten beschreiben den Lern- und Laborstand fuer `RM-DEMO`. Sie sind kein produktiver Migrationssatz und kein finaler deutscher Stammdatenkatalog. Jede Datei trennt soweit moeglich zwischen bereits praktisch genutzten Mindestdaten und dem groesseren Buchmodell.

## Struktur

| Datei | Zweck | aktueller Beweisstand |
|---|---|---|
| `foundation/rm-demo-company.json` | aktuelle Trainingscompany `RM-DEMO` und Herkunft aus CRONUS USA | praktisch belegt |
| `masterdata/companies.json` | aktueller Lernmandant plus spaetere Ziel-Companies | `RM-DEMO` belegt; Ziel-Companies nur geplant |
| `masterdata/dimensions.json` | Dimensionen und Dimensionswerte fuer O2C und spaetere Prozesse | Kernwerte belegt; Erweiterungen geplant |
| `masterdata/customers.json` | Debitorenmodell fuer O2C, Shop, EU, Export und IC | `D10000` belegt; weitere Debitoren geplant |
| `masterdata/vendors.json` | Kreditorenmodell fuer P2P, Dropship, Zoll, Fremdarbeit | geplant, noch keine RM-DEMO-Evidence |
| `masterdata/items.json` | Artikel fuer Maschine, Ersatzteile, Rohmaterial und Kits | `RM-M100` belegt; `RAW-STEEL` als P2P-Readiness-Laborfit belegt |
| `masterdata/locations.json` | Lagerorte fuer einfaches Lager, Warehouse, Servicefahrzeug und Projekt | `FRA-ZL` belegt; weitere Lagerorte geplant |
| `masterdata/process-cases.json` | fachliche Prozessfaelle aus dem Buch | O2C praktisch belegt; andere Faelle geplant |
| `masterdata/resources-assets-projects.json` | Ressourcen, Anlagen, Projekte und Bankkonto | geplant |
| `sales/uat-o2c-001.json` | konkreter O2C-Testfall mit Zielwerten | Labor belegt mit Steuerabweichung |
| `purchase/uat-p2p-001.json` | konkreter P2P-Readiness-Fall mit Zielwerten | Labor-Readiness belegt, keine Buchung |
| `inventory/rm-m100-target-stock-plan.json` | geplanter positiver `RM-M100`-Zugang fuer stabile finale Buchbilder | geplant, noch keine Buchung |

## Konventionen

- Codes sind fachliche Trainingsschluessel und bleiben stabil, z. B. `D10000`, `K10000`, `RM-M100`, `FRA-ZL`.
- Testfall-IDs verwenden sprechende Prozessnamen wie `UAT-O2C-001`.
- JSON-Dateien duerfen Zielwerte enthalten, die im aktuellen CRONUS-USA-Labor noch nicht final erreicht sind. Solche Werte muessen in Evidence und Doku als Ziel oder Laborabweichung markiert werden.
- Datenanlage muss idempotent sein: Ein neuer Lauf darf vorhandene passende Daten erkennen und nicht unkontrolliert duplizieren.
- Keine echten Kunden-, Bank-, Steuer- oder Zugangsdaten in Testdaten speichern.
- Testdaten sind bevorzugt ASCII-kompatibel dokumentiert, damit Windows/macOS-Agents und Encoding-Checks stabil bleiben.

## Bereits praktisch in RM-DEMO belegt

| Bereich | Daten |
|---|---|
| Company | `RM-DEMO`, CRONUS-USA-basiert |
| Dimensionen | `PRODUCTLINE`, `CHANNEL`, `LOCATION-GROUP`; `DEPARTMENT` wiederverwendet |
| Dimensionswerte | `MACHINE`, `B2B`, `SALES`, `DIRECTED` |
| Debitor | `D10000 Mueller Maschinenbau GmbH`, O2C mit `EUR` |
| Artikel | `RM-M100 Standardmaschine M100`, Preis `68.000`, Kosten `42.000` |
| P2P-Readiness | `K10000`, `RAW-STEEL`, `FRA-ZL`, Entwurfszeile `10 x 2.500` erstellt und geloescht |
| Lagerort | `FRA-ZL` als einfacher Lagerort |
| Standarddimensionen | `RM-M100 -> PRODUCTLINE=MACHINE`, `D10000 -> CHANNEL=B2B` |
| Posting-Laborfit | `FRA-ZL` + `RESALE -> Inventory Account 14140` |
| O2C | Auftrag `S-ORD101068` wurde genau einmal mit `Ship and Invoice` gebucht; Rechnung `PS-INV103297` |
| Inventory Planung | `INVENTORY-004` empfiehlt fuer finale `RM-M100`-Bilder einen klar markierten Trainings-/Opening-Balance-Zugang `+2` in `FRA-ZL`, damit der bekannte Abgang `-1` nicht zu negativer Bewertung fuehrt |

## Geplant, aber noch nicht praktisch belegt

| Bereich | Daten |
|---|---|
| Debitoren | `D11000`, `D20000`, `D30000`, `D90000` |
| Kreditoren | `K10000`, `K11000`, `K20000`, `K30000`, `K40000` |
| Artikel | `SP-PUMP-01`, `SP-SENSOR-02`, `RAW-STEEL`, `COMP-CTRL`, `KIT-MAINT` |
| Lagerorte | `MZ-EINFACH`, `VAN-SERV`, `PROJ-LAG` |
| Ressourcen/Anlagen/Projekte | `RES-TECH`, `FA-CNC-01`, `PROJ-5001` |
| Bank | `BANK-RM-01` |
| Prozesse | P2P, Inventory, Warehouse, Manufacturing, Service, Projects, Payments, Fixed Assets |

## Laborgrenzen

`sales/uat-o2c-001.json` enthaelt den deutschen Zielwert `vatPercent = 19`. Der aktuelle Laborlauf in `RM-DEMO` beweist diesen Wert nicht. Die CRONUS-USA-Umgebung zeigt Sales Tax mit `Tax Group Code = FURNITURE` und `0 %`. Deshalb gilt:

- `68.000 EUR`, Debitor, Artikel, Lagerort, Dimension und Postenspur sind Labor-Evidence.
- `19 %` USt, Brutto `80.920 EUR` und deutsche USt-Posten bleiben Finalnachweis.
- Neue Tests muessen diese Trennung in JSON-Evidence, Markdown und Screenshot-Metadaten beibehalten.

## Beziehung zum Backlog

Der vollstaendige Abgleich zwischen Buchanforderung, Testdaten, Evidence, Status und Prioritaet steht in:

```text
playwright/projects/fibu-book5/MASTERDATA-BACKLOG.md
```

Neue Testdaten sollten nur ergaenzt werden, wenn sie einem konkreten Backlog-Schritt dienen und der naechste Playwright-Lauf sie praktisch pruefen kann.
