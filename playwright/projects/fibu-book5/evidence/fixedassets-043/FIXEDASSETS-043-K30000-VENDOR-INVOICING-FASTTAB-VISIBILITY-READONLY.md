# FIXEDASSETS-043 - K30000 Vendor Invoicing FastTab Visibility read-only

Status: `labor`, `read-only`, `ui-first`, `fasttab-visibility`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Status | done-labor-readonly-invoicing-fasttab-visible |
| Gebucht | nein |

## Ergebnis

Der K30000-Kreditor wurde read-only geoeffnet; mindestens eine Invoicing-Zielcaption ist in der UI sichtbar. Das ist FastTab-/Sichtbarkeits-Evidence, aber noch keine Kaufbeleg- oder Buchungsfreigabe.

## FastTabs

| FastTab | Klick-/Zustandsbefund | sichtbare Zielcaptions | Status |
|---|---|---|---|
| Invoicing | small-chevron-or-aria-expanded-control-near-caption | `Tax Area Code`, `Tax Liable` | target-caption-visible |
| Payments | caption-not-found-in-any-frame | `Payment Terms Code`, `Payment Method Code` | target-caption-visible |
| Receiving | caption-not-found-in-any-frame | keine Zielcaption sichtbar | target-caption-not-visible |

## Feldsichtbarkeit

| Feld | Sichtbarkeit | Wert / Diagnose |
|---|---|---|
| Vendor Posting Group | nicht sichtbar | caption-not-visible |
| Gen. Bus. Posting Group | nicht sichtbar | caption-not-visible |
| Currency Code | nicht sichtbar | caption-not-visible |
| Tax Area Code | sichtbar | `Tax Area Code`, `(Leer)`, `Withholding Tax Liable` |
| Tax Liable | sichtbar | `Tax Liable` |
| VAT Bus. Posting Group | nicht sichtbar | caption-not-visible |
| Payment Terms Code | sichtbar | label-only |
| Payment Method Code | sichtbar | label-only |
| Location Code | nicht sichtbar | caption-not-visible |
| Shipment Method Code | nicht sichtbar | caption-not-visible |

## Buchwirkung

Kapitel 21 kann die K30000-Kreditorenkarte als Labor-Vorstufe aufnehmen, muss aber den Kaufbeleg weiterhin an ein separates Preflight-/Posting-Gate binden.

## Grenzen

- Read-only: keine Kreditoren-, Setup- oder Belegaenderung.
- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Keine API-Abkuerzung; der Befund basiert auf sichtbarer BC-UI.
- Nicht als deutscher USt-, Kontenplan- oder HGB-Finalnachweis verwenden.

## Naechster Schritt

FIXEDASSETS-044-K30000-PURCHASE-INVOICE-GATE-DECISION: Kaufbeleg-Preflight erst als eigener No-/Posting-Gate-Entscheid, weiterhin ohne automatische Buchung.
