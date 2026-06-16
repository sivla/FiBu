# fixedassets-029 Evidence

Status: `blocked-target-already-exists`, `ui-first`, `no-overwrite`, `no-posting`, `not-final`, `de-final-open`.

## Kernaussage

Der kontrollierte Save-Lauf fuer `FA-CNC-01` wurde erneut gestartet, aber sofort gestoppt, weil `FA-CNC-01` im gefilterten `Fixed Assets`-Listenbild bereits sichtbar war. Das ist korrektes Gate-Verhalten: Ein bestehender Zielstammsatz darf nicht ueberschrieben oder blind weiterverwendet werden.

Wichtig fuer die Buchwahrheit: Der Screenshot zeigt nur die Nummer `FA-CNC-01` in der Liste. Er beweist nicht, dass Beschreibung, Anlagenklasse, Anlagenunterklasse, AfA-Buch `HGB`, Posting Group `MACHINES`, Nutzungsdauer, Zugang oder AfA fachlich korrekt gepflegt sind.

## Evidence-Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-029-result.json` | JSON | `FA-CNC-01` war vor dem Rerun sichtbar; Lauf stoppte ohne Ueberschreiben | korrekte Zielwerte, Anlagenzugang, AfA, deutschen Finalnachweis | blocked |
| `FIXEDASSETS-029-FA-CNC-01-CONTROLLED-ASSET-SAVE.md` | Markdown | Lern- und Buchwirkung des Stop-Kriteriums | buchfaehige Anlagenkarte | blocked |
| `000-target-filter-before-run.txt` | kompakter UI-Text | gefilterter Fixed-Assets-Kontext in `RM-DEMO` | technische Tabellenextraktion | lab |
| `fixedassets-029-010-target-already-visible.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenze des Listenbilds | Feldwerte auf der Karte | rejected/book-do-not-use |
| `fixedassets-029-010-target-already-visible.png` | Screenshot | Nummer `FA-CNC-01` ist in der Liste sichtbar | Beschreibung, HGB, MACHINES, Klasse/Unterklasse | candidate for blocker only |

## Playwright-Lernwert

Der erste 029-Versuch hat ein gefaehrliches Locator-Muster gezeigt: Eine breite Caption-Suche ueber Parent-/Ancestor-Text kann auf der Business-Central-Card mehrfach das erste Eingabefeld treffen. Der Test fuellt Kartenfelder jetzt zeilen-/positionsbezogen: Caption und editierbares Control muessen auf derselben sichtbaren Kartenzeile liegen. Dieses Muster ist fuer spaetere Klickanleitungen wichtiger als der konkrete Anlagenfall.

## Naechster Schritt

`FIXEDASSETS-029-EXISTING-ASSET-READONLY-VERIFY`: bestehenden `FA-CNC-01` read-only oeffnen und pruefen, ob die sichtbare Anlage fachlich vollstaendig ist oder als korrigierbarer Laborblocker behandelt werden muss. Weiterhin kein `K30000`, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.
