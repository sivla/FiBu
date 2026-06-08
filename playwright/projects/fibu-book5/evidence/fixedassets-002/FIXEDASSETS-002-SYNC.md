# FIXEDASSETS-002 Sync nach Zielwertabgleich

Status: `labor-candidate`, `read-only`, `testdata-sync`, `no-posting`, `no-setup-change`, `not-final`.

## Entscheidung

Der erste `FIXEDASSETS-002`-Lauf vor Testdaten-Sync hat einen Widerspruch gefunden:

| Quelle | Wert |
|---|---:|
| Kapitel 21 | `120.000 EUR` |
| `resources-assets-projects.json` vor Sync | `250.000` |

Das Buch ist in Kapitel 21 mehrfach konsistent auf `120.000 EUR`: Alltagsszene, Schrittfolge, Uebung, Loesung und UAT-Fall verwenden denselben Betrag. Deshalb wurde die Testdatendatei auf `120000` harmonisiert. Der anschliessende erneute `FIXEDASSETS-002`-Lauf zeigt den aktuellen Stand als konsistent.

## Was jetzt gilt

| Objekt | Zielwert |
|---|---|
| Anlage | `FA-CNC-01` |
| Beschreibung | `CNC Maschine FRA` / `CNC-Anlage` |
| Zugangsbetrag | `120.000 EUR` |
| AfA-Buch | `HGB` |
| Methode | `Linear` |
| Nutzungsdauer | `8 Jahre` |
| Anlagenbuchungsgruppe | `MACHINES` |
| Kreditor | `K30000` |
| AfA bis | `30.06.2026` |

## Grenze

Dieser Sync beweist keine Business-Central-Einrichtung. Es wurde keine Anlage angelegt, kein AfA-Buch gesetzt, keine Einkaufsrechnung erfasst, keine Aktivierung gebucht und keine AfA gebucht.

## Buchwirkung

Kapitel 21 bleibt fachlich bei `120.000 EUR`. Der naechste praktische Lauf kann sich auf UI-Seitenoeffnungen und Setup-Readiness konzentrieren, ohne erneut ueber den Betrag zu stolpern.

## Naechster Schritt

`FIXEDASSETS-003`: gezielte UI-Seitenoeffnungen fuer `Anlagen`, `AfA-Buecher`/AfA-Kontext, `Anlagenbuchungsgruppen`, `Einkaufsrechnungen` und `Anlagenposten`. Danach erst entscheiden, ob ein idempotenter UI-Setup-Fit fuer `FA-CNC-01`, `HGB` und `MACHINES` sicher ist.
