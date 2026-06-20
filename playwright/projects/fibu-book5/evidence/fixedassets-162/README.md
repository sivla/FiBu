# FIXEDASSETS-162 Evidence Index

Case: `FIXEDASSETS-162-FA-GL-JOURNAL-BALACCOUNT-TYPE-DECISION`

Environment: `MCP_1_20260210`
Company: `RM-DEMO`
Status: `local-decision`, `no-bc-run`, `no-playwright-run`, `no-posting`

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-162-balaccount-type-decision.md` | lokale Entscheidung | FA-161 ist ein fachlicher Gegenkonto-Routenblocker: `K30000` ist Kreditor-/Vendor-Kontext, waehrend FA-161 `Bal. Account Type = G/L Account` zeigt | keinen gueltigen G/L-Gegenkonto-Zielwert, keine Werteingabe, keine Preview, keine Buchung | accepted-labor-decision |
| `FIXEDASSETS-162-result.json` | normalisierbares Result | maschinenlesbarer Abschluss von FA-162 und naechster sicherer Schritt FA-163 | keine neue BC-Evidence, keine Postenspur | accepted-labor-decision |

## Entscheidung

Der Blocker wird als `journal-route-mismatch` plus `target-data-mismatch` klassifiziert, nicht als reiner Playwright-Extractor-Fehler.

`K30000` bleibt ein Kreditor-/Vendor-Ziel fuer die Einkaufsrechnungsroute. Fuer die `Fixed Asset G/L Journals`-Route darf `K30000` nicht blind in eine Zeile mit `Bal. Account Type = G/L Account` geschrieben werden.

## Naechster sicherer Schritt

`FIXEDASSETS-163-FA-GL-JOURNAL-GL-BALACCOUNT-READONLY`: read-only pruefen, welches G/L- oder Bank-Gegenkonto fuer die manuelle FA-G/L-Journalroute fachlich sichtbar und begruendbar waere. Keine Werteingabe, kein Preview Posting, kein `Post`.
