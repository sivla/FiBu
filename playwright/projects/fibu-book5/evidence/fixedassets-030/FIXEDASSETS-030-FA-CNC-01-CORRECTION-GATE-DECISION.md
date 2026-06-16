# FIXEDASSETS-030: FA-CNC-01 Correction Gate Decision

## Entscheidung

`FA-CNC-01` bleibt der Buch- und Labor-Zielcode. Im naechsten praktischen Lauf wird keine neue Zielnummer wie `FA-CNC-02` angelegt. Stattdessen darf die vorhandene Karte `FA-CNC-01` UI-first korrigiert werden, wenn die Sicherheitspruefung weiterhin zeigt, dass kein Zugang, kein Buchwert, keine AfA und keine Postenspur auf der Anlage liegen.

## Warum keine neue Nummer?

Das Buch, die Testdaten und die bisherigen Evidence-Packs beziehen sich konsistent auf `FA-CNC-01`. Ein neuer Laborcode wuerde die Klickanleitung schwerer nachvollziehbar machen und spaetere Belege, Posten und Screenshots vom Buchziel entkoppeln. `FIXEDASSETS-029-EXISTING` zeigt ausserdem keinen belegten oder aktivierten Anlagenstamm, sondern eine fachlich leere Karte mit `Book Value = 0,00`.

## Naechster erlaubter praktischer Lauf

`FIXEDASSETS-031-FA-CNC-01-EXISTING-CARD-CORRECTION`

Erlaubt ist nur:

- `Fixed Assets` in `RM-DEMO` oeffnen.
- `FA-CNC-01` aus der gefilterten Liste oeffnen.
- Umgebung `MCP_1_20260210` und Company `RM-DEMO` sichtbar/pruefbar halten.
- Vorher-Screenshot und vorhandene Feldwerte sichern.
- Karte nur dann korrigieren, wenn keine acquisition-/posting-relevante Wirkung sichtbar ist.
- Zielwerte setzen: `Description = CNC Maschine FRA`, `FA Class Code = TANGIBLE`, `FA Subclass Code = EQUIPMENT`, `Depreciation Book Code = HGB`, `Posting Group = MACHINES`, `No. of Depreciation Years = 8`.
- AfA-Start-/Enddatum erst setzen, wenn die fachliche Datumslogik im UI-Lauf eindeutig begruendet ist; sonst stoppen und dokumentieren.
- Nachher-Screenshot, Feldwerte-JSON und Buchwirkung sichern.

## Stop-Kriterien

- Business Central zeigt nicht `MCP_1_20260210`.
- Company ist nicht `RM-DEMO`.
- `FA-CNC-01` hat Buchwert, Zugang, `Acquired = true`, Anlagenposten oder andere irreversible Prozessspuren.
- Die Karte ist nicht editierbar oder Zielwerte koennen nicht sicher im sichtbaren Kartenkontext gesetzt werden.
- `HGB`, `MACHINES`, `TANGIBLE` oder `EQUIPMENT` sind nicht auswaehlbar.
- Das AfA-Datum kann nicht nachvollziehbar gesetzt werden.
- Business Central oeffnet einen Dialog, der eine Folgeaenderung ausserhalb der Anlagenkarte verlangt.

## Buchwirkung

Kapitel 21 muss die bestehende Zielnummer als Lernfall erklaeren: Eine sichtbare Anlagennummer ist kein fertiger Anlagenstamm. Ein buchfaehiger Screenshot muss die fachlichen Kartenwerte zeigen. Erst nach der Korrektur darf das Buch mit Kreditor `K30000`, Einkaufsrechnung, Zugang oder AfA fortfahren.

## Laborgrenze

Diese Entscheidung ist CRONUS-USA-Laborlogik in `RM-DEMO`. Sie beweist keinen deutschen Kontenplan, keinen deutschen HGB-Endstand und keine Anlagenbuchung.
