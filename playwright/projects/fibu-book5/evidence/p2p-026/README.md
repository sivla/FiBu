# P2P-026 Purchase Invoice Context Reset Probe

Status: `blocked`, `labor`, `read-only`, `no-new`, `no-preview`, `no-post`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `P2P-026-result.json` | JSON | Kontextklassifikation Purchase Invoices | keine Werteingabe | labor |
| `010-direct-page-signals.json` | JSON | direkte Page-9308-Signale | keine New-Aktion | readonly |
| `010-direct-page-text.txt` | Text | kompakter sichtbarer Kontext | keine Beleganlage | compact |

## Ergebnis

P2P-026 blocked the Purchase Invoices context-reset route: forbidden-draft-107229-visible, page-url-has-filter-or-bookmark, frame-url-has-filter-or-bookmark. No New/value action was clicked.

## Grenze

- Kein `New/Neu`.
- Keine Vendor- oder Zeilenwerte.
- Kein Preview Posting.
- Keine Buchung.
- Kein Setup Change.
- Kein deutscher Finalnachweis.

## Naechster Schritt

Purchase-Invoice-Route nicht fortsetzen; entweder echten Bookmark-/Filter-Reset-Hebel finden oder auf stabilere P2P-Route wechseln.
