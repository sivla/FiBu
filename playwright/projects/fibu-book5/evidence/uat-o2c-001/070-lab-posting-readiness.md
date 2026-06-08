# UAT-O2C-001 Labor-Buchungsfreigabe

## Zweck

Einmalige CRONUS-USA-Laborbuchung zur Erzeugung von Postenspur-Evidence.

## Darf beweisen

- BC kann den Laborauftrag buchen.
- Eine gebuchte Verkaufsrechnung entsteht.
- Debitorenposten entstehen.
- Sach-/Artikel-/Wertposten koennen geprueft werden.
- Dimensionen koennen nach Buchung gesucht werden.

## Darf nicht beweisen

- deutscher 19-%-USt-Endstand
- deutscher Kontenplan-Endstand
- finale deutsche Buchscreenshots
- produktive Buchungsfreigabe

## Vorbedingungen

- richtiger Auftrag
- Debitor `D10000`
- Artikel `RM-M100`
- Menge `1`
- Lagerort `FRA-ZL`
- Waehrung `EUR`
- Inventory Posting Setup `FRA-ZL` + `RESALE` = `14140`
- `Preview Posting` erfolgreich
- Steuer `0 %` als CRONUS-USA-Laborgrenze dokumentiert
- `PRODUCTLINE=MACHINE` im Belegdialog nachgewiesen
- Cleanup-/Folgezustand bewusst akzeptiert

## Risiken

- Gebuchte Belege koennen nicht wie Entwuerfe geloescht werden.
- Der CRONUS-Laborzustand veraendert sich dauerhaft.
- Posten sind Labor-Evidence, kein deutscher Zielnachweis.

## Entscheidung

Laborbuchung ist erlaubt: ja

Begruendung:
Die nicht buchende `Posting Preview` wurde nach `MASTERDATA-009` erfolgreich geoeffnet und zeigt echte Vorschauarten. Der maximierte Read-only-Drilldown in `G/L Entry` zeigt `G/L Entries Preview` mit Konto `14140` und Betragswerten im Seitentext. Der Lauf bleibt ausdruecklich CRONUS-USA-Labor und darf keinen deutschen Steuer- oder Kontenplan-Endstand beweisen.
