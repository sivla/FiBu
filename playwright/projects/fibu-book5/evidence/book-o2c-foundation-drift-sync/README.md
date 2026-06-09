# BOOK-O2C-FOUNDATION-DRIFT-SYNC

Status: `book-sync`, `no-bc-run`, `no-setup`, `no-posting`, `labor-vs-final`

## Zweck

Dieser Evidence-Ordner dokumentiert den Buch-Sync nach `GOVERNANCE-009`. Es wurde kein Business-Central-Lauf gestartet. Ziel war nur, alte Foundation-/O2C-/Reporting-Formulierungen mit dem belegten Laborstand zu synchronisieren.

## Ergebnis

| Bereich | Ergebnis |
|---|---|
| Foundation/O2C | `MASTERDATA-009`, `S-ORD101068` und `PS-INV103297` sind im Buch bereits an der zentralen O2C-Stelle genannt. |
| Reporting-Zielbild | Zwei Stellen wurden nachgeschaerft, damit Zielpruefungen nicht als aktueller RM-DEMO-Finalbeweis gelesen werden. |
| Laborgrenze | `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Beleg und am Artikelposten belegt, nicht als Financial-Reports-Summe. |
| DE-Final | Deutsche `19 %` USt, `80.920 EUR` Brutto, deutsche Konten und finale deutsche Screenshots bleiben offen. |

## Dateien

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `BOOK-O2C-FOUNDATION-DRIFT-SYNC.md` | Markdown-Evidence | Welche Buchstellen synchronisiert wurden und warum kein BC-Lauf noetig war | Keine neue UI-Evidence, keine Buchung, kein Setup | final fuer diesen Sync |
| `BOOK-O2C-FOUNDATION-DRIFT-SYNC-result.json` | JSON-Ergebnis | Maschinenlesbarer Sync-Status, Grenzen und naechster Schritt | Keine BC-Daten, keine API-/UI-Pruefung | final fuer diesen Sync |

