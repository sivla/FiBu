# POSTING-TRACE-002 Book Sync zur O2C-Postenspur

Status: `labor`, `book-sync`, `no-new-bc-run`, `no-posting`, `not-final`.

## Zweck

Dieser Lauf arbeitet keine neue Business-Central-Strecke ab. Er synchronisiert die bereits bewiesene Postenspur aus `POSTING-TRACE-001` mit der konkreten O2C-Klickanleitung im Buch.

Der Nutzen ist didaktisch: Ein Anfaenger soll bei den Bildern zu Auftrag, Preview, gebuchter Rechnung und Posten verstehen, welche fachliche Kontrollfrage jedes Bild beantwortet.

## Kontext

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Modus | Buch-/Evidence-Sync |
| BC-Ausfuehrung in diesem Lauf | nein |
| Buchung in diesem Lauf | nein |
| Deutscher Finalnachweis | offen |

## Evidence-Basis

| Prozess | Beleg / Objekt | Belegter Laborstand |
|---|---|---|
| O2C | `S-ORD101068` -> `PS-INV103297` | Preview, `Ship and Invoice`, Debitorenposten, Sachposten, Wertposten, Artikelposten `792`, Dimensionen `CHANNEL=B2B` und `PRODUCTLINE=MACHINE` am Artikelposten |
| P2P | `106049` -> `108219` | `Receive and Invoice`, Kreditorenposten, Sachposten, Wertposten, Artikelposten `793` |
| Inventory | `INV008-899959` | `RM-M100 +2`, Sachposten `14140`, Artikelposten, Wertposten, `Inventory Valuation` mit positivem Laborbestand |

## Buch-Sync

Aktualisierte Buchstelle:

`FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md`, Kapitel 11 / Evidence-Pack- und Buchungsspur-Abschnitt.

Korrigiert wurde:

- Die O2C-Screenshotliste verweist jetzt auf vorhandene Projektbilder unter `playwright/projects/fibu-book5/img/`.
- `Preview Posting` wird nicht mehr als aktueller Inventory-Account-Blocker beschrieben; der Blocker wurde durch `MASTERDATA-009` im Labor geloest.
- Der Buchungsdialog, die gebuchte Verkaufsrechnung `PS-INV103297`, Debitorenposten, Sachposten, Wertposten und Artikelposten-Dimensionen werden als aktuelle Labor-Evidence erklaert.
- Der Evidence-Pack-Abschnitt trennt Laborbetrag `68.000 EUR`, offene deutsche `19 %` USt und offene Financial-Reports-Summe.
- Eine kleine Kontrollfragen-Tabelle erklaert, welche Postenart welche Frage beantwortet.

## Was damit belegt ist

| Aussage | Status |
|---|---|
| Die O2C-Laborbuchung hat eine nachvollziehbare Postenspur | praktisch belegt |
| `PS-INV103297` ist der Einstieg in Debitoren-, Sach-, Wert- und Artikelposten | praktisch belegt |
| `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten `792` sichtbar | praktisch belegt |
| Die Buch-Klickanleitung erklaert jetzt die aktuell verwendbaren O2C-Postenspur-Bilder | Buch-Sync erledigt |

## Was nicht belegt ist

| Aussage | Status |
|---|---|
| Deutsche `19 %` USt mit Steuerbetrag `12.920 EUR` | final offen |
| Deutscher Bruttobetrag `80.920 EUR` | final offen |
| Deutscher Kontenplan-Endstand | final offen |
| Financial-Reports-Summe nach `PRODUCTLINE`/`CHANNEL` | offen, Reporting-Fit braucht Freigabe |
| Neue Zahlung, OP-Ausgleich oder Bankposten | nicht gebucht |

## Naechster Schritt

Ohne Freigabe fuer Payment, Reporting-Setup oder DE-VAT bleibt der naechste sinnvolle Autopilot-Schritt ein weiterer kleiner Buch-/Evidence-Sync oder ein neuer read-only Block. Praktische Folgeschritte mit Veraenderung bleiben:

- `PAYMENTS-011` nur nach ausdruecklicher Zahlungsfreigabe.
- Reporting-Analysis-View-Fit nur nach ausdruecklicher Setup-Freigabe.
- Deutscher VAT-Ziellauf nur nach Setup-/Umgebungsfreigabe.
