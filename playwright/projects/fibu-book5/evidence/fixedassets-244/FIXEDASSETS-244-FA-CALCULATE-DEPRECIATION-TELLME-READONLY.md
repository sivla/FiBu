# FIXEDASSETS-244 Calculate Depreciation Tell-Me Read-only

Status: `labor`, `read-only`, `no-posting`, `no-preview`, `no-setup-change`, `not-final`.

## Zweck

Dieser Lauf prueft den Microsoft-Learn-dokumentierten Einstieg `Calculate Depreciation` ueber Tell-Me/Search, ohne den Treffer zu waehlen und ohne die Request Page zu oeffnen.

## Ergebnis

- Umgebung: `MCP_1_20260210`
- Company: `RM-DEMO`
- Suchbegriff: `Calculate Depreciation`
- Tell-Me-Kontext sichtbar: ja
- Eindeutiger nicht-Input-Kandidat Calculate Depreciation sichtbar: ja
- Request Page/OK-Situation geoeffnet: nein

## Buchwirkung

Kapitel 21 kann den Einstieg `Suche/Alt+Q -> Calculate Depreciation` als Labor-Klickpfad-Kandidat fuehren. Der naechste Schritt muss die Request Page separat und kontrolliert pruefen, ohne `OK` zu bestaetigen.

## Grenzen

- Kein Treffer wurde angeklickt.
- Keine Request Page wurde geoeffnet.
- Keine AfA wurde berechnet.
- Keine Journalzeile, kein Preview Posting und keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-245`: Request-Page-Preflight fuer `Calculate Depreciation` kontrolliert oeffnen, aber vor `OK` stoppen.
