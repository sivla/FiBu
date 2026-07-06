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
| Adresse | Debitorenkarte / Adresse und Kontakt | `Address`, `Address 2`, PLZ/Ort nicht vollstaendig im Inspect sichtbar | ja fuer realistische Belege | Laender-/Adressstandard | UI fuer Einzelbeispiel, spaeter Configuration Package | PWS-MD-004B Screenshot und Kontexttext | Ohne Adresse sind Belege und Kundenkommunikation nicht realistisch. | needs-field-confirmation |
| Kontakt | Debitorenkarte / Adresse und Kontakt | `Contact`, `Phone No.` | empfohlen | Kontaktprozess | UI oder Configuration Package | PWS-MD-004B | Endanwender muessen Kontaktfelder von Belegadressen unterscheiden. | observed-readfirst |
| Debitorenbuchungsgruppe | Debitorenkarte / Fakturierung | `Customer Posting Group` / `Debitorenbuchungsgruppe` | ja vor O2C/Posting | Customer Posting Groups und G/L Mapping | blocked bis Setup-Readiness | PWS-MD-004B/004C | Dieses Feld steuert Forderungskonto und Buchungslogik; nicht raten. | blocked-setup |
| Geschaeftsbuchungsgruppe | Debitorenkarte / Fakturierung | `Geschaeftsbuchungsgruppe` sichtbar | ja vor O2C/Posting | General Business Posting Groups und General Posting Setup | blocked bis Foundation geklaert | PWS-MD-004C | Kunden muessen verstehen, dass dieses Feld die Erlos-/Aufwandslogik mitsteuert. | blocked-setup |
| USt.-Geschaeftsbuchungsgruppe | Debitorenkarte / Fakturierung | USt-/VAT-Kontext sichtbar, konkreter Feldwert nicht final bewiesen | ja vor USt.-relevanter Rechnung | VAT Business Posting Groups und VAT Posting Setup | blocked bis VAT-Readiness | PWS-MD-004C | Steuerfelder duerfen nicht aus Optik abgeleitet werden. | blocked-vat |
| Zahlungsbedingung | Debitorenkarte / Zahlungen | `Payment Terms Code` / `Zlg.-Bedingungscode` | ja fuer realistische Rechnung/Faelligkeit | Payment Terms | UI oder Configuration Package nach Payment-Terms-Check | PWS-MD-004B/004C | Erklaert Faelligkeit, Mahnung und OP-Auswertung. | needs-payment-terms-check |
| Zahlungsart | Debitorenkarte / Zahlungen | `Payment Method Code` | optional fuer ersten Debitor | Zahlungsarten/Bankprozesse | spaeter, nicht im ersten Write-Gate erzwingen | PWS-MD-004C | Fuer O2C wichtig, aber nicht jeder erste Debitor braucht sofort eine Zahlungsart. | parked |
| Dimensionen | Debitorenkarte / Dimensionen | `Global Dimension 1 Code`, `Global Dimension 2 Code`, Dimensionskontext | empfohlen, aber nicht vor Defaults erzwingen | Dimensionswerte und Default Dimensions | blocked bis Dimension Defaults entschieden | PWS-MD-004C und PWS-FF-005B | Dimensionen gehoeren in Schulung, aber nicht als blindes Pflichtfeld in den ersten Debitor. | blocked-dimensions |
| Rechnung-an Debitor | Debitorenkarte / Fakturierung | `Bill-to Customer No.` | nein fuer ersten einfachen Debitor | verbundene Debitorenstruktur | parked | PWS-MD-004B/004C | Fuer Gruppen-/Filialkunden spaeter erklaeren. | parked |

## Entscheidung fuer realistische Kundendaten

- Der naechste Kundendaten-Schritt soll keine Dummy-Zeile sein. Er soll ein plausibler fiktiver Universaarl-Kunde sein, z. B. ein B2B-Kunde mit deutscher Adresse, Kontaktperson, Zahlungsbedingung und sauberer Buchungsgruppenentscheidung.
- Ein manueller UI-Write-Gate ist fuer genau einen Beispieldebitor sinnvoll, weil das Buch zeigen muss, wie eine Debitorenkarte entsteht.
- Fuer mehrere Kunden ist ein Konfigurationspaket oder Excel-assisted Import fachlich sinnvoller, sobald die Feldkarte und die Setup-Abhaengigkeiten stabil sind.
- API/AL bleibt geparkt, bis ein echter Integrationszweck vorliegt.

## Naechster sinnvoller Schritt

`CUSTOMER-CONFIG-PACKAGE-FIELD-MAP` bleibt lokal: Die Feldkarte gegen vorhandene simulierte Kundendatenpakete abgleichen, fehlende Kundendaten als Data Request markieren und erst danach einen engen Write-Gate fuer genau einen realistischen fiktiven Beispieldebitor vorbereiten.
