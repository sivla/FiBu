# FIXEDASSETS-173 Entscheidung

## Ausgangspunkt

FA-172 hat die Seite `Fixed Asset G/L Journals` in `MCP_1_20260210` / `RM-DEMO` praktisch geoeffnet. Sichtbar sind die geschuetzte Laborzeile `CNC Maschine FRA`, `Amount = 0,00`, `Bal. Account Type = G/L Account` und die leere Spalte `Bal. Account No.`.

Der Lauf hat nicht geschrieben. Der Stop-Grund ist:

`expected-one-editable-bal-account-no-candidate-but-found-0`

## Entscheidung

FA-172 wird akzeptiert als:

- Labor-Kontextnachweis
- Blockerbild fuer Journal-Grid-/Subform-Zellhandling
- Screenshot-QA-Lernfall

FA-172 wird nicht akzeptiert als:

- Zielbild fuer `Bal. Account No. = 82000`
- Werteingabe-Nachweis
- Preview-Posting-Freigabe
- Posting-Freigabe
- deutscher Finalnachweis

## Ursache

Das ist nach aktueller Evidence kein neuer fachlicher Setup-Blocker. Der Setup-Fit `MACHINES / Acquisition Cost Bal. Acc. = 82000` bleibt gueltig.

Der Blocker liegt in der UI-Automation: Business-Central-Journalgrids zeigen Spalten und Werte, aber die editierbare Zielzelle ist fuer Playwright nicht automatisch als einfaches `input`/`select`/`textarea` auffindbar. Eine sichtbare Spalte ist deshalb kein Schreibnachweis.

## Naechster sinnvoller Schritt

`FIXEDASSETS-174-BC-LINES-JOURNAL-CELL-CANDIDATE-HELPER`

Ziel: Ein kleiner lokaler Playwright-Lernschritt fuer wiederverwendbare BC Lines/Subform-Zellkandidaten. Dieser Schritt soll keine BC-Ausfuehrung starten, sondern aus FA-172 und aehnlichen Befunden ein begrenztes Helper-/Pattern-Design ableiten und nur dann Code anfassen, wenn es klein und testbar bleibt.

Erst danach darf ein neuer Live-Probe geplant werden, der eine Zielzelle nicht nur sichtbar macht, sondern ihren editierbaren Zellmechanismus nachweist.

## Gesperrt bis dahin

- Preview Posting
- `Post`
- Betrag `68.000`
- `Bal. Account No. = 82000` als Journalwert behaupten
- neue Journalzeile
- Cleanup
- `K30000` als G/L-Gegenkonto
