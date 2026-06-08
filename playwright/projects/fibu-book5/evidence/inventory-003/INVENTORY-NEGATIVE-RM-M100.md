# INVENTORY-003 Negative Lagerbewertung RM-M100

Status: Labor-Erklaerung aus vorhandener Evidence, read-only, keine Buchung.

## Situation

`INVENTORY-002` zeigt im Bericht `Inventory Valuation` fuer `RM-DEMO`:

| Artikel | Menge | Lagerwert |
|---|---:|---:|
| `RAW-STEEL` | `10,00` | `25.000,00` |
| `RM-M100` | `-1,00` | `-42.000,00` |
| Summe | | `-17.000,00` |

Der Bericht wurde mit `As Of Date = 08.06.2026`, Artikelfilter `RM-M100|RAW-STEEL` und `Location Filter = FRA-ZL` erzeugt. Er ist ein CRONUS-USA-Laborbild, kein deutscher Abschlussnachweis.

## Was ist fachlich passiert?

Der positive Wert bei `RAW-STEEL` kommt aus der P2P-Laborbuchung:

- Einkaufsbestellung `106049` wurde als gebuchte Einkaufsrechnung `108219` nachgewiesen.
- Artikelposten `793` zeigt `RAW-STEEL`, Lagerort `FRA-ZL`, Menge `10`.
- Wert-/Sachposten zeigen den Kostenbezug `25.000` und das Labor-Bestandskonto `14140`.

Der negative Wert bei `RM-M100` kommt aus der O2C-Laborbuchung:

- Verkaufsauftrag `S-ORD101068` wurde als gebuchte Verkaufsrechnung `PS-INV103297` nachgewiesen.
- Wertposten verknuepfen die Rechnung mit Artikelposten `792`.
- Artikelposten `792` zeigt `RM-M100`, Lagerort `FRA-ZL`, Menge `-1`.
- Der Wertbezug aus der Evidence ist `Cost Amount = -42.000,00`.

Damit ist die Berichtssumme im Labor fachlich erklaerbar:

```text
RAW-STEEL  +25.000,00
RM-M100    -42.000,00
Total      -17.000,00
```

## Warum reagiert Business Central so?

`Inventory Valuation` erzeugt den Lagerwert nicht neu. Der Bericht liest die vorhandenen Artikel- und Wertposten im gewaehlten Filterkontext. Wenn in diesem Filterkontext ein Verkauf/Lagerabgang fuer `RM-M100` vorhanden ist, aber kein passender positiver Anfangsbestand, Einkauf, Output oder sonstiger Zugang fuer denselben Artikel und Lagerort belegt ist, erscheint der Bestand negativ.

Das ist im Buch wichtig: Ein negativer Lagerwert ist nicht automatisch ein Screenshot- oder Reportfehler. Er ist ein Pruefsignal fuer die Bestands- und Kostenkette.

## Was muss ein Anfaenger pruefen?

1. Stimmt der Stichtag des Berichts?
2. Stimmt der Artikelfilter?
3. Stimmt der Lagerortfilter?
4. Gibt es fuer den negativen Artikel einen Artikelposten mit Abgang?
5. Gibt es vorher oder im selben Bewertungszeitraum einen passenden Zugang?
6. Stimmen Wertposten und Sachposten zur Bewegung?

Im Labor ist fuer `RM-M100` der Abgang belegt. Ein positiver Zugang fuer `RM-M100` in `FRA-ZL` ist in der aktuellen Evidence-Kette nicht belegt. Deshalb wird der Befund als Labor-Lernfall, nicht als finaler Zielbestand markiert.

## Korrekturweg fuer finale Buchbilder

Fuer finale deutsche Buchscreenshots sollte der Zielbestand vor dem Verkauf sauber vorbereitet werden. Sinnvolle Wege sind:

- Anfangsbestand fuer `RM-M100` in der Zielumgebung dokumentiert einbuchen.
- Oder `RM-M100` ueber Einkauf, Montage oder Fertigung mit passendem Zugang erzeugen.
- Danach O2C erneut laufen lassen und `Inventory Valuation` mit Stichtag, Artikel- und Lagerortfilter pruefen.
- Falls der Abschlussprozess es verlangt, Kostenregulierung und Lagerkostenbuchung separat pruefen und nicht stillschweigend voraussetzen.

Nicht sinnvoll ist:

- Den Bericht zu "korrigieren".
- Manuelle Sachposten als Ersatz fuer fehlende Artikel-/Wertposten zu buchen.
- Den CRONUS-USA-Laborwert als deutschen Abschlusswert zu verwenden.

## Buchwirkung

Kapitel 13 und 23 sollten den negativen Laborwert bewusst zeigen oder mindestens als Fehler-/Lernkasten erklaeren. Das Buch soll nicht nur sagen, wo `Inventory Valuation` geoeffnet wird, sondern warum ein Leser bei negativen Werten zur Postenspur zurueckgehen muss.

## Grenze

Dieser Nachweis erklaert den aktuellen Laborbefund. Er beweist nicht:

- deutsche 19-%-USt,
- deutschen Kontenplan,
- sauberen deutschen Anfangsbestand,
- Warehouse-Logik,
- Kostenregulierung,
- finale Monatsabschluss-Abstimmbarkeit.

## Naechster Schritt

Vor Warehouse oder Manufacturing einen kleinen Zielbestandsplan fuer `RM-M100` formulieren: Welche Buchung oder welcher Prozess erzeugt den positiven Bestand fuer finale Buchbilder, ohne die aktuelle Laborrechnung erneut zu buchen?
