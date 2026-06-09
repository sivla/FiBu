# BOOK-REPORTING-UAT-K25-SYNC

Status: `book-sync`, `read-only-by-document`, `no-bc-run`, `no-setup`, `no-posting`, `de-final-open`

## Ziel

Dieser Lauf synchronisiert den Reporting-UAT-Block in Kapitel 25 mit dem aktuellen Evidence-Stand aus `REPORTING-001` bis `REPORTING-014`.

Der Zweck ist nicht, Business Central erneut zu oeffnen. Der Zweck ist, dass ein Leser und ein spaeterer Agent nicht versehentlich aus einem Ziel-UAT eine bereits bewiesene RM-DEMO-Reportingwirkung machen.

## Gepruefte Evidence

| Bereich | Befund |
|---|---|
| `REPORTING-001` | `Financial Reports` ist erreichbar. |
| `REPORTING-002` | `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten `Entry No. 792` sichtbar; in Financial Reports nicht nutzbar belegt. |
| `REPORTING-003` bis `REPORTING-007` | Dimension Perspective, Dimensions - Detail, G/L Data Analysis und Analysis by Dimensions liefern keinen belastbaren Zielnachweis. |
| `REPORTING-009` | G/L Entries zur `PS-INV103297` sind sichtbar; Shortcut-Spalten sind sichtbar, aber nicht `PRODUCTLINE`/`CHANNEL` als Ziel-Dimensionsnachweis. |
| `REPORTING-011` | Analysis Views erreichbar, aber `RM-PLCH` nicht angelegt; Feldzuordnung nicht sicher genug. |
| `REPORTING-013` | Feldpositionen auf `REVENUE` sind belegt, aber `New/Neu` ist ungescoped zu riskant; Gate verbraucht/rejected. |
| `REPORTING-014` | Buch-/Governance-Sync: weiteres Analysis-View-Setup braucht neues Gate. |

## Buchaenderung

Im UAT-Fall `UAT-K25-001` wurden die Tabellenzeilen geschaerft:

- `Status`: Ziel-UAT fuer deutschen Reportingfall, aktueller RM-DEMO-Stand ist Labor-/Negativbefund.
- `Zielvoraussetzung` statt neutraler Voraussetzung.
- `Aktueller RM-DEMO-Gegenstand`: `PS-INV103297` und Artikelposten `792`, aber keine Financial-Reports-Summe.
- `Ziel-Testdaten` statt neutraler Testdaten.
- `Ziel-Akzeptanzkriterium` statt neutralem Akzeptanzkriterium.
- `Aktueller RM-DEMO-Nachweis`: Reporting-Evidence-Kette und Gate-Grenze.

## Anfaenger-Lernwert

Eine Dimension am Beleg oder Artikelposten ist nicht automatisch eine GuV-Auswertung. Business Central hat mehrere Nachweisschichten:

1. Stammdimension am Artikel oder Debitor.
2. Dimension im konkreten Beleg.
3. Dimension an gebuchten Posten.
4. Sichtbarkeit in Sachposten, Analysis Views oder Financial Reports.
5. Abstimmung im Managementbericht oder Power BI.

`RM-DEMO` beweist bisher die Schichten 1 bis 3 fuer den O2C-Laborfall teilweise stark. Die Schichten 4 und 5 bleiben fuer `PRODUCTLINE`/`CHANNEL` offen.

## Grenzen

- Kein BC-Lauf.
- Kein Setup.
- Keine Buchung.
- Keine neue Analysis View.
- Kein Power-BI-Nachweis.
- Kein deutscher `19 %`-USt-Nachweis.
- Kein deutscher Kontenplan-Endstand.

## Naechster sinnvoller Schritt

Ohne Freigabe bleibt Reporting-Setup gesperrt. Der naechste No-Approval-Schritt sollte ein kleiner Governance-/Arbeitsplan-Sync sein, der entscheidet, ob ein neues gescoptes Reporting-Gate formuliert wird oder ob der naechste praktische Block aus dem Backlog dran ist.
