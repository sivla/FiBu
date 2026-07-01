# TARGET-046 Item Inventory Posting Group Source Mapping

Status: `observed`

Instanz: `playthru`

Company: `UNIVERSAARL-DE`

Dieser Lauf war ein lokaler Quellen- und Evidence-Lauf. Business Central wurde nicht geoeffnet und Playwright wurde nicht gestartet.

## Ergebnis

`U-ITEM-HW100` darf noch nicht einfach mit einer Lagerbuchungsgruppe beschrieben werden. Die bisherige Artikelkartenroute zeigt `Basiseinheit STK`, `Lagerbestand 0` und den Artikelkontext, aber nicht genug Feld- und Wertwahrheit fuer `Lagerbuchungsgruppe` / `Item Posting Group`.

Microsoft Learn trennt die Logik:

- Posting Groups verbinden Stammdaten, Belege und Sachkonten.
- Inventory Posting Groups werden im Inventory Posting Setup mit Konten verknuepft.
- Inventory Posting Setup basiert technisch auf `Location Code`, `Invt. Posting Group Code` und `Inventory Account`.

Die Universaarl-Evidence zeigt bisher nur die Oberflaechen `Item Posting Groups` und `Inventory Posting Setup`, aber keine eingerichtete Zeile.

## Nicht bewiesen

- Keine Lagerbuchungsgruppe ist auf `U-ITEM-HW100` bewiesen.
- Keine Lagerbuchungsgruppe ist in `UNIVERSAARL-DE` als Zielwert bewiesen.
- Keine Inventory-Posting-Setup-Zeile fuer `SAAR-HL` ist bewiesen.
- Kein SKR04-Lagerkonto ist entschieden oder angelegt.
- Keine Buchungsfaehigkeit, keine Preview, keine Buchung, keine Item Ledger Entries, keine Value Entries, keine Sachposten.

## Naechster Schritt

`TARGET-047-ITEM-INVENTORY-POSTING-SETUP-DECISION`

Der naechste Schritt soll noch keinen BC-Write ausfuehren. Er entscheidet zuerst source-backed:

- welcher Inventory Posting Group Code fuer `U-ITEM-HW100` sinnvoll ist,
- ob `SAAR-HL` die erste Location-Kombination ist,
- welches SKR04-orientierte Lagerkonto benoetigt wird,
- ob vorher ein weiteres Sachkonto angelegt werden muss.

Danach erst darf ein separater UI-Write-Gate vorbereitet werden.
