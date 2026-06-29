# P2P-027 Purchase Invoice Route Decision

Status: `labor`, `local-review`, `route-decision`, `no-bc-run`, `no-preview`, `no-post`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `P2P-027-result.json` | JSON | Entscheidung gegen Purchase-Invoice-Route und fuer Purchase-Journal-Folgecase | keine neue BC-Ausfuehrung | labor-review |

## Entscheidung

Die Purchase-Invoice-Route wird fuer diesen RM-DEMO-Laborzweig vorerst verworfen.

Grund:
- `P2P-021` erzeugte/zeigte Draft `107229`, aber Cleanup blieb offen.
- `P2P-022` konnte `107229` nicht sauber loeschen.
- `P2P-023` klassifizierte `107229` als behaltene Labor-Evidence, nicht als Arbeitsbeleg.
- `P2P-024` blockierte Werteingabe, weil `107229` nach `Neu` sichtbar blieb.
- `P2P-026` bewies sogar read-only, dass Page `9308` wieder mit Bookmark-/Listenstatus und sichtbarer `107229` oeffnet.

## Naechste Route

`P2P-028-PURCHASE-JOURNAL-NEGATIVE-AMOUNT-BALANCE-GATE`

Warum:
- Purchase Journal hat keinen unsichtbaren Bookmark-Blocker.
- `P2P-019` liefert konkrete Journal-Check-Regeln:
  - Vendor-Zeilenbetrag muss negativ sein.
  - Beleg muss ausgeglichen sein.
  - Gen. Posting Type / Gen. Bus. Posting Group / Gen. Prod. Posting Group muessen auf der Vendor-Zeile leer bleiben.

## Grenze

- Keine BC-Ausfuehrung in P2P-027.
- Kein Preview Posting.
- Keine Buchung.
- Kein Setup Change.
- Kein deutscher Finalnachweis.

## Buchwirkung

Fuer Anfaenger ist das ein wichtiger Lernpunkt: Wenn Business Central einen alten Listen-/Bookmark-Kontext wiederherstellt, ist `Neu` kein sicherer Beweis fuer einen neuen Beleg. Dann muss man entweder den Kontext technisch sauber resetten oder auf eine stabilere Standard-UI-Route wechseln.
