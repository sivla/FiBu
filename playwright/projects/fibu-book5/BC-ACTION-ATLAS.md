# BC Action Atlas

Status: `labor-reference`.

| Action | Bereich | Status | Belegte Nutzung | Evidence | Guard |
|---|---|---|---|---|---|
| `New` auf Purchase Orders | P2P | `labor-proven` | oeffnet Draft `106002` | `evidence/p2p-004/` | nur nach Listen-/Page-Kontext, nicht ungescoped global |
| `Preview Posting` | P2P | `labor-proven` fuer UAT-P2P-001 | Vorschauarten vor Rechnung `108219` | `evidence/p2p-001/095-preview-posting-result.json` | default-locked, P2P-005 noch ohne Preview |
| `Receive and Invoice` | P2P | `labor-proven` | genau eine Laborbuchung `108219` | `evidence/p2p-001/100-purchase-posting-result.json` | nicht wiederholen ohne neuen Case |
| `Post` im Payment Journal | P2P Payment | `labor-proven` | Zahlung `PAYP2P-108219` | `evidence/p2p-002/` | default-locked |
| `Apply Entries` | P2P Payment | `labor-proven` | Bezug Zahlung/Rechnung | `evidence/p2p-002/`, `p2p-003/` | read-only pruefen vor Post |
| `Post` im FA G/L Journal | Fixed Assets | `labor-proven` | Zugang `G05001` | `evidence/fixedassets-225/` | genau dokumentierte Laborbuchung, nicht wiederholen |
| `Calculate Depreciation` | Fixed Assets | `labor-blocked` | OK ausgefuehrt, keine sichtbare Journalzeile im geprueften Kontext | `evidence/fixedassets-291/` | kein weiterer OK ohne neuen Gate-Plan |
| Page Inspection `Ctrl+Alt+F1` | Debugging | `labor-reusable` | technische Page/Table-Diagnose | `fixedassets-051` und Patterns | Werte muessen separat sichtbar sein |
| Personalize | Debugging | `labor-reusable` | Feldverfuegbarkeit diagnostizieren | `fixedassets-049` | kein stilles Buchscreen-/Setup-Ersatzbild |
