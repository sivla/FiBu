# FIXEDASSETS-164 Lernzusammenfassung

Status: `labor`, `read-only`, `setup-field-proof`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA Posting Group MACHINES shows the field Acquisition Cost Bal. Acc., but no concrete account value is visible/proven next to it.

## Was man in Business Central lernt

Die FA Posting Group ist nicht nur ein Code auf der Anlagenkarte. Sie enthaelt die Kontenfindung fuer Zugang, Abschreibung, Abgang und Gegenkonten. Ein sichtbares Konto in derselben Page reicht nicht automatisch: Fuer eine sichere Journalwerteingabe muss das konkrete Feld mit seinem konkreten Wert gemeinsam nachgewiesen sein.

## Buchwirkung

Kapitel 21 sollte diesen Zustand als Anfaenger-/Debuggingfall erklaeren: Das Feld ist sichtbar, aber leer oder nicht wertbelegt. Dadurch ist ein blindes Gegenkonto im FA G/L Journal fachlich nicht freigegeben.

## Grenzen

- Keine Werteingabe.
- Keine Setup-Aenderung.
- Keine Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-165: decide the FA balancing-account setup route because Acquisition Cost Bal. Acc. is visible but no concrete value is proven.
