# REPORTING-016 Inventory Dimension Reporting Decision

Status: `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`

## Entscheidung

`REPORTING-015` reicht fuer eine Labor-Bucherklaerung, aber nicht fuer einen finalen Reporting-Nachweis.

Die passende Route ist deshalb:

1. Inventory-Labordraft mit der Grenze synchronisieren.
2. Keine neue Analysis-View- oder Financial-Report-Setup-Route sofort erzwingen.
3. Spaeter in deutscher Zielcompany neu beweisen, ob `PRODUCTLINE`/`CHANNEL` in Sachposten, Dimensionsdetails, Analysis Views oder Financial Reports wirklich auswertbar sind.

## Was gilt als bewiesen?

- `INV008-899959` wurde read-only in Artikelposten, Wertposten, Sachposten und Analysis Views geprueft.
- `PRODUCTLINE=MACHINE` ist im Artikelposten-Dimensionskontext sichtbar.
- `PRODUCTLINE=MACHINE` ist im Wertposten-Dimensionskontext sichtbar.
- Sachposten zeigen `14140` und Betrag, aber keinen sichtbaren `PRODUCTLINE`-/`CHANNEL`-Nachweis.
- Analysis Views sind erreichbar, aber `PRODUCTLINE`/`CHANNEL` wurden dort nicht als Achse bewiesen.

## Was gilt nicht als bewiesen?

- Keine Reporting-Summenwirkung nach `PRODUCTLINE`.
- Keine Reporting-Summenwirkung nach `CHANNEL`.
- Kein deutscher Finalnachweis.
- Kein deutscher Kontenplan- oder Steuerfinalstand.
- Keine Aussage, dass der Item-Journal-Zugang ein kreditorischer P2P-Wareneingang ist.

## Buchwirkung

Der Inventory-Labordraft darf erklaeren:

- Dimensionen koennen im Posten-/Dimensionskontext sichtbar sein.
- Sichtbare Postendimension ist nicht automatisch eine fertige Berichtsauswertung.
- Fuer Reporting braucht es einen separaten sichtbaren Nachweis in Analysis Views, Financial Reports oder Dimensionsdetails.

## Naechster Schritt

`REPORTING-017-INVENTORY-DIMENSION-BOOKMASTER-SYNC`: Kapitel 13 im Buchmaster kompakt mit diesem Laborhinweis abgleichen, ohne deutsche Finalclaims.
