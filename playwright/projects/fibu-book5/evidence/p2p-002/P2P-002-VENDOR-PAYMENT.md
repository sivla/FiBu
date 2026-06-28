# P2P-002 Kontrollierte Labor-Kreditorenzahlung

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, P2P vendor payment, UI-first, no-bank-reconciliation, not-final |
| Zahlungsbeleg | `PAYP2P-108219` |
| Ausgangsrechnung | `108219` / `K10000` |
| Gegenkonto | `BANK-RM-01` |
| Betrag | `25.000,00` |

## Entscheidungssatz

Diese Buchung ist als autonome RM-DEMO-Laborbuchung vertretbar, weil der offene Kreditorenposten 108219 fuer K10000 im UI sichtbar ist, die Payment-Journal-Zeile mit BANK-RM-01 und 25.000,00 auf genau diese Rechnung verweist, Journal Check 0 Issues zeigt, Apply Entries read-only geprueft wurde und die erwartete Postenspur Kreditorenposten, detaillierte Kreditorenposten, Bankposten und Sachposten umfasst; Risiko und Grenze bleiben CRONUS-USA-Labor ohne Bankabstimmung und ohne deutschen Finalnachweis.

## Preflight

| Pruefpunkt | Befund |
|---|---|
| Kreditorenposten vorher offen sichtbar | ja |
| Draft sichtbar | ja |
| K10000 sichtbar | ja |
| BANK-RM-01 sichtbar | ja |
| 108219 als Applies-to Doc. No. sichtbar | ja |
| Amount 25.000,00 sichtbar | ja |
| Applied Checkbox | `on` |
| Journal Check 0 Issues | ja |
| Apply Entries geoeffnet | ja |

## Buchung

| Pruefpunkt | Befund |
|---|---|
| Post-Dialog sichtbar | ja |
| Genau einmal bestaetigt | ja |
| Erfolgstext sichtbar | ja |

## Postenspur

| Postenart | sichtbar | Hinweis |
|---|---:|---|
| vendor-ledger-invoice-after-payment | ja | 060-vendor-ledger-invoice-after-payment-page-text.txt |
| vendor-ledger-payment | ja | 061-vendor-ledger-payment-page-text.txt |
| detailed-vendor-ledger-payment | ja | 062-detailed-vendor-ledger-payment-page-text.txt |
| bank-account-ledger-payment | ja | 063-bank-account-ledger-payment-page-text.txt |
| gl-entries-payment | ja | 064-gl-entries-payment-page-text.txt |

## Anfaenger-Lernwert

Eine Kreditorenzahlung schliesst den Einkaufskreis nicht durch eine neue Einkaufsrechnung, sondern durch einen Zahlungsbezug auf den offenen Kreditorenposten. Im Payment Journal muessen deshalb Kreditor, Betrag, Bankgegenkonto und `Applies-to Doc. No.` zusammenpassen.

Nach der Buchung muss der Leser nicht nur die gebuchte Zahlung sehen, sondern auch pruefen, ob die urspruengliche Einkaufsrechnung als offener Posten erledigt ist, welche detaillierten Kreditorenposten entstanden sind und welche Sachkonten getroffen wurden.

## Grenzen

- Die Ausgangsrechnung `108219` ist nach dem Lauf in der gefilterten Kreditorenpostenansicht weiterhin nicht eindeutig als `Remaining Amount = 0,00` oder `Applied Entries = 1` nachgewiesen. Belegt ist deshalb die gebuchte Kreditorenzahlung mit Postenspur, nicht der vollstaendige OP-Ausgleich der Rechnung.
- CRONUS-USA-Labor, kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.
- Keine Bankabstimmung in diesem Lauf.
- Keine deutsche Vorsteuer- oder E-Rechnungs-Finalaussage.
- Deutsche Final-Screenshots muessen spaeter neu erzeugt werden.

## Naechster Schritt

P2P-003: Kapitel 12/19/20 und P2P-Draft mit P2P-002 synchronisieren; danach optional Bankabstimmung oder P2P-Abweichungsfall planen.
