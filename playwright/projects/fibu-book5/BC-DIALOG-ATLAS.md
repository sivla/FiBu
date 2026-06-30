# BC Dialog Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Dieses Atlas-Dokument sammelt Dialoge und Entscheidungsfenster, die Klickpfade sicher oder riskant machen.

PREP-022-Qualitaet: `usable-for-company-gate`.

Der Atlas ist fuer den Company-Creation-Gate ausreichend vorsichtig, aber noch nicht vollstaendig. Der naechste wirksame Rechte-Lauf muss Berechtigungsfehler, Datenbasis-Auswahl, Wizard-Finish-Buttons und Cancel-/Rueckfallpfade neu erfassen.

| Kontext | Dialog/Action | Risiko | Erlaubte Reaktion | Evidence | Grenze |
|---|---|---|---|---|---|
| TARGET-001 Companies read-only | keine Dialoge sichtbar | niedrig | kein OK/Ja/Finish noetig | `evidence/target-001/TARGET-001-result.json` | keine Erstellroute |
| TARGET-002 Company Creation Gate | `Neu` oeffnet unsaved blank row; `Kopieren`/`Testunternehmen` sichtbar | hoch, weil Listenzeile noch nicht gespeicherte Company ist und Save-Wirkung unbewiesen bleibt | Vor Zielwerten und Save stoppen; separater Execute-Case braucht Vorher/Nachher/Fehlerplan | `evidence/target-002/` | Erstellung nur mit separatem sicheren Gate |
| TARGET-004 Scoped Action Discovery | `Verwandte Aktionen fuer Neu` und `Weitere Optionen` liefern keine exakte sichere `Create New Company`-Route | mittel, weil Menues leicht zu falscher Navigation oder Demo-/Copy-Routen fuehren koennen | Menues nur oeffnen, keine riskanten Eintraege auswaehlen, bei falscher Seite zurueck auf Page 357 | `evidence/target-004-company-creation-scoped-action-discovery/` | keine Company-Anlage; naechster Schritt source-backed Alternative Route |
| TARGET-005 Assisted Setup Page 1801 | `Unterstuetztes Setup` zeigt Setup-Aufgaben, aber noch keinen Create-New-Company-Wizard | mittel, weil Setup-Assistenten wirksame Abschlussbuttons enthalten koennen | Page 1801 darf direkt geoeffnet und gelesen werden; `Unternehmen einrichten` erst im naechsten Case scoped oeffnen; kein Finish/Create/OK/Save | `evidence/target-005-company-creation-source-backed-alternative-route/` | Page sichtbar, aber Blank-/Setup-only-Datenbasis und Company-Anlage nicht bewiesen |

## Noch fehlende Universaarl-Dialogtypen

| Dialogtyp | Usecase | Status | Stop-Regel |
| --- | --- | --- | --- |
| Permission-/Berechtigungsfehler bei Company Creation | `TARGET-009` | `blocked-until-super-permissions` | Fehlermeldung sichern, nichts weiter bestaetigen. |
| Datenbasis-Auswahl fuer neue Company | `TARGET-009` | `planned-after-permissions` | Keine Option bestaetigen, solange `No Data`, `Setup Data Only`, `Sample Data`, `Copy Company` oder `Testunternehmen` nicht eindeutig gelesen sind. |
| Assisted/Manual Setup Finish | `TARGET-FOUNDATION-001` | `planned-after-company` | Kein `Finish`, `Fertig stellen`, `OK` oder `Create`, wenn Wirkung oder Datenbasis unklar ist. |
| Preview/Post Dialoge | `TARGET-O2C-001` bis `TARGET-PAYMENT-001` | `planned-after-masterdata` | Dialogtext, Beleg, erwartete Posten und Rueckfalllogik muessen vor Klick dokumentiert sein. |

## Dialogregel

Kein `OK`, `Ja`, `Finish`, `Erstellen`, `Post`, `Preview`, `Delete` oder aehnlicher Bestaetigungsklick ohne sichtbaren Dialogtext, Zielwirkung, Rueckfalllogik und Evidence-Plan.

Fuer Universaarl gilt zusaetzlich: Dialogfreigaben aus RM-DEMO-, MCP_1_20260210- oder CRONUS-Tests sind nur Patternquelle. Ein Universaarl-Dialog muss im `playthru`-Kontext neu gelesen werden, bevor ein Button bestaetigt wird.

## Zero-Open-Questions-Regel

Jeder nicht verstandene Dialog erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.

## UI-Look-and-Feel-Regel

Dialoge und Request-Pages werden nicht bestaetigt, bevor Text, Felder, Defaults, Scrollbereich, OK-/Cancel-Wirkung und Risiko sichtbar oder dokumentiert sind. Unklare Dialoge werden abgebrochen und als Diagnosepfad erfasst.
