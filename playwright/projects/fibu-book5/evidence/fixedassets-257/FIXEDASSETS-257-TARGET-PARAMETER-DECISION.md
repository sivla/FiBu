# FIXEDASSETS-257 Target Parameter Decision

Status: `labor`, `local-review`, `no-bc`, `no-playwright`, `no-value-write`, `no-ok`, `not-final`.

## Entscheidung

Der naechste praktische Schritt darf ein eng gegateter no-OK Value-Preflight sein. Die Zielwerte dafuer sind:

| Parameter | Ziel fuer naechsten Preflight | Warum |
|---|---|---|
| AfA-Buch / `Depreciation Book` | `HGB` | Die bestehende Labor-Postenspur und der HGB-Setup-Fit beziehen sich auf `FA-CNC-01` / `G05001` / `HGB`. |
| Buchungsdatum / `Posting Date` | `30.06.2026` | Die fruehe Zielnotiz nennt AfA bis `30.06.2026`; die UI erwartet `dd.MM.yyyy`. |
| Belegnummer / `Document No.` | `FADEP-258-NO-OK` | `Document No.` war bisher das staerkste feldsichere Request-Page-Feld. |
| Anlagenfilter / `Fixed Asset No.` | `FA-CNC-01` | Das ist die Zielanlage; der Filter muss im naechsten Lauf sichtbar als Wert bestehen bleiben. |

## Abgelehnte Zielwerte

- `COMPANY` wird nicht als Ziel-AfA-Buch akzeptiert. Es ist nur der aktuelle sichtbare Request-Page-Default.
- `06/27/2026` wird nicht als UI-Zielnotation akzeptiert. Die Request Page gibt `dd.MM.yyyy` vor.

## Gate fuer FA-258

`FIXEDASSETS-258` darf Business Central mit Playwright oeffnen und die Request Page `Calculate Depreciation` bis zum no-OK Wertnachweis bedienen.

Erlaubt ist nur:

- Request Page oeffnen,
- Zielwerte ohne `OK` eintragen,
- sichtbaren Wertnachweis sichern,
- Request Page ohne Ausfuehrung schliessen.

Nicht erlaubt:

- `OK`,
- Preview Posting,
- Post,
- Setup Change,
- Company Switch,
- API Shortcut.

## Lernwert fuer das Buch

Anfaenger muessen lernen: Bei Batch-Request-Pages geht es nicht nur darum, sichtbare Felder zu finden. Man muss auch verstehen, ob die vorbelegten Werte zum fachlichen Fall passen. `COMPANY` kann technisch sichtbar sein und trotzdem fuer den aktuellen HGB-Lernfall falsch sein.

## Naechster Schritt

`FIXEDASSETS-258-FA-DEPRECIATION-TARGET-VALUE-PREFLIGHT-NO-OK`: HGB, `30.06.2026`, `FADEP-258-NO-OK` und `FA-CNC-01` ohne `OK` setzen und beweisen, dass die Werte sichtbar im richtigen Request-Page-Kontext stehen.
