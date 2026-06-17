# FIXEDASSETS-039 - K30000 Vendor Card Defaults read-only

Status: `labor`, `read-only`, `vendor-card-defaults`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Status | vendor-card-visible-defaults-partial |
| Gebucht | nein |

## Ergebnis

Die K30000-Kreditorenkarte ist read-only erreichbar und zeigt Zielnummer sowie Zielname. Sichtbare Default-/Setup-Felder wurden extrahiert; nicht sichtbare Felder bleiben vor einer Einkaufsrechnung als Kontrollluecke markiert.

## Sichtbare Defaults / Felder

Die folgenden Werte sind die redaktionell gelesene Kurzfassung aus Screenshot, Seitentext und Signaldateien. Die JSON-Dateien bleiben als maschineller Rohbefund erhalten; diese Tabelle ist die nutzbare Buchwahrheit.

| Feld | Sichtbarkeit | sichtbare Werte / Kontext |
|---|---|---|
| No. | sichtbar | `K30000` |
| Name | sichtbar | `Zollspedition Nord GmbH` |
| Blocked | teilweise sichtbar | Feld/Label ist sichtbar; kein gesetzter Sperrwert wurde belastbar erkannt. |
| Payment Terms Code | sichtbar | `1M(8D)` |
| Payment Method Code | sichtbar | `BANK` |
| Vendor Posting Group | nicht sichtbar | In der aktuellen Kartenansicht nicht sichtbar belegt. |
| Gen. Bus. Posting Group | nicht sichtbar | In der aktuellen Kartenansicht nicht sichtbar belegt. |
| Currency Code | nicht sichtbar | In der aktuellen Kartenansicht nicht sichtbar belegt. |
| Tax Area Code / Tax Liable / VAT Bus. Posting Group | nicht sichtbar | In der aktuellen Kartenansicht nicht sichtbar belegt. |

Pruefentscheidung: `K30000` existiert als Labor-Kreditor und erste Zahlungsdefaults sind sichtbar. Fuer eine Einkaufsrechnung oder einen Anlagenzugang reicht das noch nicht, weil die buchungsrelevanten Posting-/Tax-/Currency-Defaults nicht sichtbar nachgewiesen sind.

## Lernwert fuer Anfaenger

Eine Kreditorenkarte ist nicht nur Name und Adresse. Sie steuert ueber Buchungsgruppen, Zahlungsbedingungen, Waehrung und Steuer-/Tax-Kontext, wie Business Central spaeter eine Einkaufsrechnung und offene Kreditorenposten verarbeitet. Wenn diese Defaults nicht sichtbar oder nicht passend sind, darf der Anlagenkauf nicht als fertig vorbereitet gelten.

## Buchwirkung

Kapitel 21 kann die Kreditorenkarte als Kontrollpunkt vor der Anlagen-Einkaufsrechnung fuehren. Der Laborbefund bleibt CRONUS-USA und ist kein deutscher USt-/Kontenplan-/HGB-Endstand.

Der naechste Buchabschnitt muss Anfaengern erklaeren: Auf der Kreditorenkarte sind nicht alle wichtigen Felder automatisch im ersten sichtbaren Ausschnitt. Wenn Buchungsgruppen, Waehrung oder Tax/VAT nicht sichtbar sind, ist das ein Diagnosepunkt fuer `Mehr anzeigen`, Personalisieren, Page Inspection oder eine gezielte Setup-/Field-Diagnose, nicht die Freigabe zur Einkaufsrechnung.

## Grenzen

- Read-only: keine Aenderung an K30000.
- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Sichtbarkeit einzelner Defaults haengt von aktueller Page-/Profil-/Personalisierungsansicht ab.
- Deutsche Zielwerte muessen spaeter in einer passenden deutschen Umgebung erneut belegt werden.

## Naechster Schritt

FIXEDASSETS-040-K30000-VENDOR-DEFAULTS-DECISION: decide whether missing/non-visible defaults require Personalisieren/Page Inspection/read-only field diagnosis or a narrow setup-fit gate before any purchase invoice.
