# BC Request Page Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Request Pages sind BC-Fenster fuer Batch-/Berichts-/Erzeugungsaktionen. Sie sind besonders wichtig, weil ein scheinbar harmloses `OK` Journalzeilen, Belege oder Auswertungen erzeugen kann.

| Prozess | Request Page | Pflichtparameter | Aktion | Evidence | Grenze |
|---|---|---|---|---|---|
| Company Creation | TARGET-002 zeigt keine Request Page, sondern eine unsaved Companies-Listenzeile nach `Neu`; TARGET-003 findet keine sichtbare/klickbare exakte `Create New Company`-Aktion | Company Name, Anzeigename, Datenbasis/Template falls spaeter Wizard sichtbar wird | TARGET-003 stoppt vor Save/Finish; naechster Case prueft scoped Menues/Aktionen fuer den offiziellen Pfad | `evidence/target-002/`, `evidence/target-003/` | Keine Demo-/CRONUS-Kopie als Finalbasis; kein direkter Listenzeilen-Save |

## Erfassungsregel

Jede Request Page braucht Screenshot, Parameterliste, Standardwerte, OK-/Cancel-Wirkung, Stop-Regeln, erwartetes Ergebnis und Buchkapitelbezug.

## Zero-Open-Questions-Regel

Jede nicht verstandene Request Page erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.
