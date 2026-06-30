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
| `1200` | Forderungen aus Lieferungen und Leistungen | Debitoren/Forderungen | Bilanz | Customer Posting Group spaeter | `wrong-bank-path-classified`; bestehendes Konto `1200 Bank Saarland` ist sichtbar, darf aber nicht als Bank-/Payment-/VAT-/Posting-Ziel genutzt werden |
| `1800` | Bank Saarland | Bank | Bilanz | Bankkonto, Zahlungsjournal, Bankabstimmung spaeter | `universaarl-proven`; in `TARGET-026J` sichtbar nach Reopen |
| `1406` | Abziehbare Vorsteuer 19 Prozent | Vorsteuer | Bilanz | Purchase VAT Account spaeter | `universaarl-proven`; in `TARGET-026K` sichtbar nach kontrolliertem Fit und Reopen |
| `3300` | Verbindlichkeiten aus Lieferungen und Leistungen | Kreditoren/Verbindlichkeiten | Bilanz | Vendor Posting Group spaeter | `universaarl-proven`; in `TARGET-026L` sichtbar nach kontrolliertem Fit und Reopen |
| `3806` | Umsatzsteuer 19 Prozent | Umsatzsteuer | Bilanz | Sales VAT Account spaeter | `universaarl-proven`; in `TARGET-026L` sichtbar nach kontrolliertem Fit und Reopen; VAT Setup bleibt offen |
| `4400` | Umsatzerloese Inland 19 Prozent | Verkaufserloese | GuV | General Posting Setup Sales Account spaeter | `universaarl-proven-guv-reopen-proof`; in `TARGET-026M-SAFE-WRITE` sichtbar als `GuV`/`Buchung` nach Karten-Reopen und Kontenplan-Reopen |
| `5400` | Wareneingang / Materialaufwand | Einkauf/Wareneinsatz | GuV | General Posting Setup Purchase/COGS-Kontext spaeter | `universaarl-proven-guv-reopen-proof`; in `TARGET-026M-SAFE-WRITE` sichtbar als `GuV`/`Buchung` nach Karten-Reopen und Kontenplan-Reopen |

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

1. `1200 Bank Saarland` nicht fuer Bank, Zahlungsjournal, USt oder Posting Groups verwenden.
2. `1800 Bank Saarland` als sichtbares Bank-Sachkonto mit Reopen-Proof behandeln.
3. Weitere Startkonten aus der Tabelle nur kontrolliert anlegen oder blockieren.
4. Fuer jedes Konto `Nr.`, `Name`, `Kontoart`, `Bilanz/GuV` und Reopen-Sichtbarkeit beweisen.
5. Keine VAT Posting Setup, keine Posting Groups, keine Stammdaten, keine Belege, keine Preview und keine Buchung im selben Lauf ausfuehren.

## Stand nach `TARGET-026M-SAFE-WRITE`

Der Kontenplan in `UNIVERSAARL-DE` enthaelt jetzt sichtbar:

- `1800 Bank Saarland` als Bilanz-/Buchungskonto.
- `1406 Abziehbare Vorsteuer 19 Prozent` als Bilanz-/Buchungskonto.
- `3300 Verbindlichkeiten aus Lieferungen und Leistungen` als Bilanz-/Buchungskonto.
- `3806 Umsatzsteuer 19 Prozent` als Bilanz-/Buchungskonto.
- `4400 Umsatzerloese Inland 19 Prozent` sichtbar als GuV-/Buchungskonto.
- `5400 Wareneingang / Materialaufwand` sichtbar als GuV-/Buchungskonto.

Die Screenshot-QA zeigt weiterhin die offene Altlast `1200 Bank Saarland`. Dieses Konto bleibt fuer Bank, Payment, VAT und Posting Groups gesperrt, bis ein eigener sauberer Korrekturfall existiert. `1406`, `3300` und `3806` beweisen nur sichtbare Sachkonten, nicht VAT Posting Setup, Posting Groups, USt-Posten oder Kreditorenbuchungen.

`TARGET-026M` und die Recovery-Laeufe bleiben als wichtige Blocker-Evidence erhalten: Sie zeigen, dass die Feldbeschriftung `GuV/Bilanz` nicht als Wert `GuV` zaehlt. `TARGET-026M-SKR04-GUV-ACCOUNT-SAFE-WRITE-FOLLOWUP` hat den Blocker geloest: Die Sachkontokarte wurde im echten Edit-Modus geoeffnet, das Feld `GuV/Bilanz` wurde auf `GuV` gesetzt, und beide Zielkonten wurden nach Karten-Reopen und Kontenplan-Reopen sichtbar geprueft.

## Stand nach `TARGET-026N`

`TARGET-026N` hat den Kontenplan-Checkpoint nicht freigegeben. Der Lauf blieb zwar in `playthru / UNIVERSAARL-DE` und lieferte kompakte Kontenplan-Textfragmente, aber die Screenshot-QA zeigte weiterhin den Role Center statt der sichtbaren Kontenplanliste. Damit ist der Lauf absichtlich `blocked`: Ein unsichtbarer oder veralteter Frame-Text reicht nicht als Buch- oder Setup-Beweis.

Der naechste Schritt ist deshalb noch kein VAT Setup und keine Stammdatenanlage, sondern `TARGET-026O`: eine sichtbare Kontenplan-Screenshot-Recovery. Erst wenn das Bild selbst `Nr.`, `Name`, `GuV/Bilanz`, `Kontoart` und die relevanten Starterkonten zeigt, darf der VAT-Posting-Groups-Preflight folgen. Die Altlast `1200 Bank Saarland` bleibt gegen `1800 Bank Saarland` zu klassifizieren.

## Stand nach `TARGET-026O`

`TARGET-026O` hat den sichtbaren Kontenplan-Checkpoint wiederhergestellt. Die direkte Page-16-URL zeigte zunaechst nicht belastbar genug den fachlichen Inhalt. Der stabile Read-only-Pfad war deshalb: in der sichtbaren Business-Central-Oberflaeche den Link `Kontenplan` verwenden und danach das sichtbare BC-Iframe fotografieren. Das Bild `target-026o-010-visible-chart-iframe.png` zeigt die Konten `1200`, `1406`, `1800`, `3300`, `3806`, `4400` und `5400` mit `GuV/Bilanz` und `Kontoart`.

Damit ist der Starter-Kontenplan als Universaarl-Foundation-Kontext sichtbar genug fuer den naechsten Read-only-Schritt `TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT`. Nicht bewiesen sind weiterhin ein vollstaendiger SKR04-Kontenplan, Steuerberaterfreigabe, VAT Posting Setup, Posting Groups, Stammdaten, Belege, Preview Posting oder Buchungen. Die Doppelung `1200 Bank Saarland` und `1800 Bank Saarland` bleibt fuer Bank- und Zahlungsprozesse gesperrt, bis sie fachlich entschieden ist.

## Quellenbasis

- DATEV SKR04 Produktseite: https://www.datev.de/web/de/datev-shop/rechnungswesen/skr-04/
- SKR04-Referenz fuer Nummernpruefung: https://www.collmex.de/skr04.pdf

Die GuV-Detailkonten `4400` und `5400` sind als Starterkonten UI-seitig sichtbar bewiesen. Sie sind trotzdem noch keine vollstaendige SKR04-, Steuer- oder Posting-Readiness, weil VAT Posting Setup, Posting Groups, Belege, Preview Posting und Posten noch fehlen.
