# GOVERNANCE-008 - Next Readiness Decision

## Kontext

- Sandbox: `MCP_1_20260210`
- Company: `RM-DEMO`
- Datenbasis: CRONUS USA
- Modus: Governance-/Readiness-Entscheidung ohne BC-Lauf
- Datum: 2026-06-09

`REPORTING-014` hat den verbrauchten und abgelehnten Analysis-View-Hebel synchronisiert. `REPORTING-013` hatte zwar `Analysis Views` erreicht und Feldpositionen auf der bestehenden `REVENUE`-Karte sichtbar gemacht, aber `RM-PLCH` nicht angelegt oder geaendert. Der Grund bleibt fachlich relevant: `New/Neu` ist in Business Central global mehrdeutig und kann in den Role-Center-Kontext fallen, wenn die Kartenaktion nicht sicher gescopt ist.

## Entscheidung

Der naechste sichere Schritt ohne Freigabe ist:

`TAX-002-DE-VAT-GATE-READINESS`

Dieser Schritt darf keinen BC-Lauf, keine Setup-Aenderung, keine neue Company und keine Buchung ausfuehren. Er soll nur die UI-first Freigabekriterien fuer einen spaeteren deutschen VAT19-Ziellauf vorbereiten.

Der praktische Setup-Lauf bleibt gesperrt:

`TAX-002-DE-VAT-FIT`

Dieser darf erst mit ausdruecklicher Freigabe starten.

## Warum dieser Block

Die deutsche `19 %`-USt ist der groesste offene Grundlagenblock fuer finale deutsche Buchscreenshots. O2C `PS-INV103297` und P2P `108219` sind als CRONUS-USA-Laborbelege gut belegt, aber steuerlich zeigen sie `0 %`. Das darf nicht als deutscher Zielzustand erklaert werden.

Ein VAT-Gate ist nuetzlicher als ein weiteres Reporting-Experiment, weil es mehrere spaetere Kapitel beeinflusst:

- O2C-Endbild mit deutscher USt
- P2P-Endbild mit deutscher Vorsteuer
- VAT Entries und Steuerpostenspur
- E-Rechnung/Compliance-Abgrenzung
- Evidence-Pack-Regel fuer Labor vs. finalen DE-Nachweis

## Erlaubt im naechsten No-Approval-Schritt

- vorhandene Evidence lesen, besonders `TAX-001`, O2C, P2P und Compliance
- UI-first Zielpfad fuer VAT Business Posting Groups, VAT Product Posting Groups, VAT Posting Setup, Belegvorschau und VAT Entries formulieren
- harte Stop-Kriterien definieren
- Buch-/Coverage-/Backlog-Texte auf die Gate-Logik synchronisieren
- keine neuen Steuerwerte behaupten

## Nicht erlaubt

- keine VAT Posting Setup Aenderung
- keine VAT Business/Product Posting Group anlegen oder aendern
- kein US-Sales-Tax-Feld zu `19 %` umdeuten
- keine neue O2C-/P2P-Buchung
- kein Company-Wechsel
- keine neue Company
- keine deutsche `19 %`-USt als erreicht markieren

## Buchwirkung

Das Buch soll Anfaengern klar zeigen: Ein CRONUS-USA-Laborbeleg kann Bedienung, Postenspur und Evidence-Logik lehren, aber er ersetzt keinen deutschen Steuer-Endnachweis. Vor finalen deutschen Screenshots muss die Steuerlogik als eigener Setup-/Pruefblock behandelt werden.

## Naechster Schritt

`TAX-002-DE-VAT-GATE-READINESS`: exakte Freigabekriterien und UI-first Testplan fuer deutschen VAT19-Ziellauf vorbereiten. Danach kann der eigentliche `TAX-002-DE-VAT-FIT` nur mit ausdruecklichem Gate starten.
