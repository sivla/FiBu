# FIXEDASSETS-041 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-041-result.json` | JSON | strukturierter read-only UI-Diagnosebefund zur K30000-Kreditorenkarte | keine Einkaufsrechnung, keine Buchung, keine deutsche Final-Evidence | labor/read-only |
| `FIXEDASSETS-041-K30000-VENDOR-DEFAULTS-FIELD-DIAGNOSIS-READONLY.md` | Markdown | Lernwert, Feld-Diagnose, Grenzen und Buchwirkung | kein Setup-Fit und keine Belegfreigabe | labor/read-only |
| `010-k30000-vendor-defaults-diagnosis-page-text.txt` | kompakter Seitentext | sichtbare UI-Texte zu K30000 und relevanten Default-Feldern | keine Rohseite und keine API-Wahrheit | compact |
| `020-k30000-vendor-defaults-field-diagnostics.json` | JSON | aktive Kartenfeld-/Label-Diagnose fuer Posting, Currency, Tax/VAT und Zahlungsfelder | keine finale Tabellenlogik | compact |
| `fixedassets-041-010-k30000-vendor-card-top-diagnosis.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des oberen Kartenbilds | keine eigenstaendige fachliche Wahrheit | labor |
| `fixedassets-041-020-k30000-vendor-card-mid-diagnosis.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des gescrollten Kartenbilds | keine eigenstaendige fachliche Wahrheit | candidate/limited |
| `030-visual-qa.md` | Markdown | Bildqualitaet: Payment-Werte sichtbar, kritische Defaults nicht sichtbar | keine finale Buchbildfreigabe | labor/candidate |

Die K30000-Kreditorenkarte wurde read-only in breiter Layoutansicht diagnostiziert. Die kritischen Posting-/Currency-/Tax-Defaults sind weiterhin nicht vollstaendig als sichtbare aktive Kartenfelder belegt; vor einem Kaufbeleg bleibt ein enger Sichtbarkeits- oder Setup-Diagnosepunkt offen.

FIXEDASSETS-042-K30000-VENDOR-DEFAULTS-VISIBILITY-DECISION: decide whether the remaining missing defaults require guided Personalize/Page Inspection or a narrow setup/field-fit gate before purchase invoice.
