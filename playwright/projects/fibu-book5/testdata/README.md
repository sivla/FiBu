# Testdaten fuer FiBu Buch 5

Stand: 08.06.2026

Diese Testdaten beschreiben den Lern- und Laborstand fuer `RM-DEMO`. Sie sind kein produktiver Migrationssatz und kein finaler deutscher Stammdatenkatalog. Jede Datei trennt soweit moeglich zwischen bereits praktisch genutzten Mindestdaten und dem groesseren Buchmodell.

## Struktur

| Datei | Zweck | aktueller Beweisstand |
|---|---|---|
| `foundation/rm-demo-company.json` | aktuelle Trainingscompany `RM-DEMO` und Herkunft aus CRONUS USA | praktisch belegt |
| `masterdata/companies.json` | aktueller Lernmandant plus spaetere Ziel-Companies | `RM-DEMO` belegt; Ziel-Companies nur geplant |
| `masterdata/dimensions.json` | Dimensionen und Dimensionswerte fuer O2C und spaetere Prozesse | Kernwerte belegt; Erweiterungen geplant |
| `masterdata/customers.json` | Debitorenmodell fuer O2C, Dropshipping/Sonderverkauf, EU, Export und IC | `D10000` belegt; `D11000` in `DROPSHIPPING-001` read-only nicht sichtbar; weitere Debitoren geplant |
| `masterdata/vendors.json` | Kreditorenmodell fuer P2P, Dropship, Zoll, Fremdarbeit | `K10000` als CRONUS-USA-P2P-Labor belegt; `K20000` in `DROPSHIPPING-001` read-only nicht sichtbar; weitere Kreditoren geplant |
| `masterdata/items.json` | Artikel fuer Maschine, Ersatzteile, Rohmaterial und Kits | `RM-M100` belegt; `RAW-STEEL` als P2P-Laborartikel mit Postenspur belegt; `COMP-CTRL` und `KIT-MAINT` in `MANUFACTURING-001` read-only nicht sichtbar; `SP-PUMP-01` in `SERVICE-001` und `DROPSHIPPING-001` read-only nicht sichtbar; `SP-SENSOR-02` in `PROJECTS-001` read-only nicht sichtbar |
| `masterdata/locations.json` | Lagerorte fuer einfaches Lager, Warehouse, Servicefahrzeug und Projekt | `FRA-ZL` belegt; `VAN-SERV` in `SERVICE-001` und `PROJ-LAG` in `PROJECTS-001` read-only nicht sichtbar; weitere Lagerorte geplant |
| `masterdata/process-cases.json` | fachliche Prozessfaelle aus dem Buch | O2C praktisch belegt; andere Faelle geplant |
| `masterdata/resources-assets-projects.json` | Ressourcen, Anlagen, Projekte und Bankkonto | Bankkonto `BANK-RM-01` als CRONUS-USA-Laborfit belegt; `FA-CNC-01` ist auf Buchziel `120000` harmonisiert, aber laut `FIXEDASSETS-004` noch nicht in BC sichtbar; `HGB`, `MACHINES` und `K30000` fehlen ebenfalls als Laborzielwerte; `FIXEDASSETS-005` hat den UI-Pfad zu `FA Posting Groups` geloest, aber `MACHINES` nicht angelegt; `RES-TECH` ist in `SERVICE-001` und `PROJECTS-001` read-only nicht sichtbar; `PROJ-5001` ist in `PROJECTS-001` read-only nicht sichtbar; Ressourcen/Projekte geplant |
| `sales/uat-o2c-001.json` | konkreter O2C-Testfall mit Zielwerten | Labor belegt mit Steuerabweichung |
| `purchase/uat-p2p-001.json` | konkreter P2P-Fall mit Zielwerten | CRONUS-USA-Laborprozess gebucht: Bestellung `106049` -> gebuchte Einkaufsrechnung `108219`; keine deutsche 19-%-Vorsteuer |
| `inventory/rm-m100-target-stock-plan.json` | positiver `RM-M100`-Zugang fuer stabile finale Buchbilder | Draft praktisch vorbereitet in `INVENTORY-006`, Journal Check/Current line ohne Issues in `INVENTORY-007`, genau eine Laborbuchung `INV008-899959` in `INVENTORY-008` mit Postenspur und korrigierter Inventory Valuation |

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
| P2P | `K10000`, `RAW-STEEL`, `FRA-ZL`; Bestellung `106049` wurde genau einmal mit `Receive and Invoice` gebucht und erzeugte Einkaufsrechnung `108219` |
| Lagerort | `FRA-ZL` als einfacher Lagerort |
| Standarddimensionen | `RM-M100 -> PRODUCTLINE=MACHINE`, `D10000 -> CHANNEL=B2B` |
| Posting-Laborfit | `FRA-ZL` + `RESALE -> Inventory Account 14140` |
| O2C | Auftrag `S-ORD101068` wurde genau einmal mit `Ship and Invoice` gebucht; Rechnung `PS-INV103297` |
| Inventory Laborbuchung | `INVENTORY-004` empfiehlt fuer finale `RM-M100`-Bilder einen klar markierten Trainings-/Opening-Balance-Zugang `+2` in `FRA-ZL`, damit der bekannte Abgang `-1` nicht zu negativer Bewertung fuehrt; `INVENTORY-006` beweist den Journal-Draft mit `PRODUCTLINE=MACHINE`, `INVENTORY-007` beweist Journal Check/Current line ohne Issues, `INVENTORY-008` bucht `INV008-899959` genau einmal und belegt Artikelposten, Wertposten, Sachposten `14140` sowie Inventory Valuation mit `RM-M100 = 42.000,00` |
| Bank | `BANK-RM-01 Hausbank Rhein-Main` als CRONUS-USA-Laborbankkonto; keine echte Bankverbindung, keine Zahlung, kein Ausgleich, keine Bankabstimmung |

## Geplant, aber noch nicht praktisch belegt

| Bereich | Daten |
|---|---|
| Debitoren | `D11000`, `D20000`, `D30000`, `D90000`; `D11000` wurde in `DROPSHIPPING-001` nicht sichtbar gefunden |
| Kreditoren | `K11000`, `K20000`, `K30000`, `K40000`; `K20000` wurde in `DROPSHIPPING-001` nicht sichtbar gefunden |
| Artikel | `SP-PUMP-01`, `SP-SENSOR-02`, `COMP-CTRL`, `KIT-MAINT`; `RAW-STEEL` ist bereits Laborartikel, `COMP-CTRL` und `KIT-MAINT` wurden in `MANUFACTURING-001` nicht sichtbar gefunden; `SP-PUMP-01` wurde in `SERVICE-001` und `DROPSHIPPING-001` nicht sichtbar gefunden; `SP-SENSOR-02` wurde in `PROJECTS-001` nicht sichtbar gefunden |
| Lagerorte | `MZ-EINFACH`, `VAN-SERV`, `PROJ-LAG`; `VAN-SERV` wurde in `SERVICE-001` nicht sichtbar gefunden; `PROJ-LAG` wurde in `PROJECTS-001` nicht sichtbar gefunden |
| Ressourcen/Anlagen/Projekte | `RES-TECH`, `FA-CNC-01` mit Zugangsbetrag `120.000 EUR`, `PROJ-5001`; `RES-TECH` wurde in `SERVICE-001` und `PROJECTS-001` nicht sichtbar gefunden; `PROJ-5001` wurde in `PROJECTS-001` nicht sichtbar gefunden; `FIXEDASSETS-002` hat Zielwert-/Suchpfad-Readiness belegt, `FIXEDASSETS-003` direkte Zielseitenkandidaten fuer Anlagenliste, AfA-Buecher, Einkaufsrechnungen und Anlagenposten, `FIXEDASSETS-004` zeigt fehlende Zielobjekte `FA-CNC-01`, `HGB`, `MACHINES`, `K30000`; `FIXEDASSETS-005` erreicht `FA Posting Groups` und zeigt vorhandene CRONUS-Gruppen, aber kein `MACHINES`; keine Anlage in BC |
| Prozesse | Manufacturing ist seit `MANUFACTURING-001` nur als read-only Readiness belegt und seit `MANUFACTURING-002` im Buch synchronisiert; Service ist seit `SERVICE-001` nur als read-only Readiness belegt und seit `SERVICE-002` im Buch synchronisiert; Projects ist seit `PROJECTS-001` nur als read-only Readiness belegt und seit `PROJECTS-002` im Buch synchronisiert; Dropshipping/Sonderverkauf ist seit `DROPSHIPPING-001` nur als read-only Readiness belegt: Einstiegspfade sichtbar, Zielobjekte fehlen; Warehouse, Service, Projects, Dropshipping, Payments, Fixed Assets bleiben fuer Setup/Buchung offen; P2P und Inventory sind als CRONUS-USA-Laborprozesse belegt, aber deutsche Finalnachweise bleiben offen |

## Laborgrenzen

`sales/uat-o2c-001.json` enthaelt den deutschen Zielwert `vatPercent = 19`. Der aktuelle Laborlauf in `RM-DEMO` beweist diesen Wert nicht. Die CRONUS-USA-Umgebung zeigt Sales Tax mit `Tax Group Code = FURNITURE` und `0 %`. Deshalb gilt:

- `68.000 EUR`, Debitor, Artikel, Lagerort, Dimension und Postenspur sind Labor-Evidence.
- `19 %` USt, Brutto `80.920 EUR` und deutsche USt-Posten bleiben Finalnachweis.
- Neue Tests muessen diese Trennung in JSON-Evidence, Markdown und Screenshot-Metadaten beibehalten.
- `TAX-001` dokumentiert diese Trennung als eigenes Readiness-Gate. Ein praktischer deutscher `19 %`-Lauf braucht eine passende deutsche Zielcompany oder eine ausdruecklich freigegebene UI-first VAT-Setup-Strecke; `FURNITURE`/Sales Tax darf nicht zu `VAT19` umgedeutet werden.

## Beziehung zum Backlog

Der vollstaendige Abgleich zwischen Buchanforderung, Testdaten, Evidence, Status und Prioritaet steht in:

```text
playwright/projects/fibu-book5/MASTERDATA-BACKLOG.md
```

Neue Testdaten sollten nur ergaenzt werden, wenn sie einem konkreten Backlog-Schritt dienen und der naechste Playwright-Lauf sie praktisch pruefen kann.
