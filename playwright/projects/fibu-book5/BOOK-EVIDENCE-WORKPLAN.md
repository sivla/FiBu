# Buch-vs.-Evidence-Arbeitsplan

Stand: 09.06.2026

Dieser Arbeitsplan gleicht das Buch `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` gegen den aktuellen Evidence-Stand des Projekts `fibu-book5` ab. Er ist keine neue Wunschliste, sondern die belastbare Reihenfolge fuer die naechsten Playwright-, Evidence- und Bucharbeiten.

## Bewertungslogik

| Status | Bedeutung |
|---|---|
| belegt | Praktisch in Business Central nachgewiesen und mit Evidence/Screenshot dokumentiert. |
| Labor belegt | In `RM-DEMO` / CRONUS USA praktisch belegt, aber nicht als deutscher Finalnachweis verwendbar. |
| teilweise belegt | Voraussetzung oder Einstieg ist belegt, fachliche Wirkung fehlt noch. |
| offen | Im Buch behauptet oder benoetigt, aber noch nicht praktisch nachgewiesen. |
| Buchdrift | Buchtext klingt staerker oder anders als die Evidence. |

## Executive Summary

| Buchbereich | Buchziel | Evidence-Stand | Bewertung | Arbeitsentscheidung |
|---|---|---|---|---|
| Foundation / Stammdaten | Spielwiese, Company, Dimensionen, Lagerort, Debitor, Artikel vorbereiten | `FOUNDATION-*`, `MASTERDATA-001` bis `MASTERDATA-007` | Labor belegt | Behalten; bei deutscher Umgebung neu fotografieren. |
| Inventory Posting Setup | Lagerbuchungsmatrix fuer `FRA-ZL` + `RESALE` pruefen und fitten | `MASTERDATA-008` Diagnose, `MASTERDATA-009` Fit `Inventory Account = 14140` | Labor belegt | Buchstelle aktualisieren, falls sie noch `Kontoentscheidung offen` oder nur Diagnose nennt. |
| O2C `UAT-O2C-001` | Auftrag, Preview, Buchung, Postenspur, Dimensionen, 19 % USt | O2C bis Laborbuchung `PS-INV103297`, Postenspur und Artikelposten-Dimension belegt; Steuer 0 % | Labor belegt, Steuer offen | O2C als CRONUS-Labor stark nutzen; keine zweite Buchung; deutsche USt als separaten Finalblock fuehren. |
| Reporting / Financial Reports | GuV nach `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `DEPARTMENT=SALES` | `REPORTING-001` bis `REPORTING-009` belegen den Einstieg und mehrere Negativpfade: Financial Reports erreichbar, Artikelposten-Dimension belegt, aber keine sichtbare Financial-Reports-Summenwirkung nach `PRODUCTLINE`/`CHANNEL` | teilweise belegt | Keinen gleichen read-only Pfad wiederholen; naechster echter Hebel ist ein freigegebener Analysis-View-Fit oder ein anderer belastbarer Standardpfad. |
| Sachposten-Dimensionen | Dimensionen nach Buchung in Sachposten zeigen | `REPORTING-009` zeigt G/L Entries zu `PS-INV103297` in breiter Ansicht mit `Department Code`/`Customergroup Code`; `PRODUCTLINE`/`CHANNEL` und `Entry` -> `Dimensions` bleiben dort nicht sichtbar | teilweise belegt, Labor-Negativbefund | Im Buch als Unterschied zwischen Shortcut-Spalten, Postendimensionen und Reportingachsen erklaeren; nicht als erledigten Sachposten-Dimensionsnachweis formulieren. |
| Tax / VAT / 19 % | Deutsche USt `19 %`, USt-Posten, Brutto `80.920 EUR` | CRONUS-USA zeigt `FURNITURE`, `taxPercent = 0`; `TAX-001` dokumentiert die Grenze und den DE-VAT-Readiness-Pfad | offen, Readiness dokumentiert | Nicht im US-Labor erzwingen; DE-Zielmandant oder explizit freigegebenes VAT-Setup vorbereiten. |
| P2P / Kreditoren | Einkaufsprozess und Kreditorenpostenspur | CRONUS-USA-Laborprozess `106049` -> `108219` ist gebucht; Kreditorenposten, Sachposten, Wertposten und Artikelposten `793` sind belegt; deutsche Vorsteuer offen | Labor belegt, Steuer offen | Keine zweite P2P-Buchung; P2P als Laborbeleg nutzen und deutsche VAT-/Kontenplan-Grenze offen halten. |
| Bank / Payments | Ausgleich, Zahlung, Bankposten | `PAYMENTS-001` bis `PAYMENTS-010` belegen offene Posten, Cash-Receipt-Draft, `BANK-RM-01`, Journal Check, Apply Entries und Post-Dialog mit Abbruch; keine Zahlung gebucht | Readiness belegt, Buchung offen | `PAYMENTS-011` nur mit ausdruecklicher Freigabe; bis dahin keine Zahlungs- oder Ausgleichsbuchung. |
| Anlagen, Projekte, Service, Manufacturing | Weitere Buchkapitel praktisch lernen | Fixed Assets/Warehouse/Manufacturing/Service/Projects sind als Readiness bzw. Buch-Sync teilweise belegt; Projects ist mit `PROJECTS-001`/`PROJECTS-002` synchronisiert: Einstiege sichtbar, Zielobjekte fehlen | teilweise belegt | Ohne Gate keine Setup-/Buchungslaeufe; naechster sicherer Block ist Kapitel 17 als Dropshipping/Sonderverkauf ohne Shopify-Connector-Scope read-only. |
| Migration / Opening Balances / Cutover | Kapitel 28 als Zielbild, nicht als ungepruefter Import | `MIGRATION-001` synchronisiert Kapitel 28 ohne BC-Lauf; kein Konfigurationspaket, kein Import, keine neue Company und keine Opening-Balance-Buchung | Readiness/Buch-Sync belegt | Praktischer Migrations-/Opening-Balance-Lauf nur mit Gate; `INTEGRATIONS-001` hat den naechsten sicheren Sync inzwischen erledigt. |
| Integrationen | Kapitel 29 als Architektur-/UAT-Zielbild, nicht als technische Abkuerzung | `INTEGRATIONS-001` synchronisiert Kapitel 29 ohne BC-Lauf; keine Extension, kein Connector, kein API-/Web-Service-Setup, kein Power-Platform-/Power-BI-Setup und kein produktiver Datenaustausch | Readiness/Buch-Sync belegt | Praktischer Integrations-/Extension-/Connector-/Power-BI-Lauf nur mit Gate; ohne Gate Kapitel 30 Betrieb/Monitoring als Readiness-Sync. |
| Betrieb / Monitoring / Hypercare | Kapitel 30 als Betriebszielbild, nicht als eingerichtetes Monitoring | `OPERATIONS-001` synchronisiert Kapitel 30 ohne BC-Lauf; keine Job Queue, keine Telemetrie-/Admin-Aenderung, kein Monitoring-Connector und keine Produktivumgebung | Readiness/Buch-Sync belegt | Praktischer Job-Queue-/Monitoring-/Telemetry-/Admin-Lauf nur mit Gate; ohne Gate Kapitel 31 Solution Architect als Readiness-Sync. |
| Solution Architect | Kapitel 31 als Entscheidungsrahmen, nicht als umgesetzte Architekturentscheidung | `SOLUTIONARCHITECT-001` synchronisiert Kapitel 31 ohne BC-Lauf; keine AL-/Extension-Entwicklung, keine AppSource-Installation, kein API-/Connector-/Power-Platform-/Power-BI-Setup, keine Architekturentscheidung und keine Buchung | Readiness/Buch-Sync belegt | Praktische Architekturentscheidung/ADR nur mit Gate; ohne Gate Kapitel 32 UAT-Testbibliothek als Readiness-Sync. |
| UAT-Testbibliothek | Kapitel 32 als UAT-Zielbibliothek, nicht als bestandener Gesamt-UAT | `UAT-001` synchronisiert Kapitel 32 ohne BC-Lauf; vorhandene O2C-, P2P-, Inventory-, Payments- und Reporting-Evidence ist der Master-UAT-Logik zugeordnet; kein Sign-off, keine neue Ausfuehrung und keine Buchung | Readiness/Buch-Sync belegt | Praktische UAT-Ausfuehrung nur mit passendem Prozess-/Setup-/Posting-Gate; `TRAINING-001` ist erledigt, ohne Gate Kapitel 34 MB-800-Kompetenzmatrix als Readiness-Sync. |
| Uebungen und Loesungen | Kapitel 33 als Trainingsbibliothek, nicht als bestandene Schulung | `TRAINING-001` synchronisiert Kapitel 33 ohne BC-Lauf; O2C, P2P und Inventory sind als Labormuster nutzbar; Payments und Reporting bleiben Readiness/Teilbefund; keine neue Ausfuehrung und keine Buchung | Readiness/Buch-Sync belegt | Praktische Uebungslaeufe nur mit passendem Prozess-/Setup-/Posting-Gate; ohne Gate Kapitel 34 MB-800-Kompetenzmatrix als Readiness-Sync. |
| MB-800-Kompetenzmatrix | Kapitel 34 als Lern-/Readiness-Matrix, nicht als bestandene Zertifizierung | `MB800-001` synchronisiert Kapitel 34 ohne BC-Lauf gegen Microsoft Learn und vorhandene Evidence; O2C/P2P/Inventory sind Laborbelege, andere Bereiche Readiness/Teilbefund/Gate | Readiness/Buch-Sync belegt | Kapitel 35 ist mit `LEARNPATH-001` erledigt; praktische Kompetenznachweise nur mit passendem Prozess-/Setup-/Posting-Gate. |
| Microsoft-Learn-Lernpfad-Mapping | Kapitel 35 als Lernlandkarte, nicht als abgeschlossene Learn- oder Zertifizierungsleistung | `LEARNPATH-001` synchronisiert Kapitel 35 ohne BC-Lauf gegen offizielle Microsoft-Learn-Quellen und vorhandene Evidence; O2C/P2P/Inventory sind Laboranker, andere Bereiche Readiness/Teilbefund/Gate | Readiness/Buch-Sync belegt | Ohne Gate Kapitel 36 MB-800-Pruefungstraining als Readiness-Sync; praktische Pruefungs- oder Uebungslaeufe nur mit passendem Prozess-/Setup-/Posting-Gate. |
| MB-800-Pruefungstraining | Kapitel 36 als Pruefungsfallen-Katalog, nicht als bestandener Test | `EXAMTRAINING-001` synchronisiert Kapitel 36 ohne BC-Lauf gegen Kapitel 34/35, Microsoft Learn und vorhandene Evidence; O2C/P2P/Inventory sind Laboranker, Payments/Reporting und Gate-Themen liefern Grenzen und Lernfallen | Readiness/Buch-Sync belegt | Ohne Gate Kapitel 37 Glossar Deutsch/Englisch/Tell-Me als Readiness-Sync; praktische Pruefungs- oder Uebungslaeufe nur mit passendem Prozess-/Setup-/Posting-Gate. |
| Glossar Deutsch/Englisch/Tell-Me | Kapitel 37 als Such- und Begriffsschicht, nicht als neuer Klickpfadnachweis | `GLOSSARY-001` synchronisiert Kapitel 37 ohne BC-Lauf gegen UI-Inventar, Coverage und vorhandene Evidence; Begriffe werden als Buchsprache, Suchhilfe, belegter UI-Pfad oder offener Zielbegriff getrennt | Readiness/Buch-Sync belegt | Ohne Gate Kapitel 38 Seitenindex/Prozesskatalog/Qualitaetssicherung als Readiness-Sync; praktische UI-/Setup-/Buchungslaeufe nur mit passendem Gate. |

## Kritische Buchdrift

### 1. Foundation-Tabelle ist bei O2C und MASTERDATA-008 zu alt

Im Buchabschnitt `Bebilderte Klickanleitungen: aktueller Foundation-Stand` ist `MASTERDATA-008` noch als Diagnose mit `Kontoentscheidung offen` beschrieben. Der aktuelle Evidence-Stand ist weiter:

- `MASTERDATA-009` hat `Inventory Account = 14140` fuer `FRA-ZL` + `RESALE` als CRONUS-Laborfit gesetzt.
- `UAT-O2C-001` hat danach `Preview Posting` mit echten Vorschauzeilen erreicht.
- Genau eine Laborbuchung wurde mit `Ship and Invoice` ausgefuehrt.

Arbeitsauftrag:

1. Buch-Tabelle aktualisieren: `MASTERDATA-009` als eigenen geprueften Labor-Fit aufnehmen.
2. O2C-Status von `Auftrag wird danach bereinigt` trennen:
   - Preview-Auftrag wurde bereinigt.
   - Laborbuchung `S-ORD101068` -> `PS-INV103297` bleibt als Evidence.
3. Weiterhin klar markieren: kein deutscher Kontenplan-Endstand.

### 2. Buchziel O2C ist deutscher Endstand, Evidence ist CRONUS-USA-Labor

Das Buchziel fuer `UAT-O2C-001` nennt:

- `68.000 EUR`
- `19 %` USt
- Brutto `80.920 EUR`
- USt-Posten
- deutsche Buchungsgruppen wie `DE-INLAND`, `VAT19`, `FG-MACHINE`

Evidence zeigt:

- `68.000 EUR` passt.
- `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind im Beleg und am Artikelposten belegt.
- Preview, Buchung und Postenspur funktionieren.
- Tax bleibt `0 %` in CRONUS-USA; kein deutscher USt-Posten.

Arbeitsauftrag:

1. Buchtext konsequent in zwei Ebenen markieren:
   - `CRONUS-Laborlauf`: Bedienpfad, EUR, Posting Preview, Postenspur, Dimensionen.
   - `DE-Finallauf`: 19-%-USt, deutscher Kontenplan, finale Buchbilder.
2. Keine Formulierung stehen lassen, die `PS-INV103297` als deutschen Endstand liest.
3. USt-Kapitel erst nach Zielmandant oder belastbarem VAT-Setup praktisch pruefen.

### 3. Reporting-Kapitel klingt weiter als die Evidence

Das Buch verlangt Financial Reports mit `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `DEPARTMENT=SALES`, Erlos `68.000 EUR`, Wareneinsatz und Drilldown. Aktuelle Evidence belegt:

- Seite `Financial Reports` ist erreichbar.
- Financial-Reports-Liste zeigt u. a. `Balance Sheet`, `Income Statement`, `Revenue`.
- `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten `792` sichtbar.
- `REVENUE` Analysis View nutzt `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`, aber nicht `PRODUCTLINE`/`CHANNEL`.
- `G/L Entries` zu `PS-INV103297` zeigen in breiter Ansicht `Department Code` und `Customergroup Code`, aber nicht `PRODUCTLINE`/`CHANNEL`.
- Keine belastbare Financial-Reports-Summen- oder Drilldown-Evidence nach `PRODUCTLINE`/`CHANNEL`.

Arbeitsauftrag:

1. Reporting nicht als erledigten Buchnachweis formulieren.
2. Die bisherigen read-only Negativpfade in der Buchlogik erklaeren.
3. Naechsten praktischen Reporting-Schritt nur mit Freigabe fuer Analysis-View-Fit oder einen neuen belegbaren Standardpfad starten.
4. Erst danach Buchabschnitt zu Financial Reports als praktisch nach Dimension belegt markieren.

## Priorisierter Arbeitsplan

### Phase 1: Reporting-Read-only-Kette korrekt abschliessen

Ziel:

Financial Reports, G/L Entries und vorhandene Analysepfade nicht laenger staerker darstellen als die Evidence traegt.

Status nach `REPORTING-001` bis `REPORTING-009`:

1. `REPORTING-001`: Financial Reports erreichbar.
2. `REPORTING-002`: Artikelposten `792` zeigt `PRODUCTLINE=MACHINE` und `CHANNEL=B2B`.
3. `REPORTING-003` bis `REPORTING-007`: Financial-Reports-/Analysis-/Dimensionspfade liefern keinen belastbaren Zielnachweis.
4. `REPORTING-008`: Analysis-View-Fit als freigabepflichtiger naechster Hebel dokumentiert.
5. `REPORTING-009`: G/L Entries zeigen nur Shortcut-Spalten, nicht die Ziel-Dimensionen.

Akzeptanz:

- Buch und Arbeitsplan nennen diese Kette als Labor-/Negativbefund.
- Kein weiterer gleicher read-only Reportinglauf wird als naechster Schritt vorgeschlagen.
- Naechster praktischer Reportinglauf braucht einen neuen Hebel.

### Phase 2: Analysis-View-Fit nur mit Freigabe

Ziel:

Pruefen, ob `PRODUCTLINE` und `CHANNEL` als Reportingachsen genutzt werden koennen, ohne die bisherigen Negativpfade zu wiederholen.

Naechster praktischer Test nur nach Freigabe:

1. Idempotenten Labor-Analysis-View-Fit fuer `PRODUCTLINE`/`CHANNEL` vorbereiten.
2. Analysis View aktualisieren.
3. `Analysis by Dimensions` oder gleichwertige Matrix-/Financial-Reports-Sicht pruefen.
4. Keine Zahlenwirkung behaupten, bevor sie sichtbar belegt ist.

Akzeptanz:

- Eigene Freigabe liegt vor.
- Setup-Aenderung ist als CRONUS-USA-Laborfit markiert.
- Kein deutscher Finalnachweis wird behauptet.
- Screenshot/Evidence zeigen entweder echte Dimensionenauswertung oder einen neuen konkreten Blocker.

### Phase 3: Buchdrift im Foundation-/O2C-Abschnitt korrigieren

Ziel:

Das Buch darf den alten O2C-Zustand nicht mehr als aktuellen Stand wiedergeben.

Konkrete Korrekturen:

1. Foundation-Tabelle um `MASTERDATA-009` und `REPORTING-001` ergaenzen.
2. O2C-Zeile aktualisieren:
   - Preview-Lauf wird bereinigt.
   - Laborbuchung bleibt erhalten.
   - Postenspur ist belegt.
   - 19-%-USt bleibt offen.
3. Reporting-Zeile als `gestartet, aber noch nicht FILTER/SUMME belegt` aufnehmen.

Akzeptanz:

- Buchtext behauptet nicht mehr, O2C sei nur bis Kopf/Zeile geprueft.
- Buchtext behauptet nicht, Reporting sei schon nach `PRODUCTLINE` belegt.
- Buchtext bleibt fuer Anfaenger lesbar.

### Phase 4: Deutscher Tax/VAT-Endstand vorbereiten, aber nicht im US-Labor erzwingen

Ziel:

Die Luecke zwischen CRONUS-USA-Sales-Tax und deutschem VAT-Zielmodell beherrschbar machen.

Status nach `TAX-001`:

1. DE-VAT-Readiness ist dokumentiert.
2. Benoetigte Ebenen sind benannt: VAT Business Posting Group, VAT Product Posting Group, VAT Posting Setup, Belegzeile, Preview, VAT Entries.
3. O2C `PS-INV103297` und P2P `108219` bleiben Laborbelege mit `0 %`.
4. Praktischer `19 %`-Ziellauf braucht eigene Setup-/Umgebungsfreigabe.

Akzeptanz:

- USt-Kapitel hat klare Labor-/Final-Trennung.
- O2C-Finalbild wird erst erzeugt, wenn 19-%-Setup wirklich nachgewiesen ist.

### Phase 5: Naechsten Prozessblock vorbereiten

Empfohlene Reihenfolge nach Reporting/Steuer:

1. Payment-Freigabeentscheidung:
   - `PAYMENTS-001` bis `PAYMENTS-010` sind bis Post-Dialog/Abbruch belegt.
   - Echte Zahlung, OP-Ausgleich und Bankposten nur mit ausdruecklicher Freigabe als `PAYMENTS-011`.
2. Reporting-Freigabeentscheidung:
   - Analysis-View-Fit fuer `PRODUCTLINE`/`CHANNEL` nur mit ausdruecklicher Setup-Freigabe.
3. DE-VAT-Freigabeentscheidung:
   - praktischer `19 %`-Ziellauf nur mit Setup-/Umgebungsfreigabe.
4. Anlagen:
   - erst wenn Finance/Postenspur-Grundlogik stabil ist.

## Sofort naechster sinnvoller Schritt

Ohne Gate ist der naechste sichere Schritt `PAGESINDEX-001-READINESS`.

Begruendung:

- `SECURITY-002`, `MIGRATION-001`, `INTEGRATIONS-001`, `OPERATIONS-001`, `SOLUTIONARCHITECT-001` und `UAT-001` sind erledigt.
- Praktische Zahlungen, Reporting-Setup, DE-VAT, Security-Setup, Migration/Import, Opening Balances, Operations-/Monitoring-/Telemetry-/Admin-Aenderungen, neue Companies und Wiederholungsbuchungen bleiben gate-gesperrt.
- Kapitel 33 ist mit `TRAINING-001` als read-only/Buch-Zielbild-Sync erledigt.
- Kapitel 34 ist mit `MB800-001` als read-only/Buch-Zielbild-Sync erledigt.
- Kapitel 35 ist mit `LEARNPATH-001` als read-only/Buch-Zielbild-Sync erledigt.
- Kapitel 36 ist mit `EXAMTRAINING-001` als read-only/Buch-Zielbild-Sync erledigt.
- Kapitel 37 ist mit `GLOSSARY-001` als read-only/Buch-Zielbild-Sync erledigt.
- Kapitel 38 kann als read-only/Buch-Zielbild-Sync vorbereitet werden, ohne neue Buchung, Setup-Aenderung oder neuen Prozesslauf praktisch umzusetzen.

Minimaler Prompt fuer den naechsten Lauf:

```text
Arbeite auf Branch codex/playwright-bc-screenshot-foundation.
Lies AUTOPILOT-STATE.json, POSTING-AND-SETUP-GATES.md, CURRENT-STATE.md, LAB-FIT-STATUS.md, BOOK-CLICK-GUIDE-COVERAGE.md und Kapitel 34.
Fuehre `PAGESINDEX-001-READINESS` als Buch-/Zielbild-Sync durch: Kapitel 38 Seitenindex, Prozesskatalog und Qualitaetssicherung gegen Coverage, UI-Inventar, Screenshot-QA und vorhandene Evidence einordnen, Indexeintraege von praktisch abgedeckten Klickpfaden trennen und keine neue Buchung, keine Setup-Aenderung und keinen neuen Prozesslauf starten.
```

## Nicht jetzt tun

- Keine weitere O2C-Buchung.
- Keine deutsche 19-%-USt im CRONUS-USA-Labor erzwingen.
- Keine P2P-Buchung starten, bevor Reporting/O2C-Buchdrift und Setup-Fit sauber eingeordnet sind.
- Keine grossen Buchkapitel umschreiben, bevor der naechste praktische Reporting-Befund vorliegt.
