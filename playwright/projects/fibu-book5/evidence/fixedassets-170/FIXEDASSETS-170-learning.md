# FIXEDASSETS-170 Acquisition Cost Bal. Acc. Setup-Fit

Status: `labor`, `ui-first`, `setup-proof`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS-USA-Labor |
| Zielobjekt | FA Posting Group `MACHINES` |
| Ziel-Feld | `Acquisition Cost Bal. Acc.` |
| Zielwert | `82000` |
| Ergebnis | setup-fit-applied |
| Vorherwert |  |
| Nachherwert | 82000 |
| Buchung | nein |
| Preview Posting | nein |
| Journalwerte | nein |

## Was ein Anfaenger daraus lernen soll

`Acquisition Cost Bal. Acc.` ist kein Anlagenwert und keine Journalzeile. Es ist ein Kontenfindungsfeld in der Anlagenbuchungsgruppe. Wenn Business Central spaeter einen Anlagenzugang buchen soll, braucht das Setup ein Gegenkonto fuer den Zugang. Fehlt der Wert, kann die spaetere Buchung oder Vorschau blockieren, obwohl Anlage und Kreditor korrekt aussehen.

## Buchwirkung

Kapitel 21 darf diesen Schritt als RM-DEMO-Labor-Setupvoraussetzung dokumentieren: Erst die Anlagenbuchungsgruppe pruefen, dann einen Anlagenzugang vorbereiten. Der Nachweis ist kein deutscher Kontenplan-Endstand.

## Naechster Schritt

FA-171 soll die Evidence lokal pruefen und erst danach entscheiden, ob ein kontrollierter Journal-Preflight mit Wertfeldern freigegeben wird.
