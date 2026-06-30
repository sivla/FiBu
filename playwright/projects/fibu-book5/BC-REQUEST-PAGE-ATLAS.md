# BC Request Page Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Request Pages sind BC-Fenster fuer Batch-/Berichts-/Erzeugungsaktionen. Sie sind besonders wichtig, weil ein scheinbar harmloses `OK` Journalzeilen, Belege oder Auswertungen erzeugen kann.

PREP-022-Qualitaet: `thin-but-risk-aware`.

Der Atlas ist bewusst vorsichtig: Solange `UNIVERSAARL-DE` fehlt, werden keine Request Pages ausgefuehrt. Die ersten aktiven Request-Page-Nachweise kommen spaeter aus Setup-Assistenten, Reportfiltern und Batch-/Journal-Erzeugung.

| Prozess | Request Page | Pflichtparameter | Aktion | Evidence | Grenze |
|---|---|---|---|---|---|
| Company Creation | TARGET-002 zeigt keine Request Page, sondern eine unsaved Companies-Listenzeile nach `Neu`; TARGET-003 findet keine sichtbare/klickbare exakte `Create New Company`-Aktion | Company Name, Anzeigename, Datenbasis/Template falls spaeter Wizard sichtbar wird | TARGET-003 stoppt vor Save/Finish; naechster Case prueft scoped Menues/Aktionen fuer den offiziellen Pfad | `evidence/target-002/`, `evidence/target-003/` | Keine Demo-/CRONUS-Kopie als Finalbasis; kein direkter Listenzeilen-Save |
| Look and Feel / Reporting | Report Request Page fuer Berichte mit Filter-/Optionsbereich | Reportname, Zeitraum, Konto/Kunde/Lieferant/Artikel, Dimensionsfilter, Ausgabe-/Vorschauoption | vor `OK`, `Preview`, `Run`, `Drucken` oder Export klassifizieren: nur Anzeige oder Datenwirkung? | PREP-012 geplant; spaeter Universaarl-Report-Screenshot mit Datenreichtum | Eine Request Page beweist nur Parameter vor dem Start; sie beweist keine korrekte Reportausgabe und keine Buchung |
| Data Analysis / List Analysis | kein klassischer Reportdialog, sondern Analysemodus auf Listen-/Querydaten | aktive Liste, Filter, Gruppierung, Spalten/Summen | read-only Analyse nur nach Page-/Company-/Datenkontext; keine Ansicht speichern ohne Gate | PREP-012 geplant; spaeter Universaarl-Listen mit Posten | Analysemodus ersetzt keine Ledger-/Entry-Pruefung |

## Erfassungsregel

Jede Request Page braucht Screenshot, Parameterliste, Standardwerte, OK-/Cancel-Wirkung, Stop-Regeln, erwartetes Ergebnis und Buchkapitelbezug.

PREP-012 ergaenzt: Bei Berichtsdialogen reicht ein Screenshot des Dialogs nicht. Er muss erklaeren, welcher Filter fachlich wirkt, ob die Startaktion read-only ist und welche Posten oder Reports nach dem Start kontrolliert werden.

## Zero-Open-Questions-Regel

Jede nicht verstandene Request Page erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.
