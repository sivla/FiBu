# INVENTORY-004 Zielbestandsplan RM-M100

Status: Planungs-/Readiness-Nachweis, keine BC-Ausfuehrung, keine Buchung.

## Ausgangspunkt

`INVENTORY-003` erklaert den negativen Laborwert fuer `RM-M100`: Im aktuellen Filterkontext `RM-DEMO`, `FRA-ZL`, `As Of Date = 08.06.2026` ist ein O2C-Abgang fuer `RM-M100` belegt, aber kein positiver Zugang oder Anfangsbestand fuer denselben Artikel und Lagerort.

Damit ist die naechste Frage nicht mehr: "Warum ist der Wert negativ?", sondern: "Welcher saubere positive Zugang soll vor finalen Buchbildern erzeugt werden?"

## Bewertete Optionen

| Option | Geeignet fuer | Vorteil | Risiko / Grenze | Entscheidung |
|---|---|---|---|---|
| Anfangsbestand / Opening Balance fuer `RM-M100` | stabile O2C-, Inventory- und Reporting-Buchbilder | kleinster kontrollierter Schritt; trennt Bestandsfit vom grossen Manufacturing-Prozess | ist kein Produktionsnachweis; muss als Opening-/Trainingsbestand markiert werden | empfohlen als naechster praktischer Readiness-Schritt |
| Einkauf von `RM-M100` | Handelswaren-Szenario | technisch oft einfacher als Fertigung | passt fachlich schlechter, weil `RM-M100` im Buch Fertigerzeugnis/Maschine ist | nicht bevorzugt |
| Montageauftrag | Kit-/Assembly-Lernfall | nuetzlich fuer Wartungskit oder einfache Baugruppe | `RM-M100` ist im Buch eher Manufacturing-Fall; Assembly waere fachlich anderes Kapitel | spaeter, nicht fuer diesen Fix |
| Fertigungsauftrag / Output `RM-M100` | finaler fachlicher Maschinenprozess | bester End-to-End-Nachweis fuer Rohmaterial, Verbrauch, Output und Herstellkosten | deutlich groesserer Setup-Block: BOM, Routing, Kapazitaeten, Verbrauch, Output, Kosten | spaeterer eigener Manufacturing-Block |
| Manuelle Sachposten | niemals als Bestandsfix | keine | erzeugt keine Artikel-/Wertposten und zerstoert die Lagerlogik | verboten |

## Empfehlung

Der naechste praktische Lauf sollte keinen neuen O2C-Verkauf und keine Warehouse-Aktivierung starten. Er sollte zuerst einen kleinen, expliziten Readiness-Plan fuer einen positiven Bestand `RM-M100` erstellen und danach, falls freigegeben, den Bestand ueber einen passenden Business-Central-Bestandsprozess erzeugen.

Fuer den aktuellen Lernstand ist die empfohlene Reihenfolge:

1. `RM-M100`-Anfangsbestand als Trainings-/Opening-Balance-Fall definieren.
2. Vor der Buchung pruefen: Artikel, Lagerort `FRA-ZL`, Inventory Posting Setup `FRA-ZL + RESALE = 14140`, Dimension `PRODUCTLINE=MACHINE`, Kosten `42.000`.
3. Preview- oder Kontrollmoeglichkeit nutzen, soweit die gewaehlte BC-Seite sie bietet.
4. Genau eine positive Bestandsbewegung fuer `RM-M100` erzeugen, z. B. Menge `2`, damit der bereits gebuchte Abgang `-1` im Labor nicht sofort wieder zu Null fuehrt.
5. Danach read-only pruefen: Artikelposten, Wertposten, Sachposten und `Inventory Valuation`.
6. Den Vorgang als CRONUS-USA-Labor-Opening-Balance markieren, nicht als deutschen Produktionsnachweis.

## Warum Menge 2?

Der aktuelle O2C-Laborabgang ist `-1`. Ein Anfangsbestand von `+1` wuerde den Bestand nur auf `0` bringen. Fuer Buchscreenshots ist ein kleiner positiver Restbestand didaktisch besser, weil Leser gleichzeitig Zugang, Abgang und Restbestand sehen koennen.

Empfohlener Zielwert fuer den naechsten praktischen Lauf:

| Feld | Zielwert |
|---|---|
| Artikel | `RM-M100` |
| Lagerort | `FRA-ZL` |
| Menge | `2` |
| Einstandspreis / Unit Cost | `42.000` |
| Erwarteter positiver Wertzugang | `84.000` |
| Bereits belegter O2C-Abgang | `-1` / `-42.000` |
| Erwarteter Rest nach aktuellem Laborabgang | `1` / `42.000` |
| Dimension | `PRODUCTLINE=MACHINE` |

Diese Werte sind Zielplanung, keine neue Evidence aus BC.

## Anfaenger-Lernwert

Ein Verkauf kann in BC nur dann sinnvoll bewertet werden, wenn der Artikelbestand vorher fachlich entstanden ist. Der Bestand kann aus Anfangsbestand, Einkauf, Montage oder Fertigung kommen. Welche Variante richtig ist, haengt vom Geschaeftsprozess ab.

Fuer `RM-M100` ist die langfristig beste fachliche Erklaerung die Fertigung. Fuer die naechsten stabilen Buchbilder ist ein klar markierter Anfangsbestand jedoch der kleinere und kontrollierbarere Schritt.

## Buchwirkung

Kapitel 13 und 23 sollten erklaeren:

- Negative Lagerbewertung ist ein Diagnosepunkt.
- Der Korrekturweg laeuft ueber Artikel-/Wertposten, nicht ueber manuelle Sachposten.
- Ein Anfangsbestand ist ein zulaessiger Trainings-/Opening-Balance-Fall, aber kein Fertigungsnachweis.
- Der spaetere Manufacturing-Block muss `RM-M100` noch einmal fachlich sauber ueber Output erzeugen.

## Grenzen

Dieser Plan beweist noch nicht:

- dass der Bestand in BC gebucht wurde,
- welche konkrete BC-Seite fuer den Bestandszugang genutzt wurde,
- ob Preview Posting auf dieser Seite verfuegbar ist,
- deutsche USt,
- deutschen Kontenplan,
- Manufacturing/BOM/Routing,
- Kostenregulierung oder Monatsabschluss.

## Naechster praktischer Schritt

Einen kontrollierten `INVENTORY-005`-Readiness-/Buchungslauf vorbereiten: BC-Seite fuer positiven `RM-M100`-Anfangsbestand identifizieren, nicht blind buchen, vorab Setup und moegliche Preview pruefen, danach genau eine positive Bestandsbewegung mit voller Postenspur dokumentieren.
