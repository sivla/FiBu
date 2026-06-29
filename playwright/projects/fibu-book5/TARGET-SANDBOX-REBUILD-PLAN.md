# Target Sandbox Rebuild Plan

Status: `universaarl-rebuild-plan`, `no-final-claim-yet`.

## Ziel

`UNIVERSAARL-DE` wird in der Instanz `playthru` als deutsche Musterfirma `Universaarl GmbH` UI-first aufgebaut. Jeder relevante Buchprozess wird neu bewiesen, auch wenn es fuer denselben Prozess alte RM-DEMO-Labor-Evidence gibt.

## Muss Neu Erzeugt Werden

| Bereich | Universaarl-Neunachweis |
|---|---|
| Company/Organisation | Company-Anlage, Company Information, Rollen-/Startkontext |
| Foundation | Nummernserien, Buchungsgruppen, Dimensionen, Zahlungsbedingungen |
| Deutsche Steuer | VAT/USt-Setup, 19-%-Nachweis, VAT Entries, keine Laborbehauptung |
| O2C/P2P | Belege, Preview, Posting und Postenspur in Universaarl |
| Inventory/Warehouse | Artikel, Lagerorte, Bewegungen, Item/Value Entries |
| Fixed Assets | Anlagenkarte, Zugang, AfA, FA/G/L Integration |
| Payments/Bank | OP-Ausgleich, Payment Journal, Bankposten, Abstimmung |
| Reporting | Financial Reports, Dimensionen, Sachpostenbezug |

## Legacy-Nutzung

RM-DEMO-/Rhein-Main-/CRONUS-Evidence darf nur als technische Laborquelle zitiert werden:

- Welche UI-Muster funktionieren?
- Welche Blocker gab es?
- Welche Screenshot-/Trace-Punkte sind sinnvoll?
- Welche Buchaussagen muessen spaeter ersetzt werden?

Sie darf nicht als Universaarl- oder German-Final-Beweis gelten.

## Erste Execute-Reihenfolge

1. `TARGET-001`: `playthru` read-only Kontextbeweis.
2. `TARGET-002`: `UNIVERSAARL-DE` Company-Anlage via UI, falls TARGET-001 die Route sicher zeigt.
3. `TARGET-003`: Company Information fuer `Universaarl GmbH`.
4. `TARGET-004`: Foundation Setup Plan und erste Setup-Gates.
5. Danach pro Kapitel: Rebuild, Evidence, Buchpatch, Supersession.

