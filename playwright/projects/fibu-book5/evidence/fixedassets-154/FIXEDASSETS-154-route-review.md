# FIXEDASSETS-154 - Acquire/Editmode Result Review

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright-run`, `no-acquire-click`, `no-preview`, `no-posting`, `not-final`.

## Ausgangspunkt

`FIXEDASSETS-153` hat praktisch in `MCP_1_20260210` / `RM-DEMO` gezeigt:

- `FA-CNC-01` ist auf der `Fixed Asset Card` sichtbar.
- `Posting Group = MACHINES` ist sichtbar.
- `Book Value = 0,00` ist sichtbar.
- `Acquire` ist vor dem sicheren Edit-/Stift-Probe sichtbar, aber deaktiviert.
- `Acquire` bleibt nach dem sicheren Edit-/Stift-Probe sichtbar, aber deaktiviert.
- Es wurde kein Feldwert geaendert, kein `Acquire` geklickt, keine Preview und keine Buchung ausgefuehrt.

## Fachliche Bewertung

Der Kartenstatus ist ein guter Readiness-/Blocker-Nachweis, aber kein Anlagenzugang. Der Editmodus ist kein Freischalthebel fuer `Acquire`.

Microsoft Learn beschreibt fuer Business Central zwei relevante Grundpfade:

- Nach Anlage und AfA-Buch-Zuordnung muss der Anlagenzugang als Anschaffungstransaktion erfasst werden.
- Die manuelle Route nutzt das `Fixed Asset G/L Journal` mit `FA Posting Type = Acquisition Cost`.

Quelle: <https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire>

## Entscheidung

`Acquire` bleibt fuer `FA-CNC-01` im aktuellen Labor gehalten/blockiert. Es wird kein `Acquire`-Klick freigegeben.

Der naechste sinnvolle praktische Schritt ist nicht Posting, sondern ein read-only Preflight der `Fixed Asset G/L Journal`-Route:

- Seite oeffnen
- Instanz/Company pruefen
- sichtbare Journal-/Zeilenfelder und Aktionen dokumentieren
- keine Werte eingeben
- keine Journalzeile erzeugen
- keine Preview
- kein `Post`

## Buchwirkung

Kapitel 21 sollte einem Anfaenger erklaeren:

- Stammdatenkarte und `Posting Group = MACHINES` sind Voraussetzung, aber noch keine Anschaffung.
- Ein deaktivierter `Acquire`-Button ist ein fachlicher Stop, kein Bedienfehler.
- Die naechste Lernfrage lautet: Welche Buchungsroute erzeugt spaeter wirklich Anschaffungskosten, FA Ledger Entries und Sachposten?

## Grenzen

- Kein BC-Lauf in FA-154.
- Kein Playwright-Lauf in FA-154.
- Keine Anschaffung.
- Keine Preview.
- Keine Buchung.
- Keine Journalzeile.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-155-FA-GL-JOURNAL-ACQUISITION-ROUTE-READONLY-PREFLIGHT`
