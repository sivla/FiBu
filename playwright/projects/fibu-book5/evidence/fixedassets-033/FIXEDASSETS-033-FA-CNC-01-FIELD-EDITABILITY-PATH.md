# FIXEDASSETS-033 - FA-CNC-01 Field Editability Path

Status: `blocked-field-editability-or-final-visibility`, `ui-first`, `masterdata-correction`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielanlage | `FA-CNC-01` |
| Edit-Icon geklickt | ja |
| Wide Layout geklickt | ja |
| Stammdaten geaendert | ja |
| Gebucht | nein |
| Kreditor/Einkauf/Zugang/AfA | nein |

## Safety

- FA Ledger Entries zu `FA-CNC-01` sichtbar: nein.
- Kein Kreditor, keine Einkaufsrechnung, keine Anschaffung, keine AfA und keine Buchung.

## Vor Edit-Icon

| Caption | sichtbarer Wert | Diagnose | editierbar |
|---|---|---|---:|
| No. | FA-CNC-01 | visible-readonly-card-row-control | nein |
| Description | CNC Maschine FRA | visible-readonly-card-row-control | nein |
| FA Class Code | TANGIBLE | visible-readonly-card-row-control | nein |
| FA Subclass Code | (Leer) | visible-readonly-card-row-control | nein |
| Depreciation Book Code | HGB | visible-readonly-card-row-control | nein |
| Posting Group | MACHINES | visible-editable-card-row-control | ja |
| Depreciation Starting Date | 01.01.2026 | visible-editable-card-row-control | ja |
| No. of Depreciation Years | 8,00 | visible-editable-card-row-control | ja |
| Depreciation Ending Date | 31.12.2033 | visible-editable-card-row-control | ja |
| Book Value | 0,00 | visible-readonly-card-row-control | nein |
| Acquired | (leer/nicht sichtbar) | caption-visible-no-row-control | nein |

## Nach Edit-Icon

| Caption | sichtbarer Wert | Diagnose | editierbar |
|---|---|---|---:|
| No. | FA-CNC-01 | visible-editable-card-row-control | ja |
| Description | CNC Maschine FRA | visible-editable-card-row-control | ja |
| FA Class Code | TANGIBLE | visible-editable-card-row-control | ja |
| FA Subclass Code | (leer/nicht sichtbar) | visible-editable-card-row-control | ja |
| Depreciation Book Code | HGB | visible-readonly-card-row-control | nein |
| Posting Group | MACHINES | visible-editable-card-row-control | ja |
| Depreciation Starting Date | 01.01.2026 | visible-editable-card-row-control | ja |
| No. of Depreciation Years | 8,00 | visible-editable-card-row-control | ja |
| Depreciation Ending Date | 31.12.2033 | visible-editable-card-row-control | ja |
| Book Value | 0,00 | visible-readonly-card-row-control | nein |
| Acquired | (leer/nicht sichtbar) | caption-not-visible | nein |

## Korrektur

| Feld | Zielwert | versucht | gefuellt | Wert danach | Hinweis |
|---|---|---:|---:|---|---|
| Description | CNC Maschine FRA | ja | ja | CNC Maschine FRA |  |
| FA Class Code | TANGIBLE | ja | ja | TANGIBLE |  |
| FA Subclass Code | EQUIPMENT | ja | nein |  | Direkte Texteingabe wurde von BC geleert; Lookup setzte den Wert nicht sichtbar. |

## Final sichtbarer Kartenstand

| Caption | sichtbarer Wert | Diagnose | editierbar |
|---|---|---|---:|
| No. | FA-CNC-01 | visible-readonly-card-row-control | nein |
| Description | CNC Maschine FRA | visible-readonly-card-row-control | nein |
| FA Class Code | TANGIBLE | visible-readonly-card-row-control | nein |
| FA Subclass Code | (Leer) | visible-readonly-card-row-control | nein |
| Depreciation Book Code | HGB | visible-readonly-card-row-control | nein |
| Posting Group | MACHINES | visible-editable-card-row-control | ja |
| Depreciation Starting Date | 01.01.2026 | visible-editable-card-row-control | ja |
| No. of Depreciation Years | 8,00 | visible-editable-card-row-control | ja |
| Depreciation Ending Date | 31.12.2033 | visible-editable-card-row-control | ja |
| Book Value | 0,00 | visible-readonly-card-row-control | nein |
| Acquired | (leer/nicht sichtbar) | caption-not-visible | nein |

## Lernwert

Die Fixed Asset Card bleibt trotz Edit-Icon nicht vollstaendig fit. Der Lernwert ist die Trennung zwischen sichtbarer Caption, editierbarem Control und final sichtbarem Kartenwert.

## Buchwirkung

Kapitel 21 muss weiter einen Feld-/Editierbarkeitsblocker erklaeren und darf keinen Anlagenzugang vorbereiten.

## Grenzen

- Nur CRONUS-USA-Labor in `RM-DEMO`.
- Kein deutscher HGB-/Kontenplan- oder Anlagen-Finalnachweis.
- Noch keine Anlagenanschaffung, keine AfA und keine Postenspur.

## Naechster Schritt

FIXEDASSETS-034-FA-CNC-01-FIELD-BLOCKER-MANUAL-DIAGNOSIS: Page Inspection/Personalize zur Feldursache nutzen, weiterhin ohne Kauf/AfA/Buchung.
