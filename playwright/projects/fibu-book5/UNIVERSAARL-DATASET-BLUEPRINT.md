# Universaarl Dataset Blueprint

Dieser Blueprint plant die Datenwelt fuer `UNIVERSAARL-DE`. Er erzeugt noch keine Daten in Business Central. Er sorgt dafuer, dass die spaetere Company nicht leer bleibt und das Buch echte Such-, Filter-, Reporting-, Posting- und Fehlerbeispiele bekommt.

## Prinzipien

- Keine CRONUS-Demodaten als Zielbasis.
- Keine echten Kunden-, Bank- oder Produktivdaten.
- Jeder Stammdatensatz hat einen Buchzweck.
- Jede Datenfamilie soll spaeter mehrere Prozesse tragen.
- Dimensionen, Perioden, offene Posten und Korrekturen werden bewusst geplant.
- Stammdaten werden erst angelegt, wenn `UNIVERSAARL-DE` existiert und Setup-Gates erfuellt sind.

## Debitorenfamilien

| Familie | Zweck | Beispiele | Benoetigte Prozesse |
| --- | --- | --- | --- |
| Inland B2B | Standard O2C mit 19 Prozent USt | Saarland Maschinenbau AG, Pfalz Technik GmbH | Angebot, Auftrag, Lieferung, Rechnung, Zahlung |
| Inland B2C | einfache Verkaufsrechnung | Privatkunde Schulung | Rechnung, Zahlung, Korrektur |
| EU B2B | EU-/USt-ID-Szenario spaeter | Lorraine Components SARL | VAT-Pruefung, innergemeinschaftliche Logik |
| Problemfall | Sperre, Kreditlimit, falsche Adresse | Debitor mit Warnung | Fehlerdiagnose und Korrektur |

## Kreditorenfamilien

| Familie | Zweck | Beispiele | Benoetigte Prozesse |
| --- | --- | --- | --- |
| Materiallieferant | P2P, Lager, Wareneingang | Stahlhandel Saar GmbH | Bestellung, Wareneingang, Einkaufsrechnung |
| Dienstleister | Sachkosten ohne Lager | IT-Service Saar | Einkaufsrechnung, Zahlung |
| Anlagenlieferant | Fixed Assets | Maschinenhaus West GmbH | Anlagenzugang, AfA |
| Problemfall | fehlende Buchungsgruppe, falsche USt | Testkreditor Setupfehler | Fehler und Setup-Korrektur |

## Artikelfamilien

| Familie | Zweck | Beispiele | Prozesse |
| --- | --- | --- | --- |
| Handelsware | Verkauf und Einkauf | UNI-HW-100 Steuerbox | O2C, P2P, Lager |
| Rohmaterial | Fertigung und Lagerbewertung | UNI-RM-STEEL Stahlblech | Einkauf, Lager, Fertigung |
| Fertigprodukt | Manufacturing/Assembly | UNI-FG-PANEL Schaltschrankpanel | Produktion, Verkauf |
| Serviceartikel | Serviceprozess | UNI-SRV-MAINT Wartungspaket | Serviceauftrag |

## Lagerorte

| Lagerort | Zweck | Besonderheit |
| --- | --- | --- |
| SAAR-HL | Hauptlager | Standardbewegungen |
| SAAR-QS | Qualitaetssicherung | Umlagerung und Sperrlogik |
| SAAR-SRV | Servicebestand | Service- und Ersatzteilfaelle |

## Dimensionen

| Dimension | Beispielwerte | Buchzweck |
| --- | --- | --- |
| DEPARTMENT | VERTRIEB, EINKAUF, PRODUKTION, SERVICE | Kostenstellennahe Auswertung |
| PRODUCTLINE | STANDARD, SERVICE, PROJEKT, FERTIGUNG | Umsatz- und Rohertragsanalyse |
| CHANNEL | DIREKT, PARTNER, ONLINE-EXCLUDED | Filter-/Reportingfaelle ohne Shopify |
| REGION | SAAR, DE, EU | regionale Auswertung |

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

## Naechste Umsetzung nach Rechtefreigabe

1. `UNIVERSAARL-DE` erstellen.
2. Datenbasis pruefen: keine unerwuenschten Sample Data.
3. Company Information pflegen.
4. Foundation Setup und Nummernserien pruefen.
5. Dimensionen und Buchungsgruppen vorbereiten.
6. Erste Debitoren-, Kreditoren- und Artikeltemplates pruefen.
7. Datenfamilien klein starten und dann pro Prozess erweitern.
