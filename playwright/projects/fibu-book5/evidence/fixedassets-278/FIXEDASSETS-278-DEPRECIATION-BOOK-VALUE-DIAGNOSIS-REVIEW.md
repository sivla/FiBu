# FIXEDASSETS-278 AfA-Buchwert-Diagnose Review

Status: `labor`, `local-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-ok`, `no-preview`, `no-posting`, `not-final`.

## Entscheidung

`FIXEDASSETS-278` gibt keinen weiteren `Calculate Depreciation -> OK`-Lauf frei.

Ebenso gesperrt bleiben:

- Preview Posting
- Post
- Setup Change
- Company Switch
- API-Abkuerzung

## Warum

`FIXEDASSETS-277` beweist den Kontext, aber nicht die entscheidenden Werte:

- `FA-CNC-01` ist auf der Anlagenkarte sichtbar.
- Page Inspection oeffnet `Fixed Asset Card (5600)` / `Fixed Asset (5600)`.
- `Book Value` / `Acquisition Cost = 120.000,00` ist sichtbar.
- Anlagenposten `G05001` ist in den FA Ledger Entries sichtbar.
- `FADEP-273-OK` ist weiterhin nicht im sichtbaren `Fixed Asset G/L Journal`.

Nicht bewiesen sind konkrete Werte fuer:

- `Depreciation Starting Date`
- `No. of Depreciation Years`
- `Depreciation Ending Date`
- `Last Depreciation Date`

Damit waere ein weiterer `OK`-Klick nur eine Wiederholung ohne neue fachliche Grundlage.

## Anfaenger-Lernwert

Sichtbare Feldbeschriftungen sind keine Feldwerte. Page Inspection ist sehr wertvoll, weil sie Page und Tabelle bestaetigt, aber sie ersetzt nicht automatisch den Nachweis, welchen konkreten Wert Business Central fuer die Berechnung verwendet.

Fuer die Klickanleitung bedeutet das: Vor einer AfA-Ausfuehrung muss der Anwender die AfA-Buchwerte kontrollieren. Wenn die Werte leer, versteckt oder technisch nicht eindeutig lesbar sind, ist das ein eigener Diagnose- oder Setup-Schritt.

## Naechster Schritt

`FIXEDASSETS-279`: read-only Field-Value-Probe auf der Anlagenkarte `FA-CNC-01` mit dem vorhandenen Caption-Control-Muster aus `FIXEDASSETS-029/031`.

Ziel: unterscheiden, ob die AfA-Werte wirklich leer sind oder ob FA-277 sie nur nicht sauber ausgelesen hat.

Weiterhin: kein `OK`, kein Preview Posting, kein Post und kein Setup Change.
