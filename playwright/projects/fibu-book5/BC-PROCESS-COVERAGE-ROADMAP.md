# BC Process Coverage Roadmap

Status: `labor-reference`.

Ziel: Business Central nicht in Mikro-Gates verlieren, sondern Prozessstrecken bis Posting, Postenspur, Buchdraft und German-Final-Rebuild planen.

Usecase-Basis ist jetzt die Universaarl-Welt in `playthru` mit der Zielcompany `UNIVERSAARL-DE`. `RM-DEMO`, Rhein-Main und CRONUS bleiben nur historische Laborreferenz, bis Universaarl-Evidence die alten Strecken ersetzt.

## Naechste groesste Hebel

| Prioritaet | Prozess | Zielstrecke | Warum | Naechster Case |
|---:|---|---|---|---|
| 0 | PREP bis Rechte vorhanden sind | Backlog -> Atlasqualitaet -> Buchfluss -> Read-only-Discovery -> Replanning | Company Creation ist fachlich der naechste Execute-Hebel, bleibt aber bis SUPER-/Company-Create-Rechten geparkt | `PREP-022-ATLAS-COVERAGE-QUALITY-AUDIT` |
| 1 | Universaarl Company Creation | `playthru` -> `Mandanten` -> Pfeil neben `Neu` -> `Neues Unternehmen erstellen` -> sichtbare Company oder exakter Berechtigungsfehler | Ohne `UNIVERSAARL-DE` gibt es keinen sauberen Zielraum fuer Foundation, Stammdaten oder Posting | `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE`, erst nach Rechtebestaetigung |
| 2 | Company Information / Foundation | Company Information -> Assisted/Manual Setup -> Nummernserien -> Buchungsgruppen -> USt -> Dimensionen | Foundation entscheidet, ob spaetere Preview-/Posting-Strecken fachlich erklaerbar sind | `TARGET-COMPANY-INFO-001`, dann `TARGET-FOUNDATION-001` |
| 3 | Stammdatenwelle | Kunden, Kreditoren, Artikel, Lagerorte, Dimensionen, Bankkonto | Listen, Filter, Karten, FastTabs und erste Prozesse brauchen sinnvolle Universaarl-Daten | `TARGET-DATA-CUSTOMERS-001` bis `TARGET-DATA-BANK-001` |
| 4 | Erste Prozesswelle | O2C, P2P, Inventory, Payments mit Preview/Post/Entry Trace | Erst diese Strecken erzeugen echte Buchwahrheit fuer Belege, Posten, USt, Lagerwert und OP-Ausgleich | `TARGET-O2C-001`, `TARGET-P2P-001`, `TARGET-INVENTORY-001`, `TARGET-PAYMENT-001` |
| 5 | Reporting/Korrekturen/Spezialprozesse | Reporting, Corrections, FA, Warehouse, Manufacturing, Service, Projects, Security, Change Log, Job Queue | Diese Kapitel werden belastbar, wenn Foundation und erste Posten stehen | nach erster Prozesswelle planen |

## Prozess ueber Fragment

Ein einzelnes Gate ist nur ein Kontrollpunkt. Wenn das Gate gruen ist, muss der naechste sichere Prozessschritt geplant oder ausgefuehrt werden. Stop ist nur gerechtfertigt bei Risiko, widerspruechlicher Evidence, falscher Instanz/Company, unklarem Setup oder fehlendem Cleanup-/Trace-Plan.

## Legacy-Prozessstrecken

P2P, Bank, Fixed Assets, Warehouse und Manufacturing aus RM-DEMO bleiben als Lern- und Fehlerarchiv wichtig. Sie sind aber keine aktive Universaarl-Queue mehr. Ein Legacy-Befund wird erst wieder aktiv, wenn er als generisches Playwright-Muster, Buchrisiko oder Universaarl-Rebuild-Hinweis in einen konkreten `TARGET-*`-Usecase ueberfuehrt wurde.
