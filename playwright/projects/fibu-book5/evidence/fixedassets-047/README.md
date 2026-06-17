# FIXEDASSETS-047 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-047-result.json` | JSON | strukturierter UI-first Read-only-Befund fuer K30000 Default-Sichtbarkeit/Werte | keine Einkaufsrechnung, keine Setup-Aenderung, keine Buchung | labor/read-only |
| `020-field-value-diagnostics.json` | JSON | Feldsichtbarkeit, gefundene Werte und kompakter Seitentext-Check | keine Tabellen-/API-Wahrheit und keine nicht sichtbaren Werte | compact |
| `010-focused-page-text.txt` | Text | gefilterter Seitentext zu K30000 und Default-Feldern | kein Rohdump und kein finaler Screenshot | compact |
| `FIXEDASSETS-047-K30000-VENDOR-DEFAULTS-VISIBILITY-VALUE-DISCOVERY-READONLY.md` | Markdown | Ergebnis, Lernwert, Buchwirkung und Grenze | kein deutscher Finalnachweis | labor/read-only |
| `020-visual-qa.md` | Markdown | welche Bilder welche sichtbaren Ziele tragen | keine fachliche Wahrheit ohne sichtbaren Code | screenshot-qa |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Limitationen je Bild | keine Rohlogs | compact |

Die K30000-Kreditorenkarte zeigt weiter keinen vollstaendigen sichtbaren Nachweis fuer die kritischen Defaults. Sichtbar kritisch: keine. Weiter offen: Vendor Posting Group, Gen. Bus. Posting Group, Currency Code, VAT Bus. Posting Group. Zahlungs-/Tax-Kontext kann nur fuer sichtbar gefundene Felder genutzt werden.

FIXEDASSETS-048-K30000-VENDOR-DEFAULTS-MANUAL-PERSONALIZE-OR-SETUP-GATE-DECISION: ohne Buchung entscheiden, ob die fehlenden Defaults manuell per Personalisieren sichtbar gemacht oder ein enger UI-first Default-Fit vorbereitet werden darf.
