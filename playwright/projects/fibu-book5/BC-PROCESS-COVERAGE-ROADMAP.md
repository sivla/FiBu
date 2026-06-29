# BC Process Coverage Roadmap

Status: `labor-reference`.

Ziel: Business Central nicht in Mikro-Gates verlieren, sondern Prozessstrecken bis Posting, Postenspur, Buchdraft und German-Final-Rebuild planen.

Usecase-Basis ist jetzt die Universaarl-Welt in `playthru` mit der Zielcompany `UNIVERSAARL-DE`. `RM-DEMO`, Rhein-Main und CRONUS bleiben nur historische Laborreferenz, bis Universaarl-Evidence die alten Strecken ersetzt.

## Naechste groesste Hebel

| Prioritaet | Prozess | Zielstrecke | Warum | Naechster Case |
|---:|---|---|---|---|
| 0 | Universaarl Company Creation | playthru -> Mandanten -> offizieller Create-New-Company-/Assisted-Setup-Pfad -> saubere Company-Basis | Ohne `UNIVERSAARL-DE` gibt es keinen sauberen Zielraum fuer Foundation, Stammdaten oder Posting | TARGET-004 scoped Companies Action/Menu Discovery; TARGET-003 fand keine sichtbare/klickbare exakte Aktion |
| 1 | P2P Teil-WE | PO Draft/Line -> Qty. to Receive -> Preview -> Receive -> Receipt/Item/Value Trace | baut auf P2P-004 bis P2P-012 auf und lehrt 3-Way-Match | PO-Lines-Zielwerte sind blockiert; Item Journal als Material-/Wertpfad oder Purchase Journal als P2P-Wertpfad kontrolliert weiterpruefen |
| 1a | P2P Teil-WE Grid-Control | Drafts `106051`/`106054` -> `RAW-STEEL`-Zeile -> Zielwerte | P2P-009 bis P2P-011 zeigen: Display-Textbox, Select-items und Action-Menues reichen nicht fuer Zielwerte | nicht wiederholen; P2P-012 priorisiert alternative Standard-UI |
| 1b | Alternative P2P/Inventory UI | Purchase Journal / Item Journal / Purchase Invoices / Requisition Worksheet | P2P-012 zeigt direkte Page-Routen ohne Suche; Item Journal ist stabil fuer Material-/Mengen-/Wertwirkung, Purchase Journal/Purchase Invoices bleiben P2P-Kandidaten | P2P-013 kontrollierter Journal-Follow-up mit Check/Preview/Trace-Gate |
| 2 | Bankabstimmung | Zahlung -> Bank Ledger -> Reconciliation | schliesst Payment-Lernstrecke | neuer Bank-Reconciliation-Case |
| 3 | Fixed Assets AfA | Calculate Depreciation -> Journal Line -> Preview -> Post -> FA/G/L Trace | Kapitel 21 bleibt blockiert | bounded AfA-Follow-up |
| 4 | Reporting/Dimensions | Dimensionen in Analysis/Financial Reports nutzbar machen | Buch Kapitel 25 braucht Auswertung | Analysis View/Report Fit |
| 5 | Inventory Costing | Zielbestand/Valuation bereinigt erklaeren | Lagerwert ist zentral fuer O2C/P2P | Inventory Costing Route |
| 6 | German Final Rebuild | Zielinstanz registrieren, Baseline, Screenshots | finaler Buchbeweis | sobald Instanz verfuegbar |

## Prozess ueber Fragment

Ein einzelnes Gate ist nur ein Kontrollpunkt. Wenn das Gate gruen ist, muss der naechste sichere Prozessschritt geplant oder ausgefuehrt werden. Stop ist nur gerechtfertigt bei Risiko, widerspruechlicher Evidence, falscher Instanz/Company, unklarem Setup oder fehlendem Cleanup-/Trace-Plan.
