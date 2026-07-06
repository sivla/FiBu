# Universaarl Core Master Data Plan

Status: `planned-after-foundation-decision`

Dieser Plan legt die ersten Stammdaten fuer `UNIVERSAARL-DE` fest. Er erzeugt keine Datensaetze in Business Central. Die Datensaetze werden erst angelegt, wenn die passenden Karten, Templates, Pflichtfelder, Buchungsgruppen, USt-Gruppen und Nummernserien in der UI geprueft sind.

## Grenzen vor Anlage

- Instanz: `playthru`
- Company: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`
- Keine CRONUS-, RM- oder Rhein-Main-Stammdaten als Zielbasis.
- Keine Stammdatenanlage vor Template-/Pflichtfeld-Preflight.
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

Naechster Live-Schritt bleibt zuerst `TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK`.
Erst danach entscheidet `FOUNDATION-READINESS-DECISION.md`, ob Master Data als lesender Preflight sinnvoll ist.

Die naechsten Master-Data-Kandidaten sind keine Schreibfaelle:

- `PWS-MD-001` Debitoren (Customers) Kontext
- `PWS-MD-002` Kreditoren (Vendors) Kontext
- `PWS-MD-003` Artikel/Services/Nichtlagerartikel Kontext

Der Preflight oeffnet die relevanten Listen/Karten read-only oder mit klarer Abbruchlogik:

1. Debitorenliste und Debitorenkarte: Welche Vorlagen, Pflichtfelder, Buchungsgruppen und Nummernserien sind sichtbar?
2. Kreditorenliste und Kreditorenkarte: Welche Vorlagen, Pflichtfelder, Buchungsgruppen und Nummernserien sind sichtbar?
3. Artikelliste und Artikelkarte: Welche Typen, Basiseinheiten, Produktbuchungsgruppen, Lagerbuchungsgruppen und USt-Gruppen sind sichtbar?
4. Lagerorte: Welche Felder machen einen einfachen Lagerort aus, und welche Warehouse-Felder wuerden spaeter neue Pflichtlogik erzeugen?
5. Screenshot-QA: Jede Karte braucht sichtbaren Seitentitel, Company-Kontext, relevante FastTabs und klare Not-Proof-Grenzen.

Keine Stammdatenanlage, kein Template-Write und kein Import entstehen direkt aus diesem Plan.

## Stop-Regeln fuer den Preflight

- Stop, wenn die Company nicht `UNIVERSAARL-DE` ist.
- Stop, wenn ein Template-Dialog eine Datenanlage erzwingen wuerde.
- Stop, wenn Pflichtfelder nicht sichtbar sind und Layout/FastTabs/FactBox/Personalisieren noch nicht geprueft wurden.
- Stop, wenn ein Dialog Speichern, Erstellen, Buchen, Preview oder Loeschen verlangt.
- Stop, wenn Nummernserien oder Buchungsgruppen fuer die Karten nicht nachvollziehbar sind.
