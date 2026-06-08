# Screenshot-QA fuer Buch 5

Diese Datei bewertet, ob erzeugte Business-Central-Screenshots bereits als Buchbilder taugen oder nur Labor-/Evidence-Material sind.

## Bewertungsregel

Ein Screenshot ist erst buchfaehig, wenn er:

1. den fachlich richtigen Datensatz zeigt
2. die im Buch behaupteten Felder sichtbar macht
3. keine irrefuehrenden CRONUS- oder Altdaten als Prozessnachweis zeigt
4. Stoerer wie Popover, Touren, Resize-Hinweise oder Copilot-Karten bewusst enthaelt oder gezielt entfernt
5. Sprache, Company, Waehrung, Steuerlogik und Testdaten zum erklaerten Ziel passen
6. durch Evidence ergaenzt wird, die denselben Zustand prueft

Laborbilder duerfen abweichen. Dann muessen Abweichung, Ursache und Buchwirkung dokumentiert sein.

Zu jedem automatisiert erzeugten O2C-Screenshot schreibt der Screenshot-Helper eine Metadatendatei unter `evidence/<testfall>/...screenshot.json`. Diese Datei enthaelt Status, Buchnutzung, Zweck, erwartete Werte im BC-Seitentext und bekannte Grenzen. Die PNG-Datei allein ist deshalb nicht mehr die ganze Wahrheit.

Fuer `UAT-O2C-001` fasst `playwright/projects/fibu-book5/evidence/uat-o2c-001/README.md` die Screenshot-Metadaten, Rohtexte, API-Nachweise, Preview-Evidence und Cleanup-Evidence zusammen. Vor Buchverwendung zuerst diesen Index lesen.

## `MASTERDATA-007` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-item-rm-m100.png` | guter Labor-Kandidat | Page `540` zeigt `Default Dimensions` mit `PRODUCTLINE`, `MACHINE` und `Same Code`. Die Teaching-Tip-Karte `About default dimensions` wurde gezielt geschlossen. | Als Buchkandidat fuer Standarddimensionen geeignet; final in deutscher Umgebung neu erzeugen. |
| `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-customer-d10000.png` | guter Labor-Kandidat | Page `540` zeigt `CHANNEL`, `B2B`, `Business-to-Business` und `Same Code`. Parent `D10000` ist ueber Filter/Test/Evidence belegt, aber nicht im sichtbaren Seitentext. | Als Laborbild geeignet; Buchtext muss erklaeren, dass Page 540 auf den Debitorenkontext gefiltert wurde. |
| `playwright/projects/fibu-book5/img/masterdata-dimensions-010-book-standard-dimensions.png` | Labor-Kandidat mit Grenze | Dimensionsliste zeigt zentrale RM-DEMO-Dimensionen wie `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP`. | Als Uebersichtsbild fuer den O2C-Kern geeignet. Nicht als Nachweis fuer alle Buchstandard-Werte nutzen; fehlende Werte stehen in `evidence/masterdata-dimensions/011-dimension-foundation-summary.md`. |

## `MASTERDATA-008` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/masterdata-008-inventory-posting-setup-fra-zl-resale.png` | gutes Fehler-/Lernbild | Breite Listenansicht zeigt `Inventory Posting Setup` mit gefilterter Zielzeile `FRA-ZL` + `RESALE`. Die Spalten `Inventory Account` und `Inventory Account (Interim)` sind sichtbar und leer. | Als Laborbild fuer den O2C-Blocker geeignet. Nicht als finaler Setup-Endstand verwenden, weil noch keine fachliche Kontenentscheidung getroffen wurde. |

## `MASTERDATA-009` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/masterdata-009-inventory-posting-setup-fra-zl-resale-14140.png` | guter Labor-Fit-Nachweis | Gefilterte Zielzeile `FRA-ZL` + `RESALE` zeigt jetzt `Inventory Account = 14140`. Das Konto wurde aus vorhandenen CRONUS-RESALE-Zeilen abgeleitet. | Als Laborbild fuer den geschlossenen Inventory-Posting-Setup-Blocker geeignet. Nicht als deutscher Kontenplan-Endstand verwenden; O2C-Preview muss danach separat neu erzeugt werden. |

## `UAT-O2C-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/uat-o2c-001-010-suche-verkaufsauftraege.png` | brauchbares Laborbild | Tell-Me zeigt `Sales Orders`, richtige Treffergruppe und mehrere aehnliche Treffer. Das ist didaktisch gut, weil es die Gefahr falscher Suchtreffer sichtbar macht. | Als Labor-/Toolbild behalten. Final mit deutschem Suchbegriff `Verkaufsauftraege` neu erzeugen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png` | nicht als O2C-Prozessnachweis geeignet | Liste zeigt vorhandene CRONUS-Auftraege und markiert `10000`/Adatum, nicht `D10000`. | Nur als Navigationsbild verwenden. Fuer Prozessnachweis nach Anlage auf den erzeugten Auftrag filtern oder direkt die Karte zeigen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png` | gutes Laborbild mit Stoerern | Auftragsnummer, `Mueller Maschinenbau GmbH`, Status, Datum und FactBox mit `Customer No. D10000` sind sichtbar. Stoerer: Document-Check-Leiste und Copilot-Zusammenfassung. | Als Laborbild geeignet. Fuer finales Buchbild Stoerer gezielt schliessen oder im Text als Anfaengerbefund erklaeren. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-030-neuer-verkaufsauftrag.png` | entfernt | Datei war identisch zum Kopf-Screenshot nach Debitoranlage. Sie zeigte keinen leeren neuen Auftrag. | Aus dem Lauf entfernt; der Test erzeugt nur noch `030-kopf-debitor-d10000`. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-040-zeile-artikel-rm-m100.png` | guter Labor-Kandidat | Die FactBox ist gezielt eingeklappt. Sichtbar sind `Item`, `RM-M100`, Beschreibung, `FRA-ZL`, Menge `1`, EUR-Summen und `Total Tax (EUR) = 0,00`. | Als Laborbild fuer Zeile, Menge, Lagerort und EUR-Summen geeignet. Nicht final, weil 0-%-Tax weiter CRONUS-USA-Laborlogik ist und die Dimension separat fotografiert wird. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-041-zeile-betraege-steuer.png` | brauchbares Laborbild | DOM-Scroll des BC-Containers `freeze-pane-scrollbar` zeigt `Unit Price Excl. Tax`, `Tax Group Code = FURNITURE` und `Line Amount Excl. Tax = 68.000,00`. | Als Laborbild fuer Steuer-/Betragsspalten nutzbar. Nicht als finales deutsches Buchbild, weil CRONUS-Steuergruppe `FURNITURE` und 0-%-Tax kein deutscher USt-Nachweis sind. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-042-zeile-spaete-spalten.png` | verworfener Kontrollversuch | Scroll ans rechte Tabellenende zeigt Plan-/Shipment-/Department-Spalten. | Nicht im Buch verwenden; nur Nachweis, dass DOM-Scroll grundsaetzlich funktioniert. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-050-dimension-productline-machine.png` | guter Labor-Kandidat | `Line` -> `Related Information` -> `Dimensions` oeffnet `Edit Dimension Set Entries`. Sichtbar sind `CHANNEL = B2B` und `PRODUCTLINE = MACHINE`. | Als Buchkandidat fuer Dimensionspruefung nutzbar. Final spaeter in deutscher Umgebung neu erzeugen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-060-buchungsvorschau.png` | guter Labor-Preview-Nachweis, kein finales deutsches Buchungsvorschau-Bild | Nach `MASTERDATA-009` oeffnet `Preview Posting` echte Vorschauzeilen: `G/L Entry = 4`, `Cust. Ledger Entry = 1`, `Item Ledger Entry = 1`, `Detailed Cust. Ledg. Entry = 1`, `Value Entry = 1`. Der alte Fehler `Inventory Account is missing... FRA-ZL, RESALE` ist nicht mehr sichtbar. | Als Laborbild fuer Postenvorschau und Setup-Wirkung nutzbar. Nicht als finaler deutscher Buchnachweis verwenden, weil CRONUS-USA, 0-%-Tax/kein deutscher 19-%-USt-Nachweis und keine echte Buchung. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-061-preview-related-entries-gl-entry.png` | guter Labor-Drilldown-Nachweis, noch kein finales Betragsbild | Maximierter Read-only-Drilldown aus `Posting Preview` in `G/L Entries Preview`. Sichtbar sind G/L-Konten, darunter `14140`, `50110`, `40140`, `15110`; Betragsspalten liegen im aktuellen Screenshot noch rechts ausserhalb des optimalen Bildausschnitts, sind aber im Seitentext nachgewiesen. | Als Laborbild fuer Kontenwirkung und Drilldown-Strategie nutzbar. Naechster Bildschritt: horizontal auf Betragsspalten scrollen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-080-posting-dialog-before-ok.png` | wichtiger Labor-Buchungsnachweis | Zeigt den normalen Buchungsdialog vor OK; `Ship and Invoice` wurde fuer den O2C-Laborfall bewusst gewaehlt. | Als Evidence fuer kontrolliertes Buchen nutzbar. Nicht erneut ausfuehren, nicht als deutsche Finalbuchung verwenden. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-081-posting-result.png` | Labor-Ergebnisbild | Zustand nach der einmaligen Laborbuchung; die Belegnummer wird strukturiert in `080-posting-result.json` nachgewiesen. | Als Kontextbild behalten; fuer Buch besser mit gebuchter Verkaufsrechnung `082` kombinieren. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-082-posted-sales-invoice.png` | guter Laborbeleg | Gebuchte Verkaufsrechnung `PS-INV103297` zeigt Bezug zum Auftrag `S-ORD101068`, Artikel `RM-M100`, Menge `1`, Preis `68.000` und Tax-0-%-Laborgrenze. | Als Laborbild fuer gebuchte Verkaufsrechnung geeignet. Kein deutscher 19-%-USt-Endstand. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-083-customer-ledger-entries.png` | guter Labor-Postennachweis | Gefilterte Debitorenposten zur gebuchten Rechnung; Seitentext zeigt `D10000`, Betrag `68.000` und Konto-/Bezugstexte. | Als Laborbild fuer Debitorenposten geeignet; finale deutsche Posten spaeter neu erzeugen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-084-gl-entries.png` | guter Labor-Postennachweis | Gefilterte Sachposten zur gebuchten Rechnung; Seitentext enthaelt Betrag, Debitor und Konto `14140`. | Als Laborbild fuer Sachposten geeignet; keine deutsche Kontenplan-Evidence. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-085-item-ledger-entries.png` | verworfener direkter Artikelposten-Check | Page `38` blieb mit Filter `Order No. = S-ORD101068` leer. | Nicht als Artikelpostenbeweis verwenden; naechster Read-only-Check ueber `Find entries...` oder gebuchte Lieferung. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-086-value-entries.png` | guter Labor-Postennachweis | Gefilterte Wertposten zur gebuchten Rechnung; Seitentext zeigt `RM-M100` und `D10000`. | Als Laborbild fuer Wertposten geeignet; Dimensionen sind noch nicht sichtbar nachgewiesen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-087-find-entries-posted-invoice.png` | guter Labor-Negativnachweis | `Find entries...` auf der gebuchten Rechnung zeigt Posted Sales Invoice, G/L Entry, Cust. Ledger Entry, Detailed Cust. Ledg. Entry und Value Entry, aber keinen Item Ledger Entry. | Als Lernbild geeignet: Nicht jede erwartete Postenart erscheint direkt unter `Find entries...`. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-088-item-ledger-entry-by-entry-no.png` | guter Labor-Artikelposten-Nachweis | Page `38` zeigt den Artikelposten `Entry No. 792` mit `Sales Shipment S-SHPT102297`, `RM-M100`, Lagerort `FRA-ZL` und Menge `-1`. Der Schluessel stammt aus dem Wertposten. | Als Laborbild fuer Artikelposten geeignet; keine deutsche USt- oder Dimensions-Evidence. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-089-item-ledger-entry-dimensions.png` | guter Labor-Dimensionsnachweis | `Entry` -> `Dimensions` auf dem Artikelposten `792` zeigt `CHANNEL=B2B` und `PRODUCTLINE=MACHINE`. | Als Laborbild fuer Dimensionswirkung am gebuchten Artikelposten geeignet; Reportingwirkung und deutscher Finalnachweis bleiben offen. |

## `REPORTING-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-001-010-financial-reports.png` | erster Labor-Startpunkt fuer Reporting | `Financial Reports` ist ueber Tell-Me in der Gruppe `Berichte und Analysen` geoeffnet. Die Liste zeigt u. a. `Balance Sheet`, `Income Statement` und `Revenue`; unten links liegt noch ein Teaching Tip `About Financial Reports`. | Als Laborbild fuer Seiten-Erreichbarkeit und Anfaenger-Erklaerung geeignet. Noch kein Buchbild fuer `PRODUCTLINE=MACHINE`, weil kein Dimensionsfilter und keine Summenwirkung nachgewiesen sind. |

## Harte Findings aus dem Review

### QA-O2C-001 Listenbild zeigt nicht den Buchfall

Das Listenbild `020` darf nicht als Beleg fuer den Auftrag `D10000` gelesen werden. Es ist ein Navigationsbild. Fuer den Buchfall muss der erzeugte Auftrag entweder in der Karte oder in einer gefilterten Liste sichtbar sein.

### QA-O2C-002 Zeilenbild zeigt nicht alle behaupteten Pruefpunkte

Das aktuelle Zeilenbild beweist Artikel, Beschreibung, Lagerort, Menge, EUR-Summen und den Laborbefund `Total Tax (EUR) = 0,00`. Es beweist bewusst nicht den deutschen 19-%-USt-Endstand. Die Dimension wurde separat ueber den Zeilendialog `Edit Dimension Set Entries` nachgewiesen.

### QA-O2C-003 Stoerer im Screenshot muessen aktiv entschieden werden

Document Check, Copilot Summary, FactBoxes, Hilfe- und Tourkarten koennen fuer Anfaenger lehrreich sein. Fuer finale Prozessbilder muessen sie aber entweder entfernt oder im Begleittext erklaert werden.

Aktuelle technische Regel: Page-Teaching-Tips werden vor Tabellen-/Feldnachweisen mit `dismissTours()` gezielt geschlossen. Fuer breite Tabellen kann `hideFactBoxPane()` verwendet werden, wenn die rechte Infobox/FactBox den relevanten Spaltenraum nimmt. Wenn BC eine breite Layoutansicht oder eine vergroesserte Detail-/Listenansicht anbietet, darf sie fuer Buchscreenshots genutzt werden, sofern Evidence und Buchtext erklaeren, welche Felder dadurch sichtbar werden.

### QA-O2C-004 Evidence-Text enthaelt UI-Resize-/Skriptartefakte

`040-zeile-artikel-rm-m100-page-text.txt` enthaelt nach dem fachlichen Seitentext auch Resize-Hinweise und Skripttext. `pageText()` ist deshalb als Roh-Evidence nuetzlich, aber nicht als sauberer Buchauszug. Fuer Assertions und Evidence braucht das Projekt kuenftig gescopte Extraktion aus Karten-, Listen- oder FactBox-Bereichen.

### QA-O2C-005 Seitentext ist kein Sichtbarkeitsnachweis

Die Scrollversuche zeigen: Werte koennen im BC-DOM beziehungsweise Seitentext vorhanden sein, ohne im Screenshot wirklich sichtbar zu sein. Screenshot-Metadaten verwenden deshalb den Begriff `expectedPageText`, nicht `expectedVisible`. Finale Buchfreigabe braucht visuelle Pruefung oder einen gezielt gescopten Screenshot.

### QA-O2C-006 Horizontaler Grid-Scroll ist moeglich, aber kontrollpflichtig

Business Central nutzt fuer das Verkaufszeilengrid einen horizontal scrollbaren Container `freeze-pane-scrollbar`. DOM-Scroll auf diesen Container funktioniert besser als Mauskoordinaten. Der mittlere Scrollwert liefert ein brauchbares Laborbild fuer Steuer- und Betragsspalten. Fuer finale Buchbilder muss der Zielbereich aber bewusst gewaehlt und visuell geprueft werden.

### QA-O2C-007 Buchungsvorschau zeigt jetzt Labor-Postenvorschau, aber keinen DE-Finalnachweis

`060` zeigt nach `MASTERDATA-009` nicht mehr die BC-Fehlerseite, sondern `Posting Preview` mit echten Vorschauzeilen. Didaktisch ist das Bild wertvoll, weil es zeigt, dass ein Setup-Fix nicht durch eine echte Buchung geprueft werden muss: Die Buchungsvorschau reicht als sicherer Labor-Nachweis. Fuer den finalen O2C-Nachweis bleiben deutsche Sprache, 19-%-USt, bewusste Buchungsfreigabe und Postenspur offen.

### QA-O2C-008 Laborbuchung ist erfolgt, aber bleibt CRONUS-USA-Evidence

`080` bis `089` zeigen die einmalige Laborbuchung `S-ORD101068` -> `PS-INV103297` und die erste Postenspur. Diese Bilder sind fuer das Lernen stark, weil sie die Wirkung von `Ship and Invoice` sichtbar machen. Sie sind aber keine deutschen Finalbilder: Steuer bleibt 0 %, Konten sind CRONUS-USA-Laborfit, und Reporting nach `PRODUCTLINE=MACHINE` ist noch offen.

## Verbesserungsregeln fuer die naechsten Laeufe

- Vor jedem Screenshot muss der Test pruefen, ob der Zielwert im Seitentext vorhanden ist; die visuelle Buchfreigabe erfolgt zusaetzlich ueber Screenshot-QA.
- Screenshots bekommen einen Status: `labor`, `candidate`, `final`, `rejected`.
- Screenshot-Metadaten gehoeren zum Evidence Pack und muessen vor Buchverwendung gelesen werden.
- Redundante Screenshots werden nicht ins Buch referenziert.
- Tabellenbilder brauchen eine definierte Spaltenstrategie: breiter Viewport, breite Layoutansicht, horizontaler Scroll, Zeilendetail, Personalisierung oder mehrere Detailbilder.
- Fuer Dimensionen reicht kein Stammdatenbild. Der O2C-Lauf nutzt jetzt `Line` -> `Related Information` -> `Dimensions` als Belegnachweis; spaetere Buchungslaufe muessen die Dimension zusaetzlich in Posten oder Reporting wiederfinden.
- Rohes `pageText()` wird nicht ungefiltert als redaktionelle Wahrheit verwendet.
