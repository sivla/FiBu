# Universaarl Debitoren-Feldkarte

Status: active-work  
Zielwelt: `playthru / UNIVERSAARL-DE / Universaarl GmbH`  
Quelle: echte Business-Central-Oberflaeche aus PWS-MD-004B und PWS-MD-004C, keine UI-Mockups.  
Datenregel: Die Kundendaten sind realistisch fiktiv. Es werden keine echten vertraulichen Kundendaten verwendet.

Diese Feldkarte uebersetzt die beobachtete Debitorenkarte in eine spaetere Einrichtungsroute. Sie ersetzt keinen Write-Gate-Lauf. Sie hilft nur zu entscheiden, welche Felder fuer einen ersten realistischen Beispieldebitor manuell, per Vorlage oder spaeter per Konfigurationspaket/Excel-assisted vorbereitet werden muessen.

## Feldkarte fuer den ersten Beispieldebitor

| Business-Feld | BC-Seite / Bereich | Beobachtetes BC-Feld | Pflicht fuer ersten Beispieldebitor | Abhaengigkeit | Route Candidate | Evidence-Quelle | Training/UAT-Hinweis | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Debitorennummer | Debitorenkarte / Allgemein | `No.` / `Nr.` | ja | Nummernserie oder manuelle Nummernlogik | UI fuer Einzelbeispiel, spaeter Configuration Package | PWS-MD-004B Page Inspection, PWS-FF-001 Nummernserien | Key User muessen verstehen, ob Nummern manuell oder automatisch vergeben werden. | observed-readfirst |
| Name | Debitorenkarte / Allgemein | `Name` | ja | keine harte Setup-Abhaengigkeit | UI fuer Einzelbeispiel, spaeter Configuration Package | PWS-MD-004B | Name ist der wichtigste Such- und Beleganzeigewert. | observed-readfirst |
| Suchbegriff | Debitorenkarte / Allgemein | `Search Name` | empfohlen | Namenskonvention | Template oder Configuration Package | PWS-MD-004B Page Inspection | Hilft Suche und Dublettenpruefung. | observed-readfirst |
| Adresse | Debitorenkarte / Adresse und Kontakt | `Address`, `Post Code`, `City` | ja fuer realistische Belege | Laender-/Adressstandard | UI fuer Einzelbeispiel, spaeter Configuration Package | CUSTOMER-U-CUST-100-IDENTITY-CONVERSION-WRITE-GATE | Ohne Adresse sind Belege und Kundenkommunikation nicht realistisch. | observed-reopen-proof |
| Kontakt | Debitorenkarte / Adresse und Kontakt | `Contact`, `Phone No.` | empfohlen | Kontaktprozess | UI oder Configuration Package | PWS-MD-004B | Endanwender muessen Kontaktfelder von Belegadressen unterscheiden. | observed-readfirst |
| Debitorenbuchungsgruppe | Debitorenkarte / Fakturierung | `Customer Posting Group` / `Debitorenbuchungsgruppe` sichtbar leer | ja vor O2C/Posting | Customer Posting Groups und G/L Mapping | blocked bis Setup-Wertentscheidung | CUSTOMER-SETUP-POSTING-PAYMENT-READFIRST | Dieses Feld steuert Forderungskonto und Buchungslogik; nicht raten. | visible-empty-needs-decision |
| Geschaeftsbuchungsgruppe | Debitorenkarte / Fakturierung | `Geschaeftsbuchungsgruppe` sichtbar leer | ja vor O2C/Posting | General Business Posting Groups und General Posting Setup | blocked bis Setup-Wertentscheidung | CUSTOMER-SETUP-POSTING-PAYMENT-READFIRST | Kunden muessen verstehen, dass dieses Feld die Erlos-/Aufwandslogik mitsteuert. | visible-empty-needs-decision |
| USt.-Geschaeftsbuchungsgruppe | Debitorenkarte / Fakturierung | konkreter Feldwert nicht sichtbar bewiesen | ja vor USt.-relevanter Rechnung | VAT Business Posting Groups und VAT Posting Setup | blocked bis VAT-Readiness | CUSTOMER-SETUP-POSTING-PAYMENT-READFIRST | Steuerfelder duerfen nicht aus Optik abgeleitet werden. | blocked-vat |
| Zahlungsbedingung | Debitorenkarte / Zahlungen | `Payment Terms Code` / `Zlg.-Bedingungscode` sichtbar leer | ja fuer realistische Rechnung/Faelligkeit | Payment Terms | UI oder Configuration Package nach Payment-Terms-Check | CUSTOMER-SETUP-POSTING-PAYMENT-READFIRST | Erklaert Faelligkeit, Mahnung und OP-Auswertung. | visible-empty-needs-decision |
| Zahlungsart | Debitorenkarte / Zahlungen | `Payment Method Code` nicht im aktuellen Screenshot sichtbar | optional fuer ersten Debitor | Zahlungsarten/Bankprozesse | spaeter, nicht im ersten Write-Gate erzwingen | CUSTOMER-SETUP-POSTING-PAYMENT-READFIRST | Fuer O2C wichtig, aber nicht jeder erste Debitor braucht sofort eine Zahlungsart. | parked |
| Dimensionen | Debitorenkarte / Dimensionen | `Global Dimension 1 Code`, `Global Dimension 2 Code` in Page Inspection als Felder vorhanden, Werte nicht bewiesen | empfohlen, aber nicht vor Defaults erzwingen | Dimensionswerte und Default Dimensions | blocked bis Dimension Defaults entschieden | CUSTOMER-SETUP-POSTING-PAYMENT-READFIRST und PWS-FF-005B | Dimensionen gehoeren in Schulung, aber nicht als blindes Pflichtfeld in den ersten Debitor. | field-present-value-not-proved |
| Rechnung-an Debitor | Debitorenkarte / Fakturierung | `Bill-to Customer No.` | nein fuer ersten einfachen Debitor | verbundene Debitorenstruktur | parked | PWS-MD-004B/004C | Fuer Gruppen-/Filialkunden spaeter erklaeren. | parked |

## Entscheidung fuer realistische Kundendaten

- Der naechste Kundendaten-Schritt soll keine Dummy-Zeile sein. Er soll ein plausibler fiktiver Universaarl-Kunde sein, z. B. ein B2B-Kunde mit deutscher Adresse, Kontaktperson, Zahlungsbedingung und sauberer Buchungsgruppenentscheidung.
- Ein manueller UI-Write-Gate ist fuer genau einen Beispieldebitor sinnvoll, weil das Buch zeigen muss, wie eine Debitorenkarte entsteht.
- Fuer mehrere Kunden ist ein Konfigurationspaket oder Excel-assisted Import fachlich sinnvoller, sobald die Feldkarte und die Setup-Abhaengigkeiten stabil sind.
- API/AL bleibt geparkt, bis ein echter Integrationszweck vorliegt.

## Abgleich mit `MD-CUSTOMERS-01`

Die Zielkunden sind realistisch fiktiv. Sie duerfen wie echte Kunden wirken, enthalten aber keine vertraulichen echten Kundendaten. Der aktuelle BC-Stand darf nicht blind ueberschrieben werden: `U-CUST-100` existiert bereits als `Saarland Maschinenbau AG`, aber die Setup-Felder fuer Buchung, USt., Zahlung und Dimensionen sind noch nicht freigegeben.

| Zielcode | Zielname | Zielrolle | Aktueller BC-Stand | Realitaetsentscheidung vor Write-Gate | Setup-Abhaengigkeit | Naechste Aktion |
| --- | --- | --- | --- | --- | --- | --- |
| `U-CUST-100` | Saarland Maschinenbau AG | Standardkunde fuer ersten O2C-Prozess | als `Saarland Maschinenbau AG` mit Adresse/Kontakt nach Reopen sichtbar | keine Duplikat-Neuanlage; Identitaet/Kontakt ist belegt, Laendercode/Suchbegriff bleiben Datenqualitaetsgrenze | Debitorenbuchungsgruppe, Geschaeftsbuchungsgruppe, USt.-Geschaeftsbuchungsgruppe, Zahlungsbedingung, Laender-/Regionscode | Customer setup/payment read-first |
| `U-CUST-110` | Pfalz Technik GmbH | zweiter Kunde fuer Listen, Filter, Vergleich | nicht bewiesen | spaeter ueber Konfigurationspaket/Excel-assisted sinnvoll | wie `U-CUST-100`, plus Region/Dimension | Data Request vervollstaendigen |
| `U-CUST-120` | Mosel Projektbau GmbH | Projekt-/Service-nahe Folgefaelle | nicht bewiesen | parken bis Jobs/Service-Kontext | Kundenvorlage, Zahlungsbedingung, ggf. Projekt-/Service-Dimensionen | parked |
| `U-CUST-190` | Privatkunde Schulung | einfacher B2C-/Schulungsfall | nicht bewiesen | erst nach USt.-Gate und Datenschutz-/B2C-Grenze | USt.-Kontext, Zahlungsbedingung, keine echten personenbezogenen Daten | parked |
| `U-CUST-900` | Kundenanlage Fehlerfall | Fehler- und Korrekturfall | nicht bewiesen | nur separater Fehlercase; nicht in Standardprozessen verwenden | definierter Fehlerzweck und Cleanup-/Keep-Regel | parked |

## Simulierte Kundendaten fuer den ersten Data Request

Diese Werte sind nicht in Business Central angelegt. Sie sind ein realistischer fiktiver Datenvorschlag fuer Data Request, UAT und spaetere Einrichtung.

| Code | Name | Adresse | Kontakt | Kundentyp | Vorgeschlagene Route | Noch blockiert durch |
| --- | --- | --- | --- | --- | --- | --- |
| `U-CUST-100` | Saarland Maschinenbau AG | Hafenstrasse 12, 66111 Saarbruecken, DE | Einkauf: Martina Weber, einkauf@example.invalid | B2B Inland | enger UI-Write-Gate fuer Identitaet/Adresse/Kontakt | Buchungsgruppen, USt.-Gruppe, Zahlungsbedingung bleiben eigene Setup-Gates |
| `U-CUST-110` | Pfalz Technik GmbH | Industriestrasse 8, 67655 Kaiserslautern, DE | Buchhaltung: Leon Braun, buchhaltung@example.invalid | B2B Inland | Konfigurationspaket/Excel-assisted nach Feldmapping | Setup-Readiness und Importvorlage |
| `U-CUST-120` | Mosel Projektbau GmbH | Projektweg 4, 54290 Trier, DE | Projektleitung: Anna Schmitt, projekt@example.invalid | Projektkunde | spaeter, wenn Projekt-/Service-Prozesse geplant sind | Jobs/Service-Entscheidung |
| `U-CUST-190` | Privatkunde Schulung | fiktive Schulungsadresse, DE | keine echte Person | B2C Schulung | spaeter separater Schulungsfall | USt.-Gate und Datenschutzgrenze |
| `U-CUST-900` | Kundenanlage Fehlerfall | bewusst unvollstaendig | nicht verwenden | Fehlerfall | separater Error-Case | definierter Fehler, Stop- und Cleanup-Regel |

## Datenqualitaetsentscheidung fuer `U-CUST-100`

`U-CUST-100` bleibt die bevorzugte Nummer fuer den ersten realistischen Universaarl-Debitor. Der bestehende BC-Datensatz wurde nicht dupliziert. Nach dem kontrollierten Write-Gate ist `U-CUST-100 / Saarland Maschinenbau AG` mit Adresse, PLZ/Ort, E-Mail und Kontakt nach Reopen auf der echten Business-Central-Debitorenkarte sichtbar.

Das ist kein Freibrief fuer O2C oder Setup: Laender-/Regionscode `DE` und Suchbegriff sind nicht bewiesen. Buchungsgruppen, USt.-Gruppen, Zahlungsbedingungen, Zahlungsarten, Dimensionen, Vorlagen und Belege bleiben gesperrt.

Diese Entscheidung nutzt realistische fiktive Kundendaten und echte Business-Central-Oberflaechen-Evidence. Sie verwendet keine vertraulichen echten Kundendaten und oeffnet keinen Schreib-Gate.

## Naechster sinnvoller Schritt

`CUSTOMER-SETUP-VALUE-DECISION` ist lokal erledigt. Ergebnis: Laender-/Regionscode `DE` ist ein plausibler spaeterer enger Datenqualitaets-Write-Kandidat. Debitorenbuchungsgruppe, Geschaeftsbuchungsgruppe, USt.-Geschaeftsbuchungsgruppe und Zahlungsbedingung werden nicht geraten. Zahlungsart und Dimensionen bleiben geparkt.

`CUSTOMER-SETUP-DEPENDENCY-READFIRST` lief in der echten Business-Central-Oberflaeche. `U-CUST-100` wurde read-only mit Fakturierung-/Zahlungs-Kontext geoeffnet. Die direkten Routen zu Debitorenbuchungsgruppen, Geschaeftsbuchungsgruppen, USt.-Geschaeftsbuchungsgruppen und Zahlungsbedingungen fielen jedoch auf das Business Manager Role Center zurueck. Diese Screenshots zaehlen nicht als Setup-Seitenbeweis.

Der naechste sinnvolle Fall ist deshalb kein Write-Gate, sondern eine enge Route-Recovery: Die vier blockierten Setup-Seiten muessen read-only ueber eine stabile, sichtbare Route geoeffnet werden. Erst wenn Screenshot und Page Inspection die echte Zielseite bestaetigen, duerfen konkrete Setupwerte fuer den Debitor fachlich entschieden werden.
