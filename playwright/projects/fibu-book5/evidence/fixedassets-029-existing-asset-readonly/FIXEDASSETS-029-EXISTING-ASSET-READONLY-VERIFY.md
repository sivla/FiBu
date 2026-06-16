# FIXEDASSETS-029 Existing Asset Read-only Verify

Status: `blocked-existing-target-values-incomplete-readonly`, `ui-first`, `read-only`, `fixed-assets`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielanlage | FA-CNC-01 |
| Geaendert | nein |
| Gebucht | nein |

## Sichtbare Kartenwerte

| Caption | sichtbarer Wert | Diagnose |
|---|---|---|
| No. | FA-CNC-01 | visible-card-row-control |
| Description | (leer/nicht sichtbar) | visible-card-row-control |
| FA Class Code | (leer/nicht sichtbar) | visible-card-row-control |
| FA Subclass Code | (leer/nicht sichtbar) | visible-card-row-control |
| Depreciation Book Code | (leer/nicht sichtbar) | visible-card-row-control |
| Posting Group | (leer/nicht sichtbar) | visible-card-row-control |
| No. of Depreciation Years | 0,00 | visible-card-row-control |
| Depreciation Starting Date | (leer/nicht sichtbar) | visible-card-row-control |
| Depreciation Ending Date | (leer/nicht sichtbar) | visible-card-row-control |
| Book Value | (leer/nicht sichtbar) | caption-visible-no-row-control |
| Acquired | (leer/nicht sichtbar) | caption-visible-no-row-control |

## Zielwert-Fit

| Zielwert | sichtbar passend |
|---|---:|
| fixedAssetNo | ja |
| description | nein |
| faClassCode | nein |
| faSubclassCode | nein |
| depreciationBook | nein |
| postingGroup | nein |
| depreciationYears | nein |

## Kernaussage

FA-CNC-01 existiert zwar als Nummer, aber die sichtbaren Kartenwerte reichen nicht als fachlich vollstaendiger Anlagenstamm. Code-Sichtbarkeit allein ist kein Buch- oder Buchungsnachweis.

## Anfaenger-Lernwert

Eine sichtbare Nummer in der Anlagenliste ist noch kein verwendbarer Anlagenstamm. Fuer eine Buchanleitung muss die Karte zeigen, ob Beschreibung, Anlagenklasse, Unterklasse, AfA-Buch und Anlagenbuchungsgruppe wirklich gepflegt sind. Sonst wuerde ein spaeterer Einkaufs- oder AfA-Schritt auf ungesichertem Stammdatengrund laufen.

## Buchwirkung

Kapitel 21 muss einen Lernfall aufnehmen: Wenn ein Zielcode schon existiert, zuerst die Karte pruefen. Nur sichtbare, passende Feldwerte zaehlen; ein Listen-Code reicht nicht.

## Grenzen

- Read-only CRONUS-USA-Labor in `RM-DEMO`.
- Kein `K30000`, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.
- Kein deutscher HGB-/Kontenplan- oder Steuer-Finalnachweis.

## Naechster Schritt

FIXEDASSETS-030-FA-CNC-01-CORRECTION-GATE-DECISION: entscheiden, ob die bestehende Anlage UI-first korrigiert oder ein neuer Labor-Zielcode verwendet wird; keine Einkaufsrechnung und keine Buchung.
