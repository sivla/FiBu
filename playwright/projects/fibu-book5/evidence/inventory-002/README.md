# INVENTORY-002 Evidence Index

Status: Labor-Nachweis, read-only, keine Buchung.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-inventory-valuation-tell-me-page-text.txt` | Roh-Seitentext | `Inventory Valuation` ist ueber Tell-Me in `Berichte und Analysen` erreichbar. | Keine Berichtszahlen, kein finaler deutscher Report. | labor |
| `010-inventory-valuation-tell-me-buttons.json` | UI-Buttonliste | Verfuegbare BC-Buttons im Such-/Rollencenterkontext. | Keine fachliche Lagerbewertung. | labor |
| `020-inventory-valuation-request-page-text.txt` | Roh-Seitentext | Request Page mit `As Of Date`, Item-Filter und `Location Filter`. | Keine Zahlenwirkung. | labor |
| `inventory-002-020-inventory-valuation-request.screenshot.json` | Screenshot-Metadaten | Screenshot-Zweck, Status und Grenzen fuer die Request Page. | Keine sichtbare Berichtsvorschau. | labor |
| `030-inventory-valuation-preview-page-text.txt` | Roh-Seitentext | Berichtsvorschau mit `RAW-STEEL`, `RM-M100`, `FRA-ZL`, Stichtag und `Total Inventory Value`. | Keine deutsche USt, keine Kostenregulierung, kein deutscher Kontenplan. | labor |
| `inventory-002-030-inventory-valuation-preview.screenshot.json` | Screenshot-Metadaten | Screenshot-Zweck, Status und Grenzen fuer die Berichtsvorschau. | Kein finaler DE-Abschlussnachweis. | labor |
| `INVENTORY-VALUATION-result.json` | JSON-Evidence | Filter, UI-Status und sichtbare Werte: `RAW-STEEL = 25.000,00`, `RM-M100 = -42.000,00`, `Total Inventory Value = -17.000,00`. | Keine Buchung, keine Warehouse-Aktivierung, keine deutsche Finalbewertung. | labor |
| `INVENTORY-VALUATION.md` | Lernzusammenfassung | Warum Stichtag, Item-Filter und Lagerortfilter fuer Lagerbewertung wichtig sind. | Keine allgemeine BC-Regel ohne Laborbezug. | labor |
| `../inventory-003/INVENTORY-NEGATIVE-RM-M100.md` | Folge-Erklaerung | Warum `RM-M100` im Labor negativ bewertet wird und welche Postenspur das erklaert. | Keine neue BC-Ausfuehrung, kein finaler deutscher Zielbestand. | labor |

## Aktuelle Wahrheit

`Inventory Valuation` rendert in `RM-DEMO` mit `As Of Date = 08.06.2026`, `No. = RM-M100|RAW-STEEL` und `Location Filter = FRA-ZL` eine read-only Berichtsvorschau. Der Bericht zeigt `RAW-STEEL` positiv, `RM-M100` negativ und eine negative Summe. `INVENTORY-003` erklaert diesen Wert aus der vorhandenen O2C-/P2P-Postenspur: `RAW-STEEL` hat einen belegten positiven Zugang, `RM-M100` einen belegten Abgang, aber keinen belegten positiven Zugang im aktuellen Filterkontext. Das ist ein starker Lernfall fuer Lagerbewertung, aber kein finaler deutscher Abschlusszustand.

## Naechster Schritt

Einen Zielbestandsplan fuer finale Buchbilder formulieren: Wie entsteht `RM-M100` vor dem Verkauf sauber positiv, z. B. Anfangsbestand, Einkauf, Montage oder Fertigung, bevor Warehouse oder Manufacturing praktisch gestartet werden.
