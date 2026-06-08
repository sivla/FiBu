# INVENTORY-002 Inventory Valuation

Status: Labor-Nachweis, read-only, keine Buchung.

## Situation

Nach `INVENTORY-001` waren Artikelposten, Wertposten und Sachposten fuer O2C und P2P sichtbar. Offen war, ob Business Central daraus einen Lagerbewertungsbericht mit Item- und Lagerortfilter erzeugt.

## Was wurde getan?

- Sandbox: `MCP_1_20260210`
- Company: `RM-DEMO`
- Bericht: `Inventory Valuation`
- As Of Date: `08.06.2026`
- Item-Filter: `RM-M100|RAW-STEEL`
- Location Filter: `FRA-ZL`
- Modus: read-only; es wurde keine Buchung und keine Einrichtungsaenderung ausgefuehrt.

## Was sieht ein Anfaenger?

Die Request Page zeigt, dass ein Lagerbewertungsbericht nicht nur ueber den Berichtsnamen gestartet wird. Entscheidend sind Stichtag, Artikelfilter und Lagerortfilter. Der erfolgreiche Laborlauf setzt `As Of Date`, weil eine Lagerbewertung immer als Stichtagsbetrachtung gelesen werden muss.

## Was wurde nachgewiesen?

- `RAW-STEEL`: Menge `10,00`, Unit Cost `2.500,00`, Inventory Value `25.000,00`.
- `RM-M100`: Menge `-1,00`, Unit Cost `42.000,00`, Inventory Value `-42.000,00`.
- `Total Inventory Value`: `-17.000,00`.
- Der Bericht zeigt den Filterkontext `Item: No.: RM-M100|RAW-STEEL, Location Filter: FRA-ZL`.

## Buchwirkung

Kapitel zu Lagerbewertung und Abschluss duerfen jetzt im Labor erklaeren, wie aus Artikelposten und Wertposten ein stichtagsbezogener Lagerbewertungsbericht entsteht. Die Zahlen sind CRONUS-USA-Laborwerte und duerfen nicht als deutscher Kontenplan-, USt- oder Abschluss-Endstand formuliert werden.

## Grenze

Der Bericht beweist keine deutsche 19-Prozent-USt, keine Kostenregulierung und keinen deutschen Kontenplan. Die negative Menge/Wert fuer `RM-M100` ist ein Laborbefund aus der bewusst isolierten O2C/P2P-Spielwiese und muss vor finalen Buchbildern in einer konsistenten deutschen Zielumgebung neu bewertet werden.

## Naechster Schritt

Den negativen Lagerwert als Lernfall analysieren: Bestand vor Verkauf, Kostenkette und ob fuer finale Buchbilder zuerst ein sauberer Anfangsbestand oder Einkaufszugang fuer `RM-M100` noetig ist.
