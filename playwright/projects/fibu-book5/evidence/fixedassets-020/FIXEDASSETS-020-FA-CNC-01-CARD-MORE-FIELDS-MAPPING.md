# FIXEDASSETS-020 - FA-CNC-01 Card More-Fields Mapping

Status: `labor`, `ui-first`, `readiness`, `field-mapping`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |
| Speichern | nein |
| Setup geaendert | nein |
| Buchung | nein |

## Ergebnis

- Kartenkontext geoeffnet: ja.
- Mehr-/Bereichsdiagnose ausgefuehrt: ja (2 Klicks).
- Feld `No.` sichtbar: ja.
- Feld `Description` sichtbar: ja.
- Feld fuer AfA-Buch/Depreciation Book sichtbar: ja.
- Feld fuer Anlagenbuchungsgruppe/FA Posting Group sichtbar: ja.
- Zielwert `HGB` im Seitentext sichtbar: nein.
- Zielwert `MACHINES` im Seitentext sichtbar: nein.

## Entscheidung fuer den naechsten Lauf

Feldpfade fuer AfA-Buch und Anlagenbuchungsgruppe wirken erreichbar. Naechster Lauf darf nur einen engen No-Save/Save-Decision-Schritt fuer FA-CNC-01 vorbereiten; Speichern weiterhin nur nach expliziter Setup-Fit-Entscheidung.

## Anfaenger-Lernwert

Eine Anlagenkarte darf fuer das Buch erst als Zielstammsatz gelten, wenn nicht nur Nummer und Beschreibung sichtbar sind. Vor Zugang und AfA muss auch klar sein, wo Business Central das AfA-Buch und die Anlagenbuchungsgruppe hernimmt. Diese beiden Felder entscheiden spaeter ueber Abschreibung und Sachkontenfindung.

## Buchwirkung

Kapitel 21 muss den Feldmapping-Schritt vor der eigentlichen Stammdatenanlage zeigen oder erklaeren. Wenn `HGB` und `MACHINES` auf der Karte nicht sichtbar erreichbar sind, braucht das Buch zuerst eine Diagnose-/Personalisieren-/Page-Inspection-Erklaerung statt eines vermeintlichen Ziel-Screenshots.

## Grenzen

- CRONUS-USA-Labor, kein deutscher HGB-/Kontenplan-Endstand.
- Keine gespeicherte Anlage `FA-CNC-01`.
- Kein Kreditor `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Anlagenposten.
- Page Inspection oder Personalisierung waeren Diagnosekontext, aber kein finaler Anwenderscreenshot.
