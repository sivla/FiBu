# FIXEDASSETS-101 - FA G/L Journal Ownership Gate

Status: observed, local review, no BC execution, no Playwright execution.

## Entscheidung

Der Fixed-Asset-G/L-Journal-Weg wird wieder geoeffnet, aber nur als kontrollierter Laborentwurf.

Der Grund ist pragmatisch:

- Die Einkaufsrechnungsroute hat `Type = Fixed Asset` trotz gezielter UI-Probes nicht sichtbar oder auswaehlbar gemacht.
- Die `Acquire`-Aktion ist fuer `FA-CNC-01` bisher sichtbar, aber deaktiviert.
- Die FA-G/L-Journal-Seite und ihre relevanten Spalten sind bereits read-only nachgewiesen.
- Ein sichtbarer Delete-Cleanup ist nicht nachgewiesen. Deshalb darf der naechste Lauf nicht so tun, als waere Cleanup geloest.

## Erlaubnis fuer den naechsten Lauf

`FIXEDASSETS-102` darf genau eine kontrollierte Labor-Journalzeile erzeugen oder veraendern.

Erlaubt nur fuer diesen Case:

- eine Journalzeile,
- eindeutige Vorher-/Nachher-Evidence,
- Dokumentnummer/Batch/Feldwerte als Trace,
- kontrolliertes Behalten der Laborzeile, falls kein Cleanup sichtbar ist.

Weiterhin gesperrt:

- Preview Posting,
- Posting,
- Setup-Aenderung,
- Company-Wechsel,
- API-Shortcut,
- mehr als eine Draft-Zeile.

## Buchwirkung

Das ist wichtig fuer die spaetere Klickanleitung: Anfaenger sollen nicht nur lernen, wie man Anlagen bucht, sondern auch warum Journale gefaehrlich sind, wenn Entwurfszeilen unkontrolliert liegen bleiben. Der Screenshot-/Evidence-Punkt muss deshalb nicht nur die Felder zeigen, sondern auch die Entwurfsverantwortung erklaeren.

## Grenze

Das bleibt RM-DEMO/CRONUS-Labor. Es ist kein deutscher Finalnachweis, keine Posting-Freigabe und kein Nachweis von FA Ledger Entries.
