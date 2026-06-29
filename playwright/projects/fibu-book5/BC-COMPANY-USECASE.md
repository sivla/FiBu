# Business Central Company Usecase

Status: `german-final-candidate`, `company-to-be-created-through-book-process`.

## Projektziel

Dieses Projekt baut ein vollstaendiges Business-Central-Standard-Playthrough fuer ein anfaengerfreundliches, evidence-basiertes FiBu-Buch. Die aktive Buchwelt ist ab jetzt Universaarl: Zielinstanz `playthru`, Zielcompany `UNIVERSAARL-DE`, Musterfirma `Universaarl GmbH`. Die Zielcompany wird nicht vorausgesetzt, sondern als eigener UI-first Buchprozess angelegt und bewiesen.

## Aktive Zielwelt

| Feld | Wert |
|---|---|
| Instanz | `playthru` |
| Zielcompany | `UNIVERSAARL-DE` |
| Rechtlicher Name | `Universaarl GmbH` |
| Datenbasis | Universaarl-Musterfirma, UI-first aufzubauen |
| Status | German-Final-Candidate, Company noch anzulegen |
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

Die Universaarl-Musterfirma darf wachsen, wenn ein Business-Central-Bereich neue Gesellschaften, Standorte, Rollen, Steuerfaelle, Waehrungen, Artikel, Ressourcen oder Prozesse braucht.

| Company | Zweck | BC-Bereiche |
|---|---|---|
| `UNIVERSAARL-DE` | erste deutsche Zielcompany und Buch-Hauptmandant | Foundation, Finance, O2C, P2P, Inventory, Fixed Assets, Reporting |
| `UNIVERSAARL-PROD` | spaetere Produktion, Einkauf, Lager, Fertigung | P2P, Inventory, Manufacturing, Warehouse |
| `UNIVERSAARL-SALES` | spaetere Vertriebs- und Kundenprozesse | O2C, Pricing, Versand, Retouren |
| `UNIVERSAARL-SERVICE` | spaeter Service, Wartung, Ersatzteile | Service Orders, Service Items, Ersatzteile |
| `UNIVERSAARL-HOLDING` | spaeter Konzern, Reporting, Intercompany, Konsolidierung | Reporting, Intercompany, Abschluss |

## Labor vs. Final

- Universaarl liefert kuenftig aktive Buch- und Final-Candidate-Evidence.
- Alte `RM-DEMO`-Evidence liefert nur noch historische Laborhinweise.
- Deutsche Final-Screenshots, deutsche Steuerlogik, deutscher Kontenplan und Compliance-Claims muessen in `playthru` / `UNIVERSAARL-DE` neu belegt werden.

## Wachstum des Usecase

Neue Companies, Standorte oder Rollen werden nur angelegt, wenn ein Prozess sie wirklich braucht. Jeder neue Baustein braucht:

- Zweck.
- Datenbasis.
- BC-Bereich.
- erlaubte Nutzung.
- Setup-Status.
- Evidence-Plan.
- German-Final-Rebuild-Hinweis.
