# FIXEDASSETS-141 - Combobox Result Review

## Kontext

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Asset: `FA-CNC-01`
- Referenzlauf: `FIXEDASSETS-140-FA-CNC-01-POSTING-GROUP-COMBOBOX-ROUTE`
- Arbeitstyp: lokale Evidence-/Screenshot-Bewertung

## Entscheidung

`FIXEDASSETS-140` ist **blocked**, nicht `already-fit` und nicht erfolgreich.

Der Lauf beweist einen wichtigen Business-Central-/Playwright-Fehlerfall: Ein Klick auf den sichtbaren Kartenwert kann in Business Central eine verwandte Karte oeffnen. In FA-140 wurde nicht die `Posting Group`-Werteliste geoeffnet, sondern die verwandte `Depreciation Book Card` fuer `HGB`.

## Belegte Beobachtung

- Vorher war `Posting Group = EQUIPMENT` auf `FA-CNC-01` sichtbar.
- Der Zielwert `MACHINES` wurde nicht sichtbar angeboten und nicht gesetzt.
- Der Screenshot `fixedassets-140-060-fa-cnc-01-posting-group-machines.png` zeigt als Vordergrundseite `Depreciation Book Card` mit `HGB depreciation book`.
- `040-fill-result.json` zeigt `filled = false` und `valueAfter = EQUIPMENT`.
- Die nach dem Klick gelesene Zeile `Description = HGB depreciation book` gehoert zum falschen Vordergrundkontext, nicht zu einer fachlichen Aenderung an `FA-CNC-01`.

## Was dadurch nicht bewiesen ist

- Keine `Posting Group = MACHINES`-Zuordnung auf `FA-CNC-01`.
- Keine Setup-Aenderung.
- Keine Anlagenanschaffung.
- Keine Preview Posting.
- Keine Buchung.
- Kein deutscher Fixed-Assets-Finalnachweis.

## Lernwert

Fuer Business Central ist ein sichtbarer Code in einem Kartenfeld nicht automatisch ein editierbares Dropdown. Der Wert kann auch als Related-Record-Link wirken. Playwright muss deshalb nach jedem Feldklick pruefen, ob der Vordergrund weiterhin die erwartete Page ist.

Fuer das Buch ist das ein gutes Debugging-/Fehlerbild: Leser lernen, warum ein Klick auf einen sichtbaren Wert nicht zwingend eine Werteliste oeffnet und warum man vor einer Buchung den gespeicherten Zielwert erneut sichtbar pruefen muss.

## Naechster sicherer Schritt

`FIXEDASSETS-142-FA-CNC-01-POSTING-GROUP-FIELD-LOCATOR-REPAIR`

Der naechste Lauf soll lokal den Locator-/Helper-Ansatz schaerfen:

- Vordergrundpage nach jedem Klick validieren.
- Related-Record-Seiten wie `Depreciation Book Card` als Stop-Kriterium behandeln.
- Zeilenwerte nur aus dem erwarteten Kartenkontext lesen.
- Einen echten `Posting Group`-Optionsnachweis verlangen, bevor `MACHINES` ausgewaehlt werden darf.

In FA-141 selbst wurde kein BC geoeffnet, kein Playwright gestartet, kein Setup geaendert und nichts gebucht.
