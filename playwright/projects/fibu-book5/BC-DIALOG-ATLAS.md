# BC Dialog Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Dieses Atlas-Dokument sammelt Dialoge und Entscheidungsfenster, die Klickpfade sicher oder riskant machen.

| Kontext | Dialog/Action | Risiko | Erlaubte Reaktion | Evidence | Grenze |
|---|---|---|---|---|---|
| TARGET-001 Companies read-only | keine Dialoge sichtbar | niedrig | kein OK/Ja/Finish noetig | `evidence/target-001/TARGET-001-result.json` | keine Erstellroute |
| TARGET-002 Company Creation Gate | `Neu` oeffnet unsaved blank row; `Kopieren`/`Testunternehmen` sichtbar | hoch, weil Listenzeile noch nicht gespeicherte Company ist und Save-Wirkung unbewiesen bleibt | Vor Zielwerten und Save stoppen; separater Execute-Case braucht Vorher/Nachher/Fehlerplan | `evidence/target-002/` | Erstellung nur mit separatem sicheren Gate |
| TARGET-004 Scoped Action Discovery | `Verwandte Aktionen fuer Neu` und `Weitere Optionen` liefern keine exakte sichere `Create New Company`-Route | mittel, weil Menues leicht zu falscher Navigation oder Demo-/Copy-Routen fuehren koennen | Menues nur oeffnen, keine riskanten Eintraege auswaehlen, bei falscher Seite zurueck auf Page 357 | `evidence/target-004-company-creation-scoped-action-discovery/` | keine Company-Anlage; naechster Schritt source-backed Alternative Route |

## Dialogregel

Kein `OK`, `Ja`, `Finish`, `Erstellen`, `Post`, `Preview`, `Delete` oder aehnlicher Bestaetigungsklick ohne sichtbaren Dialogtext, Zielwirkung, Rueckfalllogik und Evidence-Plan.

## Zero-Open-Questions-Regel

Jeder nicht verstandene Dialog erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.
