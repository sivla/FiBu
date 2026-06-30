# PREP-046 Bookmaster Starter Data Universaarl Cleanup

## Zweck

Dieser Prep-Lauf bereinigt den aktiven Starterdaten-Abschnitt in Kapitel 6 des Buchmasters. Der Abschnitt soll nicht mehr wie eine aktive Rhein-Main-/RM-DEMO-Zielwelt wirken, sondern als Universaarl-Zielbild fuer die spaetere Company `UNIVERSAARL-DE` lesbar sein.

## Geaendert

- Aktive Artikelcodes im Starterpaket wurden auf `U-ITEM-*` umgestellt.
- Aktive Debitorencodes wurden auf `U-CUST-*` umgestellt.
- Aktive Kreditorencodes wurden auf `U-VEND-*` umgestellt.
- Aktive Dimensionen und Lagerorte wurden auf Universaarl-/Saarland-Zielcodes ausgerichtet.
- Die praktische Einrichtungsreihenfolge startet jetzt mit `UNIVERSAARL-DE` statt `RM-PROD`.
- Der Abschnitt sagt klar, dass die Daten erst nach Company Creation und Setup-Gates angelegt werden.

## Grenzen

- Keine Business-Central-Ausfuehrung.
- Kein Playwright-Lauf.
- Keine Company Creation.
- Keine Stammdatenanlage.
- Kein Setup Change.
- Kein Preview Posting.
- Kein Posting.

## Naechster sinnvoller Schritt

Nach ausdruecklicher SUPER-/Company-Create-Rechtefreigabe bleibt `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` der naechste praktische Schritt: `Mandanten -> Pfeil neben Neu -> Neues Unternehmen erstellen`.
