# Business Central Company Usecase

Status: `german-final-candidate`, `company-to-be-created-through-book-process`.

## Projektziel

Dieses Projekt baut ein vollstaendiges Business-Central-Standard-Playthrough fuer ein anfaengerfreundliches, evidence-basiertes FiBu-Buch. Die aktive Buchwelt ist ab jetzt Universaarl: Zielinstanz `playthru`, Zielcompany `UNIVERSAARL-DE`, Musterfirma `Universaarl GmbH`. Die Zielcompany wird nicht vorausgesetzt, sondern als eigener UI-first Buchprozess angelegt und bewiesen.

## Aktive Zielwelt

| Feld | Wert |
|---|---|
| Instanz | `playthru` |
| Erste Zielcompany | `UNIVERSAARL-DE` |
| Rechtlicher Name | `Universaarl GmbH` |
| Datenbasis | Universaarl-Musterfirma, UI-first aufzubauen |
| Status | German-Final-Candidate, erste Company existiert und wird aufgebaut |
| Harte Grenze | Keine Aktion ausserhalb der aktiven State-Instanz |

Innerhalb der aktiven Zielinstanz darf der Autopilot autonom arbeiten, wenn der aktive Case es erlaubt und Evidence entsteht:

- Companies anlegen oder wechseln.
- Setup aendern.
- Stammdaten anlegen oder korrigieren.
- Belege erstellen.
- Preview Posting ausfuehren.
- Posting, Receive, Ship, Invoice und Payment ausfuehren.
- Fehlerfaelle provozieren und korrigieren.
- Cleanup oder Trace dokumentieren.
- Screenshots, Evidence, Buchdraft, Atlas und State aktualisieren.

Diese Freiheit gilt nur fuer kontrollierte Sandbox-/Zielinstanzarbeit. `.env`, Auth, Secrets, Reports, Traces und Rohsnapshots werden nicht committed.

## Legacy-Laborarchiv

| Alte Referenz | Neuer Status |
|---|---|
| `MCP_1_20260210` | `legacy-labor-reference` |
| `RM-DEMO` | `legacy-labor-reference` |
| Rhein-Main / Rhein Main / RM-* | fruehere Buchwelt, aktiv zu ersetzen |
| CRONUS-/Demo-Bezuege | historische technische Evidence-Quelle |

Alte Evidence-Dateien, Result-JSONs und Screenshots bleiben erhalten, weil sie Beweisketten, Playwright-Lernen und Fehlerdiagnosen enthalten. Sie duerfen aber nicht mehr als aktive Zielwahrheit verwendet werden. Sobald ein Universaarl-Prozess neu bewiesen ist, wird der alte Laborstand als `superseded-by-universaarl` markiert.

## Scope-Grenzen

Shopify / Online Store bleibt fuer Buch 5 vorerst out of scope. Dropshipping kann spaeter als Business-Central-Standardprozess ohne Shop-Connector behandelt werden. Ein eigener Shopify-Scope ist nur spaeter mit ausdruecklicher Entscheidung sinnvoll.

## Zielbild Universaarl

Die Universaarl-Musterfirma ist als Mehr-Company-Fallstudie gedacht. `UNIVERSAARL-DE` ist der erste stabile Aufbaupunkt fuer Foundation, SKR04, USt, Stammdaten und erste Ende-zu-Ende-Prozesse. Danach folgen weitere Companies nicht als beliebige Extras, sondern als eigene Buchstrecken fuer Produktion, Vertrieb, Service, Holding/Konsolidierung und Intercompany.

| Company | Zweck | BC-Bereiche |
|---|---|---|
| `UNIVERSAARL-DE` | erste deutsche Aufbaucompany | Foundation, Finance, SKR04, USt, Stammdaten, erste O2C/P2P/Inventory/Fixed-Assets-Prozesse |
| `UNIVERSAARL-PROD` | Produktionscompany | P2P, Inventory, Manufacturing, Warehouse |
| `UNIVERSAARL-SALES` | Vertriebscompany | O2C, Pricing, Versand, Retouren |
| `UNIVERSAARL-SERVICE` | Servicecompany | Service Orders, Service Items, Ersatzteile |
| `UNIVERSAARL-HOLDING` | Holding/Konzerncompany | Reporting, Intercompany, Abschluss, Konsolidierungsvorbereitung |

Intercompany ist damit kein optionaler Randfall. Es wird erst spaeter aufgebaut, weil Intercompany ohne sauberen Kontenplan, Nummernserien, USt-Logik, Stammdaten und mindestens zwei Companies keinen belastbaren Buchprozess ergibt.

## Labor vs. Final

- Universaarl liefert kuenftig aktive Buch- und Final-Candidate-Evidence.
- Alte `RM-DEMO`-Evidence liefert nur noch historische Laborhinweise.
- Deutsche Final-Screenshots, deutsche Steuerlogik, deutscher Kontenplan und Compliance-Claims muessen in `playthru` / `UNIVERSAARL-DE` neu belegt werden.

## Wachstum des Usecase

Neue Companies, Standorte oder Rollen werden angelegt, sobald die jeweilige Buchstrecke sie fachlich braucht. Jeder neue Baustein braucht:

- Zweck.
- Datenbasis.
- BC-Bereich.
- erlaubte Nutzung.
- Setup-Status.
- Evidence-Plan.
- German-Final-Rebuild-Hinweis.
