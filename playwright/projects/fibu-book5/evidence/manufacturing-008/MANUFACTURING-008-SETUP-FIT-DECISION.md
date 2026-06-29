# MANUFACTURING-008 BOM/Routing Setup-Fit Decision

Status: `labor`, `setup-fit-decision`, `no-bc-run`, `no-playwright-run`, `no-posting`, `needs-german-final-rebuild`.

## Ausgangspunkt

`MANUFACTURING-007` hat die Zielseiten direkt per Page-URL geprueft:

- `BOM-RM-M100` ist nicht sichtbar belegt.
- `ROUTE-M100` ist nicht sichtbar belegt.
- Work Center `100 Assembly department` ist sichtbar.
- `RM-M100` ist sichtbar; Replenishment-/Planning-Kontext ist sichtbar.
- Erweiterte BOM-/Routing-Linkfelder auf der Artikelkarte sind noch nicht bewiesen.

## Entscheidung

Der naechste sinnvolle Schritt ist kein weiterer reiner Review und kein weiterer allgemeiner Read-only-Scan. M009 soll ein streng bewachter UI-first Setup-Fit werden:

1. Production BOMs per direkter Page-URL oeffnen.
2. Vorher-Evidence fuer `BOM-RM-M100` sichern.
3. Wenn eindeutig nicht vorhanden: `BOM-RM-M100` kontrolliert anlegen oder fitten.
4. BOM-Zeile `RAW-STEEL`, Menge je `2 PCS` setzen, nur wenn die Zeilenfelder eindeutig editierbar sind.
5. Routings per direkter Page-URL oeffnen.
6. Vorher-Evidence fuer `ROUTE-M100` sichern.
7. Wenn eindeutig nicht vorhanden: `ROUTE-M100` kontrolliert anlegen oder fitten.
8. Routing-Zeile Operation `10`, Work Center `100`, Run Time `1` setzen, nur wenn die Zeilenfelder eindeutig editierbar sind.
9. `RM-M100` erst verknuepfen, wenn die passenden Artikelkartenfelder sichtbar und editierbar sind.

## Stop-Regeln

- Stop, wenn Instanz oder Company nicht `MCP_1_20260210` / `RM-DEMO` sind.
- Stop, wenn eine Zielseite nicht eindeutig erreichbar ist.
- Stop, wenn `New`, `Edit`, `Certify` oder Zeilenfelder nicht eindeutig scoped sind.
- Stop vor Production Order, Release, Preview Posting, Posting, Consumption und Output.
- Kein API-Shortcut.
- Kein deutscher Finalclaim aus RM-DEMO.

## Buchwirkung

Fuer Kapitel 14 ist M008 nur die Setup-Entscheidung. Buchsubstanz entsteht erst, wenn M009 tatsaechlich Vorher/Nachher-Evidence fuer BOM/Routing oder einen sauberen Blocker liefert.

## Naechster Schritt

`MANUFACTURING-009-BOM-ROUTING-GUARDED-SETUP-FIT`.
