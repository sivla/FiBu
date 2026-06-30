# Universaarl Minimal Chart of Accounts Structure Plan

Status: `planned-for-controlled-ui-setup-gate`

Case: `TARGET-026E-CHART-OF-ACCOUNTS-MINIMAL-STRUCTURE-PLAN`

Instanz: `playthru`

Company: `UNIVERSAARL-DE`

## Ziel

Der Kontenplan ist die Grundlage fuer alle spaeteren Buchungen. In `UNIVERSAARL-DE` ist der Kontenplan aktuell erreichbar, aber ohne sichtbare Sachkontenzeilen. Bevor USt, Buchungsgruppen, Debitoren, Kreditoren, Artikel oder Belege sinnvoll eingerichtet werden koennen, braucht Universaarl eine kleine, klare Kontenstruktur.

Diese Struktur ist ein Arbeitsplan fuer das Buchprojekt. Sie ist kein finaler SKR04, keine Steuerberaterfreigabe und kein amtlicher deutscher Kontenplan.

## Minimal benoetigte Kontenfamilien

| Familie | Zweck im Buch | Beispielkonto | Name | Kontoart | Spaetere Verwendung |
| --- | --- | --- | --- | --- | --- |
| Eigenkapital / Opening | Start- und Abgrenzungsbuchungen erklaeren | `0800` | Eigenkapital / Eroeffnung | Balance Sheet | Eroeffnungsbilanz, Cutover |
| Bank | Zahlungen, Bankabstimmung | `1200` | Bank Saarland | Balance Sheet | Bankkonto, Zahlung, Bankabstimmung |
| Forderungen | Debitorenbuchhaltung | `1400` | Forderungen aus Lieferungen und Leistungen | Balance Sheet | Customer Posting Group |
| Vorsteuer | Einkaufs-USt | `1576` | Abziehbare Vorsteuer 19 Prozent | Balance Sheet | Purchase VAT Account Kandidat |
| Verbindlichkeiten | Kreditorenbuchhaltung | `1600` | Verbindlichkeiten aus Lieferungen und Leistungen | Balance Sheet | Vendor Posting Group |
| Umsatzsteuer | Verkaufs-USt | `1776` | Umsatzsteuer 19 Prozent | Balance Sheet | Sales VAT Account Kandidat |
| Umsatzerloese | Verkaufserloese | `4400` | Umsatzerloese Inland 19 Prozent | Income Statement | General Posting Setup Sales Account |
| Wareneinsatz | Einkaufs-/Materialaufwand | `5400` | Wareneinsatz / Materialaufwand | Income Statement | General Posting Setup COGS/Purchase context |
| Bestand | Lagerbewertung | `3980` | Warenbestand Universaarl | Balance Sheet | Inventory Posting Setup |
| Anlagen | Anlagevermoegen | `0700` | Maschinen und technische Anlagen | Balance Sheet | Fixed Assets spaeter |
| Abschreibung | AfA-Aufwand | `6220` | Abschreibungen auf Sachanlagen | Income Statement | Fixed Assets spaeter |
| Rundung / Differenz | kontrollierte Kleinabweichungen | `6990` | Sonstige betriebliche Aufwendungen | Income Statement | Spaetere Diagnosefaelle |

## Setup-Grenzen

Der Plan unlockt noch keinen Schreibvorgang. Der naechste UI-Case muss fuer jedes Konto pruefen:

- Kontenplan ist in `playthru` / `UNIVERSAARL-DE` offen.
- `Neu` oder `Liste bearbeiten` wird nur im freigegebenen Case genutzt.
- Pro Konto werden `Nr.`, `Name`, `Kontoart` und GuV/Bilanz-Kontext sichtbar gesetzt.
- Nach Speichern/Reopen ist jedes Konto sichtbar.
- Keine VAT Posting Setup, Posting Groups oder Stammdaten werden im selben Schritt still mitgeaendert.

## Buchwirkung

Im Buch kann dieser Abschnitt spaeter als einfache Einfuehrung dienen:

Eine Buchung braucht immer ein Zielkonto. Wenn Business Central einen Verkaufsbeleg bucht, landet der Nettoerloes auf einem Erlöskonto, die Umsatzsteuer auf einem Umsatzsteuerkonto und die Forderung auf einem Debitorensammelkonto. Beim Einkauf entstehen entsprechend Aufwand, Vorsteuer und Verbindlichkeit. Der Kontenplan macht diese Zielkonten sichtbar.

## Naechster Case

`TARGET-026F-CHART-OF-ACCOUNTS-CONTROLLED-SETUP-GATE`

Dieser Case darf die Konten nur kontrolliert in der UI anlegen oder blockieren, mit Vorher/Nachher/Reopen-Screenshots und ohne VAT-Setup, ohne Stammdaten und ohne Buchung.
