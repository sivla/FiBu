# BC Action Atlas

Status: `labor-reference`.

| Action | Bereich | Status | Belegte Nutzung | Evidence | Guard |
|---|---|---|---|---|---|
| `New` auf Purchase Orders | P2P | `labor-proven` | oeffnet Draft `106002` | `evidence/p2p-004/` | nur nach Listen-/Page-Kontext, nicht ungescoped global |
| `Preview Posting` | P2P | `labor-proven` fuer UAT-P2P-001 | Vorschauarten vor Rechnung `108219` | `evidence/p2p-001/095-preview-posting-result.json` | default-locked, P2P-005 noch ohne Preview |
| `New` auf Purchase Orders | P2P | `labor-proven` fuer P2P-005 Fallback | erzeugt kontrollierten Draft, wenn vorhandener Draft nicht als Basis taugt | `evidence/p2p-005/P2P-005-result.json` | nur case-gesteuert; Draft `106051` bleibt Labor-Blocker-Draft |
| `Breite Layoutansicht anzeigen` | P2P/Playwright | `labor-reusable` | vergrössert die Purchase Order Page/Karte vor Grid-Diagnose | `evidence/p2p-006/P2P-006-result.json`, `img/p2p-006-010-draft-open-wide.png` | sicher als read-only Layoutaktion; beweist keine Werte |
| `Fokusmodus umschalten` auf Lines | P2P/Playwright | `labor-reusable` | vergrössert Purchase Order Lines und macht Spalten wie `Qty. to Receive` sichtbar | `evidence/p2p-006/020-grid-control-snapshot.json`, `img/p2p-006-020-lines-focus-mode.png` | sicher als read-only Layoutaktion; wenn keine Datenzeile sichtbar ist, bleibt Werteingabe blockiert |
| `Receive and Invoice` | P2P | `labor-proven` | genau eine Laborbuchung `108219` | `evidence/p2p-001/100-purchase-posting-result.json` | nicht wiederholen ohne neuen Case |
| `Post` im Payment Journal | P2P Payment | `labor-proven` | Zahlung `PAYP2P-108219` | `evidence/p2p-002/` | default-locked |
| `Apply Entries` | P2P Payment | `labor-proven` | Bezug Zahlung/Rechnung | `evidence/p2p-002/`, `p2p-003/` | read-only pruefen vor Post |
| `Post` im FA G/L Journal | Fixed Assets | `labor-proven` | Zugang `G05001` | `evidence/fixedassets-225/` | genau dokumentierte Laborbuchung, nicht wiederholen |
| `Calculate Depreciation` | Fixed Assets | `labor-blocked` | OK ausgefuehrt, keine sichtbare Journalzeile im geprueften Kontext | `evidence/fixedassets-291/` | kein weiterer OK ohne neuen Gate-Plan |
| Page Inspection `Ctrl+Alt+F1` | Debugging | `labor-reusable` | technische Page/Table-Diagnose | `fixedassets-051` und Patterns | Werte muessen separat sichtbar sein |
| Personalize | Debugging | `labor-reusable` | Feldverfuegbarkeit diagnostizieren | `fixedassets-049` | kein stilles Buchscreen-/Setup-Ersatzbild |
