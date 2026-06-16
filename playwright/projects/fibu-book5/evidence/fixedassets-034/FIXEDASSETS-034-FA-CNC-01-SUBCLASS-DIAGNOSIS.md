# FIXEDASSETS-034 - FA-CNC-01 Subclass Field Diagnosis

Status: `already-fit-labor-existing-card-subclass-no-posting`, `ui-first`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Zielanlage | `FA-CNC-01` |
| FA Subclass Code sichtbar | `EQUIPMENT` |
| Lookup erneut erzwungen | nein, bereits fit |
| Gebucht | nein |

## Sichtbarer Kartenstand

| Caption | sichtbarer Wert | Diagnose | editierbar |
|---|---|---|---:|
| No. | FA-CNC-01 | visible-card-row-control | nein |
| Description | CNC Maschine FRA | visible-card-row-control | nein |
| FA Class Code | TANGIBLE | visible-card-row-control | nein |
| FA Subclass Code | EQUIPMENT | visible-card-row-control | nein |
| Depreciation Book Code | (leer/nicht sichtbar) | caption-not-visible | nein |
| Posting Group | (leer/nicht sichtbar) | caption-not-visible | nein |
| Depreciation Starting Date | 01.01.2026 | visible-card-row-control | ja |
| No. of Depreciation Years | 8,00 | visible-card-row-control | ja |
| Depreciation Ending Date | 31.12.2033 | visible-card-row-control | ja |
| Book Value | 0,00 | visible-card-row-control | nein |

## Lernwert

FA Subclass Code EQUIPMENT ist im idempotenten Rerun bereits sichtbar gesetzt. Der erste erfolgreiche FIXEDASSETS-034-Versuch hat den vorher offenen Subclass-Blocker geloest; der wiederholte Lauf beweist die Persistenz ohne Buchung.

## Buchwirkung

Kapitel 21 darf den Subclass-Korrekturpfad ergaenzen und FA-CNC-01 zusammen mit FIXEDASSETS-033 als CRONUS-USA-Labor-Stammdatensatz verwenden; Anschaffung, AfA und Postenspur bleiben getrennte Gates.

## Grenzen

- Nur CRONUS-USA-Labor in `RM-DEMO`.
- Kein deutscher Anlagen-Finalnachweis.
- Kein Kreditor, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.

## Naechster Schritt

FIXEDASSETS-035-K30000-VENDOR-READINESS-DECISION: ohne Buchung entscheiden, ob K30000 als naechste Schicht vorbereitet werden darf.
