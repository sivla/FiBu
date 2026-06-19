# FIXEDASSETS-078 Lernzusammenfassung

Status: `labor`, `read-only`, `page-capability-review`, `no-posting`, `no-setup-change`, `not-final`.

## Ergebnis

FA-078 stayed in MCP_1_20260210 / RM-DEMO and reviewed fixed-asset acquisition capability read-only. Visible route contexts: 020-fixed-assets-list, 030-depreciation-books, 040-purchase-invoices-list, 050-purchase-orders-list. The blocker is now classified as route-decision-open: Microsoft Learn supports multiple acquisition routes, while RM-DEMO still lacks a proven purchase-document line Type=Fixed Asset path.

## Was man in BC lernt

Anlagenzugang ist kein einzelner isolierter Klickpfad. Business Central trennt Anlagenstamm, AfA-Buch, Anlagenbuchungsgruppen/Kontenfindung, Einkaufsbelege und Anlagenjournale. Wenn der Einkaufsbeleg-Zeilentyp in einem bestimmten UI-Kontext nicht sichtbar ist, bedeutet das noch nicht, dass Anlagenzugang fachlich unmoeglich ist.

## Zusatzbefund

`FA-CNC-01` war in der Anlagenliste sichtbar und `HGB` war in den AfA-Buechern sichtbar. Das sind read-only Laborbefunde: Die Werte wurden nicht in einen Einkaufsbeleg oder ein Journal eingetragen und beweisen noch keine Anlagenbuchung.

## Buchwirkung

Kapitel 21 sollte vor dem ersten Anlagenzugang eine Routenentscheidung zeigen: Entweder Anlagenzugang ueber Fixed Asset G/L Journal / Acquire action oder ein sauber belegter Einkaufsbelegpfad. Die bisherigen Purchase-Invoice-/Purchase-Order-Zeilentyp-Probes sind Laborblocker, keine finalen Belege fuer den richtigen deutschen Zielprozess.

## Grenzen

- Keine Zielwerte `K30000` oder `FA-CNC-01` eingegeben.
- Keine Preview, keine Buchung, keine Setup-Aenderung.
- Microsoft-Learn-Quellen zeigen fachliche Routen, ersetzen aber keinen RM-DEMO-UI-Nachweis.

## Naechster Schritt

Create FA-079 as an acquisition-route decision: choose the safest next route between Fixed Asset G/L Journal / Acquire action and purchase-document acquisition, with explicit preflight before any target values.
