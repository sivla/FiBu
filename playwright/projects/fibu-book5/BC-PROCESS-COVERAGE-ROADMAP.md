# BC Process Coverage Roadmap

Status: `labor-reference`.

Ziel: Business Central nicht in Mikro-Gates verlieren, sondern Prozessstrecken bis Posting, Postenspur, Buchdraft und German-Final-Rebuild planen.

## Naechste groesste Hebel

| Prioritaet | Prozess | Zielstrecke | Warum | Naechster Case |
|---:|---|---|---|---|
| 1 | P2P Teil-WE | PO Draft/Line -> Qty. to Receive -> Preview -> Receive -> Receipt/Item/Value Trace | baut auf P2P-004 auf und lehrt 3-Way-Match | `P2P-005`, danach Preview/Post-Case |
| 2 | Bankabstimmung | Zahlung -> Bank Ledger -> Reconciliation | schliesst Payment-Lernstrecke | neuer Bank-Reconciliation-Case |
| 3 | Fixed Assets AfA | Calculate Depreciation -> Journal Line -> Preview -> Post -> FA/G/L Trace | Kapitel 21 bleibt blockiert | bounded AfA-Follow-up |
| 4 | Reporting/Dimensions | Dimensionen in Analysis/Financial Reports nutzbar machen | Buch Kapitel 25 braucht Auswertung | Analysis View/Report Fit |
| 5 | Inventory Costing | Zielbestand/Valuation bereinigt erklaeren | Lagerwert ist zentral fuer O2C/P2P | Inventory Costing Route |
| 6 | German Final Rebuild | Zielinstanz registrieren, Baseline, Screenshots | finaler Buchbeweis | sobald Instanz verfuegbar |

## Prozess ueber Fragment

Ein einzelnes Gate ist nur ein Kontrollpunkt. Wenn das Gate gruen ist, muss der naechste sichere Prozessschritt geplant oder ausgefuehrt werden. Stop ist nur gerechtfertigt bei Risiko, widerspruechlicher Evidence, falscher Instanz/Company, unklarem Setup oder fehlendem Cleanup-/Trace-Plan.
