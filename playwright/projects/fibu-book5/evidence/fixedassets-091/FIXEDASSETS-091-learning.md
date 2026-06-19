# FIXEDASSETS-091 Lernzusammenfassung

Status: `labor`, `local-decision`, `judge_work`, `no-bc-run`, `no-draft`, `no-preview`, `no-posting`, `not-final`.

## Entscheidung

Keep-Draft und Journal-Werteingabe bleiben gesperrt. FA-090 hat keinen sicheren `Delete`-Cleanup-Pfad nachgewiesen und der Gruppen-Scan kann in Role-Center-Kontext zurueckfallen. Das ist kein Beweis, dass `Delete` unmoeglich ist, aber es reicht nicht fuer eine verantwortbare Werteingabe.

## Was man in Business Central lernt

Journale sind anders zu behandeln als Karten oder gebuchte Belege: Schon eine begonnene Zeile kann als Arbeitsstand im Batch verbleiben. Deshalb braucht ein Testfall vor der ersten Werteingabe entweder einen belegten Cleanup-Pfad oder eine explizite Keep-Draft-Regel mit Eigentum und Folgefall.

## Buchwirkung

Kapitel 21 sollte vor dem Anlagenjournal erklaeren, warum die Reihenfolge wichtig ist: Erst Page, Batch, Felder und Aktionspfad verstehen; dann Werte eingeben; erst danach Preview oder Buchung freigeben. Sichtbare `Post`-Aktionen duerfen nicht als Klickziel erscheinen, solange der Preflight offen ist.

## Naechster Schritt

FA-092 soll read-only direkt im Business-Central-Frame inventarisieren, welche Toolbar-/Zeilenaktionen dort tatsaechlich sichtbar sind. Keine Werteingabe, kein Draft, kein `Delete`, kein `Preview`, kein `Post`.
