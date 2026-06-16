# FIXEDASSETS-031 - FA-CNC-01 Existing Card Correction

Status: `blocked-correction-not-fully-visible`, `ui-first`, `fixed-assets`, `masterdata-correction`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |
| Stammdaten korrigiert | ja |
| Gebucht | nein |
| Kreditor/Einkauf/Zugang/AfA | nein |

## Safety-Check

- Book Value / Acquired / Postenspur blockiert: nein.
- FA Ledger Entries zu `FA-CNC-01` sichtbar: nein.

## Vorher

| Caption | sichtbarer Wert | Diagnose |
|---|---|---|
| No. | (leer/nicht sichtbar) | caption-visible-no-row-control |
| Description | (leer/nicht sichtbar) | caption-visible-no-row-control |
| FA Class Code | (leer/nicht sichtbar) | caption-visible-no-row-control |
| FA Subclass Code | (leer/nicht sichtbar) | caption-visible-no-row-control |
| Depreciation Book Code | (leer/nicht sichtbar) | caption-visible-no-row-control |
| Posting Group | MACHINES | visible-card-row-control |
| No. of Depreciation Years | 0,00 | visible-card-row-control |
| Depreciation Starting Date | (leer/nicht sichtbar) | visible-card-row-control |
| Depreciation Ending Date | (leer/nicht sichtbar) | visible-card-row-control |
| Book Value | (leer/nicht sichtbar) | caption-not-visible |
| Acquired | (leer/nicht sichtbar) | caption-not-visible |

## Korrekturversuche

| Feld | Zielwert | gesetzt | Wert danach | Hinweis |
|---|---|---:|---|---|
| Description | CNC Maschine FRA | nein |  | Kein sichtbares editierbares Feld fuer Description |
| FA Class Code | TANGIBLE | nein |  | Kein sichtbares editierbares Feld fuer FA Class Code |
| FA Subclass Code | EQUIPMENT | nein |  | Kein sichtbares editierbares Feld fuer FA Subclass Code |
| Depreciation Book Code | HGB | nein |  | Kein sichtbares editierbares Feld fuer Depreciation Book Code |
| Posting Group | MACHINES | ja | MACHINES |  |
| No. of Depreciation Years | 8 | ja | 8,00 |  |

## Nachher

| Caption | sichtbarer Wert | Diagnose |
|---|---|---|
| No. | (leer/nicht sichtbar) | caption-visible-no-row-control |
| Description | (leer/nicht sichtbar) | caption-visible-no-row-control |
| FA Class Code | (leer/nicht sichtbar) | caption-visible-no-row-control |
| FA Subclass Code | (leer/nicht sichtbar) | caption-visible-no-row-control |
| Depreciation Book Code | (leer/nicht sichtbar) | caption-visible-no-row-control |
| Posting Group | MACHINES | visible-card-row-control |
| No. of Depreciation Years | 0,00 | visible-card-row-control |
| Depreciation Starting Date | (leer/nicht sichtbar) | visible-card-row-control |
| Depreciation Ending Date | (leer/nicht sichtbar) | visible-card-row-control |
| Book Value | (leer/nicht sichtbar) | caption-not-visible |
| Acquired | (leer/nicht sichtbar) | caption-not-visible |

## Visuelle Screenshot-Pruefung

Der Screenshot `fixedassets-031-040-card-after-correction.png` ist als visueller Labor-Teilnachweis zu lesen: Er zeigt die bestehende Karte `FA-CNC-01`, `HGB`, `MACHINES` und `Book Value = 0,00`. Die JSON-Feldextraktion bleibt konservativ und der Lauf wird nicht als kompletter Stammdaten-Fit gewertet. Beschreibung, Klasse/Unterklasse, AfA-Jahre und AfA-Daten bleiben offen.

## Anfaenger-Lernwert

Eine vorhandene Anlagennummer ist erst dann buchungsreif, wenn die Karte die relevanten Stammdatenwerte sichtbar traegt. Die Korrektur bleibt ein Stammdaten-Schritt: Sie erzeugt keinen Anlagenzugang, keine AfA und keine Posten. Genau deshalb wird vor der Korrektur der Buchwert und die Anlagenpostenspur geprueft.

## Buchwirkung

Kapitel 21 darf den Nachher-Screenshot nur als Labor-Teilnachweis fuer HGB/MACHINES nutzen. Die Anlage bleibt blockiert, bis Beschreibung, Klasse/Unterklasse, AfA-Jahre und Datumslogik sichtbar fit sind.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Anlagen-Finalnachweis.
- Kein `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- AfA-Datumslogik bleibt offen; in diesem Lauf wurden keine Datumswerte geraten.

## Naechster Schritt

FIXEDASSETS-032-FA-CNC-01-CORRECTION-BLOCKER-DIAGNOSIS: sichtbaren Feld-/Save-Blocker analysieren; keine Einkaufsrechnung und keine Buchung.
