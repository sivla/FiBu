# FIXEDASSETS-046 - K30000 Vendor Defaults Gate Decision

Status: `done-decision-no-bc-run`, `labor`, `ui-first`, `no-posting`, `purchase-invoice-locked`.

Dieser Evidence-Ordner dokumentiert die Gate-Entscheidung nach `FIXEDASSETS-045`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-046-K30000-VENDOR-DEFAULTS-GATE-DECISION.md` | Decision Evidence | Warum nach `FIXEDASSETS-045` kein Setup-/Default-Fit und kein Kaufbeleg freigegeben wird | Keine neuen BC-UI-Bilder, keine Feldwerte, keine Einkaufsrechnung | done |
| `FIXEDASSETS-046-result.json` | maschinenlesbares Ergebnis | Gate-Status, erlaubter naechster Schritt, verbotene Aktionen, offene Defaults | Keine technische Page-Inspection-Evidence, keine Buchung | done |

## Entscheidung

`FIXEDASSETS-045` zeigt nur den Diagnoseeinstieg `Personalisieren` und den weiterhin sichtbaren Teilzustand der `K30000`-Kreditorenkarte. Die kritischen Felder `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code` und `VAT Bus. Posting Group` sind nicht sichtbar belegt.

Deshalb wird kein no-posting Setup-/Default-Fit freigegeben. Der naechste erlaubte Schritt ist enger: UI-first und read-only die Sichtbarkeit und moeglichen Lookup-/Default-Werte klaeren. Werte duerfen erst gesetzt werden, wenn sie sichtbar aus der UI ableitbar und durch ein neues Gate freigegeben sind.

## Grenze

Kein Kaufbeleg, kein Anlagenzugang, keine AfA, keine Buchung, keine Kreditoren- oder Setup-Aenderung, kein API-Shortcut und kein deutscher Finalnachweis.
