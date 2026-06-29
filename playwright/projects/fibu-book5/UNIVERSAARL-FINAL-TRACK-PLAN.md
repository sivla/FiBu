# Universaarl Final Track Plan

Status: `german-final-candidate`, `universaarl-target`, `legacy-labor-archive-aware`.

## Aktive Zielwelt

Die aktive Buchwelt ist ab jetzt `playthru` mit der Zielcompany `UNIVERSAARL-DE` und der Musterfirma `Universaarl GmbH`. Die Zielcompany wird nicht vorausgesetzt, sondern als eigener UI-first Buchprozess angelegt und bewiesen.

Alte RM-DEMO-/Rhein-Main-/CRONUS-Belege bleiben als `legacy-labor-reference` erhalten. Sie liefern Playwright-Lernen, Fehlerdiagnosen und Laborverstaendnis, aber keine aktive Zielwahrheit und keine finalen deutschen Buchclaims.

## Reihenfolge

1. `TARGET-001-PLAYTHRU-CONTEXT-PROOF`: `playthru` read-only beweisen, Companies-Seite direkt oeffnen, Existenz von `UNIVERSAARL-DE` pruefen.
2. `TARGET-002-UNIVERSAARL-DE-COMPANY-CREATION`: UI-first Company-Anlage vorbereiten oder ausfuehren, nur wenn TARGET-001 die Instanz sicher bestaetigt.
3. `TARGET-003-COMPANY-INFORMATION`: Universaarl GmbH Stammdaten und Company Information beweisen.
4. `TARGET-004-FOUNDATION-SETUP`: Basiseinstellungen, Sprache/Lokalisierung, Nummernserien, Buchungslogik und Sicherheitsgrenzen.
5. Prozessweise Rebuilds: O2C, P2P, Inventory, Fixed Assets, Payments/Bank, Reporting, danach weitere Buchkapitel.

## Reusable Skills For Universaarl Restart

Diese Faehigkeiten wurden in RM-DEMO gelernt und duerfen in Universaarl wiederverwendet werden. Sie beweisen aber erst nach neuer Universaarl-Evidence einen finalen Buchstand.

| Skill/Capability | Nutzen | Grenze |
|---|---|---|
| `bc_navigation_control` | Direkte Page-ID-/URL-Routen statt unnoetiger Suche. | Keine Instanzannahme ohne URL-/UI-Kontextbeweis. |
| `posting_safety_gate` | Preview/Post/Receive/Payment nur mit Case-Gate, Erwartung und Trace. | Kein Post ohne Zielbeleg- und Postenspurplan. |
| `screenshot_truth_gate` | Screenshots muessen zeigen, was behauptet wird. | Kein Bild als Beweis, wenn Codes/Felder nicht sichtbar sind. |
| `evidence_pack_writer` | Kompakte Result-JSONs, Markdown und Screenshot-Metadaten. | Keine Rohsnapshots oder Secrets. |
| `bc_error_recovery_pattern` | Fehler lesen, sichern, Ursache klaeren, dann gezielt beheben. | Kein Wegklicken ohne Befund. |
| `bc_scoped_action_click` | Aktionen seiten- und dialogbewusst anklicken. | Keine globalen `New`-/`Post`-Klicks. |
| `bc_card_field_diagnostics` | Karten maximieren, Bereiche aufklappen, technische Felder pruefen. | Keine Behauptung ohne sichtbare Feld-/Page-Evidence. |
| `bc_dialog_gate` | Dialoge klassifizieren, riskante Bestaetigungen stoppen. | Kein OK/Yes/Ja bei unbekannter Wirkung. |
| `bc_page_context_guard` | Page, Instance, Company und Record-Kontext vor Aktion dokumentieren. | Kein Company-Wechsel ohne Registry/State. |
| `book_patch_only_writer` | Buchdrafts klein, markiert und evidence-basiert schreiben. | Keine finalen deutschen Claims aus Legacy-Labor. |

## Supersession-Regel

Wenn ein Universaarl-Prozess neu bewiesen ist, wird der alte RM-DEMO-Laborstand in Coverage/State/Buch als `superseded-by-universaarl` markiert. Alte Evidence wird nicht geloescht, sondern archiviert.

