# PREP-020 - Universaarl Dataset Blueprint

Status: `prep-done`, `dataset-blueprint`, `no-bc-run`, `no-playwright-run`

## Was wurde verbessert?

Der Universaarl-Dataset-Plan ist jetzt konkreter:

- Build-Wellen `W0` bis `W5` definieren die spaetere Reihenfolge von Company-Kontext, Finance Foundation, Stammdaten, ersten Postings, Datenreichtum und Spezialmodulen.
- Masterdata-Pakete `MD-CUSTOMERS-01`, `MD-VENDORS-01`, `MD-ITEMS-01`, `MD-LOCATIONS-01`, `MD-DIMENSIONS-01` und `MD-BANK-01` beschreiben konkrete Startdaten.
- Prozesspakete `PROC-O2C-01`, `PROC-P2P-01`, `PROC-INVENTORY-01`, `PROC-PAYMENT-01` und `PROC-CORRECTION-01` verbinden Stammdaten mit spaeteren Posten.
- `.agent/state/universaarl_dataset_blueprint.json` macht die wichtigsten Wellen, Pakete und Stop-Regeln maschinenlesbar.

## Grenze

Keine Business-Central-Ausfuehrung. Keine Stammdatenanlage. Keine Company Creation. Kein Setup. Kein Preview Posting. Kein Posting. Kein Playwright.

## Naechster Schritt

`PREP-021-UNIVERSAARL-USECASE-BACKLOG-CURATION`: Die Usecases sollen mit den neuen Datenpaketen verbunden und nach Abhaengigkeiten, Buchwert, Screenshotwert und Evidencebedarf sortiert werden.
