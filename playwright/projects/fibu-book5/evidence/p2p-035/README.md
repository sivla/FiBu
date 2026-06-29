# P2P-035 - Partial Receipt Route Decision

Status: `labor-blocked`, `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`

Dieser Lauf hat keine neue BC-/Playwright-Ausfuehrung erzeugt. Er schliesst die bisherige Purchase-Order-Zellbearbeitungsroute als geparkt ab und aktualisiert den P2P-Labordraft.

## Entscheidung

- Purchase-Order-Zellrouten aus `P2P-007` bis `P2P-011` nicht weiter blind wiederholen.
- `Location FRA-ZL`, `Quantity 4` und `Qty. to Receive 2` wurden dort nicht stabil sichtbar/persistiert.
- `Item Journal` bleibt die stabilste beobachtete Material-/Mengen-/Wert-Route, ist aber Inventory-Evidence und kein Kreditor-/Bestellprozess.
- Purchase Journal ist als direkte Finance-Route mit `P2P032-682298` belegt, aber ohne Artikel-/Wertposten.

## German-Final-Rebuild

Der deutsche finale Teil-WE-Fall muss spaeter in einer deutschen Zielcompany neu aufgebaut werden: Einkaufsbestellung, Artikelzeile, Menge, Teilmenge, Preview, Wareneingang, Rechnung und Postenspur.
