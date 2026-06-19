# FIXEDASSETS-078 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-078-result.json` | JSON | read-only Routen-/Page-Capability-Review, Quellenbasis, Safety Flags | keine Buchung, keine Zielwerte | `labor`, `observed` |
| `FIXEDASSETS-078-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |
| `010-microsoft-learn-route-basis.md` | Markdown | offizielle Routenbasis fuer Anlagenzugang | keine RM-DEMO-Buchung | `source-context` |
| `020-*` bis `070-*` | Text/JSON | sichtbare Seiten-/Button-Kontexte fuer Anlagen, Setup, Einkauf und Journal | keine Datenaenderung | `read-only-page-context` |

Aktuelle Wahrheit: FA-078 stayed in MCP_1_20260210 / RM-DEMO and reviewed fixed-asset acquisition capability read-only. Visible route contexts: 020-fixed-assets-list, 030-depreciation-books, 040-purchase-invoices-list, 050-purchase-orders-list. The blocker is now classified as route-decision-open: Microsoft Learn supports multiple acquisition routes, while RM-DEMO still lacks a proven purchase-document line Type=Fixed Asset path.
