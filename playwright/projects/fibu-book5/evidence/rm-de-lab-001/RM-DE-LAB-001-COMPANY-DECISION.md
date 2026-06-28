# RM-DE-LAB-001 Clean Lab Company Decision

| Feld | Wert |
|---|---|
| Instanz | MCP_1_20260210 |
| aktuelle Laborcompany | RM-DEMO |
| geplante Company | RM-DE-LAB |
| Status | planned-only-not-created |

## Entscheidung

`RM-DE-LAB` soll als saubere Labor-/Rebuild-Company vorbereitet werden, aber in diesem Lauf nicht angelegt werden. Die Anlage braucht einen eigenen UI-first-Case, weil Company-Erzeugung ein wirksamer Sandbox-Eingriff ist und nicht nebenbei passieren soll.

## Warum sinnvoll

- RM-DEMO remains valuable as CRONUS-USA laboratory reference and must not be overwritten or treated as German final proof.
- Several process blocks now need German-final rebuild instructions; a clean lab company inside the same instance is useful before a future real German target instance exists.
- Company creation should not happen as a side effect of this local decision package; it needs a dedicated UI-first case with evidence.

## Nicht ausgefuehrt

- No BC run in RM-DE-LAB-001.
- No company switch.
- No company creation.
- No setup change.
- No posting.

## Gate fuer RM-DE-LAB-002

`RM-DE-LAB-002-FOUNDATION-SETUP` bleibt blockiert, bis `RM-DE-LAB` in Business Central sichtbar angelegt und in der Company Registry als actual-visible nachgewiesen wurde.

## Naechster Schritt

RM-DE-LAB-CREATE-001: dedicated UI-first Companies/New-or-Copy route with registry guard; only then run RM-DE-LAB-002 foundation setup.
