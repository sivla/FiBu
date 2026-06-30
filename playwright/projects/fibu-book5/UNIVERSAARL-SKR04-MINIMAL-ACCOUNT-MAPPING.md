# Universaarl SKR04 Minimal Account Mapping

Status: `source-gated-candidate`

Case: `TARGET-026I-SKR04-MINIMAL-ACCOUNT-MAPPING`

Instanz: `playthru`

Company: `UNIVERSAARL-DE`

## Zweck

`UNIVERSAARL-DE` nutzt fuer die deutsche Buchwelt SKR04. Dieses Mapping ist die kleine Startliste fuer die naechsten kontrollierten Business-Central-Setup-Schritte. Es ersetzt die alte gemischte Kandidatenliste und verhindert, dass SKR03- oder CRONUS-nahe Konten versehentlich in den deutschen Zielpfad geraten.

Dieses Mapping ist noch kein vollstaendiger Kontenplan und keine Steuerberaterfreigabe. Es ist ein enges Foundation-Mapping fuer Bank, Debitoren, Kreditoren, USt und erste Erloes-/Einkaufslogik.

## Startliste fuer `UNIVERSAARL-DE`

| Konto | Name fuer Universaarl | Kontenfamilie | Bilanz/GuV | Verwendung im naechsten Setup | Status |
| --- | --- | --- | --- | --- | --- |
| `1200` | Forderungen aus Lieferungen und Leistungen | Debitoren/Forderungen | Bilanz | Customer Posting Group spaeter | `correct-purpose-needed`; bestehendes Konto `1200 Bank Saarland` muss umbenannt oder bereinigt werden |
| `1800` | Bank Saarland | Bank | Bilanz | Bankkonto, Zahlungsjournal, Bankabstimmung spaeter | `candidate-for-controlled-create` |
| `1406` | Abziehbare Vorsteuer 19 Prozent | Vorsteuer | Bilanz | Purchase VAT Account spaeter | `candidate-needs-vat-setup-proof` |
| `3300` | Verbindlichkeiten aus Lieferungen und Leistungen | Kreditoren/Verbindlichkeiten | Bilanz | Vendor Posting Group spaeter | `candidate-for-controlled-create` |
| `3806` | Umsatzsteuer 19 Prozent | Umsatzsteuer | Bilanz | Sales VAT Account spaeter | `candidate-needs-vat-setup-proof` |
| `4400` | Umsatzerloese Inland 19 Prozent | Verkaufserloese | GuV | General Posting Setup Sales Account spaeter | `candidate-for-controlled-create` |
| `5400` | Wareneingang / Materialaufwand | Einkauf/Wareneinsatz | GuV | General Posting Setup Purchase/COGS-Kontext spaeter | `candidate-for-controlled-create` |

## Bewusst noch nicht freigegeben

| Bereich | Warum noch nicht |
| --- | --- |
| Eigenkapital / Opening Balances | Opening-Balance- und Cutover-Logik braucht eigenen Migrations-/Eroeffnungsfall. |
| Bestand / Lagerbewertung | Inventory Posting Setup braucht Artikel-/Lager-/Bewertungsentscheidung und darf nicht aus dem alten CRONUS-Konto `14140` abgeleitet werden. |
| Anlagen | Fixed Assets brauchen Anlagenbuchungsgruppen, AfA-Buch und deutsche Sachkontenlogik als eigene Strecke. |
| Abschreibungen | AfA-Aufwand wird erst mit Anlagen-Setup und AfA-Preview/Posten festgelegt. |
| Sonstige Aufwendungen | Nur anlegen, wenn ein konkreter Beleg- oder Fehlerfall es braucht. |

## Business-Central-Gate fuer den naechsten Lauf

Der naechste UI-Case darf nicht pauschal alle Konten erzeugen. Er muss:

1. `1200 Bank Saarland` oeffnen und entscheiden, ob die Bezeichnung auf Forderungen korrigiert werden kann oder ob das Konto gesperrt/umgangen werden muss.
2. `1800 Bank Saarland` nur anlegen, wenn `1800` noch nicht existiert.
3. Weitere Startkonten aus der Tabelle nur kontrolliert anlegen oder blockieren.
4. Fuer jedes Konto `Nr.`, `Name`, `Kontoart`, `Bilanz/GuV` und Reopen-Sichtbarkeit beweisen.
5. Keine VAT Posting Setup, keine Posting Groups, keine Stammdaten, keine Belege, keine Preview und keine Buchung im selben Lauf ausfuehren.

## Quellenbasis

- DATEV SKR04 Produktseite: https://www.datev.de/web/de/datev-shop/rechnungswesen/skr-04/
- SKR04-Referenz fuer Nummernpruefung: https://www.collmex.de/skr04.pdf

Die Detailkonten muessen im naechsten UI-Case gegen Business Central sichtbar gemacht werden. Erst dann duerfen sie als `universaarl-proven` in Coverage oder Buchtext erscheinen.
