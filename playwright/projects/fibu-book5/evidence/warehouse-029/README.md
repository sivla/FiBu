# WAREHOUSE-029 Evidence Index

Status: `labor`, `read-only`, `default-preflight`, `not-final`.

| Datei | Typ | Beweist | Beweist nicht |
|---|---|---|---|
| `WAREHOUSE-029-result.json` | Result JSON | Vendor/Item/Location read-only Preflight und Route Decision | frischen PO-Default, Release, Warehouse Receipt |
| `010-vendor-k10000-compact-text.txt` | UI-Text | sichtbare Vendor-Signale | Tabellenlogik oder Defaultwirkung |
| `020-item-raw-steel-compact-text.txt` | UI-Text | sichtbare Item-Signale | Stockkeeping Unit Setup |
| `030-location-fra-zl-compact-text.txt` | UI-Text | sichtbare FRA-ZL Warehouse-Signale | Quelle auf Purchase Line |
| `040-card-analyses.json` | Auswertung | direkte Default-Signal-Pruefung | finalen deutschen Nachweis |

German Final: Vendor, Item, Location, Source Purchase Order und Warehouse Receipt muessen in deutscher Zielumgebung neu aufgebaut und bebildert werden.
