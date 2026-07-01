# TARGET-036E2 First Item Controlled Write Gate Retry

Status: observed

Dieser Case hat den ersten Universaarl-Artikel kontrolliert erzeugt und anschliessend erneut geoeffnet. Beim zweiten Lauf war der Artikel bereits vorhanden; der Lauf hat deshalb keine Dublette angelegt, sondern den vorhandenen Datensatz erneut belegt.

## Ergebnis

- Business Central blieb in playthru / UNIVERSAARL-DE.
- U-ITEM-HW100 / Universaarl Hardware 100 ist nach gefiltertem Reopen sichtbar.
- Die Basiseinheit STK ist am Artikel sichtbar.
- Vorlage anwenden, Buchungsgruppen, USt-Gruppen, Belege, Preview Posting und Posting wurden nicht verwendet.

## Grenzen

- Der Artikel ist noch nicht buchungsbereit.
- Keine Artikelbuchungsgruppe, Produktbuchungsgruppe oder USt-Produktbuchungsgruppe ist fachlich bewiesen.
- Keine Verkaufs-, Einkaufs-, Lager-, Wert-, Sach- oder USt-Posten sind entstanden.

## Screenshots

- playwright/projects/fibu-book5/img/target-036e2-005-units-before-item-write.png
- playwright/projects/fibu-book5/img/target-036e2-010-items-before.png
- playwright/projects/fibu-book5/img/target-036e2-020-after-item-attempt.png
- playwright/projects/fibu-book5/img/target-036e2-030-after-reopen-filtered-proof.png
