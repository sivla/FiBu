# P2P-036 Gebuchte Purchase-Journal-Postenspur besser lesbar

Status: labor-proven, labor-sufficient-for-book-draft, needs-german-final-rebuild.

Quelle: P2P-032/P2P-033, Beleg `P2P032-682298`, RM-DEMO in `MCP_1_20260210`.

## Was sieht man in Business Central?

Der gebuchte Laborbeleg ist nicht nur als Code sichtbar. In den Posten sieht man die fachliche Wirkung:

| Ansicht | Sichtbarer Befund | Warum wichtig? |
|---|---|---|
| Vendor Ledger Entries | `K10000`, `Stahlwerk Ruhr GmbH`, `Invoice P2P032-682298`, Betrag `-2.500,00`, Entry No. `5010` | Das ist der Kreditorenposten: Business Central zeigt die offene/verbindliche Kreditorenseite. |
| Detailed Vendor Ledger Entries | `Initial Entry`, `Invoice`, `P2P032-682298`, Betrag `-2.500,00`, Entry No. `822` | Das ist die Detailspur zum Kreditorenposten. |
| G/L Entries | Konto `82000 Depreciation, Fixed Assets` mit `2.500,00`; Konto `22100 Accounts Payable, Domestic` mit `-2.500,00` | Das ist die Hauptbuchwirkung: Aufwand/Gegenkonto im Labor und Verbindlichkeit. |
| Related G/L Entries im Kreditorenposten | `22100 Accounts Payable, Domestic -2.500,00`; `82000 Depreciation, Fixed Assets 2.500,00` | Von der Nebenbuchsicht kann man zur Hauptbuchwirkung springen. |

## Was muss ein Anfaenger tun?

Nach einer Buchung nicht beim gebuchten Beleg stehen bleiben. Oeffne die Postenspur:

1. Kreditorenposten zum Beleg suchen.
2. Detaillierte Kreditorenposten pruefen.
3. Sachposten / G/L Entries zum Beleg pruefen.
4. Bei Bedarf Bereiche aufklappen oder die Karte/Listenseite maximieren, damit Konten, Betrag und Entry Type sichtbar sind.

## Warum muss man das tun?

Eine Buchung ist erst nachvollziehbar, wenn man sieht, welche Nebenbuch- und Hauptbuchposten entstanden sind. Der Code `P2P032-682298` allein reicht nicht; fuer das Buch braucht man Konto, Betrag, Postenart und fachliche Wirkung.

## Welche Einrichtung steckt dahinter?

Diese RM-DEMO-Laborroute nutzt eine direkte Purchase-Journal-Zeile mit Vendor `K10000`, Betrag `-2.500,00` und Balance Account `82000`. Dadurch entstehen Kreditorenposten und Sachposten, aber keine Artikel-/Wertposten.

## Was passiert, wenn es falsch ist?

Wenn Konto, Betrag oder Postenart nicht sichtbar oder falsch sind, kann man aus der Buchung keine belastbare Buchaussage ableiten. Besonders Konto `82000` ist hier nur Labor-Balance-Account und darf nicht als deutsches Einkaufskonto behauptet werden.

## Wie korrigiert man es?

Nicht die gebuchte Laborbuchung rueckwirkend umdeuten. Fuer die deutsche Finalfassung muss der Fall in einer deutschen Zielcompany mit passendem Kontenplan, Buchungsgruppen und Steuerlogik neu aufgebaut werden.

## Woran erkennt man danach, dass es stimmt?

Mindestens diese sichtbaren Signale muessen zusammenpassen:

- gleicher Beleg `P2P032-682298`,
- Kreditor `K10000`,
- Betrag `-2.500,00` im Kreditorenposten,
- Sachposten `22100` und `82000` mit gegenlaeufigen Betraegen,
- Detailed Vendor Ledger Entry als `Initial Entry`.

## Labor oder final?

Das ist Laborbefund aus RM-DEMO. Es ist buchdraft-tauglich, aber kein deutscher Finalnachweis. Deutsche Screenshots, deutsche Konten, deutsche Steuerlogik und deutsche Belege muessen spaeter neu erzeugt werden.
