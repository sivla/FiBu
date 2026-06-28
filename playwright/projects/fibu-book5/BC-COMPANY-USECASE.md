# Business Central Company Usecase

Status: `labor-draft`, `labor-reference`, `needs-german-final-rebuild`.

## Projektziel

Dieses Projekt baut ein vollstaendiges Business-Central-Standard-Playthrough fuer ein anfaengerfreundliches, evidence-basiertes FiBu-Buch. Jeder relevante Prozess soll langfristig mit Klickpfad, Screenshots, Evidence, Fehlerdiagnose, Setup-Abhaengigkeiten, Posting-/Ledger-Wirkung und German-Final-Rebuild-Hinweis abgedeckt werden.

## Aktuelle Laborumgebung

| Feld | Wert |
|---|---|
| Instanz | `MCP_1_20260210` |
| Laborcompany | `RM-DEMO` |
| Datenbasis | CRONUS-USA-Labor / Vorproduktion |
| Status | Labor, nicht deutscher Finalnachweis |
| Harte Grenze | Keine Aktion ausserhalb `MCP_1_20260210` |

Innerhalb `MCP_1_20260210` darf der Autopilot autonom arbeiten, wenn der aktive Case es erlaubt und Evidence entsteht:

- Companies anlegen oder wechseln.
- Setup aendern.
- Stammdaten anlegen oder korrigieren.
- Belege erstellen.
- Preview Posting ausfuehren.
- Posting, Receive, Ship, Invoice und Payment ausfuehren.
- Fehlerfaelle provozieren und korrigieren.
- Cleanup oder Trace dokumentieren.
- Screenshots, Evidence, Buchdraft, Atlas und State aktualisieren.

Diese Freiheit gilt nur fuer Sandbox-/Laborarbeit. `.env`, Auth, Secrets, Reports, Traces und Rohsnapshots werden nicht committed.

## Scope-Grenzen

Shopify / Online Store bleibt fuer Buch 5 vorerst out of scope. Dropshipping kann spaeter als Business-Central-Standardprozess ohne Shop-Connector behandelt werden. Ein eigener Shopify-Scope ist nur spaeter mit ausdruecklicher Entscheidung sinnvoll.

## Zielbild Unternehmensgruppe

Die Mustergruppe darf wachsen, wenn ein Business-Central-Bereich neue Gesellschaften, Standorte, Rollen, Steuerfaelle, Waehrungen, Artikel, Ressourcen oder Prozesse braucht.

| Company | Zweck | BC-Bereiche |
|---|---|---|
| `RM-HOLDING` | Konzern, Reporting, Intercompany, Konsolidierung | Reporting, Intercompany, Abschluss |
| `RM-PROD` | Produktion, Einkauf, Lager, Fertigung | P2P, Inventory, Manufacturing, Warehouse |
| `RM-SALES` | Vertrieb und Kundenprozesse | O2C, Pricing, Versand, Retouren |
| `RM-SERVICE` | Service, Wartung, Ersatzteile | Service Orders, Service Items, Ersatzteile |
| `RM-PROJECTS` | Projekte, Installation, Ressourcen | Jobs/Projects, Ressourcen, Projektabrechnung |
| `RM-SHARED` | Finance, Payments, Reporting, Admin | Payments, Bank, Reporting, Security |
| `RM-EU` / `RM-AT` | EU-Ausland und Steuerfaelle | VAT, Intercompany, EU-Verkaeufe/Einkauf |
| `RM-US` | optional Drittland, Export, Fremdwaehrung | Export, USD, Fremdwaehrung |

## Labor vs. Final

- `RM-DEMO` liefert Labor-Evidence, Clickguides, Lernnotizen und Prozessentwuerfe.
- Deutsche Final-Screenshots, deutsche Steuerlogik, deutscher Kontenplan und Compliance-Claims muessen spaeter in einer deutschen Zielinstanz neu belegt werden.
- Alte Labor-Evidence darf die deutsche Finalstrecke vorbereiten, aber nicht ersetzen.

## Wachstum des Usecase

Neue Companies, Standorte oder Rollen werden nur angelegt, wenn ein Prozess sie wirklich braucht. Jeder neue Baustein braucht:

- Zweck.
- Datenbasis.
- BC-Bereich.
- erlaubte Nutzung.
- Setup-Status.
- Evidence-Plan.
- German-Final-Rebuild-Hinweis.
