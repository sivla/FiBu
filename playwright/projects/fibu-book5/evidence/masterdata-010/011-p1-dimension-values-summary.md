# MASTERDATA-010: P1-Dimensionswerte fuer P2P und Inventory

| Wert | Zweck | Ergebnis |
|---|---|---|
| DEPARTMENT=PURCH | P2P braucht eine Einkaufsabteilungsachse. | created |
| DEPARTMENT=WHSE | Inventory/Warehouse braucht eine Lagerabteilungsachse. | created |
| PRODUCTLINE=SPARE | Ersatzteil-, Inventory- und spaetere Servicefaelle brauchen eine Produktlinie. | created |
| LOCATION-GROUP=SIMPLE | Der einfache Lagerort `MZ-EINFACH` braucht eine Lagerlogik-Achse. | created |

## Laborgrenze

Dieser Lauf legt nur P1-Werte fuer die naechsten realistischen Prozesse an. Service-, Projekt-, Intercompany- und Mietwerte bleiben bewusst spaeter. Es wurde keine Pflichtdimensionslogik provoziert und keine Buchung ausgefuehrt.

## Buchwirkung

Kapitel 10 kann jetzt sauber unterscheiden: O2C-Kernwerte sind vorhanden, und die ersten P1-Erweiterungswerte fuer Einkauf/Lager sind ebenfalls vorbereitet. Die vollstaendige Buchmatrix ist weiterhin nicht komplett.
