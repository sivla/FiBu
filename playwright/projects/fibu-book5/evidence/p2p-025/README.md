# P2P-025 Purchase Invoice Line Entry Blocker Review

Status: `labor`, `local-review`, `helper-only`, `no-bc-run`, `no-preview`, `no-post`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `P2P-025-result.json` | JSON | Entscheidung zum P2P-024-Bookmark-Blocker und naechste Route | keine neue BC-Ausfuehrung | labor-review |

## Ergebnis

P2P-024 ist ein belastbarer Blocker: Die Route `Purchase Invoices` Page `9308` plus scoped `Neu` darf nicht erneut fuer Werteingabe genutzt werden, solange Business Central den alten Listen-/Bookmark-Kontext mit Draft `107229` wiederherstellt.

## Entscheidung

Nicht wiederholen:
- `page=9308` oeffnen.
- `Neu` klicken.
- Danach Vendor/Zeile eingeben, obwohl `107229` noch sichtbar ist.

Naechste Route:
- `P2P-026-PURCHASE-INVOICE-CONTEXT-RESET-PROBE`.
- Erst neutralen Listen-/Frame-/Bookmark-Kontext oder eine echte neue Belegnummer beweisen.
- Erst danach in einem separaten Case Vendor-/Zeilenwerte setzen.

## Grenze

- Keine BC-Ausfuehrung in P2P-025.
- Kein Preview Posting.
- Keine Buchung.
- Kein Setup Change.
- Kein deutscher Finalnachweis.

## Buchwirkung

Clickguides duerfen bei Business Central nicht aus `New/Neu` allein schliessen, dass ein neuer Beleg aktiv ist. Ein Anfaenger muss zuerst sehen koennen: Bin ich wirklich auf einem neuen Beleg oder noch in einem alten Listen-/Bookmark-Kontext?
