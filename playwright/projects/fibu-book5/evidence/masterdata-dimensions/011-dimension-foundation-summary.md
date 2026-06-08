# MASTERDATA-DIMENSIONS: Foundation und Dimensionen

| Pruefpunkt | Ergebnis | Status |
|---|---|---|
| Sandbox/Company | MCP_1_20260210 / RM-DEMO | Labor |
| Dimensionen | DEPARTMENT, CHANNEL, PRODUCTLINE, LOCATION-GROUP | praktisch geprueft |
| Fehlende Dimensionen | COMPANY-GROUP | nicht per API angelegt |
| Dimensionswerte | COMPANY-GROUP: PROD, SALES, SERVICE, SHARED, AT; DEPARTMENT: SALES, PURCH, WHSE, PROD, SERV, FIN, ADMIN; CHANNEL: B2B, SHOP, IC, SERVICE, PROJECT; PRODUCTLINE: MACHINE, SPARE, RENTAL, SERVICE; LOCATION-GROUP: DIRECTED, SIMPLE, VAN, PROJECT, DROP | Sollwert geprueft |
| Fehlende Dimensionswerte | COMPANY-GROUP.PROD, COMPANY-GROUP.SALES, COMPANY-GROUP.SERVICE, COMPANY-GROUP.SHARED, COMPANY-GROUP.AT, DEPARTMENT.SERV, DEPARTMENT.FIN, DEPARTMENT.ADMIN, CHANNEL.SHOP, CHANNEL.IC, CHANNEL.SERVICE, CHANNEL.PROJECT, PRODUCTLINE.RENTAL, PRODUCTLINE.SERVICE, LOCATION-GROUP.VAN, LOCATION-GROUP.PROJECT, LOCATION-GROUP.DROP | nicht per API angelegt |
| Default Dimension Debitor | D10000 -> CHANNEL=B2B | nachgewiesen |
| Default Dimension Artikel | RM-M100 -> PRODUCTLINE=MACHINE | nachgewiesen |
| Pflichtdimensionslogik | nicht provoziert | eigener Fehler-/Buchungslernfall |
| PROJECT-Dimension | nicht angelegt | spaeterer Projektblock |
| Deutscher Finalnachweis | offen | keine 19-%-USt-/DE-Company-Aussage |

## Buchwirkung

Kapitel 10 kann den O2C-Kern als RM-DEMO-Laborfit lesen: DEPARTMENT, CHANNEL, PRODUCTLINE und LOCATION-GROUP existieren, und die Default Dimensions fuer O2C sind weiterhin der konkrete Prozessanker. Die ersten P1-Erweiterungswerte fuer P2P/Inventory sind vorbereitet. COMPANY-GROUP und spaetere Service/Project/Shop/IC-Werte sind noch kein Laborfit. Pflichtdimensionen werden nicht blind global erzwungen; sie brauchen einen separaten Lernfall mit bewusstem Fehlerbild.

## Naechster Schritt

Posting Groups/P2P erst starten, wenn `K10000`, `RAW-STEEL`, Vendor Posting Group, General Posting Setup, Tax/VAT-Laborgrenze und Nummernserie geprueft werden.
