# FIXEDASSETS-055 Evidence Index

Status: `rejected`, `labor`, `ui-first`, `anti-pattern`, `field-mapping-blocked`, `cleanup-done`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-055-result.json` | JSON | rejected Anti-Pattern: falscher Vendor-Card-Kontext und Cleanup | keine gueltige Anlagenzeile, keine Vorschau, keine Buchung | rejected/cleanup-done |
| `FIXEDASSETS-055-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-NO-POSTING.md` | Markdown | Lernbefund, Buchwirkung, Grenzen, Cleanup und naechster Schritt | keinen Anlagenzugang | rejected |
| `010-purchase-invoices-list-focused-text.txt` | kompakter Seitentext | Purchase-Invoices-Startkontext | keine Zielwerte | compact |
| `020-scoped-new-attempt.json` | JSON | gescopten New/Neu-Versuch | keine Feldvalidierung | labor |
| `030-after-new-focused-text.txt` | kompakter Seitentext | Belegkontext nach New/Neu | keine Buchung | compact |
| `035-header-fill-result.json` | JSON | Kopf-Feldmapping-Versuch und sichtbare Stop-Signale | keine stabile Vendor-Invoice-No.-Eingabe | rejected/partial |
| `036-after-header-focused-text.txt` | kompakter Seitentext | sichtbare Kopfwerte nach Eingabeversuch | keine Vorschau | compact |
| `040-line-field-mapping-attempt.json` | JSON | falscher Zeilen-/Lookup-Versuch | keine Fixed-Asset-Zeile | rejected |
| `050-target-values-visible-signals.json` | JSON | falscher Vendor-Card-Kontext und Zielsignal-Mischung | keine fachliche Buchungswirkung | rejected/diagnostic |
| `050-target-values-focused-text.txt` | kompakter Seitentext | zeigt `Vendor Card - V00040 - FA-CNC-01` als Fehlkontext | keine Anlagenzeile | rejected |
| `060-cleanup-result.json` | JSON | erster unzureichender Cleanup-Versuch | keine vollstaendige Bereinigung | superseded |
| `070-accidental-vendor-cleanup-result.json` | JSON | `V00040` / `FA-CNC-01` per UI bereinigt | keinen Anlagenkauf | cleanup-done |
| `080-accidental-purchase-invoice-cleanup-result.json` | JSON | Einkaufsrechnungsdraft `107222` per UI bereinigt | keine Buchung | cleanup-done |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen der Bilder | keine eigenstaendige Fachwahrheit | rejected/labor |

Aktuelle Wahrheit: `FIXEDASSETS-055` ist kein Field-Mapping-Erfolg. Der Lauf ist ein sauber dokumentierter Anti-Pattern-/Debugging-Fall: Zielcodes wurden sichtbar, aber im falschen Kontext. `107222` und `V00040` wurden danach ueber UI-Cleanup entfernt.

FIXEDASSETS-056-PURCHASE-INVOICE-FIELD-MAPPING-BLOCKER-DIAGNOSIS: vor jedem neuen Mapping einen sicheren Zeilenkontext-Helper bauen und Vendor-Registrierungsdialoge als Stop-Kriterium behandeln.
