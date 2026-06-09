# REPORTING-011 Analysis View PRODUCTLINE/CHANNEL Fit

| Feld | Wert |
|---|---|
| Sandbox | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | `labor`, `ui-first`, `setup-fit`, `no-posting`, `not-final` |
| Ziel-Analysis-View | `RM-PLCH` - RM PRODUCTLINE CHANNEL |
| Dimension 1 | `PRODUCTLINE` |
| Dimension 2 | `CHANNEL` |
| Fit-Status | `rejected` |
| UI-Fit-Hinweis | Analysis Views list reachable, but no safe editable field mapping for UI-first fit in this run. editModeAvailable=false, editableTextControls=0. New action is intentionally not used until the card/list field mapping is documented. |
| Analysis by Dimensions geklickt | nein |
| Matrix/Analyse sichtbar | nein |
| Gebucht | nein |

## Was wurde geprueft?

Der Lauf hat die genehmigte Reporting-Einrichtung nicht per API, sondern ueber die Business-Central-UI versucht. Ziel war eine eigene Labor-Analysis-View fuer das Buchziel `PRODUCTLINE` und `CHANNEL`, weil die vorhandene `REVENUE`-Analysis-View laut `REPORTING-004` andere Dimensionen nutzt.

## Ergebnis

Der UI-first-Fit ist in diesem Lauf nicht belastbar gelungen. Das ist ein verwertbarer Lernfall: Die Einrichtung darf nicht heimlich per API abgekuerzt werden; fuer das Buch braucht es einen stabilen Klickpfad fuer Analysis Views oder eine sauber dokumentierte Laborgrenze.

## Anfaenger-Lernwert

Eine Dimension am Beleg oder Posten bedeutet noch nicht automatisch, dass ein Finanzbericht sie auswerten kann. Business Central braucht dafuer einen Reporting-Kontext, zum Beispiel eine passende Analysis View. Diese Einrichtung ist fachlich risikoaermer als eine Buchung, aber trotzdem ein bewusster Setup-Schritt.

## Buchwirkung

Kapitel 10 und 25 muessen `Dimension vorhanden` und `Dimension im Reporting nutzbar` getrennt erklaeren. Screenshots aus diesem Lauf sind Laborbilder fuer die Analysis-View-Einrichtung, nicht fuer deutsche Steuer- oder Abschlussaussagen.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`.
- Keine deutsche `19 %` USt.
- Kein deutscher Kontenplan-Endstand.
- Keine Zahlung, keine Bankabstimmung, keine neue O2C-/P2P-Buchung.

## Naechster Schritt

REPORTING-012 Blocker aus REPORTING-011 auswerten; entweder UI-Hebel fuer Analysis View Card/List ergaenzen oder Gate als nicht praktikabel schliessen.
