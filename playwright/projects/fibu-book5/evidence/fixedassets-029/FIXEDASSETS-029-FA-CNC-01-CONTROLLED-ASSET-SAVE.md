# FIXEDASSETS-029 - FA-CNC-01 Controlled Asset Save

Status: `blocked-target-already-exists`, `ui-first`, `fixed-assets`, `masterdata`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |
| Zielanlage gespeichert | nein |
| Buchung | nein |
| Kreditor/Einkauf/Zugang/AfA | nein |

## Feldversuche

Keine neuen Feldwerte wurden im erfolgreichen Rerun gesetzt. Der Lauf stoppte vor jeder Bearbeitung, weil `FA-CNC-01` bereits in der gefilterten Anlagenliste sichtbar war.

## Ergebnis

- Vorher war `FA-CNC-01` sichtbar: ja.
- Nachher ist `FA-CNC-01` sichtbar: ja.
- Sichtbarer Zielwertstatus: nicht geprueft; das Listenbild zeigt nur die Nummer, nicht die Kartenwerte.
- Blocker: `FA-CNC-01` existierte bereits vor dem Lauf; kein Ueberschreiben.

## Anfaenger-Lernwert

Der Anlagenstamm ist der erste echte Datensatz im Anlagenprozess. Erst wenn Nummer, Beschreibung, Klasse, Unterklasse, AfA-Buch und Anlagenbuchungsgruppe sichtbar getragen werden, darf man spaeter ueber Kreditor, Einkaufsrechnung, Zugang und AfA nachdenken. Wenn BC Pflichtfelder wie AfA-Datum verlangt, ist das kein Playwright-Fehler, sondern Business-Central-Datenlogik.

Der Screenshot aus diesem Lauf ist deshalb nur Blocker-Evidence: Er zeigt, dass ein Zielcode vorhanden ist. Er zeigt nicht, dass der Zielstammsatz fachlich fertig ist.

## Buchwirkung

Kapitel 21 muss vor dem Speichern pruefen lassen, ob die Zielanlage schon existiert. Ein bestehender Stammsatz darf nicht blind ueberschrieben werden.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Anlagen-Finalnachweis.
- Kein Kreditor `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Deutsche HGB-/Kontenplan- und steuerliche Finalaussagen bleiben offen.

## Naechster Schritt

FIXEDASSETS-029-EXISTING-ASSET-READONLY-VERIFY: bestehenden FA-CNC-01 read-only pruefen oder bewusst neues Ziel/Gate entscheiden.
