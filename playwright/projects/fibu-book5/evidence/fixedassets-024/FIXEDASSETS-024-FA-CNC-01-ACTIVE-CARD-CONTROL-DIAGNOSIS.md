# FIXEDASSETS-024 - Active Card Control Diagnosis

Status: labor-active-card-control-partial-no-save

## Zweck

Dieser Lauf prueft no-save, ob Playwright die sichtbaren Controls der aktiven `Fixed Asset Card` von Treffern der Hintergrundliste trennen kann. Das ist der fehlende technische Schritt vor jedem spaeteren Speichern von `FA-CNC-01`.

## Kontext

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Zielanlage spaeter: `FA-CNC-01`
- Modus: UI-first, active-card-control diagnosis, no-save, no-setup, no-posting

## Diagnose

| Feld | Ergebnis | ausgewaehltes Label | nahe Controls | verworfene Hintergrundtreffer |
|---|---|---|---|---:|
| FA Class Code | active-card-label-with-control | A/button @ 472,344 | INPUT; INPUT; on | 4 |
| FA Subclass Code | active-card-label-with-control | A/button @ 472,382 | INPUT; on | 4 |
| Depreciation Book Code | caption-not-visible | - | - | 0 |
| Posting Group | caption-not-visible | - | - | 0 |
| Depreciation Starting Date | active-card-label-with-control | DIV @ 472,537 | Geben Sie das Datum im Format dd.MM.yyyy ein | 0 |
| Depreciation Ending Date | active-card-label-with-control | DIV @ 472,613 | Geben Sie das Datum im Format dd.MM.yyyy ein | 0 |

## Ergebnis

- Aktive Kartencontrols ausreichend gemappt: nein
- `FA-CNC-01` wurde nicht gespeichert: ja
- Screenshot: `playwright/projects/fibu-book5/img/fixedassets-024-020-active-card-control-diagnosis.png`

## Lernwert

Business Central laesst die Liste hinter einer Karte technisch im DOM. Deshalb darf ein Locator nicht nur nach Feldcaption suchen. Er muss den Vordergrundkarten-Kontext und die editierbare Control-Zeile bewerten. Fuer das Buch heisst das: Ein Screenshot oder Test ist erst belastbar, wenn der behauptete Wert im richtigen sichtbaren Kartenkontext erscheint.

## Grenze

Dieser Lauf setzt keine Werte. Er beweist noch nicht `HGB`, `MACHINES`, Anlagenklasse, Anlagenunterklasse oder AfA-Daten als gewaehlte Werte auf `FA-CNC-01`. Er oeffnet nur den naechsten kontrollierten Weg zu einer spaeteren Save-Gate-Entscheidung.
