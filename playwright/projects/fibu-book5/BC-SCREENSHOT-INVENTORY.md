# BC Screenshot Inventory

Status: `labor-reference`.

Grundregel: Ein Screenshot beweist nur, was im Bild sichtbar ist. Wenn Codes, Werte oder Posten nicht sichtbar sind, ist das Bild Kontext oder Debugging, nicht Buchbeweis.

| Screenshot-Gruppe | Status | Zweck | Buchnutzung | Grenze |
|---|---|---|---|---|
| `img/p2p-004-*` | `labor-gate` | Purchase Orders Liste, PO Draft nach New, Kopf nach Vendor `K10000` | Kapitel 12 Teil-WE-Startgate | keine Zeile/Menge/Preview/Buchung |
| `img/p2p-005-010-draft-open.png` | `labor-blocked` | Draft `106051` in `MCP_1_20260210/RM-DEMO` mit Vendor No. `K10000`; Lines-Grid noch nicht befuellbar nachgewiesen | Kapitel 12 Teil-WE-Blocker/Debugging | nicht fuer finalen Teil-WE |
| `img/p2p-005-015-fresh-draft-after-vendor.png` | `labor-blocked` | Frischer Fallback-Draft nach Vendor-Eingabe; belegt, warum `106051` als Labor-Blocker-Draft existiert | Kapitel 12 Labor-Lernfall | spaeter deutsch neu erzeugen |
| `img/p2p-006-*` | `labor-blocked` | Breite Layoutansicht und Lines-Fokusmodus fuer Purchase Order `106051`; Spalten sichtbar, keine Datenzeile sichtbar | Kapitel 12 Debugging/Lernfall zu BC-Subforms | keine Zielcodes `RAW-STEEL/FRA-ZL`, keine Menge/Preis/Qty. to Receive, kein Teil-WE-Beweis |
| `img/p2p-007-*` | `labor-proven` | `Select items...` Route erzeugt/revealt sichtbare `RAW-STEEL`-Zeile auf Purchase Order `106051` | Kapitel 12 Clickguide-Draft: erst Datenzeile erzeugen, dann Werte | Zielwerte `FRA-ZL`, Menge `4`, `Qty. to Receive 2` fehlen; kein Preview/Post |
| `img/p2p-008-*` | `labor-blocked` | `RAW-STEEL`-Zeile sichtbar, aber direkte Zielwerteingabe wird nicht sichtbar bestaetigt | Kapitel 12 Debugging/Lernfall: sichtbare Zeile reicht nicht fuer Teil-WE | `ATLANTA, GA` bleibt sichtbar; keine deutsche Finalstrecke |
| `img/p2p-009-*` | `labor-blocked` | `RAW-STEEL`-Zeile, breite Ansicht und spaltige Purchase-Lines-Kontextansicht nach Cell-Edit-Helper-Probe | Kapitel 12 Debugging/Lernfall: Display-Textbox-Fokus ist kein persistierter Zielwert | `FRA-ZL`, Menge `4`, `Qty. to Receive 2` sind nicht sichtbar; kein Preview/Post |
| P2P-001 Bilder | `labor-proven` | Einkauf, Preview, Rechnung, Postenspur | Kapitel 12 Laborstrecke | USD/0% Tax, kein deutscher Finalbeweis |
| P2P-002/P2P-003 Bilder | `labor-proven` | Payment Journal, Apply Entries, Vendor/Detailed/Bank/G/L trace | Kapitel 12/19/20 | keine Bankabstimmung |
| Fixed Assets G05001 Bilder | `labor-proven` | FA G/L Journal, Zugang, G/L/FA Ledger Trace | Kapitel 21 | kein deutscher Finalbeweis |
| Fixed Assets AfA Bilder | `labor-blocked` | Calculate Depreciation/Batches/Journal-Kontext | Kapitel 21 Lernblock | keine AfA-Journalzeile/Postenspur |
| Reporting Bilder | `partial-labor` | Financial Reports/Analysis/Dimensionen | Kapitel 25 | Auswertungswirkung nur teilweise belegt |
| Gemischtsprachige Laborbilder | `labor-reference` | Klickpfad, Debugging, Buchdraft | Buchdraft ja | finale deutsche Screenshots spaeter ersetzen |

## Screenshot-Typen

- `Company Context`
- `Navigation`
- `Setup Before/After`
- `Master Data Card`
- `Preflight`
- `Preview Posting`
- `Posting Dialog`
- `Posted Document`
- `Ledger Trace`
- `Report`
- `Error`
- `Rejected Path`
- `Book Candidate`
