# Universaarl VAT Setup Fit Decision

Status: `source-backed-decision`

Dieser Entscheid bereitet das USt-Setup fuer `UNIVERSAARL-DE` vor. Er aendert kein Business-Central-Setup und erzeugt keine Belege.

## Quellenbasis

- Microsoft Learn beschreibt VAT als Setup aus Markt-/Geschaeftspartnerlogik und Artikel-/Leistungslogik: Wer kauft oder verkauft und was gekauft oder verkauft wird, steuert die Steuerberechnung.
- Microsoft Learn empfiehlt den VAT Setup Assisted Setup Guide als einfachen Einstieg, weist aber darauf hin, dass man nach dem Assistenten die VAT Posting Setup Page pruefen muss.
- VAT Business Posting Groups beschreiben Maerkte wie Inland, EU oder Nicht-EU.
- VAT Product Posting Groups beschreiben Artikel, Ressourcen oder Leistungen und deren Steuerlogik.
- VAT Posting Setup kombiniert Business- und Product-Posting-Groups und enthaelt VAT %, VAT Calculation Type sowie Sales/Purchase VAT Accounts.
- Business Central weist auf fehlende G/L Accounts in Posting Groups oder Posting Setups hin; ein spaeter falsch genutztes Setup kann nach Nutzung nicht einfach geloescht werden.
- Fuer deutsche 19 Prozent reicht Microsoft Learn allein nicht. Der Steuersatz braucht zusaetzlich amtliche Quelle und spaeter Universaarl-Preview, VAT Entries und Sachposten.

## Universaarl-Entscheidung

VAT Setup wird nicht sofort geschrieben. Der naechste saubere Schritt ist zuerst ein Kontenplan-/USt-Konto-Preflight, weil VAT Posting Setup G/L-Konten fuer Sales VAT und Purchase VAT braucht.

Geplante Zielcodes fuer spaetere Einrichtung:

| Setupbereich | Geplanter Code | Zweck | Noch offen |
| --- | --- | --- | --- |
| VAT Business Posting Group | `INLAND` | deutsche Inlandsgeschaefte fuer erste Debitoren/Kreditoren | Quelle/amtlicher Steuersatz und Karten-/Template-Zuordnung |
| VAT Product Posting Group | `VAT19` | Standard-USt fuer erste Waren/Dienstleistungen | amtliche 19-Prozent-Quelle, G/L-Konten, Preview, VAT Entries |
| VAT Product Posting Group | `NOVAT` | nicht steuerbare/steuerfreie Fehler- oder Sonderfaelle spaeter | erst nach separatem Usecase |
| VAT Posting Setup | `INLAND` + `VAT19` | Standardkombination fuer O2C/P2P | Sales VAT Account, Purchase VAT Account, VAT %, Calculation Type |

## Warum nicht sofort einrichten?

Das erste Buch soll zeigen, wie Kontenfindung, USt-Gruppen, Belege und Posten zusammenhaengen. Wenn VAT Posting Setup ohne sichtbare Kontenplanbasis gefuellt wird, fehlt genau diese Erklaerung. Deshalb wird zuerst geprueft:

1. Welche Sachkonten existieren in `UNIVERSAARL-DE`?
2. Gibt es deutsche oder generische USt-Konto-Kandidaten?
3. Welche Konten waeren fuer Umsatzsteuer und Vorsteuer fachlich geeignet?
4. Welche General Posting Setup-/Posting-Group-Kombinationen brauchen dieselben Konten?
5. Kann ein spaeterer Setup-Fit mit Vorher/Nachher-Screenshot und Preview-Gate erklaert werden?

## Naechster Case

`TARGET-026B-CHART-OF-ACCOUNTS-VAT-ACCOUNT-PREFLIGHT`

Dieser Case soll den Kontenplan und moegliche USt-Konto-Kandidaten read-only pruefen. Erst danach ist ein VAT Setup Write-Gate sinnvoll.

## Stop-Regeln

- Keine 19-Prozent-Behauptung ohne amtliche Quelle.
- Kein VAT Posting Setup Write ohne Sales/Purchase VAT Account-Kandidaten.
- Kein Stammdatensatz, kein Beleg, keine Preview und keine Buchung aus diesem Entscheid.
- Kein CRONUS-/RM-/Legacy-Setup als aktive Universaarl-Wahrheit.
