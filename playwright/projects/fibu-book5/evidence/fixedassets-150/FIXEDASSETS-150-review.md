# FIXEDASSETS-150 - Review FA-149 field-local assignment

Status: `labor`, `local-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-posting`, `not-final`.

## Entscheidung

FA-149 wird als erfolgreicher CRONUS-USA-Labor-Setup-Fit akzeptiert.

Begruendung:

- `FIXEDASSETS-149-result.json` belegt `MCP_1_20260210` und `RM-DEMO`.
- Vor der Feldaktion war auf `FA-CNC-01` `Posting Group = EQUIPMENT` sichtbar.
- Der feldlokale Auswahlknopf fuer `Posting Group` wurde geklickt.
- Die sichtbare Option `MACHINES` wurde ausgewaehlt.
- Nach Neuoeffnen der Karte war `Posting Group = MACHINES` sichtbar.
- Der Screenshot `fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.png` zeigt den Zielwert `MACHINES` klar auf der Anlagenkarte.

## Nicht Freigegeben

- Keine Anschaffung.
- Kein Klick auf `Acquire`.
- Kein Preview Posting.
- Kein `Post`.
- Keine Einkaufsrechnung.
- Keine Journalzeile.
- Kein deutscher Finalnachweis.

## Wichtiger Lernpunkt

Ein sichtbar vorhandener `Acquire`-Button auf der Anlagenkarte ist noch keine ausgefuehrte Anschaffung. Gefaehrlich waere erst ein bewusster Klick, ein Assistent, ein Buchungsdialog oder eine Postenspur. FA-149 hat nur die Stammdaten-/Setup-Voraussetzung auf der Karte korrigiert.

## Buchwirkung

Kapitel 21 darf den CRONUS-USA-Labor-Kartenfit `FA-CNC-01 -> MACHINES` als erledigte Stammdaten-/Setup-Voraussetzung dokumentieren. Es darf daraus aber keine Anschaffung, keine AfA, keine Postenspur und keinen deutschen Finalzustand ableiten.

## Naechster Sicherer Schritt

`FIXEDASSETS-151-FA-CNC-01-ACQUIRE-READINESS-AFTER-MACHINES-READONLY`: `FA-CNC-01` nach dem `MACHINES`-Fit read-only oeffnen und pruefen, ob `Acquire` weiterhin deaktiviert oder jetzt fachlich nutzbar erscheint. Kein Klick auf `Acquire`, keine Werte, keine Preview, kein `Post`.
