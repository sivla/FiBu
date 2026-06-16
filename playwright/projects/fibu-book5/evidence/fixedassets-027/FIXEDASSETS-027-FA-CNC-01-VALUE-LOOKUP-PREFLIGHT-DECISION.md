# FIXEDASSETS-027 - FA-CNC-01 Value-/Lookup-Preflight-Decision

Status: `labor`, `ui-first`, `readiness`, `lookup-preflight`, `auto-number-cleanup`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |
| Speichern | unerwarteter Auto-Number-Entwurf `FA000110` entstand und wurde per UI geloescht |
| Setup geaendert | nein |
| Buchung | nein |

## Ergebnis

- Aktive Karten-Controls erneut vollstaendig gemappt: ja.
- `HGB` sichtbar/nutzbar als Lookup-/Referenzwert: ja.
- `MACHINES` sichtbar/nutzbar als Lookup-/Referenzwert: ja.
- Klasse/Unterklasse mit sichtbaren Referenzwerten: ja.
- `FA-CNC-01` nach Lauf nicht gespeichert: ja.
- Unerwarteter Entwurf `FA000110` entstand durch den New-Card-/Lookup-Preflight: ja.
- Entwurf `FA000110` per UI geloescht und danach im Filter nicht mehr sichtbar: ja.

## Lookup-/Wertbefund

| Feld | Lookup-Button geklickt | Lookup vermutlich offen | sichtbare Ziel-/Referenzwerte | Screenshot-Status |
|---|---:|---:|---|---|
| FA Class Code | ja | ja | TANGIBLE, FINANCIAL, INTANGIBLE | candidate |
| FA Subclass Code | ja | ja | EQUIPMENT, VEHICLE, COMPUTER | candidate |
| Depreciation Book Code | ja | ja | HGB, COMPANY | candidate |
| Posting Group | ja | ja | MACHINES, EQUIPMENT | candidate |

## Kontrollbefund aktive Kartenfelder

| Feld | Diagnose | nahe Controls | nahe Buttons |
|---|---|---:|---:|
| FA Class Code | active-card-label-with-control | 3 | 4 |
| FA Subclass Code | active-card-label-with-control | 2 | 4 |
| Depreciation Book Code | active-card-label-with-control | 1 | 4 |
| Posting Group | active-card-label-with-control | 2 | 4 |
| Depreciation Starting Date | active-card-label-with-control | 1 | 2 |
| Depreciation Ending Date | active-card-label-with-control | 1 | 2 |

## Anfaenger-Lernwert

Ein sichtbares Feld ist noch kein fertiger Stammdatenwert. Vor dem Speichern einer Anlage muss ein Anfaenger pruefen, ob die Codes aus einem echten Lookup oder einer sicheren Vorgabe kommen. Besonders kritisch sind `Depreciation Book Code` und `Posting Group`, weil sie Abschreibung und Sachkontenfindung steuern. Wenn der Code im Screenshot nicht sichtbar ist, darf das Bild nicht als Wertnachweis ins Buch.

Zusaetzlicher Lernfall: Die neue Anlagenkarte hat beim Preflight automatisch `FA000110` erzeugt und als gespeichert angezeigt. Deshalb reicht es nicht, nur zu pruefen, ob die Zielnummer `FA-CNC-01` nicht existiert. Klickanleitungen brauchen entweder einen bewusst erlaubten Speicherschritt oder einen dokumentierten Cleanup-/Abbruchpfad fuer automatisch nummerierte Entwuerfe.

## Buchwirkung

Kapitel 21 darf jetzt erklaeren, dass nach der Control-Recovery ein eigener Lookup-/Wertpreflight noetig ist: Nur sichtbar belegte Codes duerfen in eine Klickanleitung als auswaehlbare Werte uebernommen werden. Gleichzeitig muss das Buch die Auto-Number-Falle erklaeren: Ein vermeintlicher Preflight kann bereits einen gespeicherten Entwurf erzeugen.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Anlagen-Finalnachweis.
- Kein gespeicherter Anlagenstamm `FA-CNC-01`.
- `FA000110` war ein versehentlich erzeugter technischer Entwurf dieses Laufs und wurde wieder geloescht.
- Kein Kreditor `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Keine deutschen Kontenplan- oder HGB-Endstandsbehauptungen.

## Naechster Schritt

FIXEDASSETS-028-FA-CNC-01-AUTO-NUMBER-SAVE-GATE-DECISION: ohne BC-Run entscheiden, wie `FA-CNC-01` sicher gespeichert wird, welche Klasse/Unterklasse und AfA-Daten gesetzt werden und wie automatische Entwurfsnummern vermieden oder bereinigt werden.
