# FIXEDASSETS-156 FA G/L Journal Route Review

Status: `local-review`, `judge_work`, `no-bc`, `no-playwright`, `no-preview`, `no-posting`, `not-final`.

## Entscheidung

FA-155 wird als brauchbares Labor-/Routenbild fuer Kapitel 21 akzeptiert. Das Bild zeigt die Seite `Fixed Asset G/L Journals`, `Batch Name = DEFAULT`, die Tabellen-/Zeilenstruktur und die fuer Anfaenger wichtigen Spalten:

- `Posting Date`
- `Document No.`
- `Account Type`
- `Account No.`
- `Depreciation Book Code`
- `FA Posting Type`
- `Amount`
- `Bal. Account No.`

Das Bild zeigt ausserdem `Post` als klare Gefahrengrenze. Damit eignet es sich als Buchbild fuer den Einstieg in die manuelle Journalroute.

## Nicht freigegeben

Aus FA-155 folgt keine Schreibfreigabe. Die maschinelle Evidence liest die Feldsignale stabil, aber keine belastbaren Zeilen-/Control-Details. Ausserdem ist im Bild eine vorhandene Journalzeilensituation erkennbar, die vor einem weiteren Schreibversuch als Ownership-/Cleanup-Thema behandelt werden muss.

Nicht freigegeben:

- `FA-CNC-01` in eine Journalzeile eintragen
- Betrag eintragen
- Gegenkonto eintragen
- `Preview Posting`
- `Post`
- Loeschen oder Cleanup ohne eigenes Gate

## Anfaenger-Lernwert

Ein Anfaenger lernt hier: Der Weg zur Anlagenanschaffung per Journal beginnt mit dem Verstehen der Journalzeile. Man muss vor jeder Buchung wissen, welches Buchblatt aktiv ist, welche Felder die Buchung steuern und wo die Grenze zur echten Buchung liegt. `Post` ist nicht nur ein Button, sondern der Uebergang von Vorbereitung zu Buchungswirkung.

## Buchwirkung

Kapitel 21 kann FA-155 als Laborbild fuer den Abschnitt "Manuelle Anschaffung ueber Anlagen-Fibu-Journal" nutzen. Der Begleittext muss klar sagen, dass das Bild nur Route/Felder/Gefahrengrenze zeigt, nicht die fertige Anschaffung.

## Naechster sicherer Schritt

`FIXEDASSETS-157-FA-GL-JOURNAL-LINE-OWNERSHIP-READONLY`: Die vorhandene Journalzeilensituation read-only pruefen. Ziel ist nur zu klaeren, ob eine alte Testzeile existiert, welche Werte sichtbar sind und ob spaeter Cleanup, Keep-Draft oder ein neues separates Buchblatt noetig ist. Keine Werte, keine Preview, kein `Post`, kein Loeschen.
