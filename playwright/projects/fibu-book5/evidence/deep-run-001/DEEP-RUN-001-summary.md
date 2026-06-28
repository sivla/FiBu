# BC-DEEP-RUN-001 Multi Route Sandbox Progress

Status: `labor-reference`, `multi-package-run`, `needs-german-final-rebuild`.

Dieser Lauf hat nicht nach einem einzelnen Case gestoppt. Nach P2P-012 wurden weitere Routen und bestehende Prozessbelege genutzt, um den naechsten sinnvollen Sandbox-Hebel zu bestimmen.

## Fortschrittspakete

| Paket | Art | BC/Playwright | Ergebnis |
|---|---|---|---|
| P2P-012 | Alternative Standard-UI Route | Playwright read-only | Purchase Journal, Item Journal, Purchase Invoices und Requisition Worksheet direkt geoeffnet; Item Journal ist stabilster Material-/Wertpfad. |
| FIXEDASSETS-240 | AfA Action Inventory | Playwright read-only | Fixed Asset G/L Journal ist erreichbar; Calculate Depreciation wurde ueber sichere nicht-ausfuehrende Dropdowns nicht gefunden. |
| PAYMENTS-002 | Payment/OP Readiness | Playwright read-only | Bankkonten, Cash Receipt Journal, Payment Journal und Apply Entries sind weiterhin erreichbar. |
| P2P-013 | Evidence-Reuse | lokal | Inventory-008 wird als Item-Journal-Materialtrace verknuepft, aber nicht als Kreditoren-P2P verkauft. |
| Deep-Run Sync | Coverage/State | lokal | Naechste Hebel und Grenzen wurden zusammengefuehrt. |

## Was bleibt Labor?

Alles bleibt `RM-DEMO` / CRONUS-USA-Labor. Keine deutsche 19-%-USt, kein deutscher Kontenplan-Endstand und keine finale deutsche Buchbehauptung.

## Naechster groesster Hebel

Fuer P2P: Purchase Journal oder Purchase Invoice als kontrollierter Kreditoren-Wertpfad mit klarer Feld-/Check-/Preview-/Trace-Grenze.

Fuer anderen Fortschritt: Fixed Assets AfA-Route nach FA-240 oder kontrollierter Payment-/Apply-Fall nach PAYMENTS-002.
