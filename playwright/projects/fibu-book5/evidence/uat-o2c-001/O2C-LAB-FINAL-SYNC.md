# UAT-O2C-001 finaler Labor-Sync

Stand: 08.06.2026

Diese Datei synchronisiert den aktuellen O2C-Laborstand zwischen Buch, Evidence und Projektstatus. Sie ist kein neuer BC-Lauf und keine neue Buchung. Sie fasst die vorhandene Evidence zur genau einmal gebuchten CRONUS-USA-Laborrechnung zusammen.

## Laufkontext

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Preview-Auftrag | `S-ORD101067`, nicht gebucht, per Cleanup entfernt |
| Laborbuchung | `S-ORD101068` |
| Gebuchte Verkaufsrechnung | `PS-INV103297` |
| Buchungsoption | `Ship and Invoice` |
| Debitor | `D10000` / Mueller Maschinenbau GmbH |
| Artikel | `RM-M100` / Standardmaschine M100 |
| Menge | `1` |
| Lagerort | `FRA-ZL` |
| Nettopreis | `68.000 EUR` |
| Tax/VAT im Labor | `0 %`, `Tax Group Code = FURNITURE` |
| Deutsches Ziel | `19 %` USt und `80.920 EUR` brutto bleiben offen |

## Was als Labor belegt ist

| Pruefpunkt | Ergebnis | Evidence |
|---|---|---|
| Verkaufsauftrag und Zeile | `D10000`, `RM-M100`, Menge `1`, `FRA-ZL`, `68.000 EUR` | `040-zeile-artikel-rm-m100-api-result.json`, Screenshots `030`, `040`, `041` |
| Waehrung | `EUR` ist im O2C-Labor erreicht | `045-target-vs-labor-delta.md`, `080-posting-result.json` |
| Steuergrenze | Labor liefert `taxPercent = 0`, nicht deutsche `19 %` | `045-target-vs-labor-delta.md`, `080-posting-result.json` |
| Zeilendimension | `PRODUCTLINE=MACHINE` im Zeilendimensionsdialog, `CHANNEL=B2B` im Auftragskontext | `050-line-dimension-dialog-result.json`, Screenshot `050` |
| Inventory Posting Setup | `FRA-ZL` + `RESALE` nutzt im Labor `Inventory Account = 14140` | `evidence/masterdata-009/010-inventory-posting-setup-fit.json` |
| Preview Posting | alte Inventory-Fehlermeldung weg; echte Vorschauzeilen sichtbar | `060-preview-posting-result.json`, Screenshot `060` |
| G/L Preview Drilldown | Konto `14140` und weitere Konten im Preview-Drilldown sichtbar | `061-preview-related-entries-gl-entry-result.json`, Screenshot `061` |
| Kontrollierte Buchung | genau einmal `Ship and Invoice`; `PS-INV103297` entstanden | `080-posting-result.json`, Screenshots `080`, `081`, `082` |
| Debitorenposten | zur gebuchten Rechnung sichtbar | `082-posting-entry-trace.json`, Screenshot `083` |
| Sachposten | zur gebuchten Rechnung sichtbar, Konto `14140` im Text | `082-posting-entry-trace.json`, Screenshot `084` |
| Wertposten | zur gebuchten Rechnung sichtbar; fuehrt zum Artikelposten | `082-posting-entry-trace.json`, Screenshot `086` |
| Artikelposten | direkt per `Order No.` nicht gefunden, aber ueber Wertposten-Link `Item Ledger Entry No. = 792` sichtbar | `082-posting-entry-trace.json`, Screenshots `085`, `086`, `088` |
| Artikelposten-Dimensionen | `Entry` -> `Dimensions` auf Item Ledger Entry `792` zeigt `CHANNEL=B2B` und `PRODUCTLINE=MACHINE` | `089-item-ledger-entry-dimensions-page-text.txt`, Screenshot `089` |
| Reporting-Einstieg | `Financial Reports` ist read-only erreichbar | `evidence/reporting-001/010-financial-reports-open-result.json`, Screenshot `reporting-001-010-financial-reports.png` |

## PRODUCTLINE=MACHINE nach Buchung

| Ort | Status | Bedeutung |
|---|---|---|
| Verkaufszeile / Belegdialog | belegt | Die Dimension kommt im konkreten O2C-Beleg an. |
| Gebuchte Verkaufsrechnung | offen | Noch kein sichtbarer Dimensionsdialog oder Spaltennachweis auf der Posted Sales Invoice. |
| Sachposten / G/L Entries | offen | `REPORTING-002` zeigt die Sachposten zur Rechnung, aber `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind dort im aktuellen UI-Kontext nicht sichtbar nachgewiesen. |
| Debitorenposten | nicht nachgewiesen | Fuer Forderungsposten fachlich moeglich, aber noch nicht belegt. |
| Artikelposten | belegt | Item Ledger Entry `792` zeigt `CHANNEL=B2B` und `PRODUCTLINE=MACHINE`. |
| Wertposten | offen | Wertposten ist sichtbar, Dimensionen dort aber noch nicht nachgewiesen. |
| Financial Reports | offen | Seite ist erreichbar und zeigt `Dimension Perspective`/`Column Definition`; Filter-/Summenwirkung nach `PRODUCTLINE=MACHINE` oder `CHANNEL=B2B` fehlt noch. |

## Buchwirkung

Das Buch darf jetzt sagen:

- Der O2C-Laborprozess in `RM-DEMO` ist bis Preview, bewusster Laborbuchung und Postenspur praktisch nachgewiesen.
- Der alte Inventory-Posting-Setup-Blocker ist durch `MASTERDATA-009` im CRONUS-Labor geloest.
- `Inventory Account = 14140` ist ein begruendeter CRONUS-Laborfit, kein deutscher Kontenplan-Endstand.
- `PS-INV103297` ist der aktuelle gebuchte Laborbeleg fuer die O2C-Postenspur.
- `PRODUCTLINE=MACHINE` ist nach der Buchung am Artikelposten nachgewiesen.
- `REPORTING-002` beweist: Financial Reports ist der richtige naechste Reporting-Einstieg, aber noch kein Summenbeweis nach Produktlinie oder Kanal.

Das Buch darf nicht sagen:

- Die deutsche `19 %` USt sei in `RM-DEMO` erreicht.
- Der Bruttobetrag `80.920 EUR` sei im aktuellen Laborbeleg entstanden.
- `14140` sei ein deutscher Kontenplan-Endstand.
- Financial Reports zeigten bereits eine GuV-Summe nach `PRODUCTLINE=MACHINE`.

## Naechster O2C-Schritt

Keine weitere O2C-Buchung. Der naechste sinnvolle O2C-nahe Schritt ist `REPORTING-003`: `Dimension Perspective`, `Dimensions - Detail` oder Analysis Views gezielt read-only pruefen, damit klar wird, ob `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` fuer `PS-INV103297` auswertbar sind.
