# Evidence-Index UAT-O2C-001

Stand: 08.06.2026

Dieser Ordner dokumentiert den CRONUS-USA-Laborlauf fuer `UAT-O2C-001` nach `MASTERDATA-009`. Der Lauf beweist einen stabilen O2C-Klickpfad bis zur nicht buchenden `Posting Preview`. Er beweist keinen deutschen 19-%-USt-Endstand und keine echte gebuchte Postenspur.

## Laufkontext

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Auftrag | `S-ORD101064` |
| Debitor | `D10000` / Mueller Maschinenbau GmbH |
| Artikel | `RM-M100` / Standardmaschine M100 |
| Menge | `1` |
| Lagerort | `FRA-ZL` |
| Preis | `68.000 EUR` |
| Dimensionen | `PRODUCTLINE=MACHINE` im Zeilendialog, `CHANNEL=B2B` im Auftragskontext |
| Tax/VAT | Labor zeigt `Tax Group Code = FURNITURE`, `taxPercent = 0`; deutsche `19 %` USt offen |
| Posting | keine echte Buchung; nur `Preview Posting` |
| Cleanup | Auftrag `S-ORD101064` wurde nach dem Lauf geloescht |

## Zentrale Preview-Posting-Wahrheit

Nach `MASTERDATA-009` ist der fruehere Blocker `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE` nicht mehr vorhanden. `Preview Posting` oeffnet echte Vorschauzeilen:

| Postenart | Anzahl |
|---|---:|
| `G/L Entry` | 4 |
| `Cust. Ledger Entry` | 1 |
| `Item Ledger Entry` | 1 |
| `Detailed Cust. Ledg. Entry` | 1 |
| `Value Entry` | 1 |

Die Preview-Uebersicht zeigt Postenarten und Anzahl. Sie zeigt in diesem Screenshot keine Detailbetraege, keine Sachkontonummern und kein direkt sichtbares `Inventory Account = 14140`. Das Konto `14140` ist fuer diesen O2C-Lauf indirekt relevant: `MASTERDATA-009` weist es in `Inventory Posting Setup` nach, und der nachfolgende Preview-Lauf zeigt, dass der alte Inventory-Posting-Setup-Fehler nicht mehr auftritt.

## Evidence-Tabelle

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `030-kopf-debitor-d10000-api-result.json` | API-Zustand | Auftrag `S-ORD101064` wurde fuer `D10000` angelegt; `currencyCode = EUR`; Status `Draft`; Belegdaten und Adresse sind vorhanden. | Zeilenbetrag, Dimension `PRODUCTLINE`, Preview Posting, echte Buchung. | Labor-Evidence |
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
| `060-preview-posting-result.json` | Strukturierte Preview-Evidence | `openedPreview = true`, `oldInventoryPostingErrorPresent = false`, `openedPostingChoiceDialog = false`, `noPostingCommittedByTest = true`; Vorschauarten und Anzahl sind extrahiert. | Detailbetraege, Konten, `VAT Entry`, direkte Sichtbarkeit von `Inventory Account = 14140`, echte Buchung. | Labor-Preview-Nachweis |
| `060-preview-posting-page-text.txt` | Roh-Seitentext | Posting Preview enthaelt `G/L Entry`, `Cust. Ledger Entry`, `Item Ledger Entry`, `Detailed Cust. Ledg. Entry`, `Value Entry`; alter Inventory-Fehler fehlt. | Saubere redaktionelle Ausgabe; Rohtext enthaelt BC-Shell-/Resize-/Skriptartefakte. | Roh-Evidence |
| `060-preview-posting-learning.md` | Lernzusammenfassung | Erklaert, dass Preview geoeffnet wurde, kein normaler Buchungsdialog erschien und nicht gebucht wurde. | Deutsche Steuerlogik, Postenbetragsdetails, finale Buchung. | Labor-Lernnachweis |
| `uat-o2c-001-060-buchungsvorschau.screenshot.json` | Screenshot-Metadaten | Screenshot `060` ist `labor`/`evidence` fuer nicht buchende Posting Preview. | Finales deutsches Buchbild, 19-%-USt, Konten-/Betragsdetails. | Labor-Metadaten |
| `999-cleanup.json` | Cleanup-Evidence | Auftrag `S-ORD101064` fuer `D10000` wurde per API geloescht; Status `204`. | Dass keine anderen Altauftraege existieren; gebuchte Posten, weil nicht gebucht wurde. | Cleanup-Nachweis |
| `uat-o2c-001-010-suche-verkaufsauftraege.screenshot.json` | Screenshot-Metadaten | Such-/Tell-Me-Bild ist als Labor-/Navigationsevidence beschrieben. | Prozessdatensatz `D10000` oder O2C-Werte. | Labor-Metadaten |
| `uat-o2c-001-020-liste-verkaufsauftraege.screenshot.json` | Screenshot-Metadaten | Listenbild ist Navigationsbild. | Nachweis des konkreten Auftrags `S-ORD101064`. | Labor-Metadaten |

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

## Was jetzt als CRONUS-Labor-Evidence abgedeckt ist

- Der O2C-Klickpfad erreicht Sales Orders, Auftragskopf, Verkaufszeile, Zeilendimensionen und `Preview Posting`.
- `D10000`, `RM-M100`, Menge `1`, Preis `68.000`, Lagerort `FRA-ZL` und Waehrung `EUR` funktionieren im Labor.
- `PRODUCTLINE=MACHINE` ist im Zeilendimensionsdialog nachgewiesen; `CHANNEL=B2B` ist im Auftragskontext nachgewiesen.
- `MASTERDATA-009` hat den Inventory-Posting-Setup-Blocker fuer `FRA-ZL` + `RESALE` im Labor geloest.
- `Preview Posting` zeigt echte Vorschauarten und keine Inventory-Posting-Setup-Fehlermeldung mehr.
- Der Test hat nicht gebucht und der erzeugte Auftrag wurde bereinigt.

## Was offen bleibt

- Deutscher 19-%-USt-Endstand und Bruttobetrag `80.920 EUR`.
- `VAT Entry` beziehungsweise deutscher USt-Posten.
- Detailansicht der Preview-Zeilen mit Betraegen, Konten und Dimensionen.
- Direkter Preview-Nachweis fuer Konto `14140`; bisher ist `14140` ueber `MASTERDATA-009` und das Verschwinden des Fehlers indirekt relevant.
- `PRODUCTLINE=MACHINE` in gebuchten Sach-/Wertposten oder Reporting.
- Echte Buchung, Lieferung/Fakturierung und finale Postenspur.
- Finale deutsche Screenshots in deutscher Zielumgebung.

## Naechster konkreter Schritt

Als naechster kleiner Schritt bietet sich ein Read-only-Drilldown in der `Posting Preview` an: `Show Related Entries` beziehungsweise eine einzelne Vorschauart oeffnen und pruefen, ob Betrage, Konten und Dimensionen sichtbar werden. Weiterhin nicht buchen.
