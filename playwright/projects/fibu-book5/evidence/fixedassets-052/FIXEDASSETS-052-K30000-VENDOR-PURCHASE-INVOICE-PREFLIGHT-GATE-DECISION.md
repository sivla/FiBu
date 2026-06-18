# FIXEDASSETS-052 K30000 Vendor Purchase Invoice Preflight Gate Decision

## Entscheidung

Status: `done-decision-no-bc`

Der technische Page-Inspection-Nachweis aus `FIXEDASSETS-051` reicht fuer den naechsten engen Preflight:

`FIXEDASSETS-053-K30000-PURCHASE-INVOICE-PREFLIGHT-NO-POSTING`

Das ist keine Buchungsfreigabe. Es ist nur die Freigabe, den Purchase-Invoice-Pfad UI-first zu oeffnen und zu pruefen, ob `K30000`, `FA-CNC-01`, Pflichtfelder, Auto-Save-Verhalten, Posting-/Preview-Aktionen und Abbruch-/Cleanup-Wege kontrollierbar sind.

## Ausgangslage

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Datenbasis: CRONUS USA
- Anlage: `FA-CNC-01`, laborseitig als Stammdatensatz gefittet, Buchwert `0,00`, keine Anlagenposten bekannt
- Kreditor: `K30000` / `Zollspedition Nord GmbH`
- Technisch belegt durch `FIXEDASSETS-051`:
  - Page: `Vendor Card (26, Card)`
  - Source Table: `Vendor (23)`
  - `Vendor Posting Group = DOMESTIC`
  - `Gen. Bus. Posting Group = DOMESTIC`
  - `Currency Code = Leer`
  - `VAT Bus. Posting Group = Leer`
  - `Tax Area Code = Leer`
  - `Tax Liable = Nein`
  - `Payment Terms Code = 1M(8D)`
  - `Payment Method Code = BANK`

## Warum der Preflight jetzt erlaubt ist

Der vorherige Blocker war nicht, dass `K30000` fachlich falsch war, sondern dass die kritischen Default-Werte in der normalen Karte und im Personalisieren-Pfad nicht sichtbar belegt waren. `FIXEDASSETS-051` hat diese Luecke technisch geschlossen.

Der naechste Schritt soll noch nicht buchen. Er soll pruefen, was ein Anfaenger auf der Purchase Invoice wirklich sieht:

- Welche Seite oeffnet Business Central fuer Einkaufsrechnungen?
- Welche Pflichtfelder erscheinen bei `K30000`?
- Welche Belegnummer oder Auto-Save-Drafts entstehen?
- Ist `FA-CNC-01` als Zeilentyp oder Anlagenbezug kontrolliert auswaehlbar?
- Wo liegen `Preview Posting`, `Post`, `Posting`, `Cancel`, `Delete` oder andere gefaehrliche Aktionen?
- Kann ein Entwurf sauber abgebrochen oder geloescht werden?

Dafuer ist Page Inspection als technischer Vorbeweis ausreichend. Ein weiteres normales Vendor-Card-Bild wuerde die Default-Werte wahrscheinlich weiter nicht zeigen und bringt weniger Fortschritt als ein kontrollierter Beleg-Preflight.

## Erlaubter naechster Schritt

`FIXEDASSETS-053` darf:

1. `Purchase Invoices` in `RM-DEMO` UI-first oeffnen.
2. Breite Layoutansicht nutzen und FactBox bei Bedarf ausblenden.
3. Page Inspection oder fokussierten Seitentext nur diagnostisch nutzen.
4. Einen Kaufbeleg-Preflight nur so weit ausfuehren, wie er ohne Buchung kontrollierbar bleibt.
5. Falls Business Central automatisch einen Entwurf erzeugt, Entwurfsnummer, Ursache und Cleanup-Weg dokumentieren.
6. `K30000` als Kreditor und `FA-CNC-01` als Zielanlage nur fuer Preflight-/Feldmapping pruefen.
7. Screenshots nur behalten, wenn sie sichtbare Ziele zeigen: Seite, Belegnummer/Entwurf, Kreditor, Zeilentyp/Feld, Pflichtfeld, Preview-/Post-Aktion oder Cleanup-Status.

## Verboten

- kein `Post`
- kein Anlagenzugang
- keine AfA
- keine Buchung
- keine echte Purchase-Invoice-Posting-Preview als Buchungsfreigabe interpretieren
- keine neue Kreditor-/Setup-Aenderung
- keine gespeicherte Personalisierung
- kein API-Shortcut
- kein Company-Wechsel
- keine deutsche VAT-, HGB- oder Kontenplan-Finalbehauptung
- kein Entwurf stehen lassen, falls der Preflight einen Draft erzeugt

## Stop-Kriterien

`FIXEDASSETS-053` muss abbrechen und Evidence sichern, wenn:

- Business Central nicht `MCP_1_20260210` / `RM-DEMO` zeigt,
- die Einkaufsrechnungsseite nicht eindeutig ist,
- ein ungescopter `New/Neu`-Klick in den falschen Kontext fuehrt,
- ein Entwurf entsteht und nicht sicher bereinigt werden kann,
- `Post`, `Post...`, `Receive`, `Invoice` oder eine aehnliche Buchungsaktion unerwartet fokussiert wird,
- `K30000` oder `FA-CNC-01` nicht kontrolliert gefunden werden,
- Pflichtfelder oder Fehlermeldungen zeigen, dass ein eigenes Setup-Gate noetig ist.

## Buchwirkung

Kapitel 21 darf jetzt den naechsten Lernschritt als Kaufbeleg-Preflight beschreiben, aber nicht als Anschaffung. Fuer Anfaenger ist die Trennung wichtig:

- Die Kreditorenkarte erklaert, welche Defaults Business Central technisch kennt.
- Die Einkaufsrechnung zeigt, wie diese Defaults in einen konkreten Beleg hineinwirken.
- Erst Preview Posting und spaeter gebuchte Posten wuerden beweisen, welche Buchungen entstehen.

Das Debugging-/Nachweiskapitel bekommt daraus eine gute Regel: Page Inspection darf einen technischen Gate-Blocker loesen, aber final buchfaehige Screenshots muessen weiterhin den fachlichen Zielzustand sichtbar zeigen.

## Naechster Schritt

`FIXEDASSETS-053-K30000-PURCHASE-INVOICE-PREFLIGHT-NO-POSTING`
