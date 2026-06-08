# FIXEDASSETS-004 Evidence-Index

Status: `labor`, `read-only`, `setup-readiness`, `no-posting`, `no-setup-change`, `not-final`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-004-result.json` | JSON-Ergebnis | strukturierte Readiness fuer Anlage, AfA-Buch, Anlagenbuchungsgruppe, Kreditor, Einkaufsrechnungspfad | keine Anlage und keine Buchung | labor |
| `FIXEDASSETS-004-SETUP-READINESS.md` | Lernzusammenfassung | Anfaengererklaerung und Buchwirkung fuer Kapitel 21 | keinen deutschen Finalnachweis | labor |
| `010-fixed-asset-fa-cnc-01-page-text.txt` | Seitentext | gefilterte Anlagenliste fuer `FA-CNC-01` | keine Anlageanlage | labor-readiness |
| `020-depreciation-book-hgb-page-text.txt` | Seitentext | gefilterte AfA-Buecher fuer `HGB` | keine AfA-Einrichtung | labor-readiness |
| `030-fa-posting-groups-tell-me-page-text.txt` | Seitentext | alternativer Tell-Me-Pfad fuer Anlagenbuchungsgruppen | keine Kontenfindung | labor-readiness |
| `031-fa-posting-groups-result-page-text.txt` | Seitentext | Ergebnis nach Klickversuch auf FA Posting Groups | keinen `MACHINES`-Fit | labor/rejected |
| `040-vendor-k30000-page-text.txt` | Seitentext | gefilterte Kreditorenliste fuer `K30000` | keine Einkaufsrechnung | labor-readiness |
| `050-purchase-invoices-entry-path-page-text.txt` | Seitentext | Einkaufsrechnungspfad als Zugangskandidat | keine Aktivierung | labor-readiness |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | mixed |

## Kernaussage

FIXEDASSETS-005 als idempotenten UI-Setup-Fit nur vorbereiten oder ausfuehren, wenn fehlende Zielobjekte fachlich sicher angelegt werden sollen: zuerst FA-CNC-01 und K30000/Anlagenzugangsvoraussetzung, dann HGB/MACHINES-Kontenfindung, danach erst separater Buchungsfreigabe-Lauf.
