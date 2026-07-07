# Universaarl VAT Setup Fit Decision

Status: `active-boundary-decision`

Dieser Entscheid bereitet das USt-Setup fuer `UNIVERSAARL-DE` vor. Er aendert kein Business-Central-Setup und erzeugt keine Belege.

## Aktueller Stand

Die alte Folge `TARGET-026B-CHART-OF-ACCOUNTS-VAT-ACCOUNT-PREFLIGHT` ist nicht mehr der aktive naechste Schritt. Seitdem wurden in `playthru / UNIVERSAARL-DE` Kontenplan-Starterkonten, Nummernserien, Dimensionen, der Debitor `U-CUST-100 / Saarland Maschinenbau AG` und der Artikel `U-ITEM-HW100 / Steuerbox Standard U100` beobachtet.

Fuer Training und Handbuch ist damit genug reale Business-Central-Oberflaeche vorhanden, um zu erklaeren, warum USt-/VAT-Setup fuer Debitoren, Artikel, O2C und P2P wichtig ist. Fuer Prozessfreigabe reicht das nicht: die USt-Buchungsmatrix / VAT Posting Setup und die Buchungsmatrix Einrichtung / General Posting Setup sind weiterhin nicht als vollstaendig, korrekt oder posting-ready bewiesen.

## Quellenbasis

- Microsoft Learn beschreibt VAT als Setup aus Markt-/Geschaeftspartnerlogik und Artikel-/Leistungslogik: Wer kauft oder verkauft und was gekauft oder verkauft wird, steuert die Steuerberechnung.
- Microsoft Learn empfiehlt den VAT Setup Assisted Setup Guide als einfachen Einstieg, weist aber darauf hin, dass man nach dem Assistenten die VAT Posting Setup Page pruefen muss.
- VAT Business Posting Groups beschreiben Maerkte wie Inland, EU oder Nicht-EU.
- VAT Product Posting Groups beschreiben Artikel, Ressourcen oder Leistungen und deren Steuerlogik.
- VAT Posting Setup kombiniert Business- und Product-Posting-Groups und enthaelt VAT %, VAT Calculation Type sowie Sales/Purchase VAT Accounts.
- Business Central weist auf fehlende G/L Accounts in Posting Groups oder Posting Setups hin; ein spaeter falsch genutztes Setup kann nach Nutzung nicht einfach geloescht werden.
- Fuer deutsche 19 Prozent reicht Microsoft Learn allein nicht. Der Steuersatz braucht zusaetzlich amtliche Quelle und spaeter Universaarl-Preview, VAT Entries und Sachposten.

## Universaarl-Entscheidung

VAT Setup wird nicht sofort geschrieben. Der naechste saubere Schritt ist nicht mehr ein weiterer generischer Kontenplan-Preflight, sondern eine enge Boundary-Entscheidung fuer `INLAND` + `VAT19`:

1. Welche sichtbaren Universaarl-Werte duerfen nur fuer Schulung/Handbuch genutzt werden?
2. Welche Page-472-/VAT-Posting-Setup-Evidence ist als read-only Kontext akzeptiert?
3. Welche Felder bleiben fuer einen spaeteren Schreibfall zwingend offen: VAT %, Sales VAT Account, Purchase VAT Account, VAT Calculation Type?
4. Welche Quelle oder amtliche Pruefung ist fuer deutsche 19-Prozent-Aussagen noetig?
5. Welche Stop-Bedingungen verhindern O2C/P2P, Preview Posting und Posting?

Geplante Zielcodes fuer spaetere Einrichtung:

| Setupbereich | Geplanter Code | Zweck | Noch offen |
| --- | --- | --- | --- |
| VAT Business Posting Group | `INLAND` | deutsche Inlandsgeschaefte fuer erste Debitoren/Kreditoren | Quelle/amtlicher Steuersatz und Karten-/Template-Zuordnung |
| VAT Product Posting Group | `VAT19` | Standard-USt fuer erste Waren/Dienstleistungen | amtliche 19-Prozent-Quelle, G/L-Konten, Preview, VAT Entries |
| VAT Product Posting Group | `NOVAT` | nicht steuerbare/steuerfreie Fehler- oder Sonderfaelle spaeter | erst nach separatem Usecase |
| VAT Posting Setup | `INLAND` + `VAT19` | Standardkombination fuer O2C/P2P | Sales VAT Account, Purchase VAT Account, VAT %, Calculation Type |

## Warum nicht sofort einrichten?

Das erste Buch soll zeigen, wie Kontenfindung, USt-Gruppen, Belege und Posten zusammenhaengen. Wenn VAT Posting Setup geschrieben wird, bevor die sichtbare Page-472-Zeile, die betroffenen Konten und die Quelle fuer den Steuersatz sauber erklaert sind, entsteht ein scheinbar funktionierender, aber fachlich schwacher Prozess. Deshalb wird vor jedem Write-Gate geprueft:

1. Welche Sachkonten existieren sichtbar in `UNIVERSAARL-DE`?
2. Welche USt-/VAT-Konten sind nur Kandidaten und noch keine steuerliche Freigabe?
3. Welche Page-472-Felder sind sichtbar, welche wurden noch nicht sicher geschrieben oder nach Reopen bewiesen?
4. Welche General-Posting-Setup-/Posting-Group-Kombinationen blockieren dieselben O2C-/P2P-Prozesse?
5. Kann ein spaeterer Setup-Fit mit Vorher/Nachher-Screenshot, Reopen-Proof und Preview-Gate erklaert werden?

## Naechster Case

`FOUNDATION-READINESS-DECISION`

Diese Entscheidung konsumiert die vorhandene Foundation-, Debitoren- und Artikel-Evidence. Der naechste konkrete Live-Schritt darf erst daraus entstehen:

- entweder ein materiell neuer no-write USt-/Buchungsmatrix-Proof,
- oder eine eng begrenzte Setup-Route-Entscheidung,
- oder ein Handbuch-/Training-Abschnitt, der die aktuelle Grenze erklaert.

Kein O2C/P2P-Preflight darf aus dieser Datei direkt starten, solange VAT Posting Setup und General Posting Setup nicht als ausreichend entschieden sind.

## Stop-Regeln

- Keine 19-Prozent-Behauptung ohne amtliche Quelle.
- Kein VAT Posting Setup Write ohne Sales/Purchase VAT Account-Kandidaten.
- Kein Stammdatensatz, kein Beleg, keine Preview und keine Buchung aus diesem Entscheid.
- Kein CRONUS-/RM-/Legacy-Setup als aktive Universaarl-Wahrheit.
