# FiBu Buch 5 Autopilot

Zweck: kleiner Einstiegspunkt fuer Codex-Laeufe, die nicht den gesamten Projektverlauf lesen sollen.

## Startreihenfolge

1. `git branch --show-current`, `git status --short` und `git pull --ff-only` pruefen.
2. Lokale Agent-Checks laufen lassen, bevor ein Fachlauf startet:
   - `npm run agent:preflight`
3. Nur diese Kernstate-Dateien lesen:
   - `.agent/state/current.json`
   - `.agent/state/project_state.json`
   - `.agent/state/coverage_state.json`
   - `.agent/state/last_run_summary.json`
   - die in `current.json.active_case_file` genannte Case-Datei
4. Danach maximal drei Skills laden, die fuer den gewaehlten Lauf gebraucht werden.
5. Alte grosse Projektdateien nur gezielt lesen, wenn der State oder ein Skill sie ausdruecklich verlangt.

## Arbeitsprinzip

- Repo-State ist die Wahrheit, nicht alte Chat-Historie.
- Business Central bleibt in `MCP_1_20260210`.
- Auth, `.env`, Reports, Traces, Videos und Rohsnapshots bleiben lokal.
- Screenshots und Evidence werden projekt-relativ referenziert.
- Jeder Lauf muss `last_run_summary.json` und den betroffenen Case-State aktualisieren.
- Keine neue npm-Abhaengigkeit ohne ausdrueckliche Freigabe. Agent-Tools nutzen Node-Standardbibliothek.
- Schwache Agents duerfen nur Routing, Extraktion, Formatierung und Validierung ausfuehren; BC-/FiBu-Urteil, Posting-/Setup-Gates und Buchtext-Freigabe muessen eskalieren.

## Aktueller Einstieg

Der aktuelle kompakte State verweist auf `FIXEDASSETS-065-PURCHASE-INVOICE-LINE-TYPE-HELPER-DIAGNOSIS`.
Dieser Schritt ist ein Diagnose-/Helper-Schritt. Er darf nicht buchen, keine Zielwerte eingeben und `FA-CNC-01` nicht verwenden.
