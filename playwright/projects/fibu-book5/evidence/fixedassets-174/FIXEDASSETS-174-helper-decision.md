# FIXEDASSETS-174 Helper-Entscheidung

Status: `local-helper`, `wizard_work`, `no-bc`, `no-playwright`, `no-posting`, `not-final`.

## Situation

FA-172 hat die bestehende `Fixed Asset G/L Journals`-Zone in `MCP_1_20260210 / RM-DEMO` sichtbar gemacht. Das Bild zeigt den Journal-Kontext und `Bal. Account Type = G/L Account`, aber der technische Extract fand `0` editierbare Kandidaten fuer `Bal. Account No.`. `82000` wurde nicht sichtbar.

## Ursache

Das ist kein neuer fachlicher Setup-Blocker. FA-170 belegt weiterhin den Setup-Fit `MACHINES / Acquisition Cost Bal. Acc. = 82000`. Der Blocker liegt in der Business-Central-Grid-/Subform-Steuerung: Sichtbare Header und sichtbarer Zeilenkontext reichen nicht, wenn Playwright keine editierbare Zielzelle eindeutig an die Zielzeile bindet.

## Helper-Aenderung

Neu ist `playwright/core/bc/journal-grid-candidates.ts`.

Der Helper trennt:

- sichtbare Spalte,
- isolierte Zielzeile,
- verbotene Signale wie `K30000`,
- editierbarer Control-Kandidat,
- bereits sichtbarer Zielwert.

Der Helper gibt erst dann `single-editable-candidate` zurueck, wenn Zielzeile und Zielspalte zusammenpassen und genau ein editierbares Control gefunden wird.

## Lokaler Nachweis

`core:journal-grid:selftest` nutzt die echte FA-172-Signaldatei und zwei synthetische Gegenproben:

- FA-172 wird korrekt als `blocked-missing-row-anchor` erkannt.
- Ein synthetischer sauberer Journalzeilen-Kandidat wird als `single-editable-candidate` akzeptiert.
- Ein synthetischer K30000-Kontext wird als `blocked-forbidden-signal-visible` abgelehnt.

## Grenze

Das ist noch keine BC-Live-Evidence. Der Helper beweist keine Werteingabe, keine Preview Posting und keine Buchung. Er macht nur den naechsten Live-Schritt sicherer.

## Naechster Schritt

FA-175 soll lokal pruefen, ob der Helper als Gate fuer den naechsten read-only oder guarded Live-Lauf akzeptiert wird. Bis dahin bleiben `Bal. Account No. = 82000`, Preview Posting und Posting gesperrt.
