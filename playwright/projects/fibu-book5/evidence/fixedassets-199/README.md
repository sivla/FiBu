# FIXEDASSETS-199 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-199-decision.md` | Markdown | fachliche Entscheidung aus FA-198 und Microsoft-Learn-Abgleich | keine UI-Korrektur, keine Buchung | `local-review` |
| `FIXEDASSETS-199-result.json` | JSON | maschinenlesbare Entscheidung, Grenzen und State-Patch | keine Preview nach Korrektur, keine Postenspur | `observed` |

Aktuelle Wahrheit: FA-198 ist als konkreter Preview-Fehler akzeptiert. Der Fehlerkern ist eine leere `FA Posting Type` auf `Gen. Journal Line ASSETS / DEFAULT / 10000`. FA-199 erlaubt als naechsten Schritt nur die feldnahe Korrektur `FA Posting Type = Acquisition Cost` mit Persistenznachweis. Kein `Preview Posting`, kein `Post`, kein Setup Change.

Quelle: Microsoft Learn, [Acquire fixed assets](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire).
