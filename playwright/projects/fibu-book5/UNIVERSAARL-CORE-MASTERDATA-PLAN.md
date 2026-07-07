# Universaarl Core Master Data Plan

Status: `partial-observed-training-draft`

Dieser Plan legt die ersten Stammdaten fuer `UNIVERSAARL-DE` fest. Einige Datensaetze existieren inzwischen als realistische fiktive Universaarl-Trainingsdaten in echter Business-Central-Oberflaeche. Das erzeugt Buch- und Schulungssubstanz, aber keine Prozessfreigabe. Weitere Datensaetze werden erst angelegt, wenn die passenden Karten, Templates, Pflichtfelder, Buchungsgruppen, USt-Gruppen und Nummernserien in der UI geprueft sind.

## Grenzen vor Anlage

- Instanz: `playthru`
- Company: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`
- Keine CRONUS-, RM- oder Rhein-Main-Stammdaten als Zielbasis.
- Keine vertraulichen echten Kundendaten, Bankdaten oder Produktivkontakte im Repo.
- Realistische fiktive Universaarl-Daten sind erlaubt und gewuenscht, wenn sie fachlichen Zweck, Owner, Setup-Abhaengigkeit, UAT-/Training-Nutzen und Evidence-Grenze haben.
- Keine weitere Stammdatenanlage vor Template-/Pflichtfeld-Preflight oder eigenem Write-Gate.
- Keine Behauptung, dass `PRODUCTLINE` oder `COSTCENTER` globale Dimensionen sind.
- Dimensionen aus TARGET-023B duerfen als vorhandene Dimension Values genutzt werden, aber noch nicht als gebuchte Reportingwirkung.
- Deutsche USt wird erst nach USt-Setup, Preview und VAT Entries behauptet.

## Erste Debitoren

| Code | Name | Zweck im Buch | Erster Prozess | Preflight-Pflichtfelder |
| --- | --- | --- | --- | --- |
| `U-CUST-100` | Saarland Maschinenbau AG | Standardkunde fuer ersten O2C-Prozess | Angebot/Auftrag/Rechnung, Zahlung | Name, Debitorenbuchungsgruppe, Geschaeftsbuchungsgruppe, USt-Geschaeftsbuchungsgruppe, Zahlungsbedingung |
| `U-CUST-110` | Pfalz Technik GmbH | zweiter Kunde fuer Listen, Sortierung und Filter | zweite Verkaufsrechnung | wie `U-CUST-100`, abweichende Region/Dimension spaeter |
| `U-CUST-120` | Mosel Projektbau GmbH | Projekt-/Service-nahe Folgefaelle | Jobs/Service spaeter | Kundenvorlage und Zahlungsbedingung |
| `U-CUST-190` | Privatkunde Schulung | einfacher B2C-/Schulungsfall | Verkaufsrechnung nach USt-Gate | USt-Kontext muss vorher source-backed entschieden werden |
| `U-CUST-900` | Kundenanlage Fehlerfall | kontrollierter Fehler- und Korrekturfall | nur Fehlerdiagnose | darf nur in separatem Error-Case genutzt werden |

## Erste Kreditoren

| Code | Name | Zweck im Buch | Erster Prozess | Preflight-Pflichtfelder |
| --- | --- | --- | --- | --- |
| `U-VEND-100` | Stahlhandel Saar GmbH | Rohmaterial, Einkauf, Wareneingang | P2P Material | Name, Kreditorenbuchungsgruppe, Geschaeftsbuchungsgruppe, USt-Geschaeftsbuchungsgruppe, Zahlungsbedingung |
| `U-VEND-110` | IT-Service Saar GmbH | Dienstleistung ohne Lager | Einkaufsrechnung auf Sachkosten | Buchungsgruppe und USt-Gruppe |
| `U-VEND-120` | Maschinenhaus West GmbH | Anlagenlieferant | Fixed Assets | Anlagen- und Kreditoren-Setup spaeter |
| `U-VEND-130` | Verpackung Partner GmbH | Vergleichslieferant fuer P2P/Inventory | Einkauf Verpackung | Einkaufskonditionen spaeter |
| `U-VEND-900` | Lieferant Setupfehler | kontrollierter Setupfehler | nur Fehlerdiagnose | darf nur in separatem Error-Case genutzt werden |

## Erste Artikel

| Code | Name | Typ | Zweck im Buch | Preflight-Pflichtfelder |
| --- | --- | --- | --- | --- |
| `U-ITEM-HW100` | Steuerbox Standard | Handelsware | O2C und P2P mit Wertposten | Basiseinheit, Lagerbuchungsgruppe, Produktbuchungsgruppe, USt-Produktbuchungsgruppe, Kalkulationsmethode |
| `U-ITEM-RM100` | Stahlblech 2mm | Rohmaterial | P2P, Inventory, spaeter Fertigung | wie Handelsware plus Beschaffungs-/Bestandslogik |
| `U-ITEM-FG100` | Schaltschrankpanel | Fertigprodukt | Assembly/Manufacturing spaeter | erst nach Fertigungs-/Assembly-Entscheidung |
| `U-ITEM-SRV100` | Wartungspaket | Service-/Nichtlager-Kontext | Service und Dienstleistungsabgrenzung | Typ/Servicefaehigkeit muss UI-seitig geklaert werden |
| `U-ITEM-ERR900` | Artikel Fehlerfall | Fehlerdiagnose | nur kontrollierter Fehlerfall | darf Setupfehler sichtbar machen, aber nicht in Standardprozessen |

## Erste Lagerorte

| Code | Name | Zweck | Preflight-Pflichtfelder |
| --- | --- | --- | --- |
| `SAAR-HL` | Saarbruecken Hauptlager | Standardlager fuer Einkauf, Verkauf und Inventory | Code, Name, einfache Warehouse-Felder, keine unerklaerte Pflichtlogik |
| `SAAR-QS` | Saarbruecken QS-Lager | Qualitaetssicherung, Umlagerung, Sperrlogik spaeter | Lagerortkarte und einfache Bestandslogik |
| `SAAR-SRV` | Servicebestand Saar | Service-/Ersatzteilfaelle | nur nach Service-/Inventory-Gate verwenden |

## Dimensionen und Default-Dimensionen

TARGET-023B hat Dimension Values fuer `PRODUCTLINE`, `COSTCENTER` und `CHANNEL` sichtbar gemacht. TARGET-024H parkt die globale Dimension-Zuweisung. Deshalb gilt:

- Stammdatenplanung darf Dimensionen als fachliche Zielwerte aufnehmen.
- Stammdatenanlage darf keine globale Dimensionswirkung behaupten.
- Default Dimensions bekommen erst nach Karten-/Template-Preflight einen eigenen Case.
- Gebuchte Dimension Set Entries und Reportingfilter bleiben unbewiesen, bis erste Belege mit Dimensionen gebucht sind.

## Naechster Read-first-Preflight

`TARGET-075` und die ersten Master-Data-Read-first-Probes sind bereits gelaufen. `FOUNDATION-READINESS-DECISION.md` ist jetzt die fuehrende Grenze: `U-CUST-100 / Saarland Maschinenbau AG` und `U-ITEM-HW100 / Steuerbox Standard U100` duerfen fuer Handbuch und Training genutzt werden, aber nicht als O2C-/P2P- oder Posting-Freigabe.

Die konsumierten Master-Data-Kontexte sind keine Prozessfreigaben:

- `PWS-MD-001` Debitoren (Customers) Kontext
- `PWS-MD-002` Kreditoren (Vendors) Kontext
- `PWS-MD-003` Artikel/Services/Nichtlagerartikel Kontext
- `CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF`
- `ITEM-SERVICE-U-ITEM-HW100-PRICE-COST-FIELD-ROUTE`

Der naechste sinnvolle Master-Data-Ausbau ist kein weiterer blinder Listen-Preflight, sondern eine enge Route Decision:

1. Was ist aus `U-CUST-100` und `U-ITEM-HW100` fuer Training/Handbuch bereits belastbar?
2. Welche VAT-/Posting-/Dimension-/Payment-Grenzen blockieren O2C/P2P weiterhin?
3. Werden weitere Kunden/Kreditoren/Artikel manuell, per Vorlage, Konfigurationspaket oder Excel-assisted vorbereitet?
4. Welche Felder duerfen erst nach Foundation-Gate geschrieben werden?
5. Welche Screenshot-QA braucht der naechste kontrollierte Write-Gate?

Keine weitere Stammdatenanlage, kein Template-Write und kein Import entstehen direkt aus diesem Plan.

## Stop-Regeln fuer den Preflight

- Stop, wenn die Company nicht `UNIVERSAARL-DE` ist.
- Stop, wenn ein Template-Dialog eine Datenanlage erzwingen wuerde.
- Stop, wenn ein Datensatz wie echte Kundendaten, Bankdaten oder produktive Kontaktinformationen wirkt.
- Stop, wenn Pflichtfelder nicht sichtbar sind und Layout/FastTabs/FactBox/Personalisieren noch nicht geprueft wurden.
- Stop, wenn ein Dialog Speichern, Erstellen, Buchen, Preview oder Loeschen verlangt.
- Stop, wenn Nummernserien oder Buchungsgruppen fuer die Karten nicht nachvollziehbar sind.
