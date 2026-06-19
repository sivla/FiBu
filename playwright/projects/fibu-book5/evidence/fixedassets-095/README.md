# FIXEDASSETS-095 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-095-result.json` | JSON | Purchase Invoices wurde read-only in MCP_1_20260210 / RM-DEMO geoeffnet; Instanz/Company/No-Write-Flags und Ergebnis sind dokumentiert | keine Zeilentyp-Auswahl, kein Draft, keine Buchung | `observed`, `read-only`, `no-draft` |
| `010-purchase-invoices-readonly-context.txt` | Text | fokussierter sichtbarer UI-Kontext der Purchase-Invoices-Seite | kein kompletter Rohdump, keine Dropdown-Werte hinter einer editierbaren Zeile | `observed`, `compact` |
| `020-visible-action-inventory.json` | JSON | sichtbare relevante/riskante Aktionen wurden inventarisiert, aber nicht geklickt | keine Aktionsausfuehrung | `observed`, `action-inventory-only` |
| `FIXEDASSETS-095-learning.md` | Markdown | Lern- und Buchwirkung des read-only Befunds | keinen finalen Anlagenzugang | `book-learning-candidate` |

Aktuelle Wahrheit: Dieser Lauf ist ein sicherer Listen-/Kontextnachweis. Er ersetzt keinen kontrollierten Zeilen-/Draft-Nachweis fuer `Type = Fixed Asset`.
