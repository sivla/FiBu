# Universaarl Playwright Script and Helper Inventory

Status: `prep-done`, `script-helper-inventory`, `no-bc-run`, `no-playwright-run`

Stand: 30.06.2026

Dieses Inventar trennt aktive Universaarl-Playwright-Arbeit von alter RM-DEMO-/MCP-Laborevidence. Es ist keine Testausführung und kein Business-Central-Nachweis. Es verhindert, dass der Autopilot alte Laborläufe als aktive Universaarl-Zieltests startet.

## Kurzbefund

| Kategorie | Anzahl | Bedeutung |
|---|---:|---|
| Playwright-Tests gesamt | 306 | komplette historische Testbasis im Projekt |
| npm-`fibu:*`-Skripte | 307 | ausführbare Projektbefehle für Tests/Prozessläufe |
| `target-*`-Tests | 9 | aktive Universaarl-/`playthru`-Company-Creation-Schiene |
| `live-smoke-*`-Tests | 4 | generische Read-only-Kontext-/Action-Inventur-Kandidaten |
| Fixed-Assets-Labortests | 167 | wertvolle Legacy-Patternquelle, aber nicht aktive Universaarl-Zielstrecke |
| P2P-Labortests | 25 | Legacy-Laborwissen für Einkauf/Journale/Zeilengrids |
| Warehouse-Labortests | 23 | Legacy-Laborwissen für Warehouse-UI, Source Documents und Grid-/Action-Blocker |
| Bank/Payments-Labortests | 26 | Legacy-Laborwissen für OP-Ausgleich, Bank, Payments |
| RM-DE-LAB-Company-Creation-Tests | 3 | historische Company-Creation-Patternquelle, nicht Zielwelt |
| UAT-CRONUS-Labortests | 6 | historische O2C/P2P-UAT-Evidence, später durch Universaarl zu ersetzen |

## Aktive Universaarl-Testschiene

Diese Tests gehören zur aktiven Zielwelt `playthru` / Universaarl, dürfen aber nur entsprechend ihrer Gates ausgeführt werden.

| Test | Status | Darf jetzt laufen? | Zweck / Grenze |
|---|---|---:|---|
| `target-001-playthru-context-proof.spec.ts` | `active-readonly` | ja, wenn Read-only-Kontext revalidiert werden soll | beweist `playthru`-Kontext, erzeugt keine Company |
| `target-002-universaarl-company-creation-gate.spec.ts` | `parked` | nein | Company-Creation-Gate; wegen fehlender Rechte nicht wiederholen |
| `target-003-universaarl-company-creation-execution-route.spec.ts` | `parked` | nein | Ausführungsroute, nur nach Rechtefreigabe |
| `target-004-company-creation-scoped-action-discovery.spec.ts` | `parked` | nein | Action-Discovery für Company Creation, aktuell nicht wiederholen |
| `target-005-company-creation-source-backed-alternative-route.spec.ts` | `parked` | nein | Quellenbasierte Alternativroute, erst nach Rechte-/Decision-Gate |
| `target-006-company-creation-specific-assisted-setup-route.spec.ts` | `parked` | nein | Assisted-Setup-Route, keine Wizard-Fortsetzung ohne Freigabe |
| `target-007-companies-new-dropdown-clickguide.spec.ts` | `active-readonly-reference` | nur read-only/Dropdown-QA, falls nötig | zeigt `Neu`-Pfeil und Menüeinträge; kein Create |
| `target-008-companies-new-row-field-save-gate.spec.ts` | `rejected-path-reference` | nein | direkter `Neu`-Pfad führte zur Listenzeile, nicht zum gewünschten Wizard |
| `target-009-main-neu-list-company-create-gate.spec.ts` | `parked-until-super-permissions` | nein | erster Resume-Case nach bestätigten SUPER-/Company-Create-Rechten |

## Read-only-Smoke-Tests

| Test | Status | Einsatz |
|---|---|---|
| `live-smoke-bc-001-readonly-context.spec.ts` | `convert-to-playthru-or-pattern-source` | nur nutzen, wenn Instanz-/Company-Erwartung auf aktuellen Target-Kontext passt |
| `live-smoke-bc-002-readonly-page-context.spec.ts` | `convert-to-playthru-or-pattern-source` | Page-Kontextmuster, keine wirksame Aktion |
| `live-smoke-bc-003-readonly-action-inventory.spec.ts` | `convert-to-playthru-or-pattern-source` | Action-Inventur-Muster |
| `live-smoke-bc-004-readonly-visible-company-context.spec.ts` | `convert-to-playthru-or-pattern-source` | sichtbarer Company-Kontext, nach Target-Kontext prüfen |

## Legacy-Testgruppen

| Gruppe | Beispiele | Status | Regel |
|---|---|---|---|
| RM-DE-LAB Company Creation | `rm-de-lab-create-*` | `legacy-pattern-source` | nicht aktiv ausführen; nur UI-Learnings zu Companies Page, Fehlern und Create-Company-Pfaden übernehmen |
| RM-DEMO Foundation/Masterdata | `foundation-*`, `masterdata-*`, `dimensions-*` | `legacy-labor-reference` | nicht als Universaarl-Setup verwenden; später als Target-Fälle neu aufbauen |
| CRONUS/RM UAT | `uat-o2c-*`, `uat-p2p-*` | `archive-only` | Beweiskette behalten, aber Buchclaims durch Universaarl-Evidence ersetzen |
| P2P/Payments/Bank/Inventory/Warehouse/Fixed Assets | Prozesspräfixe | `legacy-labor-reference` | wertvolle Patternquelle für Dialoge, Grids, Posting/Preview, Cleanup; keine aktive Zielwahrheit |
| Dropshipping | `dropshipping-*` | `excluded-shopify` | nicht fortsetzen; Shopify bleibt ausgeschlossen |
| Reporting/Security/Compliance/Projects/Service/Manufacturing | Bereichstests | `legacy-or-planned-pattern-source` | nur als Patternquelle, bis Universaarl-Kontext existiert |

## Wiederverwendbare Helper

| Helper / Skill-Datei | Status | Nutzen für Universaarl | Grenze |
|---|---|---|---|
| `playwright/core/bc-helpers.ts` | `legacy-reusable-needs-guarded-use` | Navigation, Suche, Page-Text, Teaching Tips, FactBox | enthält ältere Koordinaten-/Suchmuster; bei Company Creation nicht blind Tell-Me/Search nutzen |
| `playwright/core/bc/actions.ts` | `reusable` | gescopter Action-Click, Scoring, Splitbutton-/Top-Icon-Kandidaten | jede wirksame Aktion braucht Decision-/Dialog-Gate |
| `playwright/core/bc/dialogs.ts` | `reusable` | Dialog-Sicherheitsanker vor `OK`, `Ja`, `Post`, `Preview`, `Delete` | Dialogtext muss sichtbar und zur Aktion passend sein |
| `playwright/core/bc/cards.ts` | `reusable` | Kartenfeld-/Control-Diagnose, Feldcaption vs. Wert vs. editierbares Control | Diagnose ist keine Speicherfreigabe |
| `playwright/core/bc/journal-grid-candidates.ts` | `reusable-lab-proven` | Journal-/Grid-Kandidaten mit Header-/Zeilen-Geometrie | Werteingabe erst nach sichtbarem Ziel und Persistenzplan |
| `playwright/core/bc/purchase-invoice-guards.ts` | `legacy-specialized` | Guard-Regeln für Purchase-Invoice-Routen | nicht direkt auf Universaarl übertragen, bevor Zielprozess definiert ist |
| `playwright/core/evidence.ts` | `reusable` | kompakte JSON-/Markdown-Evidence | keine Rohsnapshots, keine Auth-/Secret-Artefakte |
| `playwright/core/bc-skills/*.md` | `reusable-knowledge` | textuelle Skill-Regeln für Context, Dialoge, Grids, Posting, Screenshots | bei Universaarl-Ports mit Capabilities/Result-Flags verknüpfen |

## Run-Regeln ab PREP-018

1. Standard für aktive Target-Arbeit ist `fibu:target:*`, nicht ein alter Prozesspräfix.
2. `target-009` bleibt geparkt, bis der Nutzer SUPER-/Company-Create-Rechte bestätigt.
3. `target-007` darf als Read-only-Referenz für Dropdown/Tooltip/Screenshot-QA dienen, aber nicht als Company-Creation-Erfolg.
4. `target-008` ist ein rejected-path: direkte Listenzeile ist nicht der gewünschte `Neues Unternehmen erstellen`-Wizard.
5. Legacy-Prozesstests dürfen nicht als aktive Universaarl-Tests laufen, wenn sie `MCP_1_20260210`, `RM-DEMO`, `CRONUS`, `K30000`, `FA-CNC-01`, `BANK-RM-01` oder alte Belegnummern erwarten.
6. Ein alter Test wird erst aktiv, wenn er explizit portiert wurde und Result/Evidence `targetWorld=Universaarl`, `instance=playthru` und den richtigen Company-/Permission-Status enthält.
7. Bei Read-only-Tests reicht ein grüner Lauf nicht: Screenshot-QA und Result-JSON müssen sagen, was sichtbar ist und was nicht.
8. Bei wirksamen Aktionen nach Rechtefreigabe muss der Test aus `READY-FOR-SUPER-PERMISSIONS-CHECKLIST.md` ableiten, ob der Hauptbutton, der Pfeil oder der Menüeintrag geklickt wird.

## Nächster Nutzen

PREP-019 kann auf dieser Inventur aufsetzen und die Autopilot-Effizienz verbessern:

- `agent:marathon:check` soll die offene PREP-Queue höher gewichten als alte Target-Execute-Lever, solange Company Creation geparkt ist.
- Run-Auswahl soll bevorzugt `target-*`/PREP/read-only verwenden und Legacy-Labortests nur als Patternquelle nennen.
- Ein späterer Helper- oder Script-Port sollte nicht 300 Tests scannen müssen, sondern diese Klassifikation verwenden.
