# Universaarl Dataset Blueprint

Dieser Blueprint plant die Datenwelt fuer `UNIVERSAARL-DE`. Er erzeugt noch keine Daten in Business Central. Er sorgt dafuer, dass die spaetere Company nicht leer bleibt und das Buch echte Such-, Filter-, Reporting-, Posting- und Fehlerbeispiele bekommt.

## Prinzipien

- Keine CRONUS-Demodaten als Zielbasis.
- Keine echten Kunden-, Bank- oder Produktivdaten.
- Jeder Stammdatensatz hat einen Buchzweck.
- Jede Datenfamilie soll spaeter mehrere Prozesse tragen.
- Dimensionen, Perioden, offene Posten und Korrekturen werden bewusst geplant.
- Stammdaten werden erst angelegt, wenn `UNIVERSAARL-DE` existiert und Setup-Gates erfuellt sind.

## Datenpakete

Die Datenwelt wird nicht in einem grossen Schritt aufgebaut. Sie entsteht in Paketen, damit Fehler sichtbar bleiben und jeder Screenshot erklaert werden kann.

| Paket | Inhalt | Zweck | Darf erst starten nach |
| --- | --- | --- | --- |
| `DATA-FOUNDATION` | Company Information, Geschaeftsjahr, Nummernserien, Dimensionen, Buchungsgruppen, USt-Basis | macht Stammdaten und Belege buchungsfaehig | `UNIVERSAARL-DE` sichtbar angelegt |
| `DATA-MASTER-CORE` | Kunden, Lieferanten, Artikel, Lagerorte, Zahlungsbedingungen, Bankkonto | liefert Listen, Karten und Pflichtfelder fuer Anfaengerkapitel | Foundation Setup und Nummernserien |
| `DATA-PROCESS-FIRST` | je ein O2C-, P2P-, Inventory- und Payment-Prozess | erzeugt erste Posten und Kontrollbilder | Posting Groups, VAT, Dimensionen |
| `DATA-RICHNESS` | mehrere Monate, offene/geschlossene Posten, Korrekturen, Dimensionen | macht Filter, Views, Reports und UAT sinnvoll | erste Prozessposten |
| `DATA-SPECIALS` | Anlagen, Warehouse, Manufacturing, Service, Projects, Workflows, Change Log | erweitert das Buch auf Spezialbereiche | passende Prozessbasis und eigene Gates |

## Build-Wellen fuer die spaetere Anlage

Diese Wellen legen fest, in welcher Reihenfolge Universaarl-Daten spaeter entstehen. Keine dieser Wellen wird ausgefuehrt, bevor `UNIVERSAARL-DE` sichtbar existiert und die passenden Gates erfuellt sind.

| Welle | Ziel | Erzeugt spaeter | Stoppt, wenn |
| --- | --- | --- | --- |
| `W0-COMPANY-CONTEXT` | eigene Company und Grunddaten sichtbar machen | Company Information, Laender-/Adresskontext, Startrolle | `UNIVERSAARL-DE` nicht eindeutig sichtbar ist oder die Datenbasis unklar bleibt |
| `W1-FINANCE-FOUNDATION` | Buchungsfaehigkeit vorbereiten | Geschaeftsjahr, Nummernserien, Buchungsgruppen, USt-Gruppen, Dimensionen | ein Setupfeld nicht verstanden oder nicht screenshotfaehig erklaert ist |
| `W2-CORE-MASTERDATA` | Listen, Karten und Pflichtfelder fuellen | 5 Kunden, 5 Lieferanten, 5 Artikel, 2-3 Lagerorte, Zahlungsbedingungen, Bankkonto | Templates, Pflichtfelder oder Nummernserien nicht nachvollziehbar sind |
| `W3-FIRST-POSTINGS` | erste Posten fuer Buchwahrheit erzeugen | erster O2C-, P2P-, Inventory- und Payment-Fall mit Preview/Trace | Preview Posting oder Postenspur nicht eindeutig ist |
| `W4-RICHNESS` | Filter, Views, Reports und UAT tragfaehig machen | mehrere Monate, offene/geschlossene Posten, Teilzahlungen, Korrekturen, Dimensionen | Daten nur Menge erzeugen, aber keinen Buch-/Screenshotzweck haben |
| `W5-SPECIALS` | Spezialkapitel belastbar machen | Anlagen, Warehouse, Manufacturing, Service, Projects, Workflows, Change Log | Grundprozesse noch keine stabilen Entries liefern |

## Masterdata-Startpaket

Das Startpaket ist absichtlich klein, aber nicht leer. Es erzeugt spaeter genug Vergleichsdaten fuer Listen, Sortierung und einfache Filter, ohne sofort Massendaten in die Company zu kippen.

| Paket | Datensaetze | Buchzweck | Erste Zielseite | Screenshotziel |
| --- | --- | --- | --- | --- |
| `MD-CUSTOMERS-01` | `U-CUST-100`, `U-CUST-110`, `U-CUST-120`, `U-CUST-190`, `U-CUST-900` | Kundenliste, Debitorenkarte, Zahlungsbedingungen, O2C, OP-Liste, Fehlerfall | Customers / Customer Card | Liste mit mehreren Kunden, Karte mit Buchungsgruppen und Zahlungsbedingung |
| `MD-VENDORS-01` | `U-VEND-100`, `U-VEND-110`, `U-VEND-120`, `U-VEND-130`, `U-VEND-900` | Einkaufsprozesse, Kreditorenkarte, Zahlungsvorschlag, Anlagenlieferant, Fehlerfall | Vendors / Vendor Card | Lieferantenliste und Karte mit Kreditorenbuchungsgruppe |
| `MD-ITEMS-01` | `U-ITEM-HW100`, `U-ITEM-RM100`, `U-ITEM-FG100`, `U-ITEM-SRV100`, `U-ITEM-ERR900` | Artikelkarte, Lager, Einkauf, Verkauf, Fertigung/Assembly, Fehlerdiagnose | Items / Item Card | Artikelliste mit Typen und Posting Groups |
| `MD-LOCATIONS-01` | `SAAR-HL`, `SAAR-QS`, `SAAR-SRV` | Lagerabgrenzung, QS-Bestand, Servicebestand | Locations / Location Card | Lagerortkarte mit einfachen Warehouse-Feldern |
| `MD-DIMENSIONS-01` | `DEPARTMENT`, `PRODUCTLINE`, `CHANNEL`, `REGION` | Dimensionsfilter, Reporting, Analysis Mode | Dimensions / Dimension Values | Dimensionen und Werte als spaetere Filterachsen |
| `MD-BANK-01` | fiktive Hausbank | Zahlung, OP-Ausgleich, Bankposten, Bankabstimmung | Bank Accounts / Payment Journals | Bankkonto ohne echte Bankdaten |

## Prozessdaten-Startpaket

Diese Prozessdaten entstehen erst nach Foundation, Stammdaten, USt- und Posting-Gates. Jeder Prozess muss Preview, Postingentscheidung, Postenspur und Screenshotzweck vorab definieren.

| Paket | Prozess | Entsteht durch | Benoetigte Posten | Buch- und Screenshotzweck |
| --- | --- | --- | --- | --- |
| `PROC-O2C-01` | Verkauf Steuerbox an `U-CUST-100` | Sales Order oder Sales Invoice mit Artikel `U-ITEM-HW100` | Customer Ledger, G/L, VAT, Item Ledger, Value Entries | vom Kundenauftrag bis Debitorenposten lesen |
| `PROC-P2P-01` | Einkauf Stahlblech von `U-VEND-100` | Purchase Order mit `U-ITEM-RM100` und Lagerort `SAAR-HL` | Vendor Ledger, G/L, VAT, Item Ledger, Value Entries | Einkauf, Wareneingang und Kreditorenposten verstehen |
| `PROC-INVENTORY-01` | Lagerbewegung Hauptlager/QS | Item Journal oder Transferroute nach Gate | Item Ledger, Value Entries, ggf. G/L | Menge, Wert und Lagerort trennen |
| `PROC-PAYMENT-01` | Zahlungsausgleich Debitor/Kreditor | Payment Journal oder Apply Entries nach Gate | Detailed Ledger Entries, Bank Ledger, G/L | offene und ausgeglichene Posten vergleichen |
| `PROC-CORRECTION-01` | Preis-/Mengenfehler korrigieren | Credit Memo, Reverse oder Korrekturbeleg nach Prozess | Storno-/Korrekturposten je Bereich | Fehler nicht verstecken, sondern fachlich korrigieren |

## Daten-zu-Buch-Mapping

| Buchkapitel | Braucht mindestens | Warum |
| --- | --- | --- |
| Oberflaeche, Suche, Filter, Views | `MD-CUSTOMERS-01`, `MD-VENDORS-01`, `MD-ITEMS-01` | Listen mit nur einer Zeile erklaeren Suche und Filter schlecht |
| O2C | `MD-CUSTOMERS-01`, `MD-ITEMS-01`, `PROC-O2C-01` | Kundenkarte, Verkaufsbeleg, Postenspur und Zahlung gehoeren zusammen |
| P2P | `MD-VENDORS-01`, `MD-ITEMS-01`, `PROC-P2P-01` | Lieferant, Einkaufsbeleg, Lagerzugang und Kreditorenposten muessen zusammenpassen |
| Inventory/Warehouse | `MD-ITEMS-01`, `MD-LOCATIONS-01`, `PROC-INVENTORY-01` | Lagerorte und Artikelposten werden erst mit Bewegungen verstaendlich |
| Payments/Bank | `MD-BANK-01`, `PROC-O2C-01`, `PROC-P2P-01`, `PROC-PAYMENT-01` | Zahlung braucht offene Posten und Bank-/Ausgleichsposten |
| Reporting/Analysis | `MD-DIMENSIONS-01`, mehrere Prozessposten ueber 3 Monate | Reports und Dimensionen brauchen Vergleichsdaten |
| Fehlerdiagnose | `U-CUST-900`, `U-VEND-900`, `U-ITEM-ERR900`, `PROC-CORRECTION-01` | Anfaenger brauchen sichtbare Fehlerbilder und sichere Korrekturwege |

## Namens- und Nummernkonzept

Die Namen sollen im Buch lesbar sein und in Business Central sofort zeigen, wofuer ein Datensatz gedacht ist.

| Objekt | Muster | Beispiel | Buchnutzen |
| --- | --- | --- | --- |
| Debitor | `U-CUST-###` | `U-CUST-100 Saarland Maschinenbau AG` | Kundenliste sortieren, OP pruefen, Zahlung erklaeren |
| Kreditor | `U-VEND-###` | `U-VEND-100 Stahlhandel Saar GmbH` | P2P, offene Posten, Zahlungsvorschlag |
| Artikel | `U-ITEM-...` | `U-ITEM-HW100 Steuerbox` | Verkauf, Einkauf, Lager, Wertposten |
| Lagerort | `U-LOC-...` | `SAAR-HL` | Lagerbewegungen und Warehouse-Abgrenzung |
| Dimension | kurze Codes | `PRODUCTLINE=STANDARD`, `CHANNEL=DIREKT` | Filter totals by, Reporting, Analysis Mode |
| Belegfamilie | `U-SO`, `U-PO`, `U-PAY`, `U-FA` | Verkaufs-/Einkaufs-/Zahlungs-/Anlagenfaelle | Screenshot- und Postenspur eindeutig zuordnen |

Die konkreten Nummernserien werden nicht vorab in BC behauptet. Sie werden spaeter in `UNIVERSAARL-DE` sichtbar geprueft oder bewusst eingerichtet.

## Debitorenfamilien

| Familie | Zweck | Beispiele | Benoetigte Prozesse |
| --- | --- | --- | --- |
| Inland B2B | Standard O2C mit 19 Prozent USt | Saarland Maschinenbau AG, Pfalz Technik GmbH | Angebot, Auftrag, Lieferung, Rechnung, Zahlung |
| Inland B2C | einfache Verkaufsrechnung | Privatkunde Schulung | Rechnung, Zahlung, Korrektur |
| EU B2B | EU-/USt-ID-Szenario spaeter | Lorraine Components SARL | VAT-Pruefung, innergemeinschaftliche Logik |
| Problemfall | Sperre, Kreditlimit, falsche Adresse | Debitor mit Warnung | Fehlerdiagnose und Korrektur |

### Debitoren-Mindestset

| Code | Name | Rolle im Buch | Besonderheit |
| --- | --- | --- | --- |
| `U-CUST-100` | Saarland Maschinenbau AG | Standardkunde fuer ersten O2C-Prozess | B2B Inland, direkte Zahlung |
| `U-CUST-110` | Pfalz Technik GmbH | zweiter Kunde fuer Listenfilter und Vergleich | andere Region oder Dimension |
| `U-CUST-120` | Mosel Projektbau GmbH | Projekt-/Service-nahe Folgefaelle | spaeter Jobs/Service |
| `U-CUST-190` | Privatkunde Schulung | einfacher Rechnungsfall | B2C nur nach USt-Gate |
| `U-CUST-900` | Kundenanlage Fehlerfall | Korrektur-/Sperr-/Pflichtfeldfall | nur in Fehlercase verwenden |

## Kreditorenfamilien

| Familie | Zweck | Beispiele | Benoetigte Prozesse |
| --- | --- | --- | --- |
| Materiallieferant | P2P, Lager, Wareneingang | Stahlhandel Saar GmbH | Bestellung, Wareneingang, Einkaufsrechnung |
| Dienstleister | Sachkosten ohne Lager | IT-Service Saar | Einkaufsrechnung, Zahlung |
| Anlagenlieferant | Fixed Assets | Maschinenhaus West GmbH | Anlagenzugang, AfA |
| Problemfall | fehlende Buchungsgruppe, falsche USt | Testkreditor Setupfehler | Fehler und Setup-Korrektur |

### Kreditoren-Mindestset

| Code | Name | Rolle im Buch | Besonderheit |
| --- | --- | --- | --- |
| `U-VEND-100` | Stahlhandel Saar GmbH | Rohmaterial/P2P/Wareneingang | Einkaufsbestellung und Teil-WE |
| `U-VEND-110` | IT-Service Saar GmbH | Dienstleistung ohne Lager | Einkaufsrechnung auf Sachkonto |
| `U-VEND-120` | Maschinenhaus West GmbH | Anlagenzugang | Fixed Assets |
| `U-VEND-130` | Verpackung Partner GmbH | Einkaufsvergleich | anderer Artikel-/Kostenbereich |
| `U-VEND-900` | Lieferant Setupfehler | Fehlerdiagnose | nur kontrolliert verwenden |

## Artikelfamilien

| Familie | Zweck | Beispiele | Prozesse |
| --- | --- | --- | --- |
| Handelsware | Verkauf und Einkauf | UNI-HW-100 Steuerbox | O2C, P2P, Lager |
| Rohmaterial | Fertigung und Lagerbewertung | UNI-RM-STEEL Stahlblech | Einkauf, Lager, Fertigung |
| Fertigprodukt | Manufacturing/Assembly | UNI-FG-PANEL Schaltschrankpanel | Produktion, Verkauf |
| Serviceartikel | Serviceprozess | UNI-SRV-MAINT Wartungspaket | Serviceauftrag |

### Artikel-Mindestset

| Code | Name | Typischer Prozess | Warum dieser Artikel wichtig ist |
| --- | --- | --- | --- |
| `U-ITEM-HW100` | Steuerbox Standard | O2C und P2P | Handelsware mit Einkauf, Verkauf und Wertposten |
| `U-ITEM-RM100` | Stahlblech 2mm | P2P, Inventory, Manufacturing | Rohmaterial fuer Wareneingang und Verbrauch |
| `U-ITEM-FG100` | Schaltschrankpanel | Assembly/Manufacturing, Verkauf | Fertigprodukt mit Komponentenbezug |
| `U-ITEM-SRV100` | Wartungspaket | Service | Service-/Nichtlager-Kontext, falls BC-Setup passt |
| `U-ITEM-ERR900` | Artikel Fehlerfall | Fehlerdiagnose | fehlendes Setup oder falsche Gruppe nur nach Gate |

## Lagerorte

| Lagerort | Zweck | Besonderheit |
| --- | --- | --- |
| SAAR-HL | Hauptlager | Standardbewegungen |
| SAAR-QS | Qualitaetssicherung | Umlagerung und Sperrlogik |
| SAAR-SRV | Servicebestand | Service- und Ersatzteilfaelle |

Der erste Lagerort muss einfach bleiben. Er soll Lagerzugang, Verkauf und Artikelposten erklaeren, bevor Warehouse-Pflichtlogik hinzukommt. Erweiterte Warehouse-Optionen bekommen spaeter eigene Usecases.

## Dimensionen

| Dimension | Beispielwerte | Buchzweck |
| --- | --- | --- |
| DEPARTMENT | VERTRIEB, EINKAUF, PRODUKTION, SERVICE | Kostenstellennahe Auswertung |
| PRODUCTLINE | STANDARD, SERVICE, PROJEKT, FERTIGUNG | Umsatz- und Rohertragsanalyse |
| CHANNEL | DIREKT, PARTNER, ONLINE-EXCLUDED | Filter-/Reportingfaelle ohne Shopify |
| REGION | SAAR, DE, EU | regionale Auswertung |

### Dimensionseinsatz nach Prozess

| Prozess | Pflichtdimension fuer das Buch | Beispiel |
| --- | --- | --- |
| O2C Standardverkauf | `PRODUCTLINE`, `CHANNEL`, `REGION` | `STANDARD`, `DIREKT`, `SAAR` |
| P2P Material | `DEPARTMENT`, `PRODUCTLINE` | `EINKAUF`, `FERTIGUNG` |
| Service | `DEPARTMENT`, `PRODUCTLINE` | `SERVICE`, `SERVICE` |
| Projekt/Jobs | `PRODUCTLINE`, ggf. `COSTCENTER` spaeter | `PROJEKT` |
| Reporting | Kombination aus Zeitraum und Dimension | Monatsfilter plus `CHANNEL` |

## Banken und Zahlungen

Geplante Bankdaten bleiben fiktiv. Das Buch braucht:

- Hausbank fuer Zahlungen.
- Zahlungsjournal.
- offene Debitoren- und Kreditorenposten.
- Zahlungsausgleich.
- Bankabstimmung mit kontrolliertem Testfall.

## Anlagen

| Anlage | Zweck |
| --- | --- |
| CNC-Maschine | Zugang, Anlagenposten, AfA |
| Laptop-Pool | Sammelnahe Anlagenlogik |
| Servicefahrzeug | Anlage mit Kostenstellen-/Dimensionenbezug |

## Belegfamilien

| Familie | Zweck |
| --- | --- |
| O2C Monat 1 | Auftrag bis Zahlung |
| P2P Monat 1 | Bestellung bis Zahlung |
| Inventory Monat 1 | Zugang, Umlagerung, Verbrauch |
| Korrekturfaelle | Gutschrift, Storno, falscher Preis |
| Reportingfaelle | mehrere Daten, Dimensionen, Perioden |

## Zeit- und Buchungsdatenplan

Filter- und Reportingkapitel brauchen mehrere Perioden. Die ersten Belege sollen deshalb nicht alle am gleichen Datum entstehen.

| Zeitraum | Geplanter Zweck | Beispiele |
| --- | --- | --- |
| Monat 1 | erste Stammdaten- und Prozessbasis | erster Verkauf, erster Einkauf, erste Lagerbewegung |
| Monat 2 | offene und geschlossene Posten vergleichen | zweite Rechnung, erste Zahlung, teilweise Zahlung |
| Monat 3 | Reporting und Korrektur | Gutschrift, Storno, Periodenvergleich |

Konkrete Buchungsdaten werden erst in den jeweiligen Prozesscases festgelegt. Vorher wird nur die Logik geplant.

## Posten- und Reporting-Richness

Spaeter muessen sichtbar sein:

- Sachposten
- Debitorenposten
- Kreditorenposten
- Artikelposten
- Wertposten
- VAT Entries
- Bankposten
- Anlagenposten
- Projekt-/Service-/Fertigungsposten, wenn die Module erreicht werden

## Screenshot- und Filterfaelle

| Buchbild | Benoetigte Daten | Erfolgskriterium |
| --- | --- | --- |
| Debitorenliste sortieren | mindestens 5 Kunden | mehrere Zeilen, sichtbarer Name/Nummer/Saldo |
| Debitorenposten filtern | offene und ausgeglichene Posten | Filter nach Kunde, Open/Closed, Datum |
| Kreditorenposten filtern | offene und bezahlte Eingangsrechnungen | Restbetrag und Zahlungsstatus sichtbar |
| Artikelliste filtern | mehrere Artikeltypen | Handelsware, Rohmaterial, Fertigprodukt unterscheidbar |
| Artikelposten/Wertposten | Lagerzugang und Verkauf/Verbrauch | Menge und Wert getrennt erklaerbar |
| Sachposten | mehrere Konten und Monate | Buchungsdatum, Belegnummer, Betrag, Dimensionen |
| VAT Entries | Verkaufs- und Einkaufs-USt | Base/Amount und Posting Groups sichtbar |
| Analysis Mode | genug Listenzeilen | Gruppierung/Summen sinnvoll sichtbar |
| Report Request Page | gebuchte Daten und Zeitraum | Filter vor Reportstart erklaerbar |

## Naechste Umsetzung nach Rechtefreigabe

1. `UNIVERSAARL-DE` erstellen.
2. Datenbasis pruefen: keine unerwuenschten Sample Data.
3. Company Information pflegen.
4. Foundation Setup und Nummernserien pruefen.
5. Dimensionen und Buchungsgruppen vorbereiten.
6. Erste Debitoren-, Kreditoren- und Artikeltemplates pruefen.
7. Datenfamilien klein starten und dann pro Prozess erweitern.

## PREP-013 Entscheidung

Dieser Blueprint ist eine Vorbereitungsdatei. Er ist keine Business-Central-Evidence und erzeugt keine Stammdaten. Nach der Rechtefreigabe wird zuerst die Company angelegt und dann pro Datenpaket entschieden, ob vorhandene Templates, manuelle UI-Anlage oder ein kontrollierter Import sinnvoll sind. API- oder Massenanlage bleibt gesperrt, solange kein eigener Case sie erlaubt.
