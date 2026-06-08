# Evidence-Index UAT-O2C-001

Stand: 08.06.2026

Dieser Ordner dokumentiert den CRONUS-USA-Laborlauf fuer `UAT-O2C-001` nach `MASTERDATA-009`. Der Lauf beweist einen stabilen O2C-Klickpfad bis zur nicht buchenden `Posting Preview`. Er beweist keinen deutschen 19-%-USt-Endstand und keine echte gebuchte Postenspur.

## Laufkontext

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Auftrag | `S-ORD101067` |
| Debitor | `D10000` / Mueller Maschinenbau GmbH |
| Artikel | `RM-M100` / Standardmaschine M100 |
| Menge | `1` |
| Lagerort | `FRA-ZL` |
| Preis | `68.000 EUR` |
| Dimensionen | `PRODUCTLINE=MACHINE` im Zeilendialog, `CHANNEL=B2B` im Auftragskontext |
| Tax/VAT | Labor zeigt `Tax Group Code = FURNITURE`, `taxPercent = 0`; deutsche `19 %` USt offen |
| Posting | keine echte Buchung; nur `Preview Posting` |
| Cleanup | Auftrag `S-ORD101067` wurde nach dem Lauf geloescht |

## Zentrale Preview-Posting-Wahrheit

Nach `MASTERDATA-009` ist der fruehere Blocker `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE` nicht mehr vorhanden. `Preview Posting` oeffnet echte Vorschauzeilen:

| Postenart | Anzahl |
|---|---:|
| `G/L Entry` | 4 |
| `Cust. Ledger Entry` | 1 |
| `Item Ledger Entry` | 1 |
| `Detailed Cust. Ledg. Entry` | 1 |
| `Value Entry` | 1 |

Die Preview-Uebersicht zeigt Postenarten und Anzahl. Der anschliessende Read-only-Drilldown in `G/L Entry` oeffnet `G/L Entries Preview` und zeigt Sachkonten, darunter `14140`, sowie Betraege im Seitentext. Damit ist `14140` nicht mehr nur indirekt ueber `MASTERDATA-009`, sondern auch in der G/L-Preview des O2C-Laufs sichtbar. Visuell zeigt Screenshot `061` vor allem Konten und Beschreibungen; fuer ein finales Betragsbild muss die G/L-Preview noch horizontal auf die Betragsspalten gescrollt werden.

## Evidence-Tabelle

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `030-kopf-debitor-d10000-api-result.json` | API-Zustand | Auftrag `S-ORD101067` wurde fuer `D10000` angelegt; `currencyCode = EUR`; Status `Draft`; Belegdaten und Adresse sind vorhanden. | Zeilenbetrag, Dimension `PRODUCTLINE`, Preview Posting, echte Buchung. | Labor-Evidence |
| `030-kopf-debitor-d10000-page-text.txt` | Roh-Seitentext | UI-Kontext enthaelt Auftragskopf, Debitorname und weitere sichtbare BC-Texte. | Saubere redaktionelle Sichtbarkeit ohne Stoerer; keine finale Screenshot-Freigabe. | Roh-Evidence |
| `uat-o2c-001-030-kopf-debitor-d10000.screenshot.json` | Screenshot-Metadaten | Screenshot `030` ist als `candidate` fuer Auftragskopf/Debitor markiert und nennt erwarteten Seitentext. | Stoererfreie finale deutsche Buchabbildung. | Candidate-Metadaten |
| `040-zeile-artikel-rm-m100-api-result.json` | API-Zustand | Verkaufszeile `RM-M100`, Menge `1`, Lagerort `FRA-ZL`, Preis `68000`, `currencyCode = EUR`, `taxCode = FURNITURE`, `taxPercent = 0`, `Inventory Posting Group = RESALE`, `CHANNEL=B2B` im Auftragskontext. | Deutsche `19 %` USt, `PRODUCTLINE` als Postendimension, gebuchte Posten. | Labor-Evidence |
| `040-zeile-artikel-rm-m100-page-text.txt` | Roh-Seitentext | UI-Kontext enthaelt Zeilenbereich, Artikel, Lagerort, Preise und Summen. | Eindeutige visuelle Sichtbarkeit aller Spalten; Rohtext enthaelt BC-Shell-/Resize-Artefakte. | Roh-Evidence |
| `uat-o2c-001-040-zeile-artikel-rm-m100.screenshot.json` | Screenshot-Metadaten | Screenshot `040` prueft Artikel, Beschreibung, Lagerort und Preis im Seitentext. | Finales Buchbild; Dimension und deutsche USt. | Labor-Metadaten |
| `039-factbox-hidden-result.json` | UI-Zustand | Rechte FactBox wurde fuer breitere Tabellenansicht gezielt eingeklappt. | Fachliche O2C-Werte oder Buchungsergebnis. | Technik-Evidence |
| `041-horizontal-scroll-diagnostics.json` | UI-/Scroll-Diagnose | Horizontaler Grid-Scroll erreicht mittlere Zeilenspalten. | Finaler Buchnachweis oder Steuer-Endstand. | Labor-Diagnose |
| `uat-o2c-001-041-zeile-betraege-steuer.screenshot.json` | Screenshot-Metadaten | Screenshot `041` ist Laborbild fuer Preis-/Tax-Spalten. | Deutsche USt; finale Sichtbarkeit aller O2C-Pflichtfelder. | Labor-Metadaten |
| `042-horizontal-scroll-diagnostics.json` | UI-/Scroll-Diagnose | Weiterer horizontaler Scroll erreicht spaete Spalten. | Fachliche Aussage fuer das Buch. | Kontroll-Evidence |
| `uat-o2c-001-042-zeile-spaete-spalten.screenshot.json` | Screenshot-Metadaten | Screenshot `042` ist als Kontroll-/Scrollbild dokumentiert. | Buchfaehiger Prozessnachweis. | Rejected-Metadaten |
| `045-target-vs-labor-delta.json` | Strukturierter Soll-Ist-Abgleich | Ziel vs. Labor: EUR passt, Netto `68000` passt, `PRODUCTLINE=MACHINE` passt, `taxPercent = 0`, Steuerbetrag `0`, Brutto `68000`. | Deutschen 19-%-Endstand; finale Buchungswirkung. | Laborgrenze |
| `045-target-vs-labor-delta.md` | Markdown-Soll-Ist-Abgleich | Erklaert die Abweichung zwischen Buchziel und CRONUS-Labor fuer Steuer und Brutto. | Dass das Ziel fachlich falsch waere; es markiert nur den Laborfit als unvollstaendig. | Laborgrenze |
| `046-o2c-lab-learning-summary.md` | Lernzusammenfassung | Fasst fuer Anfaenger zusammen: EUR geloest, Steuer offen, Tax Group `FURNITURE`, Dimensionen und Setup-Wirkung. | Finalen deutschen Beleg oder gebuchte Posten. | Labor-Lernnachweis |
| `050-line-actions-page-text.txt` | Roh-Seitentext | Line-Menue/Actions-Kontext wurde erreicht. | Dass Dimensionen schon geoeffnet oder gesetzt sind. | Roh-Evidence |
| `050-line-related-information-page-text.txt` | Roh-Seitentext | `Line` -> `Related Information` wurde erreicht. | Finaler Dimensionsnachweis ohne Dialog. | Roh-Evidence |
| `050-line-dimension-dialog-result.json` | UI-Zustand | Zeilendimensionsdialog wurde geoeffnet; `PRODUCTLINE=MACHINE` wurde gefunden. | Dimension in gebuchten Posten oder Reporting. | Labor-Evidence |
| `050-line-dimension-dialog-page-text.txt` | Roh-Seitentext | Dialogtext enthaelt Dimensionskontext mit `CHANNEL` und `PRODUCTLINE`. | Saubere Posten-/Reportingwirkung. | Roh-Evidence |
| `uat-o2c-001-050-dimension-productline-machine.screenshot.json` | Screenshot-Metadaten | Screenshot `050` ist Candidate fuer Dimensionsdialog der Verkaufszeile. | Deutsche finale Umgebung; gebuchte Dimensionswirkung. | Candidate-Metadaten |
| `060-visible-actions-before-preview.json` | UI-Zustand | Sichtbare Aktionen vor Auswahl von `Preview Posting`. | Dass Preview geoeffnet wurde. | Technik-Evidence |
| `060-after-post-menu-page-text.txt` | Roh-Seitentext | Zustand nach Oeffnen des `Post...`-Menues. | Dass gebucht wurde oder Preview erfolgreich war. | Roh-Evidence |
| `060-visible-actions-after-post-menu.json` | UI-Zustand | `Preview Posting` war im Post-Menue erreichbar. | Inhalt der Preview. | Technik-Evidence |
| `060-preview-posting-result.json` | Strukturierte Preview-Evidence | `openedPreview = true`, `oldInventoryPostingErrorPresent = false`, `openedPostingChoiceDialog = false`, `noPostingCommittedByTest = true`; Vorschauarten und Anzahl sind extrahiert; verweist auf `061-preview-related-entries-gl-entry-result.json`. | Detailbetraege, Konten, `VAT Entry`, echte Buchung. | Labor-Preview-Nachweis |
| `060-preview-posting-page-text.txt` | Roh-Seitentext | Posting Preview enthaelt `G/L Entry`, `Cust. Ledger Entry`, `Item Ledger Entry`, `Detailed Cust. Ledg. Entry`, `Value Entry`; alter Inventory-Fehler fehlt. | Saubere redaktionelle Ausgabe; Rohtext enthaelt BC-Shell-/Resize-/Skriptartefakte. | Roh-Evidence |
| `060-preview-posting-learning.md` | Lernzusammenfassung | Erklaert, dass Preview geoeffnet wurde, kein normaler Buchungsdialog erschien und nicht gebucht wurde. | Deutsche Steuerlogik, Postenbetragsdetails, finale Buchung. | Labor-Lernnachweis |
| `uat-o2c-001-060-buchungsvorschau.screenshot.json` | Screenshot-Metadaten | Screenshot `060` ist `labor`/`evidence` fuer nicht buchende Posting Preview. | Finales deutsches Buchbild, 19-%-USt, Konten-/Betragsdetails. | Labor-Metadaten |
| `061-preview-maximized-page-text.txt` | Roh-Seitentext | Zustand nach Versuch, das Preview-Fenster rechts oben zu maximieren/vergroessern. | Detailposten oder Buchungswirkung allein. | Roh-Evidence |
| `061-preview-related-entries-gl-entry-result.json` | Strukturierte Drilldown-Evidence | Preview wurde maximiert/vergroessert; Klick auf `G/L Entry` oeffnete direkt `G/L Entries Preview`; Konten, Betraege und Konto `14140` sind im Drilldown nachgewiesen; `PRODUCTLINE=MACHINE` ist dort nicht sichtbar; keine Buchung. | Deutsche 19-%-USt, `VAT Entry`, finale Postenspur, visuell vollstaendige Betragsspalten. | Labor-Drilldown-Nachweis |
| `061-preview-related-entries-gl-entry-page-text.txt` | Roh-Seitentext | G/L-Preview enthaelt Konten `14140`, `50110`, `40140`, `15110`, Beschreibungen, Betragswerte und EUR-Quellbetraege. | Saubere visuelle Buchabbildung; Rohtext enthaelt BC-Shell-/Skriptartefakte. | Roh-Evidence |
| `061-preview-related-entries-gl-entry-learning.md` | Lernzusammenfassung | Erklaert den Read-only-Drilldown: maximiert, `G/L Entry` selektiert, Detailkontext geoeffnet, Konten/Betrage/14140 sichtbar, nicht gebucht. | Deutsche Steuerlogik, gebuchte Posten. | Labor-Lernnachweis |
| `uat-o2c-001-061-preview-related-entries-gl-entry.screenshot.json` | Screenshot-Metadaten | Screenshot `061` ist `labor`/`evidence` fuer G/L-Preview-Drilldown. | Finales deutsches Buchbild; Betragsspalten sind im Screenshot noch nicht optimal sichtbar. | Labor-Metadaten |
| `999-cleanup.json` | Cleanup-Evidence | Auftrag `S-ORD101067` fuer `D10000` wurde per API geloescht; Status `204`. | Dass keine anderen Altauftraege existieren; gebuchte Posten, weil nicht gebucht wurde. | Cleanup-Nachweis |
| `uat-o2c-001-010-suche-verkaufsauftraege.screenshot.json` | Screenshot-Metadaten | Such-/Tell-Me-Bild ist als Labor-/Navigationsevidence beschrieben. | Prozessdatensatz `D10000` oder O2C-Werte. | Labor-Metadaten |
| `uat-o2c-001-020-liste-verkaufsauftraege.screenshot.json` | Screenshot-Metadaten | Listenbild ist Navigationsbild. | Nachweis des konkreten Laborauftrags. | Labor-Metadaten |

## Bilddateien

| Screenshot | Status | Buchnutzung |
|---|---|---|
| `../../img/uat-o2c-001-010-suche-verkaufsauftraege.png` | labor | Tell-Me-/Navigationsbild |
| `../../img/uat-o2c-001-020-liste-verkaufsauftraege.png` | labor | Navigationsbild, kein Prozessnachweis |
| `../../img/uat-o2c-001-030-kopf-debitor-d10000.png` | candidate | Auftragskopf/Debitor im Labor |
| `../../img/uat-o2c-001-040-zeile-artikel-rm-m100.png` | labor | Zeilenlaborbild; nicht final |
| `../../img/uat-o2c-001-041-zeile-betraege-steuer.png` | labor | Preis-/Tax-Spalten mit 0-%-Tax |
| `../../img/uat-o2c-001-042-zeile-spaete-spalten.png` | rejected | Scroll-Kontrollbild |
| `../../img/uat-o2c-001-050-dimension-productline-machine.png` | candidate | Zeilendimensionsdialog |
| `../../img/uat-o2c-001-060-buchungsvorschau.png` | labor/evidence | Posting Preview mit Vorschauarten |
| `../../img/uat-o2c-001-061-preview-related-entries-gl-entry.png` | labor/evidence | maximierter Read-only-Drilldown in `G/L Entries Preview` |

## Was jetzt als CRONUS-Labor-Evidence abgedeckt ist

- Der O2C-Klickpfad erreicht Sales Orders, Auftragskopf, Verkaufszeile, Zeilendimensionen und `Preview Posting`.
- `D10000`, `RM-M100`, Menge `1`, Preis `68.000`, Lagerort `FRA-ZL` und Waehrung `EUR` funktionieren im Labor.
- `PRODUCTLINE=MACHINE` ist im Zeilendimensionsdialog nachgewiesen; `CHANNEL=B2B` ist im Auftragskontext nachgewiesen.
- `MASTERDATA-009` hat den Inventory-Posting-Setup-Blocker fuer `FRA-ZL` + `RESALE` im Labor geloest.
- `Preview Posting` zeigt echte Vorschauarten und keine Inventory-Posting-Setup-Fehlermeldung mehr.
- Maximieren rechts oben funktioniert als Screenshot-Strategie fuer die Preview; der Klick auf `G/L Entry` oeffnet direkt `G/L Entries Preview`.
- Die G/L-Preview zeigt Sachkonten `14140`, `50110`, `40140`, `15110` und Betragswerte im Seitentext.
- Der Test hat nicht gebucht und der erzeugte Auftrag wurde bereinigt.

## Was offen bleibt

- Deutscher 19-%-USt-Endstand und Bruttobetrag `80.920 EUR`.
- `VAT Entry` beziehungsweise deutscher USt-Posten.
- Visuell optimale Detailansicht der Preview-Zeilen mit Betragsspalten; Konten sind sichtbar, Betrage derzeit vor allem im Seitentext nachgewiesen.
- `PRODUCTLINE=MACHINE` in Preview-Details, gebuchten Sach-/Wertposten oder Reporting.
- Echte Buchung, Lieferung/Fakturierung und finale Postenspur.
- Finale deutsche Screenshots in deutscher Zielumgebung.

## Naechster konkreter Schritt

Als naechster kleiner Schritt bietet sich ein horizontaler Scroll innerhalb `G/L Entries Preview` an, damit die Betragsspalten auch im Screenshot sichtbar werden. Weiterhin nicht buchen.
