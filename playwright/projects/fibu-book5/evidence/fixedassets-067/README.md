# FIXEDASSETS-067 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-067-result.json` | JSON | Purchase-Invoices-Seite wurde read-only geoeffnet; sichtbare Aktionen wurden inventarisiert, ohne sie zu klicken | keine Zeilentyp-Auswahl, keinen Draft, keine Buchung | `observed`, `read-only`, `no-action-click` |

Aktuelle Wahrheit: Der Lauf liest nur sichtbare Aktionen. Riskante Aktionen wie `New/Neu`, `Delete`, `Post` oder `Preview` duerfen aus dieser Evidence nicht als freigegeben gelten.

Evidence-Hygiene: Das Result speichert bewusst keine vollstaendige Roh-Liste aller sichtbaren UI-Elemente. Es enthaelt Zaehler, Beispiel-Labels und riskante Kandidaten, damit der Nachweis token-sparend nutzbar bleibt.
