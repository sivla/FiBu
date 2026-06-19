# FIXEDASSETS-109 Write-Readiness Decision

Status: `labor`, `local-decision`, `no-bc-run`, `no-playwright-run`, `no-write`

## Entscheidung

`FIXEDASSETS-108` reicht noch nicht fuer einen Write-Case.

Der Lauf beweist zwar, dass `Amount`- und `Bal. Account No.`-Signale im `Fixed Asset G/L Journals`-Kontext erreichbar sind. Er beweist aber nicht, dass Playwright die richtigen editierbaren Controls fuer diese beiden Zielwerte sicher adressieren kann.

## Belegte Ausgangslage

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Page: `Fixed Asset G/L Journals` / Page `5628`
- Zielzeilen-Shell sichtbar: `G05001`, `Fixed Asset`, `FA-CNC-01`, `HGB`
- `Amount`-Signal erreichbar: ja
- `Bal. Account No.`-Signal erreichbar: ja
- `68000` als Zeilenwert sichtbar: nein
- `K30000` als Zeilenwert sichtbar: nein
- FA-108 hat nichts eingegeben, nichts geloescht, keine Preview und kein `Post` ausgefuehrt.

## Warum kein Write-Case

Ein Write-Case darf nicht nur auf sichtbaren Captions beruhen. Fuer `Amount` und `Bal. Account No.` muss der naechste Lauf erst read-only nachweisen:

- welches konkrete sichtbare/editierbare Control zum Feld gehoert,
- ob das Control in der aktuellen Grid-Position erreichbar ist,
- ob horizontaler Scroll nur lesend genug Kontext liefert,
- ob der Zielwert ohne falsche Zeile, falsches Feld oder globalen Menuekontext angesetzt werden koennte.

## Naechster Schritt

`FIXEDASSETS-110-FA-GL-JOURNAL-AMOUNT-BALACCOUNT-CONTROL-ROUTE-READONLY`

Nur read-only:

- dieselbe FA-G/L-Journal-Zeile oeffnen,
- keine Werte eingeben,
- keine Preview,
- kein `Post`,
- keine neue Zeile,
- keine Loeschung,
- nur die Feldroute fuer `Amount` und `Bal. Account No.` kartieren.

Erst wenn FA-110 konkrete Control-Routen belegt, darf ein spaeterer eigener Gate-Case ueber einen eng begrenzten Write-Probe entscheiden.
