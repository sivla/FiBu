# Vollständiger Build-Scope aus dem Buch

Diese Datei übersetzt das Buch in einen konkreten Aufbau- und Dokumentationsumfang für Business Central. Sie beantwortet: Was muss im Projekt wirklich erstellt, geprüft, bebildert und im Buch erklärt werden?

## Consultant-Entscheidung

Wir bauen nicht wahllos Screenshots. Wir bauen einen prüfbaren Trainingsmandanten.

Das Buch verlangt drei Ebenen:

1. **Foundation und Setup**: Company, Unternehmensdaten, Konten, Buchungsgruppen, USt, Dimensionen, Nummernserien, Lagerorte, Rollen, Workflows, Change Log.
2. **Rhein-Main-Stammdaten**: Debitoren, Kreditoren, Artikel, Ressourcen, Anlagen, Projekte, Service-/Shop-/Intercompany-Bezüge.
3. **End-to-End-Prozesse**: Verkauf, Einkauf, Lager, Fertigung, Service, Projekte, Bank, Anlagen, USt, Abschluss, Reporting, Admin und Extension-Entscheidungen.

Ohne Ebene 1 und 2 sind die Prozessscreenshots aus Ebene 3 nicht belastbar.

## Aufbauwellen

### Welle 0: Technische Spielwiese

| Objekt | Status | Nachweis |
|---|---|---|
| Login-State | vorhanden | `playwright/.auth/bc-user.json` lokal |
| Company `RM-DEMO` | vorhanden | aus CRONUS kopiert |
| Unternehmensdaten `RM-DEMO` | vorhanden | `FOUNDATION-002` |
| Grundnavigation | vorhanden | Smoke-Test |

Zweck:

- Playwright und BC-UI beherrschen.
- Screenshots und Learnings erzeugen.
- Noch kein vollständiger Rhein-Main-Fachtest.

### Welle 1: Rhein-Main-Mindestdaten in `RM-DEMO`

Diese Welle ist Pflicht vor `UAT-O2C-001`.

| Bereich | Muss erstellt/geprüft werden | Warum |
|---|---|---|
| Dimensionen | `PRODUCTLINE`, `CHANNEL`, `DEPARTMENT`, `LOCATION-GROUP` mit Mindestwerten | O2C, Reporting, Fehlerdiagnose |
| Lagerort | `FRA-ZL` | Verkaufsauftrag und Lagerabgang |
| Debitor | `D10000` | Standardverkauf Maschine |
| Artikel | `RM-M100` | Maschinenverkauf |
| Posting/VAT | passende vorhandene Gruppen oder Rhein-Main-Gruppen | Buchung muss Forderung, Erlös, USt, Bestand, Wareneinsatz erzeugen |
| Standarddimensionen | Debitor/Artikel | Dimensionswerte müssen automatisch oder kontrolliert in Belege laufen |

Ergebnis:

- `UAT-O2C-001` kann als erster echter Buchtest laufen.

### Welle 2: Vollständige Stammdatenwelt aus Kapitel 7

| Bereich | Objekte |
|---|---|
| Debitoren | `D10000`, `D11000`, `D20000`, `D30000`, `D90000` |
| Kreditoren | `K10000`, `K11000`, `K20000`, `K30000`, `K40000` |
| Artikel | `RM-M100`, `RM-X500`, `SP-PUMP-01`, `SP-SENSOR-02`, `RAW-STEEL`, `COMP-CTRL`, `KIT-MAINT` |
| Ressource | `RES-TECH` |
| Anlage | `FA-CNC-01` |
| Projekt | `PROJ-5001` |
| Lagerorte | `FRA-ZL`, `MZ-EINFACH`, `VAN-SERV`, `PROJ-LAG` |

Ergebnis:

- O2C, P2P, Lager, Fertigung, Service, Projekt, Anlagen und Reporting können mit Buchdaten laufen.

### Welle 3: Foundation-Setup vollständig

Aus Kapitel 38 müssen diese Setup-Blöcke geprüft oder eingerichtet werden:

| Reihenfolge | Setup-Block | Ziel |
|---:|---|---|
| 1 | `General Ledger Setup` | Währung, Buchungsdatum, globale Dimensionen |
| 2 | Accounting Periods | Geschäftsjahr und Periodenlogik |
| 3 | Chart of Accounts | Konten und Direktbuchung |
| 4 | G/L Account Categories | Bilanz/GuV-Struktur |
| 5 | General Posting Setup | Erlös, Aufwand, Wareneinsatz |
| 6 | VAT Posting Setup | Inland, EU, Drittland |
| 7 | Customer/Vendor Posting Groups | Forderungen/Verbindlichkeiten |
| 8 | Inventory Posting Setup | Lagerwertkonten |
| 9 | No. Series | Stammdaten- und Belegnummern |
| 10 | Sales & Receivables Setup | Verkaufsprozess |
| 11 | Purchases & Payables Setup | Einkaufsprozess |
| 12 | Inventory Setup | Lagerlogik |
| 13 | Workflows/Approvals | Einkaufs-, Bankdaten-, USt-Kontrollen |
| 14 | Users/Permission Sets/Profiles | Rollen und Berechtigungen |
| 15 | Job Queue Entries | Kostenregulierung, Reports, Schnittstellen |
| 16 | Change Log Setup | kritische Stammdaten und Setupänderungen |

Ergebnis:

- Der Trainingsmandant ist nicht nur klickbar, sondern kontrollierbar.

### Welle 4: Operative Prozessfälle

| Prozess | Primärer Testfall | Vorbedingung |
|---|---|---|
| O2C | `UAT-O2C-001` | Welle 1 |
| Retoure/Gutschrift | `UAT-SALES-RETURN-001` | gebuchte O2C-Rechnung |
| Mahnwesen/OP | `UAT-OP-001` | offene Debitorenposten |
| P2P | `UAT-P2P-001` | Kreditoren, Artikel, Lagerort |
| Lager einfach | `UAT-INV-SIMPLE-001` | `MZ-EINFACH`, Artikel |
| Gesteuertes Lager | `UAT-WHSE-001` | `FRA-ZL`, Bins, Warehouse Setup |
| Inventur | `UAT-INV-COUNT-001` | Bestand vorhanden |
| Planung/MRP | `UAT-PLAN-001` | Artikel, Bedarf, Planungspolitik |
| Montage | `UAT-ASM-001` | `KIT-MAINT`, Komponenten |
| Fertigung | `UAT-MFG-001` | BOM, Routing, Produktionssetup |
| Fremdarbeit | `UAT-SUBCON-001` | Kreditor, Arbeitsgang |
| Service | `UAT-SERVICE-001` | Serviceartikel, Ressource, Ersatzteil |
| Projekt | `UAT-PROJ-001` | Projekt, Ressource, Artikel |
| Bank/Zahlung | `UAT-BANK-001` | Rechnung, Bankkonto |
| Anlagen | `UAT-FA-001` | Anlage, AfA-Buch, Anlagenposting |
| USt Inland/EU/Drittland | `UAT-VAT-001..003` | Debitoren, VAT Setup |
| Abschluss | `UAT-R2R-001` | gebuchte Prozessdaten |
| Reporting | `UAT-REPORT-001` | Dimensionen, Sachposten, Finanzbericht |

### Welle 5: Architektur, Admin und Grenzen

| Bereich | Ziel |
|---|---|
| Fit-Gap | Standard, Prozessdesign, Extension, Custom trennen |
| Security | Rollen, Berechtigungssätze, SoD |
| Migration | Konfigurationspakete, Datenqualität, Freigabe |
| Extensions | Document Capture, Banking, E-Documents, WMS, Rental als Sandbox-UAT |
| Betrieb | Job Queue, Change Log, Monitoring, Hypercare |

Diese Welle wird nicht als erstes gebaut. Sie braucht Prozessdaten und klare Standardgrenzen.

## Vollständige Objektliste

### Companies

| Code | Zweck | Build-Entscheidung |
|---|---|---|
| `RM-DEMO` | erste Trainingscompany | jetzt |
| `RM-PROD` | Produktion | später |
| `RM-SALES` | Vertrieb/Shop | später |
| `RM-SERVICE` | Service/Miete | später |
| `RM-SHARED` | Finance/Einkauf | später |
| `RM-AT` | EU-Ausland/Intercompany | später |

Hinweis:

Bereinigte Modellentscheidung: `RM-AT` ist die Auslandsgesellschaft für EU-/Intercompany-Szenarien. CH bleibt als Drittlandfall auf Debitor-/Kreditorenebene, z. B. `D30000 SwissTech AG`, aber nicht als eigene Company in der ersten Rhein-Main-Company-Struktur.

### Dimensionen

| Dimension | Werte | Build |
|---|---|---|
| `COMPANY-GROUP` | `PROD`, `SALES`, `SERVICE`, `SHARED`, `AT` | Welle 2 |
| `DEPARTMENT` | `SALES`, `PURCH`, `WHSE`, `PROD`, `SERV`, `FIN`, `ADMIN` | Welle 1/2 |
| `CHANNEL` | `B2B`, `SHOP`, `IC`, `SERVICE`, `PROJECT` | Welle 1/2 |
| `PRODUCTLINE` | `MACHINE`, `SPARE`, `RENTAL`, `SERVICE` | Welle 1/2 |
| `LOCATION-GROUP` | `DIRECTED`, `SIMPLE`, `VAN`, `PROJECT`, `DROP` | Welle 1/2 |

### Stammdaten

| Objektgruppe | Mindestobjekte |
|---|---|
| Debitoren | `D10000`, `D11000`, `D20000`, `D30000`, `D90000` |
| Kreditoren | `K10000`, `K11000`, `K20000`, `K30000`, `K40000` |
| Artikel | `RM-M100`, `RM-X500`, `SP-PUMP-01`, `SP-SENSOR-02`, `RAW-STEEL`, `COMP-CTRL`, `KIT-MAINT` |
| Ressourcen | `RES-TECH` |
| Anlagen | `FA-CNC-01` |
| Projekte | `PROJ-5001` |
| Banken | `BANK-RM-01` |
| Benutzer/Rollen | `FIN-LEAD`, `TECH-01`, Vertriebs-, Einkaufs-, Lager-, Finance-Rollen |

### Belege und Bewegungsdaten

| Fall | Beleg/Daten |
|---|---|
| `S-001` | Verkaufsauftrag `SO-1001`: `D10000`, `RM-M100`, Menge `1` |
| `S-002` | Shopauftrag `WEB-24001`: `D11000`, `SP-PUMP-01`, Menge `2` |
| `S-003` | Dropshipping `SO-1003`: `D10000` und `K20000` |
| `P-001` | Einkaufsbestellung `PO-2001`: `RAW-STEEL`, Menge `10` |
| `M-001` | Fertigungsauftrag `PROD-3001`: `RM-M100`, Menge `3` |
| `SV-001` | Serviceauftrag `SERV-4001` |
| `J-001` | Projekt `PROJ-5001` |
| `F-001` | Anlagenzugang `FA-6001` |

## Dokumentationspflicht je Objekt

Jedes angelegte Objekt bekommt:

- Testdaten-Datei im Repo
- Screenshot beim Anlegen oder Prüfen
- fachliche Erklärung im Buch, wenn Leser das Objekt braucht
- Evidence-Hinweis, wenn das Objekt später in Posten/Berichten wirkt
- Fundstelle in `FINDINGS.md`, wenn sichtbare Funktionen unklar sind

## Nächste konkrete Arbeit

1. Vollständige Testdatenkataloge im Repo weiter ausbauen.
2. Standarddimensionen für `D10000` und `RM-M100` prüfen oder setzen.
3. CRONUS-USA-Technikfit von deutschem Ziel-Fit `EUR` / `19 %` trennen.
4. `UAT-O2C-001` als UI-Klickpfad erfassen; endgültige Buchung erst nach Steuer-/Dimensionsentscheidung.
5. Buchtext in Kapitel 6/7/9/11/13 ergänzen: nackige CRONUS-Instanz braucht zuerst Rhein-Main-Mindestdaten, Posting-Fit und fachlichen Steuerfit.
