# FIXEDASSETS-039 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-039-result.json` | JSON | strukturierter read-only Befund zur `K30000`-Kreditorenkarte | keine Einkaufsrechnung und keine Buchung | labor/read-only |
| `FIXEDASSETS-039-K30000-VENDOR-CARD-DEFAULTS-READONLY.md` | Markdown | Lernwert, sichtbare Defaults, Grenzen und Buchwirkung | keinen deutschen Finalnachweis | labor/read-only |
| `010-k30000-vendor-card-defaults-page-text.txt` | kompakter Seitentext | sichtbare Karten-/Default-Texte | keine Rohseite | compact |
| `010-k30000-vendor-card-defaults-signals.json` | JSON | extrahierte sichtbare Feldsignale | keine API-Wahrheit | compact |
| `011-show-more-clicks.json` | JSON | ob `Show more`/`Mehr anzeigen` read-only genutzt wurde | keine Feldwerte allein | compact |
| `020-k30000-vendor-card-lower-defaults-signals.json` | JSON | sichtbare Signale nach Scroll in Zahlungs-/Invoicing-Bereich | keine vollstaendige Kartenextraktion | compact |
| `fixedassets-039-010-k30000-vendor-card-defaults.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Kartenbilds | keine eigenstaendige fachliche Wahrheit | labor |
| `fixedassets-039-020-k30000-vendor-card-payments-defaults.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des unteren Kartenbilds | keine eigenstaendige fachliche Wahrheit | candidate |

Aktuelle Wahrheit: Die K30000-Kreditorenkarte ist read-only erreichbar und zeigt Zielnummer sowie Zielname. Sichtbar belegt sind `Payment Terms Code = 1M(8D)` und `Payment Method Code = BANK`; nicht sichtbar belegt sind Vendor Posting Group, Gen. Bus. Posting Group, Currency Code und Tax/VAT-Kontext. Das bleibt vor einer Einkaufsrechnung eine Kontrollluecke.

FIXEDASSETS-040-K30000-VENDOR-DEFAULTS-DECISION: decide whether missing/non-visible defaults require Personalisieren/Page Inspection/read-only field diagnosis or a narrow setup-fit gate before any purchase invoice.
