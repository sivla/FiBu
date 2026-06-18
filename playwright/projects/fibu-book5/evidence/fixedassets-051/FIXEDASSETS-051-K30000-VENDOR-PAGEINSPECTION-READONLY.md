# FIXEDASSETS-051 - K30000 Vendor Page Inspection read-only

## Situation

Vor einem Anlagenkauf mit Kreditor `K30000` mussten die bisher nicht sichtbaren Kreditoren-Defaults technisch geklaert werden. Fruehere Laeufe zeigten die Kreditorenkarte und Zahlungswerte, aber nicht belastbar `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code` oder `VAT Bus. Posting Group`.

## Durchgefuehrt

- Vendor Card Page `26` direkt fuer `K30000` in `RM-DEMO` geoeffnet.
- Breiter Viewport `2600 x 1400` genutzt.
- FactBox soweit moeglich ausgeblendet.
- Page Inspection mit `Ctrl+Alt+F1` geoeffnet.
- Page-Inspection-Feldliste read-only gescrollt und Feldbloecke strukturiert gesichert.

Es gab keine Kreditor-Aenderung, keine gespeicherte Personalisierung, keine Einkaufsrechnung, keinen Anlagenzugang, keine AfA, keine Buchung, keinen API-Shortcut und keinen Company-Wechsel.

## Ergebnis

Page Inspection ist in diesem Lauf stabil per `Ctrl+Alt+F1` aufgegangen.

Technisch belegt:

- Page: `Vendor Card (26, Card)`
- Table: `Vendor (23)`
- Vendor: `K30000`
- Name: `Zollspedition Nord GmbH`

Feldwerte aus der Page-Inspection-Feldliste:

| Feld | Wert | Buchwirkung |
|---|---|---|
| `Vendor Posting Group` | `DOMESTIC` | Kreditorenbuchungsgruppe ist technisch belegt |
| `Gen. Bus. Posting Group` | `DOMESTIC` | Geschaeftsbuchungsgruppe ist technisch belegt |
| `Currency Code` | leer | keine Fremdwaehrung am Kreditor; Belegwaehrung muss spaeter bewusst gesetzt/geprueft werden |
| `VAT Bus. Posting Group` | leer | kein deutscher VAT-Finalnachweis; CRONUS-USA-Laborgrenze bleibt |
| `Tax Area Code` | leer | kein Tax-Area-Wert am Kreditor |
| `Tax Liable` | `Nein` | US-Tax-Kontext bleibt fuer diesen Kreditor begrenzt |
| `Payment Terms Code` | `1M(8D)` | Zahlungsbedingung ist technisch und auf der Karte sichtbar belegt |
| `Payment Method Code` | `BANK` | Zahlungsart ist technisch und auf der Karte sichtbar belegt |

## Screenshot-Qualitaet

`fixedassets-051-010-k30000-vendor-card-before-pageinspection.png` zeigt den Kartenkontext, aber nicht die ausgeblendeten Default-Codes.

`fixedassets-051-020-pageinspection-context.png` zeigt Page Inspection mit `Vendor Card (26, Card)` und `Vendor (23)`. Es ist ein Technik-/Debugging-Bild, aber kein perfektes Feldwerte-Buchbild, weil nicht alle kritischen Codes im Bildausschnitt lesbar sind. Der belastbare Wertebeweis liegt in `030-pageinspection-critical-field-blocks.json`.

## Anfaenger-Lernwert

Wenn Business Central ein Feld nicht auf der Karte zeigt, heisst das nicht automatisch, dass das Feld fehlt oder falsch eingerichtet ist. Die Seitenpruefung hilft zu klaeren:

- auf welcher Page man wirklich ist,
- welche Tabelle dahinter liegt,
- ob ein Feld in der Page-Datenquelle vorhanden ist,
- welcher Wert technisch im Datensatz steht.

Fuer Klickanleitungen bleibt aber wichtig: Ein technischer Page-Inspection-Nachweis ersetzt nicht automatisch einen gut lesbaren Anwender-Screenshot. Im Buch muss deshalb getrennt werden zwischen Anwenderbild und technischem Nachweis.

## Laborgrenze

Der Befund ist CRONUS-USA-Labor in `RM-DEMO`. Er beweist keinen deutschen Kontenplan, keine deutsche `19 %` USt, keinen deutschen Anlagen-Endstand und keine Buchungsfreigabe.

## Naechster Schritt

Ein Gate muss entscheiden, ob die technische Kreditoren-Readiness fuer einen read-only/no-posting Purchase-Invoice-Preflight reicht oder ob die Werte vorab noch besser UI-sichtbar gemacht werden muessen.
