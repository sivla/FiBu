# BC Dialog Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Dieses Atlas-Dokument sammelt Dialoge und Entscheidungsfenster, die Klickpfade sicher oder riskant machen.

| Kontext | Dialog/Action | Risiko | Erlaubte Reaktion | Evidence | Grenze |
|---|---|---|---|---|---|
| TARGET-001 Companies read-only | keine Dialoge sichtbar | niedrig | kein OK/Ja/Finish noetig | `evidence/target-001/TARGET-001-result.json` | keine Erstellroute |
| TARGET-002 Company Creation Gate | `Neu` oeffnet unsaved blank row; `Kopieren`/`Testunternehmen` sichtbar | hoch, weil Listenzeile noch nicht gespeicherte Company ist und Save-Wirkung unbewiesen bleibt | Vor Zielwerten und Save stoppen; separater Execute-Case braucht Vorher/Nachher/Fehlerplan | `evidence/target-002/` | Erstellung nur mit separatem sicheren Gate |

## Dialogregel

Kein `OK`, `Ja`, `Finish`, `Erstellen`, `Post`, `Preview`, `Delete` oder aehnlicher Bestaetigungsklick ohne sichtbaren Dialogtext, Zielwirkung, Rueckfalllogik und Evidence-Plan.
