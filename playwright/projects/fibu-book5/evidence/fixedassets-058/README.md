# FIXEDASSETS-058 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-058-result.json` | JSON | guarded Retry, Guard-Checkpoints, Safety-Status | keine Buchung, keinen Anlagenzugang | `labor`, `guarded-retry`, `no-posting` |
| `FIXEDASSETS-058-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-NO-POSTING.md` | Markdown | Lernbefund, Buchwirkung, naechster Schritt | keinen DE-Finalnachweis | `not-final` |
| `021-after-new-guard.json` | JSON | Guard-Status nach New/Neu | keine Zielwerte | `guard` |
| `035-after-vendor-entry-guard.json` | JSON | Guard-Status nach Vendor-Eingabe, falls der Card-Kontext stabil erreicht wird | keine Zeile, keine Buchung | `optional`, `guard` |
| `090-cleanup-result.json` | JSON | UI-Cleanup-Versuch, falls ein Entwurf entstand | keine Postenspur | `optional`, `cleanup` |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen tatsaechlich erzeugter Bilder | keine eigenstaendige Fachwahrheit | `optional`, `labor` |
| Screenshot-Liste | Ergebnisfeld | Keine Screenshots erzeugt, weil der Guard vor Werteingabe stoppte. | keine visuelle Zeilen-/Buchungs-Evidence | `not-created` |

Aktuelle Wahrheit: Der neue Purchase-Invoice-Kontext wurde nicht stabil erreicht; deshalb wurden keine Zielwerte eingetragen.
