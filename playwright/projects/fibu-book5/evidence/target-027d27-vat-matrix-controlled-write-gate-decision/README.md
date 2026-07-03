# TARGET-027D27 VAT Matrix Controlled Write Gate Decision

Status: `observed-local-decision`.

Dieser Lauf hat Business Central nicht geoeffnet und keine Playwright-Ausfuehrung gestartet. Er verdichtet die vorhandene Universaarl-Evidence und die Microsoft-Learn-Quellenbasis zu einem engen Folgecase fuer die MwSt.-Buchungsmatrix.

## Entscheidung

Der naechste praktische Case darf nur eine kontrollierte Page-472-Schreibroute pruefen:

- Zielseite: `MwSt.-Buchungsmatrix Einr.` / VAT Posting Setup, Page `472`.
- Zielkombination: `INLAND` + `VAT19`.
- Zielwerte: `MwSt. % = 19`, `Berechnungsart = Normale MwSt.`, `Umsatzsteuerkonto = 3806`, `Vorsteuerkonto = 1406`.
- Kein Preview Posting, kein Posting, keine Stammdaten, keine Belege, kein API-Shortcut.

## Grenzen

Diese Entscheidung beweist keine gespeicherte MwSt.-Matrixzeile. `1406` und `3806` sind vorbereitete SKR04-orientierte Starterkonten, aber erst ein spaeterer Reopen-Proof auf Page 472 darf sie als verwendete MwSt.-Konten der Matrix behandeln.

