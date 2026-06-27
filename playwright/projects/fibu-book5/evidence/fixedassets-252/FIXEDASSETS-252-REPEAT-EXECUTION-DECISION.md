# FIXEDASSETS-252 Repeat Execution Decision

Status: `labor`, `local-decision`, `fixed-assets`, `no-bc-run`, `no-playwright-run`, `no-ok`, `no-preview`, `no-posting`, `not-final`.

## Entscheidung

Ein erneuter `OK`-Klick auf `Calculate Depreciation` ist noch nicht gerechtfertigt.

## Warum

- `FIXEDASSETS-248` hat `OK` bereits genau einmal mit `Document No. = FADEP-20260627-2158` bestaetigt.
- `FIXEDASSETS-250` hat danach in `Fixed Asset G/L Journals` kein sichtbares `FADEP-20260627-2158`- oder `FADEP-`-Signal gefunden.
- `FIXEDASSETS-251` hat die Request Page nur read-only geoeffnet. Dort waren zuletzt verwendete Optionen/Filter und `FADEP-20260627-2158` sichtbar, aber der Wert war nicht feldsicher einem `Document No.`-Control zugeordnet.
- `Depreciation Book`, `Posting Date` und `Fixed Asset`-Filter waren als Captions sichtbar, aber nicht als belastbare Zielwerte.

## Konsequenz fuer den naechsten Lauf

Der naechste praktische Lauf darf nicht direkt `OK` druecken. Er muss zuerst als Preflight beweisen, dass die Request Page feldsicher kontrollierbar ist:

- `Depreciation Book = HGB` oder bewusst begruendeter Laborwert
- `Posting Date` als bewusst gewaehlter Stichtag
- neue eindeutige `Document No.` mit `FADEP-`-Praefix
- `Fixed Asset`-Filter auf `FA-CNC-01`
- kein `OK`
- kein Preview Posting
- kein Post

## Anfaenger-Lernwert

Eine Business-Central-Request-Page kann zuletzt verwendete Optionen wieder anzeigen. Das ist praktisch, aber gefaehrlich fuer Anleitungen: Ein sichtbarer Wert ist erst dann ein Nachweis, wenn klar ist, zu welchem Feld er gehoert und ob er wirklich fuer den aktuellen Lauf gilt.

## Buchwirkung

Kapitel 21 darf den AfA-Request-Page-Schritt als Kontrollpunkt erklaeren. Es darf aber noch nicht behaupten, dass die AfA-Zeile erzeugt wurde. Vor jeder wiederholten Ausfuehrung braucht die Klickanleitung einen Parameter-Preflight.

## Naechster Fall

`FIXEDASSETS-253-FA-DEPRECIATION-PARAMETER-PREFLIGHT-NO-OK`: Request Page erneut oeffnen, Zielparameter feldsicher setzen oder beweisen, und vor `OK` stoppen.
