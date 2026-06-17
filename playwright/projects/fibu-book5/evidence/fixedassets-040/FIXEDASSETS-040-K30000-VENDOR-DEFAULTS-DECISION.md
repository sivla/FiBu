# FIXEDASSETS-040 - K30000 Vendor Defaults Decision

Status: `labor`, `decision`, `no-bc-run`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Vor-Evidence | `FIXEDASSETS-039-K30000-VENDOR-CARD-DEFAULTS-READONLY` |
| Gebucht | nein |
| BC-Lauf | nein |

## Ausgangspunkt

`FIXEDASSETS-039` hat die Kreditorenkarte `K30000` read-only geoeffnet. Sichtbar belegt sind:

- `K30000` / `Zollspedition Nord GmbH`
- `Payment Terms Code = 1M(8D)`
- `Payment Method Code = BANK`

Nicht sichtbar belegt sind:

- `Vendor Posting Group`
- `Gen. Bus. Posting Group`
- `Currency Code`
- Tax/VAT-Felder wie `Tax Area Code`, `Tax Liable` oder `VAT Bus. Posting Group`

## Entscheidung

Es wird keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung freigegeben.

Der naechste erlaubte Schritt ist ein enger read-only UI-Diagnoselauf:

`FIXEDASSETS-041-K30000-VENDOR-DEFAULTS-FIELD-DIAGNOSIS-READONLY`

Ziel dieses Laufs ist nicht, Werte zu aendern, sondern die buchungsrelevanten Kreditor-Defaults sichtbar oder begruendet nicht sichtbar nachzuweisen.

## Warum diese Reihenfolge richtig ist

Eine Anlagen-Einkaufsrechnung gegen `K30000` wuerde spaeter Kreditorenposten, Sachposten, moegliche Steuer-/Tax-Logik und Anlagenzugang beeinflussen. Die bisher sichtbaren Zahlungsdefaults sind dafuer hilfreich, aber nicht ausreichend. Fuer eine sichere Klickanleitung muss ein Anfaenger verstehen:

- Zahlungsbedingungen und Zahlungsmethode steuern Zahlung und Faelligkeit.
- Kreditorenbuchungsgruppe und Geschaeftsbuchungsgruppe steuern Kontenfindung und Buchungslogik.
- Waehrung beeinflusst Belegwaehrung, Umrechnung und offene Posten.
- Tax/VAT-Felder beeinflussen Steuerermittlung, bleiben im CRONUS-USA-Labor aber nicht automatisch deutscher USt-Nachweis.

Wenn diese Felder nicht sichtbar sind, ist das ein Diagnosefall fuer UI-Sichtbarkeit und technische Nachweisfuehrung, nicht die Freigabe zum Buchen.

## Erlaubter naechster Diagnoselauf

`FIXEDASSETS-041` darf:

1. `Vendor Card` fuer `K30000` in `RM-DEMO` read-only oeffnen.
2. Breite Layoutansicht nutzen und die FactBox ausblenden, wenn dadurch Zielwerte besser sichtbar werden.
3. Kartennahe `Mehr anzeigen`-Aktionen auf relevanten FastTabs nutzen.
4. Personalisieren verwenden, um ausgeblendete Felder/Spalten/Aktionen als UI-Sichtbarkeitsproblem zu diagnostizieren.
5. Page Inspection / Seitenpruefung verwenden, um Page, Source Table und Feldkontext technisch zu belegen.
6. Screenshots nur behalten, wenn sie das beabsichtigte Lernziel wirklich zeigen: Feldname plus Wert oder einen sauber erklaerten Nicht-sichtbar-Befund.

## Gesperrt

- keine Einkaufsrechnung
- kein Anlagenzugang
- keine AfA
- keine Buchung
- keine Kreditor-Aenderung
- keine neue Company
- kein API-Shortcut
- keine deutsche `19 %` USt- oder deutsche Kontenplan-Finalbehauptung

## Buchwirkung

Kapitel 21 soll den Kreditorencheck als Pflichtkontrollpunkt vor dem Anlagenkauf behandeln. Die sichtbare Zahlungseinrichtung reicht als erster Lernanker, aber nicht als Buchungsfreigabe. Der naechste Buchbild-Kandidat muss die buchungsrelevanten Defaults oder deren begruendete Nicht-Sichtbarkeit zeigen.

Das passt zugleich in das spaetere Kapitel zu BC-Debugging und technischer Nachweisfuehrung: `Mehr anzeigen`, Personalisieren und Page Inspection sind Hilfsmittel, wenn ein erwartetes Feld in der Standardansicht nicht sichtbar ist.

## Naechster Schritt

`FIXEDASSETS-041-K30000-VENDOR-DEFAULTS-FIELD-DIAGNOSIS-READONLY`

Stop-Kriterium: Sobald ein Wert geaendert werden muesste oder ein Kaufbeleg vorbereitet werden soll, abbrechen und neues Setup-/Posting-Gate schreiben.
