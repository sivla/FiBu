# DROPSHIPPING-001 Readiness

Status: `labor`, `read-only`, `dropshipping-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Buchfall | `DS-24001`, `D11000`, `SP-PUMP-01`, Menge `2`, `850 EUR`, `K20000`, `CHANNEL=B2B` |
| Relevantes Gate | `DROPSHIPPING-001-PROCESS` locked |
| Setup-Aenderung | nein |
| Buchung | nein |
| Shopify/Online Store | out of scope |

## Gepruefte UI-Einstiege

| Tell-Me-Suche | Treffer sichtbar | Screenshot |
|---|---|---|
| Sales Orders | ja | dropshipping-001-010-sales-orders-tell-me.png |
| Purchase Orders | ja | dropshipping-001-020-purchase-orders-tell-me.png |
| Requisition Worksheets | ja | dropshipping-001-030-requisition-worksheets-tell-me.png |
| Drop Shipments | nein | dropshipping-001-040-drop-shipments-tell-me.png |
| Purchasing Codes | ja | dropshipping-001-050-purchasing-codes-tell-me.png |

## Gepruefte Zielobjekte

| Objekt | Sichtbar | Rolle im Buchfall | Screenshot |
|---|---|---|---|
| D11000 | nein | geplanter Dropshipping-/Sonderverkaufskunde | dropshipping-001-060-customer-d11000.png |
| K20000 | nein | geplanter Direktlieferant | dropshipping-001-070-vendor-k20000.png |
| SP-PUMP-01 | nein | geplanter Dropshipping-Ersatzteilartikel | dropshipping-001-080-item-sp-pump-01.png |

## Anfaenger-Lernwert

Dropshipping ist kein normaler Verkauf mit spaeterem Lagertrick. Vor einem Verkaufsauftrag muss klar sein, ob Business Central die Verkaufsauftraege, Einkaufsbestellungen, Requisition-Worksheet-/Beschaffungspfade und Purchasing-Codes findet und ob Debitor, Lieferant und Artikel vorhanden sind. Wenn `D11000`, `K20000` oder `SP-PUMP-01` fehlen, liegt kein Bedienfehler vor, sondern eine Stammdatenluecke. Erst danach darf ein UI-first Klickpfad fuer Auftrag, Dropshipping-Kennzeichen, Einkaufsbezug, Preview Posting und Buchung vorbereitet werden.

## Was bewiesen ist

- Sales Orders, Purchase Orders, Requisition Worksheets, Drop Shipments und Purchasing Codes wurden in RM-DEMO read-only gesucht und als Navigationsevidence dokumentiert.
- D11000, K20000 und SP-PUMP-01 wurden als konkrete Kapitel-17-Zielobjekte read-only geprueft; fehlende Sichtbarkeit ist ein Stammdaten-/Setup-Backlog-Befund.
- Kapitel 17 braucht vor dem echten Dropshipping-Prozess einen UI-first Stammdaten-/Setup-Fit fuer Debitor, Lieferant, Artikel und Purchasing-Code-/Drop-Shipment-Logik.
- Shopify/Online Store bleibt out of scope; der Lauf prueft nur BC-Standard-Dropshipping/Sonderverkauf.

## Was nicht bewiesen ist

- Kein Verkaufsauftrag DS-24001.
- Keine Einkaufsbestellung an K20000.
- Kein gesetztes Dropshipping-Kennzeichen und kein Purchasing-Code-Endstand.
- Keine Requisition-Worksheet-Aktion und keine Belegverknuepfung.
- Keine Preview Posting, keine Verkaufs-/Einkaufsbuchung, keine Debitoren-/Kreditoren-/Sach-/USt-Posten.
- Keine deutsche 19-%-USt, kein deutscher Kontenplan und kein deutscher Finalnachweis.
- Kein Shopify-/Online-Store-Connector-Scope.

## Buchwirkung

Kapitel 17 darf den aktuellen Stand nur als Dropshipping-/Sonderverkauf-Readiness behandeln. Die Schrittfolge `DS-24001` bleibt Zielpfad, solange Debitor, Kreditor, Artikel, Dropshipping-/Purchasing-Code-Logik und Buchungsvorschau nicht UI-first belegt sind. Shopify bleibt gestrichen.

## Naechster Schritt

DROPSHIPPING-002 als Buch-/Evidence-Sync fuer Kapitel 17: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Debitor D11000, Kreditor K20000, Artikel SP-PUMP-01 und Drop-Shipment-/Purchasing-Code-Setup UI-first vorbereiten.
