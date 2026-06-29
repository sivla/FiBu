# PREP-017 - Repo Documentation Consistency Audit

Status: `prep-done`, `repo-documentation-consistency`, `no-bc-run`, `no-playwright-run`

## Was geprüft wurde

PREP-017 hat geprüft, ob die aktive Dokumentationslandkarte, der Full-Playthrough-Katalog, die Coverage-Matrix und die Queue noch dieselbe Universaarl-Wahrheit erzählen.

## Ergebnis

- `DOCUMENTATION-MAP.md` wurde von der alten `AUTOPILOT-STATE`-/`CURRENT-STATE`-Steuerwelt auf die aktive `.agent/state/current.json`- und `.agent/state/marathon_queue.json`-Steuerwelt umgestellt.
- `BC-FULL-PLAYTHROUGH-CATALOG.md` nennt jetzt PREP-017 bis PREP-022 als aktuelle sichere Vorbereitungslinie.
- `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` bleibt geparkt, bis SUPER-/Company-Create-Rechte bestätigt sind.
- `BC-COVERAGE-MATRIX.md` erklärt, dass Coverage bis zur Rechtefreigabe über PREP-/Read-only-/Repo-/Doku-Arbeit fortschreitet.

## Grenzen

- Keine Business-Central-Ausführung.
- Kein Playwright-Lauf.
- Keine Company-Anlage.
- Keine Setup-, Stammdaten-, Beleg-, Preview- oder Posting-Aktion.
- Keine Buchänderung und kein finaler deutscher Nachweis.

## Nächster sinnvoller Schritt

`PREP-018-PLAYWRIGHT-SCRIPT-AND-HELPER-INVENTORY`: aktive Universaarl-Playwright-Skripte und Helper von Legacy-RM-/MCP-Tests trennen.
