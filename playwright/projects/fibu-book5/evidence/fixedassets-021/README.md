# FIXEDASSETS-021 Evidence

Status: erledigt als Entscheidung ohne BC-Lauf  
Umgebung: `MCP_1_20260210`  
Company: `RM-DEMO`  
Arbeitsart: Setup-Fit-Entscheidung / Anlagenkarte / no-save

## Ergebnis

`FIXEDASSETS-020` reicht noch nicht fuer einen sicheren Speicherlauf der Anlage `FA-CNC-01`. Die Anlagenkarte zeigt zwar nach `Mehr anzeigen` die Feldpfade `Depreciation Book Code` und `Posting Group`, aber die konkreten Zielwerte `HGB` und `MACHINES` sind noch nicht als auswählbare oder gesetzte Kartenwerte nachgewiesen.

Deshalb wird `FA-CNC-01` nicht gespeichert. Der naechste sinnvolle Schritt ist ein enger UI-first Lookup-/Value-Preflight:

`FIXEDASSETS-022-FA-CNC-01-LOOKUP-VALUE-PREFLIGHT`

Dieser Lauf darf nur die Lookup- und Wertepfade fuer `FA Class Code`, `FA Subclass Code`, `Depreciation Book Code` und `Posting Group` pruefen. Er darf nichts speichern, keine neue Klasse/Unterklasse anlegen, keinen Kreditor anlegen, keine Einkaufsrechnung erfassen und nichts buchen.

## Evidence-Dateien

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-021-FA-CNC-01-SETUP-FIT-DECISION.md` | Entscheidung | Warum `FA-CNC-01` noch nicht gespeichert werden darf und welcher Preflight als naechstes sicher ist | gespeicherte Anlage, gesetzte Zielwerte, Buchung | labor / decision / no-bc-run |
| `FIXEDASSETS-021-result.json` | strukturiertes Ergebnis | maschinenlesbare Entscheidung, Stop-Kriterien und naechster Fall | UI-Screenshot, BC-Posten, deutscher Finalnachweis | labor / decision / no-bc-run |

## Buchwirkung

Kapitel 21 darf den naechsten Schritt nicht mehr als direkte Anlage von `FA-CNC-01` formulieren, solange Lookup-Werte und Pflichtfelder nicht belegt sind. Fuer Anfaenger ist die Kernlehre: Ein sichtbares Feld ist noch kein fachlich gueltiger Wert. Vor dem ersten Stammdatenscreenshot muessen Code, Beschreibung, AfA-Buch, Anlagenbuchungsgruppe und erforderliche Klassen-/Datumswerte sichtbar korrekt sein.
