# REPORTING-003 Dimension Perspective in Financial Reports

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, read-only, no-posting |
| Ausgangsbeleg | O2C-Laborrechnung `PS-INV103297` |
| Ausgangsreport | `Income Statement` |
| Viewport | `1920x1200`, breite Layoutansicht |

## Kernergebnis

| Frage | Befund |
|---|---|
| Financial Reports geoeffnet | ja |
| Income Statement markiert | ja |
| Dimension Perspective geklickt | ja |
| Sichtbarer Dimension-Perspective-Kontext erreicht | nein |
| Nach Aktion im Role Center gelandet | ja |
| PRODUCTLINE sichtbar nach Klick | nein |
| CHANNEL sichtbar nach Klick | nein |
| PRODUCTLINE=MACHINE sichtbar nach Klick | nein |
| CHANNEL=B2B sichtbar nach Klick | nein |

## Anfaenger-Lernwert

Eine Dimension am gebuchten Posten ist noch keine automatische Berichtsauswertung. In Business Central muss ein Finanzbericht, eine Dimensionsperspektive, ein Dimensionsbericht oder eine Analysis View die Dimension auch sichtbar als Filter, Zeile oder Spalte anbieten. Dieser Lauf zeigt zusaetzlich: Ein sichtbarer Menuepunkt ist noch kein fertiger Klickpfad, wenn der UI-Zustand danach nicht den erwarteten Kontext zeigt.

## Buchwirkung

Der Buchtext darf weiterhin sagen, dass `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` am O2C-Artikelposten im Labor nachgewiesen sind. Er darf aber noch nicht behaupten, dass Financial Reports diese Dimensionen bereits als GuV-/Revenue-Auswertung zeigen. Fuer das finale Buchbild braucht es einen separaten Nachweis der Reportingachse.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Keine neue Buchung, keine Berichtseinrichtung und keine Stammdatenanlage.
- Der Versuch `Definitions -> Dimension Perspective` fuehrte in diesem Lauf nicht zu einer sichtbaren Dimensionsperspektive fuer `Income Statement`.
- Deutsche `19 %` USt bleibt offen.

## Naechster Schritt

Naechster read-only Hebel: Dimensions - Detail oder Analysis Views pruefen; der Menuepfad Dimension Perspective liefert in diesem Lauf keinen sichtbaren PRODUCTLINE/CHANNEL-Kontext.
