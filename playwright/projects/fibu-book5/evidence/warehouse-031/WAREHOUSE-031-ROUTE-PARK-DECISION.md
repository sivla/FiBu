# WAREHOUSE-031 - Warehouse Source Route Park Decision

Status: labor-blocked / labor-sufficient-for-book-draft / needs-german-final-rebuild

## Entscheidung

Die RM-DEMO-Warehouse-Source-Document-Route wird geparkt. Ein guarded Stockkeeping-Unit-Setup-Fit waere aktuell spekulativ, weil WAREHOUSE-030 keine Zielroute mit RAW-STEEL und FRA-ZL bewiesen hat.

## Warum nicht weiterklicken?

- WAREHOUSE-016 bis 018 erreichen Source-Selection-Kontexte, aber ohne klare Quelle.
- WAREHOUSE-021 erzeugt Purchase Order 106055 mit RAW-STEEL, aber nicht mit FRA-ZL.
- WAREHOUSE-024, 026 und 027 erschoepfen die sichtbaren Zeilen-/Editor-/Line-Menue-Wege.
- WAREHOUSE-029 zeigt keine direkte FRA-ZL-Default-Location auf Vendor oder Item.
- WAREHOUSE-030 zeigt keine brauchbare Stockkeeping-Unit- oder Item-Vendor-Default-Route.

## Buchwirkung

Der Befund ist kein Prozessende, aber ein guter Labor-Lernfall: Warehouse Receipt braucht zuerst eine eligible Source. Ohne sichtbare Quelle mit richtigem Lagerort darf man nicht Release, Source Confirm oder Posting erzwingen.

## German Final Rebuild

In der deutschen Zielumgebung muss der Warehouse-Fall neu und sauber aufgebaut werden: Stammdaten, Lagerort, Defaulting/SKU oder sichere Zeileneingabe, freigegebene Einkaufsbestellung, Warehouse Receipt Source Selection, Receipt Posting, Put-away und Postenspur.
