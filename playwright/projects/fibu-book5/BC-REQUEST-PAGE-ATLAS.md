# BC Request Page Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Request Pages sind BC-Fenster fuer Batch-/Berichts-/Erzeugungsaktionen. Sie sind besonders wichtig, weil ein scheinbar harmloses `OK` Journalzeilen, Belege oder Auswertungen erzeugen kann.

| Prozess | Request Page | Pflichtparameter | Aktion | Evidence | Grenze |
|---|---|---|---|---|---|
| Company Creation | TARGET-002 zeigt keine Request Page, sondern eine unsaved Companies-Listenzeile nach `Neu` | Company Name, Anzeigename, Datenbasis/Template falls spaeter Wizard sichtbar wird | TARGET-002 stoppt vor Zielwerten/Save; naechster Case muss direkte Zeile oder Assisted Setup absichern | `evidence/target-002/` | Keine Demo-/CRONUS-Kopie als Finalbasis |

## Erfassungsregel

Jede Request Page braucht Screenshot, Parameterliste, Standardwerte, OK-/Cancel-Wirkung, Stop-Regeln, erwartetes Ergebnis und Buchkapitelbezug.
