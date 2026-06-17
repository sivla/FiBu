# FIXEDASSETS-047 - K30000 Vendor Defaults Visibility/Value Discovery read-only

Status: `labor`, `read-only`, `ui-first`, `visibility-value-discovery`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Ergebnisstatus | done-labor-readonly-critical-defaults-still-not-visibly-proven |
| Gebucht | nein |
| Einkaufsrechnung erzeugt | nein |
| Kreditor/Setup geaendert | nein |

## Ergebnis

Die K30000-Kreditorenkarte zeigt weiter keinen vollstaendigen sichtbaren Nachweis fuer die kritischen Defaults. Sichtbar kritisch: keine. Weiter offen: Vendor Posting Group, Gen. Bus. Posting Group, Currency Code, VAT Bus. Posting Group. Zahlungs-/Tax-Kontext kann nur fuer sichtbar gefundene Felder genutzt werden.

## FastTabs und Screenshots

| Bereich | Klick-/Zustandsbefund | sichtbare Zielcaptions | Screenshot |
|---|---|---|---|
| Invoicing | small-chevron-or-aria-expanded-control-near-caption | `Tax Area Code`, `Tax Liable` | playwright/projects/fibu-book5/img/fixedassets-047-020-k30000-invoicing-visibility.png |
| Payments | caption-not-found-in-any-frame | `Payment Terms Code`, `Payment Method Code` | playwright/projects/fibu-book5/img/fixedassets-047-030-k30000-payments-visibility.png |
| Receiving | caption-not-found-in-any-frame | keine Zielcaption sichtbar | playwright/projects/fibu-book5/img/fixedassets-047-040-k30000-receiving-visibility.png |

## Feld- und Wertnachweis

| Feld | Sichtbarkeit | Wert / Diagnose |
|---|---|---|
| Vendor Posting Group | nicht sichtbar | caption-not-visible |
| Gen. Bus. Posting Group | nicht sichtbar | caption-not-visible |
| Currency Code | nicht sichtbar | caption-not-visible |
| VAT Bus. Posting Group | nicht sichtbar | caption-not-visible |
| Tax Area Code | sichtbar | `Tax Area Code`, `(Leer)`, `Withholding Tax Liable` |
| Tax Liable | sichtbar | `Tax Liable` |
| Payment Terms Code | sichtbar | label-only |
| Payment Method Code | sichtbar | label-only |
| Location Code | nicht sichtbar | caption-not-visible |
| Shipment Method Code | nicht sichtbar | caption-not-visible |

## Buchwirkung

Kapitel 21 soll den Anlagenzugang ueber Einkaufsrechnung weiter an ein Default-Preflight-Gate binden. Fuer Anfaenger ist wichtig: Ein Kreditor kann existieren und Zahlungswerte zeigen, trotzdem fehlen fuer eine sichere Einkaufsrechnung noch sichtbare Buchungsgruppen-/Waehrungs-/VAT-Defaults. Personalisieren/Page Inspection bleiben Diagnosewerkzeuge; der Buchscreen muss die wirklichen Codes zeigen.

## Grenzen

- Read-only: keine Kreditoren-, Setup- oder Belegaenderung.
- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Keine API-Abkuerzung; der Befund basiert auf sichtbarer BC-UI und kompaktem Seitentext.
- Nicht als deutscher USt-, Kontenplan- oder HGB-Finalnachweis verwenden.
- Ein Screenshot gilt nur fuer Felder/Codes, die im Bild wirklich sichtbar sind.

## Naechster Schritt

FIXEDASSETS-048-K30000-VENDOR-DEFAULTS-MANUAL-PERSONALIZE-OR-SETUP-GATE-DECISION: ohne Buchung entscheiden, ob die fehlenden Defaults manuell per Personalisieren sichtbar gemacht oder ein enger UI-first Default-Fit vorbereitet werden darf.
