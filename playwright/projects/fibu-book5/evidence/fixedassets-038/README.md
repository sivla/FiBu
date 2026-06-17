# FIXEDASSETS-038 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-038-result.json` | JSON | Ergebnis des UI-first `K30000` Vendor-Setup-Fits, Auto-Number-Lernfall und Cleanup | keine Einkaufsrechnung und keine Buchung | labor / setup-proof |
| `FIXEDASSETS-038-K30000-VENDOR-SETUP-FIT.md` | Markdown | Lernwert, Grenzen und naechster Schritt | keinen deutschen Finalnachweis | labor / setup-proof |
| `010-before-vendors-k30000-page-text.txt` | kompakter Seitentext | Vorher-Kontext der Vendor-Suche | keine Rohseite | compact |
| `010-before-vendors-k30000-signals.json` | JSON | sichtbare Vorher-Signale | keine API-Wahrheit | compact |
| `020-scoped-new-attempt.json` | JSON | ob `New/Neu` im Vendor-Kontext sicher geklickt wurde | keinen gespeicherten Kreditor | conditional |
| `022-template-dialog-attempt.json` | JSON | Template-/OK-Dialog-Behandlung | keine fachliche Defaultfreigabe | conditional |
| `030-vendor-card-fill-attempt.json` | JSON | sichtbare Kartenfeld-Befuellung oder Blocker | keinen Kaufbeleg | conditional |
| `040-after-vendors-k30000-page-text.txt` | kompakter Seitentext | Nachher-Kontext zu `K30000` | keine Postenspur | compact |
| `040-after-vendors-k30000-signals.json` | JSON | sichtbare Nachher-Signale | keine vollstaendige Tabellenextraktion | compact |
| `090-cleanup-V00020-before-page-text.txt` | kompakter Seitentext | Cleanup-Kontext fuer versehentlichen Auto-Number-Draft, falls sichtbar | kein Buchbild | conditional-cleanup |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen der Bilder | keine eigenstaendige fachliche Wahrheit | candidate/labor/rejected |

Aktuelle Wahrheit: `K30000` ist in `RM-DEMO` als Labor-Kreditor sichtbar. Der erste erfolgreiche UI-first Lauf hat einen von Business Central automatisch vergebenen Kreditorenentwurf `V00030` auf `K30000` / `Zollspedition Nord GmbH` umgesetzt. Ein frueher versehentlich entstandener Draft `V00020` wurde danach ueber die UI geloescht und im leeren Nachfilter bestaetigt. Es gab keine Einkaufsrechnung, keinen Anlagenzugang, keine AfA und keine Buchung.

FIXEDASSETS-039-K30000-VENDOR-CARD-DEFAULTS-READONLY: `K30000`-Kreditorenkarte read-only oeffnen und Vendor Posting Group, Gen. Bus. Posting Group, Payment Terms Code, Currency Code, Tax/VAT-Kontext und Blocked-Status sichtbar dokumentieren; noch keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.
