# FIXEDASSETS-016 MACHINES FA Posting Group Fit

Status: `labor`, `ui-first`, `setup-proof`, `idempotent`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielobjekt | FA Posting Group / Anlagenbuchungsgruppe `MACHINES` |
| Aktion | created-machines |
| Sichtbare Konten im Nachweis | 12210, 82000 |
| Buchung | nein |
| Setup geaendert | ja, genau `MACHINES` |

## Was praktisch nachgewiesen ist

- Die Seite `FA Posting Groups` wurde in `RM-DEMO` innerhalb `MCP_1_20260210` UI-first geoeffnet.
- Vor der Aktion wurde gezielt geprueft, ob `MACHINES` bereits sichtbar ist.
- Nach der Aktion ist `MACHINES` im sichtbaren BC-Kontext nachgewiesen.
- Das Nachherbild und der kompakte Seitentext zeigen `MACHINES` zusammen mit den relevanten CRONUS-Konten `12210` und `82000`.
- Es wurde keine Anlage, kein Kreditor, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung erzeugt.

## Warum das fachlich wichtig ist

Eine Anlagenbuchungsgruppe ist Kontenfindung. Sie entscheidet, welche Sachkonten Business Central spaeter beim Anlagenzugang, bei Abschreibung, Abgang und Wartung verwendet. `MACHINES` ist deshalb ein Setup-Baustein vor der Anlage `FA-CNC-01`, nicht die Anlage selbst.

## Grenzen

- CRONUS-USA-Labor, kein deutscher Kontenplan-Endstand.
- `MACHINES` wurde nur als Laboralias der vorhandenen Gruppe `EQUIPMENT` vorbereitet.
- Kein `FA-CNC-01`, kein `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Anlagenpostenspur.
- Deutscher HGB-/Steuer-/Kontenplan-Finalnachweis bleibt offen.

## Buchwirkung

Kapitel 21 darf `MACHINES` jetzt als RM-DEMO-Labor-Setup-Prerequisite zeigen. Der Text muss weiterhin klar trennen: Das ist ein Labor-Konto-Set aus CRONUS-USA, kein finaler deutscher Anlagenkontenplan.

## Naechster Schritt

FIXEDASSETS-017-FA-CNC-01-SETUP-READINESS: decide the next narrow UI-first layer after MACHINES, likely fixed asset card or vendor K30000 readiness; still no acquisition/depreciation posting without a fresh gate.
