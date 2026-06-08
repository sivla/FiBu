# P2P-001 Evidence-Index

Status: labor, posted, CRONUS-USA, no-de-final.

Umgebung: `MCP_1_20260210`, Company `RM-DEMO`, CRONUS USA. Dieser Block dokumentiert erst die P2P-Readiness und danach genau eine kontrollierte Laborbuchung `Receive and Invoice`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `P2P-READINESS.json` | JSON-Ergebnis | K10000, RAW-STEEL, FRA-ZL, Vendor-Template-Fit, RAW-STEEL-Labor-Posting-Fit und temporaere Entwurfsprobe | keine Buchung, keine Preview Posting Posten, keine deutsche 19-%-Vorsteuer | labor |
| `P2P-READINESS.md` | Lernzusammenfassung | warum P2P zuerst Stammdaten-/Setup-Readiness braucht | keinen finalen P2P-Prozess | labor |
| `090-purchase-order-api-result.json` | API-Zustand | Einkaufsbestellung `106049`, Zeile `RAW-STEEL`, Menge `10`, `Direct Unit Cost = 2500`, `Tax Percent = 0`; `Vendor Invoice No.` wurde ueber ODataV4 gesetzt | deutsche EUR-/VAT-Logik, gebuchte Posten | labor |
| `090-purchase-order-page-text.txt` | UI-Seitentext | Bestellung ist in der Purchase-Order-UI sichtbar | finale deutsche Buchbildqualitaet | labor |
| `095-preview-posting-result.json` | JSON-Ergebnis | `Preview Posting` zeigt echte Vorschauarten: `G/L Entry`, `Vendor Ledger Entry`, `Detailed Vendor Ledg. Entry`, `Item Ledger Entry`, `Value Entry` | echte Buchung, deutsche Vorsteuer | labor |
| `P2P-LAB-POSTING.md` | Lernzusammenfassung | kontrollierte Laborbuchung `106049` -> gebuchte Einkaufsrechnung `108219` mit `Receive and Invoice` | produktive Freigabe, deutsche Steuer-/Kontenplan-Endaussage | labor |
| `100-purchase-posting-result.json` | JSON-Postenspur | genau eine P2P-Laborbuchung; gebuchte Einkaufsrechnung `108219`; Kreditoren-, Sach-, Artikel- und Wertposten-Evidence | 19-%-Vorsteuer, deutscher Kontenplan, Dimensionen in P2P-Posten | labor |
| `110-posted-purchase-invoice-page-text.txt` | UI-Seitentext | gebuchte Einkaufsrechnung `108219` ist sichtbar | finale DE-Rechnung | labor |
| `120-vendor-ledger-entries-page-text.txt` | UI-Seitentext | Kreditorenposten zur Rechnung `108219` ist sichtbar | Zahlung/Ausgleich | labor |
| `130-gl-entries-page-text.txt` | UI-Seitentext | Sachposten zeigen Konten `22100` und `14140` sowie Betrag `25.000` | deutschen Kontenplan-Endstand | labor |
| `140-item-ledger-entries-page-text.txt` | UI-Seitentext | direkter Filter `Order No. = 106049` ist kein guter Artikelposten-Nachweis | Artikelposten-Sichtbarkeit | rejected/learning |
| `150-value-entries-page-text.txt` | UI-Seitentext | Wertposten zur Rechnung `108219`; `Item Ledger Entry No. = 793`, `RAW-STEEL`, Kosten `25.000` | Dimensionen in Posten | labor |
| `155-item-ledger-entry-by-entry-no-page-text.txt` | UI-Seitentext | Artikelposten `793` zu `RAW-STEEL`, Menge `10`, Lagerort `FRA-ZL` | `PRODUCTLINE=MACHINE` in P2P-Posten | labor |
| `160-posting-trace-summary.json` | JSON-Zusammenfassung | gebuchte Rechnung, Kreditorenposten, Sachposten, Artikelposten und Wertposten sind sichtbar; Artikelposten ueber Wertposten gefunden | Dimensionen in P2P-Posten, deutsche Vorsteuer | labor |
| `999-purchase-order-aborted-cleanup.json` | JSON-Cleanup | ein frueherer Preview-Fehlversuch wurde geloescht | laufende Buchung | labor-cleanup |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen der PNGs | keine eigene fachliche Wahrheit ohne JSON/Markdown | labor |

## Kernaussage

`UAT-P2P-001` ist in `RM-DEMO` als CRONUS-USA-Laborprozess bis zur kontrollierten Buchung belegt. Bestellung `106049` wurde mit `K10000`, `RAW-STEEL`, Menge `10`, Lagerort `FRA-ZL` und `Direct Unit Cost = 2500` erstellt. Vor Preview/Buchung musste eine `Vendor Invoice No.` gepflegt werden; die Standard-API `purchaseOrders` stellt dieses Feld nicht bereit, ODataV4 `purchaseDocuments` schon.

`Preview Posting` zeigte echte Vorschauarten. Danach wurde genau einmal `Receive and Invoice` gebucht. Die gebuchte Einkaufsrechnung lautet `108219`. Sachposten zeigen im CRONUS-Labor unter anderem `22100 Accounts Payable, Domestic` und `14140 Resale Items`. Der Wertposten verweist auf `Item Ledger Entry No. = 793`; darueber ist der Artikelposten fuer `RAW-STEEL` sichtbar.

## Grenzen

- Der Lauf bleibt CRONUS-USA-Labor.
- Waehrung ist `USD`, nicht das deutsche Zielbild `EUR`.
- Tax/VAT bleibt `0 %`; deutsche `19 %` Vorsteuer ist nicht belegt.
- `PRODUCTLINE=MACHINE` ist in der P2P-Postenspur noch nicht sichtbar.
- Die direkte Artikelpostenfilterung nach `Order No. = 106049` blieb leer; der robuste Nachweis erfolgt ueber `Value Entry -> Item Ledger Entry No. = 793`.

## Naechster Schritt

P2P-Anfaengererklaerung und Buchkapitel 12 weiter schaerfen: Warum `Vendor Invoice No.`, Preview Posting, `Receive and Invoice`, Kreditorenposten, Sachposten, Artikelposten und Wertposten verschiedene Dinge sind. Danach Payment/OP-Ausgleich oder Inventory/Lagerbewertung auf Basis der gebuchten Einkaufsrechnung `108219` vorbereiten.
