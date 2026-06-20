# Screenshot-QA fuer Buch 5

Update nach `FIXEDASSETS-155-FA-GL-JOURNAL-ACQUISITION-ROUTE-READONLY-PREFLIGHT`: `fixedassets-155-010-fa-gl-journal-readonly-preflight.png` wurde visuell geprueft. Das Bild zeigt die richtige Seite `Fixed Asset G/L Journals`, `Batch Name = DEFAULT`, die Tabellen-/Zeilenstruktur mit `Posting Date`, `Document No.`, `Account Type`, `Account No.`, `Depreciation Book Code`, `FA Posting Type`, `Amount` und `Bal. Account No.` sowie `Post` als klare Buchungsgrenze. Status: brauchbares Labor-/Routenbild fuer Kapitel 21 und Anfaengererklaerung, aber kein Anschaffungs-, Preview-, Posting-, Postenspur- oder deutscher Finalnachweis.

Update nach `FIXEDASSETS-153-FA-CNC-01-ACQUIRE-DISABLED-EDITMODE-DIAGNOSIS`: `fixedassets-153-010-fa-cnc-01-before-editmode.png` und `fixedassets-153-020-fa-cnc-01-after-editmode.png` wurden visuell geprueft. Beide Bilder zeigen den richtigen Datensatz `FA-CNC-01`, `Posting Group = MACHINES`, `Book Value = 0,00` und den `Acquire`-Kontext; `Acquire` bleibt ausgegraut/deaktiviert. Status: brauchbare Labor-/Diagnosebilder fuer Kapitel 21, aber keine Anschaffung, keine Preview, kein `Post`, keine Postenspur und kein deutscher Finalnachweis.

Update nach `BOOK-FIXEDASSETS-LAB-SCREENSHOT-SYNC`: Kapitel 21 nutzt jetzt mehrere vorhandene Fixed-Assets-Bilder als Buch-Laborbilder. `fixedassets-014-020-depreciation-books-after-hgb.png`, `fixedassets-016-020-fa-posting-groups-after-machines.png`, `fixedassets-033-060-card-final-values.png`, `fixedassets-043-020-k30000-vendor-invoicing-fasttab-proof.png` und `fixedassets-053-030-purchase-invoice-after-new.png` sind im Buch nur mit Laborgrenze nutzbar. `fixedassets-064-050-line-type-fixed-asset-visible.png` bleibt `rejected/do-not-use` als Zielbild, wird aber als Fehlerbild im Buch erklaert. Keine dieser Abbildungen beweist deutschen Finalstand, Anlagenzugang, AfA oder Anlagenposten.

Diese Datei bewertet, ob erzeugte Business-Central-Screenshots bereits als Buchbilder taugen oder nur Labor-/Evidence-Material sind.

## Bewertungsregel

Ein Screenshot ist erst buchfaehig, wenn er:

1. den fachlich richtigen Datensatz zeigt
2. die im Buch behaupteten Felder sichtbar macht
3. keine irrefuehrenden CRONUS- oder Altdaten als Prozessnachweis zeigt
4. Stoerer wie Popover, Touren, Resize-Hinweise oder Copilot-Karten bewusst enthaelt oder gezielt entfernt
5. Sprache, Company, Waehrung, Steuerlogik und Testdaten zum erklaerten Ziel passen
6. durch Evidence ergaenzt wird, die denselben Zustand prueft
7. bei grossen Prozessanleitungen in ein Evidence Pack eingebettet ist, das UI-Nachweis, technischen Page-/Table-Nachweis, fachlichen Prozesszustand und Posten-/Persistenznachweis trennt

Zusaetzliche harte Regel nach `FIXEDASSETS-012`: Das Bild muss sichtbar machen, was der Leser in diesem Schritt lernen oder pruefen soll. Das ist nicht immer nur ein Code. Je nach Klickanleitung kann es ein Code, Name, Betrag, Waehrung, Steuer, Status, Buchungsoption, Postenart, Konto, Dimension, Filter, Fehlermeldung, Reportzeile, Dialogauswahl oder Pflichtfeld sein. Wenn genau dieser fachliche Zielzustand nicht im Bild sichtbar ist, ist der Screenshot nur Labor-/Kontext-Evidence und nicht buchfaehig.

Ergaenzung nach `FIXEDASSETS-029`: Ein Code in einer Liste ist nur dann ein Buchbild, wenn genau die Existenz dieses Codes das Lernziel ist. Fuer Stammdatenkarten reicht der Code allein nicht. Ein Anlagenbild muss zum Beispiel auch die fachlich behaupteten Felder wie Beschreibung, Klasse/Unterklasse, AfA-Buch, Posting Group oder relevante Pflichtfelder zeigen; sonst ist es nur Stop-/Blocker-Evidence.

Ergaenzung nach `FIXEDASSETS-041`: Ein FastTab-Header mit sichtbaren Kurzinfos zaehlt nur fuer diese Kurzinfos. `Payments 1M(8D) BANK` beweist Zahlungsbedingungen und Zahlungsart, aber nicht, dass `Invoicing`, `Receiving`, Posting Groups, Currency oder Tax/VAT sichtbar geoeffnet wurden. Wenn die gesuchten Codes im Screenshot nicht lesbar sind, bleibt das Bild ein Diagnosekandidat und darf nicht als Field-Proof genutzt werden.

Ergaenzung nach `FIXEDASSETS-042`: Der naechste brauchbare Screenshot-Typ ist ein FastTab Visibility Proof. Das Bild muss `K30000`, den geoeffneten FastTab und die behaupteten Feldcaptions oder Werte zeigen. Ein Screenshot ohne `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code` oder Tax/VAT-Feld bleibt ein Negativ-/Diagnosebild und darf nicht als Kaufbeleg-Readiness verwendet werden.

Ergaenzung nach `FIXEDASSETS-043`: Der neue Invoicing-Screenshot ist ein Teilbeleg, kein Vollbeleg. Er zeigt `K30000`, den geoeffneten `Invoicing`-Bereich, `Tax Liable`, `Tax Area Code`, `Posting Details` und Withholding-Tax-Felder. Er zeigt nicht `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code` oder `VAT Bus. Posting Group`. Fuer Buch und Evidence gilt deshalb: das Bild darf nur die sichtbaren Tax-/Invoicing-Felder erklaeren, nicht die Buchungsgruppen-/Waehrungs-Readiness.

Ergaenzung nach `FIXEDASSETS-045`: Das Settings-/Personalisieren-Bild ist ein Diagnosebild. Es zeigt `K30000`, die `Vendor Card` und den Einstieg `Personalisieren`; es beweist aber nicht, dass `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code` oder `VAT Bus. Posting Group` verfuegbar, eingeblendet oder gefuellt sind. Page Inspection wurde per Shortcut in diesem Browserkontext nicht stabil geoeffnet; daher gibt es keinen neuen technischen Page-Inspection-Screenshot. Ein Folgebild darf erst als Buchkandidat gelten, wenn die konkret behaupteten Codes/Felder wirklich im Bild sichtbar sind.

Ergaenzung nach `FIXEDASSETS-047`: Die neuen breiten `K30000`-Bilder sind Diagnose-/Teilbelege. Sie zeigen den Kreditorenkontext, `Tax Area Code`, `Tax Liable`, `Payment Terms Code = 1M(8D)` und `Payment Method Code = BANK`; sie zeigen aber nicht `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code` oder `VAT Bus. Posting Group`. Fuer das Buch duerfen sie nur erklaeren, wie man sichtbare Teilwerte liest und warum fehlende Pflichtdefaults ein Gate bleiben.

Ergaenzung nach `FIXEDASSETS-049`: Die neuen Personalisieren-Bilder zeigen `Wird personalisiert: Vendor Card` und den K30000-Kontext, aber keine Feldliste und keine kritischen Feldcaptions. Sie sind Diagnosebilder fuer den Einstieg in Personalisieren, nicht Buchbilder fuer `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code` oder `VAT Bus. Posting Group`. Ein Personalize-Screenshot ist erst Feldverfuegbarkeitsbeweis, wenn der behauptete Feldname oder Wert im Bild lesbar ist.

Ergaenzung nach `FIXEDASSETS-051`: Das Page-Inspection-Bild zeigt `Vendor Card (26, Card)` und `Vendor (23)` und ist damit ein guter technischer Page-/Table-Kontext. Es zeigt aber nicht alle kritischen Codes als gut lesbare Bildwerte. `Vendor Posting Group = DOMESTIC`, `Gen. Bus. Posting Group = DOMESTIC`, leere Currency/VAT/Tax-Felder, `Tax Liable = Nein`, `1M(8D)` und `BANK` sind in strukturierter Evidence belegt. Fuer Buchscreenshots gilt weiter: Bild und Aussage muessen zusammenpassen; wenn Codes nicht sichtbar sind, ist das Bild Debugging-/Evidence-Kontext und kein Feldwerte-Buchbild.

Ergaenzung nach `FIXEDASSETS-060`: Das neue Purchase-Invoice-Bild ist ein Preflight-/Kontextkandidat. Es zeigt `Purchase Invoice`, Pflichtfelder wie `Vendor Name` und `Vendor Invoice No.` sowie den Lines-/Gridbereich. Es zeigt aber keinen Anlagenkauf: kein `K30000`, keine `Vendor Invoice No.`, kein Zeilentyp `Fixed Asset`, kein `FA-CNC-01`, keine Preview und keine Buchung. Weil die FactBox offen ist und die erste Zeile default auf `Item` steht, darf das Bild nur den Karten-/Lines-Kontext nach `Neu` erklaeren, nicht einen Zielbeleg.

Ergaenzung nach `FIXEDASSETS-061`: Fuer den naechsten Anlagen-Einkaufsrechnungs-Screenshot reicht kein einzelner sichtbarer Code. Ein Field-Mapping-Bild ist nur brauchbar, wenn `Purchase Invoice`, `K30000`, ein sichtbarer `Vendor Invoice No.`-Wert, der Lines-/Gridbereich, Zeilentyp `Fixed Asset` und `FA-CNC-01` im selben Vordergrundkontext sichtbar sind. Fehlt einer dieser Bestandteile, ist das Bild nur Kontext-, Diagnose- oder Rejected-Evidence.

Ergaenzung nach `FIXEDASSETS-062`: `fixedassets-062-050-target-field-mapping.png` ist `rejected/debugging`. Es zeigt `FA-CNC-01` in einer `Vendor Card - V00060 - FA-CNC-01`, waehrend die Einkaufsrechnungszeile im Hintergrund weiter `Type = Item` zeigt. Genau deshalb darf ein sichtbarer Code nie allein als Buchbild gelten. Fuer Kapitel 21 bleibt der Ziel-Screenshot offen, bis `Type = Fixed Asset` und `FA-CNC-01` sichtbar in derselben Einkaufsrechnungszeile stehen.

Ergaenzung nach `FIXEDASSETS-063`: Es gibt bewusst kein neues Bild. Der Lauf ist ein Screenshot-Gate: Vor jedem neuen `FA-CNC-01`-Bild muss zuerst ein separater UI-Probe-Screenshot zeigen, dass in einer sichtbaren Einkaufsrechnungszeile der Zeilentyp `Fixed Asset` wirklich gesetzt ist. Ein Screenshot, der nur den Zielcode, eine Lookup-Karte oder eine Hintergrundzeile mit `Type = Item` zeigt, bleibt `rejected`.

Ergaenzung nach `FIXEDASSETS-064`: `fixedassets-064-050-line-type-fixed-asset-visible.png` ist trotz Dateiname `rejected/do-not-use`. Das Bild zeigt gerade keinen gesetzten Zeilentyp `Fixed Asset`, sondern weiter `Type = Item` und einen Vendor-Registrierungsdialog fuer `Fixed Asset`. Fuer Buchbilder gilt daraus: Der behauptete Wert muss im eigentlichen Tabellenfeld sichtbar sein; ein Dialogtext mit demselben Wort ist kein Feldnachweis.

Laborbilder duerfen abweichen. Dann muessen Abweichung, Ursache und Buchwirkung dokumentiert sein.

Zu jedem automatisiert erzeugten O2C-Screenshot schreibt der Screenshot-Helper eine Metadatendatei unter `evidence/<testfall>/...screenshot.json`. Diese Datei enthaelt Status, Buchnutzung, Zweck, erwartete Werte im BC-Seitentext und bekannte Grenzen. Die PNG-Datei allein ist deshalb nicht mehr die ganze Wahrheit.

Fuer `UAT-O2C-001` fasst `playwright/projects/fibu-book5/evidence/uat-o2c-001/README.md` die Screenshot-Metadaten, Rohtexte, API-Nachweise, Preview-Evidence und Cleanup-Evidence zusammen. Vor Buchverwendung zuerst diesen Index lesen.

## Screenshot-Typen und Pflichtmetadaten

| Screenshot-Typ | Zweck | Pflichtpruefung |
|---|---|---|
| `navigation` | zeigt Einstieg, Tell-Me, Suchpfad oder Trefferliste | richtige Treffergruppe sichtbar, keine Behauptung ueber Prozessfaehigkeit |
| `setup-before` | zeigt Ausgangszustand vor Setup-Fit | Zielzeile/Zielobjekt oder Luecke sichtbar; kein Endstand behaupten |
| `setup-after` | zeigt geaenderten Setup-Zustand | Zielwert sichtbar und durch Result-/Seitentext-Evidence gestuetzt |
| `preflight` | zeigt Preview Posting, Journal Check, Pflichtfelder oder Pruefstatus | Preflight-Status muss sichtbar sein; FactBox nicht ausblenden, wenn sie der Nachweis ist |
| `posting-dialog` | zeigt letzte Sicherheitsgrenze vor Buchung | Option und Kontext sichtbar; nur bei ausdruecklich erlaubter Buchung |
| `posted-document` | zeigt gebuchten Beleg | Belegnummer, Debitor/Kreditor/Artikel/Betrag oder relevanter Status sichtbar |
| `ledger-trace` | zeigt Nebenbuch-, Sach-, Artikel-, Wert- oder Bankposten | Belegnummer/Filter und die relevante Postenart sichtbar |
| `report` | zeigt Bericht, Financial Report oder Auswertung | Filter, Berichtstitel, relevante Zeile/Betrag/Achse sichtbar |
| `error` | zeigt Blocker oder Fehlermeldung | Fehlermeldung oder Symptom vollstaendig genug sichtbar |
| `rejected-path` | zeigt bewusst gescheiterten Pfad | sichtbar machen, warum der Pfad nicht als Buchbild taugt |
| `book-candidate` | potenzielles finales Buchbild | sichtbares Lernziel, Zielmandant/-sprache/-daten und Evidence muessen passen |

Metadaten oder README muessen fuer jedes notwendige Bild klaeren:

- was man im Bild sehen soll
- warum das Bild noetig ist
- Status `labor`, `candidate`, `final` oder `rejected`
- Sandbox/Company, soweit fuer den Nachweis relevant
- Buchabschnitt oder Prozessfall
- sichtbares Ziel, zum Beispiel Code, Name, Betrag, Status, Konto, Dimension, Filter, Reportzeile oder Fehler
- was das Bild nicht beweist
- naechster Bild-/Evidence-Schritt, falls offen

Nicht noetig ist ein Screenshot, wenn er nur eine technische Zwischenstation ohne Lern-, Fehler-, Setup-, Preflight-, Posting-, Postenspur-, Reporting- oder Buchwirkung zeigt. Solche Zustaende gehoeren, wenn ueberhaupt, in kompakte Text-/JSON-Evidence. Screenshots werden aber nicht geloescht, wenn sie bereits referenziert sind, einen Fehlerpfad erklaeren, einen Vorher/Nachher-Zustand tragen oder spaeter als Buchkandidat dienen koennen.

## `MASTERDATA-007` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-item-rm-m100.png` | guter Labor-Kandidat | Page `540` zeigt `Default Dimensions` mit `PRODUCTLINE`, `MACHINE` und `Same Code`. Die Teaching-Tip-Karte `About default dimensions` wurde gezielt geschlossen. | Als Buchkandidat fuer Standarddimensionen geeignet; final in deutscher Umgebung neu erzeugen. |
| `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-customer-d10000.png` | guter Labor-Kandidat | Page `540` zeigt `CHANNEL`, `B2B`, `Business-to-Business` und `Same Code`. Parent `D10000` ist ueber Filter/Test/Evidence belegt, aber nicht im sichtbaren Seitentext. | Als Laborbild geeignet; Buchtext muss erklaeren, dass Page 540 auf den Debitorenkontext gefiltert wurde. |
| `playwright/projects/fibu-book5/img/masterdata-dimensions-010-book-standard-dimensions.png` | Labor-Kandidat mit Grenze | Dimensionsliste zeigt zentrale RM-DEMO-Dimensionen wie `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP`. | Als Uebersichtsbild fuer den O2C-Kern geeignet. Nicht als Nachweis fuer alle Buchstandard-Werte nutzen; fehlende Werte stehen in `evidence/masterdata-dimensions/011-dimension-foundation-summary.md`. |
| `playwright/projects/fibu-book5/img/masterdata-010-p1-location-group-simple.png` | guter Labor-Kandidat | Dimension Values fuer `LOCATION-GROUP` zeigen `DIRECTED` und `SIMPLE`. | Als Laborbild fuer einfache Lagerlogik geeignet; weitere P1-Werte sind in JSON/Markdown-Evidence belegt. |

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

## `REPORTING-002` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-002-010-gl-entries-ps-inv103297.png` | Labor-Negativnachweis | Gefilterte Sachposten zur gebuchten Rechnung `PS-INV103297` sind sichtbar; `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` erscheinen im aktuellen Seitentext nicht. | Als Lernbild geeignet: Sachposten zeigen Konto/Betrag, aber Dimensionen muessen ggf. ueber Dialog, Dimension Set oder Dimensionsbericht nachgewiesen werden. |
| `playwright/projects/fibu-book5/img/reporting-002-020-gl-entry-dimensions.png` | verworfener Dimensionsdialogversuch | Der Test konnte im aktuellen G/L-Entries-Kontext `Entry` -> `Dimensions` nicht oeffnen; Screenshot entspricht deshalb weiter der Sachpostenliste. | Nicht als Dimensionsnachweis verwenden; naechster Lauf braucht gezielten Sachposten-Dimensionspfad. |
| `playwright/projects/fibu-book5/img/reporting-002-046-item-ledger-entry-792-dimensions.png` | guter Labor-Dimensionsnachweis | `Entry` -> `Dimensions` am Artikelposten `792` zeigt `PRODUCTLINE=MACHINE` und `CHANNEL=B2B`. | Als Laborbild fuer Dimensionsvererbung in Artikelposten geeignet; kein Financial-Reports-Endnachweis. |
| `playwright/projects/fibu-book5/img/reporting-002-055-financial-reports-list.png` | guter Labor-Startpunkt fuer naechsten Reporting-Schritt | Financial Reports ist erreichbar; sichtbar sind u. a. `Income Statement`, `Revenue`, `Balance Sheet`, `Dimension Perspective` und `Column Definition`. `PRODUCTLINE`/`CHANNEL` sind noch nicht als Filter oder Auswertungsachse sichtbar. | Als Laborbild fuer Reporting-Navigation geeignet. Naechster Bildschritt: `Dimension Perspective` oder Dimensionsbericht gezielt oeffnen. |

## `FIXEDASSETS-041` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-041-010-k30000-vendor-card-top-diagnosis.png` | Labor-Kontext-/Diagnosebild | Zeigt den K30000-Kreditorenkontext und am unteren Bildrand Payment-Werte. Die gesuchten Posting-/Currency-/Tax-Codes sind nicht sichtbar. | Als Evidence fuer den aktuellen UI-Zustand behalten; nicht als Buchbild fuer Vendor Posting Group, Gen. Bus. Posting Group, Currency oder Tax/VAT verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-041-020-k30000-vendor-card-mid-diagnosis.png` | limitierter Kandidat / kein finaler Field-Proof | Zeigt im Wesentlichen weiter den Kartenkontext und Payment-Header. Eine geoeffnete Invoicing-/Receiving-FastTab-Ansicht ist nicht bewiesen. | Nicht als finales Buchbild verwenden; Folgelauf braucht gezielten FastTab-Chevron, Personalisieren oder Page Inspection. |

## `REPORTING-003` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-003-020-financial-reports-wide-layout.png` | brauchbarer Labor-Startpunkt | Financial Reports ist im breiten Viewport sichtbar; die Tabellenansicht zeigt mehr Spalten und eignet sich fuer Erklaerung von `Row Definition`, `Column Definition` und Reportingzeilen. | Als Laborbild fuer breite Layoutansicht und Reporting-Navigation geeignet; noch kein Dimensions- oder Zahlenbeweis. |
| `playwright/projects/fibu-book5/img/reporting-003-030-dimension-perspective-result.png` | rejected Negativbild | Nach dem Versuch `Definitions -> Dimension Perspective` ist kein Dimension-Perspective-Kontext sichtbar; das Bild zeigt das Role Center. | Nicht als Buchbild verwenden. Als Evidence fuer den gescheiterten Schnellpfad behalten; naechster Bildschritt ist `Dimensions - Detail` oder Analysis Views. |

## `REPORTING-004` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-004-020-analysis-views-list.png` | guter Labor-Startpunkt | `Analysis Views` ist erreichbar; sichtbar sind mindestens `GEN_LEDGER` und `REVENUE` sowie Dimensionsspalten `Dimension 1 Code` bis `Dimension 4 Code`. | Als Laborbild fuer den Reporting-Setup-Ort geeignet; noch kein Zahlen- oder Dimensionsergebnis. |
| `playwright/projects/fibu-book5/img/reporting-004-030-revenue-analysis-view-card.png` | guter Labor-Negativnachweis | Die `REVENUE` Analysis View Card zeigt `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`; `PRODUCTLINE` und `CHANNEL` fehlen. | Als Buch-/Lernbild geeignet, um zu erklaeren, warum eine vorhandene Revenue-Analysis-View nicht automatisch die Buchdimensionen auswertet. Kein finaler Reportingbeweis. |

## `REPORTING-005` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-005-010-tell-me-dimensions-detail.png` | rejected Navigations-/Negativbild | Der Tell-Me-Versuch nach `Dimensions - Detail` zeigt keinen eindeutigen sichtbaren Treffer fuer den Zielbericht. | Nicht als Buchbild fuer Reportingwirkung verwenden. Als Evidence behalten, weil der falsche/fehlende Suchpfad fuer Anfaenger relevant ist. |
| `playwright/projects/fibu-book5/img/reporting-005-020-dimensions-detail-request.png` | rejected Folgezustand | Der Folgezustand zeigt keinen `Dimensions - Detail`-Request-Kontext und keine `PRODUCTLINE`-/`CHANNEL`-Filter. | Nicht als Buchbild verwenden. Naechster Bildschritt braucht alternativen UI-Einstieg oder freigegebenen Analysis-View-Fit. |

## `FIXEDASSETS-001` / `FIXEDASSETS-002` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-001-010-fixed-assets-tell-me.png` | Labor-Readiness-Kandidat | Tell-Me zeigt `Fixed Assets` als Einstiegskontext. Es wurde keine Seite geoeffnet und keine Anlage angelegt. | Als Navigations-/Readinessbild geeignet. Nicht als Anlagenkarte oder Prozessnachweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-001-040-fa-ledger-entries-tell-me.png` | Labor-Readiness-Kandidat | Tell-Me zeigt `FA Ledger Entries` als moeglichen Nachweispfad. Es gibt noch keine Posten fuer `FA-CNC-01`. | Als spaeterer Nachweispfad-Hinweis geeignet. Nicht als Anlagenpostenbeweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-002-010-anlagen-tell-me.png` | Labor-Readiness-Kandidat | Deutscher Suchbegriff `Anlagen` liefert sichtbaren Suchkontext. | Als Navigationsbild fuer Kapitel 21 geeignet; naechster Lauf muss die Seite gezielt oeffnen. |
| `playwright/projects/fibu-book5/img/fixedassets-002-020-afa-tell-me.png` | Labor-Readiness-Kandidat | Suchbegriff `AfA` liefert AfA-nahe Trefferkontexte. | Als Hinweis fuer AfA-Suchstrategie geeignet. Kein AfA-Buch, keine Abschreibung. |
| `playwright/projects/fibu-book5/img/fixedassets-002-030-anlagenbuchungsgruppen-tell-me.png` | Labor-Readiness-Kandidat | Suchbegriff `Anlagenbuchungsgruppen` liefert einen Setup-Kontext. | Als Hinweis auf die Kontenfindungs-Voraussetzung geeignet. `MACHINES` ist nicht nachgewiesen. |
| `playwright/projects/fibu-book5/img/fixedassets-002-040-einkaufsrechnungen-tell-me.png` | Labor-Readiness-Kandidat | Suchbegriff `Einkaufsrechnungen` liefert den moeglichen Zugangspfad ueber Purchase Invoices. | Nur Navigationsbild. Keine Einkaufsrechnung und keine Aktivierung. |
| `playwright/projects/fibu-book5/img/fixedassets-002-050-anlagenposten-tell-me.png` | Labor-Readiness-Kandidat | Suchbegriff `Anlagenposten` liefert den spaeteren Postennachweis-Kontext. | Nicht als Postenspur verwenden; noch keine Anlage gebucht. |

## `FIXEDASSETS-003` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-003-010-fixed-assets-list.png` | Labor-Readiness-Kandidat | Direkte Page-ID `5601` oeffnet die Anlagenliste als Zielseitenkandidat. | Als Navigationsbild fuer Kapitel 21 geeignet. Nicht als Anlagenkarte `FA-CNC-01` oder Setupnachweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-003-020-depreciation-books.png` | Labor-Readiness-Kandidat | Direkte Page-ID `5611` oeffnet AfA-/Depreciation-Books-Kontext. | Als Navigationsbild fuer AfA-Buch-Readiness geeignet. Kein Nachweis fuer `HGB`, keine AfA-Buchung. |
| `playwright/projects/fibu-book5/img/fixedassets-003-030-fa-posting-groups.png` | rejected | Direkte Page-ID `5606` zeigt im Labor `FA Ledger Entries Preview`, nicht den erwarteten FA-Posting-Groups-Kontext. | Nicht als Buchbild verwenden. Fuer Anlagenbuchungsgruppen braucht `FIXEDASSETS-004` einen alternativen UI-/Tell-Me-Pfad. |
| `playwright/projects/fibu-book5/img/fixedassets-003-040-purchase-invoices.png` | Labor-Readiness-Kandidat | Direkte Page-ID `9308` oeffnet Einkaufsrechnungen als moeglichen Zugangspfad. | Als Navigationsbild geeignet. Keine Einkaufsrechnung erfasst, keine Aktivierung, keine Buchung. |
| `playwright/projects/fibu-book5/img/fixedassets-003-050-fa-ledger-entries.png` | Labor-Readiness-Kandidat mit leerer Liste | Direkte Page-ID `5604` oeffnet Anlagenposten; die Liste ist leer, weil `FA-CNC-01` noch nicht angelegt/gebucht ist. Seitentext enthaelt etwas Webshell-Rauschen. | Als Nachweispfad-Bild geeignet, aber nicht als Postenspur. Final nach Anlagenzugang/AfA neu erzeugen. |

## `FIXEDASSETS-004` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-004-010-fixed-asset-fa-cnc-01.png` | Labor-Readiness-/Negativbild | Gefilterte Anlagenliste ist erreichbar, aber `FA-CNC-01` ist nicht sichtbar. | Als Lernbild fuer fehlendes Stammdatum geeignet. Nicht als Anlagenkarte verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-004-020-depreciation-book-hgb.png` | Labor-Readiness-/Negativbild | AfA-Buecher sind erreichbar, aber `HGB` ist nicht sichtbar. | Als Setup-Lueckenbild geeignet. Kein AfA-Nachweis. |
| `playwright/projects/fibu-book5/img/fixedassets-004-030-fa-posting-groups-tell-me.png` | Labor-Navigationsbild | Tell-Me zeigt `FA Posting Groups` in `Seiten und Aufgaben`. | Als Suchpfad-Evidence behalten; noch kein Zielseitenbeweis. |
| `playwright/projects/fibu-book5/img/fixedassets-004-031-fa-posting-groups-result.png` | rejected | Nach Klickversuch ist kein belastbarer FA-Posting-Groups-Kontext sichtbar; der Zustand faellt auf Role-Center-/Startseitenkontext zurueck. | Nicht als Buchbild verwenden; alternativen Klickpfad suchen. |
| `playwright/projects/fibu-book5/img/fixedassets-004-040-vendor-k30000.png` | Labor-Readiness-/Negativbild | Vendors ist erreichbar, aber `K30000` ist nicht sichtbar. | Als Nachweis fuer fehlenden Zielkreditor geeignet. Keine Einkaufsrechnung. |
| `playwright/projects/fibu-book5/img/fixedassets-004-050-purchase-invoices-entry-path.png` | Labor-Readiness-Kandidat | Purchase Invoices ist erreichbar und zeigt `Neu`/`New from PDF`; `K30000` ist im gefilterten Kontext nicht sichtbar. | Als Einstiegspfadbild geeignet. Nicht als Anlagenzugang oder Buchung verwenden. |

## `FIXEDASSETS-005` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-005-010-fa-posting-groups-tell-me.png` | brauchbarer Labor-Navigationsnachweis | Tell-Me zeigt `FA Posting Groups` als konkreten UI-Treffer. | Als Suchpfadbild geeignet. Noch kein Nachweis fuer `MACHINES` oder Kontenfit. |
| `playwright/projects/fibu-book5/img/fixedassets-005-020-fa-posting-groups-result.png` | guter Labor-Pfadnachweis | Die Seite `FA Posting Groups` ist sichtbar; vorhandene CRONUS-Gruppen und Kontenspalten sind zu sehen, `MACHINES` fehlt. Aktionen `Neu` und `Liste bearbeiten` sind sichtbar. | Als Laborbild fuer Anlagenbuchungsgruppen-Pfad und Setup-Luecke geeignet. Nicht als deutscher Kontenplan- oder `MACHINES`-Fit verwenden. |

## `FIXEDASSETS-006` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-006-010-fa-posting-groups-accounts.png` | guter Labor-Setup-Vorbereitungsnachweis | `FA Posting Groups` zeigt sichtbare CRONUS-Gruppen und Kontenspalten. JSON-Evidence liest `EQUIPMENT = 12210/82000`, `GOODWILL = 11300`, `PLANT = 12110/81000`, `PROPERTY = 12130/81000`, `VEHICLES = 12230/82000`. `MACHINES` fehlt weiter. | Als Buch-/Lernbild fuer Kontenfindung in Anlagenbuchungsgruppen geeignet. Nicht als deutscher HGB-Kontenplan, nicht als `MACHINES`-Fit und nicht als Anlagenbuchungsnachweis verwenden. |

## `FIXEDASSETS-007` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-007-010-depreciation-books.png` | guter Labor-Setup-Vorbereitungsnachweis | `Depreciation Books` zeigt `COMPANY = Company Book`; `HGB` ist nicht sichtbar. | Als Buch-/Lernbild fuer AfA-Buch-Readiness geeignet. Nicht als deutscher HGB-Endstand und nicht als AfA-Buchung verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-007-020-fixed-asset-classes-tell-me.png` | Navigations-/Suchbild mit begrenztem Nutzen | Tell-Me-Suche nach `Fixed Asset Classes` ist dokumentiert, der robuste Zielnachweis kam aber ueber direkte Page `5615`. | Nur als Suchpfad-Hinweis verwenden; fuer Buchbild besser das Ergebnisbild nutzen. |
| `playwright/projects/fibu-book5/img/fixedassets-007-021-fixed-asset-classes-result.png` | guter Labor-Setup-Vorbereitungsnachweis | `FA Classes` zeigt `FINANCIAL`, `INTANGIBLE`, `TANGIBLE`. | Als Lernbild fuer Anlagenklassen geeignet. Nicht als Anlagenkarte, Anlagenbuchungsgruppe oder Buchungsnachweis verwenden. |

## `FIXEDASSETS-010` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-010-010-fa-posting-groups-preflight.png` | guter Labor-Preflight-Kandidat | Breite Layoutansicht zeigt `FA Posting Groups`, Kontenspalten und vorhandene CRONUS-Gruppe `GOODWILL`; `MACHINES` ist nicht sichtbar. | Als Buch-/Lernbild fuer Kontenfindung und Setup-Luecke geeignet. Nicht als `MACHINES`-Fit, deutscher HGB-Kontenplan oder Buchungsnachweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-010-020-depreciation-books-preflight.png` | guter Labor-Preflight-Kandidat | `Depreciation Books` ist in breiter Ansicht sichtbar; `COMPANY` ist sichtbar, `HGB` nicht. | Als Lernbild fuer AfA-Buch-Readiness geeignet. Nicht als HGB-Endstand, AfA-Berechnung oder Buchungsnachweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-010-030-fixed-assets-preflight.png` | guter Labor-Preflight-Kandidat | `Fixed Assets` ist als Anlagenlisten-Kontext sichtbar; `FA-CNC-01` ist nicht sichtbar. | Als Lernbild fuer fehlendes Anlagenstammdatum geeignet. Nicht als Anlagenkarte oder Aktivierungsnachweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-010-040-vendors-preflight.png` | guter Labor-Preflight-Kandidat | Gefilterter `Vendors`-Kontext fuer `K30000` ist sichtbar, der Zielkreditor selbst nicht. | Als Lernbild fuer fehlenden Kreditor vor Anlagen-Einkaufsrechnung geeignet. Nicht als Kreditoranlage oder Einkaufsrechnung verwenden. |

## `FIXEDASSETS-012` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-012-010-fa-posting-groups-new-preflight.png` | Labor-Formular-Preflight, nicht buchfaehig als Zielcode-Bild | Leere `FA Posting Group Card` mit Pflichtfeld `Code` und Konto-/Disposal-Feldern. `MACHINES` ist nicht sichtbar. | Nur als Lernbild fuer Pflichtfelder und Anlagenbuchungsgruppen-Setup verwenden. Fuer Buchziel `MACHINES` braucht es spaeter ein Bild mit sichtbarem Code. |
| `playwright/projects/fibu-book5/img/fixedassets-012-020-depreciation-books-new-preflight.png` | Labor-Formular-Preflight, nicht buchfaehig als Zielcode-Bild | Leere `Depreciation Book Card` mit Pflichtfeld `Code`, Defaults und G/L-Integration-Schaltern. `HGB` ist nicht sichtbar. | Nur als Lernbild fuer AfA-Buch-Felder verwenden. Kein HGB-/DE-Finalnachweis. |
| `playwright/projects/fibu-book5/img/fixedassets-012-030-fixed-assets-new-preflight.png` | Labor-Formular-Preflight, nicht buchfaehig als Zielcode-Bild | Leere `Fixed Asset Card` mit Pflichtfeldern und AfA-Feldern. `FA-CNC-01` ist nicht sichtbar. | Nur als Lernbild fuer Anlagenkarten-Pflichtfelder verwenden. Kein Anlagenstamm- oder Aktivierungsnachweis. |
| `playwright/projects/fibu-book5/img/fixedassets-012-040-vendors-new-preflight.png` | Labor-Template-Preflight, nicht buchfaehig als Zielcode-Bild | Dialog `Select a template for a new vendor` mit Vendor-Templates. `K30000` ist nicht sichtbar. | Nur als Lernbild fuer Vorlagenauswahl verwenden. Kein Kreditorenanlage-Nachweis. |
| `playwright/projects/fibu-book5/img/fixedassets-014-020-depreciation-books-after-hgb.png` | guter Labor-Setup-Proof / Buchkandidat | `Depreciation Books` zeigt `HGB` und `HGB depreciation book` in einer sichtbaren Tabellenzeile. | Als Buch-/Lernbild fuer den HGB-AfA-Buch-Fit geeignet. Kein deutscher Finalnachweis, keine Anlagenbuchungsgruppe, keine Anlage, keine AfA und keine Buchung. |
| `playwright/projects/fibu-book5/img/fixedassets-016-020-fa-posting-groups-after-machines.png` | guter Labor-Setup-Proof / Buchkandidat | `FA Posting Group Card` zeigt `MACHINES` als Kartenkopf und Code; die relevanten Kontenwerte `12210` und `82000` sind im sichtbaren Kartenbereich lesbar. | Als Buch-/Lernbild fuer den `MACHINES`-Anlagenbuchungsgruppen-Fit geeignet. Kein deutscher Kontenplan-Endstand, keine Anlage, kein Kreditor, keine Einkaufsrechnung, keine AfA und keine Buchung. |
| `playwright/projects/fibu-book5/img/fixedassets-036-010-vendors-k30000-readonly.png` | guter Labor-Negativbefund / Buchkandidat fuer fehlenden Zielkreditor | `Vendors` Page `27` zeigt den Filterbereich mit `No. = K30000` und die leere Listenansicht. `K30000` ist nicht als Kreditorenzeile sichtbar. | Als Lernbild fuer "erst Zielkreditor suchen, dann Setup-Gate entscheiden" geeignet. Kein Kreditorenkarten-, Kreditoranlage-, Einkaufsrechnungs-, Anlagenzugangs-, AfA- oder Buchungsnachweis. |
| `playwright/projects/fibu-book5/img/fixedassets-047-010-k30000-vendor-card-context.png` | Labor-Kontext-/Diagnosebild | Die breite `Vendor Card` zeigt `K30000` und `Zollspedition Nord GmbH`; kritische Einkaufsdefaults sind nicht sichtbar. | Als Kontextbild behalten. Nicht als Beweis fuer Vendor Posting Group, Gen. Bus. Posting Group, Currency oder VAT verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-047-020-k30000-invoicing-visibility.png` | Labor-Teilbeleg | Das Bild zeigt den `Invoicing`-Bereich mit `Tax Area Code` und `Tax Liable`. `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code` und `VAT Bus. Posting Group` sind nicht sichtbar. | Nur fuer die sichtbaren Tax-/Invoicing-Teilwerte verwenden; kein Kaufbeleg-Readiness-Bild. |
| `playwright/projects/fibu-book5/img/fixedassets-047-030-k30000-payments-visibility.png` | Labor-Teilbeleg | Das Bild zeigt Zahlungswerte `1M(8D)` und `BANK`. Es zeigt keine kritischen Einkaufs-/Posting-/VAT-Defaults. | Nur fuer Zahlungsbedingungen/Zahlungsart verwenden; kein Einkaufsrechnungs-, Anlagenzugangs- oder Buchungsgate. |
| `playwright/projects/fibu-book5/img/fixedassets-047-040-k30000-receiving-visibility.png` | Labor-Diagnosebild | Der Receiving-/Folgekontext liefert keinen sichtbaren Nachweis fuer die gesuchten kritischen Defaults. | Behalten als Negativ-/Diagnosebild; nicht als Buchbild fuer Default-Readiness verwenden. |

## `FIXEDASSETS-018` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-018-010-fixed-assets-list-target-not-visible.png` | begrenzter Labor-Preflight-Kandidat | Die Anlagenliste ist sichtbar; `FA-CNC-01` ist im sichtbaren Ausschnitt nicht zu sehen. Das Bild zeigt keinen sauber leeren Filterzustand und beweist deshalb nicht allein die Nicht-Existenz des Zielstammsatzes. | Als Kontext-/Preflightbild geeignet. Nicht als harter fehlender-Stammsatz-Beweis, Anlagenkarte oder Aktivierungsnachweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-018-030-fixed-asset-card-preflight.png` | guter Labor-Karten-Preflight, kein Zielstammdatenbild | Die leere `Fixed Asset Card` zeigt `No.`, `Description`, `FA Class Code`, `FA Subclass Code`, AfA-Felder, `Depreciation Method = Straight-Line` und `Book Value = 0,00`. `FA-CNC-01`, `CNC Maschine FRA`, `HGB` und `MACHINES` sind nicht gesetzt/sichtbar. | Als Buch-/Lernbild fuer Pflichtfelder und Kartenaufbau geeignet. Nicht als Beweis fuer angelegte Anlage verwenden; der spaetere Ziel-Screenshot muss `FA-CNC-01` und die relevanten Werte sichtbar zeigen. |

## `FIXEDASSETS-020` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-020-020-card-more-fields-mapping.png` | guter Labor-Feldmapping-Kandidat, kein Zielstammdatenbild | Die leere `Fixed Asset Card` zeigt nach kartennahem `Mehr anzeigen` die Feldpfade `No.`, `Description`, `FA Class Code`, `FA Subclass Code`, `Depreciation Book Code` und `Posting Group`. Die Zielwerte `FA-CNC-01`, `CNC Maschine FRA`, `HGB` und `MACHINES` sind nicht gesetzt. | Als Buch-/Lernbild fuer Feldsichtbarkeit und die Bedeutung von `Mehr anzeigen` geeignet. Nicht als angelegte Anlage, Setup-Fit, Zugang, AfA oder deutscher Finalnachweis verwenden. Naechstes Bild muss die bewusst gesetzten Zielwerte sichtbar zeigen. |

## `FIXEDASSETS-023` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-023-020-card-context-after-show-more.png` | guter Labor-Kontext-/Feldmapping-Kandidat, kein Zielstammdatenbild | Die leere `Fixed Asset Card` zeigt die relevanten Controls `FA Class Code`, `FA Subclass Code`, `Depreciation Book Code` und `Posting Group`; Zielwerte wie `FA-CNC-01`, `HGB` und `MACHINES` sind nicht gesetzt. | Als Lernbild fuer Kartenkontext und Setup-Felder geeignet. Nicht als gespeicherte Anlage, Setup-Fit, Zugang, AfA oder deutscher Finalnachweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-023-040-page-inspection-diagnosis.png` | guter technischer Debug-Nachweis, kein finales Buchbild | Page Inspection zeigt `Fixed Asset Card (5600, Document)` und Source Table `Fixed Asset (5600)`. Das bestaetigt Page und Tabelle, aber keine gesetzten Stammdatenwerte. | Als Evidence fuer technische Nachweisfuehrung und Locator-Bugfixing geeignet. Fuer das Buch nur im Debugging-/Autorenkapitel verwenden; Prozessbilder muessen normale Anwendersicht zeigen. |

## `FIXEDASSETS-024` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-024-020-active-card-control-diagnosis.png` | technischer Labor-Control-Nachweis, nur teilweise; kein Zielstammdatenbild | Die `Fixed Asset Card` ist im Vordergrund sichtbar. Die aktuelle JSON-Evidence mappt `FA Class Code`, `FA Subclass Code`, `Depreciation Starting Date` und `Depreciation Ending Date` als aktive Controls; `Depreciation Book Code` und `Posting Group` sind dagegen `caption-not-visible`. Die Zielwerte `FA-CNC-01`, `CNC Maschine FRA`, `HGB`, `MACHINES`, Klasse, Unterklasse und AfA-Daten sind nicht gesetzt. | Als Debug-/Locator-Evidence behalten, aber nicht als vollstaendigen Save-Gate-Nachweis verwenden. Naechstes Bild/Evidence muss die fehlenden aktiven Controls oder die Begrenzung klar zeigen. Ein spaeteres Buchbild muss die behaupteten Werte selbst sichtbar zeigen. |

## `FIXEDASSETS-026` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-026-030-depreciation-book-controls-recovery.png` | guter no-save Labor-Control-Proof; kein Zielstammdatenbild | Die `Fixed Asset Card` ist sichtbar und der Bereich `Depreciation Book` zeigt die Controls `Depreciation Book Code` und `Posting Group`. Die JSON-Evidence mappt 6/6 Zielcontrols auf der aktiven Karte. Zielwerte wie `FA-CNC-01`, `CNC Maschine FRA`, `HGB`, `MACHINES`, Klasse, Unterklasse und AfA-Daten sind noch nicht gesetzt. | Als Buch-/Lernbild fuer Feldsichtbarkeit, breite Kartenansicht und Control-Recovery geeignet. Nicht als gespeicherte Anlage, Wertebeweis, Setup-Fit, Zugang, AfA, Buchung oder deutscher Finalnachweis verwenden. Der naechste Screenshot muss die behaupteten Werte selbst sichtbar zeigen. |

## `FIXEDASSETS-027` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-027-030-fa-class-code-lookup.png` | Labor-Wertbild mit Auto-Number-Grenze | Der Lookup zeigt `TANGIBLE`, `FINANCIAL` und `INTANGIBLE`. Gleichzeitig ist oben die automatisch erzeugte Nummer `FA000110` sichtbar. | Als Lernbild fuer auswaehlbare Anlagenklassen geeignet, aber nicht als No-Save- oder `FA-CNC-01`-Speicherbild verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-027-040-fa-subclass-code-lookup.png` | Labor-Wertbild mit Auto-Number-Grenze | Der Lookup zeigt u. a. `EQUIPMENT`, `VEHICLE` und `COMPUTER`. Gleichzeitig gehoert das Bild zum automatisch erzeugten Entwurf `FA000110`. | Als Lernbild fuer Unterklassen nutzbar; naechster Save-Gate-Lauf muss entscheiden, welcher Wert fuer `FA-CNC-01` fachlich korrekt ist. |
| `playwright/projects/fibu-book5/img/fixedassets-027-050-depreciation-book-code-lookup.png` | gutes Labor-Wertbild, nicht final | Der Lookup zeigt `COMPANY` und `HGB` inklusive Beschreibung `HGB depreciation book`. | Als Buch-/Lernbild fuer AfA-Buch-Auswahl geeignet, aber nicht als gespeicherte Zielanlage, deutscher HGB-Endstand oder Buchungsnachweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-027-060-posting-group-lookup.png` | gutes Labor-Wertbild, nicht final | Der Lookup zeigt `MACHINES` und `EQUIPMENT`. | Als Buch-/Lernbild fuer Anlagenbuchungsgruppen-Auswahl geeignet; kein deutscher Kontenplan-Endstand und kein Save-Gate. |
| `playwright/projects/fibu-book5/img/fixedassets-027-097-card-delete-confirmation.png` | Cleanup-/Fehlerlernfall | Der Dialog `FA000110 loeschen?` zeigt, dass der vermeintliche Preflight bereits einen Auto-Number-Entwurf erzeugt hatte. | Als Lernbild fuer Cleanup und Auto-Number-Falle behalten; nicht als Prozess- oder Buchungsbild verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-027-100-cleanup-after-filter.png` | Support-Evidence, nicht alleinstehend | Das Bild zeigt eine leere Fixed-Assets-Liste mit aktivem Filter, aber der konkrete Filterwert `FA000110` ist im Bild selbst nicht sichtbar. | Nicht als alleinstehendes Buchbild verwenden. Nur zusammen mit `100-auto-number-draft-cleanup-coordinate-result.json` und dem Cleanup-Text als Bereinigungsnachweis einsetzen. |

## `FIXEDASSETS-029-EXISTING` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-029-existing-asset-readonly-010-filtered-list.png` | Stop-/Kontext-Evidence | Die gefilterte Fixed-Assets-Liste zeigt `FA-CNC-01` als vorhandenen Code. | Als Nachweis geeignet, dass der Zielcode existiert und nicht blind neu angelegt werden darf. Nicht als fertiger Anlagenstamm verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-029-existing-asset-readonly-020-existing-card-readonly.png` | Error-/Learning-Bild, kein Zielbild | Die Karte zeigt `No. = FA-CNC-01`, aber Beschreibung, Klasse/Unterklasse, AfA-Buch, Posting Group und AfA-Daten sind leer beziehungsweise `0,00`. | Als Lernbild fuer "Code vorhanden, Stammdaten fachlich unvollstaendig" geeignet. Nicht als Buchbild fuer fertige Anlage, Zugang, AfA, Setup-Fit oder deutschen Finalnachweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-031-020-card-before-correction.png` | Vorher-/Learning-Bild | Die Karte zeigt `FA-CNC-01` vor der Korrektur; `HGB`/`MACHINES` und weitere Zielwerte sind noch nicht passend sichtbar. | Als Vorherbild fuer die bestehende unvollstaendige Anlage geeignet. Nicht als fertiger Anlagenstamm, Zugang, AfA oder deutscher Finalnachweis verwenden. |
| `playwright/projects/fibu-book5/img/fixedassets-031-040-card-after-correction.png` | guter Labor-Teilnachweis, kein vollstaendiges Zielbild | Die Karte zeigt `FA-CNC-01`, `Depreciation Book Code = HGB`, `Posting Group = MACHINES` und `Book Value = 0,00`. Beschreibung, Klasse/Unterklasse, AfA-Jahre und AfA-Daten sind nicht fit. | Als Buch-/Lernbild fuer Teilfit und Blocker geeignet. Nicht als buchungsreife Anlage verwenden; der naechste Lauf muss die verbleibenden Feld-/Save-Blocker klaeren. |

## `P2P-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/p2p-001-010-vendor-k10000.png` | brauchbares Laborbild mit Stoerer | Vendor Card zeigt `K10000`, Name, Adresse, Country/Region Code `DE`, Zahlungsbedingungen und offene Betragswerte. Unten links ist noch der Teaching Tip `About vendor details` sichtbar. | Als Readiness-Laborbild geeignet; fuer finale Buchbilder Teaching Tip schliessen und Invoicing-/Posting-Felder gezielt aufklappen. |
| `playwright/projects/fibu-book5/img/p2p-001-020-item-raw-steel.png` | gutes Labor-Setupbild | Item Card zeigt `RAW-STEEL`, `PCS`, `Inventory`, `Unit Cost = 2.500,00`, `Costing Method = FIFO`, `Gen. Prod. Posting Group = RETAIL`, `Tax Group Code = FURNITURE`, `Inventory Posting Group = RESALE`. | Als Laborbild fuer RAW-STEEL-Readiness geeignet. Nicht als deutscher Rohmaterial-/VAT-Endstand verwenden. |
| `playwright/projects/fibu-book5/img/p2p-001-090-purchase-order-before-preview.png` | gutes Labor-Prozessbild | Purchase Order `106049` zeigt `K10000`, Zeile `RAW-STEEL`, Menge `10`, `Direct Unit Cost = 2.500`, `Tax Group Code = FURNITURE`, Summe `25.000` und `Total Tax = 0`. | Als Laborbild fuer Bestellung vor Preview geeignet. Nicht als deutsches EUR-/Vorsteuerbild verwenden. |
| `playwright/projects/fibu-book5/img/p2p-001-095-preview-posting.png` | guter Labor-Preview-Nachweis | `Posting Preview` zeigt echte Vorschauarten: `G/L Entry`, `Vendor Ledger Entry`, `Detailed Vendor Ledg. Entry`, `Item Ledger Entry`, `Value Entry`. | Als Laborbild fuer sichere Vorabpruefung vor P2P-Buchung geeignet. |
| `playwright/projects/fibu-book5/img/p2p-001-100-posting-dialog-before-ok.png` | wichtiger Labor-Buchungsnachweis | Normaler Buchungsdialog vor OK; `Receive and Invoice` wurde bewusst ausgewaehlt. | Als Evidence fuer kontrolliertes P2P-Buchen geeignet. Nicht erneut ausfuehren. |
| `playwright/projects/fibu-book5/img/p2p-001-110-posted-purchase-invoice.png` | guter Laborbeleg | Gebuchte Einkaufsrechnung `108219` zeigt `K10000`, `RAW-STEEL`, Menge `10`, Kosten/Betrag und Tax-0-%-Laborgrenze. | Als Laborbild fuer gebuchte Einkaufsrechnung geeignet. Kein deutscher Vorsteuer-Endstand. |
| `playwright/projects/fibu-book5/img/p2p-001-120-vendor-ledger-entries.png` | guter Labor-Postennachweis | Gefilterte Kreditorenposten zur Rechnung `108219` sind sichtbar. | Als Laborbild fuer Verbindlichkeit geeignet; Zahlung/Ausgleich fehlen noch. |
| `playwright/projects/fibu-book5/img/p2p-001-130-gl-entries.png` | guter Labor-Postennachweis | Sachposten zeigen `22100 Accounts Payable, Domestic`, `14140 Resale Items` und Betrag `25.000`. | Als Laborbild fuer Kontenwirkung geeignet. Nicht als deutscher Kontenplan-Endstand verwenden. |
| `playwright/projects/fibu-book5/img/p2p-001-140-item-ledger-entries.png` | verworfener direkter Artikelposten-Check | Page `38` blieb mit Filter `Order No. = 106049` leer. | Nicht als Artikelpostenbeweis verwenden; der belastbare Nachweis erfolgt ueber `Value Entry -> Item Ledger Entry No. = 793`. |
| `playwright/projects/fibu-book5/img/p2p-001-150-value-entries.png` | guter Labor-Postennachweis | Wertposten zeigt `RAW-STEEL`, `K10000`, Kosten `25.000` und `Item Ledger Entry No. = 793`. | Als Laborbild fuer Wertposten und Bruecke zum Artikelposten geeignet. |
| `playwright/projects/fibu-book5/img/p2p-001-155-item-ledger-entry-by-entry-no.png` | guter Labor-Artikelposten-Nachweis | Artikelposten `793` zeigt `RAW-STEEL`, Lagerort `FRA-ZL`, Menge `10` und Kostenbezug. | Als Laborbild fuer Artikelzugang geeignet; `PRODUCTLINE=MACHINE` ist in der P2P-Postenspur noch nicht sichtbar. |

## `INVENTORY-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-001-010-o2c-item-ledger-entry-rm-m100.png` | guter Labor-Artikelposten-Nachweis | Breite Layoutansicht zeigt Artikelposten `792` mit `RM-M100`, `FRA-ZL`, Menge `-1`, Sales Amount `67.673,60` und Cost Amount `-42.000,00`; Teaching Tip ist geschlossen. | Als Buchkandidat fuer die Rolle von Artikelposten geeignet. Kein deutscher Steuer-/Kontenplan-Endstand. |
| `playwright/projects/fibu-book5/img/inventory-001-020-o2c-value-entry-rm-m100.png` | guter Labor-Wertposten-Nachweis | Wertposten zur Rechnung `PS-INV103297` zeigen `RM-M100` und die Bruecke zu `Item Ledger Entry No. 792`. | Als Buchkandidat fuer die Bruecke Wertposten -> Artikelposten geeignet. |
| `playwright/projects/fibu-book5/img/inventory-001-030-o2c-gl-entries-inventory-cogs.png` | guter Labor-Sachposten-Nachweis | Sachposten zur O2C-Rechnung zeigen u. a. `14140` und O2C-Kontenwirkung. | Als Laborbild fuer Hauptbuchwirkung geeignet; keine deutsche Kontenplan-Evidence. |
| `playwright/projects/fibu-book5/img/inventory-001-040-p2p-item-ledger-entry-raw-steel.png` | guter Labor-Artikelposten-Nachweis | Breite Layoutansicht zeigt Artikelposten `793` mit `RAW-STEEL`, `FRA-ZL`, Menge `10` und Kostenbezug. | Als Buchkandidat fuer Wareneingang/Artikelzugang geeignet; Warehouse bleibt offen. |
| `playwright/projects/fibu-book5/img/inventory-001-050-p2p-value-entry-raw-steel.png` | guter Labor-Wertposten-Nachweis | Wertposten zur Einkaufsrechnung `108219` zeigen `RAW-STEEL`, Menge/Kosten und die Bruecke zu `Item Ledger Entry No. 793`. | Als Buchkandidat fuer Bewertung der Einkaufsbewegung geeignet. |
| `playwright/projects/fibu-book5/img/inventory-001-060-p2p-gl-entries-inventory-ap.png` | guter Labor-Sachposten-Nachweis | Breite Layoutansicht zeigt Sachposten zur Einkaufsrechnung `108219`, darunter `22100` und `14140` mit `25.000`. | Als Laborbild fuer Bestand/Kreditorenwirkung geeignet; kein deutscher Kontenplan-Endstand. |
| `playwright/projects/fibu-book5/img/inventory-001-070-item-card-rm-m100.png` | brauchbares Labor-Stammdatenbild | Item Card `RM-M100` zeigt Artikelkontext und Werte fuer O2C; breite Layoutansicht ist aktiv, aber Kartenbilder sind weniger tabellenkritisch. | Als Kontextbild nutzbar, falls das Buch Artikelkarte und Bewegungsfolge verbindet. |
| `playwright/projects/fibu-book5/img/inventory-001-080-item-card-raw-steel.png` | brauchbares Labor-Stammdatenbild | Item Card `RAW-STEEL` zeigt Artikelkontext fuer P2P/Inventory. | Als Kontextbild nutzbar; nicht als finaler Rohmaterial-/VAT-Endstand. |
| `playwright/projects/fibu-book5/img/inventory-001-090-location-fra-zl.png` | guter Labor-Lagerortnachweis | Location `FRA-ZL` ist sichtbar; der Lauf aktiviert keine Warehouse-Logik. | Als Nachweis fuer einfachen Lagerort geeignet; gesteuertes Warehouse bleibt eigener Block. |
| `playwright/projects/fibu-book5/img/inventory-001-100-inventory-valuation-tell-me.png` | Einstieg, kein Zahlenbeweis | Tell-Me zeigt `Inventory Valuation` unter `Berichte und Analysen`. | Nur als Navigations-/Einstiegsbild verwenden. Konkrete Lagerbewertungszahlen brauchen `INVENTORY-002`. |

## `INVENTORY-002` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-002-020-inventory-valuation-request.png` | gutes Labor-Request-Page-Bild | Dialog `Inventory Valuation` zeigt `As Of Date = 08.06.2026`, `No. = RM-M100|RAW-STEEL`, `Location Filter = FRA-ZL` und die Aktion `Vorschau`. Der Hintergrund ist das Role Center; das ist fuer Report-Request-Pages normal. | Als Buchkandidat fuer Berichtseinstieg und Filterlogik geeignet. Nicht als Ergebnisbild verwenden. |
| `playwright/projects/fibu-book5/img/inventory-002-030-inventory-valuation-preview.png` | guter Labor-Zahlenbericht | Vorschau zeigt `RAW-STEEL` mit `25.000,00`, `RM-M100` mit `-42.000,00` und `Total Inventory Value = -17.000,00`; Filterkontext und Stichtag sind oben sichtbar. | Als Laborbild fuer Lagerbewertung geeignet. Buchtext muss negative RM-M100-Menge/Wert als Laborbefund erklaeren; kein deutscher Abschluss- oder Kontenplan-Endstand. |

## `INVENTORY-005` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-005-010-item-journal-direct.png` | guter Labor-Readiness-Kandidat | Page `40` zeigt `Item Journals`, Batch Name, `Post` sowie Zeilenfelder wie Posting Date, Entry Type, Document No., Item No., Location Code, Quantity, Unit Cost und Applies-to Entry. FactBox ist eingeklappt, breite Layoutansicht ist aktiv. Eine leere/default Tabellenzeile ist sichtbar, aber kein Zielartikel `RM-M100`. | Als Buch-/Lernbild fuer den kontrollierten Einstieg in positive Bestandsbewegungen geeignet. Nicht als Buchungsnachweis verwenden: keine Zielzeile, keine Preview-Wirkung, keine Postenspur. |
| `playwright/projects/fibu-book5/img/inventory-005-020-item-journals-tell-me.png` | Navigationsbild | Tell-Me wurde mit `Item Journals` genutzt und zeigt den Einstieg ohne Enter-Fallback. | Als Navigationsbild nutzbar, wenn das Buch die Suche erklaert. Der technische Folgeprozess sollte weiterhin die belegte Page-ID oder einen eindeutig gewaehlten Treffer nutzen. |

## `INVENTORY-006` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-006-010-target-journal-line-before-post.png` | guter Labor-Draft-Kandidat | Breite Layoutansicht zeigt `Item Journals` mit Zielzeile `INV006-*`, Posting Date `08.06.2026`, `RM-M100`, `Standardmaschine M100`, `FRA-ZL`, Menge `2` und `PCS`. Unit Amount/Amount/Unit Cost liegen weiter rechts und sind in `010-target-journal-line-controls.json` belegt. | Als Lernbild fuer den kontrollierten Journal-Draft geeignet. Nicht als Buchungs- oder Bestandsnachweis verwenden: keine Preview Posting, keine Postenspur, keine Lagerbewertungskorrektur, Cleanup danach erfolgt. |

## `INVENTORY-007` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-007-010-journal-check-no-issues.png` | guter Labor-Preflight-Kandidat | Item Journals zeigt die Zielzeile `RM-M100`, `FRA-ZL`, Menge `2`; die rechte FactBox bleibt bewusst sichtbar und zeigt `Journal Check` mit `1 Lines checked`, `0 Lines with issues`, `0 Issues Total` und `No issues found`. Unit Amount/Amount/Unit Cost sind zusaetzlich in `010-journal-check-controls.json` belegt. | Als Lernbild fuer den nicht buchenden Preflight vor einer positiven Bestandsbewegung geeignet. Nicht als Buchungs-, Posten- oder Lagerbewertungsnachweis verwenden; keine deutsche Final-Evidence. |

## `INVENTORY-008` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-008-010-journal-line-before-post.png` | guter Labor-Preposting-Kandidat | Item Journals zeigt die Zielzeile `INV008-899959` mit `RM-M100`, `FRA-ZL`, Menge `2`; die Evidence belegt Unit Amount/Amount/Unit Cost `42.000,00`/`84.000,00` und Journal Check ohne sichtbare Issues fuer die aktuelle Zeile. | Als Buch-/Lernbild fuer die letzte Kontrolle vor der Laborbuchung geeignet. Nicht als Postenspur oder Bestandsergebnis verwenden. |
| `playwright/projects/fibu-book5/img/inventory-008-030-post-confirm-dialog.png` | wichtiger Labor-Buchungsnachweis | Zeigt den normalen Buchungsdialog vor der genau einmaligen Bestaetigung der Item-Journal-Zeile. | Als Evidence fuer bewusste Laborbuchung geeignet; nicht erneut ausfuehren, kein deutsches Finalbild. |
| `playwright/projects/fibu-book5/img/inventory-008-040-post-result.png` | Labor-Ergebnisbild | Zustand nach der Bestaetigung; die belastbare Buchungswahrheit steht in `INVENTORY-008-POSTING-result.json` und den Postenbildern. | Als Kontextbild behalten; fuer Buchtext mit Artikelposten/Wertposten/Sachposten kombinieren. |
| `playwright/projects/fibu-book5/img/inventory-008-050-item-ledger-entry.png` | guter Labor-Artikelposten-Nachweis | Gefilterte Artikelposten zur Belegnummer `INV008-899959` zeigen `RM-M100`, `FRA-ZL`, Menge `2` und Wertbezug. | Als Buchkandidat fuer Mengenwirkung einer positiven Artikeljournalbuchung geeignet; keine deutsche Final-Evidence. |
| `playwright/projects/fibu-book5/img/inventory-008-060-value-entry.png` | guter Labor-Wertposten-Nachweis | Wertposten zur Belegnummer zeigen `RM-M100`, Menge `2`, Kostenbetrag `84.000` und Unit Cost `42.000`. | Als Buchkandidat fuer Bewertungswirkung geeignet; nicht als Kostenregulierung oder Reporting-Summe ausgeben. |
| `playwright/projects/fibu-book5/img/inventory-008-070-gl-entry.png` | guter Labor-Sachposten-Nachweis | Sachposten zur Belegnummer zeigen Konto `14140` und Betrag `84.000`. | Als Laborbild fuer Hauptbuchwirkung geeignet; kein deutscher Kontenplan-Endstand. |
| `playwright/projects/fibu-book5/img/inventory-008-090-inventory-valuation-request.png` | gutes Labor-Request-Page-Bild | Request Page zeigt Stichtag, Artikelfilter `RM-M100|RAW-STEEL` und Lagerortfilter `FRA-ZL`. | Als Buchbild fuer Reportfilter geeignet; Ergebniswirkung erst mit Preview-Bild. |
| `playwright/projects/fibu-book5/img/inventory-008-091-inventory-valuation-preview.png` | guter Labor-Zahlenbericht nach Korrektur | Vorschau zeigt nach der Laborbuchung `RM-M100 = 42.000,00`, `RAW-STEEL = 25.000,00` und `Total Inventory Value = 67.000,00`. | Als Laborbild fuer die korrigierte Lagerbewertung geeignet. Nicht als deutscher Abschluss- oder Kostenregulierungsnachweis verwenden. |

## `WAREHOUSE-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/warehouse-001-010-location-fra-zl.png` | guter Labor-Readiness-Kandidat | `FRA-ZL` ist als Lagerort sichtbar. Die Evidence markiert Warehouse-Aktivierungsfelder wie `Bin Mandatory`, `Require Receive`, `Require Shipment`, `Require Put-away`, `Require Pick` und `Directed Put-away and Pick` als nicht sichtbar. | Als Laborbild fuer die Trennung einfacher Lagerort vs. gesteuertes Warehouse geeignet. Kein Warehouse-Setup-Endstand. |
| `playwright/projects/fibu-book5/img/warehouse-001-020-warehouse-receipts-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Warehouse Receipts` als Einstiegspfad. | Als Einstiegshinweis geeignet; kein Wareneingangsprozess und kein Belegnachweis. |
| `playwright/projects/fibu-book5/img/warehouse-001-030-warehouse-putaways-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Warehouse Put-aways` als Einstiegspfad. | Als Einstiegshinweis geeignet; keine Einlagerung erzeugt oder registriert. |
| `playwright/projects/fibu-book5/img/warehouse-001-040-warehouse-picks-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Warehouse Picks` als Einstiegspfad. | Als Einstiegshinweis geeignet; keine Kommissionierung erzeugt oder registriert. |
| `playwright/projects/fibu-book5/img/warehouse-001-050-warehouse-shipments-tell-me.png` | rejected/Teilbefund | `Warehouse Shipments` wurde in diesem Lauf nicht belastbar sichtbar erreicht. | Nicht als Buchbild fuer Warenausgang verwenden; als Negativbefund fuer Suchpfad behalten. |
| `playwright/projects/fibu-book5/img/warehouse-001-060-bins-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Bins`/Lagerplatzkontext als Einstiegspfad. | Als Einstiegshinweis geeignet; keine Bins angelegt und keine Lagerplatzpflicht aktiviert. |

## `MANUFACTURING-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/manufacturing-001-010-planning-worksheet-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Planning Worksheet` als Einstieg in Planung. | Als Readiness-Bild fuer Kapitel 14 geeignet. Kein Plan berechnet und kein Fertigungsauftrag erzeugt. |
| `playwright/projects/fibu-book5/img/manufacturing-001-020-production-boms-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Production BOMs` als Einstieg fuer Materialstruktur. | Als Voraussetzungshinweis geeignet. Keine BOM `BOM-RM-M100` angelegt oder geoeffnet. |
| `playwright/projects/fibu-book5/img/manufacturing-001-030-routings-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Routings` als Einstieg fuer Arbeitsplaene. | Als Voraussetzungshinweis geeignet. Kein Routing `ROUTE-M100` angelegt oder geoeffnet. |
| `playwright/projects/fibu-book5/img/manufacturing-001-040-released-production-orders-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Released Production Orders` als spaeteren Prozessort. | Als Einstiegshinweis geeignet. Kein Fertigungsauftrag `PROD-3001` erzeugt. |
| `playwright/projects/fibu-book5/img/manufacturing-001-050-consumption-journal-tell-me.png` | gesperrter Buchungsort | Tell-Me zeigt `Consumption Journal` als Verbrauchsbuchblatt. | Nur als Lernbild verwenden: dieser Ort ist buchungsrelevant und bleibt ohne Gate gesperrt. |
| `playwright/projects/fibu-book5/img/manufacturing-001-060-output-journal-tell-me.png` | gesperrter Buchungsort | Tell-Me zeigt `Output Journal` als Istmeldungs-/Output-Buchblatt. | Nur als Lernbild verwenden: Output erzeugt Bestands-/Kostenwirkung und bleibt ohne Gate gesperrt. |
| `playwright/projects/fibu-book5/img/manufacturing-001-070-assembly-orders-tell-me.png` | rejected/Teilbefund | `Assembly Orders` wurde in diesem Lauf nicht belastbar sichtbar erreicht. | Nicht als Montagepfad-Buchbild verwenden; als Suchpfad-Luecke behalten. |
| `playwright/projects/fibu-book5/img/manufacturing-001-080-item-rm-m100.png` | Labor-Readiness-Kandidat | Artikel `RM-M100` ist sichtbar; BOM-/Routing-/Manufacturing-Marker sind im Seitentext nicht nachgewiesen. | Als Zielartikel-Bild geeignet, aber nicht als Fertigungsfaehigkeitsnachweis. |
| `playwright/projects/fibu-book5/img/manufacturing-001-090-item-raw-steel.png` | Labor-Readiness-Kandidat | Artikel `RAW-STEEL` ist sichtbar; keine Produktionsverbrauchsbuchung. | Als Materialartikel-Bild geeignet, aber nicht als Verbrauchsnachweis. |
| `playwright/projects/fibu-book5/img/manufacturing-001-100-item-comp-ctrl.png` | rejected Datenluecke | `COMP-CTRL` ist im gefilterten Artikelkontext nicht sichtbar. | Als Datenlueckenbild geeignet; nicht ins Buch als vorhandene Komponente aufnehmen. |
| `playwright/projects/fibu-book5/img/manufacturing-001-110-item-kit-maint.png` | rejected Datenluecke | `KIT-MAINT` ist im gefilterten Artikelkontext nicht sichtbar. | Als Datenlueckenbild geeignet; nicht ins Buch als vorhandenen Montageartikel aufnehmen. |

## `PAYMENTS-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/payments-001-010-customer-ledger-entry-ps-inv103297.png` | guter Labor-Readiness-Kandidat | Customer Ledger Entries ist auf `Document No. = PS-INV103297` gefiltert und zeigt Debitor `D10000`, EUR, Faelligkeits-/Skontokontext sowie FactBox-/Related-Entries-Kontext. Restbetrag/Open-Logik ist in Seitentext/JSON belegt, liegt im aktuellen Bild aber nicht als eigene Restbetragsspalte im sichtbaren Ausschnitt. Teaching Tips werden vor dem Screenshot gezielt geschlossen. | Als Lernbild fuer den Start von Zahlungseingang/OP-Ausgleich geeignet. Nicht als Zahlungs-, Ausgleichs- oder Banknachweis verwenden. Fuer finale Buchbilder ggf. horizontal auf Restbetrag/Open-Spalten scrollen. |
| `playwright/projects/fibu-book5/img/payments-001-020-vendor-ledger-entry-108219.png` | guter Labor-Readiness-Kandidat | Vendor Ledger Entries ist auf `Document No. = 108219` gefiltert und zeigt Kreditor `K10000`, Faelligkeits-/Skontokontext und Related G/L Entries. Restbetrag/Open-Logik ist in Seitentext/JSON belegt, liegt im aktuellen Bild aber nicht als eigene Restbetragsspalte im sichtbaren Ausschnitt. Teaching Tips werden vor dem Screenshot gezielt geschlossen. | Als Lernbild fuer den Start von Zahlungsausgang/OP-Ausgleich geeignet. Nicht als Zahlungs-, Ausgleichs- oder Banknachweis verwenden. Fuer finale Buchbilder ggf. horizontal auf Restbetrag/Open-Spalten scrollen. |

## `PAYMENTS-002` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/payments-002-010-bank-accounts.png` | guter Labor-Blocker-Nachweis | Bank Accounts zeigt vorhandene CRONUS-Bankkonten `CHECKING` und `SAVINGS` mit Balance; Zielbankkonto `BANK-RM-01` ist nicht sichtbar. | Als Lernbild fuer Bankkonto-Readiness geeignet. Nicht als Nachweis fuer Rhein-Main-Zielbankkonto verwenden; naechster Schritt ist Bankkonto-Fit oder bewusste Laborersatz-Entscheidung. |
| `playwright/projects/fibu-book5/img/payments-002-020-cash-receipt-journal.png` | guter Labor-Readiness-Kandidat | Cash Receipt Journals zeigt Batch `GENERAL`, eine leere/default Journalzeile, zentrale Felder, `Post`, `Apply Entries` und Journal Check. Der Test hat keine Zahlungswerte eingetragen. | Als Buch-/Lernbild fuer Zahlungseingangs-Journalort geeignet. Nicht als Zahlungs- oder Ausgleichsnachweis verwenden. |
| `playwright/projects/fibu-book5/img/payments-002-030-payment-journal.png` | guter Labor-Readiness-Kandidat | Payment Journals zeigt Batch `CASH`, eine leere/default Journalzeile mit Document Type `Payment`, `Post`, `Apply Entries`, `Reconcile` und Journal Check. Der Test hat keine Zahlungswerte eingetragen. | Als Buch-/Lernbild fuer Zahlungsausgangs-Journalort geeignet. Nicht als Zahlungs- oder Ausgleichsnachweis verwenden. |
| `playwright/projects/fibu-book5/img/payments-002-050-customer-apply-entries.png` | Labor-Pfadnachweis | Apply Entries wurde aus dem Debitorenpostenkontext erreicht; der Lauf klickt keine Ausgleichs-/Buchungsaktion. | Als Lernbild fuer den Unterschied zwischen Pfad oeffnen und Ausgleich anwenden geeignet. Kein OP-Ausgleichsnachweis. |
| `playwright/projects/fibu-book5/img/payments-002-070-vendor-apply-entries.png` | Labor-Pfadnachweis | Apply Entries wurde aus dem Kreditorenpostenkontext erreicht; der Lauf klickt keine Ausgleichs-/Buchungsaktion. | Als Lernbild fuer den Unterschied zwischen Pfad oeffnen und Ausgleich anwenden geeignet. Kein OP-Ausgleichsnachweis. |

## `PAYMENTS-003` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/payments-003-010-bank-accounts-bank-rm-01-fit.png` | guter Labor-Setup-Nachweis | Bank Accounts zeigt `BANK-RM-01` nach idempotenter Anlage per BC-Standard-API neben den CRONUS-Bankkonten. | Als Buch-/Lernbild fuer Bankkonto-Readiness geeignet. Nicht als Zahlungs-, Ausgleichs-, Bankabstimmungs- oder deutscher Bank-Compliance-Nachweis verwenden. |

## `PAYMENTS-004` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/payments-004-010-cash-receipt-journal-readiness.png` | guter Labor-Readiness-Kandidat | Cash Receipt Journal ist in `RM-DEMO` sichtbar; Evidence bestaetigt Posting Date, Document Type/No., Account Type/No., Amount, Bal. Account, Apply Entries, Journal Check und `Post`. `Preview Posting` ist in diesem Lauf nicht sichtbar. | Als Lernbild fuer den Schritt zwischen offenen Debitorenposten und erster Zahlungsjournalzeile geeignet. Nicht als Zahlungs-, Ausgleichs-, Bankwirkungs- oder deutscher Compliance-Nachweis verwenden. |

## `PAYMENTS-005` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/payments-005-010-cash-receipt-ui-draft.png` | gutes Labor-Lernbild mit Fehlerhinweis | Cash Receipt Journal zeigt eine per UI vorbereitete Zahlungsjournalzeile mit Betrag, Gegenkonto `BANK-RM-01` und Rechnungsbezug `PS-INV103297`. Rechts ist Journal Check sichtbar und meldet `1 Issue Total`; Current line nennt die `Amount`-Validierung der `Gen. Journal Line`. | Als Buch-/Lernbild fuer den Unterschied zwischen sichtbarer Entwurfszeile und zahlungsreifem Journal geeignet. Nicht als Zahlungsfreigabe, Zahlungs-, Ausgleichs- oder Bankwirkungsnachweis verwenden. |

## `PAYMENTS-006` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/payments-006-010-cash-receipt-amount-validation.png` | gutes Labor-Lernbild fuer Journal Check / Setup-Blocker | Cash Receipt Journal zeigt den Entwurf mit Betrag `-67.673,60` in USD-Anzeige, Gegenkonto `BANK-RM-01`, Rechnungsbezug `PS-INV103297` und rechts `1 Issues Total`. Current line meldet: `Bank Account Posting Group` fehlt. | Als Buch-/Lernbild fuer Preflight und Bankkonto-Posting-Fit geeignet. Nicht als Zahlungsfreigabe, Zahlungs-, Ausgleichs-, Bankposten- oder deutscher Compliance-Nachweis verwenden. |
| `playwright/projects/fibu-book5/img/payments-007-010-bank-account-posting-group-fit.png` | gutes Labor-Setup-Lernbild | Bank Account Card `BANK-RM-01` zeigt den Posting-FastTab; `Bank Acc. Posting Group` ist im Labor auf `CHECKING` gefittet. | Als Buch-/Lernbild fuer Bankkonto-Posting-Fit geeignet. Nicht als deutscher Bank-/Kontenplan-/Compliance-Finalnachweis verwenden. |
| `playwright/projects/fibu-book5/img/payments-007-020-cash-receipt-journal-after-bank-fit.png` | gutes Labor-Preflight-Lernbild mit Folgefehler | Cash Receipt Journal zeigt `BANK-RM-01`, Rechnungsbezug `PS-INV103297`, Amount-LCY-Anzeige und rechts `Journal Check` mit `1 Issues Total`; der alte Bank-Posting-Group-Fehler ist weg, Current line nennt wieder Amount. | Als Buch-/Lernbild fuer die Trennung von Bankkonto-Fit und zahlungsreifer Journalzeile geeignet. Nicht als Zahlungsfreigabe, Zahlungs-, Ausgleichs- oder Bankwirkungsnachweis verwenden. |
| `playwright/projects/fibu-book5/img/payments-008-010-cash-receipt-amount-field-diagnosis.png` | gutes Labor-Preflight-Lernbild in breiter Ansicht | Cash Receipt Journal zeigt `Amount = -68.000,00`, `Amount ($) = -67.673,60`, `BANK-RM-01`, Rechnungsbezug `PS-INV103297` und rechts `Journal Check` mit `1 Lines checked`, `0 Lines with issues`, `0 Issues Total`, `No issues found`. | Als Buch-/Lernbild fuer Amount-vs.-Amount-LCY und nicht buchenden Journal-Check-Preflight geeignet. Nicht als Zahlungs-, Ausgleichs-, Bankposten- oder deutscher Compliance-Nachweis verwenden. |
| `playwright/projects/fibu-book5/img/payments-009-010-cash-receipt-apply-preview-readiness.png` | gutes Labor-Preflight-Lernbild in breiter Ansicht | Cash Receipt Journal zeigt den zahlungsreifen Draft mit `D10000`, `PS-INV103297`, `BANK-RM-01`, Betrag und rechts `Journal Check = 0 Issues`. | Als Lernbild fuer den Zustand vor Apply Entries geeignet. Nicht als Zahlungs-, Ausgleichs-, Bankposten- oder deutscher Compliance-Nachweis verwenden. |
| `playwright/projects/fibu-book5/img/payments-009-020-apply-entries-readonly.png` | gutes Laborbild fuer Apply-Readiness | Apply Entries wurde aus dem Cash-Receipt-Draft geoeffnet und zeigt Rechnungs-/Betragskontext, unter anderem `D10000`, `EUR`, `Amount to Apply` und `Remaining Amount`. Sichtbare Aktionen wie `Post`/`OK` wurden nicht ausgefuehrt. | Als Buch-/Lernbild fuer den Unterschied zwischen Ausgleichsbezug pruefen und Ausgleich buchen geeignet. Kein Zahlungs- oder OP-Ausgleichsnachweis. |
| `playwright/projects/fibu-book5/img/payments-010-010-cash-receipt-posting-readiness.png` | gutes Labor-Preflight-Lernbild in breiter Ansicht | Cash Receipt Journal zeigt den zahlungsreifen Draft mit `Journal Check = 0 Issues`, bevor der Post-Dialog geoeffnet wird. | Als Lernbild fuer die letzte nicht buchende Kontrolle vor dem Buchungsdialog geeignet. Nicht als Zahlungs-, Ausgleichs-, Bankposten- oder deutscher Compliance-Nachweis verwenden. |
| `playwright/projects/fibu-book5/img/payments-010-020-apply-entries-readonly.png` | brauchbares Laborbild fuer erneuten Apply-Kontext | Apply Entries wurde im PAYMENTS-010-Freigabecheck erneut read-only erreicht. | Als Wiederholungs-/Sicherheitsbild nutzbar, primaeres Apply-Lernbild bleibt `PAYMENTS-009-020`. Kein Zahlungs- oder OP-Ausgleichsnachweis. |
| `playwright/projects/fibu-book5/img/payments-010-030-post-dialog-before-cancel.png` | gutes Laborbild fuer Buchungsdialog-Risiko | Der Post-Bestaetigungsdialog zeigt `Ja`/`Nein`; der Test klickt danach `Nein`. | Als Buch-/Lernbild fuer den Unterschied zwischen `Post`-Dialog oeffnen und Zahlung wirklich bestaetigen geeignet. Kein Zahlungs-, Ausgleichs- oder Bankwirkungsnachweis. |
| `playwright/projects/fibu-book5/img/payments-011-020-cash-receipt-preflight.png` | gutes Labor-Preflight-Bild | Cash Receipt Journal zeigt `D10000`, `BANK-RM-01`, `PS-INV103297`, Betrag und `Journal Check = 0 Issues` vor der freigegebenen Laborbuchung. | Als Buch-/Lernbild fuer letzte Zahlungskontrolle geeignet. Nicht als Postenspur verwenden; die Buchung folgt erst nach Dialogbestaetigung. |
| `playwright/projects/fibu-book5/img/payments-011-040-post-confirm-dialog.png` | wichtiger Labor-Buchungsnachweis | Post-Dialog ist direkt vor der genau einmaligen Bestaetigung sichtbar. | Als Evidence fuer bewusste Laborbuchung geeignet. Nicht erneut ausfuehren; kein deutscher Finalnachweis. |
| `playwright/projects/fibu-book5/img/payments-011-060-customer-ledger-invoice-after-payment.png` | guter Labor-OP-Ausgleichsnachweis | Customer Ledger Entries zur Rechnung `PS-INV103297` zeigen im Seitentext `Remaining Amount = 0,00` und `Applied Entries = 1`. | Als Lernbild fuer ausgeglichene Rechnung geeignet; final in deutscher Umgebung neu erzeugen. |
| `playwright/projects/fibu-book5/img/payments-011-061-customer-ledger-payment.png` | guter Labor-Zahlungsbelegnachweis mit Skonto-Hinweis | Customer Ledger Entries zum Zahlungsbeleg `PAY011-PS103297` zeigen Betrag, Restbetrag und Related G/L Entries; CRONUS-Zahlungsbedingungen erzeugen eine Skonto-/Payment-Discount-Wirkung. | Als Lernbild fuer Zahlungsbeleg und Skonto geeignet; nicht als deutscher Bank-/Compliance-Finalnachweis verwenden. |
| `playwright/projects/fibu-book5/img/payments-011-062-detailed-customer-ledger-payment.png` | sehr gutes Labor-Lernbild fuer Ausgleich und Skonto | Detailed Customer Ledger Entries zeigen `Initial Entry`, `Payment Discount` und `Application`-Zeilen zur Zahlung. | Als Buch-/Lernbild fuer die fachliche Ausgleichswirkung geeignet. |
| `playwright/projects/fibu-book5/img/payments-011-063-bank-account-ledger-payment.png` | rejected Bank-Ledger-Pfad | Der getestete Page-371-Pfad liefert keinen belastbaren Bank Account Ledger Entries Kontext zur Zahlung. | Nicht als Bankpostenbild verwenden. Geloester Bankpostenpfad seit `PAYMENTS-013`: Page `372`, Screenshots `payments-013-020-*` und `payments-013-030-*`. |
| `playwright/projects/fibu-book5/img/payments-011-064-gl-entries-payment.png` | guter Labor-Sachpostennachweis | G/L Entries zur Zahlung zeigen `15110`, `18200` und `40910`; Bankwirkung ist indirekt ueber Konto `18200` und Gegenkonto `BANK-RM-01` sichtbar. | Als Lernbild fuer Hauptbuchwirkung geeignet; kein Bank Account Ledger Entry und kein deutscher Kontenplan-Endstand. |
| `playwright/projects/fibu-book5/img/payments-013-010-tell-me-bank-account-ledger.png` | guter Navigationskandidat | Tell-Me zeigt `Bank Account Ledger Entries` als Einstiegskandidat; der Treffer wurde nicht blind mit Enter geoeffnet. | Als Buchbild fuer die Suche nach Bankposten geeignet. Nicht als Postennachweis verwenden. |
| `playwright/projects/fibu-book5/img/payments-013-020-page-372-document-no.png` | guter Labor-Bankpostennachweis | Page `372` / Bank Account Ledger Entries ist auf `Document No. = PAY011-PS103297` gefiltert und zeigt `BANK-RM-01`, Betrag `67.673,60`, Entry No. `4995` und Related G/L Entries. | Als Buch-/Lernbild fuer Bankposten nach Zahlung geeignet. Keine Bankabstimmung und kein deutscher Finalnachweis. |
| `playwright/projects/fibu-book5/img/payments-013-030-page-372-bank-account-no.png` | guter Labor-Bankpostennachweis | Page `372` ist auf `Bank Account No. = BANK-RM-01` gefiltert und zeigt denselben Bankposten zur Zahlung. | Als alternatives Kontrollbild geeignet, wenn der Leser vom Bankkonto aus pruefen soll. Keine Bankabstimmung. |
| `playwright/projects/fibu-book5/img/payments-013-040-page-371-document-no-legacy.png` | rejected Altpfad | Page `371` zeigt keinen belastbaren Bank Account Ledger Entries Kontext zur Zahlung. | Nicht als Bankpostenbild verwenden; nur als Fehler-/Lernfall fuer falsche Page-ID dokumentieren. |

## `REPORTING-006` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-006-010-gl-entries-before-analysis.png` | brauchbarer Labor-Sachposten-Nachweis | Gefilterte `G/L Entries` zur gebuchten Verkaufsrechnung `PS-INV103297` sind sichtbar. Die Roh-Evidence belegt Konten/Betragskontext, aber keine sichtbaren `PRODUCTLINE`-/`CHANNEL`-Spalten. | Als Lernbild fuer Hauptbuchspur geeignet. Nicht als Reporting- oder Dimensionsauswertungsbild verwenden. |
| `playwright/projects/fibu-book5/img/reporting-006-020-gl-entries-after-analysis-attempt.png` | negativer Laborbefund | Nach dem kontrollierten Analyseversuch bleibt kein belastbarer Data-Analysis-/Analysemodus mit `PRODUCTLINE` oder `CHANNEL` sichtbar. | Als Evidence fuer den verworfenen G/L-Entries-Data-Analysis-Pfad behalten; kein finales Buchbild fuer Reportingwirkung. |

## `REPORTING-007` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-007-010-tell-me-analysis-by-dimensions.png` | brauchbarer Navigationsnachweis | Tell-Me findet den Suchpfad `Analysis by Dimensions`; `PRODUCTLINE`/`CHANNEL` sind in diesem Suchzustand nicht sichtbar. | Als Evidence fuer den geprueften Einstieg behalten. Nicht als Reportingwirkungsbild verwenden. |
| `playwright/projects/fibu-book5/img/reporting-007-020-analysis-by-dimensions-result.png` | rejected Negativbild | Nach dem Klickversuch ist kein belastbarer `Analysis by Dimensions`-Request-/Matrixkontext sichtbar; `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `Show Matrix` und Datumsfilter sind nicht nachgewiesen. | Nicht als Buchbild verwenden. Der Pfad bleibt ein Labor-Negativbefund; naechster Schritt braucht freigegebenen Analysis-View-Fit oder alternativen offiziellen Reporting-Einstieg. |

## `REPORTING-009` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-009-010-gl-entries-before-dimensions.png` | guter Labor-Sachposten-Nachweis in breiter Ansicht | Gefilterte `G/L Entries` zur `PS-INV103297` zeigen Konten `50110`, `40140`, `15110`, `14140`, EUR-Betraege sowie die Shortcut-Spalten `Department Code` und `Customergroup Code`. `PRODUCTLINE`/`CHANNEL` sind nicht sichtbar. | Als Buch-/Lernbild fuer Hauptbuchspur und Shortcut-Spalten geeignet. Nicht als Dimensions- oder Reportingwirkungsnachweis fuer `PRODUCTLINE`/`CHANNEL` verwenden. |
| `playwright/projects/fibu-book5/img/reporting-009-020-gl-entry-dimensions-result.png` | negativer Laborbefund | Nach `Weitere Optionen` bleibt kein sichtbarer `Entry` -> `Dimensions`-Dialog und kein `PRODUCTLINE`-/`CHANNEL`-Kontext sichtbar. | Als Evidence fuer den ausgeschlossenen einfachen Sachposten-Dimensionspfad behalten. Naechster Reporting-Schritt braucht freigegebenen Analysis-View-Fit oder alternativen offiziellen Reporting-Einstieg. |

## `SERVICE-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/service-001-010-service-orders-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Service Orders` als Einstieg. | Als Readiness-/Suchbild geeignet. Kein Serviceauftrag `SERV-4001` und kein Prozessnachweis. |
| `playwright/projects/fibu-book5/img/service-001-020-service-items-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Service Items`. | Als Einstieg fuer Serviceartikel geeignet. Der konkrete Serviceartikel `RM-M100-SN1001` ist dadurch noch nicht belegt. |
| `playwright/projects/fibu-book5/img/service-001-030-resources-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Resources`. | Als Einstieg fuer Ressourcen geeignet. Die konkrete Ressource `RES-TECH` ist dadurch noch nicht belegt. |
| `playwright/projects/fibu-book5/img/service-001-040-service-management-setup-tell-me.png` | gesperrter Setup-Ort | Tell-Me zeigt `Service Management Setup`. | Nur als Setup-Hinweis verwenden. Keine Serviceeinrichtung ohne Gate aendern. |
| `playwright/projects/fibu-book5/img/service-001-050-service-contracts-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Service Contracts`. | Als spaeterer Vertrags-/Garantie-Kontext geeignet. Kein Vertrag und keine Garantieentscheidung. |
| `playwright/projects/fibu-book5/img/service-001-060-service-ledger-entries-tell-me.png` | Nachweispfad-Kandidat | Tell-Me zeigt `Service Ledger Entries`. | Als spaeterer Postenspur-Hinweis geeignet. Keine Serviceposten vorhanden oder gebucht. |
| `playwright/projects/fibu-book5/img/service-001-070-customer-d10000.png` | guter Labor-Readiness-Kandidat | Gefilterter Customer-Kontext zeigt `D10000` / Mueller Maschinenbau. | Als Servicekunden-Readiness nutzbar. Kein Serviceauftrag und keine Servicefaktura. |
| `playwright/projects/fibu-book5/img/service-001-080-service-item-rm-m100-sn1001.png` | rejected Datenluecke | Service-Items-Seite ist sichtbar, aber die konkrete Zielnummer `RM-M100-SN1001` ist nicht sichtbar. | Nicht als Serviceartikel-Buchbild verwenden; als Stammdatenluecke behalten. |
| `playwright/projects/fibu-book5/img/service-001-090-item-sp-pump-01.png` | rejected Datenluecke | Items-Seite ist sichtbar, aber `SP-PUMP-01` ist nicht sichtbar. | Nicht als Ersatzteil-Buchbild verwenden; vor Serviceverbrauch braucht es UI-first Stammdatenfit. |
| `playwright/projects/fibu-book5/img/service-001-100-resource-res-tech.png` | rejected Datenluecke | Resources-Seite ist sichtbar, aber `RES-TECH` ist nicht sichtbar. | Nicht als Ressourcen-Buchbild verwenden; vor Technikerzeiterfassung braucht es UI-first Stammdatenfit. |
| `playwright/projects/fibu-book5/img/service-001-110-location-van-serv.png` | rejected Datenluecke | Locations-Seite ist sichtbar, aber `VAN-SERV` ist nicht sichtbar. | Nicht als Technikerlager-Buchbild verwenden; vor Ersatzteilverbrauch braucht es Lagerort-Readiness. |

## `PROJECTS-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/projects-001-010-projects-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Projects`/Project-Kontext als Einstieg. | Als Readiness-/Suchbild geeignet. Kein Projekt `PROJ-5001` und kein Prozessnachweis. |
| `playwright/projects/fibu-book5/img/projects-001-020-project-planning-lines-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Project Planning Lines`. | Als Einstieg fuer Projektplanzeilen geeignet. Keine Planzeile fuer `RES-TECH` oder `SP-SENSOR-02`. |
| `playwright/projects/fibu-book5/img/projects-001-030-project-journals-tell-me.png` | gesperrter Buchungsort | Tell-Me zeigt `Project Journals`. | Nur als spaeteren Journal-Ort verwenden. Kein Projektjournal ohne Gate anlegen oder buchen. |
| `playwright/projects/fibu-book5/img/projects-001-040-project-ledger-entries-tell-me.png` | Nachweispfad-Kandidat | Tell-Me zeigt `Project Ledger Entries`. | Als spaeterer Postenspur-Hinweis geeignet. Keine Projektposten vorhanden oder gebucht. |
| `playwright/projects/fibu-book5/img/projects-001-050-project-statistics-tell-me.png` | Kontrollbericht-Kandidat | Tell-Me zeigt `Project Statistics`. | Als spaeteren Kontrollbericht erklaeren. Keine Projektstatistik fuer `PROJ-5001`. |
| `playwright/projects/fibu-book5/img/projects-001-060-project-wip-tell-me.png` | gesperrter WIP-Kontext | Tell-Me zeigt `Project WIP`. | Nur als WIP-Hinweis verwenden. Keine WIP-Berechnung oder WIP-Buchung ohne Gate. |
| `playwright/projects/fibu-book5/img/projects-001-070-project-proj-5001.png` | rejected Datenluecke | Projects/Jobs-Kontext ist sichtbar, aber `PROJ-5001` ist nicht sichtbar. | Nicht als Projektkarte verwenden; als Stammdatenluecke behalten. |
| `playwright/projects/fibu-book5/img/projects-001-080-customer-d10000.png` | guter Labor-Readiness-Kandidat | Gefilterter Customer-Kontext zeigt `D10000` / Mueller Maschinenbau. | Als Projektkunden-Readiness nutzbar. Kein Projekt und keine Projektfaktura. |
| `playwright/projects/fibu-book5/img/projects-001-090-resource-res-tech.png` | rejected Datenluecke | Resources-Seite ist sichtbar, aber `RES-TECH` ist nicht sichtbar. | Nicht als Ressourcen-Buchbild verwenden; vor Projektzeit braucht es UI-first Stammdatenfit. |
| `playwright/projects/fibu-book5/img/projects-001-100-item-sp-sensor-02.png` | rejected Datenluecke | Items-Seite ist sichtbar, aber `SP-SENSOR-02` ist nicht sichtbar. | Nicht als Projektmaterial-Buchbild verwenden; vor Projektverbrauch braucht es UI-first Artikel-/Posting-Fit. |
| `playwright/projects/fibu-book5/img/projects-001-110-location-proj-lag.png` | rejected Datenluecke | Locations-Seite ist sichtbar, aber `PROJ-LAG` ist nicht sichtbar. | Nicht als Projektlager-Buchbild verwenden; vor Projektmaterialverbrauch braucht es Lagerort-Readiness. |

## `DROPSHIPPING-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/dropshipping-001-010-sales-orders-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Sales Orders` als Einstieg. | Als Readiness-/Suchbild geeignet. Kein Verkaufsauftrag `DS-24001` und kein Dropshipping-Prozessnachweis. |
| `playwright/projects/fibu-book5/img/dropshipping-001-020-purchase-orders-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Purchase Orders`. | Als spaeterer Einkaufsbeleg-Einstieg geeignet. Keine Bestellung an `K20000`. |
| `playwright/projects/fibu-book5/img/dropshipping-001-030-requisition-worksheets-tell-me.png` | Navigationskandidat | Tell-Me zeigt `Requisition Worksheets`. | Als moeglicher Beschaffungs-/Verknuepfungspfad geeignet. Keine Worksheet-Aktion. |
| `playwright/projects/fibu-book5/img/dropshipping-001-040-drop-shipments-tell-me.png` | rejected Navigation | `Drop Shipments` wurde in diesem Lauf nicht stabil als Treffer sichtbar. | Nicht als Drop-Shipment-Einstiegsbild verwenden; alternativen BC-Standardpfad ueber Purchasing Code/Bestellvorschlag pruefen. |
| `playwright/projects/fibu-book5/img/dropshipping-001-050-purchasing-codes-tell-me.png` | Setup-Kandidat | Tell-Me zeigt `Purchasing Codes`. | Als spaeterer Setup-/Pruefpfad geeignet. Keine Einrichtung ohne Gate aendern. |
| `playwright/projects/fibu-book5/img/dropshipping-001-060-customer-d11000.png` | rejected Datenluecke | Customers-Seite ist sichtbar, aber `D11000` ist nicht sichtbar. | Nicht als Debitor-Buchbild verwenden; vor `DS-24001` braucht es UI-first Debitor-Fit. |
| `playwright/projects/fibu-book5/img/dropshipping-001-070-vendor-k20000.png` | rejected Datenluecke | Vendors-Seite ist sichtbar, aber `K20000` ist nicht sichtbar. | Nicht als Direktlieferanten-Buchbild verwenden; vor Einkaufsbestellung braucht es UI-first Kreditor-Fit. |
| `playwright/projects/fibu-book5/img/dropshipping-001-080-item-sp-pump-01.png` | rejected Datenluecke | Items-Seite ist sichtbar, aber `SP-PUMP-01` ist nicht sichtbar. | Nicht als Artikel-Buchbild verwenden; vor Dropshipping-Zeile braucht es UI-first Artikel-/Posting-Fit. |
| `playwright/projects/fibu-book5/img/compliance-001-010-e-invoices-tell-me.png` | Kandidat fuer Kapitel-22-Readiness | Tell-Me-/Role-Center-Kontext zu `E-Rechnungen`; sichtbar ist auch `Warten auf Ka E-Rechnungen 0`. | Nur als Orientierungsbild verwenden. Kein E-Rechnungsprozess, kein Versandstatus, keine Validierung und kein Archivnachweis. |
| `playwright/projects/fibu-book5/img/compliance-001-020-vat-entries-tell-me.png` | Kandidat fuer USt-/Tax-Nachweispfad | Tell-Me-Kontext zu `VAT Entries`. | Kein deutscher `19 %`-USt-Nachweis und keine UStVA; O2C/P2P bleiben CRONUS-USA-Labor mit `0 %`. |
| `playwright/projects/fibu-book5/img/compliance-001-030-vat-posting-setup-tell-me.png` | Kandidat fuer gesperrten Setup-Kontext | Tell-Me-Kontext zu `VAT Posting Setup`. | Nicht als eingerichtete deutsche USt-Buchungsmatrix verwenden; Setup-Fit nur mit Gate. |
| `playwright/projects/fibu-book5/img/compliance-001-040-document-sending-profiles-tell-me.png` | Kandidat fuer Versandprofil-Kontext | Tell-Me-Kontext zu `Document Sending Profiles`. | Versandprofil ersetzt keine E-Rechnungsvalidierung, keinen Peppol-/Providerstatus und keinen Steuerposten. |
| `playwright/projects/fibu-book5/img/compliance-001-050-change-log-entries-tell-me.png` | Kandidat fuer Audit-/Change-Log-Kontext | Tell-Me-Kontext zu `Change Log Entries`. | Kein Beweis, dass kritische Tabellen bereits richtig protokolliert werden. |
| `playwright/projects/fibu-book5/img/compliance-001-060-change-log-setup-tell-me.png` | Kandidat fuer gesperrten Audit-Setup-Kontext | Tell-Me-Kontext zu `Change Log Setup`. | Nicht als aktiviertes Change Log verwenden; Setup-Aenderung nur mit Gate und eigenem Klickpfad. |

## `SECURITY-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/security-001-010-users-tell-me.png` | rejected/Teilbefund | Tell-Me liefert fuer `Users` in diesem Lauf keinen stabilen Zielkontext. | Nicht als Benutzerverwaltungs-Buchbild verwenden. Als Lernbild behalten: ein Suchbegriff reicht nicht fuer belastbare Admin-Evidence. |
| `playwright/projects/fibu-book5/img/security-001-020-permission-sets-tell-me.png` | Readiness-Kandidat | `Permission Sets` ist sichtbar/kontextuell sichtbar. | Als Orientierungsbild fuer Berechtigungssaetze geeignet; keine Berechtigung wurde geaendert und kein SoD-Nachweis entsteht daraus. |
| `playwright/projects/fibu-book5/img/security-001-030-profiles-roles-tell-me.png` | Readiness-Kandidat | `Profiles Roles` ist sichtbar/kontextuell sichtbar. | Als Orientierungsbild fuer Rolle/Profil nutzbar; kein Profil wurde geaendert und keine Rollenstrategie ist bewiesen. |
| `playwright/projects/fibu-book5/img/security-001-040-security-groups-tell-me.png` | Readiness-Kandidat | `Security Groups` ist sichtbar/kontextuell sichtbar. | Als Orientierungsbild fuer Security Groups nutzbar; keine Gruppe wurde angelegt oder zugeordnet. |
| `playwright/projects/fibu-book5/img/security-001-050-user-setup-tell-me.png` | gesperrter Setup-Kontext | `User Setup` ist sichtbar/kontextuell sichtbar. | Nur als Hinweis auf benutzerbezogene Setup-/Freigabefelder nutzen; keine Einrichtung ohne Gate. |
| `playwright/projects/fibu-book5/img/security-001-060-job-queue-entries-tell-me.png` | Betriebs-Kontext-Kandidat | `Job Queue Entries` ist sichtbar/kontextuell sichtbar. | Als Betriebs-/Automatisierungs-Kontext nutzbar; kein Job wurde angelegt, gestartet oder geaendert. |
| `playwright/projects/fibu-book5/img/security-001-070-change-log-entries-tell-me.png` | Audit-Kontext-Kandidat | `Change Log Entries` ist sichtbar/kontextuell sichtbar. | Als Audit-/Nachweispfad nutzbar; kein Beweis fuer aktive, korrekt konfigurierte Tabellenprotokollierung. |

## `REPORTING-011` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-011-020-analysis-views-before-fit.png` | Labor-/Blockerbild | `Analysis Views` ist erreichbar; vorhandene Views und Dimensionsspalten sind sichtbar. | Als Evidence fuer den Reporting-Setup-Hebel nutzbar; nicht als Finalbild fuer eine Produktlinienauswertung. |
| `playwright/projects/fibu-book5/img/reporting-011-030-analysis-views-after-fit.png` | rejected/Blockerbild | Der Zustand bleibt ohne `RM-PLCH`; keine sichere editierbare Feldzuordnung fuer die Anlage/Aenderung wurde belegt. | Nicht als Buchbild fuer einen gelungenen Fit nutzen. Als Lernbild fuer Setup-Gate und Feldmapping-Grenze behalten. |

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
- `INVENTORY-001` nutzt `Breites Layout umschalten` fuer gefilterte Tabellenbilder; die JSON-Evidence protokolliert `wideLayoutActivated = true`.
- `INVENTORY-002` zeigt: Bei Report-Request-Pages ist ein grosser Viewport stabiler als ein generischer Maximize-/Breites-Layout-Klick. Globaler Tour-Cleanup darf dort nicht blind laufen, weil Overlays den Reportkontext stoeren koennen.
- Fuer Dimensionen reicht kein Stammdatenbild. Der O2C-Lauf nutzt jetzt `Line` -> `Related Information` -> `Dimensions` als Belegnachweis; spaetere Buchungslaufe muessen die Dimension zusaetzlich in Posten oder Reporting wiederfinden.
- Rohes `pageText()` wird nicht ungefiltert als redaktionelle Wahrheit verwendet.
Update nach `FIXEDASSETS-044-K30000-VENDOR-PURCHASE-INVOICE-GATE-DECISION`: Screenshot-QA bleibt streng. Das Invoicing-Bild aus `FIXEDASSETS-043` ist nutzbar, wenn der Text die sichtbaren `Tax Liable`/`Tax Area Code`-/FastTab-Lernziele erklaert. Es darf nicht als Beweis fuer `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code`, `VAT Bus. Posting Group` oder Einkaufsrechnungsbereitschaft verwendet werden.
