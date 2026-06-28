# P2P-005 Partial Receipt Line Quantity Gate

Status: `labor-blocked`, `needed-for-german-final`

## Ziel

P2P-005 sollte die Einkaufsbestellung fuer einen Teilwareneingang vorbereiten:

- Vendor: `K10000`
- Item: `RAW-STEEL`
- Location: `FRA-ZL`
- Quantity: `4`
- Direct Unit Cost: `2500`
- Qty. to Receive: `2`

## Ergebnis

Die direkte Navigation in die Instanz `MCP_1_20260210` und Company `RM-DEMO` funktioniert jetzt ueber die konfigurierte BC-URL. Der zuerst geplante Draft `106002` wurde geoeffnet, aber als Basis verworfen, weil bereits eine nicht passende Zeile `1964-S` vorhanden war.

Danach wurde kontrolliert ein neuer Labor-Draft `106051` angelegt. Dieser zeigt `Vendor No. K10000` / `Stahlwerk Ruhr GmbH`.

## Blocker

Die Business-Central-Zeilenansicht ist sichtbar, aber der aktuelle Playwright-Control-Snapshot findet im Lines-Grid keine sicher befuellbaren Controls. Darum wurden `RAW-STEEL`, Menge `4`, Einzelpreis `2500` und `Qty. to Receive = 2` nicht als sicher nachgewiesen.

## Nicht passiert

- Kein Preview Posting.
- Kein Post.
- Kein Receive.
- Kein Invoice.
- Kein Setup Change.
- Kein Company Switch.
- Keine API-Abkuerzung.
- Keine Buchaenderung.

## Buchwirkung

Fuer das Buch ist dieser Lauf ein Labor-Lernfall: Teilwareneingang benoetigt nicht nur eine Bestellung, sondern eine stabil bedienbare Zeilen-/Grid-Route. Der Klickpfad darf erst weiter zu Preview Posting, wenn die Zeilenwerte sichtbar und reproduzierbar gesetzt sind.

## German Final Rebuild

Dieser Laborstand muss spaeter in einer deutschen Zielinstanz neu aufgebaut werden. Draft `106051` ist nur Labor-Referenz und kein deutscher Finalnachweis.

## Naechster Schritt

P2P-006 sollte gezielt die Purchase-Order-Lines-/Grid-Control-Route fuer Draft `106051` diagnostizieren und erst danach Werte setzen. Preview Posting und Posting bleiben bis dahin gesperrt.
