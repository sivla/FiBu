# Reader-Pass Notes

Status: redaktionelle Planung fuer Buch 5. Diese Datei ist kein Buchkapitel und keine neue Evidence.

## Aktuell am staerksten arbeitsdokumentarisch

| Kapitel | Befund |
|---|---|
| Kapitel 11 O2C | Sehr evidence-nah: Auftrag, Preview, Buchung und Postenspur sind stark, aber der Lesefluss springt noch zwischen Laborbefund, Zielbild und Fehlerfall. |
| Kapitel 12 P2P | Fachlich nutzbar, aber die Lernkurve `Vendor Invoice No.`, Template, ODataV4 und Laborbuchung braucht spaeter eine ruhigere Reihenfolge fuer Anfaenger. |
| Kapitel 13 Inventory/Warehouse | Inventory ist inzwischen gut belegt; Warehouse bleibt bewusst offen. Die Trennung muss fuer Leser noch klarer sichtbar werden. |
| Kapitel 23 Inventory Costing | Die Laborzahlen sind stark, wirken aber noch wie Projektnotizen. Vorher/Nachher, Postenarten und Kostenlogik brauchen eine kompakte Erzahleinfuehrung. |
| Kapitel 25 Reporting | Der aktuelle Stand ist ehrlich, aber negativlastig: Dimensionen sind am Artikelposten belegt, Financial Reports/Analysis Views liefern noch keine Produktlinienauswertung. |

## Konkrete Verbesserungsvorschlaege

| Kapitel | Verbesserung |
|---|---|
| 11 O2C | Mit einer Alltagsszene starten: Kunde bestellt Maschine. Danach erst Zielwerte, Stammdaten, Klickpfad, Preview, Buchung und Postenspur. Laborgrenze `0 % Tax` getrennt als Kasten. |
| 12 P2P | Vor der Bestellung eine Readiness-Box einfuegen: Kreditor, Artikel, Direct Unit Cost, Lagerort, `Vendor Invoice No.`. Danach den Fehlerfall als Lernmoment zeigen. |
| 13 Inventory/Warehouse | Inventory und Warehouse sichtbar trennen: einfacher Lagerort/Artikeljournal zuerst, gesteuertes Warehouse spaeter. `INVENTORY-008` als Trainingsbestand erklaeren, nicht als Fertigung. |
| 23 Inventory Costing | Ein Vorher/Nachher-Diagramm fuer `RM-M100` und `RAW-STEEL` nutzen: Artikelposten beantwortet Menge, Wertposten Wert, Sachposten Konto, Inventory Valuation Berichtssumme. |
| 25 Reporting | Reporting erst als offene Nachweiskette formulieren: Postendimension vorhanden, Berichtsauswertung noch nicht bewiesen. `Analysis Views` zeigen aktuell andere Dimensionen als das Buchziel. |

## Einheitliches Prozesskapitel-Schema

1. Alltagsszene
2. Ziel
3. Vorbedingungen
4. Stammdaten
5. Klickanleitung
6. Buchungsvorschau
7. Buchung
8. Postenspur
9. Kontrollberichte
10. Typische Fehler
11. Evidence Pack
12. Laborstand vs. finaler deutscher Zielstand

## Redaktionsregel

Laborbefunde duerfen im Buch stehen, wenn sie Lernwert haben. Sie muessen aber direkt als Labor markiert sein und duerfen nicht den finalen deutschen Zielstand ersetzen. Besonders kritisch sind Steuer, Kontenplan, Reporting-Summenwirkung, Warehouse und Manufacturing.
