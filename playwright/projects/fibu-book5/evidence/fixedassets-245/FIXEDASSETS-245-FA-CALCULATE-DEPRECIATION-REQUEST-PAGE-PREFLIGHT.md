# FIXEDASSETS-245 Calculate Depreciation Request Page Preflight

Status: `labor`, `guarded-preflight`, `no-ok`, `no-posting`, `no-preview`, `no-setup-change`, `not-final`.

## Zweck

Dieser Lauf oeffnet den bereits belegten Tell-Me-Treffer `Calculate Depreciation` nur so weit, dass die Request Page und ihre Pflichtfelder sichtbar werden. `OK` wird nicht bestaetigt.

## Ergebnis

- Umgebung: `MCP_1_20260210`
- Company: `RM-DEMO`
- Treffer geklickt: ja (role:row:Calculate Depreciation Aufgaben)
- Request Page sicher erkannt: ja
- OK sichtbar, aber nicht bestaetigt: ja
- Seite per Escape geschlossen: ja

## Sichtbare Feldsignale

- Calculate-Depreciation-Titel: ja
- Depreciation Book: ja
- Posting Date: ja
- Document No.: ja
- Depreciation Days: nein

## Buchwirkung

Kapitel 21 kann die Request Page als Vor-Ausfuehrungs-Kontrollpunkt erklaeren: Vor `OK` prueft man AfA-Buch, Buchungsdatum, Belegnummer und Berechnungsparameter. Der eigentliche Berechnungslauf bleibt ein separates Gate.

## Grenzen

- `OK` wurde nicht bestaetigt.
- Keine AfA wurde berechnet.
- Keine Journalzeile wurde erzeugt.
- Kein Preview Posting und keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-246`: lokal entscheiden, ob ein spaeterer kontrollierter Calculate-Depreciation-Ausfuehrungsgate vorbereitet werden darf.
