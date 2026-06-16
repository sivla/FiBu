# FIXEDASSETS-026 - FA-CNC-01 Depreciation-Book-Control-Recovery

Status: `labor`, `ui-first`, `readiness`, `control-recovery`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

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

- Fehlende aktive Controls aus 024 wiederhergestellt: ja.
- Depreciation Book Code aktiv mit Control: ja.
- Posting Group aktiv mit Control: ja.
- FastTabs gezielt aufgeklappt: General, Depreciation Book.
- `FA-CNC-01` nach Lauf nicht gespeichert: ja.

## Aktive Karten-Control-Diagnose

| Caption | Diagnose | ausgewaehltes Label | nahe Controls | nahe Buttons |
|---|---|---|---:|---:|
| FA Class Code | active-card-label-with-control | FA Class Code | 3 | 4 |
| FA Subclass Code | active-card-label-with-control | FA Subclass Code | 2 | 4 |
| Depreciation Book Code | active-card-label-with-control | Depreciation Book Code | 1 | 4 |
| Posting Group | active-card-label-with-control | Posting Group | 2 | 4 |
| Depreciation Starting Date | active-card-label-with-control | Depreciation Starting Date | 1 | 2 |
| Depreciation Ending Date | active-card-label-with-control | Depreciation Ending Date | 1 | 2 |

## Anfaenger-Lernwert

Auf einer Business-Central-Karte sind wichtige Felder oft erst sichtbar, wenn der passende FastTab aufgeklappt und die breite Ansicht genutzt wird. Fuer Anlagen ist das besonders wichtig: `Depreciation Book Code` steuert die Abschreibungslogik, `Posting Group` die Sachkontenfindung. Ohne diese Felder darf man keine Anlagenkarte als buchungsreif erklaeren.

## Buchwirkung

Kapitel 21 darf den naechsten Schritt nun als No-Save-Kartenkontrolle beschreiben: Erst die Kartenfelder sichtbar und aktiv nachweisen, danach erst Wert-/Lookup-Entscheidung fuer `HGB` und `MACHINES`. Ein Screenshot ist nur brauchbar, wenn die konkreten zu erklaerenden Felder im Bild sichtbar sind.

## Grenzen

- CRONUS-USA-Labor, kein deutscher HGB-/Kontenplan-Endstand.
- Keine Zielwerte `FA-CNC-01`, `HGB` oder `MACHINES` wurden gesetzt.
- Keine gespeicherte Anlage, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Der Lauf beweist Feld-/Control-Erreichbarkeit, aber noch keinen fachlichen Wertfit.

## Naechster Schritt

FIXEDASSETS-027-FA-CNC-01-VALUE-LOOKUP-PREFLIGHT-DECISION: no-save pruefen, ob die Lookup-/Wertpfade fuer HGB und MACHINES auf den nun aktiven Kartenfeldern sicher sind; weiterhin keine Speicherung ohne Gate.
