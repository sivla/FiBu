# FIXEDASSETS-279 FA Depreciation Card Field-value Read-only Probe

Status: `labor`, `read-only`, `ui-first`, `fixed-assets`, `no-posting`, `not-final`, `de-final-open`.

## Ziel

FA-279 prueft auf der Anlagenkarte von FA-CNC-01, ob die fuer die Abschreibung relevanten Kartenfelder sichtbar Werte liefern oder ob sie leer bzw. nicht ueber den Karten-Mapping-Ansatz lesbar sind. Der Lauf ist ein Diagnosebeweis vor jeder weiteren Abschreibungsaktion.

## Kontext

| Punkt | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| AfA-Buch | HGB |
| Ergebnisstatus | observed |

## Feldwerte

| Feld | Sichtbarer/lesbarer Wert | Diagnose |
|---|---|---|
| No. | FA-CNC-01 | visible-card-row-display-value |
| Description | CNC Maschine FRA | visible-card-row-display-value |
| Depreciation Book Code | HGB | visible-card-row-display-value |
| Posting Group | MACHINES | visible-card-row-control |
| Depreciation Method | Straight-Line | visible-card-row-control |
| Depreciation Starting Date | 01.01.2026 | visible-card-row-control |
| No. of Depreciation Years | 8,00 | visible-card-row-control |
| Depreciation Ending Date | 31.12.2033 | visible-card-row-control |
| Book Value | 120.000,00 | visible-card-row-display-value |
| Acquisition Cost | 120.000,00 | visible-card-row-display-value |
| Acquired | (leer/nicht sichtbar) | caption-visible-empty-or-no-value-control |

## Safety

- noWrite: ja
- noPost: ja
- noPreview: ja
- noDraft: ja
- noSetupChange: ja
- noCompanySwitch: ja
- noApiShortcut: ja
- noBookChange: ja
- noOkConfirmed: ja

## Ergebnis

- Nachgewiesen: Business Central instance MCP_1_20260210 opened read-only.
- Nachgewiesen: Company RM-DEMO stayed selected via URL context.
- Nachgewiesen: Fixed Asset Card for FA-CNC-01 was opened read-only.
- Nachgewiesen: Depreciation Book Code is readable as HGB.
- Nachgewiesen: Posting Group is readable as MACHINES.
- Nachgewiesen: Depreciation Method is readable as Straight-Line.
- Nachgewiesen: Depreciation Starting Date is readable as 01.01.2026.
- Nachgewiesen: No. of Depreciation Years is readable as 8,00.
- Nachgewiesen: Depreciation Ending Date is readable as 31.12.2033.
- Nachgewiesen: Book Value is readable on the card as 120.000,00.
- Nachgewiesen: Acquisition Cost is readable on the card as 120.000,00.
- Nicht nachgewiesen: Company RM-DEMO was not independently visible in page body text; company proof is URL-context only.
- Nicht nachgewiesen: Acquired flag has no readable non-empty value on the card via this mapper.
- Nicht nachgewiesen: No depreciation posting readiness is proven by this read-only card probe.
- Nicht nachgewiesen: No German final proof exists.

## Buchwirkung

Die Buchanleitung darf die vorhandenen Anschaffungswerte, das AfA-Buch HGB sowie Startdatum, Nutzungsdauer und Enddatum als sichtbaren Laborbefund verwenden. Fuer Abschreibungsbuchungen ist damit aber nur die Kartenbasis belegt; Journal-/Batch-, Preview- und Posten-Evidence bleiben getrennte Nachweisschritte.

## Naechster Schritt

Naechster lokaler Review: FIXEDASSETS-280-FA-DEPRECIATION-FIELDVALUE-RESULT-REVIEW.
