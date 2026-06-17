# FIXEDASSETS-043 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-043-result.json` | JSON | strukturierter UI-first FastTab-Sichtbarkeitsbefund fuer K30000 | keine Kaufbeleg-, Zugangs-, AfA- oder Buchungsfreigabe | labor/read-only |
| `010-fasttab-visibility-diagnostics.json` | JSON | FastTab-Klick-/Sichtbarkeitsdiagnose und sichtbare Zielcaptions | keine Tabellen-/Posting-/Tax-Finalitaet | compact |
| `FIXEDASSETS-043-K30000-VENDOR-INVOICING-FASTTAB-VISIBILITY-READONLY.md` | Markdown | Ergebnis, Lernwert, Buchwirkung und Grenze | kein deutscher Finalnachweis | labor/read-only |
| `020-visual-qa.md` | Markdown | welche Screenshots welche sichtbaren Ziele tragen | keine fachliche Wahrheit ohne sichtbaren Code | screenshot-qa |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Limitationen je Bild | keine Rohlogs | compact |

Der K30000-Kreditor wurde read-only geoeffnet; mindestens eine Invoicing-Zielcaption ist in der UI sichtbar. Das ist FastTab-/Sichtbarkeits-Evidence, aber noch keine Kaufbeleg- oder Buchungsfreigabe.

FIXEDASSETS-044-K30000-PURCHASE-INVOICE-GATE-DECISION: Kaufbeleg-Preflight erst als eigener No-/Posting-Gate-Entscheid, weiterhin ohne automatische Buchung.
