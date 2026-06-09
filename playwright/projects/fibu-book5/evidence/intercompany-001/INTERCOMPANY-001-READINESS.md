# INTERCOMPANY-001 Readiness

Status: `labor`, `read-only`, `intercompany-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Buchfall | `IC-7001`, IC-Partner `RM-SALES`, Artikel `RM-M100`, Menge `1`, Preis `42.000 EUR`, EU-/Auslandssicht |
| Relevante Gates | `NEW-COMPANY-001` locked; `TAX-002-DE-VAT-FIT` locked; Intercompany-Prozess als zukuenftiges Gate empfohlen |
| Setup-Aenderung | nein |
| Buchung | nein |
| Company-Wechsel | nein |

## Gepruefte UI-Einstiege

| Tell-Me-Suche | Treffer sichtbar | Screenshot |
|---|---|---|
| Intercompany Setup | ja | intercompany-001-010-intercompany-setup-tell-me.png |
| IC Partners | ja | intercompany-001-020-ic-partners-tell-me.png |
| IC Inbox Transactions | ja | intercompany-001-030-ic-inbox-tell-me.png |
| IC Outbox Transactions | ja | intercompany-001-040-ic-outbox-tell-me.png |
| VAT Entries | ja | intercompany-001-050-vat-entries-tell-me.png |
| Currencies | nein | intercompany-001-060-currencies-tell-me.png |

## Gepruefte Zielobjekte

| Objekt | Sichtbar | Rolle im Buchfall | Screenshot |
|---|---|---|---|
| D20000 | nein | geplanter EU-B2B-Kunde | intercompany-001-070-customer-d20000-eu.png |
| D30000 | nein | geplanter Drittland-/Exportkunde | intercompany-001-080-customer-d30000-export.png |
| D90000 | nein | geplanter Intercompany-Debitor fuer RM-SALES | intercompany-001-090-customer-d90000-ic.png |

## Anfaenger-Lernwert

Intercompany und Ausland sind kein einzelner Verkaufsauftrag. Der Fall braucht mehrere Companies, IC-Partner, korrespondierende Belege, Steuer-/VAT-Logik, Waehrungslogik und Abstimmung. Im aktuellen `RM-DEMO`-Labor wird bewusst nicht in Zielcompanies gewechselt und keine Company angelegt. Wenn IC-/Auslandszielobjekte wie `D20000`, `D30000` oder `D90000` fehlen, ist das ein Setup- und Stammdatenbefund, kein Bedienfehler.

## Was bewiesen ist

- Intercompany-/IC-, VAT-Entries- und Currency-Suchpfade wurden in RM-DEMO read-only gesucht und als Navigationsevidence dokumentiert.
- D20000, D30000 und D90000 wurden als Kapitel-18-Zieldebitoren read-only geprueft; fehlende Sichtbarkeit ist ein Stammdaten-/Setup-Backlog-Befund.
- Kapitel 18 braucht vor einem echten IC-/Auslandprozess einen Mehr-Company-, IC-Partner-, Steuer- und Stammdaten-Fit.
- Die aktuelle RM-DEMO-Company bleibt konsolidiertes Labor; Zielcompanies sind nicht angelegt oder gewechselt.

## Was nicht bewiesen ist

- Kein IC-Beleg IC-7001.
- Keine IC Outbox-Transaktion und keine IC Inbox-Annahme.
- Keine RM-PROD/RM-SALES/RM-AT-Zielcompany als praktischer Prozesskontext.
- Keine EU-/Export-/IC-Steuerlogik, keine VAT Entries und keine deutsche 19-%-USt.
- Keine Verkaufs-/Einkaufsbuchung, keine Debitoren-/Kreditoren-/Sach-/Artikel-/Wertposten.
- Kein Intercompany-Abstimmungsbericht und kein deutscher Finalnachweis.

## Buchwirkung

Kapitel 18 darf den aktuellen Stand nur als Intercompany-/Ausland-Readiness behandeln. Die Schrittfolge `IC-7001` bleibt Zielpfad fuer einen spaeteren Mehr-Company-/UI-first Setup- und Prozesslauf. Deutsche VAT-/EU-/Export-Logik und Intercompany-Abstimmung sind nicht final belegt.

## Naechster Schritt

INTERCOMPANY-002 als Buch-/Evidence-Sync fuer Kapitel 18: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Mehr-Company-/IC-Partner-/Steuer-Setup und IC-7001 UI-first vorbereiten.
