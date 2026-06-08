# Buch-zu-Evidence-Audit

Stand: 08.06.2026

Dieser Audit ist die harte Abgleichdatei zwischen Buch, `RM-DEMO`-Laborstand und Evidence. Er ersetzt keine Tests. Er sagt, welche Buchaussagen bereits praktisch tragen, welche nur im CRONUS-USA-Labor gelten und welche noch als offene These behandelt werden muessen.

Update nach O2C-Sync: Die zentralen O2C-Buchstellen wurden auf den Laborstand `S-ORD101068` -> `PS-INV103297` korrigiert. `MASTERDATA-009`, die geloeste Preview-Posting-Blockade, die Laborbuchung und die offene deutsche 19-%-USt sind im Buch jetzt getrennt markiert. Offen bleiben Sachposten-/Reportingdimensionen und der deutsche Finalnachweis.

## Leitentscheidung

`RM-DEMO` bleibt der konsolidierte Lern- und Labor-Mandant in Sandbox `MCP_1_20260210`. Die Ziel-Companies `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED` und `RM-AT` sind Buchziel fuer einen spaeteren Mehr-Company-/Greenfield-Block. Sie werden nicht als naechster Reflex angelegt. Zuerst werden Buchanforderungen, aktuelle Evidence und RM-DEMO-Setup synchronisiert.

## Extrahierte Buchanforderungen

| Anforderung | Buchkapitel | benoetigte Objekte / Werte | Reihenfolge / Abhaengigkeit |
|---|---|---|---|
| Konsolidierter Einstieg `RM-DEMO` | 6, 8 | Company aus CRONUS, Unternehmensdaten, Sprache/URL, Testbenutzer | zuerst, bevor Mehr-Company-Komplexitaet kommt |
| Ziel-Companies | 3, 6 | `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED`, `RM-AT` | spaeterer Mehr-Company-Block, nicht Startpunkt |
| Dimensionen | 7, 10 | `PRODUCTLINE`, `CHANNEL`, `DEPARTMENT`, `LOCATION-GROUP`, spaeter `PROJECT`, `COMPANY-GROUP` | vor O2C/P2P/Reporting |
| Dimensionswerte | 7, 10 | `MACHINE`, `SPARE`, `SERVICE`, `PROJECT`, `RENTAL`, `B2B`, `SHOP`, `SALES`, `DIRECTED` | nach Dimensionen, vor Belegen |
| Debitoren | 7, 11, 19, 22 | `D10000`, `D11000`, `D12000-EU`, `D13000-US`, `D30000` | `D10000` zuerst fuer O2C |
| Kreditoren | 7, 12, 19, 20 | `K10000`, `K11000`, `K20000`, `K30000`, `K40000` | vor P2P und Zahlung |
| Artikel | 7, 11, 12, 13, 23 | `RM-M100`, `SP-PUMP-01`, `RAW-STEEL` | `RM-M100` zuerst; RAW-/SP-Faelle spaeter |
| Ressourcen / Projekte / Anlagen | 7, 15, 16, 21 | `RES-TECH`, `PROJ-5001`, `FA-CNC-01` | spaeter nach Kern-Finance/O2C |
| Lagerorte | 7, 13 | `FRA-ZL`, `MZ-EINFACH`, `VAN-SERV`, `PROJ-LAG` | `FRA-ZL` einfach zuerst; Warehouse spaeter |
| Posting Groups | 9, 11, 12, 13 | Debitoren-, Kreditoren-, General-, Product-, Inventory-Posting-Groups | vor Preview/Buchung |
| USt / Tax | 9, 11, 22 | deutsches `19 %` VAT-Setup, USt-Posten, Steuergruppen | nicht aus CRONUS-USA ableiten |
| Nummernserien | 8, 11, 12, 21 | Verkaufs-, Einkaufs-, Anlagen-, Projektbelege | vor systematischem Greenfield |
| Journale | 19, 20, 21, 24 | Zahlungsjournal, Zahlungsabstimmung, FA Journal, General Journal | nach gebuchten Belegen |
| Reports | 10, 25 | `Financial Reports`, GuV/Bilanz, Dimensionsfilter, Drilldown | nach gebuchten und dimensionierten Posten |
| Evidence Packs | alle Prozesskapitel | Beleg, gebuchter Beleg, Nebenbuchposten, Sachposten, USt-/Tax-Posten, Artikelposten, Wertposten, Reporting | je Prozess nach Preview/Buchung |

## Buchanforderung vs. RM-DEMO-Stand

| Buchanforderung | Buchkapitel | aktueller RM-DEMO-Stand | Evidence vorhanden? | Test vorhanden? | Screenshot vorhanden? | Status | naechster Schritt |
|---|---|---|---|---|---|---|---|
| `RM-DEMO` als konsolidierte Trainingscompany | 6, 8 | Company existiert, CRONUS-USA-basiert | ja, Foundation | ja | ja | done-labor | bei DE-Finalumgebung neu belegen |
| Mehr-Company-Zielstruktur | 3, 6 | nur als Buchmodell, nicht praktisch aufgebaut | nein | nein | nein | later-multicompany | erst nach RM-DEMO-Lernlauf als eigener Block |
| Dimensionen `PRODUCTLINE`, `CHANNEL`, `LOCATION-GROUP`; `DEPARTMENT` wiederverwenden | 7, 10 | angelegt/geprueft | ja, `masterdata-002/003` | ja | ja | done-labor | spaeter globale/Shortcut-Dimensionen in DE pruefen |
| Dimensionswerte `MACHINE`, `B2B`, `SALES`, `DIRECTED` | 7, 10 | angelegt/geprueft | ja | ja | ja | done-labor | weitere Werte fuer P2P/Service/Projekt spaeter |
| Debitor `D10000` | 7, 11 | existiert mit EUR, Adresse, Posting-/Tax-Laborfit | ja | ja | ja | done-labor | Debitor-Setup fuer DE-VAT spaeter |
| Artikel `RM-M100` | 7, 11, 13 | existiert mit Preis/Kosten, `PCS`, `RETAIL`, `RESALE`, `FURNITURE` | ja | ja | ja | done-labor | deutscher Product/VAT/Inventory-Fit offen |
| Lagerort `FRA-ZL` | 7, 13 | einfacher Lagerort existiert | ja | ja | ja | done-labor | Warehouse-Logik spaeter |
| Inventory Posting Setup `FRA-ZL` + `RESALE` | 9, 11, 13 | Laborfit `Inventory Account = 14140` gesetzt | ja, `masterdata-008/009` | ja | ja | done-labor | Buchstelle aktualisieren; kein DE-Kontenplan behaupten |
| O2C Verkaufsauftrag mit `D10000`, `RM-M100`, Menge 1, `FRA-ZL`, `68.000 EUR` | 11 | praktisch belegt | ja | ja | ja | done-labor | nicht erneut buchen |
| O2C deutsche `19 %` USt, Brutto `80.920 EUR` | 9, 11, 22 | nicht erreicht; CRONUS-USA zeigt Tax 0 % | ja als Negativ-/Delta-Evidence | ja | Tax-Spalten-Laborbild | missing-setup | DE-VAT-Readiness planen, nicht erzwingen |
| O2C Preview Posting | 11 | echte Vorschauzeilen erreicht | ja, `060/061` | ja | ja | done-labor | Betragsspalten in G/L-Preview optional verbessern |
| O2C Laborbuchung | 11 | genau einmal `Ship and Invoice`: `S-ORD101068` -> `PS-INV103297` | ja, `080` | ja | ja | done-labor | keine zweite Buchung ohne neuen Readiness-Grund |
| Debitorenposten zu `PS-INV103297` | 11, 19 | sichtbar, Betrag `68.000`, Kunde `D10000` | ja, `082` Trace | ja | ja | done-labor | Zahlungs-/Ausgleichsblock spaeter |
| Sachposten zu `PS-INV103297` | 9, 11, 24 | sichtbar, Konto `14140`, Betragstexte; Dimensionen nicht sichtbar belegt | ja | ja | ja | partial | G/L-Entry-Dimensionsdialog suchen |
| Artikelposten zu `RM-M100` | 11, 13, 23 | direkter Filter leer; ueber Value Entry `Item Ledger Entry No. = 792` gefunden | ja | ja | ja | done-labor | Lernfall im Buch/Inventar halten |
| Wertposten zu `PS-INV103297` | 11, 13, 23 | sichtbar, fuehrt zum Artikelposten | ja | ja | ja | done-labor | Wert-/Kostenlogik spaeter vertiefen |
| Detailed Cust. Ledger Entry | 11, 19 | in Preview/Find Entries als Postenart sichtbar, Detailseite noch nicht einzeln belegt | teilweise | teilweise | teilweise | partial | read-only Detailnachweis spaeter |
| USt-/VAT-Posten | 11, 22 | kein deutscher VAT Entry; CRONUS-Sales-Tax-Labor 0 % | Negativ-Evidence | ja als Delta | nein final | missing-setup | DE-Finalblock |
| `PRODUCTLINE=MACHINE` im Verkaufsauftrag | 10, 11 | Zeilendimensionsdialog zeigt Wert | ja, `050` | ja | ja | done-labor | final DE neu fotografieren |
| `PRODUCTLINE=MACHINE` in gebuchter Verkaufsrechnung | 10, 11 | nicht sichtbar belegt | nein | nein | nein | missing-evidence | Dimensionen auf gebuchter Rechnung suchen |
| `PRODUCTLINE=MACHINE` in Sachposten | 10, 11, 25 | G/L Trace zeigt Wert nicht | ja als Negativbefund | ja | ja | missing-evidence | G/L Entry -> Dimensions pruefen |
| `PRODUCTLINE=MACHINE` in Debitorenposten | 10, 19 | nicht sichtbar belegt | nein | nein | nein | missing-evidence | nur pruefen, falls fachlich sinnvoll |
| `PRODUCTLINE=MACHINE` in Artikelposten | 10, 13, 23 | `Entry` -> `Dimensions` auf Item Ledger Entry `792` zeigt `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` | ja | ja | ja | done-labor | als harter Laborbeweis nutzen |
| `PRODUCTLINE=MACHINE` in Wertposten | 10, 23 | Wertposten sichtbar, Dimension dort nicht belegt | nein | nein | nein | missing-evidence | ggf. Value Entry Dimensions pruefen |
| Financial Reports Seite | 10, 25 | read-only geoeffnet, Liste sichtbar | ja, `reporting-001` | ja | ja | partial | `REPORTING-002`: Report/Filter suchen |
| Financial Reports nach `PRODUCTLINE=MACHINE` | 10, 25 | nicht belegt | nein | nein | nein | missing-evidence | `REPORTING-002/003` |
| P2P-Stammdaten/Kreditoren | 7, 12 | Testdaten teilweise vorhanden, nicht praktisch aufgebaut | nein | nein | nein | not-yet-started | nach Reporting/O2C-Drift |
| Bank/Payments | 19, 20 | gebuchte Laborrechnung als Ausgangspunkt vorhanden, keine Zahlung | nein | nein | nein | not-yet-started | nur mit Payment-Readiness |
| Anlagen/Projekte/Service/Manufacturing | 14-16, 21 | Buchmodell/Testdaten teilweise, keine praktische Evidence | nein | nein | nein | not-yet-started | spaeter blockweise |

## Veraltete oder irrefuehrende Buchstellen

| Datei | Abschnitt | aktueller Text/Kernaussage | Problem | vorgeschlagene Korrektur | benoetigte Evidence |
|---|---|---|---|---|---|
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | `Bebilderte Klickanleitungen: aktueller Foundation-Stand` | `MASTERDATA-008` geprueft als Labor-Diagnose; Kontoentscheidung offen | Der Evidence-Stand war weiter: `MASTERDATA-009` hat `14140` gesetzt und Preview danach bestaetigt | erledigt: `MASTERDATA-009` als eigene Zeile aufgenommen; `MASTERDATA-008` historisch als Diagnose markiert | `evidence/masterdata-009/010-inventory-posting-setup-fit.json`, Screenshot `masterdata-009-*` |
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | gleiche Tabelle, O2C-Zeile | O2C nur Kopf/Zeile, Auftrag wird danach bereinigt | Inzwischen gab es Preview, Laborbuchung und Postenspur; nur Preview-Auftrag wurde bereinigt | erledigt: O2C-Zeile auf Preview, Laborbuchung `PS-INV103297` und offene 19-%-USt aktualisiert | `080-posting-result.json`, `082-posting-entry-trace.json`, `O2C-LAB-FINAL-SYNC.md` |
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | O2C-Zielmodell / Buchungsspur | deutsche USt `19 %`, Brutto `80.920`, USt-Posten als Erwartung | fachlich als Ziel korrekt, aber nicht als RM-DEMO-Laborergebnis belegt | erledigt: Tabelle `Zielbild fuer deutsche Endumgebung` vs. `aktueller CRONUS-USA-Laborstand` ergaenzt | `045-target-vs-labor-delta.*`, `080-posting-result.json`, `O2C-LAB-FINAL-SYNC.md` |
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | Kapitel 10/25 Reporting | Financial Reports nach `PRODUCTLINE`, `CHANNEL`, `DEPARTMENT` filtern | Buchziel ist noch nicht durch Evidence belegt; nur Seite ist geoeffnet | Abschnitt als Ziel-/naechster Nachweis markieren, bis `REPORTING-002` Filter/Summen zeigt | `reporting-001`, spaeter `reporting-002` |
| `playwright/projects/fibu-book5/UI-INVENTORY.md` | `Naechste Inventarziele` | Preview/Postenspur fuer O2C testen | veraltet; Preview, Buchung und Postenspur sind bereits erfolgt | Naechste Inventarziele auf G/L-Dimensionsnachweis und Reporting setzen | `060`, `080`, `082`, `089` Evidence |
| `playwright/projects/fibu-book5/BOOK-CLICK-GUIDE-COVERAGE.md` | abgedeckte Klickanleitungen | Reporting fehlt trotz `REPORTING-001` | Coverage nennt Reporting nur als naechste fehlende Anleitung | Reporting-001 als teilweise gestarteten Laborblock aufnehmen | `reporting-001` Evidence |

## O2C-Synchronisationsbefund

| Pruefpunkt | Ergebnis | Evidence | Buchauswirkung |
|---|---|---|---|
| Verkaufsauftrag | Laborauftrag `S-ORD101068`, vorher Preview-Auftrag `S-ORD101067` | `080-posting-result.json`, `999-cleanup.json` | Buch muss zwischen bereinigtem Preview-Auftrag und gebuchtem Laborbeleg unterscheiden |
| Verkaufszeile | `RM-M100`, Menge `1`, `FRA-ZL`, `68.000 EUR` | `040-zeile-artikel-rm-m100-api-result.json`, Screenshots `040/041` | als Labor belegt |
| Waehrung | `EUR` | `045-target-vs-labor-delta.*`, `080-posting-result.json` | frueherer USD-Befund ist erledigt |
| Steuer | `taxPercent = 0`, `totalTaxAmount = 0` | `045`, `080` | deutsche `19 %` bleibt offen |
| Preview Posting | echte Vorschauarten sichtbar | `060-preview-posting-result.json`, Screenshot `060` | alter Inventory-Fehler geloest |
| Buchung | genau einmal `Ship and Invoice` | `080-posting-result.json`, Screenshot `080` | Laborbuchung belegt, keine zweite Buchung |
| Gebuchte Verkaufsrechnung | `PS-INV103297` | `080`, `082` | O2C-Buchtext muss diese Nummer als Labor-Evidence kennen |
| Debitorenposten | sichtbar | `082-posting-entry-trace.json`, Screenshot `083` | Labor-Postenspur belegt |
| Sachposten | sichtbar | `082`, Screenshot `084` | Dimensionen dort noch offen |
| Artikelposten | ueber Value Entry `Item Ledger Entry No. = 792` sichtbar | `082`, Screenshots `086/088` | Lernfall: direkter Filter nach Order No. reicht nicht |
| Wertposten | sichtbar | `082`, Screenshot `086` | Labor-Postenspur belegt |
| Detailed Cust. Ledger Entries | Preview/Find Entries zeigt Postenart, Detailpruefung fehlt | `060`, `087` | fuer vollstaendige Postenspur spaeter vertiefen |
| VAT/Sales-Tax-Posten | kein deutscher VAT-Nachweis | `045`, `080` | nicht als erledigt markieren |
| Reporting | Financial Reports Seite offen, Filter/Summen offen | `reporting-001` | naechster Block |

Fazit: O2C ist als CRONUS-USA-Laborprozess fachlich weitgehend synchronisiert, aber nicht als deutscher Finalprozess. Keine weitere O2C-Buchung ist aktuell gerechtfertigt. Der Engpass ist nicht mehr der Verkaufsauftrag, sondern Dimensionswirkung in Sachposten/Reporting und deutscher Tax/VAT-Finalnachweis.

## PRODUCTLINE=MACHINE harter Pruefstand

| Wo gesucht | Ergebnis | Screenshot/Evidence | fachliche Bedeutung | Buchauswirkung |
|---|---|---|---|---|
| Standarddimension Artikel `RM-M100` | gefunden, `Same Code` | `masterdata-007`, Screenshot `masterdata-007-default-dimensions-item-rm-m100.png` | Stammdatenvorgabe existiert | Vorbereitung belegt, kein Prozessnachweis allein |
| Verkaufszeile / Dimensionsdialog | gefunden | `050-line-dimension-dialog-result.json`, Screenshot `uat-o2c-001-050-dimension-productline-machine.png` | Dimension kam im konkreten Beleg an | O2C-Belegdimenion als Labor belegt |
| Gebuchte Verkaufsrechnung | nicht belegt | keine | unklar, ob auf gebuchtem Beleg sichtbar erreichbar | Buch nicht behaupten |
| Sachposten | Trace-Seitentext zeigt `PRODUCTLINE` nicht | `082-posting-entry-trace.json`, Screenshot `084` | G/L-Dimensionswirkung offen | naechster Read-only-Check |
| Debitorenposten | nicht belegt | keine | fuer Forderung evtl. nicht wichtigste Reportingebene | nicht behaupten |
| Artikelposten | gefunden ueber `Entry` -> `Dimensions` auf Entry `792` | `089-item-ledger-entry-dimensions-page-text.txt`, Screenshot `089` | Dimension hat mindestens den Artikelposten erreicht | starker Laborbeweis |
| Wertposten | nicht belegt | `086` zeigt Wertposten ohne Dimension | Kosten-/Wert-Reportingdimension offen | spaeter pruefen |
| Financial Reports | Seite offen, `PRODUCTLINE` nicht im Seitentext | `reporting-001` | Reportingfilter/Summenwirkung offen | `REPORTING-002` |

## Prioritaeten

1. `REPORTING-002` read-only: Financial Reports oeffnen, passenden Report auswaehlen, maximieren, Dimensionsfilter suchen.
2. `UAT-O2C-001` read-only erweitern: G/L Entry Dimensions zu `PS-INV103297` suchen, ohne neue Buchung.
3. Buchabschnitt `Bebilderte Klickanleitungen: aktueller Foundation-Stand` aktualisieren: `MASTERDATA-009`, Laborbuchung, Reporting-001.
4. UI-Inventar und Coverage synchronisieren, damit neue Agents nicht alte O2C-Ziele wiederholen.
5. DE-VAT-Readiness separat planen, nicht in CRONUS-USA improvisieren.
6. Erst danach P2P-Stammdaten und Kreditorenprozess starten.

## Naechster sinnvoller Queue-Prompt

```text
Arbeite auf Branch codex/playwright-bc-screenshot-foundation.
Lies CURRENT-STATE.md, BOOK-TO-EVIDENCE-AUDIT.md, LAB-FIT-STATUS.md und evidence/reporting-001/010-financial-reports-open-result.json.
Fuehre genau einen read-only Schritt aus: REPORTING-002 soll Financial Reports oeffnen, den fachlich passendsten Report fuer O2C/GuV auswaehlen, die Ansicht maximieren, Dimensions-/Filterfelder fuer PRODUCTLINE=MACHINE suchen und kompakte Evidence plus Screenshot sichern. Keine Datenanlage, keine Buchung.
```

## Grenzen

- Kein deutscher `19 %`-USt-Endstand in `RM-DEMO`.
- Kein deutscher Kontenplan-Endstand aus Konto `14140` ableiten.
- `RM-DEMO` ist Lern-/Laborcompany, nicht finale deutsche Zielcompany.
- Mehr-Company-Aufbau bleibt spaeterer Block.
- Dieser Audit erzeugt keine neue BC-Evidence; er synchronisiert Buch-, Projekt- und Evidence-Wahrheit.
