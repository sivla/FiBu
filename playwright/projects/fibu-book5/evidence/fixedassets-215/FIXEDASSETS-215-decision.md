# FIXEDASSETS-215 Entscheidung

Status: `local-review`, `labor`, `no-bc-run`, `no-playwright-run`, `no-posting`, `not-final`.

## Geprüft

FA-215 wertet die Evidence aus FA-214 aus. FA-214 hat den exakten `Preview Posting`-Menuepunkt im FA G/L Journal genutzt und danach nur DOM-/Frame-Evidence gelesen.

## Entscheidung

FA-214 wird als gueltige Preview-DOM-Evidence akzeptiert, aber nicht als Posting-Readiness.

Nachgewiesen ist:

- Instanz `MCP_1_20260210` und Company `RM-DEMO`.
- Vor Preview war `FA Posting Type = Acquisition Cost` sichtbar/gesetzt.
- `Preview Posting` wurde exakt als Menuepunkt geoeffnet.
- `Posting Preview`, `G/L Entry 1` und `FA Ledger Entry 1` sind in der Preview-Liste sichtbar.
- Es wurde keine Preview-Zeilengruppe angeklickt.
- Es wurde nicht gebucht.

Nicht nachgewiesen ist:

- G/L-Entry-Konto oder Betrag.
- FA-Ledger-Entry-Anlagennummer oder Betrag.
- Gebuchte Postenspur.
- Deutsche finale Anlagenbuchhaltung.

## UI-Befund

Die DOM-Evidence zeigt fuer `FA Ledger Entry` einen konkreten Link/Button:

`tagName=a`, `role=button`, `text=FA Ledger Entry`, `title=Datensatz FA Ledger Entry oeffnen`.

Fuer `G/L Entry 1` ist in der gefilterten Evidence eine Row sichtbar, aber kein gleichwertiger konkreter Link/Button belegt. Ein naechster Klickpfad darf deshalb nicht pauschal beide Gruppen anklicken.

## Naechster kleiner Schritt

`FIXEDASSETS-216-FA-LEDGER-ENTRY-PREVIEW-DETAIL-READONLY`

Ziel: Preview erneut oeffnen und genau den in FA-214 belegten `FA Ledger Entry`-Link read-only oeffnen. Dabei muessen Dialoge, URL, Seitentext und Safety Flags beweisen, dass keine Buchung, kein Setup und keine Journal-Aenderung passiert.

Posting bleibt gesperrt.
