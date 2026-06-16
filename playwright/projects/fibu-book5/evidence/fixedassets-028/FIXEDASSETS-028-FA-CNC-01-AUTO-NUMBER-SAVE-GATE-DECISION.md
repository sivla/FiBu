# FIXEDASSETS-028 - FA-CNC-01 Auto-Number Save-Gate Decision

Status: `decision`, `governance`, `fixed-assets`, `save-gate`, `no-bc-run`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Zielobjekt | Anlage `FA-CNC-01` / `CNC Maschine FRA` |
| Grundlage | `FIXEDASSETS-027` Lookup-Evidence und Auto-Number-Cleanup `FA000110` |
| BC-Lauf in 028 | nein |
| Setup geaendert | nein |
| Buchung | nein |

## Entscheidung

Der naechste praktische Fixed-Assets-Lauf darf als eng begrenzter Stammdatenlauf vorbereitet werden:

`FIXEDASSETS-029-FA-CNC-01-CONTROLLED-ASSET-SAVE`

Dieser Lauf darf genau die Zielanlage `FA-CNC-01` speichern, aber noch keinen Kreditor, keine Einkaufsrechnung, keinen Zugang, keine AfA und keine Buchung erzeugen.

## Warum dieser Schritt sinnvoll ist

`FIXEDASSETS-027` hat die fachlich noetigen Referenzwerte sichtbar gemacht:

- `HGB` im `Depreciation Book Code`-Lookup.
- `MACHINES` im `Posting Group`-Lookup.
- `TANGIBLE`, `FINANCIAL`, `INTANGIBLE` als Anlagenklassen.
- `EQUIPMENT`, `VEHICLE`, `COMPUTER` als Anlagenunterklassen.

Gleichzeitig hat `FIXEDASSETS-027` gezeigt, dass der alte no-save-Gedanke gefaehrlich ist. Business Central hat beim Arbeiten auf der neuen Anlagenkarte automatisch `FA000110` erzeugt und als gespeichert angezeigt. Dieser Entwurf wurde geloescht. Daraus folgt: Der naechste praktische Lauf muss bewusst speichern oder bewusst abbrechen; ein weiterer halb-offener Preflight waere fachlich riskanter als ein enges Save-Gate.

## Erlaubte Werte fuer den naechsten Lauf

| Feld | Zielwert | Grundlage | Status |
|---|---|---|---|
| `No.` | `FA-CNC-01` | Buchziel / Testdaten | muss im UI sichtbar gesetzt werden |
| `Description` | `CNC Maschine FRA` | Buchziel / Testdaten | muss im UI sichtbar gesetzt werden |
| `FA Class Code` | `TANGIBLE` | sichtbarer CRONUS-Laborwert aus `FIXEDASSETS-027` | Laborentscheidung |
| `FA Subclass Code` | `EQUIPMENT` | sichtbarer CRONUS-Laborwert aus `FIXEDASSETS-027` | Laborentscheidung |
| `Depreciation Book Code` | `HGB` | UI-first angelegt in `FIXEDASSETS-014`, Lookup sichtbar in `FIXEDASSETS-027` | Laborentscheidung |
| `Posting Group` | `MACHINES` | UI-first angelegt in `FIXEDASSETS-016`, Lookup sichtbar in `FIXEDASSETS-027` | Laborentscheidung |
| AfA-Methode | `Straight-Line` / linearer Standardwert, wenn sichtbar | Kartenpreflight `FIXEDASSETS-018` | im Lauf pruefen |
| Nutzungsdauer | `8 Jahre` | Buchziel | im Lauf sichtbar setzen oder als offener Blocker stoppen |
| Start-/Enddatum | noch nicht final bestimmt | Buchziel Juni 2026 / AfA bis `30.06.2026` | im Lauf nicht raten; bei Pflichtfeld Blocker dokumentieren oder konservativ abbrechen |

## Harte Stop-Kriterien fuer den naechsten Lauf

Der naechste praktische Lauf muss ohne Speichern oder nach Cleanup abbrechen, wenn:

- Business Central nicht `MCP_1_20260210` zeigt.
- Die Company nicht `RM-DEMO` ist.
- `FA-CNC-01` vor dem Lauf bereits existiert.
- `Neu/New` eine automatische Nummer zieht, die nicht sicher auf `FA-CNC-01` geaendert werden kann.
- ein anderer temporaerer Datensatz entsteht und nicht eindeutig per UI geloescht werden kann.
- `HGB` oder `MACHINES` nicht mehr sichtbar oder nicht auswaehlbar sind.
- Klasse/Unterklasse nicht sicher setzbar sind.
- Pflichtfelder nicht fachlich erklaert werden koennen.

## Buchwirkung

Kapitel 21 darf jetzt die Anlagenkarte nicht mehr nur als Feld- oder Lookup-Preflight behandeln. Der naechste didaktische Schritt ist der Unterschied zwischen:

- sichtbaren Referenzwerten,
- automatisch gezogenen Nummern,
- bewusst gespeichertem Zielstammsatz,
- spaeterer Anlagenaktivierung.

Fuer Anfaenger ist das wichtig, weil `Neu` bei Business-Central-Stammdaten bereits eine Nummernserie verbrauchen oder einen Entwurf speichern kann. Eine Klickanleitung muss deshalb zeigen, woran man erkennt, ob ein Datensatz wirklich entstanden ist, und was vor jeder Einkaufsrechnung geprueft werden muss.

## Naechster Schritt

`FIXEDASSETS-029-FA-CNC-01-CONTROLLED-ASSET-SAVE`: UI-first in `RM-DEMO` die Zielanlage speichern, wenn alle Stop-Kriterien bestanden sind. Danach sofort Screenshot, JSON-Evidence, Buch-/Coverage-Sync und Nachweis, dass nur `FA-CNC-01` existiert und kein zusaetzlicher Auto-Number-Entwurf stehen blieb.
