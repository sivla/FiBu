# TARGET-041 Base Unit of Measure Controlled Write Gate

Status: observed

Dieser Case legt genau eine Basiseinheit fuer den ersten Universaarl-Artikel an oder verifiziert sie. Er erzeugt keinen Artikel und keine Buchungswirkung.

Wichtig: Der erste TARGET-041-Lauf lief beim Grid-Feldschreiben in einen Timeout. Danach war `STK` sichtbar. Die erfolgreiche Wiederholung hat `STK` per Reopen nachgewiesen und keinen Duplikat-Datensatz erzeugt. Deshalb gilt `STK` als im TARGET-041-Komplex entstanden/gesichert; die Beschreibung `Stueck` ist noch nicht sichtbar bewiesen.

## Ergebnis

- Business Central stayed in playthru / UNIVERSAARL-DE.
- Page 209 Units of Measure / Einheiten was used as the scoped page.
- STK is visible after reopen.
- The first timed TARGET-041 attempt likely created or exposed the STK code; the successful rerun verified it without creating a duplicate.
- No item, setup, document, Preview Posting or Posting route was used.

## Grenzen

- No item is created.
- No item card Base Unit value is proven.
- Unit description Stueck is not proven visible.
- No posting group, VAT setup, document, Preview Posting, Posting, item ledger entry, value entry, G/L entry or VAT entry is proven.

## Screenshots

- playwright/projects/fibu-book5/img/target-041-010-units-before.png
- playwright/projects/fibu-book5/img/target-041-020-after-unit-attempt.png
- playwright/projects/fibu-book5/img/target-041-030-after-reopen-filtered-proof.png
