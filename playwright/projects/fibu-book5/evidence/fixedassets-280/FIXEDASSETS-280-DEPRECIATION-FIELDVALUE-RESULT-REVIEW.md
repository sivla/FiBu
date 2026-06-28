# FIXEDASSETS-280 Depreciation Field-value Result Review

Status: `local-review`, `judge-work`, `fixed-assets`, `no-bc-run`, `no-playwright-run`, `no-posting`, `not-final`, `de-final-open`.

## Entscheidung

`FIXEDASSETS-279` wird als Kartenwertnachweis akzeptiert. Die Anlagenkarte `FA-CNC-01` zeigt fuer `HGB` die relevanten AfA-Basiswerte:

| Pruefpunkt | Wert |
|---|---|
| AfA-Buch | HGB |
| Anlagenbuchungsgruppe | MACHINES |
| AfA-Methode | Straight-Line |
| AfA-Startdatum | 01.01.2026 |
| Nutzungsdauer | 8,00 |
| AfA-Enddatum | 31.12.2033 |
| Buchwert | 120.000,00 |
| Anschaffungskosten | 120.000,00 |

Damit ist der alte Blocker aus `FIXEDASSETS-277/278` geloest: Die konkreten Kartenwerte sind nicht mehr offen.

## Warum trotzdem kein OK-Retry

Ein weiterer Klick auf `OK` in `Calculate Depreciation` waere noch nicht sinnvoll. Fruehere kontrollierte OK-Laeufe haben keine sichtbare `FADEP`-Journalzeile gezeigt. Die aktuelle Luecke liegt deshalb nicht mehr primaer in fehlenden Kartenwerten, sondern in der Frage:

- In welchem `Fixed Asset G/L Journal`-Template/-Batch landet die Ausgabe?
- Welche Filter oder zuletzt verwendeten Request-Page-Werte sind aktiv?
- Wird eine Zeile erzeugt, aber in einem anderen Batch/Filterkontext nicht gesehen?
- Gibt es weiterhin eine AfA-Faelligkeits-/Periodenlogik, die keine Zeile erzeugt?

## Naechster Live-Schritt

Naechster Case: `FIXEDASSETS-281-FA-DEPRECIATION-JOURNAL-BATCH-TARGET-READONLY`.

Der naechste Lauf darf nur read-only/no-OK pruefen:

- `Fixed Asset G/L Journals` Kontext
- Journal-Template/-Batch-/Filter-Signale
- vorhandene `FADEP`-Signale
- falls sicher: `Calculate Depreciation` Request Page ohne `OK`

Nicht freigegeben:

- `OK` bestaetigen
- Preview Posting
- Post
- Setup Change
- Company Switch
- API Shortcut

## Buchwirkung

Die Klickanleitung kann jetzt sauber erklaeren:

1. Zuerst Anlagenkarte und AfA-Buchwerte verstehen.
2. Danach Batch-/Journal-Ausgabeziel pruefen.
3. Erst wenn eine Journalzeile sichtbar ist, kann Preview Posting oder Postenspur als eigener Gate-Schritt betrachtet werden.

Das ist ein wichtiger Anfaengerpunkt: Kartenwerte sind Voraussetzung, aber kein Buchungsnachweis.
