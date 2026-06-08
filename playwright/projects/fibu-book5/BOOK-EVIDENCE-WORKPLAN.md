# Buch-vs.-Evidence-Arbeitsplan

Stand: 08.06.2026

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
| Reporting / Financial Reports | GuV nach `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `DEPARTMENT=SALES` | `REPORTING-001` oeffnet Financial Reports read-only; keine Filter-/Summenwirkung | teilweise belegt | Naechster praktischer Block: Report waehlen, maximieren, Dimensionsfilter finden. |
| Sachposten-Dimensionen | Dimensionen nach Buchung in Sachposten zeigen | Artikelposten-Dimension belegt; Sachposten-Dimensionen noch nicht sichtbar belegt | teilweise belegt | Vor Reporting zuerst oder parallel G/L-Entry-Dimensionsnachweis fuer `PS-INV103297` suchen. |
| Tax / VAT / 19 % | Deutsche USt `19 %`, USt-Posten, Brutto `80.920 EUR` | CRONUS-USA zeigt `FURNITURE`, `taxPercent = 0`; kein deutscher VAT-Endstand | offen | Nicht im US-Labor erzwingen; DE-Zielmandant oder explizites VAT-Setup vorbereiten. |
| P2P / Kreditoren | Einkaufsprozess und Kreditorenpostenspur | Keine praktische Evidence | offen | Nach Reporting/Steuer-Entscheidung als erster neuer Prozessblock vorbereiten. |
| Bank / Payments | Ausgleich, Zahlung, Bankposten | Gebuchte Laborrechnung existiert als Ausgangspunkt, Zahlung nicht getestet | offen | Spaeter aus `PS-INV103297` ableiten; keine Zahlung ohne Readiness. |
| Anlagen, Projekte, Service, Manufacturing | Weitere Buchkapitel praktisch lernen | Keine praktische Evidence | offen | Spaeter blockweise starten, nicht vor Kern-Finance/O2C/Reporting. |

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

Das Buch verlangt Financial Reports mit `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `DEPARTMENT=SALES`, Erlos `68.000 EUR`, Wareneinsatz und Drilldown. Aktuelle Evidence belegt nur:

- Seite `Financial Reports` ist erreichbar.
- Financial-Reports-Liste zeigt u. a. `Balance Sheet`, `Income Statement`, `Revenue`.
- Keine sichtbare `PRODUCTLINE`-Filterung.
- Keine Summen- oder Drilldown-Evidence.

Arbeitsauftrag:

1. Reporting als naechsten praktischen Block fuehren.
2. Zuerst passenden Report identifizieren: wahrscheinlich `Income Statement`, `Income Statement Detailed` oder `Revenue`.
3. Ansicht maximieren oder breite Layoutansicht nutzen.
4. Dimensionsfilter suchen und dokumentieren.
5. Erst danach Buchabschnitt zu Financial Reports als praktisch belegt markieren.

## Priorisierter Arbeitsplan

### Phase 1: Reporting vom Einstieg zum echten Nachweis bringen

Ziel:

Financial Reports nicht nur oeffnen, sondern pruefen, ob der O2C-Laborbeleg in einer GuV-/Revenue-Auswertung nach Dimension sichtbar gemacht werden kann.

Naechste Tests:

1. `REPORTING-002`: Financial Reports oeffnen, Teaching Tip gezielt schliessen oder als Lernbild dokumentieren, Fenster/Ansicht maximieren.
2. Bericht `Income Statement`, `Income Statement Detailed` oder `Revenue` auswaehlen.
3. `View Financial Report` oder gleichwertige Aktion oeffnen.
4. Nach Dimension-/Filterfeldern suchen: `Dimension`, `Global Dimension 1`, `PRODUCTLINE`, `CHANNEL`, `Budget Filter`, `Analysis View`.
5. Evidence schreiben:
   - gewaehlter Report
   - sichtbare Filter
   - ob `PRODUCTLINE` direkt filterbar ist
   - ob `PS-INV103297` / `68.000` indirekt sichtbar wird

Akzeptanz:

- Mindestens ein Screenshot der geoeffneten Berichtsauswertung.
- JSON-Evidence trennt `Seite geoeffnet`, `Report geoeffnet`, `Filter gefunden`, `Summenwirkung gefunden`.
- Wenn kein Filter sichtbar ist: Lernfall dokumentieren, welcher BC-Schritt fehlt.

### Phase 2: Sachposten-Dimensionen fuer `PS-INV103297` suchen

Ziel:

Vor dem Reporting-Endnachweis verstehen, ob die Dimensionen auf den Sachposten des gebuchten O2C-Belegs sichtbar oder ueber einen Dialog erreichbar sind.

Naechste Tests:

1. `UAT-O2C-001` nicht erneut buchen.
2. Sachposten zu `PS-INV103297` read-only oeffnen.
3. G/L-Zeilen fuer Erlos, Forderung, Bestand, Wareneinsatz identifizieren.
4. Aktion `Entry` -> `Dimensions` oder vergleichbaren Dimensionsdialog oeffnen.
5. Pruefen, ob `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` auf G/L Entries sichtbar sind.

Akzeptanz:

- Kein neuer Verkaufsauftrag.
- Kein Post.
- Screenshot und Evidence fuer mindestens eine G/L Entry Dimension.
- Wenn Dimensionen dort nicht sichtbar sind: erklaeren, ob nur die Spalten fehlen, der Dialog anders erreichbar ist oder die Dimension nicht auf Sachposten lief.

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

Naechste Arbeit:

1. Separaten DE-VAT-Readiness-Plan erstellen:
   - benoetigte VAT Business Posting Group
   - benoetigte VAT Product Posting Group
   - VAT Posting Setup fuer 19 %
   - Debitor-/Artikelzuordnung
   - erwartete VAT Entries
2. Entscheiden, ob das in einer deutschen Zielcompany oder nur theoretisch im Buch vorbereitet wird.
3. Keine CRONUS-USA-Felder als deutschen Endstand umdeuten.

Akzeptanz:

- USt-Kapitel hat klare Labor-/Final-Trennung.
- O2C-Finalbild wird erst erzeugt, wenn 19-%-Setup wirklich nachgewiesen ist.

### Phase 5: Naechsten Prozessblock vorbereiten

Empfohlene Reihenfolge nach Reporting/Steuer:

1. P2P-Stammdaten:
   - Kreditor `K10000`
   - Einkaufsartikel oder `RM-M100` als Einkaufsszenario
   - Einkaufsbuchungsgruppen
   - Einkaufspreis
   - Lagerort
2. P2P-Preview:
   - Einkaufsbestellung
   - Receive/Invoice-Logik
   - Kreditorenposten, Sachposten, Artikelposten, Wertposten
3. Bank/Payments:
   - erst auf gebuchte Rechnung oder gebuchte Einkaufsrechnung aufsetzen
   - Ausgleich nur mit Readiness
4. Anlagen:
   - erst wenn Finance/Postenspur-Grundlogik stabil ist.

## Sofort naechster sinnvoller Schritt

Der naechste praktische Schritt ist `REPORTING-002`.

Begruendung:

- Er baut direkt auf `REPORTING-001` auf.
- Er nutzt die vorhandene Laborbuchung `PS-INV103297`.
- Er erfuellt einen zentralen Buchanspruch: Dimensionen sollen nicht nur im Beleg, sondern in Auswertungen verstanden werden.
- Er ist read-only und damit risikoarm.

Minimaler Prompt fuer den naechsten Lauf:

```text
Arbeite auf Branch codex/playwright-bc-screenshot-foundation.
Lies CURRENT-STATE.md, LAB-FIT-STATUS.md, BOOK-EVIDENCE-WORKPLAN.md und evidence/reporting-001/010-financial-reports-open-result.json.
Fuehre REPORTING-002 read-only aus: Financial Reports oeffnen, passenden Report auswaehlen, Ansicht maximieren, Dimension-/Filtermoeglichkeiten fuer PRODUCTLINE=MACHINE suchen, Screenshot und kompakte Evidence sichern. Keine Buchung, keine Datenanlage.
```

## Nicht jetzt tun

- Keine weitere O2C-Buchung.
- Keine deutsche 19-%-USt im CRONUS-USA-Labor erzwingen.
- Keine P2P-Buchung starten, bevor Reporting/O2C-Buchdrift und Setup-Fit sauber eingeordnet sind.
- Keine grossen Buchkapitel umschreiben, bevor der naechste praktische Reporting-Befund vorliegt.
