# P2P-009 Purchase Lines Cell Edit Helper

Status: `labor-blocked`, `helper-evidence-captured`, `needs-german-final-rebuild`

Instanz/Company: `MCP_1_20260210` / `RM-DEMO`

Beleg: Purchase Order `106051`, Zeile `RAW-STEEL`

## Ergebnis

P2P-009 hat den aktuellen Cell-Edit-Ansatz nicht geloest. Die Zeile ist sichtbar und `Direct Unit Cost Excl. Tax = 2.500,00` ist in der gemappten Zelle sichtbar. `Location Code = FRA-ZL`, `Quantity = 4` und `Qty. to Receive = 2` wurden nach Single-Click/Enter, Double-Click und F2 nicht sichtbar persistiert.

Keine Preview Posting, kein Posting, kein Receive, kein Setup Change, kein Company Switch, kein API Shortcut.

## Evidence

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `P2P-009-result.json` | Result JSON | Laufstatus, Flags, Fachpruefung, Feldresultate, Blocker | Zielwerte/Preview/Post | `labor-blocked` |
| `010-before-grid-geometry.json` | Grid-Geometrie | Header, RAW-STEEL-Zeile und Cells vor Probe | persistierte Zielwerte | `helper-evidence` |
| `011-action-candidates.json` | Action-Inventar | sichtbare relevante Action-Kandidaten | echten Edit-Mode-Button | `helper-evidence` |
| `012-before-page-text-compact.txt` | kompakter UI-Text | Beleg-/Zeilenkontext vor Probe | technische Tabellenlogik | `labor` |
| `020-after-grid-geometry.json` | Grid-Geometrie | mapped cells nach Probe; Unit Cost sichtbar | `FRA-ZL`, Menge `4`, `Qty. to Receive 2` | `labor-blocked` |
| `021-after-page-text-compact.txt` | kompakter UI-Text | sichtbarer Nachher-Kontext | Zielwerte/Posting | `labor` |
| `p2p-009-010-before-cell-edit.screenshot.json` | Screenshot-Metadaten | Zweck/Grenze des Before-Screenshots | finalen deutschen Nachweis | `labor` |
| `p2p-009-020-after-cell-edit.screenshot.json` | Screenshot-Metadaten | Zweck/Grenze des After-Screenshots | Zielwerte/Posting | `labor-blocked` |

## Naechster sinnvoller Schritt

Nicht mit Preview Posting fortfahren. Erst einen echten Purchase-Lines-Edit-Mode-/Cell-Editor-Pfad finden oder einen frischen kontrollierten Draft-/Select-items-Pfad bauen, der Zielwerte vor oder waehrend der Zeilenerzeugung sichtbar setzt.
