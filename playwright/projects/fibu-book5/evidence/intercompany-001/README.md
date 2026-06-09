# INTERCOMPANY-001 Evidence-Index

Ziel: Kapitel 18 als Intercompany-/Ausland-Readiness read-only pruefen, ohne neue Company, Company-Wechsel, IC-Partneranlage, USt-/Waehrungs-Setup, Beleganlage oder Buchung.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `INTERCOMPANY-001-result.json` | JSON-Ergebnis | Sandbox, Company, Gates, Tell-Me-Einstiege, Zielobjektbefunde, Sicherheitsgrenzen | keinen Intercompany-/Auslandprozess und keine Buchung | labor, read-only |
| `INTERCOMPANY-001-READINESS.md` | Lernzusammenfassung | Warum Kapitel 18 zuerst Companies, IC-Partner, Auslandskunden, VAT/Waehrung und Abstimmung braucht | kein `IC-7001`, keine IC Inbox/Outbox-Wirkung, keine Posten | labor, gate-locked |
| `010-*` bis `060-*` | Tell-Me-Evidence | sichtbare oder verworfene Einstiegspfade fuer Intercompany, VAT Entries und Currencies | keinen geoeffneten Prozessbeleg und keine Einrichtung | navigation-evidence |
| `070-*` bis `090-*` | kompakter Objekt-Seitentext und Buttons | vorhandene oder fehlende Zieldebitoren `D20000`, `D30000`, `D90000` im Labor | keine Anlage und keinen IC-/Ausland-Endstand | object-readiness |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit | mixed |

## Kernaussage

INTERCOMPANY-002 hat Kapitel 18 als Buch-/Evidence-Sync aktualisiert. Danach nur mit ausdruecklichem Gate Mehr-Company-/IC-Partner-/Steuer-Setup und IC-7001 UI-first vorbereiten.
