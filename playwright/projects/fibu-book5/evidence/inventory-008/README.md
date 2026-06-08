# INVENTORY-008 Evidence Index

Status: CRONUS-USA-Laborbuchung, `read/write`, genau eine bewusste positive Artikeljournalbuchung. Kein deutscher Finalnachweis.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-preposting-controls.json` | JSON / UI-Control-Evidence | Zielzeile `INV008-899959` mit `RM-M100`, `FRA-ZL`, Menge `2`, Unit Amount/Amount/Unit Cost `42.000,00`/`84.000,00`, Pre-Cleanup alter Drafts, Journal Check ohne sichtbare Issues fuer die aktuelle Zeile | keine gebuchte Postenspur, keine deutsche Steuer-/Kontenplanlogik | labor |
| `020-line-dimensions-before-post-page-text.txt` | Seitentext | `Line` -> `Dimensions` vor Buchung zeigt `PRODUCTLINE=MACHINE` | keine Reportingwirkung und keine sichtbare Dimension in G/L Entries | labor |
| `030-post-confirm-dialog-page-text.txt` | Seitentext | normaler Buchungsdialog wurde nach bewusstem Klick auf `Post` erreicht | noch keine Buchung, solange nicht bestaetigt | labor |
| `040-post-result-page-text.txt` | Seitentext | Buchungsbestaetigung/Ergebnis nach genau einer Bestaetigung | keine vollstaendige Postenspur allein aus Ergebnistext | labor |
| `050-item-ledger-entry-page-text.txt` | Seitentext | Artikelposten zur Belegnummer `INV008-899959` mit `RM-M100`, `FRA-ZL`, Menge `2`, Betrag `84.000` | keine deutsche Lokalisierung, keine `PRODUCTLINE`-Sichtbarkeit in dieser Liste | labor |
| `060-value-entry-page-text.txt` | Seitentext | Wertposten zur Belegnummer `INV008-899959` mit `RM-M100`, Menge `2`, Kostenbetrag `84.000`, Unit Cost `42.000` | keine Reporting-Summenwirkung | labor |
| `070-gl-entry-page-text.txt` | Seitentext | Sachposten zur Belegnummer `INV008-899959`, Betrag `84.000`, Konto `14140` | kein deutscher Kontenplan-Endstand; Dimensionen in G/L Entries nicht sichtbar nachgewiesen | labor |
| `090-inventory-valuation-request-page-text.txt` | Seitentext | Request Page fuer `Inventory Valuation` mit `As Of Date = 08.06.2026`, Artikelfilter `RM-M100|RAW-STEEL`, `Location Filter = FRA-ZL` | noch keine Ergebniszahlen | labor |
| `091-inventory-valuation-preview-page-text.txt` | Seitentext | Inventory-Valuation-Vorschau nach Buchung zeigt `RM-M100 = 42.000,00`, `RAW-STEEL = 25.000,00`, `Total Inventory Value = 67.000,00` | keine Kostenregulierung, kein deutscher Abschluss | labor |
| `INVENTORY-008-POSTING-result.json` | JSON / Ergebnis | konsolidiertes Ergebnis: gebucht `ja`, Document No. `INV008-899959`, Item Ledger/Value/G/L Entries sichtbar, Inventory Valuation korrigiert | keine deutsche USt, kein Warehouse, kein Manufacturing, keine Kostenregulierung | labor |
| `INVENTORY-008-POSTING.md` | Markdown / Lernzusammenfassung | fachliche Lernkette: Journal-Preflight, bewusste Buchung, Postenspur, Lagerbewertung | kein finaler Buchtext fuer deutsche Umgebung | labor |
| `*.screenshot.json` | Screenshot-Metadaten | Status, Zweck, Buchnutzung und Limitation der zugehoerigen PNG-Datei | keine eigenstaendige fachliche Wahrheit ohne Seitentext/JSON | labor |

## Kernergebnis

`INV008-899959` wurde als kontrollierter Trainings-/Opening-Balance-Zugang gebucht: `RM-M100 +2` in `FRA-ZL` mit Wert `84.000,00`. Danach sind Artikelposten, Wertposten, Sachposten und `Inventory Valuation` sichtbar. Die Lagerbewertung dreht den vorherigen negativen `RM-M100`-Laborwert auf `42.000,00`; zusammen mit `RAW-STEEL = 25.000,00` ergibt der Bericht `Total Inventory Value = 67.000,00`.

## Laborgrenze

Der Nachweis gilt nur fuer `MCP_1_20260210` / `RM-DEMO` auf CRONUS-USA-Datenbasis. Er beweist keine deutsche `19 %` USt, keinen deutschen Kontenplan, keine Warehouse-Aktivierung, keinen Manufacturing-Output und keine Kostenregulierung. Die Buchung darf nicht wiederholt werden.
