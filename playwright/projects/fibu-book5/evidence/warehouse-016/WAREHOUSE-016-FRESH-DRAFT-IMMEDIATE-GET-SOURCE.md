# WAREHOUSE-016 Fresh Draft Immediate Get Source

Status: `labor`, `ui-first`, `fresh-draft`, `no-posting`, `not-final`.

Fresh Draft New geklickt: ja
Receipt No.: RE000001
Draft-Kontext sichtbar: ja
Get Source Kandidaten sichtbar: 3
Get Source geklickt: ja
Source-Auswahlkontext sichtbar: ja
OK/Select sichtbar und nicht geklickt: ja

## Hinweis zur Belegnummer

Der Lauf erzeugte/oeffnete den frischen Draft-Kontext und danach waren `RE000001` und `RE000002` sichtbar. Die automatisch extrahierte `receiptNo` ist deshalb Labor-Evidence fuer sichtbaren Warehouse-Receipt-Kontext, aber noch kein final sauberer Belegnummernanker fuer Posting/Trace. WAREHOUSE-017 muss vor jeder Auswahl/weiteren Aktion den Ziel-Receipt explizit im Dialog-/Kartenkontext festhalten.

## Blocker / Ergebnis

- Get Source Documents wurde ohne Source-Bestaetigung erreicht.

## Grenze

- Kein Source Document bestaetigt.
- Kein Warehouse Receipt Posting.
- Kein Put-away.
- Keine Postenspur.
- Kein deutscher Finalnachweis.

## Naechster Schritt

WAREHOUSE-017: inspect/select a concrete source document candidate but stop before posting.
