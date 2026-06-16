# FIXEDASSETS-018 FA-CNC-01 Card Preflight

Status: `labor`, `ui-first`, `card-preflight`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |
| Buchung | nein |
| Setup geaendert | nein |
| Stammdaten gespeichert | nein |

## Ergebnis

- FA-CNC-01 in sichtbarer Anlagenliste/Seitentext vor New sichtbar: nein.
- Kontrollierter New/Karten-Preflight ausgefuehrt: ja.
- Karten-/Feldkontext erfasst: ja.
- Sichtbare Feldhinweise: 20.
- Sichtbare FastTab-/Bereichshinweise: 27.

## Was praktisch nachgewiesen ist

- Die Fixed-Assets-Liste ist in `RM-DEMO` als Karten-Preflight-Kontext erreichbar.
- `FA-CNC-01` wurde vor dem New/Kartenkontext im Listen-/Seitentext geprueft.
- Das Listenbild zeigt den Anlagenlisten-Kontext; es ist kein sauberer leerer Filterbeweis.
- Das Kartenbild zeigt die leere `Fixed Asset Card` mit `No.`, `Description`, `FA Class Code`, `FA Subclass Code`, `Depreciation Method`, `Depreciation Starting Date`, `Depreciation Ending Date` und `Book Value = 0,00`.
- Der Lauf speichert keine Anlage und erzeugt keine Einkaufsrechnung, keinen Zugang, keine AfA und keine Posten.
- Die erfassten Feld-/FastTab-Hinweise sind Preflight-Evidence fuer die spaetere Anlagenanlage, kein fertiger Stammdatennachweis.

## Was nicht bewiesen ist

- `FA-CNC-01` existiert noch nicht als belastbar gespeicherte Anlage.
- `HGB` und `MACHINES` sind noch nicht auf einer gespeicherten Anlagenkarte nachgewiesen.
- Kein `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA, keine Anlagenposten und keine Sachposten.
- Kein deutscher HGB-/Kontenplan- oder Steuer-Finalnachweis.

## Anfaenger-Lernwert

`HGB` und `MACHINES` sind Setup. Die Anlage selbst entsteht erst auf der Anlagenkarte. Deshalb muss ein Leser zuerst sehen, welche Felder und Bereiche die Anlagenkarte anbietet, bevor er eine Einkaufsrechnung oder AfA startet. Wenn diese Reihenfolge falsch ist, sucht man spaeter Fehler im Kreditoren- oder Buchungsprozess, obwohl die Anlage als Stammdatum noch nicht sauber vorbereitet wurde.

## Buchwirkung

Kapitel 21 sollte den naechsten Screenshot als Karten-Preflight oder spaeter als gespeicherte Anlagenkarte klar markieren. Ein leeres Kartenbild ist kein finaler Stammdatenscreenshot; ein Buchbild fuer die fertige Anlage muss `FA-CNC-01`, Beschreibung und die relevanten Setup-Bezuege sichtbar zeigen.

## Naechster Schritt

FIXEDASSETS-019-FA-CNC-01-CARD-FIELD-MAPPING-DECISION: entscheiden, ob die sichtbaren Kartenfelder fuer einen engen UI-first FA-CNC-01-Setup-Fit reichen; weiterhin kein K30000, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.
