# FIXEDASSETS-111 Control Route Decision

Status: `labor`, `local-decision`, `no-bc-run`, `no-playwright-run`, `no-write`

## Entscheidung

`FIXEDASSETS-110` reicht noch nicht fuer einen Write-Probe.

Die Header `Amount` und `Bal. Account No.` sind sichtbar. Es wurden aber `0` konkrete Amount-Control-Kandidaten und `0` konkrete Bal.-Account-Control-Kandidaten gefunden. Damit ist nicht belegt, welches editierbare Feld Playwright spaeter gefahrlos adressieren koennte.

## Warum trotzdem ein weiterer read-only Lauf sinnvoll ist

Business-Central-Journalgrids rendern editierbare Controls haeufig erst, wenn eine Zelle aktiv/fokussiert ist. FA-110 hat die Header-/Scrollroute gelesen, aber nicht gezielt einzelne Zellen aktiviert. Deshalb ist ein letzter enger Diagnose-Lauf vertretbar:

- nur Zellen fokussieren,
- keine Werte eingeben,
- keine Auswahl bestaetigen,
- keine Preview,
- kein `Post`,
- nach jedem Fokus pruefen, ob ein konkretes Control fuer `Amount` oder `Bal. Account No.` entsteht.

## Nicht freigegeben

- kein Betrag `68000` eingeben,
- kein Gegenkonto `K30000` eingeben,
- kein Insert/Delete,
- keine Preview,
- kein `Post`,
- keine Setup-Aenderung.

## Naechster Schritt

`FIXEDASSETS-112-FA-GL-JOURNAL-ACTIVE-CELL-ROUTE-READONLY`

Der Lauf darf nur einen read-only Active-Cell-/Focus-Probe auf der vorhandenen FA-G/L-Journal-Zielzeile ausfuehren. Erst danach darf wieder lokal entschieden werden, ob ein Write-Probe ueberhaupt vertretbar ist.
