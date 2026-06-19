# FIXEDASSETS-105 - FA G/L Journal Bal. Account Decision

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright-run`

## Entscheidung

`FIXEDASSETS-104` reicht nicht, um einen G/L-Account- oder Bank-Account-Gegenkonto-Probe sofort freizugeben.

Der naechste praktische Schritt ist zuerst ein read-only Ownership-Lauf:

`FIXEDASSETS-106-FA-GL-JOURNAL-LINE-OWNERSHIP-READONLY`

## Warum

Aus `FIXEDASSETS-102` stammt nur ein partieller Journal-Draft. Sichtbar waren unter anderem `FA-CNC-01`, `HGB`, `Acquisition Cost`, `G05001` und `K30000`; der Betrag `68000` war nicht sichtbar bewiesen. Danach zeigte BC die Fehlermeldung, dass `Account Type` oder `Bal. Account Type` ein `G/L Account` oder `Bank Account` sein muss.

`FIXEDASSETS-104` hat die Account-Type-Optionen read-only sichtbar gemacht. `G/L Account` und `Bank Account` sind als Optionen vorhanden, aber der alte Fehler war nicht mehr sichtbar. Gleichzeitig waren die Zielwerte `FA-CNC-01`, `K30000`, `HGB`, `G05001` und `68000` in diesem Lauf nicht sichtbar bewiesen. Die Seite zeigt `Number of Lines / Balance / Total Balance = 1 / 0,00 / 0,00`.

Daraus folgt: Es ist noch unklar, ob die sichtbare Journalzeile wirklich die FA-102-Zeile ist, ob sie leer/neutralisiert ist oder ob die Werte nur ausserhalb der aktuellen Sicht liegen.

## Nicht freigegeben

- keine Wertkorrektur
- kein Bal.-Account-Fix
- keine Preview Posting
- kein `Post`
- keine Setup-Aenderung
- keine Buchbehauptung fuer Anlagenzugang

## Freigegeben fuer FA-106

- `Fixed Asset G/L Journals` read-only oeffnen
- Instanz und Company erneut pruefen
- aktuelle Zeilenanzahl, Batch, sichtbare Row-/Grid-Signale lesen
- pruefen, ob `G05001`, `FA-CNC-01`, `HGB`, `K30000`, `68000` oder nur leere Balance-Signale sichtbar sind
- entscheiden, ob Cleanup, Rebuild oder ein spaeterer enger Gegenkonto-Probe sinnvoll ist

## Buchwirkung

Fuer das Buch ist das ein wichtiger Lernfall: Journalzeilen in Business Central koennen nach einem Eingabeversuch persistieren oder teilweise leer/anders sichtbar bleiben. Ein Screenshot oder Seitentext mit `G/L Account`-Optionen beweist noch keinen buchungsreifen Anlagenzugang. Vor jeder Preview oder Buchung muss die konkrete Zeile inklusive Betrag und Gegenkonto fachlich sichtbar sein.
