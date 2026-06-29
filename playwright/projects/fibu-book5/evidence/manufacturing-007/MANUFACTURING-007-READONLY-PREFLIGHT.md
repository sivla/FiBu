# MANUFACTURING-007 BOM/Routing UI-first Preflight

Status: `labor`, `read-only`, `direct-page`, `no-search`, `no-setup-change`, `no-posting`, `needs-german-final-rebuild`.

| Feld | Wert |
|---|---|
| Instanz | MCP_1_20260210 |
| Company | RM-DEMO |
| BC-Ausfuehrung | ja, read-only |
| Setup-Aenderung | nein |
| Draft | nein |
| Preview Posting | nein |
| Buchung | nein |

## Direkt geoeffnete Pruefpunkte

| Pruefpunkt | Page ID | Seitenkontext sichtbar | Kontext-/Zielsignal sichtbar | Screenshot |
|---|---:|---|---|---|
| Production BOMs / BOM-RM-M100 target | 99000786 | ja | nein | playwright/projects/fibu-book5/img/manufacturing-007-010-production-bom-target.png |
| Routings / ROUTE-M100 target | 99000764 | ja | nein | playwright/projects/fibu-book5/img/manufacturing-007-020-routing-target.png |
| Work Center 100 | 99000754 | ja | ja | playwright/projects/fibu-book5/img/manufacturing-007-030-work-center-100.png |
| Item Card RM-M100 manufacturing context | 30 | ja | ja, aber nur RM-M100/Replenishment/Planning; keine erweiterten BOM-/Routing-Linkfelder | playwright/projects/fibu-book5/img/manufacturing-007-040-item-rm-m100-manufacturing-fields.png |

## Entscheidung

Work Center and RM-M100 card context are visible enough for a later guarded setup-fit decision. The item card screenshot shows Replenishment/Planning context, but not expanded BOM/Routing link fields. BOM-RM-M100 and ROUTE-M100 still require explicit existence/editability judgement before any write.

## Nicht bewiesen

- No Production BOM was created, edited or certified.
- No Routing was created, edited or certified.
- No Production Order was created, released or posted.
- No Consumption Journal or Output Journal was posted.
- No manufacturing item/value/G/L/capacity ledger trace exists.
- No German final proof exists.

## Naechster Schritt

Review M007 read-only signals and decide whether a guarded UI-first setup-fit case may create or fit BOM-RM-M100/ROUTE-M100. Do not post or create a Production Order yet.
