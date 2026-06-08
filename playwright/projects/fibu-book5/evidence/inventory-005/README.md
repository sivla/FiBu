# INVENTORY-005 Evidence Index

Status: Labor-Readiness, read-only, keine Buchung.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `INVENTORY-005-TARGET-STOCK-READINESS.md` | Lern-/Buchnotiz | Page `40`/`Item Journals` ist der naechste kontrollierte Einstieg fuer `RM-M100 +2`; zentrale Journalfelder und Grenzen sind erklaert | keinen gebuchten Bestand, keine Postenspur, keinen DE-Finalnachweis | labor |
| `INVENTORY-005-TARGET-STOCK-READINESS-result.json` | strukturierte Evidence | Sandbox, Company, Zielplan, Page-40-Befund, Tell-Me-Befund, sichtbare Felder/Aktionen und `no posting` | keine Preview-Zahlenwirkung und keine Dimension in der Journalzeile | labor |
| `010-item-journal-direct-page-text.txt` | Seitentext | `Item Journals`, `Post`, Batch Name und zentrale Zeilenfelder sind im BC-Kontext sichtbar | keine finale Sichtfreigabe fuer alle Spalten; Rohtext enthaelt BC-Shell-Artefakte | labor |
| `010-item-journal-direct-buttons.json` | Buttonliste | sichtbare Aktionsnamen aus Page `40` | keine fachliche Buchungswirkung | labor |
| `inventory-005-010-item-journal-direct.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des direkten Page-40-Screenshots | kein Bildinhalt allein ohne PNG | labor |
| `020-item-journals-tell-me-page-text.txt` | Seitentext | Tell-Me wurde mit `Item Journals` genutzt | keinen stabilen Klick auf einen Suchtreffer | labor |
| `020-item-journals-tell-me-buttons.json` | Buttonliste | sichtbare Buttonnamen im Suchkontext | keine fachliche Buchungswirkung | labor |
| `inventory-005-020-item-journals-tell-me.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des Tell-Me-Screenshots | kein Bildinhalt allein ohne PNG | labor |

## Aktuelle Wahrheit

`INVENTORY-005` hat nicht gebucht und keine Ziel-Journalzeile fuer `RM-M100 +2` angelegt. Der Lauf belegt den Einstieg fuer den naechsten kontrollierten Schritt: `Item Journals` ist ueber Page `40` erreichbar, Tell-Me zeigt den Einstieg, und wichtige Felder fuer eine spaetere positive Bestandsbewegung sind sichtbar. Das direkte Bild zeigt den Batch `DEFAULT` und eine leere/default Tabellenzeile, aber keinen Zielartikel `RM-M100`, keinen Ziellagerort `FRA-ZL` und keine Zielmenge `2` im Zielkontext. `Preview Posting` und Dimensionen sind im direkten Journalbild noch nicht sichtbar nachgewiesen.

## Naechster Schritt

`INVENTORY-006`: Journalzeile fuer `RM-M100 +2` in `FRA-ZL` kontrolliert vorbereiten, `PRODUCTLINE=MACHINE` und Preview-/Kontrollmoeglichkeit klaeren, nur bei passendem Zielbild genau einmal buchen und danach Artikelposten, Wertposten, Sachposten sowie `Inventory Valuation` sichern.
