# FIXEDASSETS-093 - FA G/L Journal Value Entry Gate Decision

Status: labor, local decision, no BC run, no posting

## Entscheidung

Der Weg ueber `Fixed Asset G/L Journals` bleibt fuer Werteingaben vorerst gesperrt.

FA-092 hat die richtige Seite, den Frame-Kontext, `Batch Name = DEFAULT` und die fachlich relevanten Spalten gezeigt. Gleichzeitig war kein sichtbarer `Delete`- oder anderer Cleanup-Kandidat vorhanden. Die Seite zeigte bereits eine bearbeitbare Journal-Zeilenoberflaeche mit:

- `Posting Date = 01.01.2027`
- `Document No. = G05001`
- `Amount = 0,00`

Damit waere eine Eingabe von `FA-CNC-01`, `K30000` oder Betrag nicht mehr nur ein harmloser Screenshot-Schritt. Sie koennte einen persistenten Journalentwurf erzeugen.

## Warum das fuer Anfaenger wichtig ist

Ein Journal in Business Central ist keine reine Eingabemaske. Sobald Werte in einer Journalzeile stehen, kann daraus ein spaeter buchbarer Entwurf werden. Wenn ein Buch oder eine Klickanleitung dazu auffordert, Werte in ein Journal einzutragen, muss deshalb vorher klar sein:

- wie man den Entwurf sicher prueft,
- ob `Preview Posting` oder `Reconcile` als Kontrollpunkt genutzt werden darf,
- wie man eine falsche Zeile wieder entfernt,
- oder ob der Entwurf bewusst als Laborbeleg stehen bleiben darf.

Ohne diese Regeln entstehen unklare Restdaten. Das ist fuer ein Lernbuch gefaehrlich, weil der naechste Leser oder Agent nicht mehr weiss, ob eine Zeile absichtlich, versehentlich oder halb getestet ist.

## Buchwirkung

Die FA-G/L-Journal-Seite eignet sich aktuell als Erklaerbild fuer:

- Journalstruktur,
- Batch-Auswahl,
- relevante Spalten,
- sichtbare Aktionen wie `Post`, `Insert FA Bal. Account`, `Reconcile`.

Sie eignet sich noch nicht als Schritt-fuer-Schritt-Klickanleitung fuer den Zugang einer Anlage, weil Cleanup, Preview und Buchung nicht sicher nachgewiesen sind.

## Naechster Schritt

FA-094 soll lokal die bisherigen Anlagenzugangswege vergleichen:

- Einkaufsrechnung / Purchase Invoice,
- `Acquire`-Aktion auf der Anlagenkarte,
- Fixed Asset G/L Journal.

Erst danach wird entschieden, welcher Weg praktisch weiterverfolgt wird.

## Autopilot-Lernwert

FA-094 ist ein `judge_work`-Case. Dabei fiel auf, dass `agent:context` und `agent:dry-run` die explizite `taskClass` aus dem aktiven Case ignorierten und per Heuristik auf `wizard_work` herabstuften. Das wurde korrigiert: Eine im Case gesetzte `taskClass` hat jetzt Vorrang vor Heuristik. Dadurch werden Risikoentscheidungen nicht versehentlich als normale Toolarbeit geroutet.
