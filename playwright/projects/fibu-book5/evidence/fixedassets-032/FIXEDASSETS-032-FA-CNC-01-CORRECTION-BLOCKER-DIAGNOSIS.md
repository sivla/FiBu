# FIXEDASSETS-032 - FA-CNC-01 Correction Blocker Diagnosis

Status: `blocked-edit-mode-or-field-control-diagnosis`, `ui-first`, `fixed-assets`, `masterdata-correction`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielanlage | `FA-CNC-01` |
| Bearbeitungsaktion | keyboard-fallback-control-shift-e |
| Stammdaten geaendert | ja |
| Gebucht | nein |
| Kreditor/Einkauf/Zugang/AfA | nein |

## Safety

- FA Ledger Entries zu `FA-CNC-01` sichtbar: nein.
- Safety blockiert: nein.

## Vor Bearbeitungsmodus

| Caption | sichtbarer Wert | Diagnose | editierbar |
|---|---|---|---:|
| No. | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Description | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| FA Class Code | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| FA Subclass Code | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Depreciation Book Code | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Posting Group | MACHINES | visible-editable-card-row-control | ja |
| Depreciation Starting Date | (leer/nicht sichtbar) | visible-editable-card-row-control | ja |
| No. of Depreciation Years | 0,00 | visible-editable-card-row-control | ja |
| Depreciation Ending Date | (leer/nicht sichtbar) | visible-editable-card-row-control | ja |
| Book Value | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Acquired | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |

## Nach Bearbeitungsmodus

| Caption | sichtbarer Wert | Diagnose | editierbar |
|---|---|---|---:|
| No. | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Description | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| FA Class Code | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| FA Subclass Code | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Depreciation Book Code | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Posting Group | MACHINES | visible-editable-card-row-control | ja |
| Depreciation Starting Date | (leer/nicht sichtbar) | visible-editable-card-row-control | ja |
| No. of Depreciation Years | 0,00 | visible-editable-card-row-control | ja |
| Depreciation Ending Date | (leer/nicht sichtbar) | visible-editable-card-row-control | ja |
| Book Value | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Acquired | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |

## Korrekturversuch

| Feld | Zielwert | versucht | gefuellt | Wert danach | Hinweis |
|---|---|---:|---:|---|---|
| Description | CNC Maschine FRA | nein | nein |  | Kein sichtbares editierbares Feld fuer Description |
| FA Class Code | TANGIBLE | nein | nein |  | Kein sichtbares editierbares Feld fuer FA Class Code |
| FA Subclass Code | EQUIPMENT | nein | nein |  | Kein sichtbares editierbares Feld fuer FA Subclass Code |
| Depreciation Starting Date | 01.01.2026 | ja | ja | 01.01.2026 |  |
| No. of Depreciation Years | 8 | ja | ja | 8,00 |  |

## Final sichtbarer Kartenstand

| Caption | sichtbarer Wert | Diagnose | editierbar |
|---|---|---|---:|
| No. | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Description | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| FA Class Code | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| FA Subclass Code | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Depreciation Book Code | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Posting Group | MACHINES | visible-editable-card-row-control | ja |
| Depreciation Starting Date | 01.01.2026 | visible-editable-card-row-control | ja |
| No. of Depreciation Years | 8,00 | visible-editable-card-row-control | ja |
| Depreciation Ending Date | 31.12.2033 | visible-editable-card-row-control | ja |
| Book Value | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |
| Acquired | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |

## Lernwert

Business Central zeigt auf der Fixed Asset Card unterschiedliche Feldzustaende: Teilweise sind Werte sichtbar, aber einzelne Felder bleiben ohne editierbares Control oder ohne final sichtbaren Zielwert. Genau daraus entsteht ein guter Bugfixing-/Anfaengerfall: erst Editierbarkeit und Kartenwerte beweisen, dann Folgeprozesse freigeben.

## Buchwirkung

Kapitel 21 muss FA-CNC-01 weiter als blockierte oder teilfitte Anlagenkarte erklaeren. Das Buch sollte zeigen, woran man erkennt, ob ein Feld wirklich editierbar ist, und warum Folgeprozesse ohne sichtbare Zielwerte gesperrt bleiben.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher HGB-/Kontenplan-Finalnachweis.
- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Datumslogik ist nur Labor-Setup-Vorbereitung, keine Nutzungsdauer- oder Bilanzierungsberatung.

## Naechster Schritt

FIXEDASSETS-033-FA-CNC-01-FIELD-EDITABILITY-HELPER-OR-MANUAL-PATH: Feld-/Editierbarkeitsblocker loesen, keine Einkaufsrechnung und keine Anlagenbuchung.
