# Company Registry FiBu Buch 5

Stand: 16.06.2026

Status: `governance`, `instance-bound`, `no-bc-run`, `no-company-switch`, `no-company-created`, `not-final`.

Diese Registry ist die verbindliche Mandantenkarte fuer die Business-Central-Sandbox `MCP_1_20260210`. Sie ersetzt nicht die praktische UI-Enumeration der Companies in Business Central, schafft aber die Governance-Basis: Company-Wechsel und neue Labor-Companies sind innerhalb dieser Instanz erlaubt, wenn Zweck, Risiko, Evidence-Plan und Rueckfalllogik vorher dokumentiert sind.

## Leitregel

Der Autopilot darf die Instanz `MCP_1_20260210` niemals verlassen. Innerhalb dieser Instanz duerfen Company-Wechsel und neue Labor-Companies nur erfolgen, wenn die Zielcompany in dieser Registry steht oder im selben Lauf vor der Aktion eingetragen wird.

Vor jeder Company-Aktion muss dokumentiert werden:

```text
Diese Company-Aktion ist als MCP_1_20260210-Sandbox-Aktion vertretbar, weil ...
```

Pflichtfelder: Zielcompany, Zweck, Buchkapitel, Datenbasis, erwartete Nutzung, Risiken, Evidence-Plan und Rueckfalllogik.

## Registry

| Company | Zweck | Datenbasis | Sprache/Lokalisierung | Status | Buchkapitel | Erlaubte Nutzung | Letzter Nachweis |
|---|---|---|---|---|---|---|---|
| `CRONUS USA, Inc.` | sichtbare CRONUS-Quell-/Referenzcompany in der Sandbox | CRONUS USA | gemischt Deutsch/Englisch, US-Steuerlogik | actual-visible / reference-only | 6, 10-12, 39 | read-only Referenz und moegliche Kopiervorlage; keine Prozessbuchungen ohne eigenen Company-Aktionsplan | `GOVERNANCE-013` Companies-Liste |
| `My Company` | sichtbare Standard-/Altcompany in der Sandbox, nicht aktueller Buchzielmandant | Standard-/Altcompany, Details nicht geprueft | gemischt, Lokalisierung nicht geprueft | actual-visible / do-not-use-until-profiled | 39 | nicht fuer Buchprozesse nutzen, bis Zweck, Datenbasis und Risiken profiliert sind | `GOVERNANCE-013` Companies-Liste |
| `RM-DEMO` | aktueller konsolidierter Lern- und Labor-Mandant fuer Buch 5 | CRONUS USA | gemischt Deutsch/Englisch, US-Steuerlogik | praktisch belegt / aktiv | 6-25, 39-40 | UI-first Lernen, Screenshots, Evidence, kontrollierte Laborbuchungen mit Gates/Preflight/Postenspur | `foundation/rm-demo-company.json`, O2C `PS-INV103297`, P2P `108219`, Inventory `INV008-899959`, Payment `PAY011-PS103297` |
| `RM-PROD` | spaetere Produktions-/Manufacturing-/Warehouse-Zielcompany | geplant, Vorlage noch offen | Ziel: deutsch, DE-Final offen | planned-only / not-created | 13, 14, 18, 23, 25 | erst nach Registry-gestuetztem Company-Setup; keine Nutzung ohne Company-Aktionsplan | bisher kein BC-Nachweis |
| `RM-SALES` | spaetere Vertriebs-/Sonderverkaufs-/Dropshipping-Zielcompany ohne Shopify-Scope | geplant, Vorlage noch offen | Ziel: deutsch, DE-Final offen | planned-only / not-created | 11, 17, 18, 25 | erst nach Registry-gestuetztem Company-Setup; keine Nutzung ohne Company-Aktionsplan | bisher kein BC-Nachweis |
| `RM-SERVICE` | spaetere Service-/Wartungs-/Miet-Zielcompany | geplant, Vorlage noch offen | Ziel: deutsch, DE-Final offen | planned-only / not-created | 15, 18, 25 | erst nach Registry-gestuetztem Company-Setup; keine Nutzung ohne Company-Aktionsplan | bisher kein BC-Nachweis |
| `RM-SHARED` | spaetere Einkauf-/Finance-/Shared-Services-Zielcompany | geplant, Vorlage noch offen | Ziel: deutsch, DE-Final offen | planned-only / not-created | 12, 18, 19, 20, 25 | erst nach Registry-gestuetztem Company-Setup; keine Nutzung ohne Company-Aktionsplan | bisher kein BC-Nachweis |
| `RM-AT` | spaetere EU-Auslandsgesellschaft fuer USt-/Intercompany-Lernfaelle | geplant, Vorlage noch offen | Ziel: AT/EU-Kontext, DE/AT-Final offen | planned-only / not-created | 18, 22, 25 | erst nach Registry-gestuetztem Company-Setup; keine Nutzung ohne Company-Aktionsplan | Buchentscheidung `FIND-BC-COMPANY-AT`, kein BC-Nachweis |

## Aktuelle Grenze

`GOVERNANCE-013` hat die Companies-Liste in `MCP_1_20260210` read-only geoeffnet. Sichtbar waren `CRONUS USA, Inc.`, `My Company` und `RM-DEMO`; die geplanten Zielcompanies `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED` und `RM-AT` waren im sichtbaren Seitentext nicht vorhanden.

Der naechste Company-spezifische technische Schritt ist nur dann eine Company-Aktion, wenn vorher ein konkreter Company-Aktionsplan geschrieben wird. Ohne neuen Company-Zweck ist der naechste fachliche Lauf wieder der hoechstwertige Prozess-/Setup-Block.

Naheliegender fachlicher Folgeschritt: `FIXEDASSETS-014-HGB-DEPRECIATION-BOOK-FIT` oder ein besser bewerteter Setup-/Buchblock aus `AUTOPILOT-STATE.json`.

## Rueckfalllogik

- Wenn Business Central eine andere Instanz als `MCP_1_20260210` zeigt: sofort stoppen, nichts aendern, Evidence sichern, Fehler dokumentieren.
- Wenn eine Zielcompany fehlt: nicht still wechseln oder anlegen; erst Company-Aktionsplan dokumentieren.
- Wenn eine neue Company angelegt wird: Registry, `AUTOPILOT-STATE.json`, `MASTERDATA-BACKLOG.md`, Evidence und Current State sofort aktualisieren.
- Wenn ein Prozess eine deutsche Finalbehauptung braucht: `RM-DEMO` reicht nicht; Zielcompany und steuerlicher/kontenplanbezogener Finalnachweis muessen getrennt belegt werden.
