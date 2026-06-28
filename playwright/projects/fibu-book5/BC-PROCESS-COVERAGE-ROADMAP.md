# BC Process Coverage Roadmap

Status: `labor-reference`.

Ziel: Business Central nicht in Mikro-Gates verlieren, sondern Prozessstrecken bis Posting, Postenspur, Buchdraft und German-Final-Rebuild planen.

Usecase-Basis: `BC-COMPANY-USECASE.md` beschreibt die Laborcompany `RM-DEMO` und die spaetere Rhein-Main-Unternehmensgruppe. Bis eine deutsche Zielinstanz existiert, bleiben alle praktischen Nachweise aus `RM-DEMO` Laborreferenz.

## Naechste groesste Hebel

| Prioritaet | Prozess | Zielstrecke | Warum | Naechster Case |
|---:|---|---|---|---|
| 1 | P2P Teil-WE | PO Draft/Line -> Qty. to Receive -> Preview -> Receive -> Receipt/Item/Value Trace | baut auf P2P-004 bis P2P-009 auf und lehrt 3-Way-Match | erst Zielwerte loesen, danach Preview/Post-Case |
| 1a | P2P Teil-WE Grid-Control | Draft `106051` -> `Select items...` -> `RAW-STEEL`-Zeile -> Zielwerte | Datenzeile ist geloest; P2P-009 zeigt, dass Display-Textbox-Fokus Zielwerte nicht persistiert | true Edit-Mode Action Discovery oder frischer kontrollierter Draft-/Select-items-Wertepfad |
| 2 | Bankabstimmung | Zahlung -> Bank Ledger -> Reconciliation | schliesst Payment-Lernstrecke | neuer Bank-Reconciliation-Case |
| 3 | Fixed Assets AfA | Calculate Depreciation -> Journal Line -> Preview -> Post -> FA/G/L Trace | Kapitel 21 bleibt blockiert | bounded AfA-Follow-up |
| 4 | Reporting/Dimensions | Dimensionen in Analysis/Financial Reports nutzbar machen | Buch Kapitel 25 braucht Auswertung | Analysis View/Report Fit |
| 5 | Inventory Costing | Zielbestand/Valuation bereinigt erklaeren | Lagerwert ist zentral fuer O2C/P2P | Inventory Costing Route |
| 6 | German Final Rebuild | Zielinstanz registrieren, Baseline, Screenshots | finaler Buchbeweis | sobald Instanz verfuegbar |

## Prozess ueber Fragment

Ein einzelnes Gate ist nur ein Kontrollpunkt. Wenn das Gate gruen ist, muss der naechste sichere Prozessschritt geplant oder ausgefuehrt werden. Stop ist nur gerechtfertigt bei Risiko, widerspruechlicher Evidence, falscher Instanz/Company, unklarem Setup oder fehlendem Cleanup-/Trace-Plan.
