# FIXEDASSETS-247 Calculate Depreciation Execution Gate Plan

Status: `labor`, `local-plan`, `no-bc-run`, `no-playwright-run`, `no-ok`, `not-final`.

## Entscheidung

Ein spaeterer Ausfuehrungslauf darf geplant werden, aber nur als eigener, eng gegateter Fall. `FIXEDASSETS-245` und `FIXEDASSETS-246` beweisen nur die Request Page und den Kontrollpunkt vor `OK`; sie beweisen keine AfA-Berechnung.

## Erlaubter Folgefall

Der naechste praktische Fall ist:

`FIXEDASSETS-248-FA-CALCULATE-DEPRECIATION-GUARDED-EXECUTION`

Dieser Fall darf `Business Central` und `Playwright` oeffnen und im Request-Page-Kontext `OK` bestaetigen, aber nur mit diesen Grenzen:

- Instanz muss `MCP_1_20260210` sein.
- Company muss `RM-DEMO` sein.
- Einstieg nur ueber den bereits belegten Tell-Me-Treffer `Calculate Depreciation`.
- Vor `OK` muessen sichtbare Feldwerte oder mindestens Feldsignale erneut gesichert werden.
- `Document No.` muss eindeutig sein, vorzugsweise mit Praefix `FADEP-`.
- Wenn `Depreciation Book`, `Posting Date` oder `Document No.` nicht kontrollierbar sind, stoppen.
- Nach `OK` darf nur geprueft werden, ob Fixed-Asset-G/L-Journalzeilen erzeugt wurden.
- Kein `Preview Posting`.
- Kein `Post`.
- Keine Journalzeile loeschen, solange nicht ein eigener Cleanup-/Keep-Entscheid dokumentiert ist.

## Erwartete Evidence in FA-248

- Request-Page-Felder vor `OK`
- sichtbarer `OK`-Gate-Nachweis
- eindeutige Dokumentnummer oder dokumentierter Stop
- Nachweis, ob Journalzeilen erzeugt wurden
- Zeilenkontext im `Fixed Asset G/L Journal`, wenn sichtbar
- Keep/Cleanup-Status der erzeugten Zeilen
- Stop-Bedingungen, falls BC einen Dialog, Fehler oder unerwarteten Zielkontext zeigt

## Stop-Bedingungen

- Instanz oder Company passt nicht.
- Der Tell-Me-Treffer ist nicht eindeutig.
- Die Request Page ist nicht eindeutig erkennbar.
- `Document No.` kann nicht eindeutig gesetzt oder gelesen werden.
- `OK` wuerde eine Buchung, Preview oder Post-Aktion ausloesen.
- Nach `OK` ist nicht klar, ob Journalzeilen erzeugt wurden.
- Ein Dialog verlangt `Post`, `Preview`, `Yes/Ja` fuer riskante Folgeaktionen oder Setup-Aenderungen.

## Buchwirkung

Das Buch darf nach FA-247 nur sagen: Der Request-Page-Kontrollpunkt ist belegbar und ein separater Ausfuehrungslauf ist fachlich sinnvoll. Noch nicht sagen: AfA wurde berechnet, Journalzeilen existieren, Preview Posting funktioniert oder Postenspur ist vorhanden.

