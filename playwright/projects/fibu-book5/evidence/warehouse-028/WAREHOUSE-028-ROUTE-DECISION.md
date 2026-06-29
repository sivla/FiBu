# WAREHOUSE-028 - Source PO Location Route Decision

Status: labor-blocked / labor-sufficient-for-book-draft / needs-german-final-rebuild

## Entscheidung

Die naechste Route ist **Location Default / Setup Preflight vor frischem Draft**. Die vorhandene Evidence zeigt, dass Purchase Order 106055 zwar RAW-STEEL enthaelt, aber weiterhin ATLANTA, GA statt FRA-ZL zeigt. Display-Zelle, aktiver Editor und Lines-Menue haben keinen sicheren editierbaren Location-Control geliefert.

## Nicht wiederholen

- keine erneute Display-Cell-Werteingabe
- keine erneute Line-Menue-Inventur ohne neuen Zweck
- keine Warehouse-Receipt-Source-Selection ohne eligible source document

## Naechster praktischer Case

WAREHOUSE-029-SOURCE-PO-DEFAULT-LOCATION-PREFLIGHT prueft read-only, ob Vendor K10000, Item RAW-STEEL oder Location-/Default-Setup einen UI-first Weg liefern, damit eine frische Purchase Order Line direkt mit FRA-ZL entsteht.

## Grenzen

Keine BC-Ausfuehrung in diesem Case, kein Playwright, kein Release, kein Receive, kein Invoice, kein Preview Posting, kein Posting, keine Setup-Aenderung. RM-DEMO bleibt Labor-Evidence und muss spaeter in deutscher Zielumgebung neu aufgebaut werden.
