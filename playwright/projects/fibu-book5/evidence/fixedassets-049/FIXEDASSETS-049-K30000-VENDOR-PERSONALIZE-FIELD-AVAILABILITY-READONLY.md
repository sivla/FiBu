# FIXEDASSETS-049 - K30000 Vendor Personalize Field Availability read-only

Status: `labor`, `read-only`, `ui-first`, `personalize-diagnosis`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Ergebnisstatus | done-labor-readonly-personalize-fields-not-visible |
| Gebucht | nein |
| Einkaufsrechnung erzeugt | nein |
| Kreditor/Setup geaendert | nein |
| Personalisierung gespeichert | nein |

## Ergebnis

Personalisieren wurde read-only als Diagnosemodus geoeffnet, aber die vier kritischen Felder wurden dort nicht sichtbar gefunden. Es gab keine gespeicherte Personalisierung, keine Kreditor-/Setup-Aenderung und keine Buchung.

## Personalisieren-Feldverfuegbarkeit

| Kritisches Feld | Status | sichtbare Signale | Bestes sichtbares Signal |
|---|---|---:|---|
| Vendor Posting Group | not-visible-in-personalize-diagnostics | 0 | kein sichtbares Signal |
| Gen. Bus. Posting Group | not-visible-in-personalize-diagnostics | 0 | kein sichtbares Signal |
| Currency Code | not-visible-in-personalize-diagnostics | 0 | kein sichtbares Signal |
| VAT Bus. Posting Group | not-visible-in-personalize-diagnostics | 0 | kein sichtbares Signal |

## Was der Screenshot beweist

- Der Kartenkontext beweist nur `K30000` / `Zollspedition Nord GmbH` in `RM-DEMO`.
- Ein Personalisieren-Bild beweist nur die sichtbaren Personalisieren-/Feld-Angebote.
- Ein Feld gilt nur dann als Bildbeleg, wenn Caption oder Code im Bild wirklich lesbar sind.

## Buchwirkung

Kapitel 21 und das spaetere Debugging-/Nachweiskapitel sollen Personalisieren als Sichtbarkeitsdiagnose erklaeren: Ein ausgeblendetes Feld kann fuer den Anwender fehlen, obwohl es page-seitig verfuegbar ist. Fuer Buchscreenshots gilt trotzdem: Nur sichtbare Captions/Codes duerfen behauptet werden; eine personalisierte Ansicht muss als solche gekennzeichnet werden.

## Grenzen

- Read-only: keine Kreditoren-, Setup- oder Belegaenderung.
- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Keine API-Abkuerzung; der Befund basiert auf sichtbarer BC-UI.
- Nicht als deutscher USt-, Kontenplan- oder HGB-Finalnachweis verwenden.
- Personalisieren ist Diagnose-/Sichtbarkeitswerkzeug. Eine nutzerpersonalisierte Buchansicht braucht einen eigenen Hinweis im Buch.

## Naechster Schritt

FIXEDASSETS-050-K30000-VENDOR-DEFAULTS-PAGEINSPECTION-OR-SETUP-GATE-DECISION: ohne Buchung entscheiden, ob Page Inspection/manuelle UI-Diagnose oder ein enger UI-first Default-/Setup-Fit der richtige naechste Hebel ist.
